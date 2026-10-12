# 20261012 - Dashboard de Status da IA, Indicador de Qualidade HLS e Remoção de Dependência Obsoleta (v7.8.6)

- **Data / Horário:** 12/10/2026 (UTC-3)
- **Autor / Agente:** Kiro (Pair Programming)
- **Status:** Concluído e Validado (100% Green Tests)
- **Tags:** #ai #hls #qualidade #dashboard #ux #docker #dependencias #governance #iptv

---

## 1. Contexto & Requisito

Sprint de backlog atacando 4 itens do roadmap acumulado desde as sprints v7.4, v7.5 e v7.8.5:

1. **`better-sqlite3` em `package.json`** — dependência declarada mas nunca importada desde v7.3. +50MB na imagem Docker, compilação nativa desnecessária.
2. **Dashboard de status da IA** — endpoint `/api/integrations/status` existia no backend sem tela de operação no frontend.
3. **Handler `buy-credits`** — modal de checkout PIX estava referenciado no HTML mas sem handler no event switch.
4. **Indicador de qualidade HLS** — HLS.js expõe `levels` e `bandwidthEstimate`; dados não estavam sendo surfaced na UI.

---

## 2. Sala de Guerra — Veredito Consolidado

| Perspectiva | Avaliação |
| :--- | :--- |
| **Arquiteto** | Todos os itens são frontend-only ou `package.json`. Zero impacto em backend ou schema. |
| **SRE** | Remoção de `better-sqlite3` reduz imagem Docker ~50MB e elimina `python3/make/g++` no Dockerfile. Badge HLS via `bandwidthEstimate` — leitura passiva, zero request adicional. |
| **Produto** | Dashboard IA dá visibilidade operacional. Badge de qualidade é diferencial vs. concorrentes. Handler PIX fecha o fluxo de revenda. |
| **Segurança & IAM** | Rota `#/ai-status` protegida por guard `['admin','master']`. Chave PIX lida de `CREDENCIAIS/.env`. Nenhuma credencial nova. |

---

## 3. Implementação Técnica

### 3.1 Remoção de `better-sqlite3` (`package.json`)
- Removidas as entradas `"better-sqlite3": "^11.8.1"` de `dependencies` e `"better-sqlite3@11.8.1": true` de `allowScripts`.
- Dependência nunca foi importada (`require('better-sqlite3')`) em nenhum arquivo do projeto.

### 3.2 Dashboard de Status da IA (`public/static/app.js`)

**Rota nova:** `#/ai-status` — protegida para `admin` e `master`.

**`aiStatusPage()`** — renderiza:
- Header com timestamp da última verificação e botão "Atualizar".
- Grid 3×1 de cards para **Ollama**, **pgvector** e **SearXNG** com badge Online/Offline e detalhe (model/version/error).
- Card do **Scraper M3U** com 4 stats: canais, playlists, última execução, erros.
- Botões de ação: "Descobrir fontes M3U" e link para logs.

**Sidebar:** item "Status da IA" adicionado para `admin` e `master` (ícone `refresh`).

**State:** `state.aiStatus` adicionado ao estado global, populado no `renderRoute` via `api('/integrations/status')`.

**Handlers novos no event switch:**
- `refresh-ai-status` — refetch do endpoint e re-render do `#content`.
- `ai-discover` — POST `/integrations/discover` com feedback de toast.
- `buy-credits` — POST `/credits/checkout` com modal PIX + link WhatsApp.

### 3.3 Indicador de Qualidade HLS (`public/static/app.js`)

**`updateHlsQualityBadge(instance)`** — função nova:
- Lê `instance.levels[instance.currentLevel]` para resolução (`height`).
- Lê `instance.bandwidthEstimate` para throughput em Mbps.
- Mapeia altura → label: `4K` (≥2160), `FHD` (≥1080), `HD` (≥720), `SD` (≥480).
- Cria/atualiza badge `#hls-quality-badge` no container do vídeo.
- Disparada em `MANIFEST_PARSED` e `LEVEL_SWITCHED` — sem requests extras.

### 3.4 CSS (`public/static/design-v8.css`)
- Módulo **Status da IA**: `.ai-status-wrapper`, `.ai-svc-grid`, `.ai-svc-card`, `.ai-scraper-card`, `.ai-scraper-grid`, `.ai-status-badge` com variantes `.ai-ok`, `.ai-err`, `.ai-run`, `.ai-idle`.
- **Badge HLS**: `.hls-quality-badge` — posicionado `absolute top-left` no container do vídeo, fundo glassmorphism, cor verde com borda.
- **`.credit-balance-pill`** — pílula roxa para saldo de créditos na topbar (complemento da v7.8.5).

### 3.5 Cache-Busting
- `public/index.html`: todos os assets bumped para `v=7.8.6`.
- `public/sw.js`: cache PWA atualizado para `jstudioplay-cache-v7.8.6`.

---

## 4. Arquivos Modificados

| Arquivo | Descrição |
|---|---|
| `package.json` | Remoção de `better-sqlite3` de dependencies e allowScripts |
| `public/static/app.js` | `aiStatusPage()`, `updateHlsQualityBadge()`, handlers, rota, sidebar, state |
| `public/static/design-v8.css` | Módulo CSS IA + badge HLS + credit-balance-pill |
| `public/index.html` | Cache-busting v7.8.6 |
| `public/sw.js` | Cache PWA v7.8.6 |

---

## 5. Definition of Done (DoD)

- [x] `node --check public/static/app.js` → exit 0
- [x] `node --check server/index.js` → exit 0
- [x] `npm test` → 7/7 suítes verdes
- [x] `better-sqlite3` removido do `package.json`
- [x] `aiStatusPage()` renderiza cards Ollama, pgvector, SearXNG e Scraper
- [x] Rota `#/ai-status` protegida para `admin`/`master`
- [x] `updateHlsQualityBadge` dispara em `MANIFEST_PARSED` e `LEVEL_SWITCHED`
- [x] Handler `buy-credits` abre modal PIX com chave e link WhatsApp
- [x] CSS completo dos novos componentes
- [x] Cache-busting v7.8.6 em `index.html` e `sw.js`
- [ ] Push para `origin/main`

---

## 6. Próximos Passos (Roadmap Restante)

- Crossfade de hero ao trocar canal (animação CSS `fade`)
- Barra de progresso EPG nos cards do carrossel
- Painel expandido de qualidade HLS (seleção manual de nível)
- Webhook de confirmação de pagamento PIX

---

## 🔗 Referências

- [[20261012-sprint-revendedor-creditos-v785]]
- [[20261010-sprint-integracao-ai-v74]]
- [[20261011-sprint-ux-core-v75]]
- [AGENTS.md — Fluxo Canônico de Governança](../AGENTS.md)
