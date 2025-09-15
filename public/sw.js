self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
// Push Event abfangen
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Erinnerung";
  const options = {
    body: data.body || "Es ist Zeit!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [500, 200, 500],
    requireInteraction: true // bleibt sichtbar, bis Nutzer reagiert
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
