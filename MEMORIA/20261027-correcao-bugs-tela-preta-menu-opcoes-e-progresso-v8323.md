# 🏛️ REGISTRO CANÔNICO DE GOVERNANÇA: RESOLUÇÃO DOS 3 BUGS CRÍTICOS (v8.3.23)

- **Data / Timestamp:** 2026-10-27T21:14:00-03:00
- **Versão:** v8.3.23 (Android versionCode `15`)
- **Tipo:** Fix Arquitetural, Resiliência de Streaming e UX de Modais
- **Status:** 100% Validado, Testes Verdes e Pacotes Compilados

---

## 📋 Diagnóstico dos 3 Problemas Reportados pelo Usuário

### 1. "Alguns filmes ficam estáticos em uma tela preta"
- **Causa Raiz:** No Android WebView / navegadores, fluxos VOD (.mp4, .mkv, .m3u8) que sofriam latência de handshake upstream, restrição de CORS em conexão direta ou headers específicos do provedor entravam em estado `waiting` ou `stalled` sem disparar `onerror` imediato. O elemento `#video-empty` permanecia oculto dentro do `#vod-theater`, deixando o usuário sem feedback visual em um retângulo preto congelado.
- **Solução Canônica Implementada:**
  1. Criação do componente visual `iptv-vod-buffering-hud` sobre o player de vídeo, com spinner pulsante Netflix (`.iptv-spinner-ring`), status text dinâmico e botões de ação ("⚡ Modo Alternativo" e "✕ Voltar").
  2. Implementação de **Watchdog de Streaming Inteligente** (6s) em `openVodTheater`. Se o vídeo não iniciar o playback (`v.currentTime === 0` e não pausado), o watchdog detecta o congelamento, notifica o usuário ("A rota direta demorou. Ativando Modo de Compatibilidade...") e ativa automaticamente o Relay `/proxy/stream?url=...` com recarregamento transparente.
  3. Tratamento explícito de `onwaiting`, `onstalled` e `onerror` com feedback imediato ao usuário.

---

### 2. "Quando clica nos 3 pontos você só consegue sair se selecionar algo na aba"
- **Causa Raiz:** O elemento `<dialog id="modal">` nativo não possuía listener de Backdrop Click. O usuário ao tocar na área escura ao redor do modal/aba não conseguia fechá-lo. Além disso, os cards de Continuar Assistindo disparavam ações confusas nos 3 pontos verticais sem disponibilizar opções explícitas de cancelamento.
- **Solução Canônica Implementada:**
  1. Criação da função `setupModalGlobalListeners()` com fechamento instantâneo via **Backdrop Click** (`e.target === modal`) para qualquer modal ou bottom-sheet do sistema.
  2. Suporte a **Swipe Down / Arraste para Baixo** na barra de alça móvel (`.iptv-sheet-handle-bar`).
  3. Criação da função dedicada `openContinueOptions(title)` para o botão de 3 pontos (`⋮`), exibindo menu suspenso com as opções: Continuar Assistindo, Ver Detalhes, Assistir do Início, Remover do Histórico e botão destacado **"✕ Cancelar / Fechar"**.

---

### 3. "Essa outra tela não contabiliza o tempo de filme e nem aonde você parou"
- **Causa Raiz:** A função `currentProgress(ch)` consultava estritamente `state.progress` exigindo igualdade de `p.playlistId === state.activePlaylist` e `p.channel.url === ch.url`. Como itens vindos do catálogo, dashboard ou histórico muitas vezes possuíam chaves normalizadas ou playlists distintas, a busca retornava `null`. Consequentemente, o modal `openVodModal` exibia apenas "Assistir Agora" sem a barra vermelha, sem a minutagem de onde parou e sem restaurar a reprodução do ponto exato.
- **Solução Canônica Implementada:**
  1. Motor unificado de persistência multi-camadas: `getStoredProgress(item)`, `setStoredProgress(item, pos, dur)` e `removeStoredProgress(item)`, indexando tanto em `localStorage` sob a chave `jstudio_play_vod_progress_v1` quanto em `state.progress` e na API `/progress`.
  2. Normalização fonética e remoção de caracteres especiais para match resiliente por URL e por Título.
  3. No modal de detalhes do filme (`openVodModal`): exibição do banner de progresso `.iptv-modal-progress-banner` com porcentagem, minutagem onde parou (`⏱️ Parou em 35:12 de 1h 48m`) e tempo restante (`Restam 42 min`), além dos botões de ação:
     - `▶ Continuar de MM:SS` (com restauração automática no player via `v.currentTime = savedProg.position` e toast informativo).
     - `↺ Do Início` (recomeçar no segundo 0).
     - `✕ Fechar`.
  4. Salvamento contínuo durante a reprodução a cada 3 segundos, no evento `pause`, `ended` e no fechamento do theater (`closeVodTheater`).

---

## 📦 Artefatos Produzidos & Validação
- **Testes Automatizados:** `scripts/test_fixes_v8323.js` aprovado com 100% de sucesso.
- **Container Docker:** Sincronizado (`public/static/app.js`, `public/static/design-v8.css`, `public/index.html`).
- **Pacotes Compilados & Assinados:**
  - `dist-android/JstudioPlay-v8.3.23.apk` (3.701.081 bytes)
  - `dist-android/JstudioPlay-v8.3.23.aab` (3.558.257 bytes)
