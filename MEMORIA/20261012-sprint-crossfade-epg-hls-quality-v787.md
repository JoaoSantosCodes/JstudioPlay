# 20261012 - Crossfade de Hero, Barra EPG nos Cards e Seleção Manual de Qualidade HLS (v7.8.7)

- **Data / Horário:** 12/10/2026 (UTC-3)
- **Autor / Agente:** Kiro (Pair Programming)
- **Status:** Concluído e Validado (100% Green Tests)
- **Tags:** #ux #player #hls #crossfade #epg #qualidade #streaming #governance

---

## 1. Contexto & Requisito

Sprint de fechamento do roadmap das sprints v7.5 e v7.6. Três itens atacados:

1. **Crossfade de hero ao trocar canal** — troca abrupta de background no `nf-hero-bg`.
2. **Barra de progresso EPG nos cards** — dados do `epgModule.cache` não eram exibidos nos cards do carrossel.
3. **Seleção manual de qualidade HLS** — `hls.levels` disponível mas sem UI de escolha para o usuário.

---

## 2. Sala de Guerra — Veredito Consolidado

| Perspectiva | Avaliação |
| :--- | :--- |
| **Arquiteto** | Frontend-only. Crossfade via double-buffer DOM + CSS `opacity transition`. EPG usa cache existente do `epgModule` — zero fetch. Seleção HLS via `hls.currentLevel` (já documentado na HLS.js API). |
| **SRE** | `requestAnimationFrame` duplo garante que o browser aplica o novo background antes de iniciar o fade da camada anterior. `setTimeout(380ms)` remove o nó temporário após a transição completa. |
| **Produto** | Crossfade elimina flash branco ao trocar canal — melhora percepção de qualidade. Barra EPG é diferencial vs. TiviMate. Seleção de qualidade atende power users em conexões limitadas. |
| **Segurança & IAM** | Nenhuma credencial nova. Nenhum endpoint novo. |

---

## 3. Implementação Técnica

### 3.1 Crossfade de Hero (`public/static/app.js` — `updateStreamingHero`)

**Técnica double-buffer:**
1. Cria `div.nf-hero-bg-prev` com o background atual (`position:absolute`, `z-index:1`).
2. Aplica o novo background no `nf-hero-bg` original (fica por baixo, `z-index:0`).
3. Dois `requestAnimationFrame` aninhados garantem que o browser renderizou o novo fundo.
4. Inicia `opacity: 0` na camada anterior — CSS `transition: opacity 350ms ease`.
5. `setTimeout(380ms)` remove o nó temporário do DOM.

**Resultado:** transição suave de 350ms sem flash, sem reflow, sem re-render de DOM pesado.

### 3.2 Barra de Progresso EPG nos Cards (`renderChannelCard`)

- Consulta `window.epgModule?.cache?.get(ch.name)` — cache em memória, zero fetch.
- Calcula percentual: `(Date.now() - start) / (end - start) * 100`.
- Renderiza `.nf-card-epg-bar` + `.nf-card-epg-fill` com `width: ${pct}%`.
- Exibe `.nf-card-epg-title` com o título do programa atual (truncado).
- Canais sem EPG no cache não recebem a barra — sem espaço reservado.

### 3.3 Seleção Manual de Qualidade HLS

**HTML:** `<select id="hls-level-select">` adicionado na `.nf-hero-vc-row`, entre botão Reconectar e Fullscreen. Inicialmente `hidden`.

**`updateHlsQualityBadge(instance)`** expandida:
- Preenche o `<select>` com os níveis disponíveis (`4K / FHD / HD / SD · X.XMbps`).
- Opção `-1` = "🔄 Auto" (ABR padrão do HLS.js).
- Reconstrói as options apenas quando o número de níveis muda (evita flicker).
- `sel.onchange` define `instance.currentLevel = Number(sel.value)`.
- Sincroniza `sel.value` em cada `LEVEL_SWITCHED`.

### 3.4 CSS (`public/static/design-v8.css`)
- `.nf-hero-bg-prev` — camada temporária de crossfade.
- `.nf-card-epg-bar` + `.nf-card-epg-fill` — barra vermelha no rodapé do card.
- `.nf-card-epg-title` — título do programa em `0.62rem`, truncado, `text-shadow`.
- `#hls-level-select` — estilo consistente com `.nf-audio-track` existente.

### 3.5 Cache-Busting
- `public/index.html`: assets bumped para `v=7.8.7`.
- `public/sw.js`: cache PWA atualizado para `jstudioplay-cache-v7.8.7`.

---

## 4. Arquivos Modificados

| Arquivo | Descrição |
|---|---|
| `public/static/app.js` | `updateStreamingHero` (crossfade), `renderChannelCard` (EPG bar), `updateHlsQualityBadge` (levels select), HTML `#hls-level-select` |
| `public/static/design-v8.css` | CSS crossfade, EPG bar, HLS select |
| `public/index.html` | Cache-busting v7.8.7 |
| `public/sw.js` | Cache PWA v7.8.7 |

---

## 5. Definition of Done (DoD)

- [x] `node --check public/static/app.js` → exit 0
- [x] `npm test` → 7/7 suítes verdes
- [x] Crossfade: fade out da imagem anterior em 350ms, sem flash
- [x] EPG bar: percentual calculado localmente, sem fetch, visível apenas se cache hit
- [x] Seleção HLS: dropdown preenchido com níveis reais, sincronizado com `LEVEL_SWITCHED`
- [x] Cache-busting v7.8.7 em `index.html` e `sw.js`
- [x] Push para `origin/main`

---

## 6. Roadmap Restante

- Webhook de confirmação de pagamento PIX
- Painel expandido de qualidade HLS (gráfico de bitrate em tempo real)
- Notificação push quando crédito for adicionado pelo Master

---

## 🔗 Referências

- [[20261012-sprint-ai-dashboard-hls-quality-v786]]
- [[20261011-sprint-streaming-redesign-v76]]
- [[20261011-sprint-ux-core-v75]]
- [AGENTS.md — Fluxo Canônico de Governança](../AGENTS.md)
