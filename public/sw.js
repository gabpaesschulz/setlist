const CACHE_VERSION = 'v2';
const STATIC_CACHE_NAME = `setlist-static-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `setlist-runtime-${CACHE_VERSION}`;
const MAX_RUNTIME_ENTRIES = 120;
const STATIC_ASSETS = ['/', '/events', '/expenses', '/insights', '/settings'];
const CACHEABLE_DESTINATIONS = new Set(['document', 'script', 'style', 'font', 'image']);
const DISALLOWED_PATH_PREFIXES = ['/api/', '/_next/image', '/artist-image'];

function isHttpGetRequest(request) {
  return request.method === 'GET' && request.url.startsWith('http');
}

function isSameOriginRequest(request) {
  return new URL(request.url).origin === self.location.origin;
}

function isDisallowedPath(pathname) {
  return DISALLOWED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isCacheableDestination(destination) {
  return destination === '' || CACHEABLE_DESTINATIONS.has(destination);
}

/**
 * Aplica a política de elegibilidade de requests para cache controlado.
 * @param {Request} request
 * @returns {boolean}
 */
function shouldHandleRequest(request) {
  if (!isHttpGetRequest(request)) return false;
  if (!isSameOriginRequest(request)) return false;
  const url = new URL(request.url);
  if (isDisallowedPath(url.pathname)) return false;
  return isCacheableDestination(request.destination);
}

/**
 * Define se uma resposta pode ser persistida em cache runtime.
 * @param {Response} response
 * @returns {boolean}
 */
function shouldCacheResponse(response) {
  return response.ok && response.type !== 'opaque';
}

async function trimRuntimeCache() {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const keys = await cache.keys();
  const overflow = keys.length - MAX_RUNTIME_ENTRIES;
  if (overflow <= 0) return;
  await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
}

async function cacheRuntimeResponse(request, response) {
  if (!shouldCacheResponse(response)) return;
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  await cache.put(request, response.clone());
  await trimRuntimeCache();
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    await cacheRuntimeResponse(request, response);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/');
  }
}

/**
 * Aplica stale-while-revalidate para manter resposta rápida com atualização assíncrona.
 * @param {Request} request
 * @returns {Promise<Response|undefined>}
 */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const networkPromise = fetch(request).then(async (response) => {
    await cacheRuntimeResponse(request, response);
    return response;
  });

  if (cached) {
    networkPromise.catch(() => undefined);
    return cached;
  }

  try {
    return await networkPromise;
  } catch {
    return caches.match(request);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE_NAME, RUNTIME_CACHE_NAME].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (!shouldHandleRequest(event.request)) return;
  const strategy = event.request.mode === 'navigate' ? networkFirst : staleWhileRevalidate;
  event.respondWith(strategy(event.request));
});

self.__SW_INTERNALS__ = {
  shouldHandleRequest,
  shouldCacheResponse,
  isDisallowedPath,
  isCacheableDestination,
};

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const url = notification?.data?.url || '/';
  notification.close();

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // Focus an existing tab if already open
      for (const client of clientsList) {
        // @ts-expect-error cliente do service worker não tipa url de forma estrita
        if (client.url && client.url.includes(self.origin)) {
          // @ts-expect-error cliente do service worker não tipa focus de forma estrita
          await client.focus();
          // @ts-expect-error cliente do service worker não tipa navigate de forma estrita
          await client.navigate(url);
          return;
        }
      }
      // Otherwise open a new window
      await self.clients.openWindow(url);
    })(),
  );
});
