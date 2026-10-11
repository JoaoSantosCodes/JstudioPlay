---
title: "Sprint v74 — Integração de IA: Ollama, pgvector e SearXNG"
date: "2026-10-10"
tags:
  - zettelkasten
  - governanca
  - ai
  - ollama
  - pgvector
  - searxng
  - embeddings
  - busca-semantica
  - glpi
ticket_glpi: "2026-1010-v74"
status: concluido
versao_anterior: "7.3"
versao_atual: "7.4"
commits:
  - "533a2d0 feat(ai): integrar Ollama, pgvector e SearXNG ao stack JstudioPlay [sprint-v74]"
---

# 🧠 Nota de Memória Técnica — Sprint v74

## 🎯 Contexto e Diagnóstico

Sprint de integração de inteligência artificial ao stack JstudioPlay, adicionando três serviços externos orquestrados por um hub central:

| Serviço | Função |
|---|---|
| **Ollama** | LLM local (`hermes3`) + embeddings (`nomic-embed-text`) |
| **pgvector** | Banco vetorial PostgreSQL para busca semântica |
| **SearXNG** | Meta-buscador para descoberta dinâmica de fontes M3U |

---

## 🛠️ Serviços Criados

### 🤖 `server/services/ollamaClient.js` (125 linhas)

Cliente para comunicação com Ollama local:
- **Modelo LLM:** `hermes3` — geração de texto e enriquecimento de metadados.
- **Modelo de embeddings:** `nomic-embed-text` — geração de vetores para busca semântica.
- Métodos: `generateEmbedding(text)`, `enrichMetadata(channel)`, `healthCheck()`.
- Configurável via `OLLAMA_URL` no `.env`.

---

### 🗄️ `server/services/vectorStore.js` (170 linhas)

Integração com banco de dados vetorial PostgreSQL (pgvector):
- **Schema:** tabela `mcp_knowledge` com coluna `embedding vector(768)`.
- **Operação principal:** busca semântica de canais por similaridade de cosseno.
- Métodos: `search(query, limit)`, `upsert(channel, embedding)`, `healthCheck()`.
- Configurável via `PGVECTOR_HOST`, `PGVECTOR_PORT`, `PGVECTOR_DB`, `PGVECTOR_USER`, `PGVECTOR_PASSWORD`.

---

### 🔍 `server/services/searxngClient.js` (126 linhas)

Cliente para SearXNG — descoberta dinâmica de fontes M3U:
- Busca metabuscador local por fontes M3U públicas relevantes.
- Filtragem e validação de URLs retornadas.
- Método: `discoverSources(query)`, `healthCheck()`.
- Configurável via `SEARXNG_URL` no `.env`.

---

### 🎛️ `server/services/integrationHub.js` (179 linhas)

**Orquestrador central** dos 3 serviços de IA:
- Coordena fluxo: SearXNG → descoberta → Ollama embedding → pgvector armazenamento.
- Enriquecimento em batch de playlists (`AI_ENRICH_BATCH` itens por execução).
- Health check agregado de todos os serviços.

---

## 🌐 Endpoints REST Adicionados (`server/index.js`)

| Método | Rota | Função |
|---|---|---|
| `GET` | `/api/integrations/status` | Health check de Ollama + pgvector + SearXNG |
| `POST` | `/api/integrations/enrich/:id` | Enriquecimento AI de playlist específica |
| `GET` | `/api/integrations/search?q=...` | Busca semântica de canais via pgvector |
| `POST` | `/api/integrations/discover` | Descoberta dinâmica de fontes via SearXNG |
| `GET` | `/api/integrations/scraper-analysis` | Análise do relatório do scraper via LLM |

---

## 🔄 Workflow n8n

**`n8n-workflows/5_ai_enrichment_and_search.json`** — novo workflow:
- **Cron:** 04:00 diário — enriquecimento automático em batch.
- **Webhook:** busca semântica sob demanda.

---

## ⚙️ Configuração Docker

**Correção do `mcp_searxng`:**
- `settings.yml` corrigido com `secret_key` válida.
- Formato JSON habilitado para respostas da API.
- **Resultado:** todos os 15 containers UP após a sprint.

---

## 📦 Arquivos Criados/Modificados

| Arquivo | Tipo |
|---|---|
| `server/services/ollamaClient.js` | Novo — cliente Ollama |
| `server/services/vectorStore.js` | Novo — cliente pgvector |
| `server/services/searxngClient.js` | Novo — cliente SearXNG |
| `server/services/integrationHub.js` | Novo — orquestrador AI |
| `n8n-workflows/5_ai_enrichment_and_search.json` | Novo — workflow AI |
| `server/index.js` | +67 linhas (5 endpoints novos) |
| `package.json` | +`pg@8.13.3` |
| `package-lock.json` | Atualizado |
| `.env.example` | +`OLLAMA_URL`, `PGVECTOR_*`, `SEARXNG_URL`, `AI_ENRICH_BATCH` |

---

## 📋 Definition of Done — Verificação

- [x] `ollamaClient.js` criado com suporte a LLM + embeddings
- [x] `vectorStore.js` criado com busca semântica por cosseno
- [x] `searxngClient.js` criado com descoberta de fontes M3U
- [x] `integrationHub.js` orquestrando os 3 serviços
- [x] 5 endpoints REST adicionados ao `server/index.js`
- [x] Workflow n8n `5_ai_enrichment_and_search.json` criado
- [x] `mcp_searxng` corrigido (settings.yml + JSON habilitado)
- [x] 15 containers Docker UP
- [x] `.env.example` atualizado com todas as novas variáveis
- [x] `package.json` com `pg@8.13.3`

---

## 🔮 Próximos Passos (Roadmap)

- Fine-tuning do modelo Ollama com dados do catálogo IPTV local.
- Cache de embeddings para evitar recálculo em canais não alterados.
- Dashboard de status de IA na interface web.
- Remoção definitiva de `better-sqlite3` da `package.json` (dependência não utilizada, +50MB na imagem Docker).

---

## 🔗 Referências

- [[20261010-sprint-scraper-e-reorganizacao-v73]]
- [[20261010-sprint-saude-sistemica-v72]]
- [[20261010-containerizacao-docker-jstudioplay]]
- [AGENTS.md — Fluxo Canônico de Governança](../AGENTS.md)
- Commit: `533a2d0`
