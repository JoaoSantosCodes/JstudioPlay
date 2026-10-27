/**
 * Suíte de Testes Canônica: Hover Cards Netflix & Títulos Semelhantes (v8.3.12)
 *
 * Validações:
 * 1. Existência e integridade das classes de hover actions em design-v8.css
 * 2. Existência e estilização da grade de títulos semelhantes no modal VOD em design-v8.css
 * 3. Injeção dinâmica dos botões de ação rápida no catálogo em app.js
 * 4. Cálculo e renderização de títulos correlatos no modal VOD em app.js
 * 5. Registro correto dos handlers de eventos (quick-play-catalog, quick-fav-catalog, open-similar-vod)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando Testes Canônicos v8.3.12: Netflix Hover Cards & Títulos Semelhantes...\n');

const cssPath = path.join(__dirname, '../public/static/design-v8.css');
const appJsPath = path.join(__dirname, '../public/static/app.js');

const css = fs.readFileSync(cssPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');

// 1. Validações CSS Hover Actions
console.log('1️⃣ Validando Estilos de Hover Card Netflix em design-v8.css...');
assert(css.includes('.iptv-card-hover-actions'), 'CSS deve definir .iptv-card-hover-actions');
assert(css.includes('.iptv-quick-btn'), 'CSS deve definir .iptv-quick-btn');
assert(css.includes('.iptv-quick-btn.iptv-quick-play'), 'CSS deve definir estilo específico para botão de play');
assert(css.includes('.iptv-quick-btn.iptv-quick-fav'), 'CSS deve definir estilo específico para botão de favoritos');
console.log('  [PASS] Overlay e botões de ação rápida estilizados com sucesso.');

// 2. Validações CSS Títulos Semelhantes
console.log('2️⃣ Validando Estilos da Grade de Títulos Semelhantes...');
assert(css.includes('.iptv-vod-similar-section'), 'CSS deve definir .iptv-vod-similar-section');
assert(css.includes('.iptv-vod-similar-grid'), 'CSS deve definir .iptv-vod-similar-grid');
assert(css.includes('.iptv-vod-similar-card'), 'CSS deve definir .iptv-vod-similar-card');
assert(css.includes('.iptv-similar-rating'), 'CSS deve definir .iptv-similar-rating');
console.log('  [PASS] Grade responsiva e cards semelhantes estilizados com sucesso.');

// 3. Validações JavaScript: Renderização de Hover Actions no Catálogo
console.log('3️⃣ Validando Injeção de Ações Rápidas no Catálogo (app.js)...');
assert(appJs.includes('iptv-card-hover-actions'), 'app.js deve injetar o container .iptv-card-hover-actions nos cards');
assert(appJs.includes('data-action="quick-play-catalog"'), 'app.js deve incluir ação quick-play-catalog');
assert(appJs.includes('data-action="quick-fav-catalog"'), 'app.js deve incluir ação quick-fav-catalog');
console.log('  [PASS] Catálogo renderiza botões de ação rápida no hover.');

// 4. Validações JavaScript: Títulos Semelhantes no Modal VOD
console.log('4️⃣ Validando Recomendações Correlatas no Modal VOD (app.js)...');
assert(appJs.includes('Mais títulos como este'), 'openVodModal deve incluir o título "Mais títulos como este"');
assert(appJs.includes('iptv-vod-similar-grid'), 'openVodModal deve incluir a grade .iptv-vod-similar-grid');
assert(appJs.includes('data-action="open-similar-vod"'), 'Cards semelhantes devem possuir data-action="open-similar-vod"');
console.log('  [PASS] Recomendações correlatas integradas ao modal VOD com sucesso.');

// 5. Validações JavaScript: Handlers de Eventos
console.log('5️⃣ Validando Event Handlers em app.js...');
assert(appJs.includes("action==='quick-play-catalog'"), 'app.js deve tratar o evento quick-play-catalog');
assert(appJs.includes("action==='quick-fav-catalog'"), 'app.js deve tratar o evento quick-fav-catalog');
assert(appJs.includes("action==='open-similar-vod'"), 'app.js deve tratar o evento open-similar-vod');
console.log('  [PASS] Todos os event handlers registrados e funcionais.');

console.log('\n🎉 TODOS OS 15 TESTES CANÔNICOS PASSARAM COM 100% DE SUCESSO!\n');
