/**
 * JstudioPlay Pro — SearXNG Client
 *
 * Usa o mcp_searxng (http://mcp_searxng:8080) para descoberta
 * dinâmica de novas fontes M3U públicas na internet.
 *
 * Funções:
 *  - discoverM3USources()  → busca URLs de listas M3U públicas
 *  - searchChannelLogo()   → busca logo de canal pelo nome
 */

const axios = require('axios');

const SEARXNG_URL = process.env.SEARXNG_URL || 'http://mcp_searxng:8080';
const TIMEOUT_MS  = 12_000;

// Queries que produzem bons resultados de fontes M3U públicas
const M3U_DISCOVERY_QUERIES = [
    'site:github.com iptv m3u brazil playlist filetype:m3u',
    'site:github.com iptv brazil m3u8 channels free',
    'iptv m3u brazil free playlist 2026 github',
    'lista iptv m3u brasil canais abertos gratis',
    'iptv-org brazil channels m3u github raw',
];

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

async function searchJSON(query, categories = 'general', pages = 1) {
    try {
        const resp = await axios.get(`${SEARXNG_URL}/search`, {
            params:  { q: query, format: 'json', categories, pageno: pages },
            timeout: TIMEOUT_MS,
            headers: { 'Accept': 'application/json', 'User-Agent': 'JstudioPlayBot/1.0' },
        });
        return resp.data.results || [];
    } catch (e) {
        console.warn(`[SearXNG] Erro na busca "${query}": ${e.message}`);
        return [];
    }
}

function extractM3ULinks(results) {
    const m3uPattern = /https?:\/\/[^\s"'<>]+\.m3u8?(\?[^\s"'<>]*)?/gi;
    const rawUrls    = /https?:\/\/raw\.githubusercontent\.com\/[^\s"'<>]+/gi;

    const found = new Set();

    for (const r of results) {
        const text = [r.url || '', r.title || '', r.content || ''].join(' ');

        // Links diretos .m3u/.m3u8
        const direct = text.match(m3uPattern) || [];
        direct.forEach(u => found.add(u));

        // Raw GitHub (pode não ter extensão mas ser M3U)
        const raw = text.match(rawUrls) || [];
        raw.filter(u => u.includes('.m3u') || u.includes('playlist') || u.includes('iptv'))
           .forEach(u => found.add(u));

        // URL do resultado que parece ser M3U
        if (r.url && (r.url.includes('.m3u') || r.url.includes('raw.github'))) {
            found.add(r.url);
        }
    }

    return [...found].filter(u => u.startsWith('http'));
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Descobre URLs de listas M3U públicas via SearXNG.
 * @param {object} options
 * @param {string} options.query  — query customizada (opcional)
 * @param {number} options.limit  — máximo de URLs únicas (default 20)
 * @returns {Promise<string[]>}
 */
async function discoverM3USources({ query = null, limit = 20 } = {}) {
    const queries = query ? [query] : M3U_DISCOVERY_QUERIES;
    const allUrls = new Set();

    for (const q of queries) {
        if (allUrls.size >= limit) break;
        const results = await searchJSON(q);
        const urls    = extractM3ULinks(results);
        urls.forEach(u => allUrls.add(u));
    }

    return [...allUrls].slice(0, limit);
}

/**
 * Busca a URL de logo de um canal pelo nome.
 * Retorna a primeira URL de imagem encontrada ou null.
 */
async function searchChannelLogo(channelName) {
    try {
        const results = await searchJSON(
            `${channelName} tv channel logo png transparent`,
            'images'
        );
        // Pegar primeiro resultado com URL de imagem direta
        const img = results.find(r => r.img_src && /\.(png|jpg|jpeg|svg|webp)/i.test(r.img_src));
        return img?.img_src || null;
    } catch {
        return null;
    }
}

/**
 * Verifica se o SearXNG está acessível.
 */
async function healthCheck() {
    try {
        const results = await searchJSON('test', 'general');
        return { ok: true, resultsReturned: results.length };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

module.exports = { discoverM3USources, searchChannelLogo, healthCheck };
