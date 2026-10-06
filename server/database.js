const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'db.json');

const defaultDb = {
    settings: {
        appName: 'JstudioPlay Pro',
        apiKey: 'm3u_secret_key_889922aabbcc',
        n8nWebhookUrl: '',
        relayEnabled: true,
        relayMode: false,
        setupRequired: false,
        setupAllowed: true,
        maxPlaylistsPerAccount: 20,
        streamCheckTimeout: 3500,
        streamCheckConcurrency: 15,
        autoSyncEnabled: true,
        autoSyncIntervalHours: 6
    },
    users: [
        {
            id: 'usr_admin',
            name: 'Administrador',
            username: 'admin',
            passwordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
            role: 'admin',
            theme: 'dark',
            blocked: false,
            expiresAt: null,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
        }
    ],
    playlists: [],
    channels: {},
    favorites: {},
    history: {},
    progress: {},
    logs: [
        {
            id: 'log_1',
            type: 'system',
            user: 'Sistema',
            action: 'Sistema JstudioPlay Pro inicializado com ferramentas avançadas de streaming e otimização.',
            at: new Date().toISOString()
        }
    ]
};

class Database {
    constructor() {
        this.data = defaultDb;
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(DB_FILE)) {
                const content = fs.readFileSync(DB_FILE, 'utf8');
                const parsed = JSON.parse(content);
                this.data = Object.assign({}, defaultDb, parsed);
                this.data.settings = Object.assign({}, defaultDb.settings, parsed.settings || {});
            } else {
                this.save();
            }
        } catch (e) {
            console.error('Error loading db.json, using defaults:', e);
            this.data = defaultDb;
        }
    }

    save() {
        try {
            fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
        } catch (e) {
            console.error('Error saving db.json:', e);
        }
    }

    getSettings() {
        return this.data.settings;
    }

    updateSettings(updates) {
        Object.assign(this.data.settings, updates);
        this.save();
        return this.data.settings;
    }

    addLog(type, message, userId = null) {
        const userObj = userId ? this.findUserById(userId) : null;
        const log = {
            id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            type,
            user: userObj ? userObj.username : (type === 'n8n' ? 'n8n Bot' : 'Sistema'),
            action: message,
            at: new Date().toISOString()
        };
        this.data.logs.unshift(log);
        if (this.data.logs.length > 500) {
            this.data.logs = this.data.logs.slice(0, 500);
        }
        this.save();
        return log;
    }

    findUserByUsername(username) {
        if (!username) return null;
        return this.data.users.find(u => u.username && u.username.toLowerCase() === username.toLowerCase());
    }

    findUserById(id) {
        if (!id) return null;
        return this.data.users.find(u => u.id === id);
    }

    findUserByGoogleId(googleId) {
        if (!googleId) return null;
        return this.data.users.find(u => u.googleId === googleId);
    }

    findUserByEmail(email) {
        if (!email) return null;
        const norm = email.toLowerCase().trim();
        return this.data.users.find(u => 
            (u.email && u.email.toLowerCase() === norm) || 
            (u.username && u.username.toLowerCase() === norm)
        );
    }

    createUser({ name, username, password, role = 'user', expiresAt = null, playlists = [], googleId = null, email = null, avatar = null }) {
        if (username && this.findUserByUsername(username)) {
            throw new Error('Nome de usuário já está em uso.');
        }
        const pwd = password || crypto.randomBytes(32).toString('hex');
        const user = {
            id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: name || username || 'Usuário Google',
            username: username || email || ('google_' + Date.now()),
            email: email || null,
            googleId: googleId || null,
            avatar: avatar || null,
            passwordHash: crypto.createHash('sha256').update(pwd).digest('hex'),
            role: role || 'user',
            theme: 'dark',
            blocked: false,
            expiresAt: expiresAt || null,
            assignedPlaylists: playlists || [],
            createdAt: new Date().toISOString(),
            lastLoginAt: null
        };
        this.data.users.push(user);
        this.addLog('user', `Novo usuário cadastrado: ${user.username} ${googleId ? '(via Google OAuth)' : ''} (Expira: ${expiresAt || 'Nunca'})`);
        this.save();
        return user;
    }

    updateUser(id, updates) {
        const user = this.findUserById(id);
        if (!user) throw new Error('Usuário não encontrado.');
        if (updates.name) user.name = updates.name;
        if (updates.theme) user.theme = updates.theme;
        if (updates.role) user.role = updates.role;
        if (updates.expiresAt !== undefined) user.expiresAt = updates.expiresAt;
        if (updates.assignedPlaylists) user.assignedPlaylists = updates.assignedPlaylists;
        if (typeof updates.blocked === 'boolean') user.blocked = updates.blocked;
        if (updates.password) {
            user.passwordHash = crypto.createHash('sha256').update(updates.password).digest('hex');
        }
        this.save();
        return user;
    }

    deleteUser(id) {
        const idx = this.data.users.findIndex(u => u.id === id);
        if (idx !== -1 && this.data.users[idx].role !== 'admin') {
            const username = this.data.users[idx].username;
            this.data.users.splice(idx, 1);
            this.addLog('user', `Usuário "${username}" removido.`);
            this.save();
            return true;
        }
        return false;
    }

    getPlaylists(userId) {
        const user = this.findUserById(userId);
        if (user && user.role === 'admin') {
            return this.data.playlists;
        }
        return this.data.playlists.filter(p => !p.userId || p.userId === userId || (user?.assignedPlaylists && user.assignedPlaylists.includes(p.id)));
    }

    getPlaylistById(id) {
        return this.data.playlists.find(p => p.id === id);
    }

    createPlaylist({ userId, name, url, channels, autoSync = true }) {
        const playlistId = 'pl_' + Date.now();
        const stats = {
            total: channels.length,
            live: channels.filter(c => c.streamType === 'live' || !c.streamType).length,
            vod: channels.filter(c => c.streamType === 'vod').length,
            series: channels.filter(c => c.streamType === 'series').length,
            online: channels.filter(c => c.status === 'online').length
        };

        const playlist = {
            id: playlistId,
            userId,
            name: name || 'Minha Playlist',
            url: url || '',
            total: stats.total,
            live: stats.live,
            vod: stats.vod,
            series: stats.series,
            onlineCount: stats.online,
            categories: [...new Set(channels.map(c => c.group || 'Geral'))].length,
            checkStatus: 'idle',
            lastChecked: null,
            autoSync: !!autoSync,
            updated: new Date().toISOString(),
            created: new Date().toISOString()
        };

        this.data.playlists.push(playlist);
        this.data.channels[playlistId] = channels;
        this.addLog('playlist', `Playlist "${playlist.name}" adicionada com ${playlist.total} canais`, userId);
        this.save();
        return playlist;
    }

    updatePlaylist(id, updates) {
        const p = this.getPlaylistById(id);
        if (!p) throw new Error('Playlist não encontrada.');
        Object.assign(p, updates);
        p.updated = new Date().toISOString();
        this.save();
        return p;
    }

    deletePlaylist(id, userId) {
        const idx = this.data.playlists.findIndex(p => p.id === id);
        if (idx !== -1) {
            const name = this.data.playlists[idx].name;
            this.data.playlists.splice(idx, 1);
            delete this.data.channels[id];
            this.addLog('playlist', `Playlist "${name}" removida`, userId);
            this.save();
            return true;
        }
        return false;
    }

    getChannels(playlistId) {
        return this.data.channels[playlistId] || [];
    }

    saveChannels(playlistId, channels) {
        this.data.channels[playlistId] = channels;
        const p = this.getPlaylistById(playlistId);
        if (p) {
            p.total = channels.length;
            p.live = channels.filter(c => c.streamType === 'live' || !c.streamType).length;
            p.vod = channels.filter(c => c.streamType === 'vod').length;
            p.series = channels.filter(c => c.streamType === 'series').length;
            p.onlineCount = channels.filter(c => c.status === 'online').length;
            p.categories = [...new Set(channels.map(c => c.group || 'Geral'))].length;
            p.updated = new Date().toISOString();
        }
        this.save();
    }

    // -------------------------------------------------------------------------
    // M3U OPTIMIZATION TOOLS: Sanitize, Deduplicate, Sort
    // -------------------------------------------------------------------------
    sanitizePlaylist(playlistId, onlyOnline = true) {
        const p = this.getPlaylistById(playlistId);
        if (!p) throw new Error('Playlist não encontrada.');

        let channels = this.getChannels(playlistId);
        const originalCount = channels.length;

        if (onlyOnline) {
            channels = channels.filter(c => c.status === 'online');
        } else {
            channels = channels.filter(c => c.status !== 'offline');
        }

        this.saveChannels(playlistId, channels);
        const removed = originalCount - channels.length;
        this.addLog('optimization', `Lista "${p.name}" otimizada: ${removed} canais offline removidos. ${channels.length} canais restantes.`);
        return { playlist: p, removed, remaining: channels.length };
    }

    deduplicatePlaylist(playlistId) {
        const p = this.getPlaylistById(playlistId);
        if (!p) throw new Error('Playlist não encontrada.');

        let channels = this.getChannels(playlistId);
        const originalCount = channels.length;

        const seenUrls = new Set();
        const deduplicated = [];

        for (const ch of channels) {
            const cleanUrl = (ch.url || '').trim().toLowerCase();
            if (!seenUrls.has(cleanUrl)) {
                seenUrls.add(cleanUrl);
                deduplicated.push(ch);
            }
        }

        this.saveChannels(playlistId, deduplicated);
        const removed = originalCount - deduplicated.length;
        this.addLog('optimization', `Lista "${p.name}" deduplicada: ${removed} canais repetidos removidos.`);
        return { playlist: p, removed, remaining: deduplicated.length };
    }

    sortPlaylist(playlistId, sortBy = 'name') {
        const p = this.getPlaylistById(playlistId);
        if (!p) throw new Error('Playlist não encontrada.');

        let channels = [...this.getChannels(playlistId)];

        if (sortBy === 'name') {
            channels.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
        } else if (sortBy === 'latency') {
            channels.sort((a, b) => (a.latency || 9999) - (b.latency || 9999));
        } else if (sortBy === 'category') {
            channels.sort((a, b) => (a.group || '').localeCompare(b.group || '', 'pt-BR'));
        }

        this.saveChannels(playlistId, channels);
        this.addLog('optimization', `Lista "${p.name}" reordenada por: ${sortBy}.`);
        return { playlist: p, total: channels.length, sortedBy: sortBy };
    }

    enrichPlaylist(playlistId) {
        const p = this.getPlaylistById(playlistId);
        if (!p) throw new Error('Playlist não encontrada.');

        const enricher = require('./m3uEnricher');
        let channels = this.getChannels(playlistId);
        let updatedCount = 0;

        channels = channels.map(ch => {
            const enriched = enricher.enrichChannel({ ...ch });
            if (enriched.logo !== ch.logo || enriched.group !== ch.group || enriched.name !== ch.name) {
                updatedCount++;
            }
            return enriched;
        });

        this.saveChannels(playlistId, channels);
        this.addLog('optimization', `Lista "${p.name}" enriquecida: ${updatedCount} canais tiveram logos e categorias aprimorados.`);
        return { playlist: p, updatedCount, total: channels.length };
    }

    // Favorites
    getFavorites(userId) {
        const favs = this.data.favorites[userId] || [];
        return favs.map(f => ({
            playlistId: f.playlistId,
            channel: f.channel || {
                id: f.id,
                name: f.name,
                group: f.group || 'Geral',
                logo: f.logo || '',
                url: f.url
            }
        }));
    }

    toggleFavorite(userId, rawChannel, playlistId) {
        if (!this.data.favorites[userId]) this.data.favorites[userId] = [];
        const favs = this.data.favorites[userId];
        const channel = rawChannel.channel || rawChannel;
        const chUrl = channel.url;

        const existingIdx = favs.findIndex(f => f.playlistId === playlistId && ((f.channel?.url || f.url) === chUrl));
        if (existingIdx !== -1) {
            favs.splice(existingIdx, 1);
        } else {
            favs.push({
                playlistId,
                channel: {
                    id: channel.id || 'ch_' + Math.random().toString(36).substring(2, 9),
                    name: channel.name,
                    group: channel.group || 'Geral',
                    logo: channel.logo || '',
                    url: channel.url
                },
                addedAt: new Date().toISOString()
            });
        }
        this.save();
        return this.getFavorites(userId);
    }

    // History
    getHistory(userId) {
        const hist = this.data.history[userId] || [];
        return hist.map(h => ({
            playlistId: h.playlistId,
            channel: h.channel || {
                id: h.id,
                name: h.name,
                group: h.group || 'Geral',
                logo: h.logo || '',
                url: h.url
            },
            at: h.at || h.timestamp || new Date().toISOString()
        }));
    }

    addHistory(userId, playlistId, rawChannel) {
        if (!this.data.history[userId]) this.data.history[userId] = [];
        let hist = this.data.history[userId];
        const channel = rawChannel.channel || rawChannel;
        const chUrl = channel.url;

        hist = hist.filter(h => !(h.playlistId === playlistId && ((h.channel?.url || h.url) === chUrl)));
        hist.unshift({
            playlistId,
            channel: {
                id: channel.id || 'ch_' + Math.random().toString(36).substring(2, 9),
                name: channel.name,
                group: channel.group || 'Geral',
                logo: channel.logo || '',
                url: channel.url
            },
            at: new Date().toISOString()
        });
        if (hist.length > 100) hist = hist.slice(0, 100);
        this.data.history[userId] = hist;
        this.save();
        return this.getHistory(userId);
    }

    clearHistory(userId) {
        this.data.history[userId] = [];
        this.save();
        return [];
    }

    // Progress
    getProgress(userId) {
        const progs = this.data.progress[userId] || [];
        return progs.map(p => {
            const ch = p.channel || {
                name: p.name || 'Vídeo',
                url: p.url || '',
                group: p.group || 'Geral',
                logo: p.logo || ''
            };
            const pos = Number(p.position || 0);
            const dur = Number(p.duration || 1);
            return {
                playlistId: p.playlistId,
                channel: ch,
                position: pos,
                duration: dur,
                percent: Math.min(100, Math.round((pos / dur) * 100)),
                updated: p.updated || p.updatedAt || new Date().toISOString()
            };
        });
    }

    saveProgress(userId, playlistId, rawChannel, position, duration) {
        if (!this.data.progress[userId]) this.data.progress[userId] = [];
        const progs = this.data.progress[userId];
        const channel = rawChannel.channel || rawChannel;
        const chUrl = channel.url;

        const pos = Number(position || 0);
        const dur = Number(duration || 1);
        const percent = Math.min(100, (pos / dur) * 100);

        const existing = progs.find(p => p.playlistId === playlistId && ((p.channel?.url || p.url) === chUrl));
        if (existing) {
            existing.position = pos;
            existing.duration = dur;
            existing.percent = percent;
            existing.updated = new Date().toISOString();
        } else {
            progs.unshift({
                playlistId,
                channel: {
                    name: channel.name,
                    url: channel.url,
                    group: channel.group || 'Geral',
                    logo: channel.logo || ''
                },
                position: pos,
                duration: dur,
                percent: percent,
                updated: new Date().toISOString()
            });
        }
        this.save();
        return this.getProgress(userId);
    }

    updateChannelLatency(playlistId, channelId, latency, status = 'online') {
        const channels = this.data.channels[playlistId];
        if (!channels) return false;
        const ch = channels.find(c => c.id === channelId);
        if (ch) {
            ch.latency = latency;
            ch.status = status;
            ch.lastChecked = new Date().toISOString();
            this.save();
            return true;
        }
        return false;
    }

    exportBackup() {
        return {
            version: '2.0.0',
            exportedAt: new Date().toISOString(),
            settings: this.data.settings,
            playlists: this.data.playlists,
            channels: this.data.channels,
            favorites: this.data.favorites,
            history: this.data.history,
            progress: this.data.progress,
            users: this.data.users.map(u => ({
                id: u.id,
                name: u.name,
                username: u.username,
                role: u.role,
                theme: u.theme,
                expiresAt: u.expiresAt,
                assignedPlaylists: u.assignedPlaylists
            }))
        };
    }

    importBackup(backupData) {
        if (!backupData || !backupData.playlists) {
            throw new Error('Formato de backup inválido.');
        }

        if (backupData.playlists) this.data.playlists = backupData.playlists;
        if (backupData.channels) this.data.channels = backupData.channels;
        if (backupData.favorites) this.data.favorites = backupData.favorites;
        if (backupData.history) this.data.history = backupData.history;
        if (backupData.progress) this.data.progress = backupData.progress;
        if (backupData.settings) Object.assign(this.data.settings, backupData.settings);

        this.addLog('system', 'Backup completo do sistema importado e restaurado com sucesso.');
        this.save();
        return { success: true, playlists: this.data.playlists.length };
    }
}

module.exports = new Database();
