const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'm3u_secret_key_889922aabbcc';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLivePlaylists() {
    console.log('==============================================================================');
    console.log('🧪 TESTE EM TEMPO REAL DAS NOVAS PLAYLISTS IMPORTADAS');
    console.log('==============================================================================\n');

    try {
        // 1. Listar Playlists
        console.log('1. Consultando Playlists Cadastradas...');
        const session = await axios.get(`${BASE_URL}/api/session`);
        const playlists = session.data.playlists;
        console.log(`   [✓] ${playlists.length} playlists ativas encontradas:\n`);

        for (const p of playlists) {
            console.log(`   - 📺 [${p.name}]`);
            console.log(`     ID: ${p.id} | Total: ${p.total} canais | Categorias: ${p.categories || 'Diversas'}`);
        }

        // 2. Testar Canais da Lista Brasil
        const brPlaylist = playlists.find(p => p.name.includes('Brasil')) || playlists[0];
        console.log(`\n2. Testando canais da lista "${brPlaylist.name}"...`);
        const brChannels = await axios.get(`${BASE_URL}/api/playlists/${brPlaylist.id}/channels`);
        console.log(`   [✓] Retornados ${brChannels.data.length} canais!`);
        console.log(`   [✓] Primeiros 3 canais:`);
        brChannels.data.slice(0, 3).forEach((c, idx) => {
            console.log(`       ${idx + 1}. ${c.name} (${c.group || 'Geral'}) -> ${c.url.slice(0, 60)}...`);
        });

        // 3. Disparar Validador em Lote com Concorrência
        console.log(`\n3. Disparando Validação de Streams em Lote na lista "${brPlaylist.name}"...`);
        const checkJob = await axios.post(`${BASE_URL}/api/automation/check/${brPlaylist.id}`, {
            concurrency: 15,
            timeout: 3000
        }, {
            headers: { 'X-API-Key': API_KEY }
        });

        console.log(`   [✓] Job de validação ativo! Total na fila: ${checkJob.data.total}`);
        process.stdout.write('   [⏳] Progresso dos workers: ');

        let lastStatus = null;
        for (let i = 0; i < 8; i++) {
            await sleep(1000);
            const st = await axios.get(`${BASE_URL}/api/automation/check/${brPlaylist.id}/status`, {
                headers: { 'X-API-Key': API_KEY }
            });
            lastStatus = st.data;
            process.stdout.write(`${st.data.percentage || 0}% `);
            if (!st.data.isRunning) break;
        }

        console.log(`\n   [✓] Status Parcial/Final: 🟢 ${lastStatus.online || 0} Online | 🔴 ${lastStatus.offline || 0} Offline`);

        // 4. Testar Playback do Primeiro Canal Ativo
        console.log(`\n4. Testando Rota de Streaming e Proxy CORS (/api/playback)...`);
        const playRes = await axios.post(`${BASE_URL}/api/playback`, {
            playlistId: brPlaylist.id,
            channelIndex: 0
        });
        console.log(`   [✓] Modo: ${playRes.data.mode.toUpperCase()}`);
        console.log(`   [✓] URL Gerada: ${playRes.data.url}`);

        // 5. Testar Download da M3U Limpa
        console.log(`\n5. Testando Exportador da Lista Limpa (GET /api/playlists/${brPlaylist.id}/export?filter=online)...`);
        const exportRes = await axios.get(`${BASE_URL}/api/playlists/${brPlaylist.id}/export?filter=online`);
        console.log(`   [✓] Arquivo M3U gerado com sucesso! Tamanho: ${exportRes.data.length} bytes`);

        // 6. Consultar Estatísticas Globais do Sistema
        console.log(`\n6. Consultando Estatísticas Consolidadas (GET /api/webhooks/stats)...`);
        const stats = await axios.get(`${BASE_URL}/api/webhooks/stats`, {
            headers: { 'X-API-Key': API_KEY }
        });
        console.log(`   [✓] Total de Listas: ${stats.data.counts.playlists}`);
        console.log(`   [✓] Total Geral de Canais no Sistema: ${stats.data.counts.channels.toLocaleString('pt-BR')}`);
        console.log(`   [✓] Canais Validados Online: ${stats.data.counts.online.toLocaleString('pt-BR')}`);

        console.log('\n==============================================================================');
        console.log('🎉 TODOS OS TESTES EM TEMPO REAL FORAM EXECUTADOS COM SUCESSO!');
        console.log('==============================================================================');

    } catch (e) {
        console.error('\n❌ Erro durante o teste:', e.message);
        if (e.response?.data) {
            console.error('Detalhes:', e.response.data);
        }
    }
}

testLivePlaylists();
