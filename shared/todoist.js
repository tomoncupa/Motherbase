/* ══════════════ TODOIST SYNC ══════════════
   quest/CLAUDE.md, "Todoist sync". Tom, 2026-10-29: his Todoist tasks come in
   as todos, and a tick, a new date or a delete made in the suite (QUESTS,
   STATUS, LOG or the home screen, which all tick the same row) goes back.
   Todos typed in the suite stay in it. One call to Todoist's sync endpoint
   reads every open task, project and section.

   Moved out of QUESTS on 2026-11-16. It ran only while QUESTS was open, and
   no signed-in device had opened QUESTS since 11-10, so six tasks deleted in
   Todoist on 11-12 stayed open in STATUS for four days. STATUS is always open
   (the desktop widget, the iPhone app), so it runs this too. `mb-todoist` in
   navigator.locks keeps one runner per browser.

   The row is keyed `td-<todoist id>` and dated the day Todoist says it was
   added, so every device makes the same row. `td` on it is what Todoist said
   last time: a field that differs from `td` was changed here, a Todoist
   field that differs from `td` was changed there, and nothing is lost that
   QUESTS cannot show yet (section, description, parent).

   The key is the setting `todoist.key`, not `quest.*`: the sheet takes every
   `quest.*` setting (shared/io.js), and a key does not belong on a sheet. It
   rides live sync, so pasting it once reaches every signed-in device.

   TodoistSync.start({ app, draw }) runs it on Rec.ready, on coming back to
   the page, every five minutes, and 8 s after a write to a `td-` row. `app`
   names who publishes the day's notes; `draw` redraws after a run. */
(function (g) {
  'use strict';
  if (g.TodoistSync) return;
  const API = 'https://api.todoist.com/api/v1/';
  const KEY_RE = /^td-([A-Za-z0-9]+)$/;
  const FIELDS = ['text', 'pri', 'proj', 'tags', 'due', 'at'];
  const RES = JSON.stringify(['items', 'projects', 'sections']);
  /* Tasks asked about one by one in a run, the ones that left the open list.
     Rows already settled here never count against it. */
  const ASK = 20;
  const pad = n => String(n).padStart(2, '0');
  const slug = s => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  const T = () => Day.today();
  const key = () => String(Rec.setting('todoist', 'key') || '').trim();
  const st = { busy: false, at: 0, n: 0, err: '', quiet: false };
  const opt = { app: 'quest', draw: null };
  let last = 0, soonT = null, uid = 0;
  /* Same CONTENT, whatever order the keys came in and whether an empty list,
     empty object or null was kept at all. Live sync's database hands a row
     back with its keys sorted and its empty lists and nulls gone (root brief,
     Known traps), so a whole-payload JSON.stringify never matched a row that
     had been through it once. From 2026-11-16 05:34 every pass, in every
     STATUS, rewrote all 461 Todoist rows; each write redrew every open app and
     went round live sync to the other STATUS, which wrote them all again. The
     desktop programs' page sat at a full core and 5 GB, and IndexedDB stopped
     answering anything else on that store. */
  const canon = x => {
    if (x == null) return null;
    if (Array.isArray(x)) return x.length ? x.map(canon) : null;
    if (typeof x === 'object') {
      const o = {};
      Object.keys(x).sort().forEach(k => { const v = canon(x[k]); if (v !== null) o[k] = v; });
      return Object.keys(o).length ? o : null;
    }
    return x;
  };
  const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
  const localYmd = t => t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
  const say = () => { const b = document.getElementById('td-state'); if (b) b.textContent = line(); };

  /* A Todoist project becomes a QUESTS project of the same name. */
  function ensureProject(k, name) {
    if (!k || Rec.get('project', null, k)) return;
    const n = Object.keys(Rec.map('project')).length;
    Rec.set('project', null, k, { name: name || k, slot: (n % 6) + 1, ord: n });
  }

  function call(path, body) {
    const o = { method: body ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + key() } };
    if (body) {
      o.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      o.body = new URLSearchParams(body).toString();
    }
    return fetch(API + path, o).then(r => {
      if (r.status === 401 || r.status === 403) throw new Error('key');
      if (r.status === 404) return null;
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    });
  }
  const read = () => call('sync', { sync_token: '*', resource_types: RES });

  /* Todoist's due: a date, a floating date and time, or a fixed one ending
     in Z. `raw` is kept as sent, for the recurring check in push. */
  function dueParts(d) {
    if (!d || !d.date) return { due: '', at: null, raw: '', rec: '' };
    const s = String(d.date);
    let due = s.slice(0, 10), at = null;
    if (s.length > 10) {
      if (/(Z|[+-]\d\d:?\d\d)$/.test(s)) { const t = new Date(s); due = localYmd(t); at = pad(t.getHours()) + ':' + pad(t.getMinutes()); }
      else at = s.slice(11, 16);
    }
    return { due: due, at: at, raw: s, rec: d.is_recurring ? String(d.string || '') : '' };
  }

  /* What a Todoist task says, in QUESTS's fields, and the `td` to keep.
     Todoist numbers priority backwards: 4 is p1. Its Inbox is QUESTS's Inbox,
     which is no project (Tom, 3A). */
  function said(it, P, SEC) {
    const d = dueParts(it.due), p = P[it.project_id], s = SEC[it.section_id];
    const proj = p && !p.inbox_project ? slug(p.name) : '';
    const row = {
      text: String(it.content || ''), pri: it.priority > 1 ? 5 - it.priority : 0, proj: proj,
      tags: (it.labels || []).map(slug).filter(Boolean), due: d.due, at: d.at,
    };
    const td = Object.assign({}, row, {
      id: it.id, raw: d.raw, rec: d.rec, done: 0, projId: it.project_id || '',
      sec: it.section_id || '', secName: s ? s.name : '', parent: it.parent_id || '',
      desc: it.description || '', labels: it.labels || [],
    });
    return { row: row, td: td, projName: p ? p.name : '' };
  }

  /* Every Todoist row here, alive or deleted, found by its key on any date
     (root brief, Known traps: look on every date, and the tombstone too). */
  function index() {
    const rows = {}, tombs = {};
    Rec.all('note').forEach(r => { const m = KEY_RE.exec(r.key); if (m) rows[m[1]] = r; });
    Rec.tombstones('note').forEach(r => { const m = KEY_RE.exec(r.key); if (m && !rows[m[1]]) tombs[m[1]] = r; });
    return { rows: rows, tombs: tombs };
  }
  const days = new Set();
  function put(r, payload) { Rec.set('note', r.date, r.key, payload); days.add(r.date); }

  /* A recurring task closed here has done a round, as Journal.tick does for
     QUESTS's own repeats: a finished copy on the day it was done, `of`
     pointing back, and the todo open again. The copy's key comes from the
     round's due date, so two devices finishing one round make one copy. */
  function round(r) {
    const p = Rec.get('note', r.date, r.key);
    if (!p) return;
    const d = p.doneOn || T();
    Rec.set('note', d, r.key + '-r' + String(p.td.due || d), Object.assign({}, p, {
      done: 1, doneOn: d, due: p.td.due || d, of: r.key, td: null, rep: null, t: Date.now(), made: d,
    }));
    days.add(d);
    put(r, Object.assign({}, p, { done: 0, doneAt: null, doneOn: null, by: p.byWas || null, byWas: null, byAuto: 0 }));
  }

  /* What changed here goes to Todoist: a tick, an untick, a new date or time,
     a delete. Text, priority and project changed here stay here (Tom's 1A).
     A recurring task is closed only while Todoist still has it on the date
     this device last saw, or two devices would each move it on a round. */
  async function push(data) {
    const live = {};
    (data.items || []).forEach(it => { if (!it.checked && !it.is_deleted) live[it.id] = it; });
    const ix = index(), cmds = [], after = {};
    const add = (type, args, fn) => {
      const u = 'mb' + Date.now().toString(36) + (uid++).toString(36) + Math.random().toString(36).slice(2, 6);
      cmds.push({ type: type, uuid: u, args: args });
      after[u] = fn;
    };
    const setTd = (r, ch) => () => {
      const p = Rec.get('note', r.date, r.key);
      if (p) put(r, Object.assign({}, p, { td: Object.assign({}, p.td, ch) }));
    };
    Object.keys(ix.tombs).forEach(id => { if (live[id]) add('item_delete', { id: id }, () => {}); });
    Object.keys(ix.rows).forEach(id => {
      const r = ix.rows[id], p = r.payload, td = p.td, it = live[id];
      if (!td || p.cancelled) return;
      if (p.done && !td.done) {
        if (!it) return;
        if (td.rec) {
          if (String((it.due && it.due.date) || '') !== td.raw) { round(r); return; }
          add('item_close', { id: id }, () => round(r));
        } else add('item_close', { id: id }, setTd(r, { done: 1 }));
      } else if (!p.done && td.done) {
        add('item_uncomplete', { id: id }, setTd(r, { done: 0 }));
      } else if (!p.done && it && ((p.due || '') !== td.due || (p.at || null) !== (td.at || null))) {
        const due = p.due ? Object.assign({ date: p.due + (p.at ? 'T' + p.at + ':00' : '') },
          td.rec ? { string: td.rec, is_recurring: true, lang: 'en' } : {}) : null;
        add('item_update', { id: id, due: due }, setTd(r, { due: p.due || '', at: p.at || null }));
      }
    });
    if (!cmds.length) return false;
    const res = await call('sync', { commands: JSON.stringify(cmds) });
    const ok = (res && res.sync_status) || {};
    cmds.forEach(c => { if (ok[c.uuid] === 'ok') after[c.uuid](); });
    return true;
  }

  /* What changed in Todoist comes here. A task that has left Todoist's open
     list was finished or deleted there; Todoist is asked which.
     Until 2026-11-16 the cap of 20 was taken before rows already settled
     (`td.done`) were skipped, and a ticked row is never in the open list
     again, so once 20 ticks had piled up no deleted task was ever asked
     about. Settled rows are left out first now. */
  async function apply(data) {
    const P = {}, SEC = {}, seen = {}, ix = index();
    (data.projects || []).forEach(p => { P[p.id] = p; });
    (data.sections || []).forEach(s => { SEC[s.id] = s; });
    (data.items || []).forEach(it => {
      if (it.checked || it.is_deleted) return;
      seen[it.id] = 1;
      const f = said(it, P, SEC), r = ix.rows[it.id];
      if (f.row.proj) ensureProject(f.row.proj, f.projName);
      if (!r) {
        if (ix.tombs[it.id]) return;
        const t = Date.parse(it.added_at) || Date.now(), d = localYmd(new Date(t));
        put({ date: d, key: 'td-' + it.id }, Object.assign({
          kind: 'todo', t: t, made: d, at: null, dur: null, ord: it.child_order || 0,
          done: 0, cancelled: 0, src: 'todoist', rep: null,
        }, f.row, { td: f.td }));
        return;
      }
      const p = r.payload, was = p.td || {}, next = Object.assign({}, p);
      FIELDS.forEach(k => { if (!same(was[k], f.row[k])) next[k] = f.row[k]; });
      if (was.done) Object.assign(next, { done: 0, doneAt: null, doneOn: null });
      next.td = Object.assign({}, f.td, { done: 0 });
      if (!same(next, p)) put(r, next);
    });
    const gone = Object.keys(ix.rows).filter(id => !seen[id] && ix.rows[id].payload.td && !ix.rows[id].payload.td.done);
    let asked = 0;
    for (const id of gone) {
      const r = ix.rows[id], p = r.payload;
      if (p.done) { put(r, Object.assign({}, p, { td: Object.assign({}, p.td, { done: 1 }) })); continue; }
      if (asked++ >= ASK) continue;
      const it = await call('tasks/' + id);
      if (!it || it.is_deleted) { Rec.del('note', r.date, r.key); days.add(r.date); }
      else if (it.checked) {
        const t = Date.parse(it.completed_at) || Date.now(), d = localYmd(new Date(t));
        put(r, Object.assign({}, p, { done: 1, doneOn: d, doneAt: pad(new Date(t).getHours()) + ':' + pad(new Date(t).getMinutes()),
          byAuto: 1, td: Object.assign({}, p.td, { done: 1 }) }));
      }
    }
  }

  async function once() {
    st.busy = true; st.err = ''; say();
    try {
      let data = await read();
      st.quiet = true;
      if (await push(data)) data = await read();
      await apply(data);
      st.n = (data.items || []).filter(it => !it.checked && !it.is_deleted).length;
      st.at = Date.now();
    } catch (e) {
      st.err = e && e.message === 'key' ? 'key' : 'net';
    }
    st.quiet = false; st.busy = false; last = Date.now();
    days.forEach(d => g.Journal && Journal.publishNotes(d, opt.app)); days.clear();
    say();
    if (opt.draw) opt.draw();
  }

  /* One runner per browser at a time: the home screen frames QUESTS and
     STATUS too. Not in the demo, which is a made-up person. */
  function run(force) {
    if (!key() || st.busy || g.MB_DEMO) return Promise.resolve();
    if (!force && Date.now() - last < 45000) return Promise.resolve();
    if (navigator.locks && navigator.locks.request)
      return navigator.locks.request('mb-todoist', { ifAvailable: true }, l => l ? once() : null);
    return once();
  }
  /* A tick anywhere on a Todoist row goes a few seconds later, after the
     six-second Undo has had its chance. */
  function soon(list) {
    if (st.quiet || !key() || !(list || []).some(r => r && r.type === 'note' && /^td-/.test(r.key))) return;
    clearTimeout(soonT);
    soonT = setTimeout(() => run(true), 8000);
  }
  function line() {
    if (!key()) return 'Not connected. Paste your key to bring your Todoist tasks in.';
    if (st.busy) return 'Syncing with Todoist.';
    if (st.err === 'key') return 'Todoist refused this key. Copy it again from Todoist.';
    if (st.err) return 'Could not reach Todoist. It tries again in 5 minutes.';
    if (!st.at) return 'Waiting to sync.';
    const m = Math.round((Date.now() - st.at) / 60000);
    return 'Synced ' + (m < 1 ? 'just now' : m + ' min ago') + '. ' + st.n + ' open tasks in Todoist.';
  }
  let started = false;
  function start(o) {
    Object.assign(opt, o || {});
    if (started) return;
    started = true;
    Rec.on(soon);
    Rec.ready(() => run(true));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });
    setInterval(() => run(), 300000);
  }
  g.TodoistSync = { run: run, soon: soon, line: line, key: key, st: st, start: start, _said: said, _dueParts: dueParts, _apply: apply, _same: same };
})(typeof window !== 'undefined' ? window : this);
