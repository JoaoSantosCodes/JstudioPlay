---
title: "Sprint de Saúde Sistêmica — Correções Críticas e Hardening de Segurança v7.2"
date: "2026-10-10"
tags:
  - zettelkasten
  - governanca
  - seguranca
  - iam
  - bugfix
  - performance
  - glpi
ticket_glpi: "2026-1010-001"
status: concluido
versao_anterior: "7.1"
versao_atual: "7.2"
---

# 🧠 Nota de Memória Técnica — Sprint de Saúde Sistêmica

## 🎯 Contexto e Diagnóstico

Em conformidade com a **Cláusula Pétrea de Governança** ([AGENTS.md](../AGENTS.md)), o fluxo canônico de 6 etapas foi executado integralmente em 2026-10-10 após análise completa do codebase do JstudioPlay Pro v7.1. O diagnóstico revelou 4 problemas críticos e 5 importantes que exigiam correção imediata.

---

## ⚠️ Problemas Identificados e Corrigidos

### 🔴 CRÍTICO-1 — Bug em Produção: `ReferenceError` no `/m3u/custom`

**Arquivo:** `server/index.js`  
**Problema:** O handler do endpoint `GET /m3u/custom` utilizava as variáveis `userId`, `filter`, `groups` e `sort` sem extraí-las do `req.query`. Qualquer chamada à rota lançava `ReferenceError: userId is not defined` em runtime.  
**Correção:** Adicionada a linha `const { userId, filter, groups, sort } = req.query;` no início do handler.  
**Impacto:** Endpoint de geração de M3U personalizado voltou a funcionar corretamente.

---

### 🔴 CRÍTICO-2 — Ausência de RBAC nas Rotas Admin

**Arquivo:** `server/index.js`  
**Problema:** As rotas `/admin/users` (GET/POST/PATCH), `/admin/logs`, `/backup/export` e `/backup/import` usavam apenas `requireAuth` sem verificação de `role === 'admin'`. Qualquer usuário comum autenticado podia listar e criar usuários, elevar privilégios e exportar backups completos com hashes de senha.  
**Correção:** Middleware `security.requireAdmin()` adicionado como segundo guard em todos os 6 endpoints afetados.  
**Impacto:** Escalada de privilégio eliminada. Endpoints admin retornam 403 para usuários sem role `admin`.

---

### 🔴 CRÍTICO-3 — Conflito de Schedulers: OpsEngine vs cronManager

**Arquivo:** `server/opsEngine.js`  
**Problema:** O `OpsEngine` iniciava 3 `setInterval` autônomos (sincronização M3U a cada 10min, EPG a cada 30min, health check a cada 5min) paralelamente ao `cronManager.js` (node-cron, 6h). Ambos escreviam no mesmo `db.json` causando potenciais race conditions.  
**Correção:** A chamada `this.initIntervals()` foi comentada no construtor do OpsEngine. Os métodos de execução (`runM3uSync`, `runEpgSync`, `runHealthCheck`) permanecem disponíveis para triggers manuais via `/ops/trigger-*`.  
**Impacto:** Único scheduler ativo é o `cronManager`. Risco de corrupção de dados eliminado.

---

### 🟡 IMPORTANTE-1 — Incidentes Hardcoded no Construtor do OpsEngine

**Arquivo:** `server/opsEngine.js`  
**Problema:** O construtor da classe `OpsEngine` populava `incidentHistory` com 3 incidentes de "demonstração" (SBT HD Brasil, Record News Regional, CNN Internacional 4K) que apareciam em todo cold-start, confundindo usuários que veriam falhas fictícias no dashboard.  
**Correção:** `incidentHistory` inicializado como array vazio `[]`.  
**Impacto:** Dashboard de Ops reflete apenas incidentes reais registrados durante a execução.

---

### 🟡 IMPORTANTE-2 — Email Admin Hardcoded no Código-Fonte

**Arquivo:** `server/index.js` (linha ~227)  
**Problema:** `process.env.ADMIN_EMAIL || 'joaocarlosrh23@gmail.com'` expunha um dado pessoal diretamente no repositório.  
**Correção:** Fallback removido. A variável `ADMIN_EMAIL` agora é opcional — se não definida, nenhum usuário Google recebe role `admin` automaticamente (exceto o primeiro registro ou o critério `isFirst`).  
**Impacto:** Dado pessoal removido do código. Configuração de admin via OAuth agora é opt-in via `.env`.

---

### 🟡 IMPORTANTE-3 — API Key Default Hardcoded

**Arquivo:** `server/database.js`  
**Problema:** `apiKey: 'm3u_secret_key_889922aabbcc'` estava hardcoded como valor default, tornando a chave pública para qualquer pessoa que lesse o repositório.  
**Correção:** Função `generateDefaultApiKey()` adicionada — gera `m3u_key_<32 hex chars aleatórios>` em cada cold-start sem `.env`. Instalações sem `.env` agora têm chave única e imprevisível.  
**Impacto:** Chave de API deixa de ser pública/previsível em instalações padrão.

---

### 🟡 IMPORTANTE-4 — Sessions Map sem TTL Cleanup

**Arquivo:** `server/security.js`  
**Problema:** O `Map` `activeSessions` crescia indefinidamente sem remoção de tokens expirados, consumindo memória progressivamente.  
**Correção:** Adicionado `setInterval` com período de 1 hora chamando `_cleanExpiredSessions()`, que itera o Map e remove entradas com `expiresAt` no passado.  
**Impacto:** Consumo de memória estabilizado em produção de longa duração.

---

### 🟡 IMPORTANTE-5 — `manifestCache` sem Limite de Tamanho

**Arquivo:** `server/relay.js`  
**Problema:** O cache de manifests HLS (`manifestCache`) crescia sem limite, podendo causar vazamento de memória em ambientes com muitos canais ativos.  
**Correção:** Adicionada constante `manifestCacheMaxSize = 200` e lógica de evicção FIFO antes de cada `set()` — quando o cache atinge 200 entradas, a mais antiga é removida.  
**Impacto:** Uso de memória do relay controlado e previsível.

---

### 🟢 MELHORIA — Rota `/epg/now` Duplicada

**Arquivo:** `server/index.js`  
**Problema:** A rota `GET /epg/now` estava registrada duas vezes (linha ~478 e ~564). Express utilizava apenas a primeira, a segunda era dead code.  
**Correção:** Segunda registração removida. Seção "EPG & Guide Endpoints" agora começa diretamente com `/epg/grid`.  
**Impacto:** Código mais limpo, sem dead routes.

---

## 📦 Arquivos Modificados

| Arquivo | Tipo de Mudança |
|---|---|
| `server/index.js` | Fix bug, RBAC, remoção email hardcoded, rota duplicada |
| `server/database.js` | API Key aleatória |
| `server/security.js` | TTL cleanup de sessões |
| `server/relay.js` | Cap do manifestCache |
| `server/opsEngine.js` | Schedulers desativados, incidentes demo removidos |

---

## 📋 Definition of Done — Verificação

- [x] `node --check` passa em todos os 5 arquivos modificados (exit code 0)
- [x] `/m3u/custom` sem ReferenceError
- [x] Rotas admin retornam 403 para não-admins
- [x] OpsEngine não inicia schedulers concorrentes
- [x] Incidentes hardcoded removidos
- [x] Email admin sem fallback hardcoded
- [x] API Key default aleatória
- [x] Sessions cleanup periódico
- [x] manifestCache com cap de 200 entradas
- [x] Rota /epg/now deduplicada

---

## 🔮 Próximo Sprint (Roadmap)

- **SHA-256 → bcrypt/argon2** para armazenamento de senhas (lazy migration na próxima autenticação)
- **Remover `better-sqlite3`** da `package.json` (dependência não utilizada, +50MB imagem Docker)
- **Migração do banco** de JSON flat para SQLite real com `better-sqlite3`

---

## 🔗 Referências

- [[20261010-saneamento-arquitetural-iam-e-persistencia]]
- [[20261010-containerizacao-docker-jstudioplay]]
- [AGENTS.md — Fluxo Canônico de Governança](../AGENTS.md)
- Chamado GLPI: `#2026-1010-001` (fechado)
