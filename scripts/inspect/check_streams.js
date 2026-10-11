const axios = require('axios');

const testUrls = [
    { name: 'Mux Big Buck Bunny HLS', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { name: 'Unified Streaming Tears of Steel', url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' },
    { name: 'Akamai Sintel HLS Demo', url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8' },
    { name: 'Bloomberg TV Live', url: 'https://liveproduseast.akamaized.net/us/Channel-USTV-AWS-virginia-1/Source-USTV-1000-1_live.m3u8' },
    { name: 'TV Brasil EBC', url: 'https://tvbrasil-hls.ebc.com.br/hls/tvbrasil.m3u8' }
];

async function check() {
    for (const item of testUrls) {
        try {
            const res = await axios.get(item.url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                timeout: 5000
            });
            console.log(`[ONLINE] ${item.name} -> HTTP ${res.status} (${res.data.length} bytes)`);
        } catch (e) {
            console.log(`[OFFLINE] ${item.name} -> ${e.message}`);
        }
    }
}

check();
