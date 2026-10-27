const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'public', 'static', 'app.js');
const cssPath = path.join(__dirname, '..', 'public', 'static', 'design-v8.css');

let app = fs.readFileSync(appPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');

console.log('🚀 Implementando Navegação do Top 10 (1 a 10) e Equilíbrio de Tamanho dos Cards (v8.3.18)...');

// 1. Atualizar renderNetflixTop10 em app.js para incluir botões de navegação lateral (Prev / Next)
const oldTop10Func = `function renderNetflixTop10(rawItems, isSeries = false, sectionTitle = 'Top 10 Hoje no JstudioPlay'){
  const pool = (rawItems && rawItems.length) ? rawItems : (isSeries ? (state.currentSeries || state.dashSeries) : (state.currentMovies || state.dashMovies)) || [];
  if (!pool || !pool.length) return '';
  const top10 = pool.slice(0, 10);
  return \`
    <section class="netflix-top10-section">
      <div class="netflix-top10-header">
        <span class="netflix-top10-badge">TOP 10</span>
        <h2 class="netflix-top10-title">\${esc(sectionTitle)}</h2>
      </div>
      <div class="netflix-top10-track">`;

const newTop10Func = `function renderNetflixTop10(rawItems, isSeries = false, sectionTitle = 'Top 10 Hoje no JstudioPlay'){
  const pool = (rawItems && rawItems.length) ? rawItems : (isSeries ? (state.currentSeries || state.dashSeries) : (state.currentMovies || state.dashMovies)) || [];
  if (!pool || !pool.length) return '';
  const top10 = pool.slice(0, 10);
  return \`
    <section class="netflix-top10-section">
      <div class="netflix-top10-header" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span class="netflix-top10-badge">TOP 10</span>
          <h2 class="netflix-top10-title">\${esc(sectionTitle)}</h2>
        </div>
        <div class="netflix-slider-controls">
          <button class="netflix-slider-arrow prev" data-action="scroll-carousel-left" data-target="netflix-top10-track" title="Anterior (1 a 5)" aria-label="Anterior">
            \${icon('left')}
          </button>
          <button class="netflix-slider-arrow next" data-action="scroll-carousel-right" data-target="netflix-top10-track" title="Ver Próximos (6 a 10)" aria-label="Próximo">
            \${icon('right')}
          </button>
        </div>
      </div>
      <div class="netflix-carousel-container">
        <button class="netflix-side-arrow prev" data-action="scroll-carousel-left" data-target="netflix-top10-track" aria-label="Rolar para esquerda">
          \${icon('left')}
        </button>
        <div class="netflix-top10-track" id="netflix-top10-track">`;

if (app.includes(oldTop10Func)) {
  app = app.replace(oldTop10Func, newTop10Func);
  // Fechar o netflix-carousel-container antes de fechar a section
  app = app.replace('      </div>\n    </section>\n  `;\n}\n\nfunction openVodModal', '        </div>\n        <button class="netflix-side-arrow next" data-action="scroll-carousel-right" data-target="netflix-top10-track" aria-label="Rolar para direita">\n          ${icon(\'right\')}\n        </button>\n      </div>\n    </section>\n  `;\n}\n\nfunction openVodModal');
  console.log('✅ Carrossel Top 10 enriquecido com botões de navegação lateral e de cabeçalho.');
}

// 2. Atualizar Chips de Categorias para incluir botões de rolagem lateral
const oldChips = `    <!-- 3. Chips Horizontais de Filtro (Categorias) -->
    <div class="iptv-ref-chips-scroll">
      <button class="iptv-ref-chip \${!selectedCat?'active':''}" data-action="\${isSeries?'filter-series-cat':'filter-vod-cat'}" data-name="" tabindex="0">
        Todos
      </button>`;

const newChips = `    <!-- 3. Chips Horizontais de Filtro com Botões de Navegação -->
    <div class="iptv-ref-chips-wrapper">
      <button class="iptv-chips-arrow prev" data-action="scroll-chips-left" title="Rolar Categorias para Esquerda">\${icon('left')}</button>
      <div class="iptv-ref-chips-scroll" id="iptv-ref-chips-scroll">
        <button class="iptv-ref-chip \${!selectedCat?'active':''}" data-action="\${isSeries?'filter-series-cat':'filter-vod-cat'}" data-name="" tabindex="0">
          Todos
        </button>`;

if (app.includes(oldChips)) {
  app = app.replace(oldChips, newChips);
  // Fechar o wrapper
  app = app.replace(`    </div>\n\n    <!-- Top 10 Catálogo Netflix`, `      </div>\n      <button class="iptv-chips-arrow next" data-action="scroll-chips-right" title="Rolar Categorias para Direita">\${icon('right')}</button>\n    </div>\n\n    <!-- Top 10 Catálogo Netflix`);
  console.log('✅ Chips de Categorias enriquecidos com controles de rolagem lateral.');
}

// 3. Adicionar handlers de clique para scroll-carousel e scroll-chips em app.js
const clickHandlerAnchor = `    if(action==='top10-card-click'){`;
const newScrollActions = `    if(action==='scroll-carousel-left' || action==='scroll-carousel-right'){
      const targetId = b.dataset.target || 'netflix-top10-track';
      const el = document.getElementById(targetId) || b.closest('.netflix-top10-section')?.querySelector('.netflix-top10-track');
      if(el){
        const scrollAmount = Math.max(320, Math.floor(el.clientWidth * 0.75));
        const direction = action === 'scroll-carousel-left' ? -1 : 1;
        el.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
      }
      return;
    }
    if(action==='scroll-chips-left' || action==='scroll-chips-right'){
      const el = document.getElementById('iptv-ref-chips-scroll');
      if(el){
        const scrollAmount = 300;
        const direction = action === 'scroll-chips-left' ? -1 : 1;
        el.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
      }
      return;
    }
    if(action==='top10-card-click'){`;

if (app.includes(clickHandlerAnchor) && !app.includes('action===\'scroll-carousel-left\'')) {
  app = app.replace(clickHandlerAnchor, newScrollActions);
  console.log('✅ Handlers de rolagem de carrossel e chips adicionados ao click listener.');
}

fs.writeFileSync(appPath, app, 'utf8');

// 4. Injetar Seção 31 no design-v8.css: Equilíbrio de Tamanho e Navegação do Carrossel Netflix
const cssSection31 = `
/* ========================================================================== */
/* 31. EQUILÍBRIO DE TAMANHO DE CARDS & NAVEGAÇÃO COMPLETA NETFLIX (v8.3.18) */
/* ========================================================================== */

/* --- 1. Controles e Setas de Navegação do Carrossel Top 10 --- */
.netflix-carousel-container {
  position: relative;
  width: 100%;
}

.netflix-slider-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.netflix-slider-arrow {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.netflix-slider-arrow:hover {
  background: #e50914;
  border-color: #e50914;
  transform: scale(1.08);
  box-shadow: 0 0 12px rgba(229, 9, 20, 0.6);
}

.netflix-slider-arrow svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

/* Setas Laterais Flutuantes Estilo Netflix Desktop */
.netflix-side-arrow {
  position: absolute;
  top: 0;
  bottom: 1.25rem;
  width: 48px;
  background: rgba(10, 11, 15, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: none;
  color: #fff;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.25s ease, background-color 0.2s ease;
}

.netflix-side-arrow.prev {
  left: 0;
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}

.netflix-side-arrow.next {
  right: 0;
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

.netflix-carousel-container:hover .netflix-side-arrow {
  opacity: 1;
}

.netflix-side-arrow:hover {
  background: rgba(229, 9, 20, 0.85);
  color: #fff;
}

.netflix-side-arrow svg {
  width: 22px;
  height: 22px;
  fill: currentColor;
}

@media (max-width: 768px) {
  .netflix-side-arrow {
    display: none !important;
  }
}

/* --- 2. Track do Top 10 com Rolagem Suave & Scroll Snap --- */
.netflix-top10-track {
  display: flex !important;
  gap: 1.5rem !important;
  overflow-x: auto !important;
  scroll-behavior: smooth !important;
  scroll-snap-type: x mandatory !important;
  padding: 0.5rem 0.5rem 1.25rem !important;
  scrollbar-width: thin !important;
  scrollbar-color: rgba(229, 9, 20, 0.4) transparent !important;
}

.netflix-top10-track::-webkit-scrollbar {
  height: 6px !important;
  display: block !important;
}

.netflix-top10-track::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.04) !important;
  border-radius: 3px !important;
}

.netflix-top10-track::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2) !important;
  border-radius: 3px !important;
}

.netflix-top10-track::-webkit-scrollbar-thumb:hover {
  background: #e50914 !important;
}

.netflix-top10-card {
  scroll-snap-align: start !important;
}

/* --- 3. Wrapper e Setas para os Chips de Categorias --- */
.iptv-ref-chips-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  width: 100%;
}

.iptv-ref-chips-scroll {
  flex: 1;
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  padding: 4px 2px;
}

.iptv-ref-chips-scroll::-webkit-scrollbar {
  display: none;
}

.iptv-chips-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.iptv-chips-arrow:hover {
  background: #e50914;
  border-color: #e50914;
}

.iptv-chips-arrow svg {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

/* --- 4. EQUILÍBRIO HARMONIOSO DO TAMANHO DOS CARDS DO CATÁLOGO (PADRÃO NETFLIX) --- */
/* Em telas grandes (como 1600px), distribuir em 6 ou 7 colunas elegantes (~175px de largura por card) */
@media (min-width: 1200px) and (max-width: 1440px) {
  .iptv-ref-grid {
    grid-template-columns: repeat(6, 1fr) !important;
    gap: 1.25rem 0.85rem !important;
  }
}

@media (min-width: 1441px) and (max-width: 1750px) {
  .iptv-ref-grid {
    grid-template-columns: repeat(7, 1fr) !important;
    gap: 1.35rem 0.95rem !important;
  }
}

@media (min-width: 1751px) {
  .iptv-ref-grid {
    grid-template-columns: repeat(8, 1fr) !important;
    gap: 1.5rem 1rem !important;
  }
}

/* Proporção Harmonizada dos Pôsteres no Top 10 */
@media (min-width: 1024px) {
  .netflix-top10-poster {
    width: 138px !important;
    height: 207px !important;
  }
  .netflix-top10-card {
    width: 220px !important;
    height: 215px !important;
  }
  .netflix-top10-num {
    font-size: 8.5rem !important;
    margin-right: -26px !important;
  }
}
`;

if (!css.includes('/* 31. EQUILÍBRIO DE TAMANHO DE CARDS')) {
  css += cssSection31;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✅ Seção 31 de navegação do Top 10 e equilíbrio do catálogo injetada no design-v8.css!');
} else {
  console.log('ℹ️ Seção 31 já presente.');
}

console.log('🎉 Implementação da navegação e proporções da v8.3.18 concluída com sucesso!');
