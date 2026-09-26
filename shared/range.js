/* shared/range.js — 0.3.1 — a training history as a woodblock print.

   Tom, 2026-09-20 and 2026-09-22: training blocks drawn as mountains and
   sessions as trees, in the manner of ukiyo-e, "meant to be a nice
   motivational tool". TRAIN draws a person's own on Profile, COACH draws a
   client's. 2026-09-25: "I want my painting visualizer perfectly working,
   and interchangeable. Set the base: Training Blocks, Sessions, Sets,
   Volume", with three prints to go by: a Hiroshige Fuji, an ink-wash
   bamboo valley and a dusk lake with a torii. 2026-09-26: "I dont want to
   have blocks, sets, volumes, sessions all different in the visualizer",
   so the four bases became one picture that holds all four.

   ── what the picture says ──

     · a MOUNTAIN is a training block (TRAIN's `phase` rows). It stands over
       the dates the block ran; a block with no end runs until the next one
       starts, as it does everywhere in TRAIN. Before 0.2.0 an open block ran
       to today and stood over every block after it.
     · a HILL is time outside any block: a month on the timeline, a year on
       BLOCKS. A month with no session is flat ground.
     · a TREE is a session, standing ON the mountain or hill over its day
       (0.3.1; before that the trees stood in rows on the ground in front).
       A block's name sits on the ground under it, so the slopes are left
       to the trees, and no decoration on a slope looks like a tree.
     · a session that set a record BLOSSOMS.
     · the moon (DUSK) and the seal stand at today's end.
   Birds, clouds, boats and the far ridges stand for nothing: they are the
   print. There is no bad weather, no dead tree and no verdict.

   ── the measures ──  (one picture, all four at once)

     BLOCKS    a mountain each, as wide as the dates it ran.
     SESSIONS  a tree each; how close they stand is how often.
     SETS      a tree is taller for more sets that session.
     VOLUME    a mountain or hill is taller for more volume a week, so its
               width is how long and its height how hard, and its area is
               the work. A history with no weight in it (bodyweight only)
               measures its mountains in sets a week instead.
   Heights are linear in the measure above a floor, so a tree twice as tall
   (above the smallest) is twice the sets. Mountains and hills are scaled
   apart, and the tallest hill is six tenths of the tallest mountain, so a
   month outside a block does not stand over a block. The header states
   all four totals.

   ── the print ──  FUJI, INK, DUSK. Same layout, same data, three hands.

   ── colours ──

   Like notice.js, this writes colours down: the picture is the art, not the
   furniture, so a Fuji is white in every theme. hsl() on a canvas only. The
   header and the two switches around it are the app's, in tokens.

   ── size ──

   The timeline is 5 pixels a day at the least, so years are long. It is
   drawn in tiles of 1024 pixels, only the ones near the screen, and tiles far
   away give their memory back: an iPhone refuses one canvas that wide at 3x.
   Everything is placed in whole-picture coordinates and seeded from them, so
   tiles meet without a seam and one history always prints the same.     */

(function (g) {
'use strict';

var VERSION = '0.3.1';
var DAY = 86400000, TILE = 1024, PER_DAY = 5;
var PRINTS = [{ id: 'fuji', name: 'FUJI' }, { id: 'ink', name: 'INK' }, { id: 'dusk', name: 'DUSK' }];

/* ── small things ── */
function t(d) { return Date.parse(d + 'T00:00:00Z'); }
function days(a, b) { return Math.round((t(b) - t(a)) / DAY); }
function addDays(d, n) { return new Date(t(d) + n * DAY).toISOString().slice(0, 10); }
function todayStr() { return g.Day && Day.today ? Day.today() : new Date().toISOString().slice(0, 10); }
function hashStr(s) { s = String(s); var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/* a seeded stream: one history always prints the same picture */
function rng(seed) {
  var a = (seed >>> 0) || 1;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    var x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
/* smooth 1D noise, -1..1 */
function noise(seed) {
  var r = rng(seed), p = [];
  for (var i = 0; i < 256; i++) p.push(r() * 2 - 1);
  function v(x) { var i = Math.floor(x), f = x - i, a = p[i & 255], b = p[(i + 1) & 255]; f = f * f * (3 - 2 * f); return a + (b - a) * f; }
  return function (x) { return v(x) * .55 + v(x * 2.1 + 9) * .27 + v(x * 4.3 + 21) * .13 + v(x * 9.1 + 5) * .05; };
}
var NZ = noise(71), NZ2 = noise(113), NZ3 = noise(229);
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, f) { return a + (b - a) * f; }
function hsl(h, s, l, a) { return 'hsl(' + h + ' ' + s + '% ' + l + '%' + (a == null ? '' : ' / ' + a) + ')'; }
function fmtN(n) { n = Math.round(n); return n.toLocaleString(); }
function compact(n) {
  n = Math.round(n);
  if (n >= 1e6) return (Math.round(n / 1e5) / 10) + 'M';
  if (n >= 1e5) return Math.round(n / 1e3) + 'k';
  return n.toLocaleString();
}
function dayWords(d, opts) {
  if (g.Day && Day.label) return Day.label(d, opts);
  return new Date(t(d)).toLocaleDateString(undefined, Object.assign({ timeZone: 'UTC' }, opts || {}));
}
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ── what the picture is made of ── */

/** what the range draws, from set and phase rows shaped like TRAIN's
    (a whole row with a payload, or the payload alone). TRAIN hands it its
    own rows and COACH a client's. A warmup is never work, and neither is a
    plan still waiting today; a past day counts as it was logged, which is
    TRAIN's rule (`TRAIN.counts`). */
function fromRows(sets, phases, to) {
  var by = {};
  to = to || todayStr();
  (sets || []).forEach(function (r) {
    if (!r || r.deleted) return;
    var s = r.payload || r, date = r.date || s.date;
    if (!date || isWarm(s)) return;
    if (s.plan && !s.done && date >= to) return;
    var d = by[date] || (by[date] = { date: date, vol: 0, sets: 0, reps: 0, pr: false });
    var kg = +s.kg || 0, reps = +s.r || 0;
    d.sets++; d.reps += reps; d.vol += kg * reps;
    if (s.pr) d.pr = true;
  });
  return {
    sessions: Object.keys(by).sort().map(function (k) { return by[k]; }),
    phases: (phases || []).filter(function (r) { return r && !r.deleted; })
      .map(function (r) { var p = r.payload || r; return { name: p.name, start: p.start, end: p.end || null }; })
      .filter(function (p) { return p.start; }),
    to: to,
  };
}

/* TRAIN's warmup rule, so the picture counts what Profile counts: a set
   marked by hand is what it was marked, else its comment decides
   (`TRAIN.noteWarm`). COACH hands its client rows in without TRAIN loaded. */
function isWarm(s) {
  if (s.warm === 1 || s.warm === true) return true;
  if (s.warm === 0 || s.warm === false) return false;
  return !!s.note && /\bwarm[ -]?ups?\b|\bwu\b/i.test(s.note);
}

/* A block runs until its own end or the day before the next one starts,
   whichever is first, and never past today. */
function resolveBlocks(phases, to) {
  var ps = (phases || []).filter(function (p) { return p.start && p.start <= to; })
    .slice().sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
  var out = [];
  ps.forEach(function (p, i) {
    var next = ps[i + 1], end = p.end || to;
    if (next && end >= next.start) end = addDays(next.start, -1);
    if (end > to) end = to;
    if (end >= p.start) out.push({ name: p.name || 'Training block', start: p.start, end: end });
  });
  return out;
}

/* the stretches of [from, to] that no block covers */
function outside(blocks, from, to) {
  var out = [], cur = from;
  blocks.forEach(function (b) {
    if (b.start > cur) out.push({ start: cur, end: addDays(b.start, -1) < to ? addDays(b.start, -1) : to });
    if (b.end >= cur) cur = addDays(b.end, 1);
  });
  if (cur <= to) out.push({ start: cur, end: to });
  return out.filter(function (r) { return r.end >= r.start; });
}
function splitBy(r, unit) {
  var out = [], s = r.start;
  while (s <= r.end) {
    var y = +s.slice(0, 4), m = +s.slice(5, 7), e;
    if (unit === 'year') e = y + '-12-31';
    else e = addDays((m === 12 ? (y + 1) + '-01' : y + '-' + String(m + 1).padStart(2, '0')) + '-01', -1);
    if (e > r.end) e = r.end;
    out.push({ start: s, end: e, y: y, m: m });
    s = addDays(e, 1);
  }
  return out;
}
function stats(list) {
  var o = { sessions: list.length, sets: 0, vol: 0, reps: 0, pr: 0 };
  list.forEach(function (s) { o.sets += s.sets || 0; o.vol += s.vol || 0; o.reps += s.reps || 0; if (s.pr) o.pr++; });
  return o;
}
function within(ss, a, b) {
  /* sessions are sorted: a binary search keeps a long history cheap */
  var lo = 0, hi = ss.length;
  while (lo < hi) { var mid = (lo + hi) >> 1; if (ss[mid].date < a) lo = mid + 1; else hi = mid; }
  var out = [];
  for (var i = lo; i < ss.length && ss[i].date <= b; i++) out.push(ss[i]);
  return out;
}
/* a mountain's or hill's height: its volume a week (sets a week for a
   history with no weight in it). A stretch shorter than a week counts as a
   week, so a block started yesterday is not the tallest thing on the page. */
function perWeek(L, s) { return (L.mnt === 'sets' ? s.st.sets : s.st.vol) / (Math.max(7, days(s.start, s.end) + 1) / 7); }

/* ── the layout: where everything stands, before a single tile is drawn ── */
function layout(data, base, boxW, H) {   /* `base` is ignored since 0.3.0 */
  var ss = (data.sessions || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var to = data.to || (ss.length ? ss[ss.length - 1].date : todayStr());
  var bl = resolveBlocks(data.phases, to);
  var from = ss.length ? ss[0].date : (bl.length ? bl[0].start : to);
  if (bl.length && bl[0].start < from) from = bl[0].start;
  var L = { H: H, hz: Math.round(H * 0.76), ss: ss, from: from, to: to, blocks: bl,
            peaks: [], trees: [], labels: [], years: [], empty: !ss.length && !bl.length };
  L.total = stats(ss);
  L.mnt = L.total.vol > 0 ? 'vol' : 'sets';
  layoutTime(L, boxW);
  /* back to front: hills, then blocks, the taller behind */
  L.peaks.sort(function (a, b) { return (a.kind === 'block') - (b.kind === 'block') || b.h - a.h; });
  /* trees: the back row first, then along the row */
  L.trees.sort(function (a, b) { return a.y - b.y || a.x - b.x; });
  return L;
}

function layoutTime(L, boxW) {
  var H = L.H, span = days(L.from, L.to) + 1;
  var left = 34, right = 96;
  var per = Math.max(PER_DAY, (boxW - left - right) / span);
  L.per = per;
  L.W = Math.ceil(left + span * per + right);
  L.X = function (d) { return left + (days(L.from, d) + 0.5) * per; };
  var secs = L.blocks.map(function (b) { return { kind: 'block', name: b.name, start: b.start, end: b.end }; });
  outside(L.blocks, L.from, L.to).forEach(function (r) {
    splitBy(r, 'month').forEach(function (m) { secs.push({ kind: 'hill', name: MONTHS[m.m - 1] + ' ' + m.y, start: m.start, end: m.end }); });
  });
  secs.forEach(function (s) { s.list = within(L.ss, s.start, s.end); s.st = stats(s.list); });
  secs = secs.filter(function (s) { return s.kind === 'block' || s.st.sessions > 0; });
  var maxB = 0, maxH = 0;
  secs.forEach(function (s) { var m = perWeek(L, s); if (s.kind === 'block') maxB = Math.max(maxB, m); else maxH = Math.max(maxH, m); });
  var room = L.hz - H * 0.19;   /* headroom for the tallest tree on the tallest summit */
  secs.forEach(function (s) {
    var m = perWeek(L, s);
    var x0 = L.X(s.start) - per / 2, x1 = L.X(s.end) + per / 2;
    s.x0 = x0; s.x1 = x1; s.cx = (x0 + x1) / 2;
    if (s.kind === 'block') {
      s.h = room * (0.46 + 0.54 * (maxB ? m / maxB : 0.5));
      s.flank = Math.max(s.h * 0.95, (x1 - x0) * 0.3);
    } else {
      /* tall enough to carry its trees on a real slope: most of a long
         history is months outside any block */
      s.h = room * (0.24 + 0.36 * (maxH ? m / maxH : 0.5));
      s.flank = Math.max(s.h * 1.3, (x1 - x0) * 0.35);
    }
    s.seed = hashStr(s.kind + s.start);
    L.peaks.push(s);
  });
  /* trees, taller for more sets, standing ON the mountains (Tom,
     2026-09-26): each on the skyline at its date, the next a little down
     the face and the next a little further, so sessions two days apart do
     not stand in one another. A tree always stands on whatever is highest
     at its date, so no mountain in front can hide one. */
  L.peaks.forEach(function (P) { ridgeOf(P, L.hz); });
  var smax = 0;
  L.ss.forEach(function (s) { smax = Math.max(smax, s.sets); });
  var tmin = H * 0.05, tmax = H * 0.14, down = [0, 0.1, 0.2];
  L.ss.forEach(function (s, i) {
    var r = rng(hashStr(s.date));
    var f = smax ? s.sets / smax : 0.5;
    var x = L.X(s.date) + (r() - 0.5) * Math.min(per * 0.6, 3), top = skyline(L, x);
    L.trees.push({ x: x, y: top + 1 + (L.hz - top) * down[i % 3], row: i % 3, h: tmin + (tmax - tmin) * f,
                   s: s, pr: s.pr, seed: hashStr('t' + s.date) });
  });
  /* the years along the bottom, so a long scroll knows where it is */
  for (var y = +L.from.slice(0, 4); y <= +L.to.slice(0, 4); y++) {
    var d = y + '-01-01';
    L.years.push({ x: d < L.from ? L.X(L.from) : L.X(d), text: String(y) });
  }
  /* each block's name on the ground under it, a title cartouche, so the
     mountain is left to its trees; one that would sit on another is left off */
  var lastR = -1e9;
  secs.filter(function (s) { return s.kind === 'block'; }).sort(function (a, b) { return a.cx - b.cx; }).forEach(function (s) {
    var w = labelW(s.name), x = s.cx - w / 2;
    if (x < lastR + 6) return;
    L.labels.push({ x: x, y: L.hz + (H - L.hz) * 0.2, w: w, text: labelText(s.name), peak: s });
    lastR = x + w;
  });
}

var MCTX = null;
function labelText(s) { return String(s || '').toUpperCase().slice(0, 22); }
function labelFont() { return '600 10px ' + FONT; }
function labelW(s) {
  if (!MCTX) MCTX = document.createElement('canvas').getContext('2d');
  MCTX.font = labelFont();
  return Math.ceil(MCTX.measureText(labelText(s)).width) + 12;
}
var FONT = "'Chakra Petch', system-ui, sans-serif";

/* ── drawing helpers ── */

/* A mountain's ridge: concave flanks rising to a summit, roughened by
   noise in whole-picture coordinates. Cached on the peak. */
function ridgeOf(P, base) {
  if (P.pts) return P.pts;
  var nz = noise(P.seed), nz2 = noise(P.seed + 77);
  var a = P.cx - (P.x1 - P.x0) / 2 - P.flank, b = P.cx + (P.x1 - P.x0) / 2 + P.flank;
  var px = P.cx + (rng(P.seed)() - 0.5) * (P.x1 - P.x0) * 0.3;
  var step = Math.max(1.5, (b - a) / 320), pts = [], h = P.h, block = P.kind === 'block';
  for (var x = a; x <= b + 0.01; x += step) {
    var u = x < px ? (px - x) / (px - a) : (x - px) / (b - px);
    u = Math.min(1, u);
    var shape = block ? Math.pow(1 - u, 1.75) : Math.pow(Math.sin((1 - u) * Math.PI / 2), 1.6);
    var rough = (nz(x / (block ? 34 : 22)) * (block ? 0.05 : 0.09) * (0.35 + shape) + nz2(x / 8) * 0.012) * h;
    var y = base - h * shape - rough;
    if (block && Math.abs(x - px) < Math.max(3, h * 0.05)) y += h * 0.018;   /* a crater lip, not a needle */
    pts.push([x, Math.min(base, y)]);
  }
  P.pts = pts; P.px = px;
  P.top = Math.min.apply(null, pts.map(function (p) { return p[1]; }));
  P.a = a; P.b = b;
  return pts;
}
/* the top of the whole range at x: the highest ridge standing there */
function skyline(L, x) {
  var y = L.hz;
  L.peaks.forEach(function (P) { if (x >= P.a && x <= P.b) y = Math.min(y, yAt(P.pts, x)); });
  return y;
}
function yAt(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  var step = pts.length > 1 ? pts[1][0] - pts[0][0] : 1;
  var i = Math.min(pts.length - 1, Math.max(0, Math.round((x - pts[0][0]) / step)));
  return pts[i][1];
}
function shape(c, pts, base) {
  c.beginPath(); c.moveTo(pts[0][0], base + 2);
  for (var i = 0; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.lineTo(pts[pts.length - 1][0], base + 2); c.closePath();
}
function inView(v, a, b) { return b >= v.a && a <= v.b; }
/* a long line across the whole picture: decorative ridges and the like */
function band(c, v, base, amp, scale, seed, fill) {
  var nz = noise(seed), step = 4;
  c.beginPath(); c.moveTo(v.a - step, base + 2);
  for (var x = Math.floor(v.a / step) * step - step; x <= v.b + step; x += step) {
    c.lineTo(x, base - amp * (0.5 + 0.5 * nz(x / scale)));
  }
  c.lineTo(v.b + step, base + 2); c.closePath();
  c.fillStyle = fill; c.fill();
}
/* things placed once per stretch of the picture (birds, boats, clouds):
   seeded by the stretch, so every tile agrees where they are */
function each(v, span, salt, fn) {
  for (var k = Math.floor((v.a - span) / span); k <= Math.floor((v.b + span) / span); k++) {
    if (k < 0) continue;
    fn(rng(hashStr(salt + k)), k * span);
  }
}
function kasumi(c, x, y, w, h, top, bottom) {
  var r = h / 2;
  c.beginPath();
  c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  c.lineTo(x + r, y + h); c.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
  var gr = c.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, top); gr.addColorStop(1, bottom);
  c.fillStyle = gr; c.fill();
}
function flock(c, x, y, n, s, col) {
  c.strokeStyle = col; c.lineWidth = Math.max(0.8, s * 0.45); c.lineCap = 'round';
  for (var i = 0; i < n; i++) {
    var k = Math.ceil(i / 2), side = i % 2 ? -1 : 1;
    var px = x - k * 7 * s, py = y + side * k * 3.2 * s + (i % 3) * 0.6;
    c.beginPath();
    c.moveTo(px - 2.4 * s, py - 1.2 * s); c.quadraticCurveTo(px - 1 * s, py - 0.9 * s, px, py);
    c.quadraticCurveTo(px + 1 * s, py - 0.9 * s, px + 2.4 * s, py - 1.2 * s);
    c.stroke();
  }
}
function seal(c, x, y, s, col, ink) {
  c.fillStyle = col;
  var r = s * 0.12;
  c.beginPath();
  c.moveTo(x + r, y); c.lineTo(x + s - r, y); c.quadraticCurveTo(x + s, y, x + s, y + r);
  c.lineTo(x + s, y + s - r); c.quadraticCurveTo(x + s, y + s, x + s - r, y + s);
  c.lineTo(x + r, y + s); c.quadraticCurveTo(x, y + s, x, y + s - r);
  c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.fill();
  /* 鍛, to forge: the character in 鍛錬, training */
  c.fillStyle = ink; c.font = '700 ' + Math.round(s * 0.72) + 'px serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('鍛', x + s / 2, y + s / 2 + s * 0.04);
  c.textBaseline = 'alphabetic';
}
/* the print's border, with the cut corners of a Hiroshige frame */
function frame(c, L, v, col, paper) {
  var W = L.W, H = L.H, m = 4, cut = 7;
  c.fillStyle = paper;
  c.fillRect(v.a, 0, v.b - v.a, m); c.fillRect(v.a, H - m, v.b - v.a, m);
  if (v.a < m + 2) c.fillRect(0, 0, m, H);
  if (v.b > W - m - 2) c.fillRect(W - m, 0, m, H);
  c.strokeStyle = col; c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(Math.max(v.a - 2, m + cut), m); c.lineTo(Math.min(v.b + 2, W - m - cut), m);
  c.moveTo(Math.max(v.a - 2, m + cut), H - m); c.lineTo(Math.min(v.b + 2, W - m - cut), H - m);
  c.stroke();
  if (v.a < 30) {
    c.beginPath();
    c.moveTo(m + cut, m); c.arc(m, m, cut, 0, Math.PI / 2); c.lineTo(m, H - m - cut); c.arc(m, H - m, cut, -Math.PI / 2, 0);
    c.stroke();
  }
  if (v.b > W - 30) {
    c.beginPath();
    c.moveTo(W - m - cut, m); c.arc(W - m, m, cut, Math.PI, Math.PI / 2, true); c.lineTo(W - m, H - m - cut);
    c.arc(W - m, H - m, cut, -Math.PI / 2, Math.PI, true);
    c.stroke();
  }
}
/* paper showing through everything: mottling, fibres, specks */
function paperGrain(c, L, v, tone, fibreDark, fibreLight) {
  var W = v.b - v.a, H = L.H, pr = rng(hashStr('paper' + Math.floor(v.a / TILE)));
  var m = document.createElement('canvas');
  m.width = Math.max(1, Math.ceil(W / 6)); m.height = Math.max(1, Math.ceil(H / 6));
  var mg = m.getContext('2d'), id = mg.createImageData(m.width, m.height);
  for (var i = 0; i < id.data.length; i += 4) { id.data[i] = tone[0]; id.data[i + 1] = tone[1]; id.data[i + 2] = tone[2]; id.data[i + 3] = pr() * 26; }
  mg.putImageData(id, 0, 0);
  c.save(); c.imageSmoothingEnabled = true; c.globalCompositeOperation = 'multiply'; c.drawImage(m, v.a, 0, W, H); c.restore();
  c.lineWidth = 0.6;
  for (var k = 0; k < W * H / 520; k++) {
    var x = v.a + pr() * W, y = pr() * H, l = 3 + pr() * 8, a = pr() * 6.3;
    c.strokeStyle = pr() < 0.5 ? fibreDark : fibreLight;
    c.beginPath(); c.moveTo(x, y);
    c.quadraticCurveTo(x + Math.cos(a + 1) * l * 0.6, y + Math.sin(a + 1) * l * 0.6, x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
}

/* ── the three prints ──
   Each is the same list of layers, drawn by its own hand. */

var PRINT = {};

/* FUJI: Hiroshige's Hara. A rose dawn, the Prussian sea at the horizon,
   white snow peaks with fine gullies, slate hills stippled with pines, a
   rice field, and a road with grass along its edge. */
PRINT.fuji = {
  paper: 'hsl(40 36% 89%)', grain: [120, 96, 64],
  sky: function (c, L, v) {
    var hz = L.hz, H = L.H;
    var gr = c.createLinearGradient(0, 0, 0, hz);
    gr.addColorStop(0, 'hsl(352 50% 70%)'); gr.addColorStop(0.2, 'hsl(10 55% 82%)');
    gr.addColorStop(0.46, 'hsl(36 40% 89% / 0)'); gr.addColorStop(1, 'hsl(36 40% 89% / 0)');
    c.fillStyle = gr; c.fillRect(v.a, 0, v.b - v.a, hz);
    /* wood grain where the sky ink sat on the block */
    c.save(); c.beginPath(); c.rect(v.a, 0, v.b - v.a, hz * 0.34); c.clip();
    c.strokeStyle = 'hsl(350 40% 30% / .05)'; c.lineWidth = 1;
    var gr2 = rng(41);
    for (var y = -6; y < hz * 0.36; y += 3 + gr2() * 4) {
      var ph = gr2() * 6, amp = 1 + gr2() * 2.2;
      c.beginPath();
      for (var x = Math.floor(v.a / 12) * 12; x <= v.b + 12; x += 12) {
        var yy = y + Math.sin(x / 90 + ph) * amp + Math.sin(x / 23 + ph * 2) * 0.6;
        x === Math.floor(v.a / 12) * 12 ? c.moveTo(x, yy) : c.lineTo(x, yy);
      }
      c.stroke();
    }
    c.restore();
    /* the sea, Prussian blue wiped down into the paper */
    var y0 = hz - H * 0.15;
    var sg = c.createLinearGradient(0, y0, 0, hz);
    sg.addColorStop(0, 'hsl(214 64% 28%)'); sg.addColorStop(0.5, 'hsl(208 46% 52%)'); sg.addColorStop(1, 'hsl(40 36% 89% / 0)');
    c.fillStyle = sg; c.fillRect(v.a, y0, v.b - v.a, hz - y0);
  },
  far: function (c, L, v) {
    band(c, v, L.hz - L.H * 0.1, L.H * 0.1, 160, 11, 'hsl(214 18% 70%)');
    band(c, v, L.hz - L.H * 0.03, L.H * 0.12, 95, 29, 'hsl(214 16% 58%)');
  },
  hill: function (c, P, L) {
    var pts = ridgeOf(P, L.hz), base = L.hz;
    shape(c, pts, base);
    var gr = c.createLinearGradient(0, P.top, 0, base);
    gr.addColorStop(0, 'hsl(216 14% 34%)'); gr.addColorStop(0.6, 'hsl(214 10% 56%)'); gr.addColorStop(1, 'hsl(214 10% 74%)');
    c.fillStyle = gr; c.fill();
    c.strokeStyle = 'hsl(222 26% 16%)'; c.lineWidth = 1; c.stroke();
    /* no stippled pines since 0.3.1: a tree on a hill is a session now */
  },
  block: function (c, P, L) {
    var pts = ridgeOf(P, L.hz), base = L.hz, h = P.h, a = P.a, b = P.b;
    shape(c, pts, base);
    c.fillStyle = 'hsl(40 34% 96%)'; c.fill();
    c.save(); c.clip();
    /* the flanks shaded where the light does not reach */
    var sh = c.createLinearGradient(a, 0, b, 0);
    sh.addColorStop(0, 'hsl(214 16% 62% / .8)'); sh.addColorStop(0.36, 'hsl(214 16% 70% / 0)');
    sh.addColorStop(0.62, 'hsl(214 16% 70% / 0)'); sh.addColorStop(1, 'hsl(214 18% 56% / .85)');
    c.fillStyle = sh; c.fillRect(a, P.top, b - a, base - P.top);
    /* the summit takes the dawn */
    var tp = c.createLinearGradient(0, P.top, 0, P.top + h * 0.22);
    tp.addColorStop(0, 'hsl(352 55% 80% / .75)'); tp.addColorStop(1, 'hsl(352 55% 80% / 0)');
    c.fillStyle = tp; c.fillRect(a, P.top, b - a, h * 0.22);
    /* gullies: fine lines running down the snow */
    var r = rng(P.seed + 5), n = Math.max(6, Math.round((b - a) / 7));
    c.strokeStyle = 'hsl(214 22% 46% / .55)'; c.lineCap = 'round';
    for (var i = 0; i < n; i++) {
      var x = lerp(a + (b - a) * 0.12, b - (b - a) * 0.12, (i + r() * 0.8) / n);
      var y = yAt(pts, x) + 2 + r() * h * 0.08, len = h * (0.12 + r() * 0.3);
      var drift = (x - P.px) / (b - a) * len * 0.5;
      c.lineWidth = 0.5 + r() * 0.6;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + drift * 0.3, y + len * 0.5, x + drift, y + len); c.stroke();
    }
    /* the forested foot, slate, rising in teeth under the snow */
    var fr = c.createLinearGradient(0, base - h * 0.34, 0, base);
    fr.addColorStop(0, 'hsl(214 12% 44% / 0)'); fr.addColorStop(0.45, 'hsl(214 12% 44% / .55)'); fr.addColorStop(1, 'hsl(214 12% 60% / .2)');
    c.fillStyle = fr; c.fillRect(a, base - h * 0.34, b - a, h * 0.34);
    c.restore();
    /* key block: the ridge in ink of uneven weight */
    c.strokeStyle = 'hsl(222 30% 16%)'; c.lineCap = 'round';
    for (var k = 1; k < pts.length; k++) {
      var p = pts[k - 1], q = pts[k];
      c.lineWidth = 0.7 + (NZ(p[0] / 15) + 1) * 0.55;
      c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
    }
  },
  mist: function (c, L, v) {
    var H = L.H, hz = L.hz;
    var fm = c.createLinearGradient(0, hz - H * 0.13, 0, hz + H * 0.02);
    fm.addColorStop(0, 'hsl(40 36% 92% / 0)'); fm.addColorStop(0.7, 'hsl(40 36% 92% / .92)'); fm.addColorStop(1, 'hsl(40 36% 92% / .5)');
    c.fillStyle = fm; c.fillRect(v.a, hz - H * 0.13, v.b - v.a, H * 0.15);
    each(v, 640, 'fk', function (r, x) {
      var y = H * (0.3 + r() * 0.16), w = 160 + r() * 200, h = H * 0.045;
      kasumi(c, x + r() * 300, y, w, h, 'hsl(14 60% 88% / .95)', 'hsl(40 36% 90% / .95)');
      kasumi(c, x + r() * 300 + w * 0.2, y + h * 1.3, w * 0.8, h * 0.8, 'hsl(14 60% 88% / .9)', 'hsl(40 36% 90% / .9)');
    });
  },
  ground: function (c, L, v) {
    var H = L.H, hz = L.hz, road = hz + (H - hz) * 0.7;
    var gf = c.createLinearGradient(0, hz, 0, road);
    gf.addColorStop(0, 'hsl(60 18% 84%)'); gf.addColorStop(1, 'hsl(78 16% 70%)');
    c.fillStyle = gf; c.fillRect(v.a, hz, v.b - v.a, road - hz);
    /* the rice, in rows, thicker nearer */
    var r = rng(hashStr('rice' + Math.floor(v.a / TILE)));
    c.strokeStyle = 'hsl(88 16% 36% / .38)'; c.lineWidth = 0.7;
    c.beginPath();
    for (var y = hz + 5; y < road - 2; y += 4 + (y - hz) / (road - hz) * 3) {
      var tall = 2 + (y - hz) / (road - hz) * 5;
      for (var x = v.a + r() * 3; x < v.b; x += 2.4 + r() * 2.6) {
        c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 1.2, y - tall * (0.6 + r() * 0.6));
      }
    }
    c.stroke();
    /* the road, and grass along its edge */
    c.fillStyle = 'hsl(214 7% 66%)'; c.fillRect(v.a, road, v.b - v.a, H - road);
    c.strokeStyle = 'hsl(145 46% 32%)'; c.lineWidth = 1.1;
    c.beginPath();
    for (var gx = Math.floor(v.a / 5) * 5; gx < v.b; gx += 5) {
      var gr2 = rng(hashStr('g' + gx)), gy = road + 1 + gr2() * 2;
      c.moveTo(gx, gy + 3); c.lineTo(gx - 1.5, gy - 3 - gr2() * 2);
      c.moveTo(gx + 2, gy + 3); c.lineTo(gx + 3.2, gy - 2 - gr2() * 3);
    }
    c.stroke();
  },
  tree: function (c, T, L) {
    var x = T.x, y = T.y, h = T.h, r = rng(T.seed), lean = (r() - 0.5) * 0.22;
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = 'hsl(20 30% 22%)'; c.lineWidth = Math.max(1, h * 0.045);
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + h * lean * 0.5, y - h * 0.45, x + h * lean, y - h * 0.86); c.stroke();
    if (T.pr) {
      var cx = x + h * lean * 0.85, cy = y - h * 0.72, s = h * 0.34;
      var puffs = [[0, 0, 0.5], [-0.46, 0.18, 0.38], [0.46, 0.16, 0.4], [-0.18, -0.36, 0.36], [0.24, -0.32, 0.34]];
      c.fillStyle = 'hsl(345 72% 85%)'; c.strokeStyle = 'hsl(222 30% 16%)'; c.lineWidth = 0.6;
      puffs.forEach(function (p) { c.beginPath(); c.arc(cx + p[0] * s, cy + p[1] * s, p[2] * s, 0, 7); c.fill(); c.stroke(); });
      c.fillStyle = 'hsl(348 62% 68%)';
      for (var i = 0; i < 9; i++) { c.beginPath(); c.arc(cx + (r() - 0.5) * s * 1.3, cy + (r() - 0.5) * s, Math.max(0.8, s * 0.07), 0, 7); c.fill(); }
      return;
    }
    var tiers = h > 40 ? 3 : 2, w = h * 0.4;
    for (var k = 0; k < tiers; k++) {
      var ty = y - h * (0.5 + k * (0.42 / tiers)), tw = w * (0.62 - k * 0.14), th = Math.max(1.4, h * 0.075);
      var tx = x + h * lean * (0.55 + k * 0.2);
      c.beginPath(); c.ellipse(tx, ty, tw, th, 0, 0, 7); c.fillStyle = 'hsl(150 32% 22%)'; c.fill();
      c.beginPath(); c.ellipse(tx - tw * 0.1, ty - th * 0.35, tw * 0.74, th * 0.45, 0, 0, 7); c.fillStyle = 'hsl(138 28% 36%)'; c.fill();
      c.beginPath(); c.ellipse(tx, ty, tw, th, 0, 0, 7); c.strokeStyle = 'hsl(222 30% 14%)'; c.lineWidth = 0.6; c.stroke();
    }
  },
  birds: 'hsl(222 30% 16% / .8)',
  label: { fill: 'hsl(42 45% 92%)', line: 'hsl(222 30% 16%)', text: 'hsl(222 30% 14%)' },
  year: 'hsl(222 20% 26% / .7)', yearY: 0.96,
  after: function (c, L, v) {
    if (v.b > L.W - 60) seal(c, L.W - 30, 12, 18, 'hsl(4 70% 46% / .9)', 'hsl(40 40% 92%)');
    paperGrain(c, L, v, this.grain, 'hsl(30 30% 30% / .05)', 'hsl(40 60% 97% / .08)');
    frame(c, L, v, 'hsl(222 30% 16% / .85)', this.paper);
  },
};

/* INK: the ink-wash valley. Paper and grey ink, peaks darkest at the
   ridge and gone into mist at the foot, moss dots, a still lake with a
   boat, and bamboo on the near bank. The only colour is the seal, and the
   red of a record. */
PRINT.ink = {
  paper: 'hsl(44 30% 88%)', grain: [110, 100, 80],
  sky: function (c, L, v) {
    var gr = c.createLinearGradient(0, 0, 0, L.hz * 0.6);
    gr.addColorStop(0, 'hsl(35 6% 50% / .16)'); gr.addColorStop(1, 'hsl(35 6% 50% / 0)');
    c.fillStyle = gr; c.fillRect(v.a, 0, v.b - v.a, L.hz * 0.6);
  },
  far: function (c, L, v) {
    band(c, v, L.hz - L.H * 0.06, L.H * 0.22, 130, 11, 'hsl(35 5% 62% / .35)');
    band(c, v, L.hz, L.H * 0.14, 80, 29, 'hsl(35 5% 52% / .35)');
    var fm = c.createLinearGradient(0, L.hz - L.H * 0.12, 0, L.hz);
    fm.addColorStop(0, 'hsl(44 30% 88% / 0)'); fm.addColorStop(1, 'hsl(44 30% 88% / .95)');
    c.fillStyle = fm; c.fillRect(v.a, L.hz - L.H * 0.12, v.b - v.a, L.H * 0.12);
  },
  wash: function (c, P, L, dark, mid) {
    var pts = ridgeOf(P, L.hz), base = L.hz;
    shape(c, pts, base);
    var gr = c.createLinearGradient(0, P.top, 0, base);
    gr.addColorStop(0, dark); gr.addColorStop(0.5, mid); gr.addColorStop(0.92, 'hsl(35 5% 60% / 0)');
    c.fillStyle = gr; c.fill();
    return pts;
  },
  dots: function (c, P, pts, n, spread) {
    var r = rng(P.seed + 9);
    c.fillStyle = 'hsl(30 8% 10% / .85)';
    for (var i = 0; i < pts.length; i += n) {
      if (r() < 0.4) continue;
      var p = pts[i], d = r() * P.h * spread;
      c.beginPath(); c.ellipse(p[0] + (r() - 0.5) * 3, p[1] + 1.5 + d, 1.6 + r() * 1.4, 0.8 + r() * 0.5, (r() - 0.5) * 0.8, 0, 7); c.fill();
    }
  },
  hill: function (c, P, L) {
    var pts = this.wash(c, P, L, 'hsl(35 6% 40% / .55)', 'hsl(35 6% 55% / .25)');
    this.dots(c, P, pts, 3, 0.2);
    /* a light brush along the ridge, so a tree on a hill has ground under it */
    c.strokeStyle = 'hsl(30 8% 18% / .5)'; c.lineWidth = 0.9;
    c.beginPath(); pts.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.stroke();
  },
  block: function (c, P, L) {
    var pts = this.wash(c, P, L, 'hsl(30 6% 20% / .86)', 'hsl(30 5% 42% / .42)'), base = L.hz, h = P.h;
    c.save(); shape(c, pts, base); c.clip();
    /* folds: axe-cut strokes running down the face */
    var r = rng(P.seed + 13), n = Math.round((P.b - P.a) * h / 160);
    c.lineCap = 'round';
    for (var i = 0; i < n; i++) {
      var x = lerp(P.a, P.b, r()), top = yAt(pts, x), y = top + r() * h * 0.6;
      var dir = x < P.px ? -1 : 1, len = 4 + r() * 10;
      c.strokeStyle = 'hsl(30 8% 14% / ' + (0.12 + r() * 0.3) + ')';
      c.lineWidth = 0.6 + r() * 1.2;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + dir * len * 0.2, y + len * 0.5, x + dir * len * 0.5, y + len); c.stroke();
    }
    /* a paler fold, where the mountain turns */
    c.strokeStyle = 'hsl(44 30% 88% / .35)'; c.lineWidth = 2;
    c.beginPath();
    for (var k = 0; k < pts.length; k += 2) { var p = pts[k]; var yy = p[1] + h * 0.22 + NZ2(p[0] / 20) * h * 0.06; k ? c.lineTo(p[0], yy) : c.moveTo(p[0], yy); }
    c.stroke();
    c.restore();
    this.dots(c, P, pts, 2, 0.14);
    /* the ridge, in a brush that swells and thins */
    c.strokeStyle = 'hsl(30 8% 10% / .9)';
    for (var j = 1; j < pts.length; j++) {
      var a = pts[j - 1], b = pts[j];
      c.lineWidth = 0.6 + (NZ3(a[0] / 11) + 1) * 1.2;
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
  },
  mist: function (c, L, v) {
    var H = L.H, hz = L.hz;
    each(v, 520, 'ik', function (r, x) {
      var y = H * (0.28 + r() * 0.24), w = 200 + r() * 260, h = H * (0.05 + r() * 0.04);
      var gx = x + r() * 200;
      var gr = c.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, 'hsl(44 30% 88% / 0)'); gr.addColorStop(0.5, 'hsl(44 30% 88% / .9)'); gr.addColorStop(1, 'hsl(44 30% 88% / 0)');
      c.fillStyle = gr;
      c.beginPath(); c.ellipse(gx + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 7); c.fill();
    });
    var fm = c.createLinearGradient(0, hz - H * 0.1, 0, hz + H * 0.02);
    fm.addColorStop(0, 'hsl(44 30% 88% / 0)'); fm.addColorStop(0.8, 'hsl(44 30% 88% / .96)'); fm.addColorStop(1, 'hsl(44 30% 88% / 1)');
    c.fillStyle = fm; c.fillRect(v.a, hz - H * 0.1, v.b - v.a, H * 0.12);
  },
  ground: function (c, L, v) {
    var H = L.H, hz = L.hz, bank = hz + (H - hz) * 0.55;
    c.fillStyle = this.paper; c.fillRect(v.a, hz, v.b - v.a, H - hz);
    /* the lake: ripples, more of them near the far shore */
    each(v, 60, 'rp', function (r, x) {
      for (var i = 0; i < 3; i++) {
        var y = hz + 4 + Math.pow(r(), 1.6) * (bank - hz - 8), len = 8 + r() * 30;
        c.strokeStyle = 'hsl(35 6% 35% / ' + (0.12 + r() * 0.18) + ')'; c.lineWidth = 0.7;
        c.beginPath(); c.moveTo(x + r() * 60, y); c.lineTo(x + r() * 60 + len, y + (r() - 0.5)); c.stroke();
      }
    });
    each(v, 1300, 'bt', function (r, x) {
      if (r() < 0.45) return;
      var bx = x + 200 + r() * 800, by = hz + (bank - hz) * (0.3 + r() * 0.3), s = 0.9 + r() * 0.3;
      c.strokeStyle = 'hsl(30 8% 12% / .85)'; c.fillStyle = 'hsl(30 8% 12% / .85)'; c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(bx - 8 * s, by); c.quadraticCurveTo(bx, by + 3 * s, bx + 8 * s, by - 1 * s); c.stroke();
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by - 14 * s); c.stroke();
      c.beginPath(); c.moveTo(bx + 0.8, by - 13 * s); c.lineTo(bx + 5 * s, by - 3 * s); c.lineTo(bx + 0.8, by - 3 * s); c.closePath(); c.fill();
      c.strokeStyle = 'hsl(35 6% 35% / .3)'; c.lineWidth = 0.7;
      for (var k = 1; k < 4; k++) { c.beginPath(); c.moveTo(bx - 4, by + 3 + k * 3); c.lineTo(bx + 4 - k, by + 3 + k * 3); c.stroke(); }
    });
    /* the near bank */
    c.beginPath(); c.moveTo(v.a - 4, H);
    for (var x = Math.floor(v.a / 4) * 4 - 4; x <= v.b + 4; x += 4) c.lineTo(x, bank + NZ(x / 70) * H * 0.035 + NZ2(x / 13) * 2);
    c.lineTo(v.b + 4, H); c.closePath();
    var bg = c.createLinearGradient(0, bank - H * 0.04, 0, H);
    bg.addColorStop(0, 'hsl(30 6% 26% / .7)'); bg.addColorStop(1, 'hsl(30 6% 40% / .35)');
    c.fillStyle = bg; c.fill();
    var r = rng(hashStr('bk' + Math.floor(v.a / TILE)));
    c.fillStyle = 'hsl(30 8% 10% / .7)';
    for (var d = 0; d < (v.b - v.a) / 6; d++) {
      var dx = v.a + r() * (v.b - v.a), dy = bank + H * 0.02 + r() * (H - bank);
      c.beginPath(); c.ellipse(dx, dy, 1.3 + r(), 0.7, r() - 0.5, 0, 7); c.fill();
    }
  },
  tree: function (c, T, L) {
    var x = T.x, y = T.y, h = T.h, r = rng(T.seed), lean = (r() - 0.5) * 0.14;
    var lw = Math.max(1, h * 0.024), segs = Math.max(3, Math.round(h / 12));
    var ink = 'hsl(30 8% 12% / .88)';
    c.strokeStyle = ink; c.lineCap = 'butt'; c.lineWidth = lw;
    var px = x, py = y;
    for (var i = 1; i <= segs; i++) {
      var f = i / segs, nx = x + lean * h * f * f, ny = y - h * f;
      c.beginPath(); c.moveTo(px, py - (i > 1 ? 1 : 0)); c.lineTo(nx, ny + 0.6); c.stroke();
      px = nx; py = ny;
    }
    var tipX = px, tipY = py;
    /* leaves: dark daggers sprayed from the upper nodes, drooping, a
       paler spray behind the dark one for depth */
    var clusters = h > 44 ? 3 : 2;
    for (var k = 0; k < clusters; k++) {
      var f2 = 0.97 - k * 0.19 - r() * 0.04, sx = x + lean * h * f2 * f2, sy = y - h * f2;
      var n = 4 + Math.round(r() * 3);
      for (var j = 0; j < n; j++) {
        var side = (j + k) % 2 ? 1 : -1, th = 0.15 + r() * 0.95;
        var len = Math.max(6, h * (0.15 + r() * 0.09)), wid = len * 0.2;
        var ex = sx + side * len * Math.cos(th), ey = sy + len * Math.sin(th);
        var mx = (sx + ex) / 2, my = (sy + ey) / 2, ux = (ex - sx) / len, uy = (ey - sy) / len;
        c.fillStyle = j < 2 && n > 4 ? 'hsl(30 5% 40% / .55)' : ink;
        c.beginPath(); c.moveTo(sx, sy);
        c.quadraticCurveTo(mx - uy * wid, my + ux * wid, ex, ey);
        c.quadraticCurveTo(mx + uy * wid * 0.35, my - ux * wid * 0.35, sx, sy);
        c.fill();
      }
    }
    if (T.pr) {
      for (var b = 0; b < 6; b++) {
        var a = b / 6 * Math.PI * 2 + r(), rr = Math.max(1.4, h * 0.028);
        var bx = tipX + Math.cos(a) * h * 0.1, by = tipY + h * 0.08 + Math.sin(a) * h * 0.07;
        c.fillStyle = 'hsl(4 80% 48%)'; c.beginPath(); c.arc(bx, by, rr, 0, 7); c.fill();
        c.fillStyle = 'hsl(44 60% 90%)'; c.beginPath(); c.arc(bx, by, rr * 0.35, 0, 7); c.fill();
      }
    }
  },
  birds: 'hsl(30 8% 14% / .75)',
  label: { fill: 'hsl(44 30% 92% / .92)', line: 'hsl(30 8% 14% / .7)', text: 'hsl(30 8% 12%)' },
  year: 'hsl(44 30% 92% / .85)', yearY: 0.975,
  after: function (c, L, v) {
    if (v.b > L.W - 60) seal(c, L.W - 30, 12, 18, 'hsl(4 72% 44% / .9)', 'hsl(44 40% 92%)');
    paperGrain(c, L, v, this.grain, 'hsl(30 20% 30% / .05)', 'hsl(44 50% 97% / .08)');
  },
};

/* DUSK: the lake at sundown. A violet sky burning orange at the
   horizon, a crescent moon over today, clouds printed in gold outline,
   layered hills in mist, black pines on the shore, a torii at the gate of
   the current block, and swirling water. */
PRINT.dusk = {
  paper: 'hsl(36 34% 86%)', grain: [90, 60, 90],
  sky: function (c, L, v) {
    var hz = L.hz;
    var gr = c.createLinearGradient(0, 0, 0, hz);
    gr.addColorStop(0, 'hsl(258 38% 22%)'); gr.addColorStop(0.32, 'hsl(282 30% 34%)');
    gr.addColorStop(0.58, 'hsl(344 42% 46%)'); gr.addColorStop(0.8, 'hsl(12 70% 55%)'); gr.addColorStop(1, 'hsl(30 84% 63%)');
    c.fillStyle = gr; c.fillRect(v.a, 0, v.b - v.a, hz + 1);
    /* the moon, over today */
    var mx = L.W - 70, my = L.H * 0.15, mr = L.H * 0.055;
    if (inView(v, mx - mr - 2, mx + mr + 2)) {
      var m = document.createElement('canvas'), s = Math.ceil(mr * 2 + 4), d = g.devicePixelRatio || 1;
      m.width = s * d; m.height = s * d;
      var mc = m.getContext('2d'); mc.scale(d, d);
      mc.fillStyle = 'hsl(44 70% 88%)'; mc.beginPath(); mc.arc(s / 2, s / 2, mr, 0, 7); mc.fill();
      mc.globalCompositeOperation = 'destination-out';
      mc.beginPath(); mc.arc(s / 2 + mr * 0.42, s / 2 - mr * 0.2, mr * 0.9, 0, 7); mc.fill();
      c.drawImage(m, mx - s / 2, my - s / 2, s, s);
    }
    /* clouds, printed in gold outline */
    each(v, 460, 'dc', function (r, x) {
      if (r() < 0.25) return;
      var cx = x + r() * 260, cy = L.H * (0.2 + r() * 0.2), w = 90 + r() * 150, h = 5 + r() * 4;
      c.beginPath();
      c.moveTo(cx, cy + h);
      var n = Math.max(3, Math.round(w / 26));
      for (var i = 0; i < n; i++) {
        var x0 = cx + w * i / n, x1 = cx + w * (i + 1) / n;
        c.quadraticCurveTo((x0 + x1) / 2, cy - h * (0.6 + r() * 0.8), x1, cy + h * 0.2);
      }
      c.quadraticCurveTo(cx + w + h * 1.6, cy + h * 0.6, cx + w - 2, cy + h * 1.3);
      c.lineTo(cx + 4, cy + h * 1.3);
      c.quadraticCurveTo(cx - h * 1.4, cy + h * 1.1, cx, cy + h);
      c.fillStyle = 'hsl(24 70% 66% / .5)'; c.fill();
      c.strokeStyle = 'hsl(42 85% 80% / .85)'; c.lineWidth = 1; c.stroke();
      /* a curl at the tail */
      c.beginPath(); c.arc(cx + w + 1, cy + h * 0.7, h * 0.55, Math.PI * 0.2, Math.PI * 1.6); c.stroke();
    });
  },
  far: function (c, L, v) {
    var H = L.H, hz = L.hz;
    band(c, v, hz - H * 0.08, H * 0.22, 150, 11, 'hsl(270 22% 50%)');
    var m1 = c.createLinearGradient(0, hz - H * 0.2, 0, hz - H * 0.04);
    m1.addColorStop(0, 'hsl(300 30% 70% / 0)'); m1.addColorStop(1, 'hsl(300 26% 72% / .55)');
    c.fillStyle = m1; c.fillRect(v.a, hz - H * 0.2, v.b - v.a, H * 0.16);
    band(c, v, hz - H * 0.01, H * 0.16, 90, 29, 'hsl(264 24% 40%)');
  },
  hill: function (c, P, L) {
    var pts = ridgeOf(P, L.hz), base = L.hz;
    shape(c, pts, base);
    c.fillStyle = 'hsl(254 26% 36%)'; c.fill();
    /* no canopy of rounds along the ridge since 0.3.1: a tree there is a
       session now */
  },
  block: function (c, P, L) {
    var pts = ridgeOf(P, L.hz), base = L.hz;
    shape(c, pts, base);
    var gr = c.createLinearGradient(0, P.top, 0, base);
    gr.addColorStop(0, 'hsl(256 32% 26%)'); gr.addColorStop(0.7, 'hsl(266 26% 40%)'); gr.addColorStop(1, 'hsl(290 24% 55%)');
    c.fillStyle = gr; c.fill();
    /* the last light along the sunward ridge */
    c.strokeStyle = 'hsl(26 90% 68% / .55)'; c.lineWidth = 1; c.lineCap = 'round';
    c.beginPath();
    var started = false;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (p[0] < P.px - (P.px - P.a) * 0.4 || p[0] > P.px + 2) { started = false; continue; }
      started ? c.lineTo(p[0], p[1] + 0.6) : c.moveTo(p[0], p[1] + 0.6); started = true;
    }
    c.stroke();
    /* the shadow side, a shade darker, wiped across */
    c.save(); shape(c, pts, base); c.clip();
    /* it comes in over a short way past the summit, or the summit is a seam */
    var fade = (P.b - P.px) * 0.12, sd = c.createLinearGradient(P.px - fade, 0, P.b, 0);
    sd.addColorStop(0, 'hsl(250 32% 16% / 0)'); sd.addColorStop(0.2, 'hsl(250 32% 16% / .28)'); sd.addColorStop(1, 'hsl(250 32% 16% / 0)');
    c.fillStyle = sd; c.fillRect(P.px - fade, P.top, P.b - P.px + fade, base - P.top);
    c.restore();
  },
  mist: function (c, L, v) {
    var H = L.H, hz = L.hz;
    var fm = c.createLinearGradient(0, hz - H * 0.12, 0, hz);
    fm.addColorStop(0, 'hsl(300 26% 72% / 0)'); fm.addColorStop(1, 'hsl(310 30% 76% / .75)');
    c.fillStyle = fm; c.fillRect(v.a, hz - H * 0.12, v.b - v.a, H * 0.12);
    /* the far shore, a dark line of trees */
    band(c, v, hz + 2, H * 0.035, 30, 53, 'hsl(252 28% 20%)');
  },
  ground: function (c, L, v) {
    var H = L.H, hz = L.hz, shore = hz + (H - hz) * 0.6;
    var wg = c.createLinearGradient(0, hz, 0, shore);
    wg.addColorStop(0, 'hsl(28 82% 62%)'); wg.addColorStop(0.45, 'hsl(348 40% 52%)'); wg.addColorStop(1, 'hsl(262 32% 34%)');
    c.fillStyle = wg; c.fillRect(v.a, hz + 2, v.b - v.a, shore - hz - 2);
    /* the moon on the water */
    var mx = L.W - 70;
    if (inView(v, mx - 20, mx + 20)) {
      c.strokeStyle = 'hsl(44 70% 88% / .7)'; c.lineWidth = 1.4;
      for (var k = 0; k < 7; k++) { var yy = hz + 6 + k * (shore - hz) / 8, ww = 10 - k; c.beginPath(); c.moveTo(mx - ww, yy); c.lineTo(mx + ww, yy); c.stroke(); }
    }
    /* swirls, the way the prints cut moving water */
    each(v, 70, 'sw', function (r, x) {
      for (var i = 0; i < 2; i++) {
        var sx = x + r() * 70, sy = hz + 6 + r() * (shore - hz - 12), s = 3 + r() * 5;
        c.strokeStyle = 'hsl(38 80% 80% / ' + (0.25 + r() * 0.3) + ')'; c.lineWidth = 0.8;
        c.beginPath();
        if (r() < 0.4) {
          for (var a = 0; a < Math.PI * 2.6; a += 0.3) { var rr = s * (1 - a / 9); var px = sx + Math.cos(a) * rr, py = sy + Math.sin(a) * rr * 0.5; a ? c.lineTo(px, py) : c.moveTo(px, py); }
        } else {
          c.moveTo(sx - s * 2, sy); c.quadraticCurveTo(sx - s, sy - s * 0.7, sx, sy); c.quadraticCurveTo(sx + s, sy + s * 0.7, sx + s * 2, sy);
        }
        c.stroke();
      }
    });
    /* the gate into the current block */
    var last = L.blocks[L.blocks.length - 1];
    if (last && L.X) {
      var tx = L.X(last.start), ty = hz + (shore - hz) * 0.72, th = H * 0.11;
      if (inView(v, tx - th, tx + th)) torii(c, tx, ty, th, 'hsl(252 32% 10%)');
    }
    /* the near shore */
    c.beginPath(); c.moveTo(v.a - 4, H);
    for (var x2 = Math.floor(v.a / 4) * 4 - 4; x2 <= v.b + 4; x2 += 4) c.lineTo(x2, shore + NZ(x2 / 50) * H * 0.02);
    c.lineTo(v.b + 4, H); c.closePath();
    c.fillStyle = 'hsl(252 30% 9%)'; c.fill();
    /* reeds */
    each(v, 38, 'rd', function (r, x) {
      if (r() < 0.35) return;
      var rx = x + r() * 38, n = 3 + Math.round(r() * 4);
      c.strokeStyle = 'hsl(252 30% 9%)'; c.lineWidth = 1; c.lineCap = 'round';
      for (var i = 0; i < n; i++) {
        var hh = H * (0.05 + r() * 0.09), bend = (r() - 0.3) * hh * 0.5;
        c.beginPath(); c.moveTo(rx + i * 1.6, shore + 2); c.quadraticCurveTo(rx + i * 1.6 + bend * 0.3, shore - hh * 0.6, rx + i * 1.6 + bend, shore - hh); c.stroke();
      }
    });
  },
  tree: function (c, T, L) {
    var x = T.x, y = T.y, h = T.h, r = rng(T.seed), lean = (r() - 0.5) * 0.12;
    var col = 'hsl(252 32% 8%)';
    /* a black pine against a violet mountain needs the last light round
       its edge, or it is lost */
    c.save(); c.shadowColor = 'hsl(28 90% 70% / .8)'; c.shadowBlur = 2.5;
    c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round';
    c.lineWidth = Math.max(1, h * 0.032);
    var topX = x + lean * h;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + lean * h * 0.2, y - h * 0.6, topX, y - h); c.stroke();
    var pads = h > 60 ? 5 : h > 30 ? 4 : 3, spots = [];
    for (var k = 0; k < pads; k++) {
      var f = 0.42 + k * (0.58 / pads) + r() * 0.04, side = k === pads - 1 ? 0 : (k % 2 ? 1 : -1);
      var bx = x + lean * h * f * f, by = y - h * f;
      var pw = h * (0.3 - k * 0.03) * (side ? 1 : 0.75), ph = Math.max(1.3, h * 0.03);
      var px = bx + side * pw * 0.5;
      c.lineWidth = Math.max(0.8, h * 0.014);
      c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo((bx + px) / 2, by - ph * 1.2, px, by - ph * 0.3); c.stroke();
      /* a pad: flat underneath, a row of small rounds on top, the way the
         print cuts a pine's needles */
      c.beginPath(); c.ellipse(px, by - ph * 0.3, pw * 0.6, ph, 0, 0, 7); c.fill();
      var bumps = Math.max(2, Math.round(pw / 3.2));
      for (var j = 0; j < bumps; j++) {
        var q = (j + 0.5) / bumps, qx = px - pw * 0.55 + pw * 1.1 * q, rise = Math.sin(q * Math.PI);
        c.beginPath(); c.arc(qx, by - ph * (0.7 + rise * 0.9), Math.max(0.9, ph * (0.55 + rise * 0.5 + r() * 0.2)), 0, 7); c.fill();
      }
      spots.push([px, by - ph, pw]);
    }
    if (T.pr) {
      spots.forEach(function (s) {
        for (var i = 0; i < 3; i++) {
          c.fillStyle = i % 2 ? 'hsl(340 80% 80%)' : 'hsl(42 92% 74%)';
          c.beginPath(); c.arc(s[0] + (r() - 0.5) * s[2] * 0.9, s[1] + (r() - 0.5) * 3, Math.max(1.1, h * 0.02), 0, 7); c.fill();
        }
      });
    }
    c.restore();
  },
  birds: 'hsl(252 32% 12% / .85)',
  label: { fill: 'hsl(252 32% 12% / .78)', line: 'hsl(40 80% 76% / .8)', text: 'hsl(40 80% 86%)' },
  year: 'hsl(40 70% 82% / .75)', yearY: 0.975,
  after: function (c, L, v) {
    paperGrain(c, L, v, this.grain, 'hsl(260 20% 20% / .05)', 'hsl(40 60% 90% / .06)');
    frame(c, L, v, 'hsl(252 32% 10%)', this.paper);
  },
};

function torii(c, x, y, h, col) {
  var w = h * 0.9;
  c.fillStyle = col;
  c.fillRect(x - w * 0.34, y - h, h * 0.07, h);
  c.fillRect(x + w * 0.27, y - h, h * 0.07, h);
  c.beginPath();
  c.moveTo(x - w * 0.62, y - h * 0.9); c.quadraticCurveTo(x, y - h * 0.84, x + w * 0.62, y - h * 0.9);
  c.lineTo(x + w * 0.58, y - h * 0.8); c.quadraticCurveTo(x, y - h * 0.74, x - w * 0.58, y - h * 0.8); c.closePath(); c.fill();
  c.fillRect(x - w * 0.46, y - h * 0.66, w * 0.92, h * 0.06);
  /* its reflection */
  c.globalAlpha = 0.35;
  c.fillRect(x - w * 0.34, y, h * 0.07, h * 0.4);
  c.fillRect(x + w * 0.27, y, h * 0.07, h * 0.4);
  c.globalAlpha = 1;
}

/* ── one tile ── */
function paintTile(cv, L, printId, x0, w) {
  var P = PRINT[printId] || PRINT.fuji, H = L.H;
  var dpr = Math.min(3, g.devicePixelRatio || 1);
  cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(H * dpr));
  var c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, -x0 * dpr, 0);
  var v = { a: x0, b: x0 + w };
  c.fillStyle = P.paper; c.fillRect(v.a, 0, w, H);
  P.sky(c, L, v);
  P.far(c, L, v);
  L.peaks.forEach(function (pk) {
    ridgeOf(pk, L.hz);
    if (!inView(v, pk.a, pk.b)) return;
    (pk.kind === 'block' ? P.block : P.hill).call(P, c, pk, L);
  });
  P.mist(c, L, v);
  /* birds: decoration, never data */
  each(v, 900, 'bd' + printId, function (r, x) {
    if (r() < 0.45) return;
    flock(c, x + r() * 700, H * (0.12 + r() * 0.2), 3 + Math.round(r() * 5), 0.8 + r() * 0.5, P.birds);
  });
  P.ground(c, L, v);
  /* trees on the mountains, placed by the layout; drawn last of all the
     scenery so nothing stands in front of a session */
  L.trees.forEach(function (T) {
    if (!inView(v, T.x - T.h * 0.6, T.x + T.h * 0.6)) return;
    P.tree(c, T, L);
  });
  /* names on the blocks */
  c.font = labelFont(); c.textAlign = 'center'; c.textBaseline = 'middle';
  L.labels.forEach(function (lb) {
    if (!inView(v, lb.x, lb.x + lb.w)) return;
    var y = Math.max(8, lb.y), hh = 15;
    c.fillStyle = P.label.fill; c.fillRect(lb.x, y, lb.w, hh);
    c.strokeStyle = P.label.line; c.lineWidth = 1; c.strokeRect(lb.x + 0.5, y + 0.5, lb.w - 1, hh - 1);
    c.fillStyle = P.label.text; c.fillText(lb.text, lb.x + lb.w / 2, y + hh / 2 + 0.5);
  });
  c.textBaseline = 'alphabetic';
  if (L.years.length) {
    c.font = '600 10px ' + FONT; c.textAlign = 'left'; c.fillStyle = P.year;
    L.years.forEach(function (y) { if (inView(v, y.x, y.x + 30)) c.fillText(y.text, y.x + 3, H * P.yearY); });
  }
  P.after(c, L, v);
}

/* ── the whole picture on one canvas: kept for anything that calls it ── */
function widthFor(data, box) { return layout(data, null, box, 230).W; }
function draw(canvas, data, W, H, opts) {
  opts = opts || {};
  var L = layout(data, null, W, H || 230);
  paintTile(canvas, L, opts.print || 'fuji', 0, L.W);
  canvas.style.width = L.W + 'px'; canvas.style.height = L.H + 'px';
  return L;
}

/* ── the component ── */
var CSS = '' +
  '.rg-head{display:flex;flex-direction:column;gap:var(--s-1,4px);padding:var(--s-4,16px) var(--s-4,16px) var(--s-3,12px)}' +
  '.rg-top{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--s-2,8px);min-width:0}' +
  '.rg-stat{display:flex;flex-direction:column;gap:var(--s-1,4px);min-width:0}' +
  '.rg-num{font-family:var(--font-display,system-ui);font-size:var(--f-5,22px);font-weight:var(--w-bold,700);' +
    'color:var(--text-1,currentColor);font-variant-numeric:tabular-nums;line-height:1;' +
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.rg-lab{font-family:var(--font-display,system-ui);font-size:var(--f-1,12px);color:var(--text-2,currentColor);' +
    'letter-spacing:var(--track-cap,.08em);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.rg-info{font-size:var(--f-2,13px);color:var(--text-muted,currentColor);min-height:2.9em;line-height:1.45}' +
  '.rg-scroll{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;touch-action:pan-x pan-y}' +
  '.rg-scroll::-webkit-scrollbar{display:none}' +
  '.rg-strip{position:relative;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
  '.rg-strip canvas{position:absolute;top:0;display:block}' +
  '.rg-bar{display:flex;flex-direction:column;gap:var(--s-2,8px);padding:var(--s-3,12px) var(--s-4,16px) var(--s-4,16px)}' +
  '.rg-bar .mb-seg{width:100%}' +
  '.rg-seg{display:flex;gap:var(--s-1,4px)}' +
  '.rg-seg button{flex:1;min-height:var(--tap,44px);font:inherit;font-family:var(--font-display,system-ui);' +
    'letter-spacing:var(--track-cap,.08em);background:none;color:var(--text-2,currentColor);' +
    'border:var(--border-width,1px) solid var(--line,currentColor);border-radius:var(--radius-sm,6px);cursor:pointer}' +
  '.rg-seg button.on{color:var(--accent-fg,inherit);background:var(--accent,currentColor);border-color:var(--accent,currentColor)}';
function css() {
  if (document.getElementById('mb-range-css')) return;
  var s = document.createElement('style'); s.id = 'mb-range-css'; s.textContent = CSS;
  document.head.appendChild(s);
}
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function segmented(items, value, onChange) {
  if (g.UI && UI.segmented) return UI.segmented(items, value, onChange);
  var box = el('div', 'rg-seg');
  items.forEach(function (it) {
    var b = el('button', it.id === value ? 'on' : '', it.name); b.type = 'button';
    b.onclick = function () {
      box.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      onChange(it.id);
    };
    box.appendChild(b);
  });
  return box;
}
function pick(list, v, dflt) { return list.some(function (x) { return x.id === v; }) ? v : dflt; }

/* What the header says: all four totals, then what the picture is. */
function headline(L, opts) {
  var n = L.total, vol = opts.volume || function (kg) { return compact(kg) + ' kg'; };
  var v = vol(n.vol), sp = String(v).lastIndexOf(' ');
  return {
    stats: [
      { num: fmtN(L.blocks.length), lab: L.blocks.length === 1 ? 'block' : 'blocks' },
      { num: fmtN(n.sessions), lab: n.sessions === 1 ? 'session' : 'sessions' },
      { num: fmtN(n.sets), lab: n.sets === 1 ? 'set' : 'sets' },
      { num: sp > 0 ? v.slice(0, sp) : v, lab: sp > 0 ? v.slice(sp + 1) + ' volume' : 'volume' },
    ],
    info: 'Trees are sessions, taller for more sets. Mountains are blocks and hills are months outside one, ' +
      'taller for more ' + (L.mnt === 'sets' ? 'sets' : 'volume') + ' a week. Blossom is a record.',
  };
}
function describe(x, L, opts) {
  var vol = opts.volume || function (kg) { return compact(kg) + ' kg'; };
  if (x.s) {
    var s = x.s;
    return dayWords(s.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' +
      s.sets + (s.sets === 1 ? ' set' : ' sets') + (s.vol ? ' · ' + vol(s.vol) : '') + (s.pr ? ' · record' : '');
  }
  var P = x.peak, st = P.st;
  var when = P.kind === 'block' ? dayWords(P.start, { day: 'numeric', month: 'short' }) + ' to ' +
    dayWords(P.end, { day: 'numeric', month: 'short', year: 'numeric' }) : P.name;
  return (P.kind === 'block' ? P.name + ' · ' : '') + when + ' · ' + st.sessions + (st.sessions === 1 ? ' session' : ' sessions') +
    ' · ' + fmtN(st.sets) + ' sets' + (st.vol ? ' · ' + vol(st.vol) : '');
}

/** Put the range into `box`: a header that answers first, the print,
    scrollable and scrolled to today, and two switches under it.
    data: { sessions: [{date, vol, sets, pr}], phases: [{name, start, end}], to }
    opts: { base, print, volume(kg) → text, onChange({base, print}) }
    The caller keeps the choice (TRAIN and COACH each in a setting). */
function mount(box, data, height, opts) {
  opts = opts || {};
  css();
  box.innerHTML = '';
  var st = { print: pick(PRINTS, opts.print || opts.style, 'fuji') };
  var H = height || 230;
  var head = el('div', 'rg-head'), top = el('div', 'rg-top'), info = el('div', 'rg-info');
  var cells = [0, 1, 2, 3].map(function () {
    var c = el('div', 'rg-stat'), num = el('b', 'rg-num'), lab = el('span', 'rg-lab');
    c.appendChild(num); c.appendChild(lab); top.appendChild(c);
    return { num: num, lab: lab };
  });
  head.appendChild(top); head.appendChild(info);
  var sc = el('div', 'rg-scroll'), strip = el('div', 'rg-strip');
  sc.appendChild(strip);
  var bar = el('div', 'rg-bar');
  box.appendChild(head); box.appendChild(sc); box.appendChild(bar);

  var L = null, tiles = [], raf = 0, lastW = 0;
  var tell = function () { if (opts.onChange) opts.onChange({ print: st.print }); };
  bar.appendChild(segmented(PRINTS, st.print, function (id) { st.print = id; repaintAll(); tell(); }));

  function say() {
    var hl = headline(L, opts);
    hl.stats.forEach(function (x, i) { cells[i].num.textContent = x.num; cells[i].lab.textContent = x.lab; });
    info.textContent = hl.info;
    strip.setAttribute('aria-label', hl.stats.map(function (x) { return x.num + ' ' + x.lab; }).join(', ') + '. ' + hl.info);
  }
  function build(keep) {
    var bw = box.clientWidth || 360;
    lastW = bw;
    var frac = keep && L && sc.scrollWidth > sc.clientWidth
      ? (sc.scrollLeft + sc.clientWidth) / sc.scrollWidth : 1;
    L = layout(data, null, bw, H);
    strip.innerHTML = ''; tiles = [];
    strip.style.width = L.W + 'px'; strip.style.height = H + 'px';
    strip.setAttribute('role', 'img');
    for (var x = 0; x < L.W; x += TILE) {
      var w = Math.min(TILE, L.W - x), cv = el('canvas');
      cv.style.left = x + 'px'; cv.style.width = w + 'px'; cv.style.height = H + 'px';
      strip.appendChild(cv);
      tiles.push({ cv: cv, x: x, w: w, drawn: null });
    }
    say();
    /* open on the latest session, not on empty weeks since: a history that
       stopped in August should not open on seven weeks of bare field */
    var end = L.trees.length ? Math.min(L.W, Math.max.apply(null, L.trees.map(function (T) { return T.x; })) + 110) : L.W;
    sc.scrollLeft = Math.max(0, (frac < 1 ? frac * L.W : end) - sc.clientWidth);
    ensure();
  }
  function ensure() {
    raf = 0;
    if (!L) return;
    var a = sc.scrollLeft - TILE, b = sc.scrollLeft + (sc.clientWidth || lastW) + TILE;
    tiles.forEach(function (tl) {
      var near = tl.x + tl.w >= a && tl.x <= b;
      if (near && tl.drawn !== st.print) { paintTile(tl.cv, L, st.print, tl.x, tl.w); tl.drawn = st.print; }
      else if (!near && tl.drawn && (tl.x + tl.w < a - TILE * 2 || tl.x > b + TILE * 2)) {
        /* far away: give the memory back */
        tl.cv.width = 1; tl.cv.height = 1; tl.drawn = null;
      }
    });
  }
  function repaintAll() { tiles.forEach(function (tl) { tl.drawn = null; }); ensure(); }
  sc.addEventListener('scroll', function () { if (!raf) raf = (g.requestAnimationFrame || setTimeout)(ensure); }, { passive: true });
  /* a tap says what is under it: a tree's session, else the mountain or hill */
  strip.addEventListener('click', function (e) {
    if (!L) return;
    var r = strip.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    /* the nearest tree to the tap, measured to the middle of the tree,
       within a thumb */
    var best = null, bd = 1e9;
    L.trees.forEach(function (T) {
      var d = Math.hypot(T.x - x, T.y - T.h / 2 - y);
      if (d < bd) { bd = d; best = T; }
    });
    if (best && bd <= 22) { info.textContent = describe(best, L, opts); return; }
    var pk = null;
    L.peaks.forEach(function (P) { if (x >= P.x0 && x <= P.x1 && (!pk || P.kind === 'block')) pk = P; });
    if (pk) info.textContent = describe({ peak: pk }, L, opts);
    else say();
  });
  build(false);
  if (g.ResizeObserver) new g.ResizeObserver(function () {
    if (Math.abs(box.clientWidth - lastW) > 4) build(true);
  }).observe(box);
  return {
    redraw: function () { build(true); },
    canvas: tiles.length ? tiles[0].cv : null,
    state: function () { return { print: st.print, width: L ? L.W : 0, tiles: tiles.length,
      drawn: tiles.filter(function (x) { return x.drawn; }).length, layout: L }; },
  };
}

g.Range = { VERSION: VERSION, PRINTS: PRINTS, draw: draw, mount: mount, widthFor: widthFor,
            fromRows: fromRows, layout: layout, blocksOf: resolveBlocks };
})(window);
