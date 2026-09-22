/* shared/range.js — 0.1.1 — a training history as a woodblock landscape.

   Tom, 2026-09-20 and 2026-09-22: training blocks drawn as mountains and
   sessions as trees, in the manner of ukiyo-e, "meant to be a nice
   motivational tool". TRAIN draws a person's own, COACH draws a client's.

   What the picture says, and nothing else:
     · a MOUNTAIN is a training block (TRAIN's `phase` rows). It stands over
       the dates the block ran, and the more sessions it held, the higher it
       rises.
     · a TREE is a session, standing on the day it happened. More volume,
       taller tree. Every session grows one, and none is ever small enough to
       vanish, because a light day still happened.
     · a session that set a personal record BLOSSOMS.
   There is no bad weather, no dead tree and no verdict. It is a picture of
   what was done, which is the only kind of motivation the suite allows
   (root CLAUDE.md, self-efficacy: show him what he has already done).

   ── colours ──

   The one other file besides notice.js that writes colours down, for the
   same reason: the picture is the art, not the furniture, so a mountain is
   Prussian blue in every theme. hsl() on a canvas, never in a stylesheet,
   and nothing here reaches an app's own chrome.

   ── size ──

   Drawn at the box's real pixel size and device pixel ratio. Wider than its
   box when the history is long: at least WIDE pixels per day, so a year is a
   forest rather than a smear, and the caller scrolls it to today.          */

(function (g) {
'use strict';

var PAPER = 'hsl(40 38% 90%)', PAPER2 = 'hsl(38 34% 84%)';
var SUN = 'hsl(8 68% 56%)';
var FAR = 'hsl(212 28% 70%)', MID = 'hsl(214 34% 52%)';
var BLUE = 'hsl(216 48% 28%)', BLUE_L = 'hsl(214 40% 40%)', SNOW = 'hsl(40 40% 95%)';
var GROUND = 'hsl(80 22% 58%)', GROUND2 = 'hsl(78 24% 48%)';
var PINE = 'hsl(152 32% 24%)', PINE_L = 'hsl(150 28% 34%)', TRUNK = 'hsl(22 35% 28%)';
var BLOSSOM = 'hsl(345 72% 82%)', BLOSSOM2 = 'hsl(350 60% 70%)';
var INK = 'hsl(220 30% 18%)';
var WIDE = 3;          /* pixels per day at the least */
var DAY = 86400000;

function t(d) { return Date.parse(d + 'T00:00:00Z'); }
function days(a, b) { return Math.round((t(b) - t(a)) / DAY); }
/* a steady wobble, so the same history always draws the same picture */
function rnd(seed) { var x = Math.sin(seed * 12.9898) * 43758.5453; return x - Math.floor(x); }

/** the width the picture wants for this history, given the box it sits in */
function widthFor(data, box) {
  var s = data.sessions || [];
  if (!s.length) return box;
  var from = s[0].date, to = data.to || s[s.length - 1].date;
  return Math.max(box, (days(from, to) + 14) * WIDE);
}

function draw(canvas, data, W, H) {
  var dpr = g.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  var c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);

  var sessions = (data.sessions || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var phases = data.phases || [];
  var ground = H * 0.78;

  /* paper, and the wide bands of a printed sky */
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  c.fillStyle = PAPER2;
  for (var b = 0; b < 3; b++) c.fillRect(0, H * (0.12 + b * 0.13), W, H * 0.035);
  /* the sun, low and to the right, where today is */
  c.fillStyle = SUN;
  c.beginPath(); c.arc(W - Math.min(70, W * 0.12), H * 0.26, Math.min(H * 0.13, 30), 0, Math.PI * 2); c.fill();

  /* far ridges, for depth only: they stand for nothing */
  ridge(c, W, ground, H * 0.30, FAR, 11);
  ridge(c, W, ground, H * 0.22, MID, 29);

  if (!sessions.length) {
    groundBand(c, W, H, ground);
    c.fillStyle = INK; c.font = '600 13px system-ui, sans-serif'; c.textAlign = 'center';
    c.fillText('Your first session plants the first tree', W / 2, ground + (H - ground) / 2 + 4);
    return;
  }
  var from = sessions[0].date, to = data.to || sessions[sessions.length - 1].date;
  var span = Math.max(1, days(from, to) + 14);
  var pad = 7 * (W / span);
  var X = function (d) { return pad + days(from, d) / span * W; };

  /* the blocks, as mountains */
  var perPhase = phases.map(function (p) {
    var end = p.end || to;
    return sessions.filter(function (s) { return s.date >= p.start && s.date <= end; }).length;
  });
  var most = Math.max.apply(null, [1].concat(perPhase));
  phases.forEach(function (p, i) {
    var end = p.end || to;
    if (end < from || p.start > to) return;
    var x0 = X(p.start < from ? from : p.start), x1 = X(end > to ? to : end);
    if (x1 - x0 < 6) { x0 -= 3; x1 += 3; }
    var h = (ground - H * 0.10) * (0.45 + 0.55 * perPhase[i] / most);
    mountain(c, x0, x1, ground, h, i);
    /* its name at its foot, in ink, small */
    if (p.name && x1 - x0 > 44) {
      c.fillStyle = SNOW; c.font = '600 11px system-ui, sans-serif'; c.textAlign = 'center';
      c.fillText(String(p.name).toUpperCase().slice(0, 18), (x0 + x1) / 2, ground - 8);
    }
  });

  groundBand(c, W, H, ground);

  /* the sessions, as trees */
  var vmax = 0;
  sessions.forEach(function (s) { if (s.vol > vmax) vmax = s.vol; });
  var room = H - ground;
  var tall = ground * 0.55;
  var step = W / span;
  var tw = Math.max(4, Math.min(16, step * 2.2));
  sessions.forEach(function (s, i) {
    var x = X(s.date);
    var f = vmax ? s.vol / vmax : 0.5;
    var h = tall * (0.28 + 0.72 * f);
    var base = ground + room * (0.25 + 0.5 * rnd(i + 7));
    pine(c, x, base, h, tw, s.pr);
  });
}

function ridge(c, W, ground, h, colour, seed) {
  c.fillStyle = colour;
  c.beginPath(); c.moveTo(0, ground);
  var n = Math.max(4, Math.round(W / 140));
  for (var i = 0; i <= n; i++) {
    var x = i / n * W;
    c.lineTo(x, ground - h * (0.55 + 0.45 * rnd(seed + i)));
  }
  c.lineTo(W, ground); c.closePath(); c.fill();
}

/* A block's mountain: a Fuji-shaped cone with a snow cap and the dark
   bands a woodblock cutter leaves down its side. */
function mountain(c, x0, x1, ground, h, i) {
  var mid = (x0 + x1) / 2, top = ground - h, w = (x1 - x0) / 2;
  var flat = Math.min(w * 0.18, 14);
  c.fillStyle = BLUE;
  c.beginPath();
  c.moveTo(x0 - w * 0.25, ground);
  c.quadraticCurveTo(mid - w * 0.45, ground - h * 0.35, mid - flat, top);
  c.lineTo(mid + flat, top);
  c.quadraticCurveTo(mid + w * 0.45, ground - h * 0.35, x1 + w * 0.25, ground);
  c.closePath(); c.fill();
  /* the lit side */
  c.fillStyle = BLUE_L;
  c.beginPath();
  c.moveTo(mid + flat, top);
  c.quadraticCurveTo(mid + w * 0.45, ground - h * 0.35, x1 + w * 0.25, ground);
  c.lineTo(mid + w * 0.2, ground);
  c.quadraticCurveTo(mid + w * 0.1, ground - h * 0.5, mid + flat * 0.3, top + h * 0.05);
  c.closePath(); c.fill();
  /* snow, with the jagged edge */
  var sh = h * 0.24;
  c.fillStyle = SNOW;
  c.beginPath();
  c.moveTo(mid - flat, top);
  c.lineTo(mid + flat, top);
  var sx1 = mid + flat + w * 0.2, sx0 = mid - flat - w * 0.2;
  c.lineTo(sx1, top + sh);
  var teeth = 5;
  for (var k = 1; k <= teeth; k++) {
    var x = sx1 - (sx1 - sx0) * k / teeth;
    c.lineTo(x + (sx1 - sx0) / teeth / 2, top + sh * (k % 2 ? 1.35 : 0.8) + rnd(i * 9 + k) * sh * 0.2);
    c.lineTo(x, top + sh);
  }
  c.closePath(); c.fill();
}

function groundBand(c, W, H, ground) {
  c.fillStyle = GROUND; c.fillRect(0, ground, W, H - ground);
  c.fillStyle = GROUND2; c.fillRect(0, ground, W, 3);
}

/* A session's pine: three tiers of needles on a trunk. A record day wears
   blossom, the one reward in the picture. */
function pine(c, x, base, h, w, pr) {
  c.fillStyle = TRUNK;
  c.fillRect(x - Math.max(1, w * 0.1), base - h * 0.25, Math.max(2, w * 0.2), h * 0.25);
  for (var k = 0; k < 3; k++) {
    var y = base - h * (0.2 + k * 0.26), tw = w * (1 - k * 0.22);
    c.fillStyle = k % 2 ? PINE_L : PINE;
    c.beginPath();
    c.moveTo(x - tw, y); c.lineTo(x, y - h * 0.42); c.lineTo(x + tw, y);
    c.closePath(); c.fill();
  }
  if (pr) {
    for (var b = 0; b < 6; b++) {
      var a = b / 6 * Math.PI * 2 + 0.4;
      c.fillStyle = b % 2 ? BLOSSOM : BLOSSOM2;
      c.beginPath();
      c.arc(x + Math.cos(a) * w * 0.7, base - h * 0.62 + Math.sin(a) * h * 0.25, Math.max(1.6, w * 0.26), 0, Math.PI * 2);
      c.fill();
    }
  }
}

/** Put a scrollable range into `box`, scrolled to the latest session.
    data: { sessions: [{date, vol, pr}], phases: [{name, start, end}], to } */
function mount(box, data, height) {
  box.innerHTML = '';
  var H = height || 190;
  var scroller = document.createElement('div');
  scroller.style.cssText = 'overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;border-radius:inherit';
  var cv = document.createElement('canvas');
  cv.setAttribute('role', 'img');
  var n = (data.sessions || []).length, pn = (data.phases || []).length;
  cv.setAttribute('aria-label', n + ' sessions as trees, ' + pn + ' training blocks as mountains');
  scroller.appendChild(cv);
  box.appendChild(scroller);
  var paint = function () {
    var bw = box.clientWidth || 360;
    draw(cv, data, widthFor(data, bw), H);
    scroller.scrollLeft = scroller.scrollWidth;
  };
  paint();
  var last = box.clientWidth;
  if (g.ResizeObserver) new g.ResizeObserver(function () {
    if (Math.abs(box.clientWidth - last) > 4) { last = box.clientWidth; paint(); }
  }).observe(box);
  return { redraw: paint, canvas: cv };
}

/** what the range draws, from set and phase rows shaped like TRAIN's
    (a whole row with a payload, or the payload alone). TRAIN hands it its
    own rows and COACH a client's. */
function fromRows(sets, phases, to) {
  var by = {};
  (sets || []).forEach(function (r) {
    var s = r.payload || r;
    if (s.warm || !r.date) return;
    var d = by[r.date] || (by[r.date] = { date: r.date, vol: 0, pr: false });
    d.vol += (+s.kg || 0) * (+s.r || 0) || (+s.r || 0);
    if (s.pr) d.pr = true;
  });
  return {
    sessions: Object.keys(by).sort().map(function (k) { return by[k]; }),
    phases: (phases || []).map(function (r) { var p = r.payload || r; return { name: p.name, start: p.start, end: p.end || null }; })
      .filter(function (p) { return p.start; }),
    to: to,
  };
}

g.Range = { VERSION: '0.1.1', draw: draw, mount: mount, widthFor: widthFor, fromRows: fromRows };
})(window);
