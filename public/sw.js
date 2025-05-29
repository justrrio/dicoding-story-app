const CACHE_NAME = "dicoding-story-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/src/styles/style.css",
  "/src/scripts/app.js",
  "/offline.html",
  "/icons/app-icon.svg",
  "/icons/icon-144x144.svg",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(event.request).catch(() => {
          // If both cache and network fail, show offline page
          if (event.request.destination === "document") {
            return caches.match("/offline.html");
          }
        })
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
