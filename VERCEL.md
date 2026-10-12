# 🚀 Deploy na Vercel — JstudioPlay

## Arquitetura

```
Browser → Vercel (jstudio-play.vercel.app)
              ├── /static/*  → CDN Vercel (cache imutável)
              ├── /api/*     → Edge Function → Backend (via BACKEND_URL)
              └── /*         → index.html (SPA fallback)

Backend → Docker local (porta 3030)
              └── Cloudflare Tunnel → URL pública HTTPS
```

---

## Configuração Inicial (única vez)

### 1. Instale a Vercel CLI
```bash
npm install -g vercel
vercel login
```

### 2. Vincule o projeto à Vercel
```bash
vercel link
# Selecione o projeto: jstudio-play
```

### 3. Configure a URL do backend

O backend precisa de uma URL pública HTTPS. Use o Cloudflare Tunnel:

```bat
# No Windows, execute:
scripts\windows\iniciar_tunnel_vercel.bat
```

Esse script:
- Inicia o Cloudflare Tunnel automaticamente
- Captura a URL gerada (ex: `https://abc-def.trycloudflare.com`)
- Atualiza `BACKEND_URL` nas variáveis de ambiente da Vercel
- Faz redeploy automático

### 4. Ou configure manualmente no painel da Vercel

```
vercel.app → Settings → Environment Variables → Production
Chave:  BACKEND_URL
Valor:  https://sua-url.trycloudflare.com
```

Depois faça redeploy:
```bash
vercel --prod
```

---

## Uso diário

Cada vez que reiniciar o computador, execute o tunnel novamente:

```bat
scripts\windows\iniciar_tunnel_vercel.bat
```

> **Nota:** O Cloudflare Quick Tunnel (`trycloudflare.com`) gera uma URL diferente a cada restart.  
> Para URL fixa, configure um [Cloudflare Tunnel permanente](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) com domínio próprio.

---

## Variáveis de Ambiente na Vercel

| Variável | Descrição | Exemplo |
|---|---|---|
| `BACKEND_URL` | URL pública do backend JstudioPlay | `https://abc.trycloudflare.com` |

---

## Estrutura de Arquivos

```
vercel.json          → Configuração de rotas e headers
api/[...path].js     → Edge Function proxy para o backend
public/              → Frontend estático (servido pela Vercel CDN)
```
