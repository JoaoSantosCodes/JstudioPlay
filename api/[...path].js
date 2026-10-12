/**
 * JstudioPlay — Vercel Edge Function Proxy
 *
 * Faz proxy transparente de todas as rotas /api/* para o backend
 * configurado via variável de ambiente BACKEND_URL.
 *
 * Configure no painel da Vercel:
 *   Settings → Environment Variables → Production
 *   BACKEND_URL = https://sua-url-do-tunnel.trycloudflare.com
 */

// Edge runtime — zero cold start, executa na CDN global da Vercel
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const BACKEND_URL = (process.env.BACKEND_URL || '').replace(/\/+$/, '');

  // Backend não configurado
  if (!BACKEND_URL) {
    return new Response(
      JSON.stringify({
        error: 'Backend não configurado.',
        hint: 'Defina BACKEND_URL nas variáveis de ambiente da Vercel apontando para a URL pública do servidor JstudioPlay (ex: URL do Cloudflare Tunnel).'
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
        'Access-Control-Max-Age':       '86400'
      }
    });
  }

  // Monta a URL de destino no backend
  const url       = new URL(req.url);
  const targetUrl = BACKEND_URL + url.pathname + url.search;

  // Forward dos headers — remove headers específicos da Vercel
  const forwardHeaders = new Headers(req.headers);
  forwardHeaders.set('host', new URL(BACKEND_URL).host);
  forwardHeaders.delete('x-vercel-id');
  forwardHeaders.delete('x-vercel-forwarded-for');
  forwardHeaders.delete('x-vercel-deployment-url');

  try {
    const upstream = await fetch(targetUrl, {
      method:   req.method,
      headers:  forwardHeaders,
      body:     ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      redirect: 'follow'
    });

    const resHeaders = new Headers(upstream.headers);
    resHeaders.set('Access-Control-Allow-Origin',  '*');
    resHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    resHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key');

    return new Response(upstream.body, {
      status:     upstream.status,
      statusText: upstream.statusText,
      headers:    resHeaders
    });

  } catch (err) {
    return new Response(
      JSON.stringify({
        error:      'Não foi possível conectar ao backend JstudioPlay.',
        diagnostic: err.message,
        backend:    BACKEND_URL
      }),
      {
        status:  502,
        headers: {
          'Content-Type':                'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
