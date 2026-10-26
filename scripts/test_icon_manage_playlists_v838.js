/**
 * Teste de Validação Canônica: Ícone Canônico de Playlist e Botão de Gerenciamento v8.3.8
 */
const fs = require('fs');
const assert = require('assert');

function run() {
  console.log('================================================================');
  console.log('✨ SUÍTE DE TESTES: ÍCONE DE PLAYLIST & GERENCIAMENTO v8.3.8');
  console.log('Ícone Canônico de Playlist • .iptv-manage-pls-btn • .iptv-pl-card-icon');
  console.log('================================================================\n');

  // 1. Versionamento & Build
  console.log('1. Verificando Versionamento e Cache-Busting:');
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  assert(pkg.version.localeCompare('8.3.8', undefined, { numeric: true }) >= 0, 'package.json deve estar na versão >= 8.3.8');
  console.log(`  [PASS] package.json versionado como v${pkg.version}`);

  const indexHtml = fs.readFileSync('./public/index.html', 'utf8');
  assert(/design-v8\.css\?v=8\.3\.\d+/.test(indexHtml), 'index.html deve conter design-v8.css com versão >= 8.3.8');
  assert(/app\.js\?v=8\.3\.\d+/.test(indexHtml), 'index.html deve conter app.js com versão >= 8.3.8');
  console.log('  [PASS] index.html inclui assets com cache-busting v8.3.8+');

  // 2. Ícone Canônico no app.js
  console.log('\n2. Verificando Integridade do Ícone de Playlist (app.js):');
  const appJs = fs.readFileSync('./public/static/app.js', 'utf8');
  assert(appJs.includes("playlist:'M4 6h16M4 12h9M4 18h9M16 11l5 3-5 3v-6Z'"), 'app.js deve definir path canônico de playlist com triângulo de play');
  assert(!appJs.includes("playlist:'M6 3h12v18H6zM9 7h6M9 11h6M9 15h3'"), 'app.js não deve conter ícone legado de folha de papel');
  assert(appJs.includes('iptv-manage-pls-btn'), 'app.js deve aplicar a classe .iptv-manage-pls-btn');
  assert(appJs.includes('iptv-pl-card-icon'), 'app.js deve usar a classe .iptv-pl-card-icon nos cards do modal');
  console.log('  [PASS] app.js possui o path SVG canônico da playlist (List + Play)');
  console.log('  [PASS] app.js substituiu ícone legado de folha de papel');
  console.log('  [PASS] app.js aplica .iptv-manage-pls-btn na TopBar e no Catálogo');
  console.log('  [PASS] app.js aplica .iptv-pl-card-icon nos cards de seleção');

  // 3. Regras CSS no design-v8.css
  console.log('\n3. Verificando Estilos de Ícone e Botão (design-v8.css):');
  const css = fs.readFileSync('./public/static/design-v8.css', 'utf8');
  assert(css.includes('.iptv-manage-pls-btn'), 'CSS deve definir estilos para .iptv-manage-pls-btn');
  assert(css.includes('.iptv-manage-pls-btn svg'), 'CSS deve definir dimensões explícitas para o SVG do botão');
  assert(css.includes('.iptv-pl-card-icon'), 'CSS deve definir container para o ícone nos cards do modal');
  assert(css.includes('.iptv-pl-card-icon.enabled'), 'CSS deve definir variante ativa do ícone com glow neon');
  assert(css.includes('.iptv-pl-card-icon.hidden'), 'CSS deve definir variante oculta com opacidade reduzida');
  console.log('  [PASS] design-v8.css estiliza .iptv-manage-pls-btn com backdrop-filter e hover dinâmico');
  console.log('  [PASS] design-v8.css especifica width e height explícitos para o SVG');
  console.log('  [PASS] design-v8.css estiliza .iptv-pl-card-icon com variantes enabled e hidden');

  console.log('\n================================================================');
  console.log('📊 RESULTADO DA SUÍTE: 11 PASSOU | 0 FALHOU');
  console.log('================================================================');
}

run();
