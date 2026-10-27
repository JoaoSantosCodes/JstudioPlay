# 🏛️ NOTA TÉCNICA ZETTELKASTEN: TOP 10 NETFLIX & BOTTOM SHEET MODAL MOBILE

- **ID**: `20261027-netflix-top10-e-bottomsheet-v8313`
- **Data / Versão**: 2026-10-27 | JstudioPlay Pro v8.3.13 (versionCode 5)
- **Autor / Agente**: Antigravity Core Agent
- **Tags**: `#netflix-clone` `#top10` `#bottom-sheet` `#mobile-ux` `#android` `#play-store`

---

## 🎯 Contexto e Objetivos

Após a implementação dos Hover Cards cinematográficos e Recomendações Semelhantes (v8.3.12), foram implementadas duas das características visuais e ergonômicas mais icônicas dos serviços de streaming modernos, identificadas no benchmarking dos 13 repositórios GitHub de clones do Netflix:

1. **Fileira "Top 10 Hoje no JstudioPlay" (Netflix Top 10 Rank)**:
   - Numerais gigantes de 1 a 10 posicionados com sobreposição ao pôster, tipografia outline vazada em alta definição e efeito glow vermelho no hover.
   - Trilha com rolagem horizontal ultra-suave (`scrollbar-width: none`) na página inicial (Dashboard) e no Catálogo VOD.
   - Ações rápidas de Play imediato, Favoritar e Abertura de Detalhes diretamente em cada card.

2. **Media Details Bottom Sheet Nativo no Mobile (`@media (max-width: 680px)`)**:
   - Substituição do diálogo flutuante tradicional no celular por uma gaveta inferior deslizante (estilo `MediaDetailsBottomSheet`).
   - Puxador tátil superior (`.iptv-sheet-handle-bar`) com cantos superiores arredondados (`20px 20px 0 0`) e backdrop escurecido.
   - Animação acelerada por hardware `netflixSheetSlideUp` com curva cúbica natural.
   - Fechamento por toque no puxador, botão fechar ou backdrop.

---

## 🏗️ Arquitetura e Arquivos Modificados

| Arquivo | Descrição das Modificações |
|---|---|
| `public/static/design-v8.css` | Adicionada Seção 28.7 com `.netflix-top10-section`, `.netflix-top10-num`, `.netflix-top10-poster`, `@media (max-width: 680px) dialog#modal.iptv-bottom-sheet-mode` e `@keyframes netflixSheetSlideUp`. |
| `public/static/app.js` | Função `renderNetflixTop10()`, injeção no `dashboard()` e `catalogPage()`, ativação de `iptv-bottom-sheet-mode` no `openVodModal()`, injeção do puxador tátil e handler `top10-card-click`. |
| `android/app/build.gradle` | Incrementado para `versionCode 5` e `versionName "8.3.13"`. |
| `package.json` | Versão atualizada para `8.3.13`. |
| `public/index.html` | Cache busters atualizados para `?v=8.3.13`. |
| `scripts/test_netflix_top10_and_bottomsheet_v8313.js` | Suíte de testes automatizada canônica (100% de sucesso). |

---

## ✅ Definition of Done (DoD)

- [x] Testes Canônicos Automatizados: 100% Verdes (`test_netflix_top10_and_bottomsheet_v8313.js` e `test_netflix_hover_and_similar_v8312.js`).
- [x] Zero credenciais ou segredos expostos no código.
- [x] Build assinado com `jstudioplay-release.jks` para distribuição Google Play.
- [x] Registro Zettelkasten consolidado.
