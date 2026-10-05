const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'm3u_secret_key_889922aabbcc';

const extraPlaylists = [
    {
        name: '🎨 Desenhos, Animação & Família (HD)',
        url: 'https://iptv-org.github.io/iptv/categories/animation.m3u'
    },
    {
        name: '🏛️ Documentários & Ciência (NASA, DW, Smithsonian)',
        url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u'
    },
    {
        name: '🏎️ Automobilismo, Velocidade & Motores',
        url: 'https://iptv-org.github.io/iptv/categories/auto.m3u'
    },
    {
        name: '🎞️ Clássicos do Cinema & Domínio Público',
        url: 'https://iptv-org.github.io/iptv/categories/classic.m3u'
    }
];

async function addMore() {
    for (const pl of extraPlaylists) {
        try {
            const res = await axios.post(`${BASE_URL}/api/playlists`, {
                name: pl.name,
                url: pl.url
            }, {
                headers: { 'X-API-Key': API_KEY }
            });
            console.log(`[✓ OK] ${pl.name} -> ${res.data.total} canais`);
        } catch (e) {
            console.log(`[✗ ERRO] ${pl.name}: ${e.message}`);
        }
    }
}

addMore();
