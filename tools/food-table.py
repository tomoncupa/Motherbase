"""THE FOOD TABLE: KITCHEN's offline list of plain foods, made from the USDA.

    py -3 tools/food-table.py            build kitchen/foodtable-data.js
    py -3 tools/food-table.py --fresh    download the USDA file again first

What it does, in order:

  1. Downloads FoodData Central's SR Legacy file (the USDA's standard
     reference of plain foods, public domain, CC0) into a folder in the
     system's temp directory. Never into the repo: it is 13 MB zipped and
     210 MB open, and only what is kept below is ours to ship.
  2. Drops what nobody in Manila types: baby food, US fast food and
     restaurant chains, American Indian and Alaska Native foods, and any food
     named after a US brand (the USDA writes a brand in capitals: QUAKER,
     KELLOGG'S; a few are written normally and are listed by hand below).
  3. Reads every food's figures per 100 g. The eight every app has (calories,
     protein, carbs, fat, sodium, potassium, calcium, caffeine) are found by
     the USDA's nutrient id, exactly as FOODDEX's lookup finds them
     (portion/index.html, USDA_NUT). Everything else is found exactly as
     shared/nutrients.js's fromUsda finds it: by the USDA's printed name and
     unit, a figure in International Units skipped, folate DFE else total.
     The list is READ OUT OF nutrients.js, so a nutrient added there is in
     the next table without touching this file. A 0 the USDA printed is kept
     as 0; a figure it did not print is left off, never written as 0.
     Every number is rounded the way nutrients.js rounds (three significant
     figures, never a whole number cut), done here with the same decimal
     rounding a browser's toFixed does, so the table and a live lookup agree
     to the last digit.
  4. Checks every Tagalog word and every everyday pick below against the real
     names, and stops if one is missing, so a typo can never send kangkong
     to the wrong food.
  5. Writes kitchen/foodtable-data.js (one global, FoodTableData) and puts a
     short hash of it into kitchen/foodtable.js as STAMP, so the page asks
     for foodtable-data.js?v=<STAMP>: a new table is a new address, and
     sw.js answers a stamped address from the phone's copy.

Prints what it kept, what it dropped and why, and the file's size.
"""
import gzip
import hashlib
import io
import json
import math
import os
import re
import sys
import tempfile
import urllib.request
import zipfile
from decimal import Decimal, ROUND_HALF_UP

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'kitchen', 'foodtable-data.js')
ENGINE = os.path.join(ROOT, 'kitchen', 'foodtable.js')
NUTRIENTS_JS = os.path.join(ROOT, 'shared', 'nutrients.js')

URL = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip'
CACHE = os.path.join(tempfile.gettempdir(), 'mb-foodtable')
SOURCE = 'USDA FoodData Central, SR Legacy (April 2018). Public domain (CC0).'


def fail(msg):
    print('FOOD TABLE: ' + msg)
    sys.exit(1)


# ── what is dropped ───────────────────────────────────────────────────────
DROP_CATS = {
    'Baby Foods': 'baby food',
    'Fast Foods': 'US fast food chains',
    'Restaurant Foods': 'US restaurant chains',
    'American Indian/Alaska Native Foods': 'American Indian and Alaska Native dishes',
}
# A word in capitals is how the USDA writes a brand. These are not brands.
CAPS_OK = {'USDA', "USDA'", 'BBQ', 'NFS', 'NFSMI', 'DHA', 'EMI-TSUNOMATA'}
CAPS = re.compile(r"\b[A-Z][A-Z'&.\-]{2,}\b")
# The brands the USDA wrote in ordinary letters, found by reading every name.
BRANDS = re.compile(r"\b(" + '|'.join([
    'Andrea\'s', 'Archway', 'Brownberry', 'Continental Mills', 'Crunchmaster', 'Gamesa',
    'George Weston', 'Glutino', 'Goldfish', 'Goya', 'Heinz', 'Hormel Pillow', 'Interstate Brands',
    'Kraft', 'Krusteaz', 'La Moderna', 'La Ricura', 'Lean Pockets', 'Little Debbie',
    'Martha White', 'Mary\'s Gone', 'Mckee', 'Mission Foods', 'Monster', 'Muscle Milk',
    'Nabisco', 'Natreon', 'New england brand', 'Oscar Mayer', 'Pepperidge', 'Pillsbury',
    'Powerade', 'Propel', 'Ready Crust', 'Reddi Wip', 'Rudi\'s', 'Sage Valley', 'Schar',
    'Shake N Bake', 'Stove Top', 'Thomas English', 'Udi\'s', 'Van\'s', 'Waffle Crisp',
    'Wonder Hamburger',
]) + r")\b")


def why_dropped(cat, name):
    if cat in DROP_CATS:
        return DROP_CATS[cat]
    if any(w not in CAPS_OK for w in CAPS.findall(name)):
        return 'named after a US brand'
    if BRANDS.search(name):
        return 'named after a US brand'
    return None


# The USDA's own groups, said the way a person would say them.
CAT_NAMES = {
    'Baked Products': 'Bread and baking',
    'Beef Products': 'Beef',
    'Beverages': 'Drinks',
    'Breakfast Cereals': 'Breakfast cereals',
    'Cereal Grains and Pasta': 'Grains, rice and pasta',
    'Dairy and Egg Products': 'Dairy and eggs',
    'Fats and Oils': 'Fats and oils',
    'Finfish and Shellfish Products': 'Fish and seafood',
    'Fruits and Fruit Juices': 'Fruit',
    'Lamb, Veal, and Game Products': 'Lamb, veal and game',
    'Legumes and Legume Products': 'Beans, tofu and peanuts',
    'Meals, Entrees, and Side Dishes': 'Meals and sides',
    'Nut and Seed Products': 'Nuts and seeds',
    'Pork Products': 'Pork',
    'Poultry Products': 'Chicken and poultry',
    'Sausages and Luncheon Meats': 'Sausages and cold cuts',
    'Snacks': 'Snacks',
    'Soups, Sauces, and Gravies': 'Soups and sauces',
    'Spices and Herbs': 'Spices, herbs and condiments',
    'Sweets': 'Sweets and sugar',
    'Vegetables and Vegetable Products': 'Vegetables',
}


def clean_name(d):
    d = d.replace(" (Includes foods for USDA's Food Distribution Program)", '')
    d = re.sub(r'\s*,\s*', ', ', d)
    return re.sub(r'\s+', ' ', d).strip()


# ── Tagalog and Filipino words ────────────────────────────────────────────
# word: (English words it stands for inside a longer search, [the foods it
# means, best first]). Every name is checked against the table below.
# A word with no honest match is not here at all, so it finds nothing:
# galunggong (round scad), kalamansi, lanzones, tulingan, longganisa,
# tocino, tapa, bagoong.
ALIASES = {
    # vegetables
    'kangkong': ('water convolvulus', ['Water convolvulus, raw', 'Water convolvulus, cooked, boiled, drained, without salt']),
    'ampalaya': ('balsam pear', ['Balsam-pear (bitter gourd), pods, raw', 'Balsam-pear (bitter gourd), pods, cooked, boiled, drained, without salt', 'Balsam-pear (bitter gourd), leafy tips, raw']),
    'malunggay': ('drumstick leaves', ['Drumstick leaves, raw', 'Drumstick leaves, cooked, boiled, drained, without salt', 'Drumstick pods, raw']),
    'kamote': ('sweet potato', ['Sweet potato, raw, unprepared', 'Sweet potato, cooked, boiled, without skin', 'Sweet potato leaves, raw']),
    'talbos ng kamote': ('sweet potato leaves', ['Sweet potato leaves, raw', 'Sweet potato leaves, cooked, steamed, without salt']),
    'talong': ('eggplant', ['Eggplant, raw', 'Eggplant, cooked, boiled, drained, without salt']),
    'sitaw': ('yardlong bean', ['Yardlong bean, raw', 'Yardlong bean, cooked, boiled, drained, without salt']),
    'gabi': ('taro', ['Taro, raw', 'Taro, cooked, without salt', 'Taro leaves, raw']),
    'dahon ng gabi': ('taro leaves', ['Taro leaves, raw', 'Taro leaves, cooked, steamed, without salt']),
    'kalabasa': ('pumpkin', ['Pumpkin, raw', 'Pumpkin, cooked, boiled, drained, without salt']),
    'pechay': ('pak choi', ['Cabbage, chinese (pak-choi), raw', 'Cabbage, chinese (pak-choi), cooked, boiled, drained, without salt']),
    'petsay': ('pak choi', ['Cabbage, chinese (pak-choi), raw', 'Cabbage, chinese (pak-choi), cooked, boiled, drained, without salt']),
    'sibuyas': ('onions', ['Onions, raw']),
    'bawang': ('garlic', ['Garlic, raw']),
    'kamatis': ('tomatoes', ['Tomatoes, red, ripe, raw, year round average']),
    'luya': ('ginger', ['Ginger root, raw']),
    'mais': ('corn', ['Corn, sweet, yellow, raw', 'Corn, sweet, yellow, cooked, boiled, drained, without salt']),
    'monggo': ('mung beans', ['Mung beans, mature seeds, raw', 'Mung beans, mature seeds, cooked, boiled, without salt', 'Mung beans, mature seeds, sprouted, raw']),
    'munggo': ('mung beans', ['Mung beans, mature seeds, raw', 'Mung beans, mature seeds, cooked, boiled, without salt', 'Mung beans, mature seeds, sprouted, raw']),
    'togue': ('mung beans sprouted', ['Mung beans, mature seeds, sprouted, raw']),
    'toge': ('mung beans sprouted', ['Mung beans, mature seeds, sprouted, raw']),
    'labanos': ('radishes oriental', ['Radishes, oriental, raw']),
    'repolyo': ('cabbage', ['Cabbage, raw']),
    'sayote': ('chayote', ['Chayote, fruit, raw', 'Chayote, fruit, cooked, boiled, drained, without salt']),
    'upo': ('gourd white flowered', ['Gourd, white-flowered (calabash), raw', 'Gourd, white-flowered (calabash), cooked, boiled, drained, without salt']),
    'patola': ('gourd dishcloth', ['Gourd, dishcloth (towelgourd), raw', 'Gourd, dishcloth (towelgourd), cooked, boiled, drained, without salt']),
    'alugbati': ('vinespinach', ['Vinespinach, (basella), raw']),
    'saluyot': ('jute', ['Jute, potherb, raw', 'Jute, potherb, cooked, boiled, drained, without salt']),
    'singkamas': ('jicama', ['Yambean (jicama), raw']),
    'patatas': ('potatoes', ['Potatoes, flesh and skin, raw']),
    'karot': ('carrots', ['Carrots, raw']),
    'labong': ('bamboo shoots', ['Bamboo shoots, raw']),
    'kabute': ('mushrooms', ['Mushrooms, white, raw', 'Mushrooms, oyster, raw', 'Mushrooms, shiitake, raw']),
    'mustasa': ('mustard greens', ['Mustard greens, raw']),
    'pipino': ('cucumber', ['Cucumber, with peel, raw']),
    'tanglad': ('lemon grass', ['Lemon grass (citronella), raw']),
    'sili': ('peppers hot chili', ['Peppers, hot chili, red, raw', 'Peppers, hot chili, green, raw']),
    'litsugas': ('lettuce', ['Lettuce, green leaf, raw']),
    'ube': ('yam', ['Yam, raw']),
    'balinghoy': ('cassava', ['Cassava, raw']),
    'kamoteng kahoy': ('cassava', ['Cassava, raw']),
    # fruit
    'saging': ('bananas', ['Bananas, raw']),
    'saba': ('plantains', ['Plantains, yellow, raw', 'Plantains, green, raw']),
    'mangga': ('mangos', ['Mangos, raw']),
    'pinya': ('pineapple', ['Pineapple, raw, all varieties']),
    'buko': ('coconut', ['Nuts, coconut water (liquid from coconuts)', 'Nuts, coconut meat, raw']),
    'niyog': ('coconut', ['Nuts, coconut meat, raw', 'Nuts, coconut meat, dried (desiccated), not sweetened']),
    'gata': ('coconut milk', ['Nuts, coconut milk, raw (liquid expressed from grated meat and water)', 'Nuts, coconut milk, canned (liquid expressed from grated meat and water)', 'Nuts, coconut cream, raw (liquid expressed from grated meat)']),
    'kakang gata': ('coconut cream', ['Nuts, coconut cream, raw (liquid expressed from grated meat)']),
    'bayabas': ('guavas', ['Guavas, common, raw']),
    'pakwan': ('watermelon', ['Watermelon, raw']),
    'abokado': ('avocados', ['Avocados, raw, all commercial varieties']),
    'langka': ('jackfruit', ['Jackfruit, raw']),
    'chico': ('sapodilla', ['Sapodilla, raw']),
    'atis': ('sugar apples', ['Sugar-apples, (sweetsop), raw']),
    'guyabano': ('soursop', ['Soursop, raw']),
    'duhat': ('java plum', ['Java-plum, (jambolan), raw']),
    'sampalok': ('tamarinds', ['Tamarinds, raw']),
    'ubas': ('grapes', ['Grapes, red or green (European type, such as Thompson seedless), raw']),
    'mansanas': ('apples', ['Apples, raw, with skin']),
    'dalanghita': ('tangerines', ['Tangerines, (mandarin oranges), raw']),
    'suha': ('pummelo', ['Pummelo, raw']),
    'kasoy': ('cashew', ['Nuts, cashew nuts, raw']),
    'mani': ('peanuts', ['Peanuts, all types, raw']),
    # meat, fish, eggs, tofu
    'itlog': ('egg', ['Egg, whole, raw, fresh', 'Egg, whole, cooked, hard-boiled', 'Egg, whole, cooked, fried']),
    'itlog ng pato': ('egg duck', ['Egg, duck, whole, fresh, raw']),
    'manok': ('chicken', ['Chicken, broilers or fryers, meat and skin, raw', 'Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw', 'Chicken, broilers or fryers, thigh, meat and skin, raw']),
    'baboy': ('pork', ['Pork, fresh, belly, raw', 'Pork, fresh, ground, raw']),
    'liempo': ('pork belly', ['Pork, fresh, belly, raw']),
    'baka': ('beef', ['Beef, ground, 80% lean meat / 20% fat, raw']),
    'giniling': ('ground', ['Pork, fresh, ground, raw', 'Beef, ground, 80% lean meat / 20% fat, raw']),
    'atay': ('liver', ['Chicken, liver, all classes, raw', 'Pork, fresh, variety meats and by-products, liver, raw']),
    'kambing': ('goat', ['Game meat, goat, raw']),
    'pato': ('duck', ['Duck, domesticated, meat only, raw']),
    'hipon': ('shrimp', ['Crustaceans, shrimp, raw', 'Crustaceans, shrimp, cooked']),
    'pusit': ('squid', ['Mollusks, squid, mixed species, raw']),
    'tahong': ('mussel', ['Mollusks, mussel, blue, raw', 'Mollusks, mussel, blue, cooked, moist heat']),
    'talaba': ('oyster', ['Mollusks, oyster, Pacific, raw']),
    'alimango': ('crab', ['Crustaceans, crab, blue, raw', 'Crustaceans, crab, blue, cooked, moist heat']),
    'alimasag': ('crab', ['Crustaceans, crab, blue, raw', 'Crustaceans, crab, blue, cooked, moist heat']),
    'bangus': ('milkfish', ['Fish, milkfish, raw', 'Fish, milkfish, cooked, dry heat']),
    'tilapya': ('tilapia', ['Fish, tilapia, raw', 'Fish, tilapia, cooked, dry heat']),
    'tambakol': ('tuna yellowfin', ['Fish, tuna, fresh, yellowfin, raw']),
    'tanigue': ('mackerel spanish', ['Fish, mackerel, spanish, raw']),
    'dilis': ('anchovy', ['Fish, anchovy, european, raw']),
    'hito': ('catfish', ['Fish, catfish, channel, farmed, raw']),
    'sardinas': ('sardine', ['Fish, sardine, Pacific, canned in tomato sauce, drained solids with bone', 'Fish, sardine, Atlantic, canned in oil, drained solids with bone']),
    'tokwa': ('tofu', ['Tofu, raw, firm, prepared with calcium sulfate', 'Tofu, fried']),
    'ketchup': ('catsup', ['Catsup']),
    'hotdog': ('frankfurter', ['Frankfurter, beef, unheated', 'Frankfurter, chicken', 'Frankfurter, pork']),
    # rice, bread, the pantry
    'kanin': ('rice white cooked', ['Rice, white, long-grain, regular, unenriched, cooked without salt', 'Rice, white, medium-grain, cooked, unenriched']),
    'bigas': ('rice white raw', ['Rice, white, long-grain, regular, raw, unenriched', 'Rice, white, medium-grain, raw, unenriched']),
    'malagkit': ('rice glutinous', ['Rice, white, glutinous, unenriched, uncooked', 'Rice, white, glutinous, unenriched, cooked']),
    'bihon': ('rice noodles', ['Rice noodles, dry', 'Rice noodles, cooked']),
    'sotanghon': ('cellophane noodles', ['Noodles, chinese, cellophane or long rice (mung beans), dehydrated']),
    'tinapay': ('bread', ['Bread, white, commercially prepared (includes soft bread crumbs)', 'Bread, whole-wheat, commercially prepared']),
    'pandesal': ('rolls dinner', ['Rolls, dinner, plain, commercially prepared (includes brown-and-serve)']),
    'harina': ('wheat flour', ['Wheat flour, white, all-purpose, enriched, bleached', 'Wheat flour, white, all-purpose, unenriched']),
    'gatas': ('milk', ['Milk, whole, 3.25% milkfat, with added vitamin D', 'Milk, canned, evaporated, with added vitamin D and without added vitamin A']),
    'keso': ('cheese', ['Cheese, pasteurized process, American, fortified with vitamin D', 'Cheese, cheddar']),
    'mantikilya': ('butter', ['Butter, salted']),
    'mantika': ('oil', ['Oil, coconut', 'Oil, palm', 'Lard']),
    'asukal': ('sugar', ['Sugars, granulated', 'Sugars, brown']),
    'asin': ('salt', ['Salt, table']),
    'toyo': ('soy sauce', ['Soy sauce made from soy and wheat (shoyu)']),
    'suka': ('vinegar', ['Vinegar, distilled', 'Vinegar, cider']),
    'patis': ('fish sauce', ['Sauce, fish, ready-to-serve']),
    'paminta': ('pepper black', ['Spices, pepper, black']),
    'kape': ('coffee', ['Beverages, coffee, brewed, prepared with tap water', 'Beverages, coffee, instant, regular, powder']),
    'tsaa': ('tea', ['Beverages, tea, black, brewed, prepared with tap water']),
    'tablea': ('baking chocolate', ['Baking chocolate, unsweetened, squares']),
    'gulaman': ('agar', ['Seaweed, agar, dried']),
    'pulot': ('honey', ['Honey']),
}

# The everyday form of a food, put first whenever the search matches it.
# Without these, "egg" opens on yolk (the shortest name) and "tomato" on a
# green one. Each is the form a person buys or eats most, raw before cooked.
EVERYDAY = [
    'Bananas, raw', 'Egg, whole, raw, fresh', 'Egg, whole, cooked, hard-boiled',
    'Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw',
    'Chicken, broilers or fryers, thigh, meat and skin, raw',
    'Chicken, broilers or fryers, meat and skin, raw',
    'Rice, white, long-grain, regular, raw, unenriched',
    'Rice, white, long-grain, regular, unenriched, cooked without salt',
    'Rice, brown, long-grain, raw', 'Rice, brown, long-grain, cooked',
    'Cereals, oats, regular and quick, not fortified, dry',
    'Milk, whole, 3.25% milkfat, with added vitamin D',
    'Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D',
    'Milk, nonfat, fluid, with added vitamin A and vitamin D (fat free or skim)',
    'Milk, canned, evaporated, with added vitamin D and without added vitamin A',
    'Fish, tilapia, raw', 'Fish, salmon, Atlantic, farmed, raw',
    'Fish, tuna, fresh, yellowfin, raw', 'Fish, tuna, light, canned in water, drained solids',
    'Fish, milkfish, raw',
    'Pork, fresh, belly, raw', 'Pork, fresh, ground, raw',
    'Beef, ground, 80% lean meat / 20% fat, raw',
    'Beef, cured, corned beef, canned', 'Luncheon meat, pork, canned',
    'Broccoli, raw', 'Spinach, raw',
    'Peanut butter, smooth style, with salt', 'Oil, olive, salad or cooking', 'Oil, coconut',
    'Sugars, granulated', 'Salt, table',
    'Bread, white, commercially prepared (includes soft bread crumbs)',
    'Cheese, cheddar', 'Yogurt, plain, whole milk', 'Yogurt, Greek, plain, whole milk',
    'Apples, raw, with skin', 'Avocados, raw, all commercial varieties',
    'Potatoes, flesh and skin, raw', 'Sweet potato, raw, unprepared',
    'Garlic, raw', 'Onions, raw', 'Tomatoes, red, ripe, raw, year round average',
    'Nuts, coconut water (liquid from coconuts)', 'Nuts, coconut meat, raw',
    'Mangos, raw', 'Pineapple, raw, all varieties', 'Carrots, raw', 'Cabbage, raw',
    'Tofu, raw, firm, prepared with calcium sulfate', 'Mung beans, mature seeds, raw',
    'Butter, salted', 'Honey', 'Oranges, raw, all commercial varieties',
    'Beverages, coffee, brewed, prepared with tap water',
    'Beverages, tea, black, brewed, prepared with tap water',
    'Crustaceans, shrimp, raw', 'Mollusks, squid, mixed species, raw',
    'Corn, sweet, yellow, raw', 'Cucumber, with peel, raw', 'Eggplant, raw',
    'Wheat flour, white, all-purpose, enriched, bleached',
    'Soy sauce made from soy and wheat (shoyu)', 'Beverages, water, tap, drinking',
]


# ── nutrients.js, read rather than copied ─────────────────────────────────
def read_list():
    src = io.open(NUTRIENTS_JS, encoding='utf-8').read()
    body = src[src.index('const LIST = ['):]
    body = body[:body.index('\n  ];')]
    out = []
    for m in re.finditer(r"\{\s*k:\s*'(\w+)'.*?unit:\s*'(\w+)',\s*re:\s*/(.+?)/([a-z]*)(?:,\s*alt:\s*/(.+?)/([a-z]*))?\s*\}", body):
        k, unit, re1, f1, re2, f2 = m.groups()
        def rx(p, f):
            if p is None:
                return None
            if f not in ('i', ''):
                fail('nutrients.js regex flag %r not understood' % f)
            return re.compile(p, re.I if 'i' in f else 0)
        out.append({'k': k, 'unit': unit, 're': rx(re1, f1), 'alt': rx(re2, f2 if re2 else '')})
    want = len(re.findall(r"\{\s*k:\s*'", body))
    if not out or len(out) != want:
        fail('read %d of %d nutrients out of shared/nutrients.js; its LIST changed shape' % (len(out), want))
    return out


# how many micrograms one of each unit is, as nutrients.js spells them
UG = {'g': 1e6, 'mg': 1e3, 'ug': 1, '\u00b5g': 1, '\u03bcg': 1, 'mcg': 1}


def to_unit(v, frm, to):
    a, b = UG.get(str(frm or '').lower()), UG.get(to)
    return v * a / b if a and b else None


def js_fixed(v, f):
    """Number.prototype.toFixed: the exact value of the double, the nearer
    decimal, the larger one on an exact tie. Then read back as a double."""
    n = (Decimal(v) * (Decimal(10) ** f)).quantize(Decimal(1), rounding=ROUND_HALF_UP)
    return float(Decimal(n) / (Decimal(10) ** f)) if f else float(n)


def tidy(v):
    """nutrients.js's tidy: three significant figures, at most four decimals,
    never fewer than the whole number."""
    if v is None or not math.isfinite(v):
        return None
    if v == 0:
        return 0.0
    d = max(0, 2 - math.floor(math.log10(abs(v))))
    return js_fixed(v, min(d, 4))


# FOODDEX's ids for the eight, best first (portion/index.html, USDA_NUT)
EIGHT = [('kcal', [1008, 2048, 2047]), ('p', [1003]), ('c', [1005, 1050]), ('f', [1004]),
         ('na', [1093]), ('k', [1092]), ('ca', [1087]), ('caff', [1057])]


def figures(food, LIST):
    """One food's figures per 100 g, from the bulk file's own shape."""
    rows = [{'id': n['nutrient']['id'], 'name': n['nutrient']['name'],
             'unit': n['nutrient'].get('unitName'), 'v': n.get('amount')}
            for n in food.get('foodNutrients', []) if n.get('nutrient')]
    out = {}
    by = {}
    for r in rows:
        by.setdefault(r['id'], r)
    for key, ids in EIGHT:
        for i in ids:
            r = by.get(i)
            if not r or not isinstance(r['v'], (int, float)) or isinstance(r['v'], bool):
                continue
            v = float(r['v'])
            if key == 'kcal' and re.search('kj', r['unit'] or '', re.I):
                v = v / 4.184
            out[key] = tidy(v)
            break
    for which in ('re', 'alt'):
        for r in rows:
            if not isinstance(r['v'], (int, float)) or isinstance(r['v'], bool):
                continue
            for x in LIST:
                if out.get(x['k']) is not None or not x[which] or not x[which].search(r['name'] or ''):
                    continue
                v = to_unit(float(r['v']), r['unit'], x['unit'])
                if v is not None:
                    out[x['k']] = tidy(v)
    return out


def num(v):
    """A number as JavaScript reads it back to the same double, short."""
    if v == int(v) and abs(v) < 1e15:
        return str(int(v))
    s = repr(v)
    if s.startswith('0.'):
        s = s[1:]
    return s


def load_bulk(fresh):
    os.makedirs(CACHE, exist_ok=True)
    zp = os.path.join(CACHE, 'sr_legacy_2018-04.zip')
    if fresh or not os.path.exists(zp):
        print('downloading', URL)
        tmp = zp + '.part'
        with urllib.request.urlopen(URL, timeout=120) as r, open(tmp, 'wb') as f:
            while True:
                b = r.read(1 << 20)
                if not b:
                    break
                f.write(b)
        os.replace(tmp, zp)
    try:
        z = zipfile.ZipFile(zp)
        data = json.loads(z.read(z.infolist()[0].filename))
    except Exception as e:
        fail('could not read %s (%s). Run again with --fresh.' % (zp, e))
    foods = data.get('SRLegacyFoods')
    if not foods:
        fail('the USDA file has no SRLegacyFoods list')
    return zp, foods


def main():
    fresh = '--fresh' in sys.argv
    LIST = read_list()
    keys = [k for k, _ in EIGHT] + [x['k'] for x in LIST]
    zp, foods = load_bulk(fresh)

    dropped = {}
    kept = []
    for fd in foods:
        cat = fd.get('foodCategory', {}).get('description', '')
        name = fd.get('description', '')
        why = why_dropped(cat, name)
        if why:
            dropped[why] = dropped.get(why, 0) + 1
            continue
        if cat not in CAT_NAMES:
            fail('a group this file does not know: %r. Add it to CAT_NAMES or DROP_CATS.' % cat)
        kept.append((clean_name(name), CAT_NAMES[cat], fd['fdcId'], figures(fd, LIST)))
    kept.sort(key=lambda t: (t[0].lower(), t[2]))

    index = {}
    for i, (name, cat, fid, fig) in enumerate(kept):
        index.setdefault(name, i)
    missing = []
    alias = {}
    for word, (q, names) in ALIASES.items():
        ids = []
        for n in names:
            if n in index:
                ids.append(index[n])
            else:
                missing.append('%s -> %s' % (word, n))
        alias[word] = [q, ids]
    every = []
    for n in EVERYDAY:
        if n in index:
            every.append(index[n])
        else:
            missing.append('everyday -> %s' % n)
    if missing:
        fail('names not in the table:\n  ' + '\n  '.join(missing))

    cats = sorted(set(c for _, c, _, _ in kept))
    ci = {c: i for i, c in enumerate(cats)}
    lines = []
    for name, cat, fid, fig in kept:
        cells = [str(fid), str(ci[cat]), json.dumps(name)]
        vals = [fig.get(k) for k in keys]
        while vals and vals[-1] is None:
            vals.pop()
        cells += ['' if v is None else num(v) for v in vals]
        lines.append('[' + ','.join(cells) + ']')

    head = ('/* THE FOOD TABLE, made by tools/food-table.py. Do not edit: run the tool.\n'
            '   ' + SOURCE + '\n'
            '   Per 100 g. Each food is [fdcId, group, name, then one figure per key,\n'
            '   a gap where the USDA printed none]. */\n')
    body = ('window.FoodTableData={src:' + json.dumps(SOURCE) +
            ',keys:' + json.dumps(keys, separators=(',', ':')) +
            ',cats:' + json.dumps(cats, separators=(',', ':')) +
            ',alias:' + json.dumps(alias, sort_keys=True, separators=(',', ':')) +
            ',every:' + json.dumps(every, separators=(',', ':')) +
            ',foods:[\n' + ',\n'.join(lines) + '\n]};\n')
    text = head + body
    raw = text.encode('ascii')
    stamp = hashlib.sha1(raw).hexdigest()[:8]
    with open(OUT, 'wb') as f:
        f.write(raw)

    eng = io.open(ENGINE, encoding='utf-8').read()
    eng2, n = re.subn(r"const STAMP = '[0-9a-z]*';", "const STAMP = '%s';" % stamp, eng, count=1)
    if n != 1:
        fail("kitchen/foodtable.js has no line const STAMP = '...';")
    if eng2 != eng:
        io.open(ENGINE, 'w', encoding='utf-8', newline='\n').write(eng2)

    filled = {k: sum(1 for t in kept if t[3].get(k) is not None) for k in keys}
    print('source  : %s' % zp)
    print('foods   : %d kept of %d' % (len(kept), len(foods)))
    for why, n in sorted(dropped.items(), key=lambda t: -t[1]):
        print('dropped : %4d  %s' % (n, why))
    print('groups  : %d' % len(cats))
    print('aliases : %d words, %d everyday picks' % (len(alias), len(every)))
    print('figures : ' + ', '.join('%s %d' % (k, filled[k]) for k in keys))
    print('file    : %s, %d bytes, %d gzipped' % (os.path.relpath(OUT, ROOT), len(raw), len(gzip.compress(raw, 9))))
    print('stamp   : %s (written into kitchen/foodtable.js)' % stamp)


if __name__ == '__main__':
    main()
