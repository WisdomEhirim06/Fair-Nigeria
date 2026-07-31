/* eslint-disable no-undef */
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `fn-static-${CACHE_VERSION}`;
const PAGES_CACHE = `fn-pages-${CACHE_VERSION}`;
const API_CACHE = `fn-api-${CACHE_VERSION}`;
const OWNED_CACHES = [STATIC_CACHE, PAGES_CACHE, API_CACHE];

const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icons/icon.svg', '/manifest.webmanifest'];

const MAX_PAGES = 40;
const MAX_API_ENTRIES = 80;

/**
 API paths safe to cache: public, non-personal reads.
 */
const PUBLIC_API = [
  /\/api\/v1\/articles(\/|$|\?)/,
  /\/api\/v1\/sheets(\/|$|\?)/,
  /\/api\/v1\/dashboard(\/|$|\?)/,
  /\/api\/v1\/audit(\/|$|\?)/,
  /\/api\/v1\/geography(\/|$|\?)/,
  /\/api\/v1\/elections(\/|$|\?)/,
];

function isCacheableApi(url) {
  const path = url.pathname + url.search;
  // The admin article list is not public despite sitting under /articles.
  if (/\/api\/v1\/articles\/admin/.test(path)) return false;
  return PUBLIC_API.some((re) => re.test(path));
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest'
  );
}

async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  // Oldest-first: Cache API preserves insertion order.
  await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith('fn-') && !OWNED_CACHES.includes(n)).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  const type = event.data && event.data.type;
  // The page asks us to activate a waiting update.
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  // Sign-out: drop anything we hold that reflects a session's browsing.
  if (type === 'CLEAR_CACHES') {
    event.waitUntil(Promise.all([caches.delete(API_CACHE), caches.delete(PAGES_CACHE)]));
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GETs are ever served from cache. Writes must always reach the network
  // so nothing is silently "sent" from a stale copy.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never touch the sheet bucket: originals run to several megabytes and the
  // browser's own HTTP cache handles thumbnails perfectly well.
  if (url.pathname.includes('/cdn-cgi/image/') || /\.(jpg|jpeg|png|pdf)$/i.test(url.pathname)) {
    return;
  }

  // Full-page navigations: try the network, fall back to a cached page, then to
  // the offline page — so a reader is never dropped onto a browser error.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cacheablePage = url.origin === self.location.origin && /^(\/|\/results|\/audit|\/articles|\/sheets)(\/|$)/.test(url.pathname);
        try {
          const fresh = await fetch(request);
          if (cacheablePage && fresh.ok) {
            const cache = await caches.open(PAGES_CACHE);
            cache.put(request, fresh.clone());
            void trimCache(PAGES_CACHE, MAX_PAGES);
          }
          return fresh;
        } catch {
          if (cacheablePage) {
            const cache = await caches.open(PAGES_CACHE);
            const cached = await cache.match(request);
            if (cached) return cached;

          }
          const offline = await caches.match(OFFLINE_URL);
          return offline ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Build output and icons are immutable — serve instantly, fetch once.
  if (url.origin === self.location.origin && isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        if (fresh.ok) {
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, fresh.clone());
        }
        return fresh;
      })(),
    );
    return;
  }

  // Public API reads: prefer the network so figures are current, but keep a
  // copy so the library and results stay readable without a connection.
  if (isCacheableApi(url)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          if (fresh.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, fresh.clone());
            void trimCache(API_CACHE, MAX_API_ENTRIES);
          }
          return fresh;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          throw new Error('offline and uncached');
        }
      })(),
    );
  }
});
