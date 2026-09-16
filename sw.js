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

       · Anything WITHOUT a ?v= stamp goes to the NETWORK first, and only
         falls back to the cache when the network fails. Every page and every
         shared file in Tom's own copy is in this half. With signal you are
         always on the newest copy. There is no stale window to be in.

       · Anything WITH a ?v= stamp is answered from the cache first. Only the
         client copy stamps, and its stamp is a hash of shared/ itself, so a
         changed file is a NEW ADDRESS rather than the same address holding
         something different. Answering one from the cache cannot hand back
         the wrong thing, and it is what makes an offline open quick.

     Together: with signal, never stale. With no signal, still opens.

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
  e.respondWith(
    fetch(req)
      .then(r => keep(req, r))
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => {
        if (hit) return hit;
        /* A folder address, ".../status/", against a kept index.html. */
        if (req.mode === 'navigate') {
          return caches.match(url.pathname.replace(/\/$/, '/index.html'),
                              { ignoreSearch: true })
            .then(h2 => h2 || offline());
        }
        return offline();
      }))
  );
});
