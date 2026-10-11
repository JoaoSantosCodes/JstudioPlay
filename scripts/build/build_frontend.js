const fs = require('fs');
const path = require('path');

let appJs = fs.readFileSync(path.join(__dirname, 'scraped', 'static', 'app.formatted.js'), 'utf8');

// 1. Add 'activity' icon to paths if not present
const iconAdd = `activity:'<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',`;
appJs = appJs.replace(`const paths = {`, `const paths = {\n  ${iconAdd}`);

// 2. Add 'automation' to pageNames
appJs = appJs.replace(
    `const pageNames={dashboard:'Início',playlists:'Minhas Playlists',player:'Player',favorites:'Favoritos',history:'Histórico',settings:'Configurações',users:'Usuários',logs:'Logs da plataforma'};`,
    `const pageNames={dashboard:'Início',playlists:'Minhas Playlists',player:'Player',favorites:'Favoritos',history:'Histórico',automation:'Automação & Validador',settings:'Configurações',users:'Usuários',logs:'Logs da plataforma'};`
);

// 3. Add automation link to shell navigation
appJs = appJs.replace(
    `\${navLink('history','clock','Histórico')}`,
    `\${navLink('history','clock','Histórico')}\${navLink('automation','activity','Automação')}`
);

// 4. Update statusFilter in state
appJs = appJs.replace(
    `const state = {user:null,`,
    `const state = {user:null,statusFilter:'all',activeCheckInterval:null,`
);

// 5. Update renderChannelRow to show status pills
const oldRenderChannelRow = `function renderChannelRow(ch,i,sub=false){return \`<div class="channel-row \${
  sub?'episode-row ':''
}\${
  state.selected?.url===ch.url?'selected':''
}"><button class="channel-select" data-action="play" data-index="\${
  i
}" title="\${
  esc(ch.name)
}">\${channelLogo(ch,i,true)}<span class="channel-text"><strong>\${esc(ch.name)}</strong><small>\${esc(ch.group)}</small></span></button><button class="favorite-button \${
  isFavorite(ch)?'is-favorite':''
}" data-action="favorite" data-index="\${
  i
}" aria-label="\${
  isFavorite(ch)?'Remover dos favoritos':'Favoritar'
} \${
  esc(ch.name)
}" aria-pressed="\${
  isFavorite(ch)
}">\${icon('heart')}</button></div>\`;}`;

const newRenderChannelRow = `function renderChannelRow(ch,i,sub=false){
  let statusBadge = '';
  if (ch.status === 'online') {
    statusBadge = \`<span class="status-pill online" title="Online (\${ch.latency || 0}ms)">🟢 \${ch.latency ? ch.latency + 'ms' : 'ON'}</span>\`;
  } else if (ch.status === 'offline') {
    statusBadge = '<span class="status-pill offline" title="Offline / Inacessível">🔴 OFF</span>';
  } else if (ch.status === 'checking') {
    statusBadge = '<span class="status-pill checking">🟡 TESTANDO</span>';
  }

  return \`<div class="channel-row \${
    sub?'episode-row ':''
  }\${
    state.selected?.url===ch.url?'selected':''
  }"><button class="channel-select" data-action="play" data-index="\${
    i
  }" title="\${
    esc(ch.name)
  }">\${channelLogo(ch,i,true)}<span class="channel-text"><strong>\${esc(ch.name)}\${statusBadge}</strong><small>\${esc(ch.group)}</small></span></button><button class="favorite-button \${
    isFavorite(ch)?'is-favorite':''
  }" data-action="favorite" data-index="\${
    i
  }" aria-label="\${
    isFavorite(ch)?'Remover dos favoritos':'Favoritar'
  } \${
    esc(ch.name)
  }" aria-pressed="\${
    isFavorite(ch)
  }">\${icon('heart')}</button></div>\`;
}`;

appJs = appJs.replace(oldRenderChannelRow, newRenderChannelRow);

// 6. Add automation page renderer and actions
const automationPageCode = `
function automationPage() {
  const totalPlaylists = state.playlists.length;
  const totalChannels = state.playlists.reduce((acc, p) => acc + (p.total || 0), 0);
  const totalOnline = state.playlists.reduce((acc, p) => acc + (p.onlineCount || 0), 0);

  return \`
    \${heading('Central de Automação & Streams', 'Validação automática de canais em tempo real, sincronização com URLs e exportação.')}
    
    <div class="stats">
      <article class="card stat"><span class="stat-icon">\${icon('playlist')}</span><div><p>Listas Ativas</p><strong>\${number(totalPlaylists)}</strong></div></article>
      <article class="card stat"><span class="stat-icon">\${icon('play')}</span><div><p>Total de Canais</p><strong>\${number(totalChannels)}</strong></div></article>
      <article class="card stat"><span class="stat-icon" style="color:#10b981">\${icon('activity')}</span><div><p>Canais Online (Validados)</p><strong>\${number(totalOnline)}</strong></div></article>
      <article class="card stat"><span class="stat-icon">\${icon('refresh')}</span><div><p>Agendador Cron</p><strong>Auto (6h)</strong></div></article>
    </div>

    <section class="section">
      <div class="section-heading">
        <h2>Gerenciamento de Listas & Validação</h2>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn primary small" data-action="trigger-sync-all">\${icon('refresh')} Sincronizar Todas</button>
        </div>
      </div>

      <div class="automation-grid">
        \${state.playlists.map((p, idx) => \`
          <article class="automation-card" id="auto-card-\${p.id}">
            <div class="automation-card-head">
              <div>
                <h3>\${esc(p.name)}</h3>
                <p>\${p.url ? esc(p.url.slice(0, 45) + '...') : 'Arquivo Local M3U'} · \${number(p.total)} canais</p>
              </div>
              <span class="badge" style="background:rgba(129,69,237,0.2);color:#a78bfa;">ID: \${p.id}</span>
            </div>

            <div class="automation-progress-container" id="progress-box-\${p.id}" style="\${p.checkStatus === 'running' ? '' : 'display:none;'}">
              <div class="progress-meta">
                <span id="prog-text-\${p.id}">Testando conexões dos canais...</span>
                <strong id="prog-pct-\${p.id}">0%</strong>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" id="prog-fill-\${p.id}" style="width: 0%;"></div>
              </div>
              <div class="progress-meta">
                <span style="color:#10b981;" id="prog-online-\${p.id}">🟢 0 Online</span>
                <span style="color:#f43f5e;" id="prog-offline-\${p.id}">🔴 0 Offline</span>
              </div>
            </div>

            <div class="automation-details" style="font-size:0.85rem; color:#94a3b8; display:flex; justify-content:space-between;">
              <span>Status: <strong style="color:\${p.onlineCount > 0 ? '#10b981' : '#fff'}">\${p.onlineCount || 0} Online</strong> / \${p.total}</span>
              <span>Última checagem: <strong>\${p.lastChecked ? dateTime(p.lastChecked) : 'Nunca'}</strong></span>
            </div>

            <div class="automation-actions">
              <button class="btn primary small" data-action="run-stream-check" data-id="\${p.id}">\${icon('activity')} Testar Streams</button>
              \${p.url ? \`<button class="btn ghost small" data-action="refresh-playlist-auto" data-id="\${p.id}">\${icon('refresh')} Auto-Sync</button>\` : ''}
              <a class="btn ghost small" href="/playlists/\${p.id}/export?filter=online" download>\${icon('download')} Baixar Limpa (.m3u)</a>
              <a class="btn secondary small" href="#/player" data-action="open-playlist" data-id="\${p.id}">\${icon('play')} Abrir</a>
            </div>
          </article>
        \`).join('')}
      </div>
    </section>
  \`;
}
`;

// Insert automationPage function before renderRoute
appJs = appJs.replace(`async function renderRoute(){`, `${automationPageCode}\nasync function renderRoute(){`);

// Update page dispatch in renderRoute
appJs = appJs.replace(
    `const content=page==='dashboard'?dashboard():page==='playlists'?heading('Minhas playlists','Todas as suas listas, organizadas em um só lugar.')+playlistSection():page==='settings'?settings():page==='users'?usersPage():page==='logs'?logsPage():page==='player'?playerPage():savedPage(page);`,
    `const content=page==='dashboard'?dashboard():page==='playlists'?heading('Minhas playlists','Todas as suas listas, organizadas em um só lugar.')+playlistSection():page==='automation'?automationPage():page==='settings'?settings():page==='users'?usersPage():page==='logs'?logsPage():page==='player'?playerPage():savedPage(page);`
);

// Add click event handlers for automation actions
const clickHandlerCode = `
    if(action==='run-stream-check'){
      const pid = b.dataset.id;
      b.disabled = true;
      const box = $('#progress-box-' + pid);
      if(box) box.style.display = 'block';
      toast('Iniciando teste de streams em segundo plano...');
      await api('/automation/check/' + pid, 'POST');
      
      // Poll progress
      const pollInterval = setInterval(async () => {
        try {
          const status = await api('/automation/check/' + pid + '/status');
          const fill = $('#prog-fill-' + pid);
          const pct = $('#prog-pct-' + pid);
          const onlineEl = $('#prog-online-' + pid);
          const offlineEl = $('#prog-offline-' + pid);
          
          if(fill) fill.style.width = (status.percentage || 0) + '%';
          if(pct) pct.textContent = (status.percentage || 0) + '%';
          if(onlineEl) onlineEl.textContent = '🟢 ' + (status.online || 0) + ' Online';
          if(offlineEl) offlineEl.textContent = '🔴 ' + (status.offline || 0) + ' Offline';

          if(!status.isRunning) {
            clearInterval(pollInterval);
            b.disabled = false;
            toast('Teste concluído: ' + (status.online || 0) + ' canais ativos!');
            await loadLibrary();
            await renderRoute();
          }
        } catch(e) {
          clearInterval(pollInterval);
          b.disabled = false;
        }
      }, 1000);
      return;
    }
    if(action==='trigger-sync-all'){
      b.disabled = true;
      toast('Sincronizando todas as listas remotas...');
      await api('/automation/sync', 'POST');
      setTimeout(async () => {
        b.disabled = false;
        await loadLibrary();
        await renderRoute();
        toast('Sincronização concluída.');
      }, 2500);
      return;
    }
    if(action==='refresh-playlist-auto'){
      b.disabled = true;
      toast('Sincronizando lista com o servidor remoto...');
      await api('/playlists/' + b.dataset.id + '/refresh', 'POST');
      await loadLibrary();
      await renderRoute();
      toast('Lista atualizada com sucesso!');
      return;
    }
`;

appJs = appJs.replace(
    `if(action==='new-user'){userModal();return;}`,
    `${clickHandlerCode}\n    if(action==='new-user'){userModal();return;}`
);

fs.writeFileSync(path.join(__dirname, 'public', 'static', 'app.js'), appJs, 'utf8');
console.log('public/static/app.js updated with automation features!');
