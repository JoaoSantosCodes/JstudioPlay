const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'public', 'static', 'app.js');
const cssPath = path.join(__dirname, '..', 'public', 'static', 'design-v8.css');

let app = fs.readFileSync(appPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');

console.log('🚀 Implementando Refinamentos de Elite: Gestos de Brilho/Volume, Lock Screen e Otimizações Mobile (v8.3.22)...');

// 1. Adicionar HUDs de Brilho e Volume e Botão de Bloqueio de Tela no openVodTheater
const oldVideoWrapper = `    <div class="iptv-vod-video-wrapper">
      <video id="video" playsinline controls autoplay class="iptv-vod-video-element" \${ytId ? 'style="display:none;"' : ''}></video>
      <div class="seek-ripple-overlay" id="seek-ripple-overlay">
        <div class="seek-ripple-circle" id="seek-ripple-icon">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </div>
        <span class="seek-ripple-label" id="seek-ripple-label">+10s</span>
      </div>`;

const newVideoWrapper = `    <div class="iptv-vod-video-wrapper" id="vod-video-wrapper">
      <video id="video" playsinline controls autoplay class="iptv-vod-video-element" \${ytId ? 'style="display:none;"' : ''}></video>
      
      <!-- HUD de Gestos: Brilho & Volume (Estilo MX Player / VLC) -->
      <div class="iptv-gesture-hud" id="gesture-hud">
        <div class="iptv-gesture-icon" id="gesture-hud-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        </div>
        <div class="iptv-gesture-bar">
          <div class="iptv-gesture-fill" id="gesture-hud-fill" style="width:100%;"></div>
        </div>
        <span class="iptv-gesture-label" id="gesture-hud-label">100%</span>
      </div>

      <!-- Botão Flutuante de Desbloqueio quando a tela estiver travada -->
      <div class="iptv-screen-locked-badge" id="screen-locked-badge" data-action="toggle-screen-lock" style="display:none;" title="Toque para desbloquear controles">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>
        <span>Tela Bloqueada</span>
      </div>

      <div class="seek-ripple-overlay" id="seek-ripple-overlay">
        <div class="seek-ripple-circle" id="seek-ripple-icon">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </div>
        <span class="seek-ripple-label" id="seek-ripple-label">+10s</span>
      </div>`;

if (app.includes(oldVideoWrapper)) {
  app = app.replace(oldVideoWrapper, newVideoWrapper);
  console.log('✅ HUD de Gestos (Brilho/Volume) e Lock Screen adicionados ao DOM do vídeo.');
}

// 2. Adicionar botão de Travar Tela (Lock Screen) na barra superior do player
const oldTopActions = `      <div class="iptv-vod-top-actions">
        \${state.relayEnabled && !ytId ? \`<button class="iptv-vod-action-btn" data-action="toggle-relay" title="Modo de compatibilidade" tabindex="0">\${icon('refresh')}</button>\` : ''}
        <button class="iptv-vod-action-btn" data-action="theater-fullscreen" title="Tela Cheia" tabindex="0">\${icon('fullscreen')}</button>
        <button class="iptv-vod-action-btn" data-action="close-vod-theater" title="Fechar" tabindex="0">\${icon('close')}</button>
      </div>`;

const newTopActions = `      <div class="iptv-vod-top-actions">
        \${state.relayEnabled && !ytId ? \`<button class="iptv-vod-action-btn" data-action="toggle-relay" title="Modo de compatibilidade" tabindex="0">\${icon('refresh')}</button>\` : ''}
        <button class="iptv-vod-action-btn" data-action="toggle-screen-lock" id="btn-screen-lock" title="Bloquear Toques na Tela" tabindex="0">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </button>
        <button class="iptv-vod-action-btn" data-action="theater-fullscreen" title="Tela Cheia" tabindex="0">\${icon('fullscreen')}</button>
        <button class="iptv-vod-action-btn" data-action="close-vod-theater" title="Fechar" tabindex="0">\${icon('close')}</button>
      </div>`;

if (app.includes(oldTopActions)) {
  app = app.replace(oldTopActions, newTopActions);
  console.log('✅ Botão de Bloquear Tela adicionado à barra superior do player.');
}

// 3. Adicionar lógica de Gestos Touch (Brilho na esquerda, Volume na direita, Duplo Toque nas bordas)
const gestureCode = `
// ==========================================================================
// GESTOS MOBILE PREMIUM (BRILHO, VOLUME E DOUBLE-TAP SEEK) (v8.3.22)
// ==========================================================================
function setupMobileVideoGestures(theater, video) {
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;
  let gestureType = null; // 'brightness' | 'volume'
  let initialBrightness = 1.0;
  let initialVolume = video.volume || 1.0;
  let lastTapTime = 0;
  let lastTapX = 0;

  theater._screenLocked = false;

  const hud = document.getElementById('gesture-hud');
  const hudIcon = document.getElementById('gesture-hud-icon');
  const hudFill = document.getElementById('gesture-hud-fill');
  const hudLabel = document.getElementById('gesture-hud-label');
  let hudTimer = null;

  function showHud(type, perc) {
    if (!hud) return;
    clearTimeout(hudTimer);
    const p = Math.max(0, Math.min(100, Math.round(perc * 100)));
    if (hudLabel) hudLabel.textContent = \`\${p}%\`;
    if (hudFill) hudFill.style.width = \`\${p}%\`;
    if (hudIcon) {
      if (type === 'brightness') {
        hudIcon.innerHTML = \`<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>\`;
      } else {
        hudIcon.innerHTML = p === 0 
          ? \`<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>\`
          : \`<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>\`;
      }
    }
    hud.classList.add('active');
    hudTimer = setTimeout(() => hud.classList.remove('active'), 1200);
  }

  theater.addEventListener('touchstart', (e) => {
    if (theater._screenLocked) return;
    if (e.target.closest('button, select, input, .iptv-vod-timeline-row, #screen-locked-badge')) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      isSwiping = false;
      gestureType = touchStartX < (window.innerWidth / 2) ? 'brightness' : 'volume';
      initialVolume = video.volume;
      initialBrightness = parseFloat(video.dataset.brightness || '1.0');
    }
  }, { passive: true });

  theater.addEventListener('touchmove', (e) => {
    if (theater._screenLocked) return;
    if (e.target.closest('button, select, input, .iptv-vod-timeline-row, #screen-locked-badge')) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaY = touchStartY - touch.clientY;
      const deltaX = touch.clientX - touchStartX;

      if (!isSwiping && Math.abs(deltaY) > 12 && Math.abs(deltaY) > Math.abs(deltaX)) {
        isSwiping = true;
      }

      if (isSwiping) {
        const factor = deltaY / (window.innerHeight * 0.7);
        if (gestureType === 'brightness') {
          const newBright = Math.max(0.15, Math.min(1.0, initialBrightness + factor));
          video.dataset.brightness = newBright.toString();
          video.style.filter = \`brightness(\${newBright})\`;
          showHud('brightness', (newBright - 0.15) / 0.85);
        } else {
          const newVol = Math.max(0, Math.min(1.0, initialVolume + factor));
          video.volume = newVol;
          showHud('volume', newVol);
        }
      }
    }
  }, { passive: true });

  theater.addEventListener('touchend', (e) => {
    if (theater._screenLocked) return;
    if (isSwiping) {
      isSwiping = false;
      return;
    }
    // Tratamento de Double-Tap para Avançar / Retroceder nas Bordas
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const now = Date.now();
      const clientX = touch.clientX;
      const screenW = window.innerWidth;

      if (now - lastTapTime < 340 && Math.abs(clientX - lastTapX) < 80) {
        // Double tap detectado
        if (clientX < screenW * 0.35) {
          // Double-tap esquerda: volta 10s
          skipVodTime(-10);
        } else if (clientX > screenW * 0.65) {
          // Double-tap direita: avança 10s
          skipVodTime(10);
        } else {
          // Double-tap centro: alterna tela cheia sem bordas
          const cur = video.dataset.fitMode || 'contain';
          toggleAspectRatio(cur === 'cover' ? 'contain' : 'cover');
        }
        lastTapTime = 0;
        return;
      }
      lastTapTime = now;
      lastTapX = clientX;
    }
  }, { passive: true });
}
`;

if (!app.includes('setupMobileVideoGestures')) {
  app += gestureCode;
  console.log('✅ setupMobileVideoGestures injetado com sucesso no app.js.');
}

// 4. Invocar setupMobileVideoGestures dentro de openVodTheater
const invokeGesturesAnchor = `  theater.addEventListener('pointerdown', resetVodIdleTimer, { passive: true });`;
const newInvokeGestures = `  theater.addEventListener('pointerdown', resetVodIdleTimer, { passive: true });
  if(v && !ytId) setupMobileVideoGestures(theater, v);`;

if (app.includes(invokeGesturesAnchor) && !app.includes('setupMobileVideoGestures(theater, v)')) {
  app = app.replace(invokeGesturesAnchor, newInvokeGestures);
  console.log('✅ Chamada de setupMobileVideoGestures inserida no openVodTheater.');
}

// 5. Adicionar handler do toggle-screen-lock no listener de cliques
const lockClickAnchor = `    if(action==='theater-fullscreen'){`;
const lockActionHandler = `    if(action==='toggle-screen-lock'){
      const theater = document.getElementById('vod-theater');
      const badge = document.getElementById('screen-locked-badge');
      if(theater){
        theater._screenLocked = !theater._screenLocked;
        theater.classList.toggle('screen-locked', theater._screenLocked);
        if(badge) badge.style.display = theater._screenLocked ? 'flex' : 'none';
        toast(theater._screenLocked ? '🔒 Toques na tela bloqueados' : '🔓 Tela desbloqueada');
      }
      return;
    }
    if(action==='theater-fullscreen'){`;

if (app.includes(lockClickAnchor) && !app.includes('action===\'toggle-screen-lock\'')) {
  app = app.replace(lockClickAnchor, lockActionHandler);
  console.log('✅ Handler de toggle-screen-lock adicionado aos cliques.');
}

fs.writeFileSync(appPath, app, 'utf8');

// 6. Injetar Seção 35 no design-v8.css: HUD de Gestos e Lock Screen
const cssSection35 = `
/* ========================================================================== */
/* 35. HUD DE GESTOS BRILHO/VOLUME & TELA BLOQUEADA ESTILO NETFLIX (v8.3.22)   */
/* ========================================================================== */

/* HUD Circular de Brilho & Volume */
.iptv-gesture-hud {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.85);
  background: rgba(12, 14, 20, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  padding: 1.25rem 1.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  z-index: 10010;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.85);
}

.iptv-gesture-hud.active {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.iptv-gesture-icon {
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.iptv-gesture-bar {
  width: 120px;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.iptv-gesture-fill {
  height: 100%;
  background: #e50914;
  border-radius: 3px;
  box-shadow: 0 0 10px rgba(229, 9, 20, 0.8);
  transition: width 0.05s linear;
}

.iptv-gesture-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #ffffff;
  font-family: var(--iptv-font, sans-serif);
}

/* Badge Flutuante de Tela Bloqueada */
.iptv-screen-locked-badge {
  position: absolute;
  top: max(20px, env(safe-area-inset-top));
  right: max(20px, env(safe-area-inset-right));
  z-index: 10020;
  background: rgba(229, 9, 20, 0.85);
  color: #ffffff;
  border-radius: 30px;
  padding: 0.6rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
  pointer-events: auto;
  animation: pulseLock 2s infinite ease-in-out;
}

@keyframes pulseLock {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

/* Quando a tela estiver bloqueada, oculta todos os outros controles */
.iptv-vod-theater.screen-locked .iptv-vod-theater-header,
.iptv-vod-theater.screen-locked .iptv-vod-theater-controls,
.iptv-vod-theater.screen-locked .iptv-floating-back-btn {
  display: none !important;
}
`;

if (!css.includes('/* 35. HUD DE GESTOS BRILHO/VOLUME')) {
  css += cssSection35;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✅ Seção 35 injetada com sucesso no design-v8.css!');
} else {
  console.log('ℹ️ Seção 35 já presente no design-v8.css.');
}

console.log('🎉 Implementação da v8.3.22 concluída com sucesso!');
