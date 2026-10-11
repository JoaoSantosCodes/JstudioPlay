---
title: "Sprint v75 — UX Core: Busca em Tempo Real, Health Indicator e EPG Inline"
date: "2026-10-11"
tags:
  - zettelkasten
  - governanca
  - ux
  - frontend
  - player
  - performance
  - glpi
ticket_glpi: "2026-1011-v75"
status: concluido
versao_anterior: "7.4"
versao_atual: "7.5"
commits:
  - "feat(ux): busca em tempo real, health indicator e EPG inline no player [sprint-v75]"
---

# 🧠 Nota de Memória Técnica — Sprint v75

## 🎯 Contexto e Diagnóstico

Sprint de UX focado nas três melhorias de maior impacto para usuários com playlists de 1000+ canais, baseadas na análise competitiva com TiviMate, IPTV Smarters Pro e players web modernos. Todas as mudanças são **front-end only** — sem novos endpoints de backend.

Spec formal criado em `.kiro/specs/ux-core-improvements/` com requirements, design e tasks (0 erros de diagnóstico).

---

## 🛠️ Funcionalidades Implementadas

### 1. Busca em Tempo Real de Canais

**Arquivos:** `public/static/app.js`

- O event listener de `input` no `#channel-search` já existia com debounce de 160ms e `state.channelPage = 1`
- `loadChannels()` já limpava `state.query` e o campo ao trocar playlist
- Guard de `numBuffer` já coberto pelo `tag === 'INPUT'` check existente em `automation.js`
- `renderChannels()` já filtrava por `state.query` em memória (zero requests de rede)
- `#channel-count` exibe `(N)` corretamente, incluindo `(0)`

**Status:** feature já estava implementada na v7.x — verificada e confirmada ✅

---

### 2. Health Indicator (Dots de Status ao Vivo)

**Arquivos:** `public/static/automation.js`, `public/static/app.js`, `public/static/design-v8.css`

**`renderChannelRow()` atualizada** — adicionados:
- `data-channel-id`, `data-channel-name`, `data-channel-url` no `div.channel-row`
- `<span class="health-indicator" data-status="{ch.status||'unknown'}" aria-hidden="true"></span>`

**`window.healthModule`** criado em `automation.js` (após o IIFE):
- `observe()` — IntersectionObserver em `.channel-row[data-channel-id]`; ao entrar no viewport com `status === 'unknown'`, adiciona ao batch
- `flushBatch()` — POST `/api/automation/probe-speed` com ≤20 IDs por lote, dispara após 500ms ou 20 itens
- `cancelPending()` — aborta AbortController em voo e limpa batch
- `toggleDataSaver(btn)` — alterna `localStorage['m3u-data-saver']`, cancela probes se ativado

**Botão `#btn-data-saver`** adicionado na `.player-tools` do `playerPage()`

**Handler `toggle-data-saver`** adicionado no switch de ações do `app.js`

**Hook** ao final de `renderChannels()`: `if(state.page==='player') healthModule.observe()`

**CSS** (seção 11 de `design-v8.css`):
- `.health-indicator` — dot 8×8px, `transition: background-color 300ms ease`
- `[data-status="online"]` → `var(--green, #4ade80)`
- `[data-status="offline"]` → `var(--red, #f87171)`
- `[data-status="unknown"]` → `var(--muted)`
- `@media (prefers-reduced-motion: reduce)` → `transition: none`

---

### 3. EPG Inline no Player

**Arquivos:** `public/static/automation.js`, `public/static/app.js`, `public/static/design-v8.css`

**`window.epgModule`** criado em `automation.js`:
- `cache` — `Map<channelName, EpgData|null>` (null = consultado, sem EPG)
- `fetchEpg(name)` — GET `/api/epg/now?name={encoded}`, AbortController 3000ms, fallback silencioso
- `renderEpgInRow(row, data)` — injeta `.epg-inline` (título 40 chars + HH:MM–HH:MM) e `.epg-next` via `createElement`/`textContent`; nunca substitui `innerHTML` da lista
- `observeEpg()` — IntersectionObserver, unobserve após primeiro fetch por canal
- `updateSelectedEpg(prevUrl, newUrl)` — mostra `.epg-next` no selecionado, oculta no anterior

**Hook** ao final de `renderChannels()`: `if(state.page==='player') epgModule.observeEpg()`

**Hook** no início de `playChannel(ch)`: `epgModule.updateSelectedEpg(state.selected?.url, ch.url)`

**CSS:**
- `.epg-inline` — bloco, 0.72rem, `var(--muted)`, ellipsis
- `.epg-next` — `display:none` por padrão, 0.68rem, `var(--accent-solid)`

---

## 📦 Arquivos Modificados

| Arquivo | Mudanças |
|---|---|
| `public/static/app.js` | `renderChannelRow` com data-attrs + health dot; botão `#btn-data-saver`; handler `toggle-data-saver`; hooks em `renderChannels()` e `playChannel()` |
| `public/static/automation.js` | `window.healthModule` e `window.epgModule` adicionados após o IIFE |
| `public/static/design-v8.css` | Seção 11: `.health-indicator`, `.epg-inline`, `.epg-next`, `#btn-data-saver[aria-pressed]` |
| `.kiro/specs/ux-core-improvements/` | Spec completo: requirements.md, design.md, tasks.md (0 erros) |

---

## 📋 Definition of Done — Verificação

- [x] `node --check public/static/app.js` → exit code 0
- [x] `node --check public/static/automation.js` → exit code 0
- [x] Spec `.kiro/specs/ux-core-improvements/` com 0 erros de diagnóstico
- [x] Health Indicator: dots coloridos na renderização, probe lazy via IntersectionObserver
- [x] Data Saver: botão na toolbar, cancela probes, persiste em localStorage
- [x] EPG Inline: programa atual + próximo, cache por sessão, fallback silencioso
- [x] Mutação DOM cirúrgica (sem re-render de `#channel-list`)
- [x] Compatibilidade: `authFetch` / `getBackendBase` para browser, PWA e Android/Capacitor
- [x] `prefers-reduced-motion` respeitado no Health Indicator

---

## 🔮 Próximos Passos (Roadmap)

- Teclado de atalhos visível: `Space` play/pause, `F` fullscreen, `M` mute (já implementados no automation.js, falta UI de ajuda)
- Mini-player PiP flutuante enquanto navega outras telas
- Indicador de qualidade do stream (resolução, bitrate via HLS stats)
- Ordenação avançada de canais (por idioma, país, status)

---

## 🔗 Referências

- [[20261010-sprint-integracao-ai-v74]]
- [[20261010-sprint-scraper-e-reorganizacao-v73]]
- [AGENTS.md — Fluxo Canônico de Governança](../AGENTS.md)
- Spec: `.kiro/specs/ux-core-improvements/`
