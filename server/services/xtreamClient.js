/**
 * JstudioPlay Pro - Xtream Codes API Client & Importer
 * Permite que usuários autenticados conectem servidores de IPTV pagos externos
 * utilizando Server URL, Username e Password (padrão Xtream Codes / Smarters / TiviMate).
 */

const axios = require('axios');
const m3uParser = require('./m3uParser');

const DEFAULT_TIMEOUT_MS = 10000;
const USER_AGENT = 'IPTVSmarters/2.2.2.1 (Linux; Android 12; SmartTV)';

class XtreamClient {
    /**
     * Sanitiza a URL base do servidor
     */
    normalizeUrl(rawUrl) {
        if (!rawUrl || typeof rawUrl !== 'string') {
            throw new Error('Informe uma URL de servidor válida.');
        }
        let url = rawUrl.trim();
        if (!/^https?:\/\//i.test(url)) {
            url = 'http://' + url;
        }
        // Remove trailing slash
        return url.replace(/\/+$/, '');
    }

    /**
     * Valida as credenciais junto ao servidor Xtream Codes externo
     */
    async validateCredentials(serverUrl, username, password) {
        const base = this.normalizeUrl(serverUrl);
        const endpoint = `${base}/player_api.php`;

        try {
            const response = await axios.get(endpoint, {
                params: {
                    username: username.trim(),
                    password: password.trim()
                },
                timeout: DEFAULT_TIMEOUT_MS,
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'application/json, text/plain, */*'
                }
            });

            const data = response.data;
            if (!data || typeof data !== 'object') {
                throw new Error('O servidor remoto não respondeu com uma API Xtream Codes válida.');
            }

            const userInfo = data.user_info;
            if (!userInfo || userInfo.auth === 0 || userInfo.status === 'Banned' || userInfo.status === 'Disabled') {
                throw new Error(userInfo?.message || 'Autenticação recusada pelo servidor IPTV. Verifique usuário e senha.');
            }

            return {
                valid: true,
                userInfo: {
                    username: userInfo.username || username,
                    status: userInfo.status || 'Active',
                    expDate: userInfo.exp_date ? (userInfo.exp_date === 'null' ? 'Vitalício' : new Date(parseInt(userInfo.exp_date, 10) * 1000).toLocaleDateString('pt-BR')) : 'Sem expiração',
                    isTrial: userInfo.is_trial === '1',
                    activeCons: userInfo.active_cons || '0',
                    maxConnections: userInfo.max_connections || '1',
                    allowedOutputFormats: userInfo.allowed_output_formats || ['m3u8', 'ts']
                },
                serverInfo: data.server_info || {}
            };
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                throw new Error('Acesso recusado pelo provedor IPTV (401/403). Usuário ou senha incorretos.');
            }
            if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
                throw new Error('Tempo limite de conexão excedido ao conectar com o servidor IPTV (Timeout 10s).');
            }
            if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
                throw new Error('Servidor IPTV não encontrado ou porta inacessível. Confira o endereço.');
            }
            throw new Error(err.message || 'Falha ao validar conta Xtream Codes.');
        }
    }

    /**
     * Importa todos os canais, filmes e séries do servidor Xtream
     */
    async importContent(serverUrl, username, password) {
        const base = this.normalizeUrl(serverUrl);
        const user = username.trim();
        const pass = password.trim();

        // 1. Validação prévia
        const validation = await this.validateCredentials(base, user, pass);

        // 2. Tentar baixar a M3U Plus nativa do Xtream (/get.php)
        const m3uUrl = `${base}/get.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&type=m3u_plus&output=m3u8`;
        const epgUrl = `${base}/xmltv.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`;
        const channels = [];

        try {
            // 1. Mapeamento de Categorias de Canais Ao Vivo
            const liveCatMap = {};
            try {
                const liveCatRes = await axios.get(`${base}/player_api.php`, {
                    params: { username: user, password: pass, action: 'get_live_categories' },
                    timeout: 10000,
                    headers: { 'User-Agent': USER_AGENT }
                });
                if (Array.isArray(liveCatRes.data)) {
                    for (const cat of liveCatRes.data) {
                        if (cat.category_id) liveCatMap[String(cat.category_id)] = cat.category_name;
                    }
                }
            } catch {}

            // 2. Canais Ao Vivo (Live Streams)
            const liveResp = await axios.get(`${base}/player_api.php`, {
                params: { username: user, password: pass, action: 'get_live_streams' },
                timeout: 25000,
                headers: { 'User-Agent': USER_AGENT }
            });

            if (Array.isArray(liveResp.data)) {
                for (const item of liveResp.data) {
                    const group = liveCatMap[String(item.category_id)] || item.category_name || 'TV Ao Vivo';
                    channels.push({
                        id: `live_${item.stream_id}`,
                        name: item.name || 'Canal',
                        group,
                        logo: item.stream_icon || '',
                        url: `${base}/live/${encodeURIComponent(user)}/${encodeURIComponent(pass)}/${item.stream_id}.m3u8`,
                        streamType: 'live',
                        status: 'unknown'
                    });
                }
            }

            // 3. Mapeamento de Categorias de Filmes (VOD)
            const vodCatMap = {};
            try {
                const vodCatRes = await axios.get(`${base}/player_api.php`, {
                    params: { username: user, password: pass, action: 'get_vod_categories' },
                    timeout: 10000,
                    headers: { 'User-Agent': USER_AGENT }
                });
                if (Array.isArray(vodCatRes.data)) {
                    for (const cat of vodCatRes.data) {
                        if (cat.category_id) vodCatMap[String(cat.category_id)] = cat.category_name;
                    }
                }
            } catch {}

            // 4. Filmes VOD
            try {
                const vodResp = await axios.get(`${base}/player_api.php`, {
                    params: { username: user, password: pass, action: 'get_vod_streams' },
                    timeout: 25000,
                    headers: { 'User-Agent': USER_AGENT }
                });

                if (Array.isArray(vodResp.data)) {
                    for (const item of vodResp.data) {
                        const ext = item.container_extension || 'mp4';
                        const group = vodCatMap[String(item.category_id)] || item.category_name || 'Filmes';
                        channels.push({
                            id: `vod_${item.stream_id}`,
                            name: item.name || 'Filme',
                            group,
                            logo: item.stream_icon || '',
                            posterUrl: item.stream_icon || undefined,
                            rating: item.rating ? Number(item.rating) : undefined,
                            url: `${base}/movie/${encodeURIComponent(user)}/${encodeURIComponent(pass)}/${item.stream_id}.${ext}`,
                            streamType: 'vod',
                            status: 'unknown'
                        });
                    }
                }
            } catch (eVod) {
                console.warn('[XtreamClient] VOD fetch parcial:', eVod.message);
            }

        } catch (err) {
            console.error('[XtreamClient] Erro na API JSON Xtream:', err.message);
        }

        if (channels.length === 0) {
            // Se a API JSON falhar, tenta fallback via M3U parser
            try {
                const m3uResp = await axios.get(m3uUrl, {
                    timeout: 25000,
                    headers: { 'User-Agent': USER_AGENT },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    responseType: 'text'
                });
                if (m3uResp.data && typeof m3uResp.data === 'string' && m3uResp.data.includes('#EXTM3U')) {
                    const parsed = m3uParser.parse(m3uResp.data);
                    if (parsed.length > 0) channels.push(...parsed);
                }
            } catch {}
        }

        if (channels.length === 0) {
            throw new Error('Nenhum canal, filme ou série pôde ser obtido deste servidor Xtream Codes.');
        }

        return {
            channels,
            total: channels.length,
            m3uUrl,
            epgUrl,
            userInfo: validation.userInfo,
            serverInfo: validation.serverInfo
        };
    }
}

module.exports = new XtreamClient();
