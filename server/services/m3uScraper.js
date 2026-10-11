/**
 * JstudioPlay Pro — M3U Daily Scraper
 *
 * Raspa fontes públicas confiáveis de listas M3U diariamente,
 * valida os streams encontrados e os importa automaticamente
 * como playlists gerenciadas no banco de dados.
 *
 * Fontes usadas:
 *  - iptv-org/iptv (GitHub) — maior repositório público de IPTV livre
 *  - Free-TV/FreeTv (GitHub) — agregador curado com foco em gratuito/legal
 *  - iptv-org/iptv por categoria — news, sports, kids, music, etc.
 */

const axios  = require('axios');
const db     = require('../db/database');
const parser = require('./m3uParser');
const checker = require('./streamChecker');

// ---------------------------------------------------------------------------
// Catálogo de fontes públicas — URLs estáveis e bem mantidas
// ---------------------------------------------------------------------------
const SCRAPE_SOURCES = [
    // ── Brasil ──────────────────────────────────────────────────────────────
    {
        id:       'iptv_org_br',
        name:     '🇧🇷 IPTV-Org · Brasil Completo',
        url:      'https://iptv-org.github.io/iptv/countries/br.m3u',
        category: 'TV Aberta',
        priority: 1,
        enabled:  true,
    },
    {
        id:       'freetv_br',
        name:     '🇧🇷 FreeTv · Brasil Grátis',
        url:      'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_brazil.m3u8',
        category: 'TV Aberta',
        priority: 1,
        enabled:  true,
    },
    // ── Categorias globais ───────────────────────────────────────────────────
    {
        id:       'iptv_org_news',
        name:     '📰 IPTV-Org · Notícias Mundiais',
        url:      'https://iptv-org.github.io/iptv/categories/news.m3u',
        category: 'Notícias',
        priority: 2,
        enabled:  true,
    },
    {
        id:       'iptv_org_sports',
        name:     '⚽ IPTV-Org · Esportes',
        url:      'https://iptv-org.github.io/iptv/categories/sports.m3u',
        category: 'Esportes',
        priority: 2,
        enabled:  true,
    },
    {
        id:       'iptv_org_kids',
        name:     '👶 IPTV-Org · Infantil',
        url:      'https://iptv-org.github.io/iptv/categories/kids.m3u',
        category: 'Infantil',
        priority: 2,
        enabled:  true,
    },
    {
        id:       'iptv_org_music',
        name:     '🎵 IPTV-Org · Música',
        url:      'https://iptv-org.github.io/iptv/categories/music.m3u',
        category: 'Música',
        priority: 2,
        enabled:  true,
    },
    {
        id:       'iptv_org_documentary',
        name:     '🌿 IPTV-Org · Documentários',
        url:      'https://iptv-org.github.io/iptv/categories/documentary.m3u',
        category: 'Documentários',
        priority: 3,
        enabled:  true,
    },
    {
        id:       'iptv_org_entertainment',
        name:     '🎪 IPTV-Org · Entretenimento',
        url:      'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
        category: 'Entretenimento',
        priority: 3,
        enabled:  true,
    },
    {
        id:       'iptv_org_movies',
        name:     '🎬 IPTV-Org · Filmes',
        url:      'https://iptv-org.github.io/iptv/categories/movies.m3u',
        category: 'Filmes',
        priority: 3,
        enabled:  true,
    },
    {
        id:       'iptv_org_relax',
        name:     '✨ IPTV-Org · Relax & 4K',
        url:      'https://iptv-org.github.io/iptv/categories/relax.m3u',
        category: 'Relax & 4K',
        priority: 3,
        enabled:  true,
    },
    // ── Lusofonia ────────────────────────────────────────────────────────────
    {
        id:       'iptv_org_portuguese',
        name:     '🌍 IPTV-Org · Português Global',
        url:      'https://iptv-org.github.io/iptv/languages/por.m3u',
        category: 'Internacional',
        priority: 2,
        enabled:  true,
    },
];

// ---------------------------------------------------------------------------
// Configurações de comportamento
// ---------------------------------------------------------------------------
const SCRAPE_CONFIG = {
    // Quantos canais testar por playlist para validar se a fonte está ativa
    // (não testa tudo — só uma amostra para agilizar)
    validationSampleSize: 20,
    // Timeout por requisição HTTP (ms)
    fetchTimeoutMs: 30_000,
    // Timeout por probe de stream (ms)
    probeTimeoutMs:  4_000,
    // Mínimo de canais válidos para aceitar uma fonte
    minChannelsToAccept: 5,
    // ID do usuário "sistema" que será dono das playlists raspadas
    // null = sem dono (admin pode ver tudo)
    ownerUserId: null,
    // Prefixo no nome para identificar playlists gerenciadas pelo scraper
    playlistPrefix: '[Auto]',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Baixa e parseia um M3U remoto com timeout e tratamento de erro.
 * @returns {Promise<{channels: Array, error: string|null}>}
 */
async function fetchSource(source) {
    try {
        const resp = await axios.get(source.url, {
            timeout: SCRAPE_CONFIG.fetchTimeoutMs,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (compatible; JstudioPlayBot/1.0; +https://github.com/JoaoSantosCodes/JstudioPlay)',
                Accept: '*/*',
            },
            maxContentLength: 150 * 1024 * 1024, // 150 MB
        });

        const channels = parser.parse(resp.data, true /* autoEnrich */);
        return { channels, error: null };
    } catch (err) {
        return { channels: [], error: err.message };
    }
}

/**
 * Valida uma amostra de canais via HEAD/GET rápido.
 * Retorna { online, offline, sample } sem gravar no banco.
 */
async function probeChannelSample(channels, sampleSize) {
    const sample = channels.slice(0, sampleSize);
    let online = 0;
    let offline = 0;

    await Promise.all(
        sample.map(async (ch) => {
            try {
                const resp = await axios.head(ch.url, {
                    timeout: SCRAPE_CONFIG.probeTimeoutMs,
                    validateStatus: () => true,
                    headers: { 'User-Agent': 'VLC/3.0.20 LibVLC/3.0.20' },
                });
                const ok = resp.status >= 200 && resp.status < 400;
                ch.status  = ok ? 'online' : 'offline';
                ch.latency = ok ? 0 : null;
                if (ok) online++; else offline++;
            } catch {
                ch.status = 'offline';
                offline++;
            }
        })
    );

    return { online, offline, total: sample.length };
}

/**
 * Retorna o nome da playlist gerenciada para uma fonte.
 */
function managedPlaylistName(source) {
    return `${SCRAPE_CONFIG.playlistPrefix} ${source.name}`;
}

/**
 * Encontra ou cria a playlist gerenciada para uma fonte.
 * Sempre substitui os canais pelos recém-raspados.
 */
function upsertManagedPlaylist(source, channels) {
    const name = managedPlaylistName(source);

    // Procura playlist existente com esse nome
    const all = db.getPlaylists(null);
    const existing = all.find((p) => p.name === name);

    if (existing) {
        db.saveChannels(existing.id, channels);
        db.updatePlaylist(existing.id, {
            url:         source.url,
            lastChecked: new Date().toISOString(),
            checkStatus: 'completed',
        });
        return { playlist: db.getPlaylistById(existing.id), isNew: false };
    }

    const playlist = db.createPlaylist({
        userId:   SCRAPE_CONFIG.ownerUserId,
        name,
        url:      source.url,
        channels,
        autoSync: true,
    });

    return { playlist, isNew: true };
}

// ---------------------------------------------------------------------------
// Classe principal
// ---------------------------------------------------------------------------

class M3UScraper {
    constructor() {
        this.isRunning   = false;
        this.lastRunAt   = null;
        this.lastReport  = null;    // resultado do último scrape completo
    }

    /**
     * Retorna o catálogo de fontes (para a rota GET /scraper/sources).
     */
    getSources() {
        return SCRAPE_SOURCES.map((s) => ({
            id:       s.id,
            name:     s.name,
            category: s.category,
            url:      s.url,
            priority: s.priority,
            enabled:  s.enabled,
        }));
    }

    /**
     * Ativa ou desativa uma fonte pelo id.
     */
    toggleSource(id, enabled) {
        const src = SCRAPE_SOURCES.find((s) => s.id === id);
        if (!src) throw new Error(`Fonte "${id}" não encontrada.`);
        src.enabled = !!enabled;
        return src;
    }

    /**
     * Executa o scrape completo de todas as fontes habilitadas.
     * Pode ser chamado via cron (diário) ou manualmente via rota POST.
     *
     * @param {object} options
     * @param {boolean} options.validateSample  - Fazer probe de amostra antes de importar (default: true)
     * @param {string[]} options.sourceIds      - Limitar a fontes específicas (default: todas habilitadas)
     * @returns {Promise<ScrapeReport>}
     */
    async run({ validateSample = true, sourceIds = null } = {}) {
        if (this.isRunning) {
            return { alreadyRunning: true, message: 'Scraper já está em execução.' };
        }

        this.isRunning = true;
        const startedAt = new Date();
        db.addLog('scraper', 'Raspagem diária de listas M3U iniciada.');

        const sources = SCRAPE_SOURCES.filter(
            (s) => s.enabled && (!sourceIds || sourceIds.includes(s.id))
        );

        // Ordenar por prioridade (1 = mais urgente)
        sources.sort((a, b) => a.priority - b.priority);

        const results = [];
        let totalImported   = 0;
        let totalChannels   = 0;
        let totalOnline     = 0;
        let totalSkipped    = 0;
        let totalErrors     = 0;

        for (const source of sources) {
            const srcResult = {
                id:       source.id,
                name:     source.name,
                url:      source.url,
                status:   'pending',
                channels: 0,
                online:   0,
                offline:  0,
                isNew:    false,
                error:    null,
            };

            try {
                // 1. Baixar e parsear
                console.log(`[Scraper] Buscando: ${source.name} ...`);
                const { channels, error } = await fetchSource(source);

                if (error) {
                    srcResult.status = 'error';
                    srcResult.error  = error;
                    totalErrors++;
                    results.push(srcResult);
                    db.addLog('scraper', `Erro ao buscar "${source.name}": ${error}`);
                    continue;
                }

                if (channels.length < SCRAPE_CONFIG.minChannelsToAccept) {
                    srcResult.status = 'skipped';
                    srcResult.error  = `Apenas ${channels.length} canais encontrados (mínimo: ${SCRAPE_CONFIG.minChannelsToAccept})`;
                    totalSkipped++;
                    results.push(srcResult);
                    db.addLog('scraper', `"${source.name}" ignorada: poucos canais (${channels.length}).`);
                    continue;
                }

                // 2. Validar amostra (opcional mas recomendado)
                if (validateSample) {
                    const probe = await probeChannelSample(channels, SCRAPE_CONFIG.validationSampleSize);
                    srcResult.online  = probe.online;
                    srcResult.offline = probe.offline;
                    totalOnline += probe.online;

                    // Se todos na amostra estão offline, descarta a fonte
                    if (probe.online === 0 && probe.total >= 5) {
                        srcResult.status = 'skipped';
                        srcResult.error  = `Amostra de ${probe.total} canais: 100% offline. Fonte descartada.`;
                        totalSkipped++;
                        results.push(srcResult);
                        db.addLog('scraper', `"${source.name}" descartada: amostra completamente offline.`);
                        continue;
                    }
                }

                // 3. Deduplicar por URL dentro da fonte
                const seenUrls = new Set();
                const deduped  = channels.filter((ch) => {
                    const key = (ch.url || '').trim().toLowerCase();
                    if (!key || seenUrls.has(key)) return false;
                    seenUrls.add(key);
                    return true;
                });

                // 4. Salvar/atualizar playlist gerenciada
                const { playlist, isNew } = upsertManagedPlaylist(source, deduped);

                srcResult.status   = 'imported';
                srcResult.channels = deduped.length;
                srcResult.isNew    = isNew;
                totalImported++;
                totalChannels += deduped.length;

                db.addLog(
                    'scraper',
                    `"${source.name}" ${isNew ? 'importada' : 'atualizada'}: ${deduped.length} canais.`
                );
                console.log(
                    `[Scraper] ✅ ${source.name} — ${deduped.length} canais (${isNew ? 'nova' : 'atualizada'})`
                );
            } catch (err) {
                srcResult.status = 'error';
                srcResult.error  = err.message;
                totalErrors++;
                db.addLog('scraper', `Exceção em "${source.name}": ${err.message}`);
                console.error(`[Scraper] ❌ ${source.name}:`, err.message);
            }

            results.push(srcResult);
        }

        const finishedAt  = new Date();
        const durationSec = ((finishedAt - startedAt) / 1000).toFixed(1);

        const report = {
            startedAt:      startedAt.toISOString(),
            finishedAt:     finishedAt.toISOString(),
            durationSeconds: Number(durationSec),
            sourcesTotal:   sources.length,
            imported:       totalImported,
            skipped:        totalSkipped,
            errors:         totalErrors,
            channelsTotal:  totalChannels,
            onlineSampled:  totalOnline,
            sources:        results,
        };

        this.lastRunAt  = finishedAt;
        this.lastReport = report;
        this.isRunning  = false;

        db.addLog(
            'scraper',
            `Raspagem concluída em ${durationSec}s: ${totalImported} fontes importadas, ` +
            `${totalChannels} canais, ${totalErrors} erros.`
        );

        return report;
    }

    /**
     * Status rápido para a rota GET /scraper/status.
     */
    getStatus() {
        return {
            isRunning:  this.isRunning,
            lastRunAt:  this.lastRunAt ? this.lastRunAt.toISOString() : null,
            lastReport: this.lastReport,
        };
    }
}

module.exports = new M3UScraper();
