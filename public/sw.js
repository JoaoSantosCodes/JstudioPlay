const CACHE_NAME = 'jstudioplay-cache-v7.8.1';
const ASSETS_TO_CACHE = [
  '/',
  '/static/app.js?v=7.8.1',
  '/static/styles.css?v=7.8.1',
  '/static/design-v8.css?v=7.8.1',
  '/static/automation.js?v=7.8.1',
  '/static/automation.css?v=7.8.1',
  '/static/logo.svg',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/proxy') ||
    url.pathname.startsWith('/live') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/player_api.php') ||
    url.pathname.includes('.m3u8') ||
    url.pathname.includes('.ts') ||
    url.pathname.includes('.m4s') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Network first for HTML and JS/CSS to ensure fresh updates
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
