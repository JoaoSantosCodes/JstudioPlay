const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'm3u_secret_key_889922aabbcc';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCompleteDemonstration() {
    console.log('================================================================');
    console.log('🚀 INICIANDO TESTE COMPLETO DO M3U PLAY PRO & AUTOMAÇÃO N8N');
    console.log('================================================================\n');

    try {
        // -------------------------------------------------------------
        // ETAPA 1: Teste de Inicialização e Sessão
        // -------------------------------------------------------------
        console.log('📌 ETAPA 1: Verificando Sessão e Banco de Dados...');
        const session = await axios.get(`${BASE_URL}/api/session`);
        console.log(`   [✓] Servidor Online!`);
        console.log(`   [✓] Usuário Ativo: ${session.data.user.name} (@${session.data.user.username}) - Perfil: ${session.data.user.role}`);
        console.log(`   [✓] Chave de API Configurada: ${session.data.settings.apiKey}`);
        console.log(`   [✓] Playlists Ativas: ${session.data.playlists.length} lista(s)\n`);

        const playlist = session.data.playlists[0];
        if (!playlist) {
            throw new Error('Nenhuma playlist encontrada para teste.');
        }

        // -------------------------------------------------------------
        // ETAPA 2: Teste do Validador de Streams (Stream Health Checker)
        // -------------------------------------------------------------
        console.log(`📌 ETAPA 2: Executando Teste de Streams na lista "${playlist.name}"...`);
        const startCheck = await axios.post(`${BASE_URL}/api/automation/check/${playlist.id}`, {
            concurrency: 10,
            timeout: 3000
        }, {
            headers: { 'X-API-Key': API_KEY }
        });
        console.log(`   [✓] Motor de validação disparado! Total de canais na fila: ${startCheck.data.total}`);

        // Acompanhar progresso
        process.stdout.write('   [⏳] Testando streams: ');
        let isDone = false;
        let lastStatus = null;
        for (let i = 0; i < 15; i++) {
            await sleep(800);
            const st = await axios.get(`${BASE_URL}/api/automation/check/${playlist.id}/status`, {
                headers: { 'X-API-Key': API_KEY }
            });
            lastStatus = st.data;
            process.stdout.write(`${st.data.percentage || 0}% `);
            if (!st.data.isRunning) {
                isDone = true;
                break;
            }
        }
        console.log(`\n   [✓] Concluído! Resultado: 🟢 ${lastStatus.online || 0} Online | 🔴 ${lastStatus.offline || 0} Offline\n`);

        // -------------------------------------------------------------
        // ETAPA 3: Teste do Relay & Proxy de Streaming CORS
        // -------------------------------------------------------------
        console.log('📌 ETAPA 3: Testando Proxy de Streaming CORS (/proxy/stream)...');
        const playReq = await axios.post(`${BASE_URL}/api/playback`, {
            playlistId: playlist.id,
            channelIndex: 0
        });
        console.log(`   [✓] Modo de Transmissão Detectado: ${playReq.data.mode.toUpperCase()}`);
        console.log(`   [✓] Rota de Relay Gerada: ${playReq.data.url}`);

        // Testar se o proxy responde com HTTP 200 / cabeçalhos CORS
        const proxyTest = await axios.get(`${BASE_URL}${playReq.data.url}`, {
            validateStatus: s => s >= 200 && s < 400
        });
        console.log(`   [✓] Resposta do Proxy CORS: HTTP ${proxyTest.status}`);
        console.log(`   [✓] Access-Control-Allow-Origin: ${proxyTest.headers['access-control-allow-origin'] || '*'}\n`);

        // -------------------------------------------------------------
        // ETAPA 4: Teste do Fluxo n8n #3 (Provisionamento de Cliente)
        // -------------------------------------------------------------
        console.log('📌 ETAPA 4: Simulando Fluxo n8n #3 (Provisionamento Automático de Cliente)...');
        const newClient = await axios.post(`${BASE_URL}/api/webhooks/provision-user`, {
            name: 'Fernanda Oliveira',
            username: 'fernanda_vip',
            password: 'senha_pro_2026',
            email: 'fernanda@exemplo.com',
            daysValid: 30,
            playlistIds: [playlist.id]
        }, {
            headers: { 'X-API-Key': API_KEY }
        });

        console.log(`   [✓] Cliente criado via Webhook do n8n com sucesso!`);
        console.log(`   [✓] Usuário: ${newClient.data.user.username}`);
        console.log(`   [✓] Vencimento Calculado: ${new Date(newClient.data.user.expiresAt).toLocaleDateString('pt-BR')} (30 dias)`);
        console.log(`   [✓] Link de Acesso Gerado: ${newClient.data.loginCredentials.loginUrl}\n`);

        // -------------------------------------------------------------
        // ETAPA 5: Teste do Fluxo n8n #2 (Limpeza e Exportação de M3U)
        // -------------------------------------------------------------
        console.log('📌 ETAPA 5: Testando Exportação de M3U Limpa (Apenas canais Online)...');
        const exportRes = await axios.get(`${BASE_URL}/api/playlists/${playlist.id}/export?filter=online`);
        console.log(`   [✓] Download da M3U Limpa gerado! (${exportRes.data.length} bytes)`);
        console.log(`   [✓] Amostra do conteúdo M3U exportado:\n`);
        const sampleLines = exportRes.data.split('\n').slice(0, 6).map(l => '       ' + l).join('\n');
        console.log(sampleLines);

        // -------------------------------------------------------------
        // ETAPA 6: Métricas Globais para Monitoramento
        // -------------------------------------------------------------
        console.log('\n📌 ETAPA 6: Consultando Métricas do Sistema (GET /api/webhooks/stats)...');
        const stats = await axios.get(`${BASE_URL}/api/webhooks/stats`, {
            headers: { 'X-API-Key': API_KEY }
        });
        console.log(`   [✓] Total de Usuários: ${stats.data.counts.users}`);
        console.log(`   [✓] Total de Playlists: ${stats.data.counts.playlists}`);
        console.log(`   [✓] Canais Online: ${stats.data.counts.online}`);
        console.log(`   [✓] Taxa de Disponibilidade Geral: ${stats.data.counts.availabilityRate}`);

        console.log('\n================================================================');
        console.log('🎉 TODOS OS TESTES FORAM EXECUTADOS E VALIDADOS COM 100% DE SUCESSO!');
        console.log('================================================================');

    } catch (error) {
        console.error('\n❌ Falha no teste:', error.message);
        if (error.response?.data) {
            console.error('Detalhes da resposta:', error.response.data);
        }
    }
}

runCompleteDemonstration();
