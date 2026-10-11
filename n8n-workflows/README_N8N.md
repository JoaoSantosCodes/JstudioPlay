# 🚀 JstudioPlay Pro — Integração Docker + n8n

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   mcp-network (Docker)              │
│                                                     │
│  ┌──────────────────┐     ┌──────────────────────┐  │
│  │  mcp_jstudioplay │◄────│      mcp_n8n          │  │
│  │  :3030 (interno) │     │  :5678 (interno)      │  │
│  │  :3030 (host)    │     │  :5678 (host)         │  │
│  └──────────────────┘     └──────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

O n8n se comunica com o JstudioPlay **pelo nome do container** (`http://mcp_jstudioplay:3030`) dentro da rede Docker — nunca via `localhost`.

---

## ⚙️ Setup Inicial

### 1. Variáveis de ambiente obrigatórias (`CREDENCIAIS/.env`)

```env
PORT=3030
API_SECRET_KEY=seu_token_seguro_aqui      # ← usado como X-API-Key
SESSION_SECRET=outro_token_seguro_aqui

# Para o n8n (deve ser IGUAL ao API_SECRET_KEY)
JSTUDIOPLAY_API_KEY=seu_token_seguro_aqui
JSTUDIOPLAY_INTERNAL_URL=http://mcp_jstudioplay:3030

N8N_WEBHOOK_URL=http://mcp_n8n:5678/webhook/m3u-ops
N8N_ALERT_WEBHOOK_URL=http://mcp_n8n:5678/webhook/m3u-alerts
```

### 2. Subir o stack completo

```bash
# Criar a rede externa (apenas na primeira vez)
docker network create mcp-network

# Subir tudo
docker compose up -d --build
```

### 3. Configurar variáveis no n8n

No painel do n8n (`http://localhost:5678`):
- **Settings → Variables** (ou **Credentials → Environment Variables**)
- Adicionar:
  - `JSTUDIOPLAY_API_KEY` = valor do `API_SECRET_KEY` do `.env`
  - `JSTUDIOPLAY_INTERNAL_URL` = `http://mcp_jstudioplay:3030`

### 4. Importar os workflows

**n8n → Workflows → Import from File** → selecionar cada `.json` desta pasta.

---

## 📋 Workflows Disponíveis

| Arquivo | Descrição | Gatilho |
|:--------|:----------|:--------|
| `1_m3u_stream_validator_and_alerts.json` | Valida canais de todas as playlists e gera relatório | Cron 6h / Manual |
| `2_automated_playlist_cleaner_bot.json` | Recebe URL M3U, testa e entrega lista limpa | Webhook POST |
| `3_client_provisioning_and_delivery.json` | Cria clientes após vendas e entrega credenciais | Webhook POST |
| `4_daily_scraper_orchestrator.json` | Orquestra raspagem diária de fontes públicas | Cron 03:00 / Webhook |
| `5_ai_enrichment_and_search.json` | Enriquecimento AI (Ollama), busca semântica (pgvector) e descoberta (SearXNG) | Cron 04:00 + Webhook |
| `m3u_play_ops_orchestrator.json` | Sync M3U/EPG + Health Check com alertas | Cron múltiplo |

---

## 🛠️ Detalhes dos Workflows

### 1 · Validador de Streams & Alertas
- Busca todas as playlists com URL ativa
- Dispara validação com 15 workers por playlist
- Aguarda conclusão e formata relatório
- **Conecte** o nó final a Telegram, Discord, WhatsApp (Evolution API) ou Email

### 2 · Sanitizador de Playlists M3U
Recebe via webhook:
```json
{ "m3u_url": "https://exemplo.com/lista.m3u", "playlist_name": "Lista do Cliente" }
```
Retorna:
```json
{
  "success": true,
  "onlineChannels": 48,
  "downloadM3uUrl": "http://mcp_jstudioplay:3030/api/playlists/pl_xxx/export?filter=online"
}
```

### 3 · Provisionamento de Clientes
Recebe via webhook (compatível com Stripe/Hotmart/Kiwify):
```json
{ "customer_name": "Carlos Silva", "customer_email": "carlos@gmail.com", "plan_days": 30 }
```
Retorna mensagem formatada pronta para WhatsApp/Telegram.

### 4 · Orquestrador de Raspagem Diária ⭐ novo
- Cron às **03:00** dispara `POST /api/scraper/run`
- Aguarda 2 minutos, consulta `GET /api/scraper/status`
- Se ainda rodando, aguarda mais 1 minuto e repete (loop de polling)
- Formata relatório com: fontes importadas, canais coletados, erros
- Nó "Teve Erros?" pronto para conectar a alerta externo
- **Webhook manual**: `POST http://localhost:5678/webhook/scraper-trigger` para forçar scraping fora do horário

---

## 🌐 Endpoints REST para n8n

| Método | Rota | Descrição | Auth |
|:-------|:-----|:----------|:-----|
| `GET` | `/api/webhooks/stats` | Métricas gerais do sistema | API Key |
| `POST` | `/api/webhooks/validate` | Importar URL M3U + iniciar validação | API Key |
| `POST` | `/api/webhooks/provision-user` | Criar/renovar usuário | API Key |
| `GET` | `/api/playlists/:id/export?filter=online` | Download M3U com canais online | — |
| `POST` | `/api/automation/check/:id` | Iniciar validação de playlist | API Key |
| `GET` | `/api/automation/check/:id/status` | Status/progresso da validação | API Key |
| `POST` | `/api/ops/trigger-m3u` | Sync M3U manual | API Key |
| `POST` | `/api/ops/trigger-epg` | Sync EPG manual | API Key |
| `POST` | `/api/ops/trigger-health` | Health check manual | API Key |
| `GET` | `/api/scraper/status` | Status + relatório do último scraping | API Key |
| `GET` | `/api/scraper/sources` | Lista fontes configuradas | API Key |
| `PATCH` | `/api/scraper/sources/:id` | Habilitar/desabilitar fonte | API Key (admin) |
| `POST` | `/api/scraper/run` | Disparar scraping manualmente | API Key (admin) |

---

## 🔑 Autenticação

Todas as chamadas usam header HTTP:
```
X-API-Key: <valor do API_SECRET_KEY no .env>
```

No n8n, referencie sempre via variável de ambiente `$env.JSTUDIOPLAY_API_KEY` — nunca hardcode a chave nos nós.
