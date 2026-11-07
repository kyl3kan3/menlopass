/* peri service worker — offline-first shell cache.
   Bump CACHE when any cached file changes. */
const CACHE_PREFIX = 'meno-compass-';
const CACHE = `${CACHE_PREFIX}v21`;
const ASSETS = [
  './',
  './index.html',
  './privacy.html',
  './support.html',
  './terms.html',
  './get-app.html',
  './manifest.webmanifest',
  './assets/fonts/bricolage-grotesque-latin.woff2',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', event => {
  // Treat the shell as one atomic unit. A missing icon or manifest should fail
  // installation instead of silently leaving users with a partial offline app.
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Only app routes may update or fall back to the tracker shell. Public
    // pages keep their own cache entries, including on subdirectory installs.
    const root = new URL('./', self.registration.scope);
    const shell = new URL('./index.html', root);
    const isAppRoute = url.pathname === root.pathname || url.pathname === shell.pathname;
    const cacheKey = isAppRoute ? shell.href : request;
    event.respondWith(
      fetch(request)
        .then(async response => {
          if (!response.ok) return response;
          const copy = response.clone();
          const cache = await caches.open(CACHE);
          await cache.put(cacheKey, copy);
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE);
          return await cache.match(cacheKey) || new Response('This page is unavailable offline.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // The remaining shell assets are immutable within a cache version.
  event.respondWith(
    caches.match(request).then(async cached => {
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    })
  );
});
