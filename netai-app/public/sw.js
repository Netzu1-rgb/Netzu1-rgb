// NetAI: modo sin conexión.
// - Archivos con nombre único (/_next/static): primero la copia guardada, porque nunca cambian.
// - Páginas y demás: primero la red; si no hay conexión, o la red tarda más de 3 segundos, la última copia guardada.
// - Las rutas /api nunca se guardan.

const CACHE = 'netai-cache-v4';
const PRECACHE = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Solo se guardan respuestas completas, propias y que no sean redirecciones (por ejemplo, al login)
const storable = (res) => res && res.status === 200 && res.type === 'basic' && !res.redirected;

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (storable(res)) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
    return;
  }

  const fromCache = async () => {
    const hit = await caches.match(req, { ignoreSearch: req.mode === 'navigate' });
    if (hit) return hit;
    return req.mode === 'navigate' ? caches.match('/app') : undefined;
  };
  const fromNetwork = fetch(req).then((res) => {
    if (storable(res)) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  });
  // Con mala señal no se espera indefinidamente: a los 3 segundos se muestra la copia guardada, si existe,
  // y la respuesta de la red igual actualiza la copia para la próxima vez.
  const slow = new Promise((resolve) => setTimeout(resolve, 3000)).then(fromCache);
  const late = slow.then((hit) => hit || fromNetwork);
  late.catch(() => {});
  event.respondWith(
    Promise.race([fromNetwork, late])
      .catch(async () => (await fromCache()) || new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }))
  );
  event.waitUntil(fromNetwork.catch(() => {}));
});

// Al tocar un recordatorio, abre la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => new URL(c.url).pathname.startsWith('/app'));
      return open ? open.focus() : self.clients.openWindow('/app');
    })
  );
});
