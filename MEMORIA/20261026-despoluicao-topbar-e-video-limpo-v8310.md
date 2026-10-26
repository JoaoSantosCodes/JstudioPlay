# 🎬 Registro Técnico Zettelkasten: Despoluição do Layout & Player de Vídeo Limpo (v8.3.10)

- **Data / Timestamp:** 2026-10-26T04:18:00-03:00
- **Versão do Sistema:** `v8.3.10`
- **Autor / Agente:** Antigravity (Protocolo Canônico de Governança Multi-Agente)
- **Tags:** `#ui-ux` `#clean-layout` `#video-player` `#vod-theater` `#despoluicao` `#zettelkasten`

---

## 1. Contexto & Diagnóstico da Demanda

O usuário apontou dois problemas visuais que comprometiam a experiência cinematográfica do aplicativo:
1. **Poluição na TopBar:** O badge central da playlist carregada (`.iptv-topbar-pl-badge`), exibindo `● ATIVA ⚡ TurboX IPTV Pro...`, ocupava espaço central excessivo no cabeçalho e poluía a navegação.
2. **Deformação do Player de Vídeo:** Ao iniciar a reprodução de um vídeo, o container `#video-empty` exibia a mensagem *"Carregando transmissão... Aguardando dados da fonte..."*, sendo renderizado como um item `inline flex` horizontal que espremia o elemento `<video>` em uma coluna escura vertical no canto direito da tela.

---

## 2. Decisões Arquiteturais e Implementação

### 2.1 Despoluição da TopBar
- **Remoção Estrutural:** O elemento `#topbar-pl-badge` foi removido do centro da TopBar em [app.js](file:///d:/Area%20de%20Desenvolvimento/Apps/JstudioPlay/public/static/app.js).
- **Proteção CSS Definitiva:** Em [design-v8.css](file:///d:/Area%20de%20Desenvolvimento/Apps/JstudioPlay/public/static/design-v8.css), a classe `.iptv-topbar-pl-badge` recebeu `display: none !important;`, assegurando que em qualquer cenário o badge permaneça oculto e o layout do cabeçalho fique limpo e focado na marca e nas ações diretas.

### 2.2 Eliminação da Coluna Lateral no Player de Vídeo (VOD Theater)
- **Eliminação de Mensagens Prematuras:** As chamadas invasivas a `playerMessage('Carregando…')` e `playerMessage('Carregando transmissão…')` durante a inicialização em `playChannel` e no evento `v.onwaiting` foram inibidas para o modo VOD Theater em [app.js](file:///d:/Area%20de%20Desenvolvimento/Apps/JstudioPlay/public/static/app.js).
- **Ocultação Garantida:** Ao iniciar o playback, foi adicionada a garantia explícita `if($('#video-empty')) $('#video-empty').hidden = true;`.
- **Overlay Absoluto:** No arquivo [design-v8.css](file:///d:/Area%20de%20Desenvolvimento/Apps/JstudioPlay/public/static/design-v8.css), `#video-empty` dentro de `.iptv-vod-video-wrapper` foi configurado como overlay absoluto (`position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; z-index: 20 !important;`), eliminando qualquer possibilidade de quebrar o fluxo `flex` horizontal e deformar o vídeo em coluna lateral.

---

## 3. Matriz de Testes & Validação DoD

- **Suíte de Testes Automatizados:** 14 suítes executadas com 100% de aprovação (0 falhas) via `docker exec mcp_jstudioplay npm test`.
- **Suíte Canônica Dedicada:** [test_clean_player_v8310.js](file:///d:/Area%20de%20Desenvolvimento/Apps/JstudioPlay/scripts/test_clean_player_v8310.js) validando versionamento, ausência do badge na TopBar e ausência de deformação do player de vídeo.
- **Validação Visual no Navegador:** Confirmada visualmente por subagente autônomo nas rotas `#/movies` e `#/dashboard`:
  - TopBar limpa e equilibrada sem o badge de lista ativa.
  - VOD Theater em largura completa (100% edge-to-edge), sem coluna preta à direita.
