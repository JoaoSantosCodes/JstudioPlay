# 20261011 - Implementação da Hierarquia RBAC: Usuario, Pro, Adm e Master (v7.8.4)

- **Data / Horário:** 11/10/2026 16:48 (UTC-3)
- **Autor / Agente:** Antigravity AI (Pair Programming)
- **Status:** Concluído e Validado (100% Green Tests)
- **Tags:** #rbac #iam #perfis-usuarios #master #admin #pro #user #seguranca #governance

---

## 1. Contexto & Requisito do Usuário

O usuário solicitou a criação e validação estrita da hierarquia de perfis de acesso (RBAC) do JstudioPlay:
1. **Usuario** (Acesso básico ao player)
2. **Pro** (Acesso avançado com gravação e gerenciamento de playlists privadas)
3. **Adm** (Administrador / Gestor de clientes e automação M3U)
4. **Master** (Super Administrador com controle total, logs de auditoria e gestão de administradores)

Além da criação dos perfis, foi exigida a validação do que cada um pode ver e acessar após o login.

---

## 2. Matriz Canônica de Permissões (RBAC)

| Recurso / Rota | 👤 Usuario (`user`) | ⭐ Pro (`pro`) | 🛡️ Adm (`admin`) | 👑 Master (`master`) |
| :--- | :---: | :---: | :---: | :---: |
| **TV Ao Vivo, Filmes & Séries** (`#/live`, `#/movies`, `#/series`) | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim |
| **Guia EPG, Favoritos & Histórico** (`#/epg`, `#/favorites`, `#/history`) | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim |
| **Minhas Playlists** (`#/playlists`) | ❌ Apenas atribuídas | ✅ Cria suas listas | ✅ Gestão ampla | ✅ Controle total |
| **Gravações & DVR** (`#/recordings`) | ❌ Bloqueado | ✅ Sim | ✅ Sim | ✅ Sim |
| **M3U Hub & Automação** (`#/automation`) | ❌ Bloqueado | ❌ Bloqueado | ✅ Sim | ✅ Sim |
| **Gestão de Usuários** (`#/users`) | ❌ Bloqueado | ❌ Bloqueado | ✅ Cria `user` e `pro` | ✅ Cria qualquer perfil |
| **Logs de Auditoria** (`#/logs`) | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado | ✅ Sim |
| **Configurações Globais do Servidor** | ❌ Não | ❌ Não | ❌ Não | ✅ Sim |

---

## 3. Implementação Técnica

### 3.1 Camada de Dados (`server/db/database.js`)
- `createUser` e `updateUser`: Normalização para os 4 papéis (`user`, `pro`, `admin`, `master`).
- `deleteUser`: Proteção contra deleção de usuários com perfil `master`.
- `getPlaylists`: Retorno irrestrito para `admin` e `master`; filtragem isolada para `pro` e `user`.
- Migração automática de compatibilidade promovendo o usuário raiz (`admin` e e-mail administrativo) para `master`.

### 3.2 Camada de Segurança (`server/security.js`)
- Adicionados middlewares reutilizáveis:
  - `requireRole(allowedRoles)`
  - `requireAdmin()` (permite `admin` e `master`)
  - `requireMaster()` (exclusivo para `master`)
  - `requirePro()` (permite `pro`, `admin` e `master`)

### 3.3 Endpoints da API (`server/index.js`)
- `GET /api/admin/users`: `master` visualiza todos; `admin` não visualiza contas `master`.
- `POST /api/admin/users`: `admin` só pode criar `user` ou `pro`. Apenas `master` cria `admin` e `master`.
- `PATCH /api/admin/users/:id`: Bloqueio para edição ou promoção de usuários `master` por administradores comuns.
- `DELETE /api/admin/users/:id`: Endpoint implementado com bloqueio de deleção de contas `master`.
- `GET /api/admin/logs`: Protegido exclusivamente por `security.requireMaster()`.

### 3.4 Interface Smart TV & Gestão de Usuários (`public/static/app.js`)
- `iptvSmartSidebar`: Exibe dinamicamente apenas os menus autorizados para o perfil logado.
- `renderRoute`: Bloqueia redirecionando para `#/dashboard` caso um usuário tente acessar rotas restritas via URL direta.
- `usersPage` & `userRows`: Exibe coluna de Perfil com badges estilizadas (`👑 Master`, `🛡️ Adm`, `⭐ Pro`, `👤 Usuário`).
- `userModal`: Dropdown de seleção de perfil com restrição condicional ao criador.
- `userOptions`: Permite alteração de perfil e exclusão respeitando a hierarquia RBAC.

---

## 4. Validação e Definition of Done (DoD)

- [x] **Testes Automatizados:** `npm test` aprovado com **100% de sucesso** (7/7 suítes verdes).
- [x] **Validação Visual no Navegador:**
  - Sidebar do Master exibindo todos os 12 itens autorizados.
  - Tabela de usuários exibindo badges de perfil.
  - Modal de novo usuário exibindo os 4 perfis (`Usuário`, `Pro`, `Adm`, `Master`).
  - Evidência gravada em `users_management_and_modal_1791747958822.png`.
- [x] **Conformidade IAM:** Credenciais mantidas em `CREDENCIAIS/.env`.
