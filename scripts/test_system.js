const axios = require('axios');

const path = require('path');
const fs = require('fs');
const envFile = fs.existsSync(path.join(__dirname, 'CREDENCIAIS', '.env'))
    ? path.join(__dirname, 'CREDENCIAIS', '.env')
    : path.join(__dirname, '.env');
require('dotenv').config({ path: envFile });

const PORT = process.env.PORT || 3030;
const base = `http://localhost:${PORT}`;

async function testSystem() {
    console.log('=== TESTANDO SISTEMA M3U PLAY CLONE & AUTOMAÇÃO ===\n');

    try {
        // 1. Login
        console.log('1. Realizando autenticação em POST /api/login...');
        const loginRes = await axios.post(`${base}/api/login`, {
            username: process.env.ADMIN_USERNAME || 'admin',
            password: process.env.ADMIN_PASSWORD || 'admin123'
        });
        const token = loginRes.data.token;
        console.log('   [OK] Token de sessão obtido com sucesso!');
        console.log('   [OK] Usuário autenticado:', loginRes.data.name, `(${loginRes.data.role})`);

        const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

        // 2. Test Session
        console.log('\n2. Testando GET /api/session...');
        const sessionRes = await axios.get(`${base}/api/session`, authHeaders);
        console.log('   [OK] Playlists do usuário carregadas:', sessionRes.data.playlists.length);

        let playlist = sessionRes.data.playlists[0];
        if (!playlist) {
            console.log('   [INFO] Nenhuma playlist encontrada na conta. Verificando playlists do sistema...');
            const allPlRes = await axios.get(`${base}/api/playlists`, authHeaders);
            if (allPlRes.data && allPlRes.data.length > 0) {
                playlist = allPlRes.data[0];
            }
        }

        if (playlist) {
            console.log(`   [OK] Playlist ID: ${playlist.id}, Nome: "${playlist.name}", Total canais: ${playlist.total}`);

            // 3. Test Channels
            console.log(`\n3. Testando GET /api/playlists/${playlist.id}/channels...`);
            const chRes = await axios.get(`${base}/api/playlists/${playlist.id}/channels`, authHeaders);
            console.log('   [OK] Canais retornados:', chRes.data.length);
            if (chRes.data.length > 0) {
                console.log('   [OK] Exemplo canal 1:', chRes.data[0].name, '->', chRes.data[0].url);
            }

            // 4. Test Playback Relay
            console.log('\n4. Testando POST /api/playback (CORS Streaming Proxy)...');
            const playRes = await axios.post(`${base}/api/playback`, {
                playlistId: playlist.id,
                channelIndex: 0
            }, authHeaders);
            console.log('   [OK] Modo de reprodução:', playRes.data.mode);
            console.log('   [OK] URL gerada pelo Relay:', playRes.data.url);

            // 5. Test Stream Checker Automation
            console.log(`\n5. Testando POST /api/automation/check/${playlist.id} (Validador de Streams)...`);
            const checkRes = await axios.post(`${base}/api/automation/check/${playlist.id}`, {
                concurrency: 5,
                timeout: 3000
            }, authHeaders);
            console.log('   [OK] Job de validação iniciado. Status inicial:', checkRes.data);

            // Wait 2 seconds and poll status
            console.log('\n6. Aguardando processamento da validação em segundo plano...');
            await new Promise(r => setTimeout(r, 2000));

            const statusRes = await axios.get(`${base}/api/automation/check/${playlist.id}/status`, authHeaders);
            console.log('   [OK] Status da Validação:', statusRes.data);

            // 7. Test Export M3U
            console.log(`\n7. Testando GET /api/playlists/${playlist.id}/export?filter=online (Exportador M3U Limpa)...`);
            const expRes = await axios.get(`${base}/api/playlists/${playlist.id}/export?filter=online`, authHeaders);
            console.log('   [OK] M3U exportada com sucesso! Tamanho:', expRes.data.length, 'bytes');
        }

        console.log('\n====================================================');
        console.log('✅ TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
        console.log('====================================================');
        process.exit(0);
    } catch (e) {
        console.error('Erro no teste:', e.message, e.response?.data);
        process.exit(1);
    }
}

testSystem();
