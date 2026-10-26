/**
 * JstudioPlay Pro - Ingestão de Provedor IPTV Xtream Codes (TurboX Oficial)
 * Governança Multi-Agente - Validação e Carga de Catálogo
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Carregar variáveis do cofre de credenciais IAM
const envPath = path.join(__dirname, '..', '..', 'CREDENCIAIS', '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
} else {
    dotenv.config({ override: true });
}

const db = require('../../server/db/database');
const xtreamClient = require('../../server/services/xtreamClient');

async function runIngestion() {
    console.log('==============================================================================');
    console.log('🚀 INGESTÃO DE GRADE IPTV EXTERNA — TURBOX OFICIAL (XUI.ONE)');
    console.log('==============================================================================\n');

    const serverUrl = process.env.IPTV_SERVER_URL || 'http://d-play.online';
    const username = process.env.IPTV_USERNAME || '364660169';
    const password = process.env.IPTV_PASSWORD || '163918554';
    const providerName = 'TurboX IPTV Pro';

    console.log(`[+] Provedor: ${providerName}`);
    console.log(`[+] Servidor: ${serverUrl}`);
    console.log(`[+] Usuário:  ${username}`);
    console.log(`[+] Iniciando handshake e carga do catálogo Xtream Codes...`);

    const startTime = Date.now();
    const importData = await xtreamClient.importContent(serverUrl, username, password);
    const fetchDuration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`[✓] Handshake e processamento concluídos em ${fetchDuration}s!`);
    console.log(`    Total de itens recebidos: ${importData.total}`);

    // Obter usuário administrador
    const adminUser = db.findAdminUser();
    if (!adminUser) {
        throw new Error('Nenhum usuário administrador encontrado no banco de dados.');
    }
    console.log(`[+] Usuário de destino: ${adminUser.username} (${adminUser.id})`);

    // Verificar se já existe uma playlist anterior da TurboX para substituir/atualizar
    const existingPlaylists = db.getPlaylists(adminUser.id);
    const prevTurbo = existingPlaylists.find(p => p.name && (p.name.includes('TurboX') || p.name.includes('TURBOX')));
    if (prevTurbo) {
        console.log(`[i] Substituindo versão anterior da playlist: ${prevTurbo.name} (${prevTurbo.id})...`);
        db.deletePlaylist(prevTurbo.id, adminUser.id);
    }

    console.log(`[+] Persistindo playlist e canais no banco de dados SQLite (WAL Mode)...`);
    const dbStartTime = Date.now();
    const playlist = db.createPlaylist({
        userId: adminUser.id,
        name: `⚡ ${providerName} (2.000+ Canais & VOD)`,
        url: importData.m3uUrl,
        channels: importData.channels,
        autoSync: false
    });
    db.togglePlaylistEnabled(playlist.id, true);
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
    console.error('❌ [ERRO NA INGESTÃO]:', err.message);
    process.exit(1);
});
