# 🏛️ NOTA TÉCNICA ZETTELKASTEN: DESIGN SYSTEM OFICIAL NETFLIX MOBILE & CARDS (v8.3.16)

- **ID**: `20261027-design-system-netflix-mobile-cards-v8316`
- **Data / Versão**: 2026-10-27 | JstudioPlay Pro v8.3.16 (versionCode 8)
- **Autor / Agente**: Antigravity Core Agent
- **Tags**: `#netflix-clone` `#mobile-design` `#floating-nav-pill` `#continue-watching-card` `#top10-badge`

---

## 🎯 Contexto e Referências Visuais

Com base em 5 capturas de tela reais do aplicativo móvel da **Netflix no Android**, a interface do JstudioPlay foi refinada para atingir paridade visual e ergonomia idêntica ao design system de streaming:

1. **Floating Pill Navigation Bar (Barra Flutuante em Pílula)**:
   - Posicionamento flutuante suspenso a 12px da base da tela (`bottom: 12px; border-radius: 36px`).
   - Fundo escuro fosco de alta densidade (`rgba(18, 20, 26, 0.88)`) com desfoque de vidro super translúcido (`backdrop-filter: blur(28px)`).
   - Destaque no item ativo com pílula cinza suave (`background: rgba(255, 255, 255, 0.16)`).
   - Exibição de mini avatar com foto/inicial do usuário no botão *"Minha Conta"*.

2. **Cards de "Continuar Assistindo" Padrão Netflix**:
   - Pôster em formato vertical 2:3 com cantos arredondados.
   - Botão circular de Play translúcido com borda branca no centro da imagem (`.netflix-continue-play-circle`), com efeito hover/tap para vermelho Netflix.
   - Barra de progresso vermelha ultra-fina colada na base do thumb.
   - Rodapé dedicado do card (`#111216`) com botão circular de informações `ⓘ`, divisor vertical e botão de opções `⋮`.

3. **Badges Oficiais Netflix nos Cards de Catálogo**:
   - **Selo TOP 10 Vermelho**: Badge vertical quadrada no canto superior esquerdo com `TOP` e `10` em branco com tipografia pesada.
   - **Etiqueta de Rodapé "Novidade" / "Nova temporada"**: Pílula horizontal vermelha viva sobreposta na base dos títulos correlatos.

4. **Botões Oficiais do Hero Banner**:
   - **Botão Branco de Alto Contraste**: `▶ Assistir` (fundo branco, texto e ícone pretos).
   - **Botão Cinza Translúcido**: `+ Minha lista` (fundo fosco escuro com borda suave).

---

## 🏗️ Arquitetura e Arquivos Modificados

| Arquivo | Descrição das Modificações |
|---|---|
| `public/static/design-v8.css` | Adicionada Seção 29 com o Design System Oficial Netflix Mobile (Floating Pill, Continue Watching Card, Badges TOP 10, Botões Hero). |
| `public/static/app.js` | Função `iptvBottomNav` adaptada para pílulas flutuantes e avatar; Hero Banner com botões Netflix; cards de Continuar Assistindo atualizados; injeção de selos TOP 10 e Novidade nos cards. |
| `android/app/build.gradle` | Incrementado para `versionCode 8` e `versionName "8.3.16"`. |
| `package.json` | Versão atualizada para `8.3.16`. |
| `public/index.html` | Cache busters atualizados para `?v=8.3.16`. |
| `scripts/test_netflix_mobile_v8316.js` | Suíte canônica validando todas as regras do layout Netflix Mobile (100% aprovada). |

---

## ✅ Definition of Done (DoD)

- [x] Testes Automatizados 100% Verdes em todas as 5 suítes canônicas.
- [x] Fidelidade visual validada contra as 5 capturas do app oficial da Netflix.
- [x] AAB e APK assinados prontos em `dist-android/`.
- [x] Repositório e Vercel sincronizados via Git.
