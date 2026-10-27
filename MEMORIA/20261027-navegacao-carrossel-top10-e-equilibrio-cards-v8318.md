# 🏛️ Zettelkasten: Navegação do Carrossel Top 10 (1 a 10) e Equilíbrio Visual dos Cards (v8.3.18)

- **ID**: `20261027-navegacao-carrossel-top10-e-equilibrio-cards-v8318`
- **Data**: 27/10/2026 04:38 BRT
- **Contexto**: Implementação dos controles deslizantes do Top 10 (permitindo rolar até os itens 7, 8, 9 e 10) e redistribuição em 7 colunas elegantes no desktop para equilibrar o tamanho dos cards do catálogo.
- **Versão**: `8.3.18` (Android `versionCode 10`)

---

## 🔍 1. Problemas Abordados

1. **Inacessibilidade dos Itens 7 a 10 no Top 10**:
   - O track horizontal do Top 10 ocultava as scrollbars padrão por design (`scrollbar-width: none`), e não possuía setas ou botões interativos de deslizamento para usuários de desktop. Como resultado, em telas de 1600px o usuário só conseguia visualizar do item 1 ao item 6.
2. **Discrepância de Escala entre Top 10 e Catálogo**:
   - Os cards do catálogo estavam divididos em apenas 5 colunas em telas de 1600px, resultando em largura excessiva (~272px por card) e altura desproporcional (~408px), parecendo muito maiores do que os pôsteres do Top 10 logo acima.
3. **Overflow Oculto nos Chips de Categoria**:
   - A prateleira de categorias (45 categorias) não possuía controles explícitos para navegação horizontal no desktop.

---

## 🛠️ 2. Soluções Implementadas

1. **Controles e Setas Deslizantes Oficiais do Top 10 (`renderNetflixTop10`)**:
   - Botões de navegação no cabeçalho: `.netflix-slider-arrow.prev` e `.netflix-slider-arrow.next` com chevron SVG.
   - Setas laterais estilo Netflix Desktop: `.netflix-side-arrow` flutuantes nas bordas esquerda e direita com fundo translúcido e efeito blur.
   - Rolagem suave programada: `scrollBy({ left: track.clientWidth * 0.75, behavior: 'smooth' })`, permitindo transitar instantaneamente entre 1-5 e 6-10.
   - Suporte a scroll-snap: `scroll-snap-type: x mandatory` garantindo alinhamento perfeito de cada card ao rolar.
2. **Setas de Rolagem nos Chips de Categorias**:
   - `.iptv-chips-arrow.prev` e `.iptv-chips-arrow.next` adicionados ao lado da prateleira de categorias para deslizar facilmente por todas as 45 opções.
3. **Equilíbrio Harmônico das Colunas de Catálogo (Seção 31 no `design-v8.css`)**:
   - Distribuição em **7 colunas no desktop largo (1441px a 1750px)**: largura média de ~175px a 185px por card, eliminando os "cards gigantes" e harmonizando a escala visual com os pôsteres do Top 10.
   - Top 10 com pôsteres ampliados proporcionalmente para `138px x 207px` no desktop.

---

## ✅ 3. Definition of Done (DoD)

- [x] Navegação funcional até o 10º título no Top 10 por meio de setas interativas.
- [x] Setas de navegação nos chips de categorias.
- [x] Grade de catálogo perfeitamente balanceada em 7 colunas elegantes no desktop largo.
- [x] APK e AAB v8.3.18 compilados e assinados em `dist-android/`.
- [x] 100% de testes verdes e commit semântico sincronizado no GitHub.
