# KITCHEN history

The diary for `kitchen/`. `CLAUDE.md` beside this file holds the rules.

## Watched (2026-09-28, 1.0.0)

In the browser, by clicking the real controls, with seeded rows cleaned up
after: shelf stock against hand arithmetic (a kg buy, pc through a piece
weight, an L buy for a g food listed as not counted), Bought, Count, Used up
with UNDO, Keep at least and To buy, `kskip` both ways, a hand purchase
removed with UNDO, piece weight, new food with blank boxes left off; PLAN at
390 and 1280 wide: add, change amount, tick (the meal matched STATUS's
logMeal field for field, uses went up, stock went down), untick with UNDO,
save and add a saved meal, copy a day, clear, move, a future day with no
tick; GUIDE setup, the three periods, not-known lines, a Short suggestion
into Snacks, detail sheets; Settings TARGETS and MEALS and the version line;
the back gesture. `_review.html` 142 of 142 at desktop and 390 wide.
Not watched: an iPhone. Calories were added to Short today afterwards and
not clicked again.

## SCAN watched (2026-09-30, 1.0.1)

At 390 wide, by pressing ADD FOOD, SCAN, typing and
LOOK UP, against the real Open Food Facts: Nutella (3017620422003) filled
and saved with 8 figures and its code, then scanned again and picked
straight into Bought; a made-up valid code opened NEW FOOD empty with the
code kept and p, c and f left off; a wrong check digit said "Not a
barcode number."; the camera refused in the browser pane fell back to
typing. The camera path was watched with a drawn EAN-13 fed in as the
camera's stream: zxing loaded from `zxing/`, read Coca-Cola 5449000000996
off the video, and NEW FOOD opened per 100 ml. The limit answered busy on
the 15th lookup in a minute (fetch stubbed). **Not watched: a real camera,
and anything on an iPhone.**

## FILL BLANKS and THE FOOD TABLE watched (2026-10-01, 1.0.3)

Playwright for Python, headless Chromium at 390 x 844 with touch and at
1280 x 900, and WebKit at 390 x 844, a fresh store each run, by pressing the
controls: 58 of 58 checks against a stand-in table shaped like the contract
(test script only), then 9 of 9 against the real `foodtable.js` and its data.
Open Food Facts stubbed; no real lookup.

- GUIDE, Fibre, "Not known for 6 foods." to its sheet, "Not known for ...
  Fill blanks" to the list: Banana, Cola, Lugaw, Milk with FILL, the two
  meals typed without a food named, none with FILL.
- Lugaw, 1 Bowl: caret in the chooser's search, "lugaw" found nothing,
  "rice" found it; the confirm asked "How many g is 1 Bowl of Lugaw?",
  FILL with the box empty wrote nothing; 300 g filled 8 blanks at x3
  (fibre 1.2 g, folate 291 mcg), its typed 800 mg of sodium and every
  macro untouched, `g: 300` on the entry.
- Milk, 250 mL against per 100 g: asked "How many g is 250 mL of Milk?"
  (never 1 ml = 1 g); 258 g gave calcium 292 mg and fibre 0, a real 0.
- Banana, 100 g, from its sheet on SHELF: "Bananas, raw" first, no question,
  UNDO in the same breath gave back the row exactly; filled again, every
  typed figure byte for byte. Real table: 34 figures, each equal to the
  table's.
- GUIDE after: Fibre "4.3 of 38 g", Lugaw 1.2 g counted through its name
  (the meal has no fid), Banana 3.1 g through its fid; the "Adobo" meal
  (two foods of that name) and a "Banana" meal in servings (the food is in
  g) stayed not known. Sodium read Lugaw's 800 mg and Milk's filled 111 mg
  off meals frozen at 0. Protein's not-known line stayed words.
- REMOVE after fibre was retyped to 3: 30 figures went, fibre 3 stayed,
  `fills` was gone, not `[]`; UNDO gave the row back exactly.
- Picker: hold (a real touch held 700 ms, Chromium) and right-click opened
  Fill blanks over the picker. Rice sack, 1 Kg: x10 with no question.
  Crackers, 1 Pack with a "1 pack (55 g)" serving: x0.55, and said so.
- SCAN: 5449000000996 on Cola refused with "That code is on Cola. Nothing
  was filled."; 3017620422003 filled 7 blanks on a 15 g Choco Spread at
  x0.15 and kept the code.
- FROM THE FOOD TABLE: "kangkong" offered the table's pick for it with
  `for "kangkong"`; one tap opened NEW FOOD named Kangkong; ADD saved
  `src: 'usda'`, every figure as the table has it, and a fills entry, then
  went on to Bought. "banana" put Bananas, raw first. One letter showed no
  group. The data was fetched once, as `foodtable-data.js?v=<STAMP>`, and
  not before a picker opened.
- A table that cannot load: "The food table downloads the first time you
  have signal." in the picker and the chooser, SCAN still offered. No
  `foodtable.js`: no group, the chooser SCAN only. No page errors anywhere.
- `_review.html`: Chromium 142 of 142 at 390 and 1280; WebKit 141 of 142,
  the one known foundation failure in the root brief.

**Not watched:** an iPhone (the keyboard on the chooser and the grams box,
a real long press in Safari), a real camera, a real Open Food Facts answer
for a fill, a food deleted while planned in the fill list.
