const CACHE_NAME = 'jimmy-legaliti-v2';
const assetsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './1000103317.png',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

// Instalar el Service Worker y almacenar los archivos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(assetsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar y limpiar cachés antiguas
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
    })
  );
});

// Interceptar peticiones para servir los archivos sin internet
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si está en caché, lo devuelve; si no, intenta ir a la red
        return response || fetch(event.request);
      }).catch(() => {
        // Fallback opcional si no hay red ni caché
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});