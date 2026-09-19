/* ══════════════════════════════════════════════════════════════════════════
   MOTHERBASE · THE OFFLINE CACHE

   WHY THIS EXISTS
     Opened from a folder, the suite has never needed a connection: the files
     are already on the disk. Opened from a LINK it did, every single time,
     just to fetch the page. With no signal the browser drew a blank page and
     the app looked broken. It was not broken and nothing was lost, there was
     simply nothing on the phone to draw.

     Seen on 2026-09-16, on a client's phone and on Tom's. Both open the
     suite from an address rather than a folder.

     This keeps a copy of each page on the phone, so the link opens with no
     signal at all.

   THE THING THIS MUST NOT DO
     Installable phone apps were killed in the master brief for one reason: a
     cached copy can go stale in silence, and then a phone is running old code
     that nobody can diagnose over a message. So nothing here is ever served
     out of the cache while there is a connection that could fetch something
     newer. Two rules:

       · Anything WITHOUT a ?v= stamp is answered from the kept copy at once
         and refreshed from the network in the background, for the next open.
         Every page and every shared file in Tom's own copy is in this half.
         Until 2026-09-18 this half asked the network FIRST, which made a weak
         signal a ten second open; Tom chose speed. The stale window is one
         open, and it only ever holds code, never data.

       · Anything WITH a ?v= stamp is answered from the cache first. Only the
         client copy stamps, and its stamp is a hash of shared/ itself, so a
         changed file is a NEW ADDRESS rather than the same address holding
         something different. Answering one from the cache cannot hand back
         the wrong thing, and it is what makes an offline open quick.

     Together: always opens at once, signal or none, and is never more than
     one open behind.

   WHAT IS KEPT
     PRECACHE below is taken at install. In this repo that is the shared
     foundation and the home screen, and nothing else, because a list of apps
     here would be a second place to remember to edit and would quietly rot.
     Every other page is kept the first time it is opened with a connection,
     which for a phone means the app you actually use is the app you get.

     The client build replaces both markers with a stamp and the full list, so
     a client who has only ever opened the home screen still has every app.

   THE WAY OUT
     Add ?nosw=1 to the address and the page takes this off again. If it ever
     misbehaves on a phone nobody here can hold, that is one message to send
     rather than a lost afternoon.

   Registered by shared/mobile.js, which every app already loads, and only on
   a real address. From a folder it never runs, because it cannot.
   ══════════════════════════════════════════════════════════════════════ */

/* Replaced by tools/build-client.py. 'live' never changes here, which is
   correct: with nothing stamped, every entry is refreshed by the rule above
   on every online fetch, so there is no old copy to throw away. */
const STAMP = 'live';
const CACHE = 'mb-' + STAMP;

const PRECACHE = [
  './',
  'index.html',
  'shared/records.js',
  'shared/day.js',
  'shared/journal.js',
  'shared/skins.js',
  'shared/skins.json',
  'shared/chart.js',
  'shared/mobile.js',
  'shared/sound.js',
  'shared/ui.js',
  'shared/io.js',
  'shared/icons.js',
  'shared/health.js',
  'shared/import.js',
  'shared/fonts/fonts.css',
  'shared/fonts/chakra-petch-400.woff2',
  'shared/fonts/chakra-petch-500.woff2',
  'shared/fonts/chakra-petch-600.woff2',
  'shared/fonts/chakra-petch-700.woff2',
  'shared/fonts/inter-tight.woff2',
];

/* ── install: take a copy ──
   One file at a time rather than addAll, which is all or nothing: a single
   missing file would leave the phone with no offline copy of anything, and
   say nothing about which file did it. */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(PRECACHE.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

/* ── activate: drop any older build's copy ──
   The cache is named after the stamp, so this is one comparison rather than a
   list of things to remember to delete. */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.map(k =>
        (k !== CACHE && k.indexOf('mb-') === 0) ? caches.delete(k) : null)))
      .then(() => self.clients.claim())
  );
});

/* Only a real answer is worth keeping. An error page cached is an error page
   served back forever. */
/* ── the network half has to actually reach the network ──
   `fetch()` inside a worker goes through the browser's OWN http cache, so
   "newest copy whenever the network can give one" could still be answered
   out of a copy the browser had lying about, with no request leaving the
   machine and nothing saying so.

   Measured here on 2026-09-17, which is how it was found: the worker handed
   the page a 139,373 byte shared/io.js while the file on disk was 140,046
   and carried a function the old one did not have. Every foundation check
   threw on it, and on a phone it would have been a client silently running
   last week's code.

   `no-cache` does not mean no caching. It means ask the server first: the
   request still goes, the server still answers 304 when nothing changed, and
   the copy is still kept for when there is no signal. It costs a round trip,
   not a download, and only on the unstamped half. */
const fresh = req => {
  try { return new Request(req, { cache: 'no-cache' }); }
  catch (e) { return req; }
};

const keep = (req, res) => {
  if (res && res.ok && res.type === 'basic') {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
  }
  return res;
};

const offline = () => new Response(
  '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<body style="font:16px/1.5 system-ui,sans-serif;margin:0;padding:24px;' +
  'background:#12141a;color:#e8eaf0">' +
  '<h1 style="font-size:20px;margin:0 0 12px">Not saved on this phone yet</h1>' +
  '<p style="margin:0;color:#9aa0ae">This part of the app has not been opened ' +
  'while you had a connection, so there is no copy here to show you. Open it ' +
  'once with signal and it will work without one after that.</p>',
  { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
);

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (err) { return; }

  /* Somebody else's server: Google Fonts, the face reader CHECK IN fetches,
     the sheet. Those degrade on their own and are not ours to hold. */
  if (url.origin !== self.location.origin) return;
  /* Outside the suite's own folder. */
  if (url.href.indexOf(self.registration.scope) !== 0) return;

  /* A stamped file. The address changes when the file does, so the cache can
     answer without anyone asking whether it is still the current one. */
  if (/[?&]v=/.test(url.search)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(r => keep(req, r)))
    );
    return;
  }

  /* Everything else: the newest copy whenever the network can give one.

     The fallback ignores anything after the ? on purpose. A cache is keyed by
     the whole address, and the suite hands round addresses with things on the
     end: ?desktop=1 opens STATUS as the widget, and a link that has been
     through a chat app arrives wearing a tracking parameter. Without this,
     ".../status/?desktop=1" offline would miss a kept ".../status/" and show
     the not-saved-yet page while the page it wanted sat right there. Safe
     here because this half is the unstamped half: nothing in it uses the
     query to say which version it wants. */
  /* ── the phone's copy first, always ──
     Tom, 2026-09-18: "Always open from the phone copy IMMEDIATELY then let
     data filter in, Fast input is our pillar." STATUS took over ten seconds
     to open on weak signal, because this used to ask the network first for
     every file and waited however long a bad connection took to fail.

     So a kept copy is answered at once, and the network is asked in the
     background; what it brings is kept for the NEXT open. That is the trade,
     and it is made on purpose: a change pushed today reaches the phone on the
     second open after it, not the first. Nothing is ever lost by it, because
     data is rows in the store and never comes from here. Only the app's own
     code arrives one open late. With nothing kept yet, the network answers,
     exactly as before. */
  const bg = fetch(fresh(req)).then(r => keep(req, r));
  e.waitUntil(bg.catch(() => {}));
  /* A folder address, ".../status/", also finds a kept index.html. */
  const kept = caches.match(req, { ignoreSearch: true }).then(hit => hit ||
    (req.mode === 'navigate'
      ? caches.match(url.pathname.replace(/\/$/, '/index.html'), { ignoreSearch: true })
      : undefined));
  e.respondWith(kept.then(hit => hit || bg.catch(() => offline())));
});
