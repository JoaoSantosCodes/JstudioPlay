const axios = require('axios');

const streams = [
    { name: 'DW Deutsch (Live)', url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8' },
    { name: 'Red Bull TV (Live)', url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8' },
    { name: 'France 24 English', url: 'https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8' },
    { name: 'Al Jazeera English', url: 'https://live-hls-web-aje.getaj.net/AJE/03.m3u8' }
];

async function checkMore() {
    for (const item of streams) {
        try {
            const res = await axios.get(item.url, { timeout: 4000 });
            console.log(`[ONLINE] ${item.name} -> HTTP ${res.status}`);
        } catch (e) {
            console.log(`[OFFLINE] ${item.name} -> ${e.message}`);
        }
    }
}

checkMore();
