/**
 * JstudioPlay Pro — Ollama Client
 *
 * Integra com mcp_ollama (hermes3:latest + nomic-embed-text:latest)
 * na mcp-network via http://mcp_ollama:11434
 *
 * Funções:
 *  - enrichChannelWithAI()   → classifica categoria, idioma e qualidade
 *  - generateEmbedding()     → embedding 768d via nomic-embed-text
 *  - analyzeScraperReport()  → resumo em linguagem natural do relatório do scraper
 */

const axios = require('axios');

const OLLAMA_URL  = process.env.OLLAMA_URL  || 'http://mcp_ollama:11434';
const LLM_MODEL   = process.env.OLLAMA_LLM_MODEL   || 'hermes3:latest';
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL  || 'nomic-embed-text:latest';

// Timeout generoso — LLM local pode ser lento no primeiro cold start
const LLM_TIMEOUT   = 30_000;
const EMBED_TIMEOUT = 10_000;

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

async function chatCompletion(systemPrompt, userContent, options = {}) {
    const resp = await axios.post(
        `${OLLAMA_URL}/api/chat`,
        {
            model:    options.model || LLM_MODEL,
            stream:   false,
            options:  { temperature: 0.1, num_predict: options.maxTokens || 200 },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user',   content: userContent  },
            ],
        },
        { timeout: options.timeout || LLM_TIMEOUT }
    );
    return resp.data.message?.content?.trim() || '';
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Classifica um canal IPTV usando o LLM local.
 * Retorna { category, language, quality, confidence }
 * Rápido: instrui o modelo a responder só JSON em 1 linha.
 */
async function enrichChannelWithAI(channel) {
    const systemPrompt = `You are an IPTV channel classifier. 
Respond with ONLY a single JSON object, no explanation.
Fields: category (string), language (2-letter ISO code), quality ("HD"|"SD"|"4K"|"unknown"), confidence (0-1).`;

    const userContent = `Channel name: "${channel.name}"
Group: "${channel.group || ''}"
URL hint: "${(channel.url || '').slice(-30)}"`;

    try {
        const raw = await chatCompletion(systemPrompt, userContent, { maxTokens: 80, timeout: 15_000 });
        // Extrair JSON da resposta (pode vir com markdown)
        const match = raw.match(/\{[^}]+\}/);
        if (!match) return null;
        return JSON.parse(match[0]);
    } catch {
        return null;
    }
}

/**
 * Gera embedding 768d para um texto usando nomic-embed-text.
 * Usado pelo vectorStore para busca semântica de canais.
 */
async function generateEmbedding(text) {
    const resp = await axios.post(
        `${OLLAMA_URL}/api/embeddings`,
        { model: EMBED_MODEL, prompt: text },
        { timeout: EMBED_TIMEOUT }
    );
    return resp.data.embedding; // float[]
}

/**
 * Gera um resumo em português do relatório do scraper diário.
 * Retorna string com análise e recomendações.
 */
async function analyzeScraperReport(report) {
    const systemPrompt = `Você é um analista de operações de streaming IPTV. 
Analise o relatório de raspagem e escreva um resumo executivo em português em até 3 parágrafos.
Destaque fontes com erro, canais coletados e recomendações de ação.`;

    const userContent = JSON.stringify({
        sources:       report.sourcesTotal,
        imported:      report.imported,
        skipped:       report.skipped,
        errors:        report.errors,
        channelsTotal: report.channelsTotal,
        duration:      report.durationSeconds + 's',
        failedSources: (report.sources || []).filter(s => s.status === 'error').map(s => ({ name: s.name, error: s.error })),
    });

    try {
        return await chatCompletion(systemPrompt, userContent, { maxTokens: 400, timeout: 25_000 });
    } catch (e) {
        return `Análise indisponível: ${e.message}`;
    }
}

/**
 * Verifica se o Ollama está acessível.
 */
async function healthCheck() {
    try {
        const resp = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5_000 });
        const models = resp.data.models?.map(m => m.name) || [];
        return { ok: true, models };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

module.exports = { enrichChannelWithAI, generateEmbedding, analyzeScraperReport, healthCheck };
