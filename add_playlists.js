const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'm3u_secret_key_889922aabbcc';

const playlistsToAdd = [
    {
        name: '🇧🇷 Brasil — TV Aberta & Notícias (IPTV Brasil)',
        url: 'https://iptv-org.github.io/iptv/countries/br.m3u'
    },
    {
        name: '🌍 Global News — Notícias Internacionais',
        url: 'https://iptv-org.github.io/iptv/categories/news.m3u'
    },
    {
        name: '⚽ Global Sports — Esportes & Aventura',
        url: 'https://iptv-org.github.io/iptv/categories/sports.m3u'
    },
    {
        name: '🎬 Cinema & Filmes (VOD Demo & Clássicos)',
        url: 'https://iptv-org.github.io/iptv/categories/movies.m3u'
    }
];

async function addPlaylists() {
    console.log('==============================================================================');
    console.log('🚀 IMPORTANDO PLAYLISTS M3U DIRETAMENTE NA APLICAÇÃO');
    console.log('==============================================================================\n');

    for (const pl of playlistsToAdd) {
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
            console.log(`    - Categorias Identificadas: ${res.data.categories || 'Automáticas'}\n`);
        } catch (err) {
            console.error(`    [✗ ERRO] Falha ao importar ${pl.name}:`, err.message);
            if (err.response?.data) {
                console.error('    Detalhes:', err.response.data);
            }
            console.log('');
        }
    }

    console.log('==============================================================================');
    console.log('🎉 TODAS AS PLAYLISTS FORAM ADICIONADAS À SUA CONTA COM SUCESSO!');
    console.log('Acesse agora http://localhost:3000/#/dashboard para assistir!');
    console.log('==============================================================================');
}

addPlaylists();
