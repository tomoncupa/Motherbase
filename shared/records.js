/* ══════════════════════ MOTHERBASE · RECORDS ══════════════════════
   The one store. Every app reads and writes through this and nothing else
   touches storage directly.

   THE RULE, from the brief: everything persists as independently addressable
   rows, never as one blob. A blob is how SystemOS died — one big JSON synced
   with last-write-wins, so one device silently ate the other's day.

     { id, user_id, type, date, key, payload, updated_at, deleted }

   • `id` is derived from user+type+date+key, so the same fact written on two
     devices is the same row and a merge is a comparison, not a guess.
   • `updated_at` decides conflicts: the newer write wins, per row. A row that
     has been edited also knows when each field changed, and two versions of
     it merge a field at a time. See FIELD TIMES below.
   • `deleted` is a tombstone. Rows are never removed, or a deletion cannot
     travel anywhere.
   • one row per field per day. Finer is theatre; coarser is a blob.

   Storage is one localStorage entry PER ROW (`mb.r.<id>`) — addressable in
   storage too, not just in the API. Reads are synchronous and instant, which
   is what the logging loop needs.

     <script src="shared/day.js"></script>
     <script src="shared/records.js"></script>
     Rec.declare('block', ['lane','item','routine']);   // what this app owns
*/
(function (g) {
'use strict';

const PREFIX = 'mb.r.';
const USER = 'local';                 /* every row carries it from day one, so accounts change nothing */
const CH = 'motherbase';

/* ── storage adapter: window.storage if the host provides one, else localStorage ── */
const Store = {
  get(k) { return g.storage && g.storage.getItem ? g.storage.getItem(k) : localStorage.getItem(k); },
  set(k, v) { return g.storage && g.storage.setItem ? g.storage.setItem(k, v) : localStorage.setItem(k, v); },
  del(k) { return g.storage && g.storage.removeItem ? g.storage.removeItem(k) : localStorage.removeItem(k); },
  keys() {
    const s = g.storage && g.storage.length != null ? g.storage : localStorage, out = [];
    for (let i = 0; i < s.length; i++) { const k = s.key(i); if (k && k.indexOf(PREFIX) === 0) out.push(k); }
    return out;
  },
};

/* ══════════════ where the rows actually live ══════════════

   localStorage is about 5MB and it is the only storage that can be read
   synchronously. Every app in this suite reads the store on the line after it
   loads it, so that synchronous read is not a detail — it is the API.

   5MB is also not enough. STATUS keeps photographs of labels, ARC keeps pasted
   images on its nodes, and either one fills the whole allowance on its own.
   ARC avoided the problem by keeping its own IndexedDB and staying outside the
   store entirely, which is the exact exception this change exists to remove.

   So: both. The in-memory picture stays the single source of truth and stays
   synchronous. localStorage is the FAST half — written where a row fits, and
   read at boot so the first paint has data with no waiting. IndexedDB is the
   BIG half — written always, read straight after boot, and merged in.

   The merge is what makes that safe rather than clever. Every row carries
   updated_at, merge is idempotent and newer-wins per row, so a late arrival
   from IndexedDB cannot undo anything and cannot double anything. A row too
   big for localStorage is simply absent from the first paint and present a few
   milliseconds later, which is what Rec.ready() is for and why STATUS and
   TRAIN already wait on it.

   Nothing is lost if IndexedDB is unavailable: writes fall back to
   localStorage alone, which is exactly the behaviour before this existed. */
const IDBNAME = 'motherbase', IDBSTORE = 'rows';
const IDB = (() => {
  let dbp = null, dead = false;
  function open() {
    if (dead) return Promise.reject();
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      let q;
      try { q = g.indexedDB.open(IDBNAME, 1); } catch (e) { dead = true; rej(e); return; }
      q.onupgradeneeded = () => {
        const d = q.result;
        if (!d.objectStoreNames.contains(IDBSTORE)) d.createObjectStore(IDBSTORE);
      };
      q.onsuccess = () => res(q.result);
      q.onerror = () => { dead = true; rej(q.error); };
    });
    return dbp;
  }
  return {
    get available() { return !dead && typeof g.indexedDB !== 'undefined'; },
    /* every row, in one pass */
    all() {
      return open().then(d => new Promise((res, rej) => {
        const t = d.transaction(IDBSTORE).objectStore(IDBSTORE).getAll();
        t.onsuccess = () => res(t.result || []);
        t.onerror = () => rej(t.error);
      }));
    },
    /* one transaction for a burst of writes: an import is twelve thousand rows
       and twelve thousand transactions is minutes of work to say one thing */
    put(list, gone) {
      return open().then(d => new Promise((res, rej) => {
        const tx = d.transaction(IDBSTORE, 'readwrite'), st = tx.objectStore(IDBSTORE);
        list.forEach(r => st.put(r, r.id));
        (gone || []).forEach(id => st.delete(id));
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      }));
    },
    wipe() {
      return open().then(d => new Promise((res, rej) => {
        const tx = d.transaction(IDBSTORE, 'readwrite');
        tx.objectStore(IDBSTORE).clear();
        tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      }));
    },
  };
})();

/* Writes are queued and flushed on the next turn, so a burst costs one
   transaction. Nothing waits on the flush: the memory picture is already
   correct and localStorage already has whatever fits. */
const idbQ = Object.create(null), idbGone = Object.create(null);
let idbT = null;
function idbPush(r, deleting) {
  if (!IDB.available) return;
  if (deleting) { delete idbQ[r.id]; idbGone[r.id] = 1; }
  else { delete idbGone[r.id]; idbQ[r.id] = r; }
  if (idbT) return;
  idbT = setTimeout(() => {
    idbT = null;
    const list = Object.keys(idbQ).map(k => idbQ[k]);
    const gone = Object.keys(idbGone);
    Object.keys(idbQ).forEach(k => delete idbQ[k]);
    Object.keys(idbGone).forEach(k => delete idbGone[k]);
    if (!list.length && !gone.length) return;
    IDB.put(list, gone).catch(e => console.warn('[records] indexeddb write failed', e));
  }, 60);
}

const rows = Object.create(null);      /* id -> row, the live picture */
/* type -> {id: 1}, kept in step with `rows` by keep() and drop() below, so a
   read of one type walks that type and not the whole store. Rec.all(type)
   used to visit every row in memory to find one type; the home screen calls
   it hundreds of times a draw, and TRAIN's twelve thousand sets made each
   call a scan of twelve thousand rows. Every write here goes through the two
   helpers, and nothing else touches `rows` directly. */
const byType = Object.create(null);
/* and type -> date -> {id: 1}, because "this type on this day" is the read
   the widgets make most: a week of sets, a day of spends, a day of ticks */
const byDay = Object.create(null);
function unindex(r) {
  if (byType[r.type]) delete byType[r.type][r.id];
  const d = byDay[r.type] && byDay[r.type][r.date || ''];
  if (d) delete d[r.id];
}
function keep(r) {
  const was = rows[r.id];
  if (was && (was.type !== r.type || (was.date || '') !== (r.date || ''))) unindex(was);
  rows[r.id] = r;
  (byType[r.type] || (byType[r.type] = Object.create(null)))[r.id] = 1;
  const days = byDay[r.type] || (byDay[r.type] = Object.create(null));
  (days[r.date || ''] || (days[r.date || ''] = Object.create(null)))[r.id] = 1;
}
function drop(id) {
  const r = rows[id];
  if (!r) return;
  unindex(r);
  delete rows[id];
}
const idsOf = type => byType[type] ? Object.keys(byType[type]) : [];
const idsOn = (type, date) => (byDay[type] && byDay[type][date || '']) ? Object.keys(byDay[type][date || '']) : [];
const owners = Object.create(null);    /* type -> app id, so a bug is a warning not a mystery */
let me = 'app', subs = [], bc = null, booted = false, hydrated = false;

const now = () => new Date().toISOString();
/* A new version of a row is always LATER than the version it replaces.

   Found 2026-09-16, watched: ARC wrote a map row and deleted it inside one
   millisecond, so the live row and its tombstone carried the same updated_at.
   Another page on the origin heard the live row first and wrote it into the
   storage every page shares, then heard the tombstone, saw an equal time and
   kept what it had. The deleted map came back, in both halves, for every page.
   A person cannot save and delete inside a millisecond; code does it all the
   time, and the home screen keeps every app it has opened in a frame, so there
   is nearly always another page listening.

   So a write is stamped at least one millisecond past the row's own previous
   time. One writer's versions of one row are then in order however fast they
   come, and a delete followed by a re-create inside a millisecond keeps the
   re-create too. The clock only moves ahead for that one row, and only by the
   milliseconds that were actually crowded. */
function later(prev) {
  const t = now();
  const p = prev ? Date.parse(prev.updated_at) : NaN;
  return isFinite(p) && p >= Date.parse(t) ? new Date(p + 1).toISOString() : t;
}
const clean = s => String(s == null ? '' : s).replace(/\|/g, '-');
const rowId = (type, date, key) => USER + '|' + clean(type) + '|' + clean(date || '') + '|' + clean(key);
const alive = r => r && !r.deleted;

/* ══════════════ FIELD TIMES ══════════════

   Tom, 2026-09-15, on two devices each changing a different part of the same
   thing before they meet: "go". Until then the newer ROW won whole, so a phone
   that changed a food's protein and a laptop that renamed it kept one of the
   two edits and quietly lost the other.

   So a row that is EDITED after it was made remembers when each top-level
   field last changed: `ft` {field: ms}, and `fb`, the moment the row stood at
   before its first edit, which is the time of every field `ft` does not name.
   Two versions of one row then merge a field at a time, the newer field
   winning, and both edits survive. A row never edited carries neither, so an
   ordinary logged meal costs nothing extra, and two rows with no field times
   still merge whole exactly as they always have.

   Lists join. An `ev` row keeps a day's readings as one list, and two devices
   each adding a weigh-in would otherwise be two edits of one field. Entries
   are matched on their `t`, and an entry taken out leaves `gone` {t: ms}
   behind, so joining two lists cannot bring a deleted reading back. A copy of
   the app from before this leaves no `gone`, so a reading it removed can come
   back once; the next removal on a current copy sticks.

   What stays whole. A deleted row against a live one is the newer row
   winning, as before. `tick` is one cell and one fact. `set` is twelve
   thousand rows the record pass rewrites together, where a time per field
   would cost more storage than two phones editing one set could ever save.

   The Google Sheet needs nothing new: its save tab keeps each row whole, times
   and all, and every merge happens here. */
const WHOLE_ROW = { tick: 1, set: 1 };
const LISTS = { ev: { field: 'e', id: 't' } };
const msOf = iso => Date.parse(iso) || 0;
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
/* JSON with keys in order, so the same content always compares equal */
function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (isObj(v)) return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}
const fieldTime = (r, k) => r.ft ? (r.ft[k] != null ? r.ft[k] : (r.fb || 0)) : msOf(r.updated_at);

/* What a write changed, as field times to put on the row. `was` is the
   payload as last written, from the snapshot, because a caller can have
   mutated the live object in place. null when the row stays whole. */
function stampFields(prev, was, type, payload, at) {
  if (WHOLE_ROW[type] || !prev || prev.deleted || !isObj(was) || !isObj(payload)) return null;
  const t = msOf(at);
  const ft = Object.assign({}, prev.ft || null);
  let moved = false;
  Object.keys(was).concat(Object.keys(payload)).forEach(k => {
    if (canon(was[k]) !== canon(payload[k])) { ft[k] = t; moved = true; }
  });
  if (!moved) return null;
  const out = { ft: ft, fb: prev.ft ? (prev.fb || 0) : msOf(prev.updated_at) };
  const L = LISTS[type];
  let gone = prev.gone ? Object.assign({}, prev.gone) : null;
  if (L && Array.isArray(was[L.field])) {
    const still = {};
    (Array.isArray(payload[L.field]) ? payload[L.field] : []).forEach(x => { if (x && x[L.id] != null) still[x[L.id]] = 1; });
    was[L.field].forEach(x => {
      if (x && x[L.id] != null && !still[x[L.id]]) { gone = gone || {}; gone[x[L.id]] = t; }
    });
  }
  if (gone) out.gone = gone;
  return out;
}

/* Two live versions of one row, a field at a time. null when the whole-row
   rule applies: a deleted side, a type kept whole, no field times on either
   side, or a payload that is not an object. */
function combine(a, b) {
  if (a.deleted || b.deleted || WHOLE_ROW[a.type]) return null;
  if (!a.ft && !b.ft) return null;
  if (!isObj(a.payload) || !isObj(b.payload)) return null;
  const ta = msOf(a.updated_at), tb = msOf(b.updated_at);
  /* A tie is settled by content, so both devices settle it the same way and
     end up holding the same row. */
  const newer = ta !== tb ? (ta > tb ? a : b) : (canon(a.payload) >= canon(b.payload) ? a : b);
  /* The newer field wins. At the same millisecond, a side that edited the field
     beats a side that only carries it from before its first edit; the smoke
     check that makes and edits a row inside one millisecond found this. */
  const named = (r, k) => !!(r.ft && r.ft[k] != null);
  const pick = k => {
    const x = fieldTime(a, k), y = fieldTime(b, k);
    if (x !== y) return x > y ? a : b;
    if (named(a, k) !== named(b, k)) return named(a, k) ? a : b;
    return newer;
  };
  const keys = {};
  [a, b].forEach(r => Object.keys(r.payload).concat(Object.keys(r.ft || {})).forEach(k => { keys[k] = 1; }));
  const payload = {}, ft = {};
  Object.keys(keys).forEach(k => {
    const win = pick(k);
    if (own(win.payload, k)) payload[k] = win.payload[k];
    ft[k] = Math.max(fieldTime(a, k), fieldTime(b, k));
  });
  let gone = null;
  [a, b].forEach(r => {
    if (r.gone) Object.keys(r.gone).forEach(id => { gone = gone || {}; gone[id] = Math.max(gone[id] || 0, r.gone[id]); });
  });
  const L = LISTS[a.type];
  if (L && (Array.isArray(a.payload[L.field]) || Array.isArray(b.payload[L.field]))) {
    const win = pick(L.field), lose = win === a ? b : a, byId = {}, loose = [];
    [lose, win].forEach(r => (Array.isArray(r.payload[L.field]) ? r.payload[L.field] : []).forEach(x => {
      if (x && x[L.id] != null) byId[x[L.id]] = x;
      else if (r === win) loose.push(x);
    }));
    payload[L.field] = Object.keys(byId)
      .filter(id => !(gone && gone[id] != null))
      .map(id => byId[id])
      .sort((x, y) => (x[L.id] > y[L.id] ? 1 : x[L.id] < y[L.id] ? -1 : 0))
      .concat(loose);
  }
  const out = Object.assign({}, newer, {
    payload: payload, ft: ft,
    fb: Math.max(a.ft ? (a.fb || 0) : ta, b.ft ? (b.fb || 0) : tb),
  });
  if (gone) out.gone = gone; else delete out.gone;
  return out;
}
const sameRow = (x, y) =>
  canon([x.payload, x.ft || null, x.fb || 0, x.gone || null, x.updated_at]) ===
  canon([y.payload, y.ft || null, y.fb || 0, y.gone || null, y.updated_at]);

/* Does `r` replace `prev`, when the two are versions of one row kept whole?

   The newer time wins. At the SAME time the answer used to be "keep what you
   have", which makes it depend on arrival order: two pages hearing the same
   two versions in a different order each kept a different one, and whichever
   wrote last put its answer in the shared storage. later() stops one writer
   ever making a tie, but two tabs or two devices really can write one row in
   the same millisecond, so a tie is decided by the rows themselves. A deletion
   beats a live row. Between two live rows, the same content comparison
   combine() settles its ties with. Every page and every device reaches the same
   answer whichever order the rows came in. Used by merge, by the read-back from
   IndexedDB, and by the date repair: every place a stored row can lose. */
function wins(r, prev) {
  if (!prev) return true;
  if (r.updated_at !== prev.updated_at) return r.updated_at > prev.updated_at;
  if (!!r.deleted !== !!prev.deleted) return !!r.deleted;
  if (r.deleted) return false;
  return canon(r.payload) > canon(prev.payload);
}

/* What each row's payload looked like the last time it was written.

   The "identical write is not a write" check used to compare against
   rows[id].payload, which sounds right and is not: get() hands out the stored
   object itself, so the universal read-modify-write —

       const t = TARGETS();      // the live stored object
       t.kcal = 2000;            // mutates the row in place
       S.set('targets', t);      // compares equal to itself

   — mutated the row in memory, compared it against the mutation, found no
   change, and never wrote to storage. Everything worked for the whole session
   and was gone on reopening. That is how a sheet URL and a calorie target both
   quietly refused to save.

   Comparing against a snapshot taken at write time cannot be fooled that way,
   because the snapshot is a string and nothing can reach in and alter it. */
const serial = {};

/* Roughly the largest row worth putting in a 5MB drawer. Past this it lives in
   IndexedDB only and arrives on the second pass — which is invisible unless it
   is the very first thing on screen. */
const LS_MAX = 64 * 1024;

function write(r) {
  keep(r);
  serial[r.id] = JSON.stringify(r.payload);
  idbPush(r, false);
  const j = JSON.stringify(r);
  /* A row too big for the fast half is not an error and must not look like
     one: IndexedDB has it, and this drawer is only ever a head start. */
  if (j.length > LS_MAX) { try { Store.del(PREFIX + r.id); } catch (e) {} return; }
  try { Store.set(PREFIX + r.id, j); }
  catch (e) {
    /* Out of room in the fast half. With IndexedDB behind it that is survivable
       — say so once and carry on rather than telling the app the write failed. */
    if (IDB.available) { try { Store.del(PREFIX + r.id); } catch (e2) {} return; }
    console.warn('[records] storage full', e); Rec.onfull && Rec.onfull(e);
  }
}

/* Callers get their own copy. A store that hands out live internal references
   is one aliasing bug away from losing data, and the payloads here are small
   enough that the clone costs nothing worth measuring. */
const copy = v => (v == null || typeof v !== 'object') ? v : JSON.parse(JSON.stringify(v));
function announce(list, local) {
  subs.forEach(f => { try { f(list); } catch (e) { console.warn('[records]', e); } });
  if (local && bc) { try { bc.postMessage({ mb: 1, rows: list }); } catch (e) {} }
  if (local) poke();
}

/* ── neighbours, when there is no channel ──

   BroadcastChannel reaches every tab and frame on a served origin, and that is
   the whole story on localhost or on hosting. Opened straight from a folder it
   is not: a file:// page can be its own opaque origin, in which case the
   channel is a private line to itself, and the storage event does not reliably
   cross frames either. So a write in STATUS would land, and the home screen
   sitting around it would go on showing the old number until it was reloaded.

   postMessage has never needed the origins to match. A write pokes the frame
   above and any frames below, and each hop passes it on once so a sibling
   hears about it too. Nothing is sent but the poke: the storage underneath is
   shared, so a neighbour re-reads it for itself rather than being handed rows
   by whoever happens to be talking. A page that cannot be trusted with the
   store cannot be trusted to describe it either.

   Debounced, because it has to survive an import. Twelve thousand sets going
   in one Rec.set at a time is twelve thousand announcements, and a reload
   re-parses every row in storage — undebounced that is minutes of work to say
   one thing. The trailing edge says it once, after the burst. */
let pokeT = null, readT = null;
function send(msg, skip) {
  try { if (g.parent && g.parent !== g && g.parent !== skip) g.parent.postMessage(msg, '*'); } catch (e) {}
  try {
    const fr = g.document ? g.document.querySelectorAll('iframe') : [];
    for (let i = 0; i < fr.length; i++) {
      try { const w = fr[i].contentWindow; if (w && w !== skip) w.postMessage(msg, '*'); } catch (e) {}
    }
  } catch (e) {}
}
function poke() {
  if (pokeT) return;
  pokeT = setTimeout(() => { pokeT = null; send({ mb: 1, poke: 1 }); }, 150);
}

/* ── a date is YYYY-MM-DD, and nothing else ──

   `date` is half of every row's id, so anything else in that slot is not a
   badly formatted date — it is a different row. Two ids for one fact is the
   one failure this store exists to prevent.

   It got in through the Google Sheet. A date cell comes back from Apps Script
   as a Date object, `toISOString()` turned it into "2026-08-20T16:00:00.000Z",
   and the pull wrote that in as the date. Same task, same key, second row —
   and because the ISO string sorts AFTER the plain date it belongs to, the
   copy stayed invisible on its own day and then showed up alongside the
   original from the next day on. That is the STATUS journal doubling up
   carried tasks in future dates.

   Both ends are fixed in io.js. This is for the rows already written, and it
   runs at load because there is no other moment that covers every app.

   The timestamp is read back in LOCAL time, not sliced to its first ten
   characters. Apps Script converted the sheet's local midnight to UTC, so
   "2026-08-20T16:00:00.000Z" is the 21st in Manila and slicing it would file
   the row a day early — trading a duplicate for a quietly wrong date, which is
   worse. Where the two rows collide the newer `updated_at` wins, which is the
   same rule a merge already follows. */
const DATE_OK = /^\d{4}-\d{2}-\d{2}$/;
const pad2 = n => String(n).padStart(2, '0');
function localDate(ms) {
  const d = new Date(ms);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function repairDates() {
  const bad = [];
  for (const id in rows) { const r = rows[id]; if (r.date && !DATE_OK.test(r.date)) bad.push(r); }
  if (!bad.length) return 0;
  let fixed = 0;
  bad.forEach(r => {
    const ms = Date.parse(r.date);
    /* unparseable is left exactly where it is — a row nobody can interpret is
       still a row, and guessing at it would lose it for good */
    if (!isFinite(ms)) return;
    const to = rowId(r.type, localDate(ms), r.key);
    drop(r.id); Store.del(PREFIX + r.id); delete serial[r.id];
    const have = rows[to];
    if (have && !wins(r, have)) { fixed++; return; }
    write(Object.assign({}, r, { id: to, date: localDate(ms) }));
    fixed++;
  });
  if (fixed) console.warn('[records] repaired ' + fixed + ' row(s) with a malformed date');
  return fixed;
}

function loadFast() {
  Store.keys().forEach(k => {
    try { const r = JSON.parse(Store.get(k)); if (r && r.id) { keep(r); serial[r.id] = JSON.stringify(r.payload); } }
    catch (e) { console.warn('[records] unreadable row', k); }
  });
}

/* The big half, straight after. Merged rather than assigned, so anything the
   app has already written in the meantime keeps its place by updated_at.

   It does not get to hold the page hostage. An IndexedDB open has been watched
   going unanswered for minutes (root brief, foundation item 1), and an app
   waiting on Rec.ready shows nothing for that long. So after IDBWAIT the
   waiting stops: ready fires on what localStorage had, and the big rows still
   merge in whenever the browser does answer, announced like any other change.
   Writes are unaffected — they queue on the same open and land when it does. */
const IDBWAIT = 2500;
let idbSlow = false;
function hydrate() {
  if (!IDB.available) { hydrated = true; flushReady(); return; }
  let settled = false;
  const slow = setTimeout(() => {
    if (settled) return;
    idbSlow = true;
    console.warn('[records] indexeddb has not answered in ' + IDBWAIT + 'ms; carrying on with localStorage, and big rows will merge in when it does');
    hydrated = true; flushReady();
  }, IDBWAIT);
  IDB.all().then(list => {
    settled = true; clearTimeout(slow); idbSlow = false;
    let changed = 0;
    (list || []).forEach(r => {
      if (!r || !r.id) return;
      const prev = rows[r.id];
      if (!wins(r, prev)) return;
      keep(r); serial[r.id] = JSON.stringify(r.payload); changed++;
    });
    if (changed) { repairDates(); announce([], false); }
    hydrated = true; flushReady();
  }).catch(e => {
    settled = true; clearTimeout(slow); idbSlow = false;
    console.warn('[records] indexeddb unavailable, localStorage only', e);
    hydrated = true; flushReady();
  });
}

let readyQ = [];
function flushReady() { const q = readyQ; readyQ = []; q.forEach(f => { try { f(); } catch (e) { console.warn('[records]', e); } }); }

function load() {
  loadFast();
  repairDates();
  booted = true;
  hydrate();
}

const Rec = {
  USER: USER,

  /** an app says who it is and which types it owns. Writing someone else's
      type still works — it warns, because one writer per fact is a discipline
      not a lock, and `tick` is deliberately shared by everyone. */
  declare(appId, types) {
    me = appId || 'app';
    (types || []).forEach(t => { owners[t] = appId; });
    return Rec;
  },
  owner: t => owners[t] || null,
  shared: { tick: 1 },      /* the one type every app may write: one cell, one day, one fact */

  /** Fires once every row is in memory, IndexedDB included. An app that draws
      from the store on load should use this rather than running immediately,
      or a row too big for localStorage will be missing from its first paint. */
  ready(fn) {
    if (hydrated) { setTimeout(fn, 0); return; }
    readyQ.push(fn);
  },
  get hydrated() { return hydrated; },
  on(f) { subs.push(f); return () => { const i = subs.indexOf(f); if (i > -1) subs.splice(i, 1); }; },

  /* ── writing ── */
  set(type, date, key, payload) {
    if (owners[type] && owners[type] !== me && !Rec.shared[type])
      console.warn('[records] ' + me + ' is writing ' + type + ', which ' + owners[type] + ' owns');
    const id = rowId(type, date, key), prev = rows[id];
    const r = {
      id: id, user_id: USER, type: type, date: date || null, key: String(key),
      payload: payload, updated_at: later(prev), deleted: false,
      by: me,
    };
    /* an identical write is not a write — this is what keeps updated_at honest
       and stops a repaint loop from touching every row it renders */
    if (prev && !prev.deleted && serial[id] === JSON.stringify(payload)) return prev;
    /* an edit remembers which fields it changed, and when */
    let was = null;
    try { was = serial[id] != null ? JSON.parse(serial[id]) : null; } catch (e) {}
    const times = stampFields(prev, was, type, payload, r.updated_at);
    if (times) Object.assign(r, times);
    write(r); announce([r], true);
    return r;
  },
  del(type, date, key) {
    const id = rowId(type, date, key), prev = rows[id];
    if (!prev || prev.deleted) return null;
    const r = Object.assign({}, prev, { payload: null, deleted: true, updated_at: later(prev), by: me });
    write(r); announce([r], true);
    return r;
  },
  /** Change some fields of a row and keep every other one.

      Rec.set replaces the whole payload, which is how STATUS once dropped the
      calcium PORTION had written: it rebuilt the row from the fields it knew.
      This reads the row, changes only what it is given, and writes it back.

      `changes` is {field: value}. A dotted name reaches into a nested object,
      so {'base.ca': 120} changes the calcium and leaves the rest of `base`.
      A value of undefined removes the field. A row that does not exist yet is
      made from the changes. Changing nothing writes nothing. */
  patch(type, date, key, changes) {
    const was = Rec.get(type, date, key);
    const cur = (was && typeof was === 'object' && !Array.isArray(was)) ? was : {};
    Object.keys(changes || {}).forEach(path => {
      const bits = path.split('.');
      let o = cur;
      for (let i = 0; i < bits.length - 1; i++) {
        const v = o[bits[i]];
        if (!v || typeof v !== 'object' || Array.isArray(v)) o[bits[i]] = {};
        o = o[bits[i]];
      }
      const last = bits[bits.length - 1];
      if (changes[path] === undefined) delete o[last]; else o[last] = changes[path];
    });
    return Rec.set(type, date, key, cur);
  },
  /** the app that declared itself on this page, for anything writing on its behalf */
  get appId() { return me; },
  /** names the brief uses */
  recSet(type, date, key, payload) { return Rec.set(type, date, key, payload); },
  recDel(type, date, key) { return Rec.del(type, date, key); },

  /* ── reading ── */
  get(type, date, key) { const r = rows[rowId(type, date, key)]; return alive(r) ? copy(r.payload) : null; },
  /** the id a row with this type, date and key has, or would have. For an
      app merging rows it built itself with their own updated_at, so a
      second import of the same file is a comparison rather than a rewrite. */
  idOf(type, date, key) { return rowId(type, date, key); },
  has(type, date, key) { return alive(rows[rowId(type, date, key)]); },
  row(type, date, key) { const r = rows[rowId(type, date, key)]; return alive(r) ? r : null; },
  /** the tombstone of a row that was deleted, or null when it is alive or was
      never there. The mirror asks, so a line the sheet still carries for a
      row this device deleted is not mistaken for something new. */
  tombstone(type, date, key) { const r = rows[rowId(type, date, key)]; return r && r.deleted ? r : null; },
  /** every tombstone of a type, or only the ones written after `since` */
  tombstones(type, since) {
    const out = [], ids = idsOf(type);
    for (let i = 0; i < ids.length; i++) {
      const r = rows[ids[i]];
      if (!r.deleted) continue;
      if (since && !(r.updated_at > since)) continue;
      out.push(r);
    }
    return out;
  },

  /** every live row of a type, optionally narrowed by date or a date window */
  all(type, opt) {
    opt = opt || {};
    const out = [], ids = opt.date != null ? idsOn(type, opt.date) : idsOf(type);
    for (let i = 0; i < ids.length; i++) {
      const r = rows[ids[i]];
      if (!alive(r)) continue;
      if (opt.date != null && r.date !== opt.date) continue;
      if (opt.from && (!r.date || r.date < opt.from)) continue;
      if (opt.to && (!r.date || r.date > opt.to)) continue;
      out.push(r);
    }
    return out.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.key.localeCompare(b.key));
  },
  /** key → payload, for definition-shaped types (settings, activities, habits) */
  map(type, date) {
    const out = Object.create(null);
    Rec.all(type, { date: date }).forEach(r => out[r.key] = r.payload);
    return out;
  },
  keys(type, date) { return Rec.all(type, { date: date }).map(r => r.key); },
  count(type, date) { return Rec.all(type, { date: date }).length; },

  /* ── settings: one type, namespaced per app, so nobody clobbers anybody ── */
  setting(app, key, val) {
    const k = app + '.' + key;
    /* Rec.get already copies, so a caller can mutate what it gets back and
       write it again without the change being mistaken for no change. */
    if (val === undefined) { const v = Rec.get('setting', null, k); return v == null ? null : v.v; }
    return Rec.set('setting', null, k, { v: val });
  },

  /* ── merging: the whole point of rows ── */
  /** idempotent by construction: same rows in twice changes nothing the second
      time, because the comparison is on the times, not on arrival */
  merge(incoming) {
    const changed = [];
    (incoming || []).forEach(r => {
      if (!r || !r.id || !r.type) return;
      const prev = rows[r.id];
      /* two live versions with field times: a field at a time (FIELD TIMES) */
      const both = prev ? combine(prev, r) : null;
      if (both) {
        /* A row that is neither side's, but both joined, is new to both
           devices. It takes the time now, so it is sent on and the other
           device and the sheet get the joined version, not just half. */
        const joined = canon(both.payload);
        if (joined !== canon(prev.payload) && joined !== canon(r.payload)) {
          const t = now();
          if (t > both.updated_at) both.updated_at = t;
        }
        if (sameRow(both, prev)) return;
        write(both); changed.push(both);
        return;
      }
      if (!wins(r, prev)) return;
      write(r); changed.push(r);
    });
    if (changed.length) announce(changed, false);
    return changed.length;
  },
  /** rows for backup. `types` narrows it to one app's own data. */
  export(types) {
    const want = types && types.length ? types : Object.keys(byType);
    const out = [];
    want.forEach(type => idsOf(type).forEach(id => out.push(rows[id])));
    return out.sort((a, b) => a.id.localeCompare(b.id));
  },
  /** Is anything of these types written after `stamp`?

      The mirror's one question — "is this device still holding work the sheet
      has not got" — answered off the rows themselves. It used to be answered
      off a flag in memory, and a phone loses memory: the tab is frozen the
      moment it goes in a pocket and discarded soon after, so the flag went and
      the work stayed. The store already knows, and asking it cannot be lost.

      `export` would answer it too and costs a copy of every row and a sort to
      do it, which is not a thing to run every forty five seconds on a phone
      with twelve thousand sets on it. This allocates nothing and stops at the
      first row that qualifies, so the interesting answer is the fast one. */
  newerThan(types, stamp, keyPrefix) {
    if (!stamp) return true;
    const want = types && types.length ? types : Object.keys(byType);
    for (let t = 0; t < want.length; t++) {
      const ids = idsOf(want[t]);
      for (let i = 0; i < ids.length; i++) {
        const r = rows[ids[i]];
        if (keyPrefix && String(r.key).indexOf(keyPrefix) !== 0) continue;
        if (r.updated_at > stamp) return true;
      }
    }
    return false;
  },
  types() {
    const t = Object.create(null);
    Object.keys(byType).forEach(type => {
      const n = idsOf(type).filter(id => alive(rows[id])).length;
      if (n) t[type] = n;
    });
    return t;
  },
  stats() {
    let live = 0, dead = 0, bytes = 0, big = 0;
    for (const id in rows) {
      alive(rows[id]) ? live++ : dead++;
      const j = JSON.stringify(rows[id]).length;
      bytes += j;
      if (j > LS_MAX) big++;
    }
    return {
      live: live, tombstones: dead, kb: Math.round(bytes / 102.4) / 10, types: Rec.types(),
      /* how many rows are too big for the fast half, and whether the big half
         is actually there to hold them */
      big: big, idb: IDB.available, hydrated: hydrated,
      /* true while ready has fired without the big half, because it was slow */
      idbSlow: idbSlow,
    };
  },
  /** re-read everything from storage. Frames on file:// share the storage but not
      always the change events, so a sibling can ask us to look again. */
  reload() {
    const before = JSON.stringify(Object.keys(rows).map(k => rows[k].updated_at));
    /* A row too big for the fast half lives only in IndexedDB, and a write
       there waits 60ms for company. Dropping the picture inside that window
       and re-reading IndexedDB before the put has landed loses the row until
       the next page load, so what is queued goes first. The put is started
       before the read on the same connection, and the browser keeps them in
       that order. */
    Rec.flush();
    Object.keys(rows).forEach(drop);
    loadFast();
    repairDates();
    /* The fast half alone is not the store any more, so a reload that stopped
       there would drop every row too big for it until the next page load.
       Re-reading IndexedDB is a merge, so it costs nothing when nothing moved. */
    hydrate();
    if (JSON.stringify(Object.keys(rows).map(k => rows[k].updated_at)) !== before) announce([], false);
    return Rec;
  },
  /** really remove rows of a type before a date — no tombstone, no trace.
      Only safe while everything is local; a tombstone is required once it syncs. */
  purge(type, beforeDate) {
    let n = 0;
    for (const id in rows) {
      const r = rows[id];
      if (r.type !== type || !r.date || r.date >= beforeDate) continue;
      drop(id); Store.del(PREFIX + id); idbPush(r, true); n++;
    }
    return n;
  },
  /** drop tombstones older than n days — safe only while nothing syncs */
  vacuum(days) {
    const cut = new Date(Date.now() - (days || 400) * 86400000).toISOString();
    let n = 0;
    for (const id in rows) {
      const r = rows[id];
      if (r.deleted && r.updated_at < cut) { drop(id); Store.del(PREFIX + id); idbPush(r, true); n++; }
    }
    return n;
  },
  /** wipe — everything, or just one app's types */
  clear(types) {
    let n = 0;
    const wipeAll = !types;
    for (const id in rows) {
      const r = rows[id];
      if (types && types.indexOf(r.type) === -1) continue;
      drop(id); Store.del(PREFIX + id);
      if (!wipeAll) idbPush(r, true);
      n++;
    }
    /* Wiping everything is one transaction rather than a queue of thousands of
       individual deletes. */
    if (wipeAll && IDB.available) IDB.wipe().catch(e => console.warn('[records] indexeddb wipe failed', e));
    announce([], true);
    return n;
  },
  /** Push the queued IndexedDB writes immediately instead of on the next turn.
      For `beforeunload`, where the 60ms debounce would never fire. The write is
      still asynchronous — a browser is not obliged to finish it — but starting
      the transaction before the page goes is the most that can be done, and
      everything written more than a moment ago is already safely down. */
  flush() {
    if (idbT) { clearTimeout(idbT); idbT = null; }
    const list = Object.keys(idbQ).map(k => idbQ[k]);
    const gone = Object.keys(idbGone);
    Object.keys(idbQ).forEach(k => delete idbQ[k]);
    Object.keys(idbGone).forEach(k => delete idbGone[k]);
    if (!list.length && !gone.length) return 0;
    IDB.put(list, gone).catch(e => console.warn('[records] flush failed', e));
    return list.length + gone.length;
  },

  /** normalise any row whose date is not YYYY-MM-DD. Runs at load; exposed so
      a restore or a sheet pull can run it again over what it just brought in. */
  repairDates() { const k = repairDates(); if (k) announce([], true); return k; },
  _rows: rows,
};

/* other tabs and frames on this origin are the same store — one channel, and
   an incoming row is merged, never blindly trusted */
try {
  bc = new BroadcastChannel(CH);
  bc.onmessage = e => { const m = e.data; if (m && m.mb === 1 && m.rows) Rec.merge(m.rows); };
} catch (e) {}
/* a second window that predates BroadcastChannel support still syncs on write */
g.addEventListener('storage', e => {
  if (!e.key || e.key.indexOf(PREFIX) !== 0) return;
  try { const r = JSON.parse(e.newValue); if (r && r.id) Rec.merge([r]); } catch (err) {}
});
/* a poke from a neighbour: look at storage again, then pass it on once. The
   relay flag is what stops two frames poking each other forever. */
g.addEventListener('message', e => {
  const m = e.data;
  if (!m || m.mb !== 1 || !m.poke) return;
  if (!readT) readT = setTimeout(() => { readT = null; Rec.reload(); }, 60);
  if (!m.relay) send({ mb: 1, poke: 1, relay: 1 }, e.source);
});

load();
g.Rec = g.Records = Rec;
})(window);
