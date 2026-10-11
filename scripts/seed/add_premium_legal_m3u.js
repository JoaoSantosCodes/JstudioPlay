const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'm3u_secret_key_889922aabbcc';

const highQualityPlaylists = [
    {
        name: '⭐ Pluto TV Brasil (HD Oficial — Séries, Filmes & Animes)',
        url: 'https://i.mjh.nz/PlutoTV/br.m3u8'
    },
    {
        name: '📺 Samsung TV Plus Brasil (Canais FAST Oficiais em HD)',
        url: 'https://i.mjh.nz/SamsungTVPlus/br.m3u8'
    },
    {
        name: '🇵🇹 Língua Portuguesa Global (Brasil & Portugal)',
        url: 'https://iptv-org.github.io/iptv/languages/por.m3u'
    },
    {
        name: '🎵 Música & Videoclipes 24/7 (Global Music)',
        url: 'https://iptv-org.github.io/iptv/categories/music.m3u'
    },
    {
        name: '🌿 Natureza, Paisagens & Câmeras ao Vivo (4K/HD)',
        url: 'https://iptv-org.github.io/iptv/categories/relax.m3u'
    }
];

async function addHighQualityPlaylists() {
    console.log('==============================================================================');
    console.log('🚀 IMPORTANDO AS MELHORES PLAYLISTS M3U (ALTA QUALIDADE & 100% LEGAIS)');
    console.log('==============================================================================\n');

    for (const pl of highQualityPlaylists) {
        console.log(`[+] Baixando e importando: "${pl.name}"...`);
        console.log(`    URL: ${pl.url}`);

        try {
            const start = Date.now();
            const res = await axios.post(`${BASE_URL}/api/playlists`, {
                name: pl.name,
                url: pl.url
            }, {
                headers: { 'X-API-Key': API_KEY },
                timeout: 35000
            });

            const elapsed = ((Date.now() - start) / 1000).toFixed(1);
            console.log(`    [✓ SUCESSO] Importada em ${elapsed}s!`);
            console.log(`    - ID: ${res.data.id}`);
            console.log(`    - Total de Canais: ${res.data.total}`);
            console.log(`    - Categorias: ${res.data.categories || 'Automáticas'}\n`);
        } catch (err) {
            console.error(`    [✗ ERRO] Falha ao importar ${pl.name}:`, err.message);
        }
    }

    console.log('==============================================================================');
    console.log('🎉 PLAYLISTS DE ALTA QUALIDADE CARREGADAS COM SUCESSO NO M3U PLAY PRO!');
    console.log('Acesse agora http://localhost:3000/#/player para assistir aos novos canais!');
    console.log('==============================================================================');
}

addHighQualityPlaylists();
