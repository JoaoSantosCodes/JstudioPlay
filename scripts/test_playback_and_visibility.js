/**
 * Teste de Validação Canônica: Playback de IPTV e Visibilidade de Playlists (Ocultar / Habilitar)
 */
const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://127.0.0.1:3030';

async function run() {
  console.log('======================================================================');
  console.log('🧪 TESTE AUTOMATIZADO: REPRODUÇÃO & GERENCIAMENTO DE PLAYLISTS');
  console.log('======================================================================\n');

  // 1. Handshake / Login como admin
  console.log('1. Autenticando como admin...');
  const loginRes = await axios.post(`${BASE_URL}/api/login`, {
    username: 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin'
  });
  assert.strictEqual(loginRes.status, 200);
  const token = loginRes.data.token;
  console.log('   [✓] Token JWT obtido com sucesso!');

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Testar GET /api/playlists (Todas) vs GET /api/playlists?enabled=1 (Apenas Habilitadas)
  console.log('\n2. Verificando listagem de playlists (Ocultadas vs Habilitadas)...');
  const allRes = await axios.get(`${BASE_URL}/api/playlists`, { headers: authHeaders });
  console.log(`   Total de playlists cadastradas: ${allRes.data.length}`);
  assert(allRes.data.length > 0, 'Deveria haver playlists cadastradas');

  const enabledRes = await axios.get(`${BASE_URL}/api/playlists?enabled=1`, { headers: authHeaders });
  console.log(`   Playlists habilitadas: ${enabledRes.data.length}`);
  assert(enabledRes.data.length <= allRes.data.length, 'Habilitadas devem ser subconjunto de todas');
  const turbox = enabledRes.data.find(p => p.name.includes('TurboX'));
  assert(turbox, 'TurboX deve estar entre as playlists habilitadas');
  console.log(`   [✓] TurboX habilitada: "${turbox.name}" (${turbox.total} itens)`);

  // 3. Testar alternância de visibilidade (Toggle Enabled)
  console.log('\n3. Testando PATCH /api/playlists/:id/toggle-enabled...');
  // Pegar uma playlist que não é TurboX para teste de toggle
  const testPl = allRes.data.find(p => !p.name.includes('TurboX'));
  if (testPl) {
    const originalState = testPl.isEnabled;
    const newState = !originalState;
    console.log(`   Alternando lista "${testPl.name}" de ${originalState} para ${newState}...`);
    const toggleRes = await axios.patch(
      `${BASE_URL}/api/playlists/${testPl.id}/toggle-enabled`,
      { enabled: newState },
      { headers: authHeaders }
    );
    assert.strictEqual(toggleRes.status, 200);
    assert.strictEqual(Boolean(toggleRes.data.playlist.isEnabled), newState);

    // Reverter de volta
    await axios.patch(
      `${BASE_URL}/api/playlists/${testPl.id}/toggle-enabled`,
      { enabled: originalState },
      { headers: authHeaders }
    );
    console.log(`   [✓] Alternância de visibilidade testada e revertida com sucesso!`);
  }

  // 4. Testar Playback Handshake via POST /api/playback
  console.log('\n4. Testando resolução de rota via /api/playback...');
  const targetChannelUrl = 'http://d-play.online/live/364660169/163918554/191198.m3u8';
  const playbackRes = await axios.post(
    `${BASE_URL}/api/playback`,
    {
      playlistId: turbox.id,
      channelUrl: targetChannelUrl
    },
    { headers: authHeaders }
  );
  assert.strictEqual(playbackRes.status, 200);
  assert.strictEqual(playbackRes.data.mode, 'hls');
  assert(playbackRes.data.url.startsWith('/proxy/stream?url='), 'URL deve ser proxied');
  console.log('   [✓] Resposta do playback:', playbackRes.data);

  // 5. Testar Proxy de Stream M3U8 com reescrita de URLs
  console.log('\n5. Testando Proxy HLS e CORS (/proxy/stream)...');
  const proxyUrl = `${BASE_URL}${playbackRes.data.url}`;
  const streamRes = await axios.get(proxyUrl);
  assert.strictEqual(streamRes.status, 200);
  assert.strictEqual(streamRes.headers['access-control-allow-origin'], '*');
  assert(streamRes.data.includes('#EXTM3U'), 'Manifest deve ser HLS válido');
  assert(streamRes.data.includes('/proxy/stream?url='), 'Manifest deve conter chunks reescritos para o proxy');
  console.log('   [✓] Manifest M3U8 entregue com CORS liberado e chunks reescritos!');

  console.log('\n======================================================================');
  console.log('🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
  console.log('======================================================================');
}

run().catch(err => {
  console.error('\n❌ FALHA NO TESTE:', err.message, err.response ? err.response.data : '');
  process.exit(1);
});
