const CACHE_NAME = "apuestas-pro-cache-v1";

// Archivos que se guardan en caché para modo offline
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/config.js",
  "/manifest.webmanifest",
  "/assets/icons/icon-72x72.png",
  "/assets/icons/icon-96x96.png",
  "/assets/icons/icon-128x128.png",
  "/assets/icons/icon-144x144.png",
  "/assets/icons/icon-152x152.png",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-384x384.png",
  "/assets/icons/icon-512x512.png"
];

// 🧭 Instalación del service worker
self.addEventListener("install", (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Archivos cacheados");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ♻️ Activación y limpieza de caché antigua
self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Borrando caché antigua", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// 📡 Intercepción de fetch (modo offline)
self.addEventListener("fetch", (evt) => {
  evt.respondWith(
    caches.match(evt.request).then((response) => {
      return response || fetch(evt.request).catch(() => {
        // Si no hay conexión y no está en caché, responde vacío
        return new Response("Contenido no disponible offline", {
          status: 503,
          statusText: "Offline"
        });
      });
    })
  );
});