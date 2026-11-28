const CACHE_NAME = 'beatstar-v102';

// Cache-first for immutable/versioned static assets so Render egress drops to ~0 bytes on repeat loads.
const STATIC_EXT_RE = /\.(?:js|mjs|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|mp3|ogg|wav|wasm|onnx)(?:$|\?)/i;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (!req || req.method !== 'GET') return;

  const url = req.url || '';
  let parsed;
  try {
    parsed = new URL(url);
  } catch (_) {
    return;
  }

  // Only manage same-origin assets; never intercept APK downloads, streaming audio, or dynamic APIs
  if (parsed.origin !== self.location.origin) return;
  const p = parsed.pathname || '';
  if (
    p.includes('/download/apk') ||
    p.includes('download_apk') ||
    p.endsWith('.apk') ||
    p.startsWith('/api/')
  ) {
    return;
  }

  // 1. HTML Navigation: Stale-While-Revalidate (instant 0ms open from cache + tiny ETag 304 check in background)
  if (req.mode === 'navigate' || p === '/' || p.endsWith('/index.html') || p.endsWith('/game.html')) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req, { ignoreSearch: true });
      const netPromise = fetch(req).then((res) => {
        if (res && res.ok && res.type === 'basic') {
          cache.put(req, res.clone()).catch(() => {});
        }
        return res;
      }).catch(() => null);

      if (cached) {
        e.waitUntil(netPromise);
        return cached;
      }
      const netRes = await netPromise;
      return netRes || new Response('Sin conexión', { status: 503 });
    })());
    return;
  }

  // 2. Versioned / Static Assets (JS, CSS, images, audio, vendor, release_tags_map.json): Cache-First (0 Render bytes on hit!)
  const isCacheableStatic =
    STATIC_EXT_RE.test(p) ||
    p.includes('/assets/') ||
    p.includes('/songs/') ||
    p.endsWith('/release_tags_map.json') ||
    p.endsWith('/manifest.json');

  if (isCacheableStatic) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;

      const netRes = await fetch(req);
      if (netRes && netRes.ok && (netRes.status === 200) && netRes.type === 'basic') {
        cache.put(req, netRes.clone()).catch(() => {});
      }
      return netRes;
    })());
  }
});
