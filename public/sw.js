const CACHE_NAME = 'setlist-v1';
const STATIC_ASSETS = ['/', '/events', '/expenses', '/insights', '/settings'];

/* ─── Install: pre-cache static shell ───────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  // Activate immediately without waiting for existing tabs to close
  self.skipWaiting();
});

/* ─── Activate: purge old caches ────────────────────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

/* ─── Fetch: network-first with cache fallback ───────────────────────────── */
self.addEventListener('fetch', (event) => {
  // Only handle GET requests; skip non-HTTP schemes (chrome-extension, etc.)
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache a clone of every successful response
        if (response.ok) {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        // Network failed — serve from cache (offline support)
        caches.match(event.request),
      ),
  );
});
