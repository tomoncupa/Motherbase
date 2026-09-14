/* ══════════════════════════════════════════════════════════════════════════
   CHART — every chart in the suite is drawn with this

   WHY THIS EXISTS. Tom, 2026-09-06, about the weight widget: "It doesnt even
   have a proper X axis, don't just fix this widget, review the foundation."
   The survey found 22 charts across four apps, four of them working out their
   own scale four different ways, and one app drawing a gridline at all.

   WHAT IT IS FOR NOW. Tom, 2026-09-14: "Graphs must be useful and feel cool,
   they must convey data quick", then "rewrite everything to follow the chart
   engine. Make charts beautiful and useful." So a chart here does not stop at
   an axis. It says the answer first and lets you look closer:

     THE ANSWER ON TOP   Chart.header: the number now, and what changed, in
                         words. Nobody should read an axis to learn the one
                         number the chart is about.
     DRAG TO EXPLORE     c.scrub: a finger or a mouse across the chart moves a
                         crosshair to the nearest point, and the header (or a
                         small tag) follows it. Lift the finger and it goes
                         back to now. Arrow keys do the same.
     ONE THING LOUD      c.end marks the latest value; c.bars can light one
                         bar and grey the rest. Everything else is quiet: hair
                         gridlines, muted labels, no vertical grid on time.
     FINISHED           a soft wash under a line, round bar tops, a draw-in
                         the first time a chart appears, and none of that
                         motion for anyone who asked their device for less.
     DRAWN AT ITS SIZE   Chart.mount measures the box and draws at that many
                         pixels, so a 12px label is 12px on a phone and on a
                         wide screen, and redraws when the box changes size.

   THEMING. Nothing in here names a colour. Every mark is a class coloured from
   theme tokens, so a chart is right in every theme STYLE makes.

   HOW IT IS USED

     const head = Chart.header({ label: 'Weight', value: '82.1', unit: 'kg',
                                 sub: 'down 2.5 kg in 30 days', when: 'today' });
     Chart.mount(box, { h: 160 }, c => {
       c.xTime('2026-08-15', '2026-09-14');   // or c.xLinear(0, 1440)
       c.yFit(values);                        // rounds out to a readable step
       c.grid();                              // lines across, numbers up the side
       c.timeAxis();                          // dates along the bottom
       c.area(points); c.line(points);        // points are [x, y]
       c.end(points[points.length - 1], '82.1');
       c.scrub(points, { onMove: p => head.set(...), onLeave: head.reset });
     });

   `x` is a date string for a time axis and a number for a linear one. The
   chart converts; the caller never does pixel arithmetic.
   ══════════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* The steps a person reads without doing arithmetic. A scale that lands on
     197 and 203 is true and useless. */
  const STEPS = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000];

  function niceStep(span, want) {
    const target = span / Math.max(1, want || 4);
    for (let i = 0; i < STEPS.length; i++) if (STEPS[i] >= target) return STEPS[i];
    /* Past the table the same 1, 2, 2.5, 5 pattern carries on by tens, so money
       in the tens of thousands gets four gridlines and not seventeen. */
    if (!(target < Infinity)) return STEPS[STEPS.length - 1];
    for (let p = 10000; ; p *= 10) {
      const m = [1, 2, 2.5, 5].filter(k => k * p >= target)[0];
      if (m) return m * p;
    }
  }

  /* Looked up, not captured: a page that loads this before day.js must still
     get dates on its axis. */
  const day = () => g.Day;
  /* A label carries the decimals its step needs and no more: a scale in steps
     of 2.5 says 2.5 and 7.5, and rounding those to 3 and 8 labelled a sleep
     chart with numbers that were not on it. */
  const decOf = step => {
    for (let d = 0; d < 3; d++) { const k = step * Math.pow(10, d); if (Math.abs(Math.round(k) - k) < 1e-9) return d; }
    return 2;
  };
  const fmtNum = (v, step) => {
    const d = decOf(step), r = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
    return d && !Number.isInteger(r) ? r.toFixed(d) : Math.round(r).toLocaleString();
  };

  function make(opts) {
    opts = opts || {};
    /* The svg carries no height of its own: `.mb-chart` fills its box. Drawn
       by Chart.mount, the viewBox is the box's own pixel size, so text and
       lines are the size they say. */
    const W = opts.w || 320, H = opts.h || 150;
    const autoL = !(opts.pad && opts.pad.l != null);
    const P = Object.assign({ l: 34, r: 12, t: 12, b: 22 }, opts.pad || {});

    const el = document.createElementNS(NS, 'svg');
    el.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    el.setAttribute('preserveAspectRatio', opts.stretch ? 'none' : 'xMidYMid meet');
    el.setAttribute('class', 'mb-chart' + (opts.anim ? ' mb-anim' : '') + (opts.cls ? ' ' + opts.cls : ''));
    if (opts.label) { el.setAttribute('role', 'img'); el.setAttribute('aria-label', opts.label); }

    const add = (tag, attrs, cls) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (cls) n.setAttribute('class', cls);
      el.appendChild(n);
      return n;
    };
    const tip = (node, text) => {
      if (!text) return;
      const t = document.createElementNS(NS, 'title');
      t.textContent = text;
      node.appendChild(t);
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

    /** Dates in, pixels out. */
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

    /** A hairline across at every step, with the number beside it. The left
        margin grows to fit the widest number, so "82,000" is never clipped. */
    c.grid = function (fmt) {
      const labs = [];
      for (let v = c.lo; v <= c.hi + 1e-9; v += c.step) labs.push([v, fmt ? fmt(v) : fmtNum(v, c.step)]);
      if (autoL) P.l = Math.max(P.l, Math.round(Math.max.apply(null, labs.map(l => String(l[1]).length)) * 7.2 + 12));
      labs.forEach(l => {
        const y = c.Y(l[0]);
        add('line', { x1: P.l, y1: y, x2: W - P.r, y2: y }, 'mb-gl');
        const t = add('text', { x: P.l - 6, y: y + 4, 'text-anchor': 'end' }, 'mb-lab');
        t.textContent = l[1];
      });
      return c;
    };

    /** Dates along the bottom, spaced to suit the span: 19 Aug, 2 Sep, 16 Sep
        rather than the first date and the last one. No vertical lines unless
        asked for, because on a time axis they are noise. */
    c.timeAxis = function (o) {
      const D = day();
      if (!c.time || !D) return c;
      o = o || {};
      const days = c.x1;
      const room = Math.max(2, Math.floor((W - P.l - P.r) / 64));
      const every = [1, 2, 3, 7, 14, 28, 91, 182, 365].filter(n => days / n <= room)[0] || 365;
      const put = n => {
        const d = D.shift(c.from, n);
        const x = c.X(d);
        if (o.ticks) add('line', { x1: x, y1: P.t, x2: x, y2: H - P.b }, 'mb-gl');
        const p = String(d).split('-');
        const t = add('text', { x: x, y: H - 6, 'text-anchor': n === 0 ? 'start' : n >= days ? 'end' : 'middle' }, 'mb-lab');
        t.textContent = +p[2] + ' ' + MON[+p[1] - 1] + (every >= 182 ? ' ' + String(p[0]).slice(2) : '');
      };
      let last = 0;
      for (let n = 0; n <= days; n += every) { put(n); last = n; }
      /* The far end always gets its date, unless it would sit on the last one. */
      if (days - last > every * 0.5) put(days);
      return c;
    };

    /** Hours along the bottom, for a chart of one day. */
    c.hourAxis = function (everyH, o) {
      o = o || {};
      const step = (everyH || 6) * 60;
      for (let mn = c.x0; mn <= c.x1; mn += step) {
        const x = c.X(mn);
        if (o.ticks) add('line', { x1: x, y1: P.t, x2: x, y2: H - P.b }, 'mb-gl');
        const h = Math.floor(mn / 60) % 24;
        const t = add('text', { x: x, y: H - 6, 'text-anchor': mn === c.x0 ? 'start' : mn >= c.x1 ? 'end' : 'middle' }, 'mb-lab');
        t.textContent = (h % 12 === 0 ? 12 : h % 12) + (h < 12 ? 'am' : 'pm');
      }
      return c;
    };

    /** Words along the bottom at chosen x values: months, set numbers. */
    c.labels = function (list, o) {
      o = o || {};
      (list || []).forEach(l => {
        const t = add('text', { x: c.X(l[0]), y: H - 6, 'text-anchor': 'middle' }, 'mb-lab' + (l[2] ? ' on' : ''));
        t.textContent = l[1];
      });
      return c;
    };

    /** A level to compare against: a target, a goal, a ceiling. */
    c.rule = function (v, label, cls) {
      if (v == null || v < c.lo || v > c.hi) return c;
      add('line', { x1: P.l, y1: c.Y(v), x2: W - P.r, y2: c.Y(v) }, cls || 'mb-rule');
      /* The label sits at the left end: the right end is where the latest
         value is marked, and the two would land on each other. */
      if (label) {
        const t = add('text', { x: P.l + 6, y: c.Y(v) - 5 }, 'mb-lab');
        t.textContent = label;
      }
      return c;
    };

    /* ── the marks ── */

    const path = pts => pts.map((p, i) => (i ? 'L' : 'M') + c.X(p[0]).toFixed(1) + ' ' + c.Y(p[1]).toFixed(1)).join(' ');
    const drawable = (n, cls) => { if (opts.anim && (!cls || cls === 'mb-line')) n.setAttribute('pathLength', 1); return n; };

    c.line = function (pts, cls) {
      if (!pts || pts.length < 2) return c;
      drawable(add('path', { d: path(pts) }, cls || 'mb-line'), cls);
      return c;
    };

    /** The soft wash under a line. Draw it before the line. */
    c.area = function (pts, cls, base) {
      if (!pts || pts.length < 2) return c;
      const b = c.Y(base != null ? Math.max(c.lo, Math.min(c.hi, base)) : c.lo).toFixed(1);
      add('path', { d: path(pts) + ' L' + c.X(pts[pts.length - 1][0]).toFixed(1) + ' ' + b +
        ' L' + c.X(pts[0][0]).toFixed(1) + ' ' + b + ' Z' }, cls || 'mb-area');
      return c;
    };

    /** A line that holds its value until the next point, for things that
        happen at a moment rather than changing continuously. */
    c.step_ = function (pts, cls) {
      if (!pts || !pts.length) return c;
      let d = 'M' + c.X(pts[0][0]).toFixed(1) + ' ' + c.Y(pts[0][1]).toFixed(1);
      for (let i = 1; i < pts.length; i++) {
        d += ' L' + c.X(pts[i][0]).toFixed(1) + ' ' + c.Y(pts[i - 1][1]).toFixed(1) +
             ' L' + c.X(pts[i][0]).toFixed(1) + ' ' + c.Y(pts[i][1]).toFixed(1);
      }
      drawable(add('path', { d: d }, cls || 'mb-line'), cls);
      return c;
    };

    c.dots = function (pts, cls, r) {
      (pts || []).forEach(p => {
        tip(add('circle', { cx: c.X(p[0]).toFixed(1), cy: c.Y(p[1]).toFixed(1), r: r || 2.5 }, cls || 'mb-dot'), p[2]);
      });
      return c;
    };

    /** The latest value, marked: a dot with a ring in the card's colour, and
        its number beside it. The one label a line chart always gets. */
    c.end = function (p, text) {
      if (!p || p[1] == null) return c;
      const x = c.X(p[0]), y = c.Y(p[1]);
      add('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 4.5 }, 'mb-end');
      if (text != null && text !== '') {
        const wide = String(text).length * 7.5 + 10;
        const right = x + wide <= W;
        const t = add('text', { x: right ? x + 9 : x, y: right ? y + 4 : y - 10, 'text-anchor': right ? 'start' : 'end' }, 'mb-endlab');
        t.textContent = text;
      }
      return c;
    };

    /** Bars that grow from zero, at most 24px wide with a round top, so a bar
        reads as a quantity and not as a block. `o.highlight` lights one bar
        (an index, or 'last') and quietens the rest: this week against the
        weeks before it. A point may carry a hover title as its third item. */
    c.bars = function (pts, cls, width, o) {
      o = o || {};
      pts = pts || [];
      const slot = (W - P.l - P.r) / Math.max(1, pts.length);
      const bw = width || Math.max(2, Math.min(24, slot * 0.62));
      const zero = c.Y(Math.max(c.lo, Math.min(c.hi, 0)));
      /* one bar by index or 'last', or every bar a function says yes to */
      const hl = o.highlight === 'last' ? pts.length - 1 : (typeof o.highlight === 'number' ? o.highlight : -1);
      const lit = typeof o.highlight === 'function' ? o.highlight : (p, i) => i === hl;
      if (o.highlight != null) el.classList.add('mb-emph');
      pts.forEach((p, i) => {
        if (p[1] == null) return;
        const x = c.X(p[0]) - bw / 2, y = c.Y(p[1]);
        const up = y <= zero, top = Math.min(y, zero), h = Math.max(1, Math.abs(zero - y));
        const r = Math.min(4, bw / 2, h);
        const d = up
          ? 'M' + x + ' ' + (top + h) + ' V' + (top + r) + ' Q' + x + ' ' + top + ' ' + (x + r) + ' ' + top +
            ' H' + (x + bw - r) + ' Q' + (x + bw) + ' ' + top + ' ' + (x + bw) + ' ' + (top + r) + ' V' + (top + h) + ' Z'
          : 'M' + x + ' ' + top + ' V' + (top + h - r) + ' Q' + x + ' ' + (top + h) + ' ' + (x + r) + ' ' + (top + h) +
            ' H' + (x + bw - r) + ' Q' + (x + bw) + ' ' + (top + h) + ' ' + (x + bw) + ' ' + (top + h - r) + ' V' + top + ' Z';
        tip(add('path', { d: d.replace(/(\d+\.\d{2})\d+/g, '$1') }, (cls || 'mb-bar') + (lit(p, i) ? ' on' : '')), p[2]);
      });
      return c;
    };

    /** The band between two lines: a cone of uncertainty, a range, a spread. */
    c.band = function (top, bottom, cls) {
      if (!top || !bottom || top.length < 2) return c;
      const d = path(top) + ' ' +
        bottom.slice().reverse().map(p => 'L' + c.X(p[0]).toFixed(1) + ' ' + c.Y(p[1]).toFixed(1)).join(' ') + ' Z';
      add('path', { d: d }, cls || 'mb-band');
      return c;
    };

    /** A word in the corner. */
    c.note = function (text, where) {
      const right = where !== 'left';
      const t = add('text', {
        x: right ? W - P.r : P.l, y: P.t + 4,
        'text-anchor': right ? 'end' : 'start',
      }, 'mb-lab');
      t.textContent = text;
      return c;
    };

    /** A second scale for something drawn over the top in another unit.
        Kept for old callers; a new chart should be a second chart instead,
        because two scales on one plot invent a relationship. */
    c.overlay = function (values) {
      const vs = (values || []).filter(v => v != null && isFinite(v));
      const peak = vs.length ? Math.max.apply(null, vs) : 1;
      return v => P.t + (1 - (v / (peak || 1))) * (H - P.t - P.b);
    };

    /** DRAG TO EXPLORE. Call last, after every mark. A pointer anywhere over
        the chart snaps a crosshair and a dot to the nearest point in `pts`.
        With `o.onMove(p, i)` the caller shows the value (usually in its
        Chart.header) and `o.onLeave()` puts it back; without, a small tag
        above the dot says `o.fmt(p)`. A finger that lifts lets go; a mouse
        that leaves lets go; arrow keys step point by point. The chart keeps
        vertical scrolling for the page, so a thumb can still scroll past it. */
    c.scrub = function (pts, o) {
      o = o || {};
      const list = (pts || []).filter(p => p && p[1] != null && isFinite(p[1]));
      if (!list.length) return c;
      const xs = list.map(p => c.X(p[0]));
      const grp = add('g', {}, 'mb-scrub');
      grp.style.display = 'none';
      const mk = (tag, attrs, cls) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); n.setAttribute('class', cls); grp.appendChild(n); return n; };
      const cross = mk('line', { y1: P.t, y2: H - P.b }, 'mb-x');
      const dot = mk('circle', { r: 5 }, 'mb-end');
      let tagBox = null, tagText = null;
      if (!o.onMove) { tagBox = mk('rect', { rx: 4, height: 20 }, 'mb-tagbox'); tagText = mk('text', { 'text-anchor': 'middle' }, 'mb-tag'); }
      let cur = -1;
      const show = i => {
        cur = i;
        const p = list[i], x = xs[i], y = c.Y(p[1]);
        cross.setAttribute('x1', x); cross.setAttribute('x2', x);
        dot.setAttribute('cx', x); dot.setAttribute('cy', y);
        if (tagText) {
          const s = o.fmt ? o.fmt(p) : fmtNum(p[1], c.step);
          const w = String(s).length * 7.2 + 14;
          const tx = Math.max(P.l + w / 2, Math.min(W - P.r - w / 2, x));
          const ty = Math.max(P.t + 2, y - 30);
          tagText.textContent = s;
          tagText.setAttribute('x', tx); tagText.setAttribute('y', ty + 14);
          tagBox.setAttribute('x', tx - w / 2); tagBox.setAttribute('y', ty); tagBox.setAttribute('width', w);
        }
        grp.style.display = '';
        if (o.onMove) o.onMove(p, i);
      };
      const hide = () => {
        if (cur < 0) return;
        cur = -1; grp.style.display = 'none';
        if (o.onLeave) o.onLeave();
      };
      const near = clientX => {
        const r = el.getBoundingClientRect();
        const x = (clientX - r.left) * W / (r.width || W);
        let best = 0, bd = Infinity;
        xs.forEach((v, i) => { const d = Math.abs(v - x); if (d < bd) { bd = d; best = i; } });
        return best;
      };
      el.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons || e.pressure) show(near(e.clientX)); });
      el.addEventListener('pointerdown', e => show(near(e.clientX)));
      el.addEventListener('pointerleave', hide);
      el.addEventListener('pointercancel', hide);
      el.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') hide(); });
      el.setAttribute('tabindex', '0');
      el.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          const step = e.key === 'ArrowRight' ? 1 : -1;
          show(cur < 0 ? list.length - 1 : Math.max(0, Math.min(list.length - 1, cur + step)));
        } else if (e.key === 'Escape') hide();
      });
      el.addEventListener('blur', hide);
      el.classList.add('mb-scrubs');
      return c;
    };

    return c;
  }

  /** Draw a chart at the size its box turned out to be, and again whenever the
      box changes size. `o.h` is the height in pixels, or a function of the
      width; with none, the box's own height. `draw(c, w, h)` does the marks.
      Motion plays on the first draw only, never on a resize.

      Measured synchronously, not in a frame callback: a frame callback never
      runs in a tab the browser is not painting, and WEALTH once drew nothing
      at all for that reason. The timeout is the second chance for a box that
      is not in the document yet. */
  function mount(box, o, draw) {
    css();
    o = o || {};
    /* With no height given, the chart FILLS its box: the svg lies over the box
       instead of inside its flow, so the drawing cannot make the box taller.
       In the flow, a chart sized from its box's height grew the box, which
       grew the chart, and a home widget went blank with a scrollbar. A box
       that turns out to have no height of its own is given one. */
    const fill = o.h == null;
    if (fill && !box.style.position) box.style.position = 'relative';
    let first = true, lastW = 0, lastH = 0;
    const go = force => {
      const rect = box.getBoundingClientRect();
      const w = Math.round(rect.width);
      /* a hidden panel measures a border's width; wait until it is shown */
      if (w < 24) return false;
      let h;
      if (fill) {
        h = Math.round(rect.height);
        if (h < 48) { h = o.minH || 160; box.style.height = h + 'px'; }
      } else h = Math.round(typeof o.h === 'function' ? o.h(w) : o.h);
      if (!force && w === lastW && h === lastH) return true;
      lastW = w; lastH = h;
      const c = make(Object.assign({}, o, { w: w, h: h, anim: first && o.anim !== false }));
      draw(c, w, h);
      if (fill) c.el.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%';
      box.innerHTML = '';
      box.appendChild(c.el);
      first = false;
      return true;
    };
    if (!go()) setTimeout(() => go(), 0);
    if (g.ResizeObserver) {
      const ro = new g.ResizeObserver(() => {
        if (!box.isConnected) { ro.disconnect(); return; }
        go();
      });
      ro.observe(box);
    }
    return { redraw() { go(true); } };
  }

  /** THE ANSWER ON TOP. A label, the number in large, what changed in a
      sentence, and when. `set` shows another point while dragging; `reset`
      goes back to the values it was made with. `o.size: 'sm'` for a widget. */
  function header(o) {
    css();
    o = o || {};
    const box = document.createElement('div');
    box.className = 'mb-chead' + (o.size === 'sm' ? ' sm' : '');
    const part = cls => { const n = document.createElement('div'); n.className = cls; box.appendChild(n); return n; };
    const k = part('k'), v = part('v'), d = part('d'), w = part('w');
    k.textContent = o.label || '';
    if (!o.label) k.style.display = 'none';
    const put = (value, sub, when) => {
      v.textContent = value == null ? '' : value;
      if (o.unit) { const s = document.createElement('small'); s.textContent = o.unit; v.appendChild(s); }
      d.textContent = sub || ''; d.style.display = sub ? '' : 'none';
      w.textContent = when || ''; w.style.display = when ? '' : 'none';
    };
    const api = {
      el: box,
      set: (value, sub, when) => put(value, sub, when),
      reset: () => put(o.value, o.sub, o.when),
    };
    api.reset();
    return api;
  }

  /** A trend in a line's height: no axis, the latest value marked. For a
      tile that says a number and needs to show which way it is going. */
  function spark(values, o) {
    css();
    o = o || {};
    const vs = (values || []).map(Number);
    const ok = vs.filter(v => isFinite(v));
    const c = make({ w: o.w || 120, h: o.h || 36, pad: { l: 3, r: 7, t: 7, b: 7 }, cls: 'mb-spark' });
    if (ok.length < 2) return c.el;
    const lo = Math.min.apply(null, ok), hi = Math.max.apply(null, ok);
    c.xLinear(0, vs.length - 1).ySet(lo, hi === lo ? lo + 1 : hi, 1);
    const pts = vs.map((v, i) => [i, v]).filter(p => isFinite(p[1]));
    c.area(pts);
    c.line(pts);
    c.end(pts[pts.length - 1]);
    return c.el;
  }

  /** How full, as a ring. `pct` is 0 to 1. The track is the same ring, quiet. */
  function ring(pct, o) {
    css();
    o = o || {};
    const S = o.size || 70, sw = o.stroke || 6, R = (S - sw) / 2, C = 2 * Math.PI * R;
    const el = document.createElementNS(NS, 'svg');
    el.setAttribute('viewBox', '0 0 ' + S + ' ' + S);
    el.setAttribute('width', S); el.setAttribute('height', S);
    el.setAttribute('class', 'mb-ring');
    const circle = cls => {
      const n = document.createElementNS(NS, 'circle');
      n.setAttribute('cx', S / 2); n.setAttribute('cy', S / 2); n.setAttribute('r', R);
      n.setAttribute('stroke-width', sw); n.setAttribute('class', cls);
      n.setAttribute('transform', 'rotate(-90 ' + S / 2 + ' ' + S / 2 + ')');
      el.appendChild(n);
      return n;
    };
    circle('tr');
    const fg = circle('fg');
    const p = Math.max(0, Math.min(1, pct || 0));
    fg.setAttribute('stroke-dasharray', C.toFixed(1));
    fg.setAttribute('stroke-dashoffset', (C * (1 - p)).toFixed(1));
    if (p <= 0) fg.style.display = 'none';
    return el;
  }

  /** Part of a whole, ranked. Each row is its name, its amount, its share, and
      a bar as long as its amount against the biggest one. It replaces a donut:
      lengths on one baseline are compared at a glance, and slices are not.
      rows: [{name, amt, id}]. o.fmt formats an amount; o.total makes the
      share; o.onPick(row) makes each row a button; o.max caps the list. */
  function shares(rows, o) {
    css();
    o = o || {};
    const list = (rows || []).filter(r => r && r.amt > 0).slice().sort((a, b) => b.amt - a.amt);
    const total = o.total || list.reduce((a, r) => a + r.amt, 0) || 1;
    const top = list.length ? list[0].amt : 1;
    const box = document.createElement('div');
    box.className = 'mb-shares';
    list.slice(0, o.max || list.length).forEach(r => {
      const row = document.createElement(o.onPick ? 'button' : 'div');
      row.className = 'mb-share' + (o.onPick ? ' mb-press' : '');
      if (o.onPick) { row.type = 'button'; row.onclick = () => o.onPick(r); }
      const n = document.createElement('span'); n.className = 'n'; n.textContent = r.name;
      const a = document.createElement('span'); a.className = 'a';
      a.textContent = o.fmt ? o.fmt(r.amt) : Math.round(r.amt).toLocaleString();
      const p = document.createElement('span'); p.className = 'p'; p.textContent = Math.round(r.amt / total * 100) + '%';
      a.appendChild(p);
      const t = document.createElement('span'); t.className = 't';
      const i = document.createElement('i'); i.style.width = Math.max(1, r.amt / top * 100).toFixed(1) + '%';
      t.appendChild(i);
      row.appendChild(n); row.appendChild(a); row.appendChild(t);
      box.appendChild(row);
    });
    return box;
  }

  /** Part of a whole, as a ring. Tom, 2026-09-14: "I would like some pie
      charts in WEALTH." Every slice is also a row in the key beside it, with
      its amount and share, so no slice is known by its colour alone. Pointing
      at a slice or its row lights it and dims the rest, and the middle says
      its amount, name and share; let go and the middle says the total again.
      Past `o.max` slices (six) the smallest fold into one Other, because a
      seventh colour cannot be told from its neighbours.
      rows: [{name, amt, id}]. o.fmt formats an amount; o.label is the word
      under the total; o.onPick(row) makes each row a button; o.size in px. */
  function pie(rows, o) {
    css();
    o = o || {};
    const fmt = o.fmt || (v => Math.round(v).toLocaleString());
    const all = (rows || []).filter(r => r && r.amt > 0).slice().sort((a, b) => b.amt - a.amt);
    const total = all.reduce((a, r) => a + r.amt, 0) || 1;
    const max = o.max || 6;
    const list = all.length <= max ? all : all.slice(0, max - 1).concat([{
      name: o.other || 'Other', amt: all.slice(max - 1).reduce((a, r) => a + r.amt, 0), other: true,
    }]);
    const S = o.size || 200, R = S / 2, IN = R * 0.6, RO = R - 1;

    const box = document.createElement('div');
    box.className = 'mb-pie';
    const ringBox = document.createElement('div');
    ringBox.className = 'ring';
    ringBox.style.width = S + 'px';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + S + ' ' + S);
    svg.setAttribute('class', 'mb-piesvg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', (o.label || 'total') + ' ' + fmt(total) + ': ' +
      list.map(r => r.name + ' ' + Math.round(r.amt / total * 100) + '%').join(', '));
    const mid = document.createElement('div');
    mid.className = 'mid';
    const mv = document.createElement('b'), mk = document.createElement('span'), mp = document.createElement('span');
    mp.className = 'pc';
    mid.appendChild(mv); mid.appendChild(mk); mid.appendChild(mp);
    const keys = document.createElement('div');
    keys.className = 'keys';

    const pt = (a, r) => (R + r * Math.cos(a)).toFixed(2) + ' ' + (R + r * Math.sin(a)).toFixed(2);
    const arc = (a0, a1) => {
      const big = a1 - a0 > Math.PI ? 1 : 0;
      return 'M' + pt(a0, RO) + ' A' + RO + ' ' + RO + ' 0 ' + big + ' 1 ' + pt(a1, RO) +
        ' L' + pt(a1, IN) + ' A' + IN + ' ' + IN + ' 0 ' + big + ' 0 ' + pt(a0, IN) + ' Z';
    };
    const say = r => {
      mv.textContent = fmt(r ? r.amt : total);
      mk.textContent = r ? r.name : (o.label || 'total');
      mp.textContent = r ? Math.round(r.amt / total * 100) + '%' : '';
    };
    const parts = [];
    const light = i => {
      box.classList.toggle('focus', i >= 0);
      parts.forEach((p, j) => { p.slice.classList.toggle('on', j === i); p.key.classList.toggle('on', j === i); });
      say(i >= 0 ? list[i] : null);
    };

    let a = -Math.PI / 2;
    list.forEach((r, i) => {
      const frac = r.amt / total, a1 = a + frac * Math.PI * 2;
      const slot = r.other ? 's0' : 's' + (i % 6 + 1);
      const slice = document.createElementNS(NS, 'path');
      /* one slice that is the whole ring is two halves: an arc that starts
         and ends at the same point draws nothing */
      slice.setAttribute('d', frac >= 0.9999 ? arc(-Math.PI / 2, Math.PI / 2) + ' ' + arc(Math.PI / 2, Math.PI * 1.5) : arc(a, a1));
      slice.setAttribute('class', 'mb-slice ' + slot);
      svg.appendChild(slice);

      const pickable = !!o.onPick && !r.other;
      const key = document.createElement(pickable ? 'button' : 'div');
      key.className = 'mb-key' + (pickable ? ' mb-press' : '');
      if (pickable) { key.type = 'button'; key.onclick = () => o.onPick(r); }
      const sw = document.createElement('i'); sw.className = slot;
      const n = document.createElement('span'); n.className = 'n'; n.textContent = r.name;
      const v = document.createElement('span'); v.className = 'v'; v.textContent = fmt(r.amt);
      const p = document.createElement('span'); p.className = 'p'; p.textContent = Math.round(frac * 100) + '%';
      key.appendChild(sw); key.appendChild(n); key.appendChild(v); key.appendChild(p);
      keys.appendChild(key);
      parts.push({ slice: slice, key: key });

      const on = () => light(i), off = () => light(-1);
      slice.addEventListener('pointerenter', on);
      slice.addEventListener('pointerdown', on);
      slice.addEventListener('pointerleave', off);
      if (pickable) slice.addEventListener('click', () => o.onPick(r));
      key.addEventListener('pointerenter', on);
      key.addEventListener('pointerleave', off);
      key.addEventListener('focus', on);
      key.addEventListener('blur', off);
      a = a1;
    });
    say(null);
    ringBox.appendChild(svg);
    ringBox.appendChild(mid);
    box.appendChild(ringBox);
    box.appendChild(keys);
    return box;
  }

  /** Which mark is which, for a chart with more than one series. items:
      [{name, kind: 'line' | 'dash' | 'bar' | 'dot', color: 'var(--data-2)'}] */
  function legend(items) {
    css();
    const box = document.createElement('div');
    box.className = 'mb-legend';
    (items || []).forEach(it => {
      const s = document.createElement('span');
      const i = document.createElement('i');
      i.className = it.kind || 'line';
      i.style.setProperty('--k', it.color || 'var(--accent)');
      s.appendChild(i);
      s.appendChild(document.createTextNode(it.name));
      box.appendChild(s);
    });
    return box;
  }

  /* One stylesheet, injected once, so an app gets a themed chart by drawing
     one. Tokens only: every colour comes from the theme. */
  let styled = false;
  function css() {
    if (styled || typeof document === 'undefined') return;
    styled = true;
    const s = document.createElement('style');
    s.id = 'mb-chart-css';
    s.textContent =
      '.mb-chart{display:block;width:100%;height:100%;overflow:visible;-webkit-tap-highlight-color:transparent}' +
      '.mb-chart.mb-scrubs{touch-action:pan-y;cursor:crosshair}' +
      '.mb-chart:focus{outline:none}' +
      '.mb-chart:focus-visible{outline:2px solid var(--focus,var(--accent));outline-offset:2px;border-radius:var(--radius-sm)}' +
      '.mb-gl{stroke:var(--border);stroke-width:1;vector-effect:non-scaling-stroke}' +
      '.mb-lab{fill:var(--text-muted);font-family:var(--font-mono);font-size:var(--f-1);font-variant-numeric:tabular-nums}' +
      '.mb-lab.on{fill:var(--text-1);font-weight:var(--w-bold)}' +
      '.mb-rule{stroke:var(--text-muted);stroke-width:1;stroke-dasharray:3 4;fill:none;vector-effect:non-scaling-stroke}' +
      '.mb-line{fill:none;stroke:var(--accent);stroke-width:2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}' +
      '.mb-area{fill:var(--accent);opacity:.12;stroke:none}' +
      '.mb-dot{fill:var(--accent);opacity:.5}' +
      '.mb-bar{fill:var(--accent)}' +
      '.mb-emph .mb-bar:not(.on){fill:var(--text-muted);opacity:.35}' +
      '.mb-band{fill:var(--accent);opacity:.1;stroke:none}' +
      '.mb-end{fill:var(--accent);stroke:var(--chart-bg,var(--surface-1));stroke-width:2.5}' +
      '.mb-endlab{fill:var(--text-1);font-family:var(--font-mono);font-size:var(--f-1);font-weight:var(--w-bold);font-variant-numeric:tabular-nums}' +
      '.mb-x{stroke:var(--text-muted);stroke-width:1;opacity:.6;vector-effect:non-scaling-stroke}' +
      '.mb-tagbox{fill:var(--surface-3);stroke:var(--border)}' +
      '.mb-tag{fill:var(--text-1);font-family:var(--font-mono);font-size:var(--f-1);font-weight:var(--w-bold)}' +
      '.mb-spark{height:auto}' +
      '@keyframes mb-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '@keyframes mb-fade{from{opacity:0}}' +
      '.mb-anim .mb-line[pathLength]{stroke-dasharray:1;stroke-dashoffset:1;' +
        'animation:mb-draw var(--dur-slow,700ms) var(--ease-out,ease) forwards}' +
      '.mb-anim .mb-area,.mb-anim .mb-bar,.mb-anim .mb-end,.mb-anim .mb-endlab,.mb-anim .mb-dot{' +
        'animation:mb-fade var(--dur-slow,700ms) var(--ease-out,ease) both}' +
      '@media (prefers-reduced-motion:reduce){.mb-anim .mb-line[pathLength]{stroke-dasharray:none;animation:none}' +
        '.mb-anim .mb-area,.mb-anim .mb-bar,.mb-anim .mb-end,.mb-anim .mb-endlab,.mb-anim .mb-dot{animation:none}}' +
      /* the answer on top */
      '.mb-chead{display:flex;flex-direction:column;gap:var(--s-1);min-width:0}' +
      '.mb-chead .k{font-family:var(--font-display);font-size:var(--f-1);letter-spacing:var(--track-cap);' +
        'text-transform:uppercase;color:var(--text-muted)}' +
      '.mb-chead .v{font-family:var(--font-display);font-size:var(--f-7);font-weight:var(--w-bold);' +
        'line-height:var(--lh-tight);color:var(--text-1)}' +
      /* in a small widget the answer is one line, so the chart keeps its room */
      '.mb-chead.sm{flex-direction:row;flex-wrap:wrap;align-items:baseline;column-gap:var(--s-2);row-gap:0}' +
      '.mb-chead.sm .v{font-size:var(--f-5)}' +
      '.mb-chead .v small{font-size:var(--f-2);font-weight:var(--w-body);color:var(--text-muted);margin-left:var(--s-1)}' +
      '.mb-chead .d{font-size:var(--f-2);color:var(--text-2);line-height:var(--lh-body)}' +
      '.mb-chead .w{font-size:var(--f-1);color:var(--text-muted)}' +
      /* a ring */
      '.mb-ring{display:block}.mb-ring circle{fill:none}' +
      '.mb-ring .tr{stroke:var(--surface-3)}' +
      '.mb-ring .fg{stroke:var(--accent);stroke-linecap:round;transition:stroke-dashoffset var(--dur-slow,700ms) var(--ease-out,ease)}' +
      /* shares */
      '.mb-shares{display:flex;flex-direction:column;gap:var(--s-1)}' +
      '.mb-share{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:baseline;column-gap:var(--s-3);row-gap:var(--s-1);' +
        'width:100%;min-height:var(--tap);padding:var(--s-2) 0;border:0;background:none;color:inherit;font:inherit;text-align:left}' +
      'button.mb-share{cursor:pointer}' +
      '.mb-share .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-1)}' +
      '.mb-share .a{color:var(--text-1);font-variant-numeric:tabular-nums;white-space:nowrap}' +
      '.mb-share .p{color:var(--text-muted);font-size:var(--f-1);margin-left:var(--s-2)}' +
      '.mb-share .t{grid-column:1 / -1;display:block;height:var(--s-2);border-radius:var(--radius-full);background:var(--surface-3);overflow:hidden}' +
      '.mb-share .t i{display:block;height:100%;border-radius:inherit;background:var(--accent)}' +
      '.mb-share:not(:first-child) .t i{opacity:.55}' +
      /* a pie: the ring, the answer in its middle, and a key of every slice */
      '.mb-pie{display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-5)}' +
      '.mb-pie .ring{position:relative;flex:0 0 auto;max-width:100%}' +
      '.mb-piesvg{display:block;width:100%;height:auto;animation:mb-fade var(--dur-slow,700ms) var(--ease-out,ease) both}' +
      '.mb-slice{stroke:var(--chart-bg,var(--surface-1));stroke-width:2;cursor:pointer;transition:opacity var(--dur-fast,140ms) linear}' +
      '.mb-pie.focus .mb-slice:not(.on){opacity:.25}' +
      '.mb-slice.s1{fill:var(--data-1)}.mb-slice.s2{fill:var(--data-2)}.mb-slice.s3{fill:var(--data-3)}' +
      '.mb-slice.s4{fill:var(--data-4)}.mb-slice.s5{fill:var(--data-5)}.mb-slice.s6{fill:var(--data-6)}' +
      '.mb-slice.s0{fill:var(--text-muted)}' +
      '.mb-pie .mid{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'text-align:center;pointer-events:none;padding:0 22%}' +
      '.mb-pie .mid b{font-family:var(--font-display);font-size:var(--f-5);font-weight:var(--w-bold);line-height:var(--lh-tight);color:var(--text-1)}' +
      '.mb-pie .mid span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--f-1);color:var(--text-muted)}' +
      '.mb-pie .keys{flex:1 1 220px;min-width:0;display:flex;flex-direction:column}' +
      '.mb-key{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;column-gap:var(--s-3);' +
        'width:100%;min-height:var(--tap);padding:0 var(--s-2);border:0;border-radius:var(--radius-sm);background:none;' +
        'color:inherit;font:inherit;text-align:left}' +
      'button.mb-key{cursor:pointer}' +
      '.mb-key.on{background:var(--surface-3)}' +
      '.mb-key i{display:block;width:var(--s-3);height:var(--s-3);border-radius:var(--radius-sm)}' +
      '.mb-key i.s1{background:var(--data-1)}.mb-key i.s2{background:var(--data-2)}.mb-key i.s3{background:var(--data-3)}' +
      '.mb-key i.s4{background:var(--data-4)}.mb-key i.s5{background:var(--data-5)}.mb-key i.s6{background:var(--data-6)}' +
      '.mb-key i.s0{background:var(--text-muted)}' +
      '.mb-key .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-1)}' +
      '.mb-key .v{font-variant-numeric:tabular-nums;color:var(--text-1)}' +
      '.mb-key .p{min-width:4ch;text-align:right;font-size:var(--f-1);color:var(--text-muted)}' +
      '@media (prefers-reduced-motion:reduce){.mb-piesvg{animation:none}.mb-slice{transition:none}}' +
      /* legend */
      '.mb-legend{display:flex;flex-wrap:wrap;gap:var(--s-1) var(--s-4);font-size:var(--f-1);color:var(--text-2);margin-top:var(--s-2)}' +
      '.mb-legend span{display:inline-flex;align-items:center;gap:var(--s-2)}' +
      '.mb-legend i{display:inline-block;width:var(--s-4);height:2px;border-radius:2px;background:var(--k)}' +
      '.mb-legend i.bar,.mb-legend i.dot{width:var(--s-2);height:var(--s-2)}' +
      '.mb-legend i.dot{border-radius:50%}' +
      '.mb-legend i.dash{height:0;background:none;border-top:2px dashed var(--k)}';
    document.head.insertBefore(s, document.head.firstChild);
  }

  g.Chart = {
    make: function (o) { css(); return make(o); },
    mount: mount,
    header: header,
    spark: spark,
    ring: ring,
    shares: shares,
    pie: pie,
    legend: legend,
    niceStep: niceStep,
  };
})(window);
