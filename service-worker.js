// service-worker.js
const CACHE_NAME = 'av-classes-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// INSTALL
self.addEventListener('install', (event) => {
  console.log('🟢 Service Worker Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// ACTIVATE  
self.addEventListener('activate', (event) => {
  console.log('🟢 Service Worker Activated');
});

// FETCH
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
