/* ══════════════════════════════════════════════════════════════════════════
   FLOW — a day planned as branches, followed on the day

   Tom, 2026-11-17: "prepare for when we wake up not the best versions of
   ourselves", from his 2020 chart (alarm, follow or ignore, sleep good or
   bad, the morning chain, down time fanning out to good and bad). BLOCK's
   Flow tab draws and edits a flow; BLOCK, the home screen's FLOW card and
   STATUS's desktop widget all follow one through this file, so the three
   cannot disagree about where he is or what comes next.

   Rows, never one blob (owner: block, many writers welcome):
     flow    key fid, undated        {name, start, ord, short}
     fbox    key fid|bid, undated    {name, kind, x, y, at, floor}
     farrow  key fid|aid, undated    {a, b, label, gap, sleep}
     fwalk   key fid, dated the day the walk began
                                     {steps: [{box, arrow, t, j, jd}]}

   kind is g (toward his goals), r (away from them), t (a trigger) or
   d (down time). `at` is a fixed time, 'HH:MM'. `gap` is minutes after the
   box before (0 is "immediately"); a box reached by a gap is timed from the
   moment the box before was reached. `sleep` is 'short' or 'enough': the
   arrow last night's sleep suggests. `floor` marks the boxes that make the
   smallest day that still counts. `j` and `jd` are the STATUS entry the
   step wrote, so undo removes it.

   Facts land on the day they happen: a tick and a STATUS entry are dated
   the moment of the pick, whatever day the walk began on.

   Load after day.js and records.js; journal.js is used when it is there.
   ══════════════════════════════════════════════════════════════════════════ */
(function (g) {
'use strict';

const R = () => g.Rec, D = () => g.Day;
const KINDS = {
  g: { label: 'Toward your goals', short: 'Good', token: '--success' },
  r: { label: 'Away from them', short: 'Bad', token: '--danger' },
  t: { label: 'Trigger', short: 'Trigger', token: '--warn' },
  d: { label: 'Down time', short: 'Down time', token: '--info' },
};
const OPEN_HOURS = 20;          /* a walk is still "today's" this long after its last step */
let n = 0;
const uid = p => p + Date.now().toString(36) + (n++).toString(36) + Math.random().toString(36).slice(2, 5);
const slug = s => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
const pad = x => String(x).padStart(2, '0');
const hhmm = ms => { const d = new Date(ms); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };

/* ── reading ── */
function list() {
  return R().all('flow').map(r => Object.assign({ id: r.key }, r.payload))
    .sort((a, b) => (a.ord || 0) - (b.ord || 0) || String(a.name).localeCompare(String(b.name)));
}
const get = fid => { const p = R().get('flow', null, fid); return p ? Object.assign({ id: fid }, p) : null; };
function part(type, fid) {
  const pre = fid + '|';
  return R().all(type).filter(r => String(r.key).indexOf(pre) === 0)
    .map(r => Object.assign({ id: String(r.key).slice(pre.length) }, r.payload));
}
const boxes = fid => part('fbox', fid);
const arrows = fid => part('farrow', fid);
const box = (fid, bid) => { const p = R().get('fbox', null, fid + '|' + bid); return p ? Object.assign({ id: bid }, p) : null; };
const arrow = (fid, aid) => { const p = R().get('farrow', null, fid + '|' + aid); return p ? Object.assign({ id: aid }, p) : null; };
const outOf = (fid, bid, all) => (all || arrows(fid)).filter(a => a.a === bid);

/* ── writing the plan ── */
function make(name) {
  const id = uid('f');
  R().set('flow', null, id, { name: String(name || 'Low day').trim() || 'Low day', ord: list().length, start: null, short: 6 });
  return id;
}
const patchFlow = (fid, ch) => R().patch('flow', null, fid, ch);
function addBox(fid, o) {
  const id = uid('b');
  R().set('fbox', null, fid + '|' + id, Object.assign({ name: 'New box', kind: 'g', x: 0, y: 0, at: null, floor: 0 }, o || {}));
  const f = get(fid);
  if (f && !f.start) patchFlow(fid, { start: id });
  return id;
}
const patchBox = (fid, bid, ch) => R().patch('fbox', null, fid + '|' + bid, ch);
function delBox(fid, bid) {
  arrows(fid).filter(a => a.a === bid || a.b === bid).forEach(a => R().del('farrow', null, fid + '|' + a.id));
  R().del('fbox', null, fid + '|' + bid);
  const f = get(fid);
  if (f && f.start === bid) { const b = boxes(fid)[0]; patchFlow(fid, { start: b ? b.id : null }); }
}
function addArrow(fid, a, b, o) {
  if (!a || !b || a === b) return null;
  const had = arrows(fid).find(x => x.a === a && x.b === b);
  if (had) return had.id;
  const id = uid('a');
  R().set('farrow', null, fid + '|' + id, Object.assign({ a: a, b: b, label: '', gap: null, sleep: null }, o || {}));
  return id;
}
const patchArrow = (fid, aid, ch) => R().patch('farrow', null, fid + '|' + aid, ch);
const delArrow = (fid, aid) => R().del('farrow', null, fid + '|' + aid);
function delFlow(fid) {
  boxes(fid).forEach(b => R().del('fbox', null, fid + '|' + b.id));
  arrows(fid).forEach(a => R().del('farrow', null, fid + '|' + a.id));
  R().del('flow', null, fid);
}

/* ── the walk ── */
function walk(fid, date) { const p = R().get('fwalk', date, fid); return p && Array.isArray(p.steps) ? p.steps : []; }
/** the walk he is on: the newest one begun today or yesterday whose last step
    is under OPEN_HOURS old. A walk that ends on a box with no way out is over. */
function active(fid, now) {
  now = now || Date.now();
  const t = D().of(now), all = arrows(fid);
  for (const d of [t, D().shift(t, -1)]) {
    const s = walk(fid, d);
    if (!s.length) continue;
    const last = s[s.length - 1];
    if (now - last.t > OPEN_HOURS * 3600e3) continue;
    return { date: d, steps: s, box: last.box, over: !outOf(fid, last.box, all).length };
  }
  return null;
}
/** where he is, and every way out of it */
function here(fid, now) {
  const f = get(fid); if (!f) return null;
  const w = active(fid, now), all = arrows(fid);
  if (!w || w.over) return { flow: f, walk: w, box: null, start: f.start ? box(fid, f.start) : null, ways: [] };
  return { flow: f, walk: w, box: box(fid, w.box), ways: outOf(fid, w.box, all).map(a => Object.assign({}, a, { to: box(fid, a.b) })).filter(a => a.to) };
}

/** Reach a box. `aid` is the arrow taken, or null for "I'm here". Writes the
    step, a tick for a box toward his goals, and a STATUS entry. Answers an
    undo. */
function reach(fid, bid, aid, now) {
  now = now || Date.now();
  const b = box(fid, bid); if (!b) return null;
  const w = active(fid, now);
  const date = w && !w.over ? w.date : D().of(now);
  const steps = walk(fid, date).slice();
  const a = aid ? arrow(fid, aid) : null;
  const step = { box: bid, arrow: aid || null, t: now };
  const day = D().of(now);
  if (b.kind === 'g') R().set('tick', day, slug(b.name), { src: 'flow' });
  if (entries() && g.Journal && g.Journal.add) {
    const text = b.name + (a && a.label ? ' (' + a.label + ')' : '');
    try { step.j = g.Journal.add(day, 'entry', text, { at: hhmm(now), parsed: 1, src: 'flow' }, 'flow'); step.jd = day; } catch (e) {}
  }
  steps.push(step);
  R().set('fwalk', date, fid, { steps: steps });
  return () => undo(fid, date, now);
}
function undo(fid, date, t) {
  const steps = walk(fid, date).slice();
  const i = steps.findIndex(s => s.t === t);
  if (i < 0) return;
  const s = steps.splice(i, 1)[0];
  const b = box(fid, s.box), day = D().of(s.t);
  if (b && b.kind === 'g' && !reachedOn(day, b.name, s.t)) R().del('tick', day, slug(b.name));
  if (s.j) { R().del('note', s.jd || day, s.j); if (g.Journal && g.Journal.publishNotes) try { g.Journal.publishNotes(s.jd || day, 'flow'); } catch (e) {} }
  if (steps.length) R().set('fwalk', date, fid, { steps: steps }); else R().del('fwalk', date, fid);
}
/** another step anywhere reached a box of this name on that day */
function reachedOn(day, name, but) {
  return list().some(f => {
    const bs = boxes(f.id), ids = bs.filter(b => b.name === name).map(b => b.id);
    return [day, D().shift(day, -1)].some(d => walk(f.id, d).some(s => s.t !== but && ids.indexOf(s.box) > -1 && D().of(s.t) === day));
  });
}
const entries = () => R().setting('block', 'flowEntries') !== 0;

/* ── times ahead ──
   From the box he is on, at the moment he reached it. An arrow with a gap
   times the next box from the one before; a box with its own `at` keeps it
   when no gap reaches it. First time found wins, nearest first. */
function times(fid, now) {
  const h = here(fid, now), out = {};
  if (!h || !h.box) return out;
  const last = h.walk.steps[h.walk.steps.length - 1];
  const all = arrows(fid), bs = {}; boxes(fid).forEach(b => { bs[b.id] = b; });
  const q = [[h.box.id, last.t]];
  const seen = {}; seen[h.box.id] = 1;
  while (q.length) {
    const [id, t] = q.shift();
    outOf(fid, id, all).forEach(a => {
      if (seen[a.b] || !bs[a.b]) return;
      let nt = null;
      if (t != null && a.gap != null) nt = t + a.gap * 60e3;
      else if (bs[a.b].at) nt = atOn(bs[a.b].at, t || last.t);
      seen[a.b] = 1;
      if (nt != null) out[a.b] = nt;
      q.push([a.b, nt]);
    });
  }
  return out;
}
/** 'HH:MM' as the next such moment at or after `after` */
function atOn(at, after) {
  const p = String(at).split(':'), d = new Date(after);
  d.setHours(+p[0] || 0, +p[1] || 0, 0, 0);
  if (+d < after - 30 * 60e3) d.setDate(d.getDate() + 1);
  return +d;
}

/* ── how often each way was taken ──
   Over the walks begun in the last `days` days: an arrow's `n` is the times
   it was taken, `of` the times its box was left by any arrow. A count,
   never a grade. */
function counts(fid, days, end) {
  const out = {}, all = arrows(fid), left = {};
  D().last(days || 14, end).forEach(d => {
    walk(fid, d).forEach(s => {
      if (!s.arrow) return;
      const a = all.find(x => x.id === s.arrow); if (!a) return;
      (out[a.id] = out[a.id] || { n: 0, of: 0 }).n++;
      left[a.a] = (left[a.a] || 0) + 1;
    });
  });
  all.forEach(a => { if (out[a.id] || left[a.a]) (out[a.id] = out[a.id] || { n: 0, of: 0 }).of = left[a.a] || 0; });
  return out;
}
/** each arrow out of a box that branches, with the days it was taken */
function lookBack(fid, days) {
  const all = arrows(fid), took = {};
  D().last(days || 30).forEach(d => walk(fid, d).forEach(s => { if (s.arrow) (took[s.arrow] = took[s.arrow] || []).push(d); }));
  const from = {};
  all.forEach(a => { (from[a.a] = from[a.a] || []).push(a); });
  return Object.keys(from).filter(b => from[b].length > 1).map(b => ({
    box: box(fid, b), ways: from[b].map(a => ({ arrow: a, to: box(fid, a.b), days: took[a.id] || [] })),
  })).filter(x => x.box);
}

/* ── a red box with no way back ──
   His 2020 chart's best feature: every bad path has a way back. A box away
   from his goals from which no box toward them can be reached is flagged. */
function noWayBack(fid) {
  const bs = boxes(fid), all = arrows(fid), kind = {};
  bs.forEach(b => { kind[b.id] = b.kind; });
  return bs.filter(b => b.kind === 'r').filter(b => {
    const seen = {}, q = [b.id];
    while (q.length) {
      const id = q.shift();
      for (const a of all) if (a.a === id && !seen[a.b]) {
        if (kind[a.b] === 'g') return false;
        seen[a.b] = 1; q.push(a.b);
      }
    }
    return true;
  }).map(b => b.id);
}

/* ── the floor ──
   The smallest day that still counts. Met on a day when every floor box of
   a flow was reached that day. */
const floor = fid => boxes(fid).filter(b => b.floor).map(b => b.id);
function floorMet(day) {
  return list().some(f => {
    const need = floor(f.id); if (!need.length) return false;
    const got = {};
    [day, D().shift(day, -1)].forEach(d => walk(f.id, d).forEach(s => { if (D().of(s.t) === day) got[s.box] = 1; }));
    return need.every(id => got[id]);
  });
}

/* ── last night's sleep ──
   STATUS's `sleep` readings (typed, or sent by the iPhone), on the day he
   woke. The newest reading that day, in hours. */
function sleep(day) {
  const p = R().get('ev', day || D().today(), 'sleep');
  const e = p && Array.isArray(p.e) ? p.e.filter(x => x && x.v != null && isFinite(+x.v)) : [];
  if (!e.length) return null;
  e.sort((a, b) => (a.t || 0) - (b.t || 0));
  return +e[e.length - 1].v;
}
/** the way out of where he is that last night's sleep points to, if any */
function suggest(fid, now) {
  const h = here(fid, now);
  if (!h || !h.box) return null;
  const hrs = sleep(D().of(now || Date.now()));
  if (hrs == null) return null;
  const short = hrs < (+h.flow.short || 6);
  const a = h.ways.find(w => w.sleep === (short ? 'short' : 'enough'));
  return a ? { arrow: a, hours: hrs, short: short } : null;
}

const hours = h => { const m = Math.round(h * 60); return Math.floor(m / 60) + 'h' + (m % 60 ? ' ' + m % 60 + 'm' : ''); };
function clock(ms) {
  const d = new Date(ms); let h = d.getHours(); const ap = h < 12 ? 'am' : 'pm';
  h = h % 12 || 12;
  return h + ':' + pad(d.getMinutes()) + ap;
}

g.Flow = {
  VERSION: '0.1.0', KINDS: KINDS, TYPES: ['flow', 'fbox', 'farrow', 'fwalk'],
  list: list, get: get, boxes: boxes, arrows: arrows, box: box, arrow: arrow, outOf: outOf,
  make: make, patchFlow: patchFlow, delFlow: delFlow,
  addBox: addBox, patchBox: patchBox, delBox: delBox,
  addArrow: addArrow, patchArrow: patchArrow, delArrow: delArrow,
  walk: walk, active: active, here: here, reach: reach, undo: undo,
  times: times, counts: counts, lookBack: lookBack, noWayBack: noWayBack,
  floor: floor, floorMet: floorMet, sleep: sleep, suggest: suggest,
  slug: slug, clock: clock, hours: hours, entries: entries,
};
})(typeof window !== 'undefined' ? window : this);
