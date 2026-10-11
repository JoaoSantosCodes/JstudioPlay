---
title: "Sprint v77 — Redesign IPTV Pro Suite: Login Cinemático, Dashboard Live, EPG Timeline e Settings Smart TV"
date: "2026-10-11"
tags:
  - zettelkasten
  - governanca
  - ux
  - redesign
  - frontend
  - iptv
  - epg
  - smart-tv
  - glpi
ticket_glpi: "2026-1011-IPTV-REDESIGN"
status: concluido
versao_anterior: "7.6"
versao_atual: "7.7"
commits:
  - "feat(ui): redesign completo IPTV Pro suite — login cinemático, dashboard live com trilhos, EPG timeline horizontal e settings smart TV [sprint-v77]"
---

# 🧠 Nota de Memória Técnica — Sprint v77

## 🎯 Contexto e Diagnóstico

Alinhamento estético e funcional de alta fidelidade com o design system de Smart TV/IPTV de referência.
O layout foi decomposto e reconstruído em 4 visões canônicas integradas:
1. **Tela de Login Cinemática**: Split screen com branding, logo 3D, lista de 5 recursos (*TV Ao Vivo, Filmes, Séries, EPG, Configurações*) e card à direita com abas de autenticação (*Xtream Codes API* e *M3U URL*).
2. **Dashboard Principal**: Topbar escura com pílulas de navegação, relógio digital ao vivo, **Hero Banner esportivo ao vivo** (*Campeonato Brasileiro / Flamengo x Palmeiras* com badge `LIVE` pulsante e botão *"Assistir Agora"*), trilho de **TV Ao Vivo** com cards widescreen e barra de progresso vermelha no rodapé, e trilhos verticais 2:3 de **Filmes** e **Séries**.
3. **Guia de Programação (EPG)**: Rota direta `#epg` com sidebar esquerda de categorias categorizadas com badges numéricos (*Todos os Canais, Esportes, Filmes, Séries, Notícias...*) e grade timeline horizontal com régua de horários e blocos de programas sincronizados.
4. **Central de Configurações Smart TV**: Rota `#settings` com layout dual TV (*Conta, Player Engine, Legendas, EPG, Controlo Parental, Teste de Rede*) e painel direito de opções com switches toggles vermelhos e seletores com setas `>`.

---

## 🛠️ Funcionalidades Implementadas

### 1. Seção 15 do Design System (`design-v8.css`)
- **Tokens IPTV**: `--iptv-bg: #0b0c10`, `--iptv-surface: #12141a`, `--iptv-red: #e50914`, `--iptv-red-glow: rgba(229, 9, 20, 0.35)`.
- Componentes:
  - `.iptv-login-wrapper`, `.iptv-login-grid`, `.iptv-features-menu`, `.iptv-login-card`
  - `.iptv-dash-topbar`, `.iptv-hero-wrap`, `.iptv-live-badge`, `.iptv-hero-btn-play`
  - `.iptv-channel-card` com `.iptv-card-progress` e `.iptv-card-progress-bar`
  - `.iptv-poster-card` para trilhos de Filmes e Séries
  - `.iptv-epg-page`, `.iptv-epg-sidebar`, `.iptv-epg-time-ruler`, `.iptv-epg-prog-block`
  - `.iptv-settings-page`, `.iptv-settings-nav`, `.iptv-setting-row`, `.iptv-toggle-switch`

### 2. Motor de Apresentação e Handlers (`app.js`)
- `getIptvClock()`: Relógio digital em tempo real.
- `iptvTopBar(active)`: Header horizontal de Smart TV com tabs e atalhos.
- `loginPage()`: Split layout com abas Xtream Codes e M3U URL.
- `dashboard()`: Hero banner ao vivo e trilhos de conteúdo.
- `epgPage()`: Grade temporal horizontal com categorias.
- `settings(activeTab)`: Central de ajustes com navegação interativa pelas 6 seções.
- Handlers adicionados: `open-first-live`, `iptv-tab`, `iptv-settings-tab`, `iptv-epg-cat`, `filter-cat`.
- Integração de `epg` no roteador `renderRoute()` e no dicionário `pageNames`.

---

## 📦 Arquivos Modificados

| Arquivo | Mudanças |
|---|---|
| `public/static/design-v8.css` | Adição da Seção 15 completa com todas as classes da IPTV Pro Suite |
| `public/static/app.js` | Funções `getIptvClock`, `iptvTopBar`, `loginPage`, `dashboard`, `epgPage`, `settings` e novos event handlers |
| `MEMORIA/20261011-sprint-iptv-redesign-v77.md` | Registro canônico Zettelkasten Obsidian |

---

## 📋 Definition of Done — Verificação

- [x] Sintaxe de `app.js` validada com `node --check` (exit 0)
- [x] Testes de regressão do sistema (`npm test`) com 100% de sucesso
- [x] Fidelidade visual com as 4 telas da imagem de referência
- [x] Suporte total a navegação desktop, mobile e Smart TV D-Pad
- [x] Registro formal de governança em `MEMORIA/`
