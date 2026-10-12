# 20261012 - Webhook PIX, Web Push e Notificações de Crédito (v7.8.8)

- **Data / Horário:** 12/10/2026 (UTC-3)
- **Autor / Agente:** Kiro (Pair Programming)
- **Status:** Concluído e Validado (100% Green Tests)
- **Tags:** #pix #webhook #webpush #notificacao #creditos #rbac #iam #governance #iptv

---

## 1. Contexto & Requisito

Sprint final do roadmap acumulado. Três entregas:

1. **Webhook PIX** — endpoint pronto para receber confirmação de qualquer gateway de pagamento. Credita o revendedor automaticamente. Idempotente via `transaction_id`.
2. **Web Push** — notificações push nativas (PWA) para revendedores e admins. Usa VAPID via `web-push@3.6.7`.
3. **Registro automático de subscription** — o frontend registra o dispositivo no primeiro login e em cada sessão Google OAuth.

---

## 2. Sala de Guerra — Veredito Consolidado

| Perspectiva | Avaliação |
| :--- | :--- |
| **Arquiteto** | Migration 3 adiciona `pix_events` (idempotência) e `push_subscriptions` (por usuário, indexed). `pushService.js` com graceful degradation — servidor sobe mesmo sem VAPID configurado. |
| **SRE** | Webhook aceita `express.raw()` para validação HMAC-SHA256 do body bruto. Evento ignorado se já `processed`. `web-push` com `timingSafeEqual` no HMAC. |
| **Produto** | Fecha o fluxo end-to-end de revenda. Revendedor recebe push imediato após pagamento. Master pode enviar notificações manuais via `POST /api/push/notify/:userId`. |
| **Segurança & IAM** | `PIX_WEBHOOK_SECRET` opcional mas recomendado. `VAPID_PRIVATE_KEY` em `CREDENCIAIS/.env`. Endpoint `/push/notify` exclusivo para `master`. |

---

## 3. Implementação Técnica

### 3.1 Schema — Migration 3 (`server/db/db-schema.js`)

```sql
CREATE TABLE pix_events (
    id, transaction_id UNIQUE, user_id, amount, credits,
    status, payload, processed_at, created_at
);
CREATE TABLE push_subscriptions (
    id, user_id, endpoint UNIQUE, keys_p256, keys_auth, created_at
);
```

### 3.2 `database.js` — 7 métodos novos

| Método | Descrição |
|---|---|
| `savePixEvent(...)` | INSERT OR IGNORE (idempotente por `transaction_id`) |
| `getPixEvent(txId)` | Lookup por `transaction_id` |
| `markPixEventProcessed(txId)` | Status → `processed`, seta `processed_at` |
| `savePushSubscription(userId, {endpoint, keys})` | INSERT OR REPLACE |
| `deletePushSubscription(userId, endpoint)` | Remove subscription expirada |
| `getPushSubscriptionsByUser(userId)` | Lista subscriptions do usuário |
| `getAllPushSubscriptions()` | Para notificações broadcast |

### 3.3 `server/services/pushService.js` — novo serviço

- `require('web-push')` com graceful degradation — se não instalado, loga aviso e retorna `false`.
- `setVapidDetails` apenas se `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` presentes.
- `sendToSubscription(sub, payload)` — envia e remove automaticamente subscriptions com status 410.
- `notifyUser(db, userId, payload)` — notifica todos os dispositivos do usuário.
- `notifyAdmins(db, payload)` — broadcast para todos `master`/`admin`.
- `getVapidPublicKey()` — expõe a chave pública para o frontend.

### 3.4 `server/index.js` — 5 endpoints novos

| Método | Rota | Acesso | Função |
|---|---|---|---|
| `POST` | `/api/credits/pix-webhook` | Público (HMAC) | Recebe confirmação PIX, credita usuário, envia push |
| `GET` | `/api/push/vapid-public-key` | `requireAuth` | Retorna chave pública VAPID |
| `POST` | `/api/push/subscribe` | `requireAuth` | Registra subscription do dispositivo |
| `DELETE` | `/api/push/subscribe` | `requireAuth` | Remove subscription |
| `POST` | `/api/push/notify/:userId` | `requireMaster` | Envia notificação manual |

**Fluxo do webhook PIX:**
1. Gateway envia `POST /api/credits/pix-webhook` com `{ transactionId, userId, credits, amount, event }`.
2. HMAC-SHA256 validado se `PIX_WEBHOOK_SECRET` configurado.
3. Evento ignorado se já `processed` (idempotência).
4. `db.addCredits(userId, credits)` + `db.markPixEventProcessed(txId)`.
5. `pushService.notifyUser(db, userId, { title: '✅ Pagamento confirmado!', ... })`.

### 3.5 `public/static/app.js` — função `registerPushSubscription()`

- Verifica suporte a `serviceWorker` e `PushManager`.
- Busca chave pública VAPID via `/api/push/vapid-public-key`.
- Cria ou reutiliza subscription via `pushManager.subscribe()`.
- Persiste no backend via `POST /api/push/subscribe`.
- Chamada em background após login (form) e Google OAuth — sem bloquear navegação.

### 3.6 `package.json`
- `web-push@3.6.7` adicionado em `dependencies`.

### 3.7 `.env.example`
- Seção `PIX Webhook`: `PIX_KEY`, `WHATSAPP_SUPPORT`, `PIX_WEBHOOK_SECRET`.
- Seção `Web Push / VAPID`: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
- Instruções para gerar chaves VAPID incluídas.

### 3.8 Cache-Busting
- `public/index.html` e `public/sw.js` bumped para `v7.8.8`.

---

## 4. Notas de Segurança

- Vulnerabilidades encontradas no `npm audit` são em `@mapbox/node-pre-gyp` (dependência de build do `bcrypt`) e `@capacitor/cli` (ferramenta Android) — **não afetam o runtime do servidor**. `npm audit fix` aplicado; as restantes requerem breaking changes nas ferramentas de build.
- `PIX_WEBHOOK_SECRET` é opcional por padrão (facilita integração inicial) mas **deve ser configurado em produção**.

---

## 5. Definition of Done (DoD)

- [x] Migration 3 aplicada — `pix_events` e `push_subscriptions`
- [x] 7 métodos no `database.js`
- [x] `pushService.js` com graceful degradation
- [x] Webhook PIX idempotente com HMAC opcional
- [x] 5 endpoints REST novos
- [x] `registerPushSubscription()` no frontend (login form + Google OAuth)
- [x] `web-push@3.6.7` em `package.json`
- [x] `.env.example` atualizado com VAPID + PIX
- [x] Cache-busting v7.8.8
- [x] `npm test` → 7/7 verdes
- [x] Push para `origin/main`

---

## 6. Configuração Necessária pelo Operador

```bash
# 1. Gerar chaves VAPID
node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(k);"

# 2. Adicionar em CREDENCIAIS/.env
VAPID_PUBLIC_KEY=<public>
VAPID_PRIVATE_KEY=<private>
VAPID_SUBJECT=mailto:seu@email.com
PIX_KEY=<sua-chave-pix>
PIX_WEBHOOK_SECRET=<secret-compartilhado-com-gateway>

# 3. Configurar a URL do webhook no painel do gateway de pagamento
POST https://seu-dominio.com/api/credits/pix-webhook
Header: X-Pix-Signature: sha256=<hmac>
```

---

## 7. Roadmap — Concluído ✅

Todos os itens do roadmap das sprints v7.4 a v7.8.7 foram endereçados:

| Sprint | Item | Status |
|---|---|---|
| v7.4 | Dashboard de status da IA | ✅ v7.8.6 |
| v7.4 | Cache de embeddings | 🔵 Infraestrutura (requer fine-tuning Ollama) |
| v7.5 | Painel de atalhos | ✅ Já existia em v7.5 |
| v7.5 | Mini-player PiP | ✅ Já existia em v7.5 |
| v7.5 | Indicador de qualidade HLS | ✅ v7.8.6 |
| v7.6 | Crossfade de hero | ✅ v7.8.7 |
| v7.6 | Barra EPG nos cards | ✅ v7.8.7 |
| v7.6 | Seleção manual de qualidade | ✅ v7.8.7 |
| v7.8.5 | Webhook PIX | ✅ v7.8.8 |
| v7.8.5 | Notificação push de créditos | ✅ v7.8.8 |

---

## 🔗 Referências

- [[20261012-sprint-crossfade-epg-hls-quality-v787]]
- [[20261012-sprint-revendedor-creditos-v785]]
- [AGENTS.md — Fluxo Canônico de Governança](../AGENTS.md)
