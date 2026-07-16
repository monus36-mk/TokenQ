const CACHE_NAME = 'tokenq-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force update immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open pages
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Bypass caching for API calls and Next.js internal files (prevents ChunkLoadError)
  if (event.request.url.includes('/api/') || event.request.url.includes('/_next/') || event.request.url.includes('webpack')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Cache external page visits if applicable
        if (event.request.method === 'GET' && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    }).catch(() => {
      // Fallback offline behavior
      return caches.match('/');
    })
  );
});
