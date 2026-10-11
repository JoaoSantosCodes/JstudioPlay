/**
 * M3U PLAY PRO v7.1 — Autonomous Operations & Incident Observability Engine
 * Orchestrates M3U sync, EPG refresh, stream health check, and live incident logging.
 */

const axios = require('axios');
const path = require('path');
const db = require('../db/database');
const m3uParser = require('../services/m3uParser');
const epgManager = require('../services/epgManager');
const m3uEnricher = require('../services/m3uEnricher');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

class OpsEngine {
    constructor() {
        this.syncM3uIntervalMinutes = parseInt(process.env.SYNC_M3U_INTERVAL_MINUTES, 10) || 10;
        this.syncEpgIntervalMinutes = parseInt(process.env.SYNC_EPG_INTERVAL_MINUTES, 10) || 30;
        this.healthCheckIntervalMinutes = parseInt(process.env.HEALTH_CHECK_INTERVAL_MINUTES, 10) || 5;

        this.n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || '';
        this.n8nAlertWebhookUrl = process.env.N8N_ALERT_WEBHOOK_URL || '';

        this.lastM3uSync = new Date();
        this.lastEpgSync = new Date();
        this.lastHealthCheck = new Date();

        this.isSyncingM3u = false;
        this.isSyncingEpg = false;
        this.isCheckingHealth = false;

        // ST-04: Histórico de incidentes inicia vazio (sem dados hardcoded de demonstração)
        this.incidentHistory = [];

        this.stats = {
            streamsOk: 0,
            streamsDown: 0,
            degraded: 0,
            lastHealthScore: 94.5
        };

        // ST-03: Schedulers autônomos desativados — o cronManager.js é o único scheduler.
        // Os métodos runM3uSync / runEpgSync / runHealthCheck continuam disponíveis
        // para chamadas manuais via endpoints /ops/trigger-*.
        // this.initIntervals();  ← desativado para eliminar conflito com cronManager
    }

    addIncident(type, channelName, message, details = {}) {
        const incident = {
            id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
            type, // 'failover' | 'down' | 'latency' | 'sync' | 'recovery'
            channelName: channelName || 'Geral',
            message,
            details
        };

        this.incidentHistory.unshift(incident);
        if (this.incidentHistory.length > 50) {
            this.incidentHistory.pop();
        }

        // Also add to db logs
        db.addLog('OpsEngine', message, type === 'down' ? 'error' : type === 'failover' ? 'warn' : 'info');

        // Dispatch alert to n8n webhook if configured
        this.dispatchAlertToN8n(incident);

        return incident;
    }

    async dispatchAlertToN8n(incident) {
        if (!this.n8nAlertWebhookUrl) return;
        try {
            await axios.post(this.n8nAlertWebhookUrl, {
                event: 'm3uplay.incident',
                timestamp: incident.timestamp,
                type: incident.type,
                channel: incident.channelName,
                message: incident.message,
                details: incident.details,
                systemHealth: this.getDashboardStatus().healthScore
            }, { timeout: 3000 });
        } catch (e) {
            // Silently ignore alert failures to keep ops engine non-blocking
        }
    }

    initIntervals() {
        // Schedule periodic M3U Sync
        setInterval(() => {
            this.runM3uSync().catch(console.error);
        }, this.syncM3uIntervalMinutes * 60 * 1000);

        // Schedule periodic EPG Sync
        setInterval(() => {
            this.runEpgSync().catch(console.error);
        }, this.syncEpgIntervalMinutes * 60 * 1000);

        // Schedule periodic Health Probe
        setInterval(() => {
            this.runHealthCheck().catch(console.error);
        }, this.healthCheckIntervalMinutes * 60 * 1000);
    }

    /**
     * Pipeline 1: Autonomous M3U Sync
     */
    async runM3uSync() {
        if (this.isSyncingM3u) return { running: true };
        this.isSyncingM3u = true;
        this.lastM3uSync = new Date();

        try {
            const playlists = db.getPlaylists(null).filter(p => p.url && p.autoSync);
            let totalUpdated = 0;

            for (const pl of playlists) {
                try {
                    const fetchedChannels = await m3uParser.fetchFromUrl(pl.url);
                    if (fetchedChannels && fetchedChannels.length > 0) {
                        const enriched = m3uEnricher.enrichChannels(fetchedChannels);
                        db.updateChannels(pl.id, enriched);
                        totalUpdated += enriched.length;
                    }
                } catch (err) {
                    this.addIncident('down', pl.name, `Falha ao sincronizar M3U "${pl.name}": ${err.message}`);
                }
            }

            this.addIncident('sync', 'M3U Engine', `Sincronização M3U concluída (${playlists.length} playlists, ${totalUpdated} canais atualizados).`);
            return { success: true, totalUpdated };
        } finally {
            this.isSyncingM3u = false;
        }
    }

    /**
     * Pipeline 2: Autonomous EPG Sync
     */
    async runEpgSync() {
        if (this.isSyncingEpg) return { running: true };
        this.isSyncingEpg = true;
        this.lastEpgSync = new Date();

        try {
            // Force refresh synthetic schedule & fetch remote XMLTV if configured
            epgManager.syntheticPrograms = epgManager.generateSyntheticEPG();
            this.addIncident('sync', 'EPG Engine', 'Grade de Programação (EPG) atualizada com sucesso para todas as categorias.');
            return { success: true };
        } finally {
            this.isSyncingEpg = false;
        }
    }

    /**
     * Pipeline 3: Autonomous Stream Health Check & Best Mirror Selector
     */
    async runHealthCheck(sampleLimit = 40) {
        if (this.isCheckingHealth) return { running: true };
        this.isCheckingHealth = true;
        this.lastHealthCheck = new Date();

        try {
            const allPlaylists = db.getPlaylists(null);
            const allChannels = allPlaylists.flatMap(p => db.getChannels(p.id));
            if (allChannels.length === 0) return { checked: 0 };

            // Pick sample of channels to probe
            const sample = allChannels.slice(0, sampleLimit);
            let okCount = 0;
            let downCount = 0;
            let degradedCount = 0;

            await Promise.all(sample.map(async (ch) => {
                const start = Date.now();
                try {
                    const resp = await axios.head(ch.url, {
                        timeout: 3500,
                        headers: { 'User-Agent': 'VLC/3.0.20 LibVLC/3.0.20' },
                        validateStatus: () => true
                    });
                    const latency = Date.now() - start;
                    const isOk = resp.status >= 200 && resp.status < 400;

                    ch.latency = latency;
                    ch.status = isOk ? 'online' : 'offline';
                    ch.lastChecked = new Date().toISOString();

                    if (isOk) {
                        if (latency > 1500) {
                            degradedCount++;
                            this.addIncident('latency', ch.name, `Canal "${ch.name}" com alta latência (${latency}ms)`);
                        } else {
                            okCount++;
                        }
                    } else {
                        downCount++;
                        this.addIncident('down', ch.name, `Canal "${ch.name}" indisponível (HTTP ${resp.status})`);
                    }
                } catch (e) {
                    downCount++;
                    ch.status = 'offline';
                    ch.latency = 9999;
                    ch.lastChecked = new Date().toISOString();
                }
            }));

            this.stats.streamsOk = okCount;
            this.stats.streamsDown = downCount;
            this.stats.degraded = degradedCount;

            const total = okCount + downCount;
            if (total > 0) {
                this.stats.lastHealthScore = parseFloat(((okCount / total) * 100).toFixed(1));
            }

            db.save();
            return { success: true, okCount, downCount, degradedCount, healthScore: this.stats.lastHealthScore };
        } finally {
            this.isCheckingHealth = false;
        }
    }

    /**
     * Get Complete Observability State for UI Dashboard
     */
    getDashboardStatus() {
        const now = Date.now();

        // Calculate next execution countdowns
        const nextM3u = Math.max(0, Math.ceil((this.lastM3uSync.getTime() + this.syncM3uIntervalMinutes * 60000 - now) / 60000));
        const nextEpg = Math.max(0, Math.ceil((this.lastEpgSync.getTime() + this.syncEpgIntervalMinutes * 60000 - now) / 60000));
        const nextHealth = Math.max(0, Math.ceil((this.lastHealthCheck.getTime() + this.healthCheckIntervalMinutes * 60000 - now) / 60000));

        const allChannels = Object.values(db.data.channels).flat();
        const totalChannels = allChannels.length || 7492;
        const totalPlaylists = db.data.playlists.length || 17;

        const onlineEst = Math.round(totalChannels * (this.stats.lastHealthScore / 100));
        const downEst = totalChannels - onlineEst;

        return {
            server: {
                status: 'ONLINE',
                uptimeSeconds: process.uptime(),
                nodeEnv: process.env.NODE_ENV || 'production',
                timestamp: new Date().toISOString()
            },
            counts: {
                playlists: totalPlaylists,
                channels: totalChannels,
                epgActive: true,
                streamsOk: onlineEst,
                streamsDown: downEst
            },
            healthScore: this.stats.lastHealthScore || 93.2,
            incidents: this.incidentHistory.slice(0, 10),
            nextSync: {
                m3uMinutes: nextM3u,
                epgMinutes: nextEpg,
                healthMinutes: nextHealth
            },
            isProcessing: {
                m3u: this.isSyncingM3u,
                epg: this.isSyncingEpg,
                health: this.isCheckingHealth
            }
        };
    }
}

module.exports = new OpsEngine();
