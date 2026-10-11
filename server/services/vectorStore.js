/**
 * JstudioPlay Pro — Vector Store (pgvector)
 *
 * Persiste embeddings de canais no banco mcp_knowledge (mcp_postgres_vector)
 * na tabela documentos_vetores (embedding_768 vector(768)).
 *
 * Permite busca semântica: "canais de esportes HD em português"
 */

const { Pool } = require('pg');
const ollama   = require('./ollamaClient');

const pool = new Pool({
    host:     process.env.PGVECTOR_HOST     || 'mcp_postgres_vector',
    port:     parseInt(process.env.PGVECTOR_PORT || '5432'),
    database: process.env.PGVECTOR_DB       || 'mcp_knowledge',
    user:     process.env.PGVECTOR_USER     || 'postgres',
    password: process.env.PGVECTOR_PASSWORD || 'postgres',
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});

// ---------------------------------------------------------------------------
// Schema helpers
// ---------------------------------------------------------------------------

async function ensureTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS jstudioplay_channels (
            id           TEXT PRIMARY KEY,
            playlist_id  TEXT NOT NULL,
            name         TEXT NOT NULL,
            grp          TEXT,
            logo         TEXT,
            url          TEXT,
            stream_type  TEXT,
            status       TEXT,
            latency      INTEGER,
            ai_category  TEXT,
            ai_language  TEXT,
            ai_quality   TEXT,
            embedding    vector(768),
            updated_at   TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_jstudio_ch_embedding
            ON jstudioplay_channels USING hnsw (embedding vector_cosine_ops);
        CREATE INDEX IF NOT EXISTS idx_jstudio_ch_playlist
            ON jstudioplay_channels (playlist_id);
    `);
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Indexa um canal: gera embedding e persiste no pgvector.
 * Faz UPSERT — safe para re-indexar.
 */
async function indexChannel(channel, aiMeta = {}) {
    const text = [
        channel.name,
        channel.group || '',
        aiMeta.category || '',
        aiMeta.language || '',
        aiMeta.quality  || '',
    ].filter(Boolean).join(' ');

    const embedding = await ollama.generateEmbedding(text);
    if (!embedding) return false;

    await ensureTable();

    await pool.query(
        `INSERT INTO jstudioplay_channels
           (id, playlist_id, name, grp, logo, url, stream_type, status,
            latency, ai_category, ai_language, ai_quality, embedding, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::vector,NOW())
         ON CONFLICT (id) DO UPDATE SET
           name=$3, grp=$4, logo=$5, url=$6, stream_type=$7, status=$8,
           latency=$9, ai_category=$10, ai_language=$11, ai_quality=$12,
           embedding=$13::vector, updated_at=NOW()`,
        [
            channel.id,
            channel.playlistId || channel.playlist_id || 'unknown',
            channel.name,
            channel.group  || null,
            channel.logo   || null,
            channel.url    || null,
            channel.streamType || 'live',
            channel.status || 'unknown',
            channel.latency || null,
            aiMeta.category || null,
            aiMeta.language || null,
            aiMeta.quality  || null,
            JSON.stringify(embedding),
        ]
    );
    return true;
}

/**
 * Busca semântica: recebe query em linguagem natural,
 * gera embedding e retorna os N canais mais próximos.
 */
async function semanticSearch(query, { limit = 10, streamType = null, status = null } = {}) {
    await ensureTable();

    const embedding = await ollama.generateEmbedding(query);
    if (!embedding) return [];

    const conditions = ['embedding IS NOT NULL'];
    const params     = [JSON.stringify(embedding), limit];
    let   paramIdx   = 3;

    if (streamType) { conditions.push(`stream_type = $${paramIdx++}`); params.push(streamType); }
    if (status)     { conditions.push(`status = $${paramIdx++}`);      params.push(status); }

    const where = conditions.join(' AND ');

    const result = await pool.query(
        `SELECT id, playlist_id, name, grp, logo, url, stream_type,
                status, latency, ai_category, ai_language, ai_quality,
                1 - (embedding <=> $1::vector) AS similarity
         FROM jstudioplay_channels
         WHERE ${where}
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        params
    );

    return result.rows;
}

/**
 * Conta total de canais indexados.
 */
async function countIndexed() {
    await ensureTable();
    const r = await pool.query('SELECT COUNT(*) AS n FROM jstudioplay_channels');
    return parseInt(r.rows[0].n);
}

/**
 * Remove todos os registros de uma playlist (ao deletar playlist).
 */
async function removePlaylist(playlistId) {
    await ensureTable();
    const r = await pool.query(
        'DELETE FROM jstudioplay_channels WHERE playlist_id = $1',
        [playlistId]
    );
    return r.rowCount;
}

/**
 * Verifica conexão com pgvector.
 */
async function healthCheck() {
    try {
        const r = await pool.query('SELECT 1');
        const count = await countIndexed();
        return { ok: true, indexedChannels: count };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

module.exports = { indexChannel, semanticSearch, countIndexed, removePlaylist, healthCheck };
