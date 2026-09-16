/* ═══════════════════════════ MEASURE ═══════════════════════════

   A tracked field's numbers, read the same way by every app.

   STATUS owns the `field` definitions and the `ev` rows under them. LOG, the
   home screen and anything else only ever READ them, and until 2026-09-16
   each app carried its own copy of the rule for turning a day's readings into
   one number. Three copies, and they had drifted:

     STATUS       sum, average or latest, and counts what came off a food label
     LOG          the same, with the field's `per` multiplier
     home screen  average or latest only, and no food at all

   So a field set to SUM showed its last reading on the home screen instead of
   the total, and caffeine drunk as coffee showed nothing there, while STATUS
   and LOG both had it right. Nobody reported it, which is the point: three
   readers of one fact disagree quietly.

   The half-life sum had three copies too, two in STATUS and one in LOG, the
   last of them carrying a comment that said "change both".

   This file is the one reader. It writes nothing.

   Loaded with a plain <script src>, like everything in shared/, so it must
   not use modules and must work from file://. `Rec` has to be loaded first. */

const Measure = (() => {

  const n = (v, d) => { const x = parseFloat(v); return isNaN(x) ? d : x; };

  /** The field row, whether you hand this a field id or the row itself. */
  function fieldOf(f) {
    if (!f) return null;
    if (typeof f === 'object') return f;
    return (Rec.map('field') || {})[f] || null;
  }

  /** Every meal logged on a day, oldest first. STATUS's own reader, moved. */
  const meals = date => Rec.all('meal', { date: date })
    .map(r => Object.assign({ key: r.key }, r.payload))
    .sort((a, b) => a.t - b.t);

  /** The readings typed into STATUS for one field on one day. */
  function typed(date, fid) {
    const r = Rec.get('ev', date, fid);
    return r && r.e ? r.e.slice() : [];
  }

  /* A field may be fed by food as well as by hand: caffeine is the reason it
     exists. `from` names the nutrient on the meal, `per` scales it, and an
     evening coffee counts whether it was typed as a dose or eaten as a meal. */
  function fromFood(date, f) {
    f = fieldOf(f);
    if (!f || !f.from) return [];
    const per = f.per == null ? 1 : f.per;
    const out = [];
    meals(date).forEach(m => {
      const v = (n(m[f.from], 0) || 0) * per;
      if (v > 0) out.push({ t: m.t, v: v, food: m.name });
    });
    return out;
  }

  /** Every reading for a field on a day, in the order they happened. */
  function entries(date, f) {
    f = fieldOf(f);
    if (!f) return [];
    const mine = typed(date, f.id);
    if (!f.from) return mine;
    return mine.concat(fromFood(date, f)).sort((a, b) => a.t - b.t);
  }

  /* The day's one number, by the field's own rule. Latest is the default
     because most measures are a state rather than a count: your weight today
     is the last time you stood on the scale, not the average of three tries. */
  function dayValue(f, es) {
    f = fieldOf(f) || {};
    if (!es || !es.length) return null;
    const vs = es.map(x => n(x && typeof x === 'object' ? x.v : x, NaN)).filter(v => !isNaN(v));
    if (!vs.length) return null;
    if (f.agg === 'sum') return vs.reduce((a, v) => a + v, 0);
    if (f.agg === 'avg') return vs.reduce((a, v) => a + v, 0) / vs.length;
    return vs[vs.length - 1];
  }

  /** The day's number for one field, or null if nothing was logged. */
  function value(date, f) {
    f = fieldOf(f);
    return f ? dayValue(f, entries(date, f)) : null;
  }

  const logged = (date, f) => entries(date, f).length > 0;

  /* ── half-lives ──
     Anything with a `half` (in hours) decays on its own clock, and what is
     left is the sum of every dose still going. 200mg of caffeine at 8am on a
     five hour half-life is 100mg at 1pm and 50mg at 6pm. Yesterday's doses
     still count, which is the whole point: it is why an evening coffee turns
     up in tonight's sleep. */

  /** How many days back are worth gathering: four half-lives is 6% left. */
  const span = half => Math.ceil(n(half, 0) * 4 / 24) + 1;

  /** What is left at `at` (ms) of every dose in the list. */
  function decay(doses, half, at) {
    const h = n(half, 0);
    if (!h || !doses || !doses.length) return 0;
    const when = at == null ? Date.now() : at;
    return doses.reduce((total, e) => {
      const hrs = (when - (e.t || 0)) / 3600000;
      /* a dose that has not happened yet is not in you */
      return hrs < 0 ? total : total + n(e.v, 0) * Math.pow(0.5, hrs / h);
    }, 0);
  }

  /** Every dose of a field over the days its half-life can still reach. */
  function doses(date, f) {
    f = fieldOf(f);
    if (!f || !f.half) return [];
    const out = [];
    Day.range(Day.shift(date, -(span(f.half) - 1)), date)
      .forEach(d => entries(d, f).forEach(e => out.push(e)));
    return out.sort((a, b) => (a.t || 0) - (b.t || 0));
  }

  /** What is left of a field at a moment, counting the days before it. */
  function remaining(date, f, at) {
    f = fieldOf(f);
    return f && f.half ? decay(doses(date, f), f.half, at) : null;
  }

  return { entries, typed, fromFood, meals, dayValue, value, logged,
           span, decay, doses, remaining, fieldOf };
})();
