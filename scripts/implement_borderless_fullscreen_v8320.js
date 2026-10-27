const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'public', 'static', 'app.js');
const cssPath = path.join(__dirname, '..', 'public', 'static', 'design-v8.css');

let app = fs.readFileSync(appPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');

console.log('🚀 Implementando Tela Cheia Sem Bordas (Modo Imersivo & Preenchimento de Tela) v8.3.20...');

// 1. Atualizar toggleAspectRatio em app.js para suporte a cover/contain/fill com classes explícitas
const oldToggleAspect = `function toggleAspectRatio(){
  const v = document.getElementById('video');
  const lbl = document.getElementById('aspect-ratio-label');
  if(!v) return;
  const modes = ['contain', 'cover', 'fill'];
  const labels = { contain: 'Auto', cover: 'Preencher', fill: 'Esticar' };
  const current = v.style.objectFit || 'contain';
  const next = modes[(modes.indexOf(current) + 1) % modes.length];
  v.style.objectFit = next;
  if(lbl) lbl.textContent = labels[next];
  toast(\`Enquadramento: \${labels[next]}\`);
  resetVodIdleTimer();
}`;

const newToggleAspect = `function toggleAspectRatio(forcedMode){
  const v = document.getElementById('video');
  const theater = document.getElementById('vod-theater');
  const wrapper = document.querySelector('.iptv-vod-video-wrapper') || v?.parentElement;
  const lbl = document.getElementById('aspect-ratio-label');
  if(!v) return;

  const modes = ['cover', 'contain', 'fill'];
  const labels = { 
    cover: 'Preencher Tela (Sem Bordas)', 
    contain: 'Ajustar Original', 
    fill: 'Esticar' 
  };
  
  let current = v.dataset.fitMode || (v.classList.contains('fit-cover') ? 'cover' : 'contain');
  let next = forcedMode || modes[(modes.indexOf(current) + 1) % modes.length];
  
  v.dataset.fitMode = next;
  v.style.setProperty('--video-object-fit', next);
  v.style.objectFit = next;

  // Atualizar classes no elemento de vídeo e no wrapper
  v.classList.remove('fit-cover', 'fit-contain', 'fit-fill');
  v.classList.add(\`fit-\${next}\`);
  if(wrapper){
    wrapper.classList.remove('fit-cover', 'fit-contain', 'fit-fill');
    wrapper.classList.add(\`fit-\${next}\`);
  }

  if(lbl) lbl.textContent = (next === 'cover' ? 'Preencher' : (next === 'contain' ? 'Auto' : 'Esticar'));
  toast(\`⛶ \${labels[next]}\`);
  resetVodIdleTimer();
}`;

if (app.includes(oldToggleAspect)) {
  app = app.replace(oldToggleAspect, newToggleAspect);
  console.log('✅ toggleAspectRatio aprimorado com classes e suporte a Preencher Tela Sem Bordas.');
}

// 2. Adicionar suporte a Duplo Toque / Duplo Clique no vídeo para alternar modo de preenchimento (Sem Bordas)
const oldVideoSetup = `  theater.addEventListener('mousemove', resetVodIdleTimer);
  theater.addEventListener('click', resetVodIdleTimer);
  resetVodIdleTimer();`;

const newVideoSetup = `  theater.addEventListener('mousemove', resetVodIdleTimer);
  theater.addEventListener('click', resetVodIdleTimer);
  
  // Duplo toque / duplo clique para alternar "Preencher Tela Cheia (Sem Bordas)" vs "Ajustar Original"
  let lastVideoClick = 0;
  theater.addEventListener('click', (e) => {
    // Ignorar cliques nos botões de controle
    if (e.target.closest('button, select, input, .iptv-vod-timeline-row')) return;
    const now = Date.now();
    if (now - lastVideoClick < 350) {
      // Duplo clique detectado: alternar entre Preencher (cover) e Ajustar (contain)
      const v = document.getElementById('video');
      const cur = v?.dataset.fitMode || 'contain';
      toggleAspectRatio(cur === 'cover' ? 'contain' : 'cover');
    }
    lastVideoClick = now;
  });

  resetVodIdleTimer();`;

if (app.includes(oldVideoSetup)) {
  app = app.replace(oldVideoSetup, newVideoSetup);
  console.log('✅ Gesto de duplo toque / duplo clique para Preencher Tela Sem Bordas adicionado.');
}

// 3. Atualizar theater-fullscreen para pedir tela cheia imersiva no container completo ou vídeo
const oldTheaterFullscreen = `    if(action==='theater-fullscreen'){
      const v = document.getElementById('video');
      if(v){
        if(v.requestFullscreen) v.requestFullscreen();
        else if(v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      }
      return;
    }`;

const newTheaterFullscreen = `    if(action==='theater-fullscreen'){
      const theater = document.getElementById('vod-theater');
      const v = document.getElementById('video');
      const targetEl = theater || v;
      if(targetEl){
        if(document.fullscreenElement){
          if(document.exitFullscreen) document.exitFullscreen();
        } else {
          // Ativar tela cheia com barra de navegação do sistema oculta (Immersive Web)
          const opts = { navigationUI: 'hide' };
          if(targetEl.requestFullscreen) targetEl.requestFullscreen(opts).catch(() => targetEl.requestFullscreen());
          else if(v && v.webkitEnterFullscreen) v.webkitEnterFullscreen();
        }
      }
      return;
    }`;

if (app.includes(oldTheaterFullscreen)) {
  app = app.replace(oldTheaterFullscreen, newTheaterFullscreen);
  console.log('✅ Ação theater-fullscreen atualizada para tela cheia imersiva no container.');
}

fs.writeFileSync(appPath, app, 'utf8');

// 4. Injetar Seção 33 no design-v8.css: Player de Vídeo em Tela Cheia Sem Bordas (Modo Imersivo)
const cssSection33 = `
/* ========================================================================== */
/* 33. PLAYER DE VÍDEO EM TELA CHEIA SEM BORDAS (MODO IMERSIVO TOTAL) (v8.3.20) */
/* ========================================================================== */

/* --- 1. Modo Preencher Tela Cheia Sem Bordas (Cover / Fill / Contain) --- */
.iptv-vod-video-element.fit-cover,
video.fit-cover,
.iptv-vod-video-wrapper.fit-cover video,
#vod-theater.fit-cover video {
  object-fit: cover !important;
  width: 100% !important;
  height: 100% !important;
}

.iptv-vod-video-element.fit-fill,
video.fit-fill,
.iptv-vod-video-wrapper.fit-fill video,
#vod-theater.fit-fill video {
  object-fit: fill !important;
  width: 100% !important;
  height: 100% !important;
}

.iptv-vod-video-element.fit-contain,
video.fit-contain,
.iptv-vod-video-wrapper.fit-contain video,
#vod-theater.fit-contain video {
  object-fit: contain !important;
  width: 100% !important;
  height: 100% !important;
}

/* --- 2. Sobrescrever Pseudo-classes Nativas de Fullscreen do Navegador/Chromium --- */
video:fullscreen,
video:-webkit-full-screen,
.iptv-vod-theater:fullscreen,
.iptv-vod-theater:-webkit-full-screen,
.iptv-vod-video-wrapper:fullscreen video,
.iptv-vod-theater:fullscreen video {
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  background: #000000 !important;
}

/* Quando o modo for Cover em Fullscreen: Preenchimento Total de 100% dos pixels da tela */
video:fullscreen.fit-cover,
video:-webkit-full-screen.fit-cover,
.iptv-vod-theater:fullscreen video.fit-cover,
.iptv-vod-theater:-webkit-full-screen video.fit-cover,
.iptv-vod-theater.fit-cover:fullscreen video,
.iptv-vod-theater.fit-cover:-webkit-full-screen video {
  object-fit: cover !important;
  width: 100vw !important;
  height: 100vh !important;
}

/* --- 3. Limpeza de Borda e Ocultamento Automático de Barras do Sistema no Mobile --- */
@media (max-width: 900px) and (orientation: landscape) {
  .iptv-vod-theater {
    padding: 0 !important;
    margin: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
  }
  
  .iptv-vod-video-wrapper {
    width: 100vw !important;
    height: 100vh !important;
  }
}
`;

if (!css.includes('/* 33. PLAYER DE VÍDEO EM TELA CHEIA SEM BORDAS')) {
  css += cssSection33;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✅ Seção 33 de Tela Cheia Sem Bordas injetada com sucesso no design-v8.css!');
} else {
  console.log('ℹ️ Seção 33 já presente.');
}

console.log('🎉 Implementação da v8.3.20 concluída!');
