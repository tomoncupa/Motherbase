/* ══════════════════════════════════════════════════════════════════════════
   THE FOOD TABLE · plain foods and their figures per 100 g, offline, picked
   by hand. Built 2026-10-01 for KITCHEN (Tom: "do 1 and 2").

   Plain script, one global: `FoodTable`. KITCHEN loads it as
   `foodtable.js`; the data is `foodtable-data.js` beside it, made by
   `tools/food-table.py` from the USDA's SR Legacy table (public domain),
   and fetched only on first use, because it is a megabyte the shelf does not
   need. Everything is found from this file's own address, like barcode.js,
   and the data comes in as a script tag rather than a fetch, so it loads
   from a folder too.

   THE CONTRACT
     FoodTable.load()      -> Promise<boolean>. Fetches the data once; true
                              once it is in, false with no signal (or after
                              30 s). Safe to call as often as you like.
     FoodTable.ready       -> boolean
     FoodTable.count       -> how many foods, once loaded
     FoodTable.search(q,n) -> [{i, name, cat, via}] best first, n = 8
     FoodTable.food(i)     -> {name, cat, id, amt: 100, unit: 'g',
                               base: {amt: 100, unit: 'g', kcal, p, ...}}
     FoodTable.src         -> where the figures came from, in words

   THE SEARCH
     Every word typed must be found in the name, as a whole word (banana
     finds Bananas, tomato finds Tomatoes) or the start of one (the word
     still being typed). Best first:
       1. whole words before half-typed ones;
       2. a word found where the food is named, before one found further
          along (banana: Bananas before Pepper, banana). The food is named
          by the part before the first comma, or by the second part when
          the first is only its group: Fish, tilapia; Oil, olive;
       3. the everyday form, from a short list checked against the real
          names at build time, when the search named exactly that food
          (egg: Egg, whole, raw, not the yolk; potato is not sweet potato);
       4. fewer processed words the search did not ask for (canned, mix,
          pudding, dried, sauce...);
       5. fewer words in the food's name the search did not ask for
          (Sugars before Sugar-apples);
       6. raw before plain cooked before anything else, without salt
          before with;
       7. the shorter name.
     A Tagalog word (itlog, kangkong, kanin) is looked up in the table's
     alias list and the foods it was checked against come first, each
     carrying `via`: the word, so the page can name the food the way it was
     asked for. The rest of the English search follows without `via`. A
     word with no honest match finds nothing, rather than the wrong food.

   A blank figure is "not known", never zero: a key the USDA did not print
   is not on `base` at all.
   ══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  const doc = g.document;
  const HERE = (() => {
    try { return new URL('.', doc.currentScript.src).href; } catch (e) { return ''; }
  })();
  /* Written by tools/food-table.py: a hash of the data, so a new table is a
     new address, and sw.js answers a ?v= address from the phone's copy. */
  const STAMP = 'b4924de9';
  const WAIT = 30000;

  let D = null;
  let rows = [];
  let EVERY = {};
  let tag = null;
  const waiting = [];

  /* ── words ── */
  const STOP = { and: 1, of: 1, the: 1, a: 1, an: 1, ng: 1, na: 1, sa: 1, with: 1, in: 1 };
  const norm = s => String(s == null ? '' : s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9%]+/g, ' ').trim();
  /** The forms a word may take: bananas is banana, berries is berry,
      tomatoes is tomato, cookies is cookie. Both sides of a comparison go
      through this, so a match is any shared form. */
  function forms(w) {
    const out = [w];
    if (w.length >= 4) {
      if (/ies$/.test(w)) out.push(w.slice(0, -3) + 'y', w.slice(0, -1));
      else if (/es$/.test(w)) out.push(w.slice(0, -2), w.slice(0, -1));
      else if (/[^s]s$/.test(w)) out.push(w.slice(0, -1));
    }
    return out;
  }
  const shares = (a, b) => {
    for (let i = 0; i < a.length; i++) if (b.indexOf(a[i]) >= 0) return true;
    return false;
  };
  const RAW = { raw: 1, fresh: 1 };
  const COOKED = { cooked: 1, boiled: 1, steamed: 1, roasted: 1, baked: 1, grilled: 1,
    broiled: 1, braised: 1, poached: 1, stewed: 1, simmered: 1, brewed: 1 };
  /* Words that say a food has been made into something else. A search that
     asks for one (tuna canned) is not marked down for it. */
  const MADE = {};
  ('canned babyfood baby dessert pudding pie cake candy candies candied mix frozen ' +
   'dehydrated powder juice nectar sweetened syrup breaded battered imitation flavored ' +
   'chips sauce soup spread cookie snack bar drink beverage salad fried pickled smoked ' +
   'cured dried toasted stuffed filled glazed fritter croissant muffin pastry chocolate ' +
   'substitute concentrate instant prepared formula frosting topping sandwich ' +
   'reduced low lowfat nonfat light lite diet meatless')
    .split(' ').forEach(w => { MADE[w] = 1; });
  const isMade = f => f.some(x => MADE[x]);
  /* A name that opens on its group, "Fish, tilapia, raw" or "Oil, olive",
     is named by its second part: that is the food. */
  const GROUP = { fish: 1, cereals: 1, nuts: 1, beverages: 1, oil: 1, spices: 1, crustaceans: 1,
    mollusks: 1, 'game meat': 1, 'alcoholic beverage': 1, seaweed: 1, candies: 1, snacks: 1,
    sauce: 1, soup: 1 };
  /* where a name stops naming the food and starts describing it:
     "Soy sauce made from soy and wheat" is soy sauce */
  const CUT = { made: 1, from: 1, with: 1, without: 1, in: 1, containing: 1, includes: 1 };

  /** A name's words, each with the comma-part it is in (`s`) and whether it
      sits inside brackets (`p`). A comma inside brackets does not start a
      part: "Grapes, red or green (European type, such as...), raw". */
  function tokens(name) {
    const out = [];
    let seg = 0, depth = 0, word = '', cut = false;
    const flush = () => {
      if (word) norm(word).split(' ').forEach(w => {
        if (!w) return;
        if (CUT[w] && !depth) cut = true;
        out.push({ w: w, f: forms(w), s: seg, p: depth > 0, c: cut });
      });
      word = '';
    };
    for (let i = 0; i < name.length; i++) {
      const ch = name[i];
      if (ch === '(') { flush(); depth++; }
      else if (ch === ')') { flush(); depth = Math.max(0, depth - 1); }
      else if (ch === ',' && depth === 0) { flush(); seg++; cut = false; }
      else if (/[\s,\/]/.test(ch)) flush();
      else word += ch;
    }
    flush();
    const first = out.filter(t => t.s === 0 && !t.p);
    const grouped = !!GROUP[first.map(t => t.w).join(' ')] && out.some(t => t.s === 1);
    /* `h`: the words that name the food, the ones a search should have asked for */
    out.forEach(t => { t.h = !t.p && !t.c && (grouped ? t.s === 1 : t.s === 0); t.lead = !t.p && !t.c && (t.s === 0 || t.h); });
    return out;
  }

  /* ── the index, built once when the data arrives ── */
  function take(data) {
    if (!data || !Array.isArray(data.foods) || !Array.isArray(data.keys)) return false;
    D = data;
    rows = data.foods.map(f => {
      const name = String(f[2]);
      const toks = tokens(name);
      const words = toks.map(t => t.w);
      return {
        name: name,
        toks: toks,
        tier: words.some(w => RAW[w]) ? 0 : words.some(w => COOKED[w]) ? 1 : 2,
        salt: / with salt/i.test(name) ? 1 : 0,
        len: name.length,
      };
    });
    EVERY = {};
    (data.every || []).forEach((i, n) => { EVERY[i] = n; });
    api.ready = true;
    api.count = rows.length;
    api.src = String(data.src || '');
    return true;
  }

  /* ── loading ── */
  function settle(ok) { waiting.splice(0).forEach(f => f(ok)); }
  function load() {
    if (api.ready) return Promise.resolve(true);
    return new Promise(res => {
      waiting.push(res);
      setTimeout(() => {
        const i = waiting.indexOf(res);
        if (i >= 0) { waiting.splice(i, 1); res(false); }
      }, WAIT);
      if (tag) return;
      tag = doc.createElement('script');
      tag.src = HERE + 'foodtable-data.js?v=' + STAMP;
      tag.async = true;
      tag.onload = () => {
        const ok = take(g.FoodTableData);
        if (!ok && tag) { tag.remove(); tag = null; }
        settle(ok);
        if (ok) { try { g.dispatchEvent(new Event('foodtable:ready')); } catch (e) { /* old browser */ } }
      };
      tag.onerror = () => { if (tag) tag.remove(); tag = null; settle(false); };
      (doc.head || doc.documentElement).appendChild(tag);
    });
  }

  /* ── one search over the table ── */
  function match(qs) {
    const hits = [];
    const qf = qs.map(forms);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i], T = r.toks;
      let half = 0, head = 1, ok = true;
      const used = new Array(T.length);
      for (let q = 0; q < qs.length && ok; q++) {
        let best = -1, bestKind = 3, lead = false;
        for (let t = 0; t < T.length; t++) {
          const kind = shares(qf[q], T[t].f) ? 0
            : (T[t].w.indexOf(qs[q]) === 0 || T[t].f.some(x => x.indexOf(qs[q]) === 0)) ? 1 : 3;
          if (kind < bestKind || (kind === bestKind && T[t].lead && !lead)) { best = t; bestKind = kind; lead = T[t].lead; }
        }
        if (bestKind > 1) { ok = false; break; }
        /* every token the search touches counts as asked for */
        for (let t = 0; t < T.length; t++) {
          if (shares(qf[q], T[t].f) || T[t].w.indexOf(qs[q]) === 0) used[t] = 1;
        }
        if (bestKind === 1) half++;
        if (bestKind === 0 && lead) head = 0;
        used[best] = 1;
      }
      if (!ok) continue;
      let made = 0, extra = 0;
      for (let t = 0; t < T.length; t++) {
        if (used[t]) continue;
        if (isMade(T[t].f)) made++;
        if (T[t].h) extra++;
      }
      /* the everyday pick counts only when the search named exactly that
         food: potato is not sweet potato, milk is not whole milk yogurt */
      const every = EVERY[i] != null && head === 0 && extra === 0 ? EVERY[i] : 1e4;
      hits.push({ i: i, k: [half, head, every, made, extra, r.tier, r.salt, r.len] });
    }
    hits.sort((a, b) => {
      for (let n = 0; n < a.k.length; n++) if (a.k[n] !== b.k[n]) return a.k[n] - b.k[n];
      return a.i - b.i;
    });
    return hits.map(h => h.i);
  }
  const words = s => norm(s).split(' ').filter(w => w && !STOP[w]);

  function search(q, n) {
    n = n > 0 ? n : 8;
    if (!api.ready) return [];
    const qn = norm(q);
    if (qn.length < 2) return [];
    const out = [], seen = {};
    const add = (i, via) => {
      if (seen[i] || out.length >= n || i == null || !rows[i]) return;
      seen[i] = 1;
      const f = D.foods[i];
      const hit = { i: i, name: rows[i].name, cat: D.cats[f[1]] || '' };
      if (via) hit.via = via;
      out.push(hit);
    };
    const A = D.alias || {};
    /* the whole search is one Tagalog word or phrase */
    /* `via` goes only on the foods the word was checked against, since the
       page names those after the word; the rest of the English search
       follows under the USDA's own names */
    if (A[qn]) {
      A[qn][1].forEach(i => add(i, qn));
      const qs = words(A[qn][0]);
      if (qs.length) match(qs).forEach(i => add(i));
    } else {
      /* a Tagalog word inside a longer search stands for its English */
      const qs = words(qn);
      let via = '';
      const swapped = [];
      qs.forEach(w => {
        if (A[w] && !via) { via = w; swapped.push.apply(swapped, words(A[w][0])); }
        else swapped.push(w);
      });
      if (qs.length) match(qs).forEach(i => add(i));
      if (via) match(swapped).forEach(i => add(i, A[via][1].indexOf(i) >= 0 ? via : ''));
      /* still being typed: "bang" is on its way to bangus */
      if (qs.length === 1 && qn.length >= 3) {
        Object.keys(A).filter(k => k.indexOf(qn) === 0)
          .sort((a, b) => a.length - b.length || (a < b ? -1 : 1))
          .forEach(k => A[k][1].forEach(i => add(i, k)));
      }
    }
    return out;
  }

  function food(i) {
    if (!api.ready || !D.foods[i]) return null;
    const f = D.foods[i];
    const base = { amt: 100, unit: 'g' };
    D.keys.forEach((k, n) => {
      const v = f[3 + n];
      if (typeof v === 'number' && isFinite(v)) base[k] = v;
    });
    return { name: rows[i].name, cat: D.cats[f[1]] || '', id: f[0], amt: 100, unit: 'g', base: base };
  }

  const api = {
    ready: false,
    count: 0,
    src: '',
    load: load,
    search: search,
    food: food,
  };
  g.FoodTable = api;
})(typeof window !== 'undefined' ? window : this);
