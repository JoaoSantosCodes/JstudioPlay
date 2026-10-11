const axios = require('axios');
const EventEmitter = require('events');
const db = require('../db/database');

class StreamChecker extends EventEmitter {
    constructor() {
        super();
        this.activeJobs = new Map(); // playlistId -> { isRunning, total, checked, online, offline, startTime }
    }

    /**
     * Check a single channel stream URL
     */
    async checkChannel(channel, timeout = 4000) {
        if (!channel || !channel.url) {
            return { online: false, latency: null, error: 'URL inexistente' };
        }

        const start = Date.now();
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Range': 'bytes=0-2048',
            'Accept': '*/*'
        };

        try {
            const response = await axios.get(channel.url, {
                headers,
                timeout,
                validateStatus: (status) => status >= 200 && status < 400,
                maxRedirects: 5,
                responseType: 'arraybuffer'
            });

            const latency = Date.now() - start;
            return {
                online: true,
                latency,
                status: response.status,
                contentType: response.headers['content-type'] || 'unknown'
            };
        } catch (err) {
            try {
                const headStart = Date.now();
                const headResp = await axios.head(channel.url, {
                    headers: { 'User-Agent': headers['User-Agent'] },
                    timeout: Math.min(timeout, 3000),
                    validateStatus: (status) => status >= 200 && status < 400
                });
                return {
                    online: true,
                    latency: Date.now() - headStart,
                    status: headResp.status,
                    contentType: headResp.headers['content-type'] || 'unknown'
                };
            } catch (headErr) {
                return {
                    online: false,
                    latency: null,
                    error: err.message || 'Timeout / Inacessível'
                };
            }
        }
    }

    /**
     * Start background validation for an entire playlist
     */
    async checkPlaylist(playlistId, options = {}) {
        if (this.activeJobs.has(playlistId)) {
            return this.activeJobs.get(playlistId);
        }

        const playlist = db.getPlaylistById(playlistId);
        if (!playlist) throw new Error('Playlist não encontrada.');

        const channels = db.getChannels(playlistId);
        if (!channels || channels.length === 0) {
            return { isRunning: false, total: 0, checked: 0, online: 0, offline: 0 };
        }

        const concurrency = options.concurrency || db.getSettings().streamCheckConcurrency || 15;
        const timeout = options.timeout || db.getSettings().streamCheckTimeout || 4000;

        const jobState = {
            playlistId,
            isRunning: true,
            total: channels.length,
            checked: 0,
            online: 0,
            offline: 0,
            startTime: Date.now()
        };

        this.activeJobs.set(playlistId, jobState);
        db.updatePlaylist(playlistId, { checkStatus: 'running' });

        // Run worker pool in background
        (async () => {
            let index = 0;
            const workers = [];

            const worker = async () => {
                while (index < channels.length && jobState.isRunning) {
                    const currentIndex = index++;
                    const channel = channels[currentIndex];

                    const result = await this.checkChannel(channel, timeout);
                    channel.status = result.online ? 'online' : 'offline';
                    channel.latency = result.latency;
                    channel.lastChecked = new Date().toISOString();

                    jobState.checked++;
                    if (result.online) {
                        jobState.online++;
                    } else {
                        jobState.offline++;
                    }

                    if (jobState.checked % 5 === 0 || jobState.checked === jobState.total) {
                        this.emit('progress', {
                            playlistId,
                            ...jobState,
                            percentage: Math.round((jobState.checked / jobState.total) * 100)
                        });
                    }
                }
            };

            for (let i = 0; i < Math.min(concurrency, channels.length); i++) {
                workers.push(worker());
            }

            await Promise.all(workers);

            jobState.isRunning = false;
            this.activeJobs.delete(playlistId);

            db.saveChannels(playlistId, channels);
            db.updatePlaylist(playlistId, {
                checkStatus: 'completed',
                lastChecked: new Date().toISOString(),
                onlineCount: jobState.online
            });

            const elapsedSec = ((Date.now() - jobState.startTime) / 1000).toFixed(1);
            db.addLog('automation', `Validação finalizada para "${playlist.name}": ${jobState.online}/${jobState.total} online em ${elapsedSec}s`);

            // Outgoing Webhook Trigger to n8n
            const webhookUrl = options.webhookUrl || db.data.settings.n8nWebhookUrl;
            if (webhookUrl) {
                this.sendN8nWebhook(webhookUrl, {
                    event: 'stream_validation_completed',
                    playlist: {
                        id: playlist.id,
                        name: playlist.name,
                        url: playlist.url,
                        total: jobState.total,
                        online: jobState.online,
                        offline: jobState.offline,
                        uptimeRate: ((jobState.online / (jobState.total || 1)) * 100).toFixed(1) + '%'
                    },
                    exportUrl: `/api/playlists/${playlist.id}/export?filter=online`,
                    durationSeconds: elapsedSec,
                    timestamp: new Date().toISOString()
                });
            }

            this.emit('completed', { playlistId, ...jobState });
        })().catch(err => {
            console.error('Error during playlist check:', err);
            jobState.isRunning = false;
            this.activeJobs.delete(playlistId);
            db.updatePlaylist(playlistId, { checkStatus: 'error' });
        });

        return jobState;
    }

    async sendN8nWebhook(webhookUrl, payload) {
        try {
            console.log(`[n8n Webhook] Enviando evento para: ${webhookUrl}`);
            await axios.post(webhookUrl, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            console.log('[n8n Webhook] Notificação enviada com sucesso ao n8n.');
        } catch (e) {
            console.error('[n8n Webhook] Erro ao enviar webhook:', e.message);
        }
    }

    stopCheck(playlistId) {
        if (this.activeJobs.has(playlistId)) {
            const job = this.activeJobs.get(playlistId);
            job.isRunning = false;
            this.activeJobs.delete(playlistId);
            db.updatePlaylist(playlistId, { checkStatus: 'stopped' });
            return true;
        }
        return false;
    }

    getStatus(playlistId) {
        if (this.activeJobs.has(playlistId)) {
            const job = this.activeJobs.get(playlistId);
            return {
                ...job,
                percentage: Math.round((job.checked / job.total) * 100)
            };
        }
        const pl = db.getPlaylistById(playlistId);
        return {
            playlistId,
            isRunning: false,
            checkStatus: pl ? pl.checkStatus : 'idle',
            onlineCount: pl ? pl.onlineCount : 0,
            lastChecked: pl ? pl.lastChecked : null
        };
    }
}

module.exports = new StreamChecker();
