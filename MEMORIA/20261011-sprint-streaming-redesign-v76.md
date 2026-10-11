---
title: "Sprint v76 — Streaming Redesign: Hero Banner, Carrossel e Cards de Poster"
date: "2026-10-11"
tags:
  - zettelkasten
  - governanca
  - ux
  - redesign
  - frontend
  - player
  - streaming
  - glpi
ticket_glpi: "2026-1011-v76"
status: concluido
versao_anterior: "7.5"
versao_atual: "7.6"
commits:
  - "feat(ui): redesign streaming — hero banner, carrossel de cards e topbar minimalista [sprint-v76]"
---

# 🧠 Nota de Memória Técnica — Sprint v76

## 🎯 Contexto e Diagnóstico

Redesign visual total da página player no estilo "streaming app" (referência: Playbox/TiviMate/Netflix). O layout anterior era uma lista vertical de texto em dois painéis. O novo layout usa hero banner fullwidth, carrossel horizontal de cards com poster, tabs de categoria e topbar minimalista — sem sidebar no modo player.

Todas as mudanças são **front-end only**. A lógica de reprodução (`playChannel`, HLS.js, relay, EPG, health indicator) permanece intacta.

---

## 🛠️ Funcionalidades Implementadas

### Layout Geral — `.player-streaming-page`

- **Topbar minimalista** — logo + tabs de playlist + busca inline + ícones de ação
- **Hero banner** com backdrop blurred do logo do canal atual, gradiente overlay, título, badge de tipo (AO VIVO/FILME/SÉRIE) e botões de ação (Assistir, Favoritar)
- **Vídeo integrado no hero** — quando canal selecionado, o `<video>` entra no hero banner com controles flutuantes
- **Tabs de categoria** (`streaming-cat-btn`) substituem os chips anteriores — scroll horizontal, estilo pill
- **Carrossel por seção** — cada categoria vira uma section com `streaming-carousel` (scroll-snap, overflow-x)
- **Cards de canal** (`channel-card`) — poster 2:3, fallback colorido com inicial, badge de tipo, health dot, hover com play overlay
- **Now Playing Bar** — barra fixa no rodapé com thumbnail, nome, grupo e ações de controle
- **Sidebar e topbar ocultos** no modo player via `.player-mode` no shell

### Novas Funções JS (`app.js`)

| Função | Descrição |
|---|---|
| `renderChannelCard(ch, i)` | Gera HTML do card de poster para o carrossel |
| `renderStreamingSections()` | Agrupa canais por categoria e renderiza carrosséis; favoritos e recentes em destaque |
| `updateStreamingHero(ch)` | Atualiza hero banner, now bar e botão de favorito quando canal muda |

### Novos Handlers de Ação

- `switch-playlist` — troca de playlist via tab na topbar
- `hero-play` — reproduz o canal do hero (selecionado ou primeiro)
- `hero-favorite` — favorita/desfavorita o canal do hero
- `load-more-section` — seleciona categoria ao clicar em "Ver todos"

### CSS — Seção 12 de `design-v8.css` (792 linhas novas)

| Bloco | Descrição |
|---|---|
| 12.1 | Shell sem sidebar no modo cinema |
| 12.2 | Hero banner com backdrop blur |
| 12.3 | Vídeo integrado ao hero |
| 12.4 | Tabs de categoria horizontal |
| 12.5 | Seções de carrossel |
| 12.6 | Cards de canal (poster style) |
| 12.7 | Now Playing Bar (rodapé fixo) |
| 12.8 | Estados vazios e load more |
| 12.9 | Responsivo (760px, 480px) |
| 12.10 | Override de layout (`:has(.player-streaming-page)`) |

---

## 📦 Arquivos Modificados

| Arquivo | Mudanças |
|---|---|
| `public/static/app.js` | `playerPage()` reescrita; `renderChannelCard()`, `renderStreamingSections()`, `updateStreamingHero()` novos; handlers `switch-playlist`, `hero-play`, `hero-favorite`, `load-more-section`; `renderRoute()` com toggle `.player-mode`; `backToChannels()` com now bar update |
| `public/static/design-v8.css` | Seção 12 completa (992 novas linhas) |

---

## 📋 Definition of Done — Verificação

- [x] `node --check app.js` → exit 0
- [x] `node --check automation.js` → exit 0
- [x] Hero banner renderiza com backdrop do canal selecionado
- [x] Carrossel por categoria com cards de poster
- [x] Favoritos e recentes em seção de destaque
- [x] Sidebar oculta no modo player (`.player-mode`)
- [x] Topbar minimalista com tabs de playlist
- [x] Now playing bar no rodapé
- [x] `playChannel()` / EPG / health indicator preservados
- [x] IDs obrigatórios preservados (`#video`, `#video-empty`, `#now-name`, etc.)

---

## 🔮 Próximos Passos

- Animação de transição ao trocar canal (hero crossfade)
- Barra de progresso EPG nos cards
- Integração TMDB para poster arts de filmes/séries (quando disponível)
- Modo TV: navegação por D-pad nos cards do carrossel

---

## 🔗 Referências

- [[20261011-sprint-ux-core-v75]]
- [AGENTS.md — Fluxo Canônico de Governança](../AGENTS.md)
- Referência visual: Playbox UI (@mrfarahzad), TiviMate
