// Cloudflare Pages / Workers Advanced Proxy Worker
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Se for OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key, *',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Rotas de backend (API, Proxy de mídia, Streams, EPG, Xtream)
    if (
      url.pathname.startsWith('/api') ||
      url.pathname.startsWith('/proxy') ||
      url.pathname.startsWith('/live') ||
      url.pathname.startsWith('/m3u') ||
      url.pathname.startsWith('/xtream') ||
      url.pathname.startsWith('/player_api.php')
    ) {
      const BACKEND_URL = env.BACKEND_URL || 'https://casio-genesis-elections-pct.trycloudflare.com';
      const targetUrl = new URL(url.pathname + url.search, BACKEND_URL);

      const forwardHeaders = new Headers(request.headers);
      forwardHeaders.set('host', targetUrl.host);
      forwardHeaders.set('x-forwarded-host', url.host);
      forwardHeaders.set('x-forwarded-proto', url.protocol.replace(':', ''));

      try {
        const response = await fetch(targetUrl.toString(), {
          method: request.method,
          headers: forwardHeaders,
          body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
          redirect: 'follow'
        });

        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key, *');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      } catch (err) {
        return new Response(
          JSON.stringify({
            error: 'Não foi possível conectar ao servidor local JstudioPlay através do túnel.',
            diagnostic: err.message
          }),
          {
            status: 502,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
    }

    // Para arquivos estaticos (HTML, CSS, JS, logo, etc.)
    return env.ASSETS.fetch(request);
  }
};
