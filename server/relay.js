const axios = require('axios');
const http = require('http');
const https = require('https');
const url = require('url');

// High-performance HTTP Keep-Alive Agents for ultra-low chunk latency
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 120, maxFreeSockets: 30, timeout: 15000 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 120, maxFreeSockets: 30, timeout: 15000, rejectUnauthorized: false });

class StreamRelay {
    constructor() {
        this.userAgentList = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'VLC/3.0.20 LibVLC/3.0.20',
            'IPTVSmartersPro/3.1.5',
            'TiviMate/4.7.0 (Android TV)',
            'AppleCoreMedia/1.0.0.20K71 (Apple TV; U; CPU OS 16_4 like Mac OS X)'
        ];
        this.defaultUserAgent = this.userAgentList[0];
        // ST-08: Cache de manifests HLS com limite de 200 entradas (FIFO) para evitar vazamento de memória
        this.manifestCache = new Map(); // url -> { data, contentType, expires }
        this.manifestCacheMaxSize = 200;
    }

    /**
     * Handle /playback API call from M3U PLAY frontend
     */
    async handlePlaybackRequest(req, res, db) {
        const { playlistId, channelIndex, channelUrl } = req.body;
        let targetUrl = channelUrl;

        if (!targetUrl && playlistId !== undefined && channelIndex !== undefined) {
            const channels = db.getChannels(playlistId);
            const channel = channels[channelIndex];
            if (channel) targetUrl = channel.url;
        }

        if (!targetUrl) {
            return res.status(400).json({ error: 'Canal ou URL não especificado.' });
        }

        try {
            const parsed = new URL(targetUrl);
            const isKnownMedia = /\.(mp4|m4v|mov|webm|ogv|ogg|mp3|m4a|aac|wav|flac|ts)$/i.test(parsed.pathname);
            const isHls = /\.m3u8(\?.*)?$/i.test(targetUrl) || !isKnownMedia;

            const proxyUrl = `/proxy/stream?url=${encodeURIComponent(targetUrl)}`;

            return res.json({
                mode: isHls ? 'hls' : 'media',
                url: proxyUrl,
                originalUrl: targetUrl,
                streamType: isHls ? 'HLS (Adaptive Bitrate)' : 'Direct Stream',
                relayActive: true
            });
        } catch (err) {
            return res.status(400).json({ error: 'URL de transmissão inválida.' });
        }
    }

    /**
     * Proxy stream / HLS chunks / video with CORS headers and high-performance streaming
     */
    async proxyStream(req, res) {
        const targetUrl = req.query.url;
        if (!targetUrl) {
            return res.status(400).send('Parâmetro url é obrigatório');
        }

        // Set global CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type, X-Proxy-Cache, X-Stream-Latency');

        if (req.method === 'OPTIONS') {
            return res.sendStatus(204);
        }

        // Check cached manifest for HLS
        const now = Date.now();
        if (this.manifestCache.has(targetUrl)) {
            const cached = this.manifestCache.get(targetUrl);
            if (cached.expires > now) {
                res.setHeader('Content-Type', cached.contentType || 'application/vnd.apple.mpegurl');
                res.setHeader('X-Proxy-Cache', 'HIT');
                return res.send(cached.data);
            } else {
                this.manifestCache.delete(targetUrl);
            }
        }

        const clientHeaders = {
            'User-Agent': this.defaultUserAgent,
            'Accept': '*/*',
            'Accept-Encoding': 'identity'
        };

        if (req.headers.range) {
            clientHeaders['Range'] = req.headers.range;
        }

        const startTime = Date.now();

        try {
            const isHttps = targetUrl.startsWith('https://');
            const isM3u8Target = /\.m3u8(\?.*)?$/i.test(targetUrl);
            const response = await axios({
                method: req.method,
                url: targetUrl,
                headers: clientHeaders,
                responseType: 'stream',
                timeout: isM3u8Target ? 15000 : 45000,
                maxRedirects: 5,
                httpAgent,
                httpsAgent,
                validateStatus: (status) => status >= 200 && status < 400
            });

            const latency = Date.now() - startTime;
            res.setHeader('X-Stream-Latency', `${latency}ms`);

            // Liberar stream upstream caso o cliente feche a aba / mude de canal (essencial para max_connections: 1)
            req.on('close', () => {
                if (!response.data.destroyed) {
                    response.data.destroy();
                }
            });

            const contentType = response.headers['content-type'] || '';
            const isM3u8 = contentType.includes('mpegurl') || isM3u8Target;

            if (isM3u8 && req.method === 'GET') {
                let bodyData = '';
                response.data.on('data', chunk => {
                    bodyData += chunk.toString('utf8');
                });

                response.data.on('end', () => {
                    const finalType = 'application/vnd.apple.mpegurl';
                    res.setHeader('Content-Type', finalType);
                    res.setHeader('X-Proxy-Cache', 'MISS');
                    const rewritten = this.rewriteM3U8(bodyData, targetUrl);

                    // Cache manifest for 2.5s (live) or 45s (VOD)
                    const isVod = bodyData.includes('#EXT-X-ENDLIST');
                    // ST-08: Evicção FIFO — remove entrada mais antiga se cache atingiu o limite
                    if (this.manifestCache.size >= this.manifestCacheMaxSize) {
                        const oldestKey = this.manifestCache.keys().next().value;
                        this.manifestCache.delete(oldestKey);
                    }
                    this.manifestCache.set(targetUrl, {
                        data: rewritten,
                        contentType: finalType,
                        expires: now + (isVod ? 45000 : 2500)
                    });

                    res.send(rewritten);
                });

                response.data.on('error', (e) => {
                    if (!res.headersSent) res.status(502).send('Erro ao ler stream M3U8');
                });
            } else {
                // Direct binary piping for TS / MP4 / AAC segments
                if (contentType) res.setHeader('Content-Type', contentType);
                if (response.headers['content-length']) res.setHeader('Content-Length', response.headers['content-length']);
                if (response.headers['content-range']) res.setHeader('Content-Range', response.headers['content-range']);
                if (response.headers['accept-ranges']) res.setHeader('Accept-Ranges', response.headers['accept-ranges']);

                res.status(response.status);
                response.data.pipe(res);
            }
        } catch (err) {
            // Auto-retry with rotated User-Agent (VLC / TiviMate) on 403 Forbidden
            if (err.response && (err.response.status === 403 || err.response.status === 401)) {
                try {
                    const retryResp = await axios({
                        method: req.method,
                        url: targetUrl,
                        headers: {
                            ...clientHeaders,
                            'User-Agent': 'VLC/3.0.20 LibVLC/3.0.20'
                        },
                        responseType: 'stream',
                        timeout: 30000,
                        httpAgent,
                        httpsAgent,
                        validateStatus: (status) => status >= 200 && status < 400
                    });
                    if (retryResp.headers['content-type']) res.setHeader('Content-Type', retryResp.headers['content-type']);
                    res.status(retryResp.status);
                    return retryResp.data.pipe(res);
                } catch (retryErr) {}
            }

            if (!res.headersSent) {
                res.status(502).json({
                    error: 'Falha ao conectar com o stream upstream',
                    diagnostic: 'upstream_request_failed',
                    details: err.message
                });
            }
        }
    }

    /**
     * Rewrite .m3u8 manifest URLs so all segments and audio tracks flow through our proxy
     */
    rewriteM3U8(manifest, baseUrl) {
        const lines = manifest.split(/\r?\n/);
        const rewritten = [];

        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                rewritten.push(line);
                continue;
            }

            if (trimmed.startsWith('#')) {
                // Rewrite any URI attributes in HLS tags (#EXT-X-MEDIA:TYPE=AUDIO/SUBTITLES, #EXT-X-KEY, #EXT-X-MAP, etc.)
                if (line.includes('URI=')) {
                    line = line.replace(/URI=(?:"([^"]+)"|([^\s,]+))/g, (m, p1, p2) => {
                        const rawUri = p1 || p2;
                        try {
                            const abs = new URL(rawUri, baseUrl).href;
                            return `URI="/proxy/stream?url=${encodeURIComponent(abs)}"`;
                        } catch (e) {
                            return m;
                        }
                    });
                }
                rewritten.push(line);
            } else {
                try {
                    const absoluteUrl = new URL(trimmed, baseUrl).href;
                    rewritten.push(`/proxy/stream?url=${encodeURIComponent(absoluteUrl)}`);
                } catch (e) {
                    rewritten.push(line);
                }
            }
        }

        return rewritten.join('\n');
    }
}

module.exports = new StreamRelay();
