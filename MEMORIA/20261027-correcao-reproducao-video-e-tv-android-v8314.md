# 🏛️ NOTA TÉCNICA ZETTELKASTEN: CORREÇÃO DEFINITIVA DE REPRODUÇÃO DE VÍDEO & TV NO ANDROID

- **ID**: `20261027-correcao-reproducao-video-e-tv-android-v8314`
- **Data / Versão**: 2026-10-27 | JstudioPlay Pro v8.3.14 (versionCode 6)
- **Autor / Agente**: Antigravity Core Agent
- **Tags**: `#android` `#hls-playback` `#iptv` `#cleartext-traffic` `#network-security-config` `#stream-relay`

---

## 🎯 Diagnóstico da Falha

Usuário relatou: *"nenhum video ou tv esta reproduzindo no android"*.
Após auditoria minuciosa da pilha de execução entre o dispositivo móvel físico, WebView do Android e o backend Node.js, foram identificadas 4 causas-raiz críticas:

1. **Host Relativo nas URLs do Relay (`ERR_CONNECTION_REFUSED`)**:
   - O backend retornava `/proxy/stream?url=...` e o Hls.js ou elemento `<video>` no Android tentava resolver a URL contra `http://localhost/proxy/stream` dentro do próprio aparelho móvel (onde não há servidor Node rodando).
2. **Reescrita de Chunks HLS sem Origin Base no Manifesto `.m3u8`**:
   - A função `rewriteM3U8` reescrevia tags e segmentos TS/HLS apenas como `/proxy/stream?url=...`, fazendo o Hls.js no celular disparar requisições para a porta local do celular em vez do servidor Cloudflare/IP LAN.
3. **Bloqueio de HTTP em Páginas HTTPS**:
   - `playChannel` continha uma verificação estrita que abortava streams `http://` exibindo a mensagem *"Esta fonte usa HTTP"*, em vez de ativar automaticamente o modo Relay para prover o encapsulamento HTTPS seguro.
4. **Ausência de `network_security_config.xml` no Android (API 28+)**:
   - O sistema operacional Android 9+ bloqueia conexões de soquete HTTP nativas do MediaPlayer e codecs sem uma declaração explícita de `cleartextTrafficPermitted="true"` associada ao `networkSecurityConfig`.

---

## 🛠️ Correções Implementadas

1. **Backend (`server/relay.js`)**:
   - `handlePlaybackRequest`: Determina dinamicamente o `originBase` (`proto + '://' + host`) através dos headers `x-forwarded-host`/`x-forwarded-proto` (Cloudflare) ou `req.get('host')`, retornando URLs de proxy completas e prontas para consumo por dispositivos remotos.
   - `proxyStream`: Passa `proxyBase` absoluto para `rewriteM3U8`, garantindo que todos os segmentos `.ts` e sub-manifestos carreguem diretamente do servidor backend.
2. **Frontend (`public/static/app.js`)**:
   - Inserida a função `resolveStreamUrl()` para garantir que qualquer URL de mídia ou proxy relativa seja expandida com `getBackendBase()`.
   - Adicionado `xhrSetup` no Hls.js para interceptar e redirecionar chunks relativos para a URL correta do backend.
   - Desabilitado `enableWorker` em dispositivos móveis/WebViews para prevenir crashes de thread e estouro de memória no Android.
   - Fallback de Hls.js fatal error para reprodução nativa direta (`video.canPlayType`).
   - Auto-ativação transparente de `state.relayMode` em streams HTTP quando em contexto seguro.
3. **Android Nativo (`android/` & `capacitor.config.json`)**:
   - Criado `android/app/src/main/res/xml/network_security_config.xml` liberando tráfego cleartext irrestrito para domínios IPTV.
   - Adicionado `android:networkSecurityConfig="@xml/network_security_config"` e `android:hardwareAccelerated="true"` no `AndroidManifest.xml`.
   - Atualizado `capacitor.config.json` com `androidScheme: "http"` para conformidade nativa de reprodução de mídia sem falso mixed-content.

---

## ✅ Definition of Done (DoD)

- [x] Testes Automatizados 100% Verdes (`test_android_playback_fixes_v8314.js`, `test_netflix_top10_and_bottomsheet_v8313.js`, `test_netflix_hover_and_similar_v8312.js`).
- [x] Container Docker `mcp_jstudioplay` atualizado e reiniciado.
- [x] AAB e APK assinados com `jstudioplay-release.jks` (versionCode 6).
- [x] Push no repositório remoto disparando deploy na Vercel.
