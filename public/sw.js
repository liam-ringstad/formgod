// FormGod AI Service Worker – minimal offline shell caching
const CACHE_NAME = "formgod-v1";
const OFFLINE_URLS = ["/", "/dashboard", "/analyze"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    // Network-first strategy for API routes
    if (event.request.url.includes("/api/")) return;

    event.respondWith(
        fetch(event.request).catch(() =>
            caches.match(event.request).then((response) => response || caches.match("/"))
        )
    );
});
