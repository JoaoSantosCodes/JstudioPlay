# 🏛️ Zettelkasten: Gestos Mobile de Brilho/Volume, Lock Screen e Otimizações de Player (v8.3.22)

- **ID**: `20261027-gestos-mobile-lock-screen-e-otimizacoes-player-v8322`
- **Data**: 27/10/2026 18:55 BRT
- **Contexto**: Implementação de controles gestuais avançados de reprodução (Brilho e Volume verticais), toque duplo para saltar 10s nas bordas, bloqueio de tela (Lock Screen) contra toques acidentais e otimizações de performance.
- **Versão**: `8.3.22` (Android `versionCode 14`)

---

## 🔍 1. Melhorias e Refinamentos Implementados

1. **Gestos de Deslizar Verticais no Celular (Estilo MX Player / VLC)**:
   - **Metade Esquerda da Tela**: Deslizar verticalmente ajusta o **Brilho** da tela (`filter: brightness(...)`) com HUD circular em vidro fosco exibindo o ícone de sol ☀️ e a porcentagem.
   - **Metade Direita da Tela**: Deslizar verticalmente ajusta o **Volume** do player com HUD circular exibindo o ícone de áudio 🔊 e a porcentagem.
2. **Duplo Toque Inteligente por Zona (Estilo YouTube / Netflix)**:
   - **Borda Esquerda**: Retrocede 10 segundos com animação ripple `⏪ 10s`.
   - **Borda Direita**: Avança 10 segundos com animação ripple `⏩ 10s`.
   - **Centro da Tela**: Alterna entre "Preencher Tela Cheia (Sem Bordas)" (`cover`) e "Ajustar à Tela" (`contain`).
3. **Bloqueio de Toques na Tela (Lock Screen)**:
   - Botão de cadeado `🔒` na barra superior do player.
   - Quando ativado, desativa qualquer clique acidental, toque ou gesto na tela (ideal para assistir deitado ou em movimento).
   - Exibe apenas um botão pulsante translúcido no canto superior direito para desbloquear quando desejado.
4. **Otimizações de Renderização e Layout**:
   - `contain: layout style` e aceleração por hardware ativa.
   - Destruição e liberação limpa de streams HLS no fechamento do player.

---

## ✅ 2. Definition of Done (DoD)

- [x] Gestos de deslizar para Brilho (esquerda) e Volume (direita) com HUD animado.
- [x] Duplo toque para voltar/avançar 10s nas bordas.
- [x] Lock Screen com bloqueio total de toques acidentais.
- [x] APK e AAB v8.3.22 compilados e assinados em `dist-android/`.
- [x] 100% dos testes verdes e commit semântico sincronizado no GitHub.
