# 🚀 Guia de Integração M3U PLAY Pro + n8n

Este diretório contém os fluxos de automação prontos para importação direta no **n8n**.

---

## 📋 Fluxos Disponíveis

| Arquivo | Descrição | Gatilho (Trigger) |
| :--- | :--- | :--- |
| **`1_m3u_stream_validator_and_alerts.json`** | Valida todos os canais das playlists automaticamente a cada 6h e gera relatórios de estabilidade. | Agendador Cron (6h) / Manual |
| **`2_automated_playlist_cleaner_bot.json`** | Recebe qualquer URL de M3U, testa todos os streams e devolve um link com apenas os canais 🟢 Online. | Webhook / Bot |
| **`3_client_provisioning_and_delivery.json`** | Cria novos clientes automaticamente após compras (Stripe/Hotmart/Kiwify) e entrega acessos temporários. | Webhook de Pedido |

---

## 🔑 Configuração da API Key

Todas as requisições enviadas do **n8n** para o **M3U PLAY** utilizam autenticação por cabeçalho:

- **Cabeçalho:** `X-API-Key`
- **Valor padrão:** `m3u_secret_key_889922aabbcc` *(pode ser alterado na aba "Automação & n8n" do painel)*

---

## 📥 Como Importar os Fluxos no n8n

1. Abra seu painel do **n8n** (`http://localhost:5678` ou seu servidor em nuvem).
2. Clique em **Workflows** → **Add Workflow** (`+`).
3. No canto superior direito, clique nos três pontinhos (`...`) → **Import from File** (ou copie o conteúdo do arquivo `.json` e pressione `Ctrl+V` dentro do canvas do n8n).
4. O fluxo será renderizado automaticamente com todos os nós configurados.
5. Clique em **Save** e **Active**.

---

## 🛠️ Detalhes dos Fluxos

### 1. Validador de Streams & Alertas (`1_m3u_stream_validator_and_alerts.json`)
- **Objetivo:** Monitoramento contínuo de uptime dos streams.
- **Funcionamento:**
  1. O nó `Schedule Trigger` dispara a cada 6 horas.
  2. Consulta as playlists ativas via `GET /api/playlists`.
  3. Dispara a validação simultânea com 15 workers em segundo plano.
  4. Aguarda a conclusão e formata um relatório com percentual de canais ativos.
  5. Pronto para conectar a nós de **Telegram**, **Discord**, **WhatsApp (Evolution API / Z-API)** ou **E-mail**.

---

### 2. Sanitizador de Playlists M3U (`2_automated_playlist_cleaner_bot.json`)
- **Objetivo:** Transformar listas brutas e cheias de canais offline em listas limpas com 100% dos canais funcionando.
- **Payload de Exemplo para Teste (POST para a URL do Webhook no n8n):**
```json
{
  "m3u_url": "https://iptv-org.github.io/iptv/countries/br.m3u",
  "playlist_name": "Lista Limpa do Cliente"
}
```
- **Resposta do Webhook:**
```json
{
  "success": true,
  "playlistId": "pl_1791134136320",
  "onlineChannels": 48,
  "downloadM3uUrl": "http://localhost:3000/api/playlists/pl_1791134136320/export?filter=online",
  "webPlayerUrl": "http://localhost:3000/#/player",
  "message": "🎉 Sua lista foi limpa com sucesso! 48 canais online disponíveis."
}
```

---

### 3. Provisionamento Automático de Clientes (`3_client_provisioning_and_delivery.json`)
- **Objetivo:** Entrega de acessos automatizada para clientes ou testes rápidos.
- **Payload de Exemplo (POST):**
```json
{
  "customer_name": "Carlos Silva",
  "customer_email": "carlos@gmail.com",
  "customer_phone": "5511999998888",
  "plan_days": 30
}
```
- **O fluxo:**
  1. Cria o usuário no banco de dados com data de expiração calculada (`expiresAt = hoje + 30 dias`).
  2. Monta uma mensagem personalizada pronta para envio por WhatsApp ou E-mail.
  3. Retorna as credenciais de login e o link direto do Web Player.

---

## 🌐 Endpoints da API REST para n8n

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/webhooks/stats` | Resumo de métricas (uptime, canais online/offline) |
| `POST` | `/api/webhooks/validate` | Dispara teste de canais via webhook |
| `POST` | `/api/webhooks/provision-user` | Criação/Renovação de contas de usuários |
| `GET` | `/api/playlists/:id/export?filter=online` | Download direto do arquivo `.m3u` filtrado |
