/* Meno Compass service worker — offline-first shell cache.
   Bump CACHE when any cached file changes. */
const CACHE_PREFIX = 'meno-compass-';
const CACHE = `${CACHE_PREFIX}v10`;
const ASSETS = [
  './',
  './index.html',
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
    // Prefer fresh HTML online; only navigation requests receive the app-shell
    // fallback, so a missing image or manifest never receives HTML by mistake.
    event.respondWith(
      fetch(request)
        .then(async response => {
          if (!response.ok) throw new Error(`Navigation failed: ${response.status}`);
          const copy = response.clone();
          const cache = await caches.open(CACHE);
          await cache.put('./index.html', copy);
          return response;
        })
        .catch(() => caches.match('./index.html'))
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
