# ⚡ Registro Técnico Zettelkasten: Comunicação Reativa entre Componentes (EventBus) & Estética Cinemática (v8.3.3)

- **ID:** `20261025-eventbus-estetica-componentes-v833`
- **Data/Hora:** 2026-10-25 21:56 BRT
- **Chamado GLPI Vinculado:** `CHAMADO-GLPI-2026-1025-008`
- **Versão:** `v8.3.3`
- **Tags:** `#jstudioplay #eventbus #components #ui-ux #glassmorphism #equalizer #nowplaying #volume-slider #zettelkasten`

---

## 1. Contexto & Motivação Técnica

Atendendo à demanda de aprimoramento da **estética e comunicação dos componentes**, eliminamos acoplamentos rígidos e sincronizações manuais no front-end Vanilla JS:
1. **Comunicação Inter-Componentes Desacoplada (`window.eventBus`)**:
   - Criação de um barramento de eventos pub/sub reativo universal (`on`, `off`, `emit`).
   - Ciclo de eventos de reprodução canônico:
     * `playback:started`: Transmite o título e o tipo da mídia (`live` ou `vod`) para a TopBar, ativando a pílula flutuante *Now Playing* com equalizador animado.
     * `playback:progress`: Transmite posição, duração e percentual em tempo real. Atualiza diretamente as barras de progresso `.iptv-ref-continue-bar` dos cards "Continuar Assistindo" no Dashboard sem recarregar a tela.
     * `playback:stopped`: Desativa o indicador na TopBar e limpa o estado de reprodução.
     * `volume:changed`: Sincroniza o nível de volume e mute entre diferentes controles da UI.
2. **Estética de Alta Fidelidade (Glassmorphism & Microanimações)**:
   - **Pílula Now Playing na TopBar**: Exibição translúcida com `backdrop-filter: blur(12px)`, animação CSS pura `@keyframes soundBars` de equalizador de áudio e atalho instantâneo para voltar à mídia em reprodução (`resume-current-playing`).
   - **Slider de Volume Glass no Theater VOD**: Container arredondado com efeito de vidro fumê, ícone dinâmico e slider horizontal responsivo integrado a `v.volume` e `v.muted`.
   - **Badge Dinâmico de Resolução**: OSD do VOD inspeciona `video.videoWidth` no `loadedmetadata` e exibe badges específicos (`4K UHD` com glow degradê, `1080p FHD`, `720p HD`).

---

## 2. Arquitetura das Alterações

### 2.1 Front-End (`public/static/app.js`)
- Inicialização do `window.eventBus` com tolerância a falhas.
- Emissão em `playChannel(ch)`, `openVodTheater(target)`, `stopPlayback(save)` e `closeVodTheater()`.
- Listener de progresso reativo atualizando o DOM dos cards "Continuar Assistindo".
- Header do Theater enriquecido com `#vod-res-badge` e slider `#vod-volume-slider`.
- Centro da TopBar atualizado com `#topbar-now-playing-container` e `#topbar-now-playing-title`.

### 2.2 Design System (`public/static/design-v8.css`)
- Seção 26:
  - `.iptv-topbar-now-playing`, `.topbar-equalizer`, `.eq-bar`, `@keyframes soundBars`.
  - `.iptv-vod-volume-wrap`, `.iptv-vod-volume-slider`.
  - `.vod-res-badge`, `.vod-res-badge.badge-4k`.

### 2.3 Suíte de Testes Automatizada (`scripts/test_components_v833.js`)
- 18 testes automatizados cobrindo EventBus, disparo de eventos, integridade do equalizador, volume slider e cache-busting.

---

## 3. Validação e Definition of Done (DoD)

- **Total de Suítes Executadas:** 8
- **Total de Testes:** 144
- **Status:** **100% Aprovados (144 PASS | 0 FAIL)**
- **Containers Docker:** `mcp_jstudioplay` operacional e saudável (`Up (healthy)`).
- **Segurança IAM:** Sem vazamento de credenciais; credenciais blindadas em `CREDENCIAIS/.env`.
- **Status do Chamado GLPI:** Concluído com sucesso.
