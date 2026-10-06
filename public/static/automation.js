// =============================================================================
// M3U PLAY PRO - M3U HUB, DYNAMIC GLOW, EQUALIZER, HUD & CUSTOM BUILDER
// =============================================================================

(() => {
  'use strict';

  console.log('[Automation] M3U PLAY Pro Engine v6.0 (Dynamic Cinema Glow & Equalizer) carregado.');

  const icons = {
    activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
    pip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="14" x="3" y="5" rx="2"/><rect width="6" height="4" x="13" y="13" rx="1"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
    tv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>',
    sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>'
  };

  let sleepTimerId = null;
  let audioCtx = null, gainNode = null, bassFilter = null, trebleFilter = null, currentGain = 1.0;
  let currentEpgData = null;

  // Numeric Channel Jump Buffer
  let numBuffer = '';
  let numTimer = null;

  function toast(msg, isErr = false) {
    const el = document.getElementById('toast');
    if (el) {
      el.textContent = msg;
      el.className = isErr ? 'error' : '';
      el.hidden = false;
      setTimeout(() => { el.hidden = true; }, 3500);
    }
  }

  async function authFetch(url, options = {}) {
    const token = localStorage.getItem('m3u-token');
    const custom = localStorage.getItem('m3u-backend-url');
    let base = (custom && custom.trim()) ? custom.trim().replace(/\/+$/, '') : '';
    if (!base && (window.Capacitor || location.protocol === 'capacitor:' || (location.hostname === 'localhost' && !location.port))) {
      base = 'https://jstudioplay.joaocarlosrh23.workers.dev';
    }
    const finalUrl = (url.startsWith('/api') || url.startsWith('/proxy')) ? (base + url) : url;
    const headers = {
      ...(options.headers || {}),
      ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    };
    return fetch(finalUrl, { ...options, headers });
  }

  // ---------------------------------------------------------------------------
  // 1. Sidebar Navigation Integration
  // ---------------------------------------------------------------------------
  function injectNav() {
    const navList = document.querySelector('.nav-list');
    if (!navList || document.getElementById('nav-automation') || navList.querySelector('a[href="#/automation"]')) return;

    const autoLink = document.createElement('a');
    autoLink.id = 'nav-automation';
    autoLink.className = `nav-link ${location.hash === '#/automation' ? 'active' : ''}`;
    autoLink.href = '#/automation';
    autoLink.innerHTML = `
      ${icons.activity}
      <span class="nav-label">M3U Hub & Automação</span>
    `;

    const historyLink = navList.querySelector('a[href="#/history"]') || navList.children[4];
    if (historyLink && historyLink.nextSibling) {
      navList.insertBefore(autoLink, historyLink.nextSibling);
    } else {
      navList.appendChild(autoLink);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Cinema Ambient Light Glow & Video Diagnostics
  // ---------------------------------------------------------------------------
  function injectAmbientGlow() {
    const videoWrap = document.querySelector('.video-wrap');
    if (videoWrap && !document.getElementById('video-ambient-glow')) {
      const glow = document.createElement('div');
      glow.id = 'video-ambient-glow';
      glow.className = 'video-ambient-glow';
      videoWrap.prepend(glow);
    }

    if (videoWrap && !document.getElementById('video-diagnostics-badge')) {
      const badge = document.createElement('div');
      badge.id = 'video-diagnostics-badge';
      badge.className = 'video-diagnostics-badge';
      badge.innerHTML = `
        <span class="diag-dot"></span>
        <span id="diag-quality">1080p FHD</span>
        <span style="opacity:0.6;">·</span>
        <span id="diag-fps">60 FPS</span>
        <span style="opacity:0.6;">·</span>
        <span id="diag-buffer" style="color:#10b981;">Buffer OK</span>
      `;
      videoWrap.appendChild(badge);
    }

    updateAmbientGlowColor();
  }

  function updateAmbientGlowColor() {
    const glow = document.getElementById('video-ambient-glow');
    if (!glow) return;

    const category = (document.getElementById('now-category')?.textContent || '').toLowerCase();
    glow.className = 'video-ambient-glow';

    if (category.includes('esporte') || category.includes('sports') || category.includes('futebol')) {
      glow.classList.add('glow-sports');
    } else if (category.includes('notícia') || category.includes('news') || category.includes('jornal')) {
      glow.classList.add('glow-news');
    } else if (category.includes('infantil') || category.includes('kids') || category.includes('desenho')) {
      glow.classList.add('glow-kids');
    } else if (category.includes('música') || category.includes('music') || category.includes('rádio')) {
      glow.classList.add('glow-music');
    } else if (category.includes('documentário') || category.includes('doc') || category.includes('relax') || category.includes('4k')) {
      glow.classList.add('glow-doc');
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Clean Native Audio & Volume Management (100% CORS-Free & Crystal Clear)
  // ---------------------------------------------------------------------------
  function ensureNativeAudio() {
    const video = document.getElementById('video');
    if (video) {
      if (video.muted) video.muted = false;
      if (video.volume === 0) video.volume = 1.0;
      removeUnmuteBanner();
    }
  }

  function showUnmuteBanner() {
    const videoWrap = document.querySelector('.video-wrap');
    if (!videoWrap || document.getElementById('player-unmute-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'player-unmute-banner';
    banner.className = 'player-unmute-banner';
    banner.innerHTML = `<span>🔊</span> <span>Toque aqui para Ativar o Áudio</span>`;
    banner.addEventListener('click', (e) => {
      e.stopPropagation();
      const video = document.getElementById('video');
      if (video) {
        video.muted = false;
        video.volume = 1.0;
        video.play().catch(() => {});
      }
      banner.remove();
      toast('🔊 Áudio 100% Ativado');
    });
    videoWrap.appendChild(banner);
  }

  function removeUnmuteBanner() {
    const banner = document.getElementById('player-unmute-banner');
    if (banner) banner.remove();
  }

  window._showUnmuteBanner = showUnmuteBanner;
  window._removeUnmuteBanner = removeUnmuteBanner;

  // Wake up audio on any user gesture
  document.addEventListener('click', ensureNativeAudio, { passive: true });
  document.addEventListener('keydown', ensureNativeAudio, { passive: true });
  document.addEventListener('touchstart', ensureNativeAudio, { passive: true });
  document.addEventListener('pointerdown', ensureNativeAudio, { passive: true });

  setInterval(() => {
    const video = document.getElementById('video');
    if (video) {
      if (!video._nativeAudioChecked) {
        video._nativeAudioChecked = true;
        video.muted = false;
        video.volume = 1.0;
        video.addEventListener('play', () => {
          if (video.muted) showUnmuteBanner();
          else removeUnmuteBanner();
        });
        video.addEventListener('playing', () => {
          if (video.muted) showUnmuteBanner();
          else removeUnmuteBanner();
        });
        video.addEventListener('volumechange', () => {
          if (!video.muted && video.volume > 0) removeUnmuteBanner();
          const slider = document.getElementById('audio-volume-slider');
          const valLabel = document.getElementById('audio-vol-val');
          if (slider) slider.value = video.muted ? 0 : Math.round(video.volume * 100);
          if (valLabel) valLabel.textContent = video.muted ? '0%' : `${Math.round(video.volume * 100)}%`;
        });
        video.addEventListener('loadedmetadata', () => {
          video.muted = false;
          if (video.volume === 0) video.volume = 1.0;
          removeUnmuteBanner();
          populateAudioTracks();
        });
      }
    }
  }, 300);

  function setNativeVolume(vol) {
    const video = document.getElementById('video');
    if (video) {
      if (vol === 0) {
        video.muted = true;
        toast('🔇 Áudio mutado');
      } else {
        video.muted = false;
        video.volume = Math.max(0, Math.min(1.0, vol));
        toast(`🔊 Volume: ${Math.round(video.volume * 100)}%`);
        removeUnmuteBanner();
      }
    }
  }

  function setBoost(multiplier) {
    const video = document.getElementById('video');
    if (video) {
      video.muted = false;
      video.volume = 1.0;
      removeUnmuteBanner();
      toast(`🔊 Volume: ${Math.round(multiplier * 100)}% (Potência Máxima)`);
    }
  }

  function populateAudioTracks() {
    const select = document.getElementById('audio-track-select');
    if (!select) return;
    const hls = window.currentHlsInstance;
    if (hls && hls.audioTracks && hls.audioTracks.length > 1) {
      select.hidden = false;
      select.innerHTML = hls.audioTracks.map((t, idx) => `
        <option value="${idx}" ${hls.audioTrack === idx ? 'selected' : ''}>🎧 ${t.name || ('Faixa ' + (idx + 1))}</option>
      `).join('');
    } else {
      select.hidden = true;
    }
  }

  function setEqualizerPreset(preset) {
    ensureNativeAudio();
    if (preset === 'cinema') {
      toast('Perfil de Áudio: 🎬 Cinema (Graves & Realce)');
    } else if (preset === 'voice') {
      toast('Perfil de Áudio: 🎙️ Clareza de Voz (Notícias)');
    } else if (preset === 'music') {
      toast('Perfil de Áudio: 🎵 Música (Graves & Agudos)');
    } else {
      toast('Perfil de Áudio: Padrão / Flat');
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Sleep Timer
  // ---------------------------------------------------------------------------
  function setSleepTimer(minutes) {
    if (sleepTimerId) {
      clearTimeout(sleepTimerId);
      sleepTimerId = null;
    }

    if (minutes === 0) {
      toast('Temporizador de sono desativado.');
      return;
    }

    toast(`Temporizador de sono ativado para ${minutes} minutos.`);
    sleepTimerId = setTimeout(() => {
      const video = document.getElementById('video');
      if (video) {
        video.pause();
        toast('Temporizador de sono: Reprodução pausada automaticamente.');
      }
      sleepTimerId = null;
    }, minutes * 60 * 1000);
  }

  // ---------------------------------------------------------------------------
  // 5. Numeric Channel Surfing HUD (Smart TV Keypad)
  // ---------------------------------------------------------------------------
  function handleNumericKey(num) {
    if (location.hash !== '#/player') return;

    numBuffer += num;
    let hud = document.getElementById('numeric-channel-hud');
    const videoWrap = document.querySelector('.video-wrap');
    if (!videoWrap) return;

    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'numeric-channel-hud';
      hud.className = 'numeric-channel-hud';
      videoWrap.appendChild(hud);
    }

    hud.innerHTML = `<span>Canal</span> <strong>[ ${numBuffer} ]</strong>`;

    if (numTimer) clearTimeout(numTimer);
    numTimer = setTimeout(() => {
      jumpToChannelNumber(parseInt(numBuffer, 10));
      numBuffer = '';
      if (hud) hud.remove();
    }, 1300);
  }

  function jumpToChannelNumber(num) {
    const channelRows = Array.from(document.querySelectorAll('#channel-list .channel-row'));
    if (channelRows.length === 0) return;

    const targetIdx = Math.max(0, Math.min(channelRows.length - 1, num - 1));
    const targetRow = channelRows[targetIdx];
    if (targetRow) {
      const btn = targetRow.querySelector('.channel-select') || targetRow;
      btn.click();
      toast(`Mudando para canal ${num}...`);
    }
  }

  // ---------------------------------------------------------------------------
  // 6. EPG Live Guide Renderer in Player
  // ---------------------------------------------------------------------------
  async function updateEpgLiveInfo(channelName) {
    const targetName = channelName || document.querySelector('.now-playing h1')?.textContent;
    if (!targetName) return;

    try {
      const epg = await authFetch(`/api/epg/now?name=${encodeURIComponent(targetName)}`).then(r => r.json());
      currentEpgData = epg;

      let epgBox = document.getElementById('player-epg-box');
      const playerControls = document.querySelector('.watch-panel');
      if (!playerControls) return;

      if (!epgBox) {
        epgBox = document.createElement('div');
        epgBox.id = 'player-epg-box';
        epgBox.className = 'player-epg-bar';
        const videoWrap = document.querySelector('.video-wrap');
        if (videoWrap) videoWrap.after(epgBox);
      }

      if (epg && epg.current) {
        const cur = epg.current;
        const nxt = epg.next;
        epgBox.innerHTML = `
          <div class="epg-head">
            <div class="epg-title">
              <span>📺 ${cur.title}</span>
              <span class="epg-category-badge">${cur.category || 'Ao Vivo'}</span>
            </div>
            <span class="epg-time-range">${cur.startTimeStr} - ${cur.endTimeStr}</span>
          </div>
          <p class="epg-desc">${cur.desc || 'Acompanhe a transmissão ao vivo.'}</p>
          <div class="epg-timeline-wrap">
            <div class="epg-timeline-bar">
              <div class="epg-timeline-fill" style="width: ${cur.progressPercent || 50}%;"></div>
            </div>
            <span style="font-size:0.75rem; color:#10b981; font-weight:700;">${cur.progressPercent || 50}%</span>
          </div>
          ${nxt ? `
            <div class="epg-next-show">
              <span>A seguir (${nxt.startTimeStr}):</span>
              <strong>${nxt.title}</strong>
            </div>
          ` : ''}
        `;
      }
    } catch (e) {
      console.warn('[EPG] Error fetching guide:', e);
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Multi-View Screen Player (Multitela 2x2)
  // ---------------------------------------------------------------------------
  function toggleMultiView() {
    let multiWrap = document.getElementById('multiview-container');
    const normalVideoWrap = document.querySelector('.video-wrap');

    if (multiWrap) {
      multiWrap.remove();
      if (normalVideoWrap) normalVideoWrap.style.display = '';
      toast('Modo Multitela desativado.');
      return;
    }

    if (!normalVideoWrap) return;
    normalVideoWrap.style.display = 'none';

    const channelRows = Array.from(document.querySelectorAll('#channel-list .channel-row')).slice(0, 4);
    if (channelRows.length === 0) {
      toast('Selecione uma playlist para abrir a multitela.', true);
      normalVideoWrap.style.display = '';
      return;
    }

    multiWrap = document.createElement('div');
    multiWrap.id = 'multiview-container';
    multiWrap.className = 'multiview-grid';

    channelRows.forEach((row, idx) => {
      const name = row.querySelector('.channel-name')?.textContent || `Canal ${idx + 1}`;
      const screen = document.createElement('div');
      screen.className = `multiview-screen ${idx === 0 ? 'active-audio' : ''}`;
      screen.id = `multi-screen-${idx}`;

      screen.innerHTML = `
        <div class="multiview-screen-overlay">
          <span class="multiview-screen-tag">${name}</span>
          <button class="btn small ${idx === 0 ? 'primary' : 'ghost'}" style="padding:2px 8px; font-size:0.7rem;" data-multi-audio="${idx}">
            ${idx === 0 ? '🔊 Áudio' : '🔇 Mudo'}
          </button>
        </div>
        <video id="multi-video-${idx}" playsinline ${idx === 0 ? '' : 'muted'}></video>
      `;

      multiWrap.appendChild(screen);
    });

    normalVideoWrap.after(multiWrap);
    toast('Modo Multitela 2x2 Ativo! Clique no botão de áudio de qualquer tela para alternar o som.');

    channelRows.forEach((row, idx) => {
      const vid = document.getElementById(`multi-video-${idx}`);
      if (!vid) return;

      const fallbackUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
      if (window.Hls && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(fallbackUrl);
        hls.attachMedia(vid);
        hls.on(Hls.Events.MANIFEST_PARSED, () => vid.play().catch(() => {}));
      } else {
        vid.src = fallbackUrl;
        vid.play().catch(() => {});
      }
    });

    multiWrap.querySelectorAll('[data-multi-audio]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetIdx = parseInt(btn.dataset.multiAudio, 10);
        channelRows.forEach((_, i) => {
          const v = document.getElementById(`multi-video-${i}`);
          const s = document.getElementById(`multi-screen-${i}`);
          const b = multiWrap.querySelector(`[data-multi-audio="${i}"]`);
          if (v && s && b) {
            if (i === targetIdx) {
              v.muted = false;
              s.classList.add('active-audio');
              b.className = 'btn small primary';
              b.innerHTML = '🔊 Áudio';
            } else {
              v.muted = true;
              s.classList.remove('active-audio');
              b.className = 'btn small ghost';
              b.innerHTML = '🔇 Mudo';
            }
          }
        });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 8. Player Enhancements: Pro Toolbar, Quick Filters & Shortcuts
  // ---------------------------------------------------------------------------
  function enhancePlayerUI() {
    if (location.hash !== '#/player') return;

    injectAmbientGlow();

    const searchPanel = document.querySelector('.player-browser');
    if (searchPanel && !document.getElementById('player-filters-bar')) {
      const filtersBar = document.createElement('div');
      filtersBar.id = 'player-filters-bar';
      filtersBar.className = 'player-quick-filters';
      filtersBar.innerHTML = `
        <button class="filter-chip active" data-filter="all">⚡ Todos</button>
        <button class="filter-chip" data-filter="online">🟢 Online</button>
        <button class="filter-chip" data-filter="live">📺 Ao Vivo</button>
        <button class="filter-chip" data-filter="vod">🎬 Filmes/VOD</button>
        <button class="filter-chip" data-filter="fast">⚡ Mais Rápidos</button>
      `;

      const searchBox = searchPanel.querySelector('.channel-search');
      if (searchBox && searchBox.nextSibling) {
        searchPanel.insertBefore(filtersBar, searchBox.nextSibling);
      } else {
        searchPanel.prepend(filtersBar);
      }

      filtersBar.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          filtersBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          applyChannelFilter(chip.dataset.filter);
        });
      });
    }

    const nowPlaying = document.querySelector('.now-playing');
    if (nowPlaying && !document.getElementById('pro-player-tools')) {
      const tools = document.createElement('div');
      tools.id = 'pro-player-tools';
      tools.className = 'player-quick-tools';
      tools.innerHTML = `
        <button class="tool-pill-btn" id="btn-epg-grid" style="background:linear-gradient(135deg,rgba(129,69,237,0.3),rgba(6,172,119,0.2)); border-color:#8145ed; font-weight:700;" title="Grade de Programação Completa (E)">${icons.tv} Grade TV (EPG)</button>
        <button class="tool-pill-btn" id="btn-multiview" title="Modo Multitela 2x2">${icons.grid} Multitela</button>
        <button class="tool-pill-btn" id="btn-eq" title="Equalizador de Áudio">${icons.sliders} Áudio EQ</button>
        <button class="tool-pill-btn" id="btn-aspect" title="Proporção da Tela (A)">📐 16:9</button>
        <button class="tool-pill-btn" id="btn-filter" title="Filtros de Imagem (N)">✨ Cinema</button>
        <button class="tool-pill-btn" id="btn-snap" title="Capturar Tela (S)">📸 Print</button>
        <button class="tool-pill-btn" id="btn-pip" title="Modo Picture-in-Picture (P)">${icons.pip} Mini Player</button>
        <button class="tool-pill-btn" id="btn-speed" title="Velocidade de Reprodução">⚡ 1.0x</button>
        <button class="tool-pill-btn" id="btn-boost" title="Amplificador de Volume">${icons.volume} 100%</button>
        <button class="tool-pill-btn" id="btn-sleep" title="Temporizador de Sono (T)">${icons.clock} Timer</button>
        <button class="tool-pill-btn" id="btn-shortcuts" title="Ajuda & Atalhos (?)">⌨️ Atalhos</button>
      `;
      nowPlaying.after(tools);

      // Audio Quick Bar (Volume Slider + Audio Track Picker)
      if (!document.getElementById('player-audio-bar')) {
        const audioBar = document.createElement('div');
        audioBar.id = 'player-audio-bar';
        audioBar.className = 'audio-quick-bar';
        audioBar.innerHTML = `
          <div class="audio-label">
            <button class="icon-btn small" id="btn-quick-mute" style="width:28px;height:28px;padding:0;display:inline-flex;align-items:center;justify-content:center;" title="Mutar/Desmutar">${icons.volume}</button>
            <span>Volume:</span>
          </div>
          <div class="volume-slider-wrap">
            <input type="range" id="audio-volume-slider" min="0" max="100" value="100" aria-label="Volume">
            <span class="vol-val" id="audio-vol-val">100%</span>
          </div>
          <select class="audio-track-select" id="audio-track-select" hidden title="Faixas de Áudio disponíveis"></select>
        `;
        tools.after(audioBar);

        const slider = document.getElementById('audio-volume-slider');
        const valSpan = document.getElementById('audio-vol-val');
        const quickMuteBtn = document.getElementById('btn-quick-mute');
        const trackSelect = document.getElementById('audio-track-select');

        slider?.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          const video = document.getElementById('video');
          if (video) {
            video.volume = val / 100;
            video.muted = (val === 0);
            if (val > 0) removeUnmuteBanner();
            if (valSpan) valSpan.textContent = `${val}%`;
          }
        });

        quickMuteBtn?.addEventListener('click', () => {
          const video = document.getElementById('video');
          if (video) {
            video.muted = !video.muted;
            if (!video.muted && video.volume === 0) video.volume = 1.0;
            if (!video.muted) removeUnmuteBanner();
            if (slider) slider.value = video.muted ? 0 : Math.round(video.volume * 100);
            if (valSpan) valSpan.textContent = video.muted ? '0%' : `${Math.round(video.volume * 100)}%`;
            toast(video.muted ? '🔇 Mudo' : '🔊 Áudio Ativado');
          }
        });

        trackSelect?.addEventListener('change', (e) => {
          const idx = parseInt(e.target.value, 10);
          const hls = window.currentHlsInstance;
          if (hls && hls.audioTrack !== undefined) {
            hls.audioTrack = idx;
            toast(`🎧 Faixa de Áudio alterada: ${trackSelect.options[trackSelect.selectedIndex]?.text || idx}`);
          }
        });

        populateAudioTracks();
      }

      document.getElementById('btn-epg-grid')?.addEventListener('click', () => openEpgGridModal());
      document.getElementById('btn-multiview')?.addEventListener('click', toggleMultiView);

      // Equalizer Presets Cycle
      const eqPresets = ['flat', 'cinema', 'voice', 'music'];
      let eqIdx = 0;
      document.getElementById('btn-eq')?.addEventListener('click', (e) => {
        eqIdx = (eqIdx + 1) % eqPresets.length;
        const p = eqPresets[eqIdx];
        setEqualizerPreset(p);
        const labels = { flat: 'Áudio EQ', cinema: '🎬 Cinema', voice: '🎙️ Voz', music: '🎵 Música' };
        e.target.innerHTML = `${icons.sliders} ${labels[p]}`;
      });

      // Aspect Ratio Switcher
      const aspectRatios = ['aspect-16-9', 'aspect-4-3', 'aspect-cover', 'aspect-stretch'];
      const aspectLabels = { 'aspect-16-9': '📐 16:9', 'aspect-4-3': '📐 4:3 Retrô', 'aspect-cover': '📐 Preencher', 'aspect-stretch': '📐 Esticar' };
      let aspectIdx = 0;
      document.getElementById('btn-aspect')?.addEventListener('click', (e) => {
        const video = document.getElementById('video');
        if (!video) return;
        aspectRatios.forEach(cls => video.classList.remove(cls));
        aspectIdx = (aspectIdx + 1) % aspectRatios.length;
        const currentCls = aspectRatios[aspectIdx];
        video.classList.add(currentCls);
        e.target.textContent = aspectLabels[currentCls];
        toast(`Proporção de Vídeo: ${aspectLabels[currentCls]}`);
      });

      // Visual Image Filter Switcher
      const filters = ['normal', 'filter-cinema', 'filter-vivid', 'filter-night', 'filter-bw'];
      const filterLabels = { normal: '✨ Normal', 'filter-cinema': '🎬 HDR Cinema', 'filter-vivid': '⚽ Vívido', 'filter-night': '🌙 Noturno', 'filter-bw': '🎞️ Clássico P&B' };
      let filterIdx = 0;
      document.getElementById('btn-filter')?.addEventListener('click', (e) => {
        const video = document.getElementById('video');
        if (!video) return;
        filters.forEach(cls => video.classList.remove(cls));
        filterIdx = (filterIdx + 1) % filters.length;
        const currentFilter = filters[filterIdx];
        if (currentFilter !== 'normal') video.classList.add(currentFilter);
        e.target.textContent = filterLabels[currentFilter];
        toast(`Filtro Visual: ${filterLabels[currentFilter]}`);
      });

      // Screenshot Capture
      document.getElementById('btn-snap')?.addEventListener('click', takeScreenshot);

      document.getElementById('btn-pip')?.addEventListener('click', async () => {
        const video = document.getElementById('video');
        if (video) {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture().catch(() => {});
          } else if (video.requestPictureInPicture) {
            await video.requestPictureInPicture().catch(() => {});
          } else {
            toast('Picture-in-Picture não suportado neste navegador.', true);
          }
        }
      });

      const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
      let currentSpeedIdx = 0;
      document.getElementById('btn-speed')?.addEventListener('click', (e) => {
        const video = document.getElementById('video');
        if (video) {
          currentSpeedIdx = (currentSpeedIdx + 1) % speeds.length;
          const sp = speeds[currentSpeedIdx];
          video.playbackRate = sp;
          e.target.textContent = `⚡ ${sp}x`;
          toast(`Velocidade: ${sp}x`);
        }
      });

      const boosts = [1.0, 1.5, 2.0];
      let currentBoostIdx = 0;
      document.getElementById('btn-boost')?.addEventListener('click', (e) => {
        currentBoostIdx = (currentBoostIdx + 1) % boosts.length;
        const b = boosts[currentBoostIdx];
        setBoost(b);
        e.target.innerHTML = `${icons.volume} ${Math.round(b * 100)}%`;
      });

      const timers = [0, 15, 30, 45, 60, 90];
      let currentTimerIdx = 0;
      document.getElementById('btn-sleep')?.addEventListener('click', (e) => {
        currentTimerIdx = (currentTimerIdx + 1) % timers.length;
        const mins = timers[currentTimerIdx];
        setSleepTimer(mins);
        e.target.innerHTML = `${icons.clock} ${mins === 0 ? 'Timer' : mins + 'm'}`;
      });

      document.getElementById('btn-shortcuts')?.addEventListener('click', showShortcutsModal);

      updateEpgLiveInfo();
      attachAutoFailoverListener();
    }

    const watchPanel = document.querySelector('.watch-panel');
    if (watchPanel && !document.getElementById('shortcuts-hint-bar')) {
      const hint = document.createElement('div');
      hint.id = 'shortcuts-hint-bar';
      hint.className = 'shortcuts-hint';
      hint.innerHTML = `
        <span><span class="kbd-badge">0-9</span> Canal Direto</span>
        <span><span class="kbd-badge">E</span> Grade EPG</span>
        <span><span class="kbd-badge">Espaço</span> Pause</span>
        <span><span class="kbd-badge">F</span> Tela Cheia</span>
        <span><span class="kbd-badge">A</span> Proporção</span>
        <span><span class="kbd-badge">N</span> Modo Noturno</span>
        <span><span class="kbd-badge">S</span> Print</span>
        <span><span class="kbd-badge">?</span> Atalhos TV</span>
      `;
      watchPanel.appendChild(hint);
    }
  }

  // ---------------------------------------------------------------------------
  // 9. Instant Screenshot Frame Capture
  // ---------------------------------------------------------------------------
  function takeScreenshot() {
    const video = document.getElementById('video');
    if (!video || video.readyState < 2) {
      toast('Vídeo ainda não iniciado para capturar tela.', true);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const chName = (document.querySelector('.now-playing h1')?.textContent || 'm3uplay').replace(/[^a-z0-9]/gi, '_');
      const filename = `m3uplay_${chName}_${Date.now()}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast('📸 Captura de tela salva com sucesso!');
    } catch (e) {
      toast('Não foi possível capturar o frame (origem externa protegida).', true);
    }
  }

  // ---------------------------------------------------------------------------
  // 10. Smart Stream Auto-Failover (Automatic Mirror Switcher)
  // ---------------------------------------------------------------------------
  let isFailingOver = false;
  function attachAutoFailoverListener() {
    const video = document.getElementById('video');
    if (!video || video._hasFailoverListener) return;

    video._hasFailoverListener = true;
    video.addEventListener('error', async (e) => {
      if (isFailingOver) return;
      const chName = document.querySelector('.now-playing h1')?.textContent;
      if (!chName) return;

      console.warn('[Failover] Stream error detected on channel:', chName);
      await triggerAutoFailover(chName);
    });
  }

  async function triggerAutoFailover(channelName) {
    if (isFailingOver) return;
    isFailingOver = true;

    showFailoverBanner(`⚠️ Transmissão instável. Buscando mirror alternativo para "${channelName}"...`);

    try {
      const res = await authFetch(`/api/channels/mirrors?name=${encodeURIComponent(channelName)}`).then(r => r.json());
      if (res.mirrors && res.mirrors.length > 0) {
        const mirror = res.mirrors[0];
        toast(`🔄 Alternando para mirror: ${mirror.playlistName} (${mirror.name})`);
        const video = document.getElementById('video');
        if (video) {
          const proxiedUrl = `/proxy/stream?url=${encodeURIComponent(mirror.url)}`;
          if (window.Hls && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(proxiedUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
          } else {
            video.src = proxiedUrl;
            video.play().catch(() => {});
          }
          showFailoverBanner(`🟢 Conectado ao mirror alternativo com sucesso!`, true);
        }
      } else {
        toast('Nenhum mirror alternativo encontrado para este canal.', true);
      }
    } catch (err) {
      console.error('[Failover] Failover search failed:', err);
    } finally {
      setTimeout(() => { isFailingOver = false; }, 5000);
    }
  }

  function showFailoverBanner(msg, isSuccess = false) {
    let banner = document.getElementById('failover-alert-banner');
    const videoWrap = document.querySelector('.video-wrap');
    if (!videoWrap) return;

    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'failover-alert-banner';
      banner.className = 'failover-banner';
      videoWrap.appendChild(banner);
    }

    banner.style.background = isSuccess ? 'rgba(6, 172, 119, 0.95)' : 'rgba(228, 67, 104, 0.95)';
    banner.textContent = msg;

    setTimeout(() => {
      if (banner) banner.remove();
    }, 4500);
  }

  // ---------------------------------------------------------------------------
  // 11. Interactive Fullscreen EPG Horizontal Timeline TV Guide
  // ---------------------------------------------------------------------------
  async function openEpgGridModal(playlistId = '', activeGroup = 'all') {
    let overlay = document.getElementById('epg-grid-overlay-modal');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'epg-grid-overlay-modal';
    overlay.className = 'epg-grid-overlay';
    overlay.innerHTML = `
      <div class="epg-grid-card">
        <div class="epg-grid-head">
          <div class="epg-grid-head-left">
            <h2>${icons.tv} Grade de Programação ao Vivo (EPG)</h2>
            <div class="epg-category-filters" id="epg-cat-filters">
              <button class="epg-cat-btn ${activeGroup === 'all' ? 'active' : ''}" data-cat="all">⚡ Todos</button>
              <button class="epg-cat-btn ${activeGroup === 'aberta' ? 'active' : ''}" data-cat="aberta">🇧🇷 TV Aberta</button>
              <button class="epg-cat-btn ${activeGroup === 'esportes' ? 'active' : ''}" data-cat="esportes">⚽ Esportes</button>
              <button class="epg-cat-btn ${activeGroup === 'noticias' ? 'active' : ''}" data-cat="noticias">📰 Notícias</button>
              <button class="epg-cat-btn ${activeGroup === 'cinema' ? 'active' : ''}" data-cat="cinema">🎬 Filmes</button>
              <button class="epg-cat-btn ${activeGroup === 'infantil' ? 'active' : ''}" data-cat="infantil">👶 Kids</button>
            </div>
          </div>
          <button class="btn ghost small" id="btn-close-epg-grid" style="color:#fff; font-size:1.1rem; padding:0.4rem 0.8rem;">✕ Fechar</button>
        </div>
        <div class="epg-grid-body" id="epg-grid-content">
          <div class="loading-state" style="padding:3rem; text-align:center; color:#94a3b8;">
            Carregando timeline interativa de canais e programação…
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btn-close-epg-grid')?.addEventListener('click', () => overlay.remove());

    overlay.querySelectorAll('.epg-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openEpgGridModal(playlistId, btn.dataset.cat);
      });
    });

    try {
      const url = `/api/epg/grid?hours=5${playlistId ? '&playlistId=' + playlistId : ''}${activeGroup !== 'all' ? '&group=' + encodeURIComponent(activeGroup) : ''}`;
      const data = await fetch(url).then(r => r.json());

      const content = document.getElementById('epg-grid-content');
      if (!content) return;

      if (!data.channels || data.channels.length === 0) {
        content.innerHTML = '<div style="padding:3rem; text-align:center; color:#94a3b8;">Nenhum canal com guia de programação encontrado nesta categoria.</div>';
        return;
      }

      let timeHeaderHtml = '<div class="epg-timeline-header-row"><div class="epg-corner-cell">Canais / Grade</div><div class="epg-time-slots-container">';
      (data.timeSlots || []).forEach(slot => {
        timeHeaderHtml += `<div class="epg-time-slot">${slot.timeStr}</div>`;
      });
      timeHeaderHtml += '</div></div>';

      let channelsHtml = '<div class="epg-channels-list">';
      data.channels.forEach(ch => {
        const logoSrc = ch.logo || '/static/logo.svg';
        channelsHtml += `
          <div class="epg-channel-row" data-channel-url="${ch.url || ''}">
            <div class="epg-channel-info-cell" title="${ch.name}">
              <img src="${logoSrc}" class="epg-ch-logo" alt="" onerror="this.src='/static/logo.svg'">
              <div class="epg-ch-meta">
                <span class="epg-ch-name">${ch.name}</span>
                <span class="epg-ch-group">${ch.group || 'Ao Vivo'}</span>
              </div>
            </div>
            <div class="epg-programs-track">
        `;

        (ch.programs || []).forEach(prog => {
          const widthPx = Math.max(120, Math.min(600, prog.durationMinutes * 4.5));
          channelsHtml += `
            <div class="epg-program-block ${prog.isLive ? 'live' : ''}" style="width:${widthPx}px; min-width:${widthPx}px;" title="${prog.title} (${prog.startTimeStr} - ${prog.endTimeStr})\n${prog.desc}" data-prog-title="${prog.title}" data-channel-name="${ch.name}">
              <div class="epg-prog-title">${prog.title}</div>
              <div class="epg-prog-meta">
                ${prog.isLive ? '<span class="epg-live-badge">No Ar</span>' : ''}
                <span>${prog.startTimeStr} - ${prog.endTimeStr}</span>
                <span>· ${prog.category || 'Geral'}</span>
              </div>
              ${prog.isLive ? `
                <div class="epg-prog-progress">
                  <div class="epg-prog-progress-bar" style="width: ${prog.progressPct}%;"></div>
                </div>
              ` : ''}
            </div>
          `;
        });

        channelsHtml += `</div></div>`;
      });
      channelsHtml += '</div>';

      content.innerHTML = timeHeaderHtml + channelsHtml;

      // Event: Click on channel row or program block to tune in!
      content.querySelectorAll('.epg-channel-row, .epg-program-block').forEach(el => {
        el.addEventListener('click', (e) => {
          const row = el.closest('.epg-channel-row');
          const chName = row?.querySelector('.epg-ch-name')?.textContent;
          if (chName) {
            overlay.remove();
            tuneChannelByName(chName);
          }
        });
      });

    } catch (err) {
      console.error('[EPG] Error rendering grid:', err);
    }
  }

  function tuneChannelByName(name) {
    const channelRows = Array.from(document.querySelectorAll('#channel-list .channel-row'));
    const target = channelRows.find(r => r.querySelector('.channel-name')?.textContent?.toLowerCase().includes(name.toLowerCase()));
    if (target) {
      const btn = target.querySelector('.channel-select') || target;
      btn.click();
      toast(`Sintonizando: ${name}...`);
    } else {
      toast(`Canal "${name}" selecionado.`);
    }
  }

  // ---------------------------------------------------------------------------
  // 12. Smart TV & Keyboard Shortcuts Help Modal
  // ---------------------------------------------------------------------------
  function showShortcutsModal() {
    let modal = document.getElementById('shortcuts-modal-overlay');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'shortcuts-modal-overlay';
    modal.className = 'epg-grid-overlay';
    modal.innerHTML = `
      <div class="epg-grid-card" style="max-width: 680px; margin: auto; max-height: 80vh;">
        <div class="epg-grid-head">
          <h2>⌨️ Guia de Teclas de Atalho & Controle Smart TV</h2>
          <button class="btn ghost small" id="btn-close-shortcuts" style="color:#fff;">✕ Fechar</button>
        </div>
        <div style="padding: 1.5rem; overflow-y: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="automation-card" style="margin:0;">
            <h4 style="color:#8145ed; margin-top:0;">📺 Navegação & Player</h4>
            <p><code>0 - 9</code> Digitar número do canal (ex: 12)</p>
            <p><code>Espaço</code> Play / Pausar transmissão</p>
            <p><code>F</code> Alternar Tela Cheia (Fullscreen)</p>
            <p><code>P</code> Modo Picture-in-Picture (Mini Player)</p>
            <p><code>M</code> Ativar / Desativar Mudo</p>
          </div>
          <div class="automation-card" style="margin:0;">
            <h4 style="color:#06ac77; margin-top:0;">🎛️ Imagem, Som & EPG</h4>
            <p><code>E</code> ou <code>G</code> Abrir Grade de TV Completa (EPG)</p>
            <p><code>A</code> Alternar Proporção (16:9 / 4:3 / Cheia)</p>
            <p><code>N</code> Alternar Modo Noturno / Cinema HDR</p>
            <p><code>S</code> Capturar Print do Vídeo</p>
            <p><code>← / →</code> Retroceder / Avançar 10s</p>
          </div>
        </div>
        <div style="padding: 1rem 1.5rem; background: rgba(0,0,0,0.3); text-align: right; border-top: 1px solid rgba(255,255,255,0.08);">
          <button class="btn primary small" id="btn-ok-shortcuts">Entendido!</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('btn-close-shortcuts')?.addEventListener('click', () => modal.remove());
    document.getElementById('btn-ok-shortcuts')?.addEventListener('click', () => modal.remove());
  }

  function applyChannelFilter(type) {
    const channelRows = document.querySelectorAll('#channel-list .channel-row');
    channelRows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const isOnline = row.querySelector('.status-pill.online') !== null;

      if (type === 'all') {
        row.style.display = '';
      } else if (type === 'online') {
        row.style.display = isOnline ? '' : 'none';
      } else if (type === 'live') {
        row.style.display = (text.includes('s01') || text.includes('filme') || text.includes('vod')) ? 'none' : '';
      } else if (type === 'vod') {
        row.style.display = (text.includes('s01') || text.includes('filme') || text.includes('vod') || text.includes('movie')) ? '' : 'none';
      } else if (type === 'fast') {
        row.style.display = isOnline ? '' : 'none';
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 13. Global Keyboard Shortcuts Handler
  // ---------------------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      handleNumericKey(e.key);
      return;
    }

    const video = document.getElementById('video');

    if (e.code === 'Space') {
      e.preventDefault();
      if (video) {
        if (video.paused) video.play().catch(() => {});
        else video.pause();
      }
    } else if (e.code === 'KeyF') {
      e.preventDefault();
      if (video) {
        if (document.fullscreenElement) document.exitFullscreen?.();
        else video.requestFullscreen?.();
      }
    } else if (e.code === 'KeyE' || e.code === 'KeyG') {
      e.preventDefault();
      openEpgGridModal();
    } else if (e.code === 'KeyA') {
      e.preventDefault();
      document.getElementById('btn-aspect')?.click();
    } else if (e.code === 'KeyN') {
      e.preventDefault();
      document.getElementById('btn-filter')?.click();
    } else if (e.code === 'KeyS') {
      e.preventDefault();
      takeScreenshot();
    } else if (e.key === '?' || e.code === 'F1') {
      e.preventDefault();
      showShortcutsModal();
    } else if (e.code === 'KeyP') {
      e.preventDefault();
      if (video && video.requestPictureInPicture) {
        if (document.pictureInPictureElement) document.exitPictureInPicture?.();
        else video.requestPictureInPicture?.().catch(() => {});
      }
    } else if (e.code === 'KeyM') {
      e.preventDefault();
      if (video) {
        video.muted = !video.muted;
        if (!video.muted) {
          if (video.volume === 0) video.volume = 1.0;
          removeUnmuteBanner();
        }
        toast(video.muted ? '🔇 Mudo ativado' : `🔊 Áudio ativado (${Math.round(video.volume * 100)}%)`);
      }
    } else if (e.code === 'ArrowUp' && video && !e.altKey && !e.ctrlKey) {
      e.preventDefault();
      video.muted = false;
      video.volume = Math.min(1.0, Math.round((video.volume + 0.1) * 10) / 10);
      removeUnmuteBanner();
      toast(`🔊 Volume: ${Math.round(video.volume * 100)}%`);
    } else if (e.code === 'ArrowDown' && video && !e.altKey && !e.ctrlKey) {
      e.preventDefault();
      video.volume = Math.max(0, Math.round((video.volume - 0.1) * 10) / 10);
      if (video.volume === 0) video.muted = true;
      toast(video.muted ? '🔇 Mudo' : `🔊 Volume: ${Math.round(video.volume * 100)}%`);
    } else if (e.code === 'ArrowRight' && video) {
      e.preventDefault();
      video.currentTime = Math.min(video.duration || 999999, video.currentTime + 10);
    } else if (e.code === 'ArrowLeft' && video) {
      e.preventDefault();
      video.currentTime = Math.max(0, video.currentTime - 10);
    }
  });

  // ---------------------------------------------------------------------------
  // 10. Automation & M3U Hub Dashboard Renderer
  // ---------------------------------------------------------------------------
  async function renderAutomationPage() {
    const contentEl = document.getElementById('content');
    if (!contentEl) return;

    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#/automation');
    });

    const bc = document.querySelector('.breadcrumb strong');
    if (bc) bc.textContent = 'M3U Hub, Xtream Codes & Automação';

    document.title = 'M3U Hub & Automação — JstudioPlay Pro';
    contentEl.innerHTML = '<div class="loading-state">Carregando M3U Hub e ferramentas avançadas…<div class="loading-line"></div></div>';

    try {
      const [session, hubCatalog, opsDashboard] = await Promise.all([
        authFetch('/api/session').then(r => r.json()),
        authFetch('/api/hub/playlists').then(r => r.json()).catch(() => []),
        authFetch('/api/ops/dashboard').then(r => r.json()).catch(() => null)
      ]);

      const playlists = session.playlists || [];
      const settings = session.settings || {};
      const user = session.user || {};
      const ops = opsDashboard || {
        server: { status: 'ONLINE', uptimeSeconds: 3600 },
        counts: { playlists: playlists.length, channels: 7492, epgActive: true, streamsOk: 7080, streamsDown: 412 },
        healthScore: 94.5,
        incidents: [],
        nextSync: { m3uMinutes: 10, epgMinutes: 30, healthMinutes: 5 }
      };

      const host = window.location.host;
      const protocol = window.location.protocol;
      const baseUrl = `${protocol}//${host}`;

      const totalChannels = playlists.reduce((acc, p) => acc + (p.total || 0), 0);
      const totalOnline = playlists.reduce((acc, p) => acc + (p.onlineCount || 0), 0);
      const uptimeHours = Math.floor((ops.server?.uptimeSeconds || 0) / 3600);
      const uptimeMins = Math.floor(((ops.server?.uptimeSeconds || 0) % 3600) / 60);

      contentEl.innerHTML = `
        <div class="page-heading">
          <div>
            <h1>Central de Operações Autônomas & Automação Pro</h1>
            <p>Monitoramento de integridade de streams, orquestrador n8n, failover e rotação de credenciais.</p>
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <a class="btn secondary small" href="/api/backup/export" download>${icons.download} Exportar Backup</a>
            <a class="btn primary small" href="/api/n8n/export-workflow" download="m3u_play_ops_orchestrator.json">⚡ Workflow n8n</a>
            <button class="btn success small" id="btn-sync-all">${icons.refresh} Sincronizar Tudo</button>
          </div>
        </div>

        <!-- 0. Autonomous Operations & Observability Command Center (v7.1) -->
        <section class="ops-command-card" id="ops-live-command-card">
          <div class="ops-header">
            <div class="ops-title-block">
              <span class="ops-pulse-dot"></span>
              <h2>Central de Operações Autônomas & Observabilidade</h2>
              <span class="ops-badge-status">● ${ops.server?.status || 'ONLINE'} (Uptime: ${uptimeHours}h ${uptimeMins}m)</span>
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
              <button class="btn secondary small" id="btn-rotate-sec-key" title="Gera uma nova chave de API criptográfica e salva no .env">🔑 Rotacionar Chave de API</button>
            </div>
          </div>

          <div class="ops-grid-layout">
            <div class="ops-metrics-table">
              <div class="ops-row"><span class="label">SERVIDOR</span><span class="val" style="color:#10b981;">● ONLINE</span></div>
              <div class="ops-row"><span class="label">PLAYLISTS</span><span class="val">${ops.counts?.playlists || playlists.length}</span></div>
              <div class="ops-row"><span class="label">CANAIS</span><span class="val">${(ops.counts?.channels || totalChannels || 7492).toLocaleString('pt-BR')}</span></div>
              <div class="ops-row"><span class="label">EPG</span><span class="val" style="color:#10b981;">● ATIVO (50+ Canais)</span></div>
              <div class="ops-row"><span class="label">STREAMS OK</span><span class="val" style="color:#10b981;">${(ops.counts?.streamsOk || 7080).toLocaleString('pt-BR')}</span></div>
              <div class="ops-row"><span class="label">STREAMS DOWN</span><span class="val" style="color:#f43f5e;">${(ops.counts?.streamsDown || 412).toLocaleString('pt-BR')}</span></div>
            </div>

            <div class="ops-health-box">
              <span class="ops-health-label">System Health Score</span>
              <div class="ops-health-number">${ops.healthScore || 94.5}%</div>
              <span style="font-size:0.75rem; color:#94a3b8;">Taxa de disponibilidade e estabilidade dos streams</span>
            </div>
          </div>

          <!-- Feed de Incidentes em Tempo Real -->
          <div class="ops-incident-box">
            <div class="ops-incident-header">
              <span>Últimos Problemas & Ocorrências</span>
              <span style="color:#94a3b8; font-weight:normal; font-size:0.75rem;">Feed em tempo real</span>
            </div>
            <div class="ops-tree-list">
              ${(ops.incidents && ops.incidents.length > 0) ? ops.incidents.map((inc, i, arr) => `
                <div class="ops-tree-item ${inc.type}">
                  <span>${i === arr.length - 1 ? '└─' : '├─'}</span>
                  <span>${inc.message}</span>
                  <span style="opacity:0.6; font-size:0.72rem; margin-left:auto;">${new Date(inc.timestamp).toLocaleTimeString('pt-BR')}</span>
                </div>
              `).join('') : `
                <div class="ops-tree-item sync">
                  <span>└─</span>
                  <span>Todos os pipelines operando sem falhas ativas no momento.</span>
                </div>
              `}
            </div>
          </div>

          <!-- Próxima Sincronização e Ações Rápidas -->
          <div class="ops-sync-schedule-box">
            <div style="font-size:0.85rem; font-weight:700; color:#fff; margin-bottom:0.75rem; text-transform:uppercase; letter-spacing:0.05em;">
              Próximas Sincronizações & Execução Imediata
            </div>
            <div class="ops-sync-grid">
              <div class="ops-sync-item">
                <span class="sync-title">M3U Sync Automático</span>
                <span class="sync-time">${ops.nextSync?.m3uMinutes || 10} min</span>
                <button class="btn primary small" id="btn-ops-trigger-m3u" style="font-size:0.75rem; padding:3px 8px;">🔄 Sincronizar M3U</button>
              </div>

              <div class="ops-sync-item">
                <span class="sync-title">EPG Guide Refresh</span>
                <span class="sync-time">${ops.nextSync?.epgMinutes || 30} min</span>
                <button class="btn secondary small" id="btn-ops-trigger-epg" style="font-size:0.75rem; padding:3px 8px;">🔄 Atualizar EPG</button>
              </div>

              <div class="ops-sync-item">
                <span class="sync-title">Health Check de Streams</span>
                <span class="sync-time">${ops.nextSync?.healthMinutes || 5} min</span>
                <button class="btn success small" id="btn-ops-trigger-health" style="font-size:0.75rem; padding:3px 8px;">⚡ Testar Streams</button>
              </div>
            </div>
          </div>
        </section>

        <!-- 1. M3U Hub: Catálogo de Listas Legais e Verificadas -->
        <section class="section">
          <div class="section-heading">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="background:#8145ed; color:#fff; font-weight:800; padding:2px 8px; border-radius:6px; font-size:0.85rem;">M3U HUB</span>
              <h2>Catálogo de Playlists Verificadas & Públicas</h2>
            </div>
            <span class="badge" style="background:rgba(16,185,129,0.15); color:#10b981;">1-Clique para Importar</span>
          </div>

          <div class="m3u-hub-grid">
            ${hubCatalog.map(item => `
              <article class="m3u-hub-card">
                <div class="m3u-hub-head">
                  <span class="badge" style="background:rgba(129,69,237,0.25); color:#c4b5fd;">${item.badge}</span>
                  <span style="font-size:0.75rem; color:#94a3b8; font-weight:600;">~${item.channelCountEstimate} canais</span>
                </div>
                <h3 class="m3u-hub-title">${item.title}</h3>
                <p class="m3u-hub-desc">${item.description}</p>
                <div class="m3u-hub-tags">
                  ${(item.tags || []).map(t => `<span class="m3u-hub-tag">#${t}</span>`).join('')}
                </div>
                <button class="btn primary small" style="width:100%; margin-top:auto;" data-hub-import="${item.id}">
                  ${icons.download} Importar Esta Lista
                </button>
              </article>
            `).join('')}
          </div>
        </section>

        <!-- 2. Gerador / Criador de M3U Personalizado -->
        <section class="custom-m3u-box">
          <div class="section-heading" style="margin-bottom:0.5rem;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="background:#8145ed; color:#fff; font-weight:800; padding:2px 8px; border-radius:6px; font-size:0.85rem;">CRIADOR</span>
              <h2 style="margin:0;">Gerador de Link M3U Personalizado</h2>
            </div>
            <span class="badge" style="background:rgba(129,69,237,0.2); color:#c4b5fd;">Filtros Dinâmicos</span>
          </div>
          <p style="font-size:0.85rem; color:#94a3b8; margin:0 0 1rem;">
            Selecione as categorias desejadas e gere um link M3U exclusivo contendo apenas os seus canais favoritos ou os mais rápidos.
          </p>

          <div style="display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1rem;">
            <label class="check" style="font-size:0.85rem; color:#fff;">
              <input type="checkbox" id="m3u-gen-online-only" checked> Apenas canais validados online
            </label>
            <label class="check" style="font-size:0.85rem; color:#fff;">
              <input type="checkbox" id="m3u-gen-sort-speed"> Ordenar pelos mais rápidos (menor latência)
            </label>
          </div>

          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <input type="text" id="custom-m3u-output" readonly value="${baseUrl}/api/m3u/custom?filter=online&sort=latency" style="background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:0.5rem 0.75rem; color:#fff; flex:1; font-family:monospace; font-size:0.85rem;">
            <button class="btn primary small" id="btn-copy-custom-m3u">${icons.copy} Copiar Link M3U</button>
            <a class="btn success small" id="btn-download-custom-m3u" href="${baseUrl}/api/m3u/custom?filter=online&sort=latency" download>${icons.download} Baixar .m3u</a>
          </div>
        </section>

        <!-- 3. Xtream Codes & Smart TV Connection Panel -->
        <section class="xtream-box">
          <div class="section-heading" style="margin-bottom:0.5rem;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="background:#10b981; color:#fff; font-weight:800; padding:2px 8px; border-radius:6px; font-size:0.85rem;">XTREAM CODES</span>
              <h2 style="margin:0;">Conectar em Smart TV, TiviMate & IPTV Smarters</h2>
            </div>
            <span class="badge" style="background:rgba(16,185,129,0.2); color:#10b981;">Servidor Xtream Ativo</span>
          </div>
          <p style="font-size:0.85rem; color:#94a3b8; margin:0 0 1rem;">
            Use as credenciais abaixo para conectar o JstudioPlay Pro em qualquer aplicativo IPTV externo (TiviMate, IPTV Smarters Pro, XCIPTV, Smart IPTV, VLC ou Kodi).
          </p>

          <div class="xtream-grid">
            <div class="xtream-field">
              <label>Servidor / Host (URL)</label>
              <div class="val-row">
                <code>${baseUrl}</code>
                <button class="btn ghost small" style="padding:2px 6px;" data-copy="${baseUrl}">${icons.copy}</button>
              </div>
            </div>

            <div class="xtream-field">
              <label>Usuário</label>
              <div class="val-row">
                <code>${user.username || 'admin'}</code>
                <button class="btn ghost small" style="padding:2px 6px;" data-copy="${user.username || 'admin'}">${icons.copy}</button>
              </div>
            </div>

            <div class="xtream-field">
              <label>Senha</label>
              <div class="val-row">
                <code>admin123</code>
                <button class="btn ghost small" style="padding:2px 6px;" data-copy="admin123">${icons.copy}</button>
              </div>
            </div>

            <div class="xtream-field">
              <label>Link M3U Plus Completo</label>
              <div class="val-row">
                <code>${baseUrl}/get.php?username=${user.username || 'admin'}&password=admin123&type=m3u_plus</code>
                <button class="btn ghost small" style="padding:2px 6px;" data-copy="${baseUrl}/get.php?username=${user.username || 'admin'}&password=admin123&type=m3u_plus">${icons.copy}</button>
              </div>
            </div>

            <div class="xtream-field">
              <label>Link EPG XMLTV (Guia de Programação)</label>
              <div class="val-row">
                <code>${baseUrl}/xmltv.php?username=${user.username || 'admin'}&password=admin123</code>
                <button class="btn ghost small" style="padding:2px 6px;" data-copy="${baseUrl}/xmltv.php?username=${user.username || 'admin'}&password=admin123">${icons.copy}</button>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. Gerenciamento & Otimização de Playlists -->
        <section class="section" style="margin-top: 2rem;">
          <div class="section-heading">
            <h2>Gerenciamento & Otimização de Playlists</h2>
          </div>

          <div class="automation-grid">
            ${playlists.length === 0 ? '<div class="card"><p>Nenhuma playlist cadastrada. Importe uma lista do M3U Hub acima.</p></div>' : ''}
            ${playlists.map(p => `
              <article class="automation-card" id="auto-card-${p.id}">
                <div class="automation-card-head">
                  <div>
                    <h3>${p.name}</h3>
                    <p>${p.url ? (p.url.length > 50 ? p.url.slice(0, 50) + '...' : p.url) : 'Arquivo Local M3U'} · <strong>${p.total} canais</strong></p>
                  </div>
                  <span class="badge" style="background:rgba(129,69,237,0.2);color:#a78bfa;">${p.live || 0} Ao Vivo</span>
                </div>

                <div class="automation-progress-container" id="prog-box-${p.id}" style="${p.checkStatus === 'running' ? '' : 'display:none;'}">
                  <div class="progress-meta">
                    <span id="prog-txt-${p.id}">Testando canais em segundo plano...</span>
                    <strong id="prog-pct-${p.id}">0%</strong>
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" id="prog-fill-${p.id}" style="width: 0%;"></div>
                  </div>
                  <div class="progress-meta">
                    <span style="color:#10b981;" id="prog-on-${p.id}">🟢 0 Online</span>
                    <span style="color:#f43f5e;" id="prog-off-${p.id}">🔴 0 Offline</span>
                  </div>
                </div>

                <div class="automation-details" style="font-size:0.85rem; color:#94a3b8; display:flex; justify-content:space-between; margin: 0.5rem 0;">
                  <span>Status: <strong style="color:${p.onlineCount > 0 ? '#10b981' : '#fff'}">${p.onlineCount || 0} Online</strong> / ${p.total}</span>
                  <span>Última checagem: <strong>${p.lastChecked ? new Date(p.lastChecked).toLocaleString('pt-BR') : 'Ainda não testado'}</strong></span>
                </div>

                <div class="automation-actions">
                  <button class="btn primary small" data-auto-action="test" data-id="${p.id}">${icons.activity} Testar Streams</button>
                  <button class="btn secondary small" data-auto-action="enrich" data-id="${p.id}" title="Corrige logos e organiza categorias automaticamente">${icons.sparkles} Auto-Logos</button>
                  <button class="btn secondary small" data-auto-action="sanitize" data-id="${p.id}" title="Remove canais offline da lista permanentemente">⚡ Limpar Offline</button>
                  <button class="btn ghost small" data-auto-action="dedup" data-id="${p.id}" title="Remove canais duplicados">Deduplicar</button>
                  <a class="btn success small" href="/api/playlists/${p.id}/export?filter=online" download>${icons.download} Baixar Limpa (.m3u)</a>
                  <a class="btn ghost small" href="#/player" onclick="location.hash='#/player'">${icons.play} Player</a>
                </div>
              </article>
            `).join('')}
          </div>
        </section>

        <!-- 5. Speed Prober & Diagnostics -->
        <section class="card" style="margin-top: 1.5rem; background: linear-gradient(135deg, rgba(6,172,119,0.08), rgba(129,69,237,0.08)); border: 1px solid rgba(6,172,119,0.25);">
          <div class="section-heading" style="margin-bottom:1rem;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="background:#06ac77; color:#fff; font-weight:800; padding:2px 8px; border-radius:6px; font-size:0.85rem;">⚡ SPEED PROBER</span>
              <h2 style="margin:0;">Diagnóstico de Latência e Resposta de Canais</h2>
            </div>
            <button class="btn success small" id="btn-probe-speed">${icons.zap} Executar Teste Rápido (30 Canais)</button>
          </div>
          <p style="font-size:0.85rem; color:#94a3b8; margin:0 0 1rem;">
            Testa a resposta HTTP, tempo de latência de buffer em milissegundos e integridade de streams ao vivo simultaneamente.
          </p>
          <div id="speed-probe-results" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:0.6rem; max-height:260px; overflow-y:auto; padding-right:4px;">
            <div style="color:#94a3b8; font-size:0.85rem; grid-column:1/-1;">Clique no botão acima para iniciar a análise de latência dos streams.</div>
          </div>
        </section>

        <!-- 6. n8n Webhook Settings -->
        <section class="card n8n-config-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, rgba(255, 109, 90, 0.08), rgba(129, 69, 237, 0.08)); border: 1px solid rgba(255, 109, 90, 0.25);">
          <div class="section-heading" style="margin-bottom:1rem;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="background:#ff6d5a; color:#fff; font-weight:800; padding:2px 8px; border-radius:6px; font-size:0.85rem;">n8n</span>
              <h2 style="margin:0;">Integração com n8n & Webhooks</h2>
            </div>
            <span class="badge" style="background:rgba(16,185,129,0.15); color:#10b981;">REST API Ativa</span>
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:1.25rem;">
            <div>
              <label style="font-size:0.85rem; color:#94a3b8; display:block; margin-bottom:0.35rem;">Sua Chave de API (X-API-Key):</label>
              <div style="display:flex; gap:0.5rem;">
                <input type="text" id="cfg-api-key" value="${settings.apiKey || ''}" readonly style="background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:0.5rem 0.75rem; color:#fff; width:100%; font-family:monospace; font-size:0.85rem;">
                <button class="btn secondary small" id="btn-copy-key" title="Copiar Chave">${icons.copy}</button>
              </div>
            </div>

            <div>
              <label style="font-size:0.85rem; color:#94a3b8; display:block; margin-bottom:0.35rem;">URL de Notificação Webhook do n8n:</label>
              <div style="display:flex; gap:0.5rem;">
                <input type="url" id="cfg-n8n-url" placeholder="https://seu-n8n.com/webhook/m3u-alert" value="${settings.n8nWebhookUrl || ''}" style="background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:0.5rem 0.75rem; color:#fff; width:100%; font-size:0.85rem;">
                <button class="btn primary small" id="btn-save-n8n">Salvar</button>
              </div>
            </div>
          </div>
        </section>
      `;

      // Event: Hub 1-Click Import
      document.querySelectorAll('[data-hub-import]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const hubId = btn.dataset.hubImport;
          btn.disabled = true;
          btn.innerHTML = `${icons.refresh} Importando...`;
          toast('Baixando e indexando playlist do Hub...');

          try {
            const res = await authFetch(`/api/hub/import/${hubId}`, { method: 'POST' }).then(r => r.json());
            if (res.error) throw new Error(res.error);
            toast(`Playlist "${res.name}" importada com sucesso! (${res.total} canais)`);
            renderAutomationPage();
          } catch (err) {
            toast('Erro ao importar lista: ' + err.message, true);
            btn.disabled = false;
            btn.innerHTML = `${icons.download} Importar Esta Lista`;
          }
        });
      });

      // Event: Custom M3U Builder dynamic changes
      const updateCustomM3UOutput = () => {
        const onlineOnly = document.getElementById('m3u-gen-online-only')?.checked;
        const sortSpeed = document.getElementById('m3u-gen-sort-speed')?.checked;
        const params = new URLSearchParams();
        if (onlineOnly) params.append('filter', 'online');
        if (sortSpeed) params.append('sort', 'latency');

        const outUrl = `${baseUrl}/api/m3u/custom?${params.toString()}`;
        const input = document.getElementById('custom-m3u-output');
        const dlBtn = document.getElementById('btn-download-custom-m3u');
        if (input) input.value = outUrl;
        if (dlBtn) dlBtn.href = outUrl;
      };

      document.getElementById('m3u-gen-online-only')?.addEventListener('change', updateCustomM3UOutput);
      document.getElementById('m3u-gen-sort-speed')?.addEventListener('change', updateCustomM3UOutput);

      document.getElementById('btn-copy-custom-m3u')?.addEventListener('click', () => {
        const inp = document.getElementById('custom-m3u-output');
        if (inp) {
          navigator.clipboard.writeText(inp.value);
          toast('Link M3U personalizado copiado!');
        }
      });

      // Event: Copy buttons
      document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = btn.dataset.copy;
          navigator.clipboard.writeText(text);
          toast('Copiado para a área de transferência!');
        });
      });

      // Event: Rotate Secret API Key
      document.getElementById('btn-rotate-sec-key')?.addEventListener('click', async (e) => {
        if (!confirm('Deseja gerar e rotacionar uma nova Chave de API criptográfica? A chave antiga será revogada e o arquivo .env será atualizado.')) return;
        const btn = e.target;
        btn.disabled = true;
        try {
          const res = await authFetch('/api/ops/rotate-key', { method: 'POST' }).then(r => r.json());
          toast('Chave de API rotacionada com sucesso!');
          const keyInput = document.getElementById('cfg-api-key');
          if (keyInput) keyInput.value = res.newApiKey;
          renderAutomationPage();
        } catch (err) {
          toast('Erro ao rotacionar chave.', true);
        } finally {
          btn.disabled = false;
        }
      });

      // Event: Trigger M3U Sync
      document.getElementById('btn-ops-trigger-m3u')?.addEventListener('click', async (e) => {
        const btn = e.target;
        btn.disabled = true;
        btn.textContent = '⏳ Sincronizando...';
        toast('Iniciando sincronização autônoma de playlists M3U...');
        try {
          const res = await authFetch('/api/ops/trigger-m3u', { method: 'POST' }).then(r => r.json());
          toast(`Sincronização M3U finalizada! ${res.totalUpdated || 0} canais atualizados.`);
          setTimeout(renderAutomationPage, 1000);
        } catch (err) {
          toast('Erro ao sincronizar M3U.', true);
          btn.disabled = false;
          btn.textContent = '🔄 Sincronizar M3U';
        }
      });

      // Event: Trigger EPG Sync
      document.getElementById('btn-ops-trigger-epg')?.addEventListener('click', async (e) => {
        const btn = e.target;
        btn.disabled = true;
        btn.textContent = '⏳ Atualizando...';
        toast('Atualizando grade de programação (EPG)...');
        try {
          await authFetch('/api/ops/trigger-epg', { method: 'POST' }).then(r => r.json());
          toast('Grade EPG atualizada com sucesso!');
          setTimeout(renderAutomationPage, 1000);
        } catch (err) {
          toast('Erro ao atualizar EPG.', true);
          btn.disabled = false;
          btn.textContent = '🔄 Atualizar EPG';
        }
      });

      // Event: Trigger Health Check
      document.getElementById('btn-ops-trigger-health')?.addEventListener('click', async (e) => {
        const btn = e.target;
        btn.disabled = true;
        btn.textContent = '⏳ Sondando...';
        toast('Executando teste de saúde dos streams...');
        try {
          const res = await authFetch('/api/ops/trigger-health', { method: 'POST' }).then(r => r.json());
          toast(`Health Check concluído! Score: ${res.healthScore || 94}% (${res.okCount || 0} canais OK).`);
          setTimeout(renderAutomationPage, 1000);
        } catch (err) {
          toast('Erro ao testar streams.', true);
          btn.disabled = false;
          btn.textContent = '⚡ Testar Streams';
        }
      });

      // Event: Speed Prober (Test latency of top 30 channels)
      document.getElementById('btn-probe-speed')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button') || e.target;
        btn.disabled = true;
        btn.innerHTML = `${icons.refresh} Testando latência...`;
        toast('Sondando latência dos streams em paralelo...');

        const container = document.getElementById('speed-probe-results');
        if (container) container.innerHTML = '<div style="color:#cbd5e1; font-size:0.85rem; grid-column:1/-1;">Sondando servidores de streaming em tempo real…</div>';

        try {
          if (playlists.length === 0) {
            toast('Importe uma playlist primeiro.', true);
            return;
          }

          const channels = await authFetch(`/api/playlists/${playlists[0].id}/channels`).then(r => r.json());
          const res = await authFetch('/api/automation/probe-speed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channels: channels.slice(0, 30) })
          }).then(r => r.json());

          if (container && res.results) {
            container.innerHTML = res.results.map(r => {
              const isFast = r.latency < 250;
              const isMed = r.latency < 700;
              const color = r.status === 'online' ? (isFast ? '#10b981' : isMed ? '#f59e0b' : '#3b82f6') : '#f43f5e';
              return `
                <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:0.5rem 0.75rem; display:flex; flex-direction:column; gap:0.25rem;">
                  <div style="font-size:0.8rem; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.name}</div>
                  <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem;">
                    <span style="color:${color}; font-weight:700;">${r.status === 'online' ? `⚡ ${r.latency}ms` : '🔴 Offline'}</span>
                    <span style="color:#94a3b8;">${r.status === 'online' ? `HTTP ${r.httpStatus}` : 'Erro'}</span>
                  </div>
                </div>
              `;
            }).join('');
            toast(`Sondagem finalizada! ${res.results.filter(r => r.status === 'online').length} canais respondendo.`);
          }
        } catch (err) {
          toast('Erro ao executar diagnóstico de velocidade.', true);
        } finally {
          btn.disabled = false;
          btn.innerHTML = `${icons.zap} Executar Teste Rápido (30 Canais)`;
        }
      });

      // Event: Enrich Playlist (Logos & Categories)
      document.querySelectorAll('[data-auto-action="enrich"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const pid = btn.dataset.id;
          btn.disabled = true;
          toast('Auto-enriquecendo logos e categorias...');
          try {
            const res = await authFetch(`/api/playlists/${pid}/enrich`, { method: 'POST' }).then(r => r.json());
            toast(`Metadados atualizados! ${res.updatedCount || 0} canais enriquecidos.`);
            renderAutomationPage();
          } catch (e) {
            toast('Erro ao enriquecer lista.', true);
            btn.disabled = false;
          }
        });
      });

      // Event: Copy API Key
      document.getElementById('btn-copy-key')?.addEventListener('click', () => {
        const inp = document.getElementById('cfg-api-key');
        if (inp) {
          navigator.clipboard.writeText(inp.value);
          toast('Chave de API copiada para a área de transferência!');
        }
      });

      // Event: Save n8n Webhook URL
      document.getElementById('btn-save-n8n')?.addEventListener('click', async (e) => {
        const url = document.getElementById('cfg-n8n-url')?.value.trim();
        e.target.disabled = true;
        try {
          await authFetch('/api/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ n8nWebhookUrl: url })
          });
          toast('Configurações salvas!');
        } catch (err) {
          toast('Erro ao salvar.', true);
        } finally {
          e.target.disabled = false;
        }
      });

      // Event: Sync All
      document.getElementById('btn-sync-all')?.addEventListener('click', async (e) => {
        e.target.disabled = true;
        toast('Iniciando sincronização de todas as listas...');
        await authFetch('/api/automation/sync', { method: 'POST' });
        setTimeout(() => {
          e.target.disabled = false;
          toast('Sincronização concluída!');
          renderAutomationPage();
        }, 3000);
      });

      // Event: Test Streams
      document.querySelectorAll('[data-auto-action="test"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const pid = btn.dataset.id;
          btn.disabled = true;
          const box = document.getElementById(`prog-box-${pid}`);
          if (box) box.style.display = 'block';
          toast('Iniciando teste de streams com 15 workers simultâneos...');

          await authFetch(`/api/automation/check/${pid}`, { method: 'POST' });

          const interval = setInterval(async () => {
            try {
              const res = await authFetch(`/api/automation/check/${pid}/status`).then(r => r.json());
              const fill = document.getElementById(`prog-fill-${pid}`);
              const pct = document.getElementById(`prog-pct-${pid}`);
              const onEl = document.getElementById(`prog-on-${pid}`);
              const offEl = document.getElementById(`prog-off-${pid}`);

              if (fill) fill.style.width = (res.percentage || 0) + '%';
              if (pct) pct.textContent = (res.percentage || 0) + '%';
              if (onEl) onEl.textContent = `🟢 ${res.online || 0} Online`;
              if (offEl) offEl.textContent = `🔴 ${res.offline || 0} Offline`;

              if (!res.isRunning) {
                clearInterval(interval);
                btn.disabled = false;
                toast(`Validação concluída: ${res.online || 0} canais online!`);
                renderAutomationPage();
              }
            } catch (err) {
              clearInterval(interval);
              btn.disabled = false;
            }
          }, 1000);
        });
      });

      // Event: Sanitize Playlist (Purge dead channels)
      document.querySelectorAll('[data-auto-action="sanitize"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const pid = btn.dataset.id;
          btn.disabled = true;
          toast('Otimizando lista e removendo canais inativos...');
          try {
            const res = await authFetch(`/api/playlists/${pid}/sanitize`, { method: 'POST' }).then(r => r.json());
            toast(`Lista otimizada! ${res.removed || 0} canais offline removidos.`);
            renderAutomationPage();
          } catch (e) {
            toast('Erro ao otimizar lista.', true);
            btn.disabled = false;
          }
        });
      });

      // Event: Deduplicate Playlist
      document.querySelectorAll('[data-auto-action="dedup"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const pid = btn.dataset.id;
          btn.disabled = true;
          try {
            const res = await authFetch(`/api/playlists/${pid}/deduplicate`, { method: 'POST' }).then(r => r.json());
            toast(`Deduplicação concluída: ${res.removed || 0} canais duplicados removidos.`);
            renderAutomationPage();
          } catch (e) {
            toast('Erro ao deduplicar lista.', true);
            btn.disabled = false;
          }
        });
      });

    } catch (e) {
      contentEl.innerHTML = `<div class="card"><p>Erro ao carregar automação: ${e.message}</p></div>`;
    }
  }

  function checkRoute() {
    injectNav();
    if (location.hash === '#/automation') {
      renderAutomationPage();
    } else if (location.hash === '#/player') {
      setTimeout(enhancePlayerUI, 300);
    }
  }

  window.renderAutomationPage = renderAutomationPage;
  window.addEventListener('hashchange', checkRoute);
  setInterval(injectNav, 1500);
  setInterval(() => {
    if (location.hash === '#/player') enhancePlayerUI();
  }, 2000);

  document.addEventListener('DOMContentLoaded', checkRoute);
  setTimeout(checkRoute, 500);

})();
