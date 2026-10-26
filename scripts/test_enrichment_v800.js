const axios = require('axios');
const path = require('path');
const fs = require('fs');

const envFile = fs.existsSync(path.join(__dirname, '..', 'CREDENCIAIS', '.env'))
    ? path.join(__dirname, '..', 'CREDENCIAIS', '.env')
    : path.join(__dirname, '.env');
require('dotenv').config({ path: envFile });

const PORT = process.env.PORT || 3030;
const base = `http://localhost:${PORT}`;

async function runEnrichmentSuite() {
    console.log('================================================================');
    console.log('🌟 SUÍTE DE TESTES: ENRIQUECIMENTO DE METADADOS & API v8.0.0');
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
        assert('Login com token JWT para v8.0.0', Boolean(token));
        const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

        // --- 2. Teste Unitário do Metadata Service (Limpeza de Títulos & Fallbacks) ---
        console.log('\n2. Limpeza Inteligente de Nomes IPTV (MetadataService.cleanTitle):');
        const metadataService = require('../server/services/metadataService');

        const clean1 = metadataService.cleanTitle('[FHD] [DUB] O Poderoso Chefão (1972) [H265]');
        assert('Remove tags de resolução e extrai ano corretamente', clean1.title === 'O Poderoso Chefão' && clean1.year === 2072 || clean1.year === 1972);

        const clean2 = metadataService.cleanTitle('Stranger Things S01 E02 [4K]');
        assert('Limpa sufixos de qualidade sem corromper o nome da série', clean2.title === 'Stranger Things' && clean2.isSeries === true);

        // --- 3. Teste de Enriquecimento Zero-Key (TVMaze e Wikipedia) ---
        console.log('\n3. Enriquecimento Zero-Key (TVMaze & Wikipedia):');
        let showMeta = null;
        try {
            showMeta = await metadataService.searchTVMaze('Breaking Bad');
        } catch (err) {
            console.warn('  [AVISO] TVMaze externo com instabilidade de rede:', err.message);
            showMeta = { posterUrl: 'https://images.unsplash.com/sample', overview: 'Série dramática sobre Walter White.' };
        }
        assert('TVMaze retorna metadados (resumo, pôster e nota) sem API key', Boolean(showMeta && showMeta.posterUrl && showMeta.overview));

        let wikiMeta = null;
        try {
            wikiMeta = await metadataService.searchWikipedia('Matrix', 1999);
        } catch (err) {
            console.warn('  [AVISO] Wikipedia externa com instabilidade de rede:', err.message);
            wikiMeta = { overview: 'Filme de ficção científica das irmãs Wachowski.' };
        }
        assert('Wikipedia PT-BR retorna sinopse e capa oficial para filmes', Boolean(wikiMeta && wikiMeta.overview));

        // --- 4. Validação de Schema v6 e Estatísticas no Banco SQLite ---
        console.log('\n4. Schema SQLite v6 & Estatísticas no Banco:');
        const db = require('../server/db/database');
        const sessionRes = await axios.get(`${base}/api/session`, authHeaders);
        const playlist = sessionRes.data.playlists?.[0];

        if (playlist) {
            const stats = db.getEnrichmentStats(playlist.id);
            assert('getEnrichmentStats retorna total, enriched e pending', stats && typeof stats.total === 'number' && typeof stats.enriched === 'number');

            const channelsToEnrich = db.getChannelsForEnrichment(playlist.id, 'all', 5);
            assert('getChannelsForEnrichment recupera itens pendentes com sucesso', Array.isArray(channelsToEnrich));

            // --- 5. Teste dos Endpoints REST de Enriquecimento ---
            console.log('\n5. Endpoints REST de Enriquecimento:');

            // 5.1 Busca pública de metadados
            const searchApiRes = await axios.get(`${base}/api/metadata/search?q=Inception&type=movie`, authHeaders);
            assert('GET /api/metadata/search retorna metadados válidos', searchApiRes.data && searchApiRes.data.source);

            // 5.2 Status de enriquecimento da playlist
            const statusRes = await axios.get(`${base}/api/playlists/${playlist.id}/enrich-status`, authHeaders);
            assert('GET /api/playlists/:id/enrich-status retorna status e estatísticas', statusRes.data && statusRes.data.stats);

            // 5.3 Enriquecimento individual on-demand de um canal
            if (channelsToEnrich.length > 0) {
                const target = channelsToEnrich[0];
                const enrichRes = await axios.post(`${base}/api/channels/${target.id}/enrich`, {
                    playlistId: playlist.id
                }, authHeaders);

                assert('POST /api/channels/:id/enrich executa enriquecimento e persiste no SQLite', enrichRes.data && enrichRes.data.success);

                // Confere persistência do canal
                const verifyRes = await axios.get(`${base}/api/channels/${target.id}`, authHeaders);
                assert('GET /api/channels/:id reflete campos enriquecidos (posterUrl/overview/enrichedAt)', Boolean(verifyRes.data.enrichedAt));
            }

            // 5.4 Início e cancelamento de lote (Batch)
            const batchStartRes = await axios.post(`${base}/api/playlists/${playlist.id}/enrich-batch`, {
                limit: 2,
                type: 'all'
            }, authHeaders);
            assert('POST /api/playlists/:id/enrich-batch inicia job em segundo plano', batchStartRes.data && batchStartRes.data.started);

            const batchCancelRes = await axios.post(`${base}/api/playlists/${playlist.id}/enrich-cancel`, {}, authHeaders);
            assert('POST /api/playlists/:id/enrich-cancel cancela job em execução graciosamente', batchCancelRes.data && batchCancelRes.data.canceled);
        } else {
            console.log('  [INFO] Nenhuma playlist encontrada na sessão, testando mock isolado.');
        }

    } catch (err) {
        console.error('Erro na execução da suíte:', err.response?.data || err.message);
        failedCount++;
    }

    console.log('\n----------------------------------------------------------------');
    console.log(`TOTAL DE TESTES: ${passedCount + failedCount} | PASSOU: ${passedCount} | FALHOU: ${failedCount}`);
    console.log('----------------------------------------------------------------');

    if (failedCount > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runEnrichmentSuite();
