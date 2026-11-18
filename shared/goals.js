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
   path(aim)    a fed goal's live number for a card: {type, now, start,
                target, made, by, pts:[[date, v]], text, line}
   WOOP (2026-11-17): woop(aim), hasWoop, inner(text) (a nudge when the
                obstacle names something outside him), keptOn, kept, run,
                cue, cueKey, cards. See "WOOP" below.
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
                                       (shared/e1rm.js, Brzycki, as TRAIN reads it),
                                       working sets only, target in kg
       {kind: 'ev', field, target, start}    a STATUS measure, the day's last
                                       reading, in its field's unit
     A count is on track when this week or last week met `n`, adjust at half,
     off below. A measure is on track while it is at or past the straight line
     from `start` on the day it was made to `target` on its by date. */
  const MEASURE = { lift: 1, ev: 1 }, COUNT = { train: 1, tick: 1 };
  /* Money and work numbers (Tom, 2026-11-17: personal, professional and
     financial goals all fed by data, picked per goal):
       {kind: 'money', of: 'pot', pot, target, start}  a WEALTH pot's balance
       {kind: 'money', of: 'income', target}           this month's income, WEALTH
                                                       `paid` less loans
       {kind: 'pro', of: 'members', target, start}     Skool members
       {kind: 'pro', of: 'posts', n}                   posts a week
       {kind: 'pro', of: 'revenue', target}            revenue this month
     A work number is a `pnum` row, key the number's name, dated, {v}: OUTER
     HEAVEN hands posts in through the Motherbase inbox (one row a day, that
     day's posts); a number with no feed is typed on the goal. A balance and
     a member count stand until the next reading, however old; a month's
     money is on track at or past the straight line to its target by the
     month's last day. Money is Tom's: WEALTH is never in the client build,
     so a client has no pot or paid row to pick. */
  const kindOf = s => !s ? '' : COUNT[s.kind] || (s.kind === 'pro' && s.of === 'posts') ? 'count'
    : (s.kind === 'money' && s.of === 'income') || (s.kind === 'pro' && s.of === 'revenue') ? 'month'
    : MEASURE[s.kind] || (s.kind === 'money' && s.of === 'pot') || (s.kind === 'pro' && s.of === 'members') ? 'measure' : '';
  const LEVEL = s => s.kind === 'money' || s.kind === 'pro';
  const peso = v => '\u20B1' + Math.round(v).toLocaleString('en-US');
  const pnum = name => {
    const out = {};
    g.Rec.all('pnum').forEach(r => { if (r.key === name && r.date && r.payload && isFinite(+r.payload.v)) out[r.date] = +r.payload.v; });
    return out;
  };
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
      if (warm(p) || !(p.kg > 0) || !(p.r > 0) || (cap && p.r > cap)) return;
      const e = g.E1RM.calc(p.kg, p.r, p.rir), m = lift[p.ex] = lift[p.ex] || {};
      if (!m[r.date] || e > m[r.date]) m[r.date] = e;
    });
    memo = { at: now, rec: g.Rec, days: days, lift: lift };
    return memo;
  }
  /* a measure's readings, date to value */
  function series(src) {
    if (src.kind === 'lift') return setIndex().lift[src.ex] || {};
    if (src.kind === 'pro') return pnum(src.of);
    if (src.kind === 'money') {
      /* a pot's balance on each day money moved, and today */
      const mv = g.Rec.all('move').filter(r => r.payload && r.payload.pot === src.pot && r.date)
        .sort((x, y) => x.date.localeCompare(y.date)), out = {};
      let bal = 0;
      mv.forEach(r => { const n = +r.payload.amt || 0; bal += r.payload.dir === 'out' ? -n : n; out[r.date] = bal; });
      out[D().today()] = bal;
      return out;
    }
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
    if (src.kind === 'pro') return pnum('posts');
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
  /* a number as the goal's card says it */
  function fmt(src, v) {
    if (v == null || !isFinite(v)) return '';
    if (src.kind === 'lift') return fmtLift(v, src.u);
    if (src.kind === 'money' || (src.kind === 'pro' && src.of === 'revenue')) return peso(v);
    if (src.kind === 'pro') return String(Math.round(v));
    return String(round(v));
  }
  /* the newest reading at or before t, however old (a balance stands) */
  function lastOf(sr, t) {
    const ds = Object.keys(sr).filter(d => d <= t).sort();
    return ds.length ? { d: ds[ds.length - 1], v: sr[ds[ds.length - 1]], last: sr[ds[ds.length - 1]] } : null;
  }
  /* money in on each day: income less loans, or revenue handed in */
  function monthDays(src) {
    if (src.kind === 'pro') return pnum('revenue');
    const out = {};
    g.Rec.all('paid').forEach(r => {
      const p = r.payload || {};
      if (!r.date || p.loan) return;
      out[r.date] = (out[r.date] || 0) + (+p.amt || 0);
    });
    return out;
  }
  const monthEnd = t => { const d = new Date(+t.slice(0, 4), +t.slice(5, 7), 0); return t.slice(0, 8) + String(d.getDate()).padStart(2, '0'); };
  /* a month's money: on track at or past the straight line to the target by month end */
  function fromMonth(a, t, weeks, cut) {
    const src = a.src, days = monthDays(src), target = +src.target || 0, m0 = t.slice(0, 8) + '01';
    weeks.forEach(k => { let n = 0; for (let i = 0; i < 7; i++) { const d = D().shift(k.s, i); if (!cut || d >= cut) n += days[d] || 0; } k.n = Math.round(n); k.v = n; });
    weeks.forEach(k => { if (cut && D().shift(k.s, 6) < cut) k.n = ''; });
    let now = 0;
    Object.keys(days).forEach(d => { if (d >= m0 && d <= t) now += days[d]; });
    const len = D().diff(monthEnd(t), m0) + 1, pace = target * (D().diff(t, m0) + 1) / len;
    const auto = now >= pace ? 'on' : now >= pace / 2 ? 'adj' : 'off';
    return { auto: auto, line: 'This month ' + peso(now) + ' of ' + peso(target) + (now >= target ? '. Reached' : '. On pace: ' + peso(pace)) };
  }
  /* What a goal fed by data says this week. Fills weeks; gives auto and line. */
  function fromSource(a, t, weeks, cut) {
    const src = a.src;
    if (kindOf(src) === 'month') return fromMonth(a, t, weeks, cut);
    if (kindOf(src) === 'count') {
      const days = countDays(src), n = Math.max(1, +src.n || 1);
      weeks.forEach(k => { for (let i = 0; i < 7; i++) { const d = D().shift(k.s, i); if (days[d] > 0 && (!cut || d >= cut)) k.n += +days[d]; } });
      weeks.forEach(k => { if (cut && D().shift(k.s, 6) < cut) k.n = ''; });
      const now = weeks[weeks.length - 1].n || 0, prev = weeks[weeks.length - 2].n || 0;
      const fresh = D().diff(t, begun(a, cut)) < 7;
      const auto = now >= n || (!fresh && prev >= n) ? 'on' : fresh ? '' : prev >= Math.ceil(n / 2) ? 'adj' : 'off';
      const what = src.kind === 'train' ? 'sessions' : src.kind === 'pro' ? 'posts' : 'days';
      return { auto: auto, line: now + ' of ' + n + ' ' + what + ' this week' + (fresh ? '' : ', ' + prev + ' last week') };
    }
    /* stronger is always up; a measure goes the way its target lies */
    const all = series(src), sr = {};
    Object.keys(all).forEach(d => { if (!cut || d >= cut) sr[d] = all[d]; });
    const dir = src.kind === 'lift' || +src.target >= +src.start ? 1 : -1;
    const show = v => fmt(src, v);
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
    const L = LEVEL(src) ? lastOf(sr, t) : latest(sr, t);
    if (!L && D().diff(t, begun(a, cut)) < 7) return { auto: '', line: 'No reading yet this chapter' };
    if (!L) return { auto: 'adj', line: 'No reading in 14 days' };
    /* a measure is the average of the last 7 days' readings, so one heavy morning
       cannot flip the call (2026-11-16); a lift is its best of the last 14 days */
    const wk = Object.keys(sr).filter(d => d <= t && D().diff(t, d) < 7).map(d => sr[d]);
    const now = src.kind === 'lift' ? L.v : LEVEL(src) ? L.last : wk.length ? wk.reduce((x, y) => x + y, 0) / wk.length : L.last;
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
    const sr = series(src), L = LEVEL(src) ? lastOf(sr, D().today()) : latest(sr, D().today());
    if (L && LEVEL(src)) return L.last;
    if (L && src.kind === 'lift') return L.v;
    if (L) { const wk = Object.keys(sr).filter(d => d <= D().today() && D().diff(D().today(), d) < 7).map(d => sr[d]);
      return wk.length ? wk.reduce((x, y) => x + y, 0) / wk.length : L.last; }
    const ds = Object.keys(sr).sort();
    return ds.length ? sr[ds[ds.length - 1]] : null;
  }
  const fed = a => !!(a && a.src && kindOf(a.src));
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
    if (fed(a) && kindOf(a.src) === 'count') {
      const n = Math.max(1, +a.src.n || 1), w = h.weeks.slice(-4, -1).map(k => k.n);
      if (n <= 1 || w.length < 3 || w.some(c => c === '' || c >= Math.ceil(n / 2))) return null;
      if (D().diff(t, begun(a, cutOf())) < 21) return null;
      return { n: Math.max(1, Math.min(n - 1, Math.max.apply(null, w) + 1)) };
    }
    if (fed(a) && kindOf(a.src) === 'month') return null;
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
    const open = (list || todos()).filter(x => !x.done && x.src !== 'woop' && of(x) === a.key);
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
  const SRC_NAME = { '': 'Tasks', train: 'Training sessions', lift: 'A lift', ev: 'A measure', tick: 'A habit', money: 'Money', pro: 'Work numbers' };
  const MONEY_OF = { pot: 'A savings pot', income: 'Income this month' };
  const PRO_OF = { members: 'Skool members', posts: 'Posts a week', revenue: 'Revenue this month' };

  /* ── a fed goal's live number, for a card ──
     The start-to-target line (Tom, 2026-11-17, WOOP point 5): the readings
     since the goal began (the last 90 days at most) beside the straight line
     from where it stood to the target on its by date. A count hands its
     weeks; a month its running total this month. */
  function path(a) {
    if (!fed(a)) return null;
    const src = a.src, t = D().today(), k = kindOf(src), h = health(a);
    const base = { type: k, line: h ? h.line : '', v: h ? h.v : '', made: begun(a, cutOf()), by: a.by || '' };
    if (k === 'count') {
      const n = Math.max(1, +src.n || 1), w = h.weeks;
      return Object.assign(base, { now: w[w.length - 1].n || 0, target: n, pts: w.map(x => [x.s, x.n === '' ? null : x.n]),
        text: (w[w.length - 1].n || 0) + ' of ' + n, unit: src.kind === 'train' ? 'sessions' : src.kind === 'pro' ? 'posts' : 'days' });
    }
    if (k === 'month') {
      const days = monthDays(src), m0 = t.slice(0, 8) + '01', pts = [];
      let run = 0;
      for (let d = m0; d <= t; d = D().shift(d, 1)) { run += days[d] || 0; pts.push([d, run]); }
      return Object.assign(base, { now: run, start: 0, target: +src.target || 0, made: m0, by: monthEnd(t), pts: pts, text: peso(run), unit: '' });
    }
    const sr = series(src), from = [D().shift(t, -89), D().shift(base.made, -14)].sort().pop();
    const pts = Object.keys(sr).filter(d => d >= from && d <= t).sort().map(d => [d, sr[d]]);
    const L = LEVEL(src) ? lastOf(sr, t) : latest(sr, t);
    const now = L ? (src.kind === 'lift' ? L.v : L.last) : null;
    const txt = fmt(src, now), unit = (txt.match(/ (kg|lb)$/) || [])[1] || '';
    return Object.assign(base, { now: now, start: +src.start, target: +src.target, pts: pts,
      text: txt.replace(/ (kg|lb)$/, ''), unit: unit });
  }

  /* ── WOOP (Tom, 2026-11-17, all ten points) ──
     Wish, Outcome, Obstacle, Plan (Oettingen; mental contrasting with
     implementation intentions). Kept on the goal by patch:
       aim.woop = {outcome, obstacle, if, then, odds, oddsWs, pic}
     `odds` 1 to 10 is asked again each week (`oddsWs` the week it was
     given); `pic` is the picture ROOM shows, a Vision Board file name.
     The run-through and the plan's record are `wrun` rows (QUESTS), key the
     goal's key, dated: {ran, cue, kept}. `ran` the 30-second run-through was
     done, `cue` the time the if-moment was planned for, `kept` 1 or 0 his
     tap at that moment. The cue is also a todo, `woop-<goal>-<day>`
     (src 'woop'): ticking it anywhere is a kept day unless he said NOT TODAY.
     Days kept are the record of the plan working: behaviour and dates,
     never a score (root brief, self-efficacy). */
  const woop = a => (a && a.woop) || null;
  const hasWoop = a => { const w = woop(a); return !!(w && (w.obstacle || w.if || w.outcome)); };
  const cueKey = (aim, d) => 'woop-' + aim + '-' + d;
  /* an obstacle should be inside him: a habit, a thought, a feeling. One
     that names only the world gets one nudge, never a refusal. */
  const OUTSIDE = /\b(work|job|boss|clients?|traffic|weather|rain|heat|they|them|people|family|kids|wife|husband|partner|schedule|money|economy|internet|gym is|no time)\b/i;
  const INNER = /\b(i|i'm|im|i've|my|me|myself|feel|feeling|tired|lazy|want|urge|crave|cravings?|habit|tempt|scroll)\b/i;
  const inner = text => {
    const s = String(text || '').trim();
    if (!s || INNER.test(s) || !OUTSIDE.test(s)) return '';
    return 'That names something outside you. What do you do, think or feel when it happens? That part is the obstacle you can plan for.';
  };
  const runOf = (key, d) => g.Rec.get('wrun', d, key) || null;
  /* true kept, false not today, null not known: his tap, else the cue todo ticked */
  function keptOn(key, d) {
    const r = runOf(key, d);
    if (r && r.kept === 1) return true;
    if (r && r.kept === 0) return false;
    const x = g.Rec.get('note', d, cueKey(key, d));
    return x && x.done && !x.cancelled ? true : null;
  }
  /* days kept and days with a cue, from `from` to `to` (since the goal began by default) */
  function kept(a, from, to) {
    const key = a.key || a, t = to || D().today(), out = { kept: 0, cued: 0, ran: 0, days: [] };
    const f = from || (a.made ? begun(a, cutOf()) : D().shift(t, -364));
    const seen = {};
    g.Rec.all('wrun').forEach(r => { if (r.key === key && r.date) seen[r.date] = 1; });
    g.Rec.all('note').forEach(r => { if (r.date && r.key === cueKey(key, r.date)) seen[r.date] = 1; });
    Object.keys(seen).filter(d => d >= f && d <= t).sort().forEach(d => {
      const r = runOf(key, d) || {}, k = keptOn(key, d);
      if (r.ran) out.ran++;
      if (r.cue || g.Rec.get('note', d, cueKey(key, d)) || k != null) out.cued++;
      if (k) { out.kept++; out.days.push(d); }
    });
    return out;
  }
  /* write to the day's run, merged, never rebuilt */
  function run(key, d, fields) {
    g.Rec.patch('wrun', d || D().today(), key, Object.assign({ t: Date.now() }, fields));
  }
  /* the if-moment as a timed todo on day d; no time takes it back */
  function cue(a, d, at) {
    const k = cueKey(a.key, d), w = woop(a) || {}, was = g.Rec.get('note', d, k);
    if (!at) {
      if (was && !was.done) g.Rec.del('note', d, k);
      run(a.key, d, { cue: '' });
    } else {
      const text = 'If ' + String(w.if || 'the moment comes').replace(/^if\s+/i, '') + ', then ' + String(w.then || 'the plan').replace(/^then\s+/i, '');
      if (was) g.Rec.patch('note', d, k, { at: at, text: text, due: d });
      else g.Rec.set('note', d, k, { kind: 'todo', text: text, t: Date.now(), made: d, due: d, at: at, dur: null, ord: 0,
        done: 0, cancelled: 0, src: 'woop', aim: a.key });
      run(a.key, d, { cue: at });
    }
    if (g.Journal && g.Journal.publishNotes) g.Journal.publishNotes(d, g.Rec.appId);
  }
  /* one goal as the data a NOTICE window draws (Notice.woop, Notice.cue) */
  function card(a) {
    const w = woop(a) || {}, p = path(a), k = kept(a);
    const by = a.by ? new Date(a.by + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    let num = null;
    if (p && p.type === 'count') num = { label: p.unit.charAt(0).toUpperCase() + p.unit.slice(1) + ' this week', cur: p.now, max: p.target };
    else if (p && p.line) num = { label: p.line };
    return { key: a.key, wish: a.text, by: by, outcome: w.outcome || '', obstacle: w.obstacle || '', if: w.if || '', then: w.then || '',
      num: num, kept: k.kept, pic: w.pic || '' };
  }
  /* the cards ROOM hangs: open goals with a WOOP, three at most (AIM_CAP) */
  const cards = () => aims().filter(hasWoop).slice(0, 3);
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
    startOf: startOf, fed: fed, stuck: stuck, SRC_NAME: SRC_NAME, LB: LB, kindOf: kindOf, fmt: fmt, path: path,
    MONEY_OF: MONEY_OF, PRO_OF: PRO_OF, pnum: pnum, woop: woop, hasWoop: hasWoop, inner: inner, keptOn: keptOn,
    kept: kept, run: run, runOf: runOf, cue: cue, cueKey: cueKey, cards: cards, card: card };
})(typeof window !== 'undefined' ? window : this);
