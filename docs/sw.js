const CACHE_NAME = "shinsen-enemy-db-v28-frontend-v1612";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=1.6.12",
  "./app.js?v=1.6.12",
  "./config.js",
  "./manifest.webmanifest",
  "./robots.txt",
  "./icons/favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  if (url.hostname.endsWith("supabase.co") || url.hostname.includes("googleapis.com")) return;

  const isCoreFile = ["config.js", "app.js", "styles.css", "index.html", "sw.js"].some((name) =>
    url.pathname.endsWith(name),
  );
  const isNavigation = event.request.mode === "navigate";

  if (url.origin === self.location.origin && (isCoreFile || isNavigation)) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached ?? caches.match("./index.html"))),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});
