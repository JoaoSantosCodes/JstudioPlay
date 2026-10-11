# 20261011 - Unificação de Layout Smart TV IPTV Dark e Restauração do Google OAuth (v7.8.2)

- **Data / Horário:** 11/10/2026 07:11 (UTC-3)
- **Autor / Agente:** Antigravity AI (Pair Programming)
- **Status:** Concluído e Validado (100% Green Tests)
- **Tags:** #ux #smarttv #iptv #dark-theme #oauth #google #unificacao #governance

---

## 1. Contexto & Diagnóstico

Durante a evolução visual para a interface Smart TV IPTV Dark (Netflix Style), dois pontos de atrito foram identificados:
1. **Ausência do botão "Entrar com Google" no Login:** A rota `/api/auth/google` e a biblioteca Google Identity Services estavam configuradas, mas o botão HTML com SVG oficial havia sido omitido na renderização da coluna direita de login.
2. **Inconsistência de Layout nas Telas Internas:** No roteador de navegação SPA (`renderRoute`), apenas um conjunto fixo de páginas recebia o layout Smart TV IPTV (`iptvSmartSidebar` + `iptvTopBar`), enquanto rotas como `#/playlists`, `#/users`, `#/logs`, `#/history` e `#/automation` recaíam no `shell()` desktop antigo de fundo claro.

---

## 2. Decisões Arquiteturais e Implementação

### 2.1 Restauração do Google OAuth no Login (`public/static/app.js`)
- Inserido o botão estilizado `data-action="google-login"` logo abaixo do botão de submissão do formulário de login, preservando o fluxo de callback do Google Identity Services (`google.accounts.id.initialize`).
- Credencial `GOOGLE_CLIENT_ID` lida diretamente do cofre blindado `CREDENCIAIS/.env`.

### 2.2 Unificação do Layout Smart TV IPTV (`public/static/app.js` & `design-v8.css`)
- **Roteador SPA (`renderRoute`):** 100% das páginas autenticadas (`page !== 'login'`) agora são encapsuladas na estrutura oficial Smart TV IPTV:
  ```html
  <div style="display:flex; min-height:100vh; background:var(--iptv-bg); color:#fff; font-family:var(--iptv-font);">
    ${iptvSmartSidebar(page)}
    <div class="iptv-main-container">
      ${page!=='settings'?iptvTopBar(page):''}
      <main class="${isFullBleed?'':'iptv-page-body'}" id="content">
        ${content}
      </main>
    </div>
  </div>
  ```
- **Sidebar Smart TV (`iptvSmartSidebar`):**
  - Item "Playlists" adicionado e destacado como rota primária da biblioteca.
  - Para administradores e gestores, atalhos de "Usuários" e "Logs" são integrados nativamente à sidebar escura.
- **Folhas de Estilo (`design-v8.css`):**
  - Adicionadas regras para `.iptv-main-container`, `.iptv-page-body`, `.card`, `.playlist-row`, `.data-table`, `.toolbar`, `.btn` e `.badge` para que todas as listas, formulários e tabelas usem superfícies escuras `#141414` e `#1E1E1E` com acentos `#E50914`.

### 2.3 Cache Busting
- Incrementada a versão de assets em `public/index.html` para `v=7.8.2`.

---

## 3. Validação e Definition of Done (DoD)

- [x] **Testes Automatizados de Backend:** `npm test` executado com **100% de sucesso** (7/7 suites verdes).
- [x] **Inspeção Visual por Subagente de Navegador:**
  - Login com botão Google verificado (`login_page_google_button_1791713230308.png`).
  - Navegação para `#/playlists` verificada no layout IPTV Smart TV (`playlists_page_unified_1791713346662.png`).
  - Navegação para `#/users` verificada com tabela e cards escuros nativos (`users_page_unified_1791713380912.png`).
- [x] **Conformidade IAM:** Nenhuma credencial exposta no código-fonte; `CREDENCIAIS/.env` preservado e blindado.
