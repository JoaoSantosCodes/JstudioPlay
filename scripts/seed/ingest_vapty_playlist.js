/**
 * JstudioPlay Pro - Ingestão de Provedor IPTV Xtream Codes (Vapty Tradicional)
 * Governança Multi-Agente - GLPI Ticket #51
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Carregar variáveis do cofre de credenciais IAM
const envPath = path.join(__dirname, '..', '..', 'CREDENCIAIS', '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

const db = require('../../server/db/database');
const xtreamClient = require('../../server/services/xtreamClient');

async function runIngestion() {
    console.log('==============================================================================');
    console.log('🚀 INGESTÃO DE GRADE IPTV EXTERNA — VAPTY TRADICIONAL');
    console.log('==============================================================================\n');

    const serverUrl = process.env.IPTV_SERVER_URL || 'http://vaptyon.top';
    const username = process.env.IPTV_USERNAME || 'tested77deb88bfb6';
    const password = process.env.IPTV_PASSWORD || 'v5160d15603e0d6ab';
    const providerName = process.env.IPTV_PROVIDER_NAME || 'VAPTY TRADICIONAL C/ ADULTO';

    console.log(`[+] Provedor: ${providerName}`);
    console.log(`[+] Servidor: ${serverUrl}`);
    console.log(`[+] Usuário:  ${username}`);
    console.log(`[+] Iniciando handshake e download do catálogo Xtream Codes...`);

    const startTime = Date.now();
    const importData = await xtreamClient.importContent(serverUrl, username, password);
    const fetchDuration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`[✓] Download e parsing concluídos em ${fetchDuration}s!`);
    console.log(`    Total de itens recebidos: ${importData.total}`);

    // Obter usuário administrador
    const adminUser = db.findAdminUser();
    if (!adminUser) {
        throw new Error('Nenhum usuário administrador encontrado no banco de dados.');
    }
    console.log(`[+] Usuário de destino: ${adminUser.username} (${adminUser.id})`);

    // Verificar se já existe uma playlist anterior da Vapty para substituir/atualizar
    const existingPlaylists = db.getPlaylists(adminUser.id);
    const prevVapty = existingPlaylists.find(p => p.name && p.name.includes('Vapty'));
    if (prevVapty) {
        console.log(`[i] Removendo versão anterior da playlist: ${prevVapty.name} (${prevVapty.id})...`);
        db.deletePlaylist(prevVapty.id, adminUser.id);
    }

    console.log(`[+] Persistindo playlist e canais no banco de dados SQLite (WAL Mode)...`);
    const dbStartTime = Date.now();
    const playlist = db.createPlaylist({
        userId: adminUser.id,
        name: `🔥 ${providerName} (Teste 6h)`,
        url: importData.m3uUrl,
        channels: importData.channels,
        autoSync: false
    });
    const dbDuration = ((Date.now() - dbStartTime) / 1000).toFixed(1);

    console.log(`[✓ SUCESSO] Playlist persistida com sucesso em ${dbDuration}s!`);
    console.log(`    ID da Playlist: ${playlist.id}`);
    console.log(`    Nome:           ${playlist.name}`);
    console.log(`    Total Itens:    ${playlist.total}`);
    console.log(`    Ao Vivo:        ${playlist.live}`);
    console.log(`    VOD:            ${playlist.vod}`);
    console.log(`    Séries:         ${playlist.series}`);
    console.log(`    Categorias:     ${playlist.categories}`);
    console.log('\n==============================================================================');
    console.log('🎉 INGESTÃO CONCLUÍDA! A grade está disponível no Web Player: http://localhost:3030');
    console.log('==============================================================================');
}

runIngestion().catch(err => {
    console.error('❌ [ERRO CRÍTICO NA INGESTÃO]:', err);
    process.exit(1);
});
