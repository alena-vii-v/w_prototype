const C = "whoosh4-v54";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const old = (await caches.keys()).filter(k => k.startsWith("whoosh4-") && k !== C);
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    // only when replacing an older build: reload open windows once so the new version shows right away
    if (old.length) {
      const list = await self.clients.matchAll({ type: "window" });
      await Promise.all(list.map(c => c.navigate(c.url).catch(() => null)));
    }
  })());
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const isPage = e.request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html");
  if (isPage) {
    // network first so a new deploy is picked up; cached copy only when offline
    e.respondWith(fetch(e.request).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)); return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
