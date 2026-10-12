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
const m3uScraper      = require('./services/m3uScraper');
const integrationHub  = require('./services/integrationHub');
const xtreamClient    = require('./services/xtreamClient');
const pushService     = require('./services/pushService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(security.rateLimiterMiddleware());
app.use(security.securityHeadersMiddleware());
app.use(express.json({ limit: '120mb' }));
app.use(express.urlencoded({ extended: true, limit: '120mb' }));

// Disable aggressive browser caching for static assets
app.use((req, res, next) => {
  if (req.path.startsWith('/static') || req.path === '/' || req.path.endsWith('.html') || req.path.endsWith('.js') || req.path.endsWith('.css')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

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
            credits: user.credits !== undefined ? Number(user.credits) : 0,
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
        credits: user.credits !== undefined ? Number(user.credits) : 0,
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
            credits: user.credits !== undefined ? Number(user.credits) : 0,
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
            credits: user.credits !== undefined ? Number(user.credits) : 0,
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

// Validação prévia de credenciais Xtream Codes (Host, User, Pass)
apiRouter.post('/playlists/xtream/validate', requireAuth, async (req, res) => {
    try {
        const { serverUrl, username, password } = req.body;
        if (!serverUrl || !username || !password) {
            return res.status(400).json({ error: 'Informe a URL do servidor, usuário e senha.' });
        }
        const result = await xtreamClient.validateCredentials(serverUrl, username, password);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message || 'Falha ao validar servidor Xtream Codes.' });
    }
});

// Importação completa de servidor Xtream Codes (Canais, VOD, Séries)
apiRouter.post('/playlists/xtream', requireAuth, async (req, res) => {
    try {
        const { name, serverUrl, username, password } = req.body;
        if (!serverUrl || !username || !password) {
            return res.status(400).json({ error: 'Informe a URL do servidor, usuário e senha do provedor IPTV.' });
        }

        const data = await xtreamClient.importContent(serverUrl, username, password);
        const user = req.user;
        const hostName = new URL(xtreamClient.normalizeUrl(serverUrl)).hostname;

        const playlist = db.createPlaylist({
            userId: user.id,
            name: name || `IPTV Pro (${hostName})`,
            url: data.m3uUrl,
            epgUrl: data.epgUrl,
            channels: data.channels
        });

        res.json({
            playlist,
            userInfo: data.userInfo,
            totalChannels: data.total
        });
    } catch (err) {
        console.error('Error importing Xtream playlist:', err);
        res.status(500).json({ error: err.message || 'Falha ao importar conteúdos do servidor Xtream Codes.' });
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
// 5. Admin & Users & Credits
// RBAC: Master (tudo), Adm (gestão), Reseller (créditos & clientes), Pro, User
// -----------------------------------------------------------------------------

// Catálogo Oficial de Créditos para Revenda (Matriz de 9 pacotes)
const CREDIT_PACKAGES = [
    { id: 'cred_10', credits: 10, price: 60.00, unitPrice: 6.00, title: '10 Créditos', discount: null },
    { id: 'cred_20', credits: 20, price: 120.00, unitPrice: 6.00, title: '20 Créditos', discount: null },
    { id: 'cred_30', credits: 30, price: 180.00, unitPrice: 6.00, title: '30 Créditos', discount: null },
    { id: 'cred_40', credits: 40, price: 200.00, unitPrice: 5.00, title: '40 Créditos', discount: 'Economize R$ 40' },
    { id: 'cred_50', credits: 50, price: 250.00, unitPrice: 5.00, title: '50 Créditos', discount: 'Economize R$ 50' },
    { id: 'cred_60', credits: 60, price: 300.00, unitPrice: 5.00, title: '60 Créditos', discount: 'Economize R$ 60' },
    { id: 'cred_70', credits: 70, price: 280.00, unitPrice: 4.00, title: '70 Créditos', discount: 'Super Desconto - R$ 4,00 cada' },
    { id: 'cred_80', credits: 80, price: 320.00, unitPrice: 4.00, title: '80 Créditos', discount: 'Super Desconto - R$ 4,00 cada' },
    { id: 'cred_90', credits: 90, price: 360.00, unitPrice: 4.00, title: '90 Créditos', discount: 'Melhor Custo-Benefício' }
];

apiRouter.get('/credits/packages', requireAuth, (req, res) => {
    res.json(CREDIT_PACKAGES);
});

apiRouter.post('/credits/checkout', requireAuth, security.requireReseller(), (req, res) => {
    try {
        const { packageId } = req.body;
        const pkg = CREDIT_PACKAGES.find(p => p.id === packageId || p.credits === Number(packageId));
        if (!pkg) return res.status(400).json({ error: 'Pacote de créditos inválido.' });

        // Chave PIX (configurada em CREDENCIAIS/.env ou fallback)
        const pixKey = process.env.PIX_KEY || 'pix@jstudioplay.com.br';
        const pixPayload = `00020126580014BR.GOV.BCB.PIX0136${pixKey}520400005303986540${pkg.price.toFixed(2)}5802BR5916JSTUDIOPLAY PRO6009SAO PAULO62070503***6304`;
        const whatsappNumber = process.env.WHATSAPP_SUPPORT || '5511999999999';
        const whatsappMsg = encodeURIComponent(`Olá! Acabei de gerar o pedido de ${pkg.credits} créditos (R$ ${pkg.price.toFixed(2)}) no JstudioPlay Pro para o usuário @${req.user.username}. Segue o comprovante.`);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`;

        db.addLog('credits', `Pedido de créditos iniciado: ${pkg.credits} créditos (R$ ${pkg.price.toFixed(2)}) por ${req.user.username}`);

        res.json({
            package: pkg,
            pixPayload,
            pixKey,
            whatsappUrl,
            expiresInSeconds: 1800,
            userCredits: req.user.credits || 0
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Transferência de créditos entre revendedores
apiRouter.post('/reseller/transfer', requireAuth, security.requireReseller(), (req, res) => {
    try {
        const { toUsername, amount } = req.body;
        if (!toUsername || !amount) {
            return res.status(400).json({ error: 'Informe o usuário de destino e a quantidade de créditos.' });
        }
        const toUser = db.findUserByUsername(String(toUsername).trim());
        if (!toUser) {
            return res.status(404).json({ error: 'Usuário destinatário não encontrado.' });
        }
        if (req.user.role === 'reseller' && toUser.role !== 'reseller') {
            return res.status(403).json({ error: 'Revendedores só podem transferir créditos para outros Revendedores.' });
        }
        const result = db.transferCredits(req.user.id, toUser.id, amount);
        res.json({
            success: true,
            amount: result.amount,
            myCredits: result.fromUser.credits,
            toUsername: result.toUser.username,
            message: `${result.amount} crédito(s) transferido(s) com sucesso para @${result.toUser.username}!`
        });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Renovar cliente consumindo 1 crédito (+30 dias)
apiRouter.post('/admin/users/:id/renew', requireAuth, security.requireReseller(), (req, res) => {
    try {
        const targetUser = db.findUserById(req.params.id);
        if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado.' });

        if (req.user.role === 'reseller') {
            if (!['user', 'pro'].includes(targetUser.role)) {
                return res.status(403).json({ error: 'Você só pode renovar contas de Usuário ou Pro.' });
            }
            db.deductCredit(req.user.id, 1);
        }

        const days = Number(req.body.days) || 30;
        const updatedUser = db.renewUserSubscription(targetUser.id, days);
        const myUser = db.findUserById(req.user.id);
        res.json({
            success: true,
            user: updatedUser,
            myCredits: myUser.credits,
            message: `Cliente @${targetUser.username} renovado por +${days} dias com sucesso!`
        });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Solicitação de Upgrade para Revendedor (User / Pro)
apiRouter.post('/account/request-reseller', requireAuth, (req, res) => {
    try {
        if (['reseller', 'admin', 'master'].includes(req.user.role)) {
            return res.status(400).json({ error: 'Você já possui perfil de Revendedor ou superior.' });
        }
        const { phone, notes } = req.body;
        const request = db.createResellerRequest({
            userId: req.user.id,
            name: req.user.name,
            username: req.user.username,
            email: req.user.email,
            phone: phone || '',
            notes: notes || ''
        });
        res.json({
            success: true,
            request,
            message: 'Sua solicitação para se tornar Revendedor foi enviada com sucesso! O administrador analisará seu pedido.'
        });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Listagem e Avaliação de Solicitações de Revenda (Master)
apiRouter.get('/admin/reseller-requests', requireAuth, security.requireMaster(), (req, res) => {
    try {
        const requests = db.getResellerRequests();
        res.json(requests);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

apiRouter.post('/admin/reseller-requests/:id/review', requireAuth, security.requireMaster(), (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status deve ser "approved" ou "rejected".' });
        }
        const updated = db.reviewResellerRequest(req.params.id, status, req.user.username);
        res.json({
            success: true,
            request: updated,
            message: `Solicitação ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso!`
        });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});


// -----------------------------------------------------------------------------
// PIX Webhook — recebe confirmação de pagamento de qualquer gateway
// POST /api/credits/pix-webhook
// Autenticação: HMAC-SHA256 via header X-Pix-Signature (opcional mas recomendado)
// Body esperado: { transactionId, userId, credits, amount, event }
// -----------------------------------------------------------------------------
app.post('/api/credits/pix-webhook', express.raw({ type: '*/*' }), async (req, res) => {
    try {
        const rawBody = req.body;
        const sig = req.headers['x-pix-signature'] || req.headers['x-webhook-signature'] || '';
        const secret = process.env.PIX_WEBHOOK_SECRET || '';

        // Valida HMAC se o secret estiver configurado
        if (secret && sig) {
            const expected = crypto
                .createHmac('sha256', secret)
                .update(rawBody)
                .digest('hex');
            const sigClean = sig.replace(/^sha256=/, '');
            if (!crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sigClean.padEnd(expected.length, '0').slice(0, expected.length), 'hex'))) {
                db.addLog('credits', `[PIX Webhook] Assinatura inválida rejeitada.`);
                return res.status(401).json({ error: 'Assinatura inválida.' });
            }
        }

        const body = JSON.parse(rawBody.toString('utf8'));
        const { transactionId, userId, credits, amount = 0, event = 'payment.confirmed' } = body;

        if (!transactionId) return res.status(400).json({ error: 'transactionId obrigatório.' });
        if (!['payment.confirmed', 'PAYMENT_CONFIRMED', 'completed'].includes(event)) {
            return res.json({ ok: true, message: `Evento "${event}" ignorado.` });
        }

        // Idempotência — ignora transação já processada
        const existing = db.getPixEvent(transactionId);
        if (existing?.status === 'processed') {
            return res.json({ ok: true, message: 'Transação já processada.' });
        }

        // Registra o evento
        db.savePixEvent({ transactionId, userId, amount, credits: Number(credits) || 0, status: 'pending', payload: body });

        // Credita o usuário se userId fornecido
        let user = null;
        if (userId && Number(credits) > 0) {
            user = db.addCredits(userId, Number(credits));
            db.markPixEventProcessed(transactionId);
            db.addLog('credits', `[PIX Webhook] ${Number(credits)} créditos adicionados ao usuário ${user.username} (tx: ${transactionId})`);

            // Notificação push ao revendedor
            await pushService.notifyUser(db, userId, {
                title: '✅ Pagamento confirmado!',
                body: `${Number(credits)} créditos foram adicionados à sua conta.`,
                icon: '/static/logo.svg',
                data: { url: '/#/credits' },
            });
        }

        res.json({ ok: true, credits: user?.credits ?? null });
    } catch (e) {
        console.error('[PIX Webhook] Erro:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// -----------------------------------------------------------------------------
// Web Push — gerenciamento de subscriptions e chave VAPID pública
// -----------------------------------------------------------------------------

apiRouter.get('/push/vapid-public-key', requireAuth, (req, res) => {
    const key = pushService.getVapidPublicKey();
    if (!key) return res.status(503).json({ error: 'Web Push não configurado no servidor.' });
    res.json({ publicKey: key });
});

apiRouter.post('/push/subscribe', requireAuth, (req, res) => {
    try {
        const { endpoint, keys } = req.body;
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ error: 'Subscription inválida.' });
        }
        db.savePushSubscription(req.user.id, { endpoint, keys });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

apiRouter.delete('/push/subscribe', requireAuth, (req, res) => {
    try {
        const { endpoint } = req.body;
        if (endpoint) db.deletePushSubscription(req.user.id, endpoint);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Endpoint para Master enviar notificação manual a um usuário
apiRouter.post('/push/notify/:userId', requireAuth, security.requireMaster(), async (req, res) => {
    try {
        const { title, body, icon, url } = req.body;
        await pushService.notifyUser(db, req.params.userId, {
            title: title || 'JstudioPlay',
            body: body || '',
            icon: icon || '/static/logo.svg',
            data: { url: url || '/' },
        });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

apiRouter.get('/admin/users', requireAuth, security.requireReseller(), (req, res) => {
    // Master vê todos; Adm vê todos exceto Master; Reseller vê clientes (user e pro)
    const filteredUsers = db.data.users.filter(u => {
        if (req.user.role === 'master') return true;
        if (req.user.role === 'admin') return u.role !== 'master';
        if (req.user.role === 'reseller') return ['user', 'pro'].includes(u.role);
        return false;
    });
    const usersWithStats = filteredUsers.map(u => ({
        user: {
            id: u.id,
            name: u.name,
            username: u.username,
            role: u.role,
            credits: u.credits !== undefined ? Number(u.credits) : 0,
            blocked: !!u.blocked,
            lastLogin: u.lastLoginAt,
            createdAt: u.createdAt
        },
        sessionCount: 1,
        playlists: db.getPlaylists(u.id).length
    }));
    res.json(usersWithStats);
});

apiRouter.post('/admin/users', requireAuth, security.requireReseller(), (req, res) => {
    try {
        const { name, username, password, role = 'user', expiresAt, playlists, credits = 0 } = req.body;
        
        // Validação de permissões por perfil
        if (req.user.role === 'reseller') {
            if (!['user', 'pro'].includes(role)) {
                return res.status(403).json({ error: 'Revendedores só podem cadastrar clientes com perfil Usuário ou Pro.' });
            }
            const currentCredits = Number(req.user.credits) || 0;
            if (currentCredits < 1) {
                return res.status(403).json({ error: 'Saldo de créditos insuficiente. Você precisa de pelo menos 1 crédito para criar um usuário. Adquira créditos em "Comprar Créditos".' });
            }
            // Consome 1 crédito
            db.deductCredit(req.user.id, 1);
        } else if (req.user.role === 'admin') {
            if (['admin', 'master'].includes(role)) {
                return res.status(403).json({ error: 'Apenas usuários com perfil Master podem criar Administradores ou Masters.' });
            }
        }

        const initialCredits = req.user.role === 'master' ? (Number(credits) || 0) : 0;
        const user = db.createUser({ name, username, password, role, credits: initialCredits, expiresAt, playlists });
        res.json({
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            credits: user.credits,
            expiresAt: user.expiresAt,
            blocked: user.blocked
        });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

apiRouter.patch('/admin/users/:id', requireAuth, security.requireReseller(), (req, res) => {
    try {
        const target = db.findUserById(req.params.id);
        if (!target) return res.status(404).json({ error: 'Usuário não encontrado.' });
        if (target.role === 'master' && req.user.role !== 'master') {
            return res.status(403).json({ error: 'Apenas Master pode editar outro usuário Master.' });
        }
        if (req.user.role === 'reseller' && !['user', 'pro'].includes(target.role)) {
            return res.status(403).json({ error: 'Revendedor só pode gerenciar clientes com perfil Usuário ou Pro.' });
        }
        if (req.user.role === 'admin' && req.body.role && ['admin', 'master'].includes(req.body.role)) {
            return res.status(403).json({ error: 'Apenas Master pode promover usuários a Adm ou Master.' });
        }
        const updated = db.updateUser(req.params.id, req.body);
        res.json({
            id: updated.id,
            name: updated.name,
            username: updated.username,
            role: updated.role,
            credits: updated.credits,
            expiresAt: updated.expiresAt,
            blocked: updated.blocked
        });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

apiRouter.delete('/admin/users/:id', requireAuth, security.requireReseller(), (req, res) => {
    const target = db.findUserById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Usuário não encontrado.' });
    if (target.role === 'master') return res.status(403).json({ error: 'Usuários Master não podem ser excluídos.' });
    if (target.role === 'admin' && req.user.role !== 'master') {
        return res.status(403).json({ error: 'Apenas Master pode excluir Administradores.' });
    }
    if (req.user.role === 'reseller' && !['user', 'pro'].includes(target.role)) {
        return res.status(403).json({ error: 'Revendedores só podem excluir clientes Usuário ou Pro.' });
    }
    const success = db.deleteUser(req.params.id);
    if (success) res.json({ success: true });
    else res.status(400).json({ error: 'Não foi possível excluir o usuário.' });
});

apiRouter.post('/admin/users/:id/credits', requireAuth, security.requireMaster(), (req, res) => {
    try {
        const amount = Number(req.body.amount);
        if (isNaN(amount) || amount === 0) {
            return res.status(400).json({ error: 'Informe uma quantidade válida de créditos (positiva para adicionar ou negativa para retirar).' });
        }
        const user = db.addCredits(req.params.id, amount);
        res.json({ success: true, credits: user.credits, user });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

apiRouter.get('/admin/logs', requireAuth, security.requireMaster(), (req, res) => {
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

// -----------------------------------------------------------------------------
// 8. AI & Integrations — Ollama · pgvector · SearXNG
// -----------------------------------------------------------------------------

// Status de toda a infra integrada (Ollama, pgvector, SearXNG)
apiRouter.get('/integrations/status', requireAuth, async (req, res) => {
    const status = await integrationHub.getInfraStatus();
    res.json(status);
});

// Enriquecimento AI de uma playlist (Ollama classifica + pgvector indexa)
// Responde imediatamente e processa em background
apiRouter.post('/integrations/enrich/:playlistId', requireAuth, async (req, res) => {
    const { playlistId } = req.params;
    const playlist = db.getPlaylistById(playlistId);
    if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada.' });

    res.json({ success: true, message: `Enriquecimento AI iniciado para "${playlist.name}". Acompanhe nos logs.` });

    integrationHub.enrichPlaylistWithAI(playlistId).catch(e =>
        db.addLog('ai', `Erro no enriquecimento AI de ${playlistId}: ${e.message}`)
    );
});

// Busca semântica de canais via pgvector + Ollama embeddings
// GET /api/integrations/search?q=canais+de+esportes+HD&limit=20&streamType=live&status=online
apiRouter.get('/integrations/search', requireAuth, async (req, res) => {
    const { q, limit = 20, streamType, status } = req.query;
    if (!q) return res.status(400).json({ error: 'Parâmetro "q" obrigatório.' });

    try {
        const results = await integrationHub.semanticChannelSearch(q, {
            limit:      parseInt(limit),
            streamType: streamType || null,
            status:     status     || null,
        });
        res.json({ query: q, total: results.length, results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Descoberta dinâmica de novas fontes M3U via SearXNG
// Body opcional: { query: "...", limit: 10 }
apiRouter.post('/integrations/discover', requireAuth, security.requireAdmin(), async (req, res) => {
    const { query = null, limit = 10 } = req.body || {};

    res.json({ success: true, message: 'Descoberta de fontes iniciada em background.' });

    integrationHub.discoverAndImport({ query, limit }).catch(e =>
        db.addLog('scraper', `Erro na descoberta dinâmica: ${e.message}`)
    );
});

// Análise do último relatório de scraping via Ollama (linguagem natural)
apiRouter.get('/integrations/scraper-analysis', requireAuth, async (req, res) => {
    try {
        const result = await integrationHub.analyzeLastScraperReport();
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
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
