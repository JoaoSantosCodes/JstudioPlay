const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'public', 'static', 'app.js');
const cssPath = path.join(__dirname, '..', 'public', 'static', 'design-v8.css');

let app = fs.readFileSync(appPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');

console.log('📦 Aplicando Padronização Rigorosa de Cards Estilo Netflix (v8.3.17)...');

// 1. Limpeza de tags excedentes no dashboard()
const oldExtraTags = `          </div>
            </div>
            <div class="iptv-ref-continue-title">\${esc(c.title)}</div>
            <div class="iptv-ref-continue-meta">\${esc(c.subtitle)}</div>
          </div>`;

if (app.includes(oldExtraTags)) {
  app = app.replace(oldExtraTags, '          </div>');
  console.log('✅ Tags residuais do dashboard() limpas com sucesso.');
}

// 2. Substituir prateleira Continuar Assistindo em catalogPage() para usar netflix-continue-card oficial
const oldCatalogContinueBlock = `      <div class="iptv-ref-shelf-wrap">
        <h3 style="font-size:1.1rem; font-weight:700; color:#fff; margin:0 0 0.75rem;">Continuar Assistindo</h3>
        <div class="iptv-ref-shelf-track">
          \${continueItems.map(c => \`
            <div class="iptv-ref-continue-card" data-action="resume-vod" data-title="\${esc(c.title)}" tabindex="0">
              <div class="iptv-ref-continue-thumb">
                <img src="\${c.img || ''}" alt="\${esc(c.title)}" loading="lazy">
                <div class="iptv-ref-continue-progress">
                  <div class="iptv-ref-continue-bar" style="width:\${c.progress}%;"></div>
                </div>
              </div>
              <div class="iptv-ref-continue-title">\${esc(c.title)}</div>
              <div class="iptv-ref-continue-meta">\${esc(c.subtitle)}</div>
            </div>
          \`).join('')}
        </div>
      </div>`;

const newCatalogContinueBlock = `      <div class="iptv-ref-shelf-wrap" style="margin-bottom:2rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.85rem;">
          <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin:0;">Continuar Assistindo</h3>
        </div>
        <div class="iptv-ref-shelf-track">
          \${continueItems.map((c, cIdx) => \`
            <div class="netflix-continue-card" data-action="resume-vod" data-title="\${esc(c.title)}" tabindex="0">
              <div class="netflix-continue-thumb">
                <img src="\${c.img}" alt="\${esc(c.title)}" loading="lazy" decoding="async" onerror="window.handlePosterError(this, '\${esc(c.title)}')">
                <div class="netflix-continue-play-circle" title="Continuar">
                  <svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7V5z"/></svg>
                </div>
                <div class="netflix-continue-progress-bg">
                  <div class="netflix-continue-progress-fill" style="width:\${c.progress}%;"></div>
                </div>
              </div>
              <div class="netflix-continue-footer">
                <button class="netflix-continue-footer-btn" data-action="catalog-card-click" data-type="\${isSeries?'series':'movies'}\" data-index="\${cIdx}" title="Detalhes" aria-label="Detalhes">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                </button>
                <div class="netflix-continue-divider"></div>
                <button class="netflix-continue-footer-btn" data-action="resume-vod" data-title="\${esc(c.title)}" title="Opções" aria-label="Opções">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                </button>
              </div>
            </div>
          \`).join('')}
        </div>
      </div>`;

if (app.includes(oldCatalogContinueBlock)) {
  app = app.replace(oldCatalogContinueBlock, newCatalogContinueBlock);
  console.log('✅ Prateleira Continuar Assistindo em catalogPage() atualizada para netflix-continue-card 2:3!');
} else {
  console.log('⚠️ oldCatalogContinueBlock não encontrou correspondência exata de quebras de linha.');
}

// 3. Atualizar renderização do pôster no catálogo para usar decoding="async" e onerror canônico
const oldCardImg = `<img src="\${esc(coverImg)}" alt="\${esc(m.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`;
const newCardImg = `<img src="\${esc(coverImg)}" alt="\${esc(m.name)}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`;
if (app.includes(oldCardImg)) {
  app = app.replace(oldCardImg, newCardImg);
  console.log('✅ Imagens de catálogo enriquecidas com decoding="async".');
}

fs.writeFileSync(appPath, app, 'utf8');

// 4. Adicionar Seção 30 no CSS design-v8.css: Padronização Uniforme de Tamanho de Cards
const cssSection30 = `
/* ========================================================================== */
/* 30. PADRONIZAÇÃO UNIFORME DE TAMANHO DE CARDS & IMAGENS NETFLIX (v8.3.17)  */
/* ========================================================================== */

/* --- 1. Proporção Canônica Universal 2:3 para TODOS os Thumbs de Catálogo e Continuar Assistindo --- */
.iptv-ref-poster-thumb,
.netflix-continue-thumb,
.iptv-vod-similar-thumb,
.channel-card-poster {
  aspect-ratio: 2 / 3 !important;
  width: 100% !important;
  height: auto !important;
  max-height: none !important;
  min-height: auto !important;
  border-radius: 6px !important;
  overflow: hidden !important;
  position: relative !important;
  background: #14161f !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-sizing: border-box !important;
}

/* --- 2. Cobertura Total sem Deformação e sem Espaço Preto em NENHUM Card --- */
.iptv-ref-poster-thumb img,
.netflix-continue-thumb img,
.iptv-vod-similar-thumb img,
.channel-card-poster img {
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  object-fit: cover !important;
  object-position: center top !important;
  display: block !important;
  border-radius: inherit !important;
}

/* --- 3. Alinhamento Uniforme dos Cards no Grid (Elimina Qualquer Degrau ou Variação de Altura) --- */
.iptv-ref-poster-card {
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  align-self: stretch !important;
  cursor: pointer !important;
  position: relative !important;
  box-sizing: border-box !important;
}

.iptv-ref-poster-info {
  display: flex !important;
  flex-direction: column !important;
  gap: 2px !important;
  margin-top: 6px !important;
  min-height: 38px !important;
  max-height: 38px !important;
  overflow: hidden !important;
}

.iptv-ref-poster-title {
  font-size: 0.82rem !important;
  font-weight: 700 !important;
  color: #ffffff !important;
  line-height: 1.25 !important;
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

/* --- 4. Larguras Homogêneas da Prateleira Continuar Assistindo em 2:3 --- */
.netflix-continue-card {
  width: 145px !important;
  min-width: 145px !important;
  max-width: 145px !important;
  flex: 0 0 145px !important;
  border-radius: 6px !important;
  overflow: hidden !important;
  background: #121318 !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6) !important;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease !important;
}

@media (min-width: 1024px) {
  .netflix-continue-card {
    width: 175px !important;
    min-width: 175px !important;
    max-width: 175px !important;
    flex: 0 0 175px !important;
  }
}

/* --- 5. Responsividade Proporcional da Grade de Filmes e Séries --- */
@media (max-width: 480px) {
  .iptv-ref-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 0.75rem 0.5rem !important;
  }
  .iptv-ref-poster-thumb,
  .netflix-continue-thumb {
    border-radius: 4px !important;
  }
  .iptv-ref-poster-title {
    font-size: 0.76rem !important;
  }
  .iptv-ref-poster-sub {
    font-size: 0.62rem !important;
  }
  .netflix-continue-card {
    width: 120px !important;
    min-width: 120px !important;
    max-width: 120px !important;
    flex: 0 0 120px !important;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .iptv-ref-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 0.85rem 0.65rem !important;
  }
}

@media (min-width: 769px) and (max-width: 1100px) {
  .iptv-ref-grid {
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 1.15rem 0.85rem !important;
  }
}

@media (min-width: 1101px) and (max-width: 1440px) {
  .iptv-ref-grid {
    grid-template-columns: repeat(5, 1fr) !important;
    gap: 1.35rem 1rem !important;
  }
}

@media (min-width: 1441px) {
  .iptv-ref-grid {
    grid-template-columns: repeat(6, 1fr) !important;
    gap: 1.5rem 1.15rem !important;
  }
}
`;

if (!css.includes('/* 30. PADRONIZAÇÃO UNIFORME DE TAMANHO DE CARDS')) {
  css += cssSection30;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✅ Seção 30 de padronização de cards injetada com sucesso no design-v8.css!');
} else {
  console.log('ℹ️ Seção 30 já presente no design-v8.css.');
}

console.log('🎉 Padronização concluída com sucesso!');
