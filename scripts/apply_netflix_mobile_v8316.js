const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../public/static/design-v8.css');
const appJsPath = path.join(__dirname, '../public/static/app.js');

let css = fs.readFileSync(cssPath, 'utf8').trimEnd();
let appJs = fs.readFileSync(appJsPath, 'utf8');

// 1. Seção 29 no CSS com o Design System Oficial Netflix Mobile
const section29 = `

/* ========================================================================== */
/* 29. DESIGN SYSTEM OFICIAL NETFLIX MOBILE 2026 (v8.3.16)                    */
/* ========================================================================== */

/* --- 1. Floating Pill Navigation Bar (Pílula Flutuante Suspensa) --- */
@media (max-width: 680px) {
  .iptv-bottom-bar {
    position: fixed !important;
    bottom: calc(env(safe-area-inset-bottom, 12px) + 12px) !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: calc(100% - 32px) !important;
    max-width: 390px !important;
    height: 62px !important;
    border-radius: 36px !important;
    background: rgba(18, 20, 26, 0.88) !important;
    backdrop-filter: blur(28px) saturate(200%) !important;
    -webkit-backdrop-filter: blur(28px) saturate(200%) !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.88), 0 0 1px rgba(255, 255, 255, 0.25) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-around !important;
    padding: 0 10px !important;
    z-index: 999 !important;
    gap: 4px !important;
  }

  .iptv-bottom-item {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    color: rgba(255, 255, 255, 0.55) !important;
    text-decoration: none !important;
    padding: 3px 0 !important;
    border-radius: 20px !important;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    font-size: 0.65rem !important;
    font-weight: 600 !important;
    gap: 2px !important;
    min-width: 0 !important;
  }

  .iptv-bottom-item .iptv-bottom-icon-wrap {
    width: 38px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    transition: background 0.2s ease, transform 0.2s ease;
  }

  .iptv-bottom-item svg {
    width: 20px !important;
    height: 20px !important;
    transition: transform 0.2s ease;
  }

  .iptv-bottom-item.active {
    color: #ffffff !important;
  }

  .iptv-bottom-item.active .iptv-bottom-icon-wrap {
    background: rgba(255, 255, 255, 0.16) !important;
    transform: scale(1.04);
  }

  .netflix-nav-avatar {
    width: 22px;
    height: 22px;
    border-radius: 4px;
    object-fit: cover;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  body {
    padding-bottom: 96px !important;
  }
}

/* --- 2. Cards Oficiais Netflix de "Continuar Assistindo" --- */
.netflix-continue-card {
  flex: 0 0 148px;
  width: 148px;
  background: #14151a;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease;
  cursor: pointer;
  position: relative;
}

@media (max-width: 600px) {
  .netflix-continue-card {
    flex: 0 0 136px;
    width: 136px;
  }
}

.netflix-continue-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.85);
}

.netflix-continue-card:active {
  transform: scale(0.96);
}

.netflix-continue-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  background: #181a24;
}

.netflix-continue-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Botão Circular de Play Netflix no Meio da Imagem */
.netflix-continue-play-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(18, 20, 26, 0.65);
  border: 2px solid rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 3;
}

.netflix-continue-play-circle svg {
  width: 20px;
  height: 20px;
  margin-left: 2px;
  fill: #ffffff;
}

.netflix-continue-card:hover .netflix-continue-play-circle {
  background: #e50914;
  border-color: #e50914;
  transform: translate(-50%, -50%) scale(1.1);
  box-shadow: 0 0 16px rgba(229, 9, 20, 0.6);
}

/* Barra Vermelha de Progresso na Base do Poster */
.netflix-continue-progress-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3.5px;
  background: rgba(255, 255, 255, 0.25);
  z-index: 4;
}

.netflix-continue-progress-fill {
  height: 100%;
  background: #e50914;
  box-shadow: 0 0 8px rgba(229, 9, 20, 0.8);
}

/* Barra Inferior com ⓘ e ⋮ */
.netflix-continue-footer {
  height: 38px;
  background: #111216;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0 4px;
}

.netflix-continue-footer-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.netflix-continue-footer-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.netflix-continue-divider {
  width: 1px;
  height: 18px;
  background: rgba(255, 255, 255, 0.12);
}

/* --- 3. Badges Oficiais Netflix nos Cards de Catálogo --- */
.netflix-badge-top10 {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 26px;
  height: 30px;
  background: #e50914;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  z-index: 5;
  line-height: 1;
}

.netflix-badge-top10 span {
  font-size: 0.46rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 0.3px;
}

.netflix-badge-top10 strong {
  font-size: 0.76rem;
  font-weight: 900;
  color: #ffffff;
}

.netflix-badge-bottom {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  background: #e50914;
  color: #ffffff;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.2px;
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.85);
  z-index: 5;
}

/* --- 4. Botões Hero Banner Netflix --- */
.netflix-btn-play-white {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: #ffffff !important;
  color: #000000 !important;
  font-size: 0.95rem !important;
  font-weight: 800 !important;
  border-radius: 6px !important;
  padding: 0.65rem 1.4rem !important;
  border: none !important;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.netflix-btn-play-white svg {
  fill: #000000 !important;
  stroke: none !important;
  width: 18px;
  height: 18px;
}

.netflix-btn-play-white:hover {
  background: rgba(255, 255, 255, 0.88) !important;
  transform: scale(1.02);
}

.netflix-btn-mylist {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: rgba(55, 58, 70, 0.8) !important;
  color: #ffffff !important;
  font-size: 0.95rem !important;
  font-weight: 700 !important;
  border-radius: 6px !important;
  padding: 0.65rem 1.4rem !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.netflix-btn-mylist:hover {
  background: rgba(75, 78, 92, 0.9) !important;
  transform: scale(1.02);
}

/* --- 5. Header Superior Netflix Mobile com Perfil e Pílulas --- */
@media (max-width: 680px) {
  .netflix-mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem var(--iptv-safe-x, 1rem);
    margin-bottom: 0.5rem;
  }

  .netflix-user-profile-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    padding: 0;
  }

  .netflix-user-profile-avatar {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    object-fit: cover;
    background: #e50914;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.9rem;
    color: #fff;
  }

  .netflix-user-profile-name {
    font-size: 1.15rem;
    font-weight: 800;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .netflix-header-actions {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .netflix-header-icon-btn {
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    text-decoration: none;
  }

  .netflix-pills-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    overflow-x: auto;
    padding: 0.25rem var(--iptv-safe-x, 1rem) 0.75rem;
    scrollbar-width: none;
  }

  .netflix-pills-row::-webkit-scrollbar {
    display: none;
  }

  .netflix-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.9rem;
    border-radius: 20px;
    font-size: 0.82rem;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    transition: all 0.15s ease;
  }

  .netflix-pill-btn.active {
    background: #ffffff !important;
    color: #000000 !important;
    border-color: #ffffff !important;
  }
}
`;

fs.writeFileSync(cssPath, css + section29 + '\n', 'utf8');
console.log('[OK] Seção 29 (Design System Netflix Mobile) adicionada ao design-v8.css!');

// 2. Atualizar iptvBottomNav em public/static/app.js com a estrutura e ícones da Netflix
const oldBottomNavRegex = /function iptvBottomNav\(active='dashboard'\)\{[\s\S]*?return `<nav class="iptv-bottom-bar"[\s\S]*?<\/nav>`;\s*\}/;

const newBottomNav = `function iptvBottomNav(active='dashboard'){
  const isMovies = ['catalog','movies'].includes(active);
  const isLive = ['live','channels'].includes(active);
  const isSeries = active === 'series';
  const isSettings = ['settings','profile','users'].includes(active);
  const avatarUrl = state.user?.avatar;
  const initial = (state.user?.name || state.user?.username || 'J')[0].toUpperCase();

  return \`<nav class="iptv-bottom-bar" aria-label="Navegação Flutuante Netflix">
    <a class="iptv-bottom-item \${active==='dashboard'?'active':''}" href="#/dashboard" tabindex="0">
      <div class="iptv-bottom-icon-wrap">
        \${icon('home')}
      </div>
      <span>Início</span>
    </a>
    <a class="iptv-bottom-item \${isLive?'active':''}" href="#/live" tabindex="0">
      <div class="iptv-bottom-icon-wrap">
        \${icon('tv')}
      </div>
      <span>Ao Vivo</span>
    </a>
    <a class="iptv-bottom-item \${isMovies?'active':''}" href="#/movies" tabindex="0">
      <div class="iptv-bottom-icon-wrap">
        \${icon('film')}
      </div>
      <span>Filmes</span>
    </a>
    <a class="iptv-bottom-item \${isSeries?'active':''}" href="#/series" tabindex="0">
      <div class="iptv-bottom-icon-wrap">
        \${icon('grid')}
      </div>
      <span>Séries</span>
    </a>
    <a class="iptv-bottom-item \${isSettings?'active':''}" href="#/settings" tabindex="0">
      <div class="iptv-bottom-icon-wrap">
        \${avatarUrl ? \`<img src="\${esc(avatarUrl)}" class="netflix-nav-avatar" alt="Perfil">\` : \`<div class="netflix-nav-avatar" style="background:#e50914; color:#fff; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:800;">\${initial}</div>\`}
      </div>
      <span>Minha Conta</span>
    </a>
  </nav>\`;
}`;

appJs = appJs.replace(oldBottomNavRegex, newBottomNav);
console.log('[OK] iptvBottomNav atualizado com formato Floating Pill Netflix!');

// 3. Atualizar Hero Banner Actions no dashboard() com botões padrão Netflix
const oldHeroActions = `<div class="iptv-master-hero-actions">
          <button class="iptv-btn-play-red" data-action="play-featured-hero" tabindex="0">
            \${icon('play')} Assistir Agora
          </button>
          <a class="iptv-btn-info-glass" href="#/multiview" tabindex="0">
            \${icon('monitor')} Mosaico 2x2
          </a>
        </div>`;

const newHeroActions = `<div class="iptv-master-hero-actions">
          <button class="netflix-btn-play-white" data-action="play-featured-hero" tabindex="0">
            <svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7V5z"/></svg> <span>Assistir</span>
          </button>
          <button class="netflix-btn-mylist" data-action="quick-fav-catalog" data-name="\${esc(heroTitle)}" tabindex="0">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> <span>Minha lista</span>
          </button>
          <a class="iptv-btn-info-glass" href="#/multiview" tabindex="0" title="Mosaico Multi-Telas">
            \${icon('monitor')}
          </a>
        </div>`;

appJs = appJs.replace(oldHeroActions, newHeroActions);
console.log('[OK] Hero Banner atualizado com botões oficiais Netflix!');

// 4. Atualizar cards de Continuar Assistindo no dashboard() para o formato Netflix
const oldContinueCardRegex = /<div class="iptv-ref-continue-card" data-action="resume-vod" data-title="\${esc\(c\.title\)}" tabindex="0" style="cursor:pointer;">[\s\S]*?<\/div>\s*<\/div>/;

const newContinueCard = `<div class="netflix-continue-card" data-action="resume-vod" data-title="\${esc(c.title)}" tabindex="0">
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
              <button class="netflix-continue-footer-btn" data-action="catalog-card-click" data-type="movies" data-index="0" title="Detalhes" aria-label="Detalhes">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              </button>
              <div class="netflix-continue-divider"></div>
              <button class="netflix-continue-footer-btn" data-action="resume-vod" data-title="\${esc(c.title)}" title="Reproduzir" aria-label="Reproduzir">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
              </button>
            </div>
          </div>`;

appJs = appJs.replace(oldContinueCardRegex, newContinueCard);
console.log('[OK] Cards Continuar Assistindo atualizados com Play Circle e Rodapé Netflix!');

// 5. Injetar Selo TOP 10 e Badge Novidade nos cards de catálogo
if (!appJs.includes('netflix-badge-top10')) {
  appJs = appJs.replace(
    '${m.rating ? `<span class="iptv-poster-badge iptv-rating-badge">⭐ ${m.rating}</span>` : \'\'}',
    '${idx < 10 ? `<div class="netflix-badge-top10"><span>TOP</span><strong>10</strong></div>` : \'\'}\n            ${idx % 3 === 0 ? `<span class="netflix-badge-bottom">\${isSeries ? "Nova temporada" : "Novidade"}</span>` : \'\'}\n            \${m.rating ? `<span class="iptv-poster-badge iptv-rating-badge">⭐ \${m.rating}</span>\` : \'\'}'
  );
  console.log('[OK] Selo TOP 10 e Badges Novidade injetados nos cards de catálogo!');
}

fs.writeFileSync(appJsPath, appJs, 'utf8');
console.log('Todas as melhorias do layout Netflix Mobile foram aplicadas com sucesso!');
