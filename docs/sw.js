const CACHE_NAME = "shinsen-enemy-db-v58-frontend-v2416";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=2.4.16",
  "./app.js?v=2.4.16",
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
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("shinsen-enemy-db-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
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
  const isVersionedCore = url.searchParams.has("v") && ["app.js", "styles.css"].some((name) => url.pathname.endsWith(name));
  const isShellAsset = APP_SHELL.some((path) => path !== "./" && new URL(path, self.registration.scope).href === url.href)
    && !isCoreFile;
  const isPinnedModule = url.hostname === "cdn.jsdelivr.net" && /\/npm\/.*@\d+\.\d+\.\d+[^/]*\//.test(url.pathname);

  if ((url.origin === self.location.origin && (isVersionedCore || isShellAsset)) || isPinnedModule) {
    // バージョン付き本体・静的素材・固定バージョンの依存は、キャッシュがあれば通信しない。
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) event.waitUntil(cache.put(event.request, response.clone()));
      return response;
    })());
    return;
  }

  if (url.origin === self.location.origin && (isCoreFile || isNavigation)) {
    event.respondWith(
      // HTML・設定は毎回最新を確認する。HTTPキャッシュの条件付き取得を利用できる形にする。
      fetch(event.request, { cache: "no-cache" })
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            const cacheKey = isNavigation ? new URL("./index.html", self.registration.scope).href : event.request;
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, copy)));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached ?? (isNavigation ? caches.match("./index.html") : undefined))),
    );
    return;
  }

  // APIや未分類の外部通信はブラウザへ任せ、私有データをService Workerへ保存しない。
});
