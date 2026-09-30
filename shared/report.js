/* report.js — each device leaves a small note of how it is doing
   ════════════════════════════════════════════════════════════════════════════
   Tom, 2026-09-30: "ok" to a device report. Nothing had ever been watched on
   his iPhone, and nothing in shared/ caught an error: a script that died on
   the phone died where nobody could see it.

   So every device keeps ONE row about itself, type `device`, keyed by an id
   this browser made up once:

     { name, seen, sync, syncedAt, v: {app: version}, errs: [{t, app, m, at}], errN,
       open: {app: {s, p, r, at}} }

   `seen` is the last time any app opened here, `sync` and `syncedAt` what
   LIVE SYNC last really did, `v` the version of every app opened here, and
   `errs` the last five uncaught errors and promise rejections, with `errN`
   counting all of them. `open` (2026-09-30) is how long each app's last open
   took here, in seconds: `s` until drawn and ready, `p` the first paint, `r`
   Rec.ready, from records.js's own clock; only the page Tom opened, never a
   frame inside it. It is an ordinary row, so live sync carries it to
   every other device, the nightly backup keeps it, and Claude reads it off
   the PC. The DATA panel lists every device under LIVE SYNC (io.js,
   `IO.cloudRow`).

   Loaded by io.js the way cloud.js is, so no app was edited. It writes:
     · once per open, a few seconds in, and only what changed;
     · after an error, at most once every half minute, a burst as one write.
   It never writes inside TRAIN opened on a client (`?client=`), where the
   store is pointed at someone else's rows.

   The id lives in localStorage, not in a row, on purpose: a row would sync,
   and every device would end up calling itself the same thing. An iPhone
   home-screen app has storage of its own, so each installed app is its own
   device here, which is also how it syncs.                                 */
(function (g) {
  'use strict';
  /* DeviceReport, not Report: WebKit already has a global `Report` (the
     Reporting API), so `if (g.Report) return` quietly never ran on an
     iPhone. Caught by tools/safari-check.py on the first WebKit run. */
  if (g.DeviceReport) return;
  var doc = g.document;
  var KEY = 'mb.device', MAX_ERRS = 5, EVERY = 30000;

  function id() {
    try {
      var v = localStorage.getItem(KEY);
      if (!v) { v = 'd' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); localStorage.setItem(KEY, v); }
      return v;
    } catch (e) { return ''; }
  }

  /* which app this page is: its folder, or home for the root */
  function app() {
    var parts = (g.location.pathname || '').split('/').filter(Boolean);
    var last = parts[parts.length - 1] || '';
    if (/\.html?$/i.test(last)) parts.pop();
    var dir = parts[parts.length - 1] || '';
    return !dir || dir.toLowerCase() === 'motherbase' || dir.toLowerCase() === 'mainmenu-client' ? 'home' : dir.toLowerCase();
  }
  function version() {
    var m = doc.querySelector('meta[name="mb-version"]');
    return m ? String(m.content || '').split(',')[0].trim() : '';
  }

  /* A plain name a person recognises, read off the browser */
  function name() {
    var ua = (g.navigator && g.navigator.userAgent) || '';
    var touchMac = /Macintosh/.test(ua) && g.navigator.maxTouchPoints > 1;
    var dev = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) || touchMac ? 'iPad' : /Android/.test(ua) ? 'Android'
      : /Windows/.test(ua) ? 'PC' : /Macintosh/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'Device';
    var host = /[?&]host=app/.test(g.location.search) ? 'STATUS.exe'
      : g.chrome && g.chrome.webview ? 'desktop program'
      : null;
    var standalone = g.navigator.standalone === true ||
      (g.matchMedia && g.matchMedia('(display-mode: standalone)').matches);
    var browser = /Edg\//.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox'
      : /Safari\//.test(ua) ? 'Safari' : 'browser';
    if (host) return dev + ', ' + host;
    if (standalone) return dev + ', ' + (app() === 'home' ? 'home screen' : app().toUpperCase()) + ' app';
    if (/^file:/.test(g.location.protocol)) return dev + ', ' + browser + ' from a folder';
    return dev + ', ' + browser;
  }

  var me = id(), where = app(), pending = [], lastWrite = 0, timer = null, opened = false, off = !me ||
    /[?&]client=/.test(g.location.search);

  function syncNow() {
    var C = g.Cloud, s = C && C.state ? C.state() : null;
    if (!s) return { sync: 'no live sync here' };
    var at = [s.sentAt, s.gotAt].filter(Boolean).sort().pop() || '';
    return {
      sync: s.conn ? 'live' : s.live ? 'signed in, not connected' : s.why ? 'not syncing: ' + s.why
        : s.on ? 'starting' : s.has ? 'not signed in' : 'not set up',
      syncedAt: at,
    };
  }

  /* only the fields that changed, so an open with nothing new writes nothing */
  function write(force) {
    if (off || !g.Rec || !g.Rec.patch) return;
    var R = g.Rec, was = R.get('device', null, me) || {};
    var ch = {}, s = syncNow(), v = version(), nm = name();
    if (was.name !== nm) ch.name = nm;
    if (v && (!was.v || was.v[where] !== v)) ch['v.' + where] = v;
    if (was.sync !== s.sync) ch.sync = s.sync;
    if (s.syncedAt && was.syncedAt !== s.syncedAt) ch.syncedAt = s.syncedAt;
    /* How long this open took, per app, from the page Tom actually opened
       (never a frame inside the home screen): `s` until it had drawn and had
       its rows, `p` the first paint, `r` Rec.ready, in seconds. Once an open. */
    var t = !opened && g.top === g && R.timing ? R.timing() : null;
    if (t && t.ready) {
      var sec = function (ms) { return Math.round(ms / 100) / 10; };
      ch['open.' + where] = { s: sec(Math.max(t.paint, t.ready)), p: sec(t.paint), r: sec(t.ready), at: new Date().toISOString() };
      opened = true;
    }
    if (pending.length) {
      var errs = (Array.isArray(was.errs) ? was.errs : []).concat(pending).slice(-MAX_ERRS);
      ch.errs = errs;
      ch.errN = (was.errN || 0) + pending.length;
      pending = [];
    }
    /* `seen` alone moves at most once an hour, so opening apps is not a
       stream of writes; anything else changing carries it along */
    var now = new Date().toISOString();
    if (Object.keys(ch).length || force || !was.seen || Date.parse(now) - Date.parse(was.seen) > 3600000) ch.seen = now;
    if (!Object.keys(ch).length) return;
    try { R.patch('device', null, me, ch); lastWrite = Date.now(); } catch (e) {}
  }

  function soon() {
    if (timer) return;
    var wait = Math.max(3000, EVERY - (Date.now() - lastWrite));
    timer = setTimeout(function () { timer = null; write(); }, wait);
  }

  /* ── what went wrong ── */
  var NOISE = /ResizeObserver loop|^Script error\.?$/;
  function caught(msg, at, t) {
    msg = String(msg || 'error').replace(/\s+/g, ' ').slice(0, 160);
    if (NOISE.test(msg)) return;
    pending.push({ t: t || new Date().toISOString(), app: where, m: msg, at: String(at || '').slice(0, 80) });
    if (pending.length > MAX_ERRS) pending = pending.slice(-MAX_ERRS);
    soon();
  }
  function file(u) { return String(u || '').split('/').slice(-2).join('/').split('?')[0]; }
  g.addEventListener('error', function (e) {
    if (!e || !e.message) return;          /* a picture that failed to load is not a script error */
    caught(e.message, file(e.filename) + (e.lineno ? ':' + e.lineno : ''));
  });
  g.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    caught('promise: ' + ((r && (r.message || r.name)) || r || 'rejected'), r && r.stack ? file((String(r.stack).match(/https?:[^\s)]+/) || [''])[0]) : '');
  });

  /* An app's own script runs before this file arrives, and an error while it
     boots is the one that matters most: a page that died on line one. io.js
     holds those in `__mbEarly` until now. */
  var early = g.__mbEarly;
  if (early && !early.done) {
    early.done = true;
    early.forEach(function (x) { caught(x.m, x.at, x.t); });
  }

  /* once per open, once the store and live sync have had a moment */
  function start() { setTimeout(function () { write(); }, 5000); }
  if (g.Rec && g.Rec.ready) g.Rec.ready(start); else setTimeout(start, 3000);

  g.DeviceReport = {
    id: me,
    /** every device's note, most recently seen first */
    devices: function () {
      if (!g.Rec) return [];
      return g.Rec.all('device').map(function (r) {
        var p = r.payload || {};
        return { id: r.key, me: r.key === me, name: p.name || 'A device', seen: p.seen || '', sync: p.sync || '',
          syncedAt: p.syncedAt || '', v: p.v || {}, errs: Array.isArray(p.errs) ? p.errs : [], errN: p.errN || 0,
          open: p.open && typeof p.open === 'object' ? p.open : {} };
      }).sort(function (a, b) { return a.seen < b.seen ? 1 : a.seen > b.seen ? -1 : 0; });
    },
    /** write now (the smoke checks use it) */
    flush: function () { if (timer) { clearTimeout(timer); timer = null; } write(true); },
    /** write only what changed, as an open does */
    write: function () { write(false); },
    _caught: caught,
  };
})(window);
