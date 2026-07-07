const CACHE = 'senderismoso-v10';
const ASSETS = [
  './', './index.html', './manifest.json', './data/rutas.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Clima Open-Meteo + GitHub API + tiles de mapa: network-only, no cachear
  if (e.request.url.includes('api.open-meteo.com') ||
      e.request.url.includes('api.github.com') ||
      e.request.url.includes('tile.openstreetmap.org')) {
    e.respondWith(fetch(e.request).catch(() => Response.error()));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
