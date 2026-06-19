/* MesaFácil — Service Worker
 * Da soporte offline (caché del app shell) y notificaciones push.
 * Estrategias:
 *  - Navegaciones (HTML): network-first con fallback a la caché ('/').
 *  - Estáticos del mismo origen: cache-first poblando la caché al vuelo.
 *  - API (/api): no se cachea (siempre red).
 */

const CACHE = 'mesafacil-v1';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // No interceptar llamadas al API ni recursos de otros orígenes
  if (url.pathname.startsWith('/api') || url.origin !== self.location.origin) return;

  // Navegaciones: network-first, fallback a la caché del shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Estáticos: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// --- Notificaciones push (re-engagement) ---
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'MesaFácil', body: event.data.text() };
  }
  const options = {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: payload.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(payload.title || 'MesaFácil', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(self.clients.openWindow(target));
});
