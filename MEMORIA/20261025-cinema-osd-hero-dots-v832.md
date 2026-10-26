# 🎬 Registro Técnico Zettelkasten: JstudioPlay Cinema, OSD VOD Theater & Hero Dots (v8.3.2)

- **ID:** `20261025-cinema-osd-hero-dots-v832`
- **Data/Hora:** 2026-10-25 21:38 BRT
- **Chamado GLPI Vinculado:** `CHAMADO-GLPI-2026-1025-007`
- **Versão:** `v8.3.2`
- **Tags:** `#jstudioplay #cinema #vod #osd #playbackrate #herodots #svgfallback #ui-ux #zettelkasten`

---

## 1. Contexto & Motivação Técnica

Após a introdução do Smart Failover e do Mosaico 2x2 na v8.3.0/v8.3.1, a experiência visual e de controle nos fluxos de reprodução sob demanda (VOD) e na tela inicial (Dashboard) demandavam refinamentos estéticos e operacionais de nível estúdio cinematográfico:
1. **OSD Cinemático Completo no Player VOD (`openVodTheater`)**:
   - Barra de timeline com track responsivo, preenchimento dinâmico de buffer (`v.buffered`) e scrubber para seek instantâneo.
   - Seletor de velocidade de reprodução adaptativa: `0.75x`, `1.0x (Normal)`, `1.25x`, `1.5x`, `2.0x`.
   - Botões com microinterações para Skip -10s e Skip +10s.
   - Ocultação inteligente por inatividade do cursor do usuário após 3.5 segundos (`.iptv-vod-theater.idle-hidden`).
   - Mapeamento completo de atalhos de teclado no modo Theater (<kbd>Espaço</kbd>, <kbd>←</kbd>, <kbd>→</kbd>, <kbd>M</kbd>, <kbd>F</kbd>, <kbd>Esc</kbd>).
2. **Carrossel Dinâmico de Destaques com Dots & Auto-Rotação no Hero Banner**:
   - Rotação suave a cada 10 segundos entre os top 5 títulos em destaque da biblioteca.
   - Pílulas (dots) interativas com feedback visual de ativação e hover.
   - Pausa inteligente na auto-rotação quando o usuário passa o cursor sobre o banner (`mouseenter` / `mouseleave`).
3. **Fallback Elegante para Pôsteres Quebrados (`window.handlePosterError`)**:
   - Geração dinâmica de SVG inline com gradiente suave em tons escuros e tipografia limpa, eliminando imagens quebradas ou placeholders vazios.
4. **Ambient Glow & Animações Micro-Interativas**:
   - Efeito de pulso de luz `@keyframes pulseGlow` nos badges de destaque e transmissão ao vivo.

---

## 2. Arquitetura das Alterações

### 2.1 Frontend & SPA (`public/static/app.js`)
- `formatVodTime(sec)`: Formatação padronizada em `MM:SS` ou `HH:MM:SS`.
- `window.handlePosterError(img, title)`: Interceptador de falha de carregamento de imagens com substituição por SVG vetorial temático.
- `resetVodIdleTimer()`: Gestor de inatividade que aplica a classe `.idle-hidden` no `#vod-theater`.
- `skipVodTime(delta)`: Avanço ou retrocesso de reprodução com feedback visual flutuante.
- `setVodPlaybackRate(rate)`: Ajuste dinâmico de `video.playbackRate`.
- `openVodTheater(target)`: Atualizado com a estrutura OSD completa no rodapé do player.
- `changeHeroSlide(idx)` & `initHeroAutoRotate()`: Gestão do estado do carrossel no Dashboard.
- Event listeners globais para atalhos de teclado no theater e evento `change` para velocidade.

### 2.2 Design System (`public/static/design-v8.css`)
- Seção 25:
  - `.iptv-vod-theater-controls`, `.iptv-vod-timeline-row`, `.iptv-vod-progress-track`, `.iptv-vod-buffer-bar`, `.iptv-vod-progress-bar`, `.iptv-vod-progress-scrubber`.
  - `.iptv-vod-btn`, `.iptv-vod-btn-round`, `.iptv-vod-btn-play`, `.iptv-vod-speed-select`.
  - `.iptv-hero-dots-container`, `.iptv-hero-dot`, `.iptv-hero-dot.active`.
  - `@keyframes pulseGlow`.

### 2.3 Suíte de Testes Automatizada (`scripts/test_cinema_v832.js`)
- 22 asserções cobrindo autenticação, integridade do SPA, presença de classes CSS, versionamento e cache-busting.

---

## 3. Validação e Definition of Done (DoD)

- **Total de Suítes Executadas:** 7
- **Total de Testes:** 126
- **Status:** **100% Aprovados (126 PASS | 0 FAIL)**
- **Containers Docker:** `mcp_jstudioplay` ativo e saudável (`healthy`).
- **Segurança IAM:** Nenhuma credencial exposta em código; arquivo `CREDENCIAIS/.env` preservado em `.gitignore`.
- **Status do Chamado GLPI:** Concluído com sucesso.
