// Service Worker Naéora — cache pour installation PWA
const CACHE_NAME = 'naeora-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/naeora-app.html',
  '/manifest.json',
  '/naeora-ambient.mp3',
  '/splash.webp'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
  )));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
