// Maternal Care – service worker (offline). Đổi V khi muốn buộc làm mới bộ nhớ đệm.
const V = 'mc-v2';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // Mở trang: ưu tiên bản mới từ mạng, mất mạng thì dùng bản đã lưu
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put('index.html', cp)); return res; }).catch(() => caches.match('index.html')));
    return;
  }
  // File cùng nguồn: dùng bản lưu trước
  if (u.origin === location.origin) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })));
    return;
  }
  // Phông chữ Google: dùng bản lưu, đồng thời làm mới nền
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.host)) {
    e.respondWith(caches.open(V).then(c => c.match(r).then(m => { const f = fetch(r).then(res => { c.put(r, res.clone()); return res; }).catch(() => m); return m || f; })));
  }
});
