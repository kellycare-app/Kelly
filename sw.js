// Kelly Care — cache dell'app per apertura veloce e uso offline
const CACHE = 'kelly-care-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './style.css',
  './app1.js',
  './app2.js',
  './app3.js',
  './app4.js',
  './app4b.js',
  './app5.js',
  './app6.js',
  './app7.js',
  './app8.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
      if (windows.length) return windows[0].focus();
      return clients.openWindow('./');
    })
  );
});
