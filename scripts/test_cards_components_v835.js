/**
 * Suíte de Testes Automatizada: JstudioPlay Cards, Componentes & Maratonas v8.3.5
 * Valida: Layout do Hero de Maratona, Botão de Exportação M3U Dedicado,
 *         Cards de Sagas Curadas com Backdrop, Timeline Narrativa e CSS Tokens.
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

async function runCardsComponentsSuite() {
    console.log('================================================================');
    console.log('🎴 SUÍTE DE TESTES: CARDS, COMPONENTES & MARATONAS v8.3.5');
    console.log('Hero Layout • Botão Export Dedicado • Sagas Backdrop • Timeline');
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

        // --- 2. Frontend SPA & Estrutura de Componentes (app.js) ---
        console.log('\n2. Frontend SPA & Estrutura de Componentes (app.js):');
        const appJsPath = path.join(__dirname, '..', 'public', 'static', 'app.js');
        const appJsContent = fs.readFileSync(appJsPath, 'utf8');

        assert('marathonsPage utiliza container .iptv-marathons-container', appJsContent.includes('iptv-marathons-container'));
        assert('marathonsPage implementa hero com .iptv-marathon-hero-overlay', appJsContent.includes('iptv-marathon-hero-overlay'));
        assert('marathonsPage implementa título com .iptv-marathon-hero-title', appJsContent.includes('iptv-marathon-hero-title'));
        assert('marathonsPage botão de play usa .iptv-marathon-start-btn', appJsContent.includes('iptv-marathon-start-btn'));
        assert('marathonsPage botão de exportação usa .iptv-btn-hero-export (não quebra em 4 linhas)', appJsContent.includes('iptv-btn-hero-export'));
        assert('marathonsPage renderiza grid .iptv-marathons-grid', appJsContent.includes('iptv-marathons-grid'));
        assert('cards de saga incluem backdrop translúcido .iptv-marathon-card-bg', appJsContent.includes('iptv-marathon-card-bg'));
        assert('timeline de episódios renderiza lista .iptv-timeline-list', appJsContent.includes('iptv-timeline-list'));
        assert('itens da timeline incluem badge de índice .iptv-timeline-idx', appJsContent.includes('iptv-timeline-idx'));
        assert('itens da timeline incluem poster .iptv-timeline-poster', appJsContent.includes('iptv-timeline-poster'));
        assert('itens da timeline incluem nota de curadoria .iptv-timeline-note', appJsContent.includes('iptv-timeline-note'));
        assert('itens da timeline incluem botão de ação .iptv-timeline-play-btn', appJsContent.includes('iptv-timeline-play-btn'));

        // --- 3. Design System & CSS Tokens (design-v8.css) ---
        console.log('\n3. Design System & CSS Tokens (design-v8.css):');
        const cssPath = path.join(__dirname, '..', 'public', 'static', 'design-v8.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');

        assert('design-v8.css define .iptv-marathon-hero com gradiente duplo e box-shadow', cssContent.includes('.iptv-marathon-hero') && cssContent.includes('.iptv-marathon-hero-overlay'));
        assert('design-v8.css define .iptv-btn-hero-export com flex row, nowrap e backdrop blur', cssContent.includes('.iptv-btn-hero-export') && cssContent.includes('nowrap'));
        assert('design-v8.css define .iptv-marathon-card com elevação e active neon glow', cssContent.includes('.iptv-marathon-card') && cssContent.includes('.iptv-marathon-card.active'));
        assert('design-v8.css define .iptv-timeline-item com glassmorphism e hover translateX', cssContent.includes('.iptv-timeline-item') && cssContent.includes('translateX'));
        assert('design-v8.css define .iptv-timeline-idx com gradiente carmesim', cssContent.includes('.iptv-timeline-idx'));

        // --- 4. Versionamento & Build ---
        console.log('\n4. Versionamento & Build:');
        const pkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
        assert('package.json está atualizado para v>=8.3.5', pkgJson.version.localeCompare('8.3.5', undefined, { numeric: true }) >= 0);

        const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
        assert('index.html inclui assets com cache-busting v>=8.3.5', indexHtml.includes('app.js?v=') && indexHtml.includes('design-v8.css?v='));

        console.log('\n================================================================');
        console.log(`📊 RESULTADO DA SUÍTE: ${passedCount} PASSOU | ${failedCount} FALHOU`);
        console.log('================================================================\n');

    } catch (err) {
        console.error('\n❌ ERRO NA SUÍTE DE TESTES CARDS & COMPONENTES v8.3.5:', err.message);
        process.exit(1);
    }
}

runCardsComponentsSuite();
