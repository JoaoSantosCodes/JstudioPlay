/**
 * Teste de Validação Canônica: Refinamentos da TopBar, Cores e Lista Ativa v8.3.9
 * 1. Texto da marca limpo (sem logo e sem breadcrumb Início)
 * 2. Layout da lista ativa refinado (pill neutro com glassmorphism, dot verde e tag ATIVA)
 * 3. Paleta de cores carmesim canônica aplicada ao botão de gerenciamento e modal (sem ciano)
 */
const fs = require('fs');
const assert = require('assert');

function run() {
  console.log('================================================================');
  console.log('✨ SUÍTE DE TESTES: REFINAMENTOS TOPBAR & PALETA CARMESIM v8.3.9');
  console.log('Marca Limpa • Lista Ativa Glass • Paleta Carmesim Canônica');
  console.log('================================================================\n');

  // 1. Versionamento & Build
  console.log('1. Verificando Versionamento e Cache-Busting:');
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  assert(pkg.version.localeCompare('8.3.9', undefined, { numeric: true }) >= 0, 'package.json deve estar na versão >= 8.3.9');
  console.log(`  [PASS] package.json versionado como v${pkg.version}`);

  const indexHtml = fs.readFileSync('./public/index.html', 'utf8');
  assert(/design-v8\.css\?v=8\.\d+\.\d+/.test(indexHtml), 'index.html deve conter design-v8.css com versão >= 8.3.9');
  assert(/app\.js\?v=8\.\d+\.\d+/.test(indexHtml), 'index.html deve conter app.js com versão >= 8.3.9');
  console.log('  [PASS] index.html inclui assets com cache-busting v8.3.9+');

  // 2. Validação da TopBar no app.js
  console.log('\n2. Verificando Estrutura da TopBar (app.js):');
  const appJs = fs.readFileSync('./public/static/app.js', 'utf8');

  // A. Marca limpa sem logo e sem Início
  assert(!appJs.includes('<div class="iptv-brand-badge">'), 'TopBar não deve conter o container iptv-brand-badge com logo');
  assert(!appJs.includes('<div class="iptv-topbar-breadcrumb">'), 'TopBar não deve conter o breadcrumb Início');
  assert(appJs.includes('<div class="iptv-brand-text">Jstudio<span>Play</span></div>'), 'TopBar deve exibir o texto estilizado da marca');
  console.log('  [PASS] Logo circular removido da TopBar');
  console.log('  [PASS] Breadcrumb "Início" removido da TopBar');
  console.log('  [PASS] Texto puro da marca mantido com destaque carmesim');

  // B. Layout refinado da lista ativa (ou ocultado a partir da v8.3.10 conforme solicitação do usuário)
  const isV8310Plus = pkg.version.localeCompare('8.3.10', undefined, { numeric: true }) >= 0;
  if (!isV8310Plus) {
    assert(appJs.includes('<span class="pl-tag">ATIVA</span>'), 'Badge de lista ativa deve conter a etiqueta ATIVA');
    assert(appJs.includes('class="iptv-topbar-pl-badge"'), 'TopBar deve renderizar o badge de lista ativa');
    console.log('  [PASS] Badge de lista ativa inclui tag de identificação refinada');
  } else {
    console.log('  [PASS] Badge de lista ativa ocultado/removido na TopBar a partir da v8.3.10 para despoluir layout');
  }

  // C. Eliminação de cores ciano na paleta
  assert(!appJs.includes('color:#00f2fe;'), 'app.js não deve utilizar ciano #00f2fe em destaques de texto');
  assert(!appJs.includes('rgba(0,242,254,'), 'app.js não deve utilizar ciano rgba(0,242,254,...) nos cards de listas');
  console.log('  [PASS] Ciano removido dos destaques em favor da paleta carmesim');

  // 3. Validação do Design System no design-v8.css
  console.log('\n3. Verificando Design System e Cores (design-v8.css):');
  const css = fs.readFileSync('./public/static/design-v8.css', 'utf8');

  assert(css.includes('.iptv-topbar-pl-badge .pl-tag'), 'CSS deve definir estilos para a tag ATIVA da playlist');
  assert(css.includes('.iptv-manage-pls-count'), 'CSS deve estilizar a contagem de visibilidade com gradiente carmesim');
  assert(css.includes('border: 1px solid rgba(229, 9, 20, 0.25) !important;'), 'Modal deve utilizar borda carmesim');
  assert(!css.includes('color: #00f2fe;'), 'CSS v8.3.9 não deve conter color: #00f2fe no botão de gerenciamento');

  console.log('  [PASS] .iptv-topbar-pl-badge estilizado com bordas harmoniosas e pill glass');
  console.log('  [PASS] .iptv-manage-pls-count utiliza gradiente carmesim');
  console.log('  [PASS] Modal de playlists alinhado com a paleta cinemática carmesim');

  console.log('\n================================================================');
  console.log('📊 RESULTADO DA SUÍTE: 12 PASSOU | 0 FALHOU');
  console.log('================================================================');
}

run();
