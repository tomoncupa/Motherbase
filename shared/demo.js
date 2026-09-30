/* shared/demo.js — 1.0.0 — the DEMO: a made-up person, and the way out
   ════════════════════════════════════════════════════════════════════════════
   Tom, 2026-09-30: "Do that" to a link that opens the whole suite filled with
   a made-up person's history, kept completely apart from his store, for
   filming tours without his money or health numbers on screen and for
   software clients to click through.

   Fetched only by shared/skins.js, only in the demo (?demo=1), only on the
   page itself and never in its frames. skins.js has already swapped the
   storage by the time this runs (see DEMO at the top of skins.js), so every
   row written here lands in the demo's own store. This file:

     · fills that store with JAMIE CRUZ, a made-up coach: sixteen weeks of
       training in TRAIN, weigh-ins, sleep, steps, meals and a shelf in
       STATUS and KITCHEN, check-ins, a BLOCK day and its ticks, QUESTS
       todos, LOG notes, six made-up clients in COACH and the money in
       WEALTH. Dates are counted back from today, so the demo is always
       current, and it is made fresh once a day and in each new tab, since
       it lives in the tab (skins.js). The numbers come from a
       fixed seed, so every demo shows the same person. Nobody in it is real.
     · draws the DEMO tab on the right edge of the screen, on every page.
       Pressing it offers LEAVE DEMO, which wipes the demo's store from this
       browser and opens the real suite.

   No photos: CHECK IN shows its camera placeholders, which is what a new
   person sees too.                                                         */
(function (g) {
  'use strict';
  if (!g.MB_DEMO || g.top !== g || g.MB_DEMO_JS) return;
  g.MB_DEMO_JS = true;
  var doc = g.document;
  var REAL = g.MB_DEMO_REAL || {};
  var VERSION = '1';

  /* ── the DEMO tab ── */
  function css() {
    if (doc.getElementById('mb-demo-css')) return;
    var s = doc.createElement('style');
    s.id = 'mb-demo-css';
    s.textContent =
      '#mb-demo{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:2147483000;' +
      'writing-mode:vertical-rl;text-orientation:mixed;display:flex;align-items:center;justify-content:center;' +
      'min-width:32px;min-height:88px;padding:var(--s-3,12px) var(--s-1,4px);border:0;cursor:pointer;' +
      'border-radius:var(--r-2,6px) 0 0 var(--r-2,6px);background:var(--accent,#F0B323);color:var(--accent-fg,#080B10);' +
      'font-family:var(--font-display,system-ui);font-weight:var(--w-bold,700);font-size:var(--f-2,13px);' +
      'letter-spacing:.24em;box-shadow:var(--e-2,0 4px 14px rgba(0,0,0,.35));-webkit-tap-highlight-color:transparent}' +
      '#mb-demo::after{content:"";position:absolute;inset:-6px -2px -6px -12px}' +
      '#mb-demo-wait{position:fixed;inset:0;z-index:2147483001;display:flex;flex-direction:column;align-items:center;' +
      'justify-content:center;gap:var(--s-3,12px);background:var(--bg,#080B10);color:var(--text-1,#E8EDF2);' +
      'font-family:var(--font-display,system-ui);letter-spacing:.2em;text-align:center;padding:var(--s-5,24px)}' +
      '#mb-demo-wait b{color:var(--accent,#F0B323);font-size:var(--f-5,22px)}' +
      '#mb-demo-wait span{font-family:var(--font-body,system-ui);letter-spacing:0;color:var(--text-2,#9AA7B4)}';
    (doc.head || doc.documentElement).appendChild(s);
  }
  function tab() {
    if (doc.getElementById('mb-demo')) return;
    css();
    var b = doc.createElement('button');
    b.id = 'mb-demo';
    b.type = 'button';
    b.textContent = 'DEMO';
    b.title = 'Demo mode: a made-up person. Press to leave.';
    b.setAttribute('aria-label', 'Demo mode, made-up data. Press to leave the demo.');
    b.onclick = ask;
    doc.body.appendChild(b);
  }
  function ask() {
    var UI = g.UI;
    var q = 'Leave the demo?', d = 'Everything here is made up. Leaving wipes it from this browser and opens your own suite.';
    if (UI && UI.confirm) UI.confirm(q, d, { title: 'DEMO', yes: 'LEAVE DEMO', no: 'STAY' }).then(function (y) { if (y) leave(); });
    else if (g.confirm(q + '\n\n' + d)) leave();
  }
  /* Total: the flag goes, the demo's rows go now, and the next page load
     (which holds nothing open) deletes its databases and keys (skins.js). */
  function leave() {
    try { REAL.sessionStorage.removeItem(REAL.flag); } catch (e) {}
    try { REAL.localStorage.setItem(REAL.wipe, '1'); } catch (e) {}
    try { if (g.Rec && g.Rec.clear) g.Rec.clear(); } catch (e) {}
    var home = root();
    var go = function () { g.location.replace(home); };
    if (g.Rec && g.Rec.saved) g.Rec.saved().then(go, go); else go();
    setTimeout(go, 1500);
  }
  /* the suite's front door, from where this file is */
  function root() {
    var me = '';
    var tags = doc.getElementsByTagName('script');
    for (var i = 0; i < tags.length; i++) if (/\/shared\/demo\.js(\?|$)/.test(tags[i].src)) { me = tags[i].src; break; }
    return me ? me.replace(/shared\/demo\.js.*$/, '') : g.location.pathname.replace(/[^/]*$/, '');
  }

  /* ── the made-up person ── */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var rnd = rng(20260930);
  var pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
  var between = function (a, b) { return a + rnd() * (b - a); };
  var round = function (v, step) { return Math.round(v / step) * step; };
  var slug = function (s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); };
  var seedId = function (name) { return 'seed-' + slug(name); };

  function build() {
    rnd = rng(20260930);
    var D = g.Day, R = g.Rec;
    var TODAY = D.today();
    var ago = function (n) { return D.shift(TODAY, -n); };
    var dow = function (date) { return new Date(date + 'T12:00:00').getDay(); };
    var at = function (date, h, m) { var x = new Date(date + 'T00:00:00'); x.setHours(h, m || 0, 0, 0); return x.getTime(); };
    var iso = function (ms) { return new Date(ms).toISOString(); };
    var NOW = Date.now();
    var rows = [];
    var seq = 0;
    var put = function (type, date, key, payload, ms) {
      var stamp = Math.min(ms || NOW - 60000, NOW - 60000);
      rows.push({ id: R.idOf(type, date, key), user_id: R.USER || 'local', type: type, date: date || null, key: String(key),
        payload: payload, updated_at: iso(stamp), deleted: false, by: 'demo' });
    };
    var setting = function (name, v) { put('setting', null, name, { v: v }); };
    var uid = function (ms) { seq++; return 'local-' + Math.floor(ms).toString(36) + '-' + ('0' + (seq % 1296).toString(36)).slice(-2) + 'dm'; };
    var jid = function (ms) { seq++; return 'j' + Math.floor(ms).toString(36) + (seq % 1296).toString(36); };

    /* ════ TRAIN ════ */
    var CATS = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core', 'Cardio', 'Forearms', 'Calves', 'Hamstrings', 'Glutes', 'Lower Back'];
    CATS.forEach(function (nm, i) { put('excat', null, slug(nm), { name: nm, slot: i, ord: i }); });
    /* [name, group, kind, first working weight, reps low, reps high] */
    var EX = [
      ['Barbell Bench Press', 'Chest', 0, 70, 5, 8], ['Incline Dumbbell Bench Press', 'Chest', 0, 24, 8, 12],
      ['Cable Fly', 'Chest', 0, 15, 12, 15], ['Push Up', 'Chest', 2, 0, 12, 20],
      ['Barbell Row', 'Back', 0, 60, 6, 10], ['Lat Pulldown', 'Back', 0, 55, 8, 12], ['Pull Up', 'Back', 2, 0, 6, 10],
      ['Seated Cable Row', 'Back', 0, 60, 8, 12], ['Deadlift', 'Back', 0, 120, 3, 5],
      ['Overhead Press', 'Shoulders', 0, 42.5, 5, 8], ['Dumbbell Shoulder Press', 'Shoulders', 0, 20, 8, 12],
      ['Lateral Raise', 'Shoulders', 0, 8, 12, 15], ['Face Pull', 'Shoulders', 0, 20, 12, 15],
      ['Barbell Squat', 'Legs', 0, 90, 5, 8], ['Leg Press', 'Legs', 0, 160, 10, 12], ['Bulgarian Split Squat', 'Legs', 0, 16, 8, 10],
      ['Leg Extension', 'Legs', 0, 45, 12, 15], ['Dumbbell Curl', 'Arms', 0, 12, 10, 12], ['Tricep Pushdown', 'Arms', 0, 25, 10, 15],
      ['Hanging Leg Raise', 'Core', 2, 0, 10, 15], ['Plank', 'Core', 2, 0, 1, 1], ['Walking', 'Cardio', 1, 0, 0, 0],
      ['Calf Raise', 'Calves', 0, 60, 10, 15], ['Romanian Deadlift', 'Hamstrings', 0, 80, 8, 10], ['Leg Curl', 'Hamstrings', 0, 40, 10, 12],
      ['Hip Thrust', 'Glutes', 0, 100, 8, 12], ['Back Extension', 'Lower Back', 2, 0, 12, 15],
    ];
    var EXI = {};
    EX.forEach(function (e, i) {
      EXI[e[0]] = e;
      put('exercise', null, seedId(e[0]), { name: e[0], cat: slug(e[1]), kind: e[2], inc: e[2] === 0 ? 2.5 : 1,
        rest: e[2] === 0 ? 120 : 60, unit: 0, fav: /Bench Press|Squat|Deadlift/.test(e[0]) && i < 14 ? 1 : 0, note: '', graph: 0, ord: i });
    });
    var DAYS = {
      1: ['Upper A', ['Barbell Bench Press', 'Barbell Row', 'Overhead Press', 'Lat Pulldown', 'Lateral Raise', 'Tricep Pushdown']],
      2: ['Lower A', ['Barbell Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise']],
      4: ['Upper B', ['Incline Dumbbell Bench Press', 'Pull Up', 'Dumbbell Shoulder Press', 'Seated Cable Row', 'Dumbbell Curl', 'Face Pull']],
      5: ['Lower B', ['Deadlift', 'Bulgarian Split Squat', 'Hip Thrust', 'Leg Extension', 'Hanging Leg Raise']],
    };
    var WEEKS = 16;
    /* the Monday sixteen weeks back */
    var start = ago(WEEKS * 7);
    while (dow(start) !== 1) start = D.shift(start, -1);
    var mid = D.shift(start, 8 * 7);
    put('phase', null, 'local-dmblock1', { name: 'Base Block', start: start });
    put('phase', null, 'local-dmblock2', { name: 'Strength Block', start: mid });
    put('activity', null, 'training', { name: 'Training', cat: 'body' });
    var kg = function (e, week) {
      if (!e[3]) return 0;
      var step = /Dumbbell|Split/.test(e[0]) ? 2 : 2.5;
      return round(e[3] * (1 + 0.011 * week), step);
    };
    var trainedDays = {};
    for (var day = start; day <= TODAY; day = D.shift(day, 1)) {
      var plan = DAYS[dow(day)];
      if (!plan) continue;
      var isToday = day === TODAY;
      if (!isToday && rnd() < 0.1) continue;          /* a missed day now and then */
      var week = Math.floor(D.diff(day, start) / 7);
      var strength = day >= mid;
      var t0 = at(day, 6, 40 + Math.floor(rnd() * 30)), tm = t0;
      var n = 0, order = [];
      plan[1].forEach(function (name, xi) {
        var e = EXI[name], id = seedId(name);
        order.push(id);
        var lo = strength && e[4] <= 8 ? Math.max(3, e[4] - 1) : e[4], hi = strength && e[5] <= 10 ? e[5] - 2 : e[5];
        var w = kg(e, week) * (strength && e[3] >= 40 ? 1.08 : 1);
        w = e[3] ? round(w, /Dumbbell|Split/.test(name) ? 2 : 2.5) : 0;
        var sets = xi < 2 ? 4 : 3;
        var planned = isToday && xi > 0;
        var o = 0;
        if (xi === 0 && e[3] >= 40) {
          tm += 90000;
          put('set', day, uid(tm), { ex: id, kg: round(w * 0.6, 2.5), r: 8, u: 'kg', done: planned ? 0 : 1, pr: 0, prf: 0, dist: 0, dur: 0, note: '', ord: ++o, warm: 1 }, tm);
          n++;
        }
        for (var si = 0; si < sets; si++) {
          tm += 150000;
          var reps = Math.max(1, Math.round(between(lo, hi + 0.99)) - (si === sets - 1 && rnd() < 0.4 ? 1 : 0));
          var p = { ex: id, kg: w, r: reps, u: 'kg', done: planned ? 0 : 1, pr: 0, prf: 0, dist: 0, dur: 0, note: '', ord: ++o };
          if (planned) p.plan = 1;
          if (!planned && rnd() < 0.05) p.note = pick(['Felt strong', 'Grip gave out', 'Paused reps', 'Slow eccentric']);
          put('set', day, uid(tm), p, tm);
          n++;
        }
      });
      put('session', day, '', { start: iso(t0), end: iso(isToday ? t0 + 20 * 60000 : tm + 5 * 60000), name: plan[0], note: '', order: order }, t0);
      put('tick', day, 'training', { src: 'train', qty: n }, tm);
      trainedDays[day] = 1;
    }
    setting('train.seen', 1);
    setting('train.unit', 'kg');
    setting('train.sortSeen', 1);

    /* ════ STATUS: what is tracked, and every day ════ */
    var FIELDS = [
      { id: 'weight', label: 'Weight', unit: 'kg', measure: 'number', once: 1, agg: 'last', step: .1, dec: 1, order: 1, on: 1, cat: 'body' },
      { id: 'sleep', label: 'Sleep', unit: 'hrs', measure: 'number', once: 1, agg: 'last', step: .5, dec: 1, target: 7, dir: 'gte', order: 2, on: 1, cat: 'pillar' },
      { id: 'steps', label: 'Steps', unit: '', measure: 'number', once: 1, agg: 'last', step: 500, dec: 0, target: 10000, dir: 'gte', order: 3, on: 1, cat: 'pillar', bump: [1000, 500, 100] },
      { id: 'mood', label: 'Mood', unit: '', measure: 'scale', once: 0, agg: 'avg', order: 4, on: 1, cat: 'feeling' },
      { id: 'energy', label: 'Energy', unit: '', measure: 'scale', once: 0, agg: 'avg', order: 5, on: 1, cat: 'feeling' },
      { id: 'trained', label: 'Trained', unit: '', measure: 'check', once: 1, agg: 'last', order: 6, on: 1, cat: 'pillar' },
    ];
    FIELDS.forEach(function (f) { put('field', null, f.id, f); });
    ['Cash', 'GCash', 'Card', 'Bank'].forEach(function (nm, i) { put('acct', null, nm.toLowerCase(), { name: nm, order: i }); });
    setting('status.seeded', 1);
    setting('status.targets', { p: 160, c: 230, f: 70, kcal: 2250, na: 3000, k: 4200 });
    var HIST = 120, w0 = 84.6;
    for (var i = HIST; i >= 0; i--) {
      var d = ago(i);
      var trend = w0 - (HIST - i) * 0.028;
      if (i > 0 || new Date().getHours() >= 7) {
        if (rnd() < 0.86) put('ev', d, 'weight', { e: [{ t: at(d, 6, 30), v: Math.round((trend + between(-0.45, 0.45)) * 10) / 10 }] }, at(d, 6, 30));
        put('ev', d, 'sleep', { e: [{ t: at(d, 6, 35), v: round(between(5.5, 8.5), 0.5) }] }, at(d, 6, 35));
      }
      if (i > 0) {
        put('ev', d, 'steps', { e: [{ t: at(d, 21, 30), v: round(between(5200, 13400), 100) }] }, at(d, 21, 30));
        put('ev', d, 'mood', { e: [{ t: at(d, 12, 0), v: Math.round(between(2.6, 5.4)) }] }, at(d, 12, 0));
        put('ev', d, 'energy', { e: [{ t: at(d, 15, 0), v: Math.round(between(2.4, 5.2)) }] }, at(d, 15, 0));
      }
    }

    /* ── food, meals, and the shelf ── */
    var FOODS = [
      ['f-oats', 'Rolled oats', 'Grains', 'g', { kcal: 379, p: 13.2, c: 67.7, f: 6.5, fib: 10.1, fe: 4.3, mg: 138, zn: 3.6, k: 362, ca: 52, na: 6 }, [['1 cup', 0.8]]],
      ['f-egg', 'Egg', 'Protein', 'g', { kcal: 143, p: 12.6, c: 0.7, f: 9.5, fe: 1.8, zn: 1.3, ca: 56, k: 138, na: 142, b12: 0.9, vd: 2, rae: 160 }, [['1 piece', 0.5]]],
      ['f-chx', 'Chicken breast (cooked)', 'Protein', 'g', { kcal: 165, p: 31, c: 0, f: 3.6, fe: 1, zn: 1, k: 256, na: 74, b12: 0.3, mg: 29 }, [['1 fillet', 1.5]]],
      ['f-rice', 'Jasmine rice (cooked)', 'Grains', 'g', { kcal: 130, p: 2.7, c: 28, f: 0.3, fib: 0.4, k: 35, na: 1, mg: 12, fe: 0.2 }, [['1 cup', 1.58]]],
      ['f-banana', 'Banana', 'Fruit', 'g', { kcal: 89, p: 1.1, c: 22.8, f: 0.3, fib: 2.6, k: 358, mg: 27, vc: 8.7 }, [['1 piece', 1.2]]],
      ['f-milk', 'Fresh milk', 'Dairy', 'ml', { kcal: 61, p: 3.2, c: 4.8, f: 3.3, ca: 113, k: 132, na: 43, vd: 1.1, b12: 0.45 }, [['1 glass', 2.5]]],
      ['f-tuna', 'Tuna in water', 'Protein', 'g', { kcal: 116, p: 25.5, c: 0, f: 0.8, na: 247, k: 237, b12: 2.5, vd: 1.7 }, [['1 can', 1.4]]],
      ['f-broc', 'Broccoli', 'Vegetables', 'g', { kcal: 34, p: 2.8, c: 6.6, f: 0.4, fib: 2.6, vc: 89, k: 316, ca: 47, fol: 63, rae: 31 }, [['1 cup', 0.9]]],
      ['f-sweetpot', 'Sweet potato (boiled)', 'Vegetables', 'g', { kcal: 76, p: 1.4, c: 17.7, f: 0.1, fib: 2.5, rae: 787, k: 230, vc: 12.8 }, [['1 piece', 1.5]]],
      ['f-yogurt', 'Greek yogurt', 'Dairy', 'g', { kcal: 97, p: 9, c: 3.9, f: 5, ca: 100, k: 141, na: 35, b12: 0.75 }, [['1 cup', 1.7]]],
      ['f-beef', 'Lean ground beef (cooked)', 'Protein', 'g', { kcal: 217, p: 26, c: 0, f: 12, fe: 2.7, zn: 6.3, b12: 2.6, k: 318, na: 76 }, [['1 serving', 1.5]]],
      ['f-bread', 'Whole wheat bread', 'Grains', 'g', { kcal: 247, p: 13, c: 41, f: 3.4, fib: 7, fe: 2.5, mg: 76, na: 450 }, [['1 slice', 0.35]]],
      ['f-pb', 'Peanut butter', 'Pantry', 'g', { kcal: 588, p: 25, c: 20, f: 50, fib: 6, mg: 154, k: 649, na: 17 }, [['1 tbsp', 0.16]]],
      ['f-apple', 'Apple', 'Fruit', 'g', { kcal: 52, p: 0.3, c: 13.8, f: 0.2, fib: 2.4, vc: 4.6, k: 107 }, [['1 piece', 1.8]]],
      ['f-whey', 'Whey protein', 'Supplements', 'g', { kcal: 400, p: 80, c: 8, f: 6, ca: 400, na: 200, k: 500 }, [['1 scoop', 0.3]]],
      ['f-spinach', 'Spinach', 'Vegetables', 'g', { kcal: 23, p: 2.9, c: 3.6, f: 0.4, fib: 2.2, fe: 2.7, mg: 79, vc: 28, fol: 194, rae: 469, k: 558, ca: 99 }, [['1 cup', 0.3]]],
    ];
    var FOOD = {};
    FOODS.forEach(function (x) {
      var base = Object.assign({ amt: 100, unit: x[3] }, x[4]);
      FOOD[x[0]] = { id: x[0], name: x[1], base: base, serves: x[5] };
      put('food', null, x[0], { id: x[0], name: x[1], brand: '', cat: x[2], base: base,
        serves: x[5].map(function (s) { return { label: s[0], mult: s[1] }; }), dflt: 0, uses: 30, last: ago(1) });
    });
    var mealOf = function (fid, grams, ms, extra) {
      var f = FOOD[fid], mult = grams / f.base.amt, p = { fid: fid, name: f.name, serve: Math.round(grams) + ' ' + f.base.unit, unit: f.base.unit,
        t: ms, amt: Math.round(grams), mult: Math.round(mult * 1000) / 1000, caff: 0, price: 0 };
      Object.keys(f.base).forEach(function (k) { if (k !== 'amt' && k !== 'unit') p[k] = Math.round(f.base[k] * mult * 10) / 10; });
      ['p', 'c', 'f', 'kcal', 'na', 'k', 'ca'].forEach(function (k) { if (p[k] == null) p[k] = 0; });
      return Object.assign(p, extra || {});
    };
    var MENU = [
      [7, 20, [['f-oats', 80], ['f-milk', 250], ['f-banana', 120]], [['f-egg', 100], ['f-bread', 70], ['f-pb', 16]]],
      [12, 30, [['f-rice', 220], ['f-chx', 160], ['f-broc', 100]], [['f-rice', 200], ['f-beef', 150], ['f-spinach', 60]]],
      [16, 0, [['f-yogurt', 170], ['f-apple', 180]], [['f-whey', 30], ['f-banana', 120]]],
      [19, 30, [['f-sweetpot', 250], ['f-tuna', 140], ['f-spinach', 60]], [['f-rice', 180], ['f-chx', 150], ['f-broc', 90]]],
    ];
    var eaten = {};
    var COUNT_AGO = 10;
    for (i = 45; i >= 1; i--) {
      d = ago(i);
      MENU.forEach(function (m, mi) {
        if (mi === 2 && rnd() < 0.3) return;
        var items = rnd() < 0.5 ? m[2] : m[3];
        items.forEach(function (it, k) {
          var ms = at(d, m[0], m[1] + k);
          var g0 = round(it[1] * between(0.9, 1.1), 5);
          put('meal', d, String(ms), mealOf(it[0], g0, ms), ms);
          if (i <= COUNT_AGO) eaten[it[0]] = (eaten[it[0]] || 0) + g0;
        });
      });
    }
    /* KITCHEN: counted ten days ago, a shop three days ago, a week planned */
    var LEFT = { 'f-oats': 650, 'f-egg': 480, 'f-chx': 900, 'f-rice': 2400, 'f-banana': 600, 'f-milk': 1200, 'f-tuna': 420, 'f-broc': 350,
      'f-sweetpot': 900, 'f-yogurt': 500, 'f-beef': 750, 'f-bread': 300, 'f-pb': 280, 'f-apple': 540, 'f-whey': 700, 'f-spinach': 120 };
    var SHOP = { 'f-chx': [1, 'kg'], 'f-rice': [2, 'kg'], 'f-egg': [12, 'pc'], 'f-banana': [6, 'pc'], 'f-broc': [500, 'g'], 'f-milk': [1, 'L'] };
    var shopDay = ago(3);
    Object.keys(LEFT).forEach(function (fid) {
      var f = FOOD[fid];
      var bought = 0;
      if (SHOP[fid]) {
        var s = SHOP[fid], q = s[0], u = s[1];
        bought = u === 'kg' || u === 'L' ? q * 1000 : u === 'pc' ? q * f.base.amt * f.serves[0][1] : q;
        put('buy', shopDay, uid(at(shopDay, 10, 0)), { food: fid, text: f.name, qty: q, unit: u, t: at(shopDay, 10, 0), src: 'kitchen' }, at(shopDay, 10, 0));
      }
      var q0 = Math.max(0, Math.round((eaten[fid] || 0) + LEFT[fid] - bought));
      put('kcount', ago(COUNT_AGO), fid, { q: q0, t: at(ago(COUNT_AGO), 9, 0) }, at(ago(COUNT_AGO), 9, 0));
    });
    [['f-rice', 1000], ['f-egg', 300], ['f-chx', 500], ['f-milk', 1000], ['f-oats', 400]].forEach(function (x) { put('kfood', null, x[0], { min: x[1] }); });
    var DISH = [
      ['kd-bowl', 'Chicken rice bowl', [['f-rice', 2.2], ['f-chx', 1.6], ['f-broc', 1]]],
      ['kd-oats', 'Oats and banana', [['f-oats', 0.8], ['f-milk', 2.5], ['f-banana', 1.2]]],
      ['kd-tuna', 'Tuna and sweet potato', [['f-sweetpot', 2.5], ['f-tuna', 1.4], ['f-spinach', 0.6]]],
    ];
    DISH.forEach(function (x, k) { put('kdish', null, x[0], { name: x[1], items: x[2].map(function (it) { return { food: it[0], mult: it[1] }; }), ord: k }); });
    for (i = 0; i <= 6; i++) {
      d = D.shift(TODAY, i);
      var slots = [['b', DISH[1]], ['l', DISH[0]], ['s', null], ['d', i % 2 ? DISH[2] : DISH[0]]];
      slots.forEach(function (sl, si) {
        var items = sl[1] ? sl[1][2] : [['f-yogurt', 1.7]];
        items.forEach(function (it, k) {
          var key = 'kp' + d.replace(/-/g, '') + si + k;
          var pay = { slot: sl[0], food: it[0], mult: it[1], ord: k };
          if (sl[1]) pay.dish = sl[1][0];
          put('kplan', d, key, pay, NOW - 3600000);
          /* this morning's breakfast is already eaten */
          if (i === 0 && sl[0] === 'b') {
            var ms = at(d, 7, 25 + k);
            put('meal', d, 'kitchen-' + key, mealOf(it[0], FOOD[it[0]].base.amt * it[1], ms, { src: 'kitchen' }), ms);
          }
        });
      });
    }
    setting('kitchen.ref', { sex: 'm', age: '31' });

    /* ── the journal: todos, notes, events, ideas ── */
    var ENTRIES = ['Slept badly, lots of noise outside', 'Good session, bench moved well', 'Meal prep done for three days',
      'Long walk after dinner', 'Low energy in the afternoon', 'Stretched for 15 minutes', 'Tried a new coffee place',
      'Rest day, felt recovered', 'Filmed two short clips for content', 'Client call went well'];
    var EVENTS = ['Dentist', 'Coffee with Marco', 'Haircut', 'Call with the accountant', 'Family lunch', 'Gym closed for repairs'];
    var IDEAS = ['A 30 day walking challenge for clients', 'Write a post about sleep and training', 'Batch cook on Sundays',
      'A simple warm-up checklist', 'Try a four day split next block'];
    for (i = 30; i >= 1; i--) {
      d = ago(i);
      var ms1 = at(d, 21, 10);
      if (rnd() < 0.7) put('note', d, jid(ms1), { kind: 'entry', text: pick(ENTRIES), t: ms1, made: d, at: null, dur: null, ord: 0, done: 0, cancelled: 0 }, ms1);
      if (rnd() < 0.2) { var me2 = at(d, 14, 0); put('note', d, jid(me2), { kind: 'event', text: pick(EVENTS), t: me2, made: d, at: '14:00', dur: 60, ord: 1, done: 0, cancelled: 0 }, me2); }
      if (rnd() < 0.12) { var mi2 = at(d, 10, 5); put('note', d, jid(mi2), { kind: 'idea', text: pick(IDEAS), t: mi2, made: d, at: null, dur: null, ord: 2, done: 0, cancelled: 0 }, mi2); }
      if (rnd() < 0.3) put('day', d, '', { note: pick(['Solid day', 'Busy with clients', 'Easy day', 'Travel day', 'Productive']), rest: trainedDays[d] ? 0 : 1 }, at(d, 22, 0));
    }

    /* ════ QUESTS ════ */
    [['health', 'Health', 1], ['work', 'Coaching', 2], ['home', 'Home', 3], ['content', 'Content', 4]].forEach(function (p, k) {
      put('project', null, p[0], { name: p[1], slot: p[2], ord: k });
    });
    var TODO = [
      ['Send Mika her new program', 'work', 1, 0, ['clients']], ['Renew gym insurance', 'home', 2, -3, []],
      ['Book a deload week', 'health', 2, 1, []], ['Record the squat tutorial', 'content', 1, 2, ['filming']],
      ['Reply to Paolo about his knee', 'work', 1, 0, ['clients']], ['Buy resistance bands', 'home', 3, 4, ['shopping']],
      ['Plan next month\'s posts', 'content', 2, 6, []], ['Check in with Bea', 'work', 2, 1, ['clients']],
      ['Pay the electricity bill', 'home', 1, -1, []], ['Update the client intake form', 'work', 3, 9, []],
      ['Edit the reel from Tuesday', 'content', 2, 3, ['filming']], ['Schedule blood test', 'health', 2, 12, []],
      ['Clean the kitchen', 'home', 3, 0, []], ['Write a newsletter', 'content', 3, 16, []],
    ];
    TODO.forEach(function (t, k) {
      var made = ago(4 + (k % 5)), ms = at(made, 9, k);
      put('note', made, jid(ms), { kind: 'todo', text: t[0], t: ms, made: made, at: null, dur: null, ord: k, done: 0, cancelled: 0,
        src: 'quest', due: D.shift(TODAY, t[3]), pri: t[2], proj: t[1], rep: null, tags: t[4] }, ms);
    });
    var rep = { txt: 'every monday', unit: 'week', every: 1, days: [1] }, nextMon = TODAY;
    while (dow(nextMon) !== 1) nextMon = D.shift(nextMon, 1);
    rep.from = nextMon;
    var msr = at(ago(20), 9, 0);
    put('note', ago(20), jid(msr), { kind: 'todo', text: 'Weekly client check-ins', t: msr, made: ago(20), at: null, dur: null, ord: 20, done: 0, cancelled: 0,
      src: 'quest', due: nextMon, pri: 1, proj: 'work', rep: rep, tags: ['clients'] }, msr);
    var DONE = ['Order protein', 'Film the deadlift clip', 'Fix the bike', 'Send invoices', 'Call Mom', 'Meal prep', 'Reply to emails',
      'Renew domain', 'Clean the car', 'Post the weekly tip'];
    DONE.forEach(function (text, k) {
      var made = ago(2 + k * 2), done = D.shift(made, 1), ms = at(made, 10, k);
      put('note', made, jid(ms), { kind: 'todo', text: text, t: ms, made: made, at: null, dur: null, ord: k, done: 1, cancelled: 0,
        doneOn: done, doneAt: '17:30', by: '17:30', byAuto: 1, src: 'quest', due: done, pri: 0, proj: pick(['work', 'home', 'content', 'health']), rep: null, tags: [] }, at(done, 17, 30));
    });

    /* ════ BLOCK ════ */
    var LANES = [['m-morning', 'Morning', '06:00', '08:00'], ['m-work', 'Deep work', '09:00', '12:30'], ['m-evening', 'Evening', '19:30', '21:30']];
    LANES.forEach(function (l, k) { put('lane', null, l[0], { name: l[1], start: l[2], target: l[3], days: [1, 1, 1, 1, 1, 1, 1], ord: k }); });
    put('routine', null, 'd-week', { name: 'Weekday', ord: 0, routines: ['m-morning', 'm-work', 'm-evening'], picked: 1 });
    put('routine', null, 'd-weekend', { name: 'Weekend', ord: 1, routines: ['m-morning', 'm-evening'], picked: 1 });
    var PAL = ['#7ee8fa', '#9d8cff', '#ffb347', '#6ee7a8', '#ff6b81', '#5aa9ff', '#ffd166', '#4fd6c0'];
    var BLOCKS = {
      'm-morning': [['Water and sunlight', 5], ['Weigh in', 2], ['Train', 75], ['Journal', 10]],
      'm-work': [['Plan the day', 10], ['Client programs', 90], ['Messages', 30], ['Content', 60]],
      'm-evening': [['Walk', 20], ['Stretch', 15], ['Read', 20], ['Lights out', 5]],
    };
    var blockTicks = [];
    ['d-week', 'd-weekend'].forEach(function (dayId) {
      LANES.forEach(function (l) {
        if (dayId === 'd-weekend' && l[0] === 'm-work') return;
        BLOCKS[l[0]].forEach(function (b, k) {
          var bid = 'b-' + slug(b[0]);
          put('item', null, dayId + '|' + l[0] + '|' + bid, { srcId: bid, name: b[0], dur: b[1], color: PAL[(k + l[0].length) % PAL.length], note: '',
            days: [1, 1, 1, 1, 1, 1, 1], pin: false, at: null, pri: 0, energy: 1, done: false, hidden: false, ord: k, lane: l[0], rt: dayId });
          if (dayId === 'd-week') blockTicks.push([slug(b[0]) + '.' + slug(l[1]), l[0]]);
        });
      });
    });
    [['Meditate', 10], ['Cold shower', 5], ['Language practice', 15]].forEach(function (b, k) {
      put('item', null, 'lib|b-' + slug(b[0]), { name: b[0], dur: b[1], color: PAL[k], cat: '', energy: 1, ord: k, bin: 1 });
    });
    setting('block.week', ['d-weekend', 'd-week', 'd-week', 'd-week', 'd-week', 'd-week', 'd-weekend']);
    setting('block.current', 'd-week');
    /* BLOCK reads its buffer from a setting a new board writes; without it
       every block after the first says NaN */
    setting('block.gap', 0);
    setting('block.h24', false);
    put('rhythm', null, 'r-haircut', { kind: 'every', name: 'Haircut', color: PAL[5], n: 4, unit: 'week', from: ago(24), ord: 0 });
    put('rhythm', null, 'r-swim', { kind: 'anytime', name: 'Swim', color: PAL[0], times: 2, ord: 1 });
    for (i = 30; i >= 1; i--) {
      d = ago(i);
      var wk = dow(d) >= 1 && dow(d) <= 5;
      blockTicks.forEach(function (bt) {
        if (!wk && bt[1] === 'm-work') return;
        if (rnd() < 0.78) put('tick', d, bt[0], { src: 'block' }, at(d, 20, 0));
      });
      if (rnd() < 0.25) put('tick', d, 'swim', { src: 'block' }, at(d, 17, 0));
    }
    put('tick', ago(5), 'haircut', { src: 'block' }, at(ago(5), 11, 0));

    /* ════ LOG ════ */
    for (i = 10; i >= 1; i--) {
      d = ago(i);
      put('cell', d, 'done', { text: pick(['Two programs written, one check-in', 'Filmed and edited a reel', 'Admin and invoices', 'Three client sessions',
        'Planned the next block', 'Wrote the newsletter draft']) }, at(d, 21, 0));
    }

    /* ════ CHECK IN, the owner's own ════ */
    setting('checkin.name', 'Jamie');
    setting('checkin.animal', 'eevee');
    for (i = 12; i >= 0; i--) {
      d = ago(i * 7);
      var ms3 = at(d, 8, 0);
      put('cval', d, 'waist', { v: Math.round((88.4 - (12 - i) * 0.32 + between(-0.3, 0.3)) * 10) / 10 }, ms3);
      put('cval', d, 'training', { v: Math.round(between(3.5, 5.2)) }, ms3);
      put('cval', d, 'food', { v: Math.round(between(2.8, 4.9)) }, ms3);
      put('cval', d, 'sleep', { v: Math.round(between(2.6, 4.8)) }, ms3);
      if (i % 3 === 0) put('cval', d, 'note', { v: pick(['Clothes fit better', 'Busy week, still hit all sessions', 'Waist down again', 'Felt flat midweek']) }, ms3);
    }

    /* ════ COACH: made-up clients, and WEALTH's side of them ════ */
    var FIELDS_C = [{ id: 'front', label: 'Front', kind: 'photo', on: 1, ord: 0 }, { id: 'waist', label: 'Waist', kind: 'number', unit: 'cm', on: 1, ord: 1 },
      { id: 'training', label: 'Training this week', kind: 'scale', on: 1, ord: 2 }, { id: 'note', label: 'Anything else', kind: 'text', on: 1, ord: 3 }];
    /* [pid, name, creature, box, slot, cycle, rate, weight, lifts] */
    var CLIENTS = [
      ['p-mika', 'Mika R.', 'jigglypuff', 'online', 0, 'month', 3500, 61, ['Barbell Squat', 'Barbell Bench Press', 'Hip Thrust', 'Lat Pulldown']],
      ['p-paolo', 'Paolo D.', 'machop', 'online', 1, 'month', 3500, 88, ['Deadlift', 'Overhead Press', 'Barbell Row', 'Leg Press']],
      ['p-bea', 'Bea L.', 'vulpix', 'online', 2, 'month', 3000, 57, ['Romanian Deadlift', 'Dumbbell Shoulder Press', 'Seated Cable Row', 'Leg Curl']],
      ['p-rafa', 'Rafa G.', 'geodude', 'one', 0, 'pack', 0, 79, ['Barbell Squat', 'Barbell Bench Press', 'Pull Up', 'Romanian Deadlift']],
      ['p-lia', 'Lia M.', 'clefairy', 'one', 1, 'sesh', 1200, 64, ['Goblet Squat', 'Dumbbell Bench Press', 'Seated Cable Row', 'Hip Thrust']],
      ['p-nico', 'Nico T.', 'psyduck', 'past', 0, 'month', 3500, 92, ['Barbell Squat', 'Barbell Bench Press', 'Deadlift']],
    ];
    var LIFT0 = { 'Barbell Squat': 60, 'Barbell Bench Press': 45, 'Hip Thrust': 70, 'Lat Pulldown': 40, 'Deadlift': 100, 'Overhead Press': 35,
      'Barbell Row': 50, 'Leg Press': 120, 'Romanian Deadlift': 50, 'Dumbbell Shoulder Press': 10, 'Seated Cable Row': 40, 'Leg Curl': 30,
      'Pull Up': 0, 'Goblet Squat': 16, 'Dumbbell Bench Press': 14 };
    var cidx = 0;
    CLIENTS.forEach(function (c) {
      var pid = c[0], wc = 'c-' + pid.slice(2), since = ago(110 - cidx * 9), one = c[3] === 'one', past = c[3] === 'past';
      cidx++;
      put('cperson', null, pid, { name: c[1], animal: c[2], unit: 'kg', fields: FIELDS_C, seen: null, box: c[3], slot: c[4], wc: wc });
      put('client', null, wc, { name: c[1], rate: c[6], cycle: c[5], every: 1, start: since, status: past ? 'done' : 'on', cp: pid, note: '' });
      c[8].forEach(function (name, k) {
        put('cex', null, pid + '|' + seedId(name), { name: name, cat: slug((EXI[name] || [0, name === 'Goblet Squat' ? 'Legs' : 'Chest'])[1]), kind: LIFT0[name] ? 0 : 2,
          inc: 2.5, rest: 0, unit: 0, fav: 0, note: '', graph: 0, ord: k });
      });
      /* their training: an online client logs three times a week, a 1:1 is
         logged by the coach twice a week (keys with k-, which WEALTH counts) */
      var until = past ? ago(40) : TODAY;
      var sessions = 0;
      for (var dd = since; dd < until; dd = D.shift(dd, 1)) {
        var w = dow(dd), train = one ? (w === 2 || w === 5) : (w === 1 || w === 3 || w === 6);
        if (!train || rnd() < 0.12) continue;
        var weekN = Math.floor(D.diff(dd, since) / 7), t1 = at(dd, one ? 17 : 7, 0), tt = t1, order2 = [];
        c[8].forEach(function (name) {
          var id = seedId(name);
          order2.push(id);
          var base = LIFT0[name] || 0, wgt = base ? round(base * (1 + 0.013 * weekN), /Dumbbell|Goblet/.test(name) ? 2 : 2.5) : 0;
          for (var s = 0; s < 3; s++) {
            tt += 150000;
            var key = pid + '|' + (one ? 'k-' : '') + uid(tt);
            put('cset', dd, key, { ex: id, kg: wgt, r: Math.round(between(6, 10.99)), u: 'kg', done: 1, pr: 0, prf: 0, dist: 0, dur: 0, note: '', ord: s + 1 }, tt);
          }
        });
        put('csession', dd, pid + '|', { start: iso(t1), end: iso(tt + 300000), name: 'Session', note: '', order: order2 }, t1);
        if (one) put('sesh', dd, 'k-' + pid, { client: wc, src: 'coach', pid: pid }, tt);
        sessions++;
      }
      /* their check-ins, every week */
      for (var ci = 0; ci * 7 < D.diff(until, since); ci++) {
        var cd = D.shift(since, ci * 7 + 6);
        if (cd > until) break;
        var cm = at(cd, 9, 0);
        put('cval', cd, pid + '|weight', { v: Math.round((c[7] - ci * (c[7] > 80 ? 0.35 : 0.18) + between(-0.3, 0.3)) * 10) / 10 }, cm);
        put('cval', cd, pid + '|waist', { v: Math.round((c[7] * 1.05 - ci * 0.25) * 10) / 10 }, cm);
        put('cval', cd, pid + '|training', { v: Math.round(between(3, 5.4)) }, cm);
        put('checkin', cd, pid + '|', { sent: iso(cm) }, cm);
      }
      /* what they paid */
      if (c[5] === 'month') {
        for (var mo = 0; mo < 4; mo++) {
          var pd = D.shift(since, mo * 30 + 1);
          if (pd > until) break;
          put('paid', pd, 'pay-' + pid + '-' + mo, { amt: c[6], acct: 'bank', client: wc, note: 'Online coaching', t: at(pd, 11, 0), src: 'hand', loan: 0 }, at(pd, 11, 0));
        }
      } else if (c[5] === 'pack') {
        put('pack', since, 'pk-' + pid, { client: wc, n: 20, price: 22000, note: '20 sessions', parts: 1, when: 'before' }, at(since, 10, 0));
        put('paid', since, 'pay-' + pid, { amt: 22000, acct: 'bank', client: wc, note: 'Package of 20', t: at(since, 10, 0), src: 'hand', loan: 0 }, at(since, 10, 0));
      } else {
        put('paid', ago(14), 'pay-' + pid + '-a', { amt: c[6] * 4, acct: 'gcash', client: wc, note: 'Four sessions', t: at(ago(14), 18, 0), src: 'hand', loan: 0 }, at(ago(14), 18, 0));
      }
    });
    setting('coach.sel', 'p-mika');
    setting('coach.box', 'online');

    /* ════ WEALTH: counted balances, bills, pots, spending ════ */
    var cday = ago(45);
    [['cash', 4200], ['gcash', 12850], ['card', 0], ['bank', 86400]].forEach(function (a) { put('count', cday, a[0], { bal: a[1] }, at(cday, 9, 0)); });
    [['b-rent', 'Rent', 15000, 5, 'rent', 'bank'], ['b-power', 'Electricity', 2800, 18, 'utilities', 'gcash'], ['b-net', 'Internet', 1699, 12, 'utilities', 'gcash'],
      ['b-phone', 'Phone plan', 999, 22, 'utilities', 'gcash'], ['b-gym', 'Gym membership', 2500, 1, 'gym', 'bank'], ['b-music', 'Music streaming', 149, 9, 'subs', 'card']]
      .forEach(function (b, k) { put('bill', null, b[0], { name: b[1], amt: b[2], day: b[3], cycle: 'month', cat: b[4], acct: b[5], ord: k }); });
    put('pot', null, 'pot-emergency', { name: 'Emergency fund', target: 100000, acct: 'bank', ord: 0 });
    put('pot', null, 'pot-travel', { name: 'Japan trip', target: 60000, acct: 'bank', ord: 1 });
    for (i = 0; i < 4; i++) {
      var md = ago(100 - i * 30);
      put('move', md, 'mv-e' + i, { pot: 'pot-emergency', amt: 5000, dir: 'in' }, at(md, 12, 0));
      put('move', md, 'mv-t' + i, { pot: 'pot-travel', amt: 3000, dir: 'in' }, at(md, 12, 5));
    }
    var SPEND = [['Jollibee', 189, 'GCash'], ['Puregold groceries', 1850, 'Card'], ['Grab to BGC', 245, 'GCash'], ['Starbucks', 210, 'Card'],
      ['Mercury Drug', 420, 'Cash'], ['7-Eleven', 95, 'Cash'], ['SM Supermarket', 2300, 'Card'], ['Angkas', 120, 'GCash'],
      ['Mang Inasal', 199, 'GCash'], ['Shopee order', 780, 'GCash'], ['Barber', 250, 'Cash']];
    for (i = 60; i >= 1; i--) {
      d = ago(i);
      var nsp = Math.floor(between(0, 3.4));
      for (var sp = 0; sp < nsp; sp++) {
        var s2 = pick(SPEND), ms4 = at(d, 9 + Math.floor(rnd() * 11), Math.floor(rnd() * 59));
        put('spend', d, String(ms4), { amt: round(s2[1] * between(0.7, 1.35), 1), acct: s2[2], note: s2[0], t: ms4 }, ms4);
      }
    }

    /* ════ nags a first open would show ════ */
    return rows;
  }

  var APPS = ['home', 'block', 'status', 'train', 'quest', 'log', 'checkin', 'kitchen', 'wealth', 'coach', 'forge', 'arc', 'style',
    'form', 'portion', 'speak', 'system', 'mix', 'receipts', 'sheet', 'bullet'];
  function quiet() {
    var today = g.Day.today();
    try {
      APPS.forEach(function (a) { g.localStorage.setItem('mb.backup.' + a, today); });
      g.localStorage.setItem('lifeos_lastbackup', today);
    } catch (e) {}
  }

  function stamp() { return VERSION + '|' + g.Day.today(); }
  /* made today, and still there (a browser can clear the database and leave the key) */
  function seeded() {
    try { return g.localStorage.getItem('mb.demo.seeded') === stamp() && g.Rec.all('field').length > 0; } catch (e) { return false; }
  }

  /* Fill the store (once a day, in each tab), then open the page again on
     it. Once only: a page that comes back unfilled says so and stays. */
  function fill() {
    css();
    var w = doc.createElement('div');
    w.id = 'mb-demo-wait';
    w.innerHTML = '<b>DEMO</b><span>Filling in a made-up person</span>';
    doc.body.appendChild(w);
    var tried = null;
    try { tried = g.localStorage.getItem('mb.demo.tried'); } catch (e) {}
    if (tried === stamp()) {
      w.lastChild.textContent = 'This browser could not keep the demo. Open the link in a private window.';
      w.style.zIndex = '2147482999';   /* under the DEMO tab, so LEAVE DEMO can still be pressed */
      tab();
      return;
    }
    try { g.localStorage.setItem('mb.demo.tried', stamp()); } catch (e) {}
    var R = g.Rec;
    /* every kept-out type in first (records.js, KEPT OUT), or its rows would
       wait in a queue this page never lives to empty */
    R.need().then(function () {
      R.clear();
      R.merge(build());
      quiet();
      return R.saved();
    }).then(function () {
      try { g.localStorage.setItem('mb.demo.seeded', stamp()); } catch (e) {}
      g.location.reload();
    }, function () { w.lastChild.textContent = 'The demo could not be saved in this browser.'; });
  }

  function start() {
    if (!g.Rec || !g.Day) { tab(); return; }
    g.Rec.ready(function () { if (seeded()) tab(); else fill(); });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  g.MBDemo = { leave: leave, build: build, VERSION: VERSION };
})(window);
