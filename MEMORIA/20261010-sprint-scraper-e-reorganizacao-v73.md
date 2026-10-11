---
title: "Sprint v73 — Scraper M3U Automático, Reorganização de Scripts e Integração n8n+Docker"
date: "2026-10-10"
tags:
  - zettelkasten
  - governanca
  - scraper
  - docker
  - n8n
  - refatoracao
  - glpi
ticket_glpi: "2026-1010-v73"
status: concluido
versao_anterior: "7.2"
versao_atual: "7.3"
commits:
  - "b7716f1 feat(scraper): adicionar raspagem diaria automatica de fontes M3U publicas [sprint-v73]"
  - "e2bc6eb feat(docker+n8n): integrar n8n no stack Docker e corrigir todos os workflows"
---

# 🧠 Nota de Memória Técnica — Sprint v73

## 🎯 Contexto e Diagnóstico

Sprint focado em três frentes simultâneas:
1. **Scraper M3U automático** — raspagem diária de fontes públicas sem intervenção manual.
2. **Reorganização de scripts** — consolidação de utilitários espalhados na raiz para estrutura `scripts/` hierárquica.
3. **Integração n8n + Docker** — serviço n8n incorporado ao stack Docker com comunicação interna via `mcp-network`.

---

## 🛠️ Funcionalidades Implementadas

### 📡 Scraper M3U Automático (`server/services/m3uScraper.js`)

**Novo serviço** com 431 linhas responsável por:
- Raspagem automática de fontes M3U públicas conhecidas.
- Parsing e normalização de entradas brutas.
- Deduplicação de canais por URL de stream.
- Persistência no `db.json` com metadados de origem.

**Endpoint REST novo:**
- Integrado via `cronManager.js` para execução diária às 03:00.

---

### 🐳 Integração n8n no Docker (`docker-compose.yml`)

**Serviço adicionado:** `mcp_n8n`
- Integrado à `mcp-network` existente.
- `depends_on` com `condition: service_healthy` no `jstudioplay` (healthcheck configurado).
- Volume `n8n_data` persistente para preservar workflows entre restarts.
- Variáveis de ambiente: `JSTUDIOPLAY_API_KEY` e `JSTUDIOPLAY_INTERNAL_URL`.

---

### 🔧 Correção dos Workflows n8n

**Problema:** API Key e URL hardcoded (`localhost:3000`) em todos os workflows.

**Correção aplicada em 5 arquivos:**
| Workflow | Mudança |
|---|---|
| `1_m3u_stream_validator_and_alerts.json` | API Key → env var; URL → `mcp_jstudioplay:3030` |
| `2_automated_playlist_cleaner_bot.json` | Idem |
| `3_client_provisioning_and_delivery.json` | Idem |
| `m3u_play_ops_orchestrator.json` | Idem |
| `4_daily_scraper_orchestrator.json` | **Novo** — cron 03:00 + webhook manual + loop de retry + alerta condicional |

---

### 📁 Reorganização de Scripts

Consolidação de ~40 arquivos utilitários da raiz para estrutura organizada:

```
scripts/
├── build/          # build_frontend.js, format_js.js, setup_public.js
├── cloudflare/     # worker.js, wrangler.jsonc
├── inspect/        # analyze.js, check_*.js, extract_*.js, inspect_*.js
├── seed/           # add_*.js, fix_db.js, restore_app.js, seed_sample.js
├── windows/        # *.bat, *.ps1, *.vbs
├── scraper.py
├── test_e2e_full.js
└── test_system.js
```

**Movimentações de servidor:**
```
server/database.js     → server/db/database.js
server/db-migrate.js   → server/db/db-migrate.js
server/db-schema.js    → server/db/db-schema.js
server/cronManager.js  → server/infra/cronManager.js
server/opsEngine.js    → server/infra/opsEngine.js
server/epgManager.js   → server/services/epgManager.js
server/m3uEnricher.js  → server/services/m3uEnricher.js
server/m3uHub.js       → server/services/m3uHub.js
server/m3uParser.js    → server/services/m3uParser.js
server/streamChecker.js → server/services/streamChecker.js
```

---

### 📖 Documentação n8n (`n8n-workflows/README_N8N.md`)

Documentação completa reescrita cobrindo:
- Setup inicial do n8n no Docker.
- Todos os endpoints disponíveis.
- Instruções de importação de workflows.
- Variáveis de ambiente necessárias.

---

## 📦 Arquivos Criados/Modificados

| Arquivo | Tipo |
|---|---|
| `server/services/m3uScraper.js` | Novo serviço |
| `n8n-workflows/4_daily_scraper_orchestrator.json` | Novo workflow |
| `docker-compose.yml` | Adição serviço n8n |
| `server/infra/cronManager.js` | Movido + integração scraper |
| `n8n-workflows/*.json` (4 existentes) | Correção API Key + URL |
| `n8n-workflows/README_N8N.md` | Reescrita completa |
| `.env.example` | Novas variáveis Docker/n8n |
| ~40 scripts | Reorganização para `scripts/` |

---

## 📋 Definition of Done — Verificação

- [x] `m3uScraper.js` criado e integrado ao cronManager
- [x] Serviço `mcp_n8n` no docker-compose com healthcheck
- [x] Todos os workflows com env vars (sem hardcode)
- [x] URL interna `mcp_jstudioplay:3030` em todos os workflows
- [x] Scripts reorganizados em estrutura hierárquica
- [x] Módulos server/ reorganizados em `db/`, `infra/`, `services/`
- [x] Imports atualizados após movimentação de arquivos
- [x] README_N8N.md documentando o setup completo

---

## 🔮 Próximo Sprint (v74)

- Integração de IA com Ollama (LLM local hermes3)
- Embeddings via pgvector para busca semântica de canais
- SearXNG para descoberta dinâmica de fontes M3U

---

## 🔗 Referências

- [[20261010-sprint-saude-sistemica-v72]]
- [[20261010-containerizacao-docker-jstudioplay]]
- [AGENTS.md — Fluxo Canônico de Governança](../AGENTS.md)
- Commits: `b7716f1`, `e2bc6eb`
