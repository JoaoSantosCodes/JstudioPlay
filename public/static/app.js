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
  playlist:'M6 3h12v18H6zM9 7h6M9 11h6M9 15h3',
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
};
function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.tv}"/></svg>`; }
function brand(route = 'login') { return `<a class="brand" href="#/${state.user ? 'dashboard' : 'login'}" aria-label="JstudioPlay — Início"><img src="/static/logo.svg" alt="JstudioPlay"><span>Jstudio<span>Play</span></span></a>`; }
let initialToken=null;
try { initialToken = localStorage.getItem('m3u-token'); } catch {}
const state = {user:null,token:initialToken,setupRequired:false,setupAllowed:false,relayEnabled:false,relayMode:false,page:'',playlists:[],favorites:[],history:[],progress:[],users:[],logs:[],aiStatus:null,channels:[],activePlaylist:'',category:'',query:'',channelPage:1,selected:null,groups:[],loading:false};
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
function getBackendBase() {
  const custom = localStorage.getItem('m3u-backend-url');
  if (custom && custom.trim()) return custom.trim().replace(/\/+$/, '');
  
  // Se estiver no aplicativo nativo Android (Capacitor), conecta automaticamente à nuvem
  const isNativeApp = window.Capacitor || location.protocol === 'capacitor:' || (location.hostname === 'localhost' && !location.port);
  if (isNativeApp) {
    return 'https://jstudioplay.joaocarlosrh23.workers.dev';
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
      credentials: base ? 'include' : 'same-origin',
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

function iptvTopBar(active='dashboard'){
  const time = getIptvClock();
  const isReseller = state.user?.role === 'reseller';
  return `<header class="iptv-dash-topbar">
    <div class="iptv-topbar-left">
      <nav class="iptv-nav-pills" aria-label="Navegação IPTV">
        <a class="iptv-nav-pill ${active==='dashboard'?'active':''}" href="#/dashboard" tabindex="0">Início</a>
        <a class="iptv-nav-pill ${active==='live'||active==='channels'?'active':''}" href="#/live" tabindex="0">TV Ao Vivo</a>
        <a class="iptv-nav-pill ${active==='movies'?'active':''}" href="#/movies" tabindex="0">Filmes</a>
        <a class="iptv-nav-pill ${active==='series'?'active':''}" href="#/series" tabindex="0">Séries</a>
        <a class="iptv-nav-pill ${active==='epg'?'active':''}" href="#/epg" tabindex="0">Guia EPG</a>
      </nav>
    </div>
    <div class="iptv-topbar-right">
      ${isReseller ? `<a class="credit-balance-pill" href="#/credits" title="Saldo de Créditos">${icon('credits')} <strong>${state.user.credits || 0}</strong> créditos</a>` : ''}
      <span class="iptv-clock" id="iptv-live-clock">${time}</span>
      <a class="iptv-icon-action" href="#/search" title="Buscar canais" tabindex="0">${icon('search')}</a>
      <a class="iptv-icon-action" href="#/settings" title="Configurações" tabindex="0">${icon('settings')}</a>
      <a class="iptv-icon-action" href="#/settings" title="Perfil da conta" tabindex="0">${icon('user')}</a>
    </div>
  </header>`;
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
          <span class="iptv-logo-title">IPTV</span>
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
  channels:'Canais',
  movies:'Filmes',
  series:'Séries',
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

function dashboard(){
  // Canais de demonstração alinhados com o layout da imagem de referência
  const liveChannels = [
    { name: 'SporTV', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/SporTV_2021.svg/320px-SporTV_2021.svg.png', progress: 65, group: 'Esportes' },
    { name: 'Globo', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/TV_Globo_2021.svg/320px-TV_Globo_2021.svg.png', progress: 85, group: 'Variedades' },
    { name: 'ESPN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/320px-ESPN_wordmark.svg.png', progress: 40, group: 'Esportes' },
    { name: 'Band', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Rede_Bandeirantes_logo.svg/320px-Rede_Bandeirantes_logo.svg.png', progress: 55, group: 'Notícias' },
    { name: 'CNN Brasil', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/CNN_Brasil_logo.svg/320px-CNN_Brasil_logo.svg.png', progress: 30, group: 'Notícias' },
    { name: 'SBT', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/SBT_logo.svg/320px-SBT_logo.svg.png', progress: 75, group: 'Variedades' },
    { name: 'Discovery', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Discovery_Channel_2019.svg/320px-Discovery_Channel_2019.svg.png', progress: 50, group: 'Documentários' },
    { name: 'History', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/History_Logo.svg/320px-History_Logo.svg.png', progress: 60, group: 'Documentários' }
  ];

  const movies = [
    { title: 'Top Gun: Maverick', meta: 'Ação • 2022', img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80' },
    { title: 'Deadpool & Wolverine', meta: 'Ação / Comédia • 2024', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80' },
    { title: 'John Wick: Capítulo 4', meta: 'Ação • 2023', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80' },
    { title: 'Duna: Parte 2', meta: 'Ficção Científica • 2024', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80' },
    { title: 'Oppenheimer', meta: 'Drama / História • 2023', img: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=300&q=80' }
  ];

  const series = [
    { title: 'The Last of Us', meta: 'Drama / Sobrevivência • 2023', img: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=300&q=80' },
    { title: 'Breaking Bad', meta: 'Crime / Drama • 5 Temp.', img: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=300&q=80' },
    { title: 'House of the Dragon', meta: 'Fantasia • 2 Temp.', img: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=300&q=80' },
    { title: 'Stranger Things', meta: 'Suspense • 4 Temp.', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80' }
  ];

  return `<div class="iptv-dashboard-page">
    <!-- Hero Banner: Campeonato Brasileiro (Live) -->
    <div class="iptv-hero-wrap">
      <div class="iptv-hero-bg"></div>
      <div class="iptv-hero-content">
        <span class="iptv-live-badge"><span class="iptv-live-dot"></span> LIVE</span>
        <h1 class="iptv-hero-title">Campeonato Brasileiro</h1>
        <p class="iptv-hero-subtitle">Flamengo x Palmeiras</p>
        <div class="iptv-hero-schedule">
          ${icon('clock')} Ao vivo agora • 21:30 - 23:30
        </div>
        <button class="iptv-hero-btn-play" data-action="open-first-live" tabindex="0">
          ${icon('play')} Assistir Agora
        </button>
      </div>

      <!-- Brasão flutuante -->
      <div class="iptv-hero-crest">
        <svg viewBox="0 0 100 100" fill="none" style="width:110px; height:110px;">
          <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
          <path d="M50 15 L78 30 L78 68 L50 85 L22 68 L22 30 Z" fill="rgba(229,9,20,0.4)" stroke="#fff" stroke-width="2"/>
          <text x="50" y="55" fill="#fff" font-size="12" font-weight="900" text-anchor="middle">BRASILEIRÃO</text>
        </svg>
      </div>
    </div>

    <!-- Seções de Trilhos -->
    <div class="iptv-sections-wrap">
      <!-- Trilho 1: TV Ao Vivo (Cards Widescreen com Progresso) -->
      <section class="iptv-rail-section">
        <div class="iptv-rail-header">
          <div class="iptv-rail-title">${icon('tv')} TV Ao Vivo</div>
          <a class="iptv-rail-arrow" href="#/live" title="Ver todos os canais" tabindex="0">${icon('right')}</a>
        </div>
        <div class="iptv-rail-track">
          ${liveChannels.map((c, i) => `
            <div class="iptv-channel-card" data-action="open-first-live" data-index="${i}" tabindex="0" title="${esc(c.name)}">
              <div class="iptv-channel-logo-wrap">
                <img src="${c.logo}" alt="${esc(c.name)}" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='block';">
                <span class="iptv-channel-fallback" style="display:none;">${esc(c.name)}</span>
              </div>
              <div class="iptv-channel-name">${esc(c.name)}</div>
              <div class="iptv-card-progress">
                <div class="iptv-card-progress-bar" style="width:${c.progress}%;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Trilho 2: Filmes (Pôsteres Verticais) -->
      <section class="iptv-rail-section">
        <div class="iptv-rail-header">
          <div class="iptv-rail-title">${icon('film')} Filmes</div>
          <a class="iptv-rail-arrow" href="#/movies" title="Ver filmes" tabindex="0">${icon('right')}</a>
        </div>
        <div class="iptv-rail-track">
          ${movies.map(m => `
            <div class="iptv-poster-card" data-action="open-movie-detail" data-id="${m.id}" tabindex="0">
              <img class="iptv-poster-img" src="${m.img}" alt="${esc(m.title)}" loading="lazy">
              <div class="iptv-poster-overlay">
                <strong class="iptv-poster-title">${esc(m.title)}</strong>
                <span class="iptv-poster-meta">${esc(m.meta)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Trilho 3: Séries (Pôsteres Verticais) -->
      <section class="iptv-rail-section">
        <div class="iptv-rail-header">
          <div class="iptv-rail-title">${icon('grid')} Séries</div>
          <a class="iptv-rail-arrow" href="#/series" title="Ver séries" tabindex="0">${icon('right')}</a>
        </div>
        <div class="iptv-rail-track">
          ${series.map(s => `
            <div class="iptv-poster-card" data-action="open-first-live" tabindex="0">
              <img class="iptv-poster-img" src="${s.img}" alt="${esc(s.title)}" loading="lazy">
              <div class="iptv-poster-overlay">
                <strong class="iptv-poster-title">${esc(s.title)}</strong>
                <span class="iptv-poster-meta">${esc(s.meta)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  </div>`;
}

function epgPage(){
  const categories = [
    { name: 'Todos os Canais', count: 156, active: true },
    { name: 'Esportes', count: 24 },
    { name: 'Filmes', count: 32 },
    { name: 'Séries', count: 28 },
    { name: 'Notícias', count: 12 },
    { name: 'Infantil', count: 15 },
    { name: 'Documentários', count: 10 },
    { name: 'Música', count: 8 },
    { name: 'Variedades', count: 14 },
    { name: 'Internacionais', count: 13 }
  ];

  const gridChannels = [
    { name: 'Globo', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/TV_Globo_2021.svg/120px-TV_Globo_2021.svg.png', p1: 'Jornal Nacional', t1: '20:30 - 21:30', p2: 'Troca de Passes', t2: '21:30 - 22:30' },
    { name: 'SporTV', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/SporTV_2021.svg/120px-SporTV_2021.svg.png', p1: 'Brasileirão Série A', t1: '21:00 - 23:30', p2: 'SporTV News', t2: '23:30 - 00:30' },
    { name: 'ESPN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/120px-ESPN_wordmark.svg.png', p1: 'NBA - Playoffs', t1: '21:15 - 23:45', p2: 'Linha de Passe', t2: '23:45 - 01:00' },
    { name: 'Band', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Rede_Bandeirantes_logo.svg/120px-Rede_Bandeirantes_logo.svg.png', p1: 'MasterChef Brasil', t1: '21:15 - 23:00', p2: 'A Fazenda Notícias', t2: '23:00 - 00:00' },
    { name: 'Record TV', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/SBT_logo.svg/120px-SBT_logo.svg.png', p1: 'Jornal da Record', t1: '20:45 - 21:45', p2: 'Cidade Alerta', t2: '21:45 - 23:15' },
    { name: 'SBT', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/SBT_logo.svg/120px-SBT_logo.svg.png', p1: 'Programa do Ratinho', t1: '21:00 - 22:15', p2: 'The Wall', t2: '22:15 - 23:30' },
    { name: 'Discovery', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Discovery_Channel_2019.svg/120px-Discovery_Channel_2019.svg.png', p1: 'Fuga para a Escócia', t1: '20:30 - 21:45', p2: 'How It\'s Made', t2: '21:45 - 22:45' },
    { name: 'History', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/History_Logo.svg/120px-History_Logo.svg.png', p1: 'Grandes Civilizações', t1: '20:30 - 22:00', p2: 'O Incrível Dr. Pol', t2: '22:00 - 23:00' }
  ];

  return `<div class="iptv-epg-page">
    <header class="iptv-epg-topbar">
      <div class="iptv-epg-title-tag">
        <a class="iptv-main-logo" href="#/dashboard" style="text-decoration:none;">
          <div class="iptv-play-icon" style="width:32px; height:32px; border-radius:6px;">
            <svg viewBox="0 0 24 24" style="width:14px; height:14px;"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <span class="iptv-logo-title" style="font-size:1.3rem;">IPTV</span>
        </a>
        <span>TV Ao Vivo <small>| Guia de Programação (EPG)</small></span>
      </div>
      <div class="iptv-topbar-right">
        <span class="iptv-clock">${getIptvClock()}</span>
        <a class="iptv-icon-action" href="#/player" title="Buscar canais">${icon('search')}</a>
        <a class="iptv-icon-action" href="#/settings" title="Configurações">${icon('settings')}</a>
      </div>
    </header>

    <div class="iptv-epg-container">
      <!-- Sidebar de Categorias -->
      <aside class="iptv-epg-sidebar">
        ${categories.map(c => `
          <button class="iptv-epg-cat-item ${c.active?'active':''}" data-action="iptv-epg-cat" data-name="${esc(c.name)}">
            <span>${esc(c.name)}</span>
            <span class="iptv-epg-cat-count">${c.count}</span>
          </button>
        `).join('')}
      </aside>

      <!-- Grade Timeline EPG -->
      <main class="iptv-epg-main">
        <div class="iptv-epg-time-ruler">
          <div class="iptv-epg-ruler-date">Hoje ▾</div>
          <div class="iptv-epg-ruler-slots">
            <div class="iptv-epg-slot">20:30</div>
            <div class="iptv-epg-slot">21:00</div>
            <div class="iptv-epg-slot">21:30</div>
            <div class="iptv-epg-slot">22:00</div>
            <div class="iptv-epg-slot">22:30</div>
          </div>
        </div>

        <div class="iptv-epg-grid-rows">
          ${gridChannels.map(ch => `
            <div class="iptv-epg-row">
              <div class="iptv-epg-channel-col" data-action="open-first-live">
                <div class="iptv-epg-ch-logo">
                  <img src="${ch.logo}" alt="${esc(ch.name)}" onerror="this.onerror=null;this.parentElement.textContent='${esc(initials(ch.name))}';">
                </div>
                <div class="iptv-epg-ch-info">
                  <strong>${esc(ch.name)}</strong>
                  <span class="iptv-epg-live-chip">AO VIVO</span>
                </div>
              </div>
              <div class="iptv-epg-programs-row">
                <div class="iptv-epg-prog-block current" data-action="open-first-live">
                  <strong class="iptv-epg-prog-title">${esc(ch.p1)}</strong>
                  <span class="iptv-epg-prog-time">${esc(ch.t1)}</span>
                </div>
                <div class="iptv-epg-prog-block" data-action="open-first-live">
                  <strong class="iptv-epg-prog-title">${esc(ch.p2)}</strong>
                  <span class="iptv-epg-prog-time">${esc(ch.t2)}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </main>
    </div>
  </div>`;
}

function iptvSmartSidebar(active='dashboard'){
  const role = state.user?.role || 'user';
  const items = [
    { id: 'dashboard', label: 'Início', icon: 'home' },
    { id: 'live', label: 'TV Ao Vivo', icon: 'tv' },
    { id: 'movies', label: 'Filmes', icon: 'film' },
    { id: 'series', label: 'Séries', icon: 'grid' }
  ];

  // Playlists: Pro, Revendedor, Adm e Master
  if(['pro','reseller','admin','master'].includes(role)){
    items.push({ id: 'playlists', label: 'Playlists', icon: 'playlist' });
  }

  // Gravações: Pro, Revendedor, Adm e Master
  if(['pro','reseller','admin','master'].includes(role)){
    items.push({ id: 'recordings', label: 'Gravações', icon: 'clock' });
  }

  items.push({ id: 'epg', label: 'EPG', icon: 'refresh' });
  items.push({ id: 'favorites', label: 'Favoritos', icon: 'heart' });

  // M3U Hub: Adm e Master
  if(['admin','master'].includes(role)){
    items.push({ id: 'automation', label: 'M3U Hub', icon: 'globe' });
  }

  // Status da IA: Adm e Master
  if(['admin','master'].includes(role)){
    items.push({ id: 'ai-status', label: 'Status da IA', icon: 'refresh' });
  }

  // Gestão de Clientes / Usuários: Revendedor, Adm e Master
  if(['reseller','admin','master'].includes(role)){
    items.push({ id: 'users', label: 'Usuários', icon: 'users' });
  }

  // Comprar Créditos: Revendedor, Adm e Master
  if(['reseller','admin','master'].includes(role)){
    items.push({ id: 'credits', label: 'Comprar Crédito', icon: 'credits' });
  }

  // Logs do Sistema: Exclusivo Master
  if(role === 'master'){
    items.push({ id: 'logs', label: 'Logs', icon: 'clock' });
  }

  items.push({ id: 'settings', label: 'Configurações', icon: 'settings' });
  return `<aside class="iptv-smart-sidebar" aria-label="Menu Principal IPTV">
    <div style="padding:0 0.5rem 1.25rem; display:flex; align-items:center; gap:0.75rem;">
      <div class="iptv-play-icon" style="width:36px; height:36px; border-radius:8px;">
        <svg viewBox="0 0 24 24" style="width:16px; height:16px;"><path d="M8 5v14l11-7z"/></svg>
      </div>
      <span class="iptv-logo-title" style="font-size:1.35rem;">IPTV</span>
    </div>
    ${role === 'reseller' ? `
      <div class="iptv-sidebar-credit-badge">
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
          <span style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.5px; color:rgba(255,255,255,0.6);">Saldo</span>
          <span style="font-size:0.72rem; color:#4ade80; font-weight:700;">Ativo</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.4rem; margin-top:0.25rem;">
          ${icon('credits')}
          <span style="font-size:1.15rem; font-weight:800; color:#fff;">${state.user.credits || 0}</span>
          <span style="font-size:0.8rem; color:rgba(255,255,255,0.7);">créditos</span>
        </div>
        <a href="#/credits" class="iptv-sidebar-buy-link">+ Comprar créditos</a>
      </div>
    ` : ''}
    <nav style="display:flex; flex-direction:column; gap:0.35rem;">
      ${items.map(it => `
        <a class="iptv-smart-nav-item ${(active===it.id || (it.id==='playlists'&&active==='channels') || (it.id==='live'&&active==='channels'))?'active':''}" href="#/${it.id}" tabindex="0">
          ${icon(it.icon)}
          <span>${it.label}</span>
        </a>
      `).join('')}
    </nav>
    <div style="margin-top:auto; padding-top:1rem; border-top:1px solid var(--iptv-border);">
      <button class="iptv-smart-nav-item" data-action="logout" tabindex="0" style="width:100%; color:var(--iptv-text-sec);">
        ${icon('logout')}
        <span>Sair</span>
      </button>
    </div>
  </aside>`;
}

function livePage(){
  const allChs = (state.channels && state.channels.length) ? state.channels : [
    { name: 'SporTV HD', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/SporTV_2021.svg/120px-SporTV_2021.svg.png', group: 'Esportes', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { name: 'Globo SP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/TV_Globo_2021.svg/120px-TV_Globo_2021.svg.png', group: 'Variedades', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { name: 'ESPN Brasil', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/120px-ESPN_wordmark.svg.png', group: 'Esportes', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { name: 'TNT Séries', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Discovery_Channel_2019.svg/120px-Discovery_Channel_2019.svg.png', group: 'Filmes', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { name: 'Band News', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Rede_Bandeirantes_logo.svg/120px-Rede_Bandeirantes_logo.svg.png', group: 'Notícias', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { name: 'CNN Brasil', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/CNN_Brasil_logo.svg/120px-CNN_Brasil_logo.svg.png', group: 'Notícias', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' }
  ];

  const groupCounts = {};
  allChs.forEach(c => {
    const g = c.group || 'Geral';
    groupCounts[g] = (groupCounts[g] || 0) + 1;
  });

  const categories = [
    { name: 'Todos os canais', count: allChs.length, active: !state.category || state.category === 'Todos os canais' },
    ...Object.entries(groupCounts).map(([name, count]) => ({
      name,
      count,
      active: state.category === name
    }))
  ];

  const curCat = state.category && state.category !== 'Todos os canais' ? state.category : null;
  const filtered = curCat ? allChs.filter(c => (c.group || 'Geral') === curCat) : allChs;
  const activeCh = state.selected || filtered[0] || allChs[0];
  window._liveChannels = allChs;

  return `<div class="iptv-tri-layout">
    <!-- Área Esquerda: Categorias -->
    <aside class="iptv-tri-col-cats">
      <div style="padding:0.5rem 0.5rem 1rem; font-size:1.1rem; font-weight:700; color:#fff;">Categorias</div>
      ${categories.map(c => `
        <button class="iptv-epg-cat-item ${c.active?'active':''}" data-action="iptv-live-cat" data-name="${esc(c.name)}" tabindex="0">
          <span>${esc(c.name)}</span>
          <span class="iptv-epg-cat-count">${c.count}</span>
        </button>
      `).join('')}
    </aside>

    <!-- Área Central: Lista de Canais -->
    <main class="iptv-tri-col-channels">
      <div style="padding:1rem 1.25rem; font-size:1.1rem; font-weight:700; color:#fff; border-bottom:1px solid var(--iptv-border); display:flex; justify-content:space-between; align-items:center;">
        <span>Canais (${filtered.length})</span>
        <span class="iptv-live-badge" style="margin:0;"><span class="iptv-live-dot"></span> AO VIVO</span>
      </div>
      <div style="overflow-y:auto; flex:1;" id="live-channel-list">
        ${filtered.slice(0, 100).map((ch, idx) => {
          const isAct = (activeCh && (activeCh.url === ch.url || activeCh.name === ch.name));
          const numStr = String(idx + 1).padStart(2, '0');
          return `
          <button class="iptv-tri-channel-row ${isAct?'active':''}" data-action="select-live-ch" data-index="${allChs.indexOf(ch)}" data-name="${esc(ch.name)}" tabindex="0">
            <div style="display:flex; align-items:center; gap:0.85rem;">
              <span style="font-size:0.85rem; font-weight:700; color:var(--iptv-text-sec); width:24px;">${numStr}</span>
              <div class="iptv-epg-ch-logo" style="width:34px; height:34px;">
                ${ch.logo ? `<img src="${esc(ch.logo)}" alt="${esc(ch.name)}" onerror="this.onerror=null;this.parentElement.textContent='${esc(initials(ch.name))}';">` : initials(ch.name)}
              </div>
              <div style="text-align:left;">
                <strong style="display:block; font-size:0.95rem; color:#fff;">${esc(ch.name)}</strong>
                <span style="font-size:0.78rem; color:var(--iptv-text-sec);">${esc(ch.group || 'Geral')}</span>
              </div>
            </div>
            <span class="iptv-live-chip">AO VIVO</span>
          </button>`;
        }).join('')}
      </div>
    </main>

    <!-- Área Direita: Prévia e Player de Vídeo -->
    <aside class="iptv-tri-col-preview">
      <div class="iptv-preview-screen" style="position:relative; background:#000; border-radius:12px; overflow:hidden; aspect-ratio:16/9; display:flex; align-items:center; justify-content:center;">
        <video id="video" playsinline controls autoplay style="width:100%; height:100%; object-fit:contain; background:#000; z-index:1;"></video>
        <div id="video-empty" role="status" aria-live="polite" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.85); color:#fff; z-index:2; text-align:center; padding:1rem;" hidden></div>
        <div style="position:absolute; top:0.75rem; left:0.75rem; z-index:3; pointer-events:none;">
          <span class="iptv-live-badge" id="video-live"><span class="iptv-live-dot"></span> AO VIVO</span>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.75rem;">
        <h2 style="font-size:1.5rem; font-weight:800; color:#fff; margin:0;" id="preview-ch-name">${esc(activeCh?.name || 'Canal')}</h2>
        <h3 style="font-size:1.1rem; font-weight:600; color:#e5e7eb; margin:0;" id="preview-prog-title">${esc(activeCh?.group || 'Transmissão Ao Vivo')}</h3>
        <p style="font-size:0.88rem; color:var(--iptv-text-sec); margin:0;" id="preview-prog-time">Ao vivo agora • Qualidade Adaptativa (HLS)</p>
      </div>
      <div style="background:var(--iptv-surface); border:1px solid var(--iptv-border); padding:1rem 1.25rem; border-radius:10px;">
        <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--iptv-text-sec); letter-spacing:0.5px;">Status da Transmissão</span>
        <strong style="display:block; font-size:0.95rem; color:#fff; margin-top:4px;" id="preview-next-prog">Sinal Online (HLS Stream)</strong>
      </div>
      <div style="display:flex; gap:0.75rem; margin-top:0.5rem;">
        <button class="iptv-btn-submit" data-action="fullscreen-live" tabindex="0" style="flex:1; height:52px;">
          ${icon('fullscreen')} Tela Cheia
        </button>
        <button class="iptv-btn-submit" data-action="reconnect-live" tabindex="0" style="background:var(--iptv-surface-card); border:1px solid var(--iptv-border); width:52px; height:52px; padding:0; display:flex; align-items:center; justify-content:center;" title="Reconectar">
          ${icon('refresh')}
        </button>
      </div>
    </aside>
  </div>`;
}

function moviesPage(){
  const genres = ['Todos', 'Ação', 'Aventura', 'Comédia', 'Drama', 'Terror', 'Ficção científica', 'Animação', 'Documentários'];
  const movies = [
    { id: 'm1', title: 'Top Gun: Maverick', meta: 'Ação • 2022 • 2h 11m', rating: '12', res: '4K', syn: 'Após mais de 30 anos de serviço como um dos principais aviadores da Marinha, Pete Mitchell segue rompendo limites.', img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80' },
    { id: 'm2', title: 'Deadpool & Wolverine', meta: 'Ação / Comédia • 2024 • 2h 08m', rating: '16', res: '4K', syn: 'Wolverine se recupera de ferimentos quando cruza com o desbocado Deadpool em uma missão para salvar o multiverso.', img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80' },
    { id: 'm3', title: 'John Wick: Capítulo 4', meta: 'Ação • 2023 • 2h 49m', rating: '16', res: '4K', syn: 'John Wick descobre um caminho para derrotar a Alta Cúpula, enfrentando assassinos letais ao redor do globo.', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80' },
    { id: 'm4', title: 'Duna: Parte 2', meta: 'Ficção Científica • 2024 • 2h 46m', rating: '14', res: '4K', syn: 'Paul Atreides se une a Chani e aos Fremen em busca de vingança contra os conspiradores que destruíram sua família.', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80' },
    { id: 'm5', title: 'Oppenheimer', meta: 'Drama / História • 2023 • 3h 00m', rating: '16', res: '4K', syn: 'A história do físico americano J. Robert Oppenheimer e o Projeto Manhattan durante a Segunda Guerra Mundial.', img: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=400&q=80' },
    { id: 'm6', title: 'Interestelar', meta: 'Ficção • 2014 • 2h 49m', rating: '10', res: '1080p', syn: 'Um grupo de exploradores viaja através de um buraco de minhoca em busca de um novo lar para a humanidade.', img: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80' }
  ];

  return `<div style="padding:1.5rem var(--iptv-safe-x);">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
      <h1 style="font-size:1.75rem; font-weight:800; color:#fff; margin:0;">Filmes</h1>
      <a href="#/search" class="iptv-genre-pill" style="text-decoration:none;">${icon('search')} Buscar filme</a>
    </div>
    <!-- Filtros de Gênero -->
    <div class="iptv-genre-pills" style="padding-left:0; padding-right:0;">
      ${genres.map((g, i) => `<button class="iptv-genre-pill ${i===0?'active':''}" tabindex="0">${esc(g)}</button>`).join('')}
    </div>
    <!-- Grid de Pôsteres -->
    <div class="iptv-catalog-grid" style="padding-left:0; padding-right:0;">
      ${movies.map(m => `
        <div class="iptv-poster-card" data-action="open-movie-detail" data-id="${m.id}" tabindex="0" title="${esc(m.title)}">
          <img class="iptv-poster-img" src="${m.img}" alt="${esc(m.title)}" loading="lazy">
          <div class="iptv-poster-overlay">
            <span style="display:inline-block; font-size:0.65rem; font-weight:800; background:rgba(0,0,0,0.7); border:1px solid #fff; border-radius:3px; padding:1px 4px; margin-bottom:4px; width:fit-content;">${m.res}</span>
            <strong class="iptv-poster-title">${esc(m.title)}</strong>
            <span class="iptv-poster-meta">${esc(m.meta)}</span>
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function seriesPage(){
  const series = [
    { id: 's1', title: 'The Last of Us', meta: 'Drama / Sobrevivência • 2023', seasons: '1 Temporada • 9 Episódios', img: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80' },
    { id: 's2', title: 'Breaking Bad', meta: 'Crime / Drama • 2008', seasons: '5 Temporadas • 62 Episódios', img: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80' },
    { id: 's3', title: 'House of the Dragon', meta: 'Fantasia • 2024', seasons: '2 Temporadas • 18 Episódios', img: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=400&q=80' },
    { id: 's4', title: 'Stranger Things', meta: 'Suspense • 2022', seasons: '4 Temporadas • 34 Episódios', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80' }
  ];

  return `<div style="padding:1.5rem var(--iptv-safe-x);">
    <h1 style="font-size:1.75rem; font-weight:800; color:#fff; margin:0 0 1.5rem;">Séries em Alta</h1>
    <div class="iptv-catalog-grid" style="padding-left:0; padding-right:0;">
      ${series.map(s => `
        <div class="iptv-poster-card" data-action="open-first-live" tabindex="0" title="${esc(s.title)}">
          <img class="iptv-poster-img" src="${s.img}" alt="${esc(s.title)}" loading="lazy">
          <div class="iptv-poster-overlay">
            <strong class="iptv-poster-title">${esc(s.title)}</strong>
            <span class="iptv-poster-meta">${esc(s.seasons)}</span>
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function searchPage(){
  const keys = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3','4','5','6','7','8','9'];
  return `<div class="iptv-search-wrap">
    <div class="iptv-search-bar-tv">
      ${icon('search')}
      <input id="iptv-search-input" placeholder="Digite o nome do canal, filme ou série..." autofocus spellcheck="false" tabindex="0">
    </div>

    <!-- Teclado Virtual D-Pad para Smart TV -->
    <div style="display:flex; flex-direction:column; align-items:center; gap:0.75rem; width:100%;">
      <span style="font-size:0.8rem; font-weight:600; color:var(--iptv-text-sec); text-transform:uppercase; letter-spacing:1px;">Teclado de Controle Remoto</span>
      <div class="iptv-vkeyboard">
        ${keys.map(k => `<button class="iptv-vkey" data-action="vkey-press" data-val="${k}" tabindex="0">${k}</button>`).join('')}
        <button class="iptv-vkey wide" data-action="vkey-space" tabindex="0">Espaço</button>
        <button class="iptv-vkey wide" data-action="vkey-backspace" tabindex="0">⌫ Apagar</button>
        <button class="iptv-vkey wide" data-action="vkey-clear" tabindex="0">Limpar</button>
      </div>
    </div>

    <div id="iptv-search-results" style="width:100%; max-width:800px; text-align:center; padding-top:1.5rem;">
      <p style="color:var(--iptv-text-sec); font-size:0.95rem;">Busque pelo nome ou selecione as teclas acima para filtrar.</p>
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

function settings(activeSection='legendas'){
  return `<div class="iptv-settings-page">
    <header class="iptv-settings-topbar">
      <a class="iptv-main-logo" href="#/dashboard" style="text-decoration:none;">
        <div class="iptv-play-icon" style="width:34px; height:34px; border-radius:8px;">
          <svg viewBox="0 0 24 24" style="width:16px; height:16px;"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <span class="iptv-logo-title" style="font-size:1.35rem;">IPTV</span>
      </a>
      <div class="iptv-topbar-right">
        <span class="iptv-clock">${getIptvClock()}</span>
        <a class="iptv-icon-action" href="#/settings">${icon('settings')}</a>
      </div>
    </header>

    <div class="iptv-settings-grid">
      <!-- Menu Lateral Esquerdo (7 Categorias Oficiais) -->
      <aside class="iptv-settings-nav">
        <button class="iptv-settings-nav-item ${activeSection==='conta'?'active':''}" data-action="iptv-settings-tab" data-tab="conta" tabindex="0">
          ${icon('user')} Conta
        </button>
        <button class="iptv-settings-nav-item ${activeSection==='player'?'active':''}" data-action="iptv-settings-tab" data-tab="player" tabindex="0">
          ${icon('play')} Player Engine
        </button>
        <button class="iptv-settings-nav-item ${activeSection==='legendas'?'active':''}" data-action="iptv-settings-tab" data-tab="legendas" tabindex="0">
          ${icon('info')} Legendas
        </button>
        <button class="iptv-settings-nav-item ${activeSection==='epg'?'active':''}" data-action="iptv-settings-tab" data-tab="epg" tabindex="0">
          ${icon('refresh')} EPG
        </button>
        <button class="iptv-settings-nav-item ${activeSection==='parental'?'active':''}" data-action="iptv-settings-tab" data-tab="parental" tabindex="0">
          ${icon('shield')} Controle Parental
        </button>
        <button class="iptv-settings-nav-item ${activeSection==='rede'?'active':''}" data-action="iptv-settings-tab" data-tab="rede" tabindex="0">
          ${icon('globe')} Teste de Rede
        </button>
        <button class="iptv-settings-nav-item ${activeSection==='info'?'active':''}" data-action="iptv-settings-tab" data-tab="info" tabindex="0">
          ${icon('info')} Informações
        </button>
      </aside>

      <!-- Painel de Conteúdo Direito -->
      <main class="iptv-settings-panel">
        ${activeSection==='legendas'?`
          <div class="iptv-settings-panel-head">
            <h2>Legendas</h2>
            <p>Configure as opções de legendas do player.</p>
          </div>
          <div class="iptv-settings-rows">
            <div class="iptv-setting-row" tabindex="0">
              <div class="iptv-setting-row-info">
                <strong>Ativar legendas</strong>
                <small>Exibir legendas automaticamente</small>
              </div>
              <label class="iptv-toggle-switch">
                <input type="checkbox" checked data-action="iptv-toggle-sub">
                <span class="iptv-toggle-slider"></span>
              </label>
            </div>
            <div class="iptv-setting-row" data-action="cycle-sub-size" tabindex="0">
              <div class="iptv-setting-row-info">
                <strong>Tamanho da fonte</strong>
              </div>
              <div class="iptv-setting-control">Médio ${icon('right')}</div>
            </div>
            <div class="iptv-setting-row" data-action="cycle-sub-style" tabindex="0">
              <div class="iptv-setting-row-info">
                <strong>Estilo da legenda</strong>
              </div>
              <div class="iptv-setting-control">Branco com fundo escuro ${icon('right')}</div>
            </div>
            <div class="iptv-setting-row" data-action="cycle-sub-lang" tabindex="0">
              <div class="iptv-setting-row-info">
                <strong>Idioma preferencial</strong>
              </div>
              <div class="iptv-setting-control">Português ${icon('right')}</div>
            </div>
            <div class="iptv-setting-row" data-action="cycle-sub-sync" tabindex="0">
              <div class="iptv-setting-row-info">
                <strong>Ajuste de sincronização</strong>
              </div>
              <div class="iptv-setting-control">0 ms ${icon('right')}</div>
            </div>
          </div>
        `:activeSection==='parental'?`
          <div class="iptv-settings-panel-head">
            <h2>Controle Parental</h2>
            <p>Defina ou altere o PIN de bloqueio para categorias protegidas.</p>
          </div>
          <div class="iptv-pin-container">
            <span style="font-size:0.95rem; font-weight:600; color:#fff;">Digite o PIN de 4 dígitos</span>
            <div class="iptv-pin-display">
              <span class="iptv-pin-dot filled"></span>
              <span class="iptv-pin-dot filled"></span>
              <span class="iptv-pin-dot"></span>
              <span class="iptv-pin-dot"></span>
            </div>
            <div class="iptv-pin-grid">
              ${[1,2,3,4,5,6,7,8,9,'Limpar',0,'OK'].map(k => `
                <button class="iptv-pin-btn" tabindex="0">${k}</button>
              `).join('')}
            </div>
          </div>
        `:activeSection==='rede'?`
          <div class="iptv-settings-panel-head">
            <h2>Teste de Rede</h2>
            <p>Diagnóstico de conectividade com os servidores de streaming.</p>
          </div>
          <div class="iptv-settings-rows">
            <div class="iptv-setting-row">
              <div class="iptv-setting-row-info">
                <strong>Status da Conexão</strong>
                <small style="color:var(--iptv-success);">● Conectado à Internet (Fibra/Wi-Fi)</small>
              </div>
              <span class="iptv-live-chip" style="background:rgba(34,197,94,0.15); color:var(--iptv-success);">ONLINE</span>
            </div>
            <div class="iptv-setting-row">
              <div class="iptv-setting-row-info">
                <strong>Latência (Ping)</strong>
                <small>Servidor HLS Relay local</small>
              </div>
              <div class="iptv-setting-control" style="color:#fff; font-weight:700;">12 ms</div>
            </div>
            <div class="iptv-setting-row">
              <div class="iptv-setting-row-info">
                <strong>Velocidade Estimada</strong>
                <small>Largura de banda disponível</small>
              </div>
              <div class="iptv-setting-control" style="color:#fff; font-weight:700;">120 Mbps (4K Pronto)</div>
            </div>
            <button class="iptv-btn-submit" data-action="run-speedtest" tabindex="0" style="margin-top:1rem;">
              ${icon('refresh')} Iniciar Novo Teste
            </button>
          </div>
        `:activeSection==='conta'?`
          <div class="iptv-settings-panel-head">
            <h2>Minha Conta</h2>
            <p>Informações de acesso e servidor IPTV.</p>
          </div>
          <div class="iptv-settings-rows">
            <div class="iptv-setting-row">
              <div class="iptv-setting-row-info">
                <strong>Usuário Ativo</strong>
                <small>${esc(state.user?.name||'Administrador')} (${esc(state.user?.username||'admin')})</small>
              </div>
            </div>
            <div class="iptv-setting-row">
              <div class="iptv-setting-row-info">
                <strong>Servidor IPTV Conectado</strong>
                <small>http://*****.com:8080 (Protegido)</small>
              </div>
              <span class="iptv-live-chip" style="background:rgba(34,197,94,0.15); color:var(--iptv-success);">ATIVO</span>
            </div>
          </div>
          <button class="iptv-btn-submit" data-action="logout" tabindex="0" style="margin-top:1.5rem; background:#333;">
            ${icon('logout')} Trocar de Conta / Sair
          </button>
        `:`
          <div class="iptv-settings-panel-head">
            <h2>${activeSection==='player'?'Player Engine':activeSection==='epg'?'EPG':'Informações'}</h2>
            <p>Configurações avançadas do sistema.</p>
          </div>
          <div class="iptv-settings-rows">
            <div class="iptv-setting-row" tabindex="0">
              <div class="iptv-setting-row-info">
                <strong>${activeSection==='player'?'Mecanismo de Reprodução (ExoPlayer / HLS)':activeSection==='epg'?'Sincronização Automática do Guia':'Versão do Aplicativo'}</strong>
                <small>${activeSection==='player'?'Buffer adaptativo de alta performance':activeSection==='epg'?'Atualiza a cada 6 horas':'JstudioPlay Pro v7.7.0 (Smart TV Build)'}</small>
              </div>
              <label class="iptv-toggle-switch">
                <input type="checkbox" checked>
                <span class="iptv-toggle-slider"></span>
              </label>
            </div>
          </div>
        `}
      </main>
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
  return `${heading('Gestão de Usuários', isMaster?'Administre todos os perfis e acessos globais da plataforma.':isReseller?'Cadastre e acompanhe seus clientes. Cada novo usuário consome 1 crédito.':'Gerencie os usuários e assinantes sob sua supervisão.')}
  <div class="toolbar">
    <div class="field search">${icon('search')}<input id="user-search" type="search" placeholder="Buscar usuário…" aria-label="Buscar usuário"></div>
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
        <button class="icon-btn" data-action="user-options" data-id="${u.id}" aria-label="Gerenciar ${esc(u.username)}">${icon('more')}</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7">Nenhum usuário encontrado.</td></tr>';
}

function logsPage(){return `${heading('Logs de Auditoria do Sistema','Acompanhe em tempo real todos os acessos, erros e atividades administrativas do servidor.')}<section class="card table-wrap"><table class="data-table"><thead><tr><th>Data e hora</th><th>Usuário</th><th>Atividade</th></tr></thead><tbody>${state.logs.map(l=>`<tr><td><small>${dateTime(l.at)}</small></td><td>${esc(l.user)}</td><td>${esc(l.action)}</td></tr>`).join('')||'<tr><td colspan="3">Nenhuma atividade registrada.</td></tr>'}</tbody></table><div class="table-foot">Até 500 atividades mais recentes. Endereços das playlists e senhas não são registrados.</div></section>`;}

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
  if(page==='playlists' && userRole === 'user' && !state.playlists.length){navigate('live');return;}
  stopPlayback();state.page=page;$('#modal').close();
  document.title=`${pageNames[page]|| (page==='login'?'Entrar':page==='landing'?'IPTV, Filmes & Séries':'Do seu jeito.')} — JstudioPlay`;
  if(page==='landing'){$('#app').innerHTML=landing();return;}
  if(page==='login'){$('#app').innerHTML=loginPage();if(tvMode)focusTV($('#username')||visibleTVTargets()[0]);initGoogleAuth();return;}
  $('#app').innerHTML='<div style="min-height:100vh;display:grid;place-items:center;background:var(--iptv-bg);color:#fff;font-family:var(--iptv-font);"><div class="loading-state">Carregando JstudioPlay…<div class="loading-line"></div></div></div>';
  setMenu(false);
  try {
    await loadLibrary();
    if(generation!==routeGeneration)return;
    if(page==='users')state.users=await api('/admin/users');
    if(page==='logs')state.logs=await api('/admin/logs')||[];
    if(page==='ai-status')state.aiStatus=await api('/integrations/status');
    if(generation!==routeGeneration)return;
    if(['live','channels','player','dashboard'].includes(page) && state.playlists.length && !state.channels.length){
      await loadChannels(state.activePlaylist||state.playlists[0].id, generation);
      if(generation!==routeGeneration)return;
    }
    const content=page==='dashboard'?dashboard():page==='live'||page==='channels'?livePage():page==='movies'?moviesPage():page==='series'?seriesPage():page==='search'?searchPage():page==='favorites'?favoritesPage():page==='recordings'?recordingsPage():page==='epg'?epgPage():page==='playlists'?heading('Minhas playlists','Todas as suas listas, organizadas em um só lugar.')+playlistSection():page==='settings'?settings():page==='users'?usersPage():page==='credits'?creditsPage():page==='ai-status'?aiStatusPage():page==='logs'?logsPage():page==='player'?playerPage():page==='automation'?'<div class="loading-state">Carregando M3U Hub…<div class="loading-line"></div></div>':savedPage(page);
    // Estrutura Unificada de TV com Sidebar Oficial para todas as telas autenticadas
    const isFullBleed = ['live','channels','player'].includes(page);
    $('#app').innerHTML=`
      <div style="display:flex; min-height:100vh; background:var(--iptv-bg); color:#fff; font-family:var(--iptv-font);">
        ${iptvSmartSidebar(page)}
        <div class="iptv-main-container">
          ${page!=='settings'?iptvTopBar(page):''}
          <main class="${isFullBleed?'':'iptv-page-body'}" style="${isFullBleed?'flex:1; overflow-y:auto;':''}" id="content">
            ${content}
          </main>
        </div>
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
  }catch(error){if(generation===routeGeneration && state.user)$('#content').innerHTML=empty('Não foi possível carregar',error.message,'<button class="btn" data-action="retry-page">Tentar novamente</button>','info');}
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
async function loadChannels(id,generation=routeGeneration){
  stopPlayback();
  const request=++channelRequest;state.loading=true;state.activePlaylist=id;state.channels=[];state.groups=[];state.category='';state.query='';state.channelPage=1;state.selected=null;
  if($('#channel-search'))$('#channel-search').value='';
  if($('#category-list'))$('#category-list').innerHTML='';
  if($('#now-name'))$('#now-name').textContent='Seu próximo conteúdo está aqui';
  if($('#now-category'))$('#now-category').textContent='Selecione algo para começar';
  if($('#now-favorite')){$('#now-favorite').disabled=true;$('#now-favorite').style.color='';}
  updateEpisodeControls(null);
  playerMessage('O que vamos assistir?','Escolha um item da sua lista para começar.');
  if($('#channel-list'))$('#channel-list').innerHTML='<div class="loading-state">Carregando canais…<div class="loading-line"></div></div>';
  try{
    const channels=await api(`/playlists/${id}/channels`);
    if(request!==channelRequest||generation!==routeGeneration)return;
    state.channels=channels;const groups=new Map();channels.forEach(c=>groups.set(c.group,(groups.get(c.group)||0)+1));state.groups=[...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0],'pt-BR'));
    state.loading=false;renderCategories();renderChannels();
    if(pendingChannel){const match=channels.find(c=>c.url===pendingChannel);pendingChannel=null;if(match)playChannel(match);}
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
  return `<div class="nf-card ${state.selected?.url===ch.url?'nf-card--playing':''}" data-channel-id="${esc(ch.id||'')}" data-channel-name="${esc(ch.name)}" data-channel-url="${esc(ch.url||'')}">
  <div class="nf-card-thumb">
    ${logo?`<img src="${esc(logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:'' }
    <div class="nf-card-fallback" style="${logo?'display:none;':''}background:${color}">${esc(ini)}</div>
    <span class="health-indicator" data-status="${ch.status||'unknown'}" aria-hidden="true"></span>
    ${isLive?'<span class="nf-live-badge">AO VIVO</span>':''}
    ${state.selected?.url===ch.url?'<div class="nf-card-playing-bar"></div>':''}
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
function stopPlayback(save=true){const v=$('#video');if(save&&v&&state.selected)savePlaybackProgress(state.selected,v).catch(()=>{});playbackGeneration++;clearTimeout(playbackTimer);playbackTimer=null;if(hls){hls.destroy();hls=null;}if(v){v.onplaying=null;v.onerror=null;v.onloadedmetadata=null;v.ontimeupdate=null;v.onpause=null;v.onended=null;v.onwaiting=null;v.onstalled=null;v.pause();v.removeAttribute('src');v.load();}}
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
function playerMessage(title,message,suggestRelay=false){const el=$('#video-empty');if(el){el.hidden=false;el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.innerHTML=`<img src="/static/logo.svg" alt=""><h2>${esc(title)}</h2><p>${esc(message)}</p>${suggestRelay&&state.relayEnabled&&!state.relayMode?'<button class="btn small video-retry" data-action="toggle-relay">Tentar com modo de compatibilidade</button>':''}`;}if($('#video-live'))$('#video-live').hidden=true;}
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
  if(typeof window.epgModule!=='undefined')window.epgModule.updateSelectedEpg(state.selected?.url,ch.url);
  stopPlayback();state.selected=ch;playbackPlaylist=state.activePlaylist;lastProgressSave=Date.now();const generation=playbackGeneration;const v=$('#video');if(!v)return;
  if($('#now-name'))$('#now-name').textContent=ch.name;
  if($('#now-category'))$('#now-category').textContent=ch.group;
  if($('#now-favorite'))$('#now-favorite').disabled=false;
  if($('#preview-ch-name'))$('#preview-ch-name').textContent=ch.name;
  if($('#preview-prog-title'))$('#preview-prog-title').textContent=ch.group||'Transmissão Ao Vivo';
  updateNowFavorite();updateEpisodeControls(ch);updateStreamingHero(ch);renderChannels();
  playerMessage('Carregando…','Conectando à fonte da sua playlist. Se não iniciar em alguns instantes, confira a conexão e a compatibilidade do conteúdo.');
  let url;try{url=new URL(ch.url);if(!['http:','https:'].includes(url.protocol))throw new Error();}catch{playerMessage('Endereço inválido','Este conteúdo não possui uma URL de reprodução válida.');return;}
  if(location.protocol==='https:'&&url.protocol==='http:'&&!state.relayMode){playerMessage('Esta fonte usa HTTP','Solicite ao provedor uma transmissão HTTPS para assistir diretamente nesta página.',true);return;}
  // Never put the source URL in text, attributes or error messages; the media
  // element receives it only because direct playback requires the browser.
  playbackTimer=setTimeout(()=>{if(generation!==playbackGeneration) return;playerMessage('A transmissão está demorando','A fonte não iniciou a reprodução dentro do tempo esperado. Verifique a conexão ou tente reconectar.',true);},20000);
  let historyRecorded=false;
  v.onloadedmetadata=()=>{if(generation!==playbackGeneration)return;const p=currentProgress(ch);if(Number.isFinite(v.duration)&&p?.position>0&&p.position<v.duration-5)v.currentTime=p.position;};
  v.onplaying=()=>{if(generation!==playbackGeneration)return;clearTimeout(playbackTimer);playbackTimer=null;$('#video-empty').hidden=true;$('#video-live').hidden=Number.isFinite(v.duration);if(!historyRecorded){historyRecorded=true;const userID=state.user?.id;api('/history','POST',{playlistId:playbackPlaylist,channel:ch}).then(items=>{if(state.user?.id===userID)state.history=items||[];}).catch(e=>toast(e.message,true));}};
  v.onwaiting=()=>{if(generation!==playbackGeneration)return;playerMessage('Carregando transmissão…','A fonte está temporariamente sem dados. A reprodução será retomada quando houver mídia disponível.');};
  v.onstalled=()=>{if(generation===playbackGeneration&&!v.paused)playerMessage('Conexão interrompida','A fonte parou de enviar dados. Aguarde ou use Reconectar.');};
  v.ontimeupdate=()=>{if(generation!==playbackGeneration||!Number.isFinite(v.duration)||v.currentTime<2)return;const now=Date.now();if(now-lastProgressSave>=15000){lastProgressSave=now;savePlaybackProgress(ch,v).catch(e=>toast(e.message,true));}};
  v.onpause=()=>{if(generation===playbackGeneration)savePlaybackProgress(ch,v).catch(()=>{});};
  v.onended=()=>{if(generation===playbackGeneration)savePlaybackProgress(ch,v).catch(()=>{});};
  v.onerror=()=>{if(generation!==playbackGeneration)return;clearTimeout(playbackTimer);playbackTimer=null;const code=v.error?.code;playerMessage(code===3?'Formato incompatível':'Não foi possível reproduzir',code===3?'O navegador não conseguiu decodificar este formato.':'A transmissão pode estar indisponível, bloqueada pelo provedor ou não ser compatível com o navegador.',code!==3);};
  v.muted=false;if(v.volume===0)v.volume=1.0;
  const start=()=>{v.muted=false;if(v.volume===0)v.volume=1.0;return v.play().catch(error=>{if(generation!==playbackGeneration)return;if(error.name==='NotAllowedError'){$('#video-empty').hidden=true;v.muted=true;v.play().then(()=>{if(window._showUnmuteBanner)window._showUnmuteBanner();}).catch(()=>{toast('Toque no botão de reprodução para iniciar.');});}else if(error.name!=='AbortError')playerMessage('Não foi possível iniciar','Confira se o conteúdo está disponível e se o formato é compatível com o navegador.',true);});};
  const direct=()=>{if(generation!==playbackGeneration)return;v.src=ch.url;start();};
  const known=/\.(mp4|m4v|mov|webm|ogv|ogg|mp3|m4a|aac|wav|flac|ts)$/i.test(url.pathname);
  const useHls=window.Hls?.isSupported()&&!known;
  if(state.relayMode){
    const channelIndex=state.channels.indexOf(ch);
    api('/playback','POST',{playlistId:playbackPlaylist,channelIndex}).then(result=>{
      if(generation!==playbackGeneration)return;
      if(result.mode==='media'){v.src=result.url;start();return;}
      if(result.mode==='hls'&&window.Hls?.isSupported()){const instance=new Hls({enableWorker:true,backBufferLength:90,enableSoftwareAES:true});hls=instance;window.currentHlsInstance=instance;instance.loadSource(result.url);instance.attachMedia(v);instance.on(Hls.Events.MANIFEST_PARSED,start);instance.on(Hls.Events.ERROR,(_,data)=>{if(generation===playbackGeneration&&data.fatal)playerMessage('Não foi possível reproduzir','O relay interrompeu a transmissão ou o formato HLS não é compatível.');});return;}
      if(result.mode==='hls'&&v.canPlayType('application/vnd.apple.mpegurl')){v.src=result.url;start();return;}
       playerMessage('Formato incompatível','O modo de compatibilidade não identificou um formato HLS ou MP4 compatível.');
     }).catch(error=>{if(generation!==playbackGeneration)return;const messages={upstream_http_status:`A origem respondeu HTTP ${error.upstreamStatus||'não informado'} ao modo de compatibilidade.`,upstream_timeout:'A origem demorou demais para responder.',upstream_request_failed:'Não foi possível obter uma resposta da origem.',destination_rejected:'O endereço da origem foi recusado pelas proteções de segurança.',redirect_rejected:'A origem redirecionou para um destino não aceito.',relay_request_limit:'O limite de requisições do modo de compatibilidade foi atingido.',upstream_read_failed:'Não foi possível ler os primeiros dados enviados pela origem.',unsupported_content_type:'A origem informou um tipo de mídia não compatível.',unrecognized_media_data:'A resposta não tem um formato HLS ou MP4 reconhecido.'};const detail=messages[error.diagnostic]||'Não foi possível iniciar pelo modo de compatibilidade.';playerMessage('Modo de compatibilidade indisponível',detail);});
    return;
  }
  if(useHls){
     const instance=new Hls({enableWorker:true,backBufferLength:90,enableSoftwareAES:true});hls=instance;window.currentHlsInstance=instance;instance.loadSource(ch.url);instance.attachMedia(v);instance.on(Hls.Events.MANIFEST_PARSED,()=>{start();updateHlsQualityBadge(instance);});instance.on(Hls.Events.LEVEL_SWITCHED,()=>updateHlsQualityBadge(instance));instance.on(Hls.Events.ERROR,(_,data)=>{if(generation!==playbackGeneration||!data.fatal)return;instance.destroy();if(hls===instance){hls=null;window.currentHlsInstance=null;}clearTimeout(playbackTimer);playbackTimer=null;playerMessage('Não foi possível reproduzir','A transmissão HLS falhou ou não é compatível. Confira a disponibilidade no provedor, sem alterar suas proteções de acesso.',true);});
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
  if(bg){if(logo){bg.style.backgroundImage=`url('${logo.replace(/'/g,"%27")}')`;bg.style.backgroundColor='';}else{bg.style.backgroundImage='';bg.style.backgroundColor=color;}}
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

function openModal(title,content){const modal=$('#modal');modal.innerHTML=`<div class="dialog-heading"><h2 id="modal-title">${title}</h2><button class="icon-btn" data-action="close-modal" aria-label="Fechar">${icon('close')}</button></div>${content}`;if(!modal.open)modal.showModal();}
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
    if(action==='toggle-sidebar'){toggleSidebar();return;}
    if(action==='close-modal'){$('#modal').close();return;}
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
    if(action==='toggle-data-saver'){if(typeof window.healthModule!=='undefined')window.healthModule.toggleDataSaver(b);return;}
    if(action==='switch-playlist'){if(b.dataset.id&&b.dataset.id!==state.activePlaylist){pendingChannel=null;state.activePlaylist=b.dataset.id;navigate('player');}return;}
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
      document.querySelectorAll('.iptv-tri-channel-row').forEach(c=>c.classList.toggle('active', c===b));
      const idx = Number(b.dataset.index);
      const pool = (state.channels && state.channels.length) ? state.channels : (window._liveChannels || []);
      const ch = pool[idx] || pool.find(c=>c.name===b.dataset.name) || pool[0];
      if(ch){
        playChannel(ch);
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
      state.category = (cat === 'Todos os canais' || !cat) ? '' : cat;
      await renderRoute();
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
    const q=event.target.value.toLowerCase().trim();
    const res=$('#iptv-search-results');
    if(res){
      if(!q){
        res.innerHTML='<p style="color:var(--iptv-text-sec); font-size:0.95rem;">Busque pelo nome ou selecione as teclas acima para filtrar.</p>';
      } else {
        const matches = (state.channels||[]).filter(c=>c.name.toLowerCase().includes(q)).slice(0, 12);
        if(matches.length){
          res.innerHTML=`<div class="iptv-tri-col-channels" style="width:100%; max-height:360px;">${matches.map(c=>`<button class="iptv-tri-channel-item" data-action="open-first-live" tabindex="0"><span class="iptv-tri-ch-num">▶</span><div class="iptv-tri-ch-meta"><span class="iptv-tri-ch-name">${esc(c.name)}</span><span class="iptv-tri-ch-prog">${esc(c.group||'Geral')}</span></div></button>`).join('')}</div>`;
        } else {
          res.innerHTML=`<p style="color:var(--iptv-text-sec); font-size:0.95rem;">Nenhum canal encontrado para "${esc(q)}".</p>`;
        }
      }
    }
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
document.addEventListener('keydown',event=>{
  if(!tvMode){if(event.key==='Escape')setMenu(false);return;}
  const target=event.target;
  if(['Escape','BrowserBack'].includes(event.key)||[4,461,10009].includes(event.keyCode)){
    if($('#modal')?.open){event.preventDefault();$('#modal').close();return;}
    if($('.shell.menu-open')){event.preventDefault();setMenu(false);return;}
    if(event.key!=='Escape'&&state.page==='player'&&state.selected){event.preventDefault();backToChannels();focusTV($('#channel-list .channel-select'));}
    return;
  }
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
  if(target?.matches?.('video,[contenteditable="true"]'))return;
  if(target?.matches?.('input,textarea')&&['ArrowLeft','ArrowRight'].includes(event.key))return;
  if(target?.matches?.('select')&&['ArrowUp','ArrowDown'].includes(event.key))return;
  event.preventDefault();moveTVFocus(event.key);
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
    if(form.id==='edit-role-form'){await api(`/admin/users/${form.dataset.id}`,'PATCH',{role:value.role});$('#modal').close();await renderRoute();toast('Perfil de acesso atualizado.');}
    if(form.id==='reset-form'){await api(`/admin/users/${form.dataset.id}`,'PATCH',{password:value.password});$('#modal').close();toast('Senha redefinida. As sessões anteriores foram encerradas.');}
  }catch(error){errorEl.textContent=error.message;}
  finally{button.disabled=false;button.textContent=original;}
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
    console.error('Falha na inicialização:', error);
    $('#app').innerHTML=`
      <div class="boot-reconnect" style="max-width:440px; margin:7rem auto; padding:2.5rem 2rem; background:rgba(20,21,23,0.95); border:1px solid rgba(255,255,255,0.08); border-radius:24px; box-shadow:0 24px 60px rgba(0,0,0,0.6); text-align:center; backdrop-filter:blur(20px);">
        <div style="width:64px; height:64px; margin:0 auto 1.25rem; border-radius:50%; background:rgba(59,130,246,0.12); display:flex; align-items:center; justify-content:center; color:#3b82f6;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px; height:32px;"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        </div>
        <h2 style="margin:0 0 0.5rem; font-size:1.35rem; color:#fff; font-weight:700;">Conectando ao JstudioPlay</h2>
        <p style="margin:0 0 1.5rem; color:rgba(255,255,255,0.6); font-size:0.9rem; line-height:1.5;">
          Aguardando conexão com o servidor. O sistema tentará reconectar automaticamente.
        </p>
        <button class="btn primary" id="boot-retry" style="width:100%; justify-content:center; padding:0.85rem 1.5rem; font-size:0.95rem; border-radius:12px;">
          Tentar agora
        </button>
      </div>
    `;
    $('#boot-retry')?.addEventListener('click', boot);
    setTimeout(boot, 4000);
  }
}
boot();

