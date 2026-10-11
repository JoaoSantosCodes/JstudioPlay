const cron = require('node-cron');
const db = require('../db/database');
const m3uParser = require('../services/m3uParser');
const streamChecker = require('../services/streamChecker');
const m3uScraper = require('../services/m3uScraper');

class CronManager {
    constructor() {
        this.tasks = [];
        this.isSyncing = false;
    }

    init() {
        // Sync de playlists do usuário — a cada 6 horas
        const syncTask = cron.schedule('0 */6 * * *', async () => {
            console.log('[Cron] Executando sincronização automática de playlists...');
            await this.syncAllPlaylists();
        });

        // Raspagem diária de fontes públicas M3U — todo dia às 03:00
        const scrapeTask = cron.schedule('0 3 * * *', async () => {
            console.log('[Cron] Iniciando raspagem diária de listas M3U públicas...');
            try {
                const report = await m3uScraper.run({ validateSample: true });
                console.log(
                    `[Cron] Raspagem concluída: ${report.imported} fontes, ` +
                    `${report.channelsTotal} canais, ${report.errors} erros.`
                );
            } catch (err) {
                console.error('[Cron] Erro na raspagem diária:', err.message);
                db.addLog('scraper', `Erro crítico na raspagem diária: ${err.message}`);
            }
        });

        this.tasks.push(syncTask, scrapeTask);
        console.log('[Cron] Agendador ativado: sync a cada 6h · raspagem M3U diária às 03:00.');
    }

    async syncAllPlaylists() {
        if (this.isSyncing) return;
        this.isSyncing = true;

        try {
            const playlists = db.getPlaylists(null).filter(p => p.url && p.autoSync !== false);
            console.log(`[Cron] Sincronizando ${playlists.length} playlists remotas...`);

            for (const p of playlists) {
                try {
                    console.log(`[Cron] Atualizando playlist: ${p.name} (${p.url})`);
                    const channels = await m3uParser.fetchFromUrl(p.url);
                    if (channels && channels.length > 0) {
                        db.saveChannels(p.id, channels);
                        db.addLog('automation', `Auto-sync: Playlist "${p.name}" sincronizada com ${channels.length} canais.`);
                    }
                } catch (err) {
                    console.error(`[Cron] Erro ao sincronizar playlist ${p.name}:`, err.message);
                    db.addLog('automation', `Erro ao sincronizar "${p.name}": ${err.message}`);
                }
            }
        } finally {
            this.isSyncing = false;
        }
    }

    async refreshSinglePlaylist(playlistId) {
        const p = db.getPlaylistById(playlistId);
        if (!p) throw new Error('Playlist não encontrada.');
        if (!p.url) throw new Error('Esta playlist não possui uma URL remota vinculada.');

        const channels = await m3uParser.fetchFromUrl(p.url);
        db.saveChannels(p.id, channels);
        db.addLog('playlist', `Playlist "${p.name}" atualizada manualmente via URL (${channels.length} canais).`);
        return p;
    }
}

module.exports = new CronManager();
