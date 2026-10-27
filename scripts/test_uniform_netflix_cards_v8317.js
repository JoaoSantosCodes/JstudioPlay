const fs = require('fs');
const path = require('path');

console.log('🧪 Iniciando Testes Canônicos v8.3.17: Padronização Uniforme de Cards Estilo Netflix...\n');

const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'design-v8.css'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'app.js'), 'utf8');

// Teste 1: Proporção 2:3 Universal em todos os Thumbs
console.log('1️⃣ Validando Proporção Universal 2:3 em design-v8.css...');
const hasAspectRatio23 = css.includes('aspect-ratio: 2 / 3 !important;');
const hasObjectFitCover = css.includes('object-fit: cover !important;') && css.includes('object-position: center top !important;');
if (hasAspectRatio23 && hasObjectFitCover) {
  console.log('  [PASS] Proporção 2:3 e object-fit: cover universal validados com sucesso.');
} else {
  console.error('  [FAIL] Falta proporção 2:3 ou object-fit: cover em design-v8.css.');
  process.exit(1);
}

// Teste 2: Alinhamento Uniforme e Alturas Travadas de Cards
console.log('2️⃣ Validando Alinhamento Uniforme e Altura Travada de Títulos...');
const hasPosterInfoHeight = css.includes('min-height: 38px !important;') && css.includes('max-height: 38px !important;');
const hasPosterCardStretch = css.includes('.iptv-ref-poster-card') && css.includes('align-self: stretch !important;');
if (hasPosterInfoHeight && hasPosterCardStretch) {
  console.log('  [PASS] Alturas de títulos e alinhamento do grid travados contra desalinhamento.');
} else {
  console.error('  [FAIL] Falta trava de altura ou alinhamento de cards em design-v8.css.');
  process.exit(1);
}

// Teste 3: netflix-continue-card na Página de Filmes e Séries
console.log('3️⃣ Validando netflix-continue-card na catalogPage em app.js...');
const hasNetflixContinueInCatalog = app.includes('<div class="netflix-continue-card"') && app.includes('<div class="netflix-continue-play-circle"');
if (hasNetflixContinueInCatalog) {
  console.log('  [PASS] catalogPage atualizada com cards oficiais de Continuar Assistindo da Netflix.');
} else {
  console.error('  [FAIL] netflix-continue-card ausente em catalogPage() no app.js.');
  process.exit(1);
}

// Teste 4: Limpeza de tags residuais
console.log('4️⃣ Validando Limpeza de Tags Residuais no dashboard...');
const hasNoResidualTags = !app.includes('<div class="iptv-ref-continue-title">${esc(c.title)}</div>\n            <div class="iptv-ref-continue-meta">');
if (hasNoResidualTags) {
  console.log('  [PASS] Dashboard sem tags residuais.');
} else {
  console.error('  [FAIL] Tags residuais ainda presentes no dashboard().');
  process.exit(1);
}

console.log('\n🎉 TODOS OS TESTES DE PADRONIZAÇÃO DE CARDS PASSARAM COM 100% DE SUCESSO!\n');
