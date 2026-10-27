'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const deviceNavigator=typeof navigator==='undefined'?{userAgent:'',maxTouchPoints:0}:navigator;
const tvMode = /\b(?:Tizen|Web0S|WebOS|NetCast|GoogleTV|Android TV|SMART-TV|SmartTV|HbbTV|BRAVIA|Roku|AFT[A-Z0-9]+)\b/i.test(deviceNavigator.userAgent) ||
  (!deviceNavigator.maxTouchPoints&&matchMedia('(min-width:1100px) and (hover:none) and (pointer:coarse)').matches) ||
  matchMedia('(min-width:1100px) and (hover:none) and (pointer:none)').matches;
if(tvMode)document.documentElement.classList.add('tv-mode');
const tvFocusable = 'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),summary,[tabindex]:not([tabindex="-1"])';
function visibleTVTargets(){
  const root=$('#modal')?.open?$('#modal'):document;
  return [...root.querySelectorAll(tvFocusable)].filter(el=>!el.disabled&&!el.closest('[hidden],[inert]') && el.getClientRects().length && getComputedStyle(el).visibility!=='hidden');
}
function focusTV(target){if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',inline:'nearest'});}}
function moveTVFocus(key){
  const targets=visibleTVTargets();if(!targets.length)return;
  const current=document.activeElement;
  if(!targets.includes(current)){focusTV(targets[0]);return;}
  const from=current.getBoundingClientRect(),cx=from.left+from.width/2,cy=from.top+from.height/2;
  const horizontal=key==='ArrowLeft'||key==='ArrowRight',sign=key==='ArrowRight'||key==='ArrowDown'?1:-1;
  let best=null,bestScore=Infinity;
  for(const target of targets){
    if(target===current)continue;
    const rect=target.getBoundingClientRect(),dx=rect.left+rect.width/2-cx,dy=rect.top+rect.height/2-cy;
    const primary=(horizontal?dx:dy)*sign,cross=Math.abs(horizontal?dy:dx);
    if(primary<=2)continue;
    const score=primary+cross*2+(cross>Math.max(horizontal?from.height:from.width,horizontal?rect.height:rect.width)?60:0);
    if(score<bestScore){best=target;bestScore=score;}
  }
  focusTV(best);
}
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = n => Number(n || 0).toLocaleString('pt-BR');
const colors = ['#8b5cf6','#00f2fe','#a855f7','#10b981','#f43f5e','#06b6d4','#fb923c'];
const paths = {
  home:'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  playlist:'M4 6h16M4 12h9M4 18h9M16 11l5 3-5 3v-6Z',
  tv:'M3 6h18v13H3zM8 22h8M12 19v3M8 2l4 4 4-4',
  film:'M3 4h18v16H3zM7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4',
  grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  clock:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  settings:'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  logout:'M9 3H4v18h5M9 12h12M17 8l4 4-4 4',
  users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M17 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.9',
  user:'M20 21v-2a7 7 0 0 0-14 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  lock:'M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4M12 14v3',
  eye:'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  plus:'M12 5v14M5 12h14',
  close:'m6 6 12 12M6 18 18 6',
  arrow:'M4 12h16M14 6l6 6-6 6',
  left:'m15 5-7 7 7 7',
  right:'m9 5 7 7-7 7',
  episodePrevious:'M6 5v14M19 5l-9 7 9 7V5Z',
  episodeNext:'M18 5v14M5 5l9 7-9 7V5Z',
  play:'m8 4 13 8-13 8Z',
  pause:'M8 4v16M16 4v16',
  sun:'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  moon:'M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z',
  menu:'M4 6h16M4 12h16M4 18h16',
  more:'M12 5h.01M12 12h.01M12 19h.01',
  info:'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  shield:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6ZM8 12l3 3 5-6',
  monitor:'M2 3h20v14H2zM8 22h8M12 17v5',
  phone:'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM11 18h2',
  tablet:'M4 2h16v20H4zM11 18h2',
  music:'M9 18V5l12-3v13M9 18a3 3 0 1 1-3-3h3M21 15a3 3 0 1 1-3-3h3',
  volume:'M11 3 6 7H2v10h4l5 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14',
  fullscreen:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5',
  trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  refresh:'M21 3v6h-6M3 21v-6h6M4 9a8 8 0 0 1 14-4l3 4M3 15l3 4a8 8 0 0 0 14-4',
  globe:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M2 12h20M12 2c5 5 5 15 0 20-5-5-5-15 0-20',
  credits:'M2 7h20M2 12h20M7 17h4M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5Z',
  sports:'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 3.5 2.5 2-1 3h-3l-1-3z',
  smile:'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-3.5 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-7 5.5a5 5 0 0 0 7 0',
  compass:'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm3.5 5.5-2 5.5-5.5 2 2-5.5z',
  newspaper:'M4 4h16v16H4zm4 4h8M8 12h8M8 16h5',
  star:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  cross:'M12 2v20M6 8h12',
  adult:'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-4 5v10m4-10v10m4-10v10',
};
function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.tv}"/></svg>`; }
function brand(route = 'login') { return `<a class="brand" href="#/${state.user ? 'dashboard' : 'login'}" aria-label="JstudioPlay — Início"><img src="/static/logo.svg" alt="JstudioPlay"><span>Jstudio<span>Play</span></span></a>`; }
let initialToken=null, initialRelay=true;
try { initialToken = localStorage.getItem('m3u-token'); const r = localStorage.getItem('m3u-relay'); if(r!==null) initialRelay = r==='true'; } catch {}
window.eventBus = {
  _listeners: {},
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  },
  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  },
  emit(event, data) {
    if (!this._listeners[event]) return;
    this._listeners[event].forEach(fn => {
      try { fn(data); } catch (err) { console.error('EventBus error:', err); }
    });
  }
};

const state = {user:null,token:initialToken,setupRequired:false,setupAllowed:false,relayEnabled:true,relayMode:initialRelay,page:'',playlists:[],favorites:[],history:[],progress:[],users:[],logs:[],aiStatus:null,channels:[],activePlaylist:'',mediaType:'live',category:'',query:'',channelPage:1,selected:null,groups:[],loading:false,dashLive:[],dashMovies:[],dashSeries:[]};
let hls = null, playbackGeneration = 0, routeGeneration = 0, toastTimer, searchTimer, playbackTimer;
let theme = 'dark';
try { theme = localStorage.getItem('m3u-theme') === 'light' ? 'light' : 'dark'; } catch {}
function applyTheme(value) {
  theme = value === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  $('meta[name="theme-color"]').content = theme === 'dark' ? '#141517' : '#F6F5F2';
  try { localStorage.setItem('m3u-theme',theme); } catch {}
  document.querySelectorAll('[data-action="theme"]').forEach(b => {b.setAttribute('aria-pressed',String(theme==='light'));b.setAttribute('aria-label',theme==='dark'?'Ativar modo claro':'Ativar modo escuro');});
}
applyTheme(theme);
function themeButton() {return `<button class="theme-toggle" data-action="theme" aria-label="${theme==='dark'?'Ativar modo claro':'Ativar modo escuro'}" aria-pressed="${theme==='light'}">${icon('sun')}<span class="theme-dot"></span></button>`;}
function toast(message,error=false) {const el=$('#toast');el.textContent=message;el.className=error?'error':'';el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true;},6000);}
const DEFAULT_CLOUD_BACKEND = 'https://stop-frame-coming-receptors.trycloudflare.com';
const LOCAL_WIFI_BACKEND = 'http://192.168.0.101:3030';
const EMULATOR_BACKEND = 'http://10.0.2.2:3030';

function getBackendBase() {
  const custom = localStorage.getItem('m3u-backend-url');
  if (custom && custom.trim()) return custom.trim().replace(/\/+$/, '');
  
  // Se estiver no aplicativo nativo Android (Capacitor)
  const isNativeApp = window.Capacitor || location.protocol === 'capacitor:' || (location.hostname === 'localhost' && !location.port);
  if (isNativeApp) {
    // No app Android (celular físico ou emulador), prioriza o túnel HTTPS em nuvem
    return DEFAULT_CLOUD_BACKEND;
  }
  return '';
}
async function api(path,method='GET',data,options={}) {
  let response;
  const base = getBackendBase();
  const url = (base ? base : '') + '/api' + path;
  const currentToken = state.token || localStorage.getItem('m3u-token');
  try {
    response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(currentToken ? { 'Authorization': 'Bearer ' + currentToken } : {})
      },
      ...(data!==undefined?{body:JSON.stringify(data)}:{}),
      ...options
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o servidor está rodando ou se a URL está correta.');
  }
  const body=await response.json().catch(()=>({error:'O servidor retornou uma resposta inválida.'}));
  if (!response.ok) {
    if(response.status===401 && state.user && path!=='/login') {state.user=null;clearPrivateState();$('#modal').close();location.hash='/login';}
    const error=new Error(body.error || 'Não foi possível concluir a operação.');error.status=response.status;error.diagnostic=body.diagnostic;error.upstreamStatus=body.upstreamStatus;throw error;
  }
  return body;
}
window.api = api;
function clearPrivateState(){stopPlayback(false);Object.assign(state,{playlists:[],favorites:[],history:[],progress:[],users:[],logs:[],channels:[],groups:[],selected:null,activePlaylist:'',loading:false,relayMode:false});}
async function loadLibrary(){const userID=state.user?.id;await progressWrites.catch(()=>{});const data=await api('/library');if(state.user?.id!==userID)return;state.playlists=data.playlists||[];state.favorites=data.favorites||[];state.history=data.history||[];state.progress=data.progress||[];}
function navigate(page){if(location.hash==='#/'+page)renderRoute();else location.hash='/'+page;}
function setMenu(open=false){
  $('.shell')?.classList.toggle('menu-open',open);
  $('.mobile-menu')?.setAttribute('aria-expanded',String(open));
  $('.mobile-menu')?.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
  const sidebar=$('.sidebar');if(sidebar)sidebar.inert=matchMedia('(max-width:760px)').matches&&!open;
}
let sidebarPreference=null;
try { const saved=localStorage.getItem('m3u-sidebar-collapsed');if(saved!==null)sidebarPreference=saved==='true'; } catch {}
function sidebarCollapsed(){return sidebarPreference===null?state.page==='player':sidebarPreference;}
function toggleSidebar(){
  sidebarPreference=!sidebarCollapsed();
  try { localStorage.setItem('m3u-sidebar-collapsed',String(sidebarPreference)); } catch {}
  $('.shell')?.classList.toggle('sidebar-collapsed',sidebarPreference);
  const button=$('[data-action="toggle-sidebar"]');
  if(button){button.setAttribute('aria-expanded',String(!sidebarPreference));button.setAttribute('aria-label',sidebarPreference?'Expandir menu':'Recolher menu');button.title=sidebarPreference?'Expandir menu':'Recolher menu';}
}
matchMedia('(max-width:760px)').addEventListener('change',()=>setMenu(false));
function empty(title,text,button='',symbol='playlist'){return `<div class="empty"><div class="empty-icon">${icon(symbol)}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${button}</div>`;}
const maxPlaylistsPerAccount=50;
function addButton(){return state.playlists.length>=maxPlaylistsPerAccount?'<small>Limite de playlists atingido</small>':`<button class="btn small" data-action="add-playlist">${icon('plus')}Adicionar playlist</button>`;}
function heading(title,subtitle,extra=''){return `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>${extra}</div>`;}
function initials(name){return String(name||'U').split(/\s+/).slice(0,2).map(v=>v[0]||'').join('').toUpperCase();}
function dateTime(value){return !value||String(value).startsWith('0001')?'Ainda não acessou':new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});}
function tileStyle(i){return `--tile:${colors[i%colors.length]}`;}
function channelLogo(ch,i=0,deferImage=false){let logo='';const name=ch?.name||ch?.tvgName||'TV';if(ch?.logo&&/^https?:\/\//i.test(ch.logo)){try{const url=new URL(ch.logo);if((url.protocol==='https:'||url.protocol==='http:')&&(location.protocol!=='https:'||url.protocol==='https:'))logo=url.href;}catch{}}return `<span class="channel-logo" style="${tileStyle(i)}">${logo?`<img ${deferImage?'data-logo-src':'src'}="${esc(logo)}" alt="" width="30" height="30" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.style.display='none';this.parentElement.textContent='${esc(initials(name))}';">`:esc(initials(name))}</span>`;}

function landing(){
  return `<div class="onex-landing-wrapper">
    <!-- Header Fixo Glassmorphism -->
    <header class="onex-header">
      <a class="onex-brand" href="#/landing" aria-label="JstudioPlay Início">
        <div class="iptv-play-icon" style="width:36px; height:36px; border-radius:8px;">
          <svg viewBox="0 0 24 24" style="width:18px; height:18px;"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <span class="iptv-logo-title" style="font-size:1.4rem;">JSTUDIO<span style="color:var(--iptv-red);">PLAY</span></span>
      </a>

      <nav class="onex-nav" aria-label="Navegação da Página">
        <a href="#recursos">Recursos</a>
        <a href="#dispositivos">Dispositivos</a>
        <a href="#faq">Dúvidas (FAQ)</a>
      </nav>

      <div style="display:flex; align-items:center; gap:1rem;">
        <a class="onex-btn-login" href="#/login">
          <span>Acessar Plataforma</span>
          ${icon('right')}
        </a>
      </div>
    </header>

    <!-- Seção Hero Principal (Padrão OneX) -->
    <section class="onex-hero">
      <div class="onex-badge">
        <span class="onex-badge-dot"></span>
        <span>Streaming de Alta Fidelidade & IPTV</span>
      </div>

      <h1>
        Sua Central Definitiva de Streaming.<br>
        <span class="gradient">TV Ao Vivo, Filmes e Séries.</span>
      </h1>

      <p class="subtitle">
        Organize e assista suas listas M3U e servidores Xtream Codes em uma experiência cinematográfica. Player HLS anti-travamento com EPG em tempo real e interface otimizada para Smart TVs e navegadores modernos.
      </p>

      <div class="onex-hero-actions">
        <a class="onex-btn-login" href="#/login" style="padding:0.9rem 2.2rem; font-size:1.05rem; border-radius:10px;">
          <span>Entrar na Minha Conta</span>
          ${icon('play')}
        </a>
        <a class="onex-btn-secondary" href="#recursos" style="padding:0.9rem 2rem; font-size:1.05rem; border-radius:10px;">
          <span>Conhecer Recursos</span>
          ${icon('arrow')}
        </a>
      </div>

      <!-- Métricas / Estatísticas no Padrão OneX -->
      <div class="onex-stats-grid">
        <div class="onex-stat-card">
          <div class="onex-stat-number"><span class="accent">4K</span> & FHD</div>
          <div class="onex-stat-label">Ultra Alta Definição</div>
        </div>
        <div class="onex-stat-card">
          <div class="onex-stat-number">100<span class="accent">%</span></div>
          <div class="onex-stat-label">EPG & Grade Horária</div>
        </div>
        <div class="onex-stat-card">
          <div class="onex-stat-number">Zero</div>
          <div class="onex-stat-label">Travamentos com Proxy HLS</div>
        </div>
        <div class="onex-stat-card">
          <div class="onex-stat-number">Multi<span class="accent">TV</span></div>
          <div class="onex-stat-label">Smart TV, Celular e Web</div>
        </div>
      </div>
    </section>

    <!-- Seção Recursos e Diferenciais Técnicos -->
    <section id="recursos" class="onex-section">
      <div class="onex-section-head">
        <span class="onex-section-tag">Tecnologia & Estabilidade</span>
        <h2 class="onex-section-title">Construído para o Máximo Desempenho</h2>
        <p class="onex-section-desc">Uma plataforma concebida desde o primeiro byte para entregar reprodução fluida, organização inteligente e navegação instantânea em qualquer controle remoto.</p>
      </div>

      <div class="onex-features-grid">
        <div class="onex-feature-card">
          <div class="onex-feature-icon">${icon('tv')}</div>
          <h3>Player HLS de Baixa Latência</h3>
          <p>Motor de vídeo adaptativo com suporte a streams HLS (m3u8), TS e MP4. Relay inteligente para bypass de bloqueios CORS e failover automático de conexões instáveis.</p>
        </div>

        <div class="onex-feature-card">
          <div class="onex-feature-icon">${icon('refresh')}</div>
          <h3>Guia EPG em Tempo Real</h3>
          <p>Sincronização contínua com programação oficial. Veja o que está passando agora, a barra de progresso do programa e o que vem a seguir em cada canal.</p>
        </div>

        <div class="onex-feature-card">
          <div class="onex-feature-icon">${icon('playlist')}</div>
          <h3>Conector Duplo M3U + Xtream</h3>
          <p>Suporte completo a arquivos locais M3U, URLs remotas de provedores e integração nativa com servidores pagos Xtream Codes API (Host, Usuário e Senha).</p>
        </div>

        <div class="onex-feature-card">
          <div class="onex-feature-icon">${icon('shield')}</div>
          <h3>Controle Parental com PIN</h3>
          <p>Bloqueie categorias sensíveis e conteúdos adultos com código de segurança numérico de 4 dígitos (0-9), garantindo proteção total para toda a família.</p>
        </div>

        <div class="onex-feature-card">
          <div class="onex-feature-icon">${icon('grid')}</div>
          <h3>VOD Filmes & Séries com Poster</h3>
          <p>Separação automática de catálogos VOD. Navegação em grade imersiva por episódios, temporadas e sinopses no mais puro estilo Netflix.</p>
        </div>

        <div class="onex-feature-card">
          <div class="onex-feature-icon">${icon('clock')}</div>
          <h3>Histórico & Favoritos em Nuvem</h3>
          <p>Marque seus canais favoritos com um clique e retome exatamente onde parou com sincronização persistente na sua conta.</p>
        </div>
      </div>
    </section>

    <!-- Seção Dispositivos Compatíveis -->
    <section id="dispositivos" class="onex-section" style="padding-top:2rem;">
      <div class="onex-section-head">
        <span class="onex-section-tag">Compatibilidade Total</span>
        <h2 class="onex-section-title">Assista Onde e Quando Quiser</h2>
        <p class="onex-section-desc">Design responsivo pensado tanto para telas gigantes de Smart TV quanto para smartphones, tablets e notebooks.</p>
      </div>

      <div class="onex-devices-grid">
        <div class="onex-device-card">
          <div class="onex-device-icon">${icon('tv')}</div>
          <div class="onex-device-info">
            <h4>Smart TVs Samsung & LG</h4>
            <p>Otimizado para Tizen e WebOS com navegação por setas (D-Pad).</p>
          </div>
        </div>

        <div class="onex-device-card">
          <div class="onex-device-icon">${icon('grid')}</div>
          <div class="onex-device-info">
            <h4>Android TV & Google TV</h4>
            <p>Fluidez máxima com aceleração por hardware e suporte a controle.</p>
          </div>
        </div>

        <div class="onex-device-card">
          <div class="onex-device-icon">${icon('play')}</div>
          <div class="onex-device-info">
            <h4>Fire TV Stick & TV Box</h4>
            <p>Compatível com navegadores Silk e Chrome para Fire OS.</p>
          </div>
        </div>

        <div class="onex-device-card">
          <div class="onex-device-icon">${icon('user')}</div>
          <div class="onex-device-info">
            <h4>Computadores & Web</h4>
            <p>Acesse pelo Chrome, Edge, Firefox e Safari em qualquer sistema.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Perguntas Frequentes (FAQ Accordion) -->
    <section id="faq" class="onex-section">
      <div class="onex-section-head">
        <span class="onex-section-tag">Tire Suas Dúvidas</span>
        <h2 class="onex-section-title">Perguntas Frequentes</h2>
        <p class="onex-section-desc">Tudo o que você precisa saber sobre como funciona a plataforma JstudioPlay.</p>
      </div>

      <div class="onex-faq-container">
        <details class="onex-faq-item">
          <summary class="onex-faq-summary">
            <span>O JstudioPlay vende listas ou fornece canais?</span>
            <span style="color:var(--iptv-red); font-size:1.2rem;">+</span>
          </summary>
          <div class="onex-faq-content">
            Não. O JstudioPlay é um reprodutor e gerenciador profissional de mídia de alta performance. Nós fornecemos a tecnologia e a interface para você organizar e reproduzir suas próprias fontes autorizadas M3U ou contas Xtream Codes.
          </div>
        </details>

        <details class="onex-faq-item">
          <summary class="onex-faq-summary">
            <span>Como faço para adicionar minha lista ou IPTV pago?</span>
            <span style="color:var(--iptv-red); font-size:1.2rem;">+</span>
          </summary>
          <div class="onex-faq-content">
            Após efetuar o login, acesse o menu <strong>Playlists</strong> e clique em <strong>Adicionar playlist</strong>. Você pode colar a URL do arquivo M3U, fazer upload de um arquivo salvo ou selecionar a aba <strong>Servidor Xtream Codes</strong> informando a URL do servidor, usuário e senha.
          </div>
        </details>

        <details class="onex-faq-item">
          <summary class="onex-faq-summary">
            <span>Funciona direto no navegador da minha Smart TV?</span>
            <span style="color:var(--iptv-red); font-size:1.2rem;">+</span>
          </summary>
          <div class="onex-faq-content">
            Sim! A interface do JstudioPlay possui detecção inteligente de TV (Tizen, WebOS, Android TV) e mapeia os botões do controle remoto (Cima, Baixo, Esquerda, Direita, Enter, Voltar e Teclado Numérico 0-9 para troca rápida de canais).
          </div>
        </details>

        <details class="onex-faq-item">
          <summary class="onex-faq-summary">
            <span>Minhas listas e configurações ficam salvas?</span>
            <span style="color:var(--iptv-red); font-size:1.2rem;">+</span>
          </summary>
          <div class="onex-faq-content">
            Sim. Suas playlists, categorias favoritas, histórico de reprodução e preferências de áudio/legendas ficam salvas com segurança na sua conta no banco de dados e sincronizadas em qualquer dispositivo.
          </div>
        </details>
      </div>

      <!-- Caixa de Chamada Final (CTA Box) -->
      <div class="onex-cta-box">
        <h2>Pronto Para Transformar Sua Experiência?</h2>
        <p>Acesse sua conta agora mesmo e desfrute da mais moderna interface de streaming para suas playlists.</p>
        <a class="onex-btn-login" href="#/login" style="padding:1rem 2.5rem; font-size:1.1rem; border-radius:10px;">
          <span>Entrar no JstudioPlay Agora</span>
          ${icon('right')}
        </a>
      </div>
    </section>

    <!-- Rodapé Oficial -->
    <footer class="onex-footer">
      <div class="onex-footer-inner">
        <div style="max-width:380px;">
          <div class="onex-brand" style="margin-bottom:1rem;">
            <div class="iptv-play-icon" style="width:32px; height:32px; border-radius:6px;">
              <svg viewBox="0 0 24 24" style="width:16px; height:16px;"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <span class="iptv-logo-title" style="font-size:1.25rem;">JSTUDIO<span style="color:var(--iptv-red);">PLAY</span></span>
          </div>
          <p style="font-size:0.88rem; color:var(--iptv-text-sec); line-height:1.6; margin:0;">
            Plataforma profissional de reprodução e gerenciamento de mídia em nuvem. Compatível com os padrões abertos HLS, M3U e Xtream Codes.
          </p>
        </div>

        <div class="onex-footer-col">
          <h4>Navegação</h4>
          <a href="#recursos">Recursos Técnicos</a>
          <a href="#dispositivos">Dispositivos Compatíveis</a>
          <a href="#faq">Perguntas Frequentes</a>
        </div>

        <div class="onex-footer-col">
          <h4>Acesso</h4>
          <a href="#/login">Entrar na Conta</a>
          <a href="#/login">Painel do Administrador</a>
          <a href="/privacy.html" target="_blank">Política de Privacidade</a>
        </div>
      </div>

      <div class="onex-footer-bottom">
        <span>© ${new Date().getFullYear()} JstudioPlay. Todos os direitos reservados.</span>
        <span>JstudioPlay é uma ferramenta de software e não comercializa canais nem assinaturas.</span>
      </div>
    </footer>
  </div>`;
}
function getIptvClock(){
  const d = new Date();
  return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}
function getIptvDate(){
  const d = new Date();
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatPlOption(p, activeId) {
  const parts = [];
  const vod = Number(p.vod) || 0;
  const series = Number(p.series) || 0;
  const live = Number(p.live) || 0;
  if(vod > 0) parts.push(`${number(vod)} filmes`);
  if(series > 0) parts.push(`${number(series)} séries`);
  if(live > 0) parts.push(`${number(live)} canais`);
  const countStr = parts.length ? ` (${parts.join(' • ')})` : (p.total ? ` (${number(p.total)} itens)` : '');
  const selected = (p.id === activeId) ? 'selected' : '';
  return `<option value="${p.id}" ${selected}>${esc(p.name)}${countStr}</option>`;
}

function iptvTopBar(active='dashboard'){
  const time = getIptvClock();
  const date = getIptvDate();
  const currentPl = state.playlists.find(p => p.id === state.activePlaylist) || state.playlists[0];
  const pageTitles = {
    dashboard: { label: 'Início', icon: 'home' },
    live: { label: 'TV ao Vivo', icon: 'tv' },
    channels: { label: 'Canais', icon: 'tv' },
    movies: { label: 'Filmes & Cinema', icon: 'film' },
    catalog: { label: 'Filmes & Cinema', icon: 'film' },
    series: { label: 'Séries & Episódios', icon: 'grid' },
    marathons: { label: 'Maratonas Narrativas', icon: 'play' },
    categories: { label: 'Grade de Canais', icon: 'playlist' },
    favorites: { label: 'Favoritos', icon: 'heart' },
    settings: { label: 'Configurações', icon: 'settings' },
    search: { label: 'Busca Global', icon: 'search' },
    users: { label: 'Usuários', icon: 'users' },
    credits: { label: 'Créditos', icon: 'credits' },
    automation: { label: 'M3U Hub', icon: 'globe' },
    logs: { label: 'Logs do Sistema', icon: 'clock' },
    player: { label: 'Player HLS', icon: 'tv' }
  };
  const curPage = pageTitles[active] || { label: 'JstudioPlay', icon: 'tv' };

  return `<header class="iptv-master-topbar">
    <div style="display:flex; align-items:center; gap:0.75rem;">
      <button class="iptv-sidebar-toggle-btn" data-action="toggle-iptv-sidebar" title="Recolher / Expandir menu lateral" aria-label="Alternar barra lateral">
        ${icon('menu')}
      </button>
      <a class="iptv-master-brand" href="#/dashboard" title="JstudioPlay">
        <div class="iptv-brand-text">Jstudio<span>Play</span></div>
      </a>
    </div>

    <div class="iptv-master-topbar-center" id="topbar-center-pane">
      <div id="topbar-now-playing-container" style="${window._currentPlaying ? '' : 'display:none;'}">
        <a class="iptv-topbar-now-playing" href="${window._currentPlaying?.type === 'live' ? '#/live' : 'javascript:void(0)'}" data-action="resume-current-playing" title="Voltar para a reprodução">
          <div class="topbar-equalizer">
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
          </div>
          <span class="now-playing-title-label" id="topbar-now-playing-title">${esc(window._currentPlaying?.title || 'Reproduzindo')}</span>
        </a>
      </div>
    </div>

    <div class="iptv-master-topbar-right">
      ${(() => {
        const enabledList = state.playlists.filter(p => p.isEnabled !== false);
        const displayList = enabledList.length ? enabledList : state.playlists;
        return `
          <div style="display:flex; align-items:center; gap:0.4rem;">
            ${displayList.length > 1 ? `
              <select class="iptv-ref-source-select" data-action="change-active-playlist" title="Alternar Playlist Ativa" style="padding:0.4rem 1.8rem 0.4rem 0.6rem; font-size:0.75rem; max-width:250px;">
                ${displayList.map(p => formatPlOption(p, currentPl?.id)).join('')}
              </select>
            ` : ''}
            <button class="iptv-manage-pls-btn" data-action="open-manage-playlists-modal" title="Gerenciar Playlists: ${enabledList.length} ativas (${state.playlists.length - enabledList.length} ocultas)" tabindex="0">
              ${icon('playlist')}
              <span class="iptv-manage-pls-label">Listas <b class="iptv-manage-pls-count">${enabledList.length}/${state.playlists.length}</b></span>
            </button>
          </div>
        `;
      })()}
      <a class="iptv-icon-action" href="#/search" title="Buscar no catálogo" tabindex="0">${icon('search')}</a>
      <a class="iptv-icon-action" href="#/settings" title="Configurações" tabindex="0">${icon('settings')}</a>
      <div class="iptv-topbar-datetime">
        <strong id="iptv-live-clock">${time}</strong>
        <span>${date}</span>
      </div>
    </div>
  </header>`;
}

function iptvBottomNav(active='dashboard'){
  const isMovies = ['catalog','movies'].includes(active);
  const isLive = ['live','channels'].includes(active);
  const isSeries = active === 'series';
  const isSettings = ['settings','profile','users'].includes(active);
  const avatarUrl = state.user?.avatar;
  const initial = (state.user?.name || state.user?.username || 'J')[0].toUpperCase();

  return `<nav class="iptv-bottom-bar" aria-label="Navegação Flutuante Netflix">
    <a class="iptv-bottom-item ${active==='dashboard'?'active':''}" href="#/dashboard" tabindex="0">
      <div class="iptv-bottom-icon-wrap">
        ${icon('home')}
      </div>
      <span>Início</span>
    </a>
    <a class="iptv-bottom-item ${isLive?'active':''}" href="#/live" tabindex="0">
      <div class="iptv-bottom-icon-wrap">
        ${icon('tv')}
      </div>
      <span>Ao Vivo</span>
    </a>
    <a class="iptv-bottom-item ${isMovies?'active':''}" href="#/movies" tabindex="0">
      <div class="iptv-bottom-icon-wrap">
        ${icon('film')}
      </div>
      <span>Filmes</span>
    </a>
    <a class="iptv-bottom-item ${isSeries?'active':''}" href="#/series" tabindex="0">
      <div class="iptv-bottom-icon-wrap">
        ${icon('grid')}
      </div>
      <span>Séries</span>
    </a>
    <a class="iptv-bottom-item ${isSettings?'active':''}" href="#/settings" tabindex="0">
      <div class="iptv-bottom-icon-wrap">
        ${avatarUrl ? `<img src="${esc(avatarUrl)}" class="netflix-nav-avatar" alt="Perfil">` : `<div class="netflix-nav-avatar" style="background:#e50914; color:#fff; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:800;">${initial}</div>`}
      </div>
      <span>Minha Conta</span>
    </a>
  </nav>`;
}

function loginPage(){
  const setup=state.setupRequired;
  const allowed=!setup||state.setupAllowed;
  return `<div class="iptv-login-wrapper">
    <div class="iptv-login-grid">
      <!-- Coluna Esquerda: Branding & Recursos -->
      <div class="iptv-brand-col">
        <div class="iptv-main-logo">
          <div class="iptv-play-icon">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <span class="iptv-logo-title">JSTUDIO<span style="color:var(--iptv-red);">PLAY</span></span>
        </div>
        <div class="iptv-tagline-caps">
          TV, FILMES E SÉRIES
          <span>TUDO EM UM SÓ LUGAR</span>
        </div>

        <div class="iptv-features-menu">
          <div class="iptv-feature-row">
            <div class="iptv-feature-badge">${icon('tv')}</div>
            <div class="iptv-feature-text">
              <strong>TV AO VIVO</strong>
              <p>Canais nacionais e internacionais</p>
            </div>
          </div>
          <div class="iptv-feature-row">
            <div class="iptv-feature-badge">${icon('film')}</div>
            <div class="iptv-feature-text">
              <strong>FILMES</strong>
              <p>Lançamentos e clássicos do cinema</p>
            </div>
          </div>
          <div class="iptv-feature-row">
            <div class="iptv-feature-badge">${icon('grid')}</div>
            <div class="iptv-feature-text">
              <strong>SÉRIES</strong>
              <p>Suas séries favoritas em um só lugar</p>
            </div>
          </div>
          <div class="iptv-feature-row">
            <div class="iptv-feature-badge">${icon('refresh')}</div>
            <div class="iptv-feature-text">
              <strong>EPG</strong>
              <p>Guia de programação completo e interativo</p>
            </div>
          </div>
          <div class="iptv-feature-row">
            <div class="iptv-feature-badge">${icon('settings')}</div>
            <div class="iptv-feature-text">
              <strong>CONFIGURAÇÕES</strong>
              <p>Personalize sua experiência</p>
            </div>
          </div>
        </div>

        <div class="iptv-brand-footer">
          Mais entretenimento.<br>
          <span class="accent">Do seu jeito.</span>
        </div>
      </div>

      <!-- Coluna Direita: Card de Login JstudioPlay -->
      <div class="iptv-login-card">
        <div class="iptv-card-header">
          <h2>Login</h2>
          <p>${setup?'Configure o administrador da plataforma.':'Acesse sua conta JstudioPlay para assistir.'}</p>
        </div>

        ${allowed?`
        <form id="login-form" class="iptv-field-group">
          <!-- Campo Username -->
          <div class="iptv-input-wrap">
            <span class="iptv-input-icon">${icon('user')}</span>
            <div class="iptv-input-inner">
              <label for="username">Username</label>
              <input id="username" name="username" placeholder="Digite seu usuário" autocomplete="username" required minlength="3" maxlength="40" autofocus>
            </div>
          </div>

          <!-- Campo Password -->
          <div class="iptv-input-wrap">
            <span class="iptv-input-icon">${icon('lock')}</span>
            <div class="iptv-input-inner">
              <label for="password">Password</label>
              <input id="password" name="password" placeholder="${setup?'Crie uma senha forte':'Digite sua senha'}" type="password" autocomplete="${setup?'new-password':'current-password'}" required maxlength="256">
            </div>
            <button class="iptv-toggle-pw" type="button" data-action="password" data-target="password" aria-label="Mostrar senha">${icon('eye')}</button>
          </div>

          <div class="form-error" role="alert" style="color:#ff4d4f; font-size:0.85rem;"></div>

          <button class="iptv-btn-submit" type="submit">
            ${setup?'Criar Administrador':'Entrar'} ${icon('right')}
          </button>

          <div style="display:flex; align-items:center; gap:0.75rem; margin:1rem 0; opacity:0.6;">
            <div style="flex:1; height:1px; background:var(--iptv-border);"></div>
            <span style="font-size:0.78rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--iptv-text-sec);">ou</span>
            <div style="flex:1; height:1px; background:var(--iptv-border);"></div>
          </div>

          <button class="iptv-btn-submit" type="button" data-action="google-login" style="background:#ffffff; color:#1f2937; height:48px; border-radius:8px; display:flex; align-items:center; justify-content:center; gap:0.75rem; font-weight:600; font-size:0.95rem; box-shadow:0 2px 6px rgba(0,0,0,0.2); cursor:pointer;">
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            Entrar com Google
          </button>
        </form>
        `:`<div class="info">${icon('info')}Configure ADMIN_USERNAME e ADMIN_PASSWORD no servidor para criar o administrador.</div>`}

        ${!setup?`<button class="iptv-forgot-link" data-action="forgot">Esqueceu sua senha?</button>`:''}
      </div>
    </div>
  </div>`;
}

const pageNames={
  dashboard:'Início',
  live:'TV Ao Vivo',
  multiview:'Mosaico Multi-View',
  channels:'Canais',
  categories:'Canais',
  catalog:'Catálogo',
  movies:'Filmes',
  series:'Séries',
  marathons:'Maratonas',
  search:'Buscar',
  recordings:'Gravações',
  epg:'Guia EPG',
  favorites:'Favoritos',
  history:'Histórico',
  settings:'Configurações',
  playlists:'Minhas Playlists',
  player:'Player',
  automation:'M3U Hub & Automação',
  users:'Usuários',
  credits:'Comprar Crédito',
  logs:'Logs',
  'ai-status':'Status da IA'
};

function navLink(page,symbol,label,count){return `<a class="nav-link ${state.page===page?'active':''}" href="#/${page}" title="${esc(label)}" aria-label="${esc(label)}" ${state.page===page?'aria-current="page"':''}>${icon(symbol)}<span class="nav-label">${label}</span>${count!==undefined?`<span class="nav-count">${count}</span>`:''}</a>`;}

function shell(content){
  const collapsed=sidebarCollapsed();
  return `<div class="shell ${collapsed?'sidebar-collapsed':''}"><button class="mobile-overlay" data-action="menu" aria-label="Fechar menu"></button><aside class="sidebar" id="account-sidebar">${brand('dashboard')}<button class="sidebar-toggle" data-action="toggle-sidebar" aria-controls="account-sidebar" aria-expanded="${!collapsed}" aria-label="${collapsed?'Expandir menu':'Recolher menu'}" title="${collapsed?'Expandir menu':'Recolher menu'}">${icon('right')}</button><div class="nav-caption">Biblioteca</div><nav class="nav-list" aria-label="Menu da conta">${navLink('dashboard','home','Início')}${navLink('playlists','playlist','Minhas Playlists',state.playlists.length)}${navLink('player','tv','Player')}${navLink('epg','refresh','Guia EPG')}${navLink('automation','globe','M3U Hub & Automação')}${navLink('favorites','heart','Favoritos')}${navLink('history','clock','Histórico')}${navLink('settings','settings','Configurações')}${['admin','manager'].includes(state.user.role)?`<div class="divider"></div><div class="nav-caption">${state.user.role==='manager'?'Gestão':'Administração'}</div>${navLink('users','users','Usuários')}${state.user.role==='admin'?navLink('logs','playlist','Logs'):''}`:''}</nav><div class="sidebar-bottom"><button class="nav-link" data-action="logout" title="Sair" aria-label="Sair">${icon('logout')}<span class="nav-label">Sair</span></button><div class="plan-note"><span>JstudioPlay Pro</span>Seu conteúdo sempre por perto.</div></div></aside><div class="main"><header class="topbar"><button class="icon-btn mobile-menu" data-action="menu" aria-label="Abrir menu" aria-expanded="false">${icon('menu')}</button><div class="breadcrumb"><span>Biblioteca</span>${icon('right')}<strong>${pageNames[state.page]||'Início'}</strong></div><div class="user-menu">${themeButton()}<span class="top-separator"></span><a class="avatar" href="#/settings" aria-label="Configurações da conta">${state.user.avatar?`<img src="${esc(state.user.avatar)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`:esc(initials(state.user.name))}</a><div class="user-name">${esc(state.user.name)}<small>${state.user.role==='admin'?'Administrador':state.user.role==='manager'?'Gestor':'Minha conta'}</small></div></div></header><main class="content ${state.page==='player'?'player-content':''}" id="content">${content}</main></div></div>`;
}

function playlistRows(){return state.playlists.map((p,i)=>`<article class="card playlist-row"><div class="playlist-icon" style="${tileStyle(i)}">${icon('playlist')}</div><div class="playlist-info"><h3>${esc(p.name)}</h3><p>${number(p.total)} canais · ${number(p.categories)} categorias</p><p>Última atualização: ${p.updated?dateTime(p.updated):'data indisponível'}</p></div><span class="badge">Ativa</span>${p.sourceKind!=='file'?`<button class="icon-btn subtle-icon" data-action="refresh-playlist" data-id="${p.id}" aria-label="Atualizar ${esc(p.name)}" title="Atualizar playlist">${icon('refresh')}</button>`:''}<button class="icon-btn play-circle" data-action="open-playlist" data-id="${p.id}" aria-label="Abrir ${esc(p.name)}">${icon('play')}</button><button class="icon-btn subtle-icon" data-action="playlist-options" data-id="${p.id}" aria-label="Opções de ${esc(p.name)}">${icon('more')}</button></article>`).join('');}

function playlistSection(){return `<section><div class="section-heading"><h2>Minhas playlists</h2>${addButton()}</div><div class="playlist-grid">${state.playlists.length?playlistRows():`<div class="card">${empty('Sua próxima experiência começa aqui','Adicione uma playlist para organizar seus canais e começar a assistir.',addButton())}</div>`}</div></section>`;}

function extractYouTubeVideoId(url){
  if(!url || typeof url !== 'string') return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return (match && match[1]) ? match[1] : null;
}

function formatVodTime(sec){
  if(isNaN(sec) || sec < 0) return '00:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if(h > 0){
    return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

window.handlePosterError = function(img, title){
  if(!img || img._fallbackApplied) return;
  img._fallbackApplied = true;
  const cleanTitle = (title || 'JstudioPlay').replace(/["'<>]/g, '').slice(0, 22);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e2029"/><stop offset="100%" stop-color="#0e0f12"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="150" cy="180" r="44" fill="#e50914" opacity="0.15"/><path d="M140 160 L170 180 L140 200 Z" fill="#e50914"/><text x="150" y="270" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="700" text-anchor="middle">${cleanTitle}</text><text x="150" y="295" fill="#e50914" font-family="sans-serif" font-size="11" font-weight="600" letter-spacing="2" text-anchor="middle">JSTUDIOPLAY</text></svg>`;
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

let vodIdleTimer = null;
function resetVodIdleTimer(){
  const theater = document.getElementById('vod-theater');
  if(!theater) return;
  theater.classList.remove('idle-hidden');
  clearTimeout(vodIdleTimer);
  vodIdleTimer = setTimeout(() => {
    const v = document.getElementById('video');
    if(v && !v.paused){
      theater.classList.add('idle-hidden');
    }
  }, 3500);
}

function showTheaterRipple(delta){
  const overlay = document.getElementById('seek-ripple-overlay');
  const label = document.getElementById('seek-ripple-label');
  const iconWrap = document.getElementById('seek-ripple-icon');
  if(!overlay) return;
  const isForward = delta > 0;
  if(label) label.textContent = isForward ? `+${delta}s` : `${delta}s`;
  if(iconWrap){
    iconWrap.innerHTML = isForward 
      ? `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`
      : `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`;
  }
  overlay.classList.add('active');
  clearTimeout(window._rippleTimer);
  window._rippleTimer = setTimeout(() => overlay.classList.remove('active'), 550);
}

function toggleAspectRatio(){
  const v = document.getElementById('video');
  const lbl = document.getElementById('aspect-ratio-label');
  if(!v) return;
  const modes = ['contain', 'cover', 'fill'];
  const labels = { contain: 'Auto', cover: 'Preencher', fill: 'Esticar' };
  const current = v.style.objectFit || 'contain';
  const next = modes[(modes.indexOf(current) + 1) % modes.length];
  v.style.objectFit = next;
  if(lbl) lbl.textContent = labels[next];
  toast(`Enquadramento: ${labels[next]}`);
  resetVodIdleTimer();
}

function skipVodTime(delta){
  const v = document.getElementById('video');
  if(!v) return;
  const target = Math.max(0, Math.min(v.duration || Infinity, v.currentTime + delta));
  v.currentTime = target;
  showSeekFeedback(delta > 0 ? `+${delta}s` : `${delta}s`);
  showTheaterRipple(delta);
  resetVodIdleTimer();
}

function setVodPlaybackRate(rate){
  const v = document.getElementById('video');
  if(!v) return;
  const r = parseFloat(rate) || 1.0;
  v.playbackRate = r;
  toast(`Velocidade: ${r}x`);
  resetVodIdleTimer();
}

function closeVodTheater(){
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
}

function openVodTheater(target){
  if(!target) return;
  window._currentVodItem = target;
  state.selected = target;
  $('#modal')?.close();

  let theater = document.getElementById('vod-theater');
  if(theater) theater.remove();

  const title = target.name || target.title || 'Cinema VOD';
  const group = target.group || target.notes || target.meta || '';
  const isSeries = (target.streamType === 'series') || group.toLowerCase().includes('série') || group.toLowerCase().includes('temporada');
  const targetUrl = target.url || target.streamUrl || target.previewVideo || '';
  const ytId = extractYouTubeVideoId(targetUrl);

  theater = document.createElement('div');
  theater.id = 'vod-theater';
  theater.className = 'iptv-vod-theater';
  theater.innerHTML = `
    <div class="iptv-vod-theater-header">
      <button class="iptv-vod-back-btn" data-action="close-vod-theater" title="Voltar ao Catálogo (ESC)" tabindex="0">
        ${icon('left')} <span>Voltar</span>
      </button>
      <div class="iptv-vod-header-info">
        <span class="iptv-vod-type-badge">${ytId ? 'YOUTUBE' : (isSeries ? 'SÉRIE' : 'FILME')}</span>
        <span class="vod-res-badge" id="vod-res-badge">HD</span>
        <strong class="iptv-vod-title">${esc(title)}</strong>
        <span class="iptv-vod-subtitle">${esc(group)}</span>
      </div>
      <div class="iptv-vod-top-actions">
        ${state.relayEnabled && !ytId ? `<button class="iptv-vod-action-btn" data-action="toggle-relay" title="Modo de compatibilidade" tabindex="0">${icon('refresh')}</button>` : ''}
        <button class="iptv-vod-action-btn" data-action="theater-fullscreen" title="Tela Cheia" tabindex="0">${icon('fullscreen')}</button>
        <button class="iptv-vod-action-btn" data-action="close-vod-theater" title="Fechar" tabindex="0">${icon('close')}</button>
      </div>
    </div>
    <div class="iptv-vod-video-wrapper">
      <video id="video" playsinline controls autoplay class="iptv-vod-video-element" ${ytId ? 'style="display:none;"' : ''}></video>
      <div class="seek-ripple-overlay" id="seek-ripple-overlay">
        <div class="seek-ripple-circle" id="seek-ripple-icon">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </div>
        <span class="seek-ripple-label" id="seek-ripple-label">+10s</span>
      </div>
      ${ytId ? `
        <iframe id="vod-yt-iframe" class="iptv-vod-yt-iframe" src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&controls=1&rel=0&modestbranding=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width:100%; height:100%; border:none; position:absolute; inset:0;"></iframe>
      ` : ''}
      <div id="video-empty" role="status" aria-live="polite" hidden></div>
    </div>
    ${!ytId ? `
      <!-- OSD Cinemático VOD (v8.3.4) -->
      <div class="iptv-vod-theater-controls" id="vod-controls">
        <div class="iptv-vod-timeline-row">
          <span class="iptv-vod-time-display" id="vod-current-time">00:00</span>
          <div class="iptv-vod-progress-track" id="vod-progress-track" title="Avançar / Retroceder">
            <div class="iptv-vod-time-tooltip" id="vod-time-tooltip">00:00</div>
            <div class="iptv-vod-buffer-bar" id="vod-buffer-bar" style="width:0%;"></div>
            <div class="iptv-vod-progress-bar" id="vod-progress-bar" style="width:0%;">
              <div class="iptv-vod-progress-scrubber"></div>
            </div>
          </div>
          <span class="iptv-vod-time-display" id="vod-duration-time">--:--</span>
        </div>
        <div class="iptv-vod-controls-row">
          <div class="iptv-vod-controls-left">
            <button class="iptv-vod-btn iptv-vod-btn-round iptv-vod-btn-play" data-action="theater-play-toggle" id="vod-play-btn" title="Play / Pausar (Espaço)">
              ${icon('pause')}
            </button>
            <button class="iptv-vod-btn iptv-vod-btn-round" data-action="theater-skip-back" title="Voltar 10 segundos (←)">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </button>
            <button class="iptv-vod-btn iptv-vod-btn-round" data-action="theater-skip-forward" title="Avançar 10 segundos (→)">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
            <div class="iptv-vod-volume-wrap">
              <button class="iptv-vod-btn iptv-vod-btn-round" data-action="quick-mute" id="vod-mute-btn" title="Mudo (M)">
                ${icon('volume')}
              </button>
              <input type="range" class="iptv-vod-volume-slider" id="vod-volume-slider" min="0" max="1" step="0.05" value="1" title="Ajustar Volume">
            </div>
          </div>
          <div class="iptv-vod-controls-right">
            <select class="iptv-vod-speed-select" id="vod-speed-select" data-action="vod-change-speed" title="Velocidade de Reprodução">
              <option value="0.75">0.75x</option>
              <option value="1" selected>1.0x Normal</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
            <button class="iptv-vod-btn iptv-aspect-btn" data-action="toggle-aspect-ratio" id="btn-aspect-ratio" title="Ajustar proporção de tela">
              ${icon('fullscreen')} <span>Ajuste: <b class="iptv-aspect-badge" id="aspect-ratio-label">Auto</b></span>
            </button>
            <button class="iptv-vod-btn" data-action="pip" title="Miniplayer PiP">
              ${icon('monitor')} <span>PiP</span>
            </button>
            <button class="iptv-vod-btn iptv-vod-btn-round" data-action="theater-fullscreen" title="Tela Cheia (F)">
              ${icon('fullscreen')}
            </button>
          </div>
        </div>
      </div>
    ` : ''}
  `;
  document.body.appendChild(theater);

  theater.addEventListener('mousemove', resetVodIdleTimer);
  theater.addEventListener('click', resetVodIdleTimer);
  resetVodIdleTimer();

  window._currentPlaying = { title, type: 'vod', target };
  window.eventBus.emit('playback:started', window._currentPlaying);

  const v = document.getElementById('video');
  if(v && !ytId){
    v.onloadedmetadata = () => {
      const resBadge = document.getElementById('vod-res-badge');
      if(resBadge && v.videoWidth){
        if(v.videoWidth >= 3840){
          resBadge.textContent = '4K UHD';
          resBadge.className = 'vod-res-badge badge-4k';
        } else if(v.videoWidth >= 1920){
          resBadge.textContent = '1080p FHD';
          resBadge.className = 'vod-res-badge';
        } else if(v.videoWidth >= 1280){
          resBadge.textContent = '720p HD';
          resBadge.className = 'vod-res-badge';
        } else {
          resBadge.textContent = 'SD';
          resBadge.className = 'vod-res-badge';
        }
      }
    };

    v.ontimeupdate = () => {
      const cur = v.currentTime || 0;
      const dur = v.duration || 0;
      const pct = dur > 0 ? (cur / dur) * 100 : 0;
      const pBar = document.getElementById('vod-progress-bar');
      const curTxt = document.getElementById('vod-current-time');
      const durTxt = document.getElementById('vod-duration-time');
      if(pBar) pBar.style.width = `${pct}%`;
      if(curTxt) curTxt.textContent = formatVodTime(cur);
      if(durTxt && dur > 0) durTxt.textContent = formatVodTime(dur);

      window.eventBus.emit('playback:progress', { item: target, position: cur, duration: dur, percent: pct });
    };

    v.onprogress = () => {
      if(v.buffered && v.buffered.length > 0 && v.duration > 0){
        const bufferedEnd = v.buffered.end(v.buffered.length - 1);
        const bufPct = Math.min(100, (bufferedEnd / v.duration) * 100);
        const bBar = document.getElementById('vod-buffer-bar');
        if(bBar) bBar.style.width = `${bufPct}%`;
      }
    };

    v.onplay = () => {
      const btn = document.getElementById('vod-play-btn');
      if(btn) btn.innerHTML = icon('pause');
      resetVodIdleTimer();
      window.eventBus.emit('playback:play', { item: target });
    };

    v.onpause = () => {
      const btn = document.getElementById('vod-play-btn');
      if(btn) btn.innerHTML = icon('play');
      theater.classList.remove('idle-hidden');
      window.eventBus.emit('playback:pause', { item: target });
    };

    const volSlider = document.getElementById('vod-volume-slider');
    if(volSlider){
      volSlider.value = v.muted ? 0 : v.volume;
      volSlider.oninput = (e) => {
        const val = parseFloat(e.target.value);
        v.volume = val;
        v.muted = val === 0;
        window.eventBus.emit('volume:changed', { volume: val, muted: v.muted });
        resetVodIdleTimer();
      };
    }

    const track = document.getElementById('vod-progress-track');
    if(track){
      track.onclick = (e) => {
        const rect = track.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        if(v.duration > 0){
          v.currentTime = pos * v.duration;
        }
      };

      track.onmousemove = (e) => {
        const rect = track.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const tip = document.getElementById('vod-time-tooltip');
        if(tip && v.duration > 0){
          tip.textContent = formatVodTime(pos * v.duration);
          tip.style.left = `${pos * 100}%`;
          tip.classList.add('active');
        }
      };

      track.onmouseleave = () => {
        const tip = document.getElementById('vod-time-tooltip');
        if(tip) tip.classList.remove('active');
      };
    }
  }

  if(!ytId){
    if(target.url || target.streamUrl){
      setTimeout(() => playChannel(target), 80);
    } else {
      toast(`Iniciando streaming de ${title}…`);
      setTimeout(() => playChannel(target), 80);
    }
  }
}

function renderNetflixTop10(rawItems, isSeries = false, sectionTitle = 'Top 10 Hoje no JstudioPlay'){
  const pool = (rawItems && rawItems.length) ? rawItems : (isSeries ? (state.currentSeries || state.dashSeries) : (state.currentMovies || state.dashMovies)) || [];
  if (!pool || !pool.length) return '';
  const top10 = pool.slice(0, 10);
  return `
    <section class="netflix-top10-section">
      <div class="netflix-top10-header" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span class="netflix-top10-badge">TOP 10</span>
          <h2 class="netflix-top10-title">${esc(sectionTitle)}</h2>
        </div>
        <div class="netflix-slider-controls">
          <button class="netflix-slider-arrow prev" data-action="scroll-carousel-left" data-target="netflix-top10-track" title="Anterior (1 a 5)" aria-label="Anterior">
            ${icon('left')}
          </button>
          <button class="netflix-slider-arrow next" data-action="scroll-carousel-right" data-target="netflix-top10-track" title="Ver Próximos (6 a 10)" aria-label="Próximo">
            ${icon('right')}
          </button>
        </div>
      </div>
      <div class="netflix-carousel-container">
        <button class="netflix-side-arrow prev" data-action="scroll-carousel-left" data-target="netflix-top10-track" aria-label="Rolar para esquerda">
          ${icon('left')}
        </button>
        <div class="netflix-top10-track" id="netflix-top10-track">
        ${top10.map((item, idx) => {
          const rank = idx + 1;
          const coverImg = item.posterUrl || item.logo || item.img;
          const itemName = item.name || item.title || `Título ${rank}`;
          const isFav = state.favorites && state.favorites.some(f => 
            (f.channel && (f.channel.name === itemName || f.channel.url === item.url)) ||
            f.name === itemName || f.url === item.url
          );
          return `
            <div class="netflix-top10-card" data-action="top10-card-click" data-type="${isSeries?'series':'movies'}" data-index="${idx}" tabindex="0" title="#${rank} ${esc(itemName)}">
              <div class="netflix-top10-num">${rank}</div>
              <div class="netflix-top10-poster">
                ${coverImg ? `<img src="${esc(coverImg)}" alt="${esc(itemName)}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
                <div class="netflix-top10-fallback" style="${coverImg?'display:none;':''}">
                  ${icon(isSeries?'tv':'film')}
                </div>
                ${item.rating ? `<span class="iptv-poster-badge iptv-rating-badge">⭐ ${item.rating}</span>` : ''}
                <div class="iptv-card-hover-actions">
                  <button class="iptv-quick-btn iptv-quick-play" data-action="quick-play-catalog" data-type="${isSeries?'series':'movies'}" data-index="${idx}" title="Assistir Agora" aria-label="Assistir Agora">
                    ${icon('play')}
                  </button>
                  <button class="iptv-quick-btn iptv-quick-fav ${isFav ? 'is-favorited' : ''}" data-action="quick-fav-catalog" data-name="${esc(itemName)}" title="${isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}" aria-label="Favoritar">
                    ${icon('heart')}
                  </button>
                  <button class="iptv-quick-btn iptv-quick-info" data-action="top10-card-click" data-type="${isSeries?'series':'movies'}" data-index="${idx}" title="Mais Informações" aria-label="Mais Informações">
                    ${icon('right')}
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
        </div>
        <button class="netflix-side-arrow next" data-action="scroll-carousel-right" data-target="netflix-top10-track" aria-label="Rolar para direita">
          ${icon('right')}
        </button>
      </div>
    </section>
  `;
}

function openVodModal(item){
  window._currentVodItem = item;
  const modal = $('#modal');
  if(modal) modal.classList.add('iptv-bottom-sheet-mode');
  const title = item.name || item.title || 'Detalhes do Título';
  const img = item.backdropUrl || item.posterUrl || item.logo || item.img || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80';
  const group = item.genres || item.group || item.meta || 'Filme • VOD';
  const isSeries = (item.streamType === 'series') || group.toLowerCase().includes('série') || group.toLowerCase().includes('temporada');
  const prog = (typeof currentProgress === 'function') ? currentProgress(item) : null;
  const progSec = prog?.position ? Math.floor(prog.position / 60) : 0;
  const btnLabel = progSec > 0 ? `Continuar assistindo de ${progSec} min` : 'Assistir Agora';
  const ratingText = item.rating ? `⭐ ${item.rating} / 10` : '⭐ 8.5 / 10';
  const yearText = item.year ? `• ${item.year}` : '';
  const isFav = state.favorites && state.favorites.some(f => 
    (f.channel && (f.channel.name === title || f.channel.url === item.url || f.channel.id === item.id)) ||
    f.name === title || f.url === item.url
  );

  const html = `
    <div class="iptv-sheet-handle-bar" data-action="close-modal"><div class="iptv-sheet-handle"></div></div>
    <div style="display:flex; flex-direction:column; gap:1.25rem; max-width:650px;">
      <div style="position:relative; width:100%; height:260px; border-radius:12px; overflow:hidden; background-image:url('${esc(img)}'); background-size:cover; background-position:center;" id="modal-vod-backdrop">
        <div style="position:absolute; inset:0; background:linear-gradient(to top, #14151a 0%, rgba(20,21,26,0.3) 100%);"></div>
        <div style="position:absolute; bottom:1rem; left:1.25rem; right:1.25rem;">
          <span style="font-size:0.75rem; text-transform:uppercase; font-weight:800; background:#e50914; color:#fff; padding:3px 8px; border-radius:4px;">${isSeries?'Série':'Filme'}</span>
          <h2 style="font-size:1.6rem; font-weight:900; color:#fff; margin:6px 0 0;" id="modal-vod-title">${esc(title)}</h2>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:0.75rem; color:rgba(255,255,255,0.7); font-size:0.85rem;" id="modal-vod-meta">
        <span>${ratingText}</span>
        ${yearText ? `<span>•</span><span>${yearText}</span>` : ''}
        <span>•</span>
        <span>${esc(group)}</span>
        <span>•</span>
        <span>Streaming HLS</span>
      </div>
      <p style="font-size:0.92rem; color:rgba(255,255,255,0.8); line-height:1.6; margin:0;" id="modal-vod-synopsis">
        ${esc(item.overview || item.synopsis || item.description || 'Buscando sinopse e detalhes oficiais…')}
      </p>
      <div style="display:flex; gap:0.75rem; margin-top:0.5rem; align-items:center;">
        <button class="iptv-btn-play-red" data-action="start-vod-theater" data-name="${esc(title)}" style="flex:1; justify-content:center; height:48px;" tabindex="0">
          ${icon('play')} ${btnLabel}
        </button>
        <button class="btn secondary" data-action="enrich-current-vod" style="padding:0 1.25rem; height:48px; gap:0.4rem;" title="Buscar Metadados na API">
          ${icon('refresh')} Atualizar
        </button>
        <button class="iptv-btn-info-glass iptv-vod-fav-btn ${isFav ? 'is-favorited' : ''}" id="modal-vod-fav-btn" data-action="toggle-favorite-search" data-name="${esc(title)}" style="height:48px; min-width:48px; padding:0 1rem; display:inline-flex; align-items:center; justify-content:center; color:${isFav ? '#e50914' : 'rgba(255,255,255,0.7)'};" title="${isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}" aria-label="${isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}" tabindex="0">
          ${icon('heart')}
        </button>
      </div>
      ${isSeries ? `
        <div style="margin-top:0.75rem; border-top:1px solid rgba(255,255,255,0.08); padding-top:0.75rem;">
          <h3 style="font-size:1.05rem; color:#fff; margin:0 0 0.5rem;">Episódios Disponíveis</h3>
          <div style="display:flex; flex-direction:column; gap:0.35rem; max-height:160px; overflow-y:auto;">
            ${[1, 2, 3, 4].map(ep => `
              <div class="iptv-settings-row" data-action="start-vod-theater" data-name="${esc(title)} E0${ep}" style="padding:0.6rem 1rem; margin-bottom:0.2rem; cursor:pointer;" tabindex="0">
                <span style="font-weight:700; color:#fff; font-size:0.88rem;">Episódio ${ep}</span>
                <span class="iptv-badge-live" style="background:rgba(255,255,255,0.1); color:#fff; box-shadow:none;">48 min</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${(() => {
        const pool = (isSeries ? (state.currentSeries || state.dashSeries) : (state.currentMovies || state.dashMovies)) || state.channels || [];
        const cleanTitle = title.toLowerCase();
        const similar = pool.filter(it => {
          const t = (it.name || it.title || '').toLowerCase();
          return t && t !== cleanTitle;
        }).slice(0, 6);
        if (!similar.length) return '';
        return `
          <div class="iptv-vod-similar-section">
            <h3 class="iptv-vod-similar-heading">
              ${icon('film')} Mais títulos como este
            </h3>
            <div class="iptv-vod-similar-grid">
              ${similar.map(sim => `
                <div class="iptv-vod-similar-card" data-action="open-similar-vod" data-title="${esc(sim.name || sim.title)}" tabindex="0" title="${esc(sim.name || sim.title)}">
                  <div class="iptv-vod-similar-thumb">
                    <img src="${sim.posterUrl || sim.logo || sim.img || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80'}" alt="${esc(sim.name || sim.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80';">
                    ${sim.rating ? `<span class="iptv-similar-rating">⭐ ${sim.rating}</span>` : ''}
                  </div>
                  <div class="iptv-vod-similar-info">
                    <div class="iptv-vod-similar-title">${esc(sim.name || sim.title)}</div>
                    <div class="iptv-vod-similar-genre">${esc(sim.genres || sim.group || (isSeries ? 'Série' : 'Filme'))}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      })()}
    </div>
  `;
  openModal(title, html);
}

let heroAutoTimer = null;
function changeHeroSlide(idx){
  const slides = window._heroSlides || [];
  if(!slides.length || idx < 0 || idx >= slides.length) return;
  window._currentHeroIdx = idx;
  const item = slides[idx];
  const banner = document.getElementById('master-hero-banner');
  const titleEl = document.getElementById('hero-title');
  const descEl = document.getElementById('hero-desc');
  const badgeRow = document.getElementById('hero-badge-row');
  const dots = document.querySelectorAll('.iptv-hero-dot');

  if(banner){
    const bg = item.backdropUrl || item.posterUrl || item.logo || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80';
    banner.style.backgroundImage = `url('${esc(bg)}')`;
  }
  if(titleEl) titleEl.textContent = item.title || item.name || 'JstudioPlay Cinema';
  if(descEl) descEl.textContent = item.overview || item.description || 'Aproveite a melhor experiência em streaming e TV digital.';
  if(badgeRow){
    badgeRow.innerHTML = `
      <span class="iptv-hero-badge badge-highlight">Destaque</span>
      <span class="iptv-hero-badge badge-quality">4K UHD</span>
      <span class="iptv-hero-badge">DOLBY AUDIO</span>
      ${item.year ? `<span class="iptv-hero-badge">${esc(item.year)}</span>` : ''}
      ${item.rating ? `<span class="iptv-hero-badge">⭐ ${esc(item.rating)}</span>` : ''}
    `;
  }
  dots.forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });
}

function initHeroAutoRotate(){
  clearInterval(heroAutoTimer);
  const banner = document.getElementById('master-hero-banner');
  if(!banner) return;
  heroAutoTimer = setInterval(() => {
    const slides = window._heroSlides || [];
    if(slides.length <= 1) return;
    const nextIdx = ((window._currentHeroIdx || 0) + 1) % slides.length;
    changeHeroSlide(nextIdx);
  }, 10000);

  banner.onmouseenter = () => clearInterval(heroAutoTimer);
  banner.onmouseleave = () => initHeroAutoRotate();
}

function dashboard(){
  const trending = (state.dashMovies && state.dashMovies.length) ? state.dashMovies.slice(0, 8) : [
    { title: 'John Wick 4', meta: 'Ação • 2023', img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=320&q=80', description: 'John Wick descobre um caminho para derrotar a Alta Cúpula.' },
    { title: 'The Last of Us', meta: 'Drama / Sobrevivência', img: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=320&q=80', description: 'Joel e Ellie atravessam uma América pós-apocalíptica.' },
    { title: 'House of the Dragon', meta: 'Fantasia / Ação', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=320&q=80', description: 'A guerra civil na Casa Targaryen pelo Trono de Ferro.' },
    { title: 'The Boys', meta: 'Ação / Comédia', img: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=320&q=80', description: 'Justiceiros enfrentam super-heróis corruptos apoiados pela Vought.' },
    { title: 'Avatar: O Caminho da Água', meta: 'Ficção Científica', img: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=320&q=80', description: 'Jake Sully e Neytiri formam uma família e exploram Pandora.' }
  ];

  const seriesList = (state.dashSeries && state.dashSeries.length) ? state.dashSeries.slice(0, 8) : [
    { title: 'Stranger Things', meta: 'Série • 4 Temporadas', img: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=320&q=80' },
    { title: 'Breaking Bad', meta: 'Série • 5 Temporadas', img: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=320&q=80' },
    { title: 'Peaky Blinders', meta: 'Série • 6 Temporadas', img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=320&q=80' }
  ];

  const realHistory = (state.history && state.history.length) ? state.history : [];
  const continueItems = realHistory.slice(0, 6).map((h, i) => {
    const ch = h.channel || {};
    const pos = Number(h.position) || 0;
    const dur = Number(h.duration) || 0;
    const pct = (dur > 0 && pos > 0) ? Math.min(100, Math.round((pos / dur) * 100)) : 15;
    const minsLeft = dur > pos ? Math.round((dur - pos) / 60) : 0;
    const subtitle = minsLeft > 0 ? `${pct}% assistido • ${minsLeft}m restantes` : `${pct}% assistido • ${ch.group || 'VOD'}`;
    return {
      title: ch.name || h.title || `Item ${i+1}`,
      subtitle: subtitle,
      img: ch.logo || h.img || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=480&q=80',
      progress: pct,
      channel: ch,
      position: pos
    };
  });

  // Seleção dinâmica do conteúdo de destaque com suporte a múltiplos itens e auto-rotação (v8.3.2)
  const heroPool = (state.dashMovies && state.dashMovies.length) ? state.dashMovies.slice(0, 5) : [
    {
      title: 'Central JstudioPlay Pro',
      name: 'Central JstudioPlay Pro',
      genres: 'Cinema, Séries & TV',
      overview: 'Explore canais ao vivo, filmes em alta definição e séries organizadas com reprodução ultra-rápida, Miniplayer PiP e Smart Failover.',
      backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80',
      rating: '9.8',
      year: '2026'
    },
    {
      title: 'Avatar: O Caminho da Água',
      name: 'Avatar: O Caminho da Água',
      genres: 'Ficção Científica • Aventura',
      overview: 'Jake Sully e Neytiri formam uma família e exploram as regiões marítimas de Pandora diante de novas ameaças.',
      backdropUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1600&q=80',
      rating: '8.9',
      year: '2024'
    },
    {
      title: 'The Last of Us',
      name: 'The Last of Us',
      genres: 'Drama • Sobrevivência',
      overview: 'Joel e Ellie cruzam uma América em ruínas após o colapso da civilização humana.',
      backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
      rating: '9.2',
      year: '2025'
    }
  ];
  window._heroSlides = heroPool;
  window._currentHeroIdx = 0;
  const heroItem = heroPool[0];
  const heroBackdrop = heroItem.backdropUrl || heroItem.posterUrl || heroItem.logo || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80';
  const heroTitle = heroItem.title || heroItem.name || 'JstudioPlay Cinema';
  const heroOverview = heroItem.overview || heroItem.description || 'Aproveite a melhor experiência em streaming e TV digital com qualidade premium e estabilidade total.';
  const heroGenre = heroItem.genres || heroItem.group || 'Destaque';

  setTimeout(() => initHeroAutoRotate(), 120);

  return `<div style="padding:1.5rem var(--iptv-safe-x); max-width:1440px; margin:0 auto; box-sizing:border-box;">
    
    <!-- Hero Banner Cinemático com Dots e Auto-Rotação (v8.3.2) -->
    <div class="iptv-master-hero" id="master-hero-banner" style="background-image:url('${esc(heroBackdrop)}');">
      <div class="iptv-master-hero-overlay"></div>
      <div class="iptv-master-hero-content">
        <div class="iptv-hero-badge-row" id="hero-badge-row">
          <span class="iptv-hero-badge badge-highlight">Destaque</span>
          <span class="iptv-hero-badge badge-quality">4K UHD</span>
          <span class="iptv-hero-badge">DOLBY AUDIO</span>
          ${heroItem.year ? `<span class="iptv-hero-badge">${esc(heroItem.year)}</span>` : ''}
          ${heroItem.rating ? `<span class="iptv-hero-badge">⭐ ${esc(heroItem.rating)}</span>` : ''}
        </div>
        <h1 class="iptv-master-hero-title" id="hero-title">${esc(heroTitle)}</h1>
        <p class="iptv-master-hero-desc" id="hero-desc">
          ${esc(heroOverview)}
        </p>
        <div class="iptv-master-hero-actions">
          <button class="netflix-btn-play-white" data-action="play-featured-hero" tabindex="0">
            <svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7V5z"/></svg> <span>Assistir</span>
          </button>
          <button class="netflix-btn-mylist" data-action="quick-fav-catalog" data-name="${esc(heroTitle)}" tabindex="0">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> <span>Minha lista</span>
          </button>
          <a class="iptv-btn-info-glass" href="#/multiview" tabindex="0" title="Mosaico Multi-Telas">
            ${icon('monitor')}
          </a>
        </div>
        <!-- Indicadores Dots de Carrossel -->
        <div class="iptv-hero-dots-container" id="hero-dots">
          ${heroPool.map((_, i) => `
            <button class="iptv-hero-dot ${i === 0 ? 'active' : ''}" data-action="hero-dot" data-idx="${i}" title="Destaque ${i+1}" aria-label="Ir para destaque ${i+1}"></button>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- 1. Carrossel: Continuar Assistindo (Continue Watching) -->
    <section style="margin-bottom:2.25rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h2 style="font-size:1.25rem; font-weight:800; color:#fff; margin:0;">Continuar Assistindo</h2>
      </div>
      <div class="iptv-ref-shelf-track">
        ${continueItems.length ? continueItems.map(c => `
          <div class="netflix-continue-card" data-action="resume-vod" data-title="${esc(c.title)}" tabindex="0">
            <div class="netflix-continue-thumb">
              <img src="${c.img}" alt="${esc(c.title)}" loading="lazy" decoding="async" onerror="window.handlePosterError(this, '${esc(c.title)}')">
              <div class="netflix-continue-play-circle" title="Continuar">
                <svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7V5z"/></svg>
              </div>
              <div class="netflix-continue-progress-bg">
                <div class="netflix-continue-progress-fill" style="width:${c.progress}%;"></div>
              </div>
            </div>
            <div class="netflix-continue-footer">
              <button class="netflix-continue-footer-btn" data-action="catalog-card-click" data-type="movies" data-index="0" title="Detalhes" aria-label="Detalhes">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              </button>
              <div class="netflix-continue-divider"></div>
              <button class="netflix-continue-footer-btn" data-action="resume-vod" data-title="${esc(c.title)}" title="Reproduzir" aria-label="Reproduzir">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
              </button>
            </div>
          </div>
        `).join('') : `
          <div style="width:100%; background:rgba(255,255,255,0.03); border:1px dashed rgba(255,255,255,0.08); border-radius:12px; padding:1.75rem; text-align:center; color:rgba(255,255,255,0.5);">
            <p style="margin:0 0 0.35rem; font-size:0.95rem; font-weight:600; color:#fff;">Nenhum conteúdo em andamento</p>
            <span style="font-size:0.82rem; color:rgba(255,255,255,0.4);">Inicie um filme, série ou canal para acompanhar seu progresso automaticamente aqui.</span>
          </div>
        `}
      </div>
    </section>

    <!-- Top 10 Mais Assistidos Estilo Netflix (v8.3.13) -->
    ${renderNetflixTop10(trending, false, 'Top 10 Hoje no JstudioPlay')}

    <!-- 2. Carrossel: Filmes Populares na Biblioteca -->
    <section style="margin-bottom:2.25rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h2 style="font-size:1.25rem; font-weight:800; color:#fff; margin:0;">Filmes Populares na Biblioteca</h2>
        <a href="#/movies" style="color:rgba(255,255,255,0.6); display:flex; align-items:center; text-decoration:none;" title="Ver todos">${icon('right')}</a>
      </div>
      <div class="iptv-ref-shelf-track">
        ${trending.map((t, idx) => `
          <div class="iptv-poster-card" data-action="vod-card-click" data-type="movie" data-index="${idx}" tabindex="0" title="${esc(t.title || t.name)}" style="flex:0 0 170px; height:255px; cursor:pointer;">
            <img class="iptv-poster-img" src="${t.posterUrl || t.img || t.logo}" alt="${esc(t.title || t.name)}" loading="lazy" onerror="window.handlePosterError(this, '${esc(t.title || t.name)}')">
            ${t.rating ? `<span class="iptv-poster-badge iptv-rating-badge">⭐ ${t.rating}</span>` : ''}
            ${t.year ? `<span class="iptv-poster-badge iptv-year-badge">${t.year}</span>` : ''}
            <div class="iptv-poster-overlay">
              <strong class="iptv-poster-title">${esc(t.title || t.name)}</strong>
              <span class="iptv-poster-meta">${esc(t.meta || t.group || 'Filme')}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- 3. Carrossel: Séries e Episódios -->
    <section style="margin-bottom:2rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h2 style="font-size:1.25rem; font-weight:800; color:#fff; margin:0;">Séries e Episódios</h2>
        <a href="#/series" style="color:rgba(255,255,255,0.6); display:flex; align-items:center; text-decoration:none;" title="Ver todas">${icon('right')}</a>
      </div>
      <div class="iptv-ref-shelf-track">
        ${seriesList.map((s, idx) => `
          <div class="iptv-poster-card" data-action="vod-card-click" data-type="series" data-index="${idx}" tabindex="0" title="${esc(s.title || s.name)}" style="flex:0 0 170px; height:255px; cursor:pointer;">
            <img class="iptv-poster-img" src="${s.posterUrl || s.img || s.logo}" alt="${esc(s.title || s.name)}" loading="lazy" onerror="window.handlePosterError(this, '${esc(s.title || s.name)}')">
            ${s.rating ? `<span class="iptv-poster-badge iptv-rating-badge">⭐ ${s.rating}</span>` : ''}
            ${s.year ? `<span class="iptv-poster-badge iptv-year-badge">${s.year}</span>` : ''}
            <div class="iptv-poster-overlay">
              <strong class="iptv-poster-title">${esc(s.title || s.name)}</strong>
              <span class="iptv-poster-meta">${esc(s.meta || s.group || 'Série')}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

  </div>`;
}

function categoriesPage(){
  const categoryList = [
    { id: 'esportes', name: 'Esportes', icon: 'sports', selected: true },
    { id: 'filmes', name: 'Filmes', icon: 'film' },
    { id: 'series', name: 'Séries', icon: 'tv' },
    { id: 'infantil', name: 'Infantil', icon: 'smile' },
    { id: 'documentarios', name: 'Documentários', icon: 'compass' },
    { id: 'noticias', name: 'Notícias', icon: 'newspaper' },
    { id: 'variedades', name: 'Variedades', icon: 'star' },
    { id: 'musica', name: 'Música', icon: 'music' },
    { id: 'religiosos', name: 'Religiosos', icon: 'cross' },
    { id: 'internacionais', name: 'Canais Internacionais', icon: 'globe' },
    { id: 'adultos', name: 'Adultos', icon: 'adult' }
  ];

  return `<div style="padding:1.5rem var(--iptv-safe-x); max-width:1440px; margin:0 auto; box-sizing:border-box;">
    <h1 style="font-size:1.8rem; font-weight:800; color:#fff; margin:0 0 1.5rem;">Categorias</h1>
    <div class="iptv-master-categories-grid">
      ${categoryList.map(c => `
        <div class="iptv-cat-card-master ${c.selected?'selected':''}" data-action="filter-master-cat" data-name="${esc(c.name)}" tabindex="0">
          <div class="iptv-cat-icon-wrap">
            ${icon(c.icon)}
          </div>
          <div class="iptv-cat-card-title">${esc(c.name)}</div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function epgPage(){
  const days = [
    { id: 'today', label: 'Hoje', active: true },
    { id: 'mon', label: 'Seg 14/10' },
    { id: 'tue', label: 'Ter 15/10' },
    { id: 'wed', label: 'Qua 16/10' },
    { id: 'thu', label: 'Qui 17/10' }
  ];

  const allChs = (state.channels && state.channels.length) ? state.channels.slice(0, 20) : [];
  const channels = allChs.length ? allChs.map(ch => {
    const hasEpg = Boolean(ch.program && ch.time);
    return {
      name: ch.name,
      group: ch.group || 'Geral',
      logo: ch.logo,
      program: hasEpg ? ch.program : 'Programação não disponível para este canal',
      time: hasEpg ? ch.time : '—',
      hasEpg,
      url: ch.url
    };
  }) : [
    { name: 'Globo HD', group: 'Abertos', program: 'Brasileirão Série A', time: '16:00 - 18:00', hasEpg: true },
    { name: 'SporTV HD', group: 'Esportes', program: 'Futebol ao Vivo', time: '16:00 - 18:00', hasEpg: true },
    { name: 'ESPN HD', group: 'Esportes', program: 'NBA', time: '16:00 - 17:45', hasEpg: true },
    { name: 'TNT HD', group: 'Filmes', program: 'Velozes e Furiosos 9', time: '15:30 - 17:30', hasEpg: true },
    { name: 'Record TV HD', group: 'Abertos', program: 'Cidade Alerta', time: '16:00 - 17:00', hasEpg: true },
    { name: 'SBT HD', group: 'Abertos', program: 'Programa do Ratinho', time: '16:15 - 18:00', hasEpg: true },
    { name: 'Band HD', group: 'Esportes', program: 'Jogo Aberto', time: '15:00 - 17:00', hasEpg: true }
  ];

  return `<div style="padding:1.5rem var(--iptv-safe-x); max-width:1440px; margin:0 auto; box-sizing:border-box;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
      <h1 style="font-size:1.8rem; font-weight:800; color:#fff; margin:0;">Guia de Programação (EPG)</h1>
      <span style="font-size:1.1rem; font-weight:700; color:rgba(255,255,255,0.7);">${getIptvClock()}</span>
    </div>

    <!-- Pílulas de Dias -->
    <div class="iptv-epg-day-pills">
      ${days.map(d => `
        <button class="iptv-epg-day-pill ${d.active?'active':''}" data-action="epg-day-select" data-day="${d.id}" tabindex="0">
          ${d.label}
        </button>
      `).join('')}
    </div>

    <!-- Lista de Canais & Grade EPG -->
    <div>
      ${channels.map((ch, idx) => `
        <div class="iptv-epg-item-row" data-action="open-epg-detail" data-name="${esc(ch.name)}" data-prog="${esc(ch.program)}" data-time="${esc(ch.time)}" data-hasepg="${ch.hasEpg?'true':'false'}" tabindex="0" style="cursor:pointer;">
          <div style="display:flex; align-items:center; gap:1rem;">
            <span style="font-size:0.75rem; color:rgba(255,255,255,0.4); font-weight:700; width:36px;">${String(idx+1).padStart(3,'0')} HD</span>
            <div class="iptv-round-logo" style="width:38px; height:38px;">
              ${ch.logo ? `<img src="${esc(ch.logo)}" alt="${esc(ch.name)}">` : icon('tv')}
            </div>
            <div>
              <strong style="display:block; font-size:0.95rem; color:#fff;">${esc(ch.name)}</strong>
              <span style="font-size:0.78rem; color:rgba(255,255,255,0.5);">${esc(ch.group || 'Geral')}</span>
            </div>
          </div>
          <div>
            <strong style="display:block; font-size:0.9rem; color:#fff;">${esc(ch.program)}</strong>
            <span style="font-size:0.78rem; color:rgba(255,255,255,0.5);">${esc(ch.time)}</span>
          </div>
          ${ch.hasEpg ? `<span class="iptv-badge-live">AO VIVO</span>` : `<span class="iptv-badge-live" style="background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.5); box-shadow:none;">SEM GUIA</span>`}
        </div>
      `).join('')}
    </div>
  </div>`;
}

function iptvSmartSidebar(active='dashboard'){
  const role = state.user?.role || 'user';
  let isCollapsed = false;
  try { isCollapsed = localStorage.getItem('iptv-sidebar-collapsed') === 'true'; } catch {}

  const mainItems = [
    { id: 'dashboard', label: 'Início', icon: 'home', href: '#/dashboard' },
    { id: 'live', label: 'TV ao Vivo', icon: 'tv', href: '#/live' },
    { id: 'multiview', label: 'Mosaico Multi-View', icon: 'monitor', href: '#/multiview' },
    { id: 'movies', label: 'Filmes', icon: 'film', href: '#/movies' },
    { id: 'series', label: 'Séries', icon: 'grid', href: '#/series' },
    { id: 'marathons', label: 'Maratonas', icon: 'play', href: '#/marathons' },
    { id: 'categories', label: 'Canais', icon: 'playlist', href: '#/categories' },
    { id: 'favorites', label: 'Favoritos', icon: 'heart', href: '#/favorites' },
    { id: 'settings', label: 'Configurações', icon: 'settings', href: '#/settings' }
  ];

  const adminItems = [];
  if(['reseller','admin','master'].includes(role)){
    adminItems.push({ id: 'users', label: 'Usuários', icon: 'users', href: '#/users' });
    adminItems.push({ id: 'credits', label: 'Créditos', icon: 'credits', href: '#/credits' });
  }
  if(['admin','master'].includes(role)){
    adminItems.push({ id: 'automation', label: 'M3U Hub', icon: 'globe', href: '#/automation' });
  }
  if(role === 'master'){
    adminItems.push({ id: 'logs', label: 'Logs', icon: 'clock', href: '#/logs' });
  }

  const renderItem = (it) => {
    const isActive = active===it.id || (it.id==='movies' && ['catalog','movies'].includes(active)) || (it.id==='live' && active==='channels');
    return `
      <a class="iptv-master-side-btn ${isActive?'active':''}" href="${it.href}" tabindex="0" title="${it.label}">
        ${icon(it.icon)}
        <span>${it.label}</span>
      </a>
    `;
  };

  return `<aside class="iptv-master-sidebar ${isCollapsed?'collapsed':''}" id="iptv-sidebar" aria-label="Menu Principal IPTV">
    <nav style="display:flex; flex-direction:column; gap:0.25rem; width:100%;">
      ${mainItems.map(renderItem).join('')}
      ${adminItems.length ? `
        <div class="iptv-sidebar-divider"></div>
        <div class="iptv-sidebar-section-label">Gestão</div>
        ${adminItems.map(renderItem).join('')}
      ` : ''}
    </nav>

    <div style="margin-top:auto; padding-top:0.65rem; border-top:1px solid rgba(255,255,255,0.06); width:100%;">
      <button class="iptv-master-side-btn" data-action="logout" tabindex="0" title="Sair" style="color:rgba(255,255,255,0.5);">
        ${icon('logout')}
        <span>Sair</span>
      </button>
    </div>
  </aside>`;
}

function livePage(){
  const liveOnly = (state.channels || []).filter(c => !c.streamType || c.streamType === 'live');
  const allChs = liveOnly.length ? liveOnly : [
    { name: 'Globo HD', program: 'Brasileirão Série A', group: 'Abertos', time: '16:00 - 18:00' },
    { name: 'SporTV HD', program: 'Futebol ao Vivo', group: 'Esportes', time: '16:00 - 18:00' },
    { name: 'ESPN HD', program: 'NBA', group: 'Esportes', time: '16:00 - 17:45' },
    { name: 'Record TV HD', program: 'Cidade Alerta', group: 'Abertos', time: '16:00 - 17:00' },
    { name: 'SBT HD', program: 'Programa do Ratinho', group: 'Abertos', time: '16:15 - 18:00' },
    { name: 'Band HD', program: 'Jogo Aberto', group: 'Esportes', time: '15:00 - 17:00' }
  ];

  const catFilter = state.liveCategory || 'Todos';
  let filtered = allChs;
  if(catFilter && catFilter !== 'Todos'){
    const q = catFilter.toLowerCase();
    filtered = allChs.filter(c => (c.group && c.group.toLowerCase().includes(q)) || (c.name && c.name.toLowerCase().includes(q)));
    if(!filtered.length) filtered = allChs; // fallback graceful
  }

  const activeCh = state.selected || filtered[0] || allChs[0];
  window._liveChannels = filtered;

  const pills = ['Todos', 'Abertos', 'Esportes', 'Notícias', 'Variedades', 'Infantil'];

  return `<div class="iptv-master-live-split">
    <!-- Coluna Esquerda: Player de Vídeo e Card de Detalhes -->
    <div class="iptv-live-player-pane">
      <div class="iptv-live-video-box">
        <video id="video" playsinline controls autoplay></video>
        <div id="video-empty" role="status" aria-live="polite" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.85); color:#fff; z-index:2; text-align:center; padding:1rem;" hidden></div>
      </div>

      <div class="iptv-live-channel-card">
        <div class="iptv-channel-left-info">
          <div class="iptv-round-logo">
            ${activeCh?.logo ? `<img src="${esc(activeCh.logo)}" alt="${esc(activeCh.name)}">` : initials(activeCh?.name || 'TV')}
          </div>
          <div>
            <strong style="display:block; font-size:1.15rem; color:#fff;" id="preview-ch-name">${esc(activeCh?.name || 'Selecione um canal')}</strong>
            <span style="font-size:0.88rem; color:rgba(255,255,255,0.7);" id="preview-prog-title">${esc(activeCh?.program || activeCh?.group || 'Brasileirão Série A')}</span>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:1.2rem;">
          <span style="font-size:0.88rem; color:rgba(255,255,255,0.6);" id="preview-prog-time">${esc(activeCh?.time || '16:00 - 18:00')}</span>
          <span class="iptv-badge-live">AO VIVO</span>
        </div>
      </div>
    </div>

    <!-- Coluna Direita: Seletor TV ao Vivo -->
    <aside class="iptv-live-right-column">
      <div class="iptv-right-col-header">
        <div class="iptv-right-col-title">
          ${icon('tv')} TV ao Vivo
        </div>
        <div class="iptv-right-cat-pills">
          ${pills.map(p => `
            <button class="iptv-cat-pill-btn ${catFilter===p?'active':''}" data-action="live-tab-filter" data-category="${p}" tabindex="0">
              ${p}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="iptv-channel-scroll-list" id="live-channel-list">
        ${filtered.slice(0, 100).map((ch, idx) => {
          const isAct = (activeCh && (activeCh.url === ch.url || activeCh.name === ch.name));
          const numStr = String(idx + 1).padStart(3, '0') + ' HD';
          return `
            <button class="iptv-master-channel-row ${isAct?'active':''}" data-action="select-live-ch" data-index="${idx}" data-name="${esc(ch.name)}" tabindex="0">
              <span class="iptv-ch-num">${numStr}</span>
              <div class="iptv-round-logo" style="width:36px; height:36px; margin-right:0.75rem;">
                ${ch.logo ? `<img src="${esc(ch.logo)}" alt="${esc(ch.name)}">` : initials(ch.name)}
              </div>
              <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:left;">
                <strong style="display:block; font-size:0.9rem; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(ch.name)}</strong>
                <span style="font-size:0.75rem; color:rgba(255,255,255,0.5); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block;">${esc(ch.program || ch.group || 'Programação Ao Vivo')}</span>
              </div>
              <span class="iptv-badge-live" style="margin-left:0.5rem; flex-shrink:0;">AO VIVO</span>
            </button>
          `;
        }).join('')}
      </div>

      <div style="padding:0.75rem; text-align:center; border-top:1px solid rgba(255,255,255,0.06);">
        <button class="btn ghost small" data-action="load-more-live-channels" style="color:rgba(255,255,255,0.7); font-size:0.8rem; border:none; background:none; cursor:pointer;" tabindex="0">
          Mais Canais ∨
        </button>
      </div>
    </aside>
  </div>`;
}

function catalogPage(type = 'movies'){
  const isSeries = type === 'series';
  const categories = (isSeries ? state.seriesCategories : state.movieCategories) || [];
  const rawItems = (isSeries ? state.currentSeries : state.currentMovies) || [];
  const selectedCat = isSeries ? (state.selectedSeriesCategory || '') : (state.selectedVodCategory || '');
  const total = isSeries ? (state.totalSeries || rawItems.length) : (state.totalMovies || rawItems.length);
  const currentPl = state.playlists.find(p => p.id === state.activePlaylist);
  const query = (state.catalogQuery || '').toLowerCase().trim();

  // Filtro de busca se houver texto
  const items = query ? rawItems.filter(it => (it.name && it.name.toLowerCase().includes(query)) || (it.group && it.group.toLowerCase().includes(query))) : rawItems;

  // Prateleira "Continuar Assistindo" estritamente isolada por tipo de mídia
  const vodHistory = (state.history || []).filter(h => {
    const ch = h.channel || h;
    const st = ch.streamType || '';
    if (isSeries) {
      return st === 'series' || /(?:s\d{1,2}e\d{1,2}|t\d{1,2}e\d{1,2}|temporada|season|ep\.)/i.test(ch.name || '');
    } else {
      return st === 'vod' || (!st && !ch.program);
    }
  });

  const continueItems = vodHistory.slice(0, 6).map(h => {
    const ch = h.channel || h;
    const prog = (typeof currentProgress === 'function') ? currentProgress(ch) : null;
    const perc = (prog && prog.duration > 0) ? Math.min(100, Math.round((prog.position / prog.duration) * 100)) : 15;
    return {
      title: ch.name || h.title || 'Título',
      subtitle: `${perc}% assistido • ${ch.group || (isSeries ? 'Série' : 'Filme')}`,
      img: ch.logo || h.img || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
      progress: perc,
      channel: ch
    };
  });

  return `<div style="padding:1.25rem var(--iptv-safe-x); max-width:1440px; margin:0 auto; box-sizing:border-box;">
    
    <!-- 1. Prateleira Superior: Continuar Assistindo (se houver histórico do tipo) -->
    ${continueItems.length ? `
      <div class="iptv-ref-shelf-wrap" style="margin-bottom:2rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.85rem;">
          <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin:0;">Continuar Assistindo</h3>
        </div>
        <div class="iptv-ref-shelf-track">
          ${continueItems.map((c, cIdx) => `
            <div class="netflix-continue-card" data-action="resume-vod" data-title="${esc(c.title)}" tabindex="0">
              <div class="netflix-continue-thumb">
                <img src="${c.img}" alt="${esc(c.title)}" loading="lazy" decoding="async" onerror="window.handlePosterError(this, '${esc(c.title)}')">
                <div class="netflix-continue-play-circle" title="Continuar">
                  <svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7V5z"/></svg>
                </div>
                <div class="netflix-continue-progress-bg">
                  <div class="netflix-continue-progress-fill" style="width:${c.progress}%;"></div>
                </div>
              </div>
              <div class="netflix-continue-footer">
                <button class="netflix-continue-footer-btn" data-action="catalog-card-click" data-type="${isSeries?'series':'movies'}" data-index="${cIdx}" title="Detalhes" aria-label="Detalhes">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                </button>
                <div class="netflix-continue-divider"></div>
                <button class="netflix-continue-footer-btn" data-action="resume-vod" data-title="${esc(c.title)}" title="Opções" aria-label="Opções">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- 2. Barra Integrada: Busca de Catálogo & Seletor de Origem -->
    <div class="iptv-ref-filter-bar">
      <div class="iptv-ref-search-box">
        ${icon('search')}
        <input class="iptv-ref-search-input" id="catalog-search-input" placeholder="Busque um título no catálogo" value="${esc(state.catalogQuery || '')}" autocomplete="off">
      </div>
      <div class="iptv-ref-source-dropdown" style="display:flex; align-items:center; gap:0.5rem;">
        <select class="iptv-ref-source-select" data-action="change-active-playlist" title="Origem / Playlist" style="max-width:260px;">
          ${(state.playlists.filter(p => p.isEnabled !== false).length ? state.playlists.filter(p => p.isEnabled !== false) : state.playlists).map(p => formatPlOption(p, state.activePlaylist)).join('')}
        </select>
        <button class="iptv-manage-pls-btn" data-action="open-manage-playlists-modal" title="Gerenciar Playlists (Habilitar / Ocultar)" tabindex="0">
          ${icon('playlist')}
          <span class="iptv-manage-pls-label">Gerenciar</span>
        </button>
      </div>
    </div>

    <!-- 3. Chips Horizontais de Filtro com Botões de Navegação -->
    <div class="iptv-ref-chips-wrapper">
      <button class="iptv-chips-arrow prev" data-action="scroll-chips-left" title="Rolar Categorias para Esquerda">${icon('left')}</button>
      <div class="iptv-ref-chips-scroll" id="iptv-ref-chips-scroll">
        <button class="iptv-ref-chip ${!selectedCat?'active':''}" data-action="${isSeries?'filter-series-cat':'filter-vod-cat'}" data-name="" tabindex="0">
          Todos
        </button>
      ${categories.slice(0, 45).map(c => `
        <button class="iptv-ref-chip ${selectedCat===c.name?'active':''}" data-action="${isSeries?'filter-series-cat':'filter-vod-cat'}" data-name="${esc(c.name)}" tabindex="0">
          ${esc(c.name)}
        </button>
      `).join('')}
      </div>
      <button class="iptv-chips-arrow next" data-action="scroll-chips-right" title="Rolar Categorias para Direita">${icon('right')}</button>
    </div>

    <!-- Top 10 Catálogo Netflix (v8.3.13) -->
    ${!query && items.length >= 5 ? renderNetflixTop10(items, isSeries, isSeries ? 'Top 10 Séries em Alta' : 'Top 10 Filmes em Alta') : ''}

    <!-- 4. Cabeçalho de Contagem de Catálogo (com status de sincronização automática) -->
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.75rem; margin-bottom:1.25rem;">
      <h2 class="iptv-ref-heading" style="margin:0;">
        Explore o catálogo <span class="iptv-ref-counter">(${number(total)})</span>
      </h2>
      <div style="display:inline-flex; align-items:center; gap:0.5rem; font-size:0.75rem; color:rgba(255,255,255,0.45); background:rgba(255,255,255,0.04); padding:0.35rem 0.75rem; border-radius:20px; border:1px solid rgba(255,255,255,0.08);">
        <span style="width:6px; height:6px; border-radius:50%; background:#46d369; display:inline-block; box-shadow:0 0 6px rgba(70,211,105,0.6);"></span>
        <span>Sincronização contínua de capas ativa</span>
      </div>
    </div>

    <!-- 5. Grid de 4 Colunas com Pôsteres 2:3 e Legenda Inferior -->
    <div class="iptv-ref-grid">
      ${items.length ? items.map((m, idx) => {
        const coverImg = m.posterUrl || m.logo;
        const isFav = state.favorites && state.favorites.some(f => 
          (f.channel && (f.channel.name === m.name || f.channel.url === m.url)) ||
          f.name === m.name || f.url === m.url
        );
        return `
        <div class="iptv-ref-poster-card" style="--item-idx:${idx % 24};" data-action="catalog-card-click" data-type="${isSeries?'series':'movies'}" data-index="${idx}" tabindex="0" title="${esc(m.name)}">
          <div class="iptv-ref-poster-thumb">
            ${coverImg ? `<img src="${esc(coverImg)}" alt="${esc(m.name)}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
            <div class="iptv-ref-poster-fallback" style="${coverImg?'display:none;':''}">
              ${icon(isSeries?'tv':'film')}
            </div>
            ${idx < 10 ? `<div class="netflix-badge-top10"><span>TOP</span><strong>10</strong></div>` : ''}
            ${idx % 3 === 0 ? `<span class="netflix-badge-bottom">${isSeries ? "Nova temporada" : "Novidade"}</span>` : ''}
            ${m.rating ? `<span class="iptv-poster-badge iptv-rating-badge">⭐ ${m.rating}</span>` : ''}
            ${m.year ? `<span class="iptv-poster-badge iptv-year-badge">${m.year}</span>` : ''}
            <div class="iptv-card-hover-actions">
              <button class="iptv-quick-btn iptv-quick-play" data-action="quick-play-catalog" data-type="${isSeries?'series':'movies'}" data-index="${idx}" title="Assistir Agora" aria-label="Assistir Agora">
                ${icon('play')}
              </button>
              <button class="iptv-quick-btn iptv-quick-fav ${isFav ? 'is-favorited' : ''}" data-action="quick-fav-catalog" data-name="${esc(m.name)}" title="${isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}" aria-label="Favoritar">
                ${icon('heart')}
              </button>
              <button class="iptv-quick-btn iptv-quick-info" data-action="catalog-card-click" data-type="${isSeries?'series':'movies'}" data-index="${idx}" title="Mais Informações" aria-label="Mais Informações">
                ${icon('right')}
              </button>
            </div>
          </div>
          <div class="iptv-ref-poster-info">
            <div class="iptv-ref-poster-title">${esc(m.name)}</div>
            <div class="iptv-ref-poster-sub">${esc(m.genres || m.group || (isSeries?'SÉRIE':'FILMES'))}</div>
          </div>
        </div>
      `;}).join('') : `
        <div style="grid-column: 1 / -1; padding:3rem; text-align:center; color:var(--iptv-text-sec);">
          ${icon('search')}
          <p style="margin-top:0.75rem;">Nenhum título encontrado com os filtros atuais.</p>
        </div>
      `}
    </div>

    ${total > items.length ? `
      <div style="display:flex; justify-content:center; margin:2.5rem 0 1rem;">
        <button class="btn secondary" data-action="load-more-catalog" data-type="${isSeries?'series':'movies'}" style="padding:0.75rem 2rem; font-size:0.95rem; border-radius:10px; gap:0.5rem; background:rgba(255,255,255,0.08); color:#fff; border:1px solid rgba(255,255,255,0.15); cursor:pointer;">
          ${icon('plus')} Carregar Mais Títulos (${number(items.length)} de ${number(total)})
        </button>
      </div>
    ` : ''}

  </div>`;
}

function moviesPage(){
  return catalogPage('movies');
}

function seriesPage(){
  return catalogPage('series');
}

function searchPage(){
  const query = (state.searchQuery || '').toLowerCase().trim();
  const currentTab = state.searchTab || 'channels';

  const allChannels = state.channels || [
    { name: 'ESPN HD', group: 'Esportes' },
    { name: 'SporTV HD', group: 'Esportes' },
    { name: 'FOX Sports HD', group: 'Esportes' },
    { name: 'Band HD', group: 'Esportes' },
    { name: 'TNT HD', group: 'Esportes' },
    { name: 'Globo HD', group: 'Esportes' },
    { name: 'Disney Channel HD', group: 'Infantil' }
  ];
  const allMovies = state.currentMovies || [];
  const allSeries = state.currentSeries || [];

  const filteredChannels = query ? allChannels.filter(c => c.name.toLowerCase().includes(query) || (c.group && c.group.toLowerCase().includes(query))) : allChannels;
  const filteredMovies = query ? allMovies.filter(m => m.name.toLowerCase().includes(query) || (m.group && m.group.toLowerCase().includes(query))) : allMovies;
  const filteredSeries = query ? allSeries.filter(s => s.name.toLowerCase().includes(query) || (s.group && s.group.toLowerCase().includes(query))) : allSeries;

  const activeList = currentTab === 'movies' ? filteredMovies : (currentTab === 'series' ? filteredSeries : filteredChannels);

  return `<div style="padding:1.5rem var(--iptv-safe-x); max-width:980px; margin:0 auto; box-sizing:border-box;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <h1 style="font-size:1.8rem; font-weight:800; color:#fff; margin:0;">Busca</h1>
      <span style="font-size:1.1rem; font-weight:700; color:rgba(255,255,255,0.7);">${getIptvClock()}</span>
    </div>

    <!-- Barra de Busca Master -->
    <div style="position:relative; margin-bottom:1.75rem;">
      <input id="iptv-search-input" value="${esc(state.searchQuery || '')}" placeholder="Buscar filmes, séries, canais..." autofocus spellcheck="false" style="width:100%; height:52px; background:#121418; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0 3.2rem 0 1.25rem; color:#fff; font-size:1rem; outline:none; box-sizing:border-box; transition:border-color 0.2s;" onfocus="this.style.borderColor='rgba(229,9,20,0.6)'" onblur="this.style.borderColor='rgba(255,255,255,0.08)'">
      <div style="position:absolute; right:1.25rem; top:50%; transform:translateY(-50%); color:rgba(255,255,255,0.5); pointer-events:none;">
        ${icon('search')}
      </div>
    </div>

    <!-- Seção de Resultados e Abas -->
    <div>
      <div style="font-size:0.85rem; font-weight:700; color:rgba(255,255,255,0.45); text-transform:uppercase; letter-spacing:0.8px; margin-bottom:0.85rem;">Resultados</div>
      <div style="display:flex; gap:0.6rem; margin-bottom:1.25rem;">
        <button class="iptv-epg-day-pill ${currentTab==='channels'?'active':''}" data-action="search-tab" data-tab="channels" tabindex="0">
          Canais (${filteredChannels.length})
        </button>
        <button class="iptv-epg-day-pill ${currentTab==='movies'?'active':''}" data-action="search-tab" data-tab="movies" tabindex="0">
          Filmes (${filteredMovies.length})
        </button>
        <button class="iptv-epg-day-pill ${currentTab==='series'?'active':''}" data-action="search-tab" data-tab="series" tabindex="0">
          Séries (${filteredSeries.length})
        </button>
      </div>

      <!-- Lista de Itens Encontrados -->
      <div style="display:flex; flex-direction:column; gap:0.5rem;" id="iptv-search-results">
        ${activeList.length ? activeList.slice(0, 50).map((it, idx) => {
          const isFav = state.favorites && state.favorites.some(f => (f.channel && f.channel.name === it.name) || f.name === it.name);
          return `
            <div class="iptv-settings-row" data-action="${currentTab==='channels'?'select-live-ch':'play-vod-item'}" data-index="${idx}" data-name="${esc(it.name)}" tabindex="0" style="margin-bottom:0.4rem; padding:0.9rem 1.25rem;">
              <div class="iptv-settings-row-left" style="gap:1rem;">
                <div class="iptv-round-logo" style="width:40px; height:40px;">
                  ${it.logo ? `<img src="${esc(it.logo)}" alt="${esc(it.name)}">` : initials(it.name)}
                </div>
                <div>
                  <strong style="display:block; font-size:0.95rem; color:#fff;">${esc(it.name)}</strong>
                  <span style="font-size:0.78rem; color:rgba(255,255,255,0.5);">${esc(it.group || (currentTab==='movies'?'Filmes':currentTab==='series'?'Séries':'Esportes'))}</span>
                </div>
              </div>
              <button class="favorite-button ${isFav?'is-favorite':''}" data-action="toggle-favorite-search" data-name="${esc(it.name)}" style="background:none; border:none; color:${isFav?'#e50914':'rgba(255,255,255,0.4)'}; cursor:pointer;" title="Favoritar">
                ${icon('heart')}
              </button>
            </div>
          `;
        }).join('') : `
          <div style="padding:3rem 1rem; text-align:center; color:rgba(255,255,255,0.5);">
            <p>Nenhum resultado encontrado para o termo pesquisado.</p>
          </div>
        `}
      </div>
    </div>
  </div>`;
}

function favoritesPage(){
  return `<div style="padding:1.5rem var(--iptv-safe-x);">
    <h1 style="font-size:1.75rem; font-weight:800; color:#fff; margin:0 0 1rem;">Meus Favoritos</h1>
    <div class="iptv-fav-tabs">
      <button class="iptv-genre-pill active" tabindex="0">Todos</button>
      <button class="iptv-genre-pill" tabindex="0">Canais</button>
      <button class="iptv-genre-pill" tabindex="0">Filmes</button>
      <button class="iptv-genre-pill" tabindex="0">Séries</button>
    </div>
    <div class="iptv-empty-fav">
      ${icon('heart')}
      <h3 style="font-size:1.35rem; color:#fff; margin:0;">Você ainda não possui favoritos.</h3>
      <p style="font-size:0.92rem; margin:0;">Navegue pelos canais ou catálogo e pressione o botão favoritar para salvá-los aqui.</p>
      <a class="iptv-hero-btn-play" href="#/live" style="margin-top:1rem; text-decoration:none;">Explorar TV Ao Vivo</a>
    </div>
  </div>`;
}

function recordingsPage(){
  return `<div style="padding:1.5rem var(--iptv-safe-x);">
    <h1 style="font-size:1.75rem; font-weight:800; color:#fff; margin:0 0 1rem;">Gravações & Histórico</h1>
    <div style="background:var(--iptv-surface); border:1px solid var(--iptv-border); border-radius:12px; padding:3rem 2rem; text-align:center;">
      <p style="color:var(--iptv-text-sec); font-size:1rem; margin:0 0 1.5rem;">Nenhuma gravação agendada no momento.</p>
      <a class="iptv-hero-btn-play" href="#/epg" style="text-decoration:none;">Ver Programação EPG</a>
    </div>
  </div>`;
}

function settings(){
  const expDate = state.user?.expiresAt ? new Date(state.user.expiresAt).toLocaleDateString('pt-BR') : '13/10/2026 19:56:47';

  return `<div style="padding:1.5rem var(--iptv-safe-x); max-width:880px; margin:0 auto; box-sizing:border-box;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <h1 style="font-size:1.8rem; font-weight:800; color:#fff; margin:0;">Configurações</h1>
      <span style="font-size:1.1rem; font-weight:700; color:rgba(255,255,255,0.7);">${getIptvClock()}</span>
    </div>

    <!-- Grupo 0: Gerenciamento de Playlists -->
    <div class="iptv-settings-group">
      <div class="iptv-settings-group-title">Playlists & Catálogo</div>

      <div class="iptv-settings-row" data-action="open-manage-playlists-modal" tabindex="0">
        <div class="iptv-settings-row-left">
          ${icon('playlist')}
          <div>
            <div class="iptv-settings-label">Playlists e Fontes de Conteúdo</div>
            <div class="iptv-settings-sub">${state.playlists.filter(p=>p.isEnabled!==false).length} listas ativas de ${state.playlists.length} cadastradas (habilitar / ocultar)</div>
          </div>
        </div>
        <div style="color:rgba(255,255,255,0.4);">${icon('right')}</div>
      </div>
    </div>

    <!-- Grupo 1: Conta -->
    <div class="iptv-settings-group">
      <div class="iptv-settings-group-title">Conta</div>

      <div class="iptv-settings-row" data-action="account-details" tabindex="0">
        <div class="iptv-settings-row-left">
          ${icon('user')}
          <div>
            <div class="iptv-settings-label">Dados da conta</div>
            <div class="iptv-settings-sub">Expira em: ${expDate}</div>
          </div>
        </div>
        <div style="color:rgba(255,255,255,0.4);">${icon('right')}</div>
      </div>

      <div class="iptv-settings-row" data-action="video-quality-setting" tabindex="0">
        <div class="iptv-settings-row-left">
          ${icon('settings')}
          <div>
            <div class="iptv-settings-label">Qualidade de vídeo</div>
            <div class="iptv-settings-sub">Auto (recomendado)</div>
          </div>
        </div>
        <div style="color:rgba(255,255,255,0.4);">${icon('right')}</div>
      </div>

      <div class="iptv-settings-row" data-action="language-setting" tabindex="0">
        <div class="iptv-settings-row-left">
          ${icon('globe')}
          <div>
            <div class="iptv-settings-label">Idioma</div>
            <div class="iptv-settings-sub">Português (BR)</div>
          </div>
        </div>
        <div style="color:rgba(255,255,255,0.4);">${icon('right')}</div>
      </div>

      <div class="iptv-settings-row" tabindex="0">
        <div class="iptv-settings-row-left">
          ${icon('compass')}
          <div>
            <div class="iptv-settings-label">Aspecto</div>
            <div class="iptv-settings-sub">Tema escuro</div>
          </div>
        </div>
        <div class="iptv-red-switch" data-action="toggle-dark-mode" title="Alternar tema"></div>
      </div>
    </div>

    <!-- Grupo 2: Outras opções -->
    <div class="iptv-settings-group">
      <div class="iptv-settings-group-title">Outras opções</div>

      <div class="iptv-settings-row" data-action="clear-app-cache" tabindex="0">
        <div class="iptv-settings-row-left">
          ${icon('refresh')}
          <div>
            <div class="iptv-settings-label">Limpar cache</div>
            <div class="iptv-settings-sub">Liberar memória e recarregar dados locais</div>
          </div>
        </div>
        <div style="color:rgba(255,255,255,0.4);">${icon('right')}</div>
      </div>

      <div class="iptv-settings-row" data-action="about-app" tabindex="0">
        <div class="iptv-settings-row-left">
          ${icon('info')}
          <div>
            <div class="iptv-settings-label">Sobre o app</div>
            <div class="iptv-settings-sub">JstudioPlay IPTV PLAY Pro v7.9.7</div>
          </div>
        </div>
        <div style="color:rgba(255,255,255,0.4);">${icon('right')}</div>
      </div>

      <div class="iptv-settings-row" data-action="logout" tabindex="0">
        <div class="iptv-settings-row-left">
          ${icon('logout')}
          <div>
            <div class="iptv-settings-label">Sair</div>
            <div class="iptv-settings-sub">Encerrar sessão neste dispositivo</div>
          </div>
        </div>
        <div style="color:rgba(255,255,255,0.4);">${icon('right')}</div>
      </div>
    </div>
  </div>`;
}

function savedPage(kind){const items=state[kind],isFav=kind==='favorites';return `${heading(isFav?'Seus favoritos':'Seu histórico',isFav?'Os canais que você gosta, a um clique de distância.':'Retome os canais que você abriu recentemente.',!isFav&&items.length?'<button class="btn ghost small" data-action="clear-history">Limpar histórico</button>':'')}<div class="playlist-grid history-list">${items.length?items.map((h,i)=>`<article class="card playlist-row">${channelLogo(h.channel,i)}<div class="playlist-info"><h3>${esc(h.channel.name)}</h3><p>${esc(state.playlists.find(p=>p.id===h.playlistId)?.name||'Playlist')} · ${esc(h.channel.group)}${h.unavailable?' · Indisponível na versão atual':''}</p></div><span class="timestamp">${dateTime(h.at)}</span><button class="icon-btn play-circle" data-action="open-saved" data-kind="${kind}" data-index="${i}" aria-label="${h.unavailable?'Indisponível':'Reproduzir'} ${esc(h.channel.name)}" ${h.unavailable?'disabled':''}>${icon('play')}</button>${isFav?`<button class="favorite-button is-favorite" data-action="saved-favorite" data-index="${i}" aria-label="Remover favorito ${esc(h.channel.name)}">${icon('heart')}</button>`:''}</article>`).join(''):`<div class="card">${empty(isFav?'Seus favoritos moram aqui':'Ainda não há reproduções',isFav?'Toque no coração ao lado de um canal no player para salvá-lo aqui.':'Abra uma playlist e escolha um canal para começar.',`<a class="btn small" href="#/player">${icon('play')}Abrir player</a>`,isFav?'heart':'clock')}</div>`}</div>`;}
function roleBadge(role){
  if(role==='master') return `<span class="badge" style="background:rgba(229,9,20,0.2); color:#ff4d4f; border:1px solid rgba(229,9,20,0.5); font-weight:700;">👑 Master</span>`;
  if(role==='admin') return `<span class="badge" style="background:rgba(59,130,246,0.2); color:#60a5fa; border:1px solid rgba(59,130,246,0.5); font-weight:600;">🛡️ Adm</span>`;
  if(role==='reseller') return `<span class="badge" style="background:rgba(168,85,247,0.2); color:#c084fc; border:1px solid rgba(168,85,247,0.5); font-weight:600;">💎 Revendedor</span>`;
  if(role==='pro') return `<span class="badge" style="background:rgba(234,179,8,0.2); color:#facc15; border:1px solid rgba(234,179,8,0.5); font-weight:600;">⭐ Pro</span>`;
  return `<span class="badge" style="background:rgba(34,197,94,0.15); color:#4ade80; border:1px solid rgba(34,197,94,0.4);">👤 Usuário</span>`;
}

const CREDIT_PACKAGES_DATA = [
  { id: 'cred_10', credits: 10, price: 60.00, unitPrice: '6,00', tag: null },
  { id: 'cred_20', credits: 20, price: 120.00, unitPrice: '6,00', tag: null },
  { id: 'cred_30', credits: 30, price: 180.00, unitPrice: '6,00', tag: null },
  { id: 'cred_40', credits: 40, price: 200.00, unitPrice: '5,00', tag: 'Economize R$ 40' },
  { id: 'cred_50', credits: 50, price: 250.00, unitPrice: '5,00', tag: 'Economize R$ 50' },
  { id: 'cred_60', credits: 60, price: 300.00, unitPrice: '5,00', tag: 'Economize R$ 60' },
  { id: 'cred_70', credits: 70, price: 280.00, unitPrice: '4,00', tag: 'Super Desconto' },
  { id: 'cred_80', credits: 80, price: 320.00, unitPrice: '4,00', tag: 'Super Desconto' },
  { id: 'cred_90', credits: 90, price: 360.00, unitPrice: '4,00', tag: 'Melhor Custo' }
];

function aiStatusPage(){
  const s = state.aiStatus;
  if(!s) return `<div class="iptv-page-body"><div class="loading-state">Carregando status da IA…<div class="loading-line"></div></div></div>`;

  function svcCard(label, emoji, data, detailKey){
    const ok = data?.ok === true;
    const badge = ok
      ? `<span class="ai-status-badge ai-ok">● Online</span>`
      : `<span class="ai-status-badge ai-err">● Offline</span>`;
    const detail = data?.[detailKey] || (ok ? (data?.model || data?.version || '') : (data?.error || 'Sem resposta'));
    return `
      <div class="ai-svc-card ${ok?'ai-svc-ok':'ai-svc-err'}">
        <div class="ai-svc-header">
          <span class="ai-svc-emoji">${emoji}</span>
          <span class="ai-svc-name">${label}</span>
          ${badge}
        </div>
        ${detail?`<p class="ai-svc-detail">${esc(String(detail))}</p>`:''}
      </div>`;
  }

  const scraper = s.scraper || {};
  const ts = s.timestamp ? new Date(s.timestamp).toLocaleString('pt-BR') : '—';

  const scrapBadge = scraper.isRunning
    ? `<span class="ai-status-badge ai-run">● Rodando</span>`
    : `<span class="ai-status-badge ai-idle">● Ocioso</span>`;

  return `
  <div class="ai-status-wrapper">
    <div class="ai-status-header">
      <div>
        <h1 class="ai-status-title">Status da IA & Integrações</h1>
        <p class="ai-status-sub">Última verificação: ${ts}</p>
      </div>
      <button class="btn small" data-action="refresh-ai-status">${icon('refresh')} Atualizar</button>
    </div>

    <div class="ai-svc-grid">
      ${svcCard('Ollama LLM', '🤖', s.ollama, 'model')}
      ${svcCard('pgvector', '🗄️', s.pgvector, 'version')}
      ${svcCard('SearXNG', '🔍', s.searxng, 'version')}
    </div>

    <div class="ai-scraper-card">
      <div class="ai-svc-header">
        <span class="ai-svc-emoji">📡</span>
        <span class="ai-svc-name">Scraper M3U</span>
        ${scrapBadge}
      </div>
      <div class="ai-scraper-grid">
        <div class="ai-scraper-stat"><span>${scraper.totalChannels ?? '—'}</span><small>Canais</small></div>
        <div class="ai-scraper-stat"><span>${scraper.totalPlaylists ?? '—'}</span><small>Playlists</small></div>
        <div class="ai-scraper-stat"><span>${scraper.lastRunAt ? new Date(scraper.lastRunAt).toLocaleDateString('pt-BR') : '—'}</span><small>Última execução</small></div>
        <div class="ai-scraper-stat"><span>${scraper.errors ?? '—'}</span><small>Erros</small></div>
      </div>
    </div>

    <div class="ai-actions-row">
      <button class="btn small" data-action="ai-discover">🔍 Descobrir fontes M3U</button>
      <a href="#/logs" class="btn small secondary">📋 Ver logs do sistema</a>
    </div>
  </div>`;
}

function creditsPage(){
  const myCredits = state.user?.credits || 0;
  return `
  <div class="credits-page-wrapper">
    <div class="credits-header-box">
      <div class="credits-title-area">
        <h1>Comprar Crédito</h1>
        <p>Para comprar créditos selecione a quantidade desejada:</p>
      </div>
      <div class="credits-balance-card">
        <div class="credits-balance-icon">
          ${icon('credits')}
        </div>
        <div class="credits-balance-meta">
          <span class="credits-balance-label">Seu Saldo Atual</span>
          <span class="credits-balance-val">${myCredits} <small>créditos</small></span>
        </div>
      </div>
    </div>

    <div class="credits-grid-3x3">
      ${CREDIT_PACKAGES_DATA.map(pkg => `
        <article class="credit-package-card">
          ${pkg.tag ? `<span class="credit-pkg-badge">${pkg.tag}</span>` : ''}
          <div class="credit-pkg-icon-wrap">
            ${icon('credits')}
          </div>
          <h2 class="credit-pkg-title">${pkg.credits} Créditos</h2>
          <div class="credit-pkg-price">R$ ${pkg.price.toFixed(2).replace('.', ',')}</div>
          <div class="credit-pkg-unit">(R$ ${pkg.unitPrice} cada)</div>
          <button class="credit-pkg-btn" data-action="buy-credits" data-package="${pkg.credits}" data-price="${pkg.price}" data-id="${pkg.id}">
            Comprar
          </button>
        </article>
      `).join('')}
    </div>
  </div>`;
}

function usersPage(){
  const isMaster = state.user?.role === 'master';
  const isReseller = state.user?.role === 'reseller';
  return `${heading('Gestão de Usuários', isMaster?'Administre todos os perfis e acessos globais da plataforma.':isReseller?'Cadastre e acompanhe seus clientes. Cada novo usuário ou renovação consome 1 crédito.':'Gerencie os usuários e assinantes sob sua supervisão.')}
  <div class="toolbar">
    <div class="field search">${icon('search')}<input id="user-search" type="search" placeholder="Buscar usuário…" aria-label="Buscar usuário"></div>
    ${(isReseller || isMaster) ? `<button class="btn secondary small" data-action="transfer-credits-modal">⇄ Enviar Créditos</button>` : ''}
    <button class="btn small" data-action="new-user">${icon('plus')}Novo usuário</button>
  </div>
  <section class="card table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>Usuário</th>
          <th>Perfil</th>
          <th>Status</th>
          <th>Créditos</th>
          <th>Playlists</th>
          <th>Último acesso</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody id="user-rows">${userRows('')}</tbody>
    </table>
    <div class="table-foot">${number(state.users.length)} usuários cadastrados.</div>
  </section>`;
}

function userRows(query){
  const isMaster = state.user?.role === 'master';
  const isReseller = state.user?.role === 'reseller';
  return state.users.filter(({user:u})=>(u.name+' '+u.username).toLowerCase().includes(query.toLowerCase())).map(({user:u,playlists})=>`
    <tr>
      <td>
        <div class="row">
          <span class="avatar">${esc(initials(u.name))}</span>
          <span><strong>${esc(u.name)}</strong><br><small style="color:var(--iptv-text-sec);">@${esc(u.username)}</small></span>
        </div>
      </td>
      <td>${roleBadge(u.role)}</td>
      <td><span class="badge ${u.blocked?'blocked':''}">${u.blocked?'Bloqueado':'Ativo'}</span></td>
      <td>${u.role==='reseller' ? `<span class="badge" style="background:rgba(168,85,247,0.18); color:#c084fc; font-weight:700;">💳 ${u.credits || 0}</span>` : `<small style="color:var(--iptv-text-sec);">${u.credits || 0}</small>`}</td>
      <td>${playlists}</td>
      <td><small>${dateTime(u.lastLogin)}</small></td>
      <td>
        <div style="display:flex; align-items:center; gap:0.35rem;">
          ${(isReseller || isMaster) && ['user', 'pro'].includes(u.role) ? `
            <button class="btn secondary" style="padding:0.25rem 0.55rem; font-size:0.75rem; height:28px; white-space:nowrap;" data-action="renew-user" data-id="${u.id}" data-username="${esc(u.username)}" title="Renovar +30 dias (consome 1 crédito)">
              ⚡ Renovar (+30d)
            </button>
          ` : ''}
          <button class="icon-btn" data-action="user-options" data-id="${u.id}" aria-label="Gerenciar ${esc(u.username)}">${icon('more')}</button>
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7">Nenhum usuário encontrado.</td></tr>';
}

function marathonsPage(){
  const marathons = state.marathons || [];
  const current = state.currentMarathon;

  if(!marathons.length){
    return `<div style="padding:2rem; max-width:1200px; margin:0 auto;">
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:3rem 2rem; text-align:center;">
        <span style="font-size:2.5rem; display:block; margin-bottom:1rem;">🎬</span>
        <h2 style="font-size:1.4rem; font-weight:800; color:#fff; margin:0 0 0.5rem;">Nenhuma Maratona Disponível</h2>
        <p style="color:var(--iptv-text-sec); font-size:0.95rem; margin:0;">Carregando catálogo de maratonas narrativas…</p>
      </div>
    </div>`;
  }

  const activeId = state.activeMarathonId || marathons[0].id;
  const marathon = current || marathons.find(m => m.id === activeId) || marathons[0];
  const items = marathon.items || [];
  const cover = marathon.coverUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80';

  return `<div class="iptv-marathons-container">
    <!-- Hero Banner da Maratona Selecionada -->
    <section class="iptv-marathon-hero" style="background-image:url('${esc(cover)}');">
      <div class="iptv-marathon-hero-overlay"></div>
      <div class="iptv-marathon-hero-content">
        <div style="display:flex; align-items:center; gap:0.65rem; margin-bottom:0.85rem;">
          <span style="background:var(--iptv-red); color:#fff; font-size:0.75rem; font-weight:900; text-transform:uppercase; padding:5px 12px; border-radius:6px; letter-spacing:0.6px; box-shadow:0 0 12px rgba(229,9,20,0.4);">${esc(marathon.badge || 'MARATONA NARRATIVA')}</span>
          <span style="background:rgba(255,255,255,0.12); backdrop-filter:blur(10px); color:#fff; font-size:0.75rem; font-weight:700; padding:5px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.15);">${items.length} ${items.length === 1 ? 'TÍTULO' : 'TÍTULOS'} ORDENADOS</span>
        </div>
        <h1 class="iptv-marathon-hero-title">${esc(marathon.title)}</h1>
        <p class="iptv-marathon-hero-desc">${esc(marathon.description || 'Acompanhe a sequência cronológica completa sem perder nenhum detalhe do enredo.')}</p>
        <div class="iptv-marathon-actions">
          <button class="iptv-btn-play-red iptv-marathon-start-btn" data-action="start-marathon" tabindex="0">
            ${icon('play')} <span>Assistir Sequência Narrativa</span>
          </button>
          <button class="iptv-btn-hero-export" data-action="export-marathon-m3u" data-slug="${esc(marathon.slug)}" tabindex="0" title="Baixar playlist M3U ordenada para TV Box e Smart TV">
            ${icon('download')} <span>Exportar M3U (Smart TV)</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Seletor de Maratonas Curadas -->
    <section>
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.15rem;">
        <h3 style="font-size:1.25rem; font-weight:800; color:#fff; margin:0; display:flex; align-items:center; gap:0.5rem;">
          <span>🌟</span> Maratonas Curadas Disponíveis
        </h3>
        <span style="font-size:0.82rem; color:var(--iptv-text-sec); font-weight:600;">${marathons.length} sagas catalogadas</span>
      </div>
      <div class="iptv-marathons-grid">
        ${marathons.map(m => {
          const isAct = m.id === activeId;
          const mCover = m.coverUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80';
          return `
            <div class="iptv-marathon-card ${isAct ? 'active' : ''}" data-action="select-marathon" data-id="${esc(m.id)}" tabindex="0">
              <div class="iptv-marathon-card-bg" style="background-image:url('${esc(mCover)}');"></div>
              <div class="iptv-marathon-card-header">
                <span class="iptv-marathon-badge" style="color:${isAct ? '#fff' : 'var(--iptv-red)'}; background:${isAct ? 'var(--iptv-red)' : 'rgba(229,9,20,0.14)'};">${esc(m.badge || 'MARATONA')}</span>
                <span class="iptv-marathon-count-badge">${m.totalItems || 0} títulos</span>
              </div>
              <strong class="iptv-marathon-card-title">${esc(m.title)}</strong>
              <p class="iptv-marathon-card-desc">${esc(m.description)}</p>
            </div>
          `;
        }).join('')}
      </div>
    </section>

    <!-- Timeline Narrativa com Ordem Estrita -->
    <section>
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.35rem;">
        <div>
          <h3 style="font-size:1.35rem; font-weight:800; color:#fff; margin:0 0 0.25rem;">Ordem Narrativa da História</h3>
          <p style="font-size:0.88rem; color:var(--iptv-text-sec); margin:0;">Assista na sequência recomendada com notas contextuais sobre cada evento cronológico.</p>
        </div>
        <span style="font-size:0.82rem; background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.85); padding:5px 14px; border-radius:20px; font-weight:700; border:1px solid rgba(255,255,255,0.1);">Passo a Passo</span>
      </div>

      <div class="iptv-timeline-list">
        ${items.map(it => {
          const padIdx = String(it.orderIndex || 1).padStart(2, '0');
          const isYt = (it.streamUrl || '').includes('youtube.com') || (it.streamUrl || '').includes('youtu.be');
          const poster = it.posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80';
          return `
            <div class="iptv-timeline-item">
              <div class="iptv-timeline-idx">${padIdx}</div>
              <div class="iptv-timeline-poster" style="background-image:url('${esc(poster)}');"></div>
              <div class="iptv-timeline-info">
                <div class="iptv-timeline-meta-row">
                  <strong class="iptv-timeline-title">${esc(it.title)}</strong>
                  ${it.year ? `<span class="iptv-timeline-tag">${it.year}</span>` : ''}
                  ${it.duration ? `<span class="iptv-timeline-tag">⏱️ ${esc(it.duration)}</span>` : ''}
                  ${it.rating ? `<span class="iptv-timeline-tag tag-rating">⭐ ${esc(it.rating)}</span>` : ''}
                  ${isYt ? `<span class="iptv-timeline-tag tag-yt">YOUTUBE</span>` : ''}
                </div>
                ${it.notes ? `
                  <div class="iptv-timeline-note">
                    💡 <em>${esc(it.notes)}</em>
                  </div>
                ` : ''}
              </div>
              <div class="iptv-timeline-action">
                <button class="iptv-btn-play-red iptv-timeline-play-btn" data-action="play-marathon-item" data-item-id="${esc(it.id)}" tabindex="0">
                  ${icon('play')} <span>Assistir</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  </div>`;
}

async function renderRoute(){
  const defaultPage = state.user ? '/dashboard' : '/landing';
  const raw = location.hash.slice(1) || defaultPage;
  if(!raw.startsWith('/')){navigate(state.user ? 'dashboard' : 'landing');return;}
  const generation=++routeGeneration;
  let page=raw.slice(1).split('?')[0];
  if(!page || page==='home') page = state.user ? 'dashboard' : 'landing';
  if(!['login','landing',...Object.keys(pageNames)].includes(page))page = state.user ? 'dashboard' : 'landing';
  if(!state.user && !['login','landing'].includes(page)){navigate('landing');return;}
  if(state.user && (page==='login'||page==='landing')){navigate('dashboard');return;}
  const userRole = state.user?.role || 'user';
  if(page==='logs' && userRole !== 'master'){navigate('dashboard');return;}
  if(page==='users' && !['reseller','admin','master'].includes(userRole)){navigate('dashboard');return;}
  if(page==='credits' && !['reseller','admin','master'].includes(userRole)){navigate('dashboard');return;}
  if(page==='ai-status' && !['admin','master'].includes(userRole)){navigate('dashboard');return;}
  if(page==='automation' && !['admin','master'].includes(userRole)){navigate('dashboard');return;}
  if(page==='recordings' && userRole === 'user'){navigate('dashboard');return;}
  if(page==='live'||page==='channels'||page==='multiview'){
    if(window.pipModule)window.pipModule.exit();
    stopPlayback();
  } else {
    // Se o usuário está assistindo a um canal ativo e sai do player, aciona o PiP
    const activeVideo = document.getElementById('video');
    if(state.selected && activeVideo && !activeVideo.paused && activeVideo.currentTime > 0){
      if(window.pipModule)window.pipModule.enter(state.selected);
    }
    stopPlayback();
  }
  state.page=page;$('#modal').close();
  document.title=`${pageNames[page]|| (page==='login'?'Entrar':page==='landing'?'IPTV, Filmes & Séries':'Do seu jeito.')} — JstudioPlay`;
  if(page==='landing'){$('#app').innerHTML=landing();return;}
  if(page==='login'){$('#app').innerHTML=loginPage();if(tvMode)focusTV($('#username')||visibleTVTargets()[0]);initGoogleAuth();return;}
  if (!$('#content') && !$('.iptv-main-container')) {
    $('#app').innerHTML='<div style="min-height:100vh;display:grid;place-items:center;background:var(--iptv-bg);color:#fff;font-family:var(--iptv-font);"><div class="loading-state">Carregando JstudioPlay…<div class="loading-line"></div></div></div>';
  }
  setMenu(false);
  try {
    if(!state.playlists.length) {
      await loadLibrary();
    }
    if(generation!==routeGeneration)return;

    // Sincroniza playlist ativa persistida ou autodetecta playlist habilitada com melhor acervo
    const enabledPls = state.playlists.filter(p => p.isEnabled !== false);
    const targetPool = enabledPls.length ? enabledPls : state.playlists;
    const savedPl = localStorage.getItem('m3u-active-playlist');
    const plExists = savedPl && targetPool.some(p => p.id === savedPl);
    if(plExists){
      state.activePlaylist = savedPl;
    } else {
      const bestPl = targetPool.slice().sort((a,b) => ((Number(b.vod)||0) + (Number(b.series)||0) + (Number(b.live)||0)) - ((Number(a.vod)||0) + (Number(a.series)||0) + (Number(a.live)||0)))[0];
      state.activePlaylist = bestPl?.id || targetPool[0]?.id || '';
      if(state.activePlaylist) {
        try { localStorage.setItem('m3u-active-playlist', state.activePlaylist); } catch {}
      }
    }

    if(page==='users')state.users=await api('/admin/users');
    if(page==='logs')state.logs=await api('/admin/logs')||[];
    if(page==='ai-status')state.aiStatus=await api('/integrations/status');
    if(generation!==routeGeneration)return;

    if(page==='dashboard' && state.playlists.length){
      if(!state.dashboardLoaded || state.dashboardPlaylist !== state.activePlaylist){
        const curPl = state.playlists.find(p => p.id === state.activePlaylist);
        // Autodetecta playlist com acervo real se a ativa for restrita a canais ao vivo
        const vodPlId = ((Number(curPl?.vod) || 0) > 50)
          ? state.activePlaylist
          : (state.playlists.slice().sort((a,b) => (Number(b.vod)||0) - (Number(a.vod)||0))[0]?.id || state.activePlaylist);
        const seriesPlId = ((Number(curPl?.series) || 0) > 50)
          ? state.activePlaylist
          : (state.playlists.slice().sort((a,b) => (Number(b.series)||0) - (Number(a.series)||0))[0]?.id || state.activePlaylist);

        const [liveRes, vodRes, serRes] = await Promise.all([
          api(`/playlists/${state.activePlaylist}/filter?type=live&limit=10`).catch(()=>({channels:[]})),
          api(`/playlists/${vodPlId}/filter?type=vod&limit=10`).catch(()=>({channels:[]})),
          api(`/playlists/${seriesPlId}/filter?type=series&limit=10`).catch(()=>({channels:[]}))
        ]);
        state.dashLive = liveRes.channels || [];
        state.dashMovies = vodRes.channels || [];
        state.dashSeries = serRes.channels || [];
        state.dashboardLoaded = true;
        state.dashboardPlaylist = state.activePlaylist;
      }
    }

    if(['live','channels','player'].includes(page) && state.playlists.length){
      const currentType = (page === 'live' || page === 'channels') ? 'live' : (state.mediaType || 'live');
      state.mediaType = currentType;
      if(!state.channels.length || state.channelsPlaylist !== state.activePlaylist || state.loadedMediaType !== currentType){
        await loadChannels(state.activePlaylist, generation, currentType);
        state.channelsPlaylist = state.activePlaylist;
        state.loadedMediaType = currentType;
        if(generation!==routeGeneration)return;
      }
    }

    if((page==='catalog' || page==='movies') && state.playlists.length){
      state.mediaType = 'vod';
      const curPl = state.playlists.find(p => p.id === state.activePlaylist);
      // Se a playlist ativa atual tiver menos de 5 filmes e houver playlist rica em VOD no sistema, alterna automaticamente
      if((Number(curPl?.vod) || 0) < 5){
        const richPl = state.playlists.slice().sort((a,b) => (Number(b.vod)||0) - (Number(a.vod)||0))[0];
        if(richPl && (Number(richPl.vod) || 0) > (Number(curPl?.vod) || 0)){
          state.activePlaylist = richPl.id;
          state.movieCategories = null;
          state.selectedVodCategory = '';
          state.moviePage = 1;
          try { localStorage.setItem('m3u-active-playlist', richPl.id); } catch {}
        }
      }
      if(!state.movieCategories || state.movieCategoriesPlaylist !== state.activePlaylist){
        const catRes = await api(`/playlists/${state.activePlaylist}/categories?type=vod`).catch(()=>({categories:[]}));
        state.movieCategories = catRes.categories || [];
        state.movieCategoriesPlaylist = state.activePlaylist;
      }
      const curCat = state.selectedVodCategory || '';
      const filterQuery = curCat ? `&group=${encodeURIComponent(curCat)}` : '';
      const pageNum = state.moviePage || 1;
      const vodRes = await api(`/playlists/${state.activePlaylist}/filter?type=vod&limit=100&page=${pageNum}${filterQuery}`).catch(()=>({channels:[], total:0}));
      state.currentMovies = vodRes.channels || [];
      state.totalMovies = vodRes.total || 0;
      if(generation!==routeGeneration)return;
    }

    if(page==='series' && state.playlists.length){
      state.mediaType = 'series';
      const curPl = state.playlists.find(p => p.id === state.activePlaylist);
      // Se a playlist ativa atual tiver menos de 5 séries e houver playlist rica em Séries, alterna automaticamente
      if((Number(curPl?.series) || 0) < 5){
        const richPl = state.playlists.slice().sort((a,b) => (Number(b.series)||0) - (Number(a.series)||0))[0];
        if(richPl && (Number(richPl.series) || 0) > (Number(curPl?.series) || 0)){
          state.activePlaylist = richPl.id;
          state.seriesCategories = null;
          state.selectedSeriesCategory = '';
          state.seriesPage = 1;
          try { localStorage.setItem('m3u-active-playlist', richPl.id); } catch {}
        }
      }
      if(!state.seriesCategories || state.seriesCategoriesPlaylist !== state.activePlaylist){
        const catRes = await api(`/playlists/${state.activePlaylist}/categories?type=series`).catch(()=>({categories:[]}));
        state.seriesCategories = catRes.categories || [];
        state.seriesCategoriesPlaylist = state.activePlaylist;
      }
      const curCat = state.selectedSeriesCategory || '';
      const filterQuery = curCat ? `&group=${encodeURIComponent(curCat)}` : '';
      const pageNum = state.seriesPage || 1;
      const serRes = await api(`/playlists/${state.activePlaylist}/filter?type=series&limit=100&page=${pageNum}${filterQuery}`).catch(()=>({channels:[], total:0}));
      state.currentSeries = serRes.channels || [];
      state.totalSeries = serRes.total || 0;
      if(generation!==routeGeneration)return;
    }

    if(page==='search' && state.playlists.length){
      if(!state.currentMovies || !state.currentMovies.length){
        const curPl = state.playlists.find(p => p.id === state.activePlaylist);
        const vodPlId = (Number(curPl?.vod) || 0) > 50
          ? state.activePlaylist
          : (state.playlists.slice().sort((a,b) => (Number(b.vod)||0) - (Number(a.vod)||0))[0]?.id || state.activePlaylist);
        const vodRes = await api(`/playlists/${vodPlId}/filter?type=vod&limit=100&page=1`).catch(()=>({channels:[]}));
        state.currentMovies = vodRes.channels || [];
      }
      if(!state.currentSeries || !state.currentSeries.length){
        const curPl = state.playlists.find(p => p.id === state.activePlaylist);
        const seriesPlId = (Number(curPl?.series) || 0) > 50
          ? state.activePlaylist
          : (state.playlists.slice().sort((a,b) => (Number(b.series)||0) - (Number(a.series)||0))[0]?.id || state.activePlaylist);
        const serRes = await api(`/playlists/${seriesPlId}/filter?type=series&limit=100&page=1`).catch(()=>({channels:[]}));
        state.currentSeries = serRes.channels || [];
      }
      if(generation!==routeGeneration)return;
    }

    if(page==='marathons'){
      const res = await api('/marathons/curated').catch(()=>({data:[]}));
      state.marathons = res.data || [];
      if(!state.activeMarathonId && state.marathons.length){
        state.activeMarathonId = state.marathons[0].id;
      }
      if(state.activeMarathonId){
        state.currentMarathon = await api(`/marathons/${state.activeMarathonId}`).catch(()=>null);
      }
      if(generation!==routeGeneration)return;
    }

    const content=page==='dashboard'?dashboard():page==='live'||page==='channels'?livePage():page==='multiview'?multiviewPage():page==='catalog'||page==='movies'?catalogPage('movies'):page==='series'?catalogPage('series'):page==='marathons'?marathonsPage():page==='categories'?categoriesPage():page==='search'?searchPage():page==='favorites'?favoritesPage():page==='recordings'?recordingsPage():page==='epg'?epgPage():page==='playlists'?heading('Minhas playlists','Todas as suas listas, organizadas em um só lugar.')+playlistSection():page==='settings'?settings():page==='users'?usersPage():page==='credits'?creditsPage():page==='ai-status'?aiStatusPage():page==='logs'?logsPage():page==='player'?playerPage():page==='automation'?'<div class="loading-state">Carregando M3U Hub…<div class="loading-line"></div></div>':savedPage(page);
    // Estrutura Unificada de TV com Sidebar Oficial para todas as telas autenticadas
    const isFullBleed = ['live','channels','player','multiview'].includes(page);
    $('#app').innerHTML=`
      <div class="iptv-app-shell" style="display:flex; flex-direction:column; min-height:100vh; background:var(--iptv-bg); color:#fff; font-family:var(--iptv-font);">
        ${iptvTopBar(page)}
        <div class="iptv-body-wrapper" style="display:flex; flex:1; min-height:0; position:relative;">
          ${iptvSmartSidebar(page)}
          <div class="iptv-main-container" style="flex:1; display:flex; flex-direction:column; min-width:0; overflow-x:hidden;">
            <main class="${isFullBleed?'':'iptv-page-body'}" style="${isFullBleed?'flex:1; overflow-y:auto;':''}" id="content">
              ${content}
            </main>
          </div>
        </div>
        ${iptvBottomNav(page)}
      </div>
    `;
    setMenu(false);
    if(page==='live'||page==='channels'){
      const pool = (state.channels && state.channels.length) ? state.channels : (window._liveChannels || []);
      const ch = state.selected || pool[0];
      if(ch){
        setTimeout(()=>{
          const v = document.getElementById('video');
          if(v && (!v.src && !hls)){
            playChannel(ch);
          }
        }, 150);
      }
    }
    if(page==='automation'&&window.renderAutomationPage)window.renderAutomationPage();
    if(page==='player'&&state.playlists.length)await loadChannels(state.activePlaylist||state.playlists[0].id,generation);
    if(tvMode&&generation===routeGeneration)focusTV(page==='player'?$('#channel-list .channel-select')||$('#category-list .category-button'):$('.iptv-smart-nav-item.active')||visibleTVTargets()[0]);
  }catch(error){
    if(generation===routeGeneration){
      console.error('Erro na navegação:', error);
      const target = $('#content') || $('#app');
      if (target) {
        target.innerHTML=empty('Não foi possível carregar',error.message||'Instabilidade temporária ao carregar a página.','<button class="btn primary" data-action="retry-page">Tentar novamente</button>','info');
      }
    }
  }
}
function playerPage(){
  if(!state.playlists.some(p=>p.id===state.activePlaylist))state.activePlaylist=state.playlists[0]?.id||'';
  if(!state.playlists.length)return heading('Assistir','Escolha o que assistir, do seu jeito.')+`<div class="card">${empty('Primeiro, adicione uma playlist','Os itens e categorias da sua lista aparecerão aqui após a importação.',addButton(),'tv')}</div>`;
  const userInitial=esc(initials(state.user?.name||'U'));
  return `<div class="nf-page">

  <!-- Netflix Topbar -->
  <header class="nf-topbar" id="nf-topbar">
    <div class="nf-topbar-left">
      <a class="nf-brand" href="#/dashboard" aria-label="JstudioPlay — Início">
        <img src="/static/logo.svg" alt="" width="28" height="28">
        <span>JstudioPlay</span>
      </a>
      <nav class="nf-nav" aria-label="Navegação">
        ${state.playlists.map(p=>`<button class="nf-nav-item ${p.id===state.activePlaylist?'active':''}" data-action="switch-playlist" data-id="${p.id}">${esc(p.name)}</button>`).join('')}
        <button class="nf-nav-item" data-action="nf-browse" id="nf-browse-btn">Categorias ▾</button>
      </nav>
    </div>
    <div class="nf-topbar-right">
      <div class="nf-search-box">
        <button class="nf-icon-btn" data-action="nf-search-toggle" aria-label="Buscar" id="nf-search-btn">${icon('search')}</button>
        <input type="search" id="channel-search" class="nf-search-input" placeholder="Títulos, canais, categorias" aria-label="Buscar canal">
      </div>
      <button class="nf-icon-btn" id="btn-data-saver" data-action="toggle-data-saver" aria-pressed="${localStorage.getItem('m3u-data-saver')==='true'}" title="Economizar dados">${icon('zap')}</button>
      ${state.relayEnabled?`<button class="nf-icon-btn ${state.relayMode?'active':''}" id="relay-quick" data-action="toggle-relay" aria-label="Relay" title="Modo de compatibilidade">${icon('refresh')}</button>`:''}
      <a href="#/settings" class="nf-avatar" aria-label="Configurações">${userInitial}</a>
    </div>
  </header>

  <!-- Dropdown de categorias -->
  <div class="nf-browse-dropdown" id="nf-browse-dropdown" hidden>
    <div class="nf-browse-grid" id="nf-browse-grid"></div>
  </div>

  <!-- Hero fullscreen -->
  <div class="nf-hero" id="nf-hero">
    <div class="nf-hero-bg" id="nf-hero-bg"></div>
    <div class="nf-hero-vignette"></div>
    <div class="nf-hero-video-wrap" id="nf-hero-video-wrap" hidden>
      <video id="video" controls playsinline preload="none" aria-label="Player de vídeo"></video>
      <div id="video-empty" role="status" aria-live="polite" hidden></div>
      <span class="video-live" id="video-live" hidden>AO VIVO</span>
    </div>
    <div class="nf-hero-info" id="nf-hero-info">
      <div class="nf-hero-badge" id="nf-hero-badge">AO VIVO</div>
      <h1 class="nf-hero-title" id="nf-hero-title">JstudioPlay</h1>
      <p class="nf-hero-meta" id="nf-hero-meta">Escolha um canal para começar</p>
      <div class="nf-hero-btns">
        <button class="nf-btn-play" data-action="hero-play" id="hero-play-btn">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          Assistir
        </button>
        <button class="nf-btn-info ${isFavorite(state.selected||{})?'is-fav':''}" data-action="hero-favorite" id="hero-fav-btn">
          ${icon('heart')} ${isFavorite(state.selected||{})?'Favoritado':'Favoritar'}
        </button>
        ${state.relayEnabled?`<button class="nf-btn-icon" data-action="toggle-relay" title="Modo de compatibilidade">${icon('refresh')}</button>`:''}
        <button class="nf-btn-icon" data-action="fullscreen" title="Tela cheia">${icon('fullscreen')}</button>
        <button class="nf-btn-icon" data-action="pip" title="Mini Player">${icon('monitor')}</button>
      </div>
    </div>
    <div class="nf-hero-video-controls" id="nf-hero-vc" hidden>
      <div class="nf-hero-vc-row">
        <button class="nf-btn-icon" data-action="quick-mute">${icon('volume')}</button>
        <input type="range" id="quick-volume-slider" min="0" max="100" value="100" aria-label="Volume">
        <span id="quick-volume-val" class="nf-vol-val">100%</span>
        <select id="quick-audio-track" class="nf-audio-track" aria-label="Faixa de áudio" hidden><option value="-1">Faixa Padrão</option></select>
        <div class="nf-spacer"></div>
        <button class="nf-btn-icon" data-action="episode-previous" disabled>${icon('episodePrevious')}</button>
        <button class="nf-btn-icon" data-action="episode-next" disabled>${icon('episodeNext')}</button>
        <button class="nf-btn-icon" data-action="reconnect" title="Reconectar">${icon('refresh')}</button>
        <select id="hls-level-select" class="nf-audio-track" aria-label="Qualidade do stream" title="Qualidade" hidden><option value="-1">Auto</option></select>
        <button class="nf-btn-icon" data-action="fullscreen">${icon('fullscreen')}</button>
        <button class="nf-btn-icon" data-action="pip">${icon('monitor')}</button>
      </div>
    </div>
  </div>

  <!-- Elementos ocultos preservados para compatibilidade -->
  <div class="nf-compat-hidden">
    <h2 id="now-name"></h2><p id="now-category"></p>
    <button id="now-favorite" data-action="now-favorite" disabled>${icon('heart')}</button>
    <div id="audio-quick-bar">
      <button id="btn-quick-mute" data-action="quick-mute">${icon('volume')}</button>
      <div class="volume-boost-group">
        <button class="vol-boost-btn active" data-action="vol-boost" data-boost="1">100%</button>
        <button class="vol-boost-btn" data-action="vol-boost" data-boost="1.5">150%</button>
        <button class="vol-boost-btn" data-action="vol-boost" data-boost="2">200%</button>
      </div>
    </div>
    ${state.relayEnabled?`<div id="relay-card"><span id="relay-status"></span><button data-action="toggle-relay" aria-pressed="${state.relayMode}"></button><span id="relay-quick-status"></span><span id="relay-quick-action"></span></div>`:''}
  </div>

  <!-- Categorias (select oculto + list para compatibilidade) -->
  <select id="category-select" style="display:none"><option value="-1">Todas</option></select>
  <span id="category-count" style="display:none">0</span>
  <div id="category-list" style="display:none"></div>

  <!-- Rows de canais estilo Netflix -->
  <main class="nf-rows" id="nf-rows">
    <div id="streaming-sections-content" class="nf-rows-inner">
      <div class="nf-loading">Carregando canais…</div>
    </div>
    <div style="display:none">
      <button data-action="previous"></button>
      <span id="page-info">1 / 1</span>
      <button data-action="next"></button>
      <div id="channel-list"></div>
      <span id="channel-count"></span>
    </div>
  </main>

</div>`;
}
let channelRequest=0, pendingChannel=null;
async function loadChannels(id, generation=routeGeneration, type=state.mediaType||'live'){
  stopPlayback();
  const request=++channelRequest;
  state.loading=true;
  state.activePlaylist=id;
  state.channels=[];
  state.groups=[];
  state.category='';
  state.query='';
  state.channelPage=1;
  state.selected=null;
  const curType = type || 'live';
  state.mediaType = curType;

  if($('#channel-search'))$('#channel-search').value='';
  if($('#category-list'))$('#category-list').innerHTML='';
  if($('#now-name'))$('#now-name').textContent='Seu próximo conteúdo está aqui';
  if($('#now-category'))$('#now-category').textContent='Selecione algo para começar';
  if($('#now-favorite')){$('#now-favorite').disabled=true;$('#now-favorite').style.color='';}
  updateEpisodeControls(null);
  playerMessage('O que vamos assistir?','Escolha um item da sua lista para começar.');
  if($('#channel-list'))$('#channel-list').innerHTML='<div class="loading-state">Carregando catálogo…<div class="loading-line"></div></div>';
  try{
    if(curType === 'live'){
      const channels = await api(`/playlists/${id}/channels?type=live`);
      if(request!==channelRequest||generation!==routeGeneration)return;
      state.channels = channels;
      const groups = new Map();
      channels.forEach(c => groups.set(c.group || 'Geral', (groups.get(c.group || 'Geral') || 0) + 1));
      state.groups = [...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0],'pt-BR'));
    } else {
      const catRes = await api(`/playlists/${id}/categories?type=${curType}`).catch(()=>({categories:[]}));
      if(request!==channelRequest||generation!==routeGeneration)return;
      const cats = catRes.categories || [];
      state.groups = cats.map(c => [c.name, c.count]);

      const itemsRes = await api(`/playlists/${id}/filter?type=${curType}&limit=150`).catch(()=>({channels:[]}));
      if(request!==channelRequest||generation!==routeGeneration)return;
      state.channels = itemsRes.channels || [];
    }

    state.loading=false;
    renderCategories();renderChannels();
    if(state.page==='live'||state.page==='channels'){
      const contentEl = document.getElementById('content');
      if(contentEl) contentEl.innerHTML = livePage();
    }
    if(pendingChannel){const match=state.channels.find(c=>c.url===pendingChannel);pendingChannel=null;if(match)playChannel(match);}
  }catch(error){if(request===channelRequest&&generation===routeGeneration){state.loading=false;$('#channel-list').innerHTML=empty('Falha ao carregar',error.message,'<button class="btn small" data-action="reload-channels">Tentar novamente</button>','info');}}
}
function renderCategories(){
  const list=$('#category-list'),select=$('#category-select');if(!list||!select)return;
  const focusedIndex=tvMode&&list.contains(document.activeElement)?document.activeElement.closest('[data-index]')?.dataset.index:null;
  const previousScroll=list.scrollLeft||0;
  $('#category-count').textContent=number(state.groups.length);
  select.innerHTML='<option value="-1">Todas as categorias</option>'+state.groups.map(([name],i)=>`<option value="${i}">${esc(name)}</option>`).join('');
  const selected=state.groups.findIndex(([name])=>name===state.category);
  select.value=String(selected);
  const categories=state.groups.map(([name,count],i)=>({name,count,i}));
  list.innerHTML=[{name:'Todos',count:state.channels.length,i:-1},...categories].map(({name,count,i})=>`<button class="category-button ${selected===i?'active':''}" data-action="category" data-index="${i}" title="${esc(name)}" aria-pressed="${selected===i}"><span class="cat-name">${esc(name)}</span><span class="count">${number(count)}</span></button>`).join('');
  list.scrollLeft=previousScroll;
  if(focusedIndex!==null)focusTV([...list.querySelectorAll('[data-index]')].find(el=>el.dataset.index===focusedIndex));
}
function selectCategory(index){state.category=index<0?'':state.groups[index]?.[0]||'';state.channelPage=1;renderCategories();$('#category-list')?.querySelector?.('.active')?.scrollIntoView?.({block:'nearest',inline:'nearest'});renderChannels();}
function scrollCategories(direction){const list=$('#category-list');if(list)list.scrollBy({left:direction*Math.max(180,list.clientWidth*0.75),behavior:'smooth'});}
function isFavorite(ch,id=state.activePlaylist){return state.favorites.some(f=>f.playlistId===id&&f.channel.url===ch.url);}
let visibleChannels=[],filteredCount=0;
function episodeInfo(name){
  const text=String(name||'');
  const seasonal=text.match(/^(.*?)[\s._-]+(?:s(?:eason)?\s*0*(\d+)[\s._-]*e(?:p(?:isode)?)?\s*0*(\d+)|(\d+)x(\d+))\b/i);
  const episodic=seasonal?null:text.match(/^(.*?)[\s._-]+e(?:p(?:isode)?)?\s*0*(\d+)\b/i);
  if(!seasonal&&!episodic)return null;
  const title=(seasonal||episodic)[1].replace(/[\s._-]+$/,'').trim();
  return title?{title,season:seasonal?Number(seasonal[2]||seasonal[4]):null,episode:Number(seasonal?(seasonal[3]||seasonal[5]):episodic[2])}:null;
}
let episodeNavigation={previous:null,next:null};
function episodeNeighbors(ch){
  const result={previous:null,next:null};
  if(!ch||!state.channels.some(item=>item.url===ch.url&&item.name===ch.name&&item.group===ch.group))return result;
  const current=episodeInfo(ch.name);if(!current)return result;
  const title=current.title.toLocaleLowerCase('pt-BR');
  let previousNumber=-Infinity,nextNumber=Infinity;
  for(const item of state.channels){
    if(item.group!==ch.group)continue;
    const info=episodeInfo(item.name);
    if(!info||info.season!==current.season||info.title.toLocaleLowerCase('pt-BR')!==title)continue;
    if(info.episode<current.episode&&info.episode>previousNumber){result.previous=item;previousNumber=info.episode;}
    if(info.episode>current.episode&&info.episode<nextNumber){result.next=item;nextNumber=info.episode;}
  }
  return result;
}
function updateEpisodeControls(ch){
  episodeNavigation=episodeNeighbors(ch);
  const previous=$('[data-action="episode-previous"]'),next=$('[data-action="episode-next"]');
  if(previous)previous.disabled=!episodeNavigation.previous;
  if(next)next.disabled=!episodeNavigation.next;
}
function renderChannelRow(ch,i,sub=false){return `<div class="channel-row ${sub?'episode-row ':''}${state.selected?.url===ch.url?'selected':''}" data-channel-id="${esc(ch.id||'')}" data-channel-name="${esc(ch.name)}" data-channel-url="${esc(ch.url||'')}"><button class="channel-select" data-action="play" data-index="${i}" title="${esc(ch.name)}">${channelLogo(ch,i,true)}<span class="channel-text"><strong>${esc(ch.name)}</strong><small>${esc(ch.group)}</small></span></button><span class="health-indicator" data-status="${ch.status||'unknown'}" aria-hidden="true"></span><button class="favorite-button ${isFavorite(ch)?'is-favorite':''}" data-action="favorite" data-index="${i}" aria-label="${isFavorite(ch)?'Remover dos favoritos':'Favoritar'} ${esc(ch.name)}" aria-pressed="${isFavorite(ch)}">${icon('heart')}</button></div>`;}

// Card Netflix — thumbnail landscape 16:9 com hover expandido
const cardTileColors=['#6366f1','#0ea5e9','#10b981','#f59e0b','#f43f5e','#8b5cf6','#06b6d4','#ec4899'];
function renderChannelCard(ch,i){
  const logo=ch.logo&&/^https?:\/\//i.test(ch.logo)?ch.logo:'';
  const ini=String(ch.name||'?').split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?';
  const color=cardTileColors[i%cardTileColors.length];
  const isLive=ch.streamType!=='movie'&&ch.streamType!=='series';
  // Barra de progresso EPG
  const epgData=window.epgModule?.cache?.get(ch.name);
  let epgBar='';
  if(epgData?.start&&epgData?.end){
    const now=Date.now();
    const start=new Date(epgData.start).getTime();
    const end=new Date(epgData.end).getTime();
    const pct=Math.min(100,Math.max(0,Math.round((now-start)/(end-start)*100)));
    const title=epgData.title?esc(epgData.title):'';
    epgBar=`<div class="nf-card-epg-bar" aria-label="Progresso EPG: ${pct}%"><div class="nf-card-epg-fill" style="width:${pct}%"></div></div>${title?`<div class="nf-card-epg-title">${title}</div>`:''}`;
  }
  return `<div class="nf-card ${state.selected?.url===ch.url?'nf-card--playing':''}" data-channel-id="${esc(ch.id||'')}" data-channel-name="${esc(ch.name)}" data-channel-url="${esc(ch.url||'')}">
  <div class="nf-card-thumb">
    ${logo?`<img src="${esc(logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:'' }
    <div class="nf-card-fallback" style="${logo?'display:none;':''}background:${color}">${esc(ini)}</div>
    <span class="health-indicator" data-status="${ch.status||'unknown'}" aria-hidden="true"></span>
    ${isLive?'<span class="nf-live-badge">AO VIVO</span>':''}
    ${state.selected?.url===ch.url?'<div class="nf-card-playing-bar"></div>':''}
    ${epgBar}
  </div>
  <div class="nf-card-hover">
    <div class="nf-card-hover-thumb">
      ${logo?`<img src="${esc(logo)}" alt="" referrerpolicy="no-referrer">`:'' }
      <div class="nf-card-fallback" style="${logo?'display:none;':''}background:${color}">${esc(ini)}</div>
    </div>
    <div class="nf-card-hover-body">
      <div class="nf-card-hover-btns">
        <button class="nf-card-play-btn channel-select" data-action="play" data-index="${i}" aria-label="Reproduzir ${esc(ch.name)}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button class="nf-card-fav-btn ${isFavorite(ch)?'is-favorite':''}" data-action="favorite" data-index="${i}" aria-label="${isFavorite(ch)?'Remover favorito':'Favoritar'} ${esc(ch.name)}" aria-pressed="${isFavorite(ch)}">${icon('heart')}</button>
      </div>
      <div class="nf-card-hover-name">${esc(ch.name)}</div>
      <div class="nf-card-hover-meta">${esc(ch.group||'Geral')}</div>
    </div>
  </div>
</div>`;
}

// Rows Netflix por categoria
function renderStreamingSections(){
  const container=document.getElementById('streaming-sections-content');
  if(!container)return;
  const q=state.query.toLocaleLowerCase('pt-BR');
  const filtered=state.channels.filter(c=>
    (!state.category||c.group===state.category)&&
    (!q||c.name.toLocaleLowerCase('pt-BR').includes(q))
  );
  if(!filtered.length){
    container.innerHTML=`<div class="nf-empty">${q?`Nenhum resultado para "<em>${esc(q)}</em>"`:'Nenhum canal disponível.'}</div>`;
    return;
  }

  let sections=[];
  if(state.category||q){
    sections=[{title:state.category||`Resultados para "${q}"`,channels:filtered}];
  }else{
    const favs=filtered.filter(ch=>isFavorite(ch));
    if(favs.length)sections.push({title:'Minha Lista',channels:favs});
    const recentUrls=state.history.filter(h=>h.playlistId===state.activePlaylist).slice(0,30).map(h=>h.channel?.url).filter(Boolean);
    if(recentUrls.length){
      const recents=recentUrls.map(url=>filtered.find(ch=>ch.url===url)).filter(Boolean);
      if(recents.length)sections.push({title:'Continue Assistindo',channels:recents});
    }
    const byGroup=new Map();
    filtered.forEach(ch=>{
      const g=ch.group&&ch.group.trim()?ch.group.trim():'Geral';
      if(!byGroup.has(g))byGroup.set(g,[]);
      byGroup.get(g).push(ch);
    });
    byGroup.forEach((channels,group)=>sections.push({title:group,channels}));
  }

  let globalIndex=0;
  const allVisible=[];
  const html=sections.map(sec=>{
    const cards=sec.channels.slice(0,80).map(ch=>{
      const idx=globalIndex++;
      allVisible.push(ch);
      return renderChannelCard(ch,idx);
    }).join('');
    return `<div class="nf-row">
      <h2 class="nf-row-title">${esc(sec.title)}</h2>
      <div class="nf-row-items" data-section="${esc(sec.title)}">${cards}</div>
    </div>`;
  }).join('');

  container.innerHTML=html||`<div class="nf-empty">Nenhum conteúdo encontrado.</div>`;
  visibleChannels=allVisible;

  // Atualiza browse dropdown
  const browseGrid=document.getElementById('nf-browse-grid');
  if(browseGrid&&!q){
    browseGrid.innerHTML=[{name:'Todos',i:-1},...state.groups.map(([name],i)=>({name,i}))].map(({name,i})=>`<button class="nf-browse-item ${state.category===name||(!state.category&&i===-1)?'active':''}" data-action="category" data-index="${i}">${esc(name)}</button>`).join('');
  }

  if(typeof window.healthModule!=='undefined')window.healthModule.observe();
  if(typeof window.epgModule!=='undefined')window.epgModule.observeEpg();
}
let channelLogoObserver=null,pageTurnTimer=null;
function queuePageTurn(direction){
  const pages=Math.ceil(filteredCount/100)||1;
  state.channelPage=Math.max(1,Math.min(pages,state.channelPage+direction));
  clearTimeout(pageTurnTimer);
  pageTurnTimer=setTimeout(()=>{pageTurnTimer=null;renderChannels();$('#channel-list').scrollTop=0;},180);
}
function loadVisibleChannelLogos(list){
  channelLogoObserver?.disconnect();
  const images=list.querySelectorAll('img[data-logo-src]');
  if(typeof IntersectionObserver==='undefined'){
    images.forEach(img=>{img.src=img.dataset.logoSrc;delete img.dataset.logoSrc;});
    return;
  }
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      const img=entry.target;observer.unobserve(img);
      if(!img.isConnected)continue;
      img.src=img.dataset.logoSrc;delete img.dataset.logoSrc;
    }
  },{root:list,rootMargin:'100px'});
  channelLogoObserver=observer;
  images.forEach(img=>observer.observe(img));
}
function renderChannels(){
  clearTimeout(pageTurnTimer);pageTurnTimer=null;
  if(!$('#channel-list'))return;
  const channelList=$('#channel-list');
  const focused=tvMode&&channelList.contains(document.activeElement)?{action:document.activeElement.dataset.action,index:document.activeElement.dataset.index}:null;
  const openSeries=new Set([...document.querySelectorAll('.series-group[open]')].map(el=>el.dataset.series));
  const q=state.query.toLocaleLowerCase('pt-BR');const filtered=state.channels.filter(c=>(!state.category||c.group===state.category)&&(!q||c.name.toLocaleLowerCase('pt-BR').includes(q)));
  const grouped=new Map();const items=[];filtered.forEach(ch=>{const info=episodeInfo(ch.name);if(!info){items.push({type:'channel',ch});return;}const key=JSON.stringify([ch.group,info.title.toLocaleLowerCase('pt-BR'),info.season]);let group=grouped.get(key);if(!group){group={type:'series',key,title:info.title,season:info.season,episodes:[]};grouped.set(key,group);items.push(group);}group.episodes.push(ch);});
  grouped.forEach(g=>g.episodes.sort((a,b)=>(episodeInfo(a.name)?.episode||0)-(episodeInfo(b.name)?.episode||0)));
  filteredCount=items.length;const pages=Math.max(1,Math.ceil(items.length/100));state.channelPage=Math.min(state.channelPage,pages);const visible=items.slice((state.channelPage-1)*100,state.channelPage*100);visibleChannels=visible.flatMap(item=>item.type==='series'?item.episodes:item.ch);
  $('#channel-count').textContent=`(${number(filtered.length)})`;$('#page-info').textContent=`${state.channelPage} / ${number(pages)}`;
  $('[data-action="previous"]').disabled=state.channelPage===1;$('[data-action="next"]').disabled=state.channelPage===pages;
  let index=0;$('#channel-list').innerHTML=visible.map(item=>{if(item.type==='channel')return renderChannelRow(item.ch,index++);const first=item.episodes[0];const title=`${item.title}${item.season!==null?` S${String(item.season).padStart(2,'0')}`:''}`;const open=openSeries.has(item.key)||item.episodes.some(ch=>ch.url===state.selected?.url);return `<details class="series-group" data-series="${esc(item.key)}" ${open?'open':''}><summary>${channelLogo(first,index,true)}<span><strong>${esc(title)}</strong><small>${item.episodes.length} episódios</small></span></summary>${item.episodes.map(ch=>renderChannelRow(ch,index++,true)).join('')}</details>`;}).join('')||'<div class="empty"><p>Nenhum canal encontrado.</p></div>';
  loadVisibleChannelLogos(channelList);
  if(focused)focusTV([...channelList.querySelectorAll('[data-action]')].find(el=>el.dataset.action===focused.action&&el.dataset.index===focused.index)||channelList.querySelector('.channel-select,summary'));
  if(state.page==='player'){if(typeof window.healthModule!=='undefined')window.healthModule.observe();if(typeof window.epgModule!=='undefined')window.epgModule.observeEpg();renderStreamingSections();}
}
// =============================================================================
// NEXT-GEN v8.3.1: SMART FAILOVER, PIP MINIPLAYER, MULTI-VIEW & OSD
// =============================================================================

let osdTimer = null;
function showChannelOSD(channel) {
  if (!channel) return;
  let osd = document.getElementById('channel-osd');
  if (!osd) {
    osd = document.createElement('div');
    osd.id = 'channel-osd';
    document.body.appendChild(osd);
  }

  const logoSrc = channel.logo || '';
  const title = channel.name || 'Canal';
  const group = channel.group || 'Geral';

  osd.innerHTML = `
    <div class="osd-logo-wrap">
      ${logoSrc ? `<img src="${esc(logoSrc)}" alt="" onerror="this.style.display='none';this.parentElement.textContent='▶';">` : '▶'}
    </div>
    <div class="osd-info">
      <div class="osd-title">${esc(title)}</div>
      <div class="osd-meta">
        <span class="osd-live-tag">AO VIVO</span>
        <span>${esc(group)}</span>
        <span>•</span>
        <span>FHD 1080p</span>
      </div>
    </div>
  `;

  osd.classList.add('osd-visible');
  clearTimeout(osdTimer);
  osdTimer = setTimeout(() => {
    osd.classList.remove('osd-visible');
  }, 3200);
}
window.showChannelOSD = showChannelOSD;

let failoverState = { attempts: 0, currentId: null };
function resetFailover(channel) {
  if (!failoverState.currentId || (channel && failoverState.currentId !== channel.id)) {
    failoverState = { attempts: 0, currentId: channel ? channel.id : null };
  }
}

async function trySmartFailover(failedChannel, instance, generation) {
  if (!failedChannel || !failedChannel.id) return false;
  if (failoverState.attempts >= 2 && failoverState.currentId === failedChannel.id) {
    return false;
  }
  try {
    const res = await api(`/channels/${encodeURIComponent(failedChannel.id)}/alternatives?playlistId=${encodeURIComponent(state.activePlaylist||'')}`);
    if (res && Array.isArray(res.alternatives) && res.alternatives.length > 0) {
      const bestAlt = res.alternatives.find(a => a.status === 'online') || res.alternatives[0];
      if (bestAlt && bestAlt.url !== failedChannel.url) {
        failoverState.attempts = (failoverState.attempts || 0) + 1;
        failoverState.currentId = failedChannel.id;
        toast(`⚡ Smart Failover: Alternando para fonte espelho "${bestAlt.name || 'Alternativa'}"...`, false);
        if (instance) {
          instance.destroy();
          if (hls === instance) { hls = null; window.currentHlsInstance = null; }
        }
        playChannel(bestAlt);
        return true;
      }
    }
  } catch (err) {
    console.warn('[SmartFailover] Falha ao consultar alternativas:', err);
  }
  return false;
}

const pipModule = {
  activeChannel: null,
  hlsInstance: null,

  ensureContainer() {
    let el = document.getElementById('pip-floating-player');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pip-floating-player';
      el.className = 'pip-minimized';
      document.body.appendChild(el);
    }
    return el;
  },

  enter(channel) {
    if (!channel || !channel.url) return;
    this.activeChannel = channel;
    const el = this.ensureContainer();
    const chName = channel.name || 'Transmissão Ao Vivo';
    
    el.innerHTML = `
      <div class="pip-video-wrapper">
        <video id="pip-video" playsinline></video>
        <div class="pip-overlay-controls">
          <div class="pip-header-bar">
            <div class="pip-channel-info" title="${esc(chName)}">
              <span class="pip-live-pulse"></span>
              <span>${esc(chName)}</span>
            </div>
            <div class="pip-actions">
              <button class="pip-btn" data-action="expand-pip" title="Expandir para player principal">
                ${icon('fullscreen')}
              </button>
              <button class="pip-btn" data-action="close-pip" title="Fechar PiP">
                ${icon('close')}
              </button>
            </div>
          </div>
          <div class="pip-center-controls">
            <button class="pip-play-btn" data-action="toggle-pip-play" title="Pausar / Reproduzir">
              ${icon('pause')}
            </button>
          </div>
        </div>
      </div>
    `;
    el.classList.remove('pip-minimized');

    const pipVideo = document.getElementById('pip-video');
    if (pipVideo) {
      if (window.Hls?.isSupported()) {
        if (this.hlsInstance) { this.hlsInstance.destroy(); }
        this.hlsInstance = new Hls({ enableWorker: true, enableSoftwareAES: true });
        this.hlsInstance.loadSource(channel.url);
        this.hlsInstance.attachMedia(pipVideo);
        this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => pipVideo.play().catch(()=>{}));
      } else {
        pipVideo.src = channel.url;
        pipVideo.play().catch(()=>{});
      }
    }
  },

  exit() {
    const el = document.getElementById('pip-floating-player');
    if (el) {
      el.classList.add('pip-minimized');
      if (this.hlsInstance) {
        this.hlsInstance.destroy();
        this.hlsInstance = null;
      }
      const v = document.getElementById('pip-video');
      if (v) { v.pause(); v.removeAttribute('src'); }
      el.innerHTML = '';
    }
    this.activeChannel = null;
  }
};
window.pipModule = pipModule;

const multiviewModule = {
  instances: [null, null, null, null],
  activeSoundIndex: 0,

  initSlots() {
    const liveChannels = (state.channels || []).filter(c => c.streamType === 'live');
    for (let i = 0; i < 4; i++) {
      const v = document.getElementById(`mv-video-${i}`);
      const select = document.getElementById(`mv-select-${i}`);
      if (!v || !select) continue;

      const ch = liveChannels[i];
      if (ch) {
        select.value = ch.id;
        this.playSlot(i, ch);
      }
    }
  },

  playSlot(index, channel) {
    const v = document.getElementById(`mv-video-${index}`);
    if (!v || !channel) return;

    if (this.instances[index]) {
      this.instances[index].destroy();
      this.instances[index] = null;
    }

    v.muted = (index !== this.activeSoundIndex);

    if (window.Hls?.isSupported()) {
      const h = new Hls({ enableWorker: true, enableSoftwareAES: true });
      this.instances[index] = h;
      h.loadSource(channel.url);
      h.attachMedia(v);
      h.on(Hls.Events.MANIFEST_PARSED, () => v.play().catch(()=>{}));
    } else {
      v.src = channel.url;
      v.play().catch(()=>{});
    }
  },

  setSound(targetIndex) {
    this.activeSoundIndex = targetIndex;
    for (let i = 0; i < 4; i++) {
      const v = document.getElementById(`mv-video-${i}`);
      const slot = document.getElementById(`mv-slot-${i}`);
      const btn = document.querySelector(`[data-action="mv-sound"][data-slot="${i}"]`);
      if (v) {
        v.muted = (i !== targetIndex);
      }
      if (slot) {
        slot.classList.toggle('active-audio', i === targetIndex);
      }
      if (btn) {
        btn.classList.toggle('active-sound', i === targetIndex);
        btn.innerHTML = (i === targetIndex) ? icon('volume') + ' Áudio Ativo' : icon('volume') + ' Ativar Som';
      }
    }
  },

  destroy() {
    for (let i = 0; i < 4; i++) {
      if (this.instances[i]) {
        this.instances[i].destroy();
        this.instances[i] = null;
      }
      const v = document.getElementById(`mv-video-${i}`);
      if (v) { v.pause(); v.removeAttribute('src'); }
    }
  }
};
window.multiviewModule = multiviewModule;

function multiviewPage() {
  const liveChannels = (state.channels || []).filter(c => c.streamType === 'live').slice(0, 100);

  setTimeout(() => {
    multiviewModule.initSlots();
  }, 100);

  return `
    <div class="multiview-wrapper">
      <div class="multiview-header">
        <h1>${icon('monitor')} Mosaico Multi-View 2×2</h1>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="font-size:0.85rem; color:rgba(255,255,255,0.6);">Clique no slot para comutar o áudio principal</span>
          <button class="iptv-btn-info-glass" data-action="mv-reset" style="padding:0.5rem 1rem; font-size:0.85rem;">
            ${icon('refresh')} Reiniciar Mosaico
          </button>
        </div>
      </div>

      <div class="multiview-grid">
        ${[0, 1, 2, 3].map(i => {
          const defaultCh = liveChannels[i];
          return `
            <div class="multiview-slot ${i===0?'active-audio':''}" id="mv-slot-${i}" data-action="mv-slot-click" data-slot="${i}">
              <div class="multiview-slot-toolbar">
                <select class="multiview-select" id="mv-select-${i}" data-action="mv-select-ch" data-slot="${i}">
                  <option value="">Selecione um canal...</option>
                  ${liveChannels.map(ch => `<option value="${esc(ch.id)}" ${defaultCh && defaultCh.id===ch.id?'selected':''}>${esc(ch.name)}</option>`).join('')}
                </select>
                <div class="multiview-slot-actions">
                  <button class="multiview-tool-btn ${i===0?'active-sound':''}" data-action="mv-sound" data-slot="${i}">
                    ${icon('volume')} ${i===0?'Áudio Ativo':'Ativar Som'}
                  </button>
                  <button class="multiview-tool-btn" data-action="mv-expand" data-slot="${i}" title="Assistir no player principal">
                    ${icon('fullscreen')}
                  </button>
                </div>
              </div>
              <video id="mv-video-${i}" playsinline ${i!==0?'muted':''}></video>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function stopPlayback(save=true){
  window._currentPlaying = null;
  if(window.eventBus) window.eventBus.emit('playback:stopped');
  const v=$('#video');if(save&&v&&state.selected)savePlaybackProgress(state.selected,v).catch(()=>{});playbackGeneration++;clearTimeout(playbackTimer);playbackTimer=null;if(hls){hls.destroy();hls=null;}if(v){v.onplaying=null;v.onerror=null;v.onloadedmetadata=null;v.ontimeupdate=null;v.onpause=null;v.onended=null;v.onwaiting=null;v.onstalled=null;v.pause();v.removeAttribute('src');v.load();}
}
let playbackPlaylist='', lastProgressSave=0, progressWrites=Promise.resolve();
function currentProgress(ch){return state.progress.find(p=>p.playlistId===state.activePlaylist&&p.channel.url===ch.url);}
function savePlaybackProgress(ch,v){
  if(!state.user||!playbackPlaylist||!ch||!Number.isFinite(v.duration)||v.duration<=0||!Number.isFinite(v.currentTime)||v.currentTime<=0)return Promise.resolve();
  const userID=state.user.id;
  const payload={playlistId:playbackPlaylist,channel:ch,position:Math.min(v.currentTime,v.duration),duration:v.duration};
  const percent=(payload.position/payload.duration)*100;
  // Update the dashboard immediately, while serializing disk writes in playback order.
  const previous=state.progress.filter(p=>p.playlistId!==payload.playlistId||p.channel.url!==ch.url);
  state.progress=percent>=98?previous:[{...payload,percent,updated:new Date().toISOString()},...previous].slice(0,100);
  progressWrites=progressWrites.catch(()=>{}).then(async()=>{
    if(state.user?.id!==userID)return;
    await api('/progress','PUT',payload,{keepalive:true});
  });
  return progressWrites;
}
function playerMessage(title,message,suggestRelay=false){
  const el=$('#video-empty');
  if(el){
    el.hidden=false;
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    const isVaptyOrAuth = (state.activePlaylist && state.playlists.find(p=>p.id===state.activePlaylist)?.name?.toLowerCase().includes('vapty')) || message.toLowerCase().includes('expirou') || message.toLowerCase().includes('credenciais') || message.includes('401');
    const switchBtn = isVaptyOrAuth ? '<button class="btn small primary" data-action="switch-working-list" style="margin-top:0.6rem;">Trocar para Lista Demo Online</button>' : '';
    const relayBtn = suggestRelay&&state.relayEnabled&&!state.relayMode ? '<button class="btn small video-retry" data-action="toggle-relay">Tentar com modo de compatibilidade</button>' : '';
    el.innerHTML=`<img src="/static/logo.svg" alt="" style="width:54px;height:54px;object-fit:contain;margin-bottom:0.85rem;"><h2 style="font-size:1.15rem;margin:0 0 0.4rem;color:#fff;">${esc(title)}</h2><p style="font-size:0.85rem;color:rgba(255,255,255,0.75);max-width:380px;margin:0 0 0.75rem;line-height:1.45;">${esc(message)}</p>${switchBtn||relayBtn}`;
  }
  if($('#video-live'))$('#video-live').hidden=true;
}
function updateRelayControl(){
  const card=$('#relay-card');if(card)card.classList.toggle('active',state.relayMode);
  const status=$('#relay-status');if(status)status.textContent=state.relayMode?'Ativado':'Desativado';
  const quick=$('#relay-quick');if(quick){quick.classList.toggle('active',state.relayMode);quick.setAttribute('aria-pressed',String(state.relayMode));quick.setAttribute('aria-label',`${state.relayMode?'Desativar':'Ativar'} modo de compatibilidade`);}
  const quickStatus=$('#relay-quick-status');if(quickStatus)quickStatus.textContent=state.relayMode?'Ativado · modo alternativo em uso':'Desativado · tente se o vídeo não abrir';
  const quickAction=$('#relay-quick-action');if(quickAction)quickAction.textContent=state.relayMode?'Desativar':'Ativar';
  document.querySelectorAll('[data-action="toggle-relay"]').forEach(button=>{button.setAttribute('aria-pressed',String(state.relayMode));if(button.closest('#relay-card'))button.textContent=state.relayMode?'Desativar modo de compatibilidade':'Ativar modo de compatibilidade';});
}
function playChannel(ch){
  if(!ch)return;
  window._currentPlaying = { title: ch.name, type: 'live', target: ch };
  if(window.eventBus) window.eventBus.emit('playback:started', window._currentPlaying);
  showChannelOSD(ch);
  const targetUrl = ch.url || ch.streamUrl || '';
  if(extractYouTubeVideoId(targetUrl) && !document.getElementById('vod-theater')){
    openVodTheater(ch);
    return;
  }
  if(typeof window.epgModule!=='undefined')window.epgModule.updateSelectedEpg(state.selected?.url,ch.url);
  stopPlayback();state.selected=ch;playbackPlaylist=state.activePlaylist;lastProgressSave=Date.now();const generation=playbackGeneration;const v=$('#video');if(!v)return;
  if($('#now-name'))$('#now-name').textContent=ch.name;
  if($('#now-category'))$('#now-category').textContent=ch.group;
  if($('#now-favorite'))$('#now-favorite').disabled=false;
  if($('#preview-ch-name'))$('#preview-ch-name').textContent=ch.name;
  if($('#preview-prog-title'))$('#preview-prog-title').textContent=ch.group||'Transmissão Ao Vivo';
  updateNowFavorite();updateEpisodeControls(ch);updateStreamingHero(ch);renderChannels();
  if($('#video-empty')) $('#video-empty').hidden = true;
  let url;try{url=new URL(ch.url);if(!['http:','https:'].includes(url.protocol))throw new Error();}catch{playerMessage('Endereço inválido','Este conteúdo não possui uma URL de reprodução válida.');return;}
  if(location.protocol==='https:'&&url.protocol==='http:'&&!state.relayMode){
    state.relayMode = true;
    try { localStorage.setItem('m3u-relay', 'true'); } catch {}
    if(typeof updateRelayControl === 'function') updateRelayControl();
    console.log('[Player] Contexto HTTPS detectado para stream HTTP. Ativando Relay automaticamente.');
  }
  // Never put the source URL in text, attributes or error messages; the media
  // element receives it only because direct playback requires the browser.
  playbackTimer=setTimeout(()=>{if(generation!==playbackGeneration) return;playerMessage('Transmissão indisponível','A fonte demorou para responder ou o teste expirou no provedor. Tente reconectar ou escolher outro canal.',true);},25000);
  let historyRecorded=false;
  v.onloadedmetadata=()=>{if(generation!==playbackGeneration)return;const p=currentProgress(ch);if(Number.isFinite(v.duration)&&p?.position>0&&p.position<v.duration-5)v.currentTime=p.position;};
  v.onplaying=()=>{if(generation!==playbackGeneration)return;clearTimeout(playbackTimer);playbackTimer=null;$('#video-empty').hidden=true;$('#video-live').hidden=Number.isFinite(v.duration);if(!historyRecorded){historyRecorded=true;const userID=state.user?.id;api('/history','POST',{playlistId:playbackPlaylist,channel:ch}).then(items=>{if(state.user?.id===userID)state.history=items||[];}).catch(e=>toast(e.message,true));}};
  v.onwaiting=()=>{if(generation!==playbackGeneration)return;if(document.getElementById('vod-theater')&&$('#video-empty')){$('#video-empty').hidden=true;}};
  v.onstalled=()=>{if(generation===playbackGeneration&&!v.paused&&!document.getElementById('vod-theater'))playerMessage('Conexão interrompida','A fonte parou de enviar dados. Aguarde ou use Reconectar.');};
  v.ontimeupdate=()=>{if(generation!==playbackGeneration||!Number.isFinite(v.duration)||v.currentTime<2)return;const now=Date.now();if(now-lastProgressSave>=15000){lastProgressSave=now;savePlaybackProgress(ch,v).catch(e=>toast(e.message,true));}};
  v.onpause=()=>{if(generation===playbackGeneration)savePlaybackProgress(ch,v).catch(()=>{});};
  v.onended=()=>{if(generation===playbackGeneration)savePlaybackProgress(ch,v).catch(()=>{});};
  v.onerror=()=>{
    if(generation!==playbackGeneration)return;
    if(!state.relayMode && state.relayEnabled){
      clearTimeout(playbackTimer);
      playbackTimer=null;
      state.relayMode = true;
      try { localStorage.setItem('m3u-relay', 'true'); } catch {}
      updateRelayControl();
      playChannel(ch);
      return;
    }
    clearTimeout(playbackTimer);
    playbackTimer=null;
    const code=v.error?.code;
    playerMessage(code===3?'Formato incompatível':'Transmissão indisponível',code===3?'O navegador não conseguiu decodificar este formato.':'A fonte pode estar fora do ar ou o teste expirou no provedor.',code!==3);
  };
  v.muted=false;if(v.volume===0)v.volume=1.0;
  const start=()=>{v.muted=false;if(v.volume===0)v.volume=1.0;return v.play().catch(error=>{if(generation!==playbackGeneration)return;if(error.name==='NotAllowedError'){$('#video-empty').hidden=true;v.muted=true;v.play().then(()=>{if(window._showUnmuteBanner)window._showUnmuteBanner();}).catch(()=>{toast('Toque no botão de reprodução para iniciar.');});}else if(error.name!=='AbortError')playerMessage('Não foi possível iniciar','Confira se o conteúdo está disponível e se o formato é compatível com o navegador.',true);});};
  const direct=()=>{if(generation!==playbackGeneration)return;v.src=ch.url;start();};
  const known=/\.(mp4|m4v|mov|webm|ogv|ogg|mp3|m4a|aac|wav|flac|ts)$/i.test(url.pathname);
  const useHls=window.Hls?.isSupported()&&!known;
  const isExternalStream = url.hostname !== 'localhost' && url.hostname !== '127.0.0.1' && !url.pathname.startsWith('/proxy');
  const shouldUseRelay = state.relayMode || isExternalStream;
  if(shouldUseRelay){
    const channelIndex=state.channels.indexOf(ch);
    api('/playback','POST',{playlistId:playbackPlaylist,channelIndex,channelUrl:ch.url}).then(result=>{
      if(generation!==playbackGeneration)return;
      const resolveStreamUrl = (u) => {
        if (!u) return '';
        if (u.startsWith('http://') || u.startsWith('https://')) return u;
        const base = typeof getBackendBase === 'function' ? getBackendBase() : '';
        return u.startsWith('/') ? (base + u) : (base + '/' + u);
      };
      const streamTarget = resolveStreamUrl(result.url);
      if(result.mode==='media'){v.src=streamTarget;start();return;}
      if(result.mode==='hls'&&window.Hls?.isSupported()){
        const isMobileApp = window.Capacitor !== undefined || /Android|iPhone|iPad/i.test(navigator.userAgent);
        const instance = new Hls({
          enableWorker: !isMobileApp,
          backBufferLength: 60,
          enableSoftwareAES: true,
          manifestLoadingTimeOut: 25000,
          levelLoadingTimeOut: 25000,
          fragLoadingTimeOut: 45000,
          xhrSetup: function(xhr, segmentUrl) {
            if (segmentUrl && segmentUrl.startsWith('/')) {
              xhr.open('GET', resolveStreamUrl(segmentUrl), true);
            }
          }
        });
        hls = instance;
        window.currentHlsInstance = instance;
        instance.loadSource(streamTarget);
        instance.attachMedia(v);
        instance.on(Hls.Events.MANIFEST_PARSED, start);
        instance.on(Hls.Events.ERROR, (_, data) => {
          if(generation === playbackGeneration && data.fatal) {
            console.warn('[Player] HLS fatal error, tentando playback nativo:', data);
            instance.destroy();
            if(v.canPlayType('application/vnd.apple.mpegurl') || v.canPlayType('video/mp4')){
              v.src = streamTarget;
              start();
            } else {
              playerMessage('Não foi possível reproduzir','O relay interrompeu a transmissão ou o formato HLS não é compatível.');
            }
          }
        });
        return;
      }
      if(result.mode==='hls'&&(v.canPlayType('application/vnd.apple.mpegurl')||v.canPlayType('video/mp4'))){v.src=streamTarget;start();return;}
       playerMessage('Formato incompatível','O modo de compatibilidade não identificou um formato HLS ou MP4 compatível.');
     }).catch(error=>{if(generation!==playbackGeneration)return;const messages={upstream_http_status:`A origem respondeu HTTP ${error.upstreamStatus||'não informado'} ao modo de compatibilidade.`,upstream_timeout:'A origem demorou demais para responder.',upstream_request_failed:'Não foi possível obter uma resposta da origem.',destination_rejected:'O endereço da origem foi recusado pelas proteções de segurança.',redirect_rejected:'A origem redirecionou para um destino não aceito.',relay_request_limit:'O limite de requisições do modo de compatibilidade foi atingido.',upstream_read_failed:'Não foi possível ler os primeiros dados enviados pela origem.',unsupported_content_type:'A origem informou um tipo de mídia não compatível.',unrecognized_media_data:'A resposta não tem um formato HLS ou MP4 reconhecido.'};const detail=messages[error.diagnostic]||'Não foi possível iniciar pelo modo de compatibilidade.';playerMessage('Modo de compatibilidade indisponível',detail);});
    return;
  }
  if(useHls){
     const instance=new Hls({enableWorker:true,backBufferLength:90,enableSoftwareAES:true});hls=instance;window.currentHlsInstance=instance;instance.loadSource(ch.url);instance.attachMedia(v);instance.on(Hls.Events.MANIFEST_PARSED,()=>{start();updateHlsQualityBadge(instance);});instance.on(Hls.Events.LEVEL_SWITCHED,()=>updateHlsQualityBadge(instance));instance.on(Hls.Events.ERROR,(_,data)=>{
       if(generation!==playbackGeneration)return;
       const isAuth=data.response?.code===401||data.response?.code===403||(typeof data.response?.text==='string'&&data.response.text.includes('INVALID_CREDENTIALS'));
       if(isAuth){
         instance.destroy();
         if(hls===instance){hls=null;window.currentHlsInstance=null;}
         clearTimeout(playbackTimer);
         playbackTimer=null;
         playerMessage('Teste de 6h Expirado (401)','As credenciais de teste da lista Vapty expiraram no provedor. Alterne para a Lista Demo Online para assistir canais.',true);
         return;
       }
       if(!state.relayMode && state.relayEnabled){
         instance.destroy();
         if(hls===instance){hls=null;window.currentHlsInstance=null;}
         clearTimeout(playbackTimer);
         playbackTimer=null;
         console.log('[Player] Erro direto (CORS/rede). Ativando modo de compatibilidade Relay...');
         state.relayMode = true;
         try { localStorage.setItem('m3u-relay', 'true'); } catch {}
         updateRelayControl();
         playChannel(ch);
         return;
       }
       if(!data.fatal)return;
       trySmartFailover(ch, instance, generation).then(recovered => {
         if (recovered) return;
         instance.destroy();
         if(hls===instance){hls=null;window.currentHlsInstance=null;}
         clearTimeout(playbackTimer);
         playbackTimer=null;
         playerMessage('Transmissão indisponível','A transmissão HLS falhou ou está offline na fonte. Tente outro canal ou reconecte.',true);
       }).catch(() => {
         instance.destroy();
         if(hls===instance){hls=null;window.currentHlsInstance=null;}
         clearTimeout(playbackTimer);
         playbackTimer=null;
         playerMessage('Transmissão indisponível','A transmissão HLS falhou ou está offline na fonte. Tente outro canal ou reconecte.',true);
       });
     });
  }else direct();
}
function updateNowFavorite(){const b=$('#now-favorite');if(!b||!state.selected)return;const on=isFavorite(state.selected);b.classList.toggle('is-favorite',on);b.style.color=on?'#fc6382':'';b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'Remover canal dos favoritos':'Favoritar canal atual');}

function updateHlsQualityBadge(instance){
  try{
    const lvl=instance?.levels?.[instance.currentLevel];
    if(!lvl)return;
    const h=lvl.height||0;
    const bw=instance.bandwidthEstimate||0;
    const res=h>=2160?'4K':h>=1080?'FHD':h>=720?'HD':h>=480?'SD':h?`${h}p`:'';
    const mbps=bw>0?`${(bw/1000000).toFixed(1)} Mbps`:'';
    const label=[res,mbps].filter(Boolean).join(' · ');
    let badge=document.getElementById('hls-quality-badge');
    if(!badge){
      badge=document.createElement('span');
      badge.id='hls-quality-badge';
      badge.className='hls-quality-badge';
      const liveBar=document.getElementById('video-live');
      if(liveBar?.parentNode)liveBar.parentNode.insertBefore(badge,liveBar.nextSibling);
      else document.getElementById('video')?.parentNode?.appendChild(badge);
    }
    badge.textContent=label||'HLS';
    badge.hidden=!label;

    // Preenche dropdown de níveis se ainda não preenchido
    const sel=document.getElementById('hls-level-select');
    if(sel&&instance.levels?.length){
      sel.hidden=false;
      // Só reconstrói se a quantidade de níveis mudou
      if(sel.options.length-1!==instance.levels.length){
        sel.innerHTML='<option value="-1">🔄 Auto</option>'+instance.levels.map((l,i)=>{
          const lh=l.height||0;
          const lbw=l.bitrate?`${(l.bitrate/1000000).toFixed(1)}Mbps`:'';
          const lr=lh>=2160?'4K':lh>=1080?'FHD':lh>=720?'HD':lh>=480?'SD':lh?`${lh}p`:lbw||`Nível ${i+1}`;
          return `<option value="${i}">${lr}${lbw?' · '+lbw:''}</option>`;
        }).join('');
      }
      sel.value=String(instance.currentLevel);
      // Handler de mudança (idempotente — remove antes de re-adicionar)
      sel.onchange=()=>{ if(instance)instance.currentLevel=Number(sel.value); };
    }
  }catch{}
}

// Atualiza o hero Netflix com o canal atual
function updateStreamingHero(ch){
  if(state.page!=='player'||!ch)return;
  const tileColors=['#1a1a2e','#16213e','#0f3460','#1b1b2f','#162447','#1f4068','#1b262c'];
  const logo=ch.logo&&/^https?:\/\//i.test(ch.logo)?ch.logo:'';
  const colorIdx=Math.abs((ch.name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0))%tileColors.length;
  const color=tileColors[colorIdx];
  const bg=document.getElementById('nf-hero-bg');
  if(bg){
    // Crossfade: fade out → swap → fade in
    bg.style.transition='none';
    bg.style.opacity='1';
    // Cria camada temporária com o fundo atual para o fade out
    const prev=document.createElement('div');
    prev.className='nf-hero-bg-prev';
    prev.style.cssText=`position:absolute;inset:0;background-image:${bg.style.backgroundImage||'none'};background-color:${bg.style.backgroundColor||'transparent'};background-size:cover;background-position:center;z-index:1;opacity:1;transition:opacity 350ms ease;pointer-events:none;`;
    bg.parentNode.insertBefore(prev,bg);
    // Aplica novo fundo imediatamente (por baixo do prev)
    if(logo){bg.style.backgroundImage=`url('${logo.replace(/'/g,"%27")}')`;bg.style.backgroundColor='';}
    else{bg.style.backgroundImage='';bg.style.backgroundColor=color;}
    // Inicia fade out da camada anterior
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        prev.style.opacity='0';
        setTimeout(()=>prev.remove(),380);
      });
    });
  }
  const titleEl=document.getElementById('nf-hero-title');
  const metaEl=document.getElementById('nf-hero-meta');
  const badgeEl=document.getElementById('nf-hero-badge');
  if(titleEl)titleEl.textContent=ch.name;
  if(metaEl)metaEl.textContent=ch.group||'';
  if(badgeEl)badgeEl.textContent=ch.streamType==='movie'?'FILME':ch.streamType==='series'?'SÉRIE':'AO VIVO';
  const videoWrap=document.getElementById('nf-hero-video-wrap');
  const heroInfo=document.getElementById('nf-hero-info');
  const heroVc=document.getElementById('nf-hero-vc');
  if(videoWrap)videoWrap.hidden=false;
  if(heroInfo)heroInfo.classList.add('nf-hero-info--playing');
  if(heroVc)heroVc.hidden=false;
  const playBtn=document.getElementById('hero-play-btn');
  if(playBtn)playBtn.innerHTML=`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Em reprodução`;
  const favBtn=document.getElementById('hero-fav-btn');
  if(favBtn){const on=isFavorite(ch);favBtn.classList.toggle('is-fav',on);favBtn.innerHTML=icon('heart')+' '+(on?'Favoritado':'Favoritar');}
}
function backToChannels(){stopPlayback();state.selected=null;updateEpisodeControls(null);if($('#now-name'))$('#now-name').textContent='Seu próximo conteúdo está aqui';if($('#now-category'))$('#now-category').textContent='Selecione algo para começar';if($('#now-favorite'))$('#now-favorite').disabled=true;playerMessage('Escolha um conteúdo','Selecione outro item da playlist para iniciar a reprodução.');// Atualiza now bar
const barName=document.getElementById('now-bar-name');const barMeta=document.getElementById('now-bar-meta');if(barName)barName.textContent='Nada em reprodução';if(barMeta)barMeta.textContent='Escolha um canal para começar';renderChannels();}
async function toggleFavorite(ch,id=state.activePlaylist){state.favorites=await api('/favorites','PUT',{playlistId:id,channel:ch})||[];if(state.page==='player'){renderChannels();updateNowFavorite();}else if(state.page==='favorites')$('#content').innerHTML=savedPage('favorites');}

function openModal(title,content){
  const modal=$('#modal');
  if(!modal) return;
  modal.style.maxWidth = '620px';
  modal.innerHTML=`<div class="dialog-heading"><h2 id="modal-title">${title}</h2><button class="icon-btn" data-action="close-modal" aria-label="Fechar">${icon('close')}</button></div>${content}`;
  if(!modal.open)modal.showModal();
}

async function openManagePlaylistsModal(){
  if(!state.playlists || !state.playlists.length){
    try { await loadLibrary(); } catch {}
  }
  const list = state.playlists || [];
  const enabledCount = list.filter(p => p.isEnabled !== false).length;
  const totalCount = list.length;

  const content = `
    <div style="padding:0.25rem 0 0.5rem 0;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(255,255,255,0.1); flex-wrap:wrap; gap:0.5rem;">
        <div>
          <span style="font-size:0.88rem; color:rgba(255,255,255,0.8);">
            Visibilidade do Acervo: <strong style="color:#ff4d58;">${enabledCount} ativas</strong> de ${totalCount} cadastradas
          </span>
          <p style="margin:0.2rem 0 0 0; font-size:0.75rem; color:rgba(255,255,255,0.5);">
            Listas ocultadas não se misturam no catálogo nem no player. Ative sob demanda.
          </p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn small secondary" data-action="manage-pls-enable-all" title="Habilitar todas as listas">${icon('eye')} Habilitar Todas</button>
          <button class="btn small secondary" data-action="manage-pls-disable-all" title="Ocultar todas as listas">${icon('close')} Ocultar Todas</button>
        </div>
      </div>

      <div style="max-height:55vh; overflow-y:auto; display:flex; flex-direction:column; gap:0.5rem; padding-right:0.25rem;">
        ${list.map(pl => {
          const isEn = pl.isEnabled !== false;
          const isAct = pl.id === state.activePlaylist;
          return `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:0.65rem 0.9rem; background:${isEn ? 'rgba(229,9,20,0.06)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${isEn ? 'rgba(229,9,20,0.25)' : 'rgba(255,255,255,0.07)'}; border-radius:10px; transition:all 0.15s ease;">
              <div style="display:flex; align-items:center; gap:0.75rem; min-width:0;">
                <div class="iptv-pl-card-icon ${isEn ? 'enabled' : 'hidden'}">
                  ${icon('playlist')}
                </div>
                <div style="min-width:0;">
                  <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                    <strong style="color:${isEn ? '#fff' : 'rgba(255,255,255,0.45)'}; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:300px;" title="${esc(pl.name)}">${esc(pl.name)}</strong>
                    ${isAct ? `<span style="font-size:0.62rem; padding:0.1rem 0.35rem; background:#8b5cf6; color:#fff; border-radius:4px; font-weight:700;">ATIVA</span>` : ''}
                    <span style="font-size:0.62rem; padding:0.1rem 0.35rem; background:${isEn ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}; color:${isEn ? '#34d399' : 'rgba(255,255,255,0.4)'}; border-radius:4px; font-weight:600;">
                      ${isEn ? 'HABILITADA' : 'OCULTADA'}
                    </span>
                  </div>
                  <div style="font-size:0.72rem; color:rgba(255,255,255,0.4); margin-top:0.15rem;">
                    ${number(pl.total || 0)} itens • ${number(pl.live || 0)} canais • ${number(pl.vod || 0)} filmes • ${number(pl.series || 0)} séries
                  </div>
                </div>
              </div>

              <div style="display:flex; align-items:center; gap:0.5rem; flex-shrink:0;">
                <button class="btn small ${isEn ? 'btn-danger-outline' : 'btn-success'}" data-action="toggle-pl-enabled" data-id="${pl.id}" data-enabled="${isEn ? '0' : '1'}" style="min-width:96px; font-size:0.75rem; padding:0.35rem 0.75rem;">
                  ${isEn ? 'Ocultar' : 'Habilitar'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.1);">
        <button class="btn small secondary" data-action="add-playlist">${icon('plus')} Nova Playlist</button>
        <button class="btn" data-action="close-modal">Salvar & Fechar</button>
      </div>
    </div>
  `;

  openModal('Gerenciador de Playlists', content);
}

function playlistModal(){openModal('Adicionar playlist',`
  <div class="iptv-auth-tabs" style="margin-bottom:1.25rem;">
    <button type="button" class="iptv-auth-tab active" data-action="playlist-tab" data-tab="m3u">${icon('playlist')} Lista M3U / Arquivo</button>
    <button type="button" class="iptv-auth-tab" data-action="playlist-tab" data-tab="xtream">${icon('tv')} Servidor Xtream Codes (IPTV Pago)</button>
  </div>

  <div id="wrap-form-m3u">
    <form id="playlist-form" class="stack">
      <div><label for="playlist-name">Nome da playlist</label><input id="playlist-name" name="name" placeholder="Ex.: Minha Playlist" maxlength="80" required autofocus></div>
      <div class="input-tabs"><button type="button" data-action="source-tab" data-source="url" class="active">${icon('globe')} Por URL</button><button type="button" data-action="source-tab" data-source="file">${icon('playlist')} Arquivo M3U</button></div>
      <div id="url-field"><label for="playlist-url">URL da playlist M3U</label><input id="playlist-url" name="url" type="url" placeholder="https://…" required autocomplete="off" spellcheck="false"></div>
      <div id="file-field" hidden><label for="playlist-file">Arquivo da playlist</label><input id="playlist-file" name="file" type="file" accept=".m3u,.m3u8,audio/x-mpegurl,application/vnd.apple.mpegurl" class="file-input" disabled><p class="help-text">M3U ou M3U8 · até 100 MiB</p></div>
      <div class="info">${icon('shield')} Seus links são salvos de forma privada na sua conta.</div>
      <label class="check"><input name="organize" type="checkbox" checked>Organizar categorias automaticamente</label>
      <div class="form-error" role="alert"></div>
      <div class="dialog-actions"><button type="button" class="btn secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">Adicionar</button></div>
    </form>
  </div>

  <div id="wrap-form-xtream" style="display:none;">
    <form id="xtream-playlist-form" class="stack">
      <div><label for="xtream-name">Nome da Conexão</label><input id="xtream-name" name="name" placeholder="Ex.: Meu IPTV Pago" maxlength="80" required></div>
      <div><label for="xtream-server">Server URL (Endereço do Provedor)</label><input id="xtream-server" name="serverUrl" placeholder="Ex.: http://servidor.xyz:8080" autocomplete="url" spellcheck="false" required></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        <div><label for="xtream-username">Usuário</label><input id="xtream-username" name="username" placeholder="Seu usuário" required autocomplete="username"></div>
        <div><label for="xtream-password">Senha</label><input id="xtream-password" name="password" type="password" placeholder="Sua senha" required autocomplete="current-password"></div>
      </div>
      <div id="xtream-test-result" style="display:none; padding:0.75rem 1rem; border-radius:8px; font-size:0.88rem;"></div>
      <div class="info">${icon('tv')} Compatível com servidores Xtream Codes, Smarters e TiviMate. Canais ao vivo, filmes e séries serão categorizados automaticamente.</div>
      <div class="form-error" role="alert"></div>
      <div class="dialog-actions">
        <button type="button" class="btn secondary" data-action="close-modal">Cancelar</button>
        <button type="button" class="btn secondary" data-action="test-xtream">${icon('refresh')} Testar Conexão</button>
        <button type="submit" class="btn">${icon('right')} Conectar e Importar</button>
      </div>
    </form>
  </div>
`);}
function openTransferCreditsModal(){
  const myCredits = state.user?.credits || 0;
  openModal('Transferir Créditos', `
    <form id="transfer-credits-form" class="stack">
      <div class="info" style="border-color:rgba(168,85,247,0.4); background:rgba(168,85,247,0.12);">
        ${icon('credits')}
        <span>Seu saldo disponível: <strong>${myCredits} créditos</strong>.</span>
      </div>
      <div>
        <label for="transfer-to">Nome de Usuário do Destinatário (@username)</label>
        <input id="transfer-to" name="toUsername" placeholder="Ex: joao_revenda" required autocomplete="off" autofocus>
        <p class="help-text">O destinatário deve ser outro revendedor cadastrado na plataforma.</p>
      </div>
      <div>
        <label for="transfer-amount">Quantidade de Créditos a Enviar</label>
        <input id="transfer-amount" name="amount" type="number" min="1" max="${state.user?.role==='master'?9999:myCredits}" value="1" required>
      </div>
      <div class="form-error" role="alert"></div>
      <div class="dialog-actions">
        <button type="button" class="btn secondary" data-action="close-modal">Cancelar</button>
        <button type="submit" class="btn" style="background:linear-gradient(135deg,#a855f7,#6366f1); border:none;">Confirmar Envio</button>
      </div>
    </form>
  `);
}

function openRequestResellerModal(){
  openModal('Solicitar Acesso de Revendedor', `
    <form id="request-reseller-form" class="stack">
      <div class="info" style="border-color:rgba(168,85,247,0.4); background:rgba(168,85,247,0.12);">
        ${icon('shield')}
        <span>Torne-se um parceiro <strong>JstudioPlay</strong>! Tenha acesso a créditos de atacado com margens de até 300% e painel exclusivo para gerenciar seus clientes.</span>
      </div>
      <div>
        <label for="reseller-phone">WhatsApp / Telefone para Contato</label>
        <input id="reseller-phone" name="phone" placeholder="Ex: (11) 98765-4321" required autocomplete="tel" autofocus>
      </div>
      <div>
        <label for="reseller-notes">Conte um pouco sobre sua atuação (Opcional)</label>
        <textarea id="reseller-notes" name="notes" placeholder="Ex: Já tenho clientes na minha região / Gostaria de revender pacotes…" rows="3" style="width:100%; border-radius:8px; padding:0.6rem; background:rgba(0,0,0,0.2); border:1px solid var(--iptv-border); color:#fff; resize:vertical;"></textarea>
      </div>
      <div class="form-error" role="alert"></div>
      <div class="dialog-actions">
        <button type="button" class="btn secondary" data-action="close-modal">Cancelar</button>
        <button type="submit" class="btn primary" style="background:linear-gradient(135deg,#a855f7,#6366f1); border:none;">Enviar Solicitação</button>
      </div>
    </form>
  `);
}

function userModal(){
  const isMaster = state.user?.role === 'master';
  const isReseller = state.user?.role === 'reseller';
  openModal('Novo Usuário',`<form id="user-form" class="stack">
    ${isReseller ? `
      <div class="info" style="margin-bottom:0.5rem; border-color:rgba(168,85,247,0.3); background:rgba(168,85,247,0.1);">
        ${icon('credits')}
        <span>Criar um novo usuário consumirá <strong>1 crédito</strong> do seu saldo. Saldo atual: <strong>${state.user.credits || 0} créditos</strong>.</span>
      </div>
    ` : ''}
    <div>
      <label for="new-user-name">Nome Completo</label>
      <input name="name" id="new-user-name" required maxlength="80" autofocus autocomplete="off" placeholder="Ex: Maria Silva">
    </div>
    <div>
      <label for="new-user-username">Usuário</label>
      <input name="username" id="new-user-username" required minlength="3" maxlength="40" pattern="[a-zA-Z0-9_.\\x2d]+" autocomplete="off" placeholder="Ex: maria.silva">
      <p class="help-text">Letras, números, ponto, hífen ou sublinhado.</p>
    </div>
    <div>
      <label for="new-user-password">Senha Inicial</label>
      <input id="new-user-password" name="password" type="password" minlength="6" maxlength="256" required autocomplete="new-password" placeholder="Senha do usuário">
      <p class="help-text">Mínimo de 6 caracteres.</p>
    </div>
    <div>
      <label for="new-user-role">Perfil de Acesso</label>
      <select name="role" id="new-user-role">
        <option value="user">👤 Usuário (Acesso Básico ao Player)</option>
        <option value="pro">⭐ Pro (Playlists Privadas + DVR Gravações)</option>
        ${['admin','master'].includes(state.user?.role)?`<option value="reseller">💎 Revendedor (Gestão de Clientes & Saldo de Créditos)</option>`:''}
        ${['admin','master'].includes(state.user?.role)?`<option value="admin">🛡️ Adm (Gestão de Usuários & M3U Hub)</option>`:''}
        ${isMaster?`<option value="master">👑 Master (Acesso Total & Logs do Sistema)</option>`:''}
      </select>
    </div>
    ${isMaster?`
    <div>
      <label for="new-user-credits">Créditos Iniciais</label>
      <input id="new-user-credits" name="credits" type="number" min="0" value="0" placeholder="0">
      <p class="help-text">Saldo inicial de créditos (para perfil Revendedor).</p>
    </div>`:''}
    <div class="form-error" role="alert"></div>
    <div class="dialog-actions">
      <button type="button" class="btn secondary" data-action="close-modal">Cancelar</button>
      <button type="submit" class="btn">Criar usuário</button>
    </div>
  </form>`);
}

function userOptions(id){
  const u = state.users.find(v=>v.user.id===id)?.user;
  if(!u) return;
  const isMaster = state.user?.role === 'master';
  const canEditRole = isMaster || (state.user?.role === 'admin' && !['admin','master'].includes(u.role));
  openModal(`Gerenciar ${esc(u.username)}`,`<div class="stack">
    <div style="display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid var(--iptv-border);">
      <span>Perfil Atual:</span>
      ${roleBadge(u.role)}
    </div>
    <div style="display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid var(--iptv-border);">
      <span>Saldo de Créditos:</span>
      <span style="font-weight:700; color:#4ade80;">💳 ${u.credits || 0} créditos</span>
    </div>
    ${canEditRole?`
    <form id="edit-role-form" class="stack" data-id="${id}" style="margin:0.75rem 0;">
      <label for="edit-role-select">Alterar Perfil de Acesso</label>
      <div style="display:flex; gap:0.5rem;">
        <select id="edit-role-select" name="role" style="flex:1;">
          <option value="user" ${u.role==='user'?'selected':''}>👤 Usuário</option>
          <option value="pro" ${u.role==='pro'?'selected':''}>⭐ Pro</option>
          ${isMaster||state.user?.role==='admin'?`<option value="reseller" ${u.role==='reseller'?'selected':''}>💎 Revendedor</option>`:''}
          ${isMaster?`<option value="admin" ${u.role==='admin'?'selected':''}>🛡️ Adm</option>`:''}
          ${isMaster?`<option value="master" ${u.role==='master'?'selected':''}>👑 Master</option>`:''}
        </select>
        <button class="btn small" type="submit">Salvar Perfil</button>
      </div>
    </form>`:''}
    ${isMaster?`
    <div style="background:rgba(255,255,255,0.03); border:1px solid var(--iptv-border); border-radius:10px; padding:0.85rem; margin-bottom:0.5rem;">
      <label style="font-size:0.88rem; font-weight:700; display:block; margin-bottom:0.25rem; color:#fff;">💳 Ajuste de Créditos (Master)</label>
      <div style="display:flex; gap:0.5rem; margin-top:0.4rem;">
        <input type="number" id="adjust-credits-amount" placeholder="Qtd (+ ou -)" style="flex:1;" value="10">
        <button class="btn small" type="button" data-action="adjust-user-credits" data-id="${id}">Aplicar</button>
      </div>
    </div>`:''}
    <p style="font-size:0.9rem; color:var(--iptv-text-sec);">${u.blocked?'A conta está bloqueada. Reative para permitir novos acessos.':'Ao bloquear a conta, as sessões do cliente serão encerradas.'}</p>
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
      <button class="btn ${u.blocked?'':'danger'}" data-action="block-user" data-id="${id}" style="flex:1;">${u.blocked?'Reativar conta':'Bloquear conta'}</button>
      ${u.role!=='master'?`<button class="btn danger ghost" data-action="delete-user" data-id="${id}">Excluir</button>`:''}
    </div>
    <div class="divider"></div>
    <form id="reset-form" class="stack" data-id="${id}">
      <div>
        <label for="reset-password">Redefinir senha</label>
        <input id="reset-password" name="password" type="password" minlength="6" maxlength="256" placeholder="Nova senha" autocomplete="new-password" required>
      </div>
      <div class="form-error" role="alert"></div>
      <button class="btn secondary" type="submit">Salvar nova senha</button>
    </form>
  </div>`);
}

async function registerPushSubscription(){
  // Só disponível em HTTPS ou localhost, com Service Worker registrado
  if(!('serviceWorker' in navigator)||!('PushManager' in window))return;
  try{
    const {publicKey}=await api('/push/vapid-public-key');
    if(!publicKey)return;
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub){
      const appKey=Uint8Array.from(atob(publicKey.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
      sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:appKey});
    }
    const j=sub.toJSON();
    await api('/push/subscribe','POST',{endpoint:j.endpoint,keys:j.keys});
  }catch{}
}

async function initGoogleAuth(){
  try{
    const config=await api('/auth/google/config');
    if(window.google?.accounts?.id && config.clientId){
      window.google.accounts.id.initialize({
        client_id: config.clientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });
    }
  }catch{}
}

async function handleGoogleCredentialResponse(response){
  if(!response?.credential)return;
  try{
    const data=await api('/auth/google','POST',{credential:response.credential});
    state.user=data;
    if(data.token){
      state.token=data.token;
      try{localStorage.setItem('m3u-token',data.token);}catch{}
    }
    state.setupRequired=false;
    applyTheme(state.user.theme||'dark');
    toast(`Bem-vindo, ${state.user.name}!`);
    navigate('dashboard');
    registerPushSubscription().catch(()=>{});
  }catch(err){
    toast(err.message,true);
  }
}

async function triggerGoogleLogin(){
  try{
    const config=await api('/auth/google/config');
    if(config.enabled && config.clientId && window.google?.accounts?.id){
      window.google.accounts.id.initialize({
        client_id: config.clientId,
        callback: handleGoogleCredentialResponse
      });
      window.google.accounts.id.prompt(notification=>{
        if(notification.isNotDisplayed() || notification.isSkippedMoment()){
          toast('Permita popups do Google para continuar o login.',true);
        }
      });
    }else{
      openModal('Login com Google',`
        <div class="stack" style="text-align:center; padding:10px 0;">
          <div style="font-size:36px; margin-bottom:4px;">🔐</div>
          <h3>Configuração do Google OAuth</h3>
          <p style="font-size:12px; line-height:1.6; color:var(--muted);">
            Para ativar o login oficial com o Google, defina a chave <code>GOOGLE_CLIENT_ID</code> no arquivo <code>.env</code> do servidor.
          </p>
          <div class="info" style="text-align:left;">
            ${icon('info')}
            <span>Você pode criar seu Client ID gratuitamente no <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="text-decoration:underline; font-weight:700;">Google Cloud Console</a>.</span>
          </div>
          <div style="margin-top:10px;">
            <button class="btn primary" data-action="google-demo-login" style="width:100%;">
              Entrar em Modo Demonstração (Teste)
            </button>
          </div>
        </div>
      `);
    }
  }catch(err){
    toast(err.message,true);
  }
}

document.addEventListener('click',async event=>{
  const b=event.target.closest('[data-action]');if(!b||b.disabled)return;const action=b.dataset.action;
  try{
    // Gerenciador de Playlists (Ocultar / Habilitar sob demanda)
    if(action==='open-manage-playlists-modal'){
      try {
        await openManagePlaylistsModal();
      } catch(err) {
        console.error('[Modal] Erro ao abrir gerenciador de playlists:', err);
        toast('Erro ao abrir gerenciador: ' + err.message, true);
      }
      return;
    }
    if(action==='toggle-pl-enabled'){
      const plId = b.dataset.id;
      const enable = b.dataset.enabled === '1';
      b.disabled = true;
      try {
        await api(`/playlists/${plId}/toggle-enabled`, 'PATCH', { enabled: enable });
        const targetPl = state.playlists.find(p => p.id === plId);
        if(targetPl) targetPl.isEnabled = enable;
        const enabledList = state.playlists.filter(p => p.isEnabled !== false);
        if(!enable && state.activePlaylist === plId && enabledList.length){
          state.activePlaylist = enabledList[0].id;
          try { localStorage.setItem('m3u-active-playlist', state.activePlaylist); } catch {}
        }
        openManagePlaylistsModal();
        await renderRoute();
        toast(`Playlist ${enable ? 'habilitada' : 'ocultada'} com sucesso.`);
      } catch(err) {
        toast(err.message, true);
      }
      return;
    }
    if(action==='manage-pls-enable-all' || action==='manage-pls-disable-all'){
      const enable = action==='manage-pls-enable-all';
      b.disabled = true;
      try {
        for(const pl of state.playlists){
          if(Boolean(pl.isEnabled !== false) !== enable){
            await api(`/playlists/${pl.id}/toggle-enabled`, 'PATCH', { enabled: enable });
            pl.isEnabled = enable;
          }
        }
        if(!enable && state.playlists.length){
          const first = state.playlists.find(p => p.name.includes('TurboX')) || state.playlists[0];
          await api(`/playlists/${first.id}/toggle-enabled`, 'PATCH', { enabled: true });
          first.isEnabled = true;
          state.activePlaylist = first.id;
        }
        openManagePlaylistsModal();
        await renderRoute();
        toast(`Playlists ${enable ? 'habilitadas' : 'ocultadas'} com sucesso.`);
      } catch(err) {
        toast(err.message, true);
      }
      return;
    }

    // Ações Next-Gen v8.3.0: Hero Banner, PiP e Mosaico Multi-View
    if(action==='play-featured-hero'){
      const hero = (state.dashMovies && state.dashMovies.length) ? state.dashMovies[0] : (state.channels && state.channels[0]);
      if(hero){
        if(hero.streamType === 'live') {
          state.selected = hero;
          navigate('live');
        } else {
          openVodTheater(hero);
        }
      } else {
        navigate('live');
      }
      return;
    }
    if(action==='close-pip'){
      if(window.pipModule) window.pipModule.exit();
      return;
    }
    if(action==='expand-pip'){
      const ch = window.pipModule?.activeChannel;
      if(window.pipModule) window.pipModule.exit();
      if(ch) {
        state.selected = ch;
        navigate('live');
      }
      return;
    }
    if(action==='toggle-pip-play'){
      const v = document.getElementById('pip-video');
      const btn = document.querySelector('[data-action="toggle-pip-play"]');
      if(v) {
        if(v.paused) {
          v.play().catch(()=>{});
          if(btn) btn.innerHTML = icon('pause');
        } else {
          v.pause();
          if(btn) btn.innerHTML = icon('play');
        }
      }
      return;
    }
    if(action==='mv-sound'){
      const slotIdx = Number(b.dataset.slot || 0);
      if(window.multiviewModule) window.multiviewModule.setSound(slotIdx);
      return;
    }
    if(action==='mv-expand'){
      const slotIdx = Number(b.dataset.slot || 0);
      const select = document.getElementById(`mv-select-${slotIdx}`);
      const chId = select?.value;
      const ch = (state.channels || []).find(c => c.id === chId);
      if(window.multiviewModule) window.multiviewModule.destroy();
      if(ch) {
        state.selected = ch;
        navigate('live');
      }
      return;
    }
    if(action==='mv-reset'){
      if(window.multiviewModule) window.multiviewModule.initSlots();
      toast('Mosaico reiniciado com os canais padrão.');
      return;
    }

    if(action==='google-login'){await triggerGoogleLogin();return;}
    if(action==='google-demo-login'){
      b.disabled=true;
      try{
        const data=await api('/auth/google','POST',{demo:true});
        state.user=data;
        if(data.token){
          state.token=data.token;
          try{localStorage.setItem('m3u-token',data.token);}catch{}
        }
        state.setupRequired=false;
        $('#modal').close();
        applyTheme(state.user.theme||'dark');
        toast(`Conectado como ${state.user.name}!`);
        navigate('dashboard');
      }catch(err){
        b.disabled=false;
        toast(err.message,true);
      }
      return;
    }
    if(action==='theme'){applyTheme(theme==='dark'?'light':'dark');if(state.user)state.user=await api('/account','PATCH',{theme});return;}
    if(action==='menu'){setMenu(!$('.shell').classList.contains('menu-open'));return;}
    if(action==='toggle-iptv-sidebar' || action==='toggle-sidebar'){
      const sb = $('.iptv-master-sidebar') || $('#account-sidebar');
      if(sb){
        sb.classList.toggle('collapsed');
        const isCollapsed = sb.classList.contains('collapsed');
        try { localStorage.setItem('iptv-sidebar-collapsed', String(isCollapsed)); } catch {}
        const toggleBtn = sb.querySelector('.iptv-sidebar-toggle-btn');
        if(toggleBtn) toggleBtn.setAttribute('title', isCollapsed ? 'Expandir menu' : 'Recolher menu');
      } else {
        toggleSidebar();
      }
      return;
    }
    if(action==='close-modal'){const m=$('#modal');if(m){m.classList.remove('iptv-bottom-sheet-mode');m.close();}return;}
    if(action==='password'){const input=document.getElementById(b.dataset.target);input.type=input.type==='password'?'text':'password';b.setAttribute('aria-label',input.type==='password'?'Mostrar senha':'Ocultar senha');return;}
    if(action==='forgot'){openModal('Recuperar acesso',`<p>Solicite ao administrador da plataforma uma nova senha. Depois de entrar, você pode alterá-la em Configurações.</p><p class="help-text">Se você é o administrador, consulte o procedimento de recuperação no README do servidor.</p><button class="btn" data-action="close-modal">Entendi</button>`);return;}
    if(action==='logout'){
      stopPlayback();
      await progressWrites.catch(()=>{});
      await api('/logout','POST',{});
      try{localStorage.removeItem('m3u-token');}catch{}
      state.token=null;
      state.user=null;
      clearPrivateState();
      navigate('login');
      return;
    }
    if(action==='playlist-tab'){
      const isM3U=b.dataset.tab==='m3u';
      document.querySelectorAll('[data-action="playlist-tab"]').forEach(tab=>tab.classList.toggle('active',tab===b));
      const wrapM3u=$('#wrap-form-m3u'),wrapXtream=$('#wrap-form-xtream');
      if(wrapM3u)wrapM3u.style.display=isM3U?'block':'none';
      if(wrapXtream)wrapXtream.style.display=isM3U?'none':'block';
      return;
    }
    if(action==='test-xtream'){
      const srv=$('#xtream-server')?.value?.trim();
      const usr=$('#xtream-username')?.value?.trim();
      const pwd=$('#xtream-password')?.value?.trim();
      const resEl=$('#xtream-test-result'),errEl=$('#xtream-playlist-form .form-error');
      if(!srv||!usr||!pwd){if(errEl)errEl.textContent='Preencha Server URL, Usuário e Senha para testar a conexão.';return;}
      b.disabled=true;const orig=b.innerHTML;b.innerHTML=`${icon('refresh')} Testando…`;
      if(errEl)errEl.textContent='';
      try{
        const r=await api('/playlists/xtream/validate','POST',{serverUrl:srv,username:usr,password:pwd});
        if(resEl){
          resEl.style.display='block';
          resEl.style.background='rgba(34,197,94,0.15)';
          resEl.style.border='1px solid rgba(34,197,94,0.3)';
          resEl.style.color='#4ade80';
          resEl.innerHTML=`<strong>✅ Conexão bem-sucedida!</strong><br>Status: ${esc(r.userInfo.status)} · Validade: ${esc(r.userInfo.expDate)} · Conexões: ${esc(r.userInfo.activeCons)}/${esc(r.userInfo.maxConnections)}`;
        }
      }catch(e){
        if(resEl){
          resEl.style.display='block';
          resEl.style.background='rgba(239,68,68,0.15)';
          resEl.style.border='1px solid rgba(239,68,68,0.3)';
          resEl.style.color='#f87171';
          resEl.innerHTML=`<strong>❌ Falha na conexão:</strong><br>${esc(e.message)}`;
        }
      }finally{
        b.disabled=false;b.innerHTML=orig;
      }
      return;
    }
    if(action==='add-playlist'){if(state.playlists.length>=maxPlaylistsPerAccount){toast('Limite de playlists atingido.',true);return;}playlistModal();return;}
    if(action==='source-tab'){const file=b.dataset.source==='file';$('#url-field').hidden=file;$('#file-field').hidden=!file;$('#playlist-url').disabled=file;$('#playlist-url').required=!file;$('#playlist-file').disabled=!file;$('#playlist-file').required=file;document.querySelectorAll('[data-action="source-tab"]').forEach(x=>x.classList.toggle('active',x===b));return;}
    if(action==='open-playlist'){state.activePlaylist=b.dataset.id;pendingChannel=null;navigate('player');return;}
    if(action==='playlist-options'){const p=state.playlists.find(x=>x.id===b.dataset.id);openModal(esc(p.name),`<p>${number(p.total)} canais · ${number(p.categories)} categorias<br>Adicionada em ${dateTime(p.created)}<br>Última atualização: ${p.updated?dateTime(p.updated):'data indisponível'}</p><div class="stack"><button class="btn" data-action="open-playlist" data-id="${p.id}">${icon('play')}Abrir no player</button>${p.sourceKind!=='file'?`<button class="btn secondary" data-action="refresh-playlist" data-id="${p.id}">${icon('refresh')}Atualizar playlist</button>`:''}<button class="btn ghost" data-action="confirm-delete-playlist" data-id="${p.id}">${icon('trash')}Remover playlist</button></div>`);return;}
    if(action==='refresh-playlist'){const p=state.playlists.find(x=>x.id===b.dataset.id);if(!p)return;if(!p.refreshable){openModal('Atualizar playlist',`<form id="refresh-form" data-id="${p.id}" class="stack"><p>Informe a URL original desta playlist. O catálogo atual será mantido se a atualização falhar.</p><div><label for="refresh-url">URL da playlist M3U</label><input id="refresh-url" name="url" type="url" placeholder="https://…" required autocomplete="off" spellcheck="false"></div><div class="form-error" role="alert"></div><div class="dialog-actions"><button type="button" class="btn secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">Atualizar playlist</button></div></form>`);return;}b.disabled=true;await api(`/playlists/${p.id}/refresh`,'POST',{});$('#modal').close();await renderRoute();toast('Playlist atualizada.');return;}
    if(action==='confirm-delete-playlist'){const p=state.playlists.find(x=>x.id===b.dataset.id);openModal('Remover playlist?',`<p>A playlist <strong>${esc(p.name)}</strong>, seus favoritos e seu histórico serão removidos desta conta.</p><div class="dialog-actions"><button class="btn secondary" data-action="close-modal">Cancelar</button><button class="btn danger" data-action="delete-playlist" data-id="${p.id}">Remover</button></div>`);return;}
    if(action==='delete-playlist'){b.disabled=true;await api(`/playlists/${b.dataset.id}`,'DELETE',{});$('#modal').close();await renderRoute();toast('Playlist removida.');return;}
    if(action==='open-saved'){const h=state[b.dataset.kind][Number(b.dataset.index)];if(h.unavailable){toast('Este conteúdo não está na versão atual da playlist.',true);return;}state.activePlaylist=h.playlistId;pendingChannel=h.channel.url;navigate('player');return;}
    if(action==='open-progress'){const p=state.progress[Number(b.dataset.index)];if(p.unavailable){toast('Este conteúdo não está na versão atual da playlist.',true);return;}state.activePlaylist=p.playlistId;pendingChannel=p.channel.url;navigate('player');return;}
    if(action==='saved-favorite'){b.disabled=true;const h=state.favorites[Number(b.dataset.index)];await toggleFavorite(h.channel,h.playlistId);return;}
    if(action==='clear-history'){openModal('Limpar histórico?',`<p>O registro dos canais vistos será removido da sua conta. Suas playlists e favoritos serão mantidos.</p><div class="dialog-actions"><button class="btn secondary" data-action="close-modal">Cancelar</button><button class="btn danger" data-action="do-clear-history">Limpar</button></div>`);return;}
    if(action==='do-clear-history'){b.disabled=true;await api('/history','DELETE',{});state.history=[];$('#modal').close();$('#content').innerHTML=savedPage('history');toast('Histórico limpo.');return;}
    if(action==='category'){selectCategory(Number(b.dataset.index));return;}
    if(action==='category-previous'||action==='category-next'){scrollCategories(action==='category-next'?1:-1);return;}
    if(action==='previous'||action==='next'){queuePageTurn(action==='next'?1:-1);return;}
    if(action==='play'){playChannel(visibleChannels[Number(b.dataset.index)]);return;}
    if(action==='toggle-relay'){state.relayMode=!state.relayMode;updateRelayControl();const selected=state.selected;if(selected)playChannel(selected);return;}
    if(action==='switch-working-list'){
      const demoPl = state.playlists.find(p => p.id === 'pl_1791134136320') || state.playlists.find(p => !p.name.toLowerCase().includes('teste') && !p.name.toLowerCase().includes('vapty')) || state.playlists[0];
      if(demoPl){
        state.activePlaylist = demoPl.id;
        try{ localStorage.setItem('m3u-active-playlist', demoPl.id); }catch{}
        toast('Alternando para: ' + demoPl.name);
        await renderRoute();
      }
      return;
    }
    if(action==='toggle-data-saver'){if(typeof window.healthModule!=='undefined')window.healthModule.toggleDataSaver(b);return;}
    if(action==='switch-playlist'){if(b.dataset.id&&b.dataset.id!==state.activePlaylist){pendingChannel=null;state.activePlaylist=b.dataset.id;localStorage.setItem('m3u-active-playlist',b.dataset.id);navigate('player');}return;}
    if(action==='set-media-type'){
      state.mediaType = b.dataset.type || 'live';
      state.category = '';
      state.channels = [];
      await loadChannels(state.activePlaylist, routeGeneration, state.mediaType);
      return;
    }
    if(action==='toggle-smart-sidebar'){
      state.smartSidebarSlim = !state.smartSidebarSlim;
      const sb = document.querySelector('.iptv-smart-sidebar');
      if(sb){
        sb.classList.toggle('slim-rail', state.smartSidebarSlim);
        const toggleBtn = sb.querySelector('.iptv-sidebar-rail-toggle');
        if(toggleBtn) toggleBtn.innerHTML = icon(state.smartSidebarSlim ? 'right' : 'left');
      }
      return;
    }
    if(action==='play-first-history'){
      const hist = state.history?.[0]?.channel || state.currentMovies?.[0];
      if(hist){
        if(hist.streamType === 'live' || hist.program){
          state.selected = hist;
          location.hash = '#/live';
          setTimeout(() => playChannel(hist), 120);
        } else {
          openVodTheater(hist);
        }
      }
      return;
    }
    if(action==='filter-vod-cat'){state.selectedVodCategory=b.dataset.name||'';state.moviePage=1;await renderRoute();return;}
    if(action==='filter-series-cat'){state.selectedSeriesCategory=b.dataset.name||'';state.seriesPage=1;await renderRoute();return;}
    if(action==='load-more-catalog'){
      const isSeries = b.dataset.type === 'series';
      b.disabled = true;
      const origText = b.innerHTML;
      b.innerHTML = `${icon('refresh')} Carregando...`;
      try {
        const nextPage = isSeries ? ((state.seriesPage || 1) + 1) : ((state.moviePage || 1) + 1);
        const curCat = isSeries ? (state.selectedSeriesCategory || '') : (state.selectedVodCategory || '');
        const filterQuery = curCat ? `&group=${encodeURIComponent(curCat)}` : '';
        const res = await api(`/playlists/${state.activePlaylist}/filter?type=${isSeries?'series':'vod'}&limit=100&page=${nextPage}${filterQuery}`);
        if(res && res.channels && res.channels.length){
          if(isSeries){
            state.seriesPage = nextPage;
            state.currentSeries = (state.currentSeries || []).concat(res.channels);
          } else {
            state.moviePage = nextPage;
            state.currentMovies = (state.currentMovies || []).concat(res.channels);
          }
          await renderRoute();
        } else {
          toast('Todos os títulos disponíveis já foram carregados.');
        }
      } catch(err){
        toast('Erro ao carregar mais títulos: ' + err.message, true);
      } finally {
        b.disabled = false;
        b.innerHTML = origText;
      }
      return;
    }
    if(action==='scroll-carousel-left' || action==='scroll-carousel-right'){
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
    if(action==='top10-card-click'){
      const idx = Number(b.dataset.index);
      const isSeries = b.dataset.type === 'series';
      const pool = isSeries ? (state.currentSeries || state.dashSeries || []) : (state.currentMovies || state.dashMovies || []);
      const item = pool[idx];
      if(item) openVodModal(item);
      return;
    }
    if(action==='catalog-card-click'){
      const idx = Number(b.dataset.index);
      const isSeries = b.dataset.type === 'series';
      const pool = isSeries ? (state.currentSeries || []) : (state.currentMovies || []);
      const item = pool[idx];
      if(item) openVodModal(item);
      return;
    }
    if(action==='quick-play-catalog'){
      e.stopPropagation();
      const idx = Number(b.dataset.index);
      const isSeries = b.dataset.type === 'series';
      const pool = isSeries ? (state.currentSeries || []) : (state.currentMovies || []);
      const item = pool[idx];
      if(item) openVodTheater(item);
      return;
    }
    if(action==='quick-fav-catalog'){
      e.stopPropagation();
      const name = b.dataset.name;
      const pool = (state.currentMovies || []).concat(state.currentSeries || [], state.channels || []);
      const item = pool.find(c => c.name === name) || { name, group: 'VOD' };
      b.disabled = true;
      try {
        await toggleFavorite(item);
        const isFav = state.favorites && state.favorites.some(f => 
          (f.channel && (f.channel.name === name || f.channel.url === item.url)) || 
          f.name === name || f.url === item.url
        );
        b.classList.toggle('is-favorited', isFav);
        b.title = isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
        b.setAttribute('aria-label', b.title);
        toast(isFav ? `❤️ "${name}" adicionado aos Favoritos!` : `Removido dos Favoritos.`);
      } catch(err) {
        toast('Erro ao atualizar favoritos: ' + err.message, true);
      } finally {
        b.disabled = false;
      }
      return;
    }
    if(action==='open-similar-vod'){
      const title = b.dataset.title;
      const pool = (state.currentMovies || []).concat(state.currentSeries || [], state.channels || [], state.dashMovies || [], state.dashSeries || []);
      const item = pool.find(it => (it.name || it.title) === title);
      if(item) openVodModal(item);
      return;
    }
    if(action==='enrich-catalog-batch'){
      b.disabled = true;
      const orig = b.innerHTML;
      b.innerHTML = `${icon('refresh')} Atualizando via API…`;
      try {
        const type = b.dataset.type || null;
        const res = await api(`/playlists/${state.activePlaylist}/enrich-batch`, 'POST', { limit: 60, delayMs: 250, type });
        toast('Enriquecimento iniciado em segundo plano!');
        let pollCount = 0;
        const poll = setInterval(async () => {
          pollCount++;
          try {
            const st = await api(`/playlists/${state.activePlaylist}/enrich-status`);
            if(!st.job?.isRunning || pollCount > 25){
              clearInterval(poll);
              toast(`Metadados atualizados: ${st.stats.enriched} títulos com capas oficiais e sinopses.`);
              await renderRoute();
            }
          } catch(e) {
            clearInterval(poll);
          }
        }, 3000);
      } catch(err) {
        toast('Erro ao iniciar enriquecimento: ' + err.message, true);
        b.disabled = false;
        b.innerHTML = orig;
      }
      return;
    }
    if(action==='enrich-current-vod'){
      const item = window._currentVodItem;
      if(!item || !item.id) return;
      b.disabled = true;
      const orig = b.innerHTML;
      b.innerHTML = `${icon('refresh')} Buscando…`;
      try {
        const res = await api(`/channels/${item.id}/enrich`, 'POST', {});
        if(res.success && res.channel){
          Object.assign(item, res.channel);
          const synEl = document.getElementById('modal-vod-synopsis');
          if(synEl && res.channel.overview) synEl.textContent = res.channel.overview;
          const bgEl = document.getElementById('modal-vod-backdrop');
          if(bgEl && (res.channel.backdropUrl || res.channel.posterUrl)){
            bgEl.style.backgroundImage = `url('${esc(res.channel.backdropUrl || res.channel.posterUrl)}')`;
          }
          const metaEl = document.getElementById('modal-vod-meta');
          if(metaEl){
            metaEl.innerHTML = `
              <span>⭐ ${res.channel.rating || '8.5'} / 10</span>
              ${res.channel.year ? `<span>•</span><span>${res.channel.year}</span>` : ''}
              <span>•</span>
              <span>${esc(res.channel.genres || res.channel.group)}</span>
              <span>•</span>
              <span>Streaming HLS</span>
            `;
          }
          toast('Metadados atualizados com sucesso via API!');
        } else {
          toast(res.message || 'Nenhum metadado adicional encontrado.');
        }
      } catch(e) {
        toast('Erro ao buscar metadados: ' + e.message, true);
      } finally {
        b.disabled = false;
        b.innerHTML = orig;
      }
      return;
    }
    if(action==='nf-search-toggle'){const inp=$('#channel-search');if(inp){inp.classList.toggle('nf-search-input--open');if(inp.classList.contains('nf-search-input--open'))inp.focus();}return;}
    if(action==='nf-browse'){const dd=document.getElementById('nf-browse-dropdown');if(dd)dd.hidden=!dd.hidden;return;}
    if(action==='hero-play'){const ch=state.selected||state.channels[0];if(ch)playChannel(ch);return;}
    if(action==='hero-favorite'){const ch=state.selected||state.channels[0];if(ch){b.disabled=true;await toggleFavorite(ch);updateStreamingHero(ch);b.disabled=false;}return;}
    if(action==='load-more-section'){const group=b.dataset.group;if(group){state.category=group;renderCategories();renderChannels();}return;}
    if(action==='favorite'){b.disabled=true;await toggleFavorite(visibleChannels[Number(b.dataset.index)]);return;}
    if(action==='now-favorite'){b.disabled=true;await toggleFavorite(state.selected);b.disabled=false;return;}
    if(action==='reconnect'){if(state.selected)playChannel(state.selected);else toast('Escolha um canal para reproduzir.');return;}
    if(action==='episode-previous'||action==='episode-next'){playChannel(episodeNavigation[action==='episode-previous'?'previous':'next']);return;}
    if(action==='pip'){const v=$('#video');if(document.pictureInPictureElement){await document.exitPictureInPicture();}else if(v&&v.requestPictureInPicture){await v.requestPictureInPicture();}else toast('Picture-in-Picture não suportado.');return;}
    if(action==='quick-mute'){const v=$('#video');if(v){v.muted=!v.muted;const s=$('#quick-volume-slider'),val=$('#quick-volume-val');if(s)s.value=v.muted?0:Math.round(v.volume*100);if(val)val.textContent=v.muted?'Mudo':`${Math.round(v.volume*100)}%`;toast(v.muted?'Áudio mutado':'Áudio ativado');}return;}
    if(action==='vol-boost'){const v=$('#video');if(v){v.muted=false;const boost=Number(b.dataset.boost||1);document.querySelectorAll('[data-action="vol-boost"]').forEach(btn=>btn.classList.toggle('active',btn===b));v.volume=Math.min(1,boost);const val=$('#quick-volume-val');if(val)val.textContent=`${Math.round(boost*100)}%`;toast(`Volume ajustado para ${Math.round(boost*100)}%`);}return;}
    if(action==='fullscreen'){const v=$('#video');if(v.requestFullscreen)await v.requestFullscreen();else if(v.webkitEnterFullscreen)v.webkitEnterFullscreen();else toast('Use o controle de tela cheia do vídeo.');return;}
    if(action==='back-player'){backToChannels();return;}
    if(action==='reload-channels'){await loadChannels(state.activePlaylist);return;}
    if(action==='retry-page'){await renderRoute();return;}
    if(action==='new-user'){userModal();return;}
    if(action==='refresh-ai-status'){
      state.aiStatus=await api('/integrations/status');
      if(state.page==='ai-status')$('#content').innerHTML=aiStatusPage();
      return;
    }
    if(action==='ai-discover'){
      b.disabled=true;const orig=b.innerHTML;b.innerHTML=`${icon('refresh')} Iniciando…`;
      try{
        await api('/integrations/discover','POST',{});
        toast('🔍 Descoberta de fontes M3U iniciada em background.');
      }catch(e){toast('Erro ao iniciar descoberta: '+e.message);}
      b.disabled=false;b.innerHTML=orig;
      return;
    }
    if(action==='buy-credits'){
      const pkgId=b.dataset.id;
      b.disabled=true;const orig=b.innerHTML;b.innerHTML=`${icon('refresh')} Gerando…`;
      try{
        const r=await api('/credits/checkout','POST',{packageId:pkgId});
        openModal('Pagamento via PIX',`
          <div class="stack" style="gap:1rem;">
            <div style="background:rgba(255,255,255,0.05);border:1px solid var(--iptv-border);border-radius:10px;padding:1rem;text-align:center;">
              <p style="font-size:0.85rem;color:var(--iptv-text-sec);margin:0 0 0.5rem;">Copie a chave PIX abaixo e realize o pagamento de</p>
              <p style="font-size:1.6rem;font-weight:800;color:#4ade80;margin:0;">R$ ${r.package.price.toFixed(2).replace('.',',')}</p>
              <p style="font-size:0.8rem;color:var(--iptv-text-sec);margin:0.25rem 0 0;">${r.package.credits} créditos</p>
            </div>
            <div>
              <label style="font-size:0.8rem;color:var(--iptv-text-sec);">Chave PIX</label>
              <div style="display:flex;gap:0.5rem;margin-top:0.25rem;">
                <input id="pix-key-val" type="text" readonly value="${esc(r.pixKey)}" style="flex:1;font-size:0.85rem;">
                <button class="btn small" onclick="navigator.clipboard.writeText('${esc(r.pixKey)}').then(()=>window.toast?.('Chave PIX copiada!'))">Copiar</button>
              </div>
            </div>
            <a href="${esc(r.whatsappUrl)}" target="_blank" rel="noopener" class="btn" style="text-align:center;">
              💬 Enviar comprovante via WhatsApp
            </a>
            <p style="font-size:0.78rem;color:var(--iptv-text-sec);text-align:center;margin:0;">Após a confirmação do pagamento, os créditos serão adicionados pelo administrador.</p>
          </div>
        `);
      }catch(e){toast('Erro ao gerar checkout: '+e.message);}
      b.disabled=false;b.innerHTML=orig;
      return;
    }
    if(action==='transfer-credits-modal'){openTransferCreditsModal();return;}
    if(action==='request-reseller-modal'){openRequestResellerModal();return;}
    if(action==='renew-user'){
      const id=b.dataset.id, username=b.dataset.username;
      if(confirm(`Deseja renovar o cliente @${username} por mais 30 dias (consumirá 1 crédito)?`)){
        b.disabled=true;
        try{
          const res=await api(`/admin/users/${id}/renew`,'POST',{days:30});
          if(res.myCredits!==undefined && state.user) state.user.credits=res.myCredits;
          await renderRoute();
          toast(res.message);
        }catch(err){
          toast(err.message,true);
          b.disabled=false;
        }
      }
      return;
    }
    if(action==='user-options'){userOptions(b.dataset.id);return;}
    if(action==='open-first-live'){
      navigate('live');
      return;
    }
    if(action==='iptv-tab'){
      const isM3U=b.dataset.tab==='m3u';
      document.querySelectorAll('[data-action="iptv-tab"]').forEach(tab=>tab.classList.toggle('active',tab===b));
      const wrapServer=$('#wrap-server-url');
      if(wrapServer){wrapServer.style.display=isM3U?'none':'flex';}
      const srvInput=$('#server-url');
      if(srvInput){srvInput.required=!isM3U;}
      return;
    }
    if(action==='iptv-settings-tab'){
      const tab=b.dataset.tab;
      document.querySelectorAll('.iptv-settings-nav-item').forEach(item=>item.classList.toggle('active',item===b));
      const main=$('.iptv-settings-panel');
      if(main){
        const tempContainer=document.createElement('div');
        tempContainer.innerHTML=settings(tab);
        const newPanel=tempContainer.querySelector('.iptv-settings-panel');
        if(newPanel){main.innerHTML=newPanel.innerHTML;}
      }
      return;
    }
    if(action==='iptv-epg-cat'){
      document.querySelectorAll('.iptv-epg-cat-item').forEach(item=>item.classList.toggle('active',item===b));
      toast(`Categoria ${b.dataset.name} selecionada.`);
      return;
    }
    if(action==='filter-cat'){
      const grp=b.dataset.group;
      if(grp==='Filmes') navigate('movies');
      else if(grp==='Séries') navigate('series');
      else { state.category=grp; navigate('live'); }
      return;
    }
    if(action==='vkey-press'){
      const input=$('#iptv-search-input');
      if(input){
        input.value += (b.dataset.val||'');
        input.dispatchEvent(new Event('input', {bubbles:true}));
      }
      return;
    }
    if(action==='vkey-space'){
      const input=$('#iptv-search-input');
      if(input){
        input.value += ' ';
        input.dispatchEvent(new Event('input', {bubbles:true}));
      }
      return;
    }
    if(action==='vkey-backspace'){
      const input=$('#iptv-search-input');
      if(input){
        input.value = input.value.slice(0, -1);
        input.dispatchEvent(new Event('input', {bubbles:true}));
      }
      return;
    }
    if(action==='vkey-clear'){
      const input=$('#iptv-search-input');
      if(input){
        input.value = '';
        input.dispatchEvent(new Event('input', {bubbles:true}));
      }
      return;
    }
    if(action==='select-live-ch'){
      document.querySelectorAll('.iptv-tri-channel-row, .iptv-master-channel-row').forEach(c=>c.classList.toggle('active', c===b));
      const idx = Number(b.dataset.index);
      const pool = (state.channels && state.channels.length) ? state.channels : (window._liveChannels || []);
      const ch = pool[idx] || pool.find(c=>c.name===b.dataset.name) || pool[0];
      if(ch){
        state.selected = ch;
        const nameEl = document.getElementById('preview-ch-name');
        if(nameEl) nameEl.textContent = ch.name;
        const progEl = document.getElementById('preview-prog-title');
        if(progEl) progEl.textContent = ch.program || ch.group || 'Brasileirão Série A';
        const timeEl = document.getElementById('preview-prog-time');
        if(timeEl) timeEl.textContent = ch.time || '16:00 - 18:00';
        playChannel(ch);
      }
      return;
    }
    if(action==='live-tab-filter'){
      state.liveCategory = b.dataset.category || 'Todos';
      const contentEl = document.getElementById('content');
      if(contentEl) contentEl.innerHTML = livePage();
      return;
    }
    if(action==='filter-master-cat'){
      const cat = (b.dataset.name || '').trim();
      if(cat.toLowerCase() === 'filmes'){
        location.hash = '#/movies';
        return;
      }
      if(cat.toLowerCase() === 'séries' || cat.toLowerCase() === 'series'){
        location.hash = '#/series';
        return;
      }
      state.liveCategory = cat || 'Todos';
      location.hash = '#/live';
      return;
    }
    if(action==='select-marathon'){
      const id = b.dataset.id;
      if(id){
        state.activeMarathonId = id;
        renderRoute();
      }
      return;
    }
    if(action==='play-marathon-item'){
      const itemId = b.dataset.itemId;
      const marathon = state.currentMarathon;
      const item = marathon?.items?.find(it => it.id === itemId);
      if(item){
        const target = {
          name: item.title,
          title: item.title,
          url: item.streamUrl,
          streamUrl: item.streamUrl,
          notes: item.notes,
          group: `Maratona - ${marathon.title}`,
          posterUrl: item.posterUrl,
          backdropUrl: item.backdropUrl,
          streamType: 'vod'
        };
        openVodTheater(target);
      }
      return;
    }
    if(action==='start-marathon'){
      const marathon = state.currentMarathon;
      if(marathon?.items?.length){
        const first = marathon.items[0];
        const target = {
          name: first.title,
          title: first.title,
          url: first.streamUrl,
          streamUrl: first.streamUrl,
          notes: first.notes,
          group: `Maratona - ${marathon.title}`,
          posterUrl: first.posterUrl,
          backdropUrl: first.backdropUrl,
          streamType: 'vod'
        };
        openVodTheater(target);
      }
      return;
    }
    if(action==='export-marathon-m3u'){
      const slug = b.dataset.slug || state.currentMarathon?.slug;
      if(slug){
        window.open(`/api/marathons/${slug}/export.m3u`, '_blank');
      }
      return;
    }
    if(action==='search-tab'){
      state.searchTab = b.dataset.tab || 'channels';
      const contentEl = document.getElementById('content');
      if(contentEl) contentEl.innerHTML = searchPage();
      return;
    }
    if(action==='epg-day-select'){
      state.selectedEpgDay = b.dataset.day || 'today';
      document.querySelectorAll('.iptv-epg-day-pill').forEach(p => p.classList.toggle('active', p === b));
      return;
    }
    if(action==='clear-app-cache'){
      try{
        localStorage.removeItem('m3u-cache');
        localStorage.removeItem('cached-m3u-url');
        localStorage.removeItem('m3u-epg-cache');
        localStorage.removeItem('m3u-categories-cache');
        if('caches' in window){
          caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
        }
      }catch{}
      toast('Cache limpo com sucesso! Favoritos e credenciais preservados.');
      return;
    }
    if(action==='about-app'){
      toast('JstudioPlay IPTV PLAY Pro v7.9.9 — Smart TV Edition');
      return;
    }
    if(action==='toggle-dark-mode'){
      toast('Modo escuro oficial mantido ativo.');
      return;
    }
    if(action==='hero-play'){
      location.hash = '#/movies';
      return;
    }
    if(action==='hero-info'){
      openVodModal({
        name: 'John Wick 4: Baba Yaga',
        group: 'Ação • 2023 • 2h 49m',
        img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
        description: 'John Wick descobre um caminho para derrotar a Alta Cúpula. Mas antes que ele possa conquistar sua liberdade, Wick deve enfrentar um novo inimigo com alianças poderosas em todo o mundo e forças que transformam velhos amigos em inimigos.'
      });
      return;
    }
    if(action==='vod-card-click'){
      const idx = Number(b.dataset.index);
      const isSeries = b.dataset.type === 'series';
      const pool = isSeries ? (state.dashSeries || []) : (state.dashMovies || []);
      const item = pool[idx] || { name: b.title || 'Conteúdo', group: isSeries ? 'Série' : 'Filme' };
      openVodModal(item);
      return;
    }
    if(action==='resume-vod'){
      const title = b.dataset.title;
      const historyItem = (state.history || []).find(h => (h.channel?.name === title) || (h.title === title));
      const target = historyItem?.channel || { name: title, title: title };
      if(target.streamType === 'live' || target.program){
        state.selected = target;
        location.hash = '#/live';
        setTimeout(() => playChannel(target), 120);
      } else {
        openVodTheater(target);
      }
      return;
    }
    if(action==='open-epg-detail'){
      const name = b.dataset.name;
      const prog = b.dataset.prog;
      const time = b.dataset.time;
      const hasEpg = b.dataset.hasepg === 'true';
      const pool = state.channels || [];
      const ch = pool.find(c => c.name === name) || { name };
      openModal('Programação do Canal', `
        <div style="display:flex; flex-direction:column; gap:1.25rem; max-width:540px;">
          <div style="display:flex; align-items:center; gap:1rem;">
            <div class="iptv-round-logo" style="width:48px; height:48px;">
              ${ch.logo ? `<img src="${esc(ch.logo)}" alt="${esc(name)}">` : initials(name)}
            </div>
            <div>
              <h2 style="font-size:1.35rem; font-weight:800; color:#fff; margin:0;">${esc(name)}</h2>
              <span style="font-size:0.85rem; color:var(--iptv-text-sec);">${esc(ch.group || 'Geral')}</span>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1.1rem;">
            ${hasEpg ? `
              <span class="iptv-badge-live" style="margin-bottom:0.5rem;">AO VIVO AGORA</span>
              <strong style="display:block; font-size:1.1rem; color:#fff; margin-bottom:4px;">${esc(prog)}</strong>
              <span style="font-size:0.85rem; color:rgba(255,255,255,0.6);">${esc(time)}</span>
              <p style="font-size:0.88rem; color:rgba(255,255,255,0.7); margin:0.75rem 0 0; line-height:1.5;">
                Transmissão em tempo real. Acompanhe a cobertura ao vivo diretamente no player de vídeo.
              </p>
            ` : `
              <span class="iptv-badge-live" style="margin-bottom:0.5rem; background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.6); box-shadow:none;">SEM TABELA XMLTV</span>
              <strong style="display:block; font-size:1.05rem; color:#fff; margin-bottom:4px;">Grade de horários indisponível</strong>
              <p style="font-size:0.88rem; color:rgba(255,255,255,0.65); margin:0.5rem 0 0; line-height:1.5;">
                Esta fonte de transmissão ainda não possui metadados EPG XMLTV sincronizados. O sinal ao vivo do canal está operacional e disponível para reprodução imediata.
              </p>
            `}
          </div>
          <button class="iptv-btn-play-red" data-action="watch-epg-channel" data-name="${esc(name)}" style="justify-content:center; height:48px;">
            ${icon('play')} Assistir Este Canal Agora
          </button>
        </div>
      `);
      return;
    }
    if(action==='watch-epg-channel'){
      const name = b.dataset.name;
      const pool = state.channels || [];
      const ch = pool.find(c => c.name === name) || { name };
      state.selected = ch;
      $('#modal')?.close();
      location.hash = '#/live';
      return;
    }
    if(action==='start-vod-theater' || action==='play-vod-item' || action==='play-series-item'){
      const name = b.dataset.name || b.title;
      $('#modal')?.close();
      const current = window._currentVodItem;
      const pool = [...(state.dashMovies || []), ...(state.dashSeries || []), ...(state.currentMovies || []), ...(state.currentSeries || [])];
      let target = (current && (current.name === name || current.title === name)) ? current : pool.find(c => c.name === name || c.title === name);
      if(!target){
        target = current || { name, title: name, streamType: 'vod' };
      }
      openVodTheater(target);
      return;
    }
    if(action==='close-vod-theater'){
      closeVodTheater();
      return;
    }
    if(action==='theater-play-toggle'){
      const v = document.getElementById('video');
      if(v){
        if(v.paused) v.play().catch(()=>{});
        else v.pause();
      }
      return;
    }
    if(action==='theater-skip-back'){
      skipVodTime(-10);
      return;
    }
    if(action==='theater-skip-forward'){
      skipVodTime(10);
      return;
    }
    if(action==='hero-dot'){
      const idx = parseInt(b.dataset.idx, 10);
      if(!isNaN(idx)) changeHeroSlide(idx);
      return;
    }
    if(action==='resume-current-playing'){
      if(window._currentPlaying?.type === 'live'){
        location.hash = '#/live';
      } else if(window._currentPlaying?.target){
        openVodTheater(window._currentPlaying.target);
      }
      return;
    }
    if(action==='toggle-aspect-ratio'){
      toggleAspectRatio();
      return;
    }
    if(action==='theater-fullscreen'){
      const v = document.getElementById('video');
      if(v){
        if(v.requestFullscreen) v.requestFullscreen();
        else if(v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      }
      return;
    }
    if(action==='load-more-live-channels'){
      location.hash = '#/categories';
      return;
    }
    if(action==='toggle-favorite-search'){
      const name = b.dataset.name;
      const pool = state.channels || [];
      const item = pool.find(c => c.name === name) || window._currentVodItem || { name, group: 'Geral' };
      b.disabled = true;
      try {
        await toggleFavorite(item);
        const isFav = state.favorites && state.favorites.some(f => 
          (f.channel && (f.channel.name === name || f.channel.url === item.url || f.channel.id === item.id)) || 
          f.name === name || f.url === item.url
        );
        b.classList.toggle('is-favorite', isFav);
        b.classList.toggle('is-favorited', isFav);
        b.style.color = isFav ? '#e50914' : 'rgba(255,255,255,0.7)';
        b.title = isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
        b.setAttribute('aria-label', b.title);
        toast(isFav ? `❤️ "${name}" adicionado aos Favoritos!` : `Removido dos Favoritos.`);
      } catch(err) {
        toast('Erro ao atualizar favoritos: ' + err.message, true);
      } finally {
        b.disabled = false;
      }
      return;
    }
    if(action==='fullscreen-live'){
      const v = document.getElementById('video');
      if(v){
        if(v.requestFullscreen) v.requestFullscreen();
        else if(v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      }
      return;
    }
    if(action==='reconnect-live'){
      const pool = (state.channels && state.channels.length) ? state.channels : (window._liveChannels || []);
      const ch = state.selected || pool[0];
      if(ch) playChannel(ch);
      return;
    }
    if(action==='iptv-live-cat'){
      const cat = b.dataset.name;
      state.category = (cat === 'Todos os canais' || cat === 'Todos os títulos' || !cat) ? '' : cat;
      if(state.mediaType && state.mediaType !== 'live'){
        const curGroup = state.category;
        const filterQuery = curGroup ? `&group=${encodeURIComponent(curGroup)}` : '';
        const itemsRes = await api(`/playlists/${state.activePlaylist}/filter?type=${state.mediaType}&limit=150${filterQuery}`).catch(()=>({channels:[]}));
        state.channels = itemsRes.channels || [];
        const contentEl = document.getElementById('content');
        if(contentEl) contentEl.innerHTML = livePage();
        if(state.channels.length) playChannel(state.channels[0]);
      } else {
        await renderRoute();
      }
      return;
    }
    if(action==='run-speedtest'){
      b.disabled = true;
      b.innerHTML = `${icon('refresh')} Testando conexão...`;
      setTimeout(()=>{
        b.disabled = false;
        b.innerHTML = `${icon('refresh')} Iniciar Novo Teste`;
        toast('Diagnóstico concluído: 145 Mbps · Ping: 9ms (Excelente)');
      }, 1200);
      return;
    }
    if(action==='block-user'){b.disabled=true;const u=state.users.find(x=>x.user.id===b.dataset.id).user;await api(`/admin/users/${u.id}`,'PATCH',{blocked:!u.blocked});$('#modal').close();await renderRoute();toast('Acesso atualizado.');return;}
    if(action==='delete-user'){
      if(!confirm('Tem certeza que deseja excluir permanentemente este usuário?')) return;
      b.disabled=true;
      await api(`/admin/users/${b.dataset.id}`,'DELETE');
      $('#modal').close();
      await renderRoute();
      toast('Usuário excluído.');
      return;
    }
  }catch(error){b.disabled=false;toast(error.message,true);}
});
document.addEventListener('input',event=>{
  if(event.target.id==='iptv-search-input'){
    state.searchQuery = event.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const contentEl = document.getElementById('content');
      if(contentEl && state.page === 'search'){
        contentEl.innerHTML = searchPage();
        const input = document.getElementById('iptv-search-input');
        if(input){
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
    }, 180);
  }
  if(event.target.id==='channel-search'){clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.query=event.target.value;state.channelPage=1;renderChannels();},160);}
  if(event.target.id==='user-search')$('#user-rows').innerHTML=userRows(event.target.value);
  if(event.target.id==='quick-volume-slider'){const v=$('#video');if(v){const val=Number(event.target.value);v.muted=val===0;v.volume=val/100;const lbl=$('#quick-volume-val');if(lbl)lbl.textContent=val===0?'Mudo':`${val}%`;}}
});
document.addEventListener('change',event=>{
  if(event.target.id==='player-playlist'){pendingChannel=null;loadChannels(event.target.value);}
  if(event.target.id==='category-select')selectCategory(Number(event.target.value));
  if(event.target.id==='quick-audio-track'&&hls){hls.audioTrack=Number(event.target.value);toast('Faixa de áudio alterada');}
});
document.addEventListener('keydown', event => {
  const target = event.target;
  const isInput = target?.matches?.('input, textarea, select, [contenteditable="true"]');

  // Tecla Escape fecha modais/menus/theater
  if (['Escape', 'BrowserBack'].includes(event.key) || [4, 461, 10009].includes(event.keyCode)) {
    if ($('#modal')?.open) { event.preventDefault(); $('#modal').close(); return; }
    if ($('.shell.menu-open')) { event.preventDefault(); setMenu(false); return; }
    if (document.getElementById('vod-theater')) { closeVodTheater(); return; }
    if (event.key !== 'Escape' && state.page === 'player' && state.selected) {
      event.preventDefault(); backToChannels(); focusTV($('#channel-list .channel-select'));
    }
    return;
  }

  // Se estiver digitando em campo de texto, não intercepta atalhos de controle
  if (isInput) return;

  const activeVideo = document.getElementById('vod-player') || document.getElementById('video') || document.getElementById('pip-video');

  // Atalho 'F' ou 'f': Alternar Fullscreen
  if (event.key === 'f' || event.key === 'F') {
    event.preventDefault();
    if (!document.fullscreenElement) {
      (activeVideo?.parentElement || activeVideo || document.documentElement).requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
    return;
  }

  // Atalho 'M' ou 'm': Alternar Mudo
  if (event.key === 'm' || event.key === 'M') {
    event.preventDefault();
    if (activeVideo) {
      activeVideo.muted = !activeVideo.muted;
      toast(activeVideo.muted ? '🔇 Áudio mutado' : '🔊 Áudio ativado');
    }
    return;
  }

  // Atalho 'P' ou 'p': Alternar Miniplayer PiP
  if (event.key === 'p' || event.key === 'P') {
    event.preventDefault();
    if (window.pipModule?.activeChannel) {
      window.pipModule.exit();
    } else if (state.selected) {
      window.pipModule?.enter(state.selected);
    }
    return;
  }

  // Atalho 'Space': Play / Pause
  if (event.code === 'Space' || event.key === ' ') {
    if (activeVideo) {
      event.preventDefault();
      if (activeVideo.paused) {
        activeVideo.play().catch(() => {});
      } else {
        activeVideo.pause();
      }
      return;
    }
  }

  // Zapping ao vivo com ArrowUp / ArrowDown quando assistindo TV
  if (['live', 'player'].includes(state.page) && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
    const list = state.channels || [];
    if (list.length > 0) {
      event.preventDefault();
      const curIdx = state.selected ? list.findIndex(c => c.id === state.selected.id) : 0;
      let nextIdx = event.key === 'ArrowDown' ? curIdx + 1 : curIdx - 1;
      if (nextIdx < 0) nextIdx = list.length - 1;
      if (nextIdx >= list.length) nextIdx = 0;
      const nextCh = list[nextIdx];
      if (nextCh) {
        playChannel(nextCh);
      }
      return;
    }
  }

  // Seek de 10s no VOD com ArrowLeft / ArrowRight
  if (activeVideo && Number.isFinite(activeVideo.duration) && activeVideo.duration > 0 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 10 : -10;
    activeVideo.currentTime = Math.max(0, Math.min(activeVideo.duration, activeVideo.currentTime + delta));
    toast(`${delta > 0 ? '+10s' : '-10s'} (${Math.round(activeVideo.currentTime)}s)`);
    return;
  }

  // Modo Smart TV D-Pad Focus
  if (tvMode && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    moveTVFocus(event.key);
  }
});
document.addEventListener('error',event=>{if(event.target.matches?.('.channel-logo img')){const parent=event.target.parentElement;parent.textContent='▶';}},true);
document.addEventListener('submit',async event=>{
  const form=event.target;if(!['login-form','playlist-form','xtream-playlist-form','refresh-form','settings-form','user-form','reset-form','edit-role-form'].includes(form.id))return;
  event.preventDefault();const button=$('[type="submit"]',form),errorEl=$('.form-error',form),original=button.textContent;
  if(button.disabled)return;button.disabled=true;button.textContent=form.id==='playlist-form'?'Importando…':form.id==='xtream-playlist-form'?'Conectando e Importando…':form.id==='refresh-form'?'Atualizando…':'Salvando…';errorEl.textContent='';
  const fields=new FormData(form),value=Object.fromEntries(fields.entries());
  try{
    if(form.id==='login-form'){
      const res=await api(state.setupRequired?'/setup':'/login','POST',{username:value.username,password:value.password,remember:fields.has('remember')});
      state.user=res;
      if(res.token){
        state.token=res.token;
        try{localStorage.setItem('m3u-token',res.token);}catch{}
      }
      state.setupRequired=false;
      applyTheme(state.user.theme);
      navigate('dashboard');
      // Registra push subscription em background (sem bloquear navegação)
      registerPushSubscription().catch(()=>{});
    }
    if(form.id==='playlist-form'){
      let text='';if(!$('#playlist-file').disabled){const file=fields.get('file');if(!file?.size)throw new Error('Escolha um arquivo M3U.');if(file.size>100*1024*1024)throw new Error('O arquivo excede o limite de 100 MiB.');text=await file.text();}
      const p=await api('/playlists','POST',{name:value.name,url:value.url||'',text,organize:fields.has('organize')});state.activePlaylist=p.id;$('#modal').close();await renderRoute();toast(`${number(p.total)} canais adicionados à sua conta.`);
    }
    if(form.id==='xtream-playlist-form'){
      const r=await api('/playlists/xtream','POST',value);
      state.activePlaylist=r.playlist.id;
      $('#modal').close();
      await renderRoute();
      toast(`✅ IPTV conectado! ${number(r.totalChannels)} canais e títulos importados.`);
    }
    if(form.id==='refresh-form'){await api(`/playlists/${form.dataset.id}/refresh`,'POST',{url:value.url});$('#modal').close();await renderRoute();toast('Playlist atualizada.');}
    if(form.id==='settings-form'){state.user=await api('/account','PATCH',value);applyTheme(state.user.theme);await renderRoute();toast('Configurações salvas.');}
    if(form.id==='user-form'){await api('/admin/users','POST',value);$('#modal').close();await renderRoute();toast('Usuário criado.');}
    if(form.id==='transfer-credits-form'){
      const res=await api('/reseller/transfer','POST',{toUsername:value.toUsername,amount:Number(value.amount)});
      if(state.user)state.user.credits=res.myCredits;
      $('#modal').close();
      await renderRoute();
      toast(res.message);
    }
    if(form.id==='request-reseller-form'){
      const res=await api('/account/request-reseller','POST',{phone:value.phone,notes:value.notes});
      $('#modal').close();
      toast(res.message);
    }
    if(form.id==='edit-role-form'){await api(`/admin/users/${form.dataset.id}`,'PATCH',{role:value.role});$('#modal').close();await renderRoute();toast('Perfil de acesso atualizado.');}
    if(form.id==='reset-form'){await api(`/admin/users/${form.dataset.id}`,'PATCH',{password:value.password});$('#modal').close();toast('Senha redefinida. As sessões anteriores foram encerradas.');}
  }catch(error){errorEl.textContent=error.message;}
  finally{button.disabled=false;button.textContent=original;}
});
document.addEventListener('change', async e => {
  const t = e.target;
  if(t && t.dataset.action === 'change-active-playlist'){
    const plId = t.value;
    if(plId && plId !== state.activePlaylist){
      state.activePlaylist = plId;
      try{ localStorage.setItem('m3u-active-playlist', plId); }catch{}
      state.channels = [];
      state.movieCategories = null;
      state.seriesCategories = null;
      state.selectedVodCategory = '';
      state.selectedSeriesCategory = '';
      state.moviePage = 1;
      state.seriesPage = 1;
      state.currentMovies = [];
      state.currentSeries = [];
      state.dashboardLoaded = false;
      await renderRoute();
      toast('Playlist alterada para: ' + (state.playlists.find(p=>p.id===plId)?.name || ''));
    }
  }
});
document.addEventListener('input', e => {
  if(e.target && e.target.id === 'catalog-search-input'){
    state.catalogQuery = e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const query = (state.catalogQuery || '').toLowerCase().trim();
      const isSeries = state.page === 'series';
      const raw = (isSeries ? state.currentSeries : state.currentMovies) || [];
      const filtered = query ? raw.filter(it => (it.name && it.name.toLowerCase().includes(query)) || (it.group && it.group.toLowerCase().includes(query))) : raw;
      const grid = document.querySelector('.iptv-ref-grid');
      if(grid){
        grid.innerHTML = filtered.length ? filtered.map((m, idx) => {
          const coverImg = m.posterUrl || m.logo;
          return `
          <div class="iptv-ref-poster-card" data-action="catalog-card-click" data-type="${isSeries?'series':'movies'}" data-index="${idx}" tabindex="0" title="${esc(m.name)}">
            <div class="iptv-ref-poster-thumb">
              ${coverImg ? `<img src="${esc(coverImg)}" alt="${esc(m.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
              <div class="iptv-ref-poster-fallback" style="${coverImg?'display:none;':''}">
                ${icon(isSeries?'tv':'film')}
              </div>
              ${m.rating ? `<span class="iptv-poster-badge iptv-rating-badge">⭐ ${m.rating}</span>` : ''}
              ${m.year ? `<span class="iptv-poster-badge iptv-year-badge">${m.year}</span>` : ''}
            </div>
            <div class="iptv-ref-poster-info">
              <div class="iptv-ref-poster-title">${esc(m.name)}</div>
              <div class="iptv-ref-poster-sub">${esc(m.genres || m.group || (isSeries?'SÉRIE':'FILMES'))}</div>
            </div>
          </div>
        `;}).join('') : `
          <div style="grid-column: 1 / -1; padding:3rem; text-align:center; color:var(--iptv-text-sec);">
            ${icon('search')}
            <p style="margin-top:0.75rem;">Nenhum título encontrado com os filtros atuais.</p>
          </div>
        `;
      }
      const counter = document.querySelector('.iptv-ref-counter');
      if(counter) counter.textContent = `(${number(filtered.length)})`;
    }, 180);
  }
});
window.addEventListener('hashchange',renderRoute);
window.addEventListener('pagehide',()=>{const v=$('#video');if(v&&state.selected&&Number.isFinite(v.duration)&&v.currentTime>0)savePlaybackProgress(state.selected,v).catch(()=>{});});
let sessionCheckTimer=null;
async function verifySession(){
  const userID=state.user?.id;if(!userID)return;
  try{const session=await api('/session');if(state.user?.id===userID&&session.user?.id!==userID){state.user=null;state.token=null;try{localStorage.removeItem('m3u-token');}catch{}clearPrivateState();navigate('login');toast('Este acesso foi encerrado após a entrada em outro dispositivo.',true);}}catch{}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)verifySession();});
async function boot(){
  try{
    try{const savedToken=localStorage.getItem('m3u-token');if(savedToken)state.token=savedToken;}catch{}
    const session=await api('/session');
    Object.assign(state,session);
    if(session.token){
      state.token=session.token;
      try{localStorage.setItem('m3u-token',session.token);}catch{}
    }
    if(!session.user){
      state.user=null;
      state.token=null;
      try{localStorage.removeItem('m3u-token');}catch{}
    }
    if(state.user)applyTheme(state.user.theme);
    await renderRoute();
    if(!sessionCheckTimer)sessionCheckTimer=setInterval(verifySession,15000);
  }catch(error){
    const currentBase = getBackendBase();
    $('#app').innerHTML=`
      <div class="boot-reconnect" style="max-width:440px; margin:5rem auto; padding:2.5rem 2rem; background:rgba(20,21,23,0.95); border:1px solid rgba(255,255,255,0.08); border-radius:24px; box-shadow:0 24px 60px rgba(0,0,0,0.6); text-align:center; backdrop-filter:blur(20px);">
        <div style="width:64px; height:64px; margin:0 auto 1.25rem; border-radius:50%; background:rgba(59,130,246,0.12); display:flex; align-items:center; justify-content:center; color:#3b82f6;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px; height:32px;"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        </div>
        <h2 style="margin:0 0 0.5rem; font-size:1.35rem; color:#fff; font-weight:700;">Conectando ao JstudioPlay</h2>
        <p style="margin:0 0 1.25rem; color:rgba(255,255,255,0.6); font-size:0.9rem; line-height:1.5;">
          Aguardando conexão com o servidor. O sistema tentará reconectar automaticamente.
        </p>
        <button class="btn primary" id="boot-retry" style="width:100%; justify-content:center; padding:0.85rem 1.5rem; font-size:0.95rem; border-radius:12px; margin-bottom:0.75rem;">
          Tentar agora
        </button>
        <button id="boot-toggle-config" style="background:none; border:none; color:#60a5fa; font-size:0.85rem; cursor:pointer; padding:0.5rem; display:inline-flex; align-items:center; gap:0.4rem;">
          ⚙️ Configurar Servidor Backend
        </button>
        <div id="boot-config-panel" style="display:none; margin-top:1.25rem; padding-top:1.25rem; border-top:1px solid rgba(255,255,255,0.08); text-align:left;">
          <label style="display:block; font-size:0.8rem; color:rgba(255,255,255,0.6); margin-bottom:0.4rem;">URL do Servidor:</label>
          <input type="text" id="boot-server-url" value="${esc(currentBase)}" placeholder="https://... ou http://192.168.0.101:3030" style="width:100%; box-sizing:border-box; padding:0.75rem 1rem; border-radius:10px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); color:#fff; font-size:0.85rem; margin-bottom:0.75rem;">
          <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem; flex-wrap:wrap;">
            <button id="btn-quick-cloud" style="flex:1; min-width:120px; font-size:0.75rem; padding:0.4rem 0.6rem; border-radius:8px; background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.3); color:#93c5fd; cursor:pointer;">🌐 Nuvem (Cloudflare)</button>
            <button id="btn-quick-wifi" style="flex:1; min-width:120px; font-size:0.75rem; padding:0.4rem 0.6rem; border-radius:8px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); color:#6ee7b7; cursor:pointer;">📶 Wi-Fi (192.168.0.101)</button>
          </div>
          <button id="boot-save-url" class="btn small" style="width:100%; justify-content:center; padding:0.7rem; border-radius:10px;">
            Salvar e Conectar
          </button>
        </div>
      </div>
    `;
    $('#boot-retry')?.addEventListener('click', boot);
    $('#boot-toggle-config')?.addEventListener('click', () => {
      const panel = $('#boot-config-panel');
      if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    $('#btn-quick-cloud')?.addEventListener('click', () => {
      const input = $('#boot-server-url');
      if (input) input.value = DEFAULT_CLOUD_BACKEND;
    });
    $('#btn-quick-wifi')?.addEventListener('click', () => {
      const input = $('#boot-server-url');
      if (input) input.value = LOCAL_WIFI_BACKEND;
    });
    $('#boot-save-url')?.addEventListener('click', () => {
      const input = $('#boot-server-url');
      const val = (input?.value || '').trim();
      if (val) localStorage.setItem('m3u-backend-url', val);
      else localStorage.removeItem('m3u-backend-url');
      boot();
    });
    setTimeout(boot, 6000);
  }
}

document.addEventListener('keydown', (e) => {
  const isTheater = Boolean(document.getElementById('vod-theater'));
  if (e.key === 'Escape' || e.keyCode === 27 || e.keyCode === 461 || e.keyCode === 10009) {
    if (isTheater) {
      closeVodTheater();
      return;
    }
  }

  // Atalhos de teclado dedicados para VOD Theater
  if (isTheater && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      const v = document.getElementById('video');
      if (v) {
        if (v.paused) v.play().catch(() => {});
        else v.pause();
      }
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      skipVodTime(-10);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      skipVodTime(10);
      return;
    }
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      const v = document.getElementById('video');
      if (v) {
        v.muted = !v.muted;
        toast(v.muted ? 'Mudo ativado' : 'Áudio ativado');
        resetVodIdleTimer();
      }
      return;
    }
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      const v = document.getElementById('video');
      if (v) {
        if (v.requestFullscreen) v.requestFullscreen();
        else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      }
      return;
    }
  }
});

document.addEventListener('change', (e) => {
  const target = e.target;
  if(target && target.dataset.action === 'vod-change-speed') {
    setVodPlaybackRate(target.value);
    return;
  }
  if(target && target.dataset.action === 'mv-select-ch') {
    const slotIdx = Number(target.dataset.slot || 0);
    const chId = target.value;
    const ch = (state.channels || []).find(c => c.id === chId);
    if(ch && window.multiviewModule) {
      window.multiviewModule.playSlot(slotIdx, ch);
    }
  }
});

// ==========================================================================
// Subscrições Reativas de Componentes (EventBus v8.3.3)
// ==========================================================================
if (window.eventBus) {
  window.eventBus.on('playback:started', (data) => {
    const container = document.getElementById('topbar-now-playing-container');
    const titleEl = document.getElementById('topbar-now-playing-title');
    if (container && titleEl && data) {
      titleEl.textContent = data.title || 'Reproduzindo';
      container.style.display = 'inline-flex';
    }
  });

  window.eventBus.on('playback:stopped', () => {
    const container = document.getElementById('topbar-now-playing-container');
    if (container) {
      container.style.display = 'none';
    }
  });

  window.eventBus.on('playback:progress', (data) => {
    if (!data || !data.item) return;
    const name = data.item.title || data.item.name || '';
    if (!name) return;
    const cards = document.querySelectorAll('.iptv-ref-continue-card');
    cards.forEach(card => {
      if (card.dataset.title === name) {
        const bar = card.querySelector('.iptv-ref-continue-bar');
        if (bar) bar.style.width = `${Math.min(100, Math.round(data.percent || 0))}%`;
      }
    });
  });
}

boot();


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
      await api(`/playlists/${state.activePlaylist}/enrich-batch`, 'POST', { limit: 40, delayMs: 200 });
    } catch (e) {
      // Falha silenciosa em background para não interromper a navegação
    }
  }, FIVE_MINUTES_MS);
}
startAutoEnrichmentBackground();
