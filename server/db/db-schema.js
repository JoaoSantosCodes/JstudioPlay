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
        CREATE INDEX IF NOT EXISTS idx_channels_pl_type_sort ON channels(playlist_id, stream_type, sort_order);
        CREATE INDEX IF NOT EXISTS idx_channels_pl_type_grp  ON channels(playlist_id, stream_type, grp);
        CREATE INDEX IF NOT EXISTS idx_channels_pl_sort      ON channels(playlist_id, sort_order);

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
    `,
    5: `
        -- Índices otimizados para filtragem de mídia (TV, Filmes, Séries) em playlists de grande porte
        CREATE INDEX IF NOT EXISTS idx_channels_playlist_stream_type ON channels(playlist_id, stream_type);
        CREATE INDEX IF NOT EXISTS idx_channels_playlist_type_grp    ON channels(playlist_id, stream_type, grp);
    `,
    6: (sqliteDb) => {
        // Evolução de Metadados Ricos (v8.0.0): capas HD, sinopse, avaliação, ano, gêneros e IDs canônicos
        const cols = sqliteDb.prepare('PRAGMA table_info(channels)').all().map(c => c.name);
        const addCol = (col, type) => {
            if (!cols.includes(col)) {
                sqliteDb.exec(`ALTER TABLE channels ADD COLUMN ${col} ${type}`);
            }
        };
        addCol('poster_url', 'TEXT');
        addCol('backdrop_url', 'TEXT');
        addCol('overview', 'TEXT');
        addCol('rating', 'REAL');
        addCol('year', 'INTEGER');
        addCol('genres', 'TEXT');
        addCol('tmdb_id', 'TEXT');
        addCol('enriched_at', 'TEXT');

        sqliteDb.exec(`
            CREATE INDEX IF NOT EXISTS idx_channels_enriched ON channels(playlist_id, stream_type, enriched_at);
            CREATE INDEX IF NOT EXISTS idx_channels_year     ON channels(playlist_id, stream_type, year);
            CREATE INDEX IF NOT EXISTS idx_channels_rating   ON channels(playlist_id, stream_type, rating);
        `);
    },
    7: (sqliteDb) => {
        // Sistema de Maratonas Narrativas & Sagas Cronológicas (v8.2.0)
        sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS marathons (
                id          TEXT PRIMARY KEY,
                title       TEXT NOT NULL,
                description TEXT,
                slug        TEXT UNIQUE NOT NULL,
                badge       TEXT DEFAULT 'MARATONA',
                cover_url   TEXT,
                is_curated  INTEGER NOT NULL DEFAULT 1,
                is_public   INTEGER NOT NULL DEFAULT 1,
                created_by  TEXT NOT NULL DEFAULT 'curator_system',
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_marathons_slug ON marathons(slug);
            CREATE INDEX IF NOT EXISTS idx_marathons_curated ON marathons(is_curated);

            CREATE TABLE IF NOT EXISTS marathon_items (
                id           TEXT PRIMARY KEY,
                marathon_id  TEXT NOT NULL,
                media_id     TEXT NOT NULL,
                title        TEXT NOT NULL,
                year         INTEGER,
                duration     TEXT,
                order_index  INTEGER NOT NULL CHECK (order_index > 0),
                notes        TEXT,
                stream_url   TEXT NOT NULL,
                poster_url   TEXT,
                backdrop_url TEXT,
                rating       TEXT DEFAULT '14+',
                created_at   TEXT NOT NULL,
                FOREIGN KEY (marathon_id) REFERENCES marathons(id) ON DELETE CASCADE,
                UNIQUE (marathon_id, order_index)
            );
            CREATE INDEX IF NOT EXISTS idx_marathon_items_order ON marathon_items(marathon_id, order_index ASC);
        `);

        // Seed de Maratonas Curadas Iniciais
        const now = new Date().toISOString();
        const insertMarathon = sqliteDb.prepare(`
            INSERT OR IGNORE INTO marathons (id, title, description, slug, badge, cover_url, is_curated, is_public, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, 1, 'curator_system', ?, ?)
        `);

        const insertItem = sqliteDb.prepare(`
            INSERT OR IGNORE INTO marathon_items (id, marathon_id, media_id, title, year, duration, order_index, notes, stream_url, poster_url, rating, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // 1. Maratona MCU WandaVision
        insertMarathon.run(
            'pl_wandavision_context',
            'Caminho até WandaVision',
            'Filmes essenciais para compreender a evolução psicológica, o relacionamento com Visão e as dores de Wanda Maximoff antes da série.',
            'caminho-ate-wandavision',
            'MARATONA MCU',
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
            now, now
        );

        insertItem.run('pi_wanda_01', 'pl_wandavision_context', 'm-ultron-2015', 'Vingadores: Era de Ultron', 2015, '2h 21min', 1, 'Introdução dos irmãos Wanda e Pietro Maximoff. Nascimento e primeiro contato com o Visão.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80', '12+', now);
        insertItem.run('pi_wanda_02', 'pl_wandavision_context', 'm-civilwar-2016', 'Capitão América: Guerra Civil', 2016, '2h 27min', 2, 'Desenvolvimento da cumplicidade entre Wanda e Visão em meio ao conflito dos Acordos de Sokovia.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=600&q=80', '12+', now);
        insertItem.run('pi_wanda_03', 'pl_wandavision_context', 'm-infinitywar-2018', 'Vingadores: Guerra Infinita', 2018, '2h 29min', 3, 'Ponto crítico: romance isolado na Escócia e a dolorosa perda definitiva de Visão pela Joia da Mente.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80', '12+', now);
        insertItem.run('pi_wanda_04', 'pl_wandavision_context', 'm-endgame-2019', 'Vingadores: Ultimato', 2019, '3h 01min', 4, 'Consequências emocionais para Wanda após o estalo, o confronto furioso com Thanos e o luto.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80', '12+', now);
        insertItem.run('pi_wanda_05', 'pl_wandavision_context', 'm-wandavision-2021', 'WandaVision (Série)', 2021, '1 Temporada (9 Eps)', 5, 'A série principal: a anomalia de Westview e a transformação definitiva na Feiticeira Escarlate.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80', '14+', now);

        // 2. Maratona Terror Clássico (com streams do YouTube)
        insertMarathon.run(
            'pl_terror_classico',
            'Clássicos do Cinema & Terror',
            'Obras seminais e atemporais do terror que revolucionaram o cinema moderno.',
            'classicos-terror',
            'CULTO & TERROR',
            'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
            now, now
        );

        insertItem.run('pi_t1', 'pl_terror_classico', 'mov_terror_02', 'Nosferatu', 1922, '1h 34min', 1, 'O clássico do expressionismo alemão que definiu os vampiros no cinema.', 'https://www.youtube.com/watch?v=FC6jFoYm3xs', 'https://image.tmdb.org/t/p/w500/lP9tCgG7pZ5Xo3xT0bV7Ww0Bw8q.jpg', '14+', now);
        insertItem.run('pi_t2', 'pl_terror_classico', 'mov_terror_01', 'A Noite dos Mortos-Vivos', 1968, '1h 36min', 2, 'George Romero cria a base do terror zumbi moderno.', 'https://www.youtube.com/watch?v=wXWbM13mH60', 'https://image.tmdb.org/t/p/w500/koxk4W9RzIffjXk8W8F77B0aHwG.jpg', '16+', now);
    },
    8: (sqliteDb) => {
        // Controle de Visibilidade de Playlists (Ocultar por padrão e habilitar sob demanda)
        const cols = sqliteDb.prepare('PRAGMA table_info(playlists)').all().map(c => c.name);
        if (!cols.includes('is_enabled')) {
            sqliteDb.exec('ALTER TABLE playlists ADD COLUMN is_enabled INTEGER NOT NULL DEFAULT 0');
        }
        sqliteDb.exec(`
            UPDATE playlists SET is_enabled = 0;
            UPDATE playlists SET is_enabled = 1 WHERE name LIKE '%TurboX%';
            CREATE INDEX IF NOT EXISTS idx_playlists_enabled ON playlists(is_enabled);
        `);
    }
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
            if (typeof MIGRATIONS[version] === 'function') {
                MIGRATIONS[version](sqliteDb);
            } else {
                sqliteDb.exec(MIGRATIONS[version]);
            }
            sqliteDb
                .prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)')
                .run(version, new Date().toISOString());
        });
        run();
        console.log(`[DB] Migração v${version} aplicada.`);
    }
}

module.exports = { applyMigrations, SCHEMA_VERSION };
