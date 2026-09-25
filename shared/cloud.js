/* shared/cloud.js — 0.1.6 —Firebase as a SECOND sync, beside the Google Sheet.

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
var cfg = { cfg: null, on: 0, uid: '', email: '', at: '', sentAt: '', gotAt: '', lost: '', pushed: '', seen: '' };
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
function csave() { try { localStorage.setItem(CKEY, JSON.stringify(cfg)); } catch (e) {} }
cread();

/* Another frame pasted the config or signed in. Same reason the mirror does
   this: an app opened before the paste would otherwise answer "not set up" for
   the rest of the session. */
g.addEventListener('storage', function (e) {
  if (e.key !== CKEY) return;
  cread(); say();
  /* Signed in from an app in a frame: only this top document may connect, so
     it has to notice and start, or nothing syncs until the next reload. */
  if (cfg.on && !started) boot();
});

/* ── the state every caller can read, and nobody outside can set ── */
var fb = null, db = null, auth = null, ref = null, query = null;
var uid = '', loading = null, started = false, pushing = false, pushAgain = false;
var last = { ok: 0, why: '', at: '', sent: 0, got: 0, skipped: 0 };
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
function say() { listeners.forEach(function (f) { try { f(Cloud.state()); } catch (e) {} }); }
function note(why, ok) {
  last.why = why || ''; last.ok = ok ? 1 : 0;
  say();
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
    return me.db.ref(SHELF).once('value');
  }).then(function (snap) {
    var out = [];
    snap.forEach(function (c) {
      var v = c.val() || {}, body = null;
      try { body = JSON.parse(v.data || 'null'); } catch (e) {}
      out.push({ from: c.key, kind: v.kind || '', at: v.at || '', by: v.by || '', n: v.n || 0, body: body });
    });
    out.sort(function (a, b) { return a.at < b.at ? 1 : a.at > b.at ? -1 : 0; });
    return out;
  }).catch(function (e) {
    var m = (e && e.message) || 'the shelf could not be read';
    if (/permission/i.test(m)) m = 'the database refused the read. Only the coach account can read the shelf';
    throw new Error(m);
  });
}

function clear(from) {
  return account().then(function (me) { return me.db.ref(SHELF + '/' + from).remove(); });
}

/* ── incoming ──

   One query, ordered by `updated_at` and starting at the last one we merged.
   `updated_at` is an ISO string, which sorts lexicographically, so this is an
   ordinary range query and needs only the one index.

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
  var n = 0;
  try { n = g.Rec ? g.Rec.merge([v]) : 0; } catch (e) { return; }
  if (v.updated_at && v.updated_at > (cfg.seen || '') && v.updated_at <= soon()) { cfg.seen = v.updated_at; csave(); }
  if (n) { last.got += n; landed('got'); }
}

function start() {
  if (!cfg.on || !cfg.cfg || started) return Promise.resolve(false);
  if (g.top !== g) return Promise.resolve(false);   /* one connection per document */
  if (missing(cfg.cfg)) return Promise.resolve(false);
  return loadSDK().then(function () {
    auth = g.firebase.auth(app());
    /* The signed-in account is the source of truth for the uid, not the one we
       wrote down: a token can expire and a stored uid would then address a
       path nothing can read. */
    return new Promise(function (res) {
      var off = auth.onAuthStateChanged(function (u) { off(); res(u); });
    });
  }).then(function (u) {
    if (!u) { signedOut(); return false; }
    uid = u.uid;
    cfg.uid = uid; cfg.email = u.email || ''; cfg.lost = ''; cfg.kept = keptIn(); csave();
    db  = g.firebase.database(app());
    ref = db.ref('u/' + uid + '/rows');
    query = cfg.seen ? ref.orderByChild('updated_at').startAt(cfg.seen)
                     : ref.orderByChild('updated_at');
    broken = false;
    query.on('child_added', onRow, onErr);
    query.on('child_changed', onRow, onErr);
    /* Firebase's own answer to "can the database hear this device". */
    connRef = db.ref('.info/connected');
    connRef.on('value', onConn);
    started = true;
    watch();
    wire();
    note('', 1);
    /* Anything written while this device was away goes up now. */
    return push('open').then(function () { return true; });
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

function onConn(s) { conn = !!(s && s.val()); say(); }

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
  try { if (query) { query.off('child_added', onRow); query.off('child_changed', onRow); } } catch (e) {}
  try { if (connRef) connRef.off('value', onConn); } catch (e) {}
  query = null; ref = null; db = null; connRef = null; started = false; uid = ''; conn = false; broken = false;
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
function plan(rows, since, base) {
  var patch = {}, edge = since || '', sent = 0, skipped = 0, lim = soon();
  rows.forEach(function (r) {
    if (!r || !r.id) return;
    /* Stamped in the future: not sent, and the boundary does not follow it. */
    if (r.updated_at > lim) { skipped++; return; }
    if (r.updated_at > edge) edge = r.updated_at;
    var j;
    try { j = JSON.stringify(r); } catch (e) { skipped++; return; }
    if (j.length > BIG) { skipped++; return; }
    patch[base + enc(r.id)] = r;
    sent++;
  });
  return { patch: patch, edge: edge, sent: sent, skipped: skipped };
}

function push(why) {
  if (!started || !db || !uid) return Promise.resolve(0);
  if (pushing) { pushAgain = true; return Promise.resolve(0); }
  var R = g.Rec;
  if (!R) return Promise.resolve(0);
  /* Cheap gate first: asking "is there anything at all" allocates nothing and
     stops at the first row that qualifies, where building the list copies and
     sorts every row on the device. */
  var since = cfg.pushed || '';
  if (since && !R.newerThan(null, since)) return Promise.resolve(0);

  var all;
  try { all = R.export(); } catch (e) { return Promise.resolve(0); }
  var todo = [];
  for (var i = 0; i < all.length; i++) if (all[i].updated_at > since) todo.push(all[i]);
  if (!todo.length) return Promise.resolve(0);
  todo.sort(function (a, b) { return a.updated_at < b.updated_at ? -1 : a.updated_at > b.updated_at ? 1 : 0; });

  pushing = true;
  var sent = 0, skipped = 0, at = 0, edge = since;

  function chunk() {
    if (at >= todo.length) return Promise.resolve();
    /* From the edge so far, not from `since`: a last chunk holding only
       future-dated rows would otherwise put the boundary back to the start. */
    var p = plan(todo.slice(at, at + CHUNK), edge, 'u/' + uid + '/rows/');
    at += CHUNK;
    skipped += p.skipped;
    var step = p.sent ? db.ref().update(p.patch) : Promise.resolve();
    return step.then(function () {
      sent += p.sent;
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
    var m = e && e.message ? e.message : 'the push did not land';
    if (/permission/i.test(m)) m = 'the database refused the write. Check the rules from the setup note';
    note(m, 0);
    /* -1, not 0: "nothing to send" and "the send failed" were the same answer
       until 0.1.4, so Sync now said Sent after a refused write. */
    return -1;
  });
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

/* True once the database says it can hear us, false after `ms` without that.
   Only Sync now waits on it; the connection event lands a moment after start. */
function waitConn(ms) {
  if (conn) return Promise.resolve(true);
  return new Promise(function (res) {
    var t0 = Date.now();
    (function tick() {
      if (conn) return res(true);
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
  VERSION: '0.1.4',

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
      email: cfg.email || '',
      at: cfg.at || '',
      sentAt: cfg.sentAt || '',
      gotAt: cfg.gotAt || '',
      why: last.why || '',
      ok: !!last.ok,
      sent: last.sent, got: last.got, skipped: last.skipped,
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
  /** put one parcel on the coach's shelf. Resolves with its size in characters. */
  send: put,
  /** everything on the shelf, newest first. Coach account only. */
  waiting: shelf,
  /** that one is in. Clear it. */
  took: clear,
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
      return waitConn(4000);
    }).then(function (ok) {
      /* Firebase holds an offline write until the connection is back, so
         waiting on it would leave the button spinning for as long as that
         takes. The rows are safe here and go up by themselves. */
      if (!ok) throw new Error('this device is offline. Everything is saved here and goes up when the connection is back');
      return push('manual');
    }).then(function (n) {
      if (n < 0) throw new Error(last.why || 'the send did not land');
      return n;
    });
  },

  /* exposed for the smoke checks, which have no database to talk to */
  _enc: enc, _dec: dec, _parse: parseCfg, _missing: missing, _plan: plan, _big: BIG,
  _cfg: function () { return cfg; },
  /* `f` returns `{uid, email, db}` as account() would, or throws; null puts
     the real one back. Only the shelf reads it: the row sync never does. */
  _probe: function (f) { probe = f || null; },
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
}
if (g.Rec && g.Rec.ready) g.Rec.ready(function () { setTimeout(boot, 1200); });
else setTimeout(boot, 2500);

g.Cloud = Cloud;
})(window);
