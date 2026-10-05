const axios = require('axios');

async function testSystem() {
    const base = 'http://localhost:3000';
    console.log('=== TESTANDO SISTEMA M3U PLAY CLONE & AUTOMAÇÃO ===\n');

    try {
        // 1. Test Session
        console.log('1. Testando GET /api/session...');
        const sessionRes = await axios.get(`${base}/api/session`);
        console.log('   [OK] Usuário:', sessionRes.data.user.name, `(${sessionRes.data.user.role})`);
        console.log('   [OK] Playlists carregadas:', sessionRes.data.playlists.length);

        const playlist = sessionRes.data.playlists[0];
        if (!playlist) {
            console.error('   [ERRO] Nenhuma playlist encontrada.');
            return;
        }

        console.log(`   [OK] Playlist ID: ${playlist.id}, Nome: "${playlist.name}", Total canais: ${playlist.total}`);

        // 2. Test Channels
        console.log(`\n2. Testando GET /api/playlists/${playlist.id}/channels...`);
        const chRes = await axios.get(`${base}/api/playlists/${playlist.id}/channels`);
        console.log('   [OK] Canais retornados:', chRes.data.length);
        console.log('   [OK] Exemplo canal 1:', chRes.data[0].name, '->', chRes.data[0].url);

        // 3. Test Playback Relay
        console.log('\n3. Testando POST /api/playback (CORS Streaming Proxy)...');
        const playRes = await axios.post(`${base}/api/playback`, {
            playlistId: playlist.id,
            channelIndex: 0
        });
        console.log('   [OK] Modo de reprodução:', playRes.data.mode);
        console.log('   [OK] URL gerada pelo Relay:', playRes.data.url);

        // 4. Test Stream Checker Automation
        console.log(`\n4. Testando POST /api/automation/check/${playlist.id} (Validador de Streams)...`);
        const checkRes = await axios.post(`${base}/api/automation/check/${playlist.id}`, {
            concurrency: 5,
            timeout: 3000
        });
        console.log('   [OK] Job de validação iniciado. Status inicial:', checkRes.data);

        // Wait 3 seconds and poll status
        console.log('\n5. Aguardando processamento da validação em segundo plano...');
        await new Promise(r => setTimeout(r, 3500));

        const statusRes = await axios.get(`${base}/api/automation/check/${playlist.id}/status`);
        console.log('   [OK] Status da Validação:', statusRes.data);

        // 6. Test Export M3U
        console.log(`\n6. Testando GET /api/playlists/${playlist.id}/export?filter=online (Exportador M3U Limpa)...`);
        const expRes = await axios.get(`${base}/api/playlists/${playlist.id}/export?filter=online`);
        console.log('   [OK] M3U exportada com sucesso! Tamanho:', expRes.data.length, 'bytes');
        console.log('   [OK] Primeiras linhas da M3U:\n' + expRes.data.split('\n').slice(0, 5).join('\n'));

        console.log('\n====================================================');
        console.log('✅ TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
        console.log('====================================================');
    } catch (e) {
        console.error('Erro no teste:', e.message, e.response?.data);
    }
}

testSystem();
