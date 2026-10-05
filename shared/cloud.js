/* shared/cloud.js — 0.2.4 — Firebase as a SECOND sync, beside the Google Sheet,
   and since 0.2.0 the trays a client and the coach send each other things by.

   Tom, 2026-09-20: "Keep the google sheet sync, I like it". So this is not a
   replacement and it is not allowed to become one. The sheet keeps doing
   everything it does today; this sits next to it and answers the one thing the
   sheet is bad at, which is SPEED. A sheet round trip is a push, a pull and an
   Apps Script cold start, and it runs every forty five seconds. Two devices
   therefore agree in about a minute on a good day. This agrees in about a
   second, because the database tells the other device rather than waiting to
   be asked.

   Both can run at once and neither can hurt the other. Everything either one
   brings in goes through `Rec.merge`, which settles a conflict on
   `updated_at`, per row, per field. That is the whole reason the store was
   built this way, and it means a second sync costs no new correctness
   thinking: the worst two syncs can do to each other is deliver the same row
   twice, and the second delivery changes nothing.

   ── what it will not do ──

   · It never blocks a save. Every tap still writes locally and instantly, the
     way hard constraint 5 says it must. This is a mirror, not a save file.
   · It never blocks a paint. The SDK is fetched lazily, after the app is up.
   · It is not a dependency. No config, no signal, blocked CDN, or a database
     that has gone away — all four end the same way: nothing happens, the app
     works, and the sheet keeps syncing. Hard constraint 4.
   · It is not on until it is asked for. A client who never pastes a config
     never makes a network request from this file.

   ── one connection per document, not per app ──

   The home screen keeps every app alive in a frame, so a connection per app
   would be fourteen of them against a free plan that allows a hundred, for
   one person sitting at one desk. It is also unnecessary: `records.js` already
   shares every merged row across the origin over a BroadcastChannel, so one
   document holding the connection feeds every frame beside it for free. Only
   the TOP document connects. A frame still draws the settings row, still takes
   a pasted config, and still gets every row that arrives — it just does not
   open a socket of its own.

   ── why the row id is encoded ──

   A Realtime Database key may not contain . $ # [ ] or / and a row id can
   contain a dot, because a setting's key is `appid.name`. So the id is escaped
   into the key and the row carries its real id in the value, which is the one
   we read back. Nothing downstream ever sees the escaped form.

   ── the size ceiling ──

   A row over 64KB is not sent. That is the same line `records.js` already
   draws between the fast half and the big half, so it is a boundary the suite
   already has rather than a new one invented here, and on the other side of it
   are exactly the rows you would not want on a metered phone anyway: a
   photographed label, a check-in photo, a pasted image on an ARC node. Those
   still travel by backup and by the sheet.

   The skipped row still MOVES THE BOUNDARY. That looks wrong and is the
   important part: if the boundary stopped at the first oversized row, one
   check-in photo would jam the sync forever and every bullet written after it
   would silently never leave the device. A stuck boundary is the failure this
   whole file exists to avoid.                                              */

(function (g) {
'use strict';

var SDK   = 'https://www.gstatic.com/firebasejs/10.12.2/';
var PARTS = ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-database-compat.js'];
var CKEY  = 'mb.cloud';
var LOAD_MS = 20000;
var BIG   = 64 * 1024;      /* the store's own ceiling; see the note above */
var CHUNK = 400;            /* rows per write, so a first sync of 12,000 sets
                               makes progress instead of one huge request */

/* ── config, kept per device, exactly like the sheet link ──

   Tom pastes the Firebase web config once and every app on the device has it,
   which is the rule the sheet link already follows and the one he asked for:
   "No need to paste per app." It lives in localStorage rather than in a row
   because it is a property of this DEVICE, not of his data — syncing the
   config through the thing it configures is a circle, and a client restoring
   his backup must not inherit his database.                                */
/* ── the suite's own project, built in ──
   Tom, 2026-09-23: "why do I need to paste the config again? cant I just
   log on?" So every device starts with it and shows Sign in with Google.
   This is not a secret: a Firebase web config is handed to every visitor of
   any page that uses it. What keeps rows private is the database's rules,
   `/u/<uid>` readable and writable by that account only (CLOUD.md, step 3),
   so each person who signs in, a client included, gets their own space and
   nobody else's. A pasted config still wins, for a different project.
   Nothing here touches the network until someone signs in. */
var BUILT_IN = {
  apiKey: 'AIzaSyALSSt8W3N_Wlj6t54K7sMcCQ7rZz20E_g',
  authDomain: 'motherbase-96011.firebaseapp.com',
  databaseURL: 'https://motherbase-96011-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'motherbase-96011',
  appId: '1:487331976627:web:22a8f4d68be5ebd51aa7c6'
};
var cfg = { cfg: null, on: 0, uid: '', email: '', at: '', sentAt: '', gotAt: '', lost: '', pushed: '', seen: '', checked: '' };
function cread() {
  var was = { pushed: cfg.pushed, seen: cfg.seen };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(CKEY) || '{}')); } catch (e) {}
  if (!cfg.cfg) cfg.cfg = BUILT_IN;
  /* An older copy of this file in another tab can write a future boundary
     back; keep the good one we had rather than starting over each time. */
  cfg.pushed = cfg.pushed > soon() ? was.pushed : cfg.pushed;
  cfg.seen = cfg.seen > soon() ? was.seen : cfg.seen;
  /* A boundary in the future stops every row, both ways, with nothing on
     screen to say so. It happened on 2026-09-24: two test rows dated 2999
     travelled, every device's boundary followed them, and nothing synced after.
     Starting over costs one full push and one full read; `Rec.merge` makes
     both harmless. */
  var lim = soon();
  if (cfg.pushed > lim) cfg.pushed = '';
  if (cfg.seen > lim) cfg.seen = '';
}
/* The latest a real row can be stamped: now, plus a day for a clock set wrong.
   Anything past it is a broken row, and it never moves a boundary. */
function soon() { return new Date(Date.now() + 864e5).toISOString(); }
/* A row sync driven by the smoke checks' stand-in database writes nothing
   down: its boundaries are made up, and the page may be one a real device
   syncs from. `probed` is set only while that runs. */
var probed = null;
function csave() { if (probed) return; try { localStorage.setItem(CKEY, JSON.stringify(cfg)); } catch (e) {} }
cread();

/* Another frame pasted the config or signed in. Same reason the mirror does
   this: an app opened before the paste would otherwise answer "not set up" for
   the rest of the session. */
g.addEventListener('storage', function (e) {
  if (e.key !== CKEY || probed) return;
  cread(); say();
  /* Signed in from an app in a frame: only this top document may connect, so
     it has to notice and start, or nothing syncs until the next reload. */
  if (cfg.on && !started) boot();
});

/* ── the state every caller can read, and nobody outside can set ── */
var fb = null, db = null, auth = null, ref = null, query = null;
var uid = '', loading = null, started = false, pushing = false, pushAgain = false;
var last = { ok: 0, why: '', at: '', sent: 0, got: 0, skipped: 0, refused: 0, refusedIds: [] };
/* What is TRUE right now, rather than what was true when it started. Until
   0.1.4 "Live" meant only "start() once got this far": Google could sign the
   device out, the database could refuse the read, or the connection could
   drop, and the row still said Live with a last-synced time that was really
   the time it opened. Tom, 2026-09-24: "overall the diagnostic feedback has
   been innacurate." Both desktop programs sat signed out for seven hours
   saying nothing. */
var conn = false;          /* the database says this device is connected */
var broken = false;        /* the incoming listener was cancelled */
var watching = false;      /* the lasting sign-in watch is set */
var connRef = null;
var listeners = [];

/* ── what the cloud holds, 0.2.2 (2026-09-30) ──

   Until 0.2.2 a device's first push sent every row it held, a write REPLACES
   the row in the cloud, and the push went before the cloud had even answered.
   So a browser last opened two weeks ago wrote its two-week-old copy over
   every newer one the moment it signed in. All 15,801 rows in Tom's Chrome
   matched the cloud's times exactly on 2026-09-30, settings and exercises
   included, after two weeks of use elsewhere, which is what that would look
   like. Unproven, and it cannot happen now:

   · Nothing goes up until the listener's first answer is in and merged
     (`loaded`), or while the database cannot hear this device (`conn`):
     Firebase keeps a write made offline and sends it blind when the signal
     comes back. After a dropped connection the rows are read again first.
   · `cloudAt` is the time the cloud holds for each row this session has
     heard, and a row goes up only when the cloud lacks it or holds it older.
   · A device that has pushed nothing yet reads every row first, so that
     comparison covers everything it is about to send.
   · A device that hears the cloud holding an OLDER copy than its own, or a
     row dropping out of the bottom of the window, which means the same, sends
     its own again (`redo`). Two devices writing one row in the same second is
     the race the check above cannot see; this closes it from the other side.

   A database rule refusing an older time was considered and left out. One
   refused row fails the whole multi-path write it is in, so one stale row
   would stall the boundary for the 399 beside it, and whether the rules
   compare two strings that way was never watched on the real database. */
var cloudAt = Object.create(null);   /* row id -> the updated_at the cloud holds */
var redo = Object.create(null);      /* row id -> 1: the cloud holds this older than here */
var loaded = false;        /* the current listen's first answer is merged */
var owed = false;          /* a push was asked for before it was allowed */
var dropped = false;       /* connected once, then lost it */
var winFrom = '';          /* where the current listen's window starts */
var acct = null;           /* {uid, email, db, store, keys} as start() found it */
var rs = null;             /* the store the row sync reads and merges into */
function store() { return rs || g.Rec || null; }

/* The window starts two days before `seen`, not at it. `seen` is the newest
   time this device has heard, its own writes included, and a row is stamped
   when it was WRITTEN, not when it arrived: a phone that logs a session with
   no signal and gets signal hours later sends rows older than a PC's `seen`,
   and a window starting at `seen` never shows them to the PC. Two days of
   rows come down again on each open, and merging them changes nothing. */
var LOOK = 2 * 864e5;
function back(seen) {
  var t = seen ? Date.parse(seen) : NaN;
  return isFinite(t) ? new Date(t - LOOK).toISOString() : '';
}
function say() { listeners.forEach(function (f) { try { f(Cloud.state()); } catch (e) {} }); }
function note(why, ok) {
  if (!why && unkeptNow()) { why = UNKEPT; ok = 0; }
  last.why = why || ''; last.ok = ok ? 1 : 0;
  say();
}

/* ── a browser that cannot save, 0.2.1 (2026-09-30) ──

   Tom's Chrome filled localStorage and then IndexedDB stopped opening, so rows
   arrived, lived in memory, and were gone on the next load, while `seen` moved
   past every one of them. "my data isnt here", signed in and Live. So while
   the store reports a row it could not keep, `seen` does not move and is set
   back to the start, and the next open reads everything again. The row says
   what fixes it, and nothing else may clear that until the page reloads. */
var UNKEPT = 'This browser would not save what arrived. Close it fully and open it again, and everything comes down again';
function unkeptNow() { var R = store(); try { return !!(R && R.unkept && R.unkept()); } catch (e) { return false; } }
function onUnkept() {
  if (cfg.seen) { cfg.seen = ''; csave(); }
  note(UNKEPT, 0);
}
if (g.top === g && g.Rec && g.Rec.onUnkept) {
  g.Rec.onUnkept(onUnkept);
  if (unkeptNow()) onUnkept();
}
/* The database confirmed something: a write landed, or a row arrived. The
   only thing allowed to move "last synced". Signing in and opening are not
   syncing, and until 0.1.4 both set it. `sentAt` and `gotAt` are kept apart
   so the row can say which way things last moved. */
function landed(way) {
  var t = new Date().toLocaleString();
  last.at = t; cfg.at = t;
  if (way === 'sent') cfg.sentAt = t; else cfg.gotAt = t;
  csave(); say();
}

/* ── keys ──────────────────────────────────────────────────────────────── */
var BAD = /[.$#\[\]\/~\x00-\x1f\x7f]/g;
function hex(c) { var h = c.charCodeAt(0).toString(16); return h.length < 2 ? '0' + h : h; }
function enc(id) { return String(id).replace(BAD, function (c) { return '~' + hex(c); }); }
function dec(k) {
  return String(k).replace(/~([0-9a-f]{2})/g, function (_, h) { return String.fromCharCode(parseInt(h, 16)); });
}

/* ── reading the config Tom pastes ──

   Firebase hands him a JavaScript snippet, not JSON, so demanding JSON would
   mean asking him to edit it first — which is the kind of step that turns a
   one-minute setup into a support conversation. Both forms are read: real
   JSON if it parses, otherwise every `key: "value"` pair in the text. Pasting
   the whole `const firebaseConfig = {...};` block works, and so does pasting
   only the braces.                                                         */
function parseCfg(text) {
  if (!text) return null;
  var out = null;
  try {
    var j = JSON.parse(text);
    if (j && typeof j === 'object' && !Array.isArray(j)) out = j;
  } catch (e) {}
  if (!out || !out.apiKey) {
    out = {};
    var re = /([A-Za-z][A-Za-z0-9_]*)\s*:\s*["']([^"']*)["']/g, m;
    while ((m = re.exec(text))) out[m[1]] = m[2];
  }
  return out && out.apiKey ? out : null;
}

/* What is missing, in the order it stops things working. The databaseURL is
   the one that actually catches people: it is absent from the config block
   until the Realtime Database has been created, so a config pasted before that
   step looks complete and cannot possibly work. */
function missing(c) {
  if (!c) return 'that does not look like a Firebase config. Paste the whole block, apiKey and all';
  if (!c.apiKey) return 'no apiKey in there';
  if (!c.databaseURL) return 'no databaseURL. Create the Realtime Database first, then copy the config again';
  if (!c.authDomain) return 'no authDomain in there';
  return '';
}

/* ── loading the SDK ──

   Three classic scripts off Google's own CDN, in order, because auth and
   database both need app to exist first. Classic, not modules: hard constraint
   3, modules do not load from a folder. If any of them does not arrive we stop
   and stay stopped until something asks again — no retry loop, because a retry
   loop on a phone with no signal is just a battery drain that never succeeds. */
function loadOne(src) {
  return new Promise(function (res, rej) {
    var t = document.createElement('script'), done = false;
    var timer = setTimeout(function () {
      if (done) return; done = true; t.remove();
      rej(new Error('the Firebase library was too slow to arrive'));
    }, LOAD_MS);
    t.onload  = function () { if (done) return; done = true; clearTimeout(timer); res(); };
    t.onerror = function () {
      if (done) return; done = true; clearTimeout(timer); t.remove();
      rej(new Error('could not reach the Firebase library'));
    };
    t.src = src;
    document.head.appendChild(t);
  });
}
function loadSDK() {
  if (g.firebase && g.firebase.database) return Promise.resolve(g.firebase);
  if (loading) return loading;
  loading = PARTS.reduce(function (p, part) {
    return p.then(function () { return loadOne(SDK + part); });
  }, Promise.resolve()).then(function () {
    if (!g.firebase || !g.firebase.database) throw new Error('the Firebase library loaded but is not what we expected');
    return g.firebase;
  }).catch(function (e) { loading = null; throw e; });
  return loading;
}

/* ── the app handle ── */
function app() {
  var c = cfg.cfg;
  var bad = missing(c);
  if (bad) throw new Error(bad);
  if (fb) return fb;
  /* Named, so a page that has its own default Firebase app for some other
     reason cannot collide with ours. */
  try { fb = g.firebase.app('motherbase'); }
  catch (e) { fb = g.firebase.initializeApp(c, 'motherbase'); }
  return fb;
}

/* ── signing in ──

   Google, not phone: phone sign-in needs a card on file with Firebase even
   inside the free allowance, and Tom is one person with a Google account
   already. Popup rather than redirect, because a redirect throws away the
   page — and on a phone that means losing whatever was half typed.

   A page opened straight from a FOLDER cannot do this at all. Firebase checks
   the origin against a list of allowed domains and a file has no origin to
   check, so the popup opens and is refused. That is a real limit and this says
   so plainly rather than producing an error nobody can act on.             */
function isFile() { return g.location.protocol === 'file:'; }

function signIn() {
  if (isFile()) {
    return Promise.reject(new Error('Google sign-in needs a web address. This page was opened from a folder, so use the hosted copy to sign in. The sheet sync works either way.'));
  }
  return loadSDK().then(function () {
    var a = g.firebase.auth(app());
    var p = new g.firebase.auth.GoogleAuthProvider();
    return a.signInWithPopup(p);
  }).then(function (r) {
    var u = r && r.user;
    if (!u) throw new Error('signed in, but no account came back');
    cfg.uid = u.uid; cfg.email = u.email || ''; cfg.on = 1; cfg.lost = ''; csave();
    note('', 1);
    /* anything that waited for a sign-in goes now */
    setTimeout(autoFlush, 500);
    return start();
  });
}

function signOut() {
  stop();
  cfg.on = 0; cfg.uid = ''; cfg.email = ''; cfg.seen = ''; cfg.pushed = ''; cfg.lost = ''; csave();
  var done = Promise.resolve();
  try { if (g.firebase && fb) done = g.firebase.auth(fb).signOut(); } catch (e) {}
  return done.catch(function () {}).then(function () { note('', 0); });
}

/* ── the coach shelf ──

   Tom, 2026-09-23: "We should put an upload to coach function in train."

   The rule this had to work around: a client's space, `/u/<their uid>`, is
   readable by them and nobody else, which is the whole reason the sync is
   safe to hand to a client at all. Tom reading it directly would mean
   granting his account read over every client's private space, and it would
   turn a deliberate send into a live feed off their phone. He picked neither.

   So there is one shelf, `drop/coach`, and a client puts a parcel on it. The
   rules let a signed-in person write to `drop/coach/<their own uid>` and
   nowhere else, so one client can never touch another's parcel and cannot
   forge whose it is — the database enforces that, not this file. Only Tom's
   account can read the shelf or clear it, and his uid appears only in the
   rules, never in this repo.

   Nothing about the row sync is touched. A parcel is not a row, never goes
   through `Rec.merge` on the way up, and the shelf is not a place data lives:
   COACH takes the parcel in as rows and clears it.

   Unlike the row sync this runs in a FRAME too, because TRAIN is usually in
   one, and the button is a button. There is no socket left open: the SDK is
   already there or is fetched once, one read or one write happens, and that
   is the end of it. Firebase keeps the sign-in per origin, so a frame sees
   the account the top document signed in with.                             */
var SHELF = 'drop/coach';
var PARCEL = 2000000;   /* the ceiling the rules also check, so a refusal is
                           readable here rather than a permission error */

/* The account as the database will see it, or a plain reason why there isn't
   one. Deliberately not `cfg.uid`: a stored uid outlives the token that makes
   it mean anything, and addressing a path nothing can read is the failure
   that reads as "it silently didn't send". */
var probe = null;   /* the smoke checks' stand-in for an account; null in use */
function account() {
  if (probe) return Promise.resolve().then(probe);
  if (isFile()) return Promise.reject(new Error('this page was opened from a folder, and Google sign-in needs a web address'));
  var bad = missing(cfg.cfg);
  if (bad) return Promise.reject(new Error(bad));
  return loadSDK().then(function () {
    var a = g.firebase.auth(app());
    if (a.currentUser) return a.currentUser;
    return new Promise(function (res) {
      var off = a.onAuthStateChanged(function (u) { off(); res(u); });
    });
  }).then(function (u) {
    if (!u) throw new Error('not signed in');
    return { uid: u.uid, email: u.email || '', db: g.firebase.database(app()) };
  });
}

/* Why a parcel is a STRING rather than a tree of children: a training log is
   thousands of small objects, and writing it as a tree is thousands of keys
   the rules have to walk and the client has to upload as structure. One
   string is one write, and the only thing anything between here and COACH
   needs to know about it is how long it is. */
function put(kind, bag) {
  return account().then(function (me) {
    var data = JSON.stringify(bag);
    if (data.length > PARCEL) throw new Error('that is too big to send this way. Use Send To Coach’s file instead');
    return me.db.ref(SHELF + '/' + me.uid).set({
      kind: String(kind || ''), at: new Date().toISOString(),
      by: me.email, n: (bag && bag.rows && bag.rows.length) || 0, data: data,
    }).then(function () { return data.length; });
  }).catch(function (e) {
    var m = (e && e.message) || 'the send did not land';
    if (/permission/i.test(m)) m = 'the database refused the write. Check the drop rules from CLOUD.md';
    throw new Error(m);
  });
}

/* Everything on the shelf, newest first. A parcel whose text will not parse is
   left where it is rather than thrown away: it is the only copy, and a client
   who pressed send should not have it deleted by the app that could not read
   it. */
function shelf() {
  return account().then(function (me) {
    /* the 0.1 shelf, one parcel per client, and the 0.2 in-tray, any number */
    return Promise.all([me.db.ref(SHELF).once('value'), me.db.ref(INTRAY).once('value')]);
  }).then(function (snaps) {
    var out = [];
    snaps[0].forEach(function (c) {
      var v = c.val() || {}, body = null;
      try { body = JSON.parse(v.data || 'null'); } catch (e) {}
      out.push({ from: c.key, id: '', grp: c.key, legacy: 1, kind: v.kind || '', at: v.at || '', by: v.by || '', n: v.n || 0, body: body });
    });
    snaps[1].forEach(function (c) {
      var v = c.val() || {};
      Object.keys(v).forEach(function (k) { out.push(unpack(c.key, dec(k), v[k] || {})); });
    });
    out.sort(function (a, b) { return a.at < b.at ? 1 : a.at > b.at ? -1 : 0; });
    return out;
  }).catch(function (e) {
    var m = (e && e.message) || 'the shelf could not be read';
    if (/permission/i.test(m)) m = 'the database refused the read. Only the coach account can read the shelf';
    throw new Error(m);
  });
}

function clear(from, id) {
  return account().then(function (me) {
    return me.db.ref(id ? INTRAY + '/' + from + '/' + enc(id) : SHELF + '/' + from).remove();
  });
}

/* ── the in-trays and the outbox, 0.2.0 (2026-09-30) ──

   Tom, 2026-09-30: "Ok lets fix that", on the plan settled 2026-09-24
   (coach/CLAUDE.md, Client files): check-ins over the shelf, one parcel per
   photo; programs back into a client's TRAIN; a send with no signal waits on
   the phone and goes when the signal is back.

   The shelf above holds ONE parcel per client, so a check-in sent after a
   session would have replaced the session. So there are two trays now, one
   each way, and a tray holds any number of parcels, each under its own id:

     drop/in/<client uid>/<id>       a client's parcels, for the coach
     drop/client/<client uid>/<id>   the coach's parcels, for that client

   The rules (`rules()` below, and CLOUD.md) are what keep them honest: a
   client writes only under their own uid in `in`, and only the coach reads
   it; a client reads only their own `client` tray, and only they and the
   coach write there. A client never reads anything of Tom's.

   An id is the thing it carries, `train@1` or `ci-2026-09-30@front`, so
   sending the same thing again REPLACES its parcel rather than adding one,
   and the part before the @ is the send it belongs to (`grp`), which is what
   COACH counts. `drop/coach` stays readable and clearable, for parcels left
   there by 0.1, and `send` still writes it; no app calls `send` now.

   The outbox is why a send can wait. Firebase holds a write made with no
   signal only while the page stays open, and a phone closes pages. So a send
   goes into IndexedDB first, `motherbase-outbox`, one entry per parcel, and
   is taken out only once the database has confirmed it. It is this device's,
   not the person's, the same reason the config above is kept in
   localStorage and not in a row: rows travel to other devices, and two
   devices each sending one parcel is one parcel twice. It lives beside the
   store rather than in it because a queued photo is 300KB and the store's
   fast half is already full on one PC. It empties itself when the page
   opens, when the phone says it is online again, and when an app comes back
   to the front, from the top document only.                                */
var INTRAY = 'drop/in';
var OUTTRAY = 'drop/client';
var OBX = 'motherbase-outbox', OBS = 'q';
var obxP = null;
function obx() {
  if (obxP) return obxP;
  obxP = new Promise(function (res, rej) {
    if (!g.indexedDB) { rej(new Error('this browser has nowhere to keep a send')); return; }
    var r = g.indexedDB.open(OBX, 1);
    r.onupgradeneeded = function () { r.result.createObjectStore(OBS, { keyPath: 'k' }); };
    r.onsuccess = function () { res(r.result); };
    r.onerror = function () { rej(r.error || new Error('the outbox would not open')); };
    r.onblocked = function () { rej(new Error('the outbox is held open by an older copy of the app')); };
  }).catch(function (e) { obxP = null; throw e; });
  return obxP;
}
/* One transaction, resolved when it has COMPLETED, never when a request
   merely succeeded: a send is only in the outbox once it is on disk. */
function obxRun(mode, fn) {
  return obx().then(function (db) {
    return new Promise(function (res, rej) {
      var tx = db.transaction(OBS, mode), st = tx.objectStore(OBS), out = { v: null };
      fn(st, out);
      tx.oncomplete = function () { res(out.v); };
      tx.onerror = tx.onabort = function () { rej(tx.error || new Error('the outbox did not save')); };
    });
  });
}
function qAll() {
  return obxRun('readonly', function (st, out) {
    var r = st.getAll(); r.onsuccess = function () { out.v = r.result || []; };
  });
}
function qPut(items) { return obxRun('readwrite', function (st) { items.forEach(function (it) { st.put(it); }); }); }
function qDel(keys) { return obxRun('readwrite', function (st) { keys.forEach(function (k) { st.delete(k); }); }); }
function qPatch(keys, ch) {
  return obxRun('readwrite', function (st) {
    keys.forEach(function (k) {
      var r = st.get(k);
      r.onsuccess = function () { if (r.result) st.put(Object.assign(r.result, ch)); };
    });
  });
}

function trayPath(to, from, id) {
  return (to === 'coach' ? INTRAY + '/' + from : OUTTRAY + '/' + to) + '/' + enc(id);
}
function online() { return !g.navigator || g.navigator.onLine !== false; }
/* The database's own word on whether it can hear this device, waited for a
   few seconds, because it is false for a moment after the library loads.
   Writing without it is how a press sits spinning for as long as the phone
   has no signal. A stand-in with no `.info` is taken at its word. */
function heard(db, ms) {
  return new Promise(function (res) {
    var r, done = false, t;
    try { r = db.ref('.info/connected'); } catch (e) { res(true); return; }
    if (!r || typeof r.on !== 'function') { res(true); return; }
    var f = function (s) {
      if (done || !(s && s.val())) return;
      done = true; clearTimeout(t); try { r.off('value', f); } catch (e) {} res(true);
    };
    t = setTimeout(function () { if (done) return; done = true; try { r.off('value', f); } catch (e) {} res(false); }, ms);
    r.on('value', f);
  });
}
function within(p, ms) {
  return new Promise(function (res, rej) {
    var t = setTimeout(function () { rej(new Error('no answer from the database')); }, ms);
    p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); });
  });
}
/* What stopped a send, as one word the apps can act on:
     offline   no signal, or the database did not answer. It waits.
     signin    nobody is signed in on this device. It waits.
     blocked   there is signal and the Firebase library still would not load.
     refused   the database said no: the rules are not the ones in CLOUD.md.
     file      opened from a folder, which cannot sign in at all.        */
function whyOf(e) {
  var m = (e && e.message) || '';
  if (/folder/.test(m)) return 'file';
  if (/not signed in/.test(m)) return 'signin';
  if (/permission|refused/i.test(m)) return 'refused';
  if (/Firebase library|too slow/.test(m)) return online() ? 'blocked' : 'offline';
  return 'offline';
}

/* Put parcels in the outbox and try to send them now. `list` is
   [{to, id, kind, bag, say}], `to` 'coach' or a client's uid. Resolves with
   {sent, left, why, msg}: `left` are still waiting, and why is one of the
   words above, or '' when everything went. Refuses only a parcel that can
   never go, one over the ceiling, and then queues none of the list. */
function post(list) {
  var at = new Date().toISOString(), items = [];
  for (var i = 0; i < list.length; i++) {
    var x = list[i], size = 0;
    try { size = JSON.stringify(x.bag).length; } catch (e) { return Promise.reject(new Error('that could not be packed')); }
    if (size > PARCEL) return Promise.reject(new Error('that is too big to send this way'));
    var to = x.to || 'coach', id = String(x.id);
    items.push({ k: to + '|' + id, to: to, id: id, grp: id.split('@')[0], kind: String(x.kind || ''),
      n: (x.bag && x.bag.rows && x.bag.rows.length) || 0, bag: x.bag, at: at, size: size, say: x.say || '' });
  }
  if (isFile()) return Promise.resolve({ sent: 0, left: items.length, why: 'file', msg: 'this page was opened from a folder', keys: [] });
  return qPut(items).then(function () {
    var mine = {}; items.forEach(function (it) { mine[it.k] = 1; });
    return flush().then(function (r) {
      var left = r.leftKeys.filter(function (k) { return mine[k]; });
      return { sent: items.length - left.length, left: left.length, why: left.length ? r.why : '', msg: r.msg, keys: left };
    });
  });
}

var flushQ = Promise.resolve();
function flush() {
  var p = flushQ.then(runFlush, runFlush);
  flushQ = p.catch(function () {});
  return p;
}
function runFlush() {
  return qAll().then(function (items) {
    var keys = items.map(function (it) { return it.k; });
    var stop = function (e, sent) {
      var why = whyOf(e), left = keys.filter(function (k) { return sent.indexOf(k) < 0; });
      if (left.length) qPatch(left, { waited: 1 }).catch(function () {});
      return { sent: sent.length, left: left.length, leftKeys: left, why: why, msg: (e && e.message) || '' };
    };
    if (!items.length) return { sent: 0, left: 0, leftKeys: [], why: '', msg: '' };
    if (!online()) return stop(new Error('no signal'), []);
    return account().then(function (me) {
      return heard(me.db, 8000).then(function (ok) {
        if (!ok) return stop(new Error('no signal'), []);
        items.sort(function (a, b) { return a.at < b.at ? -1 : a.at > b.at ? 1 : a.id < b.id ? -1 : 1; });
        var sent = [], waited = [], fail = null;
        return items.reduce(function (p, it) {
          return p.then(function () {
            if (fail) return;
            var data = JSON.stringify(it.bag);
            var v = { kind: it.kind, at: it.at, by: me.email || '', n: it.n || 0, grp: it.grp, data: data };
            return within(me.db.ref(trayPath(it.to, me.uid, it.id)).set(v), 90000).then(function () {
              sent.push(it.k); if (it.waited) waited.push(it);
              return qDel([it.k]);
            }, function (e) { fail = e; });
          });
        }, Promise.resolve()).then(function () {
          if (waited.length) told(waited);
          return fail ? stop(fail, sent) : { sent: sent.length, left: 0, leftKeys: [], why: '', msg: '' };
        });
      });
    }, function (e) { return stop(e, []); });
  }, function (e) { return { sent: 0, left: 0, leftKeys: [], why: 'nobox', msg: (e && e.message) || '' }; });
}

/* A send that had to wait says so when it finally goes, in whichever app is
   open, because the app that queued it may be long closed. */
function told(list) {
  var say = {};
  list.forEach(function (it) { if (it.say) say[it.say] = 1; });
  var s = Object.keys(say);
  if (!s.length || !g.UI || !g.UI.toast || g.document.hidden) return;
  try { g.UI.toast('Sent ' + s.join(', ') + '.'); } catch (e) {}
}

/* Take a group back out of the outbox: the app handed a file over instead. */
function unpost(keys) { return keys && keys.length ? qDel(keys) : Promise.resolve(); }
/* What is still waiting, without the bags: [{k, to, id, grp, kind, at, size}] */
function pending() {
  return qAll().then(function (items) {
    return items.map(function (it) { return { k: it.k, to: it.to, id: it.id, grp: it.grp, kind: it.kind, at: it.at, size: it.size }; });
  }, function () { return []; });
}

/* Empty the outbox by itself, from the top document only, so a home screen
   holding fourteen frames tries once and not fourteen times. A try that is
   left waiting for signal tries again in a minute, then every five. */
var autoT = null, autoGap = 60000;
function autoFlush() {
  if (g.top !== g || isFile()) return;
  if (autoT) { clearTimeout(autoT); autoT = null; }
  if (!probe && !cfg.on) return;
  pending().then(function (l) {
    if (!l.length) return null;
    return flush().then(function (r) {
      if (r.left && (r.why === 'offline' || r.why === 'blocked')) {
        autoT = setTimeout(autoFlush, autoGap);
        autoGap = Math.min(autoGap * 2, 300000);
      } else autoGap = 60000;
    });
  }).catch(function () {});
}
g.addEventListener('online', function () { autoGap = 60000; setTimeout(autoFlush, 1500); });
if (g.document) g.document.addEventListener('visibilitychange', function () { if (!g.document.hidden) setTimeout(autoFlush, 800); });

/* ── the coach reading the in-tray ──

   `list` names what is waiting without downloading it: a shallow read over
   the database's REST door, which returns keys and no values. So COACH opening
   on a phone does not pull every photo a client sent just to print a count.
   It falls back to the whole read when that door will not answer. */
function shallow(me, path) {
  if (me.keys) return Promise.resolve(me.keys(path));
  return g.firebase.auth(app()).currentUser.getIdToken().then(function (tok) {
    var u = String(cfg.cfg.databaseURL).replace(/\/$/, '') + '/' + path + '.json?shallow=true&auth=' + encodeURIComponent(tok);
    return g.fetch(u).then(function (r) {
      if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'the database refused the read. Only the coach account can read the shelf' : 'the shelf did not answer');
      return r.json();
    });
  });
}
function list() {
  return account().then(function (me) {
    return shallow(me, INTRAY).then(function (top) {
      var froms = Object.keys(top || {});
      return Promise.all(froms.map(function (f) {
        return shallow(me, INTRAY + '/' + f).then(function (ids) {
          return Object.keys(ids || {}).map(function (k) { var id = dec(k); return { from: f, id: id, grp: id.split('@')[0] }; });
        });
      })).then(function (ls) { return [].concat.apply([], ls); });
    }).then(function (fresh) {
      return shallow(me, SHELF).then(function (old) {
        return fresh.concat(Object.keys(old || {}).map(function (f) { return { from: f, id: '', grp: '', legacy: 1 }; }));
      });
    });
  }).catch(function (e) {
    var m = (e && e.message) || '';
    if (/refused|not signed in|folder|databaseURL|apiKey|Firebase library|too slow/.test(m)) throw e;
    /* the REST door is shut: read the lot the slow way, and hand back the names */
    return waiting().then(function (l) { return l.map(function (p) { return { from: p.from, id: p.id, grp: p.grp, legacy: p.legacy }; }); });
  });
}
/* One parcel, read in full. */
function fetchOne(from, id) {
  return account().then(function (me) {
    return me.db.ref(id ? INTRAY + '/' + from + '/' + enc(id) : SHELF + '/' + from).once('value');
  }).then(function (snap) {
    var v = (snap && snap.val && snap.val()) || null;
    return v ? unpack(from, id, v) : null;
  });
}
function unpack(from, id, v) {
  var body = null;
  try { body = JSON.parse(v.data || 'null'); } catch (e) {}
  return { from: from, id: id || '', grp: v.grp || (id ? String(id).split('@')[0] : from), kind: v.kind || '', at: v.at || '',
    by: v.by || '', n: v.n || 0, body: body, legacy: id ? 0 : 1 };
}
/* How many SENDS are waiting: a session is one, a check-in with its photos
   is one. Counted from the names alone. */
function count() {
  return list().then(function (l) {
    var s = {};
    l.forEach(function (p) { s[p.from + '|' + (p.legacy ? '' : p.grp)] = 1; });
    return Object.keys(s).length;
  });
}

/* ── a client reading their own tray ── */
function inbox() {
  return account().then(function (me) {
    return me.db.ref(OUTTRAY + '/' + me.uid).once('value');
  }).then(function (snap) {
    var out = [], v = (snap && snap.val && snap.val()) || {};
    Object.keys(v).forEach(function (k) { out.push(unpack('coach', dec(k), v[k] || {})); });
    out.sort(function (a, b) { return a.at < b.at ? -1 : a.at > b.at ? 1 : 0; });
    return out;
  });
}
function opened(id) {
  return account().then(function (me) { return me.db.ref(OUTTRAY + '/' + me.uid + '/' + enc(id)).remove(); });
}

/* The rules, with the coach's account written in. COACH's Settings copies
   this, so Tom never edits a placeholder by hand. Kept word for word with
   CLOUD.md step 3. */
function rules(coach) {
  var C = "'" + String(coach || 'PASTE_YOUR_UID_HERE').replace(/[^A-Za-z0-9_-]/g, '') + "'";
  var V = "newData.hasChildren(['kind','at','data']) && newData.child('data').isString() && newData.child('data').val().length < 2000000";
  return JSON.stringify({ rules: {
    u: { $uid: { '.read': 'auth != null && auth.uid === $uid', '.write': 'auth != null && auth.uid === $uid', rows: { '.indexOn': ['updated_at'] } } },
    drop: {
      coach: { '.read': 'auth != null && auth.uid === ' + C,
        $from: { '.write': 'auth != null && ($from === auth.uid || auth.uid === ' + C + ')', '.validate': V } },
      in: { '.read': 'auth != null && auth.uid === ' + C,
        $from: { '.write': 'auth != null && ($from === auth.uid || auth.uid === ' + C + ')', $parcel: { '.validate': V } } },
      client: {
        $to: { '.read': 'auth != null && auth.uid === $to', '.write': 'auth != null && ($to === auth.uid || auth.uid === ' + C + ')', $parcel: { '.validate': V } } },
    },
  } }, null, 2);
}

/* ── incoming ──

   One query, ordered by `updated_at` and starting two days before the last
   one we merged (`back`, above). `updated_at` is an ISO string, which sorts
   lexicographically, so this is an ordinary range query and needs only the
   one index.

   Both child_added and child_changed are wired to the same handler. A row that
   is edited gets a NEWER `updated_at`, which moves it into the window from
   below, so the database announces it as an addition to the query rather than
   a change — which of the two fires depends on where the row was before, and
   we want it either way.

   `startAt` is inclusive, so the boundary row itself comes back down once per
   connection. That is deliberate rather than tolerated: `Rec.merge` compares
   times and returns early when nothing moved, so re-delivery costs one
   comparison and removes the off-by-one that an exclusive boundary would need
   to get right in a place where getting it wrong loses a row.              */
function onRow(snap) {
  var v = null;
  try { v = snap.val(); } catch (e) {}
  if (!v || !v.id || !v.type) return;
  /* The database stores no empty list, empty object or null, so a row whose
     payload was only those, such as BLOCK's `{v: []}`, comes down with no
     payload at all, and an app reading a field off it throws (2026-09-25). */
  if (v.payload == null && !v.deleted) v.payload = {};
  var R = store(), n = 0;
  try { n = R ? R.merge([v]) : 0; } catch (e) { return; }
  var at = v.updated_at || '';
  cloudAt[v.id] = at;
  /* The cloud holds an older copy than this device: something wrote over a
     newer one. Ours goes back up. */
  var mine = mineOf(v.id);
  if (mine && (mine.updated_at || '') > at) { redo[v.id] = 1; nudge(); }
  if (at && at > (cfg.seen || '') && at <= soon() && !unkeptNow()) { cfg.seen = at; csave(); }
  if (n) { last.got += n; landed('got'); }
}
/* This device's own copy of a row, tombstone or not. */
function mineOf(id) { var R = store(); try { return (R && R._rows && R._rows[id]) || null; } catch (e) { return null; } }

/* A row left the window. Rows are never removed from the database, so it
   left from the bottom: the cloud now holds it stamped before `winFrom`,
   older than any copy here stamped at or after it. */
function onGone(snap) {
  var v = null;
  try { v = snap.val(); } catch (e) {}
  if (!v || !v.id) return;
  var mine = mineOf(v.id);
  if (mine && (mine.updated_at || '') >= winFrom) { cloudAt[v.id] = ''; redo[v.id] = 1; nudge(); }
  else delete cloudAt[v.id];
}

/* Listen, and send nothing until the first answer is merged. Run by start()
   and again when a dropped connection comes back: a new query is a new read
   from the database, where the old one would answer from what it had. */
function listen() {
  unlisten();
  loaded = false;
  winFrom = back(cfg.seen);
  var q = winFrom ? ref.orderByChild('updated_at').startAt(winFrom) : ref.orderByChild('updated_at');
  query = q;
  q.on('child_added', onRow, onErr);
  q.on('child_changed', onRow, onErr);
  q.on('child_removed', onGone, onErr);
  /* A value event comes after every child event of the same answer, so by
     now each row the cloud holds in the window has been merged. */
  q.once('value').then(function () {
    if (q !== query || !started) return;
    loaded = true; say();
    /* Anything written while this device was away goes up now. */
    push('open').then(function () { if (due()) check(); });
  }, function () {});
}
function unlisten() {
  try { if (query) { query.off('child_added', onRow); query.off('child_changed', onRow); query.off('child_removed', onGone); } } catch (e) {}
  query = null;
}

function start() {
  if (started) return Promise.resolve(false);
  if (!probe) {
    if (!cfg.on || !cfg.cfg) return Promise.resolve(false);
    if (g.top !== g) return Promise.resolve(false);   /* one connection per document */
    if (missing(cfg.cfg)) return Promise.resolve(false);
  }
  /* The signed-in account is the source of truth for the uid, not the one we
     wrote down: a token can expire and a stored uid would then address a
     path nothing can read. The smoke checks hand in a stand-in instead. */
  var found = probe ? Promise.resolve().then(probe) : loadSDK().then(function () {
    auth = g.firebase.auth(app());
    return new Promise(function (res) {
      var off = auth.onAuthStateChanged(function (u) { off(); res(u); });
    });
  }).then(function (u) {
    return u ? { uid: u.uid, email: u.email || '', db: g.firebase.database(app()) } : null;
  });
  /* 0.2.3: TRAIN's sets are kept out of the open (records.js, KEPT OUT). A
     push, the daily check and a row heard from the cloud all compare against
     every row here, so nothing starts until every kept-out type is in. The
     smoke checks' stand-in store has no `need` and goes straight on. */
  found = found.then(function (me) {
    var R = store();
    return me && !probe && R && R.need ? R.need().then(function () { return me; }) : me;
  });
  return found.then(function (me) {
    if (!me) { signedOut(); return false; }
    if (started) return false;
    if (probe) {
      probed = { cfg: JSON.stringify(cfg), last: JSON.stringify(last), healed: healed, lacked: lacked };
      rs = me.store || null;
      cfg.pushed = me.pushed || ''; cfg.seen = me.seen || ''; cfg.checked = me.checked || '';
    }
    acct = me; uid = me.uid; db = me.db;
    cfg.uid = uid; cfg.email = me.email || ''; cfg.lost = '';
    if (!probe) cfg.kept = keptIn();
    /* Nothing pushed from here yet, so every row here is about to be compared
       with the cloud's copy. Read every row there first. */
    if (!cfg.pushed) cfg.seen = '';
    csave();
    ref = db.ref('u/' + uid + '/rows');
    cloudAt = Object.create(null); redo = Object.create(null);
    broken = false; dropped = false; owed = false;
    started = true;
    listen();
    /* Firebase's own answer to "can the database hear this device". */
    connRef = db.ref('.info/connected');
    connRef.on('value', onConn);
    if (!probe) {
      watch();
      wire();
      if (!hourly) hourly = setInterval(function () { if (started && due()) check(); }, 36e5);
    }
    note('', 1);
    return true;
  }).catch(function (e) { note(e && e.message ? e.message : 'could not start', 0); return false; });
}

function onErr(e) {
  /* A permission error here means the rules are not the ones in the setup
     note, and it is worth saying which because it is the one failure with an
     obvious fix. */
  var m = e && e.message ? e.message : 'the database stopped answering';
  if (/permission/i.test(m)) m = 'the database refused the read. Check the rules from the setup note';
  if (/index/i.test(m)) m = 'the database needs its index. Add "rows": { ".indexOn": ["updated_at"] } to the rules';
  /* A cancelled listener never hears another row, so this is not Live any
     more, whatever start() said. */
  broken = true;
  note(m, 0);
}

function onConn(s) {
  var was = conn;
  conn = !!(s && s.val());
  if (was && !conn) dropped = true;
  /* Back after a drop: rows other devices sent meanwhile may not have been
     heard yet, so read again before anything goes up. */
  if (conn && !was && dropped && started && ref) { dropped = false; listen(); }
  else if (conn && owed) nudge();
  say();
}

/* Signed in once, and Google has no sign-in for this device now. It happened
   to both desktop programs on 2026-09-24, some time after 3:20am, and nothing
   in the suite signed them out: the sign-in was simply gone. Said in words
   that name the one fix. */
function signedOut() {
  if (cfg.on && !cfg.lost) { cfg.lost = new Date().toLocaleString(); cfg.lostKept = keptIn(); csave(); }
  note('Google has signed this device out' + (cfg.lost ? ' (noticed ' + cfg.lost + ')' : '') +
    '. Nothing syncs from here until you sign in again', 0);
}

/* Why the sign-in went is still unproven (2026-09-25). Firebase keeps it in
   the first storage that answers at load, IndexedDB then localStorage then
   sessionStorage, and deletes it from every other one. An IndexedDB slow to
   open plus a full or working localStorage can therefore drop it. So the
   store Firebase chose is written down when signed in (`kept`) and when the
   sign-out is noticed (`lostKept`), and Google's last refusal of a token
   (`authErr`, the error code only, never a token) beside them. */
function keptIn() {
  try { return auth._delegate.persistenceManager.persistence.type || '?'; } catch (e) { return '?'; }
}
(function () {
  var f = g.fetch;
  if (!f || f.__mbAuth) return;
  g.fetch = function (u) {
    var p = f.apply(this, arguments);
    var s = String(u && u.url || u);
    if (!/securetoken\.googleapis|identitytoolkit\.googleapis/.test(s)) return p;
    return p.then(function (r) {
      if (!r.ok) r.clone().json().then(function (j) {
        cfg.authErr = new Date().toLocaleString() + ' ' + r.status + ' ' +
          String(j && j.error && j.error.message || '').slice(0, 60);
        csave();
      }).catch(function () {});
      return r;
    });
  };
  g.fetch.__mbAuth = 1;
})();

/* The sign-in can end while the page is open. Until 0.1.4 the account was
   read once at start and never again, so a device signed out mid-session kept
   saying Live. One lasting watch per document, set the first time start()
   gets a user. */
function watch() {
  if (watching || !auth) return;
  watching = true;
  auth.onAuthStateChanged(function (u) {
    if (u || !started) return;
    stop();
    signedOut();
  });
}

function stop() {
  unlisten();
  try { if (connRef) connRef.off('value', onConn); } catch (e) {}
  if (pt) { clearTimeout(pt); pt = null; }
  ref = null; db = null; connRef = null; started = false; uid = ''; conn = false; broken = false;
  loaded = false; owed = false; dropped = false; winFrom = ''; acct = null;
  cloudAt = Object.create(null); redo = Object.create(null);
}

/* ── outgoing ──

   Everything written after the boundary, in chunks, with the boundary moving
   only on a confirmed write. A failed push therefore needs no queue and no
   retry list — the boundary simply does not move and the same rows go again.
   That is the sheet's rule and it is the right one.                        */
/* What goes up, and where the boundary lands.

   Pure on purpose, and kept out of `push` so it can be checked without a
   database, which is the only way it CAN be checked here: nobody in this
   repo has Tom's Firebase project. It is also the piece most worth checking,
   because it is the one that decides the boundary, and a boundary that stops
   moving ends all syncing with nothing on screen to say so. The check one
   level under the bug is "does the edge pass an oversized row", not "did the
   photo arrive". */
function plan(rows, since, base, cloud) {
  var patch = {}, edge = since || '', sent = 0, skipped = 0, had = 0, lim = soon();
  rows.forEach(function (r) {
    if (!r || !r.id) return;
    /* Stamped in the future: not sent, and the boundary does not follow it. */
    if (r.updated_at > lim) { skipped++; return; }
    if (r.updated_at > edge) edge = r.updated_at;
    /* The cloud holds this already, or a newer copy. Sending it would at best
       write the same row again and at worst put an old one over a new one.
       The boundary still passes it: there is nothing left to send. */
    if (cloud && cloud[r.id] != null && cloud[r.id] >= r.updated_at) { had++; return; }
    var j;
    try { j = JSON.stringify(r); } catch (e) { skipped++; return; }
    if (j.length > BIG) { skipped++; return; }
    /* The copy as JSON read it, not the row: Firebase throws on a field
       holding `undefined` (or NaN), and that one throw failed the whole
       400-row write and every push after it (0.2.5, 2026-10-05, the iPhone
       STATUS app on one meal). IndexedDB keeps `undefined`, so such a row
       never heals by itself. JSON drops it, which is what the store does. */
    patch[base + enc(r.id)] = JSON.parse(j);
    sent++;
  });
  return { patch: patch, edge: edge, sent: sent, skipped: skipped, had: had };
}
/* Would `plan` ever send this row. */
function fits(r) {
  if (!r || !r.id || r.updated_at > soon()) return false;
  try { return JSON.stringify(r).length <= BIG; } catch (e) { return false; }
}

/* One chunk's write. Resolves with how many rows the database refused.
   Firebase checks a write before sending it and THROWS, there and then, on
   anything it will not store: a key holding `.` `#` `$` `/` `[` `]`, a value
   it cannot read. One such row made the whole chunk throw, the boundary
   stayed put, and every push after it threw on the same row, so nothing
   from that device went up again. A thrown chunk is now written a row at a
   time; a row that throws on its own is left out, counted in `refused`, and
   the boundary passes it like a photo. A refusal that comes back LATER
   (the rules, no network) is not this, and still fails the push. */
function write(patch) {
  try { return db.ref().update(patch).then(function () { return 0; }); }
  catch (e) {
    var bad = 0, steps = [];
    Object.keys(patch).forEach(function (k) {
      var one = {}; one[k] = patch[k];
      try { steps.push(db.ref().update(one)); }
      catch (e2) {
        bad++;
        if (last.refusedIds.length < 20) last.refusedIds.push(patch[k] && patch[k].id);
        delete patch[k];
      }
    });
    last.refused += bad;
    return Promise.all(steps).then(function () { return bad; });
  }
}

function push(why) {
  if (!started || !db || !uid) return Promise.resolve(0);
  /* Not before the cloud has answered, and never blind. The top of this file
     says why; the push runs by itself once both are true. */
  if (!loaded || !conn) { owed = true; return Promise.resolve(0); }
  if (pushing) { pushAgain = true; return Promise.resolve(0); }
  var R = store();
  if (!R) return Promise.resolve(0);
  owed = false;
  /* Cheap gate first: asking "is there anything at all" allocates nothing and
     stops at the first row that qualifies, where building the list copies and
     sorts every row on the device. */
  var since = cfg.pushed || '', again = redo;
  var more = Object.keys(again).length > 0;
  if (since && !more && !R.newerThan(null, since)) return Promise.resolve(0);

  var all;
  try { all = R.export(); } catch (e) { return Promise.resolve(0); }
  redo = Object.create(null);
  var todo = [];
  for (var i = 0; i < all.length; i++) if (all[i].updated_at > since || again[all[i].id]) todo.push(all[i]);
  if (!todo.length) return Promise.resolve(0);
  todo.sort(function (a, b) { return a.updated_at < b.updated_at ? -1 : a.updated_at > b.updated_at ? 1 : 0; });

  pushing = true;
  var sent = 0, skipped = 0, at = 0, edge = since;

  function chunk() {
    if (at >= todo.length) return Promise.resolve();
    /* From the edge so far, not from `since`: a last chunk holding only
       future-dated rows would otherwise put the boundary back to the start. */
    var p = plan(todo.slice(at, at + CHUNK), edge, 'u/' + uid + '/rows/', cloudAt);
    at += CHUNK;
    skipped += p.skipped;
    var step = p.sent ? write(p.patch) : Promise.resolve(0);
    return step.then(function (bad) {
      sent += p.sent - bad;
      Object.keys(p.patch).forEach(function (k) { var r = p.patch[k]; if (r) cloudAt[r.id] = r.updated_at; });
      edge = p.edge;
      cfg.pushed = p.edge; csave();
      return chunk();
    });
  }

  return chunk().then(function () {
    pushing = false;
    last.sent += sent; last.skipped += skipped;
    note('', 1);
    if (sent) landed('sent');
    if (pushAgain) { pushAgain = false; return push('again').then(function (n) { return n < 0 ? n : sent + n; }); }
    return sent;
  }).catch(function (e) {
    pushing = false;
    /* whatever was owed a second send is still owed one */
    Object.keys(again).forEach(function (id) { redo[id] = 1; });
    var m = e && e.message ? e.message : 'the push did not land';
    if (/permission/i.test(m)) m = 'the database refused the write. Check the rules from the setup note';
    note(m, 0);
    /* -1, not 0: "nothing to send" and "the send failed" were the same answer
       until 0.1.4, so Sync now said Sent after a refused write. */
    return -1;
  });
}

/* ── the daily check, 0.2.2 (2026-09-30) ──

   A device that lost rows while `seen` was already past them never got them
   back, because nothing moves `seen` backwards (shared/CLAUDE.md, "A row
   saved nowhere is not received"). So once a day, and on Sync now, the ids
   the cloud holds are read without their rows, the shallow read the coach's
   in-tray count uses, about a megabyte for Tom's whole history, and compared
   with every id here, tombstones included:

   · one the cloud has and this device lacks is fetched and merged. More than
     FETCH lacking, with a live row among the first FETCH, is a real loss too
     big to fetch one by one, so the whole cloud is read again instead
   · one this device has and the cloud lacks goes up on the next push. A row
     merged in from the sheet, a backup or a client's file keeps its old
     time, and a boundary already past that time never sent it
   · a tick older than the home screen's purge (`LifeOS.prune(800)` on every
     open, less five days for time zones) is left alone, or it would come
     back every day and be purged every day, and so is a smoke check's type

   A missing tombstone is not a loss. It is merged anyway, being tiny, so the
   same id is not fetched again tomorrow. */
var CHECK_GAP = 20 * 36e5, FETCH = 300;
var OLD = { tick: 795 };
var checking = false, healed = 0, lacked = 0, hourly = null;
function due() { var t = Date.parse(cfg.checked || ''); return !isFinite(t) || Date.now() - t > CHECK_GAP; }
function leave(id) {
  var p = String(id).split('|'), type = p[1] || '', date = p[2] || '';
  if (/^smoke/.test(type)) return true;
  return !!(OLD[type] && date && date < new Date(Date.now() - OLD[type] * 864e5).toISOString().slice(0, 10));
}
function check(force, max) {
  if (!started || !loaded || !conn || checking) return Promise.resolve(null);
  if (!force && !due()) return Promise.resolve(null);
  var R = store();
  if (!R || !R._rows || unkeptNow()) return Promise.resolve(null);
  /* rows still on their way in from IndexedDB would all look lost */
  try { var st = R.stats ? R.stats() : null; if (st && (!st.hydrated || st.idbSlow)) return Promise.resolve(null); } catch (e) {}
  checking = true;
  var cap = max || FETCH, me = acct, from = ref;
  return shallow(me, 'u/' + uid + '/rows').then(function (top) {
    if (!started || ref !== from) return null;
    var there = Object.create(null), here = R._rows, want = [], up = 0;
    Object.keys(top || {}).forEach(function (k) { there[dec(k)] = 1; });
    Object.keys(there).forEach(function (id) { if (!here[id] && !leave(id)) want.push(id); });
    Object.keys(here).forEach(function (id) {
      if (there[id] || leave(id) || !fits(here[id])) return;
      redo[id] = 1; cloudAt[id] = ''; up++;
    });
    lacked = up;
    return Promise.all(want.slice(0, cap).map(function (id) {
      return from.child(enc(id)).once('value').then(function (s) { return s && s.val ? s.val() : null; }, function () { return null; });
    })).then(function (vals) {
      var rows = vals.filter(function (v) { return v && v.id && v.type; }), n = 0;
      rows.forEach(function (v) { if (v.payload == null && !v.deleted) v.payload = {}; cloudAt[v.id] = v.updated_at || ''; });
      try { n = rows.length ? R.merge(rows) : 0; } catch (e) {}
      if (n) { last.got += n; landed('got'); }
      var live = rows.filter(function (v) { return !v.deleted; }).length;
      healed += live;
      cfg.checked = new Date().toISOString();
      if (want.length > cap && live) { cfg.seen = ''; csave(); listen(); }
      else { csave(); if (up) push('check'); }
      return { missing: want.length, back: live, up: up };
    });
  }).then(function (r) { checking = false; say(); return r; },
          function () { checking = false; return null; });
}

/* ── when to push ──

   On every change, debounced. The store announces a change whatever wrote it,
   including a row that arrived from a frame over the BroadcastChannel, so the
   top document pushes work done anywhere in the suite. A second and a half is
   long enough that typing a bullet is one push rather than thirty, and short
   enough to still feel immediate.                                          */
var pt = null;
function nudge() {
  if (!started) return;
  if (pt) clearTimeout(pt);
  pt = setTimeout(function () { pt = null; push('change'); }, 1500);
}

/* Subscribed from `start`, not from boot, and this is the bug the browser
   caught rather than a tidy-up.

   Boot declines to do anything on a device that is not set up yet, which is
   right. But the very first time anybody sets this up, that is the device they
   are standing at: they paste the config, sign in, the row says "Live", and
   then nothing they write ever leaves until they happen to reload the page.
   Signing in is exactly when the subscription has to start existing, so it
   starts here, where being live begins. Once only, because `start` runs again
   on every reconnection.                                                    */
var wired = false;
function wire() {
  if (wired || !g.Rec || !g.Rec.on) return;
  wired = true;
  g.Rec.on(nudge);
}

/* True once `test()` is, false after `ms` without that. Only Sync now waits:
   the connection lands a moment after start, and the first read after that. */
function waitFor(test, ms) {
  if (test()) return Promise.resolve(true);
  return new Promise(function (res) {
    var t0 = Date.now();
    (function tick() {
      if (test()) return res(true);
      if (!started || Date.now() - t0 > ms) return res(false);
      setTimeout(tick, 150);
    })();
  });
}

/* The top document's Cloud when this is a frame of the same site, or null. */
function topCloud() {
  if (g.top === g) return null;
  try { var T = g.top.Cloud; return T && T !== Cloud && T.state ? T : null; } catch (e) { return null; }
}

/* ── the public face ────────────────────────────────────────────────────── */
var Cloud = {
  VERSION: '0.2.5',

  /** everything a settings row needs, and nothing it can break */
  state: function () {
    /* In a frame the connection belongs to the top document, so ask it. Until
       2026-09-24 every app opened from the home screen said "not signed in"
       while the home screen was live. */
    var T = topCloud();
    if (T) { var s = T.state(); s.frame = true; return s; }
    return {
      has: !!(cfg.cfg && !missing(cfg.cfg)),
      on: !!cfg.on,
      /* listening AND nothing has cancelled it. `conn` is separate: a device
         on a train is still live, just not connected this minute. */
      live: !!started && !broken,
      conn: !!started && !broken && conn,
      out: !!(cfg.on && cfg.lost && !started),
      lost: cfg.lost || '',
      /* 0.2.4: where Firebase keeps the sign-in (LOCAL, or SESSION when no
         lasting storage answered, which ends with the tab), where it was when
         the sign-out was noticed, and Google's last refusal. report.js puts
         them on the device row, so a sign-out is read in the nightly backup. */
      kept: cfg.kept || '', lostKept: cfg.lostKept || '', authErr: cfg.authErr || '',
      email: cfg.email || '',
      at: cfg.at || '',
      sentAt: cfg.sentAt || '',
      gotAt: cfg.gotAt || '',
      why: last.why || '',
      ok: !!last.ok,
      sent: last.sent, got: last.got, skipped: last.skipped,
      /* 0.2.5: rows the database would not store, and the first few ids */
      refused: last.refused, refusedIds: last.refusedIds.slice(),
      /* the first read after a start or a dropped connection is merged */
      loaded: !!started && loaded,
      /* the daily check: when it last ran, rows it brought back this session,
         and rows here the cloud lacked */
      checked: cfg.checked || '', healed: healed, lacked: lacked,
      file: isFile(),
      frame: g.top !== g,
    };
  },
  on: function (f) { listeners.push(f); return function () { var i = listeners.indexOf(f); if (i > -1) listeners.splice(i, 1); }; },

  /** take a pasted config. Returns '' when it was taken, or why it was not. */
  paste: function (text) {
    var c = parseCfg(text);
    var bad = missing(c);
    if (bad) return bad;
    /* A different project means a different set of rows; the boundaries from
       the old one would skip everything written before the switch. */
    var changed = !cfg.cfg || cfg.cfg.projectId !== c.projectId || cfg.cfg.databaseURL !== c.databaseURL;
    cfg.cfg = c;
    if (changed) { cfg.pushed = ''; cfg.seen = ''; cfg.uid = ''; cfg.email = ''; stop(); fb = null; }
    csave(); say();
    return '';
  },
  forget: function () { stop(); fb = null; cfg = { cfg: BUILT_IN, on: 0, uid: '', email: '', at: '', sentAt: '', gotAt: '', lost: '', pushed: '', seen: '' }; csave(); say(); },

  signIn: signIn,
  signOut: signOut,

  /* ── the coach shelf ──
     `send` is the client's end, `waiting` and `took` are Tom's. All three work
     in a frame, which the row sync deliberately does not. */

  /** the account id the database sees, for pasting into the drop rules */
  who: function () { return account().then(function (me) { return { uid: me.uid, email: me.email }; }); },
  /** 0.1: one parcel in the client's single slot on the shelf. Kept for the
      smoke checks and for anything older; apps send with `post` now. */
  send: put,
  /** everything on the shelf and in the in-tray, newest first, bodies and
      all. Coach account only. */
  waiting: shelf,
  /** that one is in. Clear it: `took(from)` a 0.1 slot, `took(from, id)` one
      parcel from the in-tray. */
  took: clear,

  /* ── 0.2: the trays and the outbox ── */
  /** is there an account to try: signed in on this device, from an address */
  ready: function () { return !!probe || (!!cfg.on && !isFile() && !missing(cfg.cfg)); },
  /** queue parcels [{to, id, kind, bag, say}] and try them now. Resolves
      {sent, left, why, msg, keys}; see `whyOf` for the words. */
  post: post,
  /** try everything waiting in this device's outbox now */
  flush: flush,
  /** what is still waiting, without the bags */
  pending: pending,
  /** take waiting parcels back out, by key, when a file went instead */
  unpost: unpost,
  /** a program, or anything, for one client's TRAIN: to their tray */
  give: function (uid, id, kind, bag, say) { return post([{ to: uid, id: id, kind: kind, bag: bag, say: say }]); },
  /** the coach's in-tray and the old shelf as names only: [{from, id, grp, legacy}] */
  list: list,
  /** one parcel in full: {from, id, grp, kind, at, by, n, body, legacy} */
  fetch: fetchOne,
  /** how many sends are waiting, counted from names alone */
  count: count,
  /** a client's own tray, oldest first */
  inbox: inbox,
  /** that one is in the client's app now. Clear it from their tray. */
  opened: opened,
  /** the database rules with the coach's account id in them */
  rules: rules,
  start: start,
  stop: stop,
  /** push whatever is waiting, now. Resolves with how many rows went up, and
      rejects with the reason in words when nothing could. */
  sync: function () {
    var T = topCloud();
    if (T) return T.sync();
    return (started ? Promise.resolve() : start()).then(function () {
      if (!started) throw new Error(last.why || 'not signed in');
      if (broken) throw new Error(last.why || 'the database stopped answering');
      return waitFor(function () { return conn; }, 4000);
    }).then(function (ok) {
      /* Firebase holds an offline write until the connection is back, so
         waiting on it would leave the button spinning for as long as that
         takes. The rows are safe here and go up by themselves. */
      if (!ok) throw new Error('this device is offline. Everything is saved here and goes up when the connection is back');
      return waitFor(function () { return loaded; }, 60000);
    }).then(function (ok) {
      if (!ok) throw new Error('still reading what the cloud holds. Everything here goes up by itself once that is in');
      return push('manual');
    }).then(function (n) {
      if (n < 0) throw new Error(last.why || 'the send did not land');
      /* and look both ways for anything missing, without waiting on it */
      check(true);
      return n;
    });
  },

  /* exposed for the smoke checks, which have no database to talk to */
  _enc: enc, _dec: dec, _parse: parseCfg, _missing: missing, _plan: plan, _write: function (d, p) { var was = db; db = d; try { return write(p); } finally { db = was; } }, _big: BIG,
  _cfg: function () { return cfg; },
  /* `f` returns `{uid, email, db}` as account() would, or throws; null puts
     the real one back. The shelf reads it, and since 0.2.2 so does `start`,
     which then runs the row sync against that database, against `store`,
     from the `pushed`, `seen` and `checked` it names, in a frame too, and
     writes nothing to this device's settings. Null stops that sync and puts
     the settings back. A real sync already running is never touched. */
  _probe: function (f) {
    probe = f || null;
    if (f || !probed) return;
    stop();
    try { cfg = JSON.parse(probed.cfg); last = JSON.parse(probed.last); } catch (e) {}
    healed = probed.healed; lacked = probed.lacked;
    probed = null; rs = null;
    say();
  },
  _push: function () { return push('check'); },
  _check: check,
  _look: function () {
    return { started: started, loaded: loaded, conn: conn, pushed: cfg.pushed, seen: cfg.seen, from: winFrom,
      redo: Object.keys(redo), healed: healed, lacked: lacked, checked: cfg.checked };
  },
};

/* ── boot ──

   Only from a real address, only in the top document, only once configured and
   signed in, and never before the app has had a chance to paint. Everything
   else about this file is designed so that this doing nothing is the normal,
   healthy case.                                                            */
function boot() {
  if (g.top !== g) return;
  if (!cfg.on || !cfg.cfg || missing(cfg.cfg)) return;
  if (isFile()) return;
  start();
  /* a send left waiting when this device last closed */
  setTimeout(autoFlush, 1500);
}
if (g.Rec && g.Rec.ready) g.Rec.ready(function () { setTimeout(boot, 1200); });
else setTimeout(boot, 2500);

g.Cloud = Cloud;
})(window);
