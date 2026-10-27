const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'public', 'static', 'app.js');
const cssPath = path.join(__dirname, '..', 'public', 'static', 'design-v8.css');

let app = fs.readFileSync(appPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');

console.log('🚀 Aplicando Correções Definitivas: Unificação Estrita de Cards, Top 10 até o 10, Remoção da Barra Vermelha e Enriquecimento Automático 5min (v8.3.19)...');

// 1. Remover o botão chamativo vermelho de Enriquecimento e substituir por badge discreto de sincronização automática
const oldEnrichHeader = `    <!-- 4. Cabeçalho de Contagem de Catálogo e Ação de Enriquecimento -->
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.75rem; margin-bottom:1.25rem;">
      <h2 class="iptv-ref-heading" style="margin:0;">
        Explore o catálogo <span class="iptv-ref-counter">(\${number(total)})</span>
      </h2>
      <button class="btn small primary" data-action="enrich-catalog-batch" data-type="\${isSeries?'series':'vod'}" style="gap:0.4rem; padding:0.45rem 1rem; font-size:0.82rem; border-radius:8px;">
        \${icon('refresh')} Atualizar Capas & Sinopses (API)
      </button>
    </div>`;

const newEnrichHeader = `    <!-- 4. Cabeçalho de Contagem de Catálogo (com status de sincronização automática) -->
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.75rem; margin-bottom:1.25rem;">
      <h2 class="iptv-ref-heading" style="margin:0;">
        Explore o catálogo <span class="iptv-ref-counter">(\${number(total)})</span>
      </h2>
      <div style="display:inline-flex; align-items:center; gap:0.5rem; font-size:0.75rem; color:rgba(255,255,255,0.45); background:rgba(255,255,255,0.04); padding:0.35rem 0.75rem; border-radius:20px; border:1px solid rgba(255,255,255,0.08);">
        <span style="width:6px; height:6px; border-radius:50%; background:#46d369; display:inline-block; box-shadow:0 0 6px rgba(70,211,105,0.6);"></span>
        <span>Sincronização contínua de capas ativa</span>
      </div>
    </div>`;

if (app.includes(oldEnrichHeader)) {
  app = app.replace(oldEnrichHeader, newEnrichHeader);
  console.log('✅ Botão manual de enriquecimento substituído por indicador discreto de sincronização automática.');
}

// 2. Injetar rotina de enriquecimento em background a cada 5 minutos no app.js
const autoEnrichRoutine = `
// ==========================================================================
// SINCRONIZAÇÃO AUTOMÁTICA EM SEGUNDO PLANO A CADA 5 MINUTOS (v8.3.19)
// ==========================================================================
function startAutoEnrichmentBackground() {
  if (window._autoEnrichTimer) return;
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  window._autoEnrichTimer = setInterval(async () => {
    try {
      if (!state.user || !state.activePlaylist) return;
      console.log('[AutoEnrich] Iniciando ciclo automático de metadados a cada 5min...');
      await api(\`/playlists/\${state.activePlaylist}/enrich-batch\`, 'POST', { limit: 40, delayMs: 200 });
    } catch (e) {
      // Falha silenciosa em background para não interromper a navegação
    }
  }, FIVE_MINUTES_MS);
}
startAutoEnrichmentBackground();
`;

if (!app.includes('startAutoEnrichmentBackground()')) {
  app += autoEnrichRoutine;
  console.log('✅ Rotina de enriquecimento em segundo plano a cada 5 minutos ativada.');
}

// 3. Ajustar lógica de rolagem para o Top 10 para navegar fluentemente do 1 ao 10
const oldScrollLogic = `    if(action==='scroll-carousel-left' || action==='scroll-carousel-right'){
      const targetId = b.dataset.target || 'netflix-top10-track';
      const el = document.getElementById(targetId) || b.closest('.netflix-top10-section')?.querySelector('.netflix-top10-track');
      if(el){
        const scrollAmount = Math.max(320, Math.floor(el.clientWidth * 0.75));
        const direction = action === 'scroll-carousel-left' ? -1 : 1;
        el.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
      }
      return;
    }`;

const newScrollLogic = `    if(action==='scroll-carousel-left' || action==='scroll-carousel-right'){
      const targetId = b.dataset.target || 'netflix-top10-track';
      const el = document.getElementById(targetId) || b.closest('.netflix-top10-section')?.querySelector('.netflix-top10-track');
      if(el){
        const cardWidth = el.querySelector('.netflix-top10-card')?.offsetWidth || 230;
        const visibleCards = Math.max(1, Math.floor(el.clientWidth / cardWidth));
        const scrollAmount = cardWidth * Math.max(1, visibleCards - 1);
        if(action === 'scroll-carousel-right'){
          // Se estiver próximo do fim, rola até o limite máximo para exibir o 10º card completo
          if(el.scrollLeft + el.clientWidth >= el.scrollWidth - 300){
            el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
          } else {
            el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          }
        } else {
          el.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
      }
      return;
    }`;

if (app.includes(oldScrollLogic)) {
  app = app.replace(oldScrollLogic, newScrollLogic);
  console.log('✅ Lógica de rolagem do carrossel otimizada para exibir até o 10º título completo.');
}

fs.writeFileSync(appPath, app, 'utf8');

// 4. Injetar Seção 32 no design-v8.css: Padronização Infalível de Proporção, Eliminação de Overflow e Remoção da Barra Vermelha
const cssSection32 = `
/* ========================================================================== */
/* 32. PADRONIZAÇÃO INFALÍVEL DE CARDS, SEM OVERFLOW & SEM BARRA VERMELHA (v8.3.19) */
/* ========================================================================== */

/* --- 1. REMOÇÃO TOTAL DA BARRA VERMELHA DE ROLAGEM (VISUAL 100% LIMPO NETFLIX) --- */
.netflix-top10-track {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
  padding-right: 4rem !important; /* Espaço para o 10º card respirar perfeitamente */
}

.netflix-top10-track::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

/* --- 2. TRAVA MATEMÁTICA INFALÍVEL DE ALTURA (150% DA LARGURA = 2:3 EXATO) --- */
/* Garante que NENHUM card, seja Paralyzed by Hope, Carl Sagan ou qualquer outro, fique mais alto */
.iptv-ref-poster-card {
  width: 100% !important;
  max-width: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.iptv-ref-poster-thumb {
  width: 100% !important;
  height: 0 !important;
  padding-bottom: 150% !important; /* Proporção 2:3 rígida, matematicamente cravada */
  position: relative !important;
  overflow: hidden !important;
  border-radius: 6px !important;
  background: #14161f !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-sizing: border-box !important;
}

.iptv-ref-poster-thumb img {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  object-fit: cover !important;
  object-position: center top !important;
  display: block !important;
  border-radius: inherit !important;
}

/* Altura dos Textos Cravada em 40px para Alinhamento Milimétrico das Linhas */
.iptv-ref-poster-info {
  height: 40px !important;
  min-height: 40px !important;
  max-height: 40px !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  margin-top: 6px !important;
  box-sizing: border-box !important;
}

.iptv-ref-poster-title {
  font-size: 0.82rem !important;
  font-weight: 700 !important;
  color: #ffffff !important;
  line-height: 1.2 !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 1 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  margin: 0 !important;
}

.iptv-ref-poster-sub {
  font-size: 0.68rem !important;
  font-weight: 600 !important;
  color: rgba(255, 255, 255, 0.45) !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  margin: 0 !important;
}

/* --- 3. AUTO-FIT INTELIGENTE: NENHUM CARD SAI DA TELA (ZERO OVERFLOW LATERAL) --- */
.iptv-ref-grid {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)) !important;
  gap: 1.25rem 0.85rem !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

@media (max-width: 580px) {
  .iptv-ref-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important;
    gap: 0.75rem 0.5rem !important;
  }
}

/* --- 4. CARDS DO TOP 10 PROPORCIONAIS E SEM CORTES --- */
.netflix-top10-card {
  width: 230px !important;
  height: 220px !important;
  flex: 0 0 230px !important;
}

.netflix-top10-poster {
  width: 140px !important;
  height: 210px !important;
  flex: 0 0 140px !important;
  border-radius: 6px !important;
  overflow: hidden !important;
}

.netflix-top10-num {
  font-size: 8.5rem !important;
  line-height: 0.8 !important;
  margin-right: -28px !important;
}
`;

if (!css.includes('/* 32. PADRONIZAÇÃO INFALÍVEL DE CARDS')) {
  css += cssSection32;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✅ Seção 32 de proporção infalível, zero overflow e sem barra vermelha injetada no design-v8.css!');
} else {
  console.log('ℹ️ Seção 32 já presente.');
}

console.log('🎉 Implementação da v8.3.19 finalizada com sucesso!');
