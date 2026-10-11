const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'm3u_secret_key_889922aabbcc';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`   [✓ PASS] ${message}`);
        passed++;
    } else {
        console.error(`   [✗ FAIL] ${message}`);
        failed++;
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runEndToEndTestSuite() {
    console.log('==============================================================================');
    console.log('🧪 INICIANDO SUÍTE DE TESTES PONTA A PONTA (E2E) - M3U PLAY PRO');
    console.log('==============================================================================\n');

    try {
        // -------------------------------------------------------------
        // TESTE 1: Servidor Web e Arquivos Estáticos
        // -------------------------------------------------------------
        console.log('📦 1. TESTE DE SERVIDOR & FRONTEND ASSETS');
        const indexHtml = await axios.get(`${BASE_URL}/`);
        assert(indexHtml.status === 200, 'index.html respondendo com HTTP 200');
        assert(indexHtml.data.includes('M3U PLAY'), 'HTML contém o título da aplicação');
        assert(indexHtml.data.includes('automation.js'), 'Script de automação carregado no HTML');

        const cssResp = await axios.get(`${BASE_URL}/static/styles.css`);
        assert(cssResp.status === 200 && cssResp.data.length > 10000, 'styles.css servido corretamente');

        const autoCss = await axios.get(`${BASE_URL}/static/automation.css`);
        assert(autoCss.status === 200, 'automation.css servido corretamente');

        const appJs = await axios.get(`${BASE_URL}/static/app.js`);
        assert(appJs.status === 200 && appJs.data.length > 20000, 'app.js SPA engine servido');

        // -------------------------------------------------------------
        // TESTE 2: Autenticação, Usuários e Sessão
        // -------------------------------------------------------------
        console.log('\n🔐 2. TESTE DE AUTENTICAÇÃO E GESTÃO DE SESSÃO');
        const sessionRes = await axios.get(`${BASE_URL}/api/session`);
        assert(sessionRes.data.user !== null, 'Sessão ativa detectada');
        assert(sessionRes.data.user.role === 'admin', 'Usuário logado possui perfil de Administrador');

        // Testar login com credenciais válidas
        const loginRes = await axios.post(`${BASE_URL}/api/login`, {
            username: 'admin',
            password: 'admin123'
        });
        assert(loginRes.status === 200 && loginRes.data.username === 'admin', 'Login do Administrador validado com sucesso');

        // Testar login com senha errada
        try {
            await axios.post(`${BASE_URL}/api/login`, { username: 'admin', password: 'wrongpassword' });
            assert(false, 'Bloqueio de senha incorreta');
        } catch (e) {
            assert(e.response.status === 401, 'Bloqueio de credenciais incorretas (HTTP 401)');
        }

        // -------------------------------------------------------------
        // TESTE 3: Criação de Playlist e Parser M3U
        // -------------------------------------------------------------
        console.log('\n📺 3. TESTE DE PARSER M3U & CRIAÇÃO DE PLAYLIST');
        const sampleM3u = `#EXTM3U
#EXTINF:-1 tvg-id="rb1" tvg-name="Red Bull TV" tvg-logo="https://i.imgur.com/logo1.png" group-title="Esportes",Red Bull TV HD
https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8
#EXTINF:-1 tvg-id="bb1" tvg-name="Big Buck Bunny" group-title="Filmes",Big Buck Bunny 1080p
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
#EXTINF:-1 tvg-id="dw1" group-title="Notícias",DW News HD
https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8`;

        const newPlaylist = await axios.post(`${BASE_URL}/api/playlists`, {
            name: 'Playlist de Teste E2E',
            text: sampleM3u
        });
        assert(newPlaylist.status === 200, 'Playlist criada via texto M3U');
        assert(newPlaylist.data.total === 3, 'Parser extraiu exatamente 3 canais');
        assert(newPlaylist.data.categories === 3, 'Parser identificou 3 categorias distintas (Esportes, Filmes, Notícias)');

        const playlistId = newPlaylist.data.id;

        // -------------------------------------------------------------
        // TESTE 4: Consulta de Canais e Dados da Playlist
        // -------------------------------------------------------------
        console.log('\n📋 4. TESTE DE CONSULTA DE CANAIS');
        const channelsRes = await axios.get(`${BASE_URL}/api/playlists/${playlistId}/channels`);
        assert(channelsRes.data.length === 3, 'Retorno dos 3 canais cadastrados');
        assert(channelsRes.data[0].name === 'Red Bull TV HD', 'Nome do canal 1 preservado');
        assert(channelsRes.data[0].group === 'Esportes', 'Categoria do canal 1 preservada');

        // -------------------------------------------------------------
        // TESTE 5: Favoritos, Histórico e Gravação de Progresso
        // -------------------------------------------------------------
        console.log('\n⭐ 5. TESTE DE FAVORITOS, HISTÓRICO & PROGRESSO');
        const favRes = await axios.put(`${BASE_URL}/api/favorites`, {
            playlistId,
            channel: channelsRes.data[0]
        });
        assert(favRes.data.some(f => f.playlistId === playlistId), 'Canal adicionado aos favoritos');

        const histRes = await axios.post(`${BASE_URL}/api/history`, {
            playlistId,
            channel: channelsRes.data[0]
        });
        assert(histRes.data.length > 0, 'Registro adicionado ao histórico de reprodução');

        const progRes = await axios.put(`${BASE_URL}/api/progress`, {
            playlistId,
            channel: channelsRes.data[1],
            position: 145.5,
            duration: 600.0
        });
        assert(progRes.data.some(p => p.position === 145.5), 'Timestamp de progresso (145.5s) gravado com sucesso');

        // -------------------------------------------------------------
        // TESTE 6: Relay CORS & Proxy de Streaming
        // -------------------------------------------------------------
        console.log('\n⚡ 6. TESTE DE RELAY CORS & PROXY DE STREAMING');
        const playbackRes = await axios.post(`${BASE_URL}/api/playback`, {
            playlistId,
            channelIndex: 0
        });
        assert(playbackRes.data.mode === 'hls', 'Detecção correta do tipo HLS');
        assert(playbackRes.data.url.startsWith('/proxy/stream?url='), 'Geração de URL de proxy interno');

        const proxyStreamRes = await axios.get(`${BASE_URL}${playbackRes.data.url}`);
        assert(proxyStreamRes.status === 200, 'Proxy de streaming retornou HTTP 200');
        assert(proxyStreamRes.headers['access-control-allow-origin'] === '*', 'Cabeçalho CORS Access-Control-Allow-Origin presente');
        assert(proxyStreamRes.data.includes('#EXTM3U'), 'Manifesto HLS .m3u8 entregue ao player');

        // -------------------------------------------------------------
        // TESTE 7: Validação Automática de Streams (Health Checker)
        // -------------------------------------------------------------
        console.log('\n🔍 7. TESTE DO MOTOR DE VALIDAÇÃO DE STREAMS');
        const checkStart = await axios.post(`${BASE_URL}/api/automation/check/${playlistId}`, {
            concurrency: 5,
            timeout: 3000
        });
        assert(checkStart.data.isRunning === true, 'Job de validação disparado em segundo plano');

        // Aguardar conclusão da validação
        let checkCompleted = false;
        let finalCheckStatus = null;
        for (let i = 0; i < 10; i++) {
            await sleep(1000);
            const status = await axios.get(`${BASE_URL}/api/automation/check/${playlistId}/status`);
            if (!status.data.isRunning) {
                checkCompleted = true;
                finalCheckStatus = status.data;
                break;
            }
        }
        assert(checkCompleted, 'Validação de streams finalizada dentro do tempo limite');
        assert(finalCheckStatus.onlineCount > 0, `Streams testados com sucesso (${finalCheckStatus.onlineCount} online)`);

        // -------------------------------------------------------------
        // TESTE 8: Exportação de M3U Limpa (Online Only)
        // -------------------------------------------------------------
        console.log('\n📥 8. TESTE DO EXPORTADOR DE M3U LIMPA');
        const exportOnline = await axios.get(`${BASE_URL}/api/playlists/${playlistId}/export?filter=online`);
        assert(exportOnline.status === 200, 'Download do arquivo .m3u realizado com sucesso');
        assert(exportOnline.headers['content-type'].includes('mpegurl'), 'Content-Type de áudio/vídeo M3U correto');
        assert(exportOnline.data.startsWith('#EXTM3U'), 'Estrutura padrão #EXTM3U válida');

        // -------------------------------------------------------------
        // TESTE 9: Integração n8n & Webhooks
        // -------------------------------------------------------------
        console.log('\n🤖 9. TESTE DE WEBHOOKS & INTEGRAÇÃO N8N');
        // Teste de Autenticação por API Key
        const statsRes = await axios.get(`${BASE_URL}/api/webhooks/stats`, {
            headers: { 'X-API-Key': API_KEY }
        });
        assert(statsRes.status === 200, 'Acesso autenticado via X-API-Key para n8n');
        assert(statsRes.data.counts.playlists >= 1, 'Métricas globais de playlists acessíveis');

        // Teste de Provisionamento de Usuário com Expiração (Fluxo 3 n8n)
        const provisionUser = await axios.post(`${BASE_URL}/api/webhooks/provision-user`, {
            name: 'Cliente E2E Teste',
            username: 'cliente_e2e_user',
            password: 'pass_segura_e2e',
            daysValid: 7,
            playlistIds: [playlistId]
        }, {
            headers: { 'X-API-Key': API_KEY }
        });
        assert(provisionUser.data.success === true, 'Cliente provisionado via Webhook n8n');
        assert(provisionUser.data.user.daysValid === 7, 'Tempo de expiração configurado (7 dias)');

        // Testar se o novo cliente consegue logar
        const clientLogin = await axios.post(`${BASE_URL}/api/login`, {
            username: 'cliente_e2e_user',
            password: 'pass_segura_e2e'
        });
        assert(clientLogin.status === 200, 'Novo cliente criado pelo n8n realizou login com sucesso');

        // -------------------------------------------------------------
        // TESTE 10: Inicialização Automática com o Windows
        // -------------------------------------------------------------
        console.log('\n🪟 10. TESTE DA INICIALIZAÇÃO AUTOMÁTICA COM O WINDOWS');
        const startupFolder = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
        const shortcutFile = path.join(startupFolder, 'M3U_PLAY_Pro.lnk');
        const shortcutExists = fs.existsSync(shortcutFile);
        assert(shortcutExists, `Atalho de inicialização encontrado em: ${shortcutFile}`);

        // Limpeza da playlist de teste
        await axios.delete(`${BASE_URL}/api/playlists/${playlistId}`);

        // -------------------------------------------------------------
        // RESUMO FINAL
        // -------------------------------------------------------------
        console.log('\n==============================================================================');
        console.log(`📊 RESUMO DA EXECUÇÃO E2E:`);
        console.log(`   - Testes Executados: ${passed + failed}`);
        console.log(`   - Aprovados: \x1b[32m${passed}\x1b[0m`);
        console.log(`   - Falhas: \x1b[31m${failed}\x1b[0m`);
        console.log(`   - Taxa de Sucesso: \x1b[32m${((passed / (passed + failed)) * 100).toFixed(1)}%\x1b[0m`);
        console.log('==============================================================================');

        if (failed === 0) {
            console.log('🎉 APLICAÇÃO 100% OPERACIONAL, ESTÁVEL E VALIDADA DE PONTA A PONTA!');
        }

    } catch (err) {
        console.error('\n❌ Erro crítico durante o teste:', err.message);
        if (err.response?.data) {
            console.error('Detalhes:', err.response.data);
        }
    }
}

runEndToEndTestSuite();
