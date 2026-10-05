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
};
function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.tv}"/></svg>`; }
function brand(route = 'home') { return `<a class="brand" href="#/${route}" aria-label="JstudioPlay — Início"><img src="/static/logo.svg" alt="JstudioPlay"><span>Jstudio<span>Play</span></span></a>`; }
const state = {user:null,setupRequired:false,setupAllowed:false,relayEnabled:false,relayMode:false,page:'',playlists:[],favorites:[],history:[],progress:[],users:[],logs:[],channels:[],activePlaylist:'',category:'',query:'',channelPage:1,selected:null,groups:[],loading:false};
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
async function api(path,method='GET',data,options={}) {
  let response;
  try {response=await fetch('/api'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},...(data!==undefined?{body:JSON.stringify(data)}:{}),...options});}
  catch {throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');}
  const body=await response.json().catch(()=>({error:'O servidor retornou uma resposta inválida.'}));
  if (!response.ok) {
    if(response.status===401 && state.user && path!=='/login') {state.user=null;clearPrivateState();$('#modal').close();location.hash='/login';}
    const error=new Error(body.error || 'Não foi possível concluir a operação.');error.status=response.status;error.diagnostic=body.diagnostic;error.upstreamStatus=body.upstreamStatus;throw error;
  }
  return body;
}
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
const maxPlaylistsPerAccount=2;
function addButton(){return state.playlists.length>=maxPlaylistsPerAccount?'<small>Limite de 2 playlists atingido</small>':`<button class="btn small" data-action="add-playlist">${icon('plus')}Adicionar playlist</button>`;}
function heading(title,subtitle,extra=''){return `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>${extra}</div>`;}
function initials(name){return String(name||'U').split(/\s+/).slice(0,2).map(v=>v[0]||'').join('').toUpperCase();}
function dateTime(value){return !value||String(value).startsWith('0001')?'Ainda não acessou':new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});}
function tileStyle(i){return `--tile:${colors[i%colors.length]}`;}
function channelLogo(ch,i=0,deferImage=false){let logo='';const name=ch?.name||ch?.tvgName||'TV';if(ch?.logo&&/^https?:\/\//i.test(ch.logo)){try{const url=new URL(ch.logo);if((url.protocol==='https:'||url.protocol==='http:')&&(location.protocol!=='https:'||url.protocol==='https:'))logo=url.href;}catch{}}return `<span class="channel-logo" style="${tileStyle(i)}">${logo?`<img ${deferImage?'data-logo-src':'src'}="${esc(logo)}" alt="" width="30" height="30" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.style.display='none';this.parentElement.textContent='${esc(initials(name))}';">`:esc(initials(name))}</span>`;}

function landingHeroArt(){
  const items=[['Natureza ao vivo','Relaxar','#3777ea'],['Viagem pelas montanhas','Documentários','#7446dc'],['Sons da natureza','Música','#11a989']];
  return `<div class="hero-art" role="img" aria-label="Ilustração do player JstudioPlay em um computador e um celular, com busca, lista e área de reprodução"><div class="art-glow"></div><div class="monitor"><div class="preview-app"><div class="preview-rail"><img src="/static/logo.svg" alt=""><span>${icon('home')}</span><span class="active">${icon('tv')}</span><span>${icon('heart')}</span><span>${icon('settings')}</span></div><div class="preview-main"><div class="preview-top"><span>Biblioteca ${icon('right')} <b>JstudioPlay</b></span><span class="preview-avatar">J</span></div><div class="preview-heading"><strong>Assistir</strong><span>Minha playlist ${icon('right')}</span></div><div class="preview-columns"><div class="preview-browser"><b>O que você quer assistir?</b><div class="preview-search">${icon('search')}<span>Busque pelo nome do conteúdo</span></div><small>Categorias</small><div class="preview-categories"><span class="active">Todos</span><span>Natureza</span><span>Música</span></div><div class="preview-list-title">Conteúdos</div>${items.map(([name,group,color],i)=>`<div class="preview-item ${i===0?'active':''}"><span class="preview-thumb" style="--preview-color:${color}">${icon(i===2?'music':'play')}</span><span><b>${name}</b><small>${group}</small></span>${icon('heart')}</div>`).join('')}</div><div class="preview-watch"><div class="preview-video"><img src="/static/landscape.svg" alt=""><span class="preview-play">${icon('play')}</span></div><div class="preview-now"><span class="preview-now-icon">${icon('play')}</span><span><b>Natureza ao vivo</b><small>Relaxar</small></span>${icon('heart')}</div><div class="preview-compat">${icon('info')} Modo de compatibilidade</div></div></div></div></div><div class="monitor-stand"></div></div><div class="phone"><div class="phone-screen"><div class="preview-phone-top"><img src="/static/logo.svg" alt=""><span>JstudioPlay</span></div><div class="preview-phone-video"><img src="/static/landscape.svg" alt=""><span>${icon('play')}</span></div><b>Natureza ao vivo</b><small>Minha playlist</small><div class="preview-phone-search">${icon('search')} Buscar conteúdo</div><div class="preview-phone-item"><span class="preview-thumb">${icon('play')}</span><span>Viagem pelas montanhas</span></div></div></div></div>`;
}
function landing(){
  return `<div class="landing"><header class="public-nav">${brand('home')}<nav aria-label="Navegação principal"><a href="#como-funciona">Como funciona</a><a href="#recursos">Recursos</a><a href="#dispositivos">Dispositivos</a><a href="#faq">Dúvidas</a></nav><div class="row"><a class="btn" href="#/${state.user?'dashboard':'login'}">${state.user?'Minha conta':'Entrar'}</a>${themeButton()}</div></header>
  <main><section class="hero"><div class="hero-copy"><span class="tag">Streaming & IPTV de Nova Geração</span><h1>Seu streaming,<br>organizado.<br><em>Com JstudioPlay.</em></h1><p>Adicione suas próprias playlists M3U, navegue por milhares de canais com EPG em tempo real e assista com áudio e vídeo de alta performance.</p><div class="under-cta">${icon('shield')}<span><strong>Suas fontes, sua liberdade</strong>O JstudioPlay não vende nem fornece playlists, canais ou assinaturas.</span></div><a class="btn" href="#/${state.user?'dashboard':'login'}">${state.user?'Abrir minha biblioteca':'Entrar na minha conta'} ${icon('arrow')}</a></div>
  ${landingHeroArt()}</section>
  <section class="landing-notice" aria-label="Origem do conteúdo"><div class="notice-icon">${icon('shield')}</div><div><strong>O JstudioPlay é uma ferramenta. Não vendemos playlists.</strong><p>Não temos catálogo próprio, canais ou assinaturas. Você adiciona uma playlist sua ou de uma fonte que tenha autorização para usar.</p></div></section>
  <section id="como-funciona" class="landing-section how-section"><div class="section-intro"><span class="eyebrow">Simples de começar</span><h2 class="section-title">Da sua lista à sua tela.</h2><p>Organize sua biblioteca sem depender de um catálogo da plataforma.</p></div><div class="how-grid"><article class="card how-card"><span class="step-number">01</span>${icon('user')}<h3>Acesse sua conta</h3><p>Entre com o acesso criado pelo administrador no JstudioPlay.</p></article><article class="card how-card"><span class="step-number">02</span>${icon('playlist')}<h3>Adicione sua playlist</h3><p>Informe uma URL M3U ou importe um arquivo do seu dispositivo com sincronização instantânea.</p></article><article class="card how-card"><span class="step-number">03</span>${icon('play')}<h3>Encontre e assista</h3><p>Busque pelo nome, explore categorias, EPG e reproduza em alta fidelidade.</p></article></div></section>
  <section id="recursos" class="landing-section resources-section"><div class="section-intro"><span class="eyebrow">Sua biblioteca</span><h2 class="section-title">Tudo organizado para encontrar de novo.</h2><p>Recursos que já fazem parte do JstudioPlay.</p></div><div class="resource-grid">${[['search','Busca Inteligente','Encontre canais e programas instantaneamente.'],['grid','Categorias & EPG','Navegue pela grade horária e catálogo completo.'],['heart','Favoritos e Histórico','Salve o que gosta e retome conteúdos recentes.'],['play','Player de Alta Performance','Áudio cristalino, boost de volume e failover inteligente.']].map(([k,title,description])=>`<article class="card resource-card"><span class="feature-icon">${icon(k)}</span><h3>${title}</h3><p>${description}</p></article>`).join('')}</div></section>
  <section id="dispositivos" class="landing-section device-section"><div><span class="eyebrow">Em diferentes telas</span><h2 class="section-title">O JstudioPlay acompanha você.</h2><p>Use pelo navegador no computador, celular, tablet ou Smart TV com suporte a controle remoto.</p><p class="device-note">A reprodução depende dos formatos, codecs e recursos aceitos pelo navegador e pela fonte da playlist.</p></div><div class="device-icons">${[['monitor','Computador'],['phone','Celular'],['tablet','Tablet'],['tv','TV']].map(([k,n])=>`<span>${icon(k)}${n}</span>`).join('')}</div></section>
  <section id="faq" class="landing-section faq"><div><span class="eyebrow">Tudo às claras</span><h2 class="section-title">Perguntas frequentes</h2><p>O essencial para usar o JstudioPlay com suas próprias fontes.</p></div><div class="faq-items"><details><summary>O JstudioPlay vende playlists ou fornece canais?</summary><p>Não. Somos uma ferramenta profissional para organizar e reproduzir playlists. Não oferecemos catálogo, assinaturas ou canais.</p></details><details><summary>Como adiciono minha playlist?</summary><p>Entre na conta criada pelo administrador, escolha “Adicionar playlist” e informe uma URL M3U ou importe um arquivo M3U do seu dispositivo.</p></details><details><summary>Minhas listas ficam salvas?</summary><p>Sim. Playlists, favoritos e histórico ficam associados à sua conta e podem ser acessados em qualquer tela.</p></details><details><summary>Funciona em Smart TV?</summary><p>Sim! A interface foi adaptada para navegadores de TV, controle remoto e possui modo de teclado numérico (0-9).</p></details></div></section></main><footer class="public-footer"><div class="footer-main"><div class="footer-brand">${brand('home')}<p>JstudioPlay: Sua central definitiva de streaming IPTV e player inteligente.</p></div><nav class="footer-links" aria-label="Explorar o site"><strong>Explore</strong><a href="#como-funciona">Como funciona</a><a href="#recursos">Recursos</a><a href="#dispositivos">Dispositivos</a><a href="#faq">Dúvidas frequentes</a></nav><div class="footer-access"><strong>Sua biblioteca começa aqui</strong><p>Entre com sua conta JstudioPlay para gerenciar e assistir.</p><a class="btn secondary" href="#/login">Entrar na minha conta ${icon('arrow')}</a></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} JstudioPlay</span><span>JstudioPlay é uma plataforma de reprodução e gerenciamento de mídia.</span></div></footer></div>`;
}
function loginPage(){
  const setup=state.setupRequired;
  const allowed=!setup||state.setupAllowed;
  return `<div class="auth-page"><header class="auth-top"><a class="back-link" href="#/home">${icon('left')}Voltar ao início</a>${themeButton()}</header><main class="auth-wrap"><section class="auth-card">${brand('home')}<h1>${setup?'Configurar JstudioPlay':'Bem-vindo de volta'}</h1><p>${setup?'Configure o primeiro administrador da plataforma.':'Acesse sua conta para continuar'}</p>${allowed?`<form id="login-form" class="stack"><div><label for="username">Usuário</label><div class="field">${icon('user')}<input id="username" name="username" placeholder="Seu usuário" autocomplete="username" required minlength="3" maxlength="40" pattern="[a-zA-Z0-9_.\\x2d]+" autofocus></div></div><div><label for="password">Senha</label><div class="field password">${icon('lock')}<input id="password" name="password" placeholder="${setup?'Crie uma senha (mín. 10 caracteres)':'Sua senha'}" type="password" autocomplete="${setup?'new-password':'current-password'}" required ${setup?'minlength="10"':''} maxlength="256"><button class="icon-btn" type="button" data-action="password" data-target="password" aria-label="Mostrar senha">${icon('eye')}</button></div></div>${!setup?'<label class="check"><input name="remember" type="checkbox">Lembrar de mim</label>':'<div class="info">'+icon('shield')+'Você poderá criar as contas dos clientes no painel de usuários.</div>'}<div class="form-error" role="alert"></div><button class="btn" type="submit">${setup?'Criar administrador':'Entrar no JstudioPlay'}</button></form>`:`<div class="info">${icon('info')}Configure ADMIN_USERNAME e ADMIN_PASSWORD no servidor para criar o administrador.</div>`}${!setup?'<button class="forgot" data-action="forgot">Esqueceu sua senha?</button>':''}</section></main><footer class="auth-footer">JstudioPlay · TV, Cinema & Streaming.</footer></div>`;
}
const pageNames={dashboard:'Início',playlists:'Minhas Playlists',player:'Player',automation:'M3U Hub & Automação',favorites:'Favoritos',history:'Histórico',settings:'Configurações',users:'Usuários',logs:'Logs'};
function navLink(page,symbol,label,count){return `<a class="nav-link ${state.page===page?'active':''}" href="#/${page}" title="${esc(label)}" aria-label="${esc(label)}" ${state.page===page?'aria-current="page"':''}>${icon(symbol)}<span class="nav-label">${label}</span>${count!==undefined?`<span class="nav-count">${count}</span>`:''}</a>`;}
function shell(content){
  const collapsed=sidebarCollapsed();
  return `<div class="shell ${collapsed?'sidebar-collapsed':''}"><button class="mobile-overlay" data-action="menu" aria-label="Fechar menu"></button><aside class="sidebar" id="account-sidebar">${brand('dashboard')}<button class="sidebar-toggle" data-action="toggle-sidebar" aria-controls="account-sidebar" aria-expanded="${!collapsed}" aria-label="${collapsed?'Expandir menu':'Recolher menu'}" title="${collapsed?'Expandir menu':'Recolher menu'}">${icon('right')}</button><div class="nav-caption">Biblioteca</div><nav class="nav-list" aria-label="Menu da conta">${navLink('dashboard','home','Início')}${navLink('playlists','playlist','Minhas Playlists',state.playlists.length)}${navLink('player','tv','Player')}${navLink('automation','globe','M3U Hub & Automação')}${navLink('favorites','heart','Favoritos')}${navLink('history','clock','Histórico')}${navLink('settings','settings','Configurações')}${['admin','manager'].includes(state.user.role)?`<div class="divider"></div><div class="nav-caption">${state.user.role==='manager'?'Gestão':'Administração'}</div>${navLink('users','users','Usuários')}${state.user.role==='admin'?navLink('logs','playlist','Logs'):''}`:''}</nav><div class="sidebar-bottom"><button class="nav-link" data-action="logout" title="Sair" aria-label="Sair">${icon('logout')}<span class="nav-label">Sair</span></button><div class="plan-note"><span>JstudioPlay Pro</span>Seu conteúdo sempre por perto.</div></div></aside><div class="main"><header class="topbar"><button class="icon-btn mobile-menu" data-action="menu" aria-label="Abrir menu" aria-expanded="false">${icon('menu')}</button><div class="breadcrumb"><span>Biblioteca</span>${icon('right')}<strong>${pageNames[state.page]||'Início'}</strong></div><div class="user-menu">${themeButton()}<span class="top-separator"></span><a class="avatar" href="#/settings" aria-label="Configurações da conta">${esc(initials(state.user.name))}</a><div class="user-name">${esc(state.user.name)}<small>${state.user.role==='admin'?'Administrador':state.user.role==='manager'?'Gestor':'Minha conta'}</small></div></div></header><main class="content ${state.page==='player'?'player-content':''}" id="content">${content}</main></div></div>`;
}
function playlistRows(){return state.playlists.map((p,i)=>`<article class="card playlist-row"><div class="playlist-icon" style="${tileStyle(i)}">${icon('playlist')}</div><div class="playlist-info"><h3>${esc(p.name)}</h3><p>${number(p.total)} canais · ${number(p.categories)} categorias</p><p>Última atualização: ${p.updated?dateTime(p.updated):'data indisponível'}</p></div><span class="badge">Ativa</span>${p.sourceKind!=='file'?`<button class="icon-btn subtle-icon" data-action="refresh-playlist" data-id="${p.id}" aria-label="Atualizar ${esc(p.name)}" title="Atualizar playlist">${icon('refresh')}</button>`:''}<button class="icon-btn play-circle" data-action="open-playlist" data-id="${p.id}" aria-label="Abrir ${esc(p.name)}">${icon('play')}</button><button class="icon-btn subtle-icon" data-action="playlist-options" data-id="${p.id}" aria-label="Opções de ${esc(p.name)}">${icon('more')}</button></article>`).join('');}
function playlistSection(){return `<section><div class="section-heading"><h2>Minhas playlists</h2>${addButton()}</div><div class="playlist-grid">${state.playlists.length?playlistRows():`<div class="card">${empty('Sua próxima experiência começa aqui','Adicione uma playlist para organizar seus canais e começar a assistir.',addButton())}</div>`}</div></section>`;}
function dashboard(){return `${heading(`Olá, ${esc(state.user.name.split(' ')[0])} <span aria-hidden="true">👋</span>`,'Aqui está um resumo da sua conta JstudioPlay.',`<span class="date">${new Date().toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'})}</span>`)}<div class="stats">${[['playlist','Playlists',state.playlists.length],['grid','Categorias nas listas',state.playlists.reduce((n,p)=>n+p.categories,0)],['heart','Favoritos',state.favorites.length]].map(([i,l,n])=>`<article class="card stat"><span class="stat-icon">${icon(i)}</span><div><p>${l}</p><strong>${number(n)}</strong></div></article>`).join('')}</div><section class="continue-section"><div class="section-heading"><h2>Continuar assistindo</h2><small>Retome seus vídeos gravados</small></div>${state.progress.length?`<div class="recent-grid">${state.progress.slice(0,3).map((p,i)=>`<button class="card recent-card" data-action="open-progress" data-index="${i}">${channelLogo(p.channel,i)}<span><b>${esc(p.channel.name)}</b><small>${number(Math.round(p.percent||0))}% assistido</small></span></button>`).join('')}</div>`:`<div class="card continue-empty"><p>Você ainda não tem vídeos gravados em andamento.</p><a class="btn small" href="#/player">Abrir player ${icon('right')}</a></div>`}</section>${playlistSection()}${state.history.length?`<section class="recent-section"><div class="section-heading"><h2>Vistos recentemente</h2><a href="#/history"><small>Ver histórico ${icon('right')}</small></a></div><div class="recent-grid">${state.history.slice(0,3).map((h,i)=>`<button class="card recent-card" data-action="open-saved" data-kind="history" data-index="${i}">${channelLogo(h.channel,i)}<span><b>${esc(h.channel.name)}</b><small>${esc(h.channel.group)}</small></span></button>`).join('')}</div></section>`:`<aside class="card welcome-banner"><div><h3>Tudo o que você gosta, no mesmo lugar.</h3><p>Salve seus canais favoritos e encontre suas últimas reproduções no histórico. Sua conta acompanha você em qualquer dispositivo.</p></div>${icon('monitor')}</aside>`}<div class="dashboard-foot">${icon('shield')}Suas playlists e preferências ficam salvas na sua conta JstudioPlay.</div>`;}
function savedPage(kind){const items=state[kind],isFav=kind==='favorites';return `${heading(isFav?'Seus favoritos':'Seu histórico',isFav?'Os canais que você gosta, a um clique de distância.':'Retome os canais que você abriu recentemente.',!isFav&&items.length?'<button class="btn ghost small" data-action="clear-history">Limpar histórico</button>':'')}<div class="playlist-grid history-list">${items.length?items.map((h,i)=>`<article class="card playlist-row">${channelLogo(h.channel,i)}<div class="playlist-info"><h3>${esc(h.channel.name)}</h3><p>${esc(state.playlists.find(p=>p.id===h.playlistId)?.name||'Playlist')} · ${esc(h.channel.group)}${h.unavailable?' · Indisponível na versão atual':''}</p></div><span class="timestamp">${dateTime(h.at)}</span><button class="icon-btn play-circle" data-action="open-saved" data-kind="${kind}" data-index="${i}" aria-label="${h.unavailable?'Indisponível':'Reproduzir'} ${esc(h.channel.name)}" ${h.unavailable?'disabled':''}>${icon('play')}</button>${isFav?`<button class="favorite-button is-favorite" data-action="saved-favorite" data-index="${i}" aria-label="Remover favorito ${esc(h.channel.name)}">${icon('heart')}</button>`:''}</article>`).join(''):`<div class="card">${empty(isFav?'Seus favoritos moram aqui':'Ainda não há reproduções',isFav?'Toque no coração ao lado de um canal no player para salvá-lo aqui.':'Abra uma playlist e escolha um canal para começar.',`<a class="btn small" href="#/player">${icon('play')}Abrir player</a>`,isFav?'heart':'clock')}</div>`}</div>`;}
function settings(){return `${heading('Configurações','Deixe sua conta JstudioPlay do seu jeito.')}<section class="card settings-card"><h2>Minha conta</h2><p>Atualize seu nome, aparência ou senha de acesso.</p><form id="settings-form" class="form-grid"><div><label for="account-name">Nome de exibição</label><input id="account-name" name="name" value="${esc(state.user.name)}" maxlength="80" required autocomplete="name"></div><div><label for="account-username">Usuário</label><input id="account-username" value="${esc(state.user.username)}" disabled></div><div class="full"><label for="account-theme">Aparência</label><select id="account-theme" name="theme"><option value="dark" ${theme==='dark'?'selected':''}>Modo escuro</option><option value="light" ${theme==='light'?'selected':''}>Modo claro</option></select></div><div><label for="current-password">Senha atual</label><input id="current-password" name="currentPassword" type="password" autocomplete="current-password" placeholder="Para alterar a senha" maxlength="256"></div><div><label for="new-password">Nova senha</label><input id="new-password" name="password" type="password" autocomplete="new-password" placeholder="Mínimo de 10 caracteres" minlength="10" maxlength="256"></div><p class="help-text full">Deixe as senhas em branco para manter a senha atual.</p><div class="form-error full" role="alert"></div><button class="btn full" type="submit">Salvar alterações</button></form></section>`;}
function usersPage(){return `${heading('Usuários',state.user.role==='manager'?'Gerencie até 10 usuários criados por você.':'Gerencie os acessos da plataforma JstudioPlay.')}<div class="toolbar"><div class="field search">${icon('search')}<input id="user-search" type="search" placeholder="Buscar usuário…" aria-label="Buscar usuário"></div><button class="btn small" data-action="new-user" ${state.user.role==='manager'&&state.users.length>=10?'disabled title="Limite de 10 usuários atingido"':''}>${icon('plus')}Novo usuário</button></div><section class="card table-wrap"><table class="data-table"><thead><tr><th>Usuário</th><th>Status</th><th>Playlists</th><th>Último acesso</th><th>Ações</th></tr></thead><tbody id="user-rows">${userRows('')}</tbody></table><div class="table-foot">${state.user.role==='manager'?`${number(state.users.length)} de 10 usuários criados`:`${number(state.users.length)} usuários cadastrados`}</div></section>`;}
function userRows(query){return state.users.filter(({user:u})=>(u.name+' '+u.username).toLowerCase().includes(query.toLowerCase())).map(({user:u,playlists})=>`<tr><td><div class="row"><span class="avatar">${esc(initials(u.name))}</span><span>${esc(u.username)}${u.role==='admin'?'<br><small>Administrador</small>':u.role==='manager'?'<br><small>Gestor</small>':''}</span></div></td><td><span class="badge ${u.blocked?'blocked':''}">${u.blocked?'Bloqueado':'Ativo'}</span></td><td>${playlists}</td><td><small>${dateTime(u.lastLogin)}</small></td><td>${u.role==='admin'?'<a href="#/settings" class="icon-btn" aria-label="Configurações do administrador">'+icon('settings')+'</a>':`<button class="icon-btn" data-action="user-options" data-id="${u.id}" aria-label="Gerenciar ${esc(u.username)}">${icon('more')}</button>`}</td></tr>`).join('')||'<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>';}
function logsPage(){return `${heading('Logs da plataforma','Acompanhe os últimos acessos e alterações administrativas no JstudioPlay.')}<section class="card table-wrap"><table class="data-table"><thead><tr><th>Data e hora</th><th>Usuário</th><th>Atividade</th></tr></thead><tbody>${state.logs.map(l=>`<tr><td><small>${dateTime(l.at)}</small></td><td>${esc(l.user)}</td><td>${esc(l.action)}</td></tr>`).join('')||'<tr><td colspan="3">Nenhuma atividade registrada.</td></tr>'}</tbody></table><div class="table-foot">Até 500 atividades mais recentes. Endereços das playlists e senhas não são registrados.</div></section>`;}

async function renderRoute(){
  const raw=location.hash.slice(1)||'/home';
  if(!raw.startsWith('/')){if(state.page==='home'){document.getElementById(raw)?.scrollIntoView({behavior:'smooth'});return;}navigate('home');return;}
  const generation=++routeGeneration;
  let page=raw.slice(1).split('?')[0];
  if(!['home','login',...Object.keys(pageNames)].includes(page))page='home';
  if(!state.user && page!=='home' && page!=='login'){navigate('login');return;}
  if(state.user && page==='login'){navigate('dashboard');return;}
  if((page==='users'&&!['admin','manager'].includes(state.user?.role))||(page==='logs'&&state.user?.role!=='admin')){navigate('dashboard');return;}
  stopPlayback();state.page=page;$('#modal').close();
  document.title=`${pageNames[page]|| (page==='login'?'Entrar':'Do seu jeito.')} — JstudioPlay`;
  if(page==='home'){$('#app').innerHTML=landing();window.scrollTo(0,0);if(tvMode)focusTV(visibleTVTargets()[0]);return;}
  if(page==='login'){$('#app').innerHTML=loginPage();if(tvMode)focusTV($('#username')||visibleTVTargets()[0]);return;}
  $('#app').innerHTML=shell('<div class="loading-state">Carregando JstudioPlay…<div class="loading-line"></div></div>');
  setMenu(false);
  try {
    await loadLibrary();
    if(generation!==routeGeneration)return;
    if(page==='users')state.users=await api('/admin/users');
    if(page==='logs')state.logs=await api('/admin/logs')||[];
    if(generation!==routeGeneration)return;
    const content=page==='dashboard'?dashboard():page==='playlists'?heading('Minhas playlists','Todas as suas listas, organizadas em um só lugar.')+playlistSection():page==='settings'?settings():page==='users'?usersPage():page==='logs'?logsPage():page==='player'?playerPage():page==='automation'?'<div class="loading-state">Carregando M3U Hub…<div class="loading-line"></div></div>':savedPage(page);
    $('#app').innerHTML=shell(content);
    setMenu(false);
    if(page==='automation'&&window.renderAutomationPage)window.renderAutomationPage();
    if(page==='player'&&state.playlists.length)await loadChannels(state.activePlaylist||state.playlists[0].id,generation);
    if(tvMode&&generation===routeGeneration)focusTV(page==='player'?$('#channel-list .channel-select')||$('#category-list .category-button'):$('.nav-link.active')||visibleTVTargets()[0]);
  }catch(error){if(generation===routeGeneration && state.user)$('#content').innerHTML=empty('Não foi possível carregar',error.message,'<button class="btn" data-action="retry-page">Tentar novamente</button>','info');}
}
function playerPage(){
  if(!state.playlists.some(p=>p.id===state.activePlaylist))state.activePlaylist=state.playlists[0]?.id||'';
  if(!state.playlists.length)return heading('Assistir','Escolha o que assistir, do seu jeito.')+`<div class="card">${empty('Primeiro, adicione uma playlist','Os itens e categorias da sua lista aparecerão aqui após a importação.',addButton(),'tv')}</div>`;
  return `<div class="player-toolbar"><h1>Assistir</h1><div class="player-tools">${state.relayEnabled?`<button class="compatibility-quick ${state.relayMode?'active':''}" id="relay-quick" data-action="toggle-relay" aria-pressed="${state.relayMode}" aria-label="${state.relayMode?'Desativar':'Ativar'} modo de compatibilidade"><span class="compatibility-quick-copy"><strong>Modo de compatibilidade</strong><small id="relay-quick-status">${state.relayMode?'Ativado':'Desativado'} · ${state.relayMode?'modo alternativo em uso':'tente se o vídeo não abrir'}</small></span><span class="compatibility-quick-action" id="relay-quick-action">${state.relayMode?'Desativar':'Ativar'}</span></button>`:''}<select id="player-playlist" aria-label="Playlist atual">${state.playlists.map(p=>`<option value="${p.id}" ${p.id===state.activePlaylist?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div></div>
  <div class="player-layout player-layout-v2"><div class="browser-slot"><section class="card channels-panel player-browser">
    <div class="channel-search"><label for="channel-search">O que você quer assistir?</label><div class="field">${icon('search')}<input id="channel-search" type="search" placeholder="Busque pelo nome do conteúdo" aria-label="Buscar conteúdo na playlist"></div></div>
    <div class="category-filter"><label for="category-select">Categorias <span id="category-count" class="muted">0</span></label><select id="category-select" aria-label="Selecionar categoria"><option value="-1">Todas as categorias</option></select></div>
    <div class="category-navigation"><button class="icon-btn category-arrow" data-action="category-previous" aria-label="Ver categorias anteriores">${icon('left')}</button><div class="category-list" id="category-list" aria-label="Categorias"></div><button class="icon-btn category-arrow" data-action="category-next" aria-label="Ver próximas categorias">${icon('right')}</button></div>
    <div class="panel-title"><h2>Conteúdos <span id="channel-count" class="muted"></span></h2>${icon('play')}</div><div class="channel-list" id="channel-list"><div class="loading-state">Carregando…</div></div><div class="pagination"><button class="icon-btn" data-action="previous" aria-label="Página anterior">${icon('left')}</button><span id="page-info">1 / 1</span><button class="icon-btn" data-action="next" aria-label="Próxima página">${icon('right')}</button></div>
  </section></div><section class="watch-panel"><div class="video-wrap"><video id="video" controls playsinline preload="none" aria-label="Player de vídeo"></video><div id="video-empty" class="video-empty" role="status" aria-live="polite"><img src="/static/logo.svg" alt=""><h2>O que vamos assistir?</h2><p>Escolha um item da sua lista para começar.</p></div><span class="video-live" id="video-live" hidden>AO VIVO</span></div>
    <div class="card audio-quick-bar" id="audio-quick-bar">
      <div class="audio-label"><button class="icon-btn subtle-icon" id="btn-quick-mute" data-action="quick-mute" title="Mutar / Desmutar">${icon('volume')}</button><span>Áudio</span></div>
      <div class="volume-slider-wrap"><input type="range" id="quick-volume-slider" min="0" max="100" value="100" aria-label="Volume"><span class="vol-val" id="quick-volume-val">100%</span></div>
      <div class="volume-boost-group"><button class="vol-boost-btn active" data-action="vol-boost" data-boost="1">100%</button><button class="vol-boost-btn" data-action="vol-boost" data-boost="1.5">150% 🚀</button><button class="vol-boost-btn" data-action="vol-boost" data-boost="2">200% 🔥</button></div>
      <select id="quick-audio-track" class="audio-track-select" aria-label="Faixa de áudio" hidden><option value="-1">Faixa Padrão</option></select>
    </div>
    <div class="card now-playing"><span class="tile">${icon('play')}</span><div class="grow"><h2 id="now-name">Seu próximo conteúdo está aqui</h2><p id="now-category">Selecione algo para começar</p></div><button class="icon-btn" data-action="now-favorite" id="now-favorite" aria-label="Favoritar conteúdo atual" disabled>${icon('heart')}</button></div>
    ${state.relayEnabled?`<div class="relay-card" id="relay-card"><div class="relay-copy"><span class="eyebrow">Recurso em teste</span><h2>Modo de compatibilidade <span id="relay-status">${state.relayMode?'Ativado':'Desativado'}</span></h2><p>Algum conteúdo não abriu? Ative este modo para tentar outra forma de reprodução. Ele não garante que toda fonte funcione.</p></div><button class="btn secondary" data-action="toggle-relay" aria-pressed="${state.relayMode}">${state.relayMode?'Desativar modo de compatibilidade':'Ativar modo de compatibilidade'}</button></div>`:''}
    <div class="playback-actions"><button class="btn ghost" data-action="reconnect">${icon('refresh')}Reconectar</button><button class="btn ghost episode-nav" data-action="episode-previous" disabled>${icon('episodePrevious')}Episódio anterior</button><button class="btn episode-nav" data-action="episode-next" disabled>${icon('episodeNext')}Próximo episódio</button><button class="btn ghost" data-action="pip" title="Mini Player (PiP)">${icon('monitor')}PiP</button><button class="btn ghost" data-action="fullscreen">${icon('fullscreen')}Tela cheia</button><button class="btn ghost" data-action="back-player">${icon('left')}Voltar à lista</button></div><div class="player-help">${icon('info')}O JstudioPlay reproduz fontes da sua playlist com aceleração de hardware e decodificação otimizada.</div>
  </section></div>`;
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
function renderChannelRow(ch,i,sub=false){return `<div class="channel-row ${sub?'episode-row ':''}${state.selected?.url===ch.url?'selected':''}"><button class="channel-select" data-action="play" data-index="${i}" title="${esc(ch.name)}">${channelLogo(ch,i,true)}<span class="channel-text"><strong>${esc(ch.name)}</strong><small>${esc(ch.group)}</small></span></button><button class="favorite-button ${isFavorite(ch)?'is-favorite':''}" data-action="favorite" data-index="${i}" aria-label="${isFavorite(ch)?'Remover dos favoritos':'Favoritar'} ${esc(ch.name)}" aria-pressed="${isFavorite(ch)}">${icon('heart')}</button></div>`;}
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
  if(!ch)return;stopPlayback();state.selected=ch;playbackPlaylist=state.activePlaylist;lastProgressSave=Date.now();const generation=playbackGeneration;const v=$('#video');if(!v)return;
  $('#now-name').textContent=ch.name;$('#now-category').textContent=ch.group;$('#now-favorite').disabled=false;updateNowFavorite();updateEpisodeControls(ch);renderChannels();
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
     const instance=new Hls({enableWorker:true,backBufferLength:90,enableSoftwareAES:true});hls=instance;window.currentHlsInstance=instance;instance.loadSource(ch.url);instance.attachMedia(v);instance.on(Hls.Events.MANIFEST_PARSED,start);instance.on(Hls.Events.ERROR,(_,data)=>{if(generation!==playbackGeneration||!data.fatal)return;instance.destroy();if(hls===instance){hls=null;window.currentHlsInstance=null;}clearTimeout(playbackTimer);playbackTimer=null;playerMessage('Não foi possível reproduzir','A transmissão HLS falhou ou não é compatível. Confira a disponibilidade no provedor, sem alterar suas proteções de acesso.',true);});
  }else direct();
}
function updateNowFavorite(){const b=$('#now-favorite');if(!b||!state.selected)return;const on=isFavorite(state.selected);b.classList.toggle('is-favorite',on);b.style.color=on?'#fc6382':'';b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'Remover canal dos favoritos':'Favoritar canal atual');}
function backToChannels(){stopPlayback();state.selected=null;updateEpisodeControls(null);if($('#now-name'))$('#now-name').textContent='Seu próximo conteúdo está aqui';if($('#now-category'))$('#now-category').textContent='Selecione algo para começar';if($('#now-favorite'))$('#now-favorite').disabled=true;playerMessage('Escolha um conteúdo','Selecione outro item da playlist para iniciar a reprodução.');renderChannels();}
async function toggleFavorite(ch,id=state.activePlaylist){state.favorites=await api('/favorites','PUT',{playlistId:id,channel:ch})||[];if(state.page==='player'){renderChannels();updateNowFavorite();}else if(state.page==='favorites')$('#content').innerHTML=savedPage('favorites');}

function openModal(title,content){const modal=$('#modal');modal.innerHTML=`<div class="dialog-heading"><h2 id="modal-title">${title}</h2><button class="icon-btn" data-action="close-modal" aria-label="Fechar">${icon('close')}</button></div>${content}`;if(!modal.open)modal.showModal();}
function playlistModal(){openModal('Adicionar playlist',`<form id="playlist-form" class="stack"><div><label for="playlist-name">Nome da playlist</label><input id="playlist-name" name="name" placeholder="Ex.: Minha Playlist" maxlength="80" required autofocus></div><div class="input-tabs"><button type="button" data-action="source-tab" data-source="url" class="active">${icon('globe')} Por URL</button><button type="button" data-action="source-tab" data-source="file">${icon('playlist')} Arquivo M3U</button></div><div id="url-field"><label for="playlist-url">URL da playlist M3U</label><input id="playlist-url" name="url" type="url" placeholder="https://…" required autocomplete="off" spellcheck="false"></div><div id="file-field" hidden><label for="playlist-file">Arquivo da playlist</label><input id="playlist-file" name="file" type="file" accept=".m3u,.m3u8,audio/x-mpegurl,application/vnd.apple.mpegurl" class="file-input" disabled><p class="help-text">M3U ou M3U8 · até 100 MiB</p></div><div class="info">${icon('info')}Você deve possuir autorização para utilizar a playlist informada.</div><label class="check"><input name="organize" type="checkbox" checked>Organizar categorias automaticamente</label><div class="form-error" role="alert"></div><div class="dialog-actions"><button type="button" class="btn secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">Adicionar</button></div></form>`);}
function userModal(){openModal('Novo usuário',`<form id="user-form" class="stack"><div><label for="new-user-name">Nome</label><input name="name" id="new-user-name" required maxlength="80" autofocus autocomplete="off"></div><div><label for="new-user-username">Usuário</label><input name="username" id="new-user-username" required minlength="3" maxlength="40" pattern="[a-zA-Z0-9_.\\x2d]+" autocomplete="off"><p class="help-text">Letras, números, ponto, hífen ou sublinhado.</p></div><div><label for="new-user-password">Senha inicial</label><input id="new-user-password" name="password" type="password" minlength="10" maxlength="256" required autocomplete="new-password"><p class="help-text">Mínimo de 10 caracteres. O cliente poderá alterá-la em Configurações.</p></div>${state.user.role==='admin'?'<div><label for="new-user-role">Perfil</label><select name="role" id="new-user-role"><option value="client">Usuário do player</option><option value="manager">Gestor (até 10 usuários)</option></select></div>':''}<div class="form-error" role="alert"></div><div class="dialog-actions"><button type="button" class="btn secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">Criar usuário</button></div></form>`);}
function userOptions(id){const u=state.users.find(v=>v.user.id===id)?.user;if(!u)return;openModal(`Gerenciar ${esc(u.username)}`,`<div class="stack"><p>${u.blocked?'A conta está bloqueada. Reative para permitir novos acessos.':'Ao bloquear a conta, as sessões do cliente serão encerradas.'}</p><button class="btn ${u.blocked?'':'danger'}" data-action="block-user" data-id="${id}">${u.blocked?'Reativar conta':'Bloquear conta'}</button><div class="divider"></div><form id="reset-form" class="stack" data-id="${id}"><div><label for="reset-password">Redefinir senha</label><input id="reset-password" name="password" type="password" minlength="10" maxlength="256" placeholder="Nova senha (mínimo de 10 caracteres)" autocomplete="new-password" required></div><div class="form-error" role="alert"></div><button class="btn secondary" type="submit">Salvar nova senha</button></form></div>`);}

document.addEventListener('click',async event=>{
  const b=event.target.closest('[data-action]');if(!b||b.disabled)return;const action=b.dataset.action;
  try{
    if(action==='theme'){applyTheme(theme==='dark'?'light':'dark');if(state.user)state.user=await api('/account','PATCH',{theme});return;}
    if(action==='menu'){setMenu(!$('.shell').classList.contains('menu-open'));return;}
    if(action==='toggle-sidebar'){toggleSidebar();return;}
    if(action==='close-modal'){$('#modal').close();return;}
    if(action==='password'){const input=document.getElementById(b.dataset.target);input.type=input.type==='password'?'text':'password';b.setAttribute('aria-label',input.type==='password'?'Mostrar senha':'Ocultar senha');return;}
    if(action==='forgot'){openModal('Recuperar acesso',`<p>Solicite ao administrador da plataforma uma nova senha. Depois de entrar, você pode alterá-la em Configurações.</p><p class="help-text">Se você é o administrador, consulte o procedimento de recuperação no README do servidor.</p><button class="btn" data-action="close-modal">Entendi</button>`);return;}
    if(action==='logout'){stopPlayback();await progressWrites.catch(()=>{});await api('/logout','POST',{});state.user=null;clearPrivateState();navigate('home');return;}
    if(action==='add-playlist'){if(state.playlists.length>=maxPlaylistsPerAccount){toast('Limite de 2 playlists por conta.',true);return;}playlistModal();return;}
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
    if(action==='user-options'){userOptions(b.dataset.id);return;}
    if(action==='block-user'){b.disabled=true;const u=state.users.find(x=>x.user.id===b.dataset.id).user;await api(`/admin/users/${u.id}`,'PATCH',{blocked:!u.blocked});$('#modal').close();await renderRoute();toast('Acesso atualizado.');return;}
  }catch(error){b.disabled=false;toast(error.message,true);}
});
document.addEventListener('input',event=>{
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
  const form=event.target;if(!['login-form','playlist-form','refresh-form','settings-form','user-form','reset-form'].includes(form.id))return;
  event.preventDefault();const button=$('[type="submit"]',form),errorEl=$('.form-error',form),original=button.textContent;
  if(button.disabled)return;button.disabled=true;button.textContent=form.id==='playlist-form'?'Importando…':form.id==='refresh-form'?'Atualizando…':'Salvando…';errorEl.textContent='';
  const fields=new FormData(form),value=Object.fromEntries(fields.entries());
  try{
    if(form.id==='login-form'){state.user=await api(state.setupRequired?'/setup':'/login','POST',{username:value.username,password:value.password,remember:fields.has('remember')});state.setupRequired=false;applyTheme(state.user.theme);navigate('dashboard');}
    if(form.id==='playlist-form'){
      let text='';if(!$('#playlist-file').disabled){const file=fields.get('file');if(!file?.size)throw new Error('Escolha um arquivo M3U.');if(file.size>100*1024*1024)throw new Error('O arquivo excede o limite de 100 MiB.');text=await file.text();}
      const p=await api('/playlists','POST',{name:value.name,url:value.url||'',text,organize:fields.has('organize')});state.activePlaylist=p.id;$('#modal').close();await renderRoute();toast(`${number(p.total)} canais adicionados à sua conta.`);
    }
    if(form.id==='refresh-form'){await api(`/playlists/${form.dataset.id}/refresh`,'POST',{url:value.url});$('#modal').close();await renderRoute();toast('Playlist atualizada.');}
    if(form.id==='settings-form'){state.user=await api('/account','PATCH',value);applyTheme(state.user.theme);await renderRoute();toast('Configurações salvas.');}
    if(form.id==='user-form'){await api('/admin/users','POST',value);$('#modal').close();await renderRoute();toast('Usuário criado.');}
    if(form.id==='reset-form'){await api(`/admin/users/${form.dataset.id}`,'PATCH',{password:value.password});$('#modal').close();toast('Senha redefinida. As sessões anteriores foram encerradas.');}
  }catch(error){errorEl.textContent=error.message;}
  finally{button.disabled=false;button.textContent=original;}
});
window.addEventListener('hashchange',renderRoute);
window.addEventListener('pagehide',()=>{const v=$('#video');if(v&&state.selected&&Number.isFinite(v.duration)&&v.currentTime>0)savePlaybackProgress(state.selected,v).catch(()=>{});});
let sessionCheckTimer=null;
async function verifySession(){
  const userID=state.user?.id;if(!userID)return;
  try{const session=await api('/session');if(state.user?.id===userID&&session.user?.id!==userID){state.user=null;clearPrivateState();navigate('login');toast('Este acesso foi encerrado após a entrada em outro dispositivo.',true);}}catch{}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)verifySession();});
async function boot(){try{const session=await api('/session');Object.assign(state,session);if(state.user)applyTheme(state.user.theme);await renderRoute();if(!sessionCheckTimer)sessionCheckTimer=setInterval(verifySession,15000);}catch(error){$('#app').innerHTML=`<div class="boot">${empty('Não foi possível iniciar',error.message,'<button class="btn" id="boot-retry">Tentar novamente</button>','info')}</div>`;$('#boot-retry').addEventListener('click',boot);}}
boot();
