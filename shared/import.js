/* ══════════════════════ MOTHERBASE · IMPORT ══════════════════════
   Bringing in a spreadsheet the suite did not write.

   Tom, 2026-09-15: "Finish all the foundation work", after a look at his
   disk found a year of history in the Excel life OS this suite replaced
   (monthly Daily Quests sheets, weigh-ins from March 2025, a food database,
   a spending tracker) with nothing able to read it. IO.restore reads the
   suite's own backups; TRAIN reads FitNotes and WEALTH reads statements.
   This reads the rest.

   It does not know the workbook by name. It knows four SHAPES, and any
   sheet in any workbook that has one of them is read:

     a month grid     dates across the top, a name down the side, 1 and 0
                      in the days: each 1 is a tick under the slug of the
                      name, which is the shared vocabulary's own rule, so
                      "Brush Teeth" lands on the same activity BLOCK ticks.
                      A row holding anything but 1 and 0 (AM, PM, a grade)
                      is not a habit and is left out. A row named Weight is
                      read as weigh-ins.
     a weight table   a header row with Date and Actual Weight.
     a food table     a header row with Item, Protein and Cals.
     a spend table    a header row with Date and Details (or Transactions),
                      and account columns after them. Money out only; a
                      line with no date belongs to the dated line above.

   What it will not do, on purpose:
     - overwrite. A day that already has a weigh-in, a tick that already
       exists, a food whose name is already taken: left alone, and counted.
     - guess an account. A column called Wallet becomes an account called
       Wallet, not Cash. Renaming it in STATUS moves its spending with it.
     - bring in the future. A projection is not a record.
     - read training. TRAIN reads FitNotes, which holds the same sets.

   One batch through Rec.merge, so twelve months of ticks is one change
   announced once rather than six thousand redraws, and an undo is one batch
   of tombstones. Row ids are derived, so bringing the same file in twice
   adds nothing the second time.

     <script src="shared/import.js"></script>
     Import.read(file).then(sheets => { const p = Import.plan(sheets); Import.apply(p, pick) })

   Needs io.js for the spreadsheet reader, which comes from a CDN the first
   time. Offline, read() says so and nothing else is affected.
   ══════════════════════════════════════════════════════════════════ */
(function (g) {
'use strict';

const Day = () => g.Day, Rec = () => g.Rec;

const words = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const low = s => words(s).toLowerCase();
const slug = s => low(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
function num(v) {
  if (typeof v === 'number') return isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const t = v.replace(/,/g, '').trim();
  return /^-?\d*\.?\d+$/.test(t) ? parseFloat(t) : null;
}
const bit = v => v === true ? 1 : v === false ? 0 : num(v);
const blank = v => v == null || String(v).trim() === '';

/* A cell as YYYY-MM-DD, or null. A spreadsheet date is a day count from
   30 December 1899; the range keeps a price or a step count from passing
   for one. */
function dateOf(v) {
  const pad = n => String(n).padStart(2, '0');
  if (v instanceof Date && !isNaN(v)) return v.getFullYear() + '-' + pad(v.getMonth() + 1) + '-' + pad(v.getDate());
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v.trim())) return v.trim().slice(0, 10);
  const n = num(v);
  if (n != null && n >= 30000 && n < 80000) return Day().shift('1899-12-30', Math.floor(n));
  return null;
}
const weighs = v => v != null && v >= 50 && v <= 700;

/* ── the four shapes ── */

/* the row in the first few with twenty or more dates across it */
function dateRow(grid) {
  for (let r = 0; r < Math.min(grid.length, 8); r++) {
    const cols = {};
    let n = 0;
    (grid[r] || []).forEach((v, i) => { if (!i) return; const d = dateOf(v); if (d) { cols[i] = d; n++; } });
    if (n >= 20) return { r: r, cols: cols };
  }
  return null;
}

/* a cell somebody typed, as opposed to one a formula filled in */
const typed = (grid, r, c) => !(grid.isFormula && grid.isFormula(r, c));

function monthGrid(grid) {
  const out = { ticks: [], weights: [] };
  const dr = dateRow(grid);
  if (!dr) return out;
  const dcols = Object.keys(dr.cols).map(Number);
  for (let r = dr.r + 1; r < grid.length; r++) {
    const row = grid[r] || [];
    const label = words(row[0]);
    if (!label || num(label) != null) continue;
    if (/^weight$/i.test(label)) {
      dcols.forEach(i => { const v = num(row[i]); if (weighs(v) && typed(grid, r, i)) out.weights.push({ date: dr.cols[i], v: v }); });
      continue;
    }
    const cells = dcols.filter(i => !blank(row[i]) && typed(grid, r, i));
    if (!cells.length || !cells.every(i => { const b = bit(row[i]); return b === 0 || b === 1; })) continue;
    const key = slug(label);
    if (!key) continue;
    cells.forEach(i => { if (bit(row[i]) === 1) out.ticks.push({ date: dr.cols[i], key: key, name: label }); });
  }
  return out;
}

function weightTable(grid) {
  for (let r = 0; r < Math.min(grid.length, 40); r++) {
    const row = grid[r] || [];
    const wc = row.findIndex(v => low(v) === 'actual weight');
    if (wc < 0) continue;
    let dc = -1;
    row.forEach((v, i) => { if (low(v) === 'date' && (dc < 0 || Math.abs(i - wc) < Math.abs(dc - wc))) dc = i; });
    if (dc < 0) continue;
    const out = [];
    for (let k = r + 1; k < grid.length; k++) {
      const x = grid[k] || [];
      const d = dateOf(x[dc]), v = num(x[wc]);
      if (d && weighs(v) && typed(grid, k, wc)) out.push({ date: d, v: v });
    }
    return out;
  }
  return [];
}

function foodTable(grid) {
  for (let r = 0; r < Math.min(grid.length, 20); r++) {
    const row = (grid[r] || []).map(low);
    const at = (...names) => row.findIndex(v => names.indexOf(v) >= 0);
    const item = at('item', 'food', 'name'), prot = at('protein'), cal = at('cals', 'calories', 'kcal');
    if (item < 0 || prot < 0 || cal < 0) continue;
    const col = { amt: at('amt', 'amount'), unit: at('unit'), p: prot, c: at('carb', 'carbs'), f: at('fat'),
      kcal: cal, na: at('sodium'), k: at('potassium'), ca: at('calcium'), caff: at('caffeine'), price: at('price') };
    const out = [], seen = {};
    for (let k = r + 1; k < grid.length; k++) {
      const x = grid[k] || [];
      const name = words(x[item]);
      if (!name || num(name) != null) continue;
      const base = { amt: (col.amt >= 0 && num(x[col.amt]) > 0) ? num(x[col.amt]) : 1,
        unit: (col.unit >= 0 && words(x[col.unit])) || 'serving' };
      let nutrients = 0;
      ['p', 'c', 'f', 'kcal', 'na', 'k', 'ca', 'caff', 'price'].forEach(n => {
        if (col[n] < 0) return;
        const v = num(x[col[n]]);
        if (v == null) return;
        base[n] = v;
        if (n !== 'price') nutrients++;
      });
      if (!nutrients || seen[slug(name)]) continue;
      seen[slug(name)] = 1;
      out.push({ name: name, base: base });
    }
    return out;
  }
  return [];
}

function spendTable(grid, sheet) {
  for (let r = 0; r < Math.min(grid.length, 10); r++) {
    const row = (grid[r] || []).map(low);
    const dc = row.indexOf('date'), det = row.indexOf('details'), cat = row.findIndex(v => v === 'transactions' || v === 'category');
    if (dc < 0 || (det < 0 && cat < 0)) continue;
    const after = Math.max(det, cat, dc);
    const accts = [];
    /* a header that is a number is a figure somebody left there, not an account */
    (grid[r] || []).forEach((v, i) => { if (i > after && words(v) && num(v) == null && !/balance|total|funds/i.test(words(v))) accts.push({ i: i, name: words(v) }); });
    if (!accts.length) continue;
    const out = [];
    let last = null;
    for (let k = r + 1; k < grid.length; k++) {
      const x = grid[k] || [];
      const d = dateOf(x[dc]);
      if (d) last = d;
      if (!last) continue;
      accts.forEach(a => {
        const v = num(x[a.i]);
        if (v == null || v >= 0) return;
        out.push({ date: last, key: 'import-' + slug(sheet) + '-' + (k + 1) + '-' + a.i, acct: a.name,
          amt: Math.round(-v * 100) / 100, note: (det >= 0 && words(x[det])) || (cat >= 0 && words(x[cat])) || '' });
      });
    }
    return out;
  }
  return [];
}

/* ── reading a file ── */
function read(file) {
  const load = g.IO && g.IO.loadXLSX;
  if (!load) return Promise.reject(new Error('io.js is not loaded'));
  return load().then(X => {
    if (!X) throw new Error('Spreadsheet reader did not load. It needs a connection the first time.');
    return file.arrayBuffer().then(buf => {
      const wb = X.read(new Uint8Array(buf), { type: 'array', cellFormula: true });
      const sheets = {};
      wb.SheetNames.forEach(n => {
        const ws = wb.Sheets[n];
        const grid = X.utils.sheet_to_json(ws, { header: 1, raw: true, blankrows: true, defval: null });
        /* Which cells are formulas. Watched on Tom's workbook, 2026-09-15: its
           calorie tracker's "Actual Weight" column is 224 formulas and no
           typed number, a projection that climbed a pound a day. A formula is
           not a record, so a weigh-in or a tick held in one is not read. */
        if (ws['!ref']) {
          const s = X.utils.decode_range(ws['!ref']).s;
          grid.isFormula = (r, c) => { const cell = ws[X.utils.encode_cell({ r: s.r + r, c: s.c + c })]; return !!(cell && cell.f); };
        }
        sheets[n] = grid;
      });
      return sheets;
    });
  });
}

/* A date years away from the rest of its sheet is a typo, and which year was
   meant is a guess. Watched: three spends typed as November 2020 in a sheet
   called "Nov-Dec 25". Left out and counted, never corrected. */
function trimOdd(list, p) {
  if (list.length < 5) return list;
  const ds = list.map(x => x.date).sort(), mid = ds[Math.floor(ds.length / 2)];
  const keep = list.filter(x => Math.abs(Day().diff(x.date, mid)) <= 400);
  p.odd += list.length - keep.length;
  return keep;
}

/* ── what would come in ──
   Everything found, less what is already here and what has not happened
   yet. `kept` counts what was left alone; `odd` what was dated far from its
   sheet; `span` says the dates; `sheets` says what each sheet gave and
   `skipped` names the ones that gave nothing. */
function plan(sheets) {
  const R = Rec(), D = Day(), today = D.today();
  const p = { weights: [], ticks: [], foods: [], spends: [], acts: {}, accts: {},
    kept: { weights: 0, ticks: 0, foods: 0, spends: 0 }, odd: 0, span: {}, sheets: {}, skipped: [] };
  const got = (sheet, what) => { (p.sheets[sheet] = p.sheets[sheet] || []).indexOf(what) < 0 && p.sheets[sheet].push(what); };
  const wDay = {}, tSeen = {}, sSeen = {};

  const addWeight = (w, sheet) => {
    if (w.date > today || wDay[w.date]) return;
    wDay[w.date] = 1; got(sheet, 'weigh-ins');
    if (R.get('ev', w.date, 'weight')) { p.kept.weights++; return; }
    p.weights.push(w);
  };
  const names = Object.keys(sheets || {});
  names.forEach(name => {
    const grid = sheets[name] || [];
    const m = monthGrid(grid);
    trimOdd(m.weights, p).forEach(w => addWeight(w, name));
    trimOdd(m.ticks, p).forEach(t => {
      if (t.date > today) return;
      const id = t.date + '|' + t.key;
      if (tSeen[id]) return;
      tSeen[id] = 1; got(name, 'ticks');
      if (R.get('tick', t.date, t.key)) { p.kept.ticks++; return; }
      p.ticks.push(t);
      if (!p.acts[t.key] && !R.get('activity', null, t.key)) p.acts[t.key] = t.name;
    });
    trimOdd(weightTable(grid), p).forEach(w => addWeight(w, name));
    trimOdd(spendTable(grid, name), p).forEach(s => {
      if (s.date > today || sSeen[s.key]) return;
      sSeen[s.key] = 1; got(name, 'spending');
      if (R.get('spend', s.date, s.key)) { p.kept.spends++; return; }
      p.spends.push(s);
      const ak = s.acct.toLowerCase();
      if (!p.accts[ak] && !R.get('acct', null, ak)) p.accts[ak] = s.acct;
    });
  });

  /* A sheet called Food goes first, so a food database beats the same food
     copied into a day's meal log. */
  const taken = {};
  R.all('food').forEach(r => { if (r.payload && r.payload.name) taken[slug(r.payload.name)] = 1; });
  names.slice().sort((a, b) => (/food/i.test(b) ? 1 : 0) - (/food/i.test(a) ? 1 : 0)).forEach(name => {
    foodTable(sheets[name] || []).forEach(f => {
      const k = slug(f.name);
      if (taken[k] === 2) return;
      got(name, 'foods');
      if (taken[k] === 1) { p.kept.foods++; taken[k] = 2; return; }
      taken[k] = 2;
      p.foods.push(f);
    });
  });

  const month = d => D.label(d, { month: 'short', year: 'numeric' });
  ['weights', 'ticks', 'spends'].forEach(k => {
    if (!p[k].length) return;
    const ds = p[k].map(x => x.date).sort();
    p.span[k] = month(ds[0]) === month(ds[ds.length - 1]) ? month(ds[0]) : month(ds[0]) + ' to ' + month(ds[ds.length - 1]);
  });
  p.skipped = names.filter(n => !p.sheets[n]);
  return p;
}

/* ── bringing it in ──
   `pick` is {weights, ticks, foods, spends}, each true or false. Returns the
   counts and an undo that tombstones exactly what came in. */
function apply(p, pick) {
  const R = Rec(), at = new Date().toISOString(), rows = [];
  pick = pick || { weights: true, ticks: true, foods: true, spends: true };
  const row = (type, date, key, payload) => rows.push({
    id: R.USER + '|' + type + '|' + (date || '') + '|' + key, user_id: R.USER, type: type,
    date: date || null, key: String(key), payload: payload, updated_at: at, deleted: false, by: 'import',
  });
  const noon = d => new Date(d + 'T12:00:00').getTime();
  const n = { weights: 0, ticks: 0, foods: 0, spends: 0 };

  if (pick.weights) p.weights.forEach(w => { row('ev', w.date, 'weight', { e: [{ t: noon(w.date), v: w.v }] }); n.weights++; });
  if (pick.ticks) {
    const used = {};
    p.ticks.forEach(t => { row('tick', t.date, t.key, { src: 'import', qty: 1 }); used[t.key] = 1; n.ticks++; });
    Object.keys(p.acts).forEach(k => { if (used[k]) row('activity', null, k, { name: p.acts[k], cat: 'import' }); });
  }
  if (pick.foods) p.foods.forEach(f => {
    const id = 'import-' + slug(f.name);
    row('food', null, id, { id: id, name: f.name, brand: '', cat: '', base: f.base, serves: [], dflt: 0, uses: 0 });
    n.foods++;
  });
  if (pick.spends) {
    let order = R.all('acct').length;
    const used = {};
    p.spends.forEach(s => {
      row('spend', s.date, s.key, { amt: s.amt, acct: s.acct, note: s.note, t: noon(s.date), via: 'import' });
      used[s.acct.toLowerCase()] = 1; n.spends++;
    });
    Object.keys(p.accts).forEach(k => { if (used[k]) row('acct', null, k, { name: p.accts[k], order: order++ }); });
  }

  /* A setting written the ordinary way, after the batch: it is the record
     that an import happened, and the write is what tells every open app to
     read the store again. merge() on its own does not reach a neighbour. */
  const note = total => R.setting('lifeos', 'imported', { at: new Date().toISOString(), total: total });
  if (rows.length) { R.merge(rows); note(rows.length); }
  return {
    counts: n, total: n.weights + n.ticks + n.foods + n.spends, rows: rows.length,
    undo() {
      if (!rows.length) return 0;
      const gone = new Date(Math.max(Date.now(), Date.parse(at) + 1)).toISOString();
      R.merge(rows.map(r => Object.assign({}, r, { payload: null, deleted: true, updated_at: gone })));
      note(0);
      return rows.length;
    },
  };
}

g.Import = {
  read: read, plan: plan, apply: apply, dateOf: dateOf,
  /* the shapes, for _smoke.html */
  shapes: { monthGrid: monthGrid, weightTable: weightTable, foodTable: foodTable, spendTable: spendTable },
};
})(window);
