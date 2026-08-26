/* ══════════════════════ MOTHERBASE · RECORDS ══════════════════════
   The one store. Every app reads and writes through this and nothing else
   touches storage directly.

   THE RULE, from the brief: everything persists as independently addressable
   rows, never as one blob. A blob is how SystemOS died — one big JSON synced
   with last-write-wins, so one device silently ate the other's day.

     { id, user_id, type, date, key, payload, updated_at, deleted }

   • `id` is derived from user+type+date+key, so the same fact written on two
     devices is the same row and a merge is a comparison, not a guess.
   • `updated_at` decides conflicts: the newer write wins, per row.
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

const rows = Object.create(null);      /* id -> row, the live picture */
const owners = Object.create(null);    /* type -> app id, so a bug is a warning not a mystery */
let me = 'app', subs = [], bc = null, booted = false;

const now = () => new Date().toISOString();
const clean = s => String(s == null ? '' : s).replace(/\|/g, '-');
const rowId = (type, date, key) => USER + '|' + clean(type) + '|' + clean(date || '') + '|' + clean(key);
const alive = r => r && !r.deleted;

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

function write(r) {
  rows[r.id] = r;
  serial[r.id] = JSON.stringify(r.payload);
  try { Store.set(PREFIX + r.id, JSON.stringify(r)); }
  catch (e) { console.warn('[records] storage full', e); Rec.onfull && Rec.onfull(e); }
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
    delete rows[r.id]; Store.del(PREFIX + r.id); delete serial[r.id];
    const have = rows[to];
    if (have && have.updated_at >= r.updated_at) { fixed++; return; }
    write(Object.assign({}, r, { id: to, date: localDate(ms) }));
    fixed++;
  });
  if (fixed) console.warn('[records] repaired ' + fixed + ' row(s) with a malformed date');
  return fixed;
}

function load() {
  Store.keys().forEach(k => {
    try { const r = JSON.parse(Store.get(k)); if (r && r.id) { rows[r.id] = r; serial[r.id] = JSON.stringify(r.payload); } }
    catch (e) { console.warn('[records] unreadable row', k); }
  });
  repairDates();
  booted = true;
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

  ready(fn) { booted ? fn() : setTimeout(() => fn(), 0); },
  on(f) { subs.push(f); return () => { const i = subs.indexOf(f); if (i > -1) subs.splice(i, 1); }; },

  /* ── writing ── */
  set(type, date, key, payload) {
    if (owners[type] && owners[type] !== me && !Rec.shared[type])
      console.warn('[records] ' + me + ' is writing ' + type + ', which ' + owners[type] + ' owns');
    const id = rowId(type, date, key), prev = rows[id];
    const r = {
      id: id, user_id: USER, type: type, date: date || null, key: String(key),
      payload: payload, updated_at: now(), deleted: false,
      by: me,
    };
    /* an identical write is not a write — this is what keeps updated_at honest
       and stops a repaint loop from touching every row it renders */
    if (prev && !prev.deleted && serial[id] === JSON.stringify(payload)) return prev;
    write(r); announce([r], true);
    return r;
  },
  del(type, date, key) {
    const id = rowId(type, date, key), prev = rows[id];
    if (!prev || prev.deleted) return null;
    const r = Object.assign({}, prev, { payload: null, deleted: true, updated_at: now(), by: me });
    write(r); announce([r], true);
    return r;
  },
  /** names the brief uses */
  recSet(type, date, key, payload) { return Rec.set(type, date, key, payload); },
  recDel(type, date, key) { return Rec.del(type, date, key); },

  /* ── reading ── */
  get(type, date, key) { const r = rows[rowId(type, date, key)]; return alive(r) ? copy(r.payload) : null; },
  has(type, date, key) { return alive(rows[rowId(type, date, key)]); },
  row(type, date, key) { const r = rows[rowId(type, date, key)]; return alive(r) ? r : null; },

  /** every live row of a type, optionally narrowed by date or a date window */
  all(type, opt) {
    opt = opt || {};
    const out = [];
    for (const id in rows) {
      const r = rows[id];
      if (!alive(r) || r.type !== type) continue;
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
      time, because the comparison is on updated_at, not on arrival */
  merge(incoming) {
    const changed = [];
    (incoming || []).forEach(r => {
      if (!r || !r.id || !r.type) return;
      const prev = rows[r.id];
      if (prev && prev.updated_at >= r.updated_at) return;
      write(r); changed.push(r);
    });
    if (changed.length) announce(changed, false);
    return changed.length;
  },
  /** rows for backup. `types` narrows it to one app's own data. */
  export(types) {
    const want = types && types.length ? types : null;
    const out = [];
    for (const id in rows) { const r = rows[id]; if (!want || want.indexOf(r.type) > -1) out.push(r); }
    return out.sort((a, b) => a.id.localeCompare(b.id));
  },
  types() {
    const t = Object.create(null);
    for (const id in rows) { const r = rows[id]; if (alive(r)) t[r.type] = (t[r.type] || 0) + 1; }
    return t;
  },
  stats() {
    let live = 0, dead = 0, bytes = 0;
    for (const id in rows) { alive(rows[id]) ? live++ : dead++; bytes += JSON.stringify(rows[id]).length; }
    return { live: live, tombstones: dead, kb: Math.round(bytes / 102.4) / 10, types: Rec.types() };
  },
  /** re-read everything from storage. Frames on file:// share the storage but not
      always the change events, so a sibling can ask us to look again. */
  reload() {
    const before = JSON.stringify(Object.keys(rows).map(k => rows[k].updated_at));
    Object.keys(rows).forEach(k => delete rows[k]);
    load();
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
      delete rows[id]; Store.del(PREFIX + id); n++;
    }
    return n;
  },
  /** drop tombstones older than n days — safe only while nothing syncs */
  vacuum(days) {
    const cut = new Date(Date.now() - (days || 400) * 86400000).toISOString();
    let n = 0;
    for (const id in rows) {
      const r = rows[id];
      if (r.deleted && r.updated_at < cut) { delete rows[id]; Store.del(PREFIX + id); n++; }
    }
    return n;
  },
  /** wipe — everything, or just one app's types */
  clear(types) {
    let n = 0;
    for (const id in rows) {
      const r = rows[id];
      if (types && types.indexOf(r.type) === -1) continue;
      delete rows[id]; Store.del(PREFIX + id); n++;
    }
    announce([], true);
    return n;
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
