/* CALCOUNT offline support.

   The app and its food list are kept on the phone, so logging works with no
   signal, which matters for anyone on prepaid data. Opening the app shows the
   copy on the phone straight away and fetches a fresh one quietly behind it,
   so an update arrives on the next open.

   Only CALCOUNT's own files are kept. Barcode lookups and the photo scan go to
   other servers and always need a connection.

   CHANGE THE NAME BELOW WITH EVERY RELEASE. The version in index.html's
   mb-version tag is the one to copy. Old copies are cleared when it changes. */
const CACHE = 'calcount-1.0.0';
const FILES = ['./', './index.html', './foods.js', './manifest.json', './icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('calcount-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // A ?cb= on the address means someone wants a fresh copy to test. Never answer that from the phone's copy.
  if (url.searchParams.has('cb')) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const kept = await cache.match(req, { ignoreSearch: true });
    const fresh = fetch(req).then(res => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => kept);
    return kept || fresh;
  }));
});
