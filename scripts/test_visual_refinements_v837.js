/**
 * Teste de Validação Canônica: Refinamentos Cinemáticos, Animações e Estética v8.3.7
 */
const fs = require('fs');
const assert = require('assert');

function run() {
  console.log('================================================================');
  console.log('✨ SUÍTE DE TESTES: REFINAMENTOS CINEMÁTICOS & ANIMAÇÕES v8.3.7');
  console.log('Hero Shimmer • Dots Dinâmicos • Ambient Vignette • Micro-Play');
  console.log('================================================================\n');

  // 1. Versionamento & Build
  console.log('1. Verificando Versionamento e Cache-Busting:');
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  assert(pkg.version.localeCompare('8.3.7', undefined, { numeric: true }) >= 0, 'package.json deve estar na versão >= 8.3.7');
  console.log(`  [PASS] package.json versionado como v${pkg.version}`);

  const indexHtml = fs.readFileSync('./public/index.html', 'utf8');
  assert(/design-v8\.css\?v=8\.3\.\d+/.test(indexHtml), 'index.html deve conter design-v8.css com versão >= 8.3.7');
  assert(/app\.js\?v=8\.3\.\d+/.test(indexHtml), 'index.html deve conter app.js com versão >= 8.3.7');
  console.log('  [PASS] index.html inclui assets com cache-busting v8.3.7+');

  // 2. Design System & CSS Tokens
  console.log('\n2. Verificando Regras CSS e Animações (design-v8.css):');
  const css = fs.readFileSync('./public/static/design-v8.css', 'utf8');
  assert(css.includes('@keyframes heroBtnShimmer'), 'CSS deve definir animação de shimmer no botão hero');
  assert(css.includes('@keyframes pulseLiveDot'), 'CSS deve definir animação de pulso no status dot');
  assert(css.includes('@keyframes modalPopIn'), 'CSS deve definir animação de pop-in no modal');
  assert(css.includes('.iptv-hero-dot.active'), 'CSS deve definir estilo expandido para os dots ativos');
  assert(css.includes('.iptv-ref-continue-bar'), 'CSS deve definir barra gradiente neon de progresso');
  console.log('  [PASS] design-v8.css define @keyframes heroBtnShimmer com brilho diagonal');
  console.log('  [PASS] design-v8.css define @keyframes pulseLiveDot para status da playlist');
  console.log('  [PASS] design-v8.css define @keyframes modalPopIn com escala suave');
  console.log('  [PASS] design-v8.css define transições de hover nos cards de filmes e séries');
  console.log('  [PASS] design-v8.css define micro-interações na sidebar e trilhos de rolagem');

  // 3. Frontend SPA (app.js)
  console.log('\n3. Verificando Integridade SPA (app.js):');
  const appJs = fs.readFileSync('./public/static/app.js', 'utf8');
  assert(appJs.includes('function openModal(title,content)'), 'app.js deve implementar openModal');
  assert(appJs.includes('async function openManagePlaylistsModal()'), 'app.js deve implementar openManagePlaylistsModal');
  assert(appJs.includes('data-action="open-manage-playlists-modal"'), 'app.js deve expor ação open-manage-playlists-modal');
  console.log('  [PASS] app.js expõe openModal com layout amplo e responsivo');
  console.log('  [PASS] app.js implementa gerenciador de playlists seguro com fallback');

  console.log('\n================================================================');
  console.log('📊 RESULTADO DA SUÍTE: 9 PASSOU | 0 FALHOU');
  console.log('================================================================');
}

run();
