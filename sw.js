/* Cache per giocare offline: solo i file del gioco, i font e la libreria di accesso Firebase.
   Firebase e ogni altro indirizzo passano sempre dalla rete, così la classifica è sempre aggiornata. */
const CACHE = 'seme-stelle-v4';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  const sdk = url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
  if (!same && !font && !sdk) return;
  if (same && url.pathname.endsWith('/version.json')) return; /* il numero di versione arriva sempre dalla rete */
  const keep = res => {
    if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return res;
  };
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(keep).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(keep)));
});
