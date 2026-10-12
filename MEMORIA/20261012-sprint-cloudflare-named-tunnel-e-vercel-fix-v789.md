---
title: "Cloudflare Named Tunnel Permanente e Fix Edge Function Vercel"
date: "2026-10-12"
tags:
  - zettelkasten
  - governanca
  - cloudflare
  - tunnel
  - docker
  - vercel
  - infraestrutura
  - sre
  - iam
status: concluido
---

# 🌐 Nota de Memória Técnica — Cloudflare Named Tunnel & Vercel Fix (Sprint Infraestrutura)

## 🎯 Contexto e Motivação
A solução anterior dependia de Quick Tunnels efêmeros gerados via `trycloudflare.com`, que alteravam a URL pública a cada reinício do container ou do host, exigindo reconfiguração contínua de variáveis de ambiente. Além disso, as rotas `/api/*` e `/proxy/*` na Vercel estavam sendo capturadas pelo fallback de SPA de `vercel.json` e retornando o `index.html` em vez de acionar a Edge Function proxy.

---

## 🛠️ Artefatos e Entregas

### 1. Cloudflare Named Tunnel Autenticado (`jstudioplay`)
- **Autenticação Concluída**: Certificado de origem `cert.pem` emitido via Cloudflare OAuth associado ao domínio `jstudioplay.com`.
- **Tunnel ID**: `5ccb0c06-e26c-448f-b35c-5101bbb4dfa4`.
- **Rotas DNS Definidas**:
  - `api.jstudioplay.com` -> CNAME para `5ccb0c06-e26c-448f-b35c-5101bbb4dfa4.cfargotunnel.com`.
  - `tunnel.jstudioplay.com` -> CNAME para `5ccb0c06-e26c-448f-b35c-5101bbb4dfa4.cfargotunnel.com`.
- **Credenciais Blindadas (IAM)**:
  - `CREDENCIAIS/cloudflare-tunnel/` contém o arquivo de credenciais `<UUID>.json`, `cert.pem` e `config.yml`.
  - Protegido integralmente pelo `.gitignore`.

### 2. Container `mcp_cloudflared` no `docker-compose.yml`
- Serviço `cloudflared` configurado com imagem `cloudflare/cloudflared:latest`.
- Execução: `tunnel --config /etc/cloudflared/config.yml run`.
- Volume montado em modo somente leitura (`./CREDENCIAIS/cloudflare-tunnel:/etc/cloudflared:ro`).
- Integrado à rede `mcp-network` com `depends_on: jstudioplay` (aguarda `service_healthy`).
- Política de reinício: `restart: unless-stopped`.

### 3. Correção da Edge Function na Vercel (`vercel.json`)
- Adicionada diretiva `"cleanUrls": false`.
- Corrigidos destinos de rewrite para apontar diretamente para a Edge Function `/api/[...path]`.
- Atualizado o regex de fallback SPA com exclusão explícita de `api|proxy|m3u|xtream|player_api.php`, garantindo que requisições de API nunca retornem HTML.

---

## 🧪 Validação & DoD
- **Configuração Ingress Validada**: `cloudflared tunnel --config ... ingress validate` -> `OK`.
- **Testes Automatizados**: `npm test` executado com 100% de sucesso (autenticação, session, proxy HLS, validação de streams e exportação M3U).
- **Segurança & IAM**: Zero credenciais expostas no Git.
