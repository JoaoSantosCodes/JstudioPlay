# 🏛️ Zettelkasten: Botão Voltar Inteligente e Interceptação do Botão Voltar no Android (v8.3.21)

- **ID**: `20261027-botao-voltar-inteligente-e-interceptacao-android-v8321`
- **Data**: 27/10/2026 18:20 BRT
- **Contexto**: Eliminação da falha crítica de ergonomia onde o usuário não conseguia voltar ao catálogo durante a reprodução de vídeo, sendo obrigado a fechar o aplicativo para sair.
- **Versão**: `8.3.21` (Android `versionCode 13`)

---

## 🔍 1. Diagnóstico do Problema

1. **Botão Físico / Gesto Voltar do Android Fechava o Aplicativo**:
   - O `MainActivity.java` não interceptava `onBackPressed()`. Ao acionar o botão Voltar (físico, virtual ou gesto de deslizar da borda lateral no Android), o sistema destruía a Activity e fechava o app, em vez de fechar apenas o player de vídeo.
2. **Controles Ocultos por Inatividade no Celular**:
   - Após 3.5 segundos de reprodução, o timer de ociosidade ocultava o cabeçalho (`idle-hidden`). No celular, toques na tela não disparavam `mousemove` e o botão Voltar visual não reaparecia, deixando o usuário preso no vídeo sem botões de saída.

---

## 🛠️ 2. Soluções Implementadas

1. **Interceptação Nativa do Botão Voltar no Android (`MainActivity.java`)**:
   - Sobrescrita do método `onBackPressed()` que executa `window.handleAndroidBackButton()` no WebView.
   - Se o player `#vod-theater` estiver aberto, fecha o vídeo imediatamente e retorna `true`, **mantendo o aplicativo aberto e restaurando a tela do catálogo**.
   - Se um modal estiver aberto, fecha o modal.
   - Apenas se o usuário já estiver na raiz inicial sem vídeos ou modais, o evento volta normalmente ao sistema Android.
2. **Botão Voltar Flutuante Dedicado no Vídeo (`.iptv-floating-back-btn`)**:
   - Botão arredondado translúcido com blur no canto superior esquerdo com ícone `←` e texto *"Voltar"*.
   - Área de toque generosa e ergonômica para smartphones.
3. **Despertar Instantâneo por Toque no Celular**:
   - Listeners de `touchstart` e `pointerdown` no `#vod-theater` para que **qualquer toque em qualquer lugar da tela revele instantaneamente o botão Voltar e os controles** por 4.5 segundos.
4. **Fechamento Limpo no `closeVodTheater()`**:
   - Sai automaticamente de tela cheia (`document.exitFullscreen()`), pausa a mídia e descarrega os recursos de memória.

---

## ✅ 3. Definition of Done (DoD)

- [x] Gesto/botão Voltar do Android fecha o vídeo e retorna ao catálogo sem fechar o app.
- [x] Botão Voltar visual no topo esquerdo do player sempre acessível ao tocar na tela.
- [x] Saída limpa de tela cheia sem travamentos.
- [x] APK e AAB v8.3.21 compilados e assinados em `dist-android/`.
- [x] 100% de testes verdes e commit semântico sincronizado no GitHub.
