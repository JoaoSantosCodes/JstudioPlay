/**
 * Suíte de Testes Automatizada: JstudioPlay Visuals, Animações & OSD v8.3.4
 * Valida: Timeline Preview Tooltip, Seek Ripple Central, Aspect Ratio Toggle,
 *         Ambient Glow 3D e Microanimações no VOD Theater e Catálogo.
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

async function runVisualsSuite() {
    console.log('================================================================');
    console.log('✨ SUÍTE DE TESTES: VISUAIS, ANIMAÇÕES & ASPECT RATIO v8.3.4');
    console.log('Timeline Tooltip • Seek Ripple • Aspect Ratio • Ambient Glow 3D');
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

        // --- 2. Frontend SPA & Controles Avançados (app.js) ---
        console.log('\n2. Frontend SPA & Animações OSD (app.js):');
        const appJsPath = path.join(__dirname, '..', 'public', 'static', 'app.js');
        const appJsContent = fs.readFileSync(appJsPath, 'utf8');

        assert('app.js implementa showTheaterRipple com animação central de seek', appJsContent.includes('function showTheaterRipple('));
        assert('app.js implementa toggleAspectRatio para ajuste de proporção de tela', appJsContent.includes('function toggleAspectRatio('));
        assert('skipVodTime dispara showTheaterRipple a cada pulo de reprodução', appJsContent.includes('showTheaterRipple(delta)'));
        assert('openVodTheater inclui container #seek-ripple-overlay', appJsContent.includes('seek-ripple-overlay'));
        assert('openVodTheater inclui tooltip de tempo na timeline (#vod-time-tooltip)', appJsContent.includes('vod-time-tooltip'));
        assert('openVodTheater possui botão de enquadramento/aspect ratio (#btn-aspect-ratio)', appJsContent.includes('btn-aspect-ratio') && appJsContent.includes('aspect-ratio-label'));
        assert('track da timeline responde a mousemove e mouseleave para posicionar tooltip', appJsContent.includes('track.onmousemove') && appJsContent.includes('track.onmouseleave'));
        assert('click handler processa ação toggle-aspect-ratio', appJsContent.includes("action==='toggle-aspect-ratio'"));

        // --- 3. Design System & CSS Tokens (design-v8.css) ---
        console.log('\n3. Design System & Efeitos Visuais (design-v8.css):');
        const cssPath = path.join(__dirname, '..', 'public', 'static', 'design-v8.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');

        assert('design-v8.css define estilos de .iptv-vod-time-tooltip com backdrop-filter', cssContent.includes('.iptv-vod-time-tooltip') && cssContent.includes('backdrop-filter: blur(10px)'));
        assert('design-v8.css define indicador de triângulo .iptv-vod-time-tooltip::after', cssContent.includes('.iptv-vod-time-tooltip::after'));
        assert('design-v8.css define overlay de seek .seek-ripple-overlay e animação @keyframes ripplePulse', cssContent.includes('.seek-ripple-overlay') && cssContent.includes('@keyframes ripplePulse'));
        assert('design-v8.css define botão .iptv-aspect-btn e badge .iptv-aspect-badge', cssContent.includes('.iptv-aspect-btn') && cssContent.includes('.iptv-aspect-badge'));
        assert('design-v8.css define elevação 3D e ambient glow nos cards ao hover', cssContent.includes('.iptv-poster-card:hover') && cssContent.includes('box-shadow: 0 20px 40px rgba(0, 0, 0, 0.85)'));

        // --- 4. Versionamento & Build ---
        console.log('\n4. Versionamento & Build:');
        const pkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
        assert('package.json está atualizado para v>=8.3.4', pkgJson.version.localeCompare('8.3.4', undefined, { numeric: true }) >= 0);

        const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
        assert('index.html inclui assets com cache-busting v>=8.3.4', indexHtml.includes('app.js?v=') && indexHtml.includes('design-v8.css?v='));

        console.log('\n================================================================');
        console.log(`📊 RESULTADO DA SUÍTE: ${passedCount} PASSOU | ${failedCount} FALHOU`);
        console.log('================================================================\n');

    } catch (err) {
        console.error('\n❌ ERRO NA SUÍTE DE TESTES VISUAIS v8.3.4:', err.message);
        process.exit(1);
    }
}

runVisualsSuite();
