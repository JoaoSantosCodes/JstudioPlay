/**
 * JstudioPlay Pro — Migração db.json → SQLite
 *
 * Executado automaticamente na startup se db.json existir.
 * Idempotente: verifica se já foi migrado antes de re-executar.
 * Preserva db.json como backup (db.json.migrated).
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR   = path.join(__dirname, '..', '..', 'data');
const JSON_FILE  = path.join(DATA_DIR, 'db.json');
const DONE_FLAG  = path.join(DATA_DIR, '.migrated_to_sqlite');

/**
 * @param {import('better-sqlite3').Database} sqliteDb
 * @returns {boolean} true se migrou, false se já estava migrado ou sem dados
 */
function migrateIfNeeded(sqliteDb) {
    // Já foi migrado antes
    if (fs.existsSync(DONE_FLAG)) return false;

    // Sem JSON para migrar
    if (!fs.existsSync(JSON_FILE)) {
        // Marca como "não há nada para migrar"
        fs.writeFileSync(DONE_FLAG, new Date().toISOString(), 'utf8');
        return false;
    }

    let data;
    try {
        data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    } catch (e) {
        console.error('[Migrate] db.json inválido, ignorando migração:', e.message);
        return false;
    }

    console.log('[Migrate] Iniciando migração db.json → SQLite...');

    const migrate = sqliteDb.transaction(() => {
        // ----- SETTINGS -----
        const settings = data.settings || {};
        const upsertSetting = sqliteDb.prepare(
            'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'
        );
        for (const [k, v] of Object.entries(settings)) {
            upsertSetting.run(k, v === null || v === undefined ? '' : String(v));
        }

        // ----- USERS -----
        const upsertUser = sqliteDb.prepare(`
            INSERT OR REPLACE INTO users
              (id, name, username, email, google_id, avatar,
               password_hash, password_algo, role, theme,
               blocked, expires_at, created_at, last_login_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `);
        const insertAccess = sqliteDb.prepare(
            'INSERT OR IGNORE INTO user_playlist_access (user_id, playlist_id) VALUES (?,?)'
        );
        for (const u of (data.users || [])) {
            upsertUser.run(
                u.id,
                u.name || u.username || 'Usuário',
                u.username || u.email || u.id,
                u.email || null,
                u.googleId || null,
                u.avatar || null,
                u.passwordHash || '',
                u.passwordHashAlgo || 'sha256',
                u.role || 'user',
                u.theme || 'dark',
                u.blocked ? 1 : 0,
                u.expiresAt || null,
                u.createdAt || new Date().toISOString(),
                u.lastLoginAt || null
            );
            for (const pid of (u.assignedPlaylists || [])) {
                try { insertAccess.run(u.id, pid); } catch {}
            }
        }

        // ----- PLAYLISTS -----
        const upsertPlaylist = sqliteDb.prepare(`
            INSERT OR REPLACE INTO playlists
              (id, user_id, name, url, total, live, vod, series,
               online_count, categories, check_status, last_checked,
               auto_sync, updated, created)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `);
        for (const p of (data.playlists || [])) {
            upsertPlaylist.run(
                p.id, p.userId || null, p.name || 'Playlist',
                p.url || '', p.total || 0, p.live || 0,
                p.vod || 0, p.series || 0, p.onlineCount || 0,
                p.categories || 0, p.checkStatus || 'idle',
                p.lastChecked || null, p.autoSync !== false ? 1 : 0,
                p.updated || new Date().toISOString(),
                p.created || new Date().toISOString()
            );
        }

        // ----- CHANNELS -----
        const upsertChannel = sqliteDb.prepare(`
            INSERT OR REPLACE INTO channels
              (id, playlist_id, name, raw_name, tvg_id, tvg_name, logo,
               grp, chno, stream_type, url, user_agent,
               status, latency, last_checked, sort_order)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `);
        for (const [playlistId, chList] of Object.entries(data.channels || {})) {
            const channels = Array.isArray(chList) ? chList : [];
            channels.forEach((ch, i) => {
                const chId = ch.id || `ch_${playlistId}_${i}`;
                upsertChannel.run(
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

        // ----- FAVORITES -----
        const insertFav = sqliteDb.prepare(`
            INSERT OR IGNORE INTO favorites
              (user_id, playlist_id, ch_id, ch_name, ch_group, ch_logo, ch_url, added_at)
            VALUES (?,?,?,?,?,?,?,?)
        `);
        for (const [userId, favs] of Object.entries(data.favorites || {})) {
            for (const f of (Array.isArray(favs) ? favs : [])) {
                const ch = f.channel || f;
                insertFav.run(
                    userId, f.playlistId || 'default',
                    ch.id || null, ch.name || '',
                    ch.group || 'Geral', ch.logo || '',
                    ch.url || '', f.addedAt || new Date().toISOString()
                );
            }
        }

        // ----- HISTORY -----
        const insertHist = sqliteDb.prepare(`
            INSERT OR IGNORE INTO history
              (user_id, playlist_id, ch_id, ch_name, ch_group, ch_logo, ch_url, watched_at)
            VALUES (?,?,?,?,?,?,?,?)
        `);
        for (const [userId, hist] of Object.entries(data.history || {})) {
            for (const h of (Array.isArray(hist) ? hist : [])) {
                const ch = h.channel || h;
                insertHist.run(
                    userId, h.playlistId || 'default',
                    ch.id || null, ch.name || '',
                    ch.group || 'Geral', ch.logo || '',
                    ch.url || '', h.at || h.timestamp || new Date().toISOString()
                );
            }
        }

        // ----- PROGRESS -----
        const upsertProgress = sqliteDb.prepare(`
            INSERT OR REPLACE INTO progress
              (user_id, playlist_id, ch_name, ch_group, ch_logo, ch_url,
               position, duration, percent, updated)
            VALUES (?,?,?,?,?,?,?,?,?,?)
        `);
        for (const [userId, progs] of Object.entries(data.progress || {})) {
            for (const p of (Array.isArray(progs) ? progs : [])) {
                const ch = p.channel || p;
                const pos = Number(p.position || 0);
                const dur = Number(p.duration || 1);
                upsertProgress.run(
                    userId, p.playlistId || 'default',
                    ch.name || '', ch.group || 'Geral',
                    ch.logo || '', ch.url || '',
                    pos, dur,
                    Math.min(100, (pos / dur) * 100),
                    p.updated || p.updatedAt || new Date().toISOString()
                );
            }
        }

        // ----- LOGS -----
        const insertLog = sqliteDb.prepare(`
            INSERT OR IGNORE INTO logs (id, type, username, action, at)
            VALUES (?,?,?,?,?)
        `);
        for (const l of (data.logs || [])) {
            insertLog.run(
                l.id || ('log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
                l.type || 'system',
                l.user || 'Sistema',
                l.action || l.message || '',
                l.at || l.timestamp || new Date().toISOString()
            );
        }
    });

    migrate();

    // Backup do JSON original
    try {
        fs.renameSync(JSON_FILE, JSON_FILE + '.migrated');
        console.log('[Migrate] db.json preservado como db.json.migrated');
    } catch {}

    fs.writeFileSync(DONE_FLAG, new Date().toISOString(), 'utf8');
    console.log('[Migrate] Migração concluída com sucesso.');
    return true;
}

module.exports = { migrateIfNeeded };
