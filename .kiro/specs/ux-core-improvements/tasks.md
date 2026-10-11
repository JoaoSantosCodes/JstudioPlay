# Implementation Plan

## Overview

Implementação das três melhorias UX core do JstudioPlay: busca em tempo real, health indicator e EPG inline no player. Todas as mudanças são front-end only — sem novos endpoints de backend. Arquivos modificados: `public/static/app.js`, `public/static/automation.js`, `public/static/design-v8.css`.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2"] },
    { "wave": 2, "tasks": ["3", "4", "5"] },
    { "wave": 3, "tasks": ["6"] }
  ],
  "dependencies": {
    "3": ["1", "2"],
    "4": ["1", "2"],
    "5": ["1", "2"],
    "6": ["3", "4", "5"]
  }
}
```

## Tasks

- [ ] 1. Adicionar estilos CSS para Health Indicator e EPG Inline

  **Arquivo:** `public/static/design-v8.css`

  Adicionar ao final do arquivo os blocos CSS para os novos componentes, usando exclusivamente variáveis do design system existente (`--green`, `--red`, `--muted`, `--accent-solid`).

  **Acceptance criteria:**
  - `.health-indicator` renderiza como círculo 8×8px com `transition: background-color 300ms ease`
  - `[data-status="online"]` aplica cor via `var(--green, #4ade80)`
  - `[data-status="offline"]` aplica cor via `var(--red, #f87171)`
  - `[data-status="unknown"]` aplica cor via `var(--muted)`
  - `@media (prefers-reduced-motion: reduce)` define `transition: none`
  - `.epg-inline` é bloco, fonte 0.72rem, cor `var(--muted)`, `text-overflow: ellipsis`
  - `.epg-next` é `display: none` por padrão, fonte 0.68rem, cor `var(--accent-solid)`
  - Nenhuma variável CSS nova fora do design system

  _Requirement refs: 2.1, 3.1, 3.8, 4.3, 4.7_

- [ ] 1.1 Adicionar bloco `.health-indicator` com os três estados e `prefers-reduced-motion`

- [ ] 1.2 Adicionar blocos `.epg-inline` e `.epg-next`

---

- [ ] 2. Atualizar `renderChannelRow()` com atributos data e Health Indicator

  **Arquivo:** `public/static/app.js` — função `renderChannelRow()` linha 312

  Adicionar atributos `data-*` ao `div.channel-row` e inserir o elemento `.health-indicator`.

  **Acceptance criteria:**
  - `div.channel-row` possui `data-channel-id`, `data-channel-name`, `data-channel-url`
  - `.health-indicator` aparece entre o botão `.channel-select` e `.favorite-button`
  - `data-status` inicializado com `ch.status || 'unknown'`
  - Lógica existente de favoritos, seleção e episódios não é alterada

  _Requirement refs: 2.1, 2.2, 4.4_

- [ ] 2.1 Adicionar `data-channel-id`, `data-channel-name`, `data-channel-url` na `div.channel-row`

- [ ] 2.2 Inserir `<span class="health-indicator" data-status="${ch.status||'unknown'}" aria-hidden="true"></span>`

---

- [ ] 3. Implementar event listener de busca com debounce

  **Arquivos:** `public/static/app.js`, `public/static/automation.js`

  Conectar o campo `#channel-search` existente ao `state.query` via event listener com debounce de 180ms. Adicionar reset ao trocar playlist e guard para `numBuffer`.

  **Acceptance criteria:**
  - Digitar no `#channel-search` filtra em até 180ms sem request de rede
  - `#channel-count` exibe `(N)`, incluindo `(0)` quando sem resultados
  - Mensagem "Nenhum canal encontrado." ao buscar sem resultado
  - Limpar o campo restaura listagem completa da categoria ativa
  - Trocar playlist limpa campo e `state.query`
  - Busca e filtro de categoria aplicados simultaneamente
  - Teclas numéricas no campo de busca não acionam troca de canal (tvMode)
  - Zero requests de rede durante a operação de filtro

  _Requirement refs: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 4.5_

- [ ] 3.1 Adicionar handler de `input` para `#channel-search` com debounce 180ms em `app.js`

- [ ] 3.2 Adicionar reset de `state.query` e `#channel-search` em `loadChannels()` ao trocar playlist

- [ ] 3.3 Adicionar guard `if (document.activeElement?.id === 'channel-search') return;` no handler de `numBuffer` em `automation.js`

---

- [ ] 4. Implementar `healthModule` em `automation.js` e botão Data Saver

  **Arquivos:** `public/static/automation.js`, `public/static/app.js`

  Criar módulo `healthModule` com IntersectionObserver, batching de probe e toggle de Data Saver. Adicionar botão na toolbar e hooks em `renderChannels()`.

  **Acceptance criteria:**
  - Dots coloridos nos canais com status known ao renderizar
  - Canais `unknown` recebem probe após entrar no viewport (sem Data Saver)
  - Probe em lotes de até 20 canais, delay máximo de 500ms
  - Botão `#btn-data-saver` na toolbar com `aria-pressed` correto
  - Ativar Data Saver cancela probes pendentes
  - Clicar em canal offline inicia playback e transiciona dot para cinza
  - Falha no endpoint: dots cinza, sem toast de erro

  _Requirement refs: 2.1–2.9_

- [ ] 4.1 Implementar `healthModule` com `observe()`, `cancelPending()`, `toggleDataSaver()` em `automation.js`

- [ ] 4.2 Adicionar botão `#btn-data-saver` na `.player-tools` em `playerPage()` (`app.js`)

- [ ] 4.3 Adicionar handler `toggle-data-saver` no switch de ações em `app.js`

- [ ] 4.4 Adicionar hook `healthModule.observe()` no final de `renderChannels()` em `app.js`

---

- [ ] 5. Implementar `epgModule` em `automation.js`

  **Arquivos:** `public/static/automation.js`, `public/static/app.js`

  Criar módulo `epgModule` com EPG_Cache, IntersectionObserver para fetch lazy, renderização cirúrgica de `.epg-inline` e `.epg-next`, e hook em `playChannel()`.

  **Acceptance criteria:**
  - `.epg-inline` com título truncado (40 chars) + `HH:MM – HH:MM` nos canais com EPG
  - Canal sem EPG: sem slot, sem espaço reservado
  - `.epg-next` visível apenas no canal selecionado
  - Cache impede requisição duplicada por sessão
  - Timeout 3000ms via AbortController com `console.warn`
  - Erro de rede com `console.warn`, sem slot visível
  - EPG carregado apenas para a página visível (sem pré-fetch de paginação)
  - Sem re-renderização do `#channel-list` inteiro

  _Requirement refs: 3.1–3.11_

- [ ] 5.1 Implementar `epgModule` com `cache`, `fetchEpg()`, `renderEpgInRow()`, `observeEpg()`, `updateSelectedEpg()` em `automation.js`

- [ ] 5.2 Adicionar hook `epgModule.observeEpg()` no final de `renderChannels()` em `app.js`

- [ ] 5.3 Adicionar hook `epgModule.updateSelectedEpg()` no início de `playChannel()` em `app.js`

---

- [ ] 6. Verificação de integração, DoD final e registro de memória

  **Arquivos:** todos os modificados + `MEMORIA/`

  Validação sintática, checklist de regressão, checklist das novas features, nota Zettelkasten e commit semântico.

  **Acceptance criteria (DoD):**
  - `node --check app.js` e `node --check automation.js` com exit code 0
  - Sem regressão em: login, playlists, favoritos, histórico, relay, paginação, categorias, episódios, dark/light mode
  - Busca, Health Indicator e EPG funcionando conforme especificado
  - Nota `MEMORIA/20261011-sprint-ux-core-v75.md` criada
  - Commit `feat(ux): busca em tempo real, health indicator e EPG inline no player [sprint-v75]`
  - Push para `origin/main`

  _Requirement refs: todos_

- [ ] 6.1 Executar `node --check` nos arquivos JS modificados e corrigir erros

- [ ] 6.2 Verificar checklist de regressão manual (login, playlists, favoritos, relay, paginação, episódios)

- [ ] 6.3 Verificar checklist das novas features (busca, dots, EPG inline)

- [ ] 6.4 Criar nota `MEMORIA/20261011-sprint-ux-core-v75.md` com registro Zettelkasten

- [ ] 6.5 Fazer commit semântico e push para `origin/main`

## Notes

- Nenhum endpoint de backend precisa ser criado. `/api/epg/now` e `/api/automation/probe-speed` já existem.
- `authFetch()` em `automation.js` resolve a URL base para browser, PWA e Android/Capacitor — usar sempre ao invés de `fetch()` direto.
- `CSS.escape()` é necessário ao construir seletores com nomes de canais que podem conter caracteres especiais.
- A busca já filtra por `state.query` em `renderChannels()` — Task 3 apenas conecta o campo HTML ao state.
- O campo `ch.status` já é persistido pelo `streamChecker` no backend — Health Indicator é surfacing no front, não feature nova de backend.
