/* ══════════════════════════════════════════════════════════════════════
   MOTHERBASE · GRADE
   One answer to "what letter is this day", for every app.

   Tom, 2026-11-03: "a big widget that just shows my score for the day as it
   is". The letter was STATUS's alone, worked out inside status/index.html,
   so a home screen card could only have had a copy of it, and a copy is how
   HALF-LIFE and STATUS came to read one day two ways (shared/dose.js). STATUS
   and the home screen's DAY PLAN card both ask this file now.

   The rules are STATUS's and its brief says why each is so: every pillar
   earns a letter off its own ladder, the day is the average of the letters,
   and every pillar is in from midnight as an F and graded up. Its settings
   are STATUS's settings rows (`status.<name>`), read here:
     pillars    which pillars count (protein, sleep, steps, kcal, training)
     countCal   off: calories and protein leave, "Sent food" takes their place
     standards  the ladders for sleep, steps, kcal and protein
     kcalDir    which way a calorie miss costs: both, under, over
     targets    the food targets (p and kcal are read here)

   `day(date)` is {date, pct, letter, parts, pending}; a part is {id, label,
   letter, score, val, target, unit, acc, waiting, partial}. STATUS adds
   what only it needs (used, trained, rest) on top.
   ══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  const st = (k, d) => { const v = g.Rec.setting('status', k); return v == null ? d : v; };
  const num = (v, d) => { const n = parseFloat(v); return isFinite(n) ? n : (d == null ? null : d); };

  const RANKS = [
    { k: 'S', at: 95, say: 'Near perfect' },
    { k: 'A', at: 88, say: 'Strong' },
    { k: 'B', at: 80, say: 'Good' },
    { k: 'C', at: 70, say: 'Patchy' },
    { k: 'D', at: 60, say: 'Slipping' },
    { k: 'E', at: 50, say: 'Barely there' },
    { k: 'F', at: 0,  say: 'Failing' },
  ];
  const rankIndex = k => {
    const i = RANKS.findIndex(r => r.k === k);
    return i < 0 ? RANKS.length - 1 : i;
  };

  const standards = () => st('standards', {
    sleep:   [['S', 8], ['A', 7.5], ['B', 7], ['C', 6.5], ['D', 6], ['E', 5.5]],
    steps:   [['S', 12500], ['A', 10000], ['B', 8800], ['C', 7500], ['D', 6500], ['E', 5000]],
    kcal:    [['S', 97], ['A', 95], ['B', 90], ['C', 85], ['D', 80], ['E', 75], ['F', 70]],
    protein: [['S', 97], ['A', 95], ['B', 90], ['C', 85], ['D', 80], ['E', 75], ['F', 70]],
  });
  const targets = () => st('targets', { p: 175, c: 200, f: 80, kcal: 2220, na: 3500, k: 4500 });
  const kcalDir = () => st('kcalDir', 'both');
  const countCal = () => !!st('countCal', 1);
  const SENT = 'sentfood';
  const pillars = () => {
    const set = st('pillars', ['protein', 'sleep', 'steps', 'kcal', 'training']);
    if (countCal()) return set;
    return set.filter(k => k !== 'protein' && k !== 'kcal').concat(SENT);
  };

  /** the letter a number earns on a ladder, or F if it clears nothing */
  function ladderLetter(rungs, v) {
    if (v == null) return 'F';
    for (let i = 0; i < rungs.length; i++) if (v >= rungs[i][1]) return rungs[i][0];
    return 'F';
  }
  /** how close you landed to a target, as a percentage; `free` is the
      direction that costs nothing ('over', 'under', or neither) */
  function accuracy(v, target, free) {
    if (!target) return null;
    if (v == null) return 0;
    if (free === 'over' && v >= target) return 100;
    if (free === 'under' && v <= target) return 100;
    return Math.max(0, 100 - Math.abs(v - target) / target * 100);
  }
  /** the letter for one pillar on one day, or null if it does not apply */
  function pillarLetter(id, v, target) {
    if (id === SENT) return v ? 'S' : 'F';
    const s = standards();
    if (id === 'kcal' || id === 'protein') {
      const a = accuracy(v, target, id === 'protein' ? 'over' : kcalDir());
      return a == null ? null : ladderLetter(s[id], a);
    }
    if (!s[id]) return null;
    return ladderLetter(s[id], v);
  }
  /** letters in, one letter out */
  function averageLetter(letters) {
    const ok = letters.filter(Boolean);
    if (!ok.length) return null;
    const mean = ok.reduce((a, k) => a + rankIndex(k), 0) / ok.length;
    return RANKS[Math.max(0, Math.min(RANKS.length - 1, Math.round(mean)))].k;
  }

  /* ── reading a day ── */
  const fields = () => g.Rec.map('field');
  const setsOn = date => (g.Rec.hydrated || g.Rec.loaded('set')) ? g.Rec.all('set', { date: date }) : [];
  const trainField = fid => fid === 'trained' || /^train/i.test(fid);
  const trainLogged = date => !!g.Rec.get('session', date, '') || setsOn(date).length > 0;
  const entries = (date, fid) => g.Dose.day(g.Dose.forField(fid) || { field: fid }, date);
  /** one field's value on a day: summed, averaged or the last reading, as
      the field says; a TRAIN day is a ticked Trained */
  function value(date, fid) {
    const e = entries(date, fid);
    if (!e.length) return trainField(fid) && (fields()[fid] || {}).measure === 'check' && trainLogged(date) ? 1 : null;
    const f = fields()[fid] || {};
    if (f.agg === 'sum') return e.reduce((a, x) => a + x.v, 0);
    if (f.agg === 'avg') return e.reduce((a, x) => a + x.v, 0) / e.length;
    return e[e.length - 1].v;
  }
  const logged = (date, fid) => entries(date, fid).length > 0 || (trainField(fid) && trainLogged(date));
  /** TRAIN's rows if there are any, else a tracked training yes/no */
  function trainedOn(date) {
    if (g.Rec.get('session', date, '')) return true;
    if (setsOn(date).length) return true;
    const f = Object.values(fields()).filter(x => /^train/i.test(x.id) || /training/i.test(x.label || ''))[0];
    return !!(f && logged(date, f.id));
  }
  const dueOn = (f, date) => !f.days || !f.days.length || f.days.indexOf(g.Day.dow(date)) > -1;

  function day(date) {
    const live = pillars(), parts = [], pending = [];
    const T = targets();
    const ms = g.Rec.all('meal', { date: date }).map(r => r.payload || {});
    const ate = ms.length > 0;
    const tot = { p: 0, kcal: 0 };
    ms.forEach(m => { tot.p += num(m.p, 0) || 0; tot.kcal += num(m.kcal, 0) || 0; });
    const untracked = !!(g.Rec.get('day', date, '') || {}).untracked;
    const asScore = k => 1 - rankIndex(k) / (RANKS.length - 1);
    const add = (id, label, letter, val, target, unit) => {
      if (letter == null) return;
      const acc = (id === 'kcal' || id === 'protein')
        ? accuracy(val, target, id === 'protein' ? 'over' : kcalDir()) : null;
      if (val == null) pending.push(label);
      parts.push({ id: id, label: label, letter: letter, score: asScore(letter),
                   val: val, target: target, unit: unit || '', acc: acc,
                   waiting: val == null, partial: acc != null && untracked });
    };
    if (live.indexOf('protein') > -1)
      add('protein', 'Protein', pillarLetter('protein', ate ? tot.p : null, num(T.p, 0)),
          ate ? Math.round(tot.p) : null, Math.round(num(T.p, 0)), 'g');
    if (live.indexOf('kcal') > -1)
      add('kcal', 'Calories', pillarLetter('kcal', ate ? tot.kcal : null, num(T.kcal, 0)),
          ate ? Math.round(tot.kcal) : null, Math.round(num(T.kcal, 0)), '');
    Object.values(fields()).forEach(f => {
      if (!f.on || !dueOn(f, date)) return;
      const id = /sleep/i.test(f.id) ? 'sleep' : /step/i.test(f.id) ? 'steps' : f.id;
      if (live.indexOf(id) === -1) return;
      add(id, f.label, pillarLetter(id, value(date, f.id), num(f.target, 0)),
          value(date, f.id), num(f.target, 0) || null, f.unit || '');
    });
    const letter = averageLetter(parts.map(p => p.letter));
    const pct = parts.length ? Math.round(parts.reduce((a, p) => a + p.score, 0) / parts.length * 100) : null;
    return { date: date, pct: pct, letter: letter, parts: parts, pending: pending };
  }

  /* ── the steps still to walk, split over the walks still to come ──
     Tom, 2026-11-04: DAY PLAN "should also ask me how many blocks im planning
     to do my steps in, as well as a 'Passive steps throughout the day'". The
     two numbers are one setting, `lifeos.steplan` = {blocks, passive}, the
     same every day. A walk is a DAY PLAN time (a `note` keyed
     `plan-<day>-...`, `plan: 'walk'`); blocks past the timed walks are walks
     with no time yet. A walk whose time has passed is done.
     Passive steps are spread evenly from 07:00 to bed (DAY PLAN's bed time,
     else 23:00), so the ones still to come shrink through the day. That
     spread is a guess, not a measurement. What is left after them is shared
     out over the walks to come, rounded up to the hundred. */
  const stepId = () => {
    const f = Object.values(fields()).filter(x => x.on && /step/i.test(x.id))[0];
    return f ? f.id : null;
  };
  const sRung = id => { const r = (standards()[id] || []).find(x => x[0] === 'S'); return r ? r[1] : null; };
  const hm = at => { const h = String(at || '').split(':'); return +h[0] * 60 + (+h[1] || 0); };
  function stepPlan(date) {
    const set = g.Rec.setting('lifeos', 'steplan') || {};
    const passive = Math.max(0, num(set.passive, 0) || 0);
    const goal = sRung('steps'), fid = stepId();
    const now = fid ? value(date, fid) || 0 : 0;
    const pre = 'plan-' + date + '-';
    const plan = g.Rec.all('note', { date: date }).concat(g.Rec.all('note', { date: g.Day.shift(date, 1) }))
      .filter(r => r.key.indexOf(pre) === 0 && r.payload && r.payload.at && !r.payload.cancelled)
      .map(r => ({ kind: r.payload.plan || 'walk', at: r.payload.at,
                   m: hm(r.payload.at) + (r.date !== date ? 1440 : 0) }));
    const today = date === g.Day.today(), past = date < g.Day.today();
    const d = new Date(), nowM = today ? d.getHours() * 60 + d.getMinutes() : (past ? 1e9 : -1);
    const walks = plan.filter(x => x.kind === 'walk').sort((a, b) => a.m - b.m)
      .map(x => ({ at: x.at, m: x.m, done: x.m <= nowM }));
    const blocks = Math.max(Math.round(num(set.blocks, 0) || 0), walks.length);
    const untimed = blocks - walks.length;
    const bed = plan.filter(x => x.kind === 'bed').map(x => x.m)[0] || 23 * 60;
    const from = 7 * 60;
    const frac = bed <= from ? 0 : Math.max(0, Math.min(1, (bed - Math.max(nowM, from)) / (bed - from)));
    const passiveLeft = Math.round(passive * frac);
    const left = goal == null ? null : Math.max(0, goal - now);
    const toCome = walks.filter(w => !w.done).length + (past ? 0 : untimed);
    const need = left == null ? null : Math.max(0, left - passiveLeft);
    const per = need && toCome ? Math.ceil(need / toCome / 100) * 100 : 0;
    walks.forEach(w => { w.share = w.done ? 0 : per; });
    return { goal: goal, now: now, left: left, passive: passive, passiveLeft: passiveLeft,
             blocks: blocks, untimed: untimed, walks: walks, toCome: toCome, need: need, per: per,
             next: walks.filter(w => !w.done)[0] || null };
  }

  /* ── what each pillar still needs for an S ──
     Tom, 2026-11-04: "a consistent always on top overlay showing what I need
     to do to get an s rank day", every pillar shown. The day is S when the
     average of the letters rounds to S, so every pillar at S is the plain
     way there; each line says how far its pillar is from its own S. A part
     is Grade.day's part plus `text`, and `fixed` when nothing done today
     can change it (sleep is last night's, calories past the top). `clock`
     writes a walk's time the way the caller writes times. */
  const fmt = n => Math.round(n).toLocaleString('en-US');
  function toS(date, clock) {
    const T = targets(), out = [];
    day(date).parts.forEach(p => {
      const x = Object.assign({}, p, { text: '', fixed: false });
      const s = sRung(p.id);
      if (p.id === SENT) x.text = p.letter === 'S' ? 'Sent' : 'Send today\'s food';
      else if (p.id === 'protein' || p.id === 'kcal') {
        const t = p.id === 'protein' ? num(T.p, 0) : num(T.kcal, 0), v = p.val || 0, a = s == null ? 97 : s;
        const lo = Math.ceil(t * a / 100), hi = Math.floor(t * (2 - a / 100));
        const dir = p.id === 'protein' ? 'over' : kcalDir(), u = p.id === 'protein' ? 'g' : ' kcal';
        if (p.letter === 'S') x.text = 'At S';
        else if (v > hi && dir !== 'over') { x.text = fmt(v - hi) + u + ' over the S band'; x.fixed = true; }
        else if (dir === 'under') x.text = 'Up to ' + fmt(hi - v) + u + ' more';
        else if (dir === 'over') x.text = fmt(lo - v) + u + ' more';
        else x.text = fmt(lo - v) + ' to ' + fmt(hi - v) + u + ' more';
      } else if (p.id === 'steps') {
        const sp = stepPlan(date);
        if (p.letter === 'S' || !sp.left) x.text = 'At S';
        else {
          x.text = fmt(sp.left) + ' more';
          if (sp.next) x.text += ' · ' + (clock ? clock(sp.next.at) : sp.next.at) + ' walk ' + fmt(sp.next.share);
          else if (sp.toCome) x.text += ' · ' + sp.toCome + (sp.toCome > 1 ? ' walks of ' : ' walk of ') + fmt(sp.per);
        }
        x.plan = sp;
      } else if (p.id === 'sleep') {
        x.fixed = true;
        x.text = p.letter === 'S' ? 'At S' : p.val == null ? 'Not logged · S is ' + s + 'h'
          : (+p.val).toFixed(1).replace(/\.0$/, '') + 'h · S is ' + s + 'h';
      } else if (s != null) x.text = p.letter === 'S' ? 'At S' : fmt(s - (p.val || 0)) + (p.unit ? ' ' + p.unit : '') + ' more';
      else x.text = p.letter === 'S' ? 'Done' : 'Not yet';
      out.push(x);
    });
    return out;
  }

  g.Grade = {
    VERSION: '1.1.0', RANKS: RANKS, SENT: SENT, day: day, toS: toS, stepPlan: stepPlan,
    rankIndex: rankIndex, ladderLetter: ladderLetter, accuracy: accuracy,
    pillarLetter: pillarLetter, averageLetter: averageLetter,
    standards: standards, targets: targets, kcalDir: kcalDir, countCal: countCal, pillars: pillars,
    value: value, logged: logged, trainedOn: trainedOn,
  };
})(typeof window !== 'undefined' ? window : this);
