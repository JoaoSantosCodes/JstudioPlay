const cron = require('node-cron');
const db = require('./database');
const m3uParser = require('./m3uParser');
const streamChecker = require('./streamChecker');

class CronManager {
    constructor() {
        this.tasks = [];
        this.isSyncing = false;
    }

    init() {
        // Run auto-sync every 6 hours by default (0 */6 * * *)
        const syncTask = cron.schedule('0 */6 * * *', async () => {
            console.log('[Cron] Executando sincronização automática de playlists...');
            await this.syncAllPlaylists();
        });

        this.tasks.push(syncTask);
        console.log('[Cron] Agendador de automação ativado (Intervalo: cada 6h).');
    }

    async syncAllPlaylists() {
        if (this.isSyncing) return;
        this.isSyncing = true;

        try {
            const playlists = db.data.playlists.filter(p => p.url && p.autoSync !== false);
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
