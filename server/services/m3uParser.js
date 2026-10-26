const axios = require('axios');
const enricher = require('./m3uEnricher');

class M3UParser {
    /**
     * Parse raw M3U text into an array of channel objects
     */
    parse(content, autoEnrich = true) {
        if (!content || typeof content !== 'string') return [];

        const lines = content.split(/\r?\n/);
        const channels = [];
        let currentChannel = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            if (line.startsWith('#EXTINF:')) {
                currentChannel = this.parseExtInf(line);
            } else if (line.startsWith('#EXTGRP:')) {
                if (currentChannel) {
                    currentChannel.group = line.replace('#EXTGRP:', '').trim();
                }
            } else if (line.startsWith('#')) {
                // Catch user agent or extra headers if present
                if (line.includes('http-user-agent=')) {
                    const ua = line.split('http-user-agent=')[1];
                    if (currentChannel && ua) currentChannel.userAgent = ua.trim();
                }
                continue;
            } else if (currentChannel && (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://') || line.startsWith('rtsp://') || line.startsWith('mms://'))) {
                currentChannel.url = line;
                currentChannel.streamType = this.detectStreamType(currentChannel);
                currentChannel.id = this.generateId(currentChannel);

                if (autoEnrich) {
                    currentChannel = enricher.enrichChannel(currentChannel);
                }

                channels.push(currentChannel);
                currentChannel = null;
            }
        }

        return channels;
    }

    /**
     * Parse #EXTINF line attributes
     */
    parseExtInf(line) {
        // Extract comma and channel name
        const commaIdx = line.lastIndexOf(',');
        let name = '';
        let infoPart = line;

        if (commaIdx !== -1) {
            name = line.substring(commaIdx + 1).trim();
            infoPart = line.substring(0, commaIdx);
        }

        const extractAttr = (attr) => {
            const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
            const match = infoPart.match(regex);
            if (match) return match[1];
            // Without quotes
            const regexNoQuote = new RegExp(`${attr}=([^\\s,]+)`, 'i');
            const matchNoQuote = infoPart.match(regexNoQuote);
            return matchNoQuote ? matchNoQuote[1] : '';
        };

        const tvgId = extractAttr('tvg-id');
        const tvgName = extractAttr('tvg-name');
        const tvgLogo = extractAttr('tvg-logo') || extractAttr('logo');
        const groupTitle = extractAttr('group-title') || extractAttr('group') || 'TV Aberta';
        const tvgChno = extractAttr('tvg-chno');

        const rawName = name || tvgName || 'Sem Nome';
        const cleanName = enricher.cleanChannelName(rawName);

        return {
            id: 'ch_' + Math.random().toString(36).substring(2, 10),
            name: cleanName || rawName,
            rawName: rawName,
            tvgId: tvgId || '',
            tvgName: tvgName || '',
            logo: tvgLogo || '',
            group: this.cleanGroupName(groupTitle),
            chno: tvgChno || '',
            status: 'unknown', // 'online' | 'offline' | 'checking' | 'unknown'
            latency: null,
            lastChecked: null
        };
    }

    cleanGroupName(group) {
        if (!group) return 'TV Aberta';
        return group.replace(/^[\|\-\s]+/, '').replace(/[\|\-\s]+$/, '').trim() || 'TV Aberta';
    }

    generateId(channel) {
        const type = channel.streamType || 'ch';
        const url = channel.url || '';
        // 1. Extrai stream ID se existir na URL (ex: /5259159.m3u8, /movie/user/pass/12345.mp4)
        const match = url.match(/\/([a-zA-Z0-9_\-]+)\.(?:m3u8|mp4|mkv|avi|ts)/i);
        if (match && match[1]) {
            return `${type}_${match[1]}`;
        }
        // 2. Hash determinístico baseado em identificadores estáveis
        const crypto = require('crypto');
        const seed = `${type}:${channel.tvgId || ''}:${channel.rawName || channel.name || ''}:${url}`;
        const hash = crypto.createHash('md5').update(seed).digest('hex').substring(0, 10);
        return `${type}_${hash}`;
    }

    detectStreamType(channel) {
        const group = (channel.group || '').toLowerCase();
        const name = (channel.name || '').toLowerCase();
        const url = (channel.url || '').toLowerCase();

        // Series detection: S01E01, T01E01, Temporada, Season, etc.
        const seriesRegex = /(?:s\d{1,2}e\d{1,2}|t\d{1,2}e\d{1,2}|\btemporada\b|\bseason\b|\bepisodio\b|\bep\.\s*\d+)/i;
        if (seriesRegex.test(name) || seriesRegex.test(group) || group.includes('series') || group.includes('séries') || url.includes('/series/')) {
            return 'series';
        }

        // Movies / VOD detection
        if (group.includes('filmes') || group.includes('movies') || group.includes('vod') || group.includes('cinema') || url.includes('/movie/') || /\.(mp4|mkv|avi)$/i.test(url)) {
            return 'vod';
        }

        return 'live';
    }

    /**
     * Download and parse M3U from remote URL
     */
    async fetchFromUrl(url) {
        const response = await axios.get(url, {
            timeout: 25000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': '*/*'
            },
            maxContentLength: 100 * 1024 * 1024 // 100MB max
        });

        return this.parse(response.data);
    }

    /**
     * Generate an M3U Plus file string from channels
     */
    exportToM3U(channels, filterOptions = {}) {
        let filtered = channels;

        if (filterOptions.onlyOnline) {
            filtered = filtered.filter(c => c.status === 'online');
        }

        if (filterOptions.group) {
            filtered = filtered.filter(c => c.group === filterOptions.group);
        }

        if (filterOptions.streamType) {
            filtered = filtered.filter(c => c.streamType === filterOptions.streamType);
        }

        let output = '#EXTM3U\n';
        for (const ch of filtered) {
            const attrs = [];
            if (ch.tvgId) attrs.push(`tvg-id="${ch.tvgId}"`);
            if (ch.name) attrs.push(`tvg-name="${ch.name}"`);
            if (ch.logo) attrs.push(`tvg-logo="${ch.logo}"`);
            if (ch.group) attrs.push(`group-title="${ch.group}"`);

            output += `#EXTINF:-1 ${attrs.join(' ')},${ch.name}\n`;
            output += `${ch.url}\n`;
        }

        return output;
    }
}

module.exports = new M3UParser();
