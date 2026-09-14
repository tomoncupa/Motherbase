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
  const mcAka = (a) => a.concat(['mcdo', 'mcdonalds', 'mcdonald’s']);
  f('mc-chicken', 'Chicken McDo (1 pc)', MC, 'fastfood', [110, null, 22, 10, 18], [['1 pc', 1], ['2 pcs', 2]], 'est', mcAka(['chicken mcdo', 'fried chicken']));
  f('mc-spaghetti', 'McSpaghetti', MC, 'fastfood', [230, null, 12, 48, 10], one('1 regular'), 'est', mcAka(['mcspaghetti', 'spaghetti']));
  f('mc-burger', 'Burger McDo', MC, 'fastfood', [100, null, 11, 30, 10], one('1 pc'), 'est', mcAka(['burger mcdo', 'burger']));
  f('mc-cheeseburger', 'Cheeseburger', MC, 'fastfood', [115, null, 14, 32, 13], one('1 pc'), 'est', mcAka(['cheeseburger']));
  f('mc-bigmac', 'Big Mac', MC, 'fastfood', [215, null, 26, 44, 32], one('1 pc'), 'est', mcAka(['big mac', 'bigmac']));
  f('mc-fries', 'Fries', MC, 'fastfood', [110, null, 4, 42, 16], [['Medium', 1], ['Small', 0.65], ['Large', 1.4]], 'est', mcAka(['fries', 'french fries']));
  f('mc-float', 'Coke McFloat', MC, 'fastfood', [330, null, 3, 44, 4], one('1 regular'), 'est', mcAka(['mcfloat', 'float', 'coke float']));
  f('mc-sundae', 'Hot Fudge Sundae', MC, 'fastfood', [150, null, 6, 48, 9], one('1 cup'), 'est', mcAka(['sundae', 'hot fudge']));
  f('mc-hotcakes', 'Hotcakes (3 pcs)', MC, 'fastfood', [230, null, 9, 90, 14], one('1 order'), 'est', mcAka(['hotcakes', 'pancakes']), { note: 'With the syrup and margarine.' });
  mix('mc-c1', 'Chicken McDo with Rice', MC, 'fastfood', [['mc-chicken', 1], ['rice', 1]], one('1 meal'), mcAka(['chicken mcdo meal', 'chicken with rice']));

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

  /* ── lists the app uses ─────────────────────────────────────────────── */

  // Shown before anything is typed, until the person has recents of their own.
  const POPULAR = ['rice', 'jb-c1', 'egg-fried', 'pandesal', 'coffee-3in1', 'softdrink',
    'adobo-chicken', 'sinigang-pork', 'tapsilog', 'pk-canton', 'banana', 'milktea'];

  // The brand chips, in the order a Filipino would look for them.
  const BRANDS = ['Jollibee', 'Mang Inasal', 'McDonald’s', 'Chowking', 'Andok’s',
    'Greenwich', '7-Eleven', 'Lawson', 'Ministop', 'S&R'];

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
