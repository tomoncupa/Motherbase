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

     And since 2026-10-18 not even that, most of the time: an open handed an
     old copy is told so (`check`, below) and mobile.js reopens it fresh
     before he has touched it, and an app resumed after a long time away
     asks too. An iPhone home-screen app is mostly resumed, never opened,
     which is how TRAIN sat on 1.0.61 for three days.

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
  'shared/boot.js',
  'shared/skins.json',
  'shared/chart.js',
  'shared/mobile.js',
  'shared/sound.js',
  'shared/ui.js',
  'shared/io.js',
  'shared/report.js',
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
  /* A worker that has just taken over IS new code arriving, so the open
     that brought it gets the network too. */
  freshUntil = Date.now() + FRESH_MS;
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.map(k =>
        (k !== CACHE && k.indexOf('mb-') === 0) ? caches.delete(k) : null)))
      .then(() => self.clients.claim())
  );
});

/* ── UPDATE NOW: every kept file asked for again, this minute ──
   Tom, 2026-09-30: "I tired of having to reopen and close twice". The button
   under the version line in every app's Settings posts {mb: 'refresh'} with a
   port. Every file this device keeps is fetched from the network and kept,
   and the answer says how many came back different (by ETag, else
   by what is in it). The page then reloads with ?fresh=1, so
   anything not kept yet comes from the network too. A file the network will
   not give keeps its old copy, so no signal costs nothing.

   By what is in it, since 2026-10-18: GitHub Pages stamps every file with
   the time of the last push, so an ETag changed on every file whenever any
   app was pushed and the count was always "every file". */
self.addEventListener('message', e => {
  const d = e.data || {};
  const port = e.ports && e.ports[0];
  const say = a => { if (port) port.postMessage(a); };
  if (d.mb === 'refresh') {
    e.waitUntil(caches.open(CACHE).then(c => c.keys()).then(reqs => Promise.all(reqs.map(req =>
      lookup(req).then(old => fetch(fresh(req)).then(r => store(req, r, old)))
        .then(ch => ch ? 1 : 0, () => 0)
    ))).then(ns => {
      freshUntil = Date.now() + FRESH_MS;
      say({ ok: 1, n: ns.reduce((a, b) => a + b, 0), of: ns.length });
    }).catch(() => say({ ok: 0 })));
    return;
  }

  /* ── is the page asking running code older than what is kept? ──
     Added 2026-10-18. Tom's iPhone TRAIN ran 1.0.61 for three days while
     main had 1.0.68, and the one-open-late rule above never caught up. An
     iPhone home-screen app is mostly RESUMED, not opened: the same page,
     from memory, for days, and nothing is fetched on a resume. And a page
     that is opened takes the kept copy and only refreshes it for later.

     So mobile.js asks, from the top page, once it has loaded and again when
     it comes back after a long time away: here is my address, here is every
     file I loaded and when. The answer names the files whose kept copy has
     changed since the page loaded them (CHANGED, below), and the version on
     the network's copy of the page. Either one means the page is running
     old code, and mobile.js reopens it fresh if he has not touched it yet.

     `fetch: true` (a resume) asks the network for every file first, since
     nothing has asked it since the page loaded. An open has just asked, so
     it waits for those answers instead (INFLIGHT). The page itself is asked
     for every time: one more round trip, answered 304 when it is the same. */
  if (d.mb === 'check') {
    const files = (Array.isArray(d.files) ? d.files : []).filter(f => f && typeof f.u === 'string' && inScope(f.u));
    const page = typeof d.page === 'string' && inScope(d.page) ? bareHref(d.page) : '';
    const ask = u => lookup(u).then(old =>
      fetch(new Request(u, { cache: 'no-cache' })).then(r => {
        const copy = r && r.ok ? r.clone() : null;
        return store(u, r, old).then(() => copy);
      })).catch(() => null);
    const settled = Promise.race([
      Promise.all(Array.from(inflight).map(p => p.catch(() => {}))),
      new Promise(res => setTimeout(res, 8000)),
    ]);
    e.waitUntil(settled
      .then(() => d.fetch ? Promise.all(files.filter(f => bareHref(f.u) !== page).map(f => ask(bareHref(f.u)))) : null)
      .then(() => page ? ask(page) : null)
      .then(r => r ? r.text() : '')
      .then(html => loadChanged().then(m => {
        const v = (/<meta name="mb-version" content="\s*([\d.]+)/.exec(html) || [])[1] || '';
        const stale = files.filter(f => m[bareHref(f.u)] > (+f.t || 0)).map(f => bareHref(f.u));
        say({ ok: 1, v: v, stale: stale });
      }))
      .catch(() => say({ ok: 0 })));
  }
});

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

/* ── ?fresh=1: this open, from the network ──
   Tom, 2026-09-23: "Update the link widget to always force new copies." The
   phone's-copy-first rule below makes a pushed change arrive one open late,
   which is the trade he chose for speed. A link from the LINKS widget carries
   ?fresh=1, and for the next twenty seconds, long enough for a page and
   everything it loads, every request is answered by the network first and
   kept, with the kept copy only as the fallback. mobile.js then takes the
   ?fresh off the address, so a home-screen shortcut saved from that page is
   the plain address and keeps the quick open. A worker's memory can be
   dropped between requests; the worst that does is one ordinary open. */
const FRESH_MS = 20000;
const SLOW_MS = 3000;
let freshUntil = 0;
const bare = url => {
  const u = new URL(url.href);
  u.searchParams.delete('fresh'); u.searchParams.delete('t');
  return u.href;
};

const bareHref = s => { try { return bare(new URL(s, self.location.href)); } catch (e) { return String(s); } };
const inScope = s => { try { return new URL(s, self.location.href).href.indexOf(self.registration.scope) === 0; } catch (e) { return false; } };

/* ── CHANGED: when each kept copy last came back different ──
   Address to time, in a cache of its own that the activate step's sweep of
   'mb-' names leaves alone, so it outlives a new build. A page that loaded a
   file before that time is running the old one. Written only when the
   network's copy differs from the kept one by what is in it, never by its
   stamp, and never for a fresh open, which was handed the network's copy. */
const META = 'mbmeta';
const META_KEY = 'changed';
let changed = null, saving = Promise.resolve();
const loadChanged = () => changed ? Promise.resolve(changed) :
  caches.open(META).then(c => c.match(META_KEY)).then(r => r ? r.json() : {}).catch(() => ({}))
    .then(m => (changed = changed || m || {}));
const markChanged = url => loadChanged().then(m => {
  const now = Date.now();
  m[url] = now;
  Object.keys(m).forEach(k => { if (now - m[k] > 60 * 86400000) delete m[k]; });
  saving = saving.then(() => caches.open(META).then(c => c.put(META_KEY,
    new Response(JSON.stringify(m), { headers: { 'Content-Type': 'application/json' } })))).catch(() => {});
  return saving;
});

/* ── keep a copy, and finish keeping it before the worker may stop ──
   Until 2026-10-18 the copy was written off to one side and nothing waited
   for it: the fetch event was told it was done as soon as the network
   answered, before the body had been read into the cache. Chrome keeps an
   idle worker for half a minute so it always finished there. WebKit may
   stop a worker as soon as nothing is waiting on it, and an iPhone app sent
   to the background stops everything, so a 500KB page could be dropped
   halfway and the old copy served again next time. Now the write is a
   promise, and every caller hands it to waitUntil.

   With `old`, the kept copy it replaces, the two are compared and CHANGED
   is told when they differ. Answers whether they did. Only a real answer is
   kept: an error page cached is an error page served back forever. A
   'default' type is a Response made by hand, which only the smoke checks
   do. */
const store = (key, res, old) => {
  if (!res || !res.ok || (res.type !== 'basic' && res.type !== 'default')) return Promise.resolve(false);
  const put = caches.open(CACHE).then(c => c.put(key, res.clone()));
  if (!old) return put.then(() => false, () => false);
  return Promise.all([put, old.text(), res.clone().text()])
    .then(a => a[1] === a[2] ? false : markChanged(bareHref(typeof key === 'string' ? key : key.url)).then(() => true))
    .catch(() => false);
};

/* The kept copy for a request: the exact address first, then the same path
   with anything after the ? (see below), then a folder's index.html. Exact
   first since 2026-10-18: matching by path alone hands back whichever copy
   of that path was kept FIRST, and a page kept once under a second address
   would then be served forever while its newer copy sat under the other. */
const lookup = (key, nav) => caches.match(key).then(hit => hit || caches.match(key, { ignoreSearch: true }))
  .then(hit => hit || (nav
    ? caches.match(new URL(typeof key === 'string' ? key : key.url, self.location.href).pathname.replace(/\/$/, '/index.html'), { ignoreSearch: true })
    : undefined));

/* the network answers this open's own requests are waiting on, so a check
   that arrives while they are still coming waits for them */
const inflight = new Set();
const track = p => { inflight.add(p); p.then(() => inflight.delete(p), () => inflight.delete(p)); return p; };

/* ── every answer says no-cache ──
   GitHub Pages sends max-age=600, and a kept copy keeps that header. The
   browser's own memory of a page's files then treats them as good for ten
   minutes and hands them to the next page without asking this worker at
   all: watched 2026-10-18 in Chromium, where a page reopened to catch up
   still ran its old day.js and no request for it ever arrived here. So what
   this hands back is marked no-cache, the browser asks every time, and the
   answer is still the kept copy, from the phone, at once. */
const own = r => {
  if (!r || r.type === 'opaque' || !r.status) return r;
  const h = new Headers(r.headers);
  h.set('Cache-Control', 'no-cache');
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
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

  if (req.mode === 'navigate' && /[?&]fresh=/.test(url.search)) freshUntil = Date.now() + FRESH_MS;

  /* A home-screen picture, or anything inside a fresh open: network first,
     kept under its address without the ?fresh or ?t, the kept copy only when
     there is no signal. An icon is asked for when a shortcut is saved and at
     no other time, so answering it from the phone's copy only ever hands
     iOS the old picture. */
  if (/\/shared\/icons\/.*\.png$/.test(url.pathname) ||
      (Date.now() < freshUntil && !/[?&]v=/.test(url.search))) {
    /* ── but never wait on it for long ──
       2026-10-19, Main Menu.exe sat blank for 23 to 29 seconds on open. The
       PC's IPv6 route to GitHub was dead, and when the first connection
       tried it, nothing answered until Windows gave up at 21 seconds. A
       network that hangs rather than fails never reaches the catch below.
       So after SLOW_MS the kept copy answers, and the network's copy is
       still kept when it comes, for the next open. */
    const key = bare(url);
    const net = fetch(fresh(req)).then(r => ({ r: r, copy: r.clone() }));
    e.waitUntil(track(net.then(n => store(key, n.copy))).catch(() => {}));
    const kept = () => lookup(key, req.mode === 'navigate');
    let done = false;
    const first = net.then(n => { done = true; return own(n.r); });
    const slow = new Promise(res => setTimeout(res, SLOW_MS))
      .then(() => done ? first : kept().then(hit => hit ? own(hit) : first));
    e.respondWith(Promise.race([first, slow]).catch(() =>
      kept().then(hit => own(hit) || offline())));
    return;
  }

  /* A stamped file. The address changes when the file does, so the cache can
     answer without anyone asking whether it is still the current one. */
  if (/[?&]v=/.test(url.search)) {
    const got = caches.match(req).then(hit => hit ? { hit: hit } : fetch(req).then(r => ({ r: r, copy: r.clone() })));
    e.waitUntil(got.then(g => g.copy ? store(req, g.copy) : null).catch(() => {}));
    e.respondWith(got.then(g => g.hit || g.r));
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
  /* What the network brings is compared with the copy handed to the page,
     and CHANGED is told if they differ: the page asking `check` is then
     told it is running the old one. A folder address, ".../status/", also
     finds a kept index.html. */
  const bg = fetch(fresh(req)).then(r => ({ r: r, copy: r.clone() }));
  const kept = lookup(req, req.mode === 'navigate').then(hit => ({ hit: hit, old: hit ? hit.clone() : null }));
  e.waitUntil(track(Promise.all([bg, kept]).then(a => store(req, a[0].copy, a[1].old))).catch(() => {}));
  e.respondWith(kept.then(k => own(k.hit) || bg.then(n => own(n.r))).catch(() => offline()));
});
