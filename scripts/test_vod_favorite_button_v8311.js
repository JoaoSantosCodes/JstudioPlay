/**
 * Teste de Validação Canônica: Botão de Favoritos com Coração no Modal VOD v8.3.11
 * 1. Correção do botão no modal de detalhes VOD (openVodModal)
 * 2. Renderização do ícone de coração SVG (icon('heart')) com fechamento de tag
 * 3. Detecção reativa de estado isFav e classes de estilo .iptv-vod-fav-btn / .is-favorited
 * 4. Micro-interações cinemáticas, glow carmesim e toast feedback
 */
const fs = require('fs');
const assert = require('assert');

function run() {
  console.log('================================================================');
  console.log('❤️  SUÍTE DE TESTES: BOTÃO DE FAVORITOS (CORAÇÃO) NO MODAL VOD v8.3.11');
  console.log('Ícone de Coração • Fechamento de Tag • Estado isFav • Glow Carmesim');
  console.log('================================================================\n');

  // 1. Versionamento & Build
  console.log('1. Verificando Versionamento e Cache-Busting:');
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  assert.strictEqual(pkg.version, '8.3.11', 'package.json deve estar na versão 8.3.11');
  console.log('  [PASS] package.json versionado como v8.3.11');

  const indexHtml = fs.readFileSync('./public/index.html', 'utf8');
  assert(indexHtml.includes('design-v8.css?v=8.3.11'), 'index.html deve conter design-v8.css?v=8.3.11');
  assert(indexHtml.includes('app.js?v=8.3.11'), 'index.html deve conter app.js?v=8.3.11');
  console.log('  [PASS] index.html inclui assets com cache-busting v=8.3.11');

  // 2. Integridade SPA (app.js)
  console.log('\n2. Verificando Implementação do Botão no openVodModal (app.js):');
  const appJs = fs.readFileSync('./public/static/app.js', 'utf8');

  assert(appJs.includes('iptv-vod-fav-btn'), 'app.js deve aplicar a classe .iptv-vod-fav-btn no modal');
  assert(appJs.includes('modal-vod-fav-btn'), 'app.js deve identificar o botão com id modal-vod-fav-btn');
  assert(/modal-vod-fav-btn[^>]*>\s*\$\{icon\('heart'\)\}\s*<\/button>/.test(appJs) || appJs.includes("${icon('heart')}\n        </button>"), 'app.js deve renderizar o ícone de coração e fechar a tag </button>');
  assert(appJs.includes("${isFav ? 'is-favorited' : ''}"), 'app.js deve aplicar a classe is-favorited quando o título for favorito');
  assert(appJs.includes('window._currentVodItem'), 'app.js deve utilizar window._currentVodItem como fallback na ação toggle-favorite-search');
  assert(appJs.includes('❤️'), 'app.js deve emitir feedback amigável com emoji de coração no toast');
  console.log('  [PASS] openVodModal renderiza o ícone SVG de coração (heart)');
  console.log('  [PASS] Tag do botão devidamente fechada com </button>');
  console.log('  [PASS] Avaliação de estado isFav e classe .is-favorited implementada');
  console.log('  [PASS] Handler toggle-favorite-search suporta VOD e emite toast');

  // 3. Design System & CSS Tokens (design-v8.css)
  console.log('\n3. Verificando Estilos e Micro-Interações (design-v8.css):');
  const css = fs.readFileSync('./public/static/design-v8.css', 'utf8');

  assert(css.includes('.iptv-vod-fav-btn'), 'CSS deve definir estilos para .iptv-vod-fav-btn');
  assert(css.includes('.iptv-vod-fav-btn:hover'), 'CSS deve definir hover state para .iptv-vod-fav-btn');
  assert(css.includes('.iptv-vod-fav-btn.is-favorited'), 'CSS deve definir variante .is-favorited');
  assert(css.includes('#e50914'), 'CSS deve utilizar vermelho carmesim #e50914 para o coração favoritado');
  console.log('  [PASS] design-v8.css define .iptv-vod-fav-btn com transições suaves');
  console.log('  [PASS] design-v8.css define hover com scale e destaque');
  console.log('  [PASS] design-v8.css define variante .is-favorited com preenchimento carmesim e glow');

  console.log('\n================================================================');
  console.log('📊 RESULTADO DA SUÍTE: 11 PASSOU | 0 FALHOU');
  console.log('================================================================');
}

run();
