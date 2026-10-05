# FOODDÉX (CLAUDE.md)

Governs `portion/` only. The repo-root `CLAUDE.md` and `DOCTRINE.md` still apply
and win any disagreement.

## A wide window (1.0.11, 2026-10-05)

**On a wide window, lay things out side by side; never fold text.** Tom,
2026-10-02/04: "minimize the need for scrolling", yes to apps using the
width, no to hiding text behind "show more". On his 3840x1080 screen the home
screen gives FOODDÉX a 1928 x 943 frame (1600 at the least).

Past 1600px only (the `@media (min-width:1600px)` block after the 1300px one):
the row runs to 2400px as label 6 : amounts 4 : foods 9, and the save bar
follows it. YOUR FOODS lays its list two across in a grid (`.foods`), ranked
across then down so the best answers stay together at the top; a name too
long for its half wraps instead of being cut. THE LABEL is a two-column grid
in which everything spans both except Name and Brand (`.half`, placed with
`grid-auto-flow: dense` so the duplicate-name note still sits under them),
and its figures run four or five to a row. Below 1600px nothing changed:
every element in `#main` has the same box, and the screenshots are byte
identical, at 390, 1000 and 1280.

Measured with the demo, `main`'s scroll height over the window height,
before and after: 1928x943 1.85 to 1.20; 1600x943 1.85 to 1.32; 1920x1000
1.74 to 1.13; 1280x943 2.67 unchanged; 390x844 4.68 unchanged. Watched at
1928: a duplicate name shows its note under Name and Brand, a food clicked
in the two-across list opens, no console errors.

## SCAN (1.0.10, 2026-09-30)

Tom: "ok include". SCAN sits beside LOOK IT UP and opens KITCHEN's barcode
sheet (`../kitchen/barcode.js`; the camera, zxing and Open Food Facts are
described in `kitchen/CLAUDE.md`, SCAN). Then, in `fillFromOff`:

- **A code already on a food** opens that food for editing.
- **A new bench** is filled the way a USDA pick fills it: name, brand, 100 g
  or 100 ml, the eight boxes from the pack, a box the pack does not carry
  cleared, every other figure in `L.more`, `L.src = 'off'` ("from Open Food
  Facts", and "Open Food Facts, corrected" once a figure is typed over).
- **A saved food open for editing is only topped up**: a box with a number
  keeps it, an empty box is filled scaled to the food's own serving (330 ml
  gets 3.3 times the per-100 figure), and `L.more` holds only what the row
  does not carry. Writing merges into `base` and never rebuilds it (root
  brief). A food per serving, or in a different unit, is not filled; its
  barcode is kept. A food already tied to another barcode refuses the new
  one ("Press NEW to scan a different pack.").
- The code rides in `L.barcode` (the draft and the load carry it) and lands
  on the row as `barcode` on save.
- **Watched 2026-09-30** at 1440 wide by pressing SCAN, typing and LOOK UP,
  against the real Open Food Facts: Nutella's code opened the saved Nutella;
  a new bench filled from 737628064502 (a UPC-A) with seven extra figures and
  potassium left blank, saved with its code; a hand-typed 330 ml cola kept its
  139 kcal and gained six empty figures, carbs 35 and sugar 35 among them; another pack on it
  was refused. Not watched: a camera, an iPhone.

## History, moved from the root brief on 2026-09-22

What was built and watched, newest last. Moved here verbatim so the root brief
stays small enough for per-module sessions.

FOODDÉX on screen since 2026-09-14; the folder and id are still `portion`. Built 2026-09-05, made a desktop app 2026-09-06. Tested in the browser. A bench for building food entries and a viewer over the ones you have. Paste or type a label; it says how much of it hits 50g of protein or any other number, in grams or in pieces, what that comes to and what it costs. Saves the answers as ordinary servings, so STATUS logs them in one tap. Hands the entry over as words to paste into somebody else's tracker or as a spreadsheet row. Ranks the whole library against whatever amount is on screen, which is the comparison. Searches, edits and deletes; refuses to make a second food with a name you already have. Reads Sodium, or converts Salt where a label prints that instead. Tom only, kept out of the client build by `tools/build-client.py`.
