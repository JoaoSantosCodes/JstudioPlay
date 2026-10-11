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

        try {
            const m3uResp = await axios.get(m3uUrl, {
                timeout: 25000,
                headers: {
                    'User-Agent': USER_AGENT
                },
                responseType: 'text'
            });

            if (m3uResp.data && typeof m3uResp.data === 'string' && m3uResp.data.includes('#EXTM3U')) {
                const channels = m3uParser.parse(m3uResp.data);
                if (channels.length > 0) {
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
        } catch {
            // Se get.php falhar ou for bloqueado por política de tamanho, faremos fallback para JSON API
        }

        // 3. Fallback: Buscar via JSON endpoints de live, VOD e séries
        const channels = [];

        try {
            // Live streams
            const liveResp = await axios.get(`${base}/player_api.php`, {
                params: { username: user, password: pass, action: 'get_live_streams' },
                timeout: 15000,
                headers: { 'User-Agent': USER_AGENT }
            });

            if (Array.isArray(liveResp.data)) {
                for (const item of liveResp.data) {
                    channels.push({
                        id: `live_${item.stream_id}`,
                        name: item.name || 'Canal',
                        group: item.category_name || 'TV Ao Vivo',
                        logo: item.stream_icon || '',
                        url: `${base}/live/${encodeURIComponent(user)}/${encodeURIComponent(pass)}/${item.stream_id}.m3u8`,
                        streamType: 'live',
                        status: 'unknown'
                    });
                }
            }

            // VOD (Filmes)
            const vodResp = await axios.get(`${base}/player_api.php`, {
                params: { username: user, password: pass, action: 'get_vod_streams' },
                timeout: 15000,
                headers: { 'User-Agent': USER_AGENT }
            });

            if (Array.isArray(vodResp.data)) {
                for (const item of vodResp.data) {
                    const ext = item.container_extension || 'mp4';
                    channels.push({
                        id: `vod_${item.stream_id}`,
                        name: item.name || 'Filme',
                        group: item.category_name || 'Filmes',
                        logo: item.stream_icon || '',
                        url: `${base}/movie/${encodeURIComponent(user)}/${encodeURIComponent(pass)}/${item.stream_id}.${ext}`,
                        streamType: 'movie',
                        status: 'unknown'
                    });
                }
            }

            // Séries
            const seriesResp = await axios.get(`${base}/player_api.php`, {
                params: { username: user, password: pass, action: 'get_series' },
                timeout: 15000,
                headers: { 'User-Agent': USER_AGENT }
            });

            if (Array.isArray(seriesResp.data)) {
                for (const item of seriesResp.data) {
                    channels.push({
                        id: `series_${item.series_id}`,
                        name: item.name || 'Série',
                        group: item.category_name || 'Séries',
                        logo: item.cover || '',
                        url: `${base}/series/${encodeURIComponent(user)}/${encodeURIComponent(pass)}/${item.series_id}.mp4`,
                        streamType: 'series',
                        status: 'unknown'
                    });
                }
            }
        } catch (err) {
            console.error('[XtreamClient] Erro no fallback JSON API:', err.message);
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
