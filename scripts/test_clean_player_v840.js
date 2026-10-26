/**
 * Teste de Validação Canônica: Despoluição do Layout v8.4.0
 * 1. Ocultação permanente do badge de lista ativa na TopBar (remove poluição visual)
 * 2. Eliminação da tela de carregamento (#video-empty) na abertura e buffer de vídeo
 * 3. Enquadramento seguro do #video-empty em overlay absoluto (sem quebrar vídeo em coluna lateral)
 */
const fs = require('fs');
const assert = require('assert');

function run() {
  console.log('================================================================');
  console.log('✨ SUÍTE DE TESTES: DESPOLUIÇÃO DO LAYOUT & VÍDEO LIMPO v8.4.0');
  console.log('TopBar Despoluída • Carregamento sem Coluna • Fullscreen VOD');
  console.log('================================================================\n');

  // 1. Versionamento & Build
  console.log('1. Verificando Versionamento e Cache-Busting:');
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  assert.strictEqual(pkg.version, '8.4.0', 'package.json deve estar na versão 8.4.0');
  console.log('  [PASS] package.json versionado como v8.4.0');

  const indexHtml = fs.readFileSync('./public/index.html', 'utf8');
  assert(indexHtml.includes('design-v8.css?v=8.4.0'), 'index.html deve conter design-v8.css?v=8.4.0');
  assert(indexHtml.includes('app.js?v=8.4.0'), 'index.html deve conter app.js?v=8.4.0');
  console.log('  [PASS] index.html inclui assets com cache-busting v=8.4.0');

  // 2. Validação da TopBar sem badge da lista carregada (app.js e design-v8.css)
  console.log('\n2. Verificando Ocultação da Lista Carregada na TopBar:');
  const appJs = fs.readFileSync('./public/static/app.js', 'utf8');
  assert(!appJs.includes('<div class="iptv-topbar-pl-badge" id="topbar-pl-badge"'), 'app.js não deve injetar o badge iptv-topbar-pl-badge no topo');
  
  const css = fs.readFileSync('./public/static/design-v8.css', 'utf8');
  assert(css.includes('.iptv-topbar-pl-badge {\n  display: none !important;\n}'), 'CSS deve forçar display: none !important para .iptv-topbar-pl-badge');
  console.log('  [PASS] Badge da lista ativa carregada removido da TopBar');
  console.log('  [PASS] Regra CSS garante que .iptv-topbar-pl-badge permaneça oculta');

  // 3. Validação do Player de Vídeo sem Tela de Carregamento Indesejada
  console.log('\n3. Verificando Player de Vídeo e Ausência de Coluna Lateral:');
  assert(!appJs.includes("playerMessage('Carregando…'"), 'app.js não deve disparar playerMessage no início do playChannel');
  assert(appJs.includes("if($('#video-empty')) $('#video-empty').hidden = true;"), 'app.js deve garantir #video-empty oculto no início do playback');
  assert(css.includes('.iptv-vod-video-wrapper #video-empty'), 'CSS deve definir posicionamento para #video-empty no VOD Theater');
  assert(css.includes('position: absolute !important;'), 'CSS deve fixar #video-empty em position absolute evitando coluna lateral');
  assert(css.includes('.iptv-vod-video-wrapper #video-empty[hidden] {\n  display: none !important;\n}'), 'CSS deve ocultar #video-empty[hidden] sem interferir no flex');
  console.log('  [PASS] playChannel oculta #video-empty na inicialização');
  console.log('  [PASS] onwaiting não dispara tela de carregamento que espremia o vídeo');
  console.log('  [PASS] #video-empty posicionado em overlay absoluto impedindo coluna lateral');

  console.log('\n================================================================');
  console.log('📊 RESULTADO DA SUÍTE: 10 PASSOU | 0 FALHOU');
  console.log('================================================================');
}

run();
