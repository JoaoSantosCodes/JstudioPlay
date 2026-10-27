# 🏛️ Zettelkasten: Hover Cards Cinemáticos & Títulos Semelhantes Netflix (v8.3.12)

- **Data:** 2026-10-27
- **Status:** Concluído / 100% Testes Verdes
- **Versão:** `8.3.12` (versionCode 4)
- **Tags:** #netflix-clone #hover-card #vod #modal #ui #ux #streaming #recommendations

---

## 1. Contexto e Motivação

Inspirando-se nas melhores práticas de UX e micro-interações do repositório `jason-liu22/netflix-clone-react-typescript` e da interface oficial da Netflix, a versão 8.3.12 introduziu:
1. **Cards do catálogo com expansão e ações rápidas no Hover (`.iptv-card-hover-actions`)**:
   - Botão rápido de Play (`quick-play-catalog`).
   - Botão de Favoritar com coração ❤️ (`quick-fav-catalog`).
   - Botão de Detalhes (`catalog-card-click`).
2. **Grade de "Mais títulos como este" no Modal VOD (`.iptv-vod-similar-section`)**:
   - Grade responsiva com 6 títulos semelhantes da mesma categoria/gênero.
   - Navegação contínua com atualização imediata sem fechar o modal.

---

## 2. Decisões Arquiteturais

- **Zero Dependências Pesadas:** Portado de React/MUI para Vanilla JS + CSS nativo com transições aceleradas por GPU (`will-change: transform`).
- **Media Query Precisa:** O efeito hover expandido só ativa em dispositivos com suporte a hover (`@media (hover: hover) and (pointer: fine)`), preservando a UX de toque em smartphones Android e TVs D-pad.
- **Suíte Canônica:** `scripts/test_netflix_hover_and_similar_v8312.js` com 15 asserções automatizadas cobrindo CSS, DOM e dispatchers de eventos.

---

## 3. Binários Produzidos
- [JstudioPlay-v8.3.12.apk](file:///d:/Area%20de%20Desenvolvimento/Apps/JstudioPlay/dist-android/JstudioPlay-v8.3.12.apk)
- [JstudioPlay-v8.3.12.aab](file:///d:/Area%20de%20Desenvolvimento/Apps/JstudioPlay/dist-android/JstudioPlay-v8.3.12.aab)
