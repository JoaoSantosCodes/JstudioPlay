/**
 * M3U PLAY PRO - Xtream Codes API Server
 * Full compatibility with TiviMate, IPTV Smarters Pro, XCIPTV, Smart IPTV, VLC, Kodi, Formuler.
 */

const crypto = require('crypto');
const db = require('./db/database');
const security = require('./security');
const epgManager = require('./services/epgManager');

class XtreamServer {
    authenticate(username, password) {
        if (!username || !password) return null;
        const user = db.findUserByUsername(username);
        if (!user) return null;

        // Lazy migration SHA-256 → bcrypt via security.verifyPassword
        const { valid, needsUpgrade } = security.verifyPassword(password, user.passwordHash, user.passwordHashAlgo);
        if (!valid) return null;
        if (needsUpgrade) db.updateUser(user.id, { password });

        if (user.blocked) return null;
        if (user.expiresAt && new Date(user.expiresAt) < new Date()) return null;

        return user;
    }

    getAllUserChannels(user) {
        const playlists = db.getPlaylists(user.id);
        const allChannels = [];
        for (const pl of playlists) {
            const chs = db.getChannels(pl.id);
            for (const ch of chs) {
                allChannels.push({
                    ...ch,
                    playlistId: pl.id,
                    playlistName: pl.name
                });
            }
        }
        return allChannels;
    }

    handlePlayerApi(req, res) {
        const username = req.query.username || req.body.username;
        const password = req.query.password || req.body.password;
        const action = req.query.action || req.body.action;

        const user = this.authenticate(username, password);
        if (!user) {
            return res.status(200).json({
                user_info: {
                    auth: 0,
                    status: 'Disabled',
                    message: 'Usuário ou senha incorretos ou conta expirada.'
                }
            });
        }

        const host = req.get('host');
        const protocol = req.protocol;
        const baseUrl = `${protocol}://${host}`;

        // Base user and server information
        const userInfo = {
            username: user.username,
            password: password,
            message: 'Bem-vindo ao M3U PLAY Pro Server',
            auth: 1,
            status: 'Active',
            exp_date: user.expiresAt ? Math.floor(new Date(user.expiresAt).getTime() / 1000).toString() : null,
            is_trial: '0',
            active_cons: '1',
            created_at: Math.floor(new Date(user.createdAt || Date.now()).getTime() / 1000).toString(),
            max_connections: '5',
            allowed_output_formats: ['m3u8', 'ts', 'rtmp', 'mp4']
        };

        const serverInfo = {
            url: host.split(':')[0],
            port: host.split(':')[1] || '80',
            https_port: '443',
            server_protocol: protocol,
            rtmp_port: '8888',
            timezone: 'America/Sao_Paulo',
            timestamp_now: Math.floor(Date.now() / 1000),
            time_now: new Date().toISOString()
        };

        // If no action, return authentication profile info
        if (!action) {
            return res.json({
                user_info: userInfo,
                server_info: serverInfo
            });
        }

        const channels = this.getAllUserChannels(user);

        // 1. Live Categories
        if (action === 'get_live_categories') {
            const liveChannels = channels.filter(c => c.streamType === 'live' || !c.streamType);
            const groups = [...new Set(liveChannels.map(c => c.group || 'TV Aberta'))];
            const categories = groups.map((g, idx) => ({
                category_id: String(idx + 1),
                category_name: g,
                parent_id: 0
            }));
            return res.json(categories);
        }

        // 2. Live Streams
        if (action === 'get_live_streams') {
            const categoryId = req.query.category_id || req.body.category_id;
            let liveChannels = channels.filter(c => c.streamType === 'live' || !c.streamType);
            const groups = [...new Set(liveChannels.map(c => c.group || 'TV Aberta'))];

            if (categoryId) {
                const targetGroup = groups[parseInt(categoryId, 10) - 1];
                if (targetGroup) {
                    liveChannels = liveChannels.filter(c => (c.group || 'TV Aberta') === targetGroup);
                }
            }

            const streams = liveChannels.map((c, idx) => {
                const groupIdx = groups.indexOf(c.group || 'TV Aberta') + 1;
                const streamNum = idx + 1000;
                return {
                    num: streamNum,
                    name: c.name,
                    stream_type: 'live',
                    stream_id: c.id || `stream_${streamNum}`,
                    stream_icon: c.logo || '',
                    epg_channel_id: c.tvgId || c.id,
                    added: '1700000000',
                    is_adult: '0',
                    category_id: String(groupIdx > 0 ? groupIdx : 1),
                    custom_sid: '',
                    tv_archive: 0,
                    direct_source: c.url
                };
            });

            return res.json(streams);
        }

        // 3. VOD / Movies Categories
        if (action === 'get_vod_categories') {
            const vodChannels = channels.filter(c => c.streamType === 'vod');
            const groups = [...new Set(vodChannels.map(c => c.group || 'Filmes'))];
            const categories = groups.map((g, idx) => ({
                category_id: String(idx + 100),
                category_name: g,
                parent_id: 0
            }));
            return res.json(categories);
        }

        // 4. VOD / Movies Streams
        if (action === 'get_vod_streams') {
            const vodChannels = channels.filter(c => c.streamType === 'vod');
            const groups = [...new Set(vodChannels.map(c => c.group || 'Filmes'))];
            const streams = vodChannels.map((c, idx) => ({
                num: idx + 5000,
                name: c.name,
                stream_type: 'movie',
                stream_id: c.id || `movie_${idx + 5000}`,
                stream_icon: c.logo || '',
                rating: '5.0',
                rating_5based: 5,
                added: '1700000000',
                category_id: String(groups.indexOf(c.group || 'Filmes') + 100),
                container_extension: 'mp4',
                custom_sid: '',
                direct_source: c.url
            }));
            return res.json(streams);
        }

        // 5. Series Categories
        if (action === 'get_series_categories') {
            const seriesChannels = channels.filter(c => c.streamType === 'series');
            const groups = [...new Set(seriesChannels.map(c => c.group || 'Séries'))];
            const categories = groups.map((g, idx) => ({
                category_id: String(idx + 200),
                category_name: g,
                parent_id: 0
            }));
            return res.json(categories);
        }

        // 6. Series Streams
        if (action === 'get_series') {
            const seriesChannels = channels.filter(c => c.streamType === 'series');
            const groups = [...new Set(seriesChannels.map(c => c.group || 'Séries'))];
            const series = seriesChannels.map((c, idx) => ({
                num: idx + 8000,
                name: c.name,
                series_id: c.id || `series_${idx + 8000}`,
                cover: c.logo || '',
                plot: 'Série completa em alta definição.',
                cast: '',
                director: '',
                genre: c.group || 'Séries',
                releaseDate: '2024',
                rating: '5',
                rating_5based: 5,
                category_id: String(groups.indexOf(c.group || 'Séries') + 200)
            }));
            return res.json(series);
        }

        // 7. Short EPG
        if (action === 'get_short_epg') {
            const streamId = req.query.stream_id;
            const targetChannel = channels.find(c => c.id === streamId || c.tvgId === streamId);
            const epg = epgManager.getChannelNowPlaying(targetChannel?.tvgId, targetChannel?.name);

            return res.json({
                epg_listings: [
                    {
                        id: 'epg_1',
                        epg_id: targetChannel?.tvgId || '1',
                        title: Buffer.from(epg.current.title).toString('base64'),
                        lang: 'pt',
                        start: epg.current.start,
                        end: epg.current.end,
                        description: Buffer.from(epg.current.desc).toString('base64'),
                        channel_id: streamId,
                        start_timestamp: Math.floor(new Date(epg.current.start).getTime() / 1000),
                        stop_timestamp: Math.floor(new Date(epg.current.end).getTime() / 1000),
                        now_playing: 1
                    }
                ]
            });
        }

        return res.json([]);
    }

    /**
     * Handle M3U Plus export via /get.php
     */
    handleGetPhp(req, res) {
        const { username, password, type = 'm3u_plus' } = req.query;
        const user = this.authenticate(username, password);
        if (!user) {
            return res.status(403).send('#EXTM3U\n#EXTINF:-1,ACESSO NEGADO OU EXPIRADO\nhttp://invalid');
        }

        const host = req.get('host');
        const protocol = req.protocol;
        const baseUrl = `${protocol}://${host}`;

        const channels = this.getAllUserChannels(user);
        let m3u = '#EXTM3U url-tvg="' + baseUrl + '/xmltv.php?username=' + username + '&password=' + password + '"\n';

        for (const ch of channels) {
            const streamUrl = `${baseUrl}/live/${username}/${password}/${ch.id}.m3u8`;
            const tvgId = ch.tvgId || ch.id;
            const group = ch.group || 'TV Aberta';
            const logo = ch.logo || '';
            m3u += `#EXTINF:-1 tvg-id="${tvgId}" tvg-name="${ch.name}" tvg-logo="${logo}" group-title="${group}",${ch.name}\n`;
            m3u += `${streamUrl}\n`;
        }

        res.setHeader('Content-Type', 'audio/x-mpegurl');
        res.setHeader('Content-Disposition', `inline; filename="${user.username}_m3uplay.m3u"`);
        res.send(m3u);
    }

    /**
     * Handle XMLTV guide export via /xmltv.php
     */
    handleXmltvPhp(req, res) {
        const { username, password } = req.query;
        const user = this.authenticate(username, password);
        const channels = user ? this.getAllUserChannels(user) : [];

        const xml = epgManager.generateXMLTV(channels);
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(xml);
    }
}

module.exports = new XtreamServer();
