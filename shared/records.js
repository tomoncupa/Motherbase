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

function write(r) {
  rows[r.id] = r;
  try { Store.set(PREFIX + r.id, JSON.stringify(r)); }
  catch (e) { console.warn('[records] storage full', e); Rec.onfull && Rec.onfull(e); }
}
function announce(list, local) {
  subs.forEach(f => { try { f(list); } catch (e) { console.warn('[records]', e); } });
  if (local && bc) { try { bc.postMessage({ mb: 1, rows: list }); } catch (e) {} }
}

function load() {
  Store.keys().forEach(k => {
    try { const r = JSON.parse(Store.get(k)); if (r && r.id) rows[r.id] = r; }
    catch (e) { console.warn('[records] unreadable row', k); }
  });
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
    if (prev && !prev.deleted && JSON.stringify(prev.payload) === JSON.stringify(payload)) return prev;
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
  get(type, date, key) { const r = rows[rowId(type, date, key)]; return alive(r) ? r.payload : null; },
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

load();
g.Rec = g.Records = Rec;
})(window);
