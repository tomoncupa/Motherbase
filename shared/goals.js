/* ══════════════════════════════════════════════════════════════════════
   MOTHERBASE · GOALS
   One answer to "how is this goal doing this week", for every app.

   Tom, 2026-11-16, taken from Superfocus: each QUESTS goal gets a call for
   the week, On track, Adjust or Off track, and one fix. QUESTS's Goals
   screen and the home screen's THIS WEEK card both show it, so the rule lives
   here and both ask it (root brief, Known traps: a fact shown in two places
   is read by one rule; shared/dose.js and shared/grade.js are the same move).

   The rows are QUESTS's: an `aim` (quest/CLAUDE.md, Goals) and the `note`
   todos that serve it, by their own `aim` or their project's. Nothing here
   needs Todoist: a todo is a todo wherever it came from.

   health(aim)  {ws, auto, mark, v, weeks:[{s, n}], span, idle, last}
                `auto` is the call from days since a task serving it was done
                (7 or fewer on, 21 or fewer adj, more off; '' for a goal made
                this week with nothing done). `mark` is his own call for the
                week (`marks[<week start>].v` on the aim), and `v` is his
                call if he made one, else the rule's.
   mark(key, ws, v)  his call for the week on the goal, '' to take it back.
   toToday(x)   a task due today, handing back the row as it was.
   next(aim)    {kind: 'next', x} its next task due this week,
                {kind: 'sched', x} an open task with no day this week,
                {kind: 'add'} nothing open serves it.
   ══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  const NAME = { on: 'On track', adj: 'Adjust', off: 'Off track' };
  const MK = { on: 'var(--success)', adj: 'var(--warn)', off: 'var(--danger)' };
  const WEEKS = 6;
  const D = () => g.Day;
  const weekStart = s => D().shift(s, -((D().dow(s) + 6) % 7));

  const todos = () => g.Rec.all('note')
    .filter(r => r.payload && r.payload.kind === 'todo' && !r.payload.cancelled)
    .map(r => Object.assign({ key: r.key, date: r.date }, r.payload));
  const due = x => x.due === undefined ? (x.date || null) : (x.due || null);
  const aims = () => Object.entries(g.Rec.map('aim') || {})
    .map(e => Object.assign({ key: e[0] }, e[1]))
    .filter(a => !a.state)
    .sort((a, b) => (a.ord || 0) - (b.ord || 0) || String(a.made || '').localeCompare(String(b.made || '')));
  /* a todo serves a goal if it says so, or if its project does */
  function of(x) {
    if (x.aim) return x.aim;
    const p = x.proj && g.Rec.get('project', null, x.proj);
    return (p && p.aim) || '';
  }
  /* QUESTS's order inside a day: priority, then time, then when written */
  function order(a, b) {
    const pa = a.pri || 4, pb = b.pri || 4;
    if (pa !== pb) return pa - pb;
    const ta = a.at || '99', tb = b.at || '99';
    if (ta !== tb) return ta < tb ? -1 : 1;
    return (a.t || 0) - (b.t || 0);
  }

  /* ── what moves a goal besides its tasks ──
     Tom, 2026-11-16, "1A": a goal can be fed by data he already logs, so no
     ^name is typed. `aim.src` is one of:
       {kind: 'train', n}              TRAIN sessions a week (a day with a set
                                       that counts, TRAIN.counts' rule)
       {kind: 'tick', act, n}          a BLOCK habit, days ticked a week; `act`
                                       is the activity id, a routine's copy
                                       (`act.routine`) counts too
       {kind: 'lift', ex, target, u, start}  a TRAIN lift's best estimated 1RM
                                       (TRAIN.e1rm: kg x 36 / (37 - reps)),
                                       working sets only, target in kg
       {kind: 'ev', field, target, start}    a STATUS measure, the day's last
                                       reading, in its field's unit
     A count is on track when this week or last week met `n`, adjust at half,
     off below. A measure is on track while it is at or past the straight line
     from `start` on the day it was made to `target` on its by date. */
  const MEASURE = { lift: 1, ev: 1 }, COUNT = { train: 1, tick: 1 };
  let memo = null;
  /* every set read once per moment, not once per goal (12,000+ rows) */
  function setIndex() {
    const now = Date.now();
    if (memo && memo.rec === g.Rec && now - memo.at < 1500) return memo;
    if (g.Rec.need) { try { g.Rec.need('set'); } catch (e) {} }
    const days = {}, lift = {}, cap = g.Rec.setting('train', 'e1rmMaxReps') || 0;
    const warm = p => p.warm === 1 || p.warm === true || (p.warm !== 0 && p.warm !== false && !!p.note && /\bwarm[ -]?ups?\b|\bwu\b/i.test(p.note));
    g.Rec.all('set').forEach(r => {
      const p = r.payload || {};
      if (!r.date || (p.plan && !p.done)) return;
      days[r.date] = 1;
      if (warm(p) || !(p.kg > 0) || !(p.r > 0) || p.r >= 37 || (cap && p.r > cap)) return;
      const e = p.kg * 36 / (37 - p.r), m = lift[p.ex] = lift[p.ex] || {};
      if (!m[r.date] || e > m[r.date]) m[r.date] = e;
    });
    memo = { at: now, rec: g.Rec, days: days, lift: lift };
    return memo;
  }
  /* a measure's readings, date to value */
  function series(src) {
    if (src.kind === 'lift') return setIndex().lift[src.ex] || {};
    const out = {};
    g.Rec.all('ev').forEach(r => {
      if (r.key !== src.field || !r.date) return;
      const e = (r.payload && r.payload.e) || [], v = e.length ? +e[e.length - 1].v : NaN;
      if (isFinite(v)) out[r.date] = v;
    });
    return out;
  }
  /* the days a count counted */
  function countDays(src) {
    if (src.kind === 'train') return setIndex().days;
    const out = {};
    g.Rec.all('tick').forEach(r => {
      if (!r.date || !(r.key === src.act || String(r.key).indexOf(src.act + '.') === 0)) return;
      if (r.payload && r.payload.qty === 0) return;
      out[r.date] = 1;
    });
    return out;
  }
  const round = v => Math.round(v * 10) / 10;
  const LB = 2.20462;
  const fmtLift = (v, u) => round(u === 'lb' ? v * LB : v) + ' ' + (u === 'lb' ? 'lb' : 'kg');
  /* the value now from the last 14 days: a lift's best, a measure's newest */
  function latest(sr, t) {
    const ds = Object.keys(sr).filter(d => d <= t && D().diff(t, d) <= 14).sort();
    if (!ds.length) return null;
    return { d: ds[ds.length - 1], v: ds.reduce((m, d) => Math.max(m, sr[d]), -Infinity), last: sr[ds[ds.length - 1]] };
  }
  /* What a goal fed by data says this week. Fills weeks; gives auto and line. */
  function fromSource(a, t, weeks, cut) {
    const src = a.src;
    if (COUNT[src.kind]) {
      const days = countDays(src), n = Math.max(1, +src.n || 1);
      weeks.forEach(k => { for (let i = 0; i < 7; i++) { const d = D().shift(k.s, i); if (days[d] && (!cut || d >= cut)) k.n++; } });
      weeks.forEach(k => { if (cut && D().shift(k.s, 6) < cut) k.n = ''; });
      const now = weeks[weeks.length - 1].n || 0, prev = weeks[weeks.length - 2].n || 0;
      const fresh = D().diff(t, begun(a, cut)) < 7;
      const auto = now >= n || (!fresh && prev >= n) ? 'on' : fresh ? '' : prev >= Math.ceil(n / 2) ? 'adj' : 'off';
      const what = src.kind === 'train' ? 'sessions' : 'days';
      return { auto: auto, line: now + ' of ' + n + ' ' + what + ' this week' + (fresh ? '' : ', ' + prev + ' last week') };
    }
    /* stronger is always up; a measure goes the way its target lies */
    const all = series(src), sr = {};
    Object.keys(all).forEach(d => { if (!cut || d >= cut) sr[d] = all[d]; });
    const dir = src.kind === 'lift' || +src.target >= +src.start ? 1 : -1, u = src.u;
    const show = v => src.kind === 'lift' ? fmtLift(v, u) : String(round(v));
    weeks.forEach(k => {
      let best = null;
      for (let i = 0; i < 7; i++) {
        const v = sr[D().shift(k.s, i)];
        if (v != null) best = best == null ? v : src.kind === 'lift' ? Math.max(best, v) : v;
      }
      k.v = best;
      k.n = best == null ? '' : show(best).replace(/ (kg|lb)$/, '');
    });
    for (let i = 1; i < weeks.length; i++) {
      const before = weeks.slice(0, i).map(k => k.v).filter(v => v != null).pop();
      weeks[i].up = weeks[i].v != null && before != null && (weeks[i].v - before) * dir > 0;
    }
    const L = latest(sr, t);
    if (!L && D().diff(t, begun(a, cut)) < 7) return { auto: '', line: 'No reading yet this chapter' };
    if (!L) return { auto: 'adj', line: 'No reading in 14 days' };
    /* a measure is the average of the last 7 days' readings, so one heavy morning
       cannot flip the call (2026-11-16); a lift is its best of the last 14 days */
    const wk = Object.keys(sr).filter(d => d <= t && D().diff(t, d) < 7).map(d => sr[d]);
    const now = src.kind === 'lift' ? L.v : wk.length ? wk.reduce((x, y) => x + y, 0) / wk.length : L.last;
    const start = +src.start, target = +src.target;
    const aim = 'aim ' + show(target) + (a.by ? ' by ' + D().short(a.by) : '');
    if ((now - target) * dir >= 0) return { auto: 'on', line: 'Now ' + show(now) + ', ' + aim + '. Reached' };
    const b0 = begun(a, cut);
    if (!a.by || a.by <= b0) {
      return { auto: (now - start) * dir > 0 ? 'on' : 'adj', line: 'Now ' + show(now) + ', ' + aim };
    }
    const frac = Math.min(1, Math.max(0, D().diff(t, b0) / D().diff(a.by, b0)));
    const pace = start + (target - start) * frac, done = (now - start) * dir, need = (pace - start) * dir;
    const auto = done >= need ? 'on' : done >= need / 2 ? 'adj' : 'off';
    return { auto: auto, line: 'Now ' + show(now) + ', ' + aim + '. On pace: ' + show(pace) };
  }
  /* where a measure stands today, kept on the goal as `src.start` when it is set */
  function startOf(src) {
    const sr = series(src), L = latest(sr, D().today());
    if (L && src.kind === 'lift') return L.v;
    if (L) { const wk = Object.keys(sr).filter(d => d <= D().today() && D().diff(D().today(), d) < 7).map(d => sr[d]);
      return wk.length ? wk.reduce((x, y) => x + y, 0) / wk.length : L.last; }
    const ds = Object.keys(sr).sort();
    return ds.length ? sr[ds[ds.length - 1]] : null;
  }
  const fed = a => !!(a && a.src && (COUNT[a.src.kind] || MEASURE[a.src.kind]));
  /* ── a new chapter ──
     shared/chapter.js: QUESTS counts from its chapter date, so nothing before
     it is a call, a week, a last win or a reason to say off track. A week
     wholly before it is drawn blank. `begun(a)` is the later of the day the
     goal was made and that date. */
  const cutOf = () => (g.Chapter && g.Chapter.from('quest')) || '';
  const begun = (a, cut) => [a.made || '', cut || ''].sort().pop() || D().today();
  /* ── a goal that has been off for three weeks ──
     Tom, 2026-11-16, "B": root brief, "a target that has been missed for three
     weeks is not a target, it is furniture", so the app offers to make it
     smaller. Three full weeks under half (a count), 42 days with nothing done
     (tasks), or off track and 21 days old (a measure). Not while his own call
     says otherwise, and not again until `keepUntil` once he says Keep it.
     Hands back {n} (a smaller count a week, one step past his best of those
     weeks) or {days} (more time), or null. */
  function stuck(a, list) {
    if (!a || a.state) return null;
    const t = D().today();
    if (a.keepUntil && a.keepUntil > t) return null;
    const h = health(a, list);
    if (!h || h.mark) return null;
    if (fed(a) && COUNT[a.src.kind]) {
      const n = Math.max(1, +a.src.n || 1), w = h.weeks.slice(-4, -1).map(k => k.n);
      if (n <= 1 || w.length < 3 || w.some(c => c === '' || c >= Math.ceil(n / 2))) return null;
      if (D().diff(t, begun(a, cutOf())) < 21) return null;
      return { n: Math.max(1, Math.min(n - 1, Math.max.apply(null, w) + 1)) };
    }
    if (fed(a)) return h.v === 'off' && D().diff(t, begun(a, cutOf())) >= 21 ? { days: 28 } : null;
    return h.idle >= 42 ? { days: 28 } : null;
  }

  function health(a, list) {
    if (!a || a.state) return null;
    const t = D().today(), ws = weekStart(t), weeks = [];
    for (let i = WEEKS - 1; i >= 0; i--) weeks.push({ s: D().shift(ws, -7 * i), n: 0 });
    const cut = cutOf();
    if (fed(a)) {
      const f = fromSource(a, t, weeks, cut), mk = ((a.marks || {})[ws] || {}).v || '';
      const sp = a.made && a.by && a.by > a.made && a.by >= t
        ? 'Day ' + (D().diff(t, a.made) + 1) + ' of ' + D().diff(a.by, a.made) : '';
      return { ws: ws, auto: f.auto, mark: mk, v: mk || f.auto, weeks: weeks, span: sp, line: f.line, src: a.src.kind };
    }
    let last = null;
    (list || todos()).forEach(x => {
      if (!x.done || !x.doneOn || of(x) !== a.key || (cut && x.doneOn < cut)) return;
      if (!last || x.doneOn > last.doneOn) last = x;
      const c = weeks.find(k => k.s === weekStart(x.doneOn));
      if (c) c.n++;
    });
    if (cut) weeks.forEach(k => { if (D().shift(k.s, 6) < cut) k.n = ''; });
    const idle = D().diff(t, last ? last.doneOn : begun(a, cut));
    const auto = !last && D().diff(t, begun(a, cut)) < 7 ? '' : idle <= 7 ? 'on' : idle <= 21 ? 'adj' : 'off';
    const mark = ((a.marks || {})[ws] || {}).v || '';
    const span = a.made && a.by && a.by > a.made && a.by >= t
      ? 'Day ' + (D().diff(t, a.made) + 1) + ' of ' + D().diff(a.by, a.made) : '';
    return { ws: ws, auto: auto, mark: mark, v: mark || auto, weeks: weeks, span: span, idle: idle, last: last };
  }

  function next(a, list) {
    const open = (list || todos()).filter(x => !x.done && of(x) === a.key);
    const end = D().shift(weekStart(D().today()), 6);
    const soon = open.filter(x => due(x) && due(x) <= end).sort((p, q) => due(p).localeCompare(due(q)) || order(p, q));
    if (soon.length) return { kind: 'next', x: soon[0] };
    if (open.length) return { kind: 'sched', x: open.slice().sort(order)[0] };
    return { kind: 'add' };
  }

  /* His own call for the week, kept on the goal; '' takes it back. */
  function mark(key, ws, v) {
    const marks = Object.assign({}, (g.Rec.get('aim', null, key) || {}).marks || {});
    if (v) marks[ws] = { v: v, t: Date.now() }; else delete marks[ws];
    g.Rec.patch('aim', null, key, { marks: marks });
  }
  const SRC_NAME = { '': 'Tasks', train: 'Training sessions', lift: 'A lift', ev: 'A measure', tick: 'A habit' };
  /* A goal's task onto today, the way QUESTS's date menu does it; hands back
     the row as it was, for an Undo. */
  function toToday(x) {
    const keep = g.Rec.get('note', x.date, x.key);
    if (!keep) return null;
    g.Rec.patch('note', x.date, x.key, { due: D().today() });
    if (g.Journal && g.Journal.publishNotes) g.Journal.publishNotes(x.date, g.Rec.appId);
    return keep;
  }

  g.Goals = { NAME: NAME, MK: MK, WEEKS: WEEKS, weekStart: weekStart, todos: todos, due: due,
    aims: aims, of: of, order: order, health: health, next: next, mark: mark, toToday: toToday,
    startOf: startOf, fed: fed, stuck: stuck, SRC_NAME: SRC_NAME, LB: LB };
})(typeof window !== 'undefined' ? window : this);
