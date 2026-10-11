---
title: "Sprint v77 — Redesign IPTV Smart TV Pro Suite: Especificação Canônica 21 Seções (Dark Mode, D-Pad, 9 Itens Sidebar, Tri-Panel, Catálogo 4K, Teclado Virtual & PIN Pad)"
date: "2026-10-11"
tags:
  - zettelkasten
  - governanca
  - ux
  - redesign
  - frontend
  - iptv
  - smart-tv
  - d-pad
  - poppins
  - glpi
ticket_glpi: "2026-1011-IPTV-REDESIGN"
status: concluido
versao_anterior: "7.6"
versao_atual: "7.7.2"
commits:
  - "feat(ui): redesign completo IPTV Smart TV Pro — especificacao de 21 secoes, 9 itens sidebar, tri-panel live tv, catalogo filmes/series, teclado virtual e parental PIN [sprint-v77]"
---

# 🧠 Nota de Memória Técnica — Sprint v77 (IPTV Smart TV Pro Suite)

## 🎯 Contexto e Diretrizes Arquiteturais

Implementação integral da especificação de 21 seções para aplicativos **IPTV Smart TV** (Android TV, Google TV e dispositivos compatíveis, 1920×1080 px Full HD, Dark Mode).

### 🎨 Tokens & Identidade Visual
- **Tipografia**: Poppins (Google Fonts: 400, 500, 600, 700, 800).
- **Paleta de Cores**:
  - Fundo primário: `#141414`
  - Fundo secundário: `#0B0F14`
  - Cards & superfícies: `#1E1E1E`
  - Elementos elevados: `#252B33`
  - Bordas: `#2E2E2E`
  - Acento Principal: `#E50914`
  - Foco/Destaque: `#FF1726` com `box-shadow: 0 0 16px rgba(229, 9, 20, 0.45)`
  - Indicador de Sucesso: `#22C55E`
- **Arredondamento de Bordas**: Cards `12px`, Botões `10px`, Campos `8px`, Modais `16px`.
- **Safe Area**: Margem segura de 5% horizontal e vertical contra overscan de televisores.
- **Navegação D-Pad**: Suporte total a controle remoto com `tabindex="0"`, anéis de foco visíveis e atalhos direcionais sem dependência de cursor de mouse.

---

## 📺 Estrutura dos 12 Módulos e Telas Implementadas

1. **Tela de Autenticação (`#/login`)**:
   - Split-screen com branding IPTV à esquerda e abas de acesso (*Xtream Codes API* com campos Servidor/Usuário/Senha e *M3U URL*).
   - Indicador de status do servidor e máscara de segurança para credenciais.

2. **Sidebar de Navegação Principal (9 Itens Oficiais)**:
   - Menu lateral persistente com ícones e labels:
     1. `Início` (`#/dashboard`)
     2. `TV Ao Vivo` (`#/live`)
     3. `Filmes` (`#/movies`)
     4. `Séries` (`#/series`)
     5. `Canais` (`#/channels`)
     6. `Gravações` (`#/recordings`)
     7. `EPG` (`#/epg`)
     8. `Favoritos` (`#/favorites`)
     9. `Configurações` (`#/settings`)
     + Botão `Sair` no rodapé inferior.

3. **Dashboard Principal (`#/dashboard`)**:
   - Hero banner cinematográfico ao vivo (*Campeonato Brasileiro: Flamengo x Palmeiras* com badge `LIVE` pulsante e botão de ação *"Assistir Agora"*).
   - Trilho de TV Ao Vivo com cards widescreen (16:9), nomes dos canais e barra de progresso vermelha em tempo real.
   - Trilhos verticais de pôsteres (2:3) para Filmes e Séries em alta.

4. **TV Ao Vivo — Layout Tri-Painel (`#/live` e `#/channels`)**:
   - **Coluna 1 (Categorias)**: 260px com lista de gêneros e badges numéricos de canais.
   - **Coluna 2 (Canais)**: 340px com cards numerados, logos oficiais e programas em exibição.
   - **Coluna 3 (Player Preview)**: Container de reprodução contínua, badge `AO VIVO`, metadados detalhados, card "A Seguir" e botão de expansão em tela cheia.

5. **Catálogo de Filmes (`#/movies`)**:
   - Barra de filtros por gênero em formato de pílulas (*Todos, Ação, Aventura, Comédia, Drama, Terror, Ficção científica, Animação, Documentários*).
   - Grid responsivo de pôsteres com badges de resolução (*4K*, *1080p*), título e metadados.
   - Modal de detalhes de filme com sinopse, classificação indicativa e botões de reprodução/favoritar.

6. **Catálogo de Séries (`#/series`)**:
   - Exibição em grade de pôsteres cinematográficos, contagem de temporadas/episódios e navegação hierárquica.

7. **Guia de Programação EPG (`#/epg`)**:
   - Rota direta com régua de horários horizontal e blocos de programas sincronizados em grade temporal.

8. **Busca & Teclado Virtual (`#/search`)**:
   - Barra de busca superior com ícone e auto-focus.
   - Teclado virtual D-Pad formatado em grade de 6 colunas (A-F, G-L, M-R, S-X, Y-3, 4-9) e teclas de comando (*Espaço*, *⌫ Apagar*, *Limpar*).
   - Área de resultados dinâmicos com filtragem instantânea de canais.

9. **Meus Favoritos (`#/favorites`)**:
   - Filtros de abas (*Todos*, *Canais*, *Filmes*, *Séries*) e estado vazio ilustrado com atalho para a TV Ao Vivo.

10. **Gravações & Histórico (`#/recordings`)**:
    - Central de agendamentos e registros de reprodução recente.

11. **Configurações Smart TV (`#/settings`)**:
    - Menu lateral com 7 categorias oficiais (*Conta*, *Player Engine*, *Legendas*, *EPG*, *Controle Parental*, *Teste de Rede*, *Informações*).
    - Teclado numérico PIN Pad de 4 dígitos para Controle Parental.
    - Teste de velocidade de rede e latência com diagnóstico em tempo real.

12. **Cache-Busting & PWA**:
    - Versão do Service Worker e das tags de estilo atualizada para `v=7.7.2` garantindo sincronização instantânea em navegadores de Smart TV e PWA.

---

## 📦 Arquivos Modificados e Impactados

| Arquivo | Descrição das Modificações |
|---|---|
| `public/static/design-v8.css` | Adição das Seções 15 e 16 com tokens oficiais PRD, sidebar 9-itens, tri-panel, catálogo 4K, teclado virtual e pin pad |
| `public/static/app.js` | Implementação de todas as rotas Smart TV, `pageNames` atualizado, teclado virtual interativo, seletores e preview ao vivo |
| `public/index.html` | Integração do Google Fonts Poppins e atualização das queries de assets para `v=7.7.2` |
| `public/sw.js` | Atualização do cache PWA para `jstudioplay-cache-v7.7.2` |
| `MEMORIA/20261011-sprint-iptv-redesign-v77.md` | Registro canônico Zettelkasten Obsidian |

---

## 🧪 Definition of Done (DoD) & Validação de Qualidade

- [x] **Sintaxe validada**: `node --check public/static/app.js` retorna código 0.
- [x] **100% de testes verdes**: `npm test` (`scripts/test_system.js`) passou com 7/7 suítes aprovadas (Autenticação, Sessão, M3U Parse, CORS Relay, Validador assíncrono e Exportador M3U).
- [x] **Inspeção visual em navegador**: Telas validadas via navegador na porta 3005 (`#/dashboard`, `#/live`, `#/movies`, `#/search`, `#/settings`).
- [x] **Blindagem IAM**: Credenciais estritamente restritas a `CREDENCIAIS/.env`.
- [x] **Rastreabilidade GLPI**: Mudança vinculada ao chamado de governança `2026-1011-IPTV-REDESIGN`.
