/**
 * JstudioPlay Pro — Integration Hub
 *
 * Orquestrador central que coordena Ollama, pgvector e SearXNG.
 *
 * Pipelines:
 *  1. enrichPlaylistWithAI()   → Ollama classifica canais + indexa no pgvector
 *  2. discoverAndImport()      → SearXNG descobre fontes → scraper importa
 *  3. semanticChannelSearch()  → busca semântica via pgvector + Ollama
 *  4. getInfraStatus()         → health check de todos os serviços integrados
 */

const db          = require('../db/database');
const ollama      = require('./ollamaClient');
const vectorStore = require('./vectorStore');
const searxng     = require('./searxngClient');
const m3uScraper  = require('./m3uScraper');
const m3uParser   = require('./m3uParser');

// Limite de canais enriquecidos por execução (evitar sobrecarga do Ollama)
const AI_ENRICH_BATCH = parseInt(process.env.AI_ENRICH_BATCH || '50');

// ---------------------------------------------------------------------------
// Pipeline 1 — Enriquecimento AI de playlist
// ---------------------------------------------------------------------------

/**
 * Enriquece uma playlist com classificação AI (Ollama) e indexa no pgvector.
 * Processa até AI_ENRICH_BATCH canais por chamada.
 *
 * @returns {{ enriched, indexed, skipped, errors }}
 */
async function enrichPlaylistWithAI(playlistId) {
    const playlist = db.getPlaylistById(playlistId);
    if (!playlist) throw new Error('Playlist não encontrada.');

    const channels = db.getChannels(playlistId);
    const sample   = channels.slice(0, AI_ENRICH_BATCH);

    let enriched = 0, indexed = 0, skipped = 0, errors = 0;

    db.addLog('ai', `Iniciando enriquecimento AI: "${playlist.name}" (${sample.length} canais)`);

    for (const ch of sample) {
        try {
            // 1. Classificar com Ollama (categoria, idioma, qualidade)
            const aiMeta = await ollama.enrichChannelWithAI(ch);

            // 2. Atualizar grupo no banco se AI detectou categoria melhor
            if (aiMeta && aiMeta.category && ch.group === 'Geral') {
                db.updateChannels(playlistId, channels.map(c =>
                    c.id === ch.id ? { ...c, group: aiMeta.category } : c
                ));
                enriched++;
            }

            // 3. Indexar embedding no pgvector
            const ok = await vectorStore.indexChannel(
                { ...ch, playlistId },
                aiMeta || {}
            );
            if (ok) indexed++;
            else skipped++;

        } catch (e) {
            errors++;
            console.warn(`[IntegHub] Erro ao enriquecer canal "${ch.name}": ${e.message}`);
        }
    }

    db.addLog('ai', `Enriquecimento concluído: ${enriched} enriquecidos, ${indexed} indexados, ${errors} erros`);

    return { enriched, indexed, skipped, errors, total: sample.length };
}

// ---------------------------------------------------------------------------
// Pipeline 2 — Descoberta dinâmica de fontes via SearXNG
// ---------------------------------------------------------------------------

/**
 * Usa SearXNG para descobrir novas URLs M3U e importa as válidas como
 * playlists [Descoberta] no banco.
 *
 * @param {{ query, limit }} options
 * @returns {{ discovered, imported, failed }}
 */
async function discoverAndImport({ query = null, limit = 10 } = {}) {
    db.addLog('scraper', 'Descoberta dinâmica de fontes M3U via SearXNG iniciada');

    const urls = await searxng.discoverM3USources({ query, limit });
    let imported = 0, failed = 0;

    for (const url of urls) {
        // Ignorar URLs já importadas
        const existing = db.getPlaylists(null).find(p => p.url === url);
        if (existing) continue;

        try {
            const channels = await m3uParser.fetchFromUrl(url);
            if (!channels || channels.length < 3) { failed++; continue; }

            // Nome baseado no domínio da URL
            const domain = new URL(url).hostname.replace('www.', '').replace('raw.githubusercontent.com', 'GitHub');
            db.createPlaylist({
                userId:   null,
                name:     `[Descoberta] ${domain}`,
                url,
                channels,
                autoSync: true,
            });
            imported++;
            db.addLog('scraper', `Fonte descoberta importada: ${url} (${channels.length} canais)`);
        } catch (e) {
            failed++;
            console.warn(`[IntegHub] Falha ao importar ${url}: ${e.message}`);
        }
    }

    db.addLog('scraper', `Descoberta concluída: ${urls.length} URLs, ${imported} importadas, ${failed} falhas`);
    return { discovered: urls.length, imported, failed };
}

// ---------------------------------------------------------------------------
// Pipeline 3 — Busca semântica de canais
// ---------------------------------------------------------------------------

/**
 * Busca canais por linguagem natural usando pgvector + Ollama embeddings.
 *
 * @param {string} query       — ex: "canais de esportes HD em português"
 * @param {object} filters     — { streamType, status, limit }
 * @returns {Promise<Array>}
 */
async function semanticChannelSearch(query, { streamType = null, status = null, limit = 20 } = {}) {
    return vectorStore.semanticSearch(query, { limit, streamType, status });
}

// ---------------------------------------------------------------------------
// Pipeline 4 — Análise de relatório com Ollama
// ---------------------------------------------------------------------------

/**
 * Gera análise em linguagem natural do último relatório do scraper.
 */
async function analyzeLastScraperReport() {
    const status = m3uScraper.getStatus();
    if (!status.lastReport) return { analysis: 'Nenhum relatório disponível ainda.' };

    const analysis = await ollama.analyzeScraperReport(status.lastReport);
    return { analysis, reportDate: status.lastRunAt };
}

// ---------------------------------------------------------------------------
// Health check geral
// ---------------------------------------------------------------------------

async function getInfraStatus() {
    const [ollamaStatus, pgStatus, searxngStatus] = await Promise.allSettled([
        ollama.healthCheck(),
        vectorStore.healthCheck(),
        searxng.healthCheck(),
    ]);

    return {
        ollama:    ollamaStatus.status  === 'fulfilled' ? ollamaStatus.value  : { ok: false, error: ollamaStatus.reason?.message },
        pgvector:  pgStatus.status      === 'fulfilled' ? pgStatus.value      : { ok: false, error: pgStatus.reason?.message },
        searxng:   searxngStatus.status === 'fulfilled' ? searxngStatus.value : { ok: false, error: searxngStatus.reason?.message },
        scraper:   m3uScraper.getStatus(),
        timestamp: new Date().toISOString(),
    };
}

module.exports = {
    enrichPlaylistWithAI,
    discoverAndImport,
    semanticChannelSearch,
    analyzeLastScraperReport,
    getInfraStatus,
};
