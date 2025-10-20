// ===============================
// ⚽ Apuestas PRO - Service Worker
// ===============================
const CACHE_NAME = "apuestaspro-v2";
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./app-v2.js",
  "./config-v2.js",
  "./styles.css",
  "./manifest.webmanifest",
  "./icon-72x72.png",
  "./icon-96x96.png",
  "./icon-128x128.png",
  "./icon-144x144.png",
  "./icon-152x152.png",
  "./icon-192x192.png",
  "./icon-384x384.png",
  "./icon-512x512.png"
];

// Instalar SW y cachear recursos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(
        URLS_TO_CACHE.map(url => 
          cache.add(url).catch(err => console.warn("❌ No se pudo cachear", url, err))
        )
      ))
      .then(() => self.skipWaiting())
  );
});

// Activar SW y limpiar cachés antiguas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  return self.clients.claim();
});

// Fetch con preferencia red y fallback caché
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

// Forzar actualización desde la app si es necesario
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
