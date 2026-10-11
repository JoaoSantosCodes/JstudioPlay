# 20261011 - Landing Page Oficial JstudioPlay Padrão OneX com Paleta IPTV Dark (v7.8.3)

- **Data / Horário:** 11/10/2026 07:27 (UTC-3)
- **Autor / Agente:** Antigravity AI (Pair Programming)
- **Status:** Concluído e Validado (100% Green Tests)
- **Tags:** #landing-page #onex #iptv #streaming #dark-mode #poppins #governance #ux

---

## 1. Contexto & Requisito do Usuário

O usuário solicitou uma página inicial antes do acesso ao formulário de login (`#/login`), utilizando como referência estrutural e de conversão o portal [Painel OneX](https://painelonex.com.br/), porém respeitando estritamente:
1. O design system próprio do JstudioPlay (`--iptv-font`: Poppins, cantos arredondados, glassmorphism).
2. A paleta de cores corporativa (`#141414` de fundo, `#1E1E1E` de superfície de cards, bordas `#2E2E2E` e acentos em vermelho `#E50914` / `#FF1726` com iluminação neon).
3. Transição direta e fluida para o login em `#/login` através dos botões de ação ("Acessar Plataforma" e "Entrar na Minha Conta").

---

## 2. Decisões Arquiteturais e Implementação

### 2.1 Design System OneX Adaptado à Paleta IPTV (`public/static/design-v8.css`)
- **Seção 15.8:** Criadas regras completas e modulares para:
  - `.onex-landing-wrapper`: Canvas escuro com iluminação radial suave em vermelho (`rgba(229, 9, 20, 0.14)`).
  - `.onex-header`: Cabeçalho fixo com glassmorphism (`backdrop-filter: blur(18px)`), marca JSTUDIOPLAY e botão CTA.
  - `.onex-hero`: Título com gradiente de texto, badge luminosa (*"STREAMING DE ALTA FIDELIDADE & IPTV"*), botões de ação com glow e grid de 4 métricas (*4K & FHD, 100% EPG, Zero Travamentos HLS, MultiTV*).
  - `.onex-features-grid`: 6 cards com microinterações e iluminação perimetral ao hover.
  - `.onex-devices-grid`: Grid de compatibilidade com Smart TVs (Tizen/WebOS), Android TV, Fire TV, PC e Mobile.
  - `.onex-faq-container`: Acordeão com Perguntas Frequentes e caixa final de conversão (CTA Box).
  - `.onex-footer`: Rodapé institucional com aviso legal de conformidade e direitos.

### 2.2 Componente e Roteamento SPA (`public/static/app.js`)
- **Componente `landing()`:** Renderiza a página completa com navegação por âncoras e botões para `#/login`.
- **Roteamento SPA (`renderRoute`):**
  - Visitantes deslogados agora acessam por padrão a Landing Page (`#/landing` ou raiz `#/`).
  - Visitantes logados continuam sendo direcionados automaticamente para `#/dashboard`.
  - A rota `#/login` permanece rápida, dedicada e acessível em um clique.

### 2.3 Cache Busting
- Incrementada a versão de ativos em `public/index.html` para `v=7.8.3`.

---

## 3. Validação e Definition of Done (DoD)

- [x] **Testes Automatizados:** `npm test` aprovado com **100% de sucesso** (7/7 suites verdes).
- [x] **Validação Visual no Navegador:**
  - Hero e cabeçalho verificados (`landing_hero_1791714326697.png`).
  - Recursos e vantagens técnicas verificadas (`landing_features_faq_1791714336113.png`).
  - Dispositivos e FAQ verificados (`landing_devices_faq_1791714349210.png`).
  - Clique em "Acessar Plataforma" transitando com precisão para `#/login` (`login_page_verified_1791714384347.png`).
- [x] **Conformidade IAM:** Credenciais mantidas em `CREDENCIAIS/.env`.
