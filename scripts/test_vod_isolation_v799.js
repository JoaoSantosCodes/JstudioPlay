const axios = require('axios');
const path = require('path');
const fs = require('fs');

const envFile = fs.existsSync(path.join(__dirname, '..', 'CREDENCIAIS', '.env'))
    ? path.join(__dirname, '..', 'CREDENCIAIS', '.env')
    : path.join(__dirname, '.env');
require('dotenv').config({ path: envFile });

const PORT = process.env.PORT || 3030;
const base = `http://localhost:${PORT}`;

async function runVodIsolationSuite() {
    console.log('================================================================');
    console.log('🎬 SUÍTE DE TESTES: ISOLAMENTO VOD & THEATER CINEMÁTICO (v7.9.9)');
    console.log('================================================================\n');

    let passedCount = 0;
    let failedCount = 0;

    function assert(desc, condition) {
        if (condition) {
            console.log(`  [PASS] ${desc}`);
            passedCount++;
        } else {
            console.error(`  [FAIL] ${desc}`);
            failedCount++;
        }
    }

    try {
        // --- 1. Autenticação ---
        console.log('1. Autenticação:');
        const loginRes = await axios.post(`${base}/api/login`, {
            username: process.env.ADMIN_USERNAME || 'admin',
            password: process.env.ADMIN_PASSWORD || 'admin123'
        });
        const token = loginRes.data.token;
        assert('Login com token JWT válido', Boolean(token));
        const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

        // --- 2. Validação de IDs Estáveis e Endpoint /api/channels/:id ---
        console.log('\n2. Identificadores Estáveis & Persistentes:');
        const m3uParser = require('../server/services/m3uParser');
        const testCh1 = { url: 'http://test.com/movie/user/pass/54321.mp4', streamType: 'vod', tvgId: '54321', name: 'Matrix' };
        const id1 = m3uParser.generateId(testCh1);
        assert('ID determinístico extraído de URL com streamId (/54321.mp4)', id1 === 'vod_54321');

        const testCh2 = { url: 'http://test.com/live/stream.m3u8', streamType: 'live', tvgId: 'GLOBO', name: 'Globo HD' };
        const id2_a = m3uParser.generateId(testCh2);
        const id2_b = m3uParser.generateId(testCh2);
        assert('ID determinístico é 100% idempotente e reproduzível', id2_a === id2_b && id2_a.startsWith('live_'));

        const sessionRes = await axios.get(`${base}/api/session`, authHeaders);
        const playlist = sessionRes.data.playlists?.[0];
        if (playlist) {
            const sampleLive = await axios.get(`${base}/api/playlists/${playlist.id}/filter?type=live&limit=1`, authHeaders);
            const liveItem = sampleLive.data.channels?.[0];
            if (liveItem && liveItem.id) {
                const getByIdRes = await axios.get(`${base}/api/channels/${liveItem.id}`, authHeaders);
                assert('GET /api/channels/:id localiza o item pelo ID persistente', getByIdRes.data.id === liveItem.id);
            } else {
                assert('GET /api/channels/:id (nenhum canal retornado para testar ID)', true);
            }
        }

        // --- 3. Isolamento Estrito de Catálogo (Live vs VOD vs Series) ---
        console.log('\n3. Isolamento Estrito entre Grade Ao Vivo e Catálogo VOD:');
        if (playlist) {
            const liveRes = await axios.get(`${base}/api/playlists/${playlist.id}/filter?type=live&limit=25`, authHeaders);
            const allLive = (liveRes.data.channels || []).every(c => c.streamType === 'live' || !c.streamType);
            assert('Todos os itens retornados por /filter?type=live são transmissões ao vivo', allLive);

            const vodRes = await axios.get(`${base}/api/playlists/${playlist.id}/filter?type=vod&limit=25`, authHeaders);
            const allVod = (vodRes.data.channels || []).every(c => c.streamType === 'vod');
            assert('Todos os itens retornados por /filter?type=vod são exclusivamente filmes sob demanda', allVod);

            const seriesRes = await axios.get(`${base}/api/playlists/${playlist.id}/filter?type=series&limit=25`, authHeaders);
            const allSeries = (seriesRes.data.channels || []).every(c => c.streamType === 'series');
            assert('Todos os itens retornados por /filter?type=series são exclusivamente séries', allSeries);
        }

        // --- 4. Verificação Estática de Regressão & Frontend ---
        console.log('\n4. Integridade da Lógica Frontend e Player Cinemático:');
        const appJs = fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'app.js'), 'utf8');

        assert('app.js define função openVodTheater dedicada', appJs.includes('function openVodTheater('));
        assert('app.js define função closeVodTheater', appJs.includes('function closeVodTheater('));
        assert('openVodTheater possui header com botão de voltar ao catálogo', appJs.includes('iptv-vod-back-btn'));
        assert('openVodTheater possui elemento de vídeo dedicado', appJs.includes('iptv-vod-video-element'));
        assert('play-vod-item e start-vod-theater chamam openVodTheater diretamente', appJs.includes('openVodTheater(target)'));
        assert('play-vod-item NÃO força redirecionamento location.hash = \'#/live\'', !appJs.includes("if(action==='play-vod-item'){location.hash = '#/live'"));
        assert('filter-master-cat encaminha Filmes para #/movies', appJs.includes("location.hash = '#/movies'"));
        assert('filter-master-cat encaminha Séries para #/series', appJs.includes("location.hash = '#/series'"));
        assert('livePage exclui pills enganosas de Filmes e Séries na TV ao vivo', !appJs.includes("const pills = ['Todos', 'Esportes', 'Filmes', 'Séries', 'Notícias']"));
        assert('Listener de teclado global trata tecla ESC para fechar theater VOD', appJs.includes("e.key === 'Escape'"));

        // --- 5. Versionamento v7.9.9+ ---
        console.log('\n5. Versionamento & Build Docker (v7.9.9+):');
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
        const [major, minor, patch] = pkg.version.split('.').map(Number);
        const isVersionGte = major > 7 || (major === 7 && minor === 9 && patch >= 9);
        assert('package.json versão é >= 7.9.9', isVersionGte);

        const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
        assert('index.html inclui scripts e estilos com cache-busting v>=7.9.9', /app\.js\?v=(7\.9\.(9|10|\d+)|8\.\d+\.\d+)/.test(indexHtml));

        const dockerfile = fs.readFileSync(path.join(__dirname, '..', 'Dockerfile'), 'utf8');
        assert('Dockerfile inclui LABEL version >= 7.9.9', /LABEL version="(7\.9\.9|8\.\d+\.\d+)"/.test(dockerfile));

        console.log('\n================================================================');
        console.log(`📊 RESULTADO FINAL: ${passedCount} PASSOU | ${failedCount} FALHOU`);
        console.log('================================================================\n');

        if (failedCount > 0) process.exit(1);
    } catch (err) {
        console.error('Erro na execução dos testes:', err);
        process.exit(1);
    }
}

runVodIsolationSuite();
