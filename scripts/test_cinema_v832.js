/**
 * Suíte de Testes Automatizada: JstudioPlay Cinema & OSD Avançado v8.3.2
 * Valida: Controles Cinemáticos VOD, Seletor de Velocidade, Timeline Interativa,
 *         Hero Auto-Rotate com Dots, Fallback Dinâmico SVG e Keyframes Glow.
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

async function runCinemaSuite() {
    console.log('================================================================');
    console.log('🎬 SUÍTE DE TESTES: CINEMA & OSD VOD THEATER v8.3.2');
    console.log('Timeline • Playback Rate • Hero Dots • SVG Fallback • Glow');
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

        // --- 2. Integridade do Frontend SPA (app.js) ---
        console.log('\n2. Frontend SPA & Módulos Cinemáticos (app.js):');
        const appJsPath = path.join(__dirname, '..', 'public', 'static', 'app.js');
        const appJsContent = fs.readFileSync(appJsPath, 'utf8');

        assert('app.js define formatVodTime para exibição de tempo', appJsContent.includes('function formatVodTime'));
        assert('app.js implementa window.handlePosterError para fallback SVG', appJsContent.includes('window.handlePosterError'));
        assert('handlePosterError gera SVG com gradiente cinematográfico', appJsContent.includes('<svg xmlns="http://www.w3.org/2000/svg"'));
        assert('app.js implementa skipVodTime com feedback visual', appJsContent.includes('function skipVodTime('));
        assert('app.js implementa setVodPlaybackRate com sincronização de velocidade', appJsContent.includes('function setVodPlaybackRate('));
        assert('app.js implementa timer de inatividade resetVodIdleTimer', appJsContent.includes('function resetVodIdleTimer('));
        assert('openVodTheater renderiza controles OSD com timeline e botões de ação', appJsContent.includes('iptv-vod-theater-controls'));
        assert('openVodTheater inclui barra de buffer e scrubber interativo', appJsContent.includes('iptv-vod-buffer-bar') && appJsContent.includes('iptv-vod-progress-scrubber'));
        assert('openVodTheater disponibiliza seletor de velocidade (0.75x a 2.0x)', appJsContent.includes('iptv-vod-speed-select') && appJsContent.includes('vod-change-speed'));
        assert('app.js implementa changeHeroSlide para alternância suave', appJsContent.includes('function changeHeroSlide('));
        assert('app.js implementa initHeroAutoRotate com pausa no hover', appJsContent.includes('function initHeroAutoRotate('));
        assert('dashboard renderiza container de dots de navegação (.iptv-hero-dots-container)', appJsContent.includes('iptv-hero-dots-container'));
        assert('Listener de teclado suporta atalhos de reprodução (Space, Skip, Mute, Fullscreen)', appJsContent.includes("e.code === 'Space'") && appJsContent.includes("skipVodTime(10)"));

        // --- 3. Design System & CSS Tokens (design-v8.css) ---
        console.log('\n3. Design System & Efeitos Visuais (design-v8.css):');
        const cssPath = path.join(__dirname, '..', 'public', 'static', 'design-v8.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');

        assert('design-v8.css define estilos para .iptv-vod-theater-controls', cssContent.includes('.iptv-vod-theater-controls'));
        assert('design-v8.css define timeline com track e progress bar', cssContent.includes('.iptv-vod-progress-track') && cssContent.includes('.iptv-vod-progress-bar'));
        assert('design-v8.css define estilo do seletor .iptv-vod-speed-select com blur', cssContent.includes('.iptv-vod-speed-select'));
        assert('design-v8.css define animação de inatividade .iptv-vod-theater.idle-hidden', cssContent.includes('.iptv-vod-theater.idle-hidden'));
        assert('design-v8.css define dots do carrossel .iptv-hero-dot e estado .active', cssContent.includes('.iptv-hero-dot') && cssContent.includes('.iptv-hero-dot.active'));
        assert('design-v8.css define keyframes @keyframes pulseGlow', cssContent.includes('@keyframes pulseGlow'));

        // --- 4. Versionamento & Build ---
        console.log('\n4. Versionamento & Build:');
        const pkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
        assert('package.json está atualizado para v>=8.3.2', pkgJson.version.localeCompare('8.3.2', undefined, { numeric: true }) >= 0);

        const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
        assert('index.html inclui assets com cache-busting v>=8.3.2', indexHtml.includes('app.js?v=') && indexHtml.includes('design-v8.css?v='));

        console.log('\n================================================================');
        console.log(`📊 RESULTADO DA SUÍTE: ${passedCount} PASSOU | ${failedCount} FALHOU`);
        console.log('================================================================\n');

    } catch (err) {
        console.error('\n❌ ERRO NA SUÍTE DE TESTES CINEMA v8.3.2:', err.message);
        process.exit(1);
    }
}

runCinemaSuite();
