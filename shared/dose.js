/* ══════════════════════════════════════════════════════════════════════
   MOTHERBASE · DOSE
   One answer to "how much of this was taken, and when", for every app.

   Tom, 2026-10-30. HOME's HALF-LIFE card and STATUS's tile each kept their
   own copy of what counts as a dose. HOME learned journal lines and BLOCK
   ticks and STATUS did not, so one day read 10g on one screen and blank on
   the other. Both ask this file now, and nothing else may decide it.

   A tracker is a setting row `lifeos.halflife.<id>`, made by HOME's card:
   {name, field, match, per, bare, tick, unit, half, kind, cap, aim, aimName, ord}.
   What is tracked is the person's, never this file's.

   A dose comes from four places, read every time and never copied:
     reading  a STATUS measure's `ev` row, when the tracker names `field`
     food     the meals behind that measure, when it reads one (`from`, `per`)
     journal  a line written the way `match` says
     block    a BLOCK tick named in `tick`, only on a day with none of the
              others, since the tick and the line are the same dose
   A STATUS measure no tracker names is asked as {field: id}: its readings
   and its food.

   Every dose is {t, v, src, date}. A reading also keeps `et`, the time
   stored on it, which is how STATUS finds it to delete it; a food keeps
   `food`, the meal's name.

   `match`, comma separated:
     A, B       a word a dose starts with. One or two letters must start
                the line and are case-sensitive; a longer word may sit
                anywhere as a whole word, with its number after it or in
                front ("5g Word"). The number times `per` is the amount; no
                number counts as `bare`, or not at all when that is blank.
     word=50    that word always counts 50, once a day however many lines
     !words     a line holding those words is not a dose of this tracker
   `tick`: "Name=10", a tick of a block whose name starts with Name.
   Entries, events and done todos count; open todos, ideas and cancelled
   lines do not.
   ══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  if (g.Dose) return;

  const pad = n => String(n).padStart(2, '0');
  const ymd = ms => { const d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const noon = date => new Date(date + 'T12:00:00').getTime();
  /* a time stamped on another day than its row's is a backfill: it counts
     at that day's noon, not when it was typed */
  const onDay = (t, date) => !date ? t : t && ymd(t) === date ? t : noon(date);

  /* ── the trackers, kept until the store changes ── */
  let cache = null;
  function trackers() {
    if (!cache) {
      cache = g.Rec.all('setting')
        .filter(r => r.key.indexOf('lifeos.halflife.') === 0 && r.payload && r.payload.v && r.payload.v.name)
        .map(r => Object.assign({}, r.payload.v, { key: r.key.slice(7) }))
        .sort((a, b) => (a.ord || 0) - (b.ord || 0));
    }
    return cache;
  }
  if (g.Rec && g.Rec.on) g.Rec.on(() => { cache = null; });
  if (g.Rec && g.Rec.ready) g.Rec.ready(() => { cache = null; });
  /* the tracker that names this STATUS measure, if one does */
  const forField = fid => trackers().filter(x => x.field === fid)[0] || null;

  /* ── how a tracker's words are read ── */
  function words(x) {
    const parts = String(x.match || '').split(',').map(s => s.trim()).filter(Boolean);
    const skip = parts.filter(s => s[0] === '!').map(s => s.slice(1).trim().toLowerCase()).filter(Boolean);
    const names = parts.filter(s => s[0] !== '!').map(s => {
      const i = s.indexOf('='), a = i > 0 ? Number(s.slice(i + 1)) : NaN;
      return i > 0 && a > 0 ? [s.slice(0, i).trim(), a] : [s, null];
    }).filter(n => n[0]);
    const num = '\\s*(\\d+(?:\\.\\d+)?)?';
    const res = names.map(n => {
      const q = n[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return n[0].length <= 2
        ? new RegExp('^' + q + '(?![\\p{L}])' + num, 'u')
        : new RegExp('(?:^|[^\\p{L}\\d.])(?:(\\d+(?:\\.\\d+)?)\\s*(?:mg|g|ml)?\\s+)?' + q + '(?![\\p{L}])' + num, 'iu');
    });
    return { skip: skip, fixed: names.map(n => n[1]), res: res };
  }
  function ticksOf(x) {
    return String(x.tick || '').split(',').map(s => s.trim()).map(s => {
      const i = s.lastIndexOf('=');
      return [s.slice(0, i).trim().toLowerCase(), Number(s.slice(i + 1))];
    }).filter(t => t[0] && t[1] > 0);
  }

  /* ── the one rule ──
     `rows(type)` hands back the rows to read, so one day and every day run
     exactly the same code. */
  function build(x, rows) {
    const out = [], per = Number(x.per) || 1, bare = x.bare === '' || x.bare == null ? null : Number(x.bare);
    if (x.field) {
      const F = g.Rec.get('field', null, x.field) || {}, fp = F.per == null ? 1 : (Number(F.per) || 0);
      rows('ev').forEach(r => {
        if (r.key !== x.field) return;
        ((r.payload && r.payload.e) || []).forEach(e => {
          const v = Number(e.v);
          if (e.t && v > 0) out.push({ t: onDay(e.t, r.date), et: e.t, v: v, src: 'reading', date: r.date });
        });
      });
      if (F.from) rows('meal').forEach(r => {
        const m = r.payload || {}, v = (parseFloat(m[F.from]) || 0) * fp;
        if (m.t && v > 0) out.push({ t: m.t, v: v, src: 'food', food: m.name, date: r.date || ymd(m.t) });
      });
    }
    const w = words(x);
    if (w.res.length) {
      const once = {};
      rows('note').forEach(r => {
        const p = r.payload || {};
        if (typeof p.text !== 'string' || p.cancelled || p.kind === 'idea' || (p.kind === 'todo' && !p.done)) return;
        const text = p.text.trim(), low = text.toLowerCase();
        if (w.skip.some(s => low.indexOf(s) > -1)) return;
        let m = null, i = 0;
        for (; i < w.res.length && !m; i++) m = text.match(w.res[i]);
        if (!m) return;
        const fixed = w.fixed[i - 1], said = m[2] != null ? m[2] : m[1];
        const v = fixed != null ? fixed : (said != null ? Number(said) : bare) * per;
        if (v == null || !isFinite(v) || v <= 0) return;
        if (fixed != null) { if (once[i + '|' + r.date]) return; once[i + '|' + r.date] = 1; }
        /* the time typed on the line, else when it was written, else noon */
        const at = /^(\d{1,2}):(\d\d)/.exec(p.at || '');
        let t = null;
        if (r.date && at) t = new Date(r.date + 'T' + pad(+at[1]) + ':' + at[2] + ':00').getTime();
        else if (p.t) t = onDay(p.t, r.date);
        else if (r.date) t = noon(r.date);
        if (t != null && isFinite(t)) out.push({ t: t, v: v, src: 'journal', date: r.date || ymd(t) });
      });
    }
    const tk = ticksOf(x);
    if (tk.length) {
      const had = {};
      out.forEach(d => { had[d.date] = 1; });
      let A = null;
      rows('tick').forEach(r => {
        const p = r.payload || {};
        if (!r.date || had[r.date] || p.qty === 0) return;
        A = A || g.Rec.map('activity') || {};
        const nm = String((A[r.key] && A[r.key].name) || r.key).toLowerCase(), t = tk.filter(t => nm.indexOf(t[0]) === 0)[0];
        if (!t) return;
        had[r.date] = 1;
        out.push({ t: onDay(p.ts || r.updated_at, r.date), v: t[1], src: 'block', date: r.date });
      });
    }
    return out.sort((a, b) => a.t - b.t);
  }

  /* every dose on one day */
  function day(x, date) {
    return build(x, type => type === 'ev'
      ? (x.field && g.Rec.get('ev', date, x.field) ? [{ key: x.field, date: date, payload: g.Rec.get('ev', date, x.field) }] : [])
      : g.Rec.all(type, { date: date }));
  }
  /* every dose there is, oldest first */
  function all(x) { return build(x, type => g.Rec.all(type)); }

  g.Dose = { VERSION: '1.0.0', trackers: trackers, forField: forField, day: day, all: all, _onDay: onDay };
})(typeof window !== 'undefined' ? window : this);
