const fs = require('fs');
const path = require('path');
const envFile = fs.existsSync(path.join(__dirname, '..', 'CREDENCIAIS', '.env'))
    ? path.join(__dirname, '..', 'CREDENCIAIS', '.env')
    : path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envFile });
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');

const db = require('./db/database');
const m3uParser = require('./services/m3uParser');
const streamChecker = require('./services/streamChecker');
const relay = require('./relay');
const cronManager = require('./infra/cronManager');
const xtreamServer = require('./xtreamServer');
const epgManager = require('./services/epgManager');
const m3uHub = require('./services/m3uHub');
const m3uEnricher = require('./services/m3uEnricher');
const security = require('./security');
const opsEngine = require('./infra/opsEngine');
const m3uScraper = require('./services/m3uScraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(security.rateLimiterMiddleware());
app.use(security.securityHeadersMiddleware());
app.use(express.json({ limit: '120mb' }));
app.use(express.urlencoded({ extended: true, limit: '120mb' }));

// Static frontend files
app.use('/static', express.static(path.join(__dirname, '..', 'public', 'static')));
app.use(express.static(path.join(__dirname, '..', 'public')));

function getSessionUser(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        const payload = security.verifySessionToken(token);
        if (payload) {
            const user = db.findUserById(payload.id);
            if (user && (!user.expiresAt || new Date(user.expiresAt) >= new Date())) {
                return user;
            }
        }
    }
    return null;
}

function requireAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    const settings = db.getSettings();

    // 1. API Key Check (para n8n / webhooks)
    if (apiKey && (apiKey === security.apiSecretKey || apiKey === settings.apiKey)) {
        req.isApiKey = true;
        req.user = db.findAdminUser();
        return next();
    }

    // 2. Bearer Session Token Check
    const user = getSessionUser(req);
    if (user) {
        if (user.blocked) {
            return res.status(403).json({ error: 'Esta conta está temporariamente bloqueada.' });
        }
        if (user.expiresAt && new Date(user.expiresAt) < new Date()) {
            return res.status(403).json({ error: 'Seu acesso expirou. Entre em contato com o suporte.' });
        }
        req.user = user;
        return next();
    }

    return res.status(401).json({ error: 'Não autorizado. Faça login para continuar.' });
}

const apiRouter = express.Router();

// -----------------------------------------------------------------------------
// 1. Session & Auth Endpoints
// -----------------------------------------------------------------------------
apiRouter.get('/session', (req, res) => {
    const user = getSessionUser(req);
    const userId = user ? user.id : null;

    res.json({
        token: user ? security.createSessionToken(user) : null,
        user: user ? {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email || null,
            avatar: user.avatar || null,
            role: user.role,
            theme: user.theme || 'dark',
            blocked: !!user.blocked,
            expiresAt: user.expiresAt,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt
        } : null,
        setupRequired: db.countUsers() === 0,
        setupAllowed: true,
        relayEnabled: db.getSettings().relayEnabled,
        relayMode: db.getSettings().relayMode,
        settings: {
            apiKey: db.getSettings().apiKey,
            n8nWebhookUrl: db.getSettings().n8nWebhookUrl,
            autoSyncIntervalHours: db.getSettings().autoSyncIntervalHours
        },
        playlists: user ? db.getPlaylists(userId) : [],
        favorites: user ? db.getFavorites(userId) : [],
        history: user ? db.getHistory(userId) : [],
        progress: user ? db.getProgress(userId) : []
    });
});

apiRouter.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Informe usuário e senha.' });
    }

    const user = db.findUserByUsername(username);
    if (!user) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    // Lazy migration SHA-256 → bcrypt: verifica com o algoritmo correto e faz upgrade silencioso
    const { valid, needsUpgrade } = security.verifyPassword(password, user.passwordHash, user.passwordHashAlgo);
    if (!valid) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    if (user.blocked) {
        return res.status(403).json({ error: 'Esta conta está temporariamente bloqueada.' });
    }

    if (user.expiresAt && new Date(user.expiresAt) < new Date()) {
        return res.status(403).json({ error: `Acesso expirado em ${new Date(user.expiresAt).toLocaleDateString('pt-BR')}.` });
    }

    // Faz upgrade do hash para bcrypt se ainda estava em SHA-256
    if (needsUpgrade) {
        db.updateUser(user.id, { password });
    }

    user.lastLoginAt = new Date().toISOString();
    db.save();

    db.addLog('auth', `Login realizado: ${user.username} (${user.role})`, user.id);
    const token = security.createSessionToken(user);

    res.json({
        token,
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email || null,
        avatar: user.avatar || null,
        role: user.role,
        theme: user.theme || 'dark',
        blocked: false
    });
});

apiRouter.get('/auth/google/config', (req, res) => {
    res.json({
        enabled: !!process.env.GOOGLE_CLIENT_ID,
        clientId: process.env.GOOGLE_CLIENT_ID || ''
    });
});

apiRouter.post('/auth/google', async (req, res) => {
    const { credential, demo } = req.body;

    // Suporte a modo Demonstração / Teste local enquanto o usuário configura o Client ID no Google Cloud
    if (demo && !process.env.GOOGLE_CLIENT_ID) {
        let user = db.findUserByEmail('demo.google@jstudioplay.app');
        if (!user) {
            user = db.createUser({
                name: 'Usuário Google (Demo)',
                username: 'google_demo',
                email: 'demo.google@jstudioplay.app',
                role: db.countUsers() === 0 ? 'admin' : 'user',
                googleId: 'demo_google_123456789'
            });
        }
        const token = security.createSessionToken(user);
        return res.json({
            token,
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            theme: user.theme || 'dark',
            avatar: user.avatar,
            blocked: false
        });
    }

    if (!credential) {
        return res.status(400).json({ error: 'Credencial do Google não informada.' });
    }

    try {
        // Validação criptográfica oficial via endpoint tokeninfo do Google
        const googleRes = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
            params: { id_token: credential },
            timeout: 7000
        });

        const payload = googleRes.data;
        if (!payload || !payload.sub || !payload.email) {
            return res.status(401).json({ error: 'Token do Google inválido ou expirado.' });
        }

        // Validação opcional de Client ID se configurado no .env
        if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
            return res.status(401).json({ error: 'O token do Google não corresponde ao Client ID configurado no servidor.' });
        }

        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name || payload.given_name || email.split('@')[0];
        const picture = payload.picture || null;

        // Localiza usuário por Google ID ou por e-mail correspondente
        let user = db.findUserByGoogleId(googleId) || db.findUserByEmail(email);

        // ST-05: ADMIN_EMAIL sem fallback hardcoded — configurar via env var
        const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
        const shouldBeAdmin = adminEmail && email && email.toLowerCase() === adminEmail;

        if (user) {
            // Atualiza Google ID e avatar se necessário
            if (!user.googleId) user.googleId = googleId;
            if (picture && !user.avatar) user.avatar = picture;
            if (shouldBeAdmin && user.role !== 'admin') user.role = 'admin';
            user.lastLoginAt = new Date().toISOString();
            db.save();
        } else {
            // Cria novo usuário automaticamente
            const isFirst = db.data.users.length === 0;
            user = db.createUser({
                name,
                username: email,
                email,
                googleId,
                avatar: picture,
                role: (isFirst || shouldBeAdmin) ? 'admin' : 'user'
            });
        }

        if (user.blocked) {
            return res.status(403).json({ error: 'Esta conta está temporariamente bloqueada.' });
        }

        if (user.expiresAt && new Date(user.expiresAt) < new Date()) {
            return res.status(403).json({ error: `Acesso expirado em ${new Date(user.expiresAt).toLocaleDateString('pt-BR')}.` });
        }

        db.addLog('auth', `Login realizado via Google: ${user.name} (${user.email || user.username})`, user.id);

        const token = security.createSessionToken(user);

        res.json({
            token,
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            theme: user.theme || 'dark',
            avatar: user.avatar,
            blocked: false
        });
    } catch (err) {
        console.error('Erro na autenticação do Google:', err.message);
        return res.status(401).json({ error: 'Falha ao validar credencial com o Google: ' + (err.response?.data?.error_description || err.message) });
    }
});

apiRouter.post('/setup', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Informe usuário e senha para criar o administrador.' });
    }

    const admin = db.createUser({
        name: 'Administrador',
        username,
        password,
        role: 'admin'
    });

    const token = security.createSessionToken(admin);
    res.json({
        token,
        id: admin.id,
        name: admin.name,
        username: admin.username,
        role: admin.role,
        theme: admin.theme
    });
});

apiRouter.post('/logout', (req, res) => {
    const user = getSessionUser(req);
    if (user) {
        db.addLog('auth', `Logout realizado: ${user.username}`, user.id);
    }
    res.json({ success: true });
});

apiRouter.patch('/account', requireAuth, (req, res) => {
    const { name, theme, password } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (theme) updates.theme = theme;
    if (password) updates.password = password;

    const user = req.user;
    const updated = db.updateUser(user.id, updates);
    res.json({
        id: updated.id,
        name: updated.name,
        username: updated.username,
        role: updated.role,
        theme: updated.theme
    });
});

apiRouter.patch('/settings', requireAuth, (req, res) => {
    const { apiKey, n8nWebhookUrl, autoSyncEnabled, relayEnabled } = req.body;
    const updates = {};
    if (apiKey !== undefined) updates.apiKey = apiKey;
    if (n8nWebhookUrl !== undefined) updates.n8nWebhookUrl = n8nWebhookUrl;
    if (autoSyncEnabled !== undefined) updates.autoSyncEnabled = !!autoSyncEnabled;
    if (relayEnabled !== undefined) updates.relayEnabled = !!relayEnabled;

    const newSettings = db.updateSettings(updates);
    res.json(newSettings);
});

// -----------------------------------------------------------------------------
// 2. Library & Playlists Endpoints
// -----------------------------------------------------------------------------
apiRouter.get('/library', requireAuth, (req, res) => {
    const user = req.user;
    const userId = user.id;
    res.json({
        playlists: db.getPlaylists(userId),
        favorites: db.getFavorites(userId),
        history: db.getHistory(userId),
        progress: db.getProgress(userId)
    });
});

apiRouter.get('/playlists', requireAuth, (req, res) => {
    const user = req.user;
    res.json(db.getPlaylists(user.id));
});

apiRouter.post('/playlists', requireAuth, async (req, res) => {
    try {
        const { name, url, text, organize } = req.body;
        let channels = [];

        if (url) {
            channels = await m3uParser.fetchFromUrl(url);
        } else if (text) {
            channels = m3uParser.parse(text);
        } else {
            return res.status(400).json({ error: 'Forneça uma URL ou arquivo M3U válido.' });
        }

        if (!channels || channels.length === 0) {
            return res.status(400).json({ error: 'Nenhum canal ou transmissão válida foi encontrada na playlist.' });
        }

        const user = req.user;
        const playlist = db.createPlaylist({
            userId: user.id,
            name: name || 'Playlist ' + (db.data.playlists.length + 1),
            url: url || '',
            channels
        });

        res.json(playlist);
    } catch (err) {
        console.error('Error creating playlist:', err);
        res.status(500).json({ error: err.message || 'Erro ao processar playlist M3U.' });
    }
});

apiRouter.get('/playlists/:id/channels', requireAuth, (req, res) => {
    const channels = db.getChannels(req.params.id);
    res.json(channels);
});

apiRouter.post('/playlists/:id/refresh', requireAuth, async (req, res) => {
    try {
        const playlistId = req.params.id;
        const p = db.getPlaylistById(playlistId);
        if (!p) return res.status(404).json({ error: 'Playlist não encontrada.' });

        if (req.body.url) {
            p.url = req.body.url;
        }

        await cronManager.refreshSinglePlaylist(playlistId);
        res.json(p);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// M3U Optimization Endpoints
apiRouter.post('/playlists/:id/sanitize', requireAuth, (req, res) => {
    try {
        const result = db.sanitizePlaylist(req.params.id, req.body.onlyOnline !== false);
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

apiRouter.post('/playlists/:id/deduplicate', requireAuth, (req, res) => {
    try {
        const result = db.deduplicatePlaylist(req.params.id);
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

apiRouter.post('/playlists/:id/sort', requireAuth, (req, res) => {
    try {
        const result = db.sortPlaylist(req.params.id, req.body.sortBy || 'name');
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

apiRouter.post('/playlists/:id/enrich', requireAuth, (req, res) => {
    try {
        const result = db.enrichPlaylist(req.params.id);
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// M3U Hub - Curated Playlists Directory
apiRouter.get('/hub/playlists', (req, res) => {
    res.json(m3uHub.getCatalog());
});

apiRouter.post('/hub/import/:id', requireAuth, async (req, res) => {
    try {
        const item = m3uHub.getPlaylistById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Playlist do Hub não encontrada.' });

        const channels = await m3uParser.fetchFromUrl(item.url);
        const user = req.user;

        const playlist = db.createPlaylist({
            userId: user.id,
            name: item.title,
            url: item.url,
            channels
        });

        res.json(playlist);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao importar playlist do Hub: ' + err.message });
    }
});

// EPG - Electronic Program Guide Endpoints
apiRouter.get('/epg/now', (req, res) => {
    const { tvgId, name } = req.query;
    const epg = epgManager.getChannelNowPlaying(tvgId, name);
    res.json(epg);
});

apiRouter.get('/epg/channel/:id', (req, res) => {
    const epg = epgManager.getChannelNowPlaying(req.params.id, req.query.name);
    res.json(epg);
});

// Custom M3U Generator Endpoint
// ST-01: Fix — extrair userId, filter, groups, sort do req.query (ReferenceError corrigido)
apiRouter.get('/m3u/custom', (req, res) => {
    const { userId, filter, groups, sort } = req.query;
    const sessionUser = getSessionUser(req);
    const targetUser = userId ? db.findUserById(userId) : sessionUser;
    if (!targetUser) return res.status(401).send('#EXTM3U\n#EXTINF:-1,ACESSO NÃO AUTORIZADO\nhttp://invalid');

    let allChannels = [];
    const playlists = db.getPlaylists(targetUser.id);
    for (const pl of playlists) {
        allChannels.push(...db.getChannels(pl.id));
    }

    if (filter === 'online') {
        allChannels = allChannels.filter(c => c.status === 'online');
    }

    if (groups) {
        const groupList = groups.split(',').map(g => g.trim().toLowerCase());
        allChannels = allChannels.filter(c => groupList.includes((c.group || 'Geral').toLowerCase()));
    }

    if (sort === 'latency') {
        allChannels.sort((a, b) => (a.latency || 9999) - (b.latency || 9999));
    } else if (sort === 'name') {
        allChannels.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
    }

    const m3uContent = m3uParser.exportToM3U(allChannels);
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', `attachment; filename="${targetUser.username}_custom.m3u"`);
    res.send(m3uContent);
});

// System Backup & Restore Endpoints
// ST-02: RBAC — backup/restore restritos a admin
apiRouter.get('/backup/export', requireAuth, security.requireAdmin(), (req, res) => {
    const backup = db.exportBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="m3uplay_backup_${new Date().toISOString().slice(0, 10)}.json"`);
    res.json(backup);
});

apiRouter.post('/backup/import', requireAuth, security.requireAdmin(), (req, res) => {
    try {
        const result = db.importBackup(req.body);
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

apiRouter.delete('/playlists/:id', requireAuth, (req, res) => {
    const user = req.user;
    const success = db.deletePlaylist(req.params.id, user.id);
    if (!success) return res.status(404).json({ error: 'Playlist não encontrada.' });
    res.json({ success: true });
});

apiRouter.get('/playlists/:id/export', (req, res) => {
    const playlist = db.getPlaylistById(req.params.id);
    if (!playlist) return res.status(404).send('Playlist não encontrada');

    const channels = db.getChannels(req.params.id);
    const onlyOnline = req.query.filter === 'online';

    const m3uContent = m3uParser.exportToM3U(channels, { onlyOnline });

    const filename = `${playlist.name.replace(/[^a-zA-Z0-9_-]/g, '_')}${onlyOnline ? '_online_only' : ''}.m3u`;
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(m3uContent);
});

// -----------------------------------------------------------------------------
// EPG & Guide Endpoints
// ST-09: rota /epg/now duplicada removida (já registrada acima em linha ~478)
// -----------------------------------------------------------------------------
apiRouter.get('/epg/grid', requireAuth, (req, res) => {
    const { playlistId, hours = 4, group } = req.query;
    const user = req.user;
    let channels = [];

    if (playlistId) {
        channels = db.getChannels(playlistId);
    } else {
        const playlists = db.getPlaylists(user.id);
        if (playlists.length > 0) {
            channels = db.getChannels(playlists[0].id);
        }
    }

    if (group && group !== 'all') {
        channels = channels.filter(c => (c.group || '').toLowerCase() === group.toLowerCase());
    }

    const grid = epgManager.getTimelineGrid(channels, parseInt(hours, 10) || 4);
    res.json(grid);
});

apiRouter.get('/epg/xmltv', (req, res) => {
    const sessionUser = getSessionUser(req);
    const user = (req.query.userId ? db.findUserById(req.query.userId) : sessionUser) || db.data.users.find(u => u.role === 'admin');
    if (!user) return res.status(401).send('<!-- Não autorizado -->');
    const playlists = db.getPlaylists(user.id);
    let channels = [];
    for (const pl of playlists) {
        channels.push(...db.getChannels(pl.id));
    }
    const xml = epgManager.generateXMLTV(channels);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="guide.xml"');
    res.send(xml);
});

// -----------------------------------------------------------------------------
// Smart Mirror Failover Search & Fast Speed Prober
// -----------------------------------------------------------------------------
apiRouter.get('/channels/mirrors', requireAuth, (req, res) => {
    const { name, currentUrl } = req.query;
    if (!name) return res.json({ mirrors: [] });

    const user = req.user;
    const playlists = db.getPlaylists(user.id);
    const cleanSearchName = name.toLowerCase().replace(/[^\w\s]/gi, '').trim();

    const mirrors = [];
    const seenUrls = new Set([currentUrl]);

    for (const pl of playlists) {
        const channels = db.getChannels(pl.id);
        for (const ch of channels) {
            if (!ch.url || seenUrls.has(ch.url)) continue;

            const chClean = (ch.name || '').toLowerCase().replace(/[^\w\s]/gi, '').trim();
            // Check similarity
            if (chClean === cleanSearchName || 
                (cleanSearchName.length > 3 && chClean.includes(cleanSearchName)) ||
                (chClean.length > 3 && cleanSearchName.includes(chClean))) {
                seenUrls.add(ch.url);
                mirrors.push({
                    id: ch.id,
                    name: ch.name,
                    url: ch.url,
                    group: ch.group,
                    logo: ch.logo,
                    playlistName: pl.name,
                    status: ch.status || 'unknown',
                    latency: ch.latency || null
                });
            }
        }
    }

    res.json({ mirrors });
});

apiRouter.post('/automation/probe-speed', requireAuth, async (req, res) => {
    const { channels = [] } = req.body;
    if (!Array.isArray(channels) || channels.length === 0) {
        return res.json({ results: [] });
    }

    const axios = require('axios');
    const results = await Promise.all(channels.slice(0, 30).map(async (ch) => {
        const start = Date.now();
        try {
            const resp = await axios.head(ch.url, {
                timeout: 3500,
                headers: {
                    'User-Agent': 'VLC/3.0.20 LibVLC/3.0.20'
                },
                validateStatus: () => true
            });
            const latency = Date.now() - start;
            const isOk = resp.status >= 200 && resp.status < 400;
            return {
                id: ch.id,
                name: ch.name,
                url: ch.url,
                status: isOk ? 'online' : 'offline',
                httpStatus: resp.status,
                latency,
                contentType: resp.headers['content-type'] || 'unknown'
            };
        } catch (e) {
            return {
                id: ch.id,
                name: ch.name,
                url: ch.url,
                status: 'offline',
                httpStatus: 0,
                latency: 9999,
                error: e.message
            };
        }
    }));

    res.json({ results });
});

// -----------------------------------------------------------------------------
// 3. Favorites, History, Progress
// -----------------------------------------------------------------------------
apiRouter.put('/favorites', requireAuth, (req, res) => {
    const { channel, playlistId } = req.body;
    if (!channel) return res.status(400).json({ error: 'Canal inválido.' });
    const user = req.user;
    const favs = db.toggleFavorite(user.id, channel, playlistId || 'default');
    res.json(favs);
});

apiRouter.post('/history', requireAuth, (req, res) => {
    const { playlistId, channel } = req.body;
    if (!channel) return res.status(400).json({ error: 'Canal inválido.' });
    const user = req.user;
    const hist = db.addHistory(user.id, playlistId, channel);
    res.json(hist);
});

apiRouter.delete('/history', requireAuth, (req, res) => {
    const user = req.user;
    const hist = db.clearHistory(user.id);
    res.json(hist);
});

apiRouter.put('/progress', requireAuth, (req, res) => {
    const { playlistId, channel, position, duration } = req.body;
    if (!channel) return res.status(400).json({ error: 'Canal inválido.' });
    const user = req.user;
    const progs = db.saveProgress(user.id, playlistId, channel, position, duration);
    res.json(progs);
});

// -----------------------------------------------------------------------------
// 4. Playback & CORS Streaming Relay
// -----------------------------------------------------------------------------
apiRouter.post('/playback', (req, res) => {
    relay.handlePlaybackRequest(req, res, db);
});

app.get('/proxy/stream', (req, res) => {
    relay.proxyStream(req, res);
});

// -----------------------------------------------------------------------------
// 5. Admin & Users
// ST-02: RBAC — todas as rotas admin restritas a administradores
// -----------------------------------------------------------------------------
apiRouter.get('/admin/users', requireAuth, security.requireAdmin(), (req, res) => {
    const usersWithStats = db.data.users.map(u => ({
        user: {
            id: u.id,
            name: u.name,
            username: u.username,
            role: u.role,
            blocked: !!u.blocked,
            lastLogin: u.lastLoginAt,
            createdAt: u.createdAt
        },
        sessionCount: 1,
        playlists: db.getPlaylists(u.id).length
    }));
    res.json(usersWithStats);
});

apiRouter.post('/admin/users', requireAuth, security.requireAdmin(), (req, res) => {
    try {
        const { name, username, password, role, expiresAt, playlists } = req.body;
        const user = db.createUser({ name, username, password, role, expiresAt, playlists });
        res.json({
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            expiresAt: user.expiresAt,
            blocked: user.blocked
        });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

apiRouter.patch('/admin/users/:id', requireAuth, security.requireAdmin(), (req, res) => {
    try {
        const updated = db.updateUser(req.params.id, req.body);
        res.json({
            id: updated.id,
            name: updated.name,
            username: updated.username,
            role: updated.role,
            expiresAt: updated.expiresAt,
            blocked: updated.blocked
        });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

apiRouter.get('/admin/logs', requireAuth, security.requireAdmin(), (req, res) => {
    const formattedLogs = db.data.logs.map(l => ({
        id: l.id,
        at: l.at || l.timestamp,
        user: l.user || 'Sistema',
        action: l.action || l.message,
        type: l.type || 'info'
    }));
    res.json(formattedLogs);
});

// -----------------------------------------------------------------------------
// 6. n8n Integration & Webhook Endpoints
// -----------------------------------------------------------------------------
apiRouter.post('/webhooks/validate', requireAuth, async (req, res) => {
    try {
        let { playlistId, url, name, webhookUrl, concurrency, timeout } = req.body;

        if (url && !playlistId) {
            const channels = await m3uParser.fetchFromUrl(url);
            const newPl = db.createPlaylist({
                userId: req.user.id,
                name: name || 'Importada via n8n',
                url,
                channels
            });
            playlistId = newPl.id;
        }

        if (!playlistId) {
            return res.status(400).json({ error: 'playlistId ou url é obrigatório.' });
        }

        const job = await streamChecker.checkPlaylist(playlistId, {
            webhookUrl: webhookUrl || db.data.settings.n8nWebhookUrl,
            concurrency,
            timeout
        });

        res.json({
            success: true,
            message: 'Validação de streams iniciada.',
            playlistId,
            job
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

apiRouter.post('/webhooks/provision-user', requireAuth, (req, res) => {
    try {
        const { name, username, password, email, daysValid = 30, playlistIds, role = 'user' } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'username e password são obrigatórios.' });
        }

        const expiresDate = new Date();
        expiresDate.setDate(expiresDate.getDate() + Number(daysValid));

        let user = db.findUserByUsername(username);
        if (user) {
            user = db.updateUser(user.id, {
                password,
                name: name || user.name,
                expiresAt: expiresDate.toISOString(),
                assignedPlaylists: playlistIds || user.assignedPlaylists,
                blocked: false
            });
            db.addLog('n8n', `Acesso renovado para "${username}" por mais ${daysValid} dias.`);
        } else {
            user = db.createUser({
                name: name || email || username,
                username,
                password,
                role,
                expiresAt: expiresDate.toISOString(),
                playlists: playlistIds || []
            });
            db.addLog('n8n', `Novo cliente criado via n8n: "${username}" (Válido por ${daysValid} dias).`);
        }

        const host = req.get('host');
        const protocol = req.protocol;
        const loginUrl = `${protocol}://${host}/#/login`;

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                expiresAt: user.expiresAt,
                daysValid
            },
            loginCredentials: {
                username,
                password,
                loginUrl
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

apiRouter.get('/webhooks/stats', requireAuth, (req, res) => {
    const totalPlaylists = db.data.playlists.length;
    const allChannels = Object.values(db.data.channels).flat();
    const totalChannels = allChannels.length;
    const onlineChannels = allChannels.filter(c => c.status === 'online').length;
    const offlineChannels = allChannels.filter(c => c.status === 'offline').length;
    const unknownChannels = allChannels.filter(c => c.status === 'unknown' || !c.status).length;

    res.json({
        system: {
            appName: db.data.settings.appName,
            version: '1.3.0',
            uptimeSeconds: process.uptime(),
            relayEnabled: db.data.settings.relayEnabled,
            autoSyncCron: 'A cada 6 horas'
        },
        counts: {
            users: db.data.users.length,
            playlists: totalPlaylists,
            channels: totalChannels,
            online: onlineChannels,
            offline: offlineChannels,
            untested: unknownChannels,
            availabilityRate: totalChannels ? ((onlineChannels / totalChannels) * 100).toFixed(1) + '%' : '100%'
        },
        recentLogs: db.data.logs.slice(0, 10)
    });
});

apiRouter.post('/automation/check/:id', requireAuth, async (req, res) => {
    try {
        const playlistId = req.params.id;
        const result = await streamChecker.checkPlaylist(playlistId, req.body);
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

apiRouter.get('/automation/check/:id/status', requireAuth, (req, res) => {
    const status = streamChecker.getStatus(req.params.id);
    res.json(status);
});

apiRouter.post('/automation/check/:id/stop', requireAuth, (req, res) => {
    const stopped = streamChecker.stopCheck(req.params.id);
    res.json({ stopped });
});

apiRouter.post('/automation/sync', requireAuth, async (req, res) => {
    cronManager.syncAllPlaylists();
    res.json({ message: 'Sincronização iniciada em segundo plano.' });
});

// -----------------------------------------------------------------------------
// Autonomous Operations & Observability Endpoints (v7.1)
// -----------------------------------------------------------------------------
apiRouter.get('/ops/dashboard', requireAuth, (req, res) => {
    const status = opsEngine.getDashboardStatus();
    res.json(status);
});

apiRouter.post('/ops/trigger-m3u', requireAuth, async (req, res) => {
    const result = await opsEngine.runM3uSync();
    res.json(result);
});

apiRouter.post('/ops/trigger-epg', requireAuth, async (req, res) => {
    const result = await opsEngine.runEpgSync();
    res.json(result);
});

apiRouter.post('/ops/trigger-health', requireAuth, async (req, res) => {
    const result = await opsEngine.runHealthCheck();
    res.json(result);
});

apiRouter.post('/ops/rotate-key', requireAuth, security.requireAdmin(), (req, res) => {
    const newApiKey = security.rotateApiKey();
    db.updateSettings({ apiKey: newApiKey });
    opsEngine.addIncident('sync', 'Segurança', 'Chave de API rotacionada com sucesso.');
    res.json({ success: true, newApiKey, message: 'Chave de API atualizada e persistida no .env' });
});

apiRouter.get('/n8n/export-workflow', (req, res) => {
    const workflowPath = path.join(__dirname, '..', 'n8n-workflows', 'm3u_play_ops_orchestrator.json');
    if (fs.existsSync(workflowPath)) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="m3u_play_ops_orchestrator.json"');
        res.sendFile(workflowPath);
    } else {
        res.status(404).json({ error: 'Arquivo de workflow não encontrado.' });
    }
});

// -----------------------------------------------------------------------------
// Xtream Codes API Compatibility (TiviMate, Smarters Pro, Smart TV, VLC, Kodi)
// -----------------------------------------------------------------------------
app.all('/player_api.php', (req, res) => xtreamServer.handlePlayerApi(req, res));
app.get('/get.php', (req, res) => xtreamServer.handleGetPhp(req, res));
app.get('/xmltv.php', (req, res) => xtreamServer.handleXmltvPhp(req, res));

app.get('/live/:username/:password/:streamId', (req, res) => {
    const { username, password, streamId } = req.params;
    const user = xtreamServer.authenticate(username, password);
    if (!user) return res.status(403).send('Acesso Negado');

    const channels = xtreamServer.getAllUserChannels(user);
    const cleanStreamId = streamId.replace(/\.(m3u8|ts)$/i, '');
    const channel = channels.find(c => c.id === cleanStreamId || c.tvgId === cleanStreamId);

    if (!channel || !channel.url) return res.status(404).send('Canal não encontrado');
    req.query.url = channel.url;
    relay.proxyStream(req, res);
});

app.get('/movie/:username/:password/:streamId', (req, res) => {
    const { username, password, streamId } = req.params;
    const user = xtreamServer.authenticate(username, password);
    if (!user) return res.status(403).send('Acesso Negado');

    const channels = xtreamServer.getAllUserChannels(user);
    const cleanStreamId = streamId.replace(/\.(mp4|mkv|m3u8|avi)$/i, '');
    const channel = channels.find(c => c.id === cleanStreamId || c.tvgId === cleanStreamId);

    if (!channel || !channel.url) return res.status(404).send('Filme não encontrado');
    req.query.url = channel.url;
    relay.proxyStream(req, res);
});

app.get('/series/:username/:password/:streamId', (req, res) => {
    const { username, password, streamId } = req.params;
    const user = xtreamServer.authenticate(username, password);
    if (!user) return res.status(403).send('Acesso Negado');

    const channels = xtreamServer.getAllUserChannels(user);
    const cleanStreamId = streamId.replace(/\.(mp4|mkv|m3u8|avi)$/i, '');
    const channel = channels.find(c => c.id === cleanStreamId || c.tvgId === cleanStreamId);

    if (!channel || !channel.url) return res.status(404).send('Episódio não encontrado');
    req.query.url = channel.url;
    relay.proxyStream(req, res);
});

// -----------------------------------------------------------------------------
// 7. M3U Scraper — Raspagem Diária de Fontes Públicas
// -----------------------------------------------------------------------------

// Status do scraper (última execução, relatório, se está rodando)
apiRouter.get('/scraper/status', requireAuth, (req, res) => {
    res.json(m3uScraper.getStatus());
});

// Lista todas as fontes configuradas e se estão habilitadas
apiRouter.get('/scraper/sources', requireAuth, (req, res) => {
    res.json(m3uScraper.getSources());
});

// Habilitar/desabilitar uma fonte individualmente
apiRouter.patch('/scraper/sources/:id', requireAuth, security.requireAdmin(), (req, res) => {
    try {
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ error: 'Campo "enabled" (boolean) é obrigatório.' });
        }
        const source = m3uScraper.toggleSource(req.params.id, enabled);
        res.json({ success: true, source });
    } catch (e) {
        res.status(404).json({ error: e.message });
    }
});

// Trigger manual da raspagem completa (ou de fontes específicas)
// Body opcional: { sourceIds: ['iptv_org_br', ...], validateSample: false }
apiRouter.post('/scraper/run', requireAuth, security.requireAdmin(), async (req, res) => {
    if (m3uScraper.isRunning) {
        return res.status(409).json({ error: 'Raspagem já está em andamento. Aguarde a conclusão.' });
    }

    const { sourceIds = null, validateSample = true } = req.body || {};

    // Responde imediatamente e executa em background
    res.json({ success: true, message: 'Raspagem iniciada em segundo plano. Use GET /scraper/status para acompanhar.' });

    try {
        await m3uScraper.run({ validateSample, sourceIds });
    } catch (err) {
        db.addLog('scraper', `Erro no scrape manual: ${err.message}`);
    }
});

app.use('/api', apiRouter);
app.use('/', apiRouter);

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'privacy.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 JstudioPlay Pro rodando em: http://localhost:${PORT}`);
    console.log(`🔑 API Key (n8n): ${db.data.settings.apiKey}`);
    console.log(`====================================================`);
    cronManager.init();
});
