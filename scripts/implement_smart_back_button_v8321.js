const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'public', 'static', 'app.js');
const cssPath = path.join(__dirname, '..', 'public', 'static', 'design-v8.css');

let app = fs.readFileSync(appPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');

console.log('🚀 Implementando Botão Voltar Inteligente e Interceptação de Voltar no Android (v8.3.21)...');

// 1. Criar a função global window.handleAndroidBackButton em app.js
const backButtonGlobal = `
// ==========================================================================
// CONTROLE INTELIGENTE DE VOLTAR DO ANDROID & TECLADO (v8.3.21)
// ==========================================================================
window.handleAndroidBackButton = function() {
  // 1. Se estiver com player VOD aberto (#vod-theater), fecha o player e volta ao catálogo
  if (document.getElementById('vod-theater')) {
    closeVodTheater();
    return true; // consumiu o evento, impede fechar o app!
  }
  // 2. Se estiver em tela cheia HTML5
  if (document.fullscreenElement) {
    if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
    return true;
  }
  // 3. Se houver modal aberto
  const modal = document.getElementById('modal');
  if (modal && modal.open) {
    modal.close();
    return true;
  }
  // 4. Se estiver em página secundária, volta para o início
  if (location.hash && location.hash !== '#/' && location.hash !== '#/dashboard') {
    location.hash = '#/dashboard';
    return true;
  }
  return false; // Permite fechar o app se o usuário já estiver na tela inicial
};

// Integração com Capacitor App Plugin se disponível
if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
  try {
    window.Capacitor.Plugins.App.addListener('backButton', () => {
      window.handleAndroidBackButton();
    });
  } catch(e) {}
}
`;

if (!app.includes('window.handleAndroidBackButton')) {
  app += backButtonGlobal;
  console.log('✅ window.handleAndroidBackButton injetado com sucesso.');
}

// 2. Aprimorar closeVodTheater para sair do fullscreen e liberar recursos
const oldCloseTheater = `function closeVodTheater(){
  clearTimeout(vodIdleTimer);
  vodIdleTimer = null;
  window._currentVodItem = null;
  window._currentPlaying = null;
  window.eventBus.emit('playback:stopped');
  const ytIframe = document.getElementById('vod-yt-iframe');
  if(ytIframe) ytIframe.src = '';
  stopPlayback();
  const theater = document.getElementById('vod-theater');
  if(theater) theater.remove();
}`;

const newCloseTheater = `function closeVodTheater(){
  clearTimeout(vodIdleTimer);
  vodIdleTimer = null;
  
  // Sair de tela cheia se estiver ativa
  if(document.fullscreenElement){
    if(document.exitFullscreen) document.exitFullscreen().catch(()=>{});
  }

  window._currentVodItem = null;
  window._currentPlaying = null;
  window.eventBus.emit('playback:stopped');
  
  const ytIframe = document.getElementById('vod-yt-iframe');
  if(ytIframe) ytIframe.src = '';
  
  stopPlayback();
  
  const theater = document.getElementById('vod-theater');
  if(theater) theater.remove();
}`;

if (app.includes(oldCloseTheater)) {
  app = app.replace(oldCloseTheater, newCloseTheater);
  console.log('✅ closeVodTheater atualizado com saída limpa de tela cheia.');
}

// 3. Adicionar Botão Voltar Flutuante dedicado no openVodTheater e suporte a touch mobile
const oldTheaterHeader = `    <div class="iptv-vod-theater-header">
      <button class="iptv-vod-back-btn" data-action="close-vod-theater" title="Voltar ao Catálogo (ESC)" tabindex="0">
        \${icon('left')} <span>Voltar</span>
      </button>`;

const newTheaterHeader = `    <!-- Botão Voltar Flutuante Universal (Sempre Acessível por Toque) -->
    <button class="iptv-floating-back-btn" data-action="close-vod-theater" title="Voltar ao Catálogo (ESC)" aria-label="Voltar" tabindex="0">
      \${icon('left')} <span>Voltar</span>
    </button>
    <div class="iptv-vod-theater-header">
      <button class="iptv-vod-back-btn" data-action="close-vod-theater" title="Voltar ao Catálogo (ESC)" tabindex="0">
        \${icon('left')} <span>Voltar</span>
      </button>`;

if (app.includes(oldTheaterHeader) && !app.includes('iptv-floating-back-btn')) {
  app = app.replace(oldTheaterHeader, newTheaterHeader);
  console.log('✅ Botão Voltar Flutuante inserido no player de vídeo.');
}

// 4. Adicionar listeners touchstart e pointerdown para mobile no openVodTheater
const oldTheaterListeners = `  theater.addEventListener('mousemove', resetVodIdleTimer);
  theater.addEventListener('click', resetVodIdleTimer);`;

const newTheaterListeners = `  theater.addEventListener('mousemove', resetVodIdleTimer);
  theater.addEventListener('click', resetVodIdleTimer);
  theater.addEventListener('touchstart', resetVodIdleTimer, { passive: true });
  theater.addEventListener('pointerdown', resetVodIdleTimer, { passive: true });`;

if (app.includes(oldTheaterListeners)) {
  app = app.replace(oldTheaterListeners, newTheaterListeners);
  console.log('✅ Listeners de toque (touchstart/pointerdown) adicionados ao player.');
}

fs.writeFileSync(appPath, app, 'utf8');

// 5. Injetar Seção 34 no design-v8.css: Estilização do Botão Voltar Flutuante e Ergonomia Mobile
const cssSection34 = `
/* ========================================================================== */
/* 34. BOTÃO VOLTAR FLUTUANTE UNIVERSAL & ERGONOMIA MOBILE DO PLAYER (v8.3.21) */
/* ========================================================================== */

/* Botão Voltar Flutuante no Topo Esquerdo do Vídeo (Estilo Netflix / YouTube) */
.iptv-floating-back-btn {
  position: absolute;
  top: max(16px, env(safe-area-inset-top));
  left: max(16px, env(safe-area-inset-left));
  z-index: 10005;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  background: rgba(15, 17, 23, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  color: #ffffff;
  font-family: var(--iptv-font, sans-serif);
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  transition: opacity 0.25s ease, transform 0.2s ease, background 0.2s ease;
  pointer-events: auto;
}

.iptv-floating-back-btn svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.iptv-floating-back-btn:hover,
.iptv-floating-back-btn:focus-visible {
  background: #e50914;
  border-color: #e50914;
  transform: scale(1.05);
  box-shadow: 0 0 16px rgba(229, 9, 20, 0.6);
}

.iptv-floating-back-btn:active {
  transform: scale(0.95);
}

/* Quando o player estiver ocioso (idle-hidden), o botão voltar e o header esmaecem suavemente */
.iptv-vod-theater.idle-hidden .iptv-floating-back-btn {
  opacity: 0;
  pointer-events: none;
  transform: translateY(-8px);
}

/* No mobile em paisagem, botão voltar grande e confortável para o toque */
@media (max-width: 900px) and (orientation: landscape) {
  .iptv-floating-back-btn {
    top: max(12px, env(safe-area-inset-top));
    left: max(16px, env(safe-area-inset-left));
    padding: 0.65rem 1.15rem;
    font-size: 0.95rem;
  }
}
`;

if (!css.includes('/* 34. BOTÃO VOLTAR FLUTUANTE UNIVERSAL')) {
  css += cssSection34;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✅ Seção 34 do Botão Voltar Flutuante injetada no design-v8.css!');
} else {
  console.log('ℹ️ Seção 34 já presente no design-v8.css.');
}

console.log('🎉 Implementação da v8.3.21 concluída com sucesso!');
