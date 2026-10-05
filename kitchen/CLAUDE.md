# KITCHEN (CLAUDE.md)

Governs `kitchen/` only. The repo-root `CLAUDE.md` and `DOCTRINE.md` still
apply and win any disagreement. KITCHEN joins STATUS, FOODDÉX and ELEMENT
as one food system, and reads RECEIPTS: read `status/CLAUDE.md`,
`portion/CLAUDE.md` and `receipts/CLAUDE.md` before changing what passes
between them.

## What it is (1.0.0, 2026-09-28)

Tom: *"New module. Pantry / pantry inventory, meal planner, nutritional
guide."* His answers: the name is **KITCHEN**; it is in the **client
build** (he uses it and coaching clients get it); it is for **everywhere**
(phone rules, good at a desk); stock is **receipts add, eating subtracts,
a hand count corrects either**; the guide is **targets and gaps**.

FUNCTION sentence (DOCTRINE lens 1): **Plan what you eat from what you
have.** The shelf is the input, the plan is the job, the guide is the check
on the plan.

App id `kitchen` is permanent: settings, theme and sound are saved under it.

## Never

- Never generates a plan by itself. Every planned item is one the person
  put there.
- Never praises, grades or says "great job". The guide shows numbers.
- Never invents a target. Calories and macros are STATUS's; a missing one
  is blank with a line pointing at STATUS. Reference intakes are shipped
  facts (vocabulary), chosen once by the person and typed over at will.
- Never counts a blank nutrient as zero. Totals say what they could not
  count ("Not known for 3 foods.").
- Never writes a `spend`. Money is STATUS's and WEALTH's; a receipt
  already wrote one.
- A suggestion is one serving of one food, never a plan (root brief:
  one step from where he is).

## Rows

### Owned (`Rec.declare('kitchen', [...])`)

| Type | Key | Date | Payload |
|---|---|---|---|
| `kcount` | food id | the day counted | `{q, t}` a hand count in the food's base unit (g, ml, servings or its own unit), `t` ms. `q: 0` is "used up". The latest count by time is the anchor |
| `kfood` | food id | null | `{min}` keep at least this much, base units. Kept off the food row. Written by `Rec.patch`; blank deletes the row |
| `kplan` | uid | the planned day | `{slot, food, mult, ord, dish?}` one planned food. `slot` `b` `l` `d` `s`. `mult` a multiple of the food's base serving. `dish` the saved meal it came from |
| `kdish` | uid | null | `{name, items:[{food, mult}], ord}` a saved meal. `items` never empty |
| `kskip` | meal key | the meal's date | `{skip: 1}` this logged meal did not come out of the kitchen, so it takes no stock off. Kept off the meal row, as WEALTH's `mark` is kept off `spend` |

Settings (`Rec.setting('kitchen', ...)`), each written only when the person
changes it: `tab` (the last tab, the suite's way: QUESTS and WEALTH do the
same), `ref` `{sex:'m'|'f', age:'19'|'31'|'51'|'71'}` or `{none:1}`,
`targets` `{<k>: number}` typed overrides, `hide` `{<k>: 1}`. An emptied
`targets` or `hide` deletes the setting row rather than writing `{}`, which
live sync would drop. The plan day, the guide period, the shelf search and
the "foods out" fold are view state, never stored.

### Written into other apps' types (many writers, merge rules)

- **`buy`** for a purchase typed here (clients have no RECEIPTS): key uid,
  dated the day bought (the Bought sheet offers Today, Yesterday or an
  earlier day in the last two weeks; `t` is now for today, noon for a past
  day), `{food, text: <food name>, qty, unit: <base unit,
  or 'pc'>, t, src: 'kitchen'}`. Only these can be removed in KITCHEN; a
  RECEIPTS line cannot. `buy` is in `IO.register`'s `types` so hand
  purchases reach KITCHEN's own sheet tab and backup; `Rec.declare` gets
  only the five own types.
- **`meal`** when a planned item is ticked eaten: key `kitchen-<kplanKey>`
  (stable, so a second device or a double tap cannot duplicate it), dated
  the plan's day, today or past only. Exactly STATUS logMeal's shape:
  `{fid, name, serve, unit, t, kcal, p, c, f, na, k, ca, caff, price, amt,
  mult, src:'kitchen'}`, each nutrient `base[n] * mult` with a missing one
  read as 0 the way STATUS's `scale` does. `serve` is worded exactly as
  STATUS's `serveLabel` words it (`150 g`, `1 piece`, `2 × piece`, no
  thousands comma), since STATUS's `meal1Serve` finds the serving again from
  it. No `acct`. Then the food gets `Rec.patch` `{uses: +1, last: today}`.
  Unticking deletes the meal, with UNDO, and takes the one use back (`last`
  stays); Ate all's UNDO does the same. Eaten-ness is the meal row, never a
  flag on `kplan`. Changing the amount of an eaten item rescales that meal
  the way STATUS resizes one: every number on the row times new over old, so
  a correction typed in STATUS survives; the label is not read again.
- **A meal STATUS gave an account** (`acct`, so STATUS wrote a `spend`
  keyed `meal-<key>` beside it) is STATUS's from then on. KITCHEN refuses to
  untick it or change its amount ("Paid from an account. Change it in
  STATUS.") and never touches the spend. Money is not KITCHEN's.
- **An eaten item cannot be removed** ("Eaten. Untick it first."), or its
  meal would be left with no tick to undo it by. Clear slot and Clear day
  clear only what is not eaten and say how many eaten were kept; with
  nothing uneaten, Clear is not offered. Move to another day keeps the meal
  on its old day on purpose.
- **`food`** when a food is added here: new uid, `{id, name, brand: '',
  cat?, base: {amt, unit, kcal?, p?, c?, f?}, uses: 0}` with blank boxes
  left OFF. No `serves` (an empty list does not survive sync). Setting a
  piece weight reads the food, replaces any `1 piece` serving and patches
  `serves`.
- **`food.base.<key>`, `food.fills` and `food.barcode`** on FILL BLANKS
  (below): `Rec.patch` with dotted keys, so nothing else on the row moves.
  `fills` is a list of `{src: 'usda'|'off', from, id, keys, v, g?, ml?, t}`:
  where the figures came from (the USDA's description or the pack's name),
  its fdcId or barcode, the keys filled, `v` the values written (REMOVE
  compares against them), `g` or `ml` the weight typed when one was asked,
  `t` ms. Removing the last entry removes the field, never `[]`.

### Read

`food` (STATUS, FOODDÉX, RECEIPTS), `meal` (STATUS, ELEMENT, KITCHEN),
`buy` and `receipt` (RECEIPTS), and STATUS's settings `targets`, `calMode`,
`macroOn`, `countCal`. `IO.register` `reads`: `status: food, meal`,
`portion: food`, `receipts: buy, receipt`.

## The stock maths

Worked out every draw in `stock(fid)`, never stored. Events for one food:

- **counts**: `kcount` rows, at `t`.
- **in**: `buy` rows with `food === id`, at `t`, else the receipt's date and
  time, else the buy's date at noon. Converted to the base unit by
  `toBase`: kg, g, L, ml through `UI.UNITS`; `pc` through the `1 piece`
  serving (g/ml foods only); a unit equal to the base unit as is, with pc,
  pcs, piece and pieces read as one unit (a `piece` food takes a `pc` line
  one for one). No amount,
  `pc` with no piece weight, `pc` on a serving food, or mass into volume
  cannot be counted (no density guess).
- **out**: `meal` rows with `fid === id`, not `kskip`ped: `meal.amt` when
  `meal.unit` is the base unit, else `base.amt * meal.mult`. At the date
  plus `at`, else `t` when it falls on the meal's date, else noon.

In time order (at one moment: in, then out, then a count). A food is **in
the kitchen** once it has a count or a buy. A count sets the total, in adds,
out subtracts clamped at 0; meals before the first buy or count are
ignored. A clamp after the last count shows **count it** ("Logged more than
was stocked"), unless an uncounted purchase came before the clamp and
explains it; one that came after cannot. Uncounted purchases since the
last count are listed under the shelf with their fix (set the piece weight,
or count the food), never dropped; a count settles them. A food whose
amount is 0 with an uncounted purchase since the last count is **not
counted**, not out: it stays on the shelf with "count it", and its sheet
says "Not counted". It still counts as not in stock for To buy and the
guide's shelf picks.

**To buy** = planned over the next 7 days from today, not yet eaten, plus
`kfood.min`, less stock. Offered in whole pieces for pieced foods, rounded
up otherwise.

## Screens

- **SHELF.** To buy (only when something is needed; tap for the Bought sheet
  with a one-tap "Bought 600 g"; SHARE LIST uses `navigator.share`, else
  the clipboard, else a sheet with the text). A search over name and brand.
  Foods with stock by group, groups in the order they first appear among
  foods sorted by uses; "count it" and "low" flags. Foods at 0 folded under
  "N foods out". ADD FOOD at the bottom (picker, then Bought). Tap a food:
  the food sheet (stock large, BOUGHT, COUNT, USED UP, KEEP AT LEAST, PIECE
  WEIGHT for g/ml foods without one, FILL BLANKS, "Filled figures" with
  REMOVE on each fill, and the last 12 events; hold or the
  more button on a meal event toggles `kskip`, on a hand purchase removes
  it). Hold a row: Bought, Count, Used up, Keep at least.
- **Food picker.** Search focused on open, sorted by uses then name, in-stock
  first on PLAN, stock shown, at most 40. Opened from a slot on PLAN, the
  saved meals come first, searched by the same box. From 2 characters, "FROM
  THE FOOD TABLE" under the person's own foods, up to 6 (THE FOOD TABLE,
  below). Hold or right-click one of the person's foods: Fill blanks, with
  the picker left open under it. "New food" adds one with
  name, group, amount and unit, and calories, protein, carbs and fat only
  when STATUS's Count calories is on.
- **PLAN.** Under 1100px: the week's day strip (today outlined) and one day.
  From 1100px: seven columns, the same `dayCard`; in a column an item's
  words take the whole row with the tick under them, and a slot's buttons
  drop under its name when both do not fit. Four slots; an empty slot
  is one line with its add button. Items tick on today and the past only.
  Tap an item: the amount sheet (servings or grams, "Last:" offer, REMOVE,
  MOVE, SAVE). The slot's add button opens the picker straight away, so the
  keyboard comes up on a phone. A slot with items also has a visible more
  button (Save as a meal, Ate all, Clear slot); an empty slot has none, since
  its menu would only repeat the add button. Hold an item, a slot's name or
  a day's name for their menus; the day also has a visible more button.
  Copy a day into the next 14 days,
  clear a day or slot, save a slot as a meal, ate all. Footer: planned kcal
  and protein against STATUS's targets, and on today "Logged in STATUS".
- **GUIDE.** A setup card until `ref` is set (Men / Women, four age bands,
  or No reference). Today (eaten solid, planned striped, one bar), Next 7
  days (planned, averaged over days with a plan), Last 7 days (eaten,
  averaged over logged days, the 7 days before today; a day with only
  ELEMENT's salt rows is not a logged day and adds nothing). Rows: calories
  and macros (hidden when STATUS's Count calories is off; a macro switched
  off in STATUS's `macroOn` has no target), fibre, minerals, vitamins, each
  with its target; sodium is a limit, never a gap. "Short today" / "Short
  this week", only when something has a target it can be short of: the
  three furthest under target among calories, protein, fibre and the
  reference nutrients (carbs and fat are left out: short of one is a choice
  about the other), ranked only when at least half the items carry a figure (ELEMENT
  rows are left out of that count except for sodium, potassium and
  calcium); each with up to three shelf foods richest per serving (else
  library foods marked "not on the shelf"); tapping one opens the amount
  sheet with a "One serving" offer. Tap a row: where it came from and the
  richest foods per serving and, when calories are counted, per 100 kcal.
  The sheet is live, and its "Not known for ..." line leads to FILL BLANKS
  for every row but calories and macros, which a fill never writes.
  Fat's, Carbs' and Vitamin A's sheets also list the nutrients with no
  reference intake under "Also counted" (saturated fat, EPA, DHA and
  cholesterol; sugar; beta-carotene and preformed A), a total and a
  not-known count, never a bar.
- **The not-known rule on eaten meals.** A macro the food carries no figure
  for was frozen as 0 on the meal and reads as not known, unless a number
  over 0 was typed in STATUS. Sodium, potassium and calcium: a frozen 0 on a
  food that now has a figure reads the food's figure; a food since deleted
  keeps its frozen figure when it is over 0. The extras use the meal's own
  amount over the label's amount when the units match, not `meal.mult`,
  since the label may have changed; "Last:" does the same.
- **A meal with no fid finds its food by name** (1.0.3; 75 of Tom's 175
  meals have none): trimmed, any case, only when exactly ONE food has that
  name and the meal's unit is the food's, never an ELEMENT row. It then
  counts the extras and the sodium, potassium and calcium rule as a fid meal
  does, with two differences: its macros stand as typed, and a sodium,
  potassium or calcium over 0 typed on it is kept when the food has none.
  Read in `eatItem` only; nothing is written to the meal, and stock and
  "Last:" still go by fid.
- **Settings.** TARGETS (the reference choice again, the source, every
  reference nutrient with its value, a box to type over it and a switch to
  hide it) and MEALS (saved meals: rename, remove with UNDO; empty, an OPEN
  PLAN button). Keep at least offers UNDO on every change, a cleared one
  too.

## Reference intakes

Shipped in the page as `REF`: US National Academies of Sciences,
Engineering, and Medicine, Dietary Reference Intakes summary tables
(Dietary Reference Intakes for Sodium and Potassium, 2019, Appendix J),
including the 2019 potassium AI and sodium CDRR,
<https://nap.nationalacademies.org/read/25353/chapter/28>. Adults only,
by sex and age band (19-30, 31-50, 51-70, over 70); pregnancy and
lactation are left out. Notes from the research that matter here:

- Sodium has no UL; 2,300 mg is the 2019 CDRR and is shown as a limit. The
  2019 sodium AI is 1,500 mg if a floor is ever wanted.
- Potassium's 2019 AI (3,400 / 2,600 mg) replaced the old 4,700 mg. Do not
  mix old tables in.
- Copper is printed in micrograms and stored here as 0.9 mg.
- Vitamin A applies to `rae`; folate to `fol`, labelled "Folate (food
  figure)" since a food may carry DFE or total. EPA, DHA, sugar, saturated
  fat, cholesterol, beta carotene and preformed vitamin A (`va`) have no
  DRI and are never targets.
- AI rows (fibre, potassium, manganese, vitamin K, B5, choline) are
  Adequate Intakes, not RDAs.
- Fibre was cross-checked only against a secondary source; every other
  value against the report that first set it.

ELEMENT's salt and citrate meals (`src: 'mix'`, no fid) count for sodium,
potassium and calcium as frozen, and as zero for every other nutrient.
Any other meal with no fid is not known for every nutrient beyond the
macros it carries, unless it finds its food by name (Screens, above).

## SCAN (1.0.1, 2026-09-30)

Tom: "ok include". The food picker (ADD FOOD on SHELF, and every slot's add
on PLAN) has SCAN beside New food. `barcode.js` beside this file opens a
sheet: the back camera through `getUserMedia` (the iPhone included; video
set `playsinline`, `muted` and `autoplay` before the stream), frames read by
the phone's own `BarcodeDetector` where it has EAN or UPC (Chrome on
Android), else by zxing-wasm 3.1.4 vendored in `zxing/` (reader IIFE, a
950 KB wasm, MIT over zxing-cpp's Apache-2.0, both texts in
`zxing/LICENSE`), loaded only on the first scan and pointed at that copy,
never the CDN. The middle 60% band of the frame, at most 960 wide, every
150 ms. Under it, always, a box for the number under the bars and LOOK UP;
no camera or a refusal says "Camera not available. Type the number." and
puts the caret there. A number is checked by its mod-10 digit (UPC-E read
out to its twelve) before anything is asked.

- **A code already on a food** (`food.barcode`, a UPC-A and its EAN-13 with
  a leading 0 counted as one) picks that food: "Already in your foods".
- **Else Open Food Facts**, CALCOUNT's v2 product call, free, no key, only
  the number sent, at most 15 lookups a minute per page ("Lookup limit
  reached. Try again in a minute."). `Barcode.fromOff` keeps only figures
  the product carries: per 100 g, or per 100 ml when its quantity is in ml,
  cl or L; calories from kcal, else kJ / 4.184; sodium as printed, else salt
  x 400 mg; every other key in `shared/nutrients.js` it can map, a pack's
  Vitamin A to `rae`. A blank is left off, never 0. No calories and no macro
  at all reads as not found.
- **NEW FOOD then opens filled**: name, 100, the unit chip, and the four
  boxes when Count calories is on, under "From Open Food Facts: N figures
  per 100 g. Check them against the pack." ADD saves `brand`, `barcode`,
  `base.src: 'off'` and every other figure found; a box typed over wins and
  a box emptied stays empty. The figures with no box are per 100 of the
  source's unit: an amount changed in the same unit scales them, a changed
  unit takes none of them (since 1.0.3; before, they were saved unscaled).
  Not found or no signal opens it empty with the code kept, so the next
  scan finds the food.
- `Barcode` is also FOODDÉX's (`../kitchen/barcode.js`); see
  `portion/CLAUDE.md`.

## FILL BLANKS (1.0.3, 2026-10-01)

Tom: "okay, do 1 and 2". None of his 38 foods carried any of the 31 extra
nutrients, so the guide said "not known" for every vitamin and mineral.
FILL BLANKS fills a food that already exists, from its pack or from the
food table, and never by itself.

- **Blanks only.** A key is blank when it is absent, `null` or `''`; a 0 is
  a figure. Filled: `na`, `k`, `ca`, `caff` and every key in
  `shared/nutrients.js`. **Never `kcal`, `p`, `c` or `f`, even blank**: a
  macro frozen as 0 on a past meal reads as not known only while the food
  has no figure for it (`itemVal`), so filling one would turn those meals
  into false zeros. The screens say "Calories and macros stay as you typed
  them."
- **Scaled to the food's own amount.** Sources are per 100 g (the table) or
  per 100 g or 100 ml (Open Food Facts, by its unit). One kind (g, kg, ml,
  L) converts: 1 Kg is 1000 g. Otherwise a serving that names its own
  weight ("1 pack (55 g)", one weight in its label) gives it, and the
  confirm says so. Otherwise it asks once, "How many g is 1 Bowl of
  Lugaw?", with the pack's serving and the last weight typed as offers.
  Never 1 ml = 1 g. Three significant figures, as `nutrients.js` keeps them.
- **The screens.** The chooser: SCAN THE PACK, and a search of the food
  table prefilled with the food's name, caret in it. A pick closes the
  chooser and opens the confirm (two sheets closed in one tick would be two
  history steps): the source ("USDA food table: Bananas, raw — an average
  for this food, not your pack." or "Open Food Facts: Nutella
  3017620422003"), "Fills N blanks: Fibre 2.6 g, ..." with the first four,
  and FILL / CANCEL. A table source adds "If the pack lists its own
  figures, scan it instead." Nothing is written before FILL.
- **A scanned code on another food** fills nothing: "That code is on Cola.
  Nothing was filled." A scan writes `barcode` when the food has none.
- **Written** with `Rec.patch` on dotted keys, then "Filled N figures on
  X." with UNDO, which sets the row back exactly as read before the fill.
  Blanks are read again at FILL, from the row as it is then.
- **REMOVE**, on the food's sheet under "Filled figures" ("31 figures from
  USDA, Bananas, raw (an average) · 1 Oct"): deletes only the keys whose
  value still equals the one filled (`v`), drops the entry, offers UNDO. A
  figure typed over since stays.
- **Three ways in:** FILL BLANKS on the food's sheet (from a shelf row);
  hold or right-click a food in the picker, Fill blanks; and GUIDE, a row's
  sheet, its "Not known for ... Fill blanks" line, which lists the foods
  with no figure for that nutrient over the period on screen, each with
  FILL (tap the food for its sheet), and names the meals logged without
  one of the person's foods, which have nothing to fill. The GUIDE route is
  Tom's: his foods are not on the shelf.

## THE FOOD TABLE (1.0.3, 2026-10-01)

USDA FoodData Central, SR Legacy (April 2018), public domain (CC0), per
100 g, shipped beside this file: `foodtable.js` (the engine, hand-written)
and `foodtable-data.js` (generated, about 1.2 MB, fetched only the first
time a picker or the chooser opens, as `foodtable-data.js?v=<STAMP>`, which
`sw.js` answers from the phone's copy ever after). Regenerate with
`py -3 tools/food-table.py` (`--fresh` downloads the USDA file again, into
the system temp folder, never the repo); it reads the key list out of
`shared/nutrients.js`, maps figures exactly as `Nutrients.fromUsda` does,
drops baby food, US fast food and restaurants, American Indian and Alaska
Native foods and US brands, checks every Tagalog word against the real
names, and writes the STAMP.

- **The contract** (`window.FoodTable`): `load()` a promise of true, or
  false with no signal, safe to call often; `ready`; `count`; `search(q, n)`
  `[{i, name, cat, via}]` best first, every word must match, `via` the
  Tagalog word when the hit came through the alias list; `food(i)` `{name,
  cat, id: fdcId, amt: 100, unit: 'g', base}` with missing keys absent.
  No `foodtable.js` at all: the table group and the chooser's search do not
  show; SCAN still works.
- **In the picker**, from 2 characters, "FROM THE FOOD TABLE" under the
  person's own foods, up to 6, a name and a category line. One tap opens
  NEW FOOD filled through the scan path, under "From the USDA food table: N
  figures per 100 g. An average for this food, not your pack.", named by
  the Tagalog word when it came through one. ADD saves `base.src: 'usda'`,
  the figures, and `fills` naming the figures that are still the table's.
  Not loaded and no signal: "The food table downloads the first time you
  have signal."
- **Why a shipped table, not a live USDA lookup:** FOODDÉX's lookup runs on
  the shared DEMO_KEY, which allows 10 lookups a day per connection
  (WATCHED 2026-10-01), and clients have no key of their own. A table on
  the phone answers offline, instantly, for everyone.

## A wide window (1.0.3, 2026-10-02)

Tom runs the suite on a 5120x1440 screen, where KITCHEN gets a frame about
2560 wide. **His rule: on a wide window, lay things out side by side; never
fold text** (no "show more"). From 1100px (the same `wideNow` PLAN uses,
and every tab now redraws when the window crosses it):

- **SHELF**: the search keeps a 768px width, then To buy and the shelf's
  groups flow down columns (`.kx-mason`, CSS columns at least 384px, a card
  never split). Foods out, opened, lay out as a grid of the same width.
  ADD FOOD stays sticky, centred, 384px.
- **GUIDE**: the period strip and the note keep 768px; the setup card,
  Short today and the four nutrient cards flow down the same columns.
- **Tabs**: from 1100px each tab is at most 256px and the bar is centred
  (they were 840px each at 2560).
- Under 1100px nothing changed: at 390x844 every element of all three tabs
  measured at the same place and size before and after.

Scroll depth (scrollHeight over window height, demo data, headless
Chromium), before to after: SHELF 1.84 to 1.00 at 1280, 1720 and 2560 x
1300, 2.39 to 1.00 at 1920x1000; GUIDE 2.62 to 1.12 (1280), 1.01 (1720),
1.01 (2560), 3.40 to 1.31 at 1920x1000. PLAN untouched (1.28 at 2560).
Not watched: the Foods out list opened (the demo has no food at zero).

## Not in this version

A home screen widget; prices and grocery cost; expiry dates; storage places
(fridge, freezer); generating a plan by itself (never); filling calories or
macros (never: see FILL BLANKS); filling a food by itself (never).

## Needs from the foundation

1. **STATUS's calorie target maths is not shared.** `calTarget` and the TDEE
   engine (`TD.targetIntake`) live inside `status/index.html`, so in `tdee`
   mode KITCHEN shows STATUS's fixed target with "(STATUS's fixed target)"
   under it instead of the measured one. A shared reader would let STATUS,
   the home screen and KITCHEN agree.
2. **The day-nutrient readers are not shared.** ELEMENT and STATUS each
   total a day's meals their own way, and KITCHEN is a third copy
   (`itemVal`, `sumOf`). The extras need `food.base[k] * meal.mult` through
   `fid`; one shared reader should own that and the not-known rule.
3. **`buy`, `receipt` and `alias` are missing from the root ownership
   table.** KITCHEN now writes `buy` too (`src: 'kitchen'`).
4. **RECEIPTS' matcher (`norm`, `score`, `guess`) is inline** in
   `receipts/index.html`. KITCHEN does not match shop wording yet; if it
   ever does, the matcher belongs in `shared/` so the alias keys cannot
   drift apart.
5. ~~A phone menu runs its item 60ms after the tap.~~ Done in
   `shared/mobile.js` on 2026-09-30 (`shared/CLAUDE.md`): a menu item runs
   inside the tap, so Bought, Count, Keep at least, Change amount and Fill
   blanks from a held row can raise the iPhone keyboard. Not yet watched on
   the iPhone.
6. **`barcode.js` and `zxing/` belong in `shared/`.** They sit in
   `kitchen/` since 2026-09-30 only because this session could not edit
   `shared/`; FOODDÉX loads them as `../kitchen/barcode.js`. The file finds
   `zxing/` from its own address, so moving the file and the folder
   together is the whole move, plus the two script tags. `sw.js` keeps them
   on first fetch like any file; the client build copies `kitchen/` whole,
   so clients get them.
7. **The root ownership table's `food` line** should say a food may carry
   `barcode` (top level, the digits, KITCHEN and FOODDÉX write it on SCAN),
   `base.src: 'off'` (figures from Open Food Facts) or `'usda'` (from the
   food table), and `fills: [{src, from, id, keys, v, g, t}]` (FILL BLANKS,
   KITCHEN writes it; `ml` in place of `g` when millilitres were asked).
8. **The food table belongs in `shared/` once a second app wants it.**
   `foodtable.js` finds `foodtable-data.js` from its own address, like
   `barcode.js`, so the move is the two files and the script tags.

## History

`HISTORY.md` beside this file: what was watched for each version.
