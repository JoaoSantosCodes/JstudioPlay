/**
 * JstudioPlay Pro — Database Layer (SQLite via better-sqlite3)
 *
 * API pública 100% compatível com a versão JSON anterior.
 * Nenhum outro módulo precisa ser alterado.
 *
 * Melhorias:
 *  - WAL mode: leituras não bloqueiam escritas
 *  - Statements preparados (performance + segurança)
 *  - Migração automática de db.json legado
 *  - Sem risco de OOM com listas de 7000+ canais
 */

const path    = require('path');
const crypto  = require('crypto');
const bcrypt  = require('bcrypt');
const SQLite  = require('better-sqlite3');

const { applyMigrations }  = require('./db-schema');
const { migrateIfNeeded }  = require('./db-migrate');

const BCRYPT_COST = 12;
// __dirname é agora server/db/ — data/ fica em ../../data/
const DATA_DIR    = path.join(__dirname, '..', '..', 'data');
const DB_FILE     = path.join(DATA_DIR, 'jstudioplay.db');

// Garante que o diretório de dados existe
const fs = require('fs');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Abre o banco e aplica configurações de performance
const sql = new SQLite(DB_FILE);
sql.pragma('journal_mode = WAL');
sql.pragma('synchronous = NORMAL');
sql.pragma('foreign_keys = ON');
sql.pragma('cache_size = -32000');   // ~32 MB de cache
sql.pragma('temp_store = MEMORY');

// Aplica migrações pendentes e migra db.json legado
applyMigrations(sql);
migrateIfNeeded(sql);

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function generateDefaultApiKey() {
    return `m3u_key_${crypto.randomBytes(16).toString('hex')}`;
}

/** Converte linha da tabela `channels` → objeto compatível com o app */
function rowToChannel(r) {
    if (!r) return null;
    return {
        id:          r.id,
        name:        r.name,
        rawName:     r.raw_name   || undefined,
        tvgId:       r.tvg_id     || undefined,
        tvgName:     r.tvg_name   || undefined,
        logo:        r.logo       || '',
        group:       r.grp        || 'Geral',
        chno:        r.chno       || undefined,
        streamType:  r.stream_type|| 'live',
        url:         r.url,
        userAgent:   r.user_agent || undefined,
        status:      r.status     || 'unknown',
        latency:     r.latency    || undefined,
        lastChecked: r.last_checked || undefined,
    };
}

/** Converte linha da tabela `users` → objeto compatível com o app */
function rowToUser(r) {
    if (!r) return null;
    return {
        id:               r.id,
        name:             r.name,
        username:         r.username,
        email:            r.email     || null,
        googleId:         r.google_id || null,
        avatar:           r.avatar    || null,
        passwordHash:     r.password_hash,
        passwordHashAlgo: r.password_algo || 'bcrypt',
        role:             r.role,
        credits:          r.credits !== undefined && r.credits !== null ? Number(r.credits) : 0,
        theme:            r.theme    || 'dark',
        blocked:          !!r.blocked,
        expiresAt:        r.expires_at   || null,
        createdAt:        r.created_at,
        lastLoginAt:      r.last_login_at || null,
        // Playlists atribuídas (lazy-loaded quando necessário)
        get assignedPlaylists() {
            return sql
                .prepare('SELECT playlist_id FROM user_playlist_access WHERE user_id = ?')
                .all(r.id)
                .map(x => x.playlist_id);
        }
    };
}

/** Converte linha da tabela `playlists` → objeto compatível com o app */
function rowToPlaylist(r) {
    if (!r) return null;
    return {
        id:          r.id,
        userId:      r.user_id     || null,
        name:        r.name,
        url:         r.url,
        total:       r.total,
        live:        r.live,
        vod:         r.vod,
        series:      r.series,
        onlineCount: r.online_count,
        categories:  r.categories,
        checkStatus: r.check_status,
        lastChecked: r.last_checked || null,
        autoSync:    !!r.auto_sync,
        updated:     r.updated,
        created:     r.created,
    };
}

// ---------------------------------------------------------------------------
// Statements preparados (compilados uma vez, reutilizados)
// ---------------------------------------------------------------------------
const stmts = {
    // Settings
    getSetting:    sql.prepare('SELECT value FROM settings WHERE key = ?'),
    upsertSetting: sql.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)'),
    allSettings:   sql.prepare('SELECT key, value FROM settings'),

    // Users
    userById:      sql.prepare('SELECT * FROM users WHERE id = ?'),
    userByName:    sql.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE'),
    userByEmail:   sql.prepare('SELECT * FROM users WHERE email = ? OR username = ? COLLATE NOCASE'),
    userByGoogle:  sql.prepare('SELECT * FROM users WHERE google_id = ?'),
    insertUser:    sql.prepare(`
        INSERT INTO users (id,name,username,email,google_id,avatar,
            password_hash,password_algo,role,credits,theme,blocked,expires_at,created_at,last_login_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `),
    updateUser:    sql.prepare(`
        UPDATE users SET name=?,theme=?,role=?,credits=?,expires_at=?,blocked=?,
            password_hash=?,password_algo=?,email=?,google_id=?,avatar=?,last_login_at=?
        WHERE id=?
    `),
    deleteUser:    sql.prepare('DELETE FROM users WHERE id = ? AND role != ?'),
    saveUser:      sql.prepare(`
        INSERT OR REPLACE INTO users (id,name,username,email,google_id,avatar,
            password_hash,password_algo,role,credits,theme,blocked,expires_at,created_at,last_login_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `),

    // user_playlist_access
    insertAccess:  sql.prepare('INSERT OR IGNORE INTO user_playlist_access (user_id,playlist_id) VALUES (?,?)'),
    deleteAccess:  sql.prepare('DELETE FROM user_playlist_access WHERE user_id = ?'),
    getUserAccess: sql.prepare('SELECT playlist_id FROM user_playlist_access WHERE user_id = ?'),

    // Playlists
    allPlaylists:  sql.prepare('SELECT * FROM playlists ORDER BY created ASC'),
    playlistById:  sql.prepare('SELECT * FROM playlists WHERE id = ?'),
    playlistsByUser: sql.prepare(`
        SELECT p.* FROM playlists p
        WHERE p.user_id = ? OR p.id IN (
            SELECT playlist_id FROM user_playlist_access WHERE user_id = ?
        )
        ORDER BY p.created ASC
    `),
    insertPlaylist: sql.prepare(`
        INSERT INTO playlists (id,user_id,name,url,total,live,vod,series,
            online_count,categories,check_status,last_checked,auto_sync,updated,created)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `),
    updatePlaylist: sql.prepare(`
        UPDATE playlists SET name=?,url=?,total=?,live=?,vod=?,series=?,
            online_count=?,categories=?,check_status=?,last_checked=?,
            auto_sync=?,updated=? WHERE id=?
    `),
    deletePlaylist: sql.prepare('DELETE FROM playlists WHERE id = ?'),

    // Channels
    channelsByPlaylist: sql.prepare(
        'SELECT * FROM channels WHERE playlist_id = ? ORDER BY sort_order ASC'
    ),
    deleteChannels: sql.prepare('DELETE FROM channels WHERE playlist_id = ?'),
    insertChannel:  sql.prepare(`
        INSERT OR REPLACE INTO channels
          (id,playlist_id,name,raw_name,tvg_id,tvg_name,logo,grp,chno,
           stream_type,url,user_agent,status,latency,last_checked,sort_order)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `),
    updateChannelStatus: sql.prepare(`
        UPDATE channels SET status=?,latency=?,last_checked=?
        WHERE id=? AND playlist_id=?
    `),

    // Favorites
    favsByUser:    sql.prepare(`
        SELECT * FROM favorites WHERE user_id = ? ORDER BY added_at DESC
    `),
    favExists:     sql.prepare(
        'SELECT id FROM favorites WHERE user_id=? AND playlist_id=? AND ch_url=?'
    ),
    insertFav:     sql.prepare(`
        INSERT OR IGNORE INTO favorites
          (user_id,playlist_id,ch_id,ch_name,ch_group,ch_logo,ch_url,added_at)
        VALUES (?,?,?,?,?,?,?,?)
    `),
    deleteFav:     sql.prepare(
        'DELETE FROM favorites WHERE user_id=? AND playlist_id=? AND ch_url=?'
    ),

    // History
    histByUser:    sql.prepare(`
        SELECT * FROM history WHERE user_id = ? ORDER BY watched_at DESC LIMIT 100
    `),
    histExists:    sql.prepare(
        'SELECT id FROM history WHERE user_id=? AND playlist_id=? AND ch_url=?'
    ),
    deleteHistEntry: sql.prepare(
        'DELETE FROM history WHERE user_id=? AND playlist_id=? AND ch_url=?'
    ),
    insertHist:    sql.prepare(`
        INSERT INTO history
          (user_id,playlist_id,ch_id,ch_name,ch_group,ch_logo,ch_url,watched_at)
        VALUES (?,?,?,?,?,?,?,?)
    `),
    clearHistory:  sql.prepare('DELETE FROM history WHERE user_id = ?'),

    // Progress
    progByUser:    sql.prepare('SELECT * FROM progress WHERE user_id = ? ORDER BY updated DESC'),
    upsertProgress: sql.prepare(`
        INSERT INTO progress (user_id,playlist_id,ch_name,ch_group,ch_logo,ch_url,position,duration,percent,updated)
        VALUES (?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(user_id,playlist_id,ch_url) DO UPDATE SET
            position=excluded.position, duration=excluded.duration,
            percent=excluded.percent, updated=excluded.updated
    `),

    // Logs
    insertLog:     sql.prepare(
        'INSERT OR IGNORE INTO logs (id,type,username,action,at) VALUES (?,?,?,?,?)'
    ),
    recentLogs:    sql.prepare('SELECT * FROM logs ORDER BY at DESC LIMIT ?'),
    countLogs:     sql.prepare('SELECT COUNT(*) as n FROM logs'),
    deleteOldLogs: sql.prepare(`
        DELETE FROM logs WHERE id IN (
            SELECT id FROM logs ORDER BY at ASC LIMIT ?
        )
    `),
};

// ---------------------------------------------------------------------------
// Classe Database — mesma API da versão JSON
// ---------------------------------------------------------------------------

class Database {
    constructor() {
        // Compatibilidade: expõe .data.settings para acesso legado
        // Módulos internos (cronManager, streamChecker) DEVEM usar métodos públicos
        this._settingsCache = null;
    }

    // ---- Compatibilidade .data (somente leitura, para módulos legados) ----
    get data() {
        return {
            get settings() { return this._getSettings(); },
            get playlists() {
                return stmts.allPlaylists.all().map(rowToPlaylist);
            },
            get channels() {
                const pls = stmts.allPlaylists.all();
                const out = {};
                for (const p of pls) {
                    out[p.id] = stmts.channelsByPlaylist.all(p.id).map(rowToChannel);
                }
                return out;
            },
            get users() {
                return sql.prepare('SELECT * FROM users').all().map(rowToUser);
            },
            get logs() {
                return stmts.recentLogs.all(500);
            },
            _getSettings: () => this.getSettings(),
        };
    }

    // ===== SETTINGS =====

    getSettings() {
        const rows = stmts.allSettings.all();
        if (rows.length === 0) {
            // First run — semeia defaults
            this._seedDefaultSettings();
            return this.getSettings();
        }
        const s = {};
        for (const r of rows) {
            // Converte strings para tipos nativos
            const v = r.value;
            if (v === 'true')       s[r.key] = true;
            else if (v === 'false') s[r.key] = false;
            else if (v !== '' && !isNaN(Number(v)) && !isNaN(parseFloat(v))) s[r.key] = Number(v);
            else                    s[r.key] = v;
        }
        return s;
    }

    _seedDefaultSettings() {
        const defaults = {
            appName:                 'JstudioPlay Pro',
            apiKey:                  generateDefaultApiKey(),
            n8nWebhookUrl:           '',
            relayEnabled:            'true',
            relayMode:               'false',
            setupRequired:           'false',
            setupAllowed:            'true',
            maxPlaylistsPerAccount:  '20',
            streamCheckTimeout:      '3500',
            streamCheckConcurrency:  '15',
            autoSyncEnabled:         'true',
            autoSyncIntervalHours:   '6',
        };
        const tx = sql.transaction(() => {
            for (const [k, v] of Object.entries(defaults)) {
                stmts.upsertSetting.run(k, String(v));
            }
        });
        tx();
    }

    updateSettings(updates) {
        const tx = sql.transaction(() => {
            for (const [k, v] of Object.entries(updates)) {
                stmts.upsertSetting.run(k, v === null || v === undefined ? '' : String(v));
            }
        });
        tx();
        return this.getSettings();
    }

    // ===== LOGS =====

    addLog(type, message, userId = null) {
        const user = userId ? this.findUserById(userId) : null;
        const username = user ? user.username
            : (type === 'n8n' ? 'n8n Bot' : 'Sistema');

        const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const at = new Date().toISOString();

        stmts.insertLog.run(id, type, username, message, at);

        // Mantém máximo de 500 logs (circular buffer)
        const { n } = stmts.countLogs.get();
        if (n > 500) stmts.deleteOldLogs.run(n - 500);

        return { id, type, user: username, action: message, at };
    }

    // ===== USERS =====

    findUserById(id) {
        if (!id) return null;
        return rowToUser(stmts.userById.get(id));
    }

    findUserByUsername(username) {
        if (!username) return null;
        return rowToUser(stmts.userByName.get(username));
    }

    findUserByEmail(email) {
        if (!email) return null;
        const norm = email.toLowerCase().trim();
        return rowToUser(stmts.userByEmail.get(norm, norm));
    }

    findUserByGoogleId(googleId) {
        if (!googleId) return null;
        return rowToUser(stmts.userByGoogle.get(googleId));
    }

    createUser({ name, username, password, role = 'user', credits = 0, expiresAt = null,
                  playlists = [], googleId = null, email = null, avatar = null }) {
        if (username && this.findUserByUsername(username)) {
            throw new Error('Nome de usuário já está em uso.');
        }
        const pwd = password || crypto.randomBytes(32).toString('hex');
        const id  = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const now = new Date().toISOString();

        const validRoles = ['user', 'pro', 'reseller', 'admin', 'master'];
        const normalizedRole = validRoles.includes(role) ? role : 'user';

        const tx = sql.transaction(() => {
            stmts.insertUser.run(
                id,
                name || username || 'Usuário',
                username || email || `user_${Date.now()}`,
                email    || null,
                googleId || null,
                avatar   || null,
                bcrypt.hashSync(pwd, BCRYPT_COST),
                'bcrypt',
                normalizedRole,
                Number(credits) || 0,
                'dark',
                0,
                expiresAt || null,
                now, null
            );
            for (const pid of (playlists || [])) {
                stmts.insertAccess.run(id, pid);
            }
        });
        tx();

        this.addLog('user',
            `Novo usuário cadastrado (${normalizedRole}): ${username || email} ` +
            `${googleId ? '(via Google OAuth)' : ''} ` +
            `(Créditos: ${Number(credits) || 0}) ` +
            `(Expira: ${expiresAt || 'Nunca'})`
        );

        return this.findUserById(id);
    }

    updateUser(id, updates) {
        const user = this.findUserById(id);
        if (!user) throw new Error('Usuário não encontrado.');

        const newHash  = updates.password
            ? bcrypt.hashSync(updates.password, BCRYPT_COST)
            : user.passwordHash;
        const newAlgo  = updates.password ? 'bcrypt' : user.passwordHashAlgo;
        const newLastLogin = updates.lastLoginAt !== undefined
            ? updates.lastLoginAt
            : user.lastLoginAt;

        const validRoles = ['user', 'pro', 'reseller', 'admin', 'master'];
        const targetRole = updates.role && validRoles.includes(updates.role) ? updates.role : user.role;
        const targetCredits = updates.credits !== undefined ? Number(updates.credits) : (user.credits || 0);

        stmts.updateUser.run(
            updates.name       ?? user.name,
            updates.theme      ?? user.theme,
            targetRole,
            targetCredits,
            updates.expiresAt  !== undefined ? (updates.expiresAt || null) : user.expiresAt,
            updates.blocked    !== undefined ? (updates.blocked ? 1 : 0) : (user.blocked ? 1 : 0),
            newHash,
            newAlgo,
            updates.email      !== undefined ? (updates.email || null) : user.email,
            updates.googleId   !== undefined ? (updates.googleId || null) : user.googleId,
            updates.avatar     !== undefined ? (updates.avatar || null) : user.avatar,
            newLastLogin,
            id
        );

        if (updates.assignedPlaylists) {
            const tx = sql.transaction(() => {
                stmts.deleteAccess.run(id);
                for (const pid of updates.assignedPlaylists) {
                    stmts.insertAccess.run(id, pid);
                }
            });
            tx();
        }

        return this.findUserById(id);
    }

    addCredits(userId, amount) {
        const user = this.findUserById(userId);
        if (!user) throw new Error('Usuário não encontrado.');
        const qty = Number(amount) || 0;
        const newCredits = (user.credits || 0) + qty;
        sql.prepare('UPDATE users SET credits = ? WHERE id = ?').run(newCredits, userId);
        this.addLog('credits', `Adicionados ${qty} créditos para o usuário ${user.username}. Novo saldo: ${newCredits}.`);
        return this.findUserById(userId);
    }

    deductCredit(userId, amount = 1) {
        const user = this.findUserById(userId);
        if (!user) throw new Error('Usuário não encontrado.');
        const qty = Number(amount) || 1;
        if ((user.credits || 0) < qty) {
            throw new Error(`Saldo insuficiente (${user.credits || 0} créditos disponíveis, necessário ${qty}).`);
        }
        const newCredits = (user.credits || 0) - qty;
        sql.prepare('UPDATE users SET credits = ? WHERE id = ?').run(newCredits, userId);
        this.addLog('credits', `Consumido(s) ${qty} crédito(s) pelo usuário ${user.username}. Novo saldo: ${newCredits}.`);
        return this.findUserById(userId);
    }

    // -----------------------------------------------------------------------
    // PIX Events — idempotência de webhook
    // -----------------------------------------------------------------------

    savePixEvent({ transactionId, userId, amount, credits, status = 'pending', payload = null }) {
        const id = `pix_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const now = new Date().toISOString();
        sql.prepare(`
            INSERT OR IGNORE INTO pix_events
                (id, transaction_id, user_id, amount, credits, status, payload, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, transactionId, userId || null, amount, credits, status, payload ? JSON.stringify(payload) : null, now);
        return this.getPixEvent(transactionId);
    }

    getPixEvent(transactionId) {
        return sql.prepare('SELECT * FROM pix_events WHERE transaction_id = ?').get(transactionId) || null;
    }

    markPixEventProcessed(transactionId) {
        sql.prepare("UPDATE pix_events SET status = 'processed', processed_at = ? WHERE transaction_id = ?")
            .run(new Date().toISOString(), transactionId);
    }

    // -----------------------------------------------------------------------
    // Transferência de Créditos & Renovação de Assinatura
    // -----------------------------------------------------------------------

    transferCredits(fromUserId, toUserId, amount) {
        const fromUser = this.findUserById(fromUserId);
        const toUser = this.findUserById(toUserId);
        if (!fromUser) throw new Error('Usuário remetente não encontrado.');
        if (!toUser) throw new Error('Usuário destinatário não encontrado.');
        if (fromUser.id === toUser.id) throw new Error('Não é possível transferir créditos para si mesmo.');

        const qty = parseInt(amount, 10);
        if (isNaN(qty) || qty <= 0) throw new Error('Quantidade de créditos inválida.');

        if (fromUser.role !== 'master' && (fromUser.credits || 0) < qty) {
            throw new Error(`Saldo insuficiente (${fromUser.credits || 0} créditos disponíveis, necessário ${qty}).`);
        }

        const tx = sql.transaction(() => {
            if (fromUser.role !== 'master') {
                const newFromCredits = (fromUser.credits || 0) - qty;
                sql.prepare('UPDATE users SET credits = ? WHERE id = ?').run(newFromCredits, fromUser.id);
            }
            const newToCredits = (toUser.credits || 0) + qty;
            sql.prepare('UPDATE users SET credits = ? WHERE id = ?').run(newToCredits, toUser.id);

            const transferId = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            sql.prepare(`
                INSERT INTO credit_transfers (id, from_user_id, to_user_id, amount, created_at)
                VALUES (?, ?, ?, ?, ?)
            `).run(transferId, fromUser.id, toUser.id, qty, new Date().toISOString());

            this.addLog('credits', `Transferência de ${qty} crédito(s) de ${fromUser.username} para ${toUser.username}.`);
        });

        tx();
        return {
            fromUser: this.findUserById(fromUserId),
            toUser: this.findUserById(toUserId),
            amount: qty
        };
    }

    renewUserSubscription(userId, days = 30) {
        const user = this.findUserById(userId);
        if (!user) throw new Error('Usuário não encontrado.');

        const now = Date.now();
        let baseDate = now;
        if (user.expiresAt) {
            const expTime = new Date(user.expiresAt).getTime();
            if (expTime > now) {
                baseDate = expTime;
            }
        }
        const newExpiry = new Date(baseDate + days * 24 * 60 * 60 * 1000).toISOString();
        sql.prepare('UPDATE users SET expires_at = ?, blocked = 0 WHERE id = ?').run(newExpiry, userId);
        this.addLog('users', `Assinatura de ${user.username} renovada por ${days} dias (expira em ${newExpiry}).`);
        return this.findUserById(userId);
    }

    // -----------------------------------------------------------------------
    // Solicitações de Upgrade para Revendedor
    // -----------------------------------------------------------------------

    createResellerRequest({ userId, name, username, email, phone, notes }) {
        const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const now = new Date().toISOString();
        sql.prepare(`
            INSERT INTO reseller_requests (id, user_id, name, username, email, phone, notes, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        `).run(id, userId, name, username, email || null, phone || null, notes || null, now);
        this.addLog('users', `Nova solicitação para se tornar Revendedor: ${username} (${name}).`);
        return this.getResellerRequestById(id);
    }

    getResellerRequests(status = null) {
        if (status) {
            return sql.prepare('SELECT * FROM reseller_requests WHERE status = ? ORDER BY created_at DESC').all(status);
        }
        return sql.prepare('SELECT * FROM reseller_requests ORDER BY created_at DESC').all();
    }

    getResellerRequestById(id) {
        return sql.prepare('SELECT * FROM reseller_requests WHERE id = ?').get(id) || null;
    }

    reviewResellerRequest(id, status, reviewerUsername) {
        const req = this.getResellerRequestById(id);
        if (!req) throw new Error('Solicitação não encontrada.');
        const now = new Date().toISOString();
        sql.prepare(`
            UPDATE reseller_requests SET status = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?
        `).run(status, now, reviewerUsername, id);

        if (status === 'approved') {
            this.updateUser(req.user_id, { role: 'reseller' });
            this.addLog('users', `Solicitação de revenda de ${req.username} aprovada por ${reviewerUsername}. Usuário promovido para Revendedor.`);
        } else {
            this.addLog('users', `Solicitação de revenda de ${req.username} rejeitada por ${reviewerUsername}.`);
        }
        return this.getResellerRequestById(id);
    }


    // -----------------------------------------------------------------------
    // Push Subscriptions — Web Push API
    // -----------------------------------------------------------------------

    savePushSubscription(userId, { endpoint, keys }) {
        const now = new Date().toISOString();
        sql.prepare(`
            INSERT OR REPLACE INTO push_subscriptions
                (user_id, endpoint, keys_p256, keys_auth, created_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(userId, endpoint, keys?.p256dh || '', keys?.auth || '', now);
    }

    deletePushSubscription(userId, endpoint) {
        sql.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?')
            .run(userId, endpoint);
    }

    getPushSubscriptionsByUser(userId) {
        return sql.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId);
    }

    getAllPushSubscriptions() {
        return sql.prepare('SELECT * FROM push_subscriptions').all();
    }

    /** Retorna o primeiro usuário master/admin ou qualquer usuário como fallback */
    findAdminUser() {
        const row = sql.prepare("SELECT * FROM users WHERE role IN ('master', 'admin') ORDER BY created_at ASC LIMIT 1").get();        if (row) return rowToUser(row);
        const any = sql.prepare("SELECT * FROM users ORDER BY created_at ASC LIMIT 1").get();
        return any ? rowToUser(any) : null;
    }

    /** Conta usuários cadastrados */
    countUsers() {
        return sql.prepare('SELECT COUNT(*) as n FROM users').get().n;
    }

    /** Conta playlists */
    countPlaylists() {
        return sql.prepare('SELECT COUNT(*) as n FROM playlists').get().n;
    }

    deleteUser(id) {
        const user = this.findUserById(id);
        if (!user || user.role === 'master') return false;
        this.addLog('user', `Usuário "${user.username}" removido.`);
        stmts.deleteUser.run(id, 'master');
        return true;
    }

    save() { /* no-op — SQLite é transacional */ }
    flushSync() { /* no-op */ }

    // ===== PLAYLISTS =====

    getPlaylists(userId) {
        if (!userId) return stmts.allPlaylists.all().map(rowToPlaylist);
        const user = this.findUserById(userId);
        if (!user) return [];
        if (user.role === 'admin' || user.role === 'master' || user.role === 'reseller') return stmts.allPlaylists.all().map(rowToPlaylist);
        return stmts.playlistsByUser.all(userId, userId).map(rowToPlaylist);
    }

    getPlaylistById(id) {
        return rowToPlaylist(stmts.playlistById.get(id));
    }

    createPlaylist({ userId, name, url, channels, autoSync = true }) {
        const playlistId = `pl_${Date.now()}`;
        const now = new Date().toISOString();
        const ch  = Array.isArray(channels) ? channels : [];

        const stats = {
            total:  ch.length,
            live:   ch.filter(c => c.streamType === 'live' || !c.streamType).length,
            vod:    ch.filter(c => c.streamType === 'vod').length,
            series: ch.filter(c => c.streamType === 'series').length,
            online: ch.filter(c => c.status === 'online').length,
            cats:   new Set(ch.map(c => c.group || 'Geral')).size,
        };

        const tx = sql.transaction(() => {
            stmts.insertPlaylist.run(
                playlistId, userId || null, name || 'Minha Playlist',
                url || '', stats.total, stats.live, stats.vod, stats.series,
                stats.online, stats.cats, 'idle', null, autoSync ? 1 : 0, now, now
            );
            this._bulkInsertChannels(playlistId, ch);
        });
        tx();

        this.addLog('playlist',
            `Playlist "${name}" adicionada com ${stats.total} canais`, userId);
        return this.getPlaylistById(playlistId);
    }

    updatePlaylist(id, updates) {
        const p = this.getPlaylistById(id);
        if (!p) throw new Error('Playlist não encontrada.');
        const now = new Date().toISOString();
        stmts.updatePlaylist.run(
            updates.name       ?? p.name,
            updates.url        ?? p.url,
            updates.total      ?? p.total,
            updates.live       ?? p.live,
            updates.vod        ?? p.vod,
            updates.series     ?? p.series,
            updates.onlineCount ?? p.onlineCount,
            updates.categories ?? p.categories,
            updates.checkStatus ?? p.checkStatus,
            updates.lastChecked !== undefined ? (updates.lastChecked || null) : p.lastChecked,
            updates.autoSync   !== undefined ? (updates.autoSync ? 1 : 0) : (p.autoSync ? 1 : 0),
            now, id
        );
        return this.getPlaylistById(id);
    }

    deletePlaylist(id, userId) {
        const p = this.getPlaylistById(id);
        if (!p) return false;
        this.addLog('playlist', `Playlist "${p.name}" removida`, userId);
        stmts.deletePlaylist.run(id);   // cascade apaga channels
        return true;
    }

    // ===== CHANNELS =====

    getChannels(playlistId) {
        return stmts.channelsByPlaylist.all(playlistId).map(rowToChannel);
    }

    _bulkInsertChannels(playlistId, channels) {
        channels.forEach((ch, i) => {
            const chId = ch.id || `ch_${playlistId}_${i}`;
            stmts.insertChannel.run(
                chId, playlistId,
                ch.name || '', ch.rawName || null,
                ch.tvgId || null, ch.tvgName || null,
                ch.logo || null, ch.group || null,
                ch.chno || null, ch.streamType || 'live',
                ch.url || '', ch.userAgent || null,
                ch.status || 'unknown',
                ch.latency || null,
                ch.lastChecked || null, i
            );
        });
    }

    saveChannels(playlistId, channels) {
        const ch = Array.isArray(channels) ? channels : [];
        const stats = {
            total:  ch.length,
            live:   ch.filter(c => c.streamType === 'live' || !c.streamType).length,
            vod:    ch.filter(c => c.streamType === 'vod').length,
            series: ch.filter(c => c.streamType === 'series').length,
            online: ch.filter(c => c.status === 'online').length,
            cats:   new Set(ch.map(c => c.group || 'Geral')).size,
        };

        const tx = sql.transaction(() => {
            stmts.deleteChannels.run(playlistId);
            this._bulkInsertChannels(playlistId, ch);
            // Atualiza estatísticas da playlist
            const p = this.getPlaylistById(playlistId);
            if (p) {
                stmts.updatePlaylist.run(
                    p.name, p.url, stats.total, stats.live, stats.vod, stats.series,
                    stats.online, stats.cats, p.checkStatus, p.lastChecked,
                    p.autoSync ? 1 : 0, new Date().toISOString(), playlistId
                );
            }
        });
        tx();
    }

    updateChannels(playlistId, channels) {
        return this.saveChannels(playlistId, channels);
    }

    updateChannelLatency(playlistId, channelId, latency, status = 'online') {
        const info = stmts.updateChannelStatus.run(
            status, latency, new Date().toISOString(), channelId, playlistId
        );
        return info.changes > 0;
    }

    // ===== M3U OPTIMIZATION TOOLS =====

    sanitizePlaylist(playlistId, onlyOnline = true) {
        const p = this.getPlaylistById(playlistId);
        if (!p) throw new Error('Playlist não encontrada.');
        let channels = this.getChannels(playlistId);
        const originalCount = channels.length;
        channels = onlyOnline
            ? channels.filter(c => c.status === 'online')
            : channels.filter(c => c.status !== 'offline');
        this.saveChannels(playlistId, channels);
        const removed = originalCount - channels.length;
        this.addLog('optimization',
            `Lista "${p.name}" otimizada: ${removed} canais offline removidos. ${channels.length} restantes.`);
        return { playlist: this.getPlaylistById(playlistId), removed, remaining: channels.length };
    }

    deduplicatePlaylist(playlistId) {
        const p = this.getPlaylistById(playlistId);
        if (!p) throw new Error('Playlist não encontrada.');
        const channels = this.getChannels(playlistId);
        const originalCount = channels.length;
        const seen = new Set();
        const deduped = channels.filter(ch => {
            const key = (ch.url || '').trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        this.saveChannels(playlistId, deduped);
        const removed = originalCount - deduped.length;
        this.addLog('optimization',
            `Lista "${p.name}" deduplicada: ${removed} canais repetidos removidos.`);
        return { playlist: this.getPlaylistById(playlistId), removed, remaining: deduped.length };
    }

    sortPlaylist(playlistId, sortBy = 'name') {
        const p = this.getPlaylistById(playlistId);
        if (!p) throw new Error('Playlist não encontrada.');
        const channels = [...this.getChannels(playlistId)];
        if (sortBy === 'name')     channels.sort((a,b) => (a.name||'').localeCompare(b.name||'','pt-BR'));
        else if (sortBy === 'latency')  channels.sort((a,b) => (a.latency||9999)-(b.latency||9999));
        else if (sortBy === 'category') channels.sort((a,b) => (a.group||'').localeCompare(b.group||'','pt-BR'));
        this.saveChannels(playlistId, channels);
        this.addLog('optimization', `Lista "${p.name}" reordenada por: ${sortBy}.`);
        return { playlist: this.getPlaylistById(playlistId), total: channels.length, sortedBy: sortBy };
    }

    enrichPlaylist(playlistId) {
        const p = this.getPlaylistById(playlistId);
        if (!p) throw new Error('Playlist não encontrada.');
        const enricher = require('../services/m3uEnricher');
        let channels = this.getChannels(playlistId);
        let updatedCount = 0;
        channels = channels.map(ch => {
            const enriched = enricher.enrichChannel({ ...ch });
            if (enriched.logo !== ch.logo || enriched.group !== ch.group || enriched.name !== ch.name) updatedCount++;
            return enriched;
        });
        this.saveChannels(playlistId, channels);
        this.addLog('optimization',
            `Lista "${p.name}" enriquecida: ${updatedCount} canais aprimorados.`);
        return { playlist: this.getPlaylistById(playlistId), updatedCount, total: channels.length };
    }

    // ===== FAVORITES =====

    getFavorites(userId) {
        return stmts.favsByUser.all(userId).map(r => ({
            playlistId: r.playlist_id,
            channel: {
                id:    r.ch_id   || undefined,
                name:  r.ch_name,
                group: r.ch_group,
                logo:  r.ch_logo,
                url:   r.ch_url,
            }
        }));
    }

    toggleFavorite(userId, rawChannel, playlistId) {
        const channel = rawChannel.channel || rawChannel;
        const existing = stmts.favExists.get(userId, playlistId, channel.url);
        if (existing) {
            stmts.deleteFav.run(userId, playlistId, channel.url);
        } else {
            stmts.insertFav.run(
                userId, playlistId,
                channel.id || null, channel.name || '',
                channel.group || 'Geral', channel.logo || '',
                channel.url, new Date().toISOString()
            );
        }
        return this.getFavorites(userId);
    }

    // ===== HISTORY =====

    getHistory(userId) {
        return stmts.histByUser.all(userId).map(r => ({
            playlistId: r.playlist_id,
            channel: {
                id:    r.ch_id   || undefined,
                name:  r.ch_name,
                group: r.ch_group,
                logo:  r.ch_logo,
                url:   r.ch_url,
            },
            at: r.watched_at,
        }));
    }

    addHistory(userId, playlistId, rawChannel) {
        const channel = rawChannel.channel || rawChannel;
        // Remove entrada duplicada antes de reinserir no topo
        stmts.deleteHistEntry.run(userId, playlistId, channel.url);
        stmts.insertHist.run(
            userId, playlistId,
            channel.id || null, channel.name || '',
            channel.group || 'Geral', channel.logo || '',
            channel.url, new Date().toISOString()
        );
        // Mantém máximo de 100 entradas por usuário
        const all = stmts.histByUser.all(userId);
        if (all.length > 100) {
            const oldest = all[all.length - 1];
            sql.prepare('DELETE FROM history WHERE id = ?').run(oldest.id);
        }
        return this.getHistory(userId);
    }

    clearHistory(userId) {
        stmts.clearHistory.run(userId);
        return [];
    }

    // ===== PROGRESS =====

    getProgress(userId) {
        return stmts.progByUser.all(userId).map(r => ({
            playlistId: r.playlist_id,
            channel: {
                name:  r.ch_name,
                group: r.ch_group,
                logo:  r.ch_logo,
                url:   r.ch_url,
            },
            position: r.position,
            duration: r.duration,
            percent:  Math.min(100, Math.round(r.percent)),
            updated:  r.updated,
        }));
    }

    saveProgress(userId, playlistId, rawChannel, position, duration) {
        const channel = rawChannel.channel || rawChannel;
        const pos     = Number(position || 0);
        const dur     = Number(duration  || 1);
        const pct     = Math.min(100, (pos / dur) * 100);
        stmts.upsertProgress.run(
            userId, playlistId,
            channel.name || '', channel.group || 'Geral',
            channel.logo || '', channel.url || '',
            pos, dur, pct, new Date().toISOString()
        );
        return this.getProgress(userId);
    }

    // ===== BACKUP / RESTORE =====

    exportBackup() {
        const users = sql.prepare('SELECT * FROM users').all().map(rowToUser);
        return {
            version:    '3.0.0',
            exportedAt: new Date().toISOString(),
            settings:   this.getSettings(),
            playlists:  this.getPlaylists(null),
            channels:   (() => {
                const out = {};
                for (const p of this.getPlaylists(null)) {
                    out[p.id] = this.getChannels(p.id);
                }
                return out;
            })(),
            favorites: (() => {
                const out = {};
                for (const u of users) {
                    out[u.id] = this.getFavorites(u.id);
                }
                return out;
            })(),
            history: (() => {
                const out = {};
                for (const u of users) {
                    out[u.id] = this.getHistory(u.id);
                }
                return out;
            })(),
            progress: (() => {
                const out = {};
                for (const u of users) {
                    out[u.id] = this.getProgress(u.id);
                }
                return out;
            })(),
            users: users.map(u => ({
                id: u.id, name: u.name, username: u.username,
                role: u.role, theme: u.theme,
                expiresAt: u.expiresAt,
                assignedPlaylists: u.assignedPlaylists,
            })),
        };
    }

    importBackup(backupData) {
        if (!backupData || !backupData.playlists) {
            throw new Error('Formato de backup inválido.');
        }
        // Reutiliza o migrator para importar o backup como se fosse um db.json
        const { migrateIfNeeded: runMigrate } = require('./db-migrate');
        // Apaga dados atuais e reimporta
        const tx = sql.transaction(() => {
            sql.exec(`
                DELETE FROM progress; DELETE FROM history; DELETE FROM favorites;
                DELETE FROM channels; DELETE FROM playlists;
                DELETE FROM user_playlist_access;
            `);
        });
        tx();

        // Converte formato backup para formato db.json e reimporta
        const legacyFmt = {
            settings:  backupData.settings || {},
            playlists: backupData.playlists || [],
            channels:  backupData.channels  || {},
            favorites: backupData.favorites || {},
            history:   backupData.history   || {},
            progress:  backupData.progress  || {},
            users:     [],
        };

        const { migrateIfNeeded: importFn } = require('./db-migrate');
        // Chama migração diretamente com os dados
        const migrate = sql.transaction(() => {
            const upsertPlaylist = stmts.insertPlaylist;
            for (const p of legacyFmt.playlists) {
                try {
                    const now = new Date().toISOString();
                    upsertPlaylist.run(
                        p.id, p.userId || null, p.name || 'Playlist',
                        p.url || '', p.total || 0, p.live || 0,
                        p.vod || 0, p.series || 0, p.onlineCount || 0,
                        p.categories || 0, p.checkStatus || 'idle',
                        p.lastChecked || null, p.autoSync !== false ? 1 : 0,
                        p.updated || now, p.created || now
                    );
                } catch {}
            }
            for (const [pid, chList] of Object.entries(legacyFmt.channels)) {
                this._bulkInsertChannels(pid, Array.isArray(chList) ? chList : []);
            }
            for (const [uid, favs] of Object.entries(legacyFmt.favorites)) {
                for (const f of (Array.isArray(favs) ? favs : [])) {
                    const ch = f.channel || f;
                    try { stmts.insertFav.run(uid, f.playlistId||'default', ch.id||null, ch.name||'', ch.group||'Geral', ch.logo||'', ch.url||'', f.addedAt||new Date().toISOString()); } catch {}
                }
            }
            for (const [uid, hist] of Object.entries(legacyFmt.history)) {
                for (const h of (Array.isArray(hist) ? hist : [])) {
                    const ch = h.channel || h;
                    try { stmts.insertHist.run(uid, h.playlistId||'default', ch.id||null, ch.name||'', ch.group||'Geral', ch.logo||'', ch.url||'', h.at||new Date().toISOString()); } catch {}
                }
            }
            for (const [uid, progs] of Object.entries(legacyFmt.progress)) {
                for (const p of (Array.isArray(progs) ? progs : [])) {
                    const ch = p.channel || p;
                    const pos = Number(p.position||0), dur = Number(p.duration||1);
                    try { stmts.upsertProgress.run(uid, p.playlistId||'default', ch.name||'', ch.group||'Geral', ch.logo||'', ch.url||'', pos, dur, Math.min(100,(pos/dur)*100), p.updated||new Date().toISOString()); } catch {}
                }
            }
            if (backupData.settings) this.updateSettings(backupData.settings);
        });
        migrate();

        this.addLog('system', 'Backup importado e restaurado com sucesso.');
        return { success: true, playlists: this.getPlaylists(null).length };
    }
}

// Singleton — mesma interface da versão anterior
const instance = new Database();

// Garante que o usuário admin padrão existe em instalações limpas
if (sql.prepare('SELECT COUNT(*) as n FROM users').get().n === 0) {
    instance.createUser({
        name: 'Administrador Master',
        username: 'admin',
        password: 'admin123',
        role: 'master',
    });
    console.log('[DB] Usuário admin padrão criado com perfil Master. Altere a senha!');
} else {
    // Migração automática de compatibilidade: promove o root 'admin' para 'master'
    try {
        sql.prepare("UPDATE users SET role = 'master' WHERE username = 'admin' AND role = 'admin'").run();
    } catch {}
}

module.exports = instance;
