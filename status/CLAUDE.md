# STATUS (CLAUDE.md)

Governs `status/` only. The repo-root `CLAUDE.md` and `DOCTRINE.md` still apply
and win any disagreement.

## History, moved from the root brief on 2026-09-22

What was built and watched, newest last. Moved here verbatim so the root brief
stays small enough for per-module sessions.

**Rules kept from the build stories** (the stories: HISTORY.md: History).

- Counting calories is a switch (Settings, Track, Count calories, per device). Off, the calorie and protein pillars leave the grade and the `sentfood` field takes their place; the Food tab and the Protein tile go with them.
- The desktop half exists only with `?desktop=1` (STATUS.exe): the widget strip, the status check and desk time (`screen`, `deskon`). A phone or browser tab writes none of it.
- The status check never goes away until answered: whole screen, no close, no Skip, no give-up timer; SAVE is the only exit. One per night in quiet hours; the phone check is a setting, off by default.
- A food label is read in the unit it is printed in (`UI.amount`, `NUT_UNIT`); a box is rewritten on leaving so the conversion is seen.
- A blank food figure is not known, never 0: left off the meal and the food, shown as `-`.
- A bullet has Start and End (stored as `at` and `dur`) and a mood; BULLETS settings switch times and mood off whole or per kind (`Journal.asks`). A bullet mood is also a Mood reading.
- Report past 1024px is CSS columns; Day keeps one column. `draw()` holds a draw that arrives mid-draw (`drawOnce`).
- Install files: `status/manifest.json` and its icons.

## Rule, Tom, 2026-10-02

**On a wide window, lay things out side by side; never fold text.** Said on a 5120x1440 screen where the home screen gives STATUS a 2560-wide frame: "minimize the need for scrolling", yes to "apps use the width", no to hiding anything behind "show more". The phone layout does not change for any of it.

1.0.66, 2026-10-08: Food's Logged card is a table. Tom: "Food entry in the logged island can be ready to input blank fields. Name, Protein, Carbs, Fats, Cals. 5 blank entries, with there always being 1 blank entry if they all get filled." Rows = max(5, meals + drafts + 1). His answers, binding: a typed row saves when he LEAVES it (one check per leaving, `r._t`; a name and one number, else a dashed draft in `FOOD_DRAFTS`, page memory only); a blank Name searches as you type (saved foods open `amountSheet`, past one-offs fill the row; suggestions keep the caret with mousedown preventDefault); a name left matching a food or one-off exactly fills the numbers (a food from its default serving); a meal with `fid` (or KITCHEN's) shows locked numbers and only its NAME is editable, tap opens `mealSheet`; blank Cals = 4/4/9 from the macros, stored with `kx: 1` and drawn as the box's dim placeholder; Save to foods in `mealMenu` for a typed meal (does not relink the meal). `draw()` waits while the caret is in `.fgrid` (`foodBusy`) and runs when it leaves; a commit while the caret moved to another row redraws only that row, the totals card (`foodSumCard`) and the Logged sub. Classes are `logrow`, not `frow`, which the field editor already owns. One-off button hidden in 1.0.65, its own commit. Driven by typing in headless Chromium 390 touch and 1280 and WebKit 390; review 142/142 Chromium, WebKit 141/142 known. Not on the iPhone.

1.0.67, 2026-10-08: the Trained tile reads TRAIN. Tom: "I trained according to my oct 4 TRAIN, its not reflecting as a tick in my STATUS". Commit 879eafc (2026-09-18) taught `logged()` that a day with TRAIN sets or a session is trained, but the tile, the 28-day grid and the export read `value()`, which only counted his own taps, so every TRAIN day showed a dot. `value()` now returns 1 for a check field named train* on a day TRAIN has sets. His data was never wrong: Oct 4 had 21 sets and TRAIN's tick. Driven on the demo: ✓ on a set day with no tap, · on a rest day; review 142/142 Chromium, WebKit 141/142 known.

1.0.68, 2026-10-09: the Food tab fits a phone. Tom sent a screen recording of scrolling Food and asked "What can be done to minimize this scrolling?"; he picked all four of: no title row on the totals card (the big number says it), no Calories bar (the same number), Protein, Carbs and Fat side by side (`.macros3`, label over number, untargeted reads "Xg · Y%"), and "Logged" as the table's Name heading (`foodLoggedHead`, price only when above 0). The calorie band moved to the note ("±N kcal guessed"). Measured in WebKit at 390: totals card 318 to 166px; both cards on an empty day 537px, against about 540 between the date bar and the tab bar in his recording, which also starts the first card 20px under the date bar, so an empty day may still scroll a few pixels on his phone. Each logged meal row is about 21px taller than a blank one (its grey time line). Review 142/142 Chromium, WebKit 141/142 known. Not on the iPhone.

1.0.69, 2026-10-09: Food's table made pretty. Tom: "is this the prettiest way to do it?", then picked A C D E F (not B: the grey time line under a logged meal STAYS). A: a logged meal (`.logrow.meal`) draws its boxes transparent until one is focused, so it reads as a plain list; its time line is pulled up under the name (`margin-top: -s-3`). C: a blank row's boxes are faint underlines, Name says "+ add food". D: the blank row's last cell (`.fend`) is underlined too, so every row ends at the same edge. E: on Food only, the + button hangs in the gap between the cards (`.seam.gap`), clear of the totals card's last line (measured 1px clear at 390). F: Log food is an outline (`.btn.line`). Drafts keep their dashed boxes. Looked at in WebKit at 390 and the typing drive rerun; review 142/142 Chromium, WebKit 141/142 known. Not on the iPhone.
