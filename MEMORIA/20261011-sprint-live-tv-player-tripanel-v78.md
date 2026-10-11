# 📺 Memória Técnica: Integração do Video Player Engine HLS no Tri-Painel Live TV (v7.8.0)

- **ID do Zettelkasten:** `20261011042300`
- **Data/Hora:** 2026-10-11 04:23 BRT
- **Autor / Agente:** Antigravity Tech Lead & SRE Governance
- **Status:** ✅ Concluído e Validado (100% Green Tests & Live Video Playback Verificado)
- **Tags:** #iptv #video-player #hls #smart-tv #tri-panel #sqlite #cache-busting #glpi

---

## 🎯 Contexto e Diagnóstico

O usuário reportou que ao acessar a tela de **TV Ao Vivo** (`#/live`), os canais não estavam iniciando o player de vídeo ("ainda não carrega o paly"). 

### Causas Raízes Identificadas:
1. **Ausência da tag `<video id="video">` no DOM do Tri-Painel:** A Coluna 3 continha apenas um placeholder estático com imagem Unsplash de fundo, sem o elemento `<video>` nativo para o motor `Hls.js` acoplar (`instance.attachMedia(v)`).
2. **Ciclo de Vida de Canais Desconectado:** `loadChannels()` só era disparado na rota legada `#/player`, deixando `state.channels` vazio quando o usuário entrava diretamente em `#/live`.
3. **Lookup de Canal Restritivo:** O evento `select-live-ch` e o autoplay de rota verificavam estritamente `state.channels[idx]`. Quando um fallback era utilizado ou a lista ainda carregava, `ch` retornava `undefined`, cancelando a execução de `playChannel()`.
4. **Cache Agressivo de Service Worker / Assets:** A versão `v=7.7.5` estava retida na memória cache do navegador do cliente, necessitando do incremento para `v=7.8.0` e headers `no-cache, no-store, must-revalidate`.
5. **Corrupção Transitória do SQLite pós-interrupção:** A base SQLite de raspagem sofreu desligamento forçado com WAL aberto, que foi corrigido e remontado a partir do `db.json`, com suite de testes 100% verde (`7/7`).

---

## 🛠️ Modificações Realizadas

### 1. Engine de Vídeo no Tri-Painel (`public/static/app.js`)
- **Coluna 3 (Preview):** Implementada tag de alta fidelidade:
  ```html
  <video id="video" playsinline controls autoplay style="width:100%; height:100%; object-fit:contain; background:#000; z-index:1;"></video>
  <div id="video-empty" role="status" aria-live="polite" ... hidden></div>
  <span class="iptv-live-badge" id="video-live"><span class="iptv-live-dot"></span> AO VIVO</span>
  ```
- **Fallback e Pool Unificado:** Armazenamento de `window._liveChannels = allChs` permitindo fallback imediato e resolução resiliente em `select-live-ch` e `reconnect-live`.
- **Autoplay em `renderRoute()`:** Inicialização automática do primeiro canal ou do canal ativo após montagem da rota.
- **Botões Funcionais:** Botão "Tela Cheia" (`fullscreen-live`) com acionamento de Fullscreen API e botão "Reconectar" (`reconnect-live`) para restauração de buffer.

### 2. Cache Busting e Service Worker (`public/index.html` e `public/sw.js`)
- Incremento de versão para `v=7.8.0` em todos os bundles (`app.js`, `styles.css`, `design-v8.css`, `automation.js`).
- Atualização do nome de cache do Service Worker para `jstudioplay-cache-v7.8.0`.

### 3. Servidor e Credenciais (`server/index.js` e `CREDENCIAIS/.env`)
- Configuração de `PORT=3005` mantida de forma segura no cofre blindado `CREDENCIAIS/.env`.
- Headers HTTP `Cache-Control: no-cache, no-store, must-revalidate` aplicados a todos os arquivos estáticos e rotas públicas.

---

## 🧪 Evidências de Teste e Validação

1. **Suite Automatizada:** `npm test` executado com 100% de sucesso (7/7 suites verdes).
2. **Live Stream Real:**
   - **Canal Testado:** SporTV (Canal 13 - Grupo Sports).
   - **Stream Ativo:** Transmissão de partida de futebol ao vivo reproduzindo perfeitamente no container 16:9 da Coluna 3.
   - **Evidência Fotográfica:** `sportv_live_fullscreen_btn_1791703299051.png`.
   - **Metadados em Tela:** Sinal Online (HLS Stream) · Qualidade Adaptativa (HLS).
