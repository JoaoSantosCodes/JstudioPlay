/**
 * Suíte de Testes Automatizada: Sistema de Maratonas Narrativas & Suporte YouTube (v8.2.0)
 * Tolerância zero a falhas ou regressões.
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

async function runMarathonsSuite() {
    console.log('================================================================');
    console.log('🎬 SUÍTE DE TESTES: MARATONAS NARRATIVAS & YOUTUBE PLAYER (v8.2.0)');
    console.log('================================================================\n');

    let passedCount = 0;
    let failedCount = 0;

    function assert(desc, condition) {
        if (condition) {
            console.log(`  [PASS] ${desc}`);
            passedCount++;
        } else {
            console.error(`  [FAIL] ${desc}`);
            failedCount++;
        }
    }

    try {
        // --- 1. Autenticação ---
        console.log('1. Autenticação & Sessão:');
        const loginRes = await axios.post(`${base}/api/login`, {
            username: process.env.ADMIN_USERNAME || 'admin',
            password: process.env.ADMIN_PASSWORD || 'admin123'
        });
        const token = loginRes.data.token;
        assert('Login com credenciais oficiais obtém token JWT', Boolean(token && token.length > 20));
        const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

        // --- 2. Endpoints de Maratonas Curadas ---
        console.log('\n2. Catálogo de Maratonas Narrativas (SQLite Migração v7):');
        const curatedRes = await axios.get(`${base}/api/marathons/curated`, authHeaders);
        assert('GET /api/marathons/curated responde com status 200', curatedRes.status === 200);
        assert('Retorna pelo menos 2 maratonas curadas de seed', Array.isArray(curatedRes.data.data) && curatedRes.data.data.length >= 2);

        const wanda = curatedRes.data.data.find(m => m.slug === 'caminho-ate-wandavision');
        assert('Maratona "Caminho até WandaVision" está presente', Boolean(wanda && wanda.title.includes('WandaVision')));
        assert('Maratona possui badge e total de itens calculado', wanda?.badge === 'MARATONA MCU' && wanda?.totalItems >= 5);

        const terror = curatedRes.data.data.find(m => m.slug === 'classicos-terror');
        assert('Maratona "Clássicos do Cinema & Terror" está presente', Boolean(terror));

        // --- 3. Detalhes de Maratona e Sequência Narrativa ---
        console.log('\n3. Itens Ordenados e Notas Narrativas:');
        const detailRes = await axios.get(`${base}/api/marathons/caminho-ate-wandavision`, authHeaders);
        assert('GET /api/marathons/:slug retorna detalhes completos', detailRes.status === 200 && Array.isArray(detailRes.data.items));

        const items = detailRes.data.items;
        const isStrictOrdered = items.every((item, idx) => item.orderIndex === idx + 1);
        assert('Itens da maratona estão em estrita ordem sequencial (1, 2, 3...)', isStrictOrdered);

        const hasNotes = items.every(item => Boolean(item.notes && item.notes.length > 5));
        assert('Todos os itens possuem notas contextuais sobre o enredo', hasNotes);

        // --- 4. CRUD & Reordenação em Lote (Drag & Drop) ---
        console.log('\n4. CRUD e Reordenação em Lote:');
        try {
            await axios.delete(`${base}/api/marathons/saga-teste-auto`, authHeaders);
        } catch (_) {}
        const createRes = await axios.post(`${base}/api/marathons`, {
            title: 'Saga Teste Automatizado',
            description: 'Maratona criada para validação do esquadrão técnico.',
            slug: 'saga-teste-auto',
            badge: 'TESTE SRE'
        }, authHeaders);
        assert('POST /api/marathons cria nova maratona com sucesso', createRes.status === 201 && createRes.data.slug === 'saga-teste-auto');
        const createdId = createRes.data.id;

        const addItem1 = await axios.post(`${base}/api/marathons/${createdId}/items`, {
            title: 'Episódio Alpha',
            year: 2026,
            streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            notes: 'Abertura da saga de testes.'
        }, authHeaders);
        assert('POST /api/marathons/:id/items insere 1º item', addItem1.status === 201 && addItem1.data.order_index === 1);

        const addItem2 = await axios.post(`${base}/api/marathons/${createdId}/items`, {
            title: 'Episódio Beta',
            year: 2026,
            streamUrl: 'https://www.youtube.com/watch?v=FC6jFoYm3xs',
            notes: 'Transmissão via link do YouTube.'
        }, authHeaders);
        assert('POST /api/marathons/:id/items insere 2º item (YouTube stream)', addItem2.status === 201 && addItem2.data.order_index === 2);

        // Reordenação
        const reorderRes = await axios.put(`${base}/api/marathons/${createdId}/reorder`, {
            items: [
                { id: addItem2.data.id, order_index: 1 },
                { id: addItem1.data.id, order_index: 2 }
            ]
        }, authHeaders);
        assert('PUT /api/marathons/:id/reorder inverte a ordem sem colisão UNIQUE', reorderRes.status === 200);
        assert('Item Beta agora é o 1º na ordem narrativa', reorderRes.data.items[0].title === 'Episódio Beta' && reorderRes.data.items[0].orderIndex === 1);

        // Remoção com re-indexação
        const delItemRes = await axios.delete(`${base}/api/marathons/${createdId}/items/${addItem2.data.id}`, authHeaders);
        assert('DELETE /api/marathons/:id/items/:itemId remove item e reajusta índices', delItemRes.status === 200 && delItemRes.data.items[0].orderIndex === 1);

        // Limpeza da maratona teste
        await axios.delete(`${base}/api/marathons/${createdId}`, authHeaders);

        // --- 5. Exportador M3U Ordenado ---
        console.log('\n5. Exportador M3U por Maratona:');
        const exportRes = await axios.get(`${base}/api/marathons/caminho-ate-wandavision/export.m3u`);
        assert('GET /api/marathons/:slug/export.m3u responde 200', exportRes.status === 200);
        assert('Header Content-Type é application/x-mpegurl', exportRes.headers['content-type'].includes('application/x-mpegurl'));
        assert('Conteúdo inicia com cabeçalho padrão #EXTM3U', exportRes.data.startsWith('#EXTM3U'));
        assert('Títulos são prefixados com ordem sequencial (01., 02.)', exportRes.data.includes('01. Vingadores: Era de Ultron') && exportRes.data.includes('02. Capitão América: Guerra Civil'));

        // --- 6. Suporte a YouTube no Player Cinemático & Frontend ---
        console.log('\n6. Suporte a YouTube no Player Cinemático & SPA:');
        const appJs = fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'app.js'), 'utf8');

        assert('app.js define função extractYouTubeVideoId', appJs.includes('function extractYouTubeVideoId('));
        assert('openVodTheater possui container para iframe do YouTube', appJs.includes('vod-yt-iframe'));
        assert('openVodTheater usa youtube-nocookie para privacidade e segurança', appJs.includes('youtube-nocookie.com/embed/'));
        assert('playChannel delega links do YouTube para o theater', appJs.includes('if(extractYouTubeVideoId(targetUrl)'));
        assert('app.js registra rota marathons em pageNames', appJs.includes("marathons:'Maratonas'"));
        assert('app.js implementa marathonsPage dedicada', appJs.includes('function marathonsPage('));
        assert('iptvSmartSidebar inclui link para #/marathons', appJs.includes("href: '#/marathons'"));
        assert('iptvTopBar inclui badge de Maratonas Narrativas', appJs.includes("marathons: { label: 'Maratonas Narrativas'"));

        console.log('\n================================================================');
        console.log(`📊 RESULTADO DA SUÍTE: ${passedCount} PASSOU | ${failedCount} FALHOU`);
        console.log('================================================================');

        if (failedCount > 0) {
            process.exit(1);
        }
    } catch (err) {
        console.error('\n❌ ERRO NA SUÍTE DE TESTES:', err.response?.data || err.message);
        process.exit(1);
    }
}

runMarathonsSuite();
