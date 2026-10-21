// Okul Takip — çevrimdışı çalışma için service worker.
// Uygulama dosyası güncellendiğinde SURUM değerini artırın.
const SURUM = "okul-takip-v1";
const KABUK = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SURUM).then(c => c.addAll(KABUK)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(adlar => Promise.all(adlar.filter(a => a !== SURUM).map(a => caches.delete(a))))
    .then(() => self.clients.claim()));
});

// Önce önbellekten göster, arka planda güncelle (stale-while-revalidate).
// Yazı tipleri (Google Fonts) de önbelleğe alınır; internet yokken sistem yazı tipine düşer.
self.addEventListener("fetch", e => {
  const istek = e.request;
  if (istek.method !== "GET") return;
  const url = new URL(istek.url);
  const kendi = url.origin === location.origin;
  const yaziTipi = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!kendi && !yaziTipi) return;

  e.respondWith(caches.open(SURUM).then(async c => {
    const anahtar = istek.mode === "navigate" ? "./index.html" : istek;
    const onbellek = await c.match(anahtar, { ignoreSearch: istek.mode === "navigate" });
    const ag = fetch(istek).then(yanit => {
      if (yanit && (yanit.ok || yanit.type === "opaque")) c.put(anahtar, yanit.clone());
      return yanit;
    }).catch(() => onbellek);
    if (onbellek) { e.waitUntil(ag); return onbellek; }
    return ag;
  }));
});
