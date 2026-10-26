/**
 * Suíte de Testes Automatizada: JstudioPlay Next-Gen v8.3.0
 * Valida: Hero Banner Dinâmico, Smart Failover, Miniplayer PiP e Mosaico Multi-View 2x2.
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');

const envFile = fs.existsSync(path.join(__dirname, '..', 'CREDENCIAIS', '.env'))
    ? path.join(__dirname, '..', 'CREDENCIAIS', '.env')
    : path.join(__dirname, '.env');
require('dotenv').config({ path: envFile });

const PORT = process.env.PORT || 3030;
const base = `http://localhost:${PORT}`;

async function runNextGenSuite() {
    console.log('================================================================');
    console.log('🚀 SUÍTE DE TESTES: JSTUDIOPLAY NEXT-GEN v8.3.0');
    console.log('Hero Banner • Smart Failover • Miniplayer PiP • Mosaico 2x2');
    console.log('================================================================\n');

    let passedCount = 0;
    let failedCount = 0;

    function assert(name, condition, extra = '') {
        if (condition) {
            console.log(`  [PASS] ${name}`);
            passedCount++;
        } else {
            console.error(`  [FAIL] ${name} ${extra}`);
            failedCount++;
            throw new Error(`Falha no teste: ${name}`);
        }
    }

    try {
        // --- 1. Autenticação & Sessão ---
        console.log('1. Autenticação & Sessão:');
        const loginRes = await axios.post(`${base}/api/login`, {
            username: process.env.ADMIN_USERNAME || 'admin',
            password: process.env.ADMIN_PASSWORD || 'admin123'
        });
        const token = loginRes.data.token;
        assert('Login com credenciais oficiais obtém token JWT', loginRes.status === 200 && Boolean(token));
        const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

        // --- 2. Smart Failover (Endpoint & Backend) ---
        console.log('\n2. Smart Failover (API & Backend):');
        const plRes = await axios.get(`${base}/api/playlists`, authHeaders);
        const playlists = plRes.data || [];
        assert('Lista de playlists acessível para teste', Array.isArray(playlists) && playlists.length > 0);

        const activePlId = playlists[0].id;
        const filterRes = await axios.get(`${base}/api/playlists/${activePlId}/filter?type=live&limit=5`, authHeaders);
        const channels = filterRes.data.channels || [];
        assert('Canais da playlist recuperados para teste de failover', Array.isArray(channels) && channels.length > 0);

        const sampleChannel = channels[0];
        const altRes = await axios.get(`${base}/api/channels/${encodeURIComponent(sampleChannel.id)}/alternatives?playlistId=${activePlId}`, authHeaders);
        assert('GET /api/channels/:id/alternatives responde com status 200', altRes.status === 200);
        assert('Resposta possui channelId e channelName', altRes.data.channelId === sampleChannel.id && Boolean(altRes.data.channelName));
        assert('Campo alternatives é um array', Array.isArray(altRes.data.alternatives));

        // Teste defensivo: canal inexistente
        try {
            await axios.get(`${base}/api/channels/inexistente-123456/alternatives`, authHeaders);
            assert('Canal inexistente deveria retornar 404', false);
        } catch (err) {
            assert('Canal inexistente retorna status 404 com segurança', err.response?.status === 404);
        }

        // --- 3. Frontend: Módulos e Lógica Next-Gen v8.3.0 ---
        console.log('\n3. Frontend SPA & Módulos Next-Gen:');
        const appJsPath = path.join(__dirname, '..', 'public', 'static', 'app.js');
        const appJs = fs.readFileSync(appJsPath, 'utf8');

        assert('app.js registra rota multiview em pageNames', appJs.includes("multiview:'Mosaico Multi-View'"));
        assert('app.js define módulo pipModule com enter() e exit()', appJs.includes('const pipModule') && appJs.includes('enter(channel)') && appJs.includes('exit()'));
        assert('app.js define multiviewModule com gerenciamento de 4 slots', appJs.includes('const multiviewModule') && appJs.includes('initSlots()') && appJs.includes('setSound('));
        assert('app.js implementa função multiviewPage()', appJs.includes('function multiviewPage('));
        assert('app.js define função trySmartFailover para resiliência HLS', appJs.includes('async function trySmartFailover('));
        assert('iptvSmartSidebar inclui atalho para Mosaico Multi-View', appJs.includes("id: 'multiview'"));
        assert('Dashboard implementa Hero Banner cinemático dinâmico', appJs.includes('iptv-master-hero') && appJs.includes('heroBackdrop') && appJs.includes('data-action="play-featured-hero"'));

        // --- 4. Design System & Tokens Visuais ---
        console.log('\n4. Design System & CSS Tokens:');
        const cssPath = path.join(__dirname, '..', 'public', 'static', 'design-v8.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');

        assert('design-v8.css possui bloco de Hero Banner cinemático', cssContent.includes('.iptv-master-hero') && cssContent.includes('.iptv-master-hero-overlay'));
        assert('design-v8.css possui estilos do Miniplayer PiP flutuante', cssContent.includes('#pip-floating-player') && cssContent.includes('.pip-overlay-controls'));
        assert('design-v8.css possui grid responsivo do Mosaico 2x2', cssContent.includes('.multiview-grid') && cssContent.includes('.multiview-slot'));
        assert('design-v8.css possui indicador de slot com áudio ativo', cssContent.includes('.multiview-slot.active-audio'));
        assert('design-v8.css define estilos do OSD de zapping (#channel-osd)', cssContent.includes('#channel-osd') && cssContent.includes('.osd-visible'));

        // --- 5. Versionamento & Integridade da Aplicação ---
        console.log('\n5. Versionamento & Build:');
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
        assert('package.json está atualizado para v>=8.3.0', pkg.version >= '8.3.0');

        const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
        assert('index.html inclui assets com cache-busting atualizado', indexHtml.includes('design-v8.css?v=') && indexHtml.includes('app.js?v='));

        console.log('\n================================================================');
        console.log(`📊 RESULTADO DA SUÍTE: ${passedCount} PASSOU | ${failedCount} FALHOU`);
        console.log('================================================================');

    } catch (err) {
        console.error('\n❌ ERRO NA SUÍTE DE TESTES NEXT-GEN:', err.response?.data || err.message);
        process.exit(1);
    }
}

runNextGenSuite();
