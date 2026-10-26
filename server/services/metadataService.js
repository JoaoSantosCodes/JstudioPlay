/**
 * JstudioPlay Pro — Serviço Unificado de Enriquecimento de Metadados (v8.0.0)
 *
 * Busca inteligente de capas oficiais em alta definição, sinopses,
 * notas, anos de lançamento e categorias via APIs públicas e gratuitas.
 *
 * Provedores em cascata:
 *  1. TMDB API v3 (se TMDB_API_KEY configurada no .env)
 *  2. OMDb API (se OMDB_API_KEY configurada no .env)
 *  3. TVMaze API (Zero-Key: Séries, Shows, Animes e Telenovelas)
 *  4. Wikipedia API PT-BR (Zero-Key: Filmes e Séries, capas oficiais e sinopse em português)
 */

const axios = require('axios');

class MetadataService {
    constructor() {
        this.cache = new Map(); // cleanQuery -> metadata
        this.cacheLimit = 1000;
        this.activeJobs = new Map(); // playlistId -> { isRunning, total, current, cancelRequested }
        this.httpTimeout = 4500;
        this.userAgent = 'JstudioPlay/8.0 (https://jstudioplay.com; contact@jstudioplay.com)';
    }

    /**
     * Limpa e sanitiza títulos de IPTV removendo resoluções, tags e codecs
     */
    cleanTitle(rawName) {
        if (!rawName || typeof rawName !== 'string') return { title: '', year: null, isSeries: false };
        let title = rawName;

        // Extrai ano se presente entre parênteses ex: (2023) ou [2022]
        let extractedYear = null;
        const yearMatch = title.match(/[\(\[](\d{4})[\)\]]/);
        if (yearMatch) {
            const y = parseInt(yearMatch[1], 10);
            if (y >= 1920 && y <= 2030) extractedYear = y;
        }

        // Detecta se parece com série
        const isSeries = /S\d+\s*E\d+|Temporada|Epis[oó]dio/i.test(title);

        // Remove tags conhecidas de IPTV
        title = title
            .replace(/\[(4K|UHD|FHD|HD|SD|HEVC|H\.265|H\.264|1080P|720P)\]/gi, '')
            .replace(/\((4K|UHD|FHD|HD|SD|HEVC|H\.265|H\.264|1080P|720P)\)/gi, '')
            .replace(/\[(LEG|DUB|DUBLADO|LEGENDADO|NACIONAL|ORIGINAL|DUAL|ÁUDIO)\]/gi, '')
            .replace(/\((LEG|DUB|DUBLADO|LEGENDADO|NACIONAL|ORIGINAL|DUAL|ÁUDIO)\)/gi, '')
            .replace(/[\(\[]\d{4}[\)\]]/g, '')
            .replace(/S\d+\s*E\d+/gi, '')
            .replace(/►#|\/|\\/g, ' ')
            .replace(/[-|_]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return { title, year: extractedYear, isSeries };
    }

    async searchTVMaze(title) {
        return this.searchTvMaze(title);
    }

    /**
     * Busca metadados unificados para um item VOD ou canal
     * @param {string} rawName 
     * @param {'vod'|'series'|'live'} streamType 
     */
    async enrich(rawName, streamType = 'vod') {
        const { title, year } = this.cleanTitle(rawName);
        if (!title || title.length < 2) return null;

        const cacheKey = `${streamType}:${title.toLowerCase()}:${year || ''}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let metadata = null;

        // 1. TMDB API v3 (se chave configurada)
        const tmdbKey = process.env.TMDB_API_KEY;
        if (tmdbKey) {
            try {
                metadata = await this.searchTmdb(title, streamType, year, tmdbKey);
            } catch (e) {}
        }

        // 2. OMDb API (se chave configurada)
        const omdbKey = process.env.OMDB_API_KEY;
        if (!metadata && omdbKey) {
            try {
                metadata = await this.searchOmdb(title, streamType, year, omdbKey);
            } catch (e) {}
        }

        // 3. Se for série, prioriza TVMaze (Zero-Key)
        if (!metadata && (streamType === 'series' || streamType === 'vod')) {
            try {
                metadata = await this.searchTvMaze(title);
            } catch (e) {}
        }

        // 4. Wikipedia PT-BR (Zero-Key, oficial com sinopse em português e pôster)
        if (!metadata) {
            try {
                metadata = await this.searchWikipedia(title, streamType, year);
            } catch (e) {}
        }

        if (metadata) {
            if (this.cache.size >= this.cacheLimit) {
                const first = this.cache.keys().next().value;
                this.cache.delete(first);
            }
            this.cache.set(cacheKey, metadata);
        }

        return metadata;
    }

    /**
     * Busca via Wikipedia PT-BR (Zero-Key, capas oficiais e sinopse em português)
     */
    async searchWikipedia(title, streamType = 'vod', year = null) {
        if (typeof streamType === 'number') {
            year = streamType;
            streamType = 'vod';
        }
        const queryTerm = `${title} ${streamType === 'series' ? 'série' : 'filme'}`;
        const searchRes = await axios.get('https://pt.wikipedia.org/w/api.php', {
            params: {
                action: 'query',
                list: 'search',
                srsearch: queryTerm,
                format: 'json'
            },
            headers: { 'User-Agent': this.userAgent },
            timeout: this.httpTimeout
        });

        const firstHit = searchRes.data?.query?.search?.[0];
        if (!firstHit) return null;

        const pageTitle = firstHit.title;
        const summaryRes = await axios.get(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`, {
            headers: { 'User-Agent': this.userAgent },
            timeout: this.httpTimeout
        });

        const data = summaryRes.data;
        if (!data) return null;

        const posterUrl = data.thumbnail?.source || data.originalimage?.source || '';
        const overview = data.extract || '';

        return {
            title: data.title || title,
            posterUrl,
            backdropUrl: data.originalimage?.source || posterUrl,
            overview,
            rating: null,
            year: year || null,
            genres: streamType === 'series' ? 'Série' : 'Cinema & Filmes',
            tmdbId: data.pageid ? `wiki_${data.pageid}` : null,
            source: 'wikipedia'
        };
    }

    /**
     * Busca via TVMaze (Zero-Key: Séries, Shows e Animes)
     */
    async searchTvMaze(title) {
        const res = await axios.get('https://api.tvmaze.com/singlesearch/shows', {
            params: { q: title },
            headers: { 'User-Agent': this.userAgent },
            timeout: this.httpTimeout
        });
        const show = res.data;
        if (!show) return null;

        const overview = show.summary ? show.summary.replace(/<[^>]+>/g, '').trim() : '';
        const posterUrl = show.image?.original || show.image?.medium || '';
        const year = show.premiered ? parseInt(show.premiered.slice(0, 4), 10) : null;
        const rating = show.rating?.average ? Number(show.rating.average) : null;
        const genres = Array.isArray(show.genres) ? show.genres.join(', ') : '';

        return {
            title: show.name || title,
            posterUrl,
            backdropUrl: posterUrl,
            overview,
            rating,
            year,
            genres,
            tmdbId: show.externals?.thetvdb ? `tvdb_${show.externals.thetvdb}` : (show.id ? `tvmaze_${show.id}` : null),
            source: 'tvmaze'
        };
    }

    /**
     * Busca via OMDb API
     */
    async searchOmdb(title, streamType, year, apiKey) {
        const params = {
            apikey: apiKey,
            t: title,
            type: streamType === 'series' ? 'series' : 'movie'
        };
        if (year) params.y = year;

        const res = await axios.get('https://www.omdbapi.com/', { params, timeout: this.httpTimeout });
        const d = res.data;
        if (!d || d.Response === 'False') return null;

        const posterUrl = d.Poster && d.Poster !== 'N/A' ? d.Poster : '';
        const parsedYear = d.Year ? parseInt(d.Year.slice(0, 4), 10) : year;
        const rating = d.imdbRating && d.imdbRating !== 'N/A' ? Number(d.imdbRating) : null;

        return {
            title: d.Title || title,
            posterUrl,
            backdropUrl: posterUrl,
            overview: d.Plot && d.Plot !== 'N/A' ? d.Plot : '',
            rating,
            year: parsedYear,
            genres: d.Genre && d.Genre !== 'N/A' ? d.Genre : '',
            tmdbId: d.imdbID || null,
            source: 'omdb'
        };
    }

    /**
     * Busca via TMDB API v3
     */
    async searchTmdb(title, streamType, year, apiKey) {
        const endpoint = streamType === 'series' ? 'search/tv' : 'search/movie';
        const params = {
            api_key: apiKey,
            query: title,
            language: 'pt-BR'
        };
        if (year) {
            if (streamType === 'series') params.first_air_date_year = year;
            else params.year = year;
        }

        const res = await axios.get(`https://api.themoviedb.org/3/${endpoint}`, { params, timeout: this.httpTimeout });
        const item = res.data?.results?.[0];
        if (!item) return null;

        const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';
        const backdropUrl = item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : posterUrl;
        const releaseDate = item.release_date || item.first_air_date || '';
        const parsedYear = releaseDate ? parseInt(releaseDate.slice(0, 4), 10) : year;

        return {
            title: item.title || item.name || title,
            posterUrl,
            backdropUrl,
            overview: item.overview || '',
            rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : null,
            year: parsedYear,
            genres: '',
            tmdbId: item.id ? `tmdb_${item.id}` : null,
            source: 'tmdb'
        };
    }

    /**
     * Processamento de lote com controle de concorrência e delay
     */
    async runBatch(playlistId, db, options = {}) {
        const { limit = 100, delayMs = 300, type = null } = options;
        if (this.activeJobs.has(playlistId)) {
            return { status: 'already_running', ...this.activeJobs.get(playlistId) };
        }

        const stats = db.getEnrichmentStats(playlistId);
        const job = {
            isRunning: true,
            total: stats.pending,
            current: 0,
            enrichedCount: 0,
            startTime: Date.now(),
            cancelRequested: false
        };
        this.activeJobs.set(playlistId, job);

        // Processa em background assíncrono sem travar a resposta
        (async () => {
            try {
                let pendingItems = db.getChannelsForEnrichment(playlistId, type, limit);
                while (pendingItems.length > 0 && !job.cancelRequested) {
                    for (const item of pendingItems) {
                        if (job.cancelRequested) break;
                        job.current++;
                        try {
                            const meta = await this.enrich(item.name, item.streamType);
                            if (meta) {
                                db.updateChannelMetadata(item.id, playlistId, meta);
                                job.enrichedCount++;
                            } else {
                                // Marca com data para não ficar re-tentando eternamente
                                db.updateChannelMetadata(item.id, playlistId, { enrichedAt: new Date().toISOString() });
                            }
                        } catch (err) {
                            // ignora falhas individuais
                        }
                        if (delayMs > 0) {
                            await new Promise(r => setTimeout(r, delayMs));
                        }
                    }
                    if (!job.cancelRequested) {
                        pendingItems = db.getChannelsForEnrichment(playlistId, type, limit);
                    }
                }
            } finally {
                job.isRunning = false;
                job.endTime = Date.now();
                setTimeout(() => this.activeJobs.delete(playlistId), 60000); // Retém status por 1 min
            }
        })();

        return { status: 'started', playlistId, total: job.total };
    }

    getJobStatus(playlistId) {
        return this.activeJobs.get(playlistId) || { isRunning: false };
    }

    cancelJob(playlistId) {
        const job = this.activeJobs.get(playlistId);
        if (job) {
            job.cancelRequested = true;
            return true;
        }
        return false;
    }
}

module.exports = new MetadataService();
