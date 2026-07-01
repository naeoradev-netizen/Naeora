// Service Worker Naéora — mise en cache pour fonctionnement hors-ligne basique
const CACHE_NAME = 'naeora-v1';
const ASSETS = [
  './',
  './index.html',
  './naeora-splash-final.html',
  './naeora-ambient.mp3',
  './splash.webp'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
