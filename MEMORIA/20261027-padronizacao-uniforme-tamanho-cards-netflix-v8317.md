# 🏛️ Zettelkasten: Padronização Uniforme de Tamanho de Cards Estilo Netflix Mobile (v8.3.17)

- **ID**: `20261027-padronizacao-uniforme-tamanho-cards-netflix-v8317`
- **Data**: 27/10/2026 04:16 BRT
- **Contexto**: Resolução de discrepâncias de dimensões, proporções e alinhamento visual de cards de filmes, séries e prateleiras.
- **Versão**: `8.3.17` (Android `versionCode 9`)

---

## 🔍 1. Diagnóstico do Problema Visual

1. **Discrepância de Proporção entre Prateleiras**:
   - A prateleira "Continuar Assistindo" em `catalogPage()` utilizava markup e estilos antigos com `aspect-ratio: 16 / 9` (formato horizontal deitado de 112px).
   - O catálogo utilizava pôsteres verticais de `aspect-ratio: 2 / 3` (formato vertical de cinema de 298px).
   - No app oficial da Netflix (Print 5), a prateleira "Continuar Assistindo" utiliza rigorosamente a **mesma proporção vertical de pôster (2:3)** com o Play centralizado e rodapé de ações `ⓘ` e `⋮`.
2. **Imagens Despadronizadas em Listas IPTV**:
   - Listas IPTV enviam imagens mistas (fotos 4:3 ou quadradas como a do Carl Sagan, capturas 16:9 como "The Weight", e pôsteres 2:3 como o Homem-Aranha).
   - Sem regras rígidas de `object-fit: cover !important` e `aspect-ratio: 2 / 3 !important`, imagens menores deixavam faixas pretas ou vazios na base, criando a ilusão de cards com tamanhos diferentes.
3. **Variação na Altura dos Títulos**:
   - Títulos com comprimentos variados empurravam a altura dos cards na mesma linha.

---

## 🛠️ 2. Soluções Implementadas

1. **Seção 30 no Design System (`design-v8.css`)**:
   - Proporção universal travada: `aspect-ratio: 2 / 3 !important;` em `.iptv-ref-poster-thumb`, `.netflix-continue-thumb`, `.iptv-vod-similar-thumb` e `.channel-card-poster`.
   - Cobertura completa sem distorção: `object-fit: cover !important; object-position: center top !important; width: 100% !important; height: 100% !important;`.
   - Altura de textos e títulos uniformizada: `min-height: 38px !important; max-height: 38px !important;` com `-webkit-line-clamp: 1` e `text-overflow: ellipsis`.
   - Alinhamento do grid travado: `align-self: stretch !important;`.
2. **Atualização da `catalogPage()` em `app.js`**:
   - A prateleira "Continuar Assistindo" da página de Filmes e Séries agora utiliza o componente oficial `.netflix-continue-card` na proporção 2:3, Play circular central e footer com `ⓘ` e `⋮`.
   - Remoção de tags residuais no `dashboard()`.
3. **Sincronização e Compilação Nativa Android**:
   - `android/app/build.gradle` atualizado para `versionCode 9` e `versionName "8.3.17"`.
   - Binários assinados gerados em `dist-android/`:
     - `JstudioPlay-v8.3.17.apk` (~3.52 MB)
     - `JstudioPlay-v8.3.17.aab` (~3.38 MB)

---

## ✅ 3. Definition of Done (DoD)

- [x] Proporção 2:3 universal em 100% dos cards de catálogo e Continuar Assistindo.
- [x] Zero faixas pretas ou espaços vazios abaixo de imagens de proporção variada.
- [x] 100% dos testes verdes em `scripts/test_uniform_netflix_cards_v8317.js`.
- [x] APK e AAB v8.3.17 compilados e assinados.
- [x] Commit semântico e push para sincronização com GitHub e Vercel.
