const CACHE_NAME = 'beatstar-v11';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url || '';
  const isCodeOrHtml = url.includes('.js') || url.includes('.html') || url.includes('.css') || e.request.mode === 'navigate';
  const fetchOpts = isCodeOrHtml ? { cache: 'no-cache' } : undefined;
  e.respondWith(
    fetch(e.request, fetchOpts).catch(() => caches.match(e.request))
  );
});
