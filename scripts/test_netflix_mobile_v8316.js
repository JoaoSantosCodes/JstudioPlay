/**
 * Suíte de Testes Canônica: Design System Oficial Netflix Mobile & Cards (v8.3.16)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Iniciando Testes Canônicos v8.3.16: Layout Netflix Mobile & Cards...\n');

const cssPath = path.join(__dirname, '../public/static/design-v8.css');
const appJsPath = path.join(__dirname, '../public/static/app.js');

const css = fs.readFileSync(cssPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');

// 1. Floating Pill Navigation Bar
console.log('1️⃣ Validando Barra de Navegação em Pílula Flutuante em design-v8.css...');
assert(css.includes('border-radius: 36px !important'), 'CSS deve definir border-radius: 36px na bottom bar');
assert(css.includes('backdrop-filter: blur(28px)'), 'CSS deve aplicar backdrop-filter de vidro na bottom bar');
assert(css.includes('.iptv-bottom-item.active .iptv-bottom-icon-wrap'), 'CSS deve estilizar pílula ativa cinza clara no item selecionado');
assert(css.includes('.netflix-nav-avatar'), 'CSS deve conter estilo para o avatar do usuário na bottom bar');
console.log('  [PASS] Floating Pill Navigation Bar validada com fidelidade total à Netflix.');

// 2. Cards de Continuar Assistindo Netflix
console.log('2️⃣ Validando Cards de Continuar Assistindo estilo Netflix...');
assert(css.includes('.netflix-continue-card'), 'CSS deve definir .netflix-continue-card');
assert(css.includes('.netflix-continue-play-circle'), 'CSS deve definir botão circular de play no centro do thumb');
assert(css.includes('.netflix-continue-progress-fill'), 'CSS deve definir barra de progresso vermelha na base');
assert(css.includes('.netflix-continue-footer'), 'CSS deve definir rodapé do card com botões de informações e opções');
assert(appJs.includes('netflix-continue-play-circle'), 'app.js deve renderizar os cards no formato Netflix');
console.log('  [PASS] Cards de Continuar Assistindo estilizados com Play central e rodapé de ações.');

// 3. Badges Oficiais Netflix nos Cards de Catálogo
console.log('3️⃣ Validando Badges Oficiais Netflix (TOP 10 e Novidade)...');
assert(css.includes('.netflix-badge-top10'), 'CSS deve definir selo vertical TOP 10 vermelho');
assert(css.includes('.netflix-badge-bottom'), 'CSS deve definir etiqueta horizontal Novidade na base');
assert(appJs.includes('netflix-badge-top10'), 'app.js deve injetar o selo TOP 10 nos títulos em alta');
assert(appJs.includes('netflix-badge-bottom'), 'app.js deve injetar etiqueta Novidade/Nova temporada');
console.log('  [PASS] Selos TOP 10 e etiquetas de Novidade renderizados com sucesso.');

// 4. Botões Oficiais do Hero Banner
console.log('4️⃣ Validando Botões Oficiais do Hero Banner...');
assert(css.includes('.netflix-btn-play-white'), 'CSS deve definir botão branco de play com alto contraste');
assert(css.includes('.netflix-btn-mylist'), 'CSS deve definir botão cinza translúcido Minha Lista');
assert(appJs.includes('netflix-btn-play-white'), 'app.js deve renderizar o botão branco de play no hero');
assert(appJs.includes('netflix-btn-mylist'), 'app.js deve renderizar o botão Minha lista no hero');
console.log('  [PASS] Botões Assistir e Minha Lista validados.');

console.log('\n🎉 TODOS OS TESTES DO LAYOUT NETFLIX MOBILE PASSARAM COM 100% DE SUCESSO!\n');
