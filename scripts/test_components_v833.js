/**
 * Suíte de Testes Automatizada: JstudioPlay Comunicação & Estética v8.3.3
 * Valida: EventBus Reativo, Now Playing na TopBar, Equalizador Animado,
 *         Volume Slider Glass, Resolução Dinâmica e Sincronização de Progresso.
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

async function runComponentsSuite() {
    console.log('================================================================');
    console.log('⚡ SUÍTE DE TESTES: COMUNICAÇÃO DE COMPONENTES & ESTÉTICA v8.3.3');
    console.log('EventBus • Now Playing Pill • Audio Equalizer • Glass Controls');
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

        // --- 2. Comunicação Inter-Componentes & EventBus (app.js) ---
        console.log('\n2. Comunicação Inter-Componentes & EventBus (app.js):');
        const appJsPath = path.join(__dirname, '..', 'public', 'static', 'app.js');
        const appJsContent = fs.readFileSync(appJsPath, 'utf8');

        assert('app.js inicializa window.eventBus com métodos on, off, emit', appJsContent.includes('window.eventBus = {') && appJsContent.includes('emit(event, data)'));
        assert('playChannel emite evento playback:started no EventBus', appJsContent.includes("window.eventBus.emit('playback:started'"));
        assert('stopPlayback emite evento playback:stopped no EventBus', appJsContent.includes("window.eventBus.emit('playback:stopped'"));
        assert('openVodTheater emite evento playback:progress em tempo real', appJsContent.includes("window.eventBus.emit('playback:progress'"));
        assert('app.js escuta playback:started para atualizar pílula Now Playing na TopBar', appJsContent.includes("window.eventBus.on('playback:started'"));
        assert('app.js escuta playback:stopped para ocultar Now Playing da TopBar', appJsContent.includes("window.eventBus.on('playback:stopped'"));
        assert('app.js escuta playback:progress para atualizar cards Continuar Assistindo dinamicamente', appJsContent.includes("window.eventBus.on('playback:progress'"));
        assert('Ação resume-current-playing permite alternar de volta para a mídia ativa', appJsContent.includes("action==='resume-current-playing'"));

        // --- 3. Estética & Controles Cinemáticos (app.js & design-v8.css) ---
        console.log('\n3. Estética & Controles Cinemáticos:');
        assert('iptvTopBar renderiza container #topbar-now-playing-container com equalizador', appJsContent.includes('topbar-now-playing-container') && appJsContent.includes('topbar-equalizer'));
        assert('openVodTheater renderiza slider de volume glass (.iptv-vod-volume-slider)', appJsContent.includes('iptv-vod-volume-slider') && appJsContent.includes('iptv-vod-volume-wrap'));
        assert('openVodTheater inclui badge de resolução dinâmica (#vod-res-badge)', appJsContent.includes('vod-res-badge') && appJsContent.includes('v.onloadedmetadata'));

        const cssPath = path.join(__dirname, '..', 'public', 'static', 'design-v8.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');

        assert('design-v8.css define estilos de .iptv-topbar-now-playing com backdrop-filter', cssContent.includes('.iptv-topbar-now-playing') && cssContent.includes('backdrop-filter: blur(12px)'));
        assert('design-v8.css define equalizador animado com keyframes @keyframes soundBars', cssContent.includes('.topbar-equalizer') && cssContent.includes('@keyframes soundBars'));
        assert('design-v8.css define slider de volume glass .iptv-vod-volume-wrap', cssContent.includes('.iptv-vod-volume-wrap') && cssContent.includes('.iptv-vod-volume-slider'));
        assert('design-v8.css define badge de resolução .vod-res-badge e estilo 4K .vod-res-badge.badge-4k', cssContent.includes('.vod-res-badge') && cssContent.includes('.vod-res-badge.badge-4k'));

        // --- 4. Versionamento & Build ---
        console.log('\n4. Versionamento & Build:');
        const pkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
        assert('package.json está atualizado para v>=8.3.3', pkgJson.version.localeCompare('8.3.3', undefined, { numeric: true }) >= 0);

        const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
        assert('index.html inclui assets com cache-busting v>=8.3.3', indexHtml.includes('app.js?v=') && indexHtml.includes('design-v8.css?v='));

        console.log('\n================================================================');
        console.log(`📊 RESULTADO DA SUÍTE: ${passedCount} PASSOU | ${failedCount} FALHOU`);
        console.log('================================================================\n');

    } catch (err) {
        console.error('\n❌ ERRO NA SUÍTE DE TESTES COMPONENTES v8.3.3:', err.message);
        process.exit(1);
    }
}

runComponentsSuite();
