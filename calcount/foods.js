/* CALCOUNT — the Philippine food database.

   Plain data, loaded with a script tag. Defines CC_FOODS, CC_POPULAR,
   CC_BRANDS, CC_CATS and CC_SRC.

   One food:
     f(id, name, brand, cat, per, serves, src, aka, opts)

   per     [grams, kcal, protein, carbs, fat] for ONE reference serving.
           kcal may be null, and then it is worked out from the macros
           (4 per gram of protein and carbs, 9 per gram of fat, 7 per gram
           of alcohol). Every estimate is written that way on purpose: it
           cannot disagree with its own macros.
   serves  [[label, multiple of per], ...]. The first one is the default.
   src     where the numbers came from. See CC_SRC and calcount/CLAUDE.md.
           Never raise a src without a source.
   aka     everything else someone might type. Tagalog, Taglish, brands,
           misspellings. Search is only as good as this list.
   opts    { na: sodium mg, alc: alcohol g, note }

   A combo is mix(id, name, brand, cat, parts, serves, aka, opts), where
   parts is [[food id, multiple of that food's per], ...]. Its numbers are
   the sum of its parts, and its src is the least certain of them.       */

(function () {
  const SRC = {
    pub:      { label: 'Official',      err: 0.05, rank: 0, about: 'Published by the restaurant for its Philippine menu.' },
    label:    { label: 'Label',         err: 0.05, rank: 1, about: 'Read off the product’s printed nutrition label.' },
    ref:      { label: 'Reference',     err: 0.10, rank: 2, about: 'Standard food composition values for a plain food.' },
    off:      { label: 'Community',     err: 0.15, rank: 3, about: 'From Open Food Facts, entered by volunteers.' },
    avg:      { label: 'Averaged',      err: 0.20, rank: 3, about: 'The middle of several unofficial published figures for this item, checked against each other. Not from the restaurant.' },
    'pub-us': { label: 'Official (US)', err: 0.15, rank: 3, about: 'Published by the restaurant for its US menu. Philippine portions may differ.' },
    ai:       { label: 'Photo guess',   err: 0.30, rank: 5, about: 'Estimated from a photo.' },
    est:      { label: 'Estimate',      err: 0.25, rank: 4, about: 'Worked out from a typical recipe and portion. Not yet verified.' },
    mine:     { label: 'Yours',         err: 0.10, rank: 2, about: 'A food you added yourself.' }
  };

  const FOODS = [];
  const BY_ID = {};

  const JB_US = 'Jollibee USA Nutrition Facts, 01 July 2026. Philippine portions may differ.';
  const PACK = 'Brands and pack sizes vary. The label on the pack is the truth: scan its barcode to use it.';

  function kcalOf(p, c, fat, alc) { return Math.round(4 * p + 4 * c + 9 * fat + 7 * (alc || 0)); }

  function f(id, name, brand, cat, per, serves, src, aka, opts) {
    opts = opts || {};
    const [g, kcal, p, c, fat] = per;
    const food = {
      id, name, brand: brand || '', cat,
      per: { g, kcal: kcal == null ? kcalOf(p, c, fat, opts.alc) : kcal, p, c, f: fat },
      serves: serves.map(([l, m]) => ({ l, m })),
      src, aka: aka || []
    };
    if (opts.na != null) food.per.na = opts.na;
    if (opts.alc != null) food.per.alc = opts.alc;
    if (opts.note) food.note = opts.note;
    FOODS.push(food); BY_ID[id] = food;
    return food;
  }

  function mix(id, name, brand, cat, parts, serves, aka, opts) {
    opts = opts || {};
    const per = { g: 0, kcal: 0, p: 0, c: 0, f: 0 };
    let src = 'pub';
    parts.forEach(([pid, m]) => {
      const part = BY_ID[pid];
      if (!part) throw new Error('foods.js: ' + id + ' names a missing part ' + pid);
      ['g', 'kcal', 'p', 'c', 'f'].forEach(k => { per[k] += part.per[k] * m; });
      if (SRC[part.src].err > SRC[src].err) src = part.src;
    });
    ['g', 'kcal'].forEach(k => { per[k] = Math.round(per[k]); });
    ['p', 'c', 'f'].forEach(k => { per[k] = Math.round(per[k] * 10) / 10; });
    const food = { id, name, brand: brand || '', cat, per, serves: serves.map(([l, m]) => ({ l, m })), src, aka: aka || [], parts };
    // A combo inherits the doubt of its parts, and says so.
    food.note = [opts.note, 'Added up from its parts.', src === 'pub-us' ? 'Some parts use US-published figures, and Philippine portions may differ.' : '']
      .filter(Boolean).join(' ');
    FOODS.push(food); BY_ID[id] = food;
    return food;
  }

  const one = (l) => [[l, 1]];

  /* ── rice and breakfast ─────────────────────────────────────────────── */
  f('rice', 'Rice', '', 'rice', [158, 205, 4.3, 44.5, 0.4],
    [['1 cup', 1], ['½ cup', 0.5], ['2 cups', 2]], 'ref',
    ['kanin', 'white rice', 'plain rice', 'steamed rice', 'unli rice', 'extra rice', 'bigas', 'cup of rice'],
    { note: 'One cup is about one fast-food rice. Unli rice: add one for every cup you ate.' });
  f('rice-garlic', 'Garlic rice (sinangag)', '', 'rice', [170, null, 4.5, 45, 6],
    [['1 cup', 1], ['½ cup', 0.5]], 'est', ['sinangag', 'fried rice', 'garlic fried rice']);
  f('rice-brown', 'Brown rice', '', 'rice', [195, 216, 5, 44.8, 1.8],
    [['1 cup', 1], ['½ cup', 0.5]], 'ref', ['brown rice', 'red rice']);
  f('rice-java', 'Java rice', '', 'rice', [170, null, 4.5, 45, 7],
    [['1 cup', 1]], 'est', ['java rice', 'yellow rice']);

  f('egg-fried', 'Fried egg', '', 'basics', [46, 90, 6.3, 0.4, 6.8],
    [['1 egg', 1], ['2 eggs', 2]], 'ref', ['itlog', 'pritong itlog', 'sunny side up', 'egg', 'scrambled egg']);
  f('egg-boiled', 'Boiled egg', '', 'basics', [50, 78, 6.3, 0.6, 5.3],
    [['1 egg', 1], ['2 eggs', 2]], 'ref', ['nilagang itlog', 'hard boiled egg', 'itlog', 'egg']);
  f('egg-salted', 'Salted egg', '', 'basics', [65, null, 9, 1, 9],
    one('1 egg'), 'est', ['itlog na maalat', 'itlog maalat', 'red egg']);
  f('balut', 'Balut', '', 'street', [65, null, 14, 1, 12],
    one('1 pc'), 'est', ['balot', 'penoy']);

  f('pandesal', 'Pandesal', '', 'bread', [30, null, 2.7, 15, 1.8],
    [['1 pc', 1], ['2 pcs', 2], ['5 pcs', 5]], 'est', ['pan de sal', 'pandisal', 'bread', 'tinapay']);
  f('bread-white', 'White bread', '', 'bread', [25, 67, 2.3, 12.7, 0.8],
    [['1 slice', 1], ['2 slices', 2]], 'ref', ['gardenia', 'loaf bread', 'sliced bread', 'tinapay', 'sandwich bread']);
  f('bread-spanish', 'Spanish bread', '', 'bread', [45, null, 4, 26, 7], one('1 pc'), 'est', ['spanish bread']);
  f('ensaymada', 'Ensaymada', '', 'bread', [70, null, 6, 38, 16], one('1 pc'), 'est', ['ensaimada', 'goldilocks ensaymada']);
  f('monay', 'Monay', '', 'bread', [60, null, 5, 32, 4], one('1 pc'), 'est', ['monay', 'putok', 'pan de coco']);
  f('peanut-butter', 'Peanut butter', '', 'extras', [16, 94, 3.6, 3.2, 8.1],
    [['1 tbsp', 1], ['2 tbsp', 2]], 'ref', ['lily’s', 'lilys', 'palaman', 'peanut butter']);
  f('cheese', 'Cheese (processed)', '', 'basics', [20, null, 3, 1.5, 5],
    [['1 slice', 1], ['2 slices', 2]], 'est', ['eden', 'keso', 'cheese', 'quickmelt']);

  f('hotdog', 'Hotdog', '', 'basics', [50, null, 6, 4, 13],
    [['1 pc', 1], ['2 pcs', 2]], 'est', ['hot dog', 'tender juicy', 'purefoods hotdog', 'red hotdog'], { note: PACK });
  f('longganisa', 'Longganisa', '', 'basics', [40, null, 6, 5, 11],
    [['1 pc', 1], ['3 pcs', 3]], 'est', ['longanisa', 'sausage', 'hamonado', 'vigan longganisa', 'lucban']);
  f('tocino', 'Tocino', '', 'basics', [100, null, 18, 15, 17],
    [['1 serving', 1], ['½ serving', 0.5]], 'est', ['pork tocino', 'tosino']);
  f('tapa', 'Beef tapa', '', 'basics', [100, null, 24, 8, 13],
    [['1 serving', 1], ['½ serving', 0.5]], 'est', ['tapa', 'tapang baka']);
  f('cornedbeef', 'Corned beef (sautéed)', '', 'basics', [100, null, 22, 4, 18],
    [['½ cup', 1], ['1 cup', 2]], 'est', ['corned beef', 'ginisang corned beef']);
  f('tuyo', 'Tuyo (fried)', '', 'basics', [30, null, 15, 0, 5],
    [['3 pcs', 1], ['6 pcs', 2]], 'est', ['tuyo', 'dried fish', 'daing', 'danggit']);
  f('bangus-daing', 'Daing na bangus', '', 'ulam', [130, null, 30, 0, 20],
    [['½ fish', 1], ['1 whole', 2]], 'est', ['bangus', 'bangos', 'milkfish', 'daing', 'boneless bangus']);
  f('tilapia-fried', 'Fried tilapia', '', 'ulam', [120, null, 28, 2, 12],
    [['1 medium fish', 1]], 'est', ['tilapia', 'pritong isda', 'fried fish', 'isda']);
  f('chicken-breast', 'Chicken breast (skinless)', '', 'basics', [100, 165, 31, 0, 3.6],
    [['100g', 1], ['1 palm-size piece', 1.2]], 'ref', ['manok', 'chicken breast', 'dibdib', 'grilled chicken', 'boiled chicken']);
  f('porkchop', 'Pork chop (fried)', '', 'ulam', [120, null, 30, 2, 22],
    one('1 pc'), 'est', ['porkchop', 'pork chop', 'baboy', 'pritong baboy']);
  f('chicken-fried', 'Fried chicken (homemade)', '', 'ulam', [100, null, 22, 6, 16],
    [['1 pc', 1], ['2 pcs', 2]], 'est', ['pritong manok', 'fried chicken', 'manok']);
  f('lechon-kawali', 'Lechon kawali', '', 'ulam', [100, null, 20, 0, 45],
    [['1 serving', 1], ['½ serving', 0.5]], 'est', ['lechon kawali', 'bagnet', 'crispy liempo', 'litson kawali']);
  f('liempo', 'Inihaw na liempo', '', 'ulam', [100, null, 18, 3, 40],
    [['1 serving', 1], ['½ serving', 0.5]], 'est', ['liempo', 'grilled pork belly', 'inihaw', 'pork belly']);
  f('lechon', 'Lechon', '', 'ulam', [100, null, 22, 0, 35],
    [['1 serving', 1], ['½ serving', 0.5]], 'est', ['litson', 'lechon baboy', 'roast pig']);
  f('crispy-pata', 'Crispy pata', '', 'ulam', [100, null, 22, 0, 40],
    [['1 serving', 1]], 'est', ['crispy pata', 'pata']);
  f('tokwa', 'Tofu (tokwa)', '', 'basics', [100, 144, 17.3, 2.8, 8.7],
    [['1 block', 1], ['½ block', 0.5]], 'ref', ['tokwa', 'tofu', 'tokwa’t baboy'], { note: 'Plain firm tofu. Fried tokwa takes on oil.' });

  /* ── silog ──────────────────────────────────────────────────────────── */
  const silog = one('1 plate');
  mix('tapsilog', 'Tapsilog', '', 'rice', [['tapa', 1], ['rice-garlic', 1], ['egg-fried', 1]], silog, ['tapa silog', 'silog']);
  mix('longsilog', 'Longsilog', '', 'rice', [['longganisa', 3], ['rice-garlic', 1], ['egg-fried', 1]], silog, ['longganisa silog', 'silog']);
  mix('tocilog', 'Tocilog', '', 'rice', [['tocino', 1], ['rice-garlic', 1], ['egg-fried', 1]], silog, ['tosilog', 'tocino silog', 'silog']);
  mix('hotsilog', 'Hotsilog', '', 'rice', [['hotdog', 2], ['rice-garlic', 1], ['egg-fried', 1]], silog, ['hotdog silog', 'silog']);
  mix('bangsilog', 'Bangsilog', '', 'rice', [['bangus-daing', 1], ['rice-garlic', 1], ['egg-fried', 1]], silog, ['bangus silog', 'silog']);
  mix('cornsilog', 'Cornsilog', '', 'rice', [['cornedbeef', 1], ['rice-garlic', 1], ['egg-fried', 1]], silog, ['corned beef silog', 'silog']);
  mix('chicksilog', 'Chicksilog', '', 'rice', [['chicken-fried', 1], ['rice-garlic', 1], ['egg-fried', 1]], silog, ['chicken silog', 'silog']);
  mix('porksilog', 'Porksilog', '', 'rice', [['porkchop', 1], ['rice-garlic', 1], ['egg-fried', 1]], silog, ['pork chop silog', 'silog']);

  /* ── ulam, cooked at home ───────────────────────────────────────────── */
  const cup = [['1 cup', 1], ['½ cup', 0.5]];
  const bowl = [['1 bowl', 1], ['½ bowl', 0.5]];
  f('adobo-chicken', 'Chicken adobo', '', 'ulam', [180, null, 30, 5, 22], [['1 serving (2 pcs)', 1], ['1 pc', 0.5]], 'est', ['adobong manok', 'adobo manok', 'adobo']);
  f('adobo-pork', 'Pork adobo', '', 'ulam', [150, null, 26, 5, 34], cup, 'est', ['adobong baboy', 'adobo baboy', 'adobo']);
  f('adobo-kangkong', 'Adobong kangkong', '', 'ulam', [150, null, 4, 8, 7], cup, 'est', ['kangkong', 'water spinach']);
  f('sinigang-pork', 'Sinigang na baboy', '', 'ulam', [400, null, 22, 12, 22], bowl, 'est', ['sinigang baboy', 'sinigang', 'pork sinigang']);
  f('sinigang-shrimp', 'Sinigang na hipon', '', 'ulam', [400, null, 22, 12, 3], bowl, 'est', ['sinigang hipon', 'sinigang', 'shrimp sinigang']);
  f('sinigang-fish', 'Sinigang na isda', '', 'ulam', [400, null, 24, 10, 6], bowl, 'est', ['sinigang bangus', 'sinigang na bangus', 'sinigang', 'fish sinigang']);
  f('tinola', 'Tinolang manok', '', 'ulam', [400, null, 26, 10, 12], bowl, 'est', ['tinola', 'chicken tinola']);
  f('nilaga', 'Nilagang baka', '', 'ulam', [400, null, 28, 18, 18], bowl, 'est', ['nilaga', 'beef nilaga', 'nilagang baboy']);
  f('bulalo', 'Bulalo', '', 'ulam', [450, null, 32, 12, 32], bowl, 'est', ['bulalo', 'beef marrow soup']);
  f('karekare', 'Kare-kare', '', 'ulam', [220, null, 24, 14, 34], cup, 'est', ['kare kare', 'karekare', 'oxtail'], { note: 'Bagoong is extra.' });
  f('menudo', 'Menudo', '', 'ulam', [220, null, 20, 16, 20], cup, 'est', ['pork menudo', 'menudo']);
  f('afritada', 'Chicken afritada', '', 'ulam', [220, null, 24, 14, 14], cup, 'est', ['afritada', 'apritada']);
  f('caldereta', 'Beef caldereta', '', 'ulam', [220, null, 26, 12, 24], cup, 'est', ['kaldereta', 'calderetang baka', 'caldereta']);
  f('mechado', 'Beef mechado', '', 'ulam', [220, null, 26, 12, 20], cup, 'est', ['mechado']);
  f('bistek', 'Bistek Tagalog', '', 'ulam', [180, null, 28, 8, 16], cup, 'est', ['bistek', 'beefsteak', 'bistek tagalog']);
  f('pinakbet', 'Pinakbet', '', 'ulam', [200, null, 7, 12, 9], cup, 'est', ['pakbet', 'pinakbet', 'vegetables']);
  f('chopsuey', 'Chop suey', '', 'ulam', [200, null, 10, 14, 7], cup, 'est', ['chopseuy', 'chopsuey', 'mixed vegetables']);
  f('monggo', 'Ginisang monggo', '', 'ulam', [240, null, 14, 30, 8], cup, 'est', ['monggo', 'munggo', 'mung beans', 'mongo']);
  f('laing', 'Laing', '', 'ulam', [180, null, 8, 14, 28], cup, 'est', ['laing', 'gabi leaves']);
  f('bicol-express', 'Bicol express', '', 'ulam', [200, null, 18, 8, 40], cup, 'est', ['bicol express', 'sili']);
  f('sisig', 'Sisig', '', 'ulam', [200, null, 26, 6, 46], [['1 serving', 1], ['½ serving', 0.5]], 'est', ['pork sisig', 'sizzling sisig', 'sisig']);
  f('dinuguan', 'Dinuguan', '', 'ulam', [220, null, 24, 6, 22], cup, 'est', ['dinuguan', 'chocolate meat']);
  f('paksiw-lechon', 'Paksiw na lechon', '', 'ulam', [200, null, 20, 16, 30], cup, 'est', ['paksiw', 'lechon paksiw']);
  f('giniling', 'Giniling', '', 'ulam', [200, null, 20, 10, 18], cup, 'est', ['giniling', 'picadillo', 'ground pork', 'ground beef']);
  f('tortang-talong', 'Tortang talong', '', 'ulam', [150, null, 8, 8, 11], one('1 pc'), 'est', ['torta', 'eggplant omelette', 'talong']);
  f('ampalaya', 'Ginisang ampalaya', '', 'ulam', [180, null, 9, 10, 8], cup, 'est', ['ampalaya', 'bitter gourd', 'ampalaya with egg']);
  f('veg-boiled', 'Vegetables (boiled)', '', 'ulam', [150, null, 3, 10, 0.5], cup, 'est', ['gulay', 'vegetables', 'talbos', 'okra', 'sitaw', 'pechay', 'kalabasa', 'salad']);
  f('kinilaw', 'Kinilaw', '', 'ulam', [150, null, 24, 6, 3], cup, 'est', ['kilawin', 'ceviche', 'kinilaw']);
  f('pusit-grilled', 'Grilled squid', '', 'ulam', [150, null, 26, 6, 4], one('1 whole'), 'est', ['inihaw na pusit', 'squid', 'pusit']);
  f('lumpia-shanghai', 'Lumpiang shanghai', '', 'ulam', [20, null, 2.5, 4, 4], [['1 pc', 1], ['5 pcs', 5], ['10 pcs', 10]], 'est', ['lumpia', 'shanghai', 'spring roll']);
  f('lumpia-sariwa', 'Lumpiang sariwa', '', 'ulam', [150, null, 6, 24, 8], one('1 pc'), 'est', ['fresh lumpia', 'lumpia sariwa']);
  f('lumpia-togue', 'Lumpiang togue', '', 'street', [100, null, 4, 18, 9], one('1 pc'), 'est', ['vegetable lumpia', 'lumpiang gulay', 'lumpia']);

  /* ── noodles, soup, merienda bowls ──────────────────────────────────── */
  f('pancit-bihon', 'Pancit bihon', '', 'noodles', [150, null, 9, 34, 6], cup, 'est', ['bihon', 'pansit', 'pancit']);
  f('pancit-canton', 'Pancit canton', '', 'noodles', [150, null, 10, 36, 9], cup, 'est', ['canton', 'pansit canton', 'pancit']);
  f('palabok', 'Pancit palabok', '', 'noodles', [300, null, 16, 56, 14], one('1 plate'), 'est', ['palabok', 'pancit luglog']);
  f('spaghetti', 'Filipino spaghetti', '', 'noodles', [300, null, 16, 60, 14], [['1 plate', 1], ['½ plate', 0.5]], 'est', ['sweet spaghetti', 'spaghetti', 'pasta']);
  f('arroz-caldo', 'Arroz caldo', '', 'noodles', [350, null, 16, 36, 8], bowl, 'est', ['aroskaldo', 'chicken lugaw', 'arroz caldo']);
  f('lugaw', 'Lugaw', '', 'noodles', [350, null, 4, 38, 2], bowl, 'est', ['congee', 'porridge', 'lugaw']);
  f('goto', 'Goto', '', 'noodles', [350, null, 14, 36, 10], bowl, 'est', ['beef goto', 'goto', 'tripe lugaw']);
  f('champorado', 'Champorado', '', 'noodles', [300, null, 7, 58, 6], bowl, 'est', ['chocolate porridge', 'tsampurado'], { note: 'With milk on top, add about 50.' });
  f('sopas', 'Sopas', '', 'noodles', [350, null, 14, 30, 12], bowl, 'est', ['chicken sopas', 'macaroni soup']);
  f('mami', 'Mami', '', 'noodles', [450, null, 20, 48, 10], bowl, 'est', ['beef mami', 'chicken mami', 'noodle soup']);
  f('lomi', 'Lomi', '', 'noodles', [450, null, 20, 56, 16], bowl, 'est', ['lomi', 'batangas lomi']);
  f('batchoy', 'La Paz batchoy', '', 'noodles', [450, null, 24, 50, 16], bowl, 'est', ['batchoy', 'la paz']);

  /* ── street food and merienda ───────────────────────────────────────── */
  f('fishball', 'Fishball', '', 'street', [100, null, 8, 20, 6], [['10 pcs', 1], ['5 pcs', 0.5], ['20 pcs', 2]], 'est', ['fishballs', 'fish ball', 'squidball', 'kikiam', 'chicken ball'], { note: 'Sauce adds about 20 per dip.' });
  f('kwekkwek', 'Kwek-kwek', '', 'street', [35, null, 4, 6, 5], [['1 pc', 1], ['5 pcs', 5]], 'est', ['kwek kwek', 'tokneneng', 'quek quek']);
  f('isaw', 'Isaw', '', 'street', [30, null, 6, 1, 4], [['1 stick', 1], ['3 sticks', 3]], 'est', ['isaw manok', 'chicken intestine']);
  f('bbq', 'Pork barbecue', '', 'street', [50, null, 9, 6, 9], [['1 stick', 1], ['2 sticks', 2]], 'est', ['bbq', 'barbecue', 'pork bbq', 'inihaw']);
  f('banana-cue', 'Banana cue', '', 'street', [100, null, 1, 38, 5], one('1 stick'), 'est', ['bananacue', 'banana q', 'banana que']);
  f('camote-cue', 'Camote cue', '', 'street', [100, null, 1.5, 38, 5], one('1 stick'), 'est', ['kamote cue', 'camote que']);
  f('turon', 'Turon', '', 'street', [80, null, 2, 34, 8], [['1 pc', 1], ['2 pcs', 2]], 'est', ['banana lumpia', 'turon saging']);
  f('taho', 'Taho', '', 'street', [250, null, 7, 38, 3], [['1 cup', 1], ['Small cup', 0.6]], 'est', ['tahoe', 'soy pudding']);
  f('halo-halo', 'Halo-halo', '', 'street', [350, null, 6, 70, 8], [['1 regular', 1], ['1 large', 1.4]], 'est', ['halo halo', 'haluhalo']);
  f('corn', 'Boiled corn', '', 'street', [100, null, 3.4, 21, 1.5], one('1 ear'), 'est', ['mais', 'nilagang mais', 'corn']);
  f('siopao', 'Siopao asado', '', 'street', [120, null, 10, 44, 8], one('1 pc'), 'est', ['siopao', 'steamed bun', 'bola bola']);
  f('siomai', 'Pork siomai', '', 'street', [100, null, 10, 12, 10], [['4 pcs', 1], ['2 pcs', 0.5], ['8 pcs', 2]], 'est', ['siomai', 'shumai', 'dumplings', 'siomai rice']);
  f('puto', 'Puto', '', 'street', [30, null, 1.5, 14, 1], [['1 pc', 1], ['3 pcs', 3]], 'est', ['rice cake', 'puto cheese']);
  f('kutsinta', 'Kutsinta', '', 'street', [40, null, 0.5, 17, 0.2], [['1 pc', 1], ['3 pcs', 3]], 'est', ['cuchinta', 'kakanin']);
  f('bibingka', 'Bibingka', '', 'street', [100, null, 6, 44, 10], one('1 pc'), 'est', ['bibingka']);
  f('puto-bumbong', 'Puto bumbong', '', 'street', [100, null, 4, 48, 6], one('1 serving'), 'est', ['puto bumbong']);
  f('suman', 'Suman', '', 'street', [80, null, 2, 34, 3], one('1 pc'), 'est', ['suman', 'kakanin']);
  f('biko', 'Biko', '', 'street', [80, null, 2, 40, 5], one('1 slice'), 'est', ['biko', 'kakanin', 'sinukmani']);
  f('leche-flan', 'Leche flan', '', 'street', [80, null, 5, 30, 7], one('1 slice'), 'est', ['flan', 'leche plan', 'custard']);
  f('sorbetes', 'Sorbetes', '', 'street', [80, null, 2.5, 24, 6], [['1 cone', 1], ['1 cup', 1]], 'est', ['dirty ice cream', 'ice cream']);
  f('chicharon', 'Chicharon', '', 'street', [30, null, 18, 0, 10], one('1 small pack'), 'est', ['chicharron', 'pork rinds', 'chicharon baboy']);
  f('peanuts', 'Roasted peanuts', '', 'street', [28, 166, 6.7, 6.1, 14.1], [['1 small pack', 1], ['¼ cup', 1.3]], 'ref', ['mani', 'peanuts', 'adobong mani']);

  /* ── Jollibee ───────────────────────────────────────────────────────── */
  const JB = 'Jollibee';
  f('jb-cj-drum', 'Chickenjoy Drumstick', JB, 'fastfood', [85, 220, 20, 3, 14], [['1 pc', 1], ['2 pcs', 2]], 'pub-us', ['chickenjoy', 'chicken joy', 'cj', 'drumstick', 'paa'], { na: 270, note: JB_US });
  f('jb-cj-thigh', 'Chickenjoy Thigh', JB, 'fastfood', [125, 380, 27, 5, 28], [['1 pc', 1], ['2 pcs', 2]], 'pub-us', ['chickenjoy', 'chicken joy', 'cj', 'thigh', 'hita'], { na: 400, note: JB_US });
  f('jb-cj', 'Chickenjoy (1 pc, any part)', JB, 'fastfood', [105, 300, 23.5, 4, 21], [['1 pc', 1], ['2 pcs', 2], ['6 pc bucket', 6]], 'pub-us', ['chickenjoy', 'chicken joy', 'cj', 'jollibee chicken', 'fried chicken'], { na: 335, note: 'The average of the drumstick and the thigh. ' + JB_US });
  f('jb-cj-spicy-drum', 'Spicy Chickenjoy Drumstick', JB, 'fastfood', [85, 240, 16, 10, 14], one('1 pc'), 'pub-us', ['spicy chickenjoy', 'spicy cj'], { na: 540, note: JB_US });
  f('jb-cj-spicy-thigh', 'Spicy Chickenjoy Thigh', JB, 'fastfood', [126, 350, 23, 15, 21], one('1 pc'), 'pub-us', ['spicy chickenjoy', 'spicy cj'], { na: 790, note: JB_US });
  f('jb-gravy', 'Gravy', JB, 'fastfood', [77, 25, 1, 5, 0], one('1 small cup'), 'pub-us', ['jollibee gravy', 'gravy'], { na: 380, note: JB_US });
  f('jb-rice', 'Rice', JB, 'fastfood', [198, 190, 4, 44, 0], [['1 rice', 0.81], ['1 US serving (198g)', 1]], 'pub-us', ['jollibee rice', 'extra rice', 'kanin'], { na: 0, note: 'The US serving is 198g. A Philippine rice is taken as about one cup, 160g, which is an estimate. ' + JB_US });
  f('jb-spaghetti', 'Jolly Spaghetti', JB, 'fastfood', [411, 610, 23, 76, 23], [['1 solo', 0.6], ['1 US serving (411g)', 1], ['Family pack', 3]], 'pub-us', ['jollibee spaghetti', 'jolly spag', 'spaghetti'], { na: 1340, note: 'The US serving is 411g. The Philippine solo is smaller; taking it as 60% of that is an estimate. ' + JB_US });
  f('jb-palabok', 'Palabok Fiesta', JB, 'fastfood', [351, 410, 20, 49, 15], [['1 regular', 1], ['Family pack', 3.02]], 'pub-us', ['jollibee palabok', 'palabok'], { na: 950, note: JB_US });
  f('jb-burgersteak', 'Burger Steak (1 pc, no rice)', JB, 'fastfood', [112, 190, 10, 6, 14], [['1 pc', 1], ['2 pcs', 2]], 'pub-us', ['burgersteak', 'burger steak'], { na: 505, note: 'Worked out from the US 2 pc Burger Steak with rice, minus the rice. ' + JB_US });
  f('jb-yum', 'Yumburger', JB, 'fastfood', [118, 360, 13, 30, 21], one('1 pc'), 'pub-us', ['yum burger', 'yum', 'jollibee burger', 'burger'], { na: 630, note: 'The US Yum. The Philippine Yumburger is smaller, so this is on the high side. ' + JB_US });
  f('jb-yum-cheese', 'Cheesy Yumburger', JB, 'fastfood', [132, 410, 16, 30, 25], one('1 pc'), 'pub-us', ['cheesy yum', 'yum with cheese', 'cheeseburger'], { na: 880, note: 'The US Yum with Cheese. The Philippine one is smaller. ' + JB_US });
  f('jb-fries', 'Jolly Crispy Fries', JB, 'fastfood', [113, 340, 4, 41, 18], [['Regular', 1], ['Large', 1.5]], 'pub-us', ['fries', 'french fries', 'jollibee fries'], { na: 560, note: JB_US });
  f('jb-peach-mango', 'Peach Mango Pie', JB, 'fastfood', [94, 270, 3, 40, 11], one('1 pc'), 'pub-us', ['peach mango', 'pie', 'jollibee pie'], { na: 130, note: JB_US });
  f('jb-hotdog', 'Jolly Hotdog', JB, 'fastfood', [130, null, 12, 32, 20], one('1 pc'), 'est', ['jolly hotdog', 'hotdog sandwich']);
  f('jb-sundae', 'Chocolate Sundae', JB, 'fastfood', [120, null, 4, 34, 6], one('1 cup'), 'est', ['sundae', 'jollibee sundae', 'ice cream']);
  mix('jb-c1', 'Chickenjoy with Rice (1 pc)', JB, 'fastfood', [['jb-cj', 1], ['jb-rice', 0.81], ['jb-gravy', 1]], one('1 meal'), ['c1', '1pc chickenjoy', 'chickenjoy meal', 'chickenjoy with rice']);
  mix('jb-c2', 'Chickenjoy with Rice (2 pcs)', JB, 'fastfood', [['jb-cj', 2], ['jb-rice', 0.81], ['jb-gravy', 1]], one('1 meal'), ['2pc chickenjoy', 'chickenjoy meal']);
  mix('jb-cj-spag', 'Chickenjoy with Jolly Spaghetti', JB, 'fastfood', [['jb-cj', 1], ['jb-spaghetti', 0.6], ['jb-gravy', 1]], one('1 meal'), ['chickenjoy spaghetti', 'cj spag', 'chicken spaghetti']);
  mix('jb-bs1', 'Burger Steak with Rice (1 pc)', JB, 'fastfood', [['jb-burgersteak', 1], ['jb-rice', 0.81]], one('1 meal'), ['burger steak meal', 'burgersteak with rice']);
  mix('jb-bs2', 'Burger Steak with Rice (2 pcs)', JB, 'fastfood', [['jb-burgersteak', 2], ['jb-rice', 0.81]], one('1 meal'), ['burger steak meal', 'burgersteak with rice']);

  /* ── McDonald's ─────────────────────────────────────────────────────── */
  const MC = 'McDonald’s';
  /* McDonald's Philippines' own figures, from mcdonalds.com.ph/our-food,
     "based on a 3rd Party Nutrition Testing in December 2019". No grams are
     printed. Plain McSpaghetti has no figure of its own there, so it stays
     an estimate.                                                          */
  const mcd = chain(MC, ['mcdo', 'mcdonalds', 'mcdonald’s']);
  const mcAka = (a) => a.concat(['mcdo', 'mcdonalds', 'mcdonald’s']);
  mcd('mc-burger', 'Burger McDo', 'fastfood', [['1 pc', 354, 13, 14, 43, 858]], ['burger']);
  mcd('mc-cheeseburger', 'Cheeseburger', 'fastfood', [['1 pc', 324, 16, 12, 37, 715]], []);
  mcd('mc-double-cheese', 'Double Cheeseburger', 'fastfood', [['1 pc', 469, 27, 22, 39, 1087]], ['cheeseburger']);
  mcd('mc-qpc', 'Quarter Pounder with Cheese', 'fastfood', [['1 pc', 521, 31, 25, 41, 1080]], ['qpc', 'quarter pounder']);
  mcd('mc-bigmac', 'Big Mac', 'fastfood', [['1 pc', 752, 29, 43, 59, 1452]], ['bigmac']);
  mcd('mc-mcchicken', 'McChicken Sandwich', 'fastfood', [['1 pc', 358, 16, 16, 40, 644]], ['mcchicken', 'chicken sandwich']);
  mcd('mc-crispy-sandwich', 'Crispy Chicken Sandwich', 'fastfood', [['1 pc', 387, 16, 16, 42, 1021]], ['chicken sandwich']);
  mcd('mc-chicken', 'Chicken McDo with Rice', 'fastfood', [['1 pc', 504, 26, 18, 59, 1130], ['2 pcs', 809, 47, 36, 72, 2260]], ['chicken mcdo', 'fried chicken', 'chicken with rice', 'c1']);
  mcd('mc-chicken-spag', 'Chicken McDo with McSpaghetti', 'fastfood', [['1 meal', 679, 34, 28, 73, 1836]], ['chicken spaghetti', 'mcspaghetti']);
  mcd('mc-nuggets', 'Chicken McNuggets with Fries (6 pcs)', 'fastfood', [['1 meal', 547, 37, 27, 348, 781]], ['nuggets', 'mcnuggets'], { odd: 1 });
  mcd('mc-crispy-fillet', 'Crispy Chicken Fillet with Rice', 'fastfood', [['1 meal', 363, 14, 8, 57, 844]], ['chicken fillet']);
  mcd('mc-eggdesal', 'Cheesy Eggdesal', 'fastfood', [['1 pc', 248, 14, 7, 31, 402]], ['eggdesal', 'pandesal', 'breakfast']);
  mcd('mc-sausage-mcmuffin', 'Sausage McMuffin with Egg', 'fastfood', [['1 pc', 409, 24, 18, 37, 875]], ['mcmuffin', 'breakfast']);
  mcd('mc-sausage-platter', 'Sausage Platter with Rice', 'fastfood', [['1 meal', 520, 25, 22, 55, 796]], ['breakfast', 'longganisa']);
  mcd('mc-hashbrown', 'Hash Browns', 'fastfood', [['1 pc', 135, 1, 8, 10, 271]], ['hash brown', 'hashbrown']);
  mcd('mc-hotcakes', 'Hotcakes (2 pcs)', 'fastfood', [['1 order', 295, 7, 5, 55, 487]], ['hotcakes', 'pancakes', 'breakfast']);
  mcd('mc-hotcakes-sausage', 'Hotcakes with Sausage (2 pcs)', 'fastfood', [['1 order', 392, 15, 11, 58, 837]], ['hotcakes', 'pancakes', 'breakfast']);
  mcd('mc-fries', 'Fries', 'fastfood', [['1 order', 321, 5, 14, 43, 157]], ['french fries']);
  mcd('mc-poptato', 'Poptato', 'fastfood', [['Medium', 183, 3, 9, 22, 252], ['Large', 254, 3, 12, 30, 349]], ['potato', 'wedges']);
  mcd('mc-coke', 'Coca-Cola', 'drinks', [['1 regular', 71, 0, 0, 18, 25]], ['coke', 'softdrink', 'soda']);
  mcd('mc-coke-zero', 'Coca-Cola Zero', 'drinks', [['1 regular', 0, 0, 0, 0, 21]], ['coke zero', 'softdrink', 'soda']);
  mcd('mc-float', 'Coke McFloat', 'drinks', [['1 regular', 207, 3, 12, 36, 159]], ['mcfloat', 'float', 'coke float'], { odd: 1 });
  mcd('mc-aw-float', 'A&W Root Beer McFloat', 'drinks', [['Medium', 148, 12, 10, 14, 44], ['Large', 169, 18, 10, 20, 44]], ['mcfloat', 'float', 'root beer'], { odd: 1 });
  mcd('mc-oj', 'Orange Juice', 'drinks', [['1 regular', 92, 0, 0, 23, 73]], ['juice']);
  mcd('mc-mcflurry', 'McFlurry with Oreo Cookies', 'fastfood', [['1 cup', 542, 7, 49, 19, 204]], ['mcflurry', 'oreo', 'ice cream']);
  mcd('mc-sundae', 'Hot Fudge Sundae', 'fastfood', [['1 cup', 400, 6, 32, 23, 221]], ['sundae', 'hot fudge', 'ice cream']);
  mcd('mc-caramel-sundae', 'Hot Caramel Sundae', 'fastfood', [['1 cup', 413, 5, 31, 27, 226]], ['sundae', 'caramel', 'ice cream']);
  mcd('mc-cone', 'Vanilla Sundae Cone', 'fastfood', [['1 cone', 190, 2, 10, 6, 56]], ['cone', 'ice cream', 'vanilla cone'], { odd: 1 });
  mcd('mc-taro-pie', 'Taro Custard Pie', 'fastfood', [['1 pc', 185, 2, 9, 23, 118]], ['pie', 'taro pie']);
  mcd('mc-lava-puff', 'Choco Lava Puff', 'fastfood', [['1 pc', 368, 5, 23, 36, 124]], ['lava puff', 'chocolate']);
  mcd('mc-premium-roast-coffee', 'Premium Roast Coffee (McCafé)', 'drinks', [['1 regular', 1, 0, 0, 0, 2]], ['mccafe', 'coffee', 'brewed coffee', 'kape']);
  mcd('mc-americano', 'Americano (McCafé)', 'drinks', [['1 regular', 8, 1, 0, 1, 5]], ['mccafe', 'coffee', 'black coffee']);
  mcd('mc-cappuccino', 'Cappuccino (McCafé)', 'drinks', [['1 regular', 119, 15, 6, 12, 115]], ['mccafe', 'capuccino', 'coffee'], { odd: 1 });
  mcd('mc-espresso', 'Espresso (McCafé)', 'drinks', [['1 regular', 8, 1, 0, 1, 5]], ['mccafe', 'coffee']);
  mcd('mc-cafe-latte', 'Cafe Latte (McCafé)', 'drinks', [['1 regular', 152, 6, 8, 14, 150]], ['mccafe', 'latte', 'coffee']);
  mcd('mc-macchiato', 'Macchiato (McCafé)', 'drinks', [['1 regular', 18, 0, 1, 2, 5]], ['mccafe', 'coffee']);
  mcd('mc-iced-mocha', 'Iced Mocha (McCafé)', 'drinks', [['1 regular', 277, 3, 5, 21, 36]], ['mccafe', 'mocha', 'iced coffee'], { odd: 1 });
  mcd('mc-iced-americano', 'Iced Americano (McCafé)', 'drinks', [['1 regular', 82, 0, 0, 20, 14]], ['mccafe', 'iced coffee', 'americano']);
  mcd('mc-iced-latte', 'Iced Latte (McCafé)', 'drinks', [['1 regular', 143, 4, 5, 21, 60]], ['mccafe', 'iced coffee', 'latte']);
  mcd('mc-iced-double-choco-frappe', 'Iced Double Choco Frappe (McCafé)', 'drinks', [['1 regular', 251, 2, 13, 33, 191]], ['mccafe', 'frappe', 'chocolate']);
  mcd('mc-caramel-frappe', 'Caramel Frappe (McCafé)', 'drinks', [['1 regular', 112, 5, 6, 11, 68]], ['mccafe', 'frappe']);
  mcd('mc-mocha-frappe', 'Mocha Frappe (McCafé)', 'drinks', [['1 regular', 241, 4, 3, 51, 89]], ['mccafe', 'frappe']);
  mcd('mc-latte-frappe', 'Latte Frappe (McCafé)', 'drinks', [['1 regular', 194, 4, 10, 33, 65]], ['mccafe', 'frappe'], { odd: 1 });
  mcd('mc-strawberry-smoothie', 'Strawberry Smoothie (McCafé)', 'drinks', [['1 regular', 306, 3, 15, 71, 122]], ['mccafe', 'smoothie'], { odd: 1 });
  mcd('mc-blueberry-cheesecake', 'Blueberry Cheesecake (McCafé)', 'fastfood', [['1 slice', 503, 20, 30, 52, 189]], ['mccafe', 'cheesecake', 'cake']);
  mcd('mc-dark-chocolate-cake', 'Dark Chocolate Cake (McCafé)', 'fastfood', [['1 slice', 489, 4, 27, 59, 680]], ['mccafe', 'chocolate cake', 'cake']);
  mcd('mc-oreo-cheesecake', 'Oreo Cheesecake (McCafé)', 'fastfood', [['1 slice', 574, 8, 39, 47, 422]], ['mccafe', 'cheesecake', 'cake']);
  mcd('mc-chocolate-chip-cookie', 'Chocolate Chip Cookie (McCafé)', 'fastfood', [['1 pc', 166, 2, 7, 23, 117]], ['mccafe', 'cookie']);
  f('mc-spaghetti', 'McSpaghetti', MC, 'fastfood', [230, null, 12, 48, 10], one('1 regular'), 'est', mcAka(['mcspaghetti', 'spaghetti']));

  /* ── Mang Inasal ────────────────────────────────────────────────────── */
  const MI = 'Mang Inasal';
  const unli = 'Unli rice: add a Rice for every extra cup.';
  f('mi-pecho', 'Chicken Inasal Pecho (breast)', MI, 'fastfood', [200, null, 48, 4, 18], one('1 pc'), 'est', ['pecho', 'inasal', 'chicken inasal', 'breast', 'mang inasal chicken']);
  f('mi-paa', 'Chicken Inasal Paa (leg)', MI, 'fastfood', [200, null, 38, 4, 26], one('1 pc'), 'est', ['paa', 'inasal', 'chicken inasal', 'leg', 'mang inasal chicken']);
  f('mi-pork-bbq', 'Pork BBQ', MI, 'fastfood', [120, null, 20, 14, 20], one('2 sticks'), 'est', ['pork bbq', 'barbecue', 'mang inasal bbq']);
  f('chicken-oil', 'Chicken oil', MI, 'extras', [13, 115, 0, 0, 12.8], [['1 tbsp', 1], ['2 tbsp', 2]], 'ref', ['chicken oil', 'mantika', 'inasal oil']);
  f('mi-halo', 'Halo-halo', MI, 'fastfood', [350, null, 6, 70, 8], one('1 regular'), 'est', ['halo halo', 'mang inasal halo halo']);
  f('mi-sisig', 'Sisig', MI, 'fastfood', [200, null, 26, 6, 46], one('1 order'), 'est', ['pork sisig', 'mang inasal sisig']);
  mix('mi-pm1', 'PM1 Chicken Inasal Paa with Rice', MI, 'fastfood', [['mi-paa', 1], ['rice', 1]], one('1 meal'), ['pm1', 'paa meal', 'inasal meal', 'unli rice'], { note: unli });
  mix('mi-pm2', 'PM2 Chicken Inasal Pecho with Rice', MI, 'fastfood', [['mi-pecho', 1], ['rice', 1]], one('1 meal'), ['pm2', 'pecho meal', 'inasal meal', 'unli rice'], { note: unli });

  /* ── Chowking ───────────────────────────────────────────────────────── */
  const CK = 'Chowking';
  f('ck-chaofan', 'Chao Fan', CK, 'fastfood', [300, null, 16, 78, 18], [['Regular', 1], ['Solo', 0.7]], 'est', ['chao fan', 'chaofan', 'fried rice', 'pork chao fan']);
  f('ck-siomai', 'Siomai (4 pcs)', CK, 'fastfood', [100, null, 10, 12, 10], one('4 pcs'), 'est', ['siomai', 'chowking siomai']);
  f('ck-siopao', 'Asado Siopao', CK, 'fastfood', [130, null, 11, 46, 9], one('1 pc'), 'est', ['siopao', 'chowking siopao']);
  f('ck-mami', 'Beef Mami', CK, 'fastfood', [500, null, 22, 52, 12], one('1 bowl'), 'est', ['mami', 'beef mami', 'noodle soup']);
  f('ck-chicken', 'Chinese-style Fried Chicken', CK, 'fastfood', [110, null, 24, 8, 18], [['1 pc', 1], ['2 pcs', 2]], 'est', ['chowking chicken', 'fried chicken']);
  f('ck-pancit', 'Pancit Canton', CK, 'fastfood', [300, null, 16, 62, 14], one('1 regular'), 'est', ['pancit canton', 'chowking pancit']);
  f('ck-lumpia', 'Lumpiang Shanghai (3 pcs)', CK, 'fastfood', [60, null, 7.5, 12, 12], one('3 pcs'), 'est', ['lumpia', 'shanghai']);
  f('ck-buchi', 'Buchi', CK, 'fastfood', [35, null, 2, 18, 4], [['1 pc', 1], ['3 pcs', 3]], 'est', ['butsi', 'sesame ball', 'buchi']);
  f('ck-halo', 'Halo-Halo', CK, 'fastfood', [400, null, 7, 80, 9], one('1 regular'), 'est', ['halo halo', 'chowking halo halo']);
  mix('ck-lauriat', 'Chicken Lauriat', CK, 'fastfood', [['ck-chicken', 1], ['ck-chaofan', 1], ['ck-siomai', 0.5], ['ck-buchi', 1]], one('1 meal'), ['lauriat', 'chinese style chicken lauriat']);

  /* ── Andok's ────────────────────────────────────────────────────────── */
  const AN = 'Andok’s';
  f('an-litson', 'Litson Manok', AN, 'fastfood', [180, null, 40, 1, 20], [['¼ chicken', 1], ['½ chicken', 2], ['Whole', 4]], 'est', ['lechon manok', 'litson manok', 'roast chicken', 'andoks']);
  f('an-liempo', 'Litson Liempo', AN, 'fastfood', [100, null, 18, 3, 40], [['1 serving', 1], ['¼ kilo', 2.5]], 'est', ['liempo', 'andoks liempo']);

  /* ── Greenwich ──────────────────────────────────────────────────────── */
  const GW = 'Greenwich';
  f('gw-pizza', 'Pizza (1 slice)', GW, 'fastfood', [100, null, 10, 30, 10], [['1 slice', 1], ['2 slices', 2]], 'est', ['pizza', 'greenwich pizza', 'hawaiian', 'overload']);
  f('gw-lasagna', 'Lasagna Supreme', GW, 'fastfood', [300, null, 22, 50, 20], one('1 solo'), 'est', ['lasagna', 'lasagne']);

  /* ── convenience stores ─────────────────────────────────────────────── */
  const SE = '7-Eleven';
  f('se-bigbite', 'Big Bite Hotdog', SE, 'fastfood', [150, null, 12, 34, 20], one('1 pc'), 'est', ['big bite', 'hotdog sandwich', 'seven eleven', '711']);
  f('se-siopao', 'Siopao', SE, 'fastfood', [140, null, 11, 50, 9], one('1 pc'), 'est', ['siopao', 'seven eleven', '711']);
  f('se-ricemeal', 'Chicken Rice Meal', SE, 'fastfood', [350, null, 24, 80, 18], one('1 pack'), 'est', ['rice meal', 'seven eleven', '711', 'chicken meal']);
  f('se-slurpee', 'Slurpee', SE, 'drinks', [350, null, 0, 40, 0], [['Regular', 1], ['Large', 1.5]], 'est', ['slurpee', 'seven eleven', '711']);
  const LW = 'Lawson';
  f('lw-onigiri', 'Onigiri', LW, 'fastfood', [110, null, 5, 36, 4], [['1 pc', 1], ['2 pcs', 2]], 'est', ['onigiri', 'rice ball', 'tuna mayo']);
  f('lw-karaage', 'Karaage (5 pcs)', LW, 'fastfood', [120, null, 20, 14, 18], one('5 pcs'), 'est', ['karaage', 'fried chicken']);
  f('lw-oden', 'Oden', LW, 'fastfood', [60, null, 4, 6, 2], [['1 pc', 1], ['3 pcs', 3]], 'est', ['oden', 'fish cake']);
  f('lw-bento', 'Bento Meal', LW, 'fastfood', [350, null, 20, 80, 16], one('1 pack'), 'est', ['bento', 'rice meal']);
  f('ms-chicken', 'Uncle John’s Fried Chicken', 'Ministop', 'fastfood', [120, null, 24, 10, 20], [['1 pc', 1], ['2 pcs', 2]], 'est', ['uncle johns', 'ministop chicken', 'fried chicken']);
  const SR = 'S&R';
  f('sr-pizza', 'Pizza (1 slice, 18-inch)', SR, 'fastfood', [230, null, 28, 70, 26], one('1 slice'), 'est', ['snr pizza', 's and r', 'snr', 'new york pizza']);
  f('sr-wings', 'Chicken Wings (6 pcs)', SR, 'fastfood', [240, null, 40, 10, 34], one('6 pcs'), 'est', ['snr wings', 'wings', 'snr']);
  f('sr-hotdog', 'Quarter-pound Hotdog', SR, 'fastfood', [220, null, 20, 40, 30], one('1 pc'), 'est', ['snr hotdog', 'hotdog sandwich', 'snr']);

  /* ── drinks ─────────────────────────────────────────────────────────── */
  f('softdrink', 'Softdrink (regular)', '', 'drinks', [330, 139, 0, 35, 0],
    [['1 can (330ml)', 1], ['1 glass (250ml)', 250 / 330], ['1 bottle (500ml)', 500 / 330], ['1.5 liter bottle', 1500 / 330]], 'ref',
    ['coke', 'coca cola', 'softdrinks', 'soft drinks', 'royal', 'sprite', 'pepsi', 'mountain dew', 'rc cola', 'soda'], { note: 'A typical regular cola.' });
  f('softdrink-zero', 'Softdrink (zero sugar)', '', 'drinks', [330, 1, 0, 0, 0], [['1 can (330ml)', 1], ['1 bottle (500ml)', 500 / 330]], 'ref', ['coke zero', 'diet coke', 'pepsi max', 'zero sugar', 'diet soda']);
  f('iced-tea', 'Iced tea (sweetened)', '', 'drinks', [350, null, 0, 30, 0], [['1 bottle', 1], ['1 glass', 0.7]], 'est', ['c2', 'nestea', 'lipton', 'iced tea', 'juice drink']);
  f('juice-powder', 'Powdered juice', '', 'drinks', [250, null, 0, 22, 0], one('1 glass'), 'est', ['tang', 'eight o’clock', 'zesto', 'juice', 'dalandan juice']);
  f('buko', 'Buko juice', '', 'drinks', [240, 46, 1.7, 8.9, 0.5], [['1 glass', 1], ['1 whole buko', 1.3]], 'ref', ['coconut water', 'buko', 'young coconut']);
  f('coffee-3in1', '3-in-1 coffee', '', 'drinks', [28, null, 1, 20, 3.5], [['1 sachet', 1], ['2 sachets', 2]], 'est', ['nescafe', 'kopiko', 'great taste', '3 in 1', 'coffee mix', 'kape', 'kopiko brown', 'san mig coffee'], { note: PACK });
  f('coffee-black', 'Black coffee', '', 'drinks', [240, 2, 0.3, 0, 0], one('1 cup'), 'ref', ['kape', 'barako', 'americano', 'brewed coffee', 'black coffee']);
  f('coffee-cream', 'Coffee with sugar and creamer', '', 'drinks', [240, null, 1, 12, 3], one('1 cup'), 'est', ['kape', 'coffee with creamer', 'coffee mate', 'creamer']);
  f('milo', 'Milo', '', 'drinks', [24, null, 2, 16, 2], one('1 sachet'), 'est', ['milo', 'chocolate drink', 'ovaltine', 'energen'], { note: 'Made with water. With milk, add the milk.' });
  f('milk', 'Fresh milk', '', 'drinks', [244, 149, 7.7, 11.7, 7.9], [['1 glass', 1], ['1 small box (200ml)', 0.82]], 'ref', ['gatas', 'milk', 'fresh milk', 'full cream']);
  f('milk-powder', 'Powdered milk', '', 'drinks', [33, null, 8, 12, 8], one('1 glass'), 'est', ['bear brand', 'birch tree', 'gatas', 'alaska powdered'], { note: PACK });
  f('milktea', 'Milk tea with pearls', '', 'drinks', [500, null, 3, 70, 10], [['Medium', 1], ['Large', 1.3], ['Medium, no pearls', 0.7]], 'est', ['milktea', 'boba', 'pearl milk tea', 'zagu', 'serenitea', 'chatime', 'macao imperial', 'tapioca']);
  f('iced-coffee', 'Iced coffee (sweetened)', '', 'drinks', [400, null, 4, 40, 6], [['Medium', 1], ['Large', 1.3]], 'est', ['iced latte', 'iced coffee', 'coffee shop']);
  f('frappe', 'Frappe', '', 'drinks', [470, null, 5, 60, 15], [['Grande', 1], ['Tall', 0.75], ['Venti', 1.25]], 'est', ['frappuccino', 'starbucks', 'blended coffee', 'java chip']);
  f('yakult', 'Yakult', '', 'drinks', [80, null, 1, 11, 0], [['1 bottle', 1], ['5 bottles', 5]], 'est', ['yakult', 'probiotic drink']);
  f('sports-drink', 'Sports drink', '', 'drinks', [500, null, 0, 30, 0], one('1 bottle (500ml)'), 'est', ['gatorade', 'pocari sweat', 'powerade']);
  f('beer', 'Beer (San Miguel Pale Pilsen)', '', 'drinks', [330, null, 1.3, 13, 0], [['1 bottle', 1], ['1 grande', 3.03]], 'est', ['beer', 'pale pilsen', 'serbesa', 'san mig', 'smb'], { alc: 13 });
  f('beer-light', 'Beer (San Mig Light)', '', 'drinks', [330, null, 1, 6, 0], one('1 bottle'), 'est', ['san mig light', 'sml', 'light beer'], { alc: 13 });
  f('beer-strong', 'Beer (Red Horse)', '', 'drinks', [500, null, 2, 20, 0], [['1 bottle (500ml)', 1], ['1 grande', 2]], 'est', ['red horse', 'strong beer', 'redhorse'], { alc: 27 });
  f('liquor', 'Rum, brandy or gin', '', 'drinks', [45, null, 0, 0, 0], [['1 shot', 1], ['5 shots', 5]], 'est', ['tanduay', 'emperador', 'gin', 'ginebra', 'gsm', 'alak', 'shot', 'whisky'], { alc: 14, note: 'Mixers and chasers are extra.' });

  /* ── packaged ───────────────────────────────────────────────────────── */
  f('pk-canton', 'Instant pancit canton', '', 'packaged', [60, null, 5.5, 38, 12.5], [['1 pack', 1], ['2 packs', 2]], 'est', ['lucky me pancit canton', 'lucky me', 'chilimansi', 'kalamansi canton', 'instant canton'], { note: PACK });
  f('pk-noodle-soup', 'Instant noodle soup', '', 'packaged', [55, null, 5, 36, 10], [['1 pack', 1], ['2 packs', 2]], 'est', ['lucky me beef', 'instant mami', 'nissin', 'noodles', 'payless', 'batchoy instant'], { note: PACK });
  f('pk-cup-noodles', 'Cup noodles', '', 'packaged', [60, null, 5.5, 38, 12], one('1 cup'), 'est', ['nissin cup noodles', 'cup noodles'], { note: PACK });
  f('pk-tuna', 'Canned tuna in oil', '', 'packaged', [120, null, 26, 4, 14], [['1 can, drained', 1], ['½ can', 0.5]], 'est', ['century tuna', 'tuna', 'san marino', '555 tuna'], { note: PACK });
  f('pk-cornedbeef', 'Canned corned beef', '', 'packaged', [150, null, 28, 4, 24], [['1 can (150g)', 1], ['½ can', 0.5]], 'est', ['argentina', 'purefoods', 'delimondo', 'corned beef'], { note: PACK });
  f('pk-sardines', 'Sardines in tomato sauce', '', 'packaged', [155, null, 24, 6, 16], [['1 can', 1], ['½ can', 0.5]], 'est', ['ligo', '555 sardines', 'mega sardines', 'sardinas'], { note: PACK });
  f('pk-luncheon', 'Luncheon meat', '', 'packaged', [60, null, 7, 4, 16], [['3 slices', 1], ['1 slice', 1 / 3]], 'est', ['spam', 'maling', 'luncheon meat', 'meat loaf', 'libby'], { note: PACK });
  f('pk-crackers', 'Crackers', '', 'packaged', [25, null, 2.5, 17, 4], [['1 pack', 1], ['2 packs', 2]], 'est', ['skyflakes', 'fita', 'crackers', 'biscuit', 'hansel', 'rebisco'], { note: PACK });
  f('pk-chips', 'Chips (small pack)', '', 'packaged', [25, null, 1.5, 15, 7], [['1 small pack', 1], ['1 big pack', 3]], 'est', ['chippy', 'piattos', 'nova', 'oishi', 'clover', 'v-cut', 'potato chips', 'chichirya'], { note: PACK });
  f('pk-chocnut', 'Choc Nut', '', 'packaged', [6, null, 1, 3, 2], [['1 pc', 1], ['5 pcs', 5]], 'est', ['chocnut', 'choc nut']);
  f('pk-snack-cake', 'Snack cake', '', 'packaged', [40, null, 2, 24, 7], one('1 pc'), 'est', ['fudgee barr', 'cream o', 'rebisco', 'snack cake', 'cupcake', 'mamon'], { note: PACK });
  f('pk-chocolate', 'Chocolate bar (small)', '', 'packaged', [35, null, 2.5, 20, 10], one('1 bar'), 'est', ['cadbury', 'kitkat', 'goya', 'chocolate', 'snickers']);
  f('pk-icecream', 'Ice cream', '', 'packaged', [66, 137, 2.3, 15.6, 7.3], [['1 scoop', 1], ['1 cup', 2]], 'ref', ['selecta', 'magnolia', 'ice cream']);

  /* ── fruit ──────────────────────────────────────────────────────────── */
  f('banana', 'Banana', '', 'fruit', [118, 105, 1.3, 27, 0.4], [['1 medium', 1], ['1 small', 0.75]], 'ref', ['saging', 'lakatan', 'latundan', 'banana']);
  f('saba', 'Saba banana (boiled)', '', 'fruit', [90, null, 1, 28, 0.3], one('1 pc'), 'est', ['saba', 'nilagang saging', 'plantain']);
  f('mango', 'Mango (ripe)', '', 'fruit', [100, 60, 0.8, 15, 0.4], [['1 cheek', 1], ['1 whole', 2]], 'ref', ['mangga', 'manga', 'carabao mango']);
  f('apple', 'Apple', '', 'fruit', [182, 95, 0.5, 25, 0.3], one('1 medium'), 'ref', ['mansanas', 'apple']);
  f('papaya', 'Papaya', '', 'fruit', [145, 62, 0.7, 15.7, 0.4], one('1 cup'), 'ref', ['papaya', 'kapaya']);
  f('pineapple', 'Pineapple', '', 'fruit', [165, 82, 0.9, 21.6, 0.2], one('1 cup'), 'ref', ['pinya', 'pineapple']);
  f('watermelon', 'Watermelon', '', 'fruit', [152, 46, 0.9, 11.5, 0.2], [['1 cup', 1], ['1 slice', 2]], 'ref', ['pakwan', 'watermelon']);
  f('orange', 'Orange', '', 'fruit', [131, 62, 1.2, 15.4, 0.2], one('1 medium'), 'ref', ['dalandan', 'ponkan', 'dalanghita', 'orange']);
  f('avocado', 'Avocado', '', 'fruit', [100, 160, 2, 8.5, 14.7], [['½ fruit', 1], ['1 whole', 2]], 'ref', ['abokado', 'avocado']);
  f('camote', 'Sweet potato (boiled)', '', 'fruit', [151, 115, 2.1, 26.8, 0.2], one('1 medium'), 'ref', ['kamote', 'camote', 'sweet potato']);

  /* ── extras ─────────────────────────────────────────────────────────── */
  f('oil', 'Cooking oil', '', 'extras', [13.6, 120, 0, 0, 13.6], [['1 tbsp', 1], ['1 tsp', 1 / 3]], 'ref', ['mantika', 'oil', 'cooking oil']);
  f('sugar', 'Sugar', '', 'extras', [4.2, 16, 0, 4.2, 0], [['1 tsp', 1], ['1 tbsp', 3]], 'ref', ['asukal', 'sugar']);
  f('mayo', 'Mayonnaise', '', 'extras', [13.8, 94, 0.1, 0.1, 10.3], [['1 tbsp', 1]], 'ref', ['mayo', 'lady’s choice', 'mayonnaise']);
  f('ketchup', 'Banana ketchup', '', 'extras', [17, null, 0, 5, 0], [['1 tbsp', 1]], 'est', ['ufc', 'jufran', 'ketchup']);
  f('bagoong', 'Bagoong', '', 'extras', [18, null, 2, 5, 1.5], [['1 tbsp', 1]], 'est', ['shrimp paste', 'alamang', 'bagoong']);
  f('gata', 'Coconut milk', '', 'extras', [60, null, 1.4, 2, 14], [['¼ cup', 1]], 'est', ['gata', 'kakang gata', 'coconut milk']);
  f('whey', 'Protein shake', '', 'extras', [30, null, 24, 3, 1.5], [['1 scoop', 1], ['2 scoops', 2]], 'est', ['whey', 'protein powder', 'protein shake'], { note: 'With water. Check your tub’s label.' });

  /* ── everyday foods the first list missed ──────────────────────────
     Added 2026-09-15 so the beta's first "not found" complaints are about
     rarer food. All estimates, except oatmeal, a plain reference food.    */
  f('galunggong', 'Fried galunggong', '', 'ulam', [80, null, 16, 0, 8], [['1 fish', 1], ['2 fish', 2]], 'est', ['galunggong', 'gg', 'round scad', 'pritong isda', 'fried fish']);
  f('tinapa', 'Tinapa', '', 'ulam', [60, null, 14, 0, 5], [['1 fish', 1], ['2 fish', 2]], 'est', ['tinapa', 'smoked fish']);
  f('ginataang-gulay', 'Ginataang gulay', '', 'ulam', [200, null, 5, 16, 18], cup, 'est', ['ginataan', 'ginataang kalabasa', 'ginataang sitaw', 'gata']);
  f('paksiw-isda', 'Paksiw na isda', '', 'ulam', [200, null, 26, 4, 8], cup, 'est', ['paksiw', 'paksiw na bangus', 'fish paksiw']);
  f('escabeche', 'Escabeche', '', 'ulam', [200, null, 22, 20, 12], cup, 'est', ['escabeche', 'sweet and sour fish']);
  f('sweet-sour-pork', 'Sweet and sour pork', '', 'ulam', [200, null, 18, 30, 20], cup, 'est', ['sweet and sour pork', 'sweet sour pork']);
  f('embutido', 'Embutido', '', 'ulam', [80, null, 10, 6, 14], [['2 slices', 1], ['4 slices', 2]], 'est', ['embotido', 'embutido', 'filipino meatloaf']);
  f('okoy', 'Okoy', '', 'street', [80, null, 6, 18, 12], [['1 pc', 1], ['2 pcs', 2]], 'est', ['ukoy', 'okoy', 'shrimp fritter']);
  f('tokwat-baboy', 'Tokwa’t baboy', '', 'ulam', [200, null, 22, 6, 20], cup, 'est', ['tokwat baboy', 'tokwa baboy', 'tokwa at baboy']);
  f('pancit-malabon', 'Pancit Malabon', '', 'noodles', [300, null, 18, 58, 16], one('1 plate'), 'est', ['malabon', 'pancit malabon']);
  f('oatmeal', 'Oatmeal (cooked)', '', 'basics', [234, 166, 5.9, 28, 3.6], [['1 cup', 1], ['½ cup', 0.5]], 'ref', ['oatmeal', 'oats', 'quaker'], { note: 'Cooked with water, no sugar.' });

  f('pan-de-coco', 'Pan de coco', '', 'bread', [60, null, 4, 32, 7], [['1 pc', 1], ['2 pcs', 2]], 'est', ['pan de coco', 'coconut bread']);
  f('hopia', 'Hopia', '', 'bread', [50, null, 3, 26, 7], [['1 pc', 1], ['2 pcs', 2]], 'est', ['hopia', 'hopia mongo', 'hopia ube', 'hopiang baboy']);
  f('polvoron', 'Polvoron', '', 'street', [20, null, 1.5, 11, 5], [['1 pc', 1], ['3 pcs', 3]], 'est', ['polvoron']);
  f('ube-halaya', 'Ube halaya', '', 'street', [80, null, 2, 40, 6], [['½ cup', 1]], 'est', ['ube jam', 'halayang ube', 'ube halaya']);
  f('buko-pandan', 'Buko pandan', '', 'street', [150, null, 3, 36, 10], one('1 cup'), 'est', ['buko pandan']);
  f('cassava-cake', 'Cassava cake', '', 'street', [100, null, 2, 46, 9], one('1 slice'), 'est', ['cassava cake', 'bibingkang kamoteng kahoy', 'kamoteng kahoy']);
  f('mais-con-yelo', 'Mais con yelo', '', 'street', [300, null, 5, 60, 6], one('1 glass'), 'est', ['mais con yelo', 'corn ice']);
  f('ice-candy', 'Ice candy', '', 'street', [100, null, 1, 22, 1], [['1 pc', 1], ['2 pcs', 2]], 'est', ['ice candy', 'ice pop', 'ice buko']);
  f('cake-slice', 'Cake (1 slice)', '', 'bread', [100, null, 5, 50, 18], one('1 slice'), 'est', ['goldilocks', 'red ribbon', 'chocolate cake', 'black forest', 'mocha cake', 'cake', 'birthday cake']);
  f('budget-burger', 'Budget burger', '', 'fastfood', [90, null, 8, 26, 10], [['1 pc', 1], ['Buy 1 take 1', 2]], 'est', ['minute burger', 'angels burger', 'angel’s burger', 'buy one take one', 'b1t1', 'burger']);

  f('gulaman', 'Sago’t gulaman', '', 'drinks', [350, null, 0, 40, 0], [['1 glass', 1], ['Large', 1.5]], 'est', ['sagot gulaman', 'sago gulaman', 'samalamig', 'palamig', 'gulaman']);
  f('calamansi-juice', 'Calamansi juice', '', 'drinks', [250, null, 0, 26, 0], one('1 glass'), 'est', ['calamansi', 'kalamansi juice', 'calamansi juice']);
  f('energy-drink', 'Energy drink', '', 'drinks', [350, null, 0, 40, 0], one('1 bottle'), 'est', ['cobra', 'sting', 'extra joss', 'red bull', 'energy drink'], { note: PACK });
  f('soy-milk', 'Soy milk', '', 'drinks', [300, null, 7, 24, 5], one('1 bottle'), 'est', ['vitamilk', 'soya', 'soy milk'], { note: PACK });
  f('canned-coffee', 'Canned coffee', '', 'drinks', [240, null, 3, 24, 3], one('1 can'), 'est', ['nescafe can', 'kopiko lucky day', 'bottled coffee', 'canned coffee'], { note: PACK });
  f('pk-cornick', 'Cornick (small pack)', '', 'packaged', [30, null, 2, 18, 7], [['1 small pack', 1], ['1 big pack', 3]], 'est', ['boy bawang', 'cornick', 'corn nuts'], { note: PACK });
  f('pk-cracker-nuts', 'Cracker nuts (small pack)', '', 'packaged', [30, null, 5, 12, 12], [['1 small pack', 1], ['1 big pack', 3]], 'est', ['nagaraya', 'cracker nuts', 'coated peanuts'], { note: PACK });

  const KFC = 'KFC';
  f('kfc-chicken', 'Original Recipe Chicken (1 pc)', KFC, 'fastfood', [120, null, 22, 8, 18], [['1 pc', 1], ['2 pcs', 2]], 'est', ['kfc', 'kentucky', 'fried chicken']);
  f('kfc-gravy', 'Gravy', KFC, 'fastfood', [30, null, 0.5, 3, 1], one('1 cup'), 'est', ['kfc gravy', 'gravy']);
  f('kfc-bowl', 'Famous Bowl', KFC, 'fastfood', [300, null, 20, 60, 28], one('1 bowl'), 'est', ['famous bowl', 'kfc bowl']);
  mix('kfc-c1', 'Chicken with Rice (1 pc)', KFC, 'fastfood', [['kfc-chicken', 1], ['rice', 1], ['kfc-gravy', 1]], one('1 meal'), ['kfc meal', 'kfc chicken rice']);
  const SH = 'Shakey’s';
  /* ── Shakey’s, as Shakey’s Philippines prints it ─────────────────────
     Copied from Shakey’s own nutrition tables, supplied by Tom on
     2026-10-01. A row is [size, calories, protein, fat, carbs, sodium], in
     the table’s own column order, so it can be checked against the table by
     eye. The first size is the food; every other size is that one scaled to
     Shakey’s calories for it, so calories are exact at every size and the
     macros are close. Shakey’s prints grams only for Mojos.
     `odd` marks a food whose printed protein, carbs and fat do not add up to
     its printed calories: Shakey’s own error, usually the fat. The calories
     are kept, because they are the one number the app shows, and the food
     says so on its detail. Beer lists no alcohol, so the calories its carbs
     do not explain are counted as alcohol.                                */
  /* The same shape serves every chain whose own Philippine figures are in
     here: chain(brand, words) makes the adder, and `words` go into every
     food's aka so the brand can be typed the way people say it.          */
  function chain(brand, words) {
    return function (id, name, cat, rows, aka, opts) {
      opts = opts || {};
      const [, kcal, p, fat, c, na] = rows[0];
      // Coke Zero has no calories, so its sizes scale by sodium; plain tea has neither.
      const by = r => kcal ? r[1] / kcal : na ? r[5] / na : 1;
      const o = { na, alc: opts.alc };
      if (opts.odd) o.note = brand + '’s printed protein, carbs and fat add up to about ' + kcalOf(p, c, fat) + ' calories, not ' + kcal + '. The calories here are ' + brand + '’s own.';
      if (opts.alc) o.note = brand + ' lists no alcohol, so the calories its carbs do not explain are counted as alcohol.';
      const food = f(id, name, brand, cat, [opts.g || 0, kcal, p, c, fat], rows.map(r => [r[0], by(r)]), 'pub', words.concat(aka), o);
      if (opts.odd) food.odd = true;
      return food;
    };
  }
  const sk = chain(SH, ['shakeys']);
  sk('sh-pz-cheese-thin', 'Classic Cheese Pizza, Thin Crust', 'fastfood', [['Regular, 1 slice', 133, 5, 7, 10, 214], ['Large, 1 slice', 183, 7, 10, 14, 295], ['Party, 1 slice', 200, 7, 11, 16, 322], ['Regular, whole', 796, 29, 43, 63, 1283], ['Large, whole', 1462, 55, 83, 113, 2361], ['Party, whole', 2398, 88, 128, 189, 3865]], ['cheese pizza', 'classic', 'pizza', 'thin crust', 'thin']);
  sk('sh-pz-cheese-hand', 'Classic Cheese Pizza, Hand-tossed', 'fastfood', [['Regular, 1 slice', 171, 5, 9, 20, 405], ['Large, 1 slice', 224, 7, 13, 26, 532], ['Party, 1 slice', 259, 8, 15, 30, 614], ['Regular, whole', 1025, 33, 54, 119, 2433], ['Large, whole', 1796, 58, 101, 208, 4254], ['Party, whole', 2595, 84, 149, 299, 6143]], ['cheese pizza', 'classic', 'pizza', 'hand tossed', 'handtossed', 'thick crust']);
  sk('sh-pz-cheese-am', 'Classic Cheese Pizza Americana', 'fastfood', [['1 slice', 644, 35, 43, 75, 1566], ['Whole', 3863, 207, 261, 452, 9397]], ['cheese pizza', 'classic', 'pizza', 'americana', 'pizza americana'], { odd: 1 });
  sk('sh-pz-hawaiian-thin', 'Hawaiian Delight Pizza, Thin Crust', 'fastfood', [['Regular, 1 slice', 147, 5, 8, 12, 258], ['Large, 1 slice', 200, 8, 11, 16, 348], ['Party, 1 slice', 215, 8, 11, 18, 375], ['Regular, whole', 880, 33, 45, 74, 1548], ['Large, whole', 1598, 60, 87, 131, 2786], ['Party, whole', 2583, 96, 134, 211, 4502]], ['hawaiian', 'pineapple pizza', 'ham', 'pizza', 'thin crust', 'thin']);
  sk('sh-pz-hawaiian-hand', 'Hawaiian Delight Pizza, Hand-tossed', 'fastfood', [['Regular, 1 slice', 185, 6, 9, 22, 450], ['Large, 1 slice', 241, 8, 13, 28, 585], ['Party, 1 slice', 278, 9, 15, 32, 678], ['Regular, whole', 1109, 36, 57, 131, 2698], ['Large, whole', 1931, 64, 105, 226, 4679], ['Party, whole', 2780, 92, 155, 322, 6780]], ['hawaiian', 'pineapple pizza', 'ham', 'pizza', 'hand tossed', 'handtossed', 'thick crust']);
  sk('sh-pz-hawaiian-am', 'Hawaiian Delight Pizza Americana', 'fastfood', [['1 slice', 728, 38, 46, 86, 1849], ['Whole', 4369, 230, 277, 515, 11096]], ['hawaiian', 'pineapple pizza', 'ham', 'pizza', 'americana', 'pizza americana'], { odd: 1 });
  sk('sh-pz-pepperoni-thin', 'Pepperoni Pizza, Thin Crust', 'fastfood', [['Regular, 1 slice', 148, 6, 8, 11, 281], ['Large, 1 slice', 203, 8, 12, 14, 381], ['Party, 1 slice', 222, 8, 12, 16, 415], ['Regular, whole', 891, 34, 50, 64, 1689], ['Large, whole', 1623, 63, 96, 116, 3051], ['Party, whole', 2659, 102, 149, 193, 4981]], ['peperoni', 'pepperoni pizza', 'pizza', 'thin crust', 'thin']);
  sk('sh-pz-pepperoni-hand', 'Pepperoni Pizza, Hand-tossed', 'fastfood', [['Regular, 1 slice', 187, 6, 10, 20, 473], ['Large, 1 slice', 245, 8, 14, 26, 618], ['Party, 1 slice', 286, 10, 17, 30, 726], ['Regular, whole', 1119, 38, 62, 121, 2839], ['Large, whole', 1957, 67, 114, 210, 4944], ['Party, whole', 2855, 98, 169, 303, 7259]], ['peperoni', 'pepperoni pizza', 'pizza', 'hand tossed', 'handtossed', 'thick crust']);
  sk('sh-pz-pepperoni-am', 'Pepperoni Pizza Americana', 'fastfood', [['1 slice', 698, 37, 48, 76, 1800], ['Whole', 4190, 225, 287, 457, 10798]], ['peperoni', 'pepperoni pizza', 'pizza', 'americana', 'pizza americana'], { odd: 1 });
  sk('sh-pz-garlic-thin', 'Garlic N’ Cheese Pizza, Thin Crust', 'fastfood', [['Regular, 1 slice', 135, 4, 3, 11, 199], ['Large, 1 slice', 186, 7, 10, 15, 295], ['Party, 1 slice', 203, 8, 11, 16, 322], ['Regular, whole', 809, 27, 18, 65, 1196], ['Large, whole', 1488, 56, 83, 118, 2363], ['Party, whole', 2437, 90, 128, 196, 3868]], ['garlic and cheese', 'garlic n cheese', 'garlic cheese pizza', 'pizza', 'thin crust', 'thin'], { odd: 1 });
  sk('sh-pz-garlic-hand', 'Garlic N’ Cheese Pizza, Hand-tossed', 'fastfood', [['Regular, 1 slice', 173, 6, 9, 20, 406], ['Large, 1 slice', 228, 7, 13, 27, 532], ['Party, 1 slice', 263, 9, 15, 31, 615], ['Regular, whole', 1038, 34, 54, 122, 2434], ['Large, whole', 1821, 59, 101, 212, 4256], ['Party, whole', 2633, 86, 149, 307, 6146]], ['garlic and cheese', 'garlic n cheese', 'garlic cheese pizza', 'pizza', 'hand tossed', 'handtossed', 'thick crust']);
  sk('sh-pz-beef-thin', 'Beef N’ Onion Pizza, Thin Crust', 'fastfood', [['Regular, 1 slice', 156, 6, 9, 11, 268], ['Large, 1 slice', 215, 8, 13, 16, 370], ['Party, 1 slice', 236, 9, 14, 17, 406], ['Regular, whole', 933, 36, 52, 68, 1608], ['Large, whole', 1717, 67, 100, 124, 2962], ['Party, whole', 2829, 109, 164, 206, 4871]], ['beef and onion', 'beef n onion', 'beef pizza', 'pizza', 'thin crust', 'thin']);
  sk('sh-pz-beef-hand', 'Beef N’ Onion Pizza, Hand-tossed', 'fastfood', [['Regular, 1 slice', 194, 7, 11, 21, 460], ['Large, 1 slice', 256, 9, 15, 27, 607], ['Party, 1 slice', 303, 11, 18, 32, 715], ['Regular, whole', 1162, 39, 64, 125, 2758], ['Large, whole', 2051, 70, 118, 219, 4855], ['Party, whole', 3025, 105, 185, 317, 7149]], ['beef and onion', 'beef n onion', 'beef pizza', 'pizza', 'hand tossed', 'handtossed', 'thick crust']);
  sk('sh-pz-beef-am', 'Beef N’ Onion Pizza Americana', 'fastfood', [['1 slice', 757, 40, 51, 80, 1833], ['Whole', 4543, 240, 307, 481, 11000]], ['beef and onion', 'beef n onion', 'beef pizza', 'pizza', 'americana', 'pizza americana'], { odd: 1 });
  sk('sh-pz-truffle-thin', 'Truffle Four Cheese Pizza, Thin Crust', 'fastfood', [['Regular, 1 slice', 150, 6, 9, 11, 245], ['Large, 1 slice', 203, 7, 12, 15, 328], ['Party, 1 slice', 223, 8, 13, 17, 358], ['Regular, whole', 901, 33, 52, 65, 1469], ['Large, whole', 1621, 60, 97, 119, 2622], ['Party, whole', 2678, 97, 153, 198, 4301]], ['truffle', 'four cheese', '4 cheese', 'truffle pizza', 'pizza', 'thin crust', 'thin']);
  sk('sh-pz-truffle-hand', 'Truffle Four Cheese Pizza, Hand-tossed', 'fastfood', [['Regular, 1 slice', 187, 6, 11, 20, 434], ['Large, 1 slice', 244, 8, 14, 26, 564], ['Party, 1 slice', 287, 9, 17, 31, 658], ['Regular, whole', 1123, 36, 63, 122, 2606], ['Large, whole', 1955, 63, 115, 211, 4515], ['Party, whole', 2874, 93, 174, 305, 6579]], ['truffle', 'four cheese', '4 cheese', 'truffle pizza', 'pizza', 'hand tossed', 'handtossed', 'thick crust']);
  sk('sh-pz-truffle-am', 'Truffle Four Cheese Pizza Americana', 'fastfood', [['1 slice', 750, 39, 71, 77, 1732], ['Whole', 4500, 236, 427, 460, 10391]], ['truffle', 'four cheese', '4 cheese', 'truffle pizza', 'pizza', 'americana', 'pizza americana'], { odd: 1 });
  sk('sh-chicken-mojos', 'Chicken ’n Mojos', 'fastfood', [['Solo pack', 705, 48, 23, 71, 2234], ['Buddy pack', 983, 78, 32, 90, 2761], ['Family pack', 1301, 109, 43, 114, 3337], ['Party pack', 2642, 194, 92, 248, 6536], ['Blowout pack', 3754, 314, 128, 324, 8644]], ['chicken and mojos', 'chicken n mojos', 'chicken mojos', 'fried chicken', 'mojos']);
  sk('sh-mojos', 'Mojos ’n Dip', 'fastfood', [['1 order (150g)', 555, 8, 36, 51, 777]], ['mojos', 'mojo potatoes', 'mojos n dip', 'mojos and dip', 'potatoes'], { g: 150 });
  sk('sh-mojos-basket', 'Basket of Mojos', 'fastfood', [['1 basket (450g)', 1490, 22, 90, 150, 2022]], ['mojos', 'mojos basket', 'potatoes'], { g: 450 });
  sk('sh-mojos-supreme', 'Mojos Supreme', 'fastfood', [['1 order (600g)', 1887, 29, 109, 199, 2509]], ['mojos', 'potatoes'], { g: 600 });
  sk('sh-skilleti', 'Skilleti', 'fastfood', [['Solo', 733, 31, 15, 108, 1426], ['Platter', 2272, 102, 54, 312, 5263]], ['spaghetti', 'skilletti', 'pasta']);
  sk('sh-carbonara', 'Carbonara Supreme', 'fastfood', [['Solo', 1067, 29, 59, 95, 1860], ['Platter', 2605, 71, 136, 246, 4461]], ['carbonara', 'pasta']);
  sk('sh-lasagna', 'Prima Lasagna', 'fastfood', [['Solo', 812, 34, 66, 88, 1511], ['Platter', 3126, 132, 259, 338, 6039]], ['lasagna', 'lasagne', 'pasta'], { odd: 1 });
  sk('sh-baconcheese', 'Bacon and Cheese Pasta', 'fastfood', [['Solo', 562, 21, 45, 48, 1256], ['Platter', 1775, 69, 155, 159, 3552]], ['bacon cheese pasta', 'pasta'], { odd: 1 });
  sk('sh-aglio', 'Shrimp Aglio Olio', 'fastfood', [['Solo', 874, 27, 45, 85, 897], ['Platter', 2278, 66, 111, 235, 2155]], ['aglio olio', 'aglio e olio', 'shrimp pasta', 'pasta']);
  sk('sh-marinara', 'Seafood Marinara', 'fastfood', [['Solo', 958, 45, 39, 97, 1060], ['Platter', 2000, 99, 78, 215, 2464]], ['marinara', 'seafood pasta', 'pasta']);
  sk('sh-rollups', 'Spinach Rollups', 'fastfood', [['Solo', 409, 16, 49, 50, 551], ['Platter', 1799, 69, 215, 203, 2555]], ['spinach roll ups', 'spinach rolls', 'rollups'], { odd: 1 });
  sk('sh-bol-sk-haw', 'BOL Skilleti and Hawaiian', 'fastfood', [['1 meal', 734, 33, 16, 104, 2265]], ['bunch of lunch', 'bol', 'lunch']);
  sk('sh-bol-sk-pep', 'BOL Skilleti and Pepperoni', 'fastfood', [['1 meal', 735, 33, 17, 103, 2288]], ['bunch of lunch', 'bol', 'lunch']);
  sk('sh-bol-cb-haw', 'BOL Carbonara and Hawaiian', 'fastfood', [['1 meal', 800, 33, 23, 104, 2373]], ['bunch of lunch', 'bol', 'lunch']);
  sk('sh-bol-cb-pep', 'BOL Carbonara and Pepperoni', 'fastfood', [['1 meal', 802, 33, 24, 103, 2397]], ['bunch of lunch', 'bol', 'lunch']);
  sk('sh-bol-chicken-rice', '2 pcs Chicken N’ Rice', 'fastfood', [['1 meal', 446, 31, 8, 58, 1698]], ['chicken rice', 'chicken and rice', 'fried chicken', '2pcs chicken']);
  sk('sh-bol-salad-chicken', 'Salad Chicken N’ Pizza', 'fastfood', [['1 meal', 575, 25, 22, 65, 2117]], ['salad chicken pizza', 'chicken pizza']);
  sk('sh-bol-super', 'Super BOL', 'fastfood', [['1 meal', 810, 30, 28, 98, 2627]], ['bunch of lunch', 'bol', 'lunch']);
  sk('sh-truffle-chicken', 'Chicken Thigh Fillet with Truffle Cream Sauce', 'fastfood', [['1 meal', 916, 31, 62, 90, 1478]], ['truffle chicken', 'chicken thigh', 'truffle cream']);
  sk('sh-parmigiana', 'Chicken Parmigiana', 'fastfood', [['1 meal', 841, 34, 69, 93, 1366]], ['chicken parm', 'parmigiana', 'parmesan chicken'], { odd: 1 });
  sk('sh-garlic-seafood', 'Garlic Buttered Seafood', 'fastfood', [['1 meal', 500, 22, 35, 83, 845]], ['garlic butter seafood', 'seafood rice'], { odd: 1 });
  sk('sh-spicy-seafood', 'Spicy Garlic Seafood', 'fastfood', [['1 meal', 500, 22, 35, 83, 845]], ['spicy seafood', 'seafood rice'], { odd: 1 });
  sk('sh-rice', 'Extra Rice', 'fastfood', [['1 cup', 104, 2, 0, 24, 2]], ['rice', 'kanin', 'extra rice']);
  sk('sh-wings', 'Buffalo Wings', 'fastfood', [['Solo', 810, 43, 47, 23, 2200], ['Buddy', 1443, 84, 79, 39, 3926], ['Family', 2315, 129, 128, 71, 6244]], ['wings', 'chicken wings', 'buffalo'], { odd: 1 });
  sk('sh-mozz', 'Mozzarella Cheese Sticks', 'fastfood', [['8 pcs', 509, 20, 38, 21, 1718]], ['mozzarella sticks', 'cheese sticks', 'mozza']);
  sk('sh-calamari', 'Calamari Crunch', 'fastfood', [['To share', 891, 27, 56, 61, 1767]], ['calamari', 'squid rings', 'pusit']);
  sk('sh-captain', 'Captain’s Choice', 'fastfood', [['To share', 1423, 63, 82, 103, 2027]], ['captains choice', 'fish and chips', 'platter']);
  sk('sh-wings-rings', 'Wings N’ Rings', 'fastfood', [['To share', 1182, 59, 70, 75, 1617]], ['wings and rings', 'wings n rings', 'onion rings', 'wings']);
  sk('sh-tender', 'Tender Crrrunch', 'fastfood', [['Solo', 403, 32, 19, 27, 874], ['Basket', 671, 53, 32, 45, 1455]], ['tender crunch', 'chicken tenders', 'tenders', 'chicken strips']);
  sk('sh-gb-loaf', 'Garlic Bread Loaf', 'fastfood', [['1 pc', 73, 2, 1, 10, 122]], ['garlic bread'], { odd: 1 });
  sk('sh-gb-stick', 'Garlic Bread Stick', 'fastfood', [['1 pc', 102, 2, 1, 15, 174]], ['garlic bread', 'breadstick'], { odd: 1 });
  sk('sh-gb-quarter', 'Garlic Bread 1/4', 'fastfood', [['1 pc', 102, 2, 1, 15, 174]], ['garlic bread', 'quarter'], { odd: 1 });
  sk('sh-gb-cheesy', 'Cheesy Garlic Bread', 'fastfood', [['1 pc', 245, 13, 84, 10, 45]], ['garlic bread', 'cheese garlic bread'], { odd: 1 });
  sk('sh-soup-corn', 'Chicken n’ Corn Soup', 'fastfood', [['Solo side', 80, 6, 2, 7, 529], ['Solo', 136, 11, 3, 13, 899]], ['corn soup', 'chicken corn soup', 'soup']);
  sk('sh-soup-mushroom', 'Creamy Mushroom Soup', 'fastfood', [['Solo side', 194, 3, 13, 19, 640], ['Solo', 309, 6, 27, 29, 1005]], ['mushroom soup', 'soup']);
  sk('sh-soup-tomato', 'Roasted Tomato Soup', 'fastfood', [['Solo side', 79, 6, 13, 15, 423], ['Solo', 131, 10, 63, 25, 704]], ['tomato soup', 'soup'], { odd: 1 });
  sk('sh-salad-side', 'Side Salad', 'fastfood', [['Solo side', 102, 1, 9, 4, 207]], ['salad']);
  sk('sh-salad-caesar', 'Caesar Salad', 'fastfood', [['Solo side', 252, 6, 22, 8, 610], ['Full solo', 352, 9, 30, 11, 851], ['Family', 1036, 26, 90, 31, 2535]], ['caesar', 'salad']);
  sk('sh-salad-tuna', 'Tuna Caesar Salad', 'fastfood', [['Solo side', 232, 5, 21, 7, 509], ['Full solo', 310, 7, 28, 9, 669], ['Family', 926, 19, 83, 27, 2024]], ['tuna salad', 'caesar', 'salad']);
  sk('sh-salad-blt', 'Zesty BLT Salad', 'fastfood', [['Solo side', 194, 5, 13, 14, 332], ['Full solo', 261, 7, 17, 19, 438], ['Family', 760, 20, 52, 53, 1297]], ['blt', 'salad']);
  sk('sh-salad-greek', 'Greek Salad', 'fastfood', [['Solo side', 166, 3, 13, 10, 178], ['Full solo', 228, 6, 17, 13, 340], ['Family', 602, 13, 45, 34, 758]], ['greek', 'salad']);
  sk('sh-sundae-choc', 'Chocolate Sundae', 'fastfood', [['1 glass', 232, 3, 19, 29, 75]], ['sundae', 'ice cream', 'dessert'], { odd: 1 });
  sk('sh-sundae-straw', 'Strawberry Sundae', 'fastfood', [['1 glass', 230, 3, 18, 29, 64]], ['sundae', 'ice cream', 'dessert'], { odd: 1 });
  sk('sh-banana-split', 'Banana Split', 'fastfood', [['1 serving', 736, 12, 58, 91, 147]], ['ice cream', 'dessert'], { odd: 1 });
  sk('sh-banana-peach', 'Banana Peach Surprise', 'fastfood', [['1 serving', 935, 14, 90, 114, 233]], ['ice cream', 'dessert'], { odd: 1 });
  sk('sh-shake-vanilla', 'Vanilla Milkshake', 'drinks', [['1 glass', 621, 13, 32, 72, 259]], ['milkshake', 'shake']);
  sk('sh-shake-straw', 'Strawberry Milkshake', 'drinks', [['1 glass', 564, 12, 31, 58, 185]], ['milkshake', 'shake']);
  sk('sh-shake-choc', 'Chocolate Milkshake', 'drinks', [['1 glass', 645, 14, 91, 83, 255]], ['milkshake', 'shake'], { odd: 1 });
  sk('sh-smores', '6" Choc’O S’mores Pizza', 'fastfood', [['1 pizza', 753, 16, 25, 115, 596]], ['smores', 'chocolate pizza', 'dessert pizza', 'dessert']);
  sk('sh-brownies', 'Seasalt Brownies', 'fastfood', [['1 serving', 449, 6, 22, 61, 458]], ['brownie', 'brownies', 'sea salt brownies', 'dessert']);
  sk('sh-float', 'Rootbeer Float', 'drinks', [['1 glass', 184, 2, 7, 29, 59]], ['root beer float', 'float']);
  sk('sh-iced-tea', 'Houseblend Iced Tea', 'drinks', [['1 glass', 53, 0, 0, 13, 13], ['1 bottle', 180, 0, 0, 43, 45], ['1 pitcher', 240, 0, 0, 58, 60]], ['iced tea', 'house blend', 'tea']);
  sk('sh-lemonade', 'Lemonade', 'drinks', [['1 glass', 20, 0, 0, 5, 74], ['1 bottle', 84, 0, 0, 20, 313], ['1 pitcher', 109, 0, 0, 26, 403]], ['lemonade', 'lemon']);
  sk('sh-coke', 'Coca-Cola', 'drinks', [['1 glass', 101, 0, 0, 25, 12], ['1 can', 135, 0, 0, 34, 16], ['1 pitcher', 586, 0, 0, 147, 70]], ['coca cola', 'coke', 'softdrink', 'soda']);
  sk('sh-coke-zero', 'Coca-Cola Zero', 'drinks', [['1 glass', 0, 0, 0, 0, 15], ['1 can', 0, 0, 0, 0, 20], ['1 pitcher', 0, 0, 0, 0, 87]], ['coke zero', 'zero', 'softdrink', 'soda']);
  sk('sh-sprite', 'Sprite', 'drinks', [['1 glass', 48, 0, 0, 12, 23], ['1 can', 64, 0, 0, 16, 30], ['1 pitcher', 278, 0, 0, 70, 130]], ['sprite', 'softdrink', 'soda']);
  sk('sh-pineapple', 'Pineapple Juice', 'drinks', [['1 glass', 120, 0, 0, 29, 5]], ['pineapple', 'juice']);
  sk('sh-coffee', 'Black Coffee with Sugar and Creamer', 'drinks', [['1 cup', 35, 0, 1, 7, 10]], ['coffee', 'kape']);
  sk('sh-smb-pale', 'San Miguel Pale Pilsen', 'drinks', [['1 can', 132, 0, 0, 10, 7]], ['beer', 'pale pilsen', 'san mig', 'serbesa'], { alc: 13.1 });
  sk('sh-smb-light', 'San Miguel Light', 'drinks', [['1 can', 99, 0, 0, 3, 7]], ['beer', 'san mig light', 'serbesa'], { alc: 12.4 });
  sk('sh-smb-draft', 'San Miguel Draft', 'drinks', [['1 glass', 96, 0, 0, 7, 5]], ['beer', 'draft beer', 'san mig', 'serbesa'], { alc: 9.7 });
  /* ── Army Navy, as its own Nutrition Guide prints it ────────────────
     armynavy.com.ph/nutrition-facts, 91 items, updated 11 December 2025.
     The page's fields are named per 100g but hold the whole item (a Double
     Burger's 738 calories match its own macros), so they are read as one
     item. The 12-piece wings print double the macros their calories allow,
     so each 12-piece is the 6-piece scaled by calories, like every size.  */
  const ARMY = 'Army Navy';
  const anv = chain(ARMY, ['army navy', 'armynavy']);
  anv('av-classic-burger', 'Classic Burger', 'fastfood', [['1 pc', 511, 19, 30, 42, 1067]], []);
  anv('av-double-burger', 'Double Burger', 'fastfood', [['1 pc', 738, 31, 45, 51, 1576]], []);
  anv('av-california-burger-single', 'California Burger Single', 'fastfood', [['1 pc', 707, 31, 44, 47, 1280]], []);
  anv('av-california-burger-double', 'California Burger Double', 'fastfood', [['1 pc', 918, 43, 60, 51, 1930]], []);
  anv('av-beef-birria-taco-consomme', 'Beef Birria Taco & Consomme', 'fastfood', [['1 order', 858, 32, 62, 42, 1598]], []);
  anv('av-beef-birria-naked-burrito-consomme', 'Beef Birria Naked Burrito & Consomme', 'fastfood', [['1 order', 831, 25, 47, 77, 1592]], ['burrito bowl']);
  anv('av-beef-birria-quesadilla-consomme', 'Beef Birria Quesadilla & Consomme', 'fastfood', [['1 order', 819, 30, 63, 33, 1257]], []);
  anv('av-fearless-fried-chicken', 'Fearless Fried Chicken', 'fastfood', [['1 order', 777, 37, 20, 111, 966]], []);
  anv('av-carbonara-pasta', 'Carbonara Pasta', 'fastfood', [['1 order', 560, 21, 20, 73, 787]], []);
  anv('av-pasta-and-meatballs', 'Pasta and Meatballs', 'fastfood', [['1 order', 622, 39, 32, 111, 1487]], [], { odd: 1 });
  anv('av-cheese-quesadilla', 'Cheese Quesadilla', 'fastfood', [['1 order', 356, 46, 54, 68, 1495]], [], { odd: 1 });
  anv('av-chicken-quesadilla', 'Chicken Quesadilla', 'fastfood', [['1 order', 390, 23, 22, 25, 768]], []);
  anv('av-four-cheese-quesadilla', 'Four Cheese Quesadilla', 'fastfood', [['1 order', 431, 20, 24, 33, 620]], []);
  anv('av-steak-quesadilla', 'Steak Quesadilla', 'fastfood', [['1 order', 509, 27, 33, 27, 810]], []);
  anv('av-bacon-cheese-quesadilla', 'Bacon & Cheese Quesadilla', 'fastfood', [['1 order', 604, 32, 36, 37, 1106]], []);
  anv('av-adobo-flakes-naked-burrito', 'Adobo Flakes Naked Burrito', 'fastfood', [['1 order', 493, 19, 26, 45, 973]], ['burrito bowl']);
  anv('av-carnitas-pork-naked-burrito', 'Carnitas Pork Naked Burrito', 'fastfood', [['1 order', 649, 23, 44, 41, 753]], ['burrito bowl']);
  anv('av-chicken-naked-burrito', 'Chicken Naked Burrito', 'fastfood', [['1 order', 528, 23, 26, 51, 1163]], ['burrito bowl']);
  anv('av-sisig-baboy-naked-burrito', 'Sisig Baboy Naked Burrito', 'fastfood', [['1 order', 779, 26, 52, 53, 1816]], ['burrito bowl']);
  anv('av-chorizo-naked-burrito', 'Chorizo Naked Burrito', 'fastfood', [['1 order', 686, 16, 41, 63, 1143]], ['burrito bowl']);
  anv('av-breakfast-bacon', 'Breakfast Bacon', 'fastfood', [['1 order', 475, 17, 27, 41, 548]], []);
  anv('av-breakfast-tapa', 'Breakfast Tapa', 'fastfood', [['1 order', 520, 24, 24, 53, 680]], []);
  anv('av-breakfast-adobo-flakes', 'Breakfast Adobo Flakes', 'fastfood', [['1 order', 496, 26, 19, 56, 869]], []);
  anv('av-breakfast-longganisa', 'Breakfast Longganisa', 'fastfood', [['1 order', 630, 21, 43, 40, 706]], []);
  anv('av-breakfast-hungarian-sausage', 'Breakfast Hungarian Sausage', 'fastfood', [['1 order', 485, 24, 23, 46, 894]], []);
  anv('av-breakfast-tocino', 'Breakfast Tocino', 'fastfood', [['1 order', 464, 22, 14, 62, 853]], []);
  anv('av-breakfast-bangus-tinapa', 'Breakfast Bangus Tinapa', 'fastfood', [['1 order', 1431, 43, 23, 263, 893]], []);
  anv('av-freedom-fries', 'Freedom Fries', 'fastfood', [['1 order', 287, 3, 14, 37, 704]], ['fries']);
  anv('av-clam-chowder', 'Clam Chowder', 'fastfood', [['1 order', 704, 8, 9, 148, 600]], []);
  anv('av-tortilla-soup', 'Tortilla Soup', 'fastfood', [['1 order', 109, 3, 4, 15, 910]], []);
  anv('av-steak-burrito', 'Steak Burrito', 'fastfood', [['1 order', 523, 11, 12, 56, 1141]], [], { odd: 1 });
  anv('av-chicken-burrito', 'Chicken Burrito', 'fastfood', [['1 order', 388, 20, 12, 49, 1291]], []);
  anv('av-carnitas-burrito', 'Carnitas Burrito', 'fastfood', [['1 order', 658, 21, 30, 77, 1180]], []);
  anv('av-adobo-flakes-burrito', 'Adobo Flakes Burrito', 'fastfood', [['1 order', 784, 36, 35, 81, 1900]], []);
  anv('av-p-i-sisig-burrito', 'P.I. Sisig Burrito', 'fastfood', [['1 order', 866, 40, 41, 84, 2240]], []);
  anv('av-vegetable-burrito', 'Vegetable Burrito', 'fastfood', [['1 order', 528, 11, 20, 76, 1186]], []);
  anv('av-breakfast-steak-burrito', 'Breakfast Steak Burrito', 'fastfood', [['1 order', 628, 32, 33, 51, 1102]], []);
  anv('av-breakfast-longganisa-burrito', 'Breakfast Longganisa Burrito', 'fastfood', [['1 order', 710, 24, 46, 50, 1187]], []);
  anv('av-starving-sailor-chicken-sandwich', 'Starving Sailor Chicken Sandwich', 'fastfood', [['1 pc', 483, 32, 15, 56, 1188]], []);
  anv('av-starving-sailor-beef-sandwich', 'Starving Sailor Beef Sandwich', 'fastfood', [['1 pc', 628, 34, 31, 54, 1237]], []);
  anv('av-bully-boy-burger', 'Bully Boy Burger', 'fastfood', [['1 pc', 878, 51, 43, 71, 2407]], []);
  anv('av-classic-chicken-sandwich', 'Classic Chicken Sandwich', 'fastfood', [['1 pc', 1079, 36, 69, 79, 1392]], []);
  anv('av-wasabi-chicken-sandwich', 'Wasabi Chicken Sandwich', 'fastfood', [['1 pc', 1079, 36, 69, 79, 1392]], []);
  anv('av-chipotle-crispy-chicken-sandwich', 'Chipotle Crispy Chicken Sandwich', 'fastfood', [['1 pc', 642, 21, 39, 50, 802]], []);
  anv('av-soft-taco-chicken', 'Soft Taco Chicken', 'fastfood', [['1 pc', 259, 16, 12, 22, 599]], []);
  anv('av-soft-taco-sisig-baboy', 'Soft Taco Sisig Baboy', 'fastfood', [['1 pc', 317, 15, 18, 25, 505]], []);
  anv('av-soft-taco-carnitas-pork', 'Soft Taco Carnitas Pork', 'fastfood', [['1 pc', 403, 16, 25, 28, 334]], []);
  anv('av-soft-taco-steak', 'Soft Taco Steak', 'fastfood', [['1 pc', 298, 17, 14, 25, 675]], []);
  anv('av-classic-pancake', 'Classic Pancake', 'fastfood', [['1 order', 725, 14, 18, 126, 1068]], []);
  anv('av-crunchy-taco', 'Crunchy Taco', 'fastfood', [['1 pc', 445, 14, 28, 35, 1451]], []);
  anv('av-querida-mia-verde', 'Querida Mia Verde', 'fastfood', [['1 order', 656, 31, 42, 39, 1093]], []);
  anv('av-rice-rocket-tortang-talong', 'Rice Rocket Tortang Talong', 'fastfood', [['1 order', 677, 21, 24, 95, 1215]], ['rice meal', 'rice bowl']);
  anv('av-rice-rocket-chicken-katsu', 'Rice Rocket Chicken Katsu', 'fastfood', [['1 order', 796, 25, 35, 96, 1466]], ['rice meal', 'rice bowl']);
  anv('av-rice-rocket-lechon-kawali', 'Rice Rocket Lechon Kawali', 'fastfood', [['1 order', 740, 22, 22, 115, 656]], ['rice meal', 'rice bowl']);
  anv('av-rice-rocket-chicken-la-king', 'Rice Rocket Chicken à la King', 'fastfood', [['1 order', 776, 27, 36, 86, 1211]], ['rice meal', 'rice bowl']);
  anv('av-rice-rocket-pork-bbq', 'Rice Rocket Pork BBQ', 'fastfood', [['1 order', 544, 15, 10, 99, 961]], ['rice meal', 'rice bowl']);
  anv('av-rice-rocket-spam', 'Rice Rocket Spam', 'fastfood', [['1 order', 694, 24, 25, 94, 1277]], ['rice meal', 'rice bowl']);
  anv('av-rice-rocket-sisig', 'Rice Rocket Sisig', 'fastfood', [['1 order', 624, 21, 24, 82, 1223]], ['rice meal', 'rice bowl']);
  anv('av-rice-rocket-tapa', 'Rice Rocket Tapa', 'fastfood', [['1 order', 597, 21, 18, 88, 861]], ['rice meal', 'rice bowl']);
  anv('av-rice-rocket-bangus-belly', 'Rice Rocket Bangus Belly', 'fastfood', [['1 order', 846, 28, 41, 90, 966]], ['rice meal', 'rice bowl']);
  anv('av-rice-rocket-longganisa', 'Rice Rocket Longganisa', 'fastfood', [['1 order', 853, 25, 45, 88, 1033]], ['rice meal', 'rice bowl']);
  anv('av-rice-rocket-bacon', 'Rice Rocket Bacon', 'fastfood', [['1 order', 541, 20, 13, 86, 660]], ['rice meal', 'rice bowl']);
  anv('av-rice-rocket-chicken-fillet', 'Rice Rocket Chicken Fillet', 'fastfood', [['1 order', 662, 25, 26, 82, 977]], ['rice meal', 'rice bowl']);
  anv('av-rice-rocket-tocino', 'Rice Rocket Tocino', 'fastfood', [['1 order', 503, 28, 14, 66, 796]], ['rice meal', 'rice bowl']);
  anv('av-churros', 'Churros', 'fastfood', [['1 order', 453, 8, 32, 33, 156]], []);
  anv('av-onion-rings', 'Onion Rings', 'fastfood', [['1 order', 375, 4, 24, 35, 257]], []);
  anv('av-curly-fries', 'Curly Fries', 'fastfood', [['1 order', 323, 3, 18, 37, 696]], ['fries']);
  anv('av-nachos', 'Nachos', 'fastfood', [['1 order', 589, 9, 34, 62, 1086]], []);
  anv('av-tortilla-chips', 'Tortilla Chips', 'fastfood', [['1 order', 239, 3, 14, 26, 221]], []);
  anv('av-pb-classic-burger', 'Plant-based Classic Burger', 'fastfood', [['1 pc', 561, 17, 29, 58, 711]], ['pb', 'vegan', 'plant based']);
  anv('av-pb-double-burger', 'Plant-based Double Burger', 'fastfood', [['1 pc', 696, 19, 33, 81, 954]], ['pb', 'vegan', 'plant based']);
  anv('av-pb-bully-boy-burger', 'Plant-based Bully Boy Burger', 'fastfood', [['1 pc', 1033, 46, 62, 72, 1680]], ['pb', 'vegan', 'plant based']);
  anv('av-pb-quesadilla', 'Plant-based Quesadilla', 'fastfood', [['1 order', 496, 22, 28, 40, 906]], ['pb', 'vegan', 'plant based']);
  anv('av-pb-burrito', 'Plant-based Burrito', 'fastfood', [['1 order', 645, 18, 34, 66, 1096]], ['pb', 'vegan', 'plant based']);
  anv('av-pb-breakfast-burrito', 'Plant-based Breakfast Burrito', 'fastfood', [['1 order', 737, 26, 47, 53, 943]], ['pb', 'vegan', 'plant based']);
  anv('av-pb-naked-burrito', 'Plant-based Naked Burrito', 'fastfood', [['1 order', 622, 16, 34, 63, 1227]], ['burrito bowl', 'pb', 'vegan', 'plant based']);
  anv('av-pb-soft-taco', 'Plant-based Soft Taco', 'fastfood', [['1 pc', 902, 29, 50, 84, 1391]], ['pb', 'vegan', 'plant based']);
  anv('av-spam-egg-sandwich', 'Spam & Egg Sandwich', 'fastfood', [['1 pc', 587, 18, 37, 45, 908]], []);
  anv('av-sausage-egg-burrito', 'Sausage & Egg Burrito', 'fastfood', [['1 order', 388, 17, 21, 32, 1175]], []);
  anv('av-wings-classic-buffalo', 'Wright Wings Classic Buffalo', 'fastfood', [['6 pcs', 869, 53, 52, 47, 1517], ['12 pcs', 1739, 214, 208, 188, 6070]], ['wings', 'chicken wings']);
  anv('av-wings-korean', 'Wright Wings Korean', 'fastfood', [['6 pcs', 986, 57, 63, 47, 1440], ['12 pcs', 1972, 230, 252, 189, 5759]], ['wings', 'chicken wings']);
  anv('av-wings-chipotle-bbq', 'Wright Wings Chipotle BBQ', 'fastfood', [['6 pcs', 1011, 70, 52, 66, 1993]], ['wings', 'chicken wings']);
  anv('av-wings-mango-salsa', 'Wright Wings Mango Salsa', 'fastfood', [['6 pcs', 686, 49, 38, 37, 962], ['12 pcs', 1371, 197, 152, 147, 3849]], ['wings', 'chicken wings']);
  anv('av-wings-honey-mustard', 'Wright Wings Honey Mustard', 'fastfood', [['6 pcs', 1237, 59, 85, 58, 2126], ['12 pcs', 2474, 237, 341, 233, 8502]], ['wings', 'chicken wings']);
  anv('av-wings-orange-chicken', 'Wright Wings Orange Chicken', 'fastfood', [['6 pcs', 1180, 63, 73, 68, 1888], ['12 pcs', 2359, 253, 292, 271, 7551]], ['wings', 'chicken wings']);
  anv('av-wings-bacon-cheese', 'Wright Wings Bacon & Cheese', 'fastfood', [['6 pcs', 1362, 82, 85, 67, 1933]], ['wings', 'chicken wings']);

  /* ── Starbucks Philippines, from its own calorie PDF ────────────────
     starbucks.ph/docs/CalorieContentandNutriInfoDatabase.pdf, published for
     Quezon City's calorie rule: 1,097 rows of drink, size, milk and whip.
     One food per drink, Grande first, built the way it comes when nothing
     is asked for: whole milk where there is a choice, whip where the drink
     carries it. Drinks only; the PDF has no food.                         */
  const SB = 'Starbucks';
  const sbx = chain(SB, ['starbucks']);
  sbx('sb-brewed-coffee', 'Brewed Coffee', 'drinks', [['Grande', 3, 1, 0, 0, 10], ['Tall', 3, 1, 0, 0, 8], ['Venti', 4, 1, 0, 0, 12]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-cold-brew', 'Cold Brew', 'drinks', [['Grande', 1, 0, 0, 0, 13], ['Tall', 1, 0, 0, 0, 10], ['Venti', 1, 0, 0, 0, 16]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-cold-brew-with-salted-foam', 'Cold Brew with Salted Foam', 'drinks', [['Grande', 112, 1, 6, 14, 121], ['Tall', 90, 1, 5, 11, 100], ['Venti', 127, 1, 6, 17, 134]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-espresso', 'Espresso', 'drinks', [['Solo', 4, 0, 0, 1, 0], ['Doppio', 9, 1, 0, 2, 1]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-blonde-espresso', 'Blonde Espresso', 'drinks', [['Solo', 4, 0, 0, 1, 0], ['Doppio', 9, 1, 0, 2, 1]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-espresso-macchiato', 'Espresso Macchiato', 'drinks', [['Solo', 7, 0, 0, 1, 2], ['Doppio', 11, 1, 0, 2, 2]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-espresso-con-panna', 'Espresso Con Panna', 'drinks', [['Solo', 30, 1, 2, 2, 2], ['Doppio', 34, 1, 2, 2, 3]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-americano', 'Americano', 'drinks', [['Grande', 13, 1, 0, 2, 13], ['Tall', 9, 1, 0, 2, 10], ['Venti', 17, 1, 0, 3, 16]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-iced-americano', 'Iced Americano', 'drinks', [['Grande', 13, 1, 0, 2, 15], ['Tall', 9, 1, 0, 1, 12], ['Venti', 17, 1, 0, 3, 18]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-caffe-latte', 'Caffe Latte', 'drinks', [['Grande', 218, 11, 11, 18, 148], ['Tall', 149, 8, 8, 12, 102], ['Venti', 277, 14, 14, 23, 189]], ['sbux', 'starbs', 'coffee', 'latte']);
  sbx('sb-iced-caffe-latte', 'Iced Caffe Latte', 'drinks', [['Grande', 185, 10, 9, 15, 131], ['Tall', 134, 7, 7, 11, 96], ['Venti', 204, 11, 10, 17, 146]], ['sbux', 'starbs', 'coffee', 'latte']);
  sbx('sb-cappuccino', 'Cappuccino', 'drinks', [['Grande', 159, 8, 8, 13, 107], ['Tall', 118, 6, 6, 10, 80], ['Venti', 240, 13, 12, 20, 164]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-iced-cappuccino', 'Iced Cappuccino', 'drinks', [['Grande', 165, 9, 8, 14, 114], ['Tall', 118, 6, 6, 10, 84], ['Venti', 193, 10, 10, 16, 135]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-flat-white', 'Flat White', 'drinks', [['Grande', 216, 11, 11, 18, 145], ['Tall', 145, 8, 7, 12, 98], ['Venti', 274, 14, 14, 23, 186]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-iced-flat-white', 'Iced Flat White', 'drinks', [['Grande', 154, 8, 8, 13, 108], ['Tall', 114, 6, 6, 10, 81], ['Venti', 165, 9, 8, 14, 115]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-cold-foam-iced-espresso', 'Cold Foam Iced Espresso', 'drinks', [['Grande', 89, 6, 0, 16, 70], ['Tall', 80, 6, 0, 14, 69], ['Venti', 102, 6, 0, 19, 72]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-vanilla-sweet-cream-cold-brew', 'Vanilla Sweet Cream Cold Brew', 'drinks', [['Grande', 121, 1, 7, 14, 24], ['Tall', 91, 1, 5, 11, 18], ['Venti', 153, 1, 8, 18, 29]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-vanilla-sweet-cream-cold-brew-nitro', 'Vanilla Sweet Cream Cold Brew (Nitro)', 'drinks', [['Grande', 121, 1, 7, 14, 24], ['Tall', 91, 1, 5, 11, 18], ['Venti', 153, 1, 8, 18, 29]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-caramel-macchiato', 'Caramel Macchiato', 'drinks', [['Grande', 287, 11, 11, 35, 152], ['Tall', 200, 7, 8, 24, 107], ['Venti', 359, 14, 14, 44, 191]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-iced-caramel-macchiato', 'Iced Caramel Macchiato', 'drinks', [['Grande', 254, 9, 10, 33, 134], ['Tall', 189, 7, 7, 24, 102], ['Venti', 286, 10, 10, 39, 146]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-nitro-cold-brew', 'Nitro Cold Brew', 'drinks', [['Grande', 1, 0, 0, 0, 10], ['Tall', 1, 0, 0, 0, 8], ['Venti', 2, 0, 0, 0, 15]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-nitro-cold-brew-vanilla-sweet-cream', 'Nitro Cold Brew with Vanilla Sweet Cream', 'drinks', [['Grande', 122, 1, 7, 14, 22], ['Tall', 92, 1, 5, 11, 17], ['Venti', 153, 1, 8, 18, 28]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-caffe-mocha', 'Caffe Mocha', 'drinks', [['Grande', 379, 13, 19, 39, 138], ['Tall', 280, 9, 14, 28, 97], ['Venti', 460, 17, 22, 49, 175]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-iced-caffe-mocha', 'Iced Caffe Mocha', 'drinks', [['Grande', 352, 10, 19, 35, 99], ['Tall', 262, 8, 14, 26, 77], ['Venti', 391, 11, 20, 41, 108]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-white-chocolate-mocha', 'White Chocolate Mocha', 'drinks', [['Grande', 487, 13, 21, 62, 301], ['Tall', 361, 10, 16, 45, 219], ['Venti', 595, 17, 24, 77, 379]], ['sbux', 'starbs']);
  sbx('sb-iced-white-chocolate-mocha', 'Iced White Chocolate Mocha', 'drinks', [['Grande', 460, 10, 21, 58, 262], ['Tall', 343, 8, 16, 43, 199], ['Venti', 526, 11, 23, 69, 312]], ['sbux', 'starbs']);
  sbx('sb-iced-brown-sugar-soymilk-shaken-espr', 'Iced Brown Sugar Soymilk Shaken Espresso', 'drinks', [['Grande', 127, 4, 2, 24, 154], ['Tall', 97, 3, 1, 18, 119], ['Venti', 170, 5, 3, 31, 207]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-honey-ruby-grapefruit-cold-brew', 'Honey Ruby Grapefruit Cold Brew', 'drinks', [['Grande', 286, 1, 0, 70, 21], ['Tall', 211, 0, 0, 51, 15], ['Venti', 346, 1, 0, 84, 26]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-hazelnut-mocha-macchiato', 'Hazelnut Mocha Macchiato', 'drinks', [['Grande', 276, 11, 11, 33, 175], ['Tall', 190, 7, 72, 23, 137], ['Venti', 349, 14, 14, 42, 223]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-salted-caramel-soymilk-iced-shaken-e', 'Salted Caramel Soymilk Iced Shaken Espresso', 'drinks', [['Grande', 86, 6, 3, 9, 236], ['Tall', 72, 6, 3, 8, 181], ['Venti', 103, 6, 3, 11, 311]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-dark-caramel-cold-foam-nitro-cold-br', 'Dark Caramel Cold Foam Nitro Cold Brew', 'drinks', [['Grande', 28, 3, 0, 5, 33], ['Tall', 49, 3, 0, 5, 28], ['Venti', 34, 4, 0, 6, 40]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-pressed-coffee', 'Pressed Coffee', 'drinks', [['16 oz', 5, 0, 0, 0, 5], ['32 oz', 5, 0, 0, 0, 5]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-caramel-creme-frappuccino', 'Caramel Crème Frappuccino', 'drinks', [['Grande', 339, 5, 16, 44, 240], ['Tall', 250, 4, 12, 32, 174], ['Venti', 389, 6, 17, 54, 296]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-chai-creme-frappuccino', 'Chai Crème Frappuccino', 'drinks', [['Grande', 346, 5, 15, 47, 222], ['Tall', 241, 4, 11, 31, 161], ['Venti', 379, 6, 16, 54, 271]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-chocolate-chip-creme-frappuccino', 'Chocolate Chip Crème Frappuccino', 'drinks', [['Grande', 426, 7, 21, 53, 258], ['Tall', 297, 5, 15, 36, 176], ['Venti', 500, 9, 23, 66, 318]], ['sbux', 'starbs', 'frap', 'frappe']);
  sbx('sb-pure-matcha-creme-frappuccino', 'Pure Matcha Crème Frappuccino', 'drinks', [['Grande', 344, 6, 15, 45, 221], ['Tall', 244, 5, 11, 31, 155], ['Venti', 394, 7, 16, 55, 269]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe', 'green tea']);
  sbx('sb-strawberry-cream-frappuccino', 'Strawberry Cream Frappuccino', 'drinks', [['Grande', 370, 5, 15, 54, 202], ['Tall', 268, 4, 11, 39, 147], ['Venti', 448, 6, 16, 71, 261]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-vanilla-creme-frappuccino', 'Vanilla Crème Frappuccino', 'drinks', [['Grande', 320, 5, 15, 41, 231], ['Tall', 232, 4, 11, 29, 167], ['Venti', 371, 6, 16, 51, 289]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-white-chocolate-creme-frappuccino', 'White Chocolate Crème Frappuccino', 'drinks', [['Grande', 392, 6, 17, 53, 301], ['Tall', 267, 5, 12, 35, 204], ['Venti', 436, 7, 18, 62, 360]], ['sbux', 'starbs', 'frap', 'frappe']);
  sbx('sb-coffee-frappuccino', 'Coffee Frappuccino', 'drinks', [['Grande', 218, 3, 3, 44, 217], ['Tall', 162, 3, 3, 32, 159], ['Venti', 281, 4, 4, 58, 282]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-espresso-frappuccino', 'Espresso Frappuccino', 'drinks', [['Grande', 210, 3, 3, 44, 209], ['Tall', 144, 2, 2, 30, 142], ['Venti', 258, 3, 3, 55, 259]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-caramel-coffee-frappuccino', 'Caramel Coffee Frappuccino', 'drinks', [['Grande', 384, 4, 15, 58, 243], ['Tall', 281, 3, 11, 42, 176], ['Venti', 438, 5, 15, 71, 292]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-java-chip-frappuccino', 'Java Chip Frappuccino', 'drinks', [['Grande', 439, 6, 19, 62, 235], ['Tall', 314, 5, 14, 44, 167], ['Venti', 514, 7, 20, 77, 287]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-mocha-frappuccino', 'Mocha Frappuccino', 'drinks', [['Grande', 379, 5, 15, 56, 234], ['Tall', 268, 4, 11, 38, 164], ['Venti', 427, 6, 15, 66, 276]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-white-chocolate-mocha-frappuccino', 'White Chocolate Mocha Frappuccino', 'drinks', [['Grande', 416, 5, 16, 64, 287], ['Tall', 304, 4, 12, 46, 213], ['Venti', 483, 6, 16, 78, 355]], ['sbux', 'starbs', 'frap', 'frappe']);
  sbx('sb-dark-mocha-frappuccino', 'Dark Mocha Frappuccino', 'drinks', [['Grande', 470, 7, 20, 66, 300], ['Tall', 318, 5, 14, 43, 199], ['Venti', 528, 8, 20, 79, 355]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-caramel-coffee-jelly-frappuccino', 'Caramel Coffee Jelly Frappuccino', 'drinks', [['Grande', 546, 6, 16, 112, 289], ['Tall', 399, 5, 12, 75, 198], ['Venti', 548, 7, 17, 147, 374]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-dark-caramel-frappuccino', 'Dark Caramel Frappuccino', 'drinks', [['Grande', 616, 9, 38, 65, 691], ['Tall', 532, 7, 33, 49, 567], ['Venti', 796, 10, 48, 80, 899]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-triple-mocha-frappuccino', 'Triple Mocha Frappuccino', 'drinks', [['Grande', 627, 8, 36, 88, 652], ['Tall', 529, 7, 32, 63, 529], ['Venti', 799, 10, 45, 112, 835]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-coffee-jelly-frappuccino', 'Coffee Jelly Frappuccino', 'drinks', [['Grande', 521, 6, 16, 105, 129], ['Tall', 381, 5, 12, 71, 100], ['Venti', 523, 7, 17, 138, 152]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-chocolate-cream-frappuccino', 'Chocolate Cream Frappuccino', 'drinks', [['Grande', 328, 7, 17, 48, 325], ['Tall', 252, 5, 12, 33, 223], ['Venti', 385, 8, 18, 61, 422]], ['sbux', 'starbs', 'frap', 'frappe']);
  sbx('sb-triple-mocha-cream-frappuccino', 'Triple Mocha Cream Frappuccino', 'drinks', [['Grande', 588, 10, 38, 71, 764], ['Tall', 530, 9, 34, 55, 620], ['Venti', 742, 12, 48, 90, 976]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-dark-caramel-cream-frappuccino', 'Dark Caramel Cream Frappuccino', 'drinks', [['Grande', 562, 9, 38, 65, 794], ['Tall', 492, 7, 33, 49, 629], ['Venti', 700, 10, 48, 80, 1006]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-matcha-and-espresso-fusion', 'Matcha & Espresso Fusion', 'drinks', [['Grande', 315, 13, 12, 40, 148], ['Tall', 214, 9, 8, 27, 102], ['Venti', 406, 16, 15, 53, 189]], ['sbux', 'starbs', 'coffee', 'green tea']);
  sbx('sb-iced-matcha-and-espresso-fusion', 'Iced Matcha & Espresso Fusion', 'drinks', [['Grande', 155, 4, 3, 28, 46], ['Tall', 118, 4, 3, 20, 42], ['Venti', 202, 5, 4, 37, 59]], ['sbux', 'starbs', 'coffee', 'green tea']);
  sbx('sb-pure-matcha-latte', 'Pure Matcha Latte', 'drinks', [['Grande', 288, 13, 12, 32, 157], ['Tall', 193, 9, 8, 21, 105], ['Venti', 366, 16, 15, 41, 197]], ['sbux', 'starbs', 'coffee', 'latte', 'green tea']);
  sbx('sb-iced-pure-matcha-latte', 'Iced Pure Matcha Latte', 'drinks', [['Grande', 206, 9, 8, 26, 106], ['Tall', 146, 6, 6, 18, 77], ['Venti', 252, 11, 9, 32, 124]], ['sbux', 'starbs', 'coffee', 'latte', 'green tea']);
  sbx('sb-english-breakfast-tea-latte', 'English Breakfast Tea Latte', 'drinks', [['Grande', 174, 5, 5, 26, 70], ['Tall', 130, 4, 4, 20, 53], ['Venti', 226, 7, 7, 34, 94]], ['sbux', 'starbs', 'latte']);
  sbx('sb-chai-tea-latte', 'Chai Tea Latte', 'drinks', [['Grande', 236, 6, 5, 42, 80], ['Tall', 177, 4, 4, 31, 60], ['Venti', 303, 7, 7, 53, 105]], ['sbux', 'starbs', 'latte']);
  sbx('sb-iced-chai-tea-latte', 'Iced Chai Tea Latte', 'drinks', [['Grande', 266, 7, 7, 44, 102], ['Tall', 196, 5, 5, 33, 75], ['Venti', 307, 8, 7, 53, 110]], ['sbux', 'starbs', 'latte']);
  sbx('sb-black-tea-with-ruby-grapefruit-and-h', 'Black Tea with Ruby Grapefruit & Honey', 'drinks', [['Grande', 195, 1, 0, 47, 10], ['Tall', 134, 1, 0, 32, 7], ['Venti', 256, 1, 0, 62, 14]], ['sbux', 'starbs']);
  sbx('sb-iced-shaken-black-tea-with-ruby-grap', 'Iced Shaken Black Tea with Ruby Grapefruit & Honey', 'drinks', [['Grande', 176, 0, 0, 43, 20], ['Tall', 117, 0, 0, 29, 14], ['Venti', 235, 0, 0, 58, 25]], ['sbux', 'starbs']);
  sbx('sb-iced-hibiscus-tea-with-pomegranate-p', 'Iced Hibiscus Tea with Pomegranate Pearls', 'drinks', [['Grande', 115, 0, 0, 28, 38], ['Tall', 77, 0, 0, 19, 26], ['Venti', 152, 0, 0, 37, 49]], ['sbux', 'starbs']);
  sbx('sb-iced-shaken-tea-lemonade-green-tea', 'Iced Shaken Tea Lemonade, Green Tea', 'drinks', [['Grande', 47, 0, 0, 27, 8], ['Tall', 32, 0, 0, 19, 6], ['Venti', 63, 0, 0, 34, 10]], ['sbux', 'starbs'], { odd: 1 });
  sbx('sb-iced-shaken-tea-lemonade-black-tea', 'Iced Shaken Tea Lemonade, Black Tea', 'drinks', [['Grande', 47, 0, 0, 27, 8], ['Tall', 32, 0, 0, 19, 6], ['Venti', 63, 0, 0, 34, 10]], ['sbux', 'starbs'], { odd: 1 });
  sbx('sb-iced-shaken-tea-lemonade-passion-tea', 'Iced Shaken Tea Lemonade, Passion Tea', 'drinks', [['Grande', 47, 0, 0, 27, 8], ['Tall', 32, 0, 0, 19, 6], ['Venti', 63, 0, 0, 35, 10]], ['sbux', 'starbs'], { odd: 1 });
  sbx('sb-iced-black-tea-latte', 'Iced Black Tea Latte', 'drinks', [['Grande', 115, 2, 2, 22, 36], ['Tall', 86, 2, 2, 16, 27], ['Venti', 129, 2, 2, 26, 35]], ['sbux', 'starbs', 'latte']);
  sbx('sb-iced-vanilla-cold-foam-coffee-jelly', 'Iced Vanilla Cold Foam Coffee Jelly Black Tea', 'drinks', [['Grande', 772, 11, 66, 33, 76], ['Tall', 766, 11, 66, 31, 67], ['Venti', 1046, 15, 90, 44, 100]], ['sbux', 'starbs']);
  sbx('sb-brewed-tea', 'Brewed Tea', 'drinks', [['Grande', 0, 0, 0, 1, 0], ['Tall', 0, 0, 0, 1, 0], ['Venti', 0, 0, 0, 1, 0]], ['sbux', 'starbs']);
  sbx('sb-reserve-espresso', 'Reserve Espresso', 'drinks', [['Doppio', 7, 0, 0, 1, 0]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-reserve-americano', 'Reserve Americano', 'drinks', [['Grande', 14, 1, 0, 2, 13], ['Tall', 7, 0, 0, 1, 10], ['Venti', 14, 1, 0, 2, 16]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-reserve-iced-americano', 'Reserve Iced Americano', 'drinks', [['Grande', 14, 1, 0, 2, 13], ['Tall', 7, 0, 0, 1, 10], ['Venti', 14, 1, 0, 2, 16]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-reserve-cappuccino', 'Reserve Cappuccino', 'drinks', [['Grande', 161, 8, 8, 13, 109], ['Tall', 116, 6, 6, 10, 77], ['Venti', 234, 12, 12, 20, 156]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-reserve-latte', 'Reserve Latte', 'drinks', [['Grande', 221, 12, 11, 18, 151], ['Tall', 145, 8, 7, 12, 98], ['Venti', 268, 14, 14, 22, 180]], ['sbux', 'starbs', 'coffee', 'latte']);
  sbx('sb-reserve-iced-latte', 'Reserve Iced Latte', 'drinks', [['Grande', 161, 8, 8, 13, 115], ['Tall', 113, 6, 6, 10, 80], ['Venti', 164, 9, 8, 14, 114]], ['sbux', 'starbs', 'coffee', 'latte']);
  sbx('sb-reserve-vanilla-bean-latte', 'Reserve Vanilla Bean Latte', 'drinks', [['Grande', 259, 12, 11, 28, 153], ['Tall', 174, 8, 7, 19, 99], ['Venti', 316, 14, 14, 34, 182]], ['sbux', 'starbs', 'coffee', 'latte']);
  sbx('sb-reserve-iced-vanilla-bean-latte', 'Reserve Iced Vanilla Bean Latte', 'drinks', [['Grande', 210, 9, 9, 24, 124], ['Tall', 156, 7, 6, 18, 91], ['Venti', 242, 10, 10, 29, 138]], ['sbux', 'starbs', 'coffee', 'latte']);
  sbx('sb-reserve-dark-chocolate', 'Reserve Dark Chocolate', 'drinks', [['Grande', 363, 14, 15, 44, 151], ['Tall', 252, 9, 10, 32, 98], ['Venti', 446, 17, 18, 55, 181]], ['sbux', 'starbs']);
  sbx('sb-reserve-iced-dark-chocolate', 'Reserve Iced Dark Chocolate', 'drinks', [['Grande', 303, 11, 12, 39, 115], ['Tall', 220, 8, 8, 29, 81], ['Venti', 342, 11, 12, 47, 115]], ['sbux', 'starbs']);
  sbx('sb-reserve-shakerato', 'Reserve Shakerato', 'drinks', [['Doppio', 25, 0, 0, 7, 0]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-reserve-shakerato-bianco-deconstruct', 'Reserve Shakerato Bianco Deconstructed', 'drinks', [['Doppio', 71, 1, 4, 8, 5]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-reserve-shakerato-bianco-over-ice', 'Reserve Shakerato Bianco Over Ice', 'drinks', [['Grande', 267, 3, 23, 12, 34], ['Tall', 248, 3, 21, 11, 29]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-reserve-cortado', 'Reserve Cortado', 'drinks', [['1 cup', 51, 3, 2, 5, 31]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-reserve-cold-brew', 'Reserve Cold Brew', 'drinks', [['Grande', 1, 0, 0, 0, 13], ['Tall', 1, 0, 0, 0, 10], ['Venti', 1, 0, 0, 0, 16]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-reserve-nitro-cold-brew', 'Reserve Nitro Cold Brew', 'drinks', [['Grande', 2, 0, 0, 0, 12], ['Tall', 1, 0, 0, 0, 9]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-reserve-dark-caramel-cold-foam-cold', 'Reserve Dark Caramel Cold Foam Cold Brew', 'drinks', [['Grande', 28, 3, 0, 9, 34], ['Tall', 25, 3, 0, 4, 28], ['Venti', 34, 4, 0, 11, 41]], ['sbux', 'starbs', 'coffee'], { odd: 1 });
  sbx('sb-reserve-vanilla-sweet-cream-cold-bre', 'Reserve Vanilla Sweet Cream Cold Brew', 'drinks', [['Grande', 74, 1, 6, 4, 19], ['Tall', 73, 1, 6, 4, 16], ['Venti', 74, 1, 6, 4, 23]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-reserve-vanilla-sweet-cream-nitro-co', 'Reserve Vanilla Sweet Cream Nitro Cold Brew', 'drinks', [['Grande', 73, 2, 6, 4, 19], ['Tall', 72, 2, 6, 4, 16]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-reserve-dark-caramel-cold-foam-nitro', 'Reserve Dark Caramel Cold Foam Nitro Cold Brew', 'drinks', [['Grande', 29, 2, 0, 5, 33], ['Tall', 26, 2, 0, 4, 28]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-hazelnut-bianco-latte', 'Hazelnut Bianco Latte', 'drinks', [['Grande', 305, 15, 26, 4, 173], ['Tall', 200, 10, 17, 3, 112]], ['sbux', 'starbs', 'coffee', 'latte']);
  sbx('sb-mousse-foam-macchiato', 'Mousse Foam Macchiato', 'drinks', [['Grande', 131, 6, 4, 19, 77]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-classic-affogato', 'Classic Affogato', 'drinks', [['Tall', 210, 3, 12, 22, 54]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-house-affogato', 'House Affogato', 'drinks', [['Tall', 228, 3, 12, 26, 55]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-cold-brew-float', 'Cold Brew Float', 'drinks', [['Tall', 203, 3, 12, 20, 60]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-nitro-cold-brew-float', 'Nitro Cold Brew Float', 'drinks', [['Tall', 203, 3, 12, 20, 60]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-double-chocolate-float', 'Double Chocolate Float', 'drinks', [['Tall', 490, 11, 22, 62, 206]], ['sbux', 'starbs']);
  sbx('sb-cold-brew-malt', 'Cold Brew Malt', 'drinks', [['Tall', 459, 6, 24, 54, 111]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-strawberry-malt', 'Strawberry Malt', 'drinks', [['Tall', 583, 10, 29, 70, 114]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-classic-hot-chocolate', 'Classic Hot Chocolate', 'drinks', [['Grande', 396, 14, 20, 40, 153], ['Tall', 290, 10, 15, 29, 104], ['Venti', 476, 17, 23, 49, 190]], ['sbux', 'starbs']);
  sbx('sb-white-hot-chocolate', 'White Hot Chocolate', 'drinks', [['Grande', 500, 14, 22, 62, 316], ['Tall', 366, 10, 16, 45, 226], ['Venti', 608, 17, 26, 77, 394]], ['sbux', 'starbs']);
  sbx('sb-steamed-milk', 'Steamed Milk', 'drinks', [['Grande', 247, 13, 13, 19, 174], ['Tall', 189, 10, 10, 15, 133], ['Venti', 314, 16, 17, 25, 221]], ['sbux', 'starbs']);
  sbx('sb-pink-drink', 'Pink Drink', 'drinks', [['Grande', 235, 1, 2, 52, 73], ['Tall', 179, 1, 2, 40, 54], ['Venti', 288, 1, 3, 65, 89]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-strawberry-acai-refresher-with-lemon', 'Strawberry Acai Refresher with Lemonade', 'drinks', [['Grande', 144, 1, 0, 34, 9], ['Tall', 111, 1, 0, 26, 7], ['Venti', 176, 1, 0, 41, 11]], ['sbux', 'starbs']);
  sbx('sb-mango-dragonfruit-refresher-with-coc', 'Mango Dragonfruit Refresher with Coconut Milk', 'drinks', [['Grande', 251, 1, 2, 57, 129], ['Tall', 193, 1, 2, 43, 97], ['Venti', 307, 1, 3, 69, 160]], ['sbux', 'starbs']);
  sbx('sb-mango-dragonfruit-with-lemonade-refr', 'Mango Dragonfruit with Lemonade Refresher', 'drinks', [['Grande', 160, 1, 0, 38, 65], ['Tall', 125, 0, 0, 29, 49], ['Venti', 195, 1, 0, 46, 82]], ['sbux', 'starbs']);
  sbx('sb-frozen-pink-drink-with-strawberry-ac', 'Frozen Pink Drink with Strawberry Acai Refresher', 'drinks', [['Grande', 319, 1, 2, 72, 65], ['Tall', 244, 1, 2, 55, 48], ['Venti', 392, 1, 3, 89, 79]], ['sbux', 'starbs']);
  sbx('sb-frozen-strawberry-acai-with-lemonade', 'Frozen Strawberry Acai with Lemonade Refresher', 'drinks', [['Grande', 228, 1, 0, 54, 1], ['Tall', 176, 1, 0, 41, 1], ['Venti', 281, 1, 0, 66, 1]], ['sbux', 'starbs']);
  sbx('sb-frozen-dragon-drink-with-mango-drago', 'Frozen Dragon Drink with Mango Dragonfruit Refresher', 'drinks', [['Grande', 347, 1, 2, 79, 176], ['Tall', 267, 1, 2, 61, 133], ['Venti', 424, 1, 3, 97, 219]], ['sbux', 'starbs']);
  sbx('sb-frozen-mango-dragonfruit-with-lemona', 'Frozen Mango Dragonfruit with Lemonade Refresher', 'drinks', [['Grande', 256, 1, 1, 61, 113], ['Tall', 200, 1, 0, 47, 85], ['Venti', 313, 1, 1, 74, 141]], ['sbux', 'starbs']);
  sbx('sb-signature-hot-chocolate', 'Signature Hot Chocolate', 'drinks', [['Grande', 533, 17, 27, 54, 168], ['Tall', 405, 13, 21, 41, 122], ['Venti', 650, 22, 32, 67, 211]], ['sbux', 'starbs']);
  sbx('sb-signature-iced-chocolate', 'Signature Iced Chocolate', 'drinks', [['Grande', 411, 12, 24, 36, 123], ['Tall', 287, 8, 17, 25, 92], ['Venti', 444, 13, 26, 40, 137]], ['sbux', 'starbs']);
  sbx('sb-chocolate-milk', 'Chocolate Milk', 'drinks', [['Grande', 382, 16, 17, 42, 188], ['Venti', 477, 20, 21, 52, 235]], ['sbux', 'starbs']);
  sbx('sb-peppermint-mocha-frappuccino', 'Peppermint Mocha Frappuccino', 'drinks', [['Grande', 385, 5, 14, 59, 211], ['Tall', 288, 4, 11, 44, 158], ['Venti', 457, 6, 15, 75, 267]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-peppermint-chocolate-cream-frappucci', 'Peppermint Chocolate Cream Frappuccino', 'drinks', [['Grande', 415, 7, 17, 59, 280], ['Tall', 294, 5, 12, 41, 192], ['Venti', 500, 8, 18, 76, 361]], ['sbux', 'starbs', 'frap', 'frappe']);
  sbx('sb-iced-peppermint-mocha-latte', 'Iced Peppermint Mocha Latte', 'drinks', [['Grande', 414, 9, 18, 55, 82], ['Tall', 314, 7, 13, 42, 66], ['Venti', 468, 10, 18, 66, 89]], ['sbux', 'starbs', 'coffee', 'latte']);
  sbx('sb-hot-peppermint-mocha-latte', 'Hot Peppermint Mocha Latte', 'drinks', [['Grande', 453, 13, 18, 60, 130], ['Tall', 339, 9, 14, 45, 92], ['Venti', 550, 16, 21, 74, 166], ['Short', 234, 6, 10, 30, 57]], ['sbux', 'starbs', 'coffee', 'latte']);
  sbx('sb-toffee-nut-coffee-frappuccino', 'Toffee Nut Coffee Frappuccino', 'drinks', [['Grande', 363, 4, 14, 54, 281], ['Tall', 265, 3, 11, 39, 206], ['Venti', 410, 4, 15, 65, 334]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-toffee-nut-creme-frappuccino', 'Toffee Nut Crème Frappuccino', 'drinks', [['Grande', 331, 5, 15, 43, 295], ['Tall', 243, 4, 11, 31, 216], ['Venti', 371, 6, 16, 51, 351]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-iced-toffee-nut-latte', 'Iced Toffee Nut Latte', 'drinks', [['Grande', 327, 8, 18, 34, 246], ['Tall', 247, 6, 13, 26, 192], ['Venti', 361, 8, 18, 40, 292]], ['sbux', 'starbs', 'coffee', 'latte']);
  sbx('sb-hot-toffee-nut-latte', 'Hot Toffee Nut Latte', 'drinks', [['Grande', 360, 11, 18, 39, 290], ['Tall', 266, 8, 13, 28, 213], ['Venti', 433, 14, 20, 48, 361], ['Short', 184, 5, 10, 19, 141]], ['sbux', 'starbs', 'coffee', 'latte']);
  sbx('sb-toffee-nut-crunch-cold-brew', 'Toffee Nut Crunch Cold Brew', 'drinks', [['Grande', 108, 1, 0, 25, 66], ['Tall', 84, 1, 0, 19, 56], ['Venti', 133, 2, 0, 30, 80]], ['sbux', 'starbs', 'coffee']);
  sbx('sb-hazelnut-praline-mille-feuille-oatmi', 'Hazelnut Praline Mille-Feuille Oatmilk Coffee Frappuccino', 'drinks', [['Grande', 500, 3, 22, 73, 327], ['Tall', 367, 2, 16, 53, 238], ['Venti', 585, 3, 23, 92, 408]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-hazelnut-praline-mille-feuille-oatmi-2', 'Hazelnut Praline Mille-Feuille Oatmilk Cream Frappuccino', 'drinks', [['Grande', 447, 3, 23, 58, 315], ['Tall', 333, 2, 17, 43, 232], ['Venti', 520, 3, 24, 72, 395]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  sbx('sb-iced-hazelnut-praline-mille-feuille', 'Iced Hazelnut Praline Mille-Feuille Oatmilk Latte', 'drinks', [['Grande', 379, 4, 20, 47, 215], ['Tall', 289, 3, 15, 37, 170], ['Venti', 417, 4, 21, 54, 247]], ['sbux', 'starbs', 'coffee', 'latte']);
  sbx('sb-hot-hazelnut-praline-mille-feuille-o', 'Hot Hazelnut Praline Mille-Feuille Oatmilk Latte', 'drinks', [['Grande', 388, 4, 18, 52, 239], ['Tall', 303, 3, 14, 40, 186], ['Venti', 483, 6, 22, 65, 308], ['Short', 224, 2, 11, 29, 133]], ['sbux', 'starbs', 'coffee', 'latte']);
  sbx('sb-hot-salted-caramel-oatmilk-latte', 'Hot Salted Caramel Oatmilk Latte', 'drinks', [['Grande', 356, 5, 18, 43, 381], ['Tall', 283, 4, 15, 33, 294], ['Venti', 427, 6, 21, 53, 477]], ['sbux', 'starbs', 'coffee', 'latte']);
  sbx('sb-iced-salted-caramel-oatmilk-latte', 'Iced Salted Caramel Oatmilk Latte', 'drinks', [['Grande', 242, 3, 12, 29, 305], ['Tall', 194, 2, 10, 23, 235], ['Venti', 263, 3, 13, 33, 364]], ['sbux', 'starbs', 'coffee', 'latte']);
  sbx('sb-salted-caramel-oatmilk-frappuccino', 'Salted Caramel Oatmilk Frappuccino', 'drinks', [['Grande', 407, 2, 15, 66, 160], ['Tall', 287, 2, 11, 46, 109], ['Venti', 486, 2, 15, 85, 206]], ['sbux', 'starbs', 'coffee', 'frap', 'frappe']);
  f('pc-fries', 'Flavored Fries', 'Potato Corner', 'fastfood', [120, null, 4, 44, 18], [['Regular', 1], ['Large', 1.6], ['Mega', 2.4]], 'est', ['potato corner', 'flavored fries', 'cheese fries', 'bbq fries']);
  f('mx-chicken', 'Fried Chicken (¼ chicken)', 'Max’s', 'fastfood', [180, null, 40, 4, 26], [['¼ chicken', 1], ['½ chicken', 2], ['Whole', 4]], 'est', ['maxs', 'max restaurant', 'max chicken', 'max fried chicken']);
  f('tt-bento', 'Chicken Teriyaki Bento', 'Tokyo Tokyo', 'fastfood', [350, null, 26, 80, 16], one('1 meal'), 'est', ['tokyo tokyo', 'teriyaki', 'bento', 'beef misono']);

  /* ── lists the app uses ─────────────────────────────────────────────── */

  // Shown before anything is typed, until the person has recents of their own.
  const POPULAR = ['rice', 'jb-c1', 'egg-fried', 'pandesal', 'coffee-3in1', 'softdrink',
    'adobo-chicken', 'sinigang-pork', 'tapsilog', 'pk-canton', 'banana', 'milktea'];

  // The brand chips, in the order a Filipino would look for them.
  const BRANDS = ['Jollibee', 'Mang Inasal', 'McDonald’s', 'Chowking', 'KFC', 'Andok’s',
    'Greenwich', 'Shakey’s', 'Army Navy', 'Starbucks', 'Max’s', 'Potato Corner', 'Tokyo Tokyo', '7-Eleven', 'Lawson', 'Ministop', 'S&R'];

  const CATS = {
    rice: 'Rice and silog', ulam: 'Ulam', noodles: 'Noodles and soup', street: 'Street food and merienda',
    fastfood: 'Fast food', drinks: 'Drinks', packaged: 'Packaged', fruit: 'Fruit',
    bread: 'Bread', basics: 'Eggs, meat and basics', extras: 'Extras and condiments'
  };

  /* ── search, shared by the app and the public calories page ─────────
     Every word typed must start a word somewhere in the name, brand or aka
     list. A name typed exactly wins; an aka typed exactly comes next, because
     the aka list is what people really type; then a name that starts the
     same. A plain food edges out a branded one. `boost` lets the app lift
     foods the person has eaten before.                                    */
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ').replace(/[’'`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const idx = new WeakMap();
  function indexOf(food) {
    let x = idx.get(food);
    if (!x) {
      x = { nameN: norm(food.name), words: norm(food.name + ' ' + (food.brand || '')).split(' '),
        akaN: (food.aka || []).map(norm), akaWords: norm((food.aka || []).join(' ')).split(' ') };
      idx.set(food, x);
    }
    return x;
  }
  function scoreFood(food, q, toks) {
    const x = indexOf(food);
    let s = 0;
    if (x.nameN === q) s += 100; else if (x.nameN.startsWith(q)) s += 50;
    if (x.akaN.includes(q)) s += 70;
    for (const t of toks) {
      if (x.words.includes(t)) s += 30;
      else if (x.words.some(w => w.startsWith(t))) s += 20;
      else if (x.akaWords.includes(t)) s += 15;
      else if (x.akaWords.some(w => w.startsWith(t))) s += 10;
      else return 0;
    }
    return s;
  }
  function search(foods, query, opts) {
    opts = opts || {};
    const q = norm(query), toks = q ? q.split(' ') : [];
    const out = [];
    foods.forEach(food => {
      if (opts.brand && food.brand !== opts.brand) return;
      if (opts.cat && food.cat !== opts.cat) return;
      let s = toks.length ? scoreFood(food, q, toks) : 1;
      if (!s) return;
      if (opts.boost) s += opts.boost(food);
      if (!food.brand) s += 2;
      out.push([s, food]);
    });
    // With nothing typed, the list keeps its written order, which groups like with like.
    if (toks.length) out.sort((a, b) => b[0] - a[0] || a[1].name.length - b[1].name.length);
    return out.map(p => p[1]);
  }

  window.CC_NORM = norm;
  window.CC_SEARCH = search;
  window.CC_FOODS = FOODS;
  window.CC_FOOD = BY_ID;
  window.CC_SRC = SRC;
  window.CC_POPULAR = POPULAR;
  window.CC_BRANDS = BRANDS;
  window.CC_CATS = CATS;
})();
