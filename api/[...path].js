/**
 * JstudioPlay — Vercel API Proxy
 *
 * Faz proxy transparente de todas as rotas /api/* para o backend
 * configurado via variável de ambiente BACKEND_URL.
 *
 * Configure no painel da Vercel:
 *   Settings → Environment Variables → BACKEND_URL = https://sua-url-do-tunnel.trycloudflare.com
 */

export const config = { runtime: 'edge' };

const BACKEND_URL = (process.env.BACKEND_URL || '').replace(/\/+$/, '');

export default async function handler(req) {
  if (!BACKEND_URL) {
    return new Response(
      JSON.stringify({
        error: 'Backend não configurado.',
        hint: 'Defina a variável BACKEND_URL nas configurações da Vercel apontando para a URL pública do seu servidor JstudioPlay.'
      }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const url = new URL(req.url);
  // Remove o prefixo /api do path para repassar ao backend
  const targetPath = url.pathname.replace(/^\/api/, '/api') + url.search;
  const targetUrl = BACKEND_URL + targetPath;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
        'Access-Control-Max-Age':       '86400',
      }
    });
  }

  // Forward da requisição
  const forwardHeaders = new Headers(req.headers);
  forwardHeaders.set('host', new URL(BACKEND_URL).host);
  forwardHeaders.delete('x-vercel-id');
  forwardHeaders.delete('x-vercel-forwarded-for');

  try {
    const upstream = await fetch(targetUrl, {
      method:  req.method,
      headers: forwardHeaders,
      body:    ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      redirect: 'follow',
    });

    const resHeaders = new Headers(upstream.headers);
    resHeaders.set('Access-Control-Allow-Origin',  '*');
    resHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    resHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key');

    return new Response(upstream.body, {
      status:     upstream.status,
      statusText: upstream.statusText,
      headers:    resHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error:      'Não foi possível conectar ao backend JstudioPlay.',
        diagnostic: err.message,
        backendUrl: BACKEND_URL,
      }),
      {
        status:  502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
}
