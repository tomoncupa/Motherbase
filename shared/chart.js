/* ══════════════════════════════════════════════════════════════════════════
   CHART — the drawing layer every app was writing for itself

   WHY THIS EXISTS. Tom, 2026-09-06, about the weight widget: "It doesnt even
   have a proper X axis, don't just fix this widget, review the foundation."
   He was right, and the survey is worse than the widget:

     22 charts across four apps
      4 of them work out their own scale, four different ways
      1 app draws gridlines at all — TRAIN's fourteen charts and the home
        screen's four have no axis of any kind
      0 lines of shared drawing code

   So a chart got an axis only if somebody remembered to hand-write one, and
   the same three bugs kept being fixed separately: a scale that lands on 197
   and 203 instead of 195 and 200, an aspect-locked drawing that grows taller
   as its box grows wider until it pushes everything else out, and a time axis
   that is really just the first and last date.

   This is not a charting library and should not become one. It is the four
   things every chart in this suite needs and mostly did not have.

   WHAT IT WILL NOT DO. No animation, no tooltips of its own, no legend, no
   stacking, no second y-axis, no CDN. A chart here is read at a glance on a
   phone; anything that needs a hover is answering a question this suite asks
   somewhere else.

   THEMING. Nothing in here names a colour. Everything is a class, and
   `shared/skins.js` colours it — a chart is an app component like any other
   and a hex here would be a chart that works in one theme.

   HOW IT IS USED

     const c = Chart.make({ w: 320, h: 150 });
     c.xTime('2026-06-01', '2026-09-06');   // or c.xLinear(0, 1440)
     c.yFit(values);                        // rounds out to a readable step
     c.grid();                              // lines across, numbers up the side
     c.timeAxis();                          // dates along the bottom
     c.line(points, 'avg');                 // points are [x, y]
     c.dots(points, 'raw');
     node.appendChild(c.el);

   `x` is a date string for a time axis and a number for a linear one. The
   chart converts; the caller never does pixel arithmetic, which is where the
   four separate scale bugs came from.
   ══════════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  /* The steps a person reads without doing arithmetic. A scale that lands on
     197 and 203 is true and useless. */
  const STEPS = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000];

  function niceStep(span, want) {
    const target = span / Math.max(1, want || 4);
    for (let i = 0; i < STEPS.length; i++) if (STEPS[i] >= target) return STEPS[i];
    /* Past the table the same 1, 2, 2.5, 5 pattern carries on by tens. Money
       is the first thing here counted in tens of thousands, and stopping at
       5000 drew seventeen gridlines with their labels on top of each other
       (root brief, foundation item 8). */
    if (!(target < Infinity)) return STEPS[STEPS.length - 1];
    for (let p = 10000; ; p *= 10) {
      const m = [1, 2, 2.5, 5].filter(k => k * p >= target)[0];
      if (m) return m * p;
    }
  }

  /* ── looked up, not captured ──
     `const D = g.Day` at load time is undefined on any page that loads this
     before day.js, and then timeAxis() returns early and draws NOTHING - no
     error, no axis, just a chart that quietly has no dates on it. The smoke
     check found exactly that within a minute of being written, because the
     check page loads its scripts in a different order from the home screen.

     A shared file must not care what order it was loaded in. */
  const day = () => g.Day;

  function make(opts) {
    opts = opts || {};
    /* The drawing is a fixed shape and the BOX it goes in is not. The svg
       carries no height of its own: `.mb-chart` is height:100% and the caller
       gives it something to fill. That is the whole fix for a chart that grew
       taller every time its widget got wider. */
    const W = opts.w || 320, H = opts.h || 150;
    const P = Object.assign({ l: 34, r: 8, t: 10, b: 18 }, opts.pad || {});

    const el = document.createElementNS(NS, 'svg');
    el.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    el.setAttribute('class', 'mb-chart ' + (opts.cls || ''));

    const add = (tag, attrs, cls) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (cls) n.setAttribute('class', cls);
      el.appendChild(n);
      return n;
    };

    const c = {
      el: el, W: W, H: H, P: P, add: add,
      x0: 0, x1: 1, lo: 0, hi: 1, step: 1, time: false,
    };

    /* ── the two axes ── */

    c.xLinear = function (from, to) {
      c.time = false; c.x0 = from; c.x1 = to === from ? from + 1 : to;
      return c;
    };

    /** Dates in, pixels out. Everything between is this function's problem. */
    c.xTime = function (from, to) {
      c.time = true; c.from = from; c.to = to;
      c.x0 = 0; const D = day();
      c.x1 = Math.max(1, D ? D.diff(to, from) : 1);
      return c;
    };

    c.X = function (v) {
      const D = day();
      const n = c.time ? (D ? D.diff(v, c.from) : 0) : v;
      const t = (n - c.x0) / (c.x1 - c.x0 || 1);
      return P.l + Math.max(0, Math.min(1, t)) * (W - P.l - P.r);
    };
    c.Y = function (v) {
      const t = (v - c.lo) / (c.hi - c.lo || 1);
      return P.t + (1 - Math.max(0, Math.min(1, t))) * (H - P.t - P.b);
    };

    /** Round the value range out to a step somebody can read. */
    c.yFit = function (values, o) {
      o = o || {};
      const vs = (values || []).filter(v => v != null && isFinite(v));
      let lo = o.min != null ? o.min : (vs.length ? Math.min.apply(null, vs) : 0);
      let hi = o.max != null ? o.max : (vs.length ? Math.max.apply(null, vs) : 1);
      if (o.include != null) { lo = Math.min(lo, o.include); hi = Math.max(hi, o.include); }
      if (hi === lo) { hi = lo + 1; }
      const step = niceStep(hi - lo, o.lines || 4);
      c.step = step;
      c.lo = o.min != null ? o.min : Math.floor(lo / step) * step;
      c.hi = o.max != null ? o.max : Math.ceil(hi / step) * step;
      return c;
    };

    c.ySet = function (lo, hi, step) {
      c.lo = lo; c.hi = hi; c.step = step || niceStep(hi - lo, 4);
      return c;
    };

    /* ── the furniture ── */

    /** A line across at every step, with the number beside it. */
    c.grid = function (fmt) {
      const dec = c.step < 1 ? 1 : 0;
      for (let v = c.lo; v <= c.hi + 1e-9; v += c.step) {
        const y = c.Y(v);
        add('line', { x1: P.l, y1: y, x2: W - P.r, y2: y }, 'mb-gl');
        const t = add('text', { x: P.l - 4, y: y + 3, 'text-anchor': 'end' }, 'mb-lab');
        t.textContent = fmt ? fmt(v) : (dec ? v.toFixed(1) : Math.round(v).toLocaleString());
      }
      return c;
    };

    /** Dates along the bottom, at a spacing that suits the span.

        The point of the whole file in one function: a chart of ninety days
        should say 19/8, 2/9, 16/9 rather than the first date and the last one,
        which is what the weight widget had and what he called out. */
    c.timeAxis = function (o) {
      const D = day();
      if (!c.time || !D) return c;
      o = o || {};
      const days = c.x1;
      /* One label roughly every 60 drawn pixels, snapped to something a person
         counts in: days, weeks, fortnights, months.

         Sixty and not seventy, and that is not a taste. At seventy a ninety
         day chart worked out that it had room for three labels, found that
         every twenty-eight days needed 3.2 of them, rejected it, and fell
         through to every ninety-one - which is one label on a ninety day
         chart. Off by a fifth of a label and the axis disappears. */
      const room = Math.max(2, Math.floor((W - P.l - P.r) / 60));
      const every = [1, 2, 3, 7, 14, 28, 91, 182, 365]
        .filter(n => days / n <= room)[0] || 365;
      const put = n => {
        const d = D.shift(c.from, n);
        const x = c.X(d);
        if (o.ticks !== false) add('line', { x1: x, y1: P.t, x2: x, y2: H - P.b }, 'mb-gl');
        const t = add('text', { x: x, y: H - 5, 'text-anchor': 'middle' }, 'mb-lab');
        const p = String(d).split('-');
        t.textContent = +p[2] + '/' + +p[1];
      };
      let last = 0;
      for (let n = 0; n <= days; n += every) { put(n); last = n; }
      /* The far end always gets its date. An axis that stops two weeks short
         of the last dot invites you to read the chart as ending there. */
      if (days - last > every * 0.4) put(days);
      return c;
    };

    /** Hours along the bottom, for a chart of one day. */
    c.hourAxis = function (everyH) {
      const step = (everyH || 6) * 60;
      for (let mn = c.x0; mn <= c.x1; mn += step) {
        const x = c.X(mn);
        add('line', { x1: x, y1: P.t, x2: x, y2: H - P.b }, 'mb-gl');
        const t = add('text', { x: x, y: H - 5, 'text-anchor': 'middle' }, 'mb-lab');
        const h = Math.floor(mn / 60) % 24;
        t.textContent = (h % 12 === 0 ? 12 : h % 12) + (h < 12 ? 'am' : 'pm');
      }
      return c;
    };

    /** A level to compare against — a target, a goal, a ceiling. */
    c.rule = function (v, label, cls) {
      if (v == null || v < c.lo || v > c.hi) return c;
      add('line', { x1: P.l, y1: c.Y(v), x2: W - P.r, y2: c.Y(v) }, cls || 'mb-rule');
      if (label) {
        const t = add('text', { x: P.l + 2, y: c.Y(v) - 3 }, 'mb-lab');
        t.textContent = label;
      }
      return c;
    };

    /* ── the marks ── */

    const path = pts => pts.map((p, i) => (i ? 'L' : 'M') + c.X(p[0]).toFixed(1) + ' ' + c.Y(p[1]).toFixed(1)).join(' ');

    c.line = function (pts, cls) {
      if (!pts || pts.length < 2) return c;
      add('path', { d: path(pts) }, cls || 'mb-line');
      return c;
    };

    /** A line that holds its value until the next point. For anything that
        happens at a moment rather than changing continuously. */
    c.step_ = function (pts, cls) {
      if (!pts || !pts.length) return c;
      let d = 'M' + c.X(pts[0][0]).toFixed(1) + ' ' + c.Y(pts[0][1]).toFixed(1);
      for (let i = 1; i < pts.length; i++) {
        d += ' L' + c.X(pts[i][0]).toFixed(1) + ' ' + c.Y(pts[i - 1][1]).toFixed(1) +
             ' L' + c.X(pts[i][0]).toFixed(1) + ' ' + c.Y(pts[i][1]).toFixed(1);
      }
      add('path', { d: d }, cls || 'mb-line');
      return c;
    };

    c.dots = function (pts, cls, r) {
      (pts || []).forEach(p => {
        const n = add('circle', { cx: c.X(p[0]).toFixed(1), cy: c.Y(p[1]).toFixed(1), r: r || 2 }, cls || 'mb-dot');
        if (p[2]) {
          const t = document.createElementNS(NS, 'title');
          t.textContent = p[2];
          n.appendChild(t);
        }
      });
      return c;
    };

    c.bars = function (pts, cls, width) {
      const bw = width || Math.max(2, (W - P.l - P.r) / Math.max(1, pts.length) - 2);
      (pts || []).forEach(p => {
        const y = c.Y(p[1]), base = c.Y(Math.max(c.lo, 0));
        add('rect', { x: (c.X(p[0]) - bw / 2).toFixed(1), y: Math.min(y, base).toFixed(1),
                      width: bw.toFixed(1), height: Math.max(1, Math.abs(base - y)).toFixed(1) },
            cls || 'mb-bar');
      });
      return c;
    };

    /** The band between two lines. A cone of uncertainty, a range, a spread. */
    c.band = function (top, bottom, cls) {
      if (!top || !bottom || top.length < 2) return c;
      const d = path(top) + ' ' +
        bottom.slice().reverse().map(p => 'L' + c.X(p[0]).toFixed(1) + ' ' + c.Y(p[1]).toFixed(1)).join(' ') + ' Z';
      add('path', { d: d }, cls || 'mb-band');
      return c;
    };

    /** A word in the corner, for a series whose scale is its own. */
    c.note = function (text, where) {
      const right = where !== 'left';
      const t = add('text', {
        x: right ? W - 2 : P.l, y: P.t + 8,
        'text-anchor': right ? 'end' : 'start',
      }, 'mb-lab');
      t.textContent = text;
      return c;
    };

    /** A second scale, for something drawn over the top in another unit.
        Returns a Y function; it does not move the chart's own scale. */
    c.overlay = function (values) {
      const vs = (values || []).filter(v => v != null && isFinite(v));
      const peak = vs.length ? Math.max.apply(null, vs) : 1;
      return v => P.t + (1 - (v / (peak || 1))) * (H - P.t - P.b);
    };

    return c;
  }

  /* One stylesheet, injected once, so an app gets a themed chart by drawing
     one rather than by remembering to style it. */
  let styled = false;
  function css() {
    if (styled) return;
    styled = true;
    const s = document.createElement('style');
    s.textContent =
      '.mb-chart{display:block;width:100%;height:100%}' +
      '.mb-gl{stroke:var(--border);stroke-width:1;vector-effect:non-scaling-stroke}' +
      '.mb-lab{fill:var(--text-muted);font-family:var(--font-mono);font-size:8px}' +
      '.mb-rule{stroke:var(--data-3);stroke-width:1;stroke-dasharray:3 5;fill:none;' +
        'vector-effect:non-scaling-stroke}' +
      '.mb-line{fill:none;stroke:var(--accent);stroke-width:2;stroke-linejoin:round;' +
        'stroke-linecap:round;vector-effect:non-scaling-stroke}' +
      '.mb-dot{fill:var(--text-muted);opacity:.5}' +
      '.mb-bar{fill:var(--accent);opacity:.75}' +
      '.mb-band{fill:var(--data-4);opacity:.14;stroke:none}';
    document.head.appendChild(s);
  }

  g.Chart = {
    make: function (o) { css(); return make(o); },
    niceStep: niceStep,
  };
})(window);
