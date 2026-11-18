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
.flc{display:flex;flex-direction:column;gap:var(--s-3,12px);position:relative;min-width:0}
.flc-trail{display:flex;gap:var(--s-1,4px);align-items:center;flex-wrap:wrap}
.flc-crumb{position:relative;display:inline-flex;align-items:center;gap:var(--s-1,4px);min-height:var(--s-6,32px);padding:0 var(--s-2,8px);
  border:1px solid var(--border,GrayText);border-radius:var(--radius-sm,4px);background:var(--bg,Canvas);color:var(--text-2,CanvasText);
  font:inherit;font-size:var(--f-1,12px);cursor:pointer}
.flc-crumb::after{content:'';position:absolute;left:0;right:0;top:50%;height:var(--tap,44px);transform:translateY(-50%)}
.flc-crumb i{width:var(--s-2,8px);height:var(--s-2,8px);border-radius:var(--radius-sm,4px);background:var(--k)}
.flc-sep{color:var(--text-muted,GrayText);font-size:var(--f-1,12px)}
.flc-stage{position:relative;display:flex;flex-direction:column;gap:var(--s-4,16px);min-width:0}
.flc-b{position:relative;border:0;font:inherit;background:var(--k);color:var(--ink);border-radius:var(--radius-sm,4px);
  display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;cursor:pointer;
  -webkit-user-select:none;user-select:none;overflow-wrap:anywhere}
.flc-top{min-height:var(--s-9,96px);padding:var(--s-4,16px);cursor:default}
.flc-top .n{font-family:var(--font-display,inherit);font-size:var(--f-5,20px);font-weight:var(--w-bold,700);line-height:1.2}
.flc-top .s{font-size:var(--f-1,12px);margin-top:var(--s-1,4px);opacity:.85}
.flc-top.now{box-shadow:0 0 0 3px var(--surface-1,Canvas),0 0 0 5px var(--accent,Highlight)}
.flc-top.now::after{content:'';position:absolute;inset:-5px;border-radius:var(--radius-md,8px);box-shadow:0 0 0 2px var(--accent,Highlight);
  animation:flc-pulse 2.4s ease-out infinite;pointer-events:none}
@keyframes flc-pulse{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.06)}}
.flc-acts{display:flex;gap:var(--s-2,8px);flex-wrap:wrap}
.flc-acts .mb-btn{flex:1}
.flc-row{display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));gap:var(--s-4,16px);position:relative;z-index:1}
.flc-col{display:flex;flex-direction:column;min-width:0}
.flc-zone{display:flex;align-items:flex-end;justify-content:center;min-height:var(--s-8,64px);padding:var(--s-5,24px) 0 var(--s-2,8px)}
.flc-zone2{display:flex;align-items:center;justify-content:center;min-height:var(--s-7,48px);padding:var(--s-2,8px) 0}
.flc-tag{position:relative;z-index:2;max-width:100%;padding:var(--s-1,4px) var(--s-2,8px);border:1px solid var(--border-strong,GrayText);
  border-radius:var(--radius-sm,4px);background:var(--bg,Canvas);color:var(--text-2,CanvasText);font-size:var(--f-1,12px);line-height:1.3;
  text-align:center;overflow-wrap:anywhere}
.flc-mid{min-height:var(--s-9,96px);padding:var(--s-3,12px);font-size:var(--f-3,16px);font-weight:var(--w-body,500);line-height:1.25}
.flc-sm{min-height:var(--s-8,64px);padding:var(--s-2,8px);font-size:var(--f-2,14px);line-height:1.25;opacity:.85}
.flc-pager{display:flex;justify-content:center}
.flc-more,.flc-say{font-size:var(--f-1,12px);color:var(--text-muted,GrayText);text-align:center;margin-top:var(--s-1,4px)}
.flc-wires{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:0}
.flc-wires path{fill:none;stroke:var(--border-strong,GrayText);stroke-width:1.5}
.flc-ghost{position:absolute;pointer-events:none;z-index:5;margin:0}
@media (hover:hover){.flc-mid:hover,.flc-sm:hover{filter:brightness(1.08)}}
@media (prefers-reduced-motion:reduce){.flc-top.now::after{animation:none}}
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

function card(host, o) {
  cardCss();
  o = o || {};
  const fid = o.fid || openFlow();
  host.classList.add('flc');
  host.innerHTML = '';
  if (!fid || !get(fid)) { host.appendChild(E('div', 'flc-say', 'No flows.')); if (o.empty) o.empty(host); return; }
  const h = here(fid), real = h && h.box ? h.box.id : null;
  let st = CS[fid];
  if (!st || st.now !== real || !box(fid, st.view)) st = CS[fid] = { now: real, view: real || (h && h.start ? h.start.id : null), trail: [] };
  if (!st.view) { host.appendChild(E('div', 'flc-say', 'This flow has no start box yet.')); return; }
  paint(host, fid, st, o);
}

function paint(host, fid, st, o) {
  host.innerHTML = '';
  const all = arrows(fid), bs = {}; boxes(fid).forEach(b => { bs[b.id] = b; });
  const v = bs[st.view], now = st.view === st.now, started = !!st.now;
  if (st.trail.length) {
    const tr = E('div', 'flc-trail');
    st.trail.forEach((id, i) => {
      const b = bs[id]; if (!b) return;
      const c = E('button', 'flc-crumb', '<i style="--k:' + kvar(b.kind) + '"></i>' + X(String(b.name).split(',')[0]));
      c.type = 'button'; c.title = b.name;
      c.onclick = () => back(host, fid, st, o, i, c);
      tr.appendChild(c); tr.appendChild(E('span', 'flc-sep', '›'));
    });
    host.appendChild(tr);
  }
  const stage = E('div', 'flc-stage');
  host.appendChild(stage);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'flc-wires');
  stage.appendChild(svg);
  const top = E('div', 'flc-b flc-top' + (now ? ' now' : ''),
    '<span class="n">' + X(v.name) + '</span><span class="s">' + (now ? 'You are here' : !started && !st.trail.length ? 'Not started' : 'Looking ahead') + '</span>');
  top.style.setProperty('--k', kvar(v.kind)); top.style.setProperty('--ink', ink(v.kind));
  top.dataset.top = '1';
  stage.appendChild(top);
  if (!now) {
    const acts = E('div', 'flc-acts');
    const go = E('button', 'mb-btn go mb-press mb-tap', started || st.trail.length ? "I'M HERE" : 'START HERE');
    go.type = 'button'; go.onclick = () => arrive(host, fid, st, o);
    acts.appendChild(go);
    if (started) { const bk = E('button', 'mb-btn mb-press mb-tap', 'BACK TO NOW'); bk.type = 'button'; bk.onclick = () => backNow(host, fid, st, o); acts.appendChild(bk); }
    stage.appendChild(acts);
  }
  /* up to three ways out across the card (Tom, 2026-11-18: "up to three
     different pathways"); more than three page through MORE WAYS. Last
     night's sleep puts its way first. */
  let ways = all.filter(a => a.a === v.id && bs[a.b]);
  const sug = now ? suggest(fid) : null;
  if (sug) ways = [ways.find(w => w.id === sug.arrow.id)].concat(ways.filter(w => w.id !== sug.arrow.id)).filter(Boolean);
  const pages = Math.ceil(ways.length / 3) || 1;
  st.page = (st.page || 0) % pages;
  const shown = ways.slice(st.page * 3, st.page * 3 + 3);
  const row = E('div', 'flc-row');
  row.style.setProperty('--n', Math.max(1, shown.length));
  if (!ways.length) row.appendChild(E('div', 'flc-say', 'Nothing comes after this block.'));
  const tag = words => words ? E('span', 'flc-tag', X(words)) : null;
  shown.forEach(w => {
    const col = E('div', 'flc-col');
    const z1 = E('div', 'flc-zone'), t1 = tag(w.label || gapWords(w.gap));
    if (t1) z1.appendChild(t1);
    if (sug && sug.arrow.id === w.id) z1.appendChild(Object.assign(E('span', 'flc-tag', 'Slept ' + hours(sug.hours)), { style: 'border-color:var(--accent);color:var(--accent);margin-left:var(--s-1)' }));
    col.appendChild(z1);
    const b = bs[w.b], m = E('button', 'flc-b flc-mid', X(b.name));
    m.type = 'button'; m.style.setProperty('--k', kvar(b.kind)); m.style.setProperty('--ink', ink(b.kind));
    m.onclick = () => travel(host, fid, st, o, [w.b], m);
    col.appendChild(m);
    const next = all.filter(a => a.a === w.b && bs[a.b]);
    if (next.length) {
      const n = next[0], c = bs[n.b];
      const z2 = E('div', 'flc-zone2'), t2 = tag(n.label || gapWords(n.gap));
      if (t2) z2.appendChild(t2);
      col.appendChild(z2);
      const sm = E('button', 'flc-b flc-sm', X(c.name));
      sm.type = 'button'; sm.style.setProperty('--k', kvar(c.kind)); sm.style.setProperty('--ink', ink(c.kind));
      sm.onclick = () => travel(host, fid, st, o, [w.b, n.b], sm);
      col.appendChild(sm);
      if (next.length > 1) col.appendChild(E('div', 'flc-more', '+' + (next.length - 1) + ' more after ' + X(String(b.name).split(',')[0])));
    }
    row.appendChild(col);
  });
  stage.appendChild(row);
  if (pages > 1) {
    const pg = E('div', 'flc-pager'), mb = E('button', 'mb-btn mb-press mb-tap', 'MORE WAYS (' + (ways.length - shown.length) + ')');
    mb.type = 'button'; mb.onclick = () => { st.page = (st.page + 1) % pages; paint(host, fid, st, o); rise(host); };
    pg.appendChild(mb); stage.appendChild(pg);
  }
  const draw = () => wires(stage, svg, top, row, !o.quiet);
  if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(draw); else draw();
  o.quiet = false;
}

/* right-angle wires: the top block down to each block in row two, and each
   of those down to its first next block */
function wires(stage, svg, top, row, grow) {
  const o = stage.getBoundingClientRect();
  if (!o.width) return;
  const R2 = e => { const r = e.getBoundingClientRect(); return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height }; };
  const t = R2(top), d = [];
  /* below the I'M HERE row when it is showing, so no line runs between the buttons */
  const acts = stage.querySelector('.flc-acts'), y0 = acts ? R2(acts).y + R2(acts).h : t.y + t.h;
  const mids = [...row.querySelectorAll('.flc-mid')];
  if (mids.length) {
    const busY = R2(row).y + 12, xs = mids.map(k => { const r = R2(k); return r.x + r.w / 2; }).concat(t.x + t.w / 2);
    d.push('M' + (t.x + t.w / 2) + ',' + y0 + ' L' + (t.x + t.w / 2) + ',' + busY);
    d.push('M' + Math.min(...xs) + ',' + busY + ' L' + Math.max(...xs) + ',' + busY);
    mids.forEach(k => {
      const r = R2(k), cx = r.x + r.w / 2;
      d.push('M' + cx + ',' + busY + ' L' + cx + ',' + (r.y - 1));
      const sm = k.parentElement.querySelector('.flc-sm');
      if (sm) { const f = R2(sm); d.push('M' + cx + ',' + (r.y + r.h) + ' L' + cx + ',' + (f.y - 1)); }
    });
  }
  svg.innerHTML = d.map(p => '<path d="' + p + '"/>').join('');
  if (!grow || still()) return;
  svg.querySelectorAll('path').forEach((p, i) => {
    const L = p.getTotalLength ? p.getTotalLength() : 0; if (!L) return;
    p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
    p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 380, delay: 160 + i * 25, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' });
  });
}
function rise(host) {
  if (still()) return;
  host.querySelectorAll('.flc-col').forEach((c, i) => c.animate([{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }],
    { duration: 360, delay: 180 + i * 60, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
  const a = host.querySelector('.flc-acts');
  if (a) a.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: 300, fill: 'backwards' });
}
/* The block clicked is lifted out and flown to the top slot, the old
   picture lifts and fades, and what comes after rises in beneath. */
function travel(host, fid, st, o, path, from) {
  const pos = getComputedStyle(host).position;
  if (pos === 'static') host.style.position = 'relative';
  const hr = host.getBoundingClientRect(), f = from.getBoundingClientRect();
  const ghost = from.cloneNode(true); ghost.classList.add('flc-ghost');
  Object.assign(ghost.style, { left: (f.left - hr.left) + 'px', top: (f.top - hr.top) + 'px', width: f.width + 'px', height: f.height + 'px' });
  const oldStage = host.querySelector('.flc-stage'), so = oldStage.getBoundingClientRect();
  const old = oldStage.cloneNode(true); old.classList.add('flc-ghost');
  Object.assign(old.style, { left: (so.left - hr.left) + 'px', top: (so.top - hr.top) + 'px', width: so.width + 'px' });
  st.trail.push(st.view);
  for (let i = 0; i < path.length - 1; i++) st.trail.push(path[i]);
  st.view = path[path.length - 1];
  paint(host, fid, st, o);
  if (still()) return;
  host.appendChild(old); host.appendChild(ghost);
  const tb = host.querySelector('[data-top]'), t = tb.getBoundingClientRect();
  tb.style.visibility = 'hidden';
  old.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-24px) scale(.97)' }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).onfinish = () => old.remove();
  const end = () => { ghost.remove(); tb.style.visibility = ''; };
  const an = ghost.animate([
    { left: ghost.style.left, top: ghost.style.top, width: ghost.style.width, height: ghost.style.height },
    { left: (t.left - hr.left) + 'px', top: (t.top - hr.top) + 'px', width: t.width + 'px', height: t.height + 'px' }
  ], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
  an.onfinish = end;
  setTimeout(end, 700);             /* a page not being drawn never finishes an animation */
  rise(host);
}
/* travelling back: the small block clicked grows into the top slot */
function back(host, fid, st, o, i, from) {
  const f = from.getBoundingClientRect();
  st.view = st.trail[i]; st.trail = st.trail.slice(0, i);
  paint(host, fid, st, o);
  if (still()) return;
  const tb = host.querySelector('[data-top]'), t = tb.getBoundingClientRect();
  tb.style.transformOrigin = '0 0';
  tb.animate([
    { transform: 'translate(' + (f.left - t.left) + 'px,' + (f.top - t.top) + 'px) scale(' + (f.width / t.width) + ',' + (f.height / t.height) + ')', opacity: .6 },
    { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
  rise(host);
}
function backNow(host, fid, st, o) {
  const i = st.trail.indexOf(st.now), c = host.querySelectorAll('.flc-crumb')[i];
  if (i > -1 && c) return back(host, fid, st, o, i, c);
  st.view = st.now; st.trail = []; paint(host, fid, st, o); rise(host);
}
/* I'M HERE: every block from where he is to where he looked is reached, in
   order, each by the arrow between them. One undo takes them all back. */
function arrive(host, fid, st, o) {
  const path = st.trail.concat(st.view);
  if (path[0] === st.now) path.shift();
  const all = arrows(fid), t0 = Date.now(), undos = [];
  let prev = st.now;
  path.forEach((id, i) => {
    const a = prev ? all.find(x => x.a === prev && x.b === id) : null;
    const un = reach(fid, id, a ? a.id : null, t0 + i);
    if (un) undos.push(un);
    prev = id;
  });
  const b = box(fid, st.view);
  delete CS[fid];
  if (o.onPick) o.onPick();
  card(host, o);
  const tb = host.querySelector('[data-top]');
  if (tb && !still()) tb.animate([{ filter: 'brightness(1.35)', transform: 'scale(1.03)' }, { filter: 'none', transform: 'none' }], { duration: 600, easing: 'ease-out' });
  rise(host);
  if (undos.length && g.UI && g.UI.undo) g.UI.undo('At ' + X(b ? b.name : ''), () => { undos.reverse().forEach(u => u()); delete CS[fid]; card(host, o); if (o.onPick) o.onPick(); });
}

g.Flow = {
  VERSION: '0.2.1', card: card, openFlow: openFlow, ink: ink, KINDS: KINDS, TYPES: ['flow', 'fbox', 'farrow', 'fwalk'],
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
