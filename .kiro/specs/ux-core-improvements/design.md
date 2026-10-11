# Design Document — UX Core Improvements

## Overview

Este documento descreve a arquitetura técnica das três melhorias de UX priorizadas para o JstudioPlay:

1. **Busca em Tempo Real** — wiring do `#channel-search` existente com debounce e `state.query`
2. **Health Indicator** — dots de status por canal via `IntersectionObserver` + `Probe_Speed_Endpoint`
3. **EPG Inline** — programa atual/próximo na `Channel_Row` via `EPG_Cache` + `/api/epg/now`

Todas as mudanças são **front-end only** (sem novos endpoints de backend), concentradas em:
- `public/static/app.js` — lógica de renderização e estado
- `public/static/automation.js` — módulo de features avançadas (Health + EPG)
- `public/static/design-v8.css` — estilos dos novos componentes

---

## Architecture

### Princípios de Design

- **Mutação cirúrgica de DOM**: nenhuma das três features pode chamar `$('#channel-list').innerHTML = ...` após a renderização inicial. Atualizações incrementais via `querySelector` + `textContent`/`setAttribute`.
- **Zero regressão mobile**: IntersectionObserver e AbortController são APIs universais em WebKit/Blink modernos e no Capacitor do projeto.
- **Degradação graciosa**: Health Indicator cai para `unknown` silenciosamente; EPG Inline simplesmente não renderiza o slot quando sem dados.
- **Design system preservado**: toda cor, tipografia e espaçamento via variáveis CSS existentes.

---

## Component Design

### 1. Busca em Tempo Real

#### Estado envolvido
`state.query` — já existe em `app.js`. A função `renderChannels()` já filtra por ele:
```js
const q = state.query.toLocaleLowerCase('pt-BR');
const filtered = state.channels.filter(c =>
  (!state.category || c.group === state.category) &&
  (!q || c.name.toLocaleLowerCase('pt-BR').includes(q))
);
```

#### O que está faltando
O campo `#channel-search` existe no HTML gerado por `playerPage()`, mas **não há event listener** ligando o `input` ao `state.query`. O debounce e o reset ao trocar playlist também não estão implementados.

#### Implementação

**Em `app.js` — dentro do handler de eventos `click`/`input` do player:**

```js
// Debounce para o campo de busca
let searchDebounce = null;

// No handler de input do documento (onde outros inputs são tratados):
if (e.target.id === 'channel-search') {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    state.query = e.target.value.trim();
    state.channelPage = 1;
    renderChannels();
  }, 180);
}
```

**Reset ao trocar playlist** — na função `loadChannels()`, antes de chamar `renderChannels()`:
```js
state.query = '';
const searchEl = $('#channel-search');
if (searchEl) searchEl.value = '';
```

**Contagem `#channel-count`** — já atualizada em `renderChannels()`:
```js
$('#channel-count').textContent = `(${number(filtered.length)})`;
```
Funciona com zero resultados automaticamente — exibirá `(0)`.

**Mensagem de zero resultados** — já existe em `renderChannels()`:
```js
|| '<div class="empty"><p>Nenhum canal encontrado.</p></div>'
```

**Compatibilidade com `numBuffer` (TV mode)** — o `numBuffer` em `automation.js` é acionado pelo evento `keydown` no `document`. O campo `#channel-search` captura o foco, então `document.activeElement === searchEl`. Adicionar guard no handler do numBuffer:
```js
// Em automation.js, no handler de numBuffer:
if (document.activeElement?.id === 'channel-search') return; // não capturar dígitos para numBuffer
```

---

### 2. Health Indicator

#### Estrutura do `Channel_Row`

O HTML atual de `renderChannelRow()`:
```html
<div class="channel-row [selected]">
  <button class="channel-select" data-action="play" data-index="{i}">
    {channelLogo} <span class="channel-text"><strong>{name}</strong><small>{group}</small></span>
  </button>
  <button class="favorite-button" ...></button>
</div>
```

**Novo HTML com Health Indicator:**
```html
<div class="channel-row [selected]" data-channel-id="{ch.id}" data-tv-target>
  <button class="channel-select" data-action="play" data-index="{i}">
    {channelLogo}
    <span class="channel-text">
      <strong>{name}</strong>
      <small>{group}</small>
    </span>
  </button>
  <span class="health-indicator" data-status="{ch.status || 'unknown'}" aria-hidden="true"></span>
  <button class="favorite-button" ...></button>
</div>
```

**Mudança em `renderChannelRow()`:**
- Adicionar `data-channel-id="${ch.id || ''}"` na `div.channel-row`
- Adicionar `<span class="health-indicator" data-status="${ch.status||'unknown'}" aria-hidden="true"></span>` entre o botão de play e o de favorito

#### CSS do Health Indicator (em `design-v8.css`)

```css
.health-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: var(--muted);
  transition: background-color 300ms ease;
  align-self: center;
}

@media (prefers-reduced-motion: reduce) {
  .health-indicator { transition: none; }
}

.health-indicator[data-status="online"]  { background-color: var(--green, #4ade80); }
.health-indicator[data-status="offline"] { background-color: var(--red,   #f87171); }
.health-indicator[data-status="unknown"] { background-color: var(--muted); }
```

#### Lógica de probe (em `automation.js`)

```js
// Módulo Health Indicator
const healthModule = (() => {
  let observer = null;
  let batchPending = [];
  let batchTimer = null;
  let probeController = null;

  function isDataSaver() {
    return localStorage.getItem('m3u-data-saver') === 'true';
  }

  function updateDot(id, status) {
    const el = document.querySelector(`[data-channel-id="${id}"] .health-indicator`);
    if (el) {
      el.dataset.status = status;
    }
  }

  async function flushBatch() {
    if (!batchPending.length) return;
    const ids = [...batchPending];
    batchPending = [];
    batchTimer = null;
    probeController = new AbortController();
    try {
      const res = await authFetch('/api/automation/probe-speed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: ids.map(id => ({ id })) }),
        signal: probeController.signal
      });
      if (!res.ok) return;
      const { results } = await res.json();
      results.forEach(r => updateDot(r.id, r.status));
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('[Health] probe error:', e.message);
    }
  }

  function queueChannel(id) {
    if (batchPending.includes(id)) return;
    batchPending.push(id);
    if (batchPending.length >= 20) {
      clearTimeout(batchTimer);
      flushBatch();
    } else {
      clearTimeout(batchTimer);
      batchTimer = setTimeout(flushBatch, 500);
    }
  }

  function observe() {
    if (isDataSaver()) return;
    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const row = entry.target;
        const id = row.dataset.channelId;
        const status = row.querySelector('.health-indicator')?.dataset.status;
        if (id && status === 'unknown') {
          queueChannel(id);
          observer.unobserve(row); // só probe uma vez
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('#channel-list .channel-row[data-channel-id]')
      .forEach(row => observer.observe(row));
  }

  function cancelPending() {
    probeController?.abort();
    clearTimeout(batchTimer);
    batchPending = [];
  }

  function toggleDataSaver(btn) {
    const current = isDataSaver();
    const next = !current;
    localStorage.setItem('m3u-data-saver', String(next));
    btn.setAttribute('aria-pressed', String(next));
    if (next) cancelPending();
    else observe(); // reinicia probing se desativado
  }

  return { observe, cancelPending, toggleDataSaver };
})();
```

**Botão Data Saver** — adicionado na `player-toolbar` dentro de `playerPage()`:
```html
<button class="icon-btn subtle-icon" id="btn-data-saver"
  data-action="toggle-data-saver"
  aria-pressed="{localStorage.getItem('m3u-data-saver') === 'true'}"
  title="Economizar dados">
  {icon('zap')}
</button>
```

**Hook após `renderChannels()`** — `healthModule.observe()` é chamado ao final de `renderChannels()` quando a página é `player`.

---

### 3. EPG Inline

#### Estrutura do `Channel_Row` com EPG

```html
<div class="channel-row [selected]" data-channel-id="{id}" data-channel-name="{name}">
  <button class="channel-select" ...>
    {channelLogo}
    <span class="channel-text">
      <strong>{name}</strong>
      <small>{group}</small>
      <!-- injetado dinamicamente: -->
      <span class="epg-inline">{título truncado} {HH:MM – HH:MM}</span>
      <span class="epg-next" style="display:none">A seguir HH:MM: {próximo}</span>
    </span>
  </button>
  <span class="health-indicator" ...></span>
  <button class="favorite-button" ...></button>
</div>
```

**Nota:** `.epg-inline` e `.epg-next` são **injetados pelo JS após a renderização**, não no template HTML inicial — preservando o comportamento de re-render existente.

#### EPG_Cache

```js
// Em automation.js
const epgCache = new Map(); // key: channelName, value: { hasEpg, current, next } | null
```

#### Lógica de fetch EPG (em `automation.js`)

```js
const epgModule = (() => {
  const cache = new Map();
  let epgObserver = null;

  function formatTime(str) {
    if (!str) return '';
    // str vem no formato "HH:MM" do backend
    return str.slice(0, 5);
  }

  function truncate(text, max = 40) {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  function renderEpgInRow(row, data) {
    const textSpan = row.querySelector('.channel-text');
    if (!textSpan) return;

    let inlineEl = textSpan.querySelector('.epg-inline');
    let nextEl = textSpan.querySelector('.epg-next');

    if (!data || !data.hasEpg || !data.current) {
      inlineEl?.remove();
      nextEl?.remove();
      return;
    }

    const title = truncate(data.current.title);
    const times = `${formatTime(data.current.startTimeStr)} – ${formatTime(data.current.endTimeStr)}`;
    const inlineText = `${title}  ${times}`;

    if (!inlineEl) {
      inlineEl = document.createElement('span');
      inlineEl.className = 'epg-inline';
      textSpan.appendChild(inlineEl);
    }
    inlineEl.textContent = inlineText;

    // Próximo programa — só visível quando selecionado
    if (data.next) {
      const nextText = `A seguir ${formatTime(data.next.startTimeStr)}: ${truncate(data.next.title, 35)}`;
      if (!nextEl) {
        nextEl = document.createElement('span');
        nextEl.className = 'epg-next';
        nextEl.style.display = 'none';
        textSpan.appendChild(nextEl);
      }
      nextEl.textContent = nextText;
    } else {
      nextEl?.remove();
    }
  }

  async function fetchEpg(channelName) {
    if (cache.has(channelName)) return; // já consultado
    cache.set(channelName, null); // marca como "em consulta" para não duplicar

    const ctrl = new AbortController();
    const timeout = setTimeout(() => {
      ctrl.abort();
      console.warn('[EPG] timeout:', channelName);
    }, 3000);

    try {
      const res = await authFetch(`/api/epg/now?name=${encodeURIComponent(channelName)}`, {
        signal: ctrl.signal
      });
      clearTimeout(timeout);
      if (!res.ok) return;
      const data = await res.json();
      cache.set(channelName, data.hasEpg ? data : null);

      // Atualizar DOM cirurgicamente
      const row = document.querySelector(`[data-channel-name="${CSS.escape(channelName)}"]`);
      if (row) renderEpgInRow(row, data);
    } catch (e) {
      clearTimeout(timeout);
      if (e.name !== 'AbortError') console.warn('[EPG] error:', channelName, e.message);
    }
  }

  function observeEpg() {
    epgObserver?.disconnect();
    epgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const row = entry.target;
        const name = row.dataset.channelName;
        if (name && !cache.has(name)) fetchEpg(name);
        epgObserver.unobserve(row); // só fetch uma vez por canal por sessão
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('#channel-list .channel-row[data-channel-name]')
      .forEach(row => epgObserver.observe(row));
  }

  // Chamado quando o canal selecionado muda — mostra/oculta epg-next
  function updateSelectedEpg(prevUrl, newUrl) {
    if (prevUrl) {
      const prev = document.querySelector(`[data-channel-url="${CSS.escape(prevUrl)}"]`);
      prev?.querySelector('.epg-next')?.style.setProperty('display', 'none');
    }
    if (newUrl) {
      const curr = document.querySelector(`[data-channel-url="${CSS.escape(newUrl)}"]`);
      const el = curr?.querySelector('.epg-next');
      if (el) el.style.display = '';
    }
  }

  return { observeEpg, updateSelectedEpg, renderEpgInRow, cache };
})();
```

**Hook após `renderChannels()`:**
```js
if (state.page === 'player') {
  healthModule.observe();
  epgModule.observeEpg();
}
```

**Hook ao selecionar canal** — em `playChannel(ch)`, antes de iniciar o HLS:
```js
epgModule.updateSelectedEpg(state.selected?.url, ch.url);
```

#### CSS do EPG Inline (em `design-v8.css`)

```css
.epg-inline {
  display: block;
  font-size: 0.72rem;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.epg-next {
  display: none;
  font-size: 0.68rem;
  color: var(--accent-solid);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

---

## Data Flow

### Busca

```
[usuário digita] → input event → debounce 180ms → state.query = valor
  → renderChannels() → filtra state.channels (em memória) → innerHTML do #channel-list
  → healthModule.observe() + epgModule.observeEpg() (re-observa novos rows)
```

### Health Indicator

```
renderChannels() → DOM com .health-indicator[data-status="unknown"]
  → healthModule.observe() → IntersectionObserver registra rows visíveis
  → row entra no viewport → queueChannel(id) → batchTimer 500ms ou 20 itens
  → POST /api/automation/probe-speed → { results }
  → updateDot(id, status) → querySelector → el.dataset.status = status → CSS atualiza cor
```

### EPG Inline

```
renderChannels() → DOM com [data-channel-name]
  → epgModule.observeEpg() → IntersectionObserver
  → row entra no viewport → fetchEpg(name) → epgCache.has(name)? skip : fetch
  → GET /api/epg/now?name={name} (AbortController 3000ms)
  → epgCache.set(name, data)
  → renderEpgInRow(row, data) → createElement/textContent → DOM atualizado
```

---

## Components and Interfaces

### `healthModule` (automation.js)
- `observe()` → `void` — registra IntersectionObserver nos rows do `#channel-list`
- `cancelPending()` → `void` — aborta AbortController e limpa batch
- `toggleDataSaver(btn: HTMLButtonElement)` → `void` — alterna localStorage + aria-pressed

### `epgModule` (automation.js)
- `observeEpg()` → `void` — registra IntersectionObserver para fetch de EPG
- `updateSelectedEpg(prevUrl: string|undefined, newUrl: string)` → `void` — toggle epg-next
- `renderEpgInRow(row: HTMLElement, data: EpgData|null)` → `void` — injeta DOM

### Tipos de dados

```js
// Stream status persistido pelo streamChecker
type StreamStatus = 'online' | 'offline' | 'unknown'

// Resposta do EPG_Manager
type EpgData = {
  hasEpg: boolean,
  current?: { title: string, startTimeStr: string, endTimeStr: string, progressPercent: number },
  next?: { title: string, startTimeStr: string }
}

// Entrada do EPG_Cache
type EpgCacheEntry = EpgData | null  // null = consultado, sem EPG

// Resultado do Probe_Speed_Endpoint
type ProbeResult = { id: string, status: StreamStatus, latency: number, httpStatus: number }
```

---

## Data Models

### EPG_Cache (front-end, em memória)
```
Map<channelName: string, EpgData | null>
```
- Chave: `channel.name` (string exata do objeto de canal)
- Valor `EpgData`: dados de programação válidos
- Valor `null`: canal já consultado, sem EPG disponível
- Escopo: sessão atual (limpo ao recarregar a página)

### Health Indicator State (DOM)
O estado do indicator é armazenado diretamente no atributo `data-status` do elemento `.health-indicator`. Não há estrutura de dados em memória separada — o DOM é a fonte de verdade para o estado visual.

### Batch de Probe (em memória, transitório)
```
Array<channelId: string>  // batchPending[]
```
- Acumula IDs até 20 itens ou timeout de 500ms
- Esvaziado após envio ao Probe_Speed_Endpoint

### state.query (app.js — já existente)
```
string  // valor atual do filtro de busca, vazio por padrão
```

---

## File Changes Summary

| Arquivo | Tipo de mudança |
|---|---|
| `public/static/app.js` | Adicionar: event listener busca, debounce, reset ao trocar playlist, `data-channel-id`/`data-channel-name`/`data-channel-url` nos rows, botão `#btn-data-saver` na toolbar, hooks após `renderChannels()` e em `playChannel()` |
| `public/static/automation.js` | Adicionar: `healthModule`, `epgModule`, handler `toggle-data-saver`, guard numBuffer |
| `public/static/design-v8.css` | Adicionar: `.health-indicator`, `.epg-inline`, `.epg-next` + `prefers-reduced-motion` |

Nenhum arquivo de backend é modificado.

---

## Error Handling & Edge Cases

| Cenário | Comportamento |
|---|---|
| `channel.id` ausente (canais de arquivo M3U sem ID) | `data-channel-id=""` — probe não é enviado, dot fica cinza permanentemente |
| `channel.name` com caracteres especiais no seletor | `CSS.escape()` garante seletor válido |
| Playlist trocada enquanto probe pendente | `healthModule.cancelPending()` aborta `AbortController` na troca |
| EPG fetch durante troca de página | `epgObserver.disconnect()` ao sair de `#/player` |
| Canal sem `tvg-name` / nome genérico | EPG retorna `hasEpg: false` → cache `null` → sem slot |
| Data Saver ativado após probe já iniciado | `cancelPending()` aborta requests em voo |

---

## Correctness Properties

### Property 1: Busca nunca faz request de rede

`renderChannels()` filtra exclusivamente `state.channels` em memória. Nenhuma chamada de rede é feita durante a operação de busca, garantindo funcionamento offline completo.

**Validates: Requirements 1.2, 1.6, 4.8**

### Property 2: Health Indicator não bloqueia o thread principal

`IntersectionObserver` e `authFetch` são assíncronos. A atualização DOM via `dataset.status` é O(1) por canal e ocorre fora do ciclo de renderização principal.

**Validates: Requirements 2.3, 2.5, 4.1**

### Property 3: EPG_Cache é idempotente por sessão

`cache.has(name)` é verificado antes de qualquer fetch. No máximo uma requisição é feita por nome de canal durante toda a sessão do usuário.

**Validates: Requirements 3.4, 3.10**

### Property 4: AbortController previne memory leaks

O timeout de 3000ms para EPG e o `epgObserver.disconnect()` ao sair do player garantem que nenhuma promise pendente tenta atualizar um DOM que já não existe.

**Validates: Requirements 3.11, 4.1**

### Property 5: Mutação DOM é sempre cirúrgica

Nenhum dos três módulos substitui o `innerHTML` do `#channel-list`. Todas as atualizações usam `querySelector` + `textContent`/`dataset`, preservando scroll position e foco de acessibilidade.

**Validates: Requirements 2.5, 3.5, 4.2**

### Property 6: Data Saver cancela requests em voo

`probeController.abort()` em `cancelPending()` garante que requests já enviados ao `Probe_Speed_Endpoint` são abortados imediatamente ao ativar o modo Data Saver.

**Validates: Requirements 2.4, 2.7**

### Property 7: tvMode preservado sem regressão

O guard `document.activeElement?.id === 'channel-search'` no handler de `numBuffer` impede que dígitos digitados na busca acionem troca de canal. O atributo `data-tv-target` não é alterado em `renderChannelRow()`.

**Validates: Requirements 4.4, 4.5**

---

## Error Handling

### Busca
- Campo vazio → `state.query = ''` → `renderChannels()` restaura lista completa (sem erro possível)
- Nenhum resultado → mensagem "Nenhum canal encontrado." + `#channel-count` exibe `(0)` (tratamento já existente em `renderChannels()`)

### Health Indicator
- `Probe_Speed_Endpoint` retorna erro HTTP (4xx/5xx) → `if (!res.ok) return` — dots permanecem cinza, sem log, sem toast
- `Probe_Speed_Endpoint` falha com erro de rede → `catch` ignora, dots permanecem cinza
- `AbortController` abort (Data Saver ativado) → `e.name === 'AbortError'` é ignorado silenciosamente
- `channel.id` ausente → `data-channel-id=""` — `querySelector` não encontra elemento, `updateDot` é no-op

### EPG Inline
- Timeout 3000ms → `AbortController.abort()` + `console.warn('[EPG] timeout:', channelName)`
- Erro de rede → `console.warn('[EPG] error:', channelName, e.message)` + canal sem slot EPG
- `hasEpg: false` → `cache.set(name, null)` — evita nova requisição; sem slot visível
- `res.ok === false` → `return` silencioso — sem slot, sem log de erro
- Elemento DOM ausente ao tentar injetar (canal fora da view) → `if (row) renderEpgInRow(row, data)` — no-op se row não existe mais no DOM

---

## Testing Strategy

### Busca em Tempo Real
- **Manual:** digitar "globo" com 1000 canais carregados → verificar que `#channel-count` muda dentro de 180ms e zero requests de rede no DevTools Network
- **Manual:** trocar playlist → verificar que campo limpa e `state.query === ''`
- **Manual:** digitar dígitos no campo de busca com tvMode ativo → verificar que canal não muda por número
- **Regressão:** favoritar/desfavoritar após busca → favorito deve persistir

### Health Indicator
- **Manual:** carregar playlist com canais `status: 'online'/'offline'` → verificar dots coloridos imediatamente na renderização
- **Manual:** sem Data Saver, rolar lista → observar dots `unknown` atualizarem após entrar no viewport (Network: POST `/api/automation/probe-speed` em lotes ≤20)
- **Manual:** ativar Data Saver → verificar que nenhum request de probe é enviado (Network: zero POSTs)
- **Manual:** desativar Data Saver → observer reinicia, novos probes disparados
- **Manual:** `prefers-reduced-motion: reduce` via DevTools → dot muda de cor sem animação

### EPG Inline
- **Manual:** canal com EPG configurado → `.epg-inline` aparece com título + horário após entrar no viewport
- **Manual:** selecionar canal com `epg.next` → `.epg-next` torna-se visível; deselecionar → oculta
- **Manual:** canal sem EPG → sem slot, sem espaço em branco
- **Manual:** Network throttle a 50ms RTT → timeout 3000ms dispara `console.warn` e canal fica sem slot
- **Manual:** DevTools Network → verificar zero requests de EPG para páginas não exibidas (paginação)
- **Regressão:** EPG não deve interferir com reprodução HLS nem com favoritos

### Compatibilidade Geral
- **Dispositivo:** testar no app Android via Capacitor → busca, dots e EPG funcionando
- **PWA:** testar offline após carregar a playlist → busca filtra em memória (sem request)
- **Acessibilidade:** `.health-indicator` tem `aria-hidden="true"` → não lido por screen readers
