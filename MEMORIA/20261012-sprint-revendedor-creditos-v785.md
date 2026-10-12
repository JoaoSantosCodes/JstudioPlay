# 20261012 - Sistema de Revenda & Créditos: Perfil Reseller, Catálogo de Pacotes e Consumo por Cadastro (v7.8.5)

- **Data / Horário:** 12/10/2026 (UTC-3)
- **Autor / Agente:** Kiro (Pair Programming)
- **Status:** Concluído — Pendente Commit e Push
- **Tags:** #reseller #creditos #rbac #iam #revenda #playlists #governance #iptv

---

## 1. Contexto & Requisito

Identificado durante validação de pendências (P-02): 7 arquivos modificados sem commit contendo uma sprint completa de implementação do **sistema de revenda com créditos**. A funcionalidade adiciona um 5º perfil RBAC (`reseller`) com economia de créditos pré-pagos para cadastro de clientes.

---

## 2. Sala de Guerra — Veredito Consolidado

| Perspectiva | Avaliação |
| :--- | :--- |
| **Arquiteto** | Perfil `reseller` inserido de forma coesa no DAG RBAC existente (`user < pro < reseller < admin < master`). Migração de schema via `MIGRATIONS[2]` é backward-compatible. |
| **SRE** | Consumo de crédito é transacional (read-then-write atômica no SQLite). Rollback implícito se `deductCredit` lançar exceção antes do `createUser`. |
| **Produto** | Catálogo de 9 pacotes (10–90 créditos), tabela de preços escalonada, checkout via PIX + WhatsApp. Saldo visível na sidebar e na topbar. |
| **Segurança & IAM** | Chave PIX em `process.env.PIX_KEY` (cofre `CREDENCIAIS/.env`). Revendedor não acessa M3U Hub, logs nem perfis admin/master. Endpoint `/admin/users/:id/credits` exclusivo para `master`. |

---

## 3. Matriz de Permissões Atualizada (5 Perfis)

| Recurso | 👤 User | ⭐ Pro | 🔄 Reseller | 🛡️ Adm | 👑 Master |
| :--- | :---: | :---: | :---: | :---: | :---: |
| TV, Filmes, Séries, EPG, Favoritos | ✅ | ✅ | ✅ | ✅ | ✅ |
| Playlists & Gravações | ❌ | ✅ | ✅ | ✅ | ✅ |
| M3U Hub & Automação | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gestão de Clientes (`#/users`) | ❌ | ❌ | ✅ (user/pro) | ✅ | ✅ |
| Comprar Créditos (`#/credits`) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Logs de Auditoria | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ajustar Créditos de Usuários | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 4. Implementação Técnica

### 4.1 Schema do Banco (`server/db/db-schema.js`)
- **Migration 2:** `ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT 0` — backward-compatible, zero impacto em usuários existentes.

### 4.2 Camada de Dados (`server/db/database.js`)
- `rowToUser`: mapeamento do campo `credits` com fallback `0`.
- `createUser` / `updateUser` / `saveUser`: parâmetro `credits` adicionado a todos os prepared statements.
- `addCredits(userId, amount)`: adiciona créditos com log de auditoria.
- `deductCredit(userId, amount=1)`: verifica saldo antes de debitar; lança erro se insuficiente.
- Perfil `reseller` adicionado ao `validRoles` e ao filtro de `getPlaylists`.

### 4.3 Segurança (`server/security.js`)
- `requireReseller()`: middleware que permite `reseller`, `admin` e `master`.

### 4.4 API (`server/index.js`)
- `GET /api/credits/packages` — lista os 9 pacotes (público autenticado).
- `POST /api/credits/checkout` — gera payload PIX + link WhatsApp; consome 0 créditos (apenas registra o pedido); restrito a `reseller`+.
- `POST /api/admin/users/:id/credits` — ajuste de créditos (positivo/negativo); exclusivo `master`.
- Endpoints `/admin/users` (GET/POST/PATCH/DELETE): abertos para `reseller` com filtro de visibilidade (apenas `user` e `pro`). Criação de usuário por revendedor **consome 1 crédito** via `deductCredit`.
- Respostas de `/session`, `/login` e `/auth/google` incluem campo `credits`.

### 4.5 Front-End (`public/static/app.js`)
- `creditsPage()`: grid 3×3 de cards de pacote com preço, desconto e botão "Comprar".
- `iptvSmartSidebar`: badge de saldo de créditos na sidebar para perfil `reseller`.
- `iptvTopBar`: pílula de saldo de créditos na topbar para `reseller`.
- `roleBadge`: badge roxa `🔄 Revendedor`.
- `userModal`: aviso de consumo de crédito ao criar usuário (para revendedor); campo "Créditos Iniciais" visível apenas para `master`.
- `userOptions`: exibe saldo de créditos do usuário; painel de ajuste de créditos para `master`.
- `userRows`: coluna "Créditos" na tabela de usuários.
- `renderRoute`: guards de rota para `#/credits` e `#/users` incluem `reseller`.

### 4.6 CSS (`public/static/design-v8.css`)
- Módulo completo `.credits-page-wrapper`, `.credits-grid-3x3`, `.credit-package-card`, `.credits-balance-card`, `.iptv-sidebar-credit-badge`, `.credit-balance-pill`.

---

## 5. Catálogo de Pacotes

| ID | Créditos | Preço | Unit | Desconto |
|---|---|---|---|---|
| `cred_10` | 10 | R$ 60,00 | R$ 6,00 | — |
| `cred_20` | 20 | R$ 120,00 | R$ 6,00 | — |
| `cred_30` | 30 | R$ 180,00 | R$ 6,00 | — |
| `cred_40` | 40 | R$ 200,00 | R$ 5,00 | Economize R$ 40 |
| `cred_50` | 50 | R$ 250,00 | R$ 5,00 | Economize R$ 50 |
| `cred_60` | 60 | R$ 300,00 | R$ 5,00 | Economize R$ 60 |
| `cred_70` | 70 | R$ 280,00 | R$ 4,00 | Super Desconto |
| `cred_80` | 80 | R$ 320,00 | R$ 4,00 | Super Desconto |
| `cred_90` | 90 | R$ 360,00 | R$ 4,00 | Melhor Custo |

---

## 6. Variáveis de Ambiente Necessárias (`CREDENCIAIS/.env`)

```
PIX_KEY=<chave-pix-do-recebedor>
WHATSAPP_SUPPORT=<numero-whatsapp-com-DDI>
```

---

## 7. Arquivos Modificados

| Arquivo | Descrição |
|---|---|
| `server/db/db-schema.js` | Migration 2: coluna `credits` |
| `server/db/database.js` | `addCredits`, `deductCredit`, `reseller` em validRoles |
| `server/security.js` | `requireReseller()` middleware |
| `server/index.js` | Endpoints de créditos + RBAC reseller |
| `public/static/app.js` | `creditsPage()`, sidebar/topbar reseller, badges, modais |
| `public/static/design-v8.css` | Módulo CSS de créditos e revenda |
| `data/db.json.migrated` | Atualização de timestamps (lastLoginAt) |

---

## 8. Definition of Done (DoD)

- [x] Schema migration backward-compatible
- [x] `addCredits` e `deductCredit` com log de auditoria
- [x] Revendedor não acessa rotas restritas (M3U Hub, Logs, Admin superiores)
- [x] Consumo de 1 crédito ao criar usuário pelo revendedor
- [x] Checkout PIX gera payload + link WhatsApp
- [x] Credenciais PIX/WhatsApp em `CREDENCIAIS/.env`
- [x] CSS do módulo de créditos implementado
- [ ] `npm test` — pendente execução pós-commit
- [ ] Push para `origin/main`
- [ ] Chamado GLPI vinculado

---

## 9. Próximos Passos

- Webhook de confirmação de pagamento PIX (integração com banco ou gateway)
- Notificação por e-mail/WhatsApp ao revendedor quando crédito for adicionado pelo Master
- Relatório de uso de créditos no painel do revendedor
- QR Code PIX gerado no frontend (biblioteca `qrcode`)

---

## 🔗 Referências

- [[20261011-sprint-hierarquia-rbac-perfis-usuarios-v784]]
- [AGENTS.md — Fluxo Canônico de Governança](../AGENTS.md)
