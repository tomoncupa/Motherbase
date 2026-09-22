/* ══════════════════════════ NUTRIENTS ══════════════════════════

   The full nutrient list a food can carry, beyond the eight every app has
   always had (calories, protein, carbs, fat, sodium, potassium, calcium,
   caffeine). One list, three readers:

   • FOODDÉX fills them from the USDA lookup. Until 2026-09-22 the lookup
     downloaded dozens of these for every food and kept eight, and the rest
     were thrown away on arrival.
   • STATUS puts them on the Food tab of the sheet, one column each, so the
     row is complete where Tom can see it and fill in the gaps by hand.
   • MIX reads zinc, magnesium, copper, choline and vitamin A off a food when
     the food has them, and only falls back to its own small table when it
     does not.

   Tom, 2026-09-22: "make the food row COMPLETE atleast in the sheet."

   Keys are short and live on `food.base` beside the eight, so a food that
   has them is still exactly the row it was, only longer. A food without them
   is unchanged. Nothing is ever required: a blank is "not known", never zero.

   How a USDA figure is found: by the nutrient's NAME as the USDA prints it,
   and its unit, rather than by the USDA's numeric id. Names are what can be
   checked by reading a result; a wrong id from memory would fill the wrong
   column in silence. A figure in International Units is skipped rather than
   converted, because the conversion differs per vitamin and per form.

   Plain script, no module, so it loads from a folder like everything else. */
(function (g) {
  'use strict';

  /* k      the key on food.base
     label  the words on the sheet's column
     unit   what the stored number means
     re     the USDA's own nutrient name                                   */
  const LIST = [
    { k: 'fib',  label: 'Fibre',              unit: 'g',   re: /^Fiber, total dietary/i },
    { k: 'sug',  label: 'Sugar',              unit: 'g',   re: /^(Sugars, total|Total Sugars)/i },
    { k: 'sat',  label: 'Saturated fat',      unit: 'g',   re: /^Fatty acids, total saturated/i },
    { k: 'mono', label: 'Monounsaturated fat', unit: 'g',  re: /^Fatty acids, total monounsaturated/i },
    { k: 'poly', label: 'Polyunsaturated fat', unit: 'g',  re: /^Fatty acids, total polyunsaturated/i },
    { k: 'epa',  label: 'EPA',                unit: 'g',   re: /20:5 n-3/i },
    { k: 'dha',  label: 'DHA',                unit: 'g',   re: /22:6 n-3/i },
    { k: 'chol', label: 'Cholesterol',        unit: 'mg',  re: /^Cholesterol/i },
    { k: 'fe',   label: 'Iron',               unit: 'mg',  re: /^Iron, Fe/i },
    { k: 'mg',   label: 'Magnesium',          unit: 'mg',  re: /^Magnesium, Mg/i },
    { k: 'ph',   label: 'Phosphorus',         unit: 'mg',  re: /^Phosphorus, P\b/i },
    { k: 'zn',   label: 'Zinc',               unit: 'mg',  re: /^Zinc, Zn/i },
    { k: 'cu',   label: 'Copper',             unit: 'mg',  re: /^Copper, Cu/i },
    { k: 'mn',   label: 'Manganese',          unit: 'mg',  re: /^Manganese, Mn/i },
    { k: 'se',   label: 'Selenium',           unit: 'mcg', re: /^Selenium, Se/i },
    { k: 'io',   label: 'Iodine',             unit: 'mcg', re: /^Iodine, I\b/i },
    { k: 'va',   label: 'Vitamin A preformed', unit: 'mcg', re: /^Retinol/i },
    { k: 'rae',  label: 'Vitamin A RAE',      unit: 'mcg', re: /^Vitamin A, RAE/i },
    { k: 'bc',   label: 'Beta-carotene',      unit: 'mcg', re: /^(Carotene, beta|Beta-carotene)/i },
    { k: 'vc',   label: 'Vitamin C',          unit: 'mg',  re: /^Vitamin C/i },
    { k: 'vd',   label: 'Vitamin D',          unit: 'mcg', re: /^Vitamin D \(D2 \+ D3\)/i },
    { k: 've',   label: 'Vitamin E',          unit: 'mg',  re: /^Vitamin E \(alpha-tocopherol\)/i },
    { k: 'vk',   label: 'Vitamin K',          unit: 'mcg', re: /^Vitamin K \(phylloquinone\)/i },
    { k: 'b1',   label: 'Thiamin B1',         unit: 'mg',  re: /^Thiamin/i },
    { k: 'b2',   label: 'Riboflavin B2',      unit: 'mg',  re: /^Riboflavin/i },
    { k: 'b3',   label: 'Niacin B3',          unit: 'mg',  re: /^Niacin/i },
    { k: 'b5',   label: 'Pantothenic acid B5', unit: 'mg', re: /^Pantothenic acid/i },
    { k: 'b6',   label: 'Vitamin B6',         unit: 'mg',  re: /^Vitamin B-6/i },
    /* DFE counts added folic acid at its higher strength, so it is the one
       to have. The USDA's lab-measured plain foods often print only the
       total, and for a food with nothing added the two are the same number,
       so the total answers when DFE is not there. Checked against the live
       database on raw broccoli, which prints only "Folate, total". */
    { k: 'fol',  label: 'Folate',             unit: 'mcg', re: /^Folate, DFE/i, alt: /^Folate, total/i },
    { k: 'b12',  label: 'Vitamin B12',        unit: 'mcg', re: /^Vitamin B-12(?!, added)/i },
    { k: 'ch',   label: 'Choline',            unit: 'mg',  re: /^Choline, total/i },
  ];

  /* how many micrograms one of each unit is, as the USDA spells them */
  const UG = { g: 1e6, mg: 1e3, ug: 1, 'µg': 1, 'μg': 1, mcg: 1 };
  const toUnit = (v, from, to) => {
    const a = UG[String(from || '').toLowerCase()], b = UG[to];
    return a && b ? v * a / b : null;
  };
  /* Three significant figures is more than any label or database earns, and
     keeps a cell readable: 0.41 mg of zinc, 316 mg of potassium. */
  const tidy = v => {
    if (!isFinite(v)) return null;
    if (v === 0) return 0;
    const d = Math.max(0, 2 - Math.floor(Math.log10(Math.abs(v))));
    return +v.toFixed(Math.min(d, 4));
  };

  /** A USDA search result's `foodNutrients` in, `{ key: value }` out, per
      100 g, holding only what the USDA actually gave. */
  function fromUsda(list) {
    const out = {};
    (list || []).forEach(n => {
      if (!n || typeof n.value !== 'number') return;
      const name = n.nutrientName || n.name || '';
      LIST.forEach(x => {
        if (out[x.k] != null || !x.re.test(name)) return;
        const v = toUnit(n.value, n.unitName, x.unit);
        if (v != null) out[x.k] = tidy(v);
      });
    });
    /* second choices, only where the first choice was not printed at all */
    (list || []).forEach(n => {
      if (!n || typeof n.value !== 'number') return;
      const name = n.nutrientName || n.name || '';
      LIST.forEach(x => {
        if (!x.alt || out[x.k] != null || !x.alt.test(name)) return;
        const v = toUnit(n.value, n.unitName, x.unit);
        if (v != null) out[x.k] = tidy(v);
      });
    });
    return out;
  }

  g.Nutrients = {
    LIST: LIST,
    keys: () => LIST.map(x => x.k),
    fromUsda: fromUsda,
    /** the Food tab's extra columns, in the shape IO.register's tables want */
    cols: () => LIST.map(x => ['base.' + x.k, x.label + ' ' + x.unit]),
  };
})(typeof window !== 'undefined' ? window : this);
