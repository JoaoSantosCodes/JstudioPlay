# 🏛️ Zettelkasten: Tela Cheia Sem Bordas (Modo Imersivo Sticky Real & Enquadramento Cover) (v8.3.20)

- **ID**: `20261027-tela-cheia-sem-bordas-modo-imersivo-e-enquadramento-v8320`
- **Data**: 27/10/2026 14:04 BRT
- **Contexto**: Eliminação de bordas e barras pretas durante a reprodução em tela cheia no Android nativo e navegadores.
- **Versão**: `8.3.20` (Android `versionCode 12`)

---

## 🔍 1. Diagnóstico do Problema Visual

1. **Barra de Status do Android e Barra Virtual Visíveis no Vídeo**:
   - O `MainActivity.java` não configurava o modo imersivo sticky do Android. Como consequência, a barra de status superior (relógio, bateria, notificações) e a barra de botões virtuais da base/lateral (voltar, home, multitarefa) permaneciam visíveis sobrepostas à imagem.
2. **Bordas Pretas do Filme (Letterboxing/Pillarboxing)**:
   - Filmes e séries de cinema (proporção 2.39:1 cinemascope ou 16:9) em telas modernas de smartphones (19.5:9 ou 20:9 ultrawide) naturalmente deixam faixas pretas quando exibidos em `object-fit: contain` padrão.
   - Faltava um modo rápido e intuitivo para o usuário alternar para **"Preencher Tela Cheia (Sem Bordas)"** (`object-fit: cover`) com duplo toque (estilo YouTube/Netflix).

---

## 🛠️ 2. Soluções Implementadas

1. **Modo Imersivo Sticky Real no Android (`MainActivity.java`)**:
   - `WindowCompat.setDecorFitsSystemWindows(getWindow(), false)`.
   - `WindowInsetsControllerCompat.hide(WindowInsetsCompat.Type.systemBars())` com `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`.
   - `FLAG_KEEP_SCREEN_ON` para impedir o display de apagar durante a reprodução.
   - As barras de status e botões somem 100% da tela durante a reprodução.
2. **Modo Preencher Tela Cheia Sem Bordas (`fit-cover`)**:
   - Adicionada classe `.fit-cover` que aplica `object-fit: cover !important` no elemento `<video>` em qualquer resolução e mesmo em `:fullscreen`.
   - Gesto de **Duplo Toque / Duplo Clique**: tocar duas vezes rapidamente no centro do vídeo alterna instantaneamente entre:
     - `⛶ Preencher Tela (Sem Bordas)` (corta as faixas pretas e ocupa 100% dos pixels da tela física).
     - `⛶ Ajustar Original` (proporção original do filme).
3. **Seção 33 no CSS (`design-v8.css`)**:
   - Regras universais sobrescrevendo o comportamento padrão de navegadores Chromium em tela cheia (`video:fullscreen.fit-cover`).

---

## ✅ 3. Definition of Done (DoD)

- [x] Ocultação automática de System Bars (relógio, bateria, botões virtuais) em tela cheia no Android.
- [x] Alternância para Preencher Tela Sem Bordas via duplo toque no vídeo ou botão de enquadramento.
- [x] APK e AAB v8.3.20 compilados e assinados em `dist-android/`.
- [x] Commit semântico e push para o repositório principal no GitHub.
