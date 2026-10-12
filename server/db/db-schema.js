/**
 * JstudioPlay Pro — SQLite Schema & Migration Engine
 * Versão do schema: 1 (baseline)
 *
 * Regras:
 *  - Cada versão adiciona um bloco em MIGRATIONS[n]
 *  - apply() roda apenas versões pendentes em transação
 *  - Nunca alterar migrações já aplicadas
 */

const MIGRATIONS = {
    1: `
        -- Configurações globais (chave-valor simples)
        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        -- Usuários
        CREATE TABLE IF NOT EXISTS users (
            id               TEXT PRIMARY KEY,
            name             TEXT NOT NULL,
            username         TEXT NOT NULL UNIQUE COLLATE NOCASE,
            email            TEXT COLLATE NOCASE,
            google_id        TEXT UNIQUE,
            avatar           TEXT,
            password_hash    TEXT NOT NULL,
            password_algo    TEXT NOT NULL DEFAULT 'bcrypt',
            role             TEXT NOT NULL DEFAULT 'user',
            theme            TEXT NOT NULL DEFAULT 'dark',
            blocked          INTEGER NOT NULL DEFAULT 0,
            expires_at       TEXT,
            created_at       TEXT NOT NULL,
            last_login_at    TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_google   ON users(google_id);

        -- Playlists
        CREATE TABLE IF NOT EXISTS playlists (
            id           TEXT PRIMARY KEY,
            user_id      TEXT,
            name         TEXT NOT NULL,
            url          TEXT NOT NULL DEFAULT '',
            total        INTEGER NOT NULL DEFAULT 0,
            live         INTEGER NOT NULL DEFAULT 0,
            vod          INTEGER NOT NULL DEFAULT 0,
            series       INTEGER NOT NULL DEFAULT 0,
            online_count INTEGER NOT NULL DEFAULT 0,
            categories   INTEGER NOT NULL DEFAULT 0,
            check_status TEXT NOT NULL DEFAULT 'idle',
            last_checked TEXT,
            auto_sync    INTEGER NOT NULL DEFAULT 1,
            updated      TEXT NOT NULL,
            created      TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);

        -- Acesso de usuários a playlists (muitos-para-muitos)
        CREATE TABLE IF NOT EXISTS user_playlist_access (
            user_id     TEXT NOT NULL,
            playlist_id TEXT NOT NULL,
            PRIMARY KEY (user_id, playlist_id),
            FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
            FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
        );

        -- Canais (o maior dataset)
        CREATE TABLE IF NOT EXISTS channels (
            id           TEXT NOT NULL,
            playlist_id  TEXT NOT NULL,
            name         TEXT NOT NULL DEFAULT '',
            raw_name     TEXT,
            tvg_id       TEXT,
            tvg_name     TEXT,
            logo         TEXT,
            grp          TEXT,
            chno         INTEGER,
            stream_type  TEXT NOT NULL DEFAULT 'live',
            url          TEXT NOT NULL DEFAULT '',
            user_agent   TEXT,
            status       TEXT NOT NULL DEFAULT 'unknown',
            latency      INTEGER,
            last_checked TEXT,
            sort_order   INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (id, playlist_id),
            FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_channels_playlist ON channels(playlist_id);
        CREATE INDEX IF NOT EXISTS idx_channels_status   ON channels(playlist_id, status);
        CREATE INDEX IF NOT EXISTS idx_channels_grp      ON channels(playlist_id, grp);

        -- Favoritos
        CREATE TABLE IF NOT EXISTS favorites (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     TEXT NOT NULL,
            playlist_id TEXT NOT NULL,
            ch_id       TEXT,
            ch_name     TEXT NOT NULL,
            ch_group    TEXT NOT NULL DEFAULT 'Geral',
            ch_logo     TEXT NOT NULL DEFAULT '',
            ch_url      TEXT NOT NULL,
            added_at    TEXT NOT NULL,
            UNIQUE (user_id, playlist_id, ch_url),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_fav_user ON favorites(user_id);

        -- Histórico de reprodução
        CREATE TABLE IF NOT EXISTS history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     TEXT NOT NULL,
            playlist_id TEXT NOT NULL,
            ch_id       TEXT,
            ch_name     TEXT NOT NULL,
            ch_group    TEXT NOT NULL DEFAULT 'Geral',
            ch_logo     TEXT NOT NULL DEFAULT '',
            ch_url      TEXT NOT NULL,
            watched_at  TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id, watched_at DESC);

        -- Progresso de reprodução (VOD/séries)
        CREATE TABLE IF NOT EXISTS progress (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     TEXT NOT NULL,
            playlist_id TEXT NOT NULL,
            ch_name     TEXT NOT NULL,
            ch_group    TEXT NOT NULL DEFAULT 'Geral',
            ch_logo     TEXT NOT NULL DEFAULT '',
            ch_url      TEXT NOT NULL,
            position    REAL NOT NULL DEFAULT 0,
            duration    REAL NOT NULL DEFAULT 1,
            percent     REAL NOT NULL DEFAULT 0,
            updated     TEXT NOT NULL,
            UNIQUE (user_id, playlist_id, ch_url),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);

        -- Logs do sistema (circular buffer de 500)
        CREATE TABLE IF NOT EXISTS logs (
            id         TEXT PRIMARY KEY,
            type       TEXT NOT NULL DEFAULT 'system',
            username   TEXT NOT NULL DEFAULT 'Sistema',
            action     TEXT NOT NULL,
            at         TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_logs_at ON logs(at DESC);

        -- Controle de versão do schema
        CREATE TABLE IF NOT EXISTS schema_version (
            version    INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        );
    `,
    2: `
        -- Suporte a Revendedor e Saldo de Créditos
        ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT 0;
    `,
    3: `
        -- Eventos de webhook PIX (idempotência por transaction_id)
        CREATE TABLE IF NOT EXISTS pix_events (
            id             TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL UNIQUE,
            user_id        TEXT,
            amount         REAL NOT NULL DEFAULT 0,
            credits        INTEGER NOT NULL DEFAULT 0,
            status         TEXT NOT NULL DEFAULT 'pending',
            payload        TEXT,
            processed_at   TEXT,
            created_at     TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_pix_events_txid ON pix_events(transaction_id);
        CREATE INDEX IF NOT EXISTS idx_pix_events_user ON pix_events(user_id);

        -- Subscriptions de Web Push por usuário
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    TEXT NOT NULL,
            endpoint   TEXT NOT NULL UNIQUE,
            keys_p256  TEXT NOT NULL,
            keys_auth  TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
    `,
    4: `
        -- Solicitações de Upgrade para Revendedor
        CREATE TABLE IF NOT EXISTS reseller_requests (
            id          TEXT PRIMARY KEY,
            user_id     TEXT NOT NULL,
            name        TEXT NOT NULL,
            username    TEXT NOT NULL,
            email       TEXT,
            phone       TEXT,
            notes       TEXT,
            status      TEXT NOT NULL DEFAULT 'pending',
            created_at  TEXT NOT NULL,
            reviewed_at TEXT,
            reviewed_by TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_reseller_req_user ON reseller_requests(user_id);
        CREATE INDEX IF NOT EXISTS idx_reseller_req_status ON reseller_requests(status);

        -- Histórico de Transferências de Créditos
        CREATE TABLE IF NOT EXISTS credit_transfers (
            id           TEXT PRIMARY KEY,
            from_user_id TEXT NOT NULL,
            to_user_id   TEXT NOT NULL,
            amount       INTEGER NOT NULL,
            created_at   TEXT NOT NULL,
            FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (to_user_id)   REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_credit_tr_from ON credit_transfers(from_user_id);
        CREATE INDEX IF NOT EXISTS idx_credit_tr_to   ON credit_transfers(to_user_id);
    `
};

const SCHEMA_VERSION = Math.max(...Object.keys(MIGRATIONS).map(Number));

/**
 * Aplica migrações pendentes em transação atômica.
 * @param {import('better-sqlite3').Database} sqliteDb
 */
function applyMigrations(sqliteDb) {
    // Garante que a tabela de versão existe antes de consultá-la
    sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS schema_version (
            version    INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        );
    `);

    const applied = sqliteDb
        .prepare('SELECT version FROM schema_version ORDER BY version')
        .all()
        .map(r => r.version);

    const pending = Object.keys(MIGRATIONS)
        .map(Number)
        .sort((a, b) => a - b)
        .filter(v => !applied.includes(v));

    if (pending.length === 0) return;

    for (const version of pending) {
        const run = sqliteDb.transaction(() => {
            sqliteDb.exec(MIGRATIONS[version]);
            sqliteDb
                .prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)')
                .run(version, new Date().toISOString());
        });
        run();
        console.log(`[DB] Migração v${version} aplicada.`);
    }
}

module.exports = { applyMigrations, SCHEMA_VERSION };
