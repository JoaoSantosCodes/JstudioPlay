# 20261012 - Ecossistema de Revenda & Upgrade: Transferência de Créditos, Renovação e Solicitação de Reseller (v7.9.0)

- **Data / Horário:** 12/10/2026 (UTC-3)
- **Autor / Agente:** Kiro (Pair Programming)
- **Status:** Concluído e Validado (100% Green Tests)
- **Tags:** #reseller #creditos #transferencia #renovacao #upgrade #rbac #iam #governance

---

## 1. Contexto & Requisito

Sprint v7.9.0 deliberada e aprovada pelo Fluxo Canônico de Governança (4×0). Três gargalos endereçados:

1. **User/Pro sem canal de conversão** — sem botão para solicitar upgrade para Reseller.
2. **Reseller sem mobilidade de saldo** — não conseguia transferir créditos entre revendedores da rede.
3. **Renovação manual** — sem ação rápida de +30 dias para clientes, consumindo 1 crédito.

---

## 2. Veredito da Sala de Guerra

| Perspectiva | Diretriz |
| :--- | :--- |
| **Arquiteto** | `transferCredits` atômico via `sql.transaction()` com rollback. Tabela `credit_transfers` para auditoria. |
| **SRE** | Verificação de saldo antes do débito. Master isento de débito (pode distribuir ilimitado). |
| **Produto** | User/Pro converte em 2 cliques. Reseller envia créditos para sub-revendedores sem precisar do Master. |
| **Segurança & IAM** | Destinatário deve ter perfil `reseller`. Bloqueio contra injeção em `admin`/`master`. Log com remetente, destinatário e timestamp. |

---

## 3. DAG de Implementação

```
Schema (Migration 4) → database.js → index.js → app.js
```

---

## 4. Implementação Técnica

### 4.1 Schema — Migration 4 (`server/db/db-schema.js`)

```sql
CREATE TABLE reseller_requests (
    id, user_id, name, username, email, phone, notes,
    status DEFAULT 'pending', created_at, reviewed_at, reviewed_by
);

CREATE TABLE credit_transfers (
    id, from_user_id, to_user_id, amount, created_at
);
```

### 4.2 `database.js` — 3 métodos novos

| Método | Descrição |
|---|---|
| `transferCredits(fromUserId, toUserId, amount)` | Transação atômica: débita remetente (exceto master) + credita destinatário + insere em `credit_transfers` + log |
| `renewUserSubscription(userId, days=30)` | Estende `expires_at` a partir da data atual ou da expiração futura (sem perder dias restantes) |
| `createResellerRequest({userId, phone, notes})` | Insere solicitação em `pending` |
| `getResellerRequests(status)` | Lista solicitações para painel do Master |
| `reviewResellerRequest(id, {status, reviewedBy})` | Aprova ou rejeita + promove usuário para `reseller` se aprovado |

### 4.3 API `server/index.js` — 5 endpoints novos

| Método | Rota | Acesso | Função |
|---|---|---|---|
| `POST` | `/api/reseller/transfer` | `reseller`+ | Transferência de créditos entre revendedores |
| `POST` | `/api/admin/users/:id/renew` | `reseller`+ | Renova cliente +30 dias (consome 1 crédito do reseller) |
| `POST` | `/api/account/request-reseller` | `user`/`pro` | Solicita upgrade para reseller |
| `GET` | `/api/admin/reseller-requests` | `master` | Lista solicitações pendentes |
| `POST` | `/api/admin/reseller-requests/:id/review` | `master` | Aprova ou rejeita solicitação |

**Regras de negócio:**
- Transferência: destinatário deve ter `role === 'reseller'`. Master pode transferir sem débito próprio.
- Renovação: debita 1 crédito do reseller/master. Desbloqueia conta se estava bloqueada.
- Aprovação: se `status === 'approved'`, promove automaticamente o usuário para `reseller`.

### 4.4 Frontend `public/static/app.js`

**Sidebar (`iptvSmartSidebar`):**
- Para `reseller`: botões "Comprar" e "⇄ Enviar" lado a lado no badge de saldo.
- Para `user`/`pro`: botão gradiente "🔄 Seja um Revendedor" abaixo do menu.

**`usersPage()`:**
- Botão "⏱ Renovar (+30d)" em cada linha de cliente (visível para reseller e master).
- Botão "⇄ Enviar Créditos" na toolbar da página.
- Subtitle contextual por perfil.

**`userRows()`:**
- Coluna de ações expandida com botão de renovação inline.

**Funções novas:**
- `openTransferCreditsModal()` — modal com campo de username do destinatário + quantidade.
- `openRequestResellerModal()` — modal com telefone e descrição de atuação.

**Handlers novos no event switch:**
- `transfer-credits-modal` → abre `openTransferCreditsModal()`
- `request-reseller-modal` → abre `openRequestResellerModal()`
- `renew-user` → `POST /api/admin/users/:id/renew` com confirmação

**Forms no submit handler:**
- `transfer-credits-form` → `POST /api/reseller/transfer`
- `request-reseller-form` → `POST /api/account/request-reseller`

---

## 5. Arquivos Modificados

| Arquivo | Descrição |
|---|---|
| `server/db/db-schema.js` | Migration 4: `reseller_requests` + `credit_transfers` |
| `server/db/database.js` | `transferCredits`, `renewUserSubscription`, `createResellerRequest`, `getResellerRequests`, `reviewResellerRequest` |
| `server/index.js` | 5 endpoints novos |
| `public/static/app.js` | Modais, botões, handlers, sidebar e userRows |
| `public/index.html` | Cache-busting v7.9.0 |

---

## 6. Definition of Done (DoD)

- [x] `node --check` → exit 0 em todos os arquivos JS
- [x] `npm test` → 7/7 suítes verdes
- [x] `transferCredits` transacional com rollback
- [x] Renovação preserva dias restantes (não sobrescreve)
- [x] Bloqueio de transferência para `admin`/`master`
- [x] Aprovação de solicitação promove usuário automaticamente
- [x] Botão "Seja um Revendedor" para `user`/`pro`
- [x] Botão "Renovar (+30d)" inline na tabela de clientes
- [x] Modal de transferência com validação de saldo
- [x] Push para `origin/main`

---

## 🔗 Referências

- [[20261012-sprint-revendedor-creditos-v785]]
- [[20261011-sprint-hierarquia-rbac-perfis-usuarios-v784]]
- [AGENTS.md — Fluxo Canônico de Governança](../AGENTS.md)
