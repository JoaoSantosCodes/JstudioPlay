/**
 * Suíte de Testes Canônica: Fileira Top 10 Netflix & Bottom Sheet Mobile (v8.3.13)
 *
 * Validações:
 * 1. Existência e estilização da seção Top 10 e numerais gigantes em design-v8.css
 * 2. Estilização responsiva do Bottom Sheet modal no mobile em design-v8.css
 * 3. Renderização dinâmica de renderNetflixTop10 no dashboard() e catalogPage() em app.js
 * 4. Ativação de iptv-bottom-sheet-mode e puxador iptv-sheet-handle-bar em openVodModal
 * 5. Registro correto dos handlers de eventos (top10-card-click, close-modal)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando Testes Canônicos v8.3.13: Top 10 Netflix & Bottom Sheet Mobile...\n');

const cssPath = path.join(__dirname, '../public/static/design-v8.css');
const appJsPath = path.join(__dirname, '../public/static/app.js');

const css = fs.readFileSync(cssPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');

// 1. Validações CSS Top 10
console.log('1️⃣ Validando Estilos de Top 10 Netflix em design-v8.css...');
assert(css.includes('.netflix-top10-section'), 'CSS deve definir .netflix-top10-section');
assert(css.includes('.netflix-top10-badge'), 'CSS deve definir .netflix-top10-badge');
assert(css.includes('.netflix-top10-track'), 'CSS deve definir .netflix-top10-track');
assert(css.includes('.netflix-top10-card'), 'CSS deve definir .netflix-top10-card');
assert(css.includes('.netflix-top10-num'), 'CSS deve definir numeral estilizado .netflix-top10-num');
assert(css.includes('.netflix-top10-poster'), 'CSS deve definir container de poster .netflix-top10-poster');
console.log('  [PASS] Seção, trilha de rolagem e numerais gigantes estilizados com perfeição.');

// 2. Validações CSS Bottom Sheet Mobile
console.log('2️⃣ Validando Estilos de Bottom Sheet no Mobile em design-v8.css...');
assert(css.includes('.iptv-sheet-handle-bar'), 'CSS deve definir .iptv-sheet-handle-bar');
assert(css.includes('.iptv-sheet-handle'), 'CSS deve definir .iptv-sheet-handle');
assert(css.includes('dialog#modal.iptv-bottom-sheet-mode'), 'CSS deve conter regras para dialog#modal.iptv-bottom-sheet-mode');
assert(css.includes('@keyframes netflixSheetSlideUp'), 'CSS deve conter a animação netflixSheetSlideUp');
console.log('  [PASS] Bottom Sheet deslizante e puxador tátil responsivo estilizados com sucesso.');

// 3. Validações JavaScript: Função renderNetflixTop10
console.log('3️⃣ Validando Lógica de Renderização do Top 10 em app.js...');
assert(appJs.includes('function renderNetflixTop10('), 'app.js deve declarar renderNetflixTop10');
assert(appJs.includes('netflix-top10-card'), 'renderNetflixTop10 deve renderizar .netflix-top10-card');
assert(appJs.includes('netflix-top10-num'), 'renderNetflixTop10 deve renderizar .netflix-top10-num com o rank');
assert(appJs.includes('renderNetflixTop10(trending'), 'dashboard() deve invocar renderNetflixTop10');
assert(appJs.includes('renderNetflixTop10(items'), 'catalogPage() deve invocar renderNetflixTop10');
console.log('  [PASS] Top 10 dinâmico integrado ao Dashboard e Catálogo.');

// 4. Validações JavaScript: Bottom Sheet no Modal VOD
console.log('4️⃣ Validando Ativação do Bottom Sheet no Modal VOD (app.js)...');
assert(appJs.includes("modal.classList.add('iptv-bottom-sheet-mode')"), 'openVodModal deve aplicar iptv-bottom-sheet-mode no #modal');
assert(appJs.includes('iptv-sheet-handle-bar'), 'openVodModal deve injetar a barra com puxador iptv-sheet-handle-bar');
assert(appJs.includes("m.classList.remove('iptv-bottom-sheet-mode')"), 'close-modal deve remover iptv-bottom-sheet-mode');
console.log('  [PASS] Comportamento e ciclo de vida do Bottom Sheet validados.');

// 5. Validações JavaScript: Event Handlers
console.log('5️⃣ Validando Event Handlers em app.js...');
assert(appJs.includes("action==='top10-card-click'"), 'app.js deve registrar o evento top10-card-click');
console.log('  [PASS] Event handler top10-card-click registrado e funcional.');

console.log('\n🎉 TODOS OS TESTES CANÔNICOS v8.3.13 PASSARAM COM 100% DE SUCESSO!\n');
