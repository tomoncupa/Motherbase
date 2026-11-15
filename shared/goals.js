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

  function health(a, list) {
    if (!a || a.state) return null;
    const t = D().today(), ws = weekStart(t), weeks = [];
    for (let i = WEEKS - 1; i >= 0; i--) weeks.push({ s: D().shift(ws, -7 * i), n: 0 });
    let last = null;
    (list || todos()).forEach(x => {
      if (!x.done || !x.doneOn || of(x) !== a.key) return;
      if (!last || x.doneOn > last.doneOn) last = x;
      const c = weeks.find(k => k.s === weekStart(x.doneOn));
      if (c) c.n++;
    });
    const idle = D().diff(t, last ? last.doneOn : (a.made || t));
    const auto = !last && D().diff(t, a.made || t) < 7 ? '' : idle <= 7 ? 'on' : idle <= 21 ? 'adj' : 'off';
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
    aims: aims, of: of, order: order, health: health, next: next, mark: mark, toToday: toToday };
})(typeof window !== 'undefined' ? window : this);
