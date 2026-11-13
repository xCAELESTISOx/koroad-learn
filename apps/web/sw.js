// Service worker: the app works fully offline. Everything it needs (the page, scripts, styles,
// the question bank inside the script, pictures and icons) is precached on install, versioned
// per build. Paths are relative to the worker, so the app runs under any subpath (GitHub Pages).
//
// vite.config.ts fills in BUILD at build time: a version per build and the files to precache.
const BUILD = __BUILD__;
const PREFIX = "koroad-";
const CACHE = PREFIX + BUILD.version;
const BASE = new URL("./", self.location).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(BUILD.precache.map((path) => new Request(BASE + path, { cache: "reload" })));
    })(),
  );
});

// The page asks for this only when it is safe to switch (no session running).
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!url.href.startsWith(BASE)) return;
  if (request.mode === "navigate") {
    event.respondWith(caches.match(BASE + "index.html", { cacheName: CACHE }).then((hit) => hit ?? fetch(request)));
    return;
  }
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok && res.type === "basic") {
    const copy = res.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return res;
}
