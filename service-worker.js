const CACHE_NAME = "cyber-homekeeper-v27";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./mobile-polish.css",
  "./app.js",
  "./manifest.webmanifest",
  "./qisi-cutout.png",
  "./assets/apple-touch-icon.png",
  "./assets/icon-180.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/main/fridge-closed.jpg",
  "./assets/main/fridge-open.jpg",
  "./assets/main/closet-closed.jpg",
  "./assets/main/closet-open.jpg",
  "./assets/ui/home-hero-house.jpg",
  "./assets/ui/tab-fridge.png",
  "./assets/ui/tab-clothes.png",
  "./assets/ui/tab-dates.png",
  "./assets/ui/tab-storage.png",
  "./assets/ui/tab-restock.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => {
        self.clients.matchAll({ type: "window" }).then((clients) => {
          clients.forEach((client) => client.postMessage({ type: "sw-updated" }));
        });
      })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
