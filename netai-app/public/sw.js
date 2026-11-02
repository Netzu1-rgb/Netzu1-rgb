/**
 * NetAI Service Worker - PWA Offline Caching
 */

const CACHE_NAME = 'netai-wellness-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/login',
  '/app',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// Instalación: Pre-almacenar en caché el núcleo de la aplicación
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activación: Limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Intercepción de peticiones (Network First con fallback a Cache)
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET o que sean hacia las APIs dinámicas
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/auth')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, clonar y actualizar caché
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // En caso de estar sin conexión, devolver del caché
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si es una navegación y no está en caché, devolver la PWA
          if (event.request.mode === 'navigate') {
            return caches.match('/app');
          }
          return new Response('Sin conexión', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
