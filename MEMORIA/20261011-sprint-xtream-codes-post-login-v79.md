# 📺 Memória Técnica: Conector Xtream Codes API Pós-Login & Gestão de IPTV Pago (v7.8.1)

- **ID do Zettelkasten:** `20261011050800`
- **Data/Hora:** 2026-10-11 05:08 BRT
- **Chamado GLPI Vinculado:** `2026-1011-XTREAM-POST-LOGIN`
- **Autor / Agente:** Antigravity Tech Lead & SRE Governance
- **Status:** ✅ Concluído e Validado (100% Green Tests & UI Flow Validada)
- **Tags:** #iptv #xtream-codes #vod #movies #series #smart-tv #glpi #security #iam

---

## 🎯 Contexto e Deliberação

O usuário solicitou suporte a provedores de IPTV pagos (serviços baseados no padrão **Xtream Codes API**, que utilizam Server URL, Usuário e Senha), com uma restrição arquitetural explícita: **essa conexão deve ser feita obrigatoriamente após o usuário ter realizado o login em sua conta JstudioPlay**.

---

## 🛠️ Arquitetura e Implementação

### 1. Back-End & Serviço Cliente Xtream (`server/services/xtreamClient.js` e `server/index.js`)
- Criado o conector nativo `XtreamClient` com suporte aos protocolos padrão da indústria:
  - **Validação de Credenciais:** `POST /api/playlists/xtream/validate` consulta o endpoint `player_api.php` com User-Agent compatível (`IPTVSmarters/2.2.2.1`), retornando dados de status, data de expiração, conexões ativas e limites.
  - **Importação Completa:** `POST /api/playlists/xtream` realiza download da grade via M3U Plus (`/get.php?type=m3u_plus&output=m3u8`) com fallback automatizado para endpoints JSON (`get_live_streams`, `get_vod_streams`, `get_series`).
  - **Mapeamento de Mídia:** Separação canônica entre canais ao vivo (HLS `.m3u8`), catálogo de filmes sob demanda (VOD `.mp4`/`.mkv`) e séries/episódios.

### 2. Front-End Desacoplado & UX Pós-Login (`public/static/app.js`)
- **Tela de Login Pública Limpa:** Removidos campos e abas de Xtream Codes da tela inicial, mantendo o acesso exclusivo às contas locais do JstudioPlay (Usuário e Senha).
- **Modal de Playlists (`#/playlists`):** Adicionada a aba de alta fidelidade **"Servidor Xtream Codes (IPTV Pago)"**:
  - Campos: *Nome da Conexão*, *Server URL*, *Usuário* e *Senha*.
  - Botão **[Testar Conexão]**: Dispara handshake assíncrono exibindo status, data de expiração e conexões ativas em tempo real.
  - Botão **[Conectar e Importar]**: Registra a playlist na conta do usuário, define como ativa e notifica a conclusão.
- **Limite de Playlists:** Aumentado de 2 para 50 playlists por conta.

---

## 🧪 Evidências de Teste e Validação

1. **Testes Automatizados:** `npm test` aprovado com **100% de sucesso** (7/7 suites verdes).
2. **Validação de Erros de Rede:** Teste de host inválido respondeu de forma amigável: `Servidor IPTV não encontrado ou porta inacessível. Confira o endereço.`
3. **Evidência Visual 1 (Login Limpo):** `clean_login_screen_1791705256458.png`.
4. **Evidência Visual 2 (Modal Pós-Login):** `xtream_codes_provider_modal_1791705933462.png`.
