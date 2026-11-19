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

/* ══ THE TRAVEL CARD (0.2.0, 2026-11-18) ══
   Tom: "put the block I'm currently on the top layer, and then show me the
   next 2 levels", "travel down the list", "cool animations as I travel from
   block to block". The home screen's FLOW card and the FLOW phone app both
   draw it with `Flow.card(host, {fid})`, so they cannot disagree.

   Travelling only looks. I'M HERE moves him there and logs every block on
   the way, each with the arrow it was reached by; BACK TO NOW returns to
   where he really is. Where he was looking survives a redraw (CS). */
const CS = {};
let inks = {}, cardCssDone = false;
const CARD_CSS = `
.flc{display:flex;flex-direction:column;position:relative;min-width:0}
.flc-stage{position:relative;display:flex;flex-direction:column;min-width:0}
.flc-b{position:relative;border:0;font:inherit;color:var(--text-1,CanvasText);border-radius:var(--radius-sm,4px);
  display:flex;flex-direction:column;justify-content:center;text-align:left;cursor:pointer;
  -webkit-user-select:none;user-select:none;overflow:hidden;overflow-wrap:normal;word-break:normal;line-height:1.2;
  font-family:var(--font-display,inherit);font-weight:var(--w-bold,600)}
.flc-b:not(.mb-plate){background:var(--surface-1,Canvas);border:1px solid var(--k);box-shadow:inset var(--s-1,4px) 0 0 var(--k)}
.flc-top{min-height:var(--s-10,96px);padding:var(--s-3,12px) var(--s-4,16px);cursor:default;z-index:1}
.flc-top .n{font-size:var(--f-5,20px)}
.flc-notes{display:flex;flex-direction:column;gap:var(--s-1,4px);margin-top:var(--s-2,8px);font-family:var(--font-body,inherit);
  font-size:var(--f-1,12px);font-weight:var(--w-body,500);color:var(--text-2,CanvasText);line-height:1.3}
.flc-note{display:block}
.flc-dot{position:relative;z-index:1;width:var(--s-5,24px);height:var(--s-5,24px);margin-left:calc(var(--s-6,32px)/2 - var(--s-5,24px)/2);
  border-radius:50%;background:var(--accent,Highlight);box-shadow:0 0 0 var(--s-1,4px) color-mix(in srgb,var(--accent,Highlight) 25%,transparent)}
.flc-ways{display:flex;flex-direction:column;gap:var(--s-3,12px);padding:var(--s-6,32px) 0 0 var(--s-6,32px);position:relative;z-index:1}
.flc-way{min-height:var(--s-8,64px);padding:var(--s-2,8px) var(--s-4,16px)}
.flc-way .w{display:block;font-family:var(--font-body,inherit);font-weight:var(--w-body,500);font-size:var(--f-1,12px);color:var(--text-2,CanvasText);margin-top:var(--s-1,4px)}
.flc-way.sug{outline:2px solid var(--accent,Highlight);outline-offset:2px}
.flc-say{font-size:var(--f-1,12px);color:var(--text-muted,GrayText)}
.flc-ways .flc-say{padding:var(--s-2,8px) 0}
.flc-wires{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:0}
.flc-wires path{fill:none;stroke:var(--border-strong,GrayText);stroke-width:2;stroke-linejoin:round}
.flc-wires .hd{fill:var(--border-strong,GrayText);stroke:none}
.flc-ghost{position:absolute;pointer-events:none;z-index:5;margin:0}
@media (hover:hover){.flc-way:hover{filter:brightness(1.1)}}
`;
function cardCss() {
  if (cardCssDone || typeof document === 'undefined' || !document.head) return;
  cardCssDone = true;
  const s = document.createElement('style'); s.id = 'mb-flow-card-css'; s.textContent = CARD_CSS;
  document.head.insertBefore(s, document.head.firstChild);
}
/* the darker or the lighter text, whichever reads on this kind's fill in
   the theme worn. Measured, so a light theme gets dark words. */
function ink(kind) {
  const tok = (KINDS[kind] || KINDS.g).token, cs = getComputedStyle(document.documentElement);
  const val = cs.getPropertyValue(tok).trim(), key = tok + val;
  if (inks[key]) return inks[key];
  const c = document.createElement('canvas').getContext('2d');
  const lum = v => { c.clearRect(0, 0, 1, 1); c.fillStyle = 'black'; c.fillStyle = v || 'black'; c.fillRect(0, 0, 1, 1);
    const d = c.getImageData(0, 0, 1, 1).data, f = x => (x /= 255) <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4);
    return .2126 * f(d[0]) + .7152 * f(d[1]) + .0722 * f(d[2]); };
  const ratio = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  const fill = lum(val), dark = lum(cs.getPropertyValue('--bg').trim()), light = lum(cs.getPropertyValue('--text-1').trim());
  return (inks[key] = ratio(fill, dark) >= ratio(fill, light) ? 'var(--bg)' : 'var(--text-1)');
}
const kvar = k => 'var(' + (KINDS[k] || KINDS.g).token + ')';
const gapWords = m => m == null ? '' : m === 0 ? 'Immediately' : m < 60 ? m + ' min' : Math.floor(m / 60) + ' hr' + (m % 60 ? ' ' + m % 60 + ' min' : '');
const E = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const X = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const still = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/** the flow BLOCK has open, else the first */
function openFlow() {
  const o = R().setting('block', 'flowOpen') || {}, all = list();
  return (all.find(f => f.id === o.fid) || all[0] || {}).id || null;
}

const fits = el => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1;
/** the largest size, max down to min, at which the words fit the block on
    whole words. Answers the size; a block that cannot hold them at min is
    left at min for the caller to let grow. */
function fit(el, max, min) {
  el.classList.remove('grow'); el.style.minHeight = '';
  for (let f = max; f >= min; f--) { el.style.fontSize = f + 'px'; if (fits(el)) return f; }
  el.style.fontSize = min + 'px';
  return min;
}
/* the top block: its name shrinks, its notes stay readable */
function fitTop(top) {
  const n = top.querySelector('.n'), inn = top.querySelector('.in');
  top.classList.remove('grow');
  const cs = getComputedStyle(top), room = top.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  for (let f = 30; f >= 14; f--) { n.style.fontSize = f + 'px'; if (inn.offsetHeight <= room + 1 && inn.scrollWidth <= inn.clientWidth + 1) return; }
  top.classList.add('grow');
}
/** a line written where he is: a STATUS bullet, kept on the step he is on
    so the block he is at shows it (Tom, 2026-11-18). */
function note(fid, text, kind, now) {
  now = now || Date.now();
  const day = D().of(now);
  if (!g.Journal || !g.Journal.add || !String(text || '').trim()) return null;
  /* an Entry at the minute it was typed, the words kept as typed (Tom, 2026-11-18) */
  const key = g.Journal.add(day, kind || 'entry', String(text).trim(), { at: hhmm(now), parsed: 1 }, 'flow');
  const w = fid ? active(fid, now) : null;
  if (w && w.steps.length) {
    const steps = w.steps.slice(), i = steps.length - 1;
    steps[i] = Object.assign({}, steps[i], { n: (steps[i].n || []).concat({ k: key, d: day }) });
    R().set('fwalk', w.date, fid, { steps: steps });
  }
  return { key: key, day: day, kept: !!(w && w.steps.length) };
}

/* ── samples ──
   'day' (Tom, 2026-11-18: "a better sample flow chart based off what I gave
   you initially ... Start it with asking me how I woke up"): his 2020 chart
   reordered to start at waking, no box with more than three ways out, and a
   way back from every red box. '2020' is the picture as he drew it. Laid out
   on BLOCK's grid: columns 192 apart, rows 108, from 48 in. */
const SG = { grid: 12, col: 192, row: 108, pad: 48 };
const SAMPLES = {
  day: { name: 'My day', start: 'ask',
    boxes: [['ask', 'How did you wake up?', 't', 2, 0], ['good', 'Woke up good', 'g', 1, 1], ['bad', 'Woke up bad', 'r', 3, 1],
      ['fix', 'Fix bed', 'g', 1, 2], ['lie', 'Lie there for a bit', 'r', 3, 2], ['more', 'Try for more sleep', 'g', 4, 2],
      ['teeth', 'Brush teeth, wash face', 'g', 1, 3, 1], ['walk', 'Morning walk, sunlight', 'g', 2, 3], ['weigh', 'Weigh in', 'g', 1, 4],
      ['salt', 'Salt drink', 'g', 1, 5, 1], ['client', 'Client check-ins', 'g', 2, 5], ['caf', 'Caffeine', 'g', 1, 6],
      ['stories', 'Stories and a post', 'g', 2, 6], ['train', 'Train', 'g', 1, 7], ['light', 'Light session, mobility', 'g', 2, 7],
      ['reset', 'Reset gym, shower, meal', 'g', 1, 8], ['nap', 'Power nap', 'd', 3, 8], ['work', "To-do's and deep work", 'g', 1, 9],
      ['stuck', 'Stuck, scrolling', 'r', 3, 9], ['down', 'Down time', 'd', 2, 10], ['make', 'Make content', 'g', 1, 11],
      ['book', 'Read a book', 'g', 2, 11], ['scroll', 'Scroll or games', 'r', 3, 11], ['night', 'Night routine alarm', 't', 2, 12],
      ['bag', 'Bag and clothes for tomorrow', 'g', 1, 13], ['todo', "Tomorrow's to-do's", 'g', 2, 13], ['shower', 'Shower, Daylio', 'g', 2, 14],
      ['alarm', 'Bed time alarm', 't', 2, 15], ['sleep', 'Lights out, phone away', 'g', 1, 16], ['late', 'Phone in bed', 'r', 3, 16],
      ['crave', 'Craving junk food', 't', 5, 5], ['plan', 'Eat on plan', 'g', 4, 6], ['junk', 'Eat junk food', 'r', 6, 6],
      ['water', 'Water, wait 10 min', 'g', 5, 7], ['feel', 'Feel bad about it', 'r', 6, 7]],
    arrows: [['ask', 'good', 'Good', null, 'enough'], ['ask', 'bad', 'Bad', null, 'short'], ['ask', 'fix', 'Okay'],
      ['good', 'fix', 'Immediately', 0], ['good', 'walk', 'Walk first'], ['good', 'teeth', 'Skip the bed', 0],
      ['bad', 'fix', 'Try to have a nice day'], ['bad', 'teeth', 'Essentials only', 0], ['bad', 'lie', 'Too flat'],
      ['lie', 'teeth', 'Get up eventually'], ['lie', 'more', 'Still tired'], ['lie', 'walk', 'Get some light'],
      ['more', 'good', 'Woke up better', null, null, 1], ['more', 'bad', 'Still flat'],
      ['fix', 'teeth', '', 0], ['fix', 'walk', 'Walk first'],
      ['walk', 'teeth', 'Back home'], ['walk', 'salt', 'Already washed'],
      ['teeth', 'weigh', '', 0], ['teeth', 'salt', 'Skip the weigh-in'],
      ['weigh', 'salt', '', 0], ['weigh', 'client', 'Clients first'],
      ['salt', 'caf', '', 75], ['salt', 'client', 'Clients first'], ['salt', 'train', 'Train fasted'],
      ['client', 'stories', ''], ['client', 'caf', 'Skip stories'],
      ['stories', 'caf'], ['stories', 'work', 'Rest day'],
      ['caf', 'train', '', 15], ['caf', 'light', 'Low energy'], ['caf', 'work', 'Rest day'],
      ['train', 'reset', '', 5], ['light', 'reset', '', 5],
      ['reset', 'work', '', 30], ['reset', 'nap', 'Wiped out'],
      ['nap', 'work', '20 min, then'],
      ['work', 'down', "All to-do's done"], ['work', 'stuck', 'Lost focus'], ['work', 'night', 'Ran late'],
      ['stuck', 'work', '10 min walk, then', null, null, 1], ['stuck', 'down', 'Call it'],
      ['down', 'make'], ['down', 'book'], ['down', 'scroll'],
      ['make', 'night'], ['make', 'book', 'Wind down'],
      ['book', 'night'], ['book', 'alarm', 'Early night'],
      ['scroll', 'book', '30 min, then'], ['scroll', 'night', 'Alarm goes off'], ['scroll', 'late', 'Kept going'],
      ['night', 'bag', 'Immediately', 0], ['night', 'todo', 'Bag is ready', 0], ['night', 'shower', 'Short version'],
      ['bag', 'todo', '', 0], ['todo', 'shower', '', 0], ['shower', 'alarm', 'Some down time'],
      ['alarm', 'sleep', 'Follow'], ['alarm', 'late', 'Ignore'], ['late', 'sleep', 'Put the phone away'], ['sleep', 'ask', 'Next morning'],
      ['crave', 'plan', 'Ignore'], ['crave', 'water', 'Not sure'], ['crave', 'junk', 'Follow'],
      ['water', 'plan', 'Gone'], ['water', 'junk', 'Still there'],
      ['junk', 'feel'], ['junk', 'plan', 'Small portion, move on'], ['feel', 'plan', 'Next meal on plan']] },
  '2020': { name: '2020 day', start: 'alarm',
    boxes: [['alarm', 'Bed time alarm', 't', 2, 0], ['bed', 'Go to bed on time, Proper sleep prep, ZMA', 'g', 1, 1], ['tape', "Play tomorrow's videotape", 'g', 0, 1],
      ['late', 'Sleep Late, Bring phone to bed, No ZMA', 'r', 3, 1], ['well', 'Sleep well', 'g', 1, 2], ['sbad', 'Sleep bad', 'r', 3, 2],
      ['good', 'Wake up good', 'g', 1, 3], ['wbad', 'Wake up bad', 'r', 3, 3], ['fix', 'Fix Bed', 'g', 1, 4], ['lie', 'Lie there for a bit', 'r', 3, 4],
      ['more', 'Try to get some more sleep', 'g', 4, 4], ['teeth', 'Brush Teeth, Wash Face, Poop', 'g', 1, 5, 1], ['down', 'Down time', 'd', 3, 5],
      ['post', 'Write post', 'g', 4, 5], ['weigh', 'Weigh in, Record', 'g', 1, 6], ['night', 'Night routine alarm', 't', 3, 6], ['book', 'Read a book', 'g', 4, 6],
      ['salt', 'Salt Drink, 2 Scoops, Sunlight Exposure', 'g', 1, 7, 1], ['client', 'Client Check-ins', 'g', 2, 7], ['bag', "Prepare tomorrow's bag and clothes", 'g', 3, 7],
      ['content', 'Make content', 'g', 4, 7], ['caf', 'Caffeine, Pre-training shower', 'g', 1, 8], ['stories', 'Make stories and post', 'g', 2, 8],
      ['todo', "Write tomorrow's to-do's", 'g', 3, 8], ['watch', 'Watch something', 'r', 4, 8], ['train', 'Train', 'g', 1, 9], ['bujo', 'BuJoToDo sync', 'g', 3, 9],
      ['games', 'Video games', 'r', 4, 9], ['reset', 'Reset Gym, Post-training Shower, Post-training meal', 'g', 1, 10], ['daylio', 'Daylio', 'g', 3, 10],
      ['browse', 'Idle browsing', 'r', 4, 10], ['check', "Check and accomplish to-do's", 'g', 1, 11], ['shower', 'Shower', 'g', 3, 11],
      ['manga', 'Read manga/webcomics', 'r', 4, 11], ['crave', 'Sudden cravings for junk food', 't', 4, 2], ['plan', 'Eat on plan food', 'g', 5.5, 1],
      ['avoid', 'Avoid going off track', 'g', 5.5, 2], ['junk', 'Eat junk food', 'r', 5.5, 3], ['feel', 'Feel bad for going off track', 'r', 5.5, 4]],
    arrows: [['alarm', 'bed', 'Follow'], ['alarm', 'late', 'Ignore'], ['bed', 'tape'], ['tape', 'well'], ['bed', 'well', '', null, 'enough'], ['bed', 'sbad', 'Insomnia', null, 'short'],
      ['late', 'sbad'], ['well', 'good', '7-8 hrs'], ['sbad', 'wbad'], ['wbad', 'fix', 'Try to have a nice day'], ['wbad', 'lie'], ['wbad', 'teeth', 'Essentials only'],
      ['lie', 'teeth', 'Get up eventually'], ['lie', 'more'], ['more', 'wbad'], ['more', 'good', '', null, null, 1],
      ['good', 'fix', '', 0], ['fix', 'teeth', '', 0], ['teeth', 'weigh', '', 0], ['weigh', 'salt', '', 0], ['salt', 'client'], ['client', 'stories'], ['stories', 'caf'],
      ['salt', 'caf', '', 75], ['caf', 'train', '', 15], ['train', 'reset', '', 5], ['reset', 'check', '', 30], ['check', 'down', "All to-do's done"],
      ['down', 'post'], ['down', 'book'], ['down', 'content'], ['down', 'watch'], ['down', 'games'], ['down', 'browse'], ['down', 'manga'], ['down', 'night'],
      ['night', 'bag', '', 0], ['bag', 'todo', '', 0], ['todo', 'bujo', '', 0], ['bujo', 'daylio', '', 0], ['daylio', 'shower', '', 0], ['shower', 'alarm', 'Some down time'],
      ['crave', 'plan', 'Ignore'], ['crave', 'junk', 'Follow'], ['plan', 'avoid'], ['junk', 'feel']] },
};
/** make one of the samples as a new flow; answers its id */
function sample(which) {
  const S = SAMPLES[which] || SAMPLES.day, id = make(S.name), B = {};
  const at = (c, r) => ({ x: SG.pad + Math.round(c * SG.col / SG.grid) * SG.grid, y: SG.pad + r * SG.row });
  S.boxes.forEach(r => { B[r[0]] = addBox(id, Object.assign({ name: r[1], kind: r[2], at: null, floor: r[5] || 0 }, at(r[3], r[4]))); });
  patchFlow(id, { start: B[S.start] });
  S.arrows.forEach(r => addArrow(id, B[r[0]], B[r[1]], { label: r[2] || '', gap: r[3] == null ? null : r[3], sleep: r[4] || null, dash: r[5] || 0 }));
  return id;
}

function card(host, o) {
  cardCss();
  o = o || {};
  const fid = o.fid || openFlow();
  host.classList.add('flc');
  host.innerHTML = '';
  if (!fid || !get(fid)) { host.appendChild(E('div', 'flc-say', 'No flows.')); if (o.empty) o.empty(host); return; }
  const h = here(fid), real = h && h.box ? h.box.id : null;
  let st = CS[fid];
  if (!st || st.now !== real) st = CS[fid] = { now: real };
  paint(host, fid, st, o);
}

/* Top down, one step at a time (Tom, 2026-11-19: "Travel should be from top
   down", "just show the next set of options", lines like his 2020 chart, no
   arrow words, no "you are here"). The block he is at sits on top; one line
   runs down the left and branches right into every way out, each with an
   arrowhead, as his chart's Down time fans. Pressing a way IS going there:
   the step is written (with Undo), the block rises to the top and the next
   ways drop in below. Before the day starts, a gold point stands on top and
   the start block is the one way. */
function paint(host, fid, st, o) {
  host.innerHTML = '';
  const all = arrows(fid), bs = {}; boxes(fid).forEach(b => { bs[b.id] = b; });
  const cur = st.now ? bs[st.now] : null, start = get(fid) && bs[get(fid).start];
  const stage = E('div', 'flc-stage');
  host.appendChild(stage);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'flc-wires');
  stage.appendChild(svg);
  let top;
  if (cur) {
    const wk = active(fid), last = wk && wk.steps[wk.steps.length - 1];
    const lines = (last && last.n || []).map(x => R().get('note', x.d, x.k)).filter(x => x && x.text).slice(-3);
    top = E('div', 'flc-b flc-top mb-plate', '<span class="n">' + X(cur.name) + '</span>' +
      (lines.length ? '<span class="flc-notes">' + lines.map(x => '<span class="flc-note">' + X(x.text) + '</span>').join('') + '</span>' : ''));
    top.style.setProperty('--c', kvar(cur.kind)); top.style.setProperty('--k', kvar(cur.kind));
  } else top = E('div', 'flc-dot');
  top.dataset.top = '1';
  stage.appendChild(top);
  let ways = cur ? all.filter(a => a.a === cur.id && bs[a.b]) : start ? [{ id: null, b: start.id }] : [];
  const sug = cur ? suggest(fid) : null;
  if (sug) ways = [ways.find(w => w.id === sug.arrow.id)].concat(ways.filter(w => w.id !== sug.arrow.id)).filter(Boolean);
  const list = E('div', 'flc-ways');
  if (!ways.length) list.appendChild(E('div', 'flc-say', cur ? 'Nothing comes after this block.' : 'This flow has no start block yet.'));
  ways.forEach(w => {
    const b = bs[w.b], isSug = sug && sug.arrow.id === w.id;
    const m = E('button', 'flc-b flc-way mb-plate mb-press' + (isSug ? ' sug' : ''), '<span class="n">' + X(b.name) + '</span>' +
      (isSug ? '<span class="w">Slept ' + hours(sug.hours) + '</span>' : ''));
    m.type = 'button'; m.title = b.name; m.dataset.id = w.b;
    m.style.setProperty('--c', kvar(b.kind)); m.style.setProperty('--k', kvar(b.kind));
    m.onclick = () => go(host, fid, st, o, w, m);
    list.appendChild(m);
  });
  stage.appendChild(list);
  /* his words are never cut: each block shrinks its name to fit, then wraps */
  const fitAll = () => {
    if (cur) fitName(top.querySelector('.n'), 20, 14);
    list.querySelectorAll('.flc-way .n').forEach(n => fitName(n, 18, 12));
  };
  fitAll();
  const draw = () => wires(stage, svg, top, list, !o.quiet);
  if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(() => { if (host.contains(top)) { fitAll(); wires(stage, svg, top, list, false); } });
  if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(draw); else draw();
  o.quiet = false;
}
/* one line where it fits, from max down to min; under min it wraps */
function fitName(n, max, min) {
  if (!n) return;
  n.style.whiteSpace = 'nowrap';
  for (let f = max; f >= min; f--) { n.style.fontSize = f + 'px'; if (n.scrollWidth <= n.clientWidth + 1) return; }
  n.style.whiteSpace = ''; n.style.fontSize = min + 'px';
}

/* His chart's lines: one trunk down the left from the block on top, a
   right-angle branch with a rounded corner into each way, an arrowhead at
   each end. */
function wires(stage, svg, top, list, grow) {
  const o = stage.getBoundingClientRect();
  if (!o.width) return;
  const R2 = e => { const r = e.getBoundingClientRect(); return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height }; };
  const t = R2(top), ways = [...list.querySelectorAll('.flc-way')];
  if (!ways.length) { svg.innerHTML = ''; return; }
  const x0 = R2(list).x / 2, y0 = t.y + t.h, rad = 6, hd = 5, d = [], heads = [];
  ways.forEach(w => {
    const r = R2(w), y = r.y + r.h / 2, x1 = r.x - 2;
    d.push('M' + x0 + ',' + y0 + ' L' + x0 + ',' + (y - rad) + ' Q' + x0 + ',' + y + ' ' + (x0 + rad) + ',' + y + ' L' + (x1 - hd) + ',' + y);
    heads.push('M' + x1 + ',' + y + ' L' + (x1 - hd * 1.6) + ',' + (y - hd) + ' L' + (x1 - hd * 1.6) + ',' + (y + hd) + 'Z');
  });
  svg.innerHTML = d.map(p => '<path d="' + p + '"/>').join('') + heads.map(p => '<path class="hd" d="' + p + '"/>').join('');
  if (!grow || still()) return;
  svg.querySelectorAll('path:not(.hd)').forEach((p, i) => {
    const L = p.getTotalLength ? p.getTotalLength() : 0; if (!L) return;
    p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
    p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 420, delay: 120 + i * 50, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' });
  });
  svg.querySelectorAll('.hd').forEach((p, i) => p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: 460 + i * 50, fill: 'backwards' }));
}
/* the next ways drop in from above, one after another */
function drop(host) {
  if (still()) return;
  host.querySelectorAll('.flc-way, .flc-ways .flc-say').forEach((c, i) => c.animate([{ opacity: 0, transform: 'translateY(-16px)' }, { opacity: 1, transform: 'none' }],
    { duration: 320, delay: 200 + i * 60, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
}
/* Pressing a way: the step is written, the block pressed flies up into the
   top slot, the old top lifts away, and the ways after it drop in. One Undo. */
function go(host, fid, st, o, w, from) {
  const b = box(fid, w.b);
  const un = reach(fid, w.b, w.id);
  const pos = getComputedStyle(host).position;
  if (pos === 'static') host.style.position = 'relative';
  const hr = host.getBoundingClientRect(), f = from.getBoundingClientRect();
  const ghost = from.cloneNode(true); ghost.classList.add('flc-ghost');
  Object.assign(ghost.style, { left: (f.left - hr.left) + 'px', top: (f.top - hr.top) + 'px', width: f.width + 'px', height: f.height + 'px' });
  const oldTop = host.querySelector('[data-top]'), ot = oldTop.getBoundingClientRect();
  const old = oldTop.cloneNode(true); old.classList.add('flc-ghost');
  Object.assign(old.style, { left: (ot.left - hr.left) + 'px', top: (ot.top - hr.top) + 'px', width: ot.width + 'px', height: ot.height + 'px' });
  delete CS[fid];
  if (o.onPick) o.onPick();
  o.quiet = false;
  card(host, o);
  if (!still()) {
    host.appendChild(old); host.appendChild(ghost);
    const tb = host.querySelector('[data-top]'), t = tb.getBoundingClientRect();
    tb.style.visibility = 'hidden';
    old.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-32px)' }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).onfinish = () => old.remove();
    const end = () => { ghost.remove(); old.remove(); tb.style.visibility = ''; };
    ghost.animate([
      { left: ghost.style.left, top: ghost.style.top, width: ghost.style.width, height: ghost.style.height },
      { left: (t.left - hr.left) + 'px', top: (t.top - hr.top) + 'px', width: t.width + 'px', height: t.height + 'px' }
    ], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }).onfinish = end;
    setTimeout(end, 700);             /* a page not being drawn never finishes an animation */
    drop(host);
  }
  if (un && g.UI && g.UI.undo) g.UI.undo('At ' + X(b ? b.name : ''), () => { un(); delete CS[fid]; card(host, o); if (o.onPick) o.onPick(); });
}

g.Flow = {
  VERSION: '0.5.0', card: card, fit: fit, note: note, sample: sample, openFlow: openFlow, ink: ink, KINDS: KINDS, TYPES: ['flow', 'fbox', 'farrow', 'fwalk'],
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
