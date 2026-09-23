# SHARED — history (HISTORY.md)

The diary for `shared/` and the root: what was built and watched, newest last.
Moved out of `shared/CLAUDE.md` on 2026-09-24 so the brief stays rules only.
The numbered items under "Foundation, found and not acted on" are the ones
other briefs cite as "foundation item N". Keep the numbers.

### Debt, in the order it should be paid

1. ~~The old blob kernel~~ **Done 2026-08-20.** Kernel v2 is a view over
   `records.js`; the apps kept their API and did not move. First load copies the
   old `lifeos_v1` blob into rows and leaves it in place as its own backup.
2. ~~ARC carries its own copy of the theme engine~~ **Done 2026-08-26.** It
   reads `shared/skins.js` and went from ten themes to eighteen, keeping its
   own per-theme colour editing. BLOCK and FORM went onto it the same day.
   HABITS was the only app left off it, and was deleted on 2026-09-14.
3. ~~The apps still carry their own settings, themes and sounds~~ **Done
   2026-09-22.** Every app uses `UI.settings` and `skins.js`; BLOCK was the last
   on its own sound and moved to `sound.js` in 1.0.16.
3b. ~~Apps not loading `shared/mobile.js`~~ **Done 2026-08-20.** Every app
   loads it and every viewport covers the safe area. What is left is per-app:
   auditing each one's own CSS for hover-only controls and sub-44px targets,
   which the shared layer cannot do for them.
4. ~~Commits are unpushed~~ **Settled 2026-08-26.** Tom: "push - always push
   without me asking". The main repo is pushed after every commit. See the
   end of this file for the client copy.

### Foundation, found and not acted on

Recorded 2026-09-06 on Tom's instruction: "Save all things that affect
foundation for now." Every one of these is in `shared/` or at the root, so an
app session must not touch them. They are written down here because commits and
this file are the only handoff there is. Each says what was watched, not what
was suspected.

**2026-09-14: a foundation session worked through this list.** Items 1, 6, 8,
9, 10, 11 and 12 are fixed, plus three things TRAIN found (13). A fixed item
keeps a short entry, because most of them left a workaround in an app that an
app session now has to delete. Item 14 lists those.

**1. ~~The store can wait forever~~ Fixed 2026-09-14.** `hydrate()` in
`records.js` stops waiting after 2.5 seconds: `Rec.ready` fires on what
localStorage had, `Rec.stats().idbSlow` says so, and the big rows merge in and
announce whenever IndexedDB does answer. Writes are untouched; they queue on
the same open and land when it does. Watched: a frame whose `indexedDB.open`
never answers fired ready at 2514ms with its localStorage rows. Not a smoke
check, because proving it costs two and a half seconds per run. There is still
no `onblocked` handler; nothing has been seen to need one.

**2. ~~First paint should not be behind `Rec.ready`~~ Closed 2026-09-15.**
STATUS draws what localStorage already holds after 300ms and ARC loads the fast
half synchronously, both done earlier by their own sessions; TRAIN was the last,
and now does the same: if the store has not answered in 300ms and there is a
log, it draws, and seeding and the record pass still wait for ready. Watched in a
frame whose IndexedDB never answers: TRAIN had drawn at 900ms, ready came at 2.5s.

**3. ~~`Rec.patch`, so merging is easier than replacing~~ Built 2026-09-14,
Tom said yes.** `Rec.patch(type, date, key, changes)` reads the row, changes
only the fields it is given and writes it back. The two open questions,
decided by Claude: a dotted name reaches into a nested object
(`{'base.ca': 120}` leaves the rest of `base` alone), and a value of
`undefined` removes a field. A row that is not there is made; a patch that
changes nothing writes nothing. Five smoke checks. No app calls it yet: moving
the apps that rebuild rows by hand onto it is each app's own job.

**4. ~~A cross-device merge is whole-row~~ Closed, found 2026-09-15.** It was
fixed on 2026-09-15 by `9d55433`: a row that has been edited remembers when
each field changed, and two devices' copies merge a field at a time, so a
laptop's rename and a phone's protein edit both survive. See FIELD TIMES in
`records.js`. This entry stayed open by mistake.

**5. ~~Cache-busting is inconsistent~~ Settled, found 2026-09-15: no app carries a `?v=` stamp any more, the "none of them do" half of the choice below, and the client build stamps its own.** Counted 2026-09-14: `log/`, `style/`
and `wealth/` load shared at `?v=16`; `_template/`, `checkin/`,
`portion/` and `quest/` at `?v=15`; the home screen, STATUS, TRAIN, BLOCK, ARC
and FORM carry none. Fixing it touches every app folder, so it wants a moment
when no app session is live. Harmless from a folder, where
nothing is cached. It matters the day hosting returns, because the known trap
says "bump the version" and there is no one version to bump. Either every app
carries the same stamp or none of them do.

**6. ~~`_review.html` reports leftover test rows too eagerly~~ Fixed
2026-09-14.** It counted rows, and one run writes more than its limit of 12.
It now asks about age instead: a test row still live ten minutes after it was
written was left behind, and the failure names the types.

**7. ~~Still open from 2026-09-04~~ Closed 2026-09-15: all three pass on a store wiped empty first.** the three icon checks that fail on a cold
store and pass on the second run. Recorded under Testing above; unchanged.

**8. ~~`shared/chart.js` cannot draw money~~ Fixed 2026-09-14.** Its step
table stopped at 5000, so eighty thousand pesos drew seventeen gridlines. Past
the table the step now carries on as 1, 2, 2.5 and 5 times each power of ten.
Smoke check: "money in the tens of thousands still gets a readable scale".

**9. ~~`UI.segmented`'s buttons are 38px~~ Fixed 2026-09-14.** They are
`var(--tap)`. Every segmented strip in every app is 6px taller, which nobody
has looked at on a real screen yet.

**10. ~~The review checks a purchase's account against the wrong form~~ Fixed
2026-09-14.** It accepts an account's key or its name, since STATUS writes the
name.

**11. ~~A desktop menu closes before its item can be clicked~~ Fixed
2026-09-14.** Written down twice the same day, by WEALTH and by LOG. The
listener now ignores presses inside `.mb-menu` and is removed when the menu
closes. The smoke check presses an item and then clicks it; with the old
listener put back, that check fails, which was tried. Not watched with a real
mouse.

**12. ~~`shared/` still names HABITS~~ Fixed 2026-09-14.** All four leftovers
are gone. The dock check now lists the twelve apps on the home screen, and
LOG, QUESTS, CHECK IN, WEALTH and FOODDÉX have app icons for the first time: a
book, a tick, a camera, a banknote and a bowl. Until now the dock drew a plain
character for each. Claude picked those five; change the role in `icons.js`
if one reads wrong.

**13. Found by TRAIN, fixed 2026-09-14.** One: `icons.js` has `minus`,
`trophy` and `burger` drawings, under the roles `minus`/`less`,
`record`/`best`/`pr` and `nav`/`drawer`. Two: a `UI.row` whose control is a
text box or a select puts the label above it, instead of squeezing the label
to 0px at every width. A box with its own `max-width` stays beside its label.
Settings rows with a select change in LOG, STYLE, WEALTH and TRAIN. Three:
sheets use `svh` after `vh`, so on iPhone Safari they stop at the visible
screen rather than under the toolbar. Not seen on a phone.

**14. ~~Workarounds an app session can now delete~~ Closed 2026-09-15.** LOG's
`menuAt()` and CHECK IN's `menu()` were already gone; WEALTH's `menu()` now only
places the menu beside what opened it, which is its own job. The stepper minus in STATUS
was found already drawn with the shared `minus` icon when Tom asked
for it on 2026-09-15.

**15. ~~STATUS's journal code lives in several copies~~ Moved 2026-09-14, Tom
said yes.** `shared/journal.js` holds the kinds, the day rule, the time parser,
the clock labels, the publish steps, repeats and the tick. STATUS, LOG, QUESTS
and the home screen keep their old function names as one-line pointers to it,
so nothing that called them changed. LOG's copy had drifted: it published a
todo due next week as an event on the day it was written, and now it does not.
Two things stay per app on purpose: QUESTS's reader for dates typed anywhere in
a line, and LOG's caffeine half-life sum, still a copy of STATUS's.

**16. ~~A row deleted on the device came back from the sheet~~ Fixed
2026-09-15, `io.js` 0.1.10.** Tom: "deleting bullets not getting saved". The
delete itself was fine and survived a reload. A delta push never takes a line
off a tab, so the deleted bullet's line stayed on the Journal tab, and the
next pull that read the tab took it for something typed into the sheet and
wrote it back alive. Same for a deleted food, meal, spend or tracked field,
and on the second device too, because the tables were applied before the
save file carrying the tombstone. Now a line whose row is a tombstone here
stays deleted unless it was typed into after the delete, a delta push sends
a delete up as an emptied line, and a pull merges the save file first.
`Rec.tombstone` and `Rec.tombstones` are new. Three smoke checks. Watched in
the browser against STATUS's real Journal table; not watched against the
real sheet.

**17. A sweep of every shared module, 2026-09-15, `io.js` 0.1.11.** Tom:
"do a sweep of all our modules for bugfixes." Every file in `shared/` was
read end to end. Five fixes, each watched in the browser: `Mobile.hold`
opened a menu twice on Android (the timer and the browser's own context-menu
event); `Mobile.swipe` left a page-wide listener behind per row per redraw;
`Rec.reload` could lose a big row still queued for IndexedDB (queued writes
go first now); `Journal.publishTimed` timed a todo on the day it was written
and never on its due day; `Health.check` counted a bill due next month as a
future-dated tick. Three smoke checks. Read and found sound: `day.js`,
`sound.js`, `chart.js`, `icons.js`, `skins.js` (one unescaped theme name in
the picker, fixed), `ui.js`. Left alone on purpose: `UI.smartTime` reads a
bare "12" typed over a morning time as midnight, which is arguable either
way. The three cold-store icon checks (item 7) were still open that
morning; item 18 found them closed.

**18. Finishing the list, 2026-09-15, `io.js` 0.1.13.** Tom: "Finish all the
foundation work". What was done, each watched in the browser:

- `shared/import.js`, new. Brings in a spreadsheet the suite did not write, by
  shape, not by name: a month grid of 1 and 0 becomes ticks, a Weight row or a
  Date and Actual Weight table becomes weigh-ins, a food table becomes foods, a
  spend table becomes money out. It never overwrites, never guesses an
  account, never reads a formula as a record, and leaves out a row dated years
  from the rest of its sheet. One `Rec.merge`, one undo. The home screen's
  DATA panel has "Bring in an old spreadsheet". Tried on Tom's own Excel life
  OS: its calorie tracker's "Actual Weight" column turned out to be formulas,
  a projection, and three spends were typed as 2020 in a 2025 sheet.
- `UI.menu` draws `sub` and `check`. It silently dropped both, so WEIGHT's
  Show range had never done anything when chosen.
- STYLE's editor has a Material switch under FEEL.
- The iPhone home-screen icon follows the theme: a picture per factory theme
  in `shared/icons/<theme>/`, drawn by `tools/make-icons.html` with
  `tools/save-icons.py`, and each app's colour slot now lives in `icons.js`
  (`Icons.appSlot`) so the dock and the pictures cannot disagree.
- Items 4, 5 and 7 found closed and marked so.

Fixed the same day, on Tom's yes, as `reads` (item 19): an app's sync read only its
own `_Data · <app>` tab, so a LOG opened on its own never got STATUS's bullets.

Tabled by Tom on 2026-09-15, "don't touch any apps looks yet": adopting
`mb-card` and `mb-plate` in apps other than the home screen.

**19. Sync reads the apps a view depends on, 2026-09-15, `io.js` 0.1.14.** Tom:
"yes fix LOG's sync". A pull read only the app's own `_Data · <app>` tab, and
every app pushes into its own, so any app showing another app's rows missed
them on a device where that other app was not open. `IO.register` takes
`reads: { status: ['note', 'day'] }`: whose tab, which types. The tab is
downloaded when that app has pushed since this one last looked, by the push
receipt the sheet already keeps, and only the named types are merged. No
change to the Apps Script. Wired: LOG reads STATUS and QUESTS; QUESTS reads
STATUS, LOG and BLOCK's plan; STATUS reads QUESTS, LOG, FOODDÉX and WEALTH;
WEALTH and CHECK IN and FOODDÉX read STATUS; BLOCK reads ticks from STATUS,
QUESTS, LOG, TRAIN and SPEAK.

Found on the way: BLOCK registered `lane`, `item` and `routine` but not
`rhythm` or `plan`, so an Every or Anytime habit and the published plan had
never gone to the sheet. Both are registered now.

### App icon rework, built 2026-09-23

Built into `icons.js` as `APP_ART`: `Icons.svg('app.<id>')` now draws the
picked symbol (currentColor, so a header HOME button follows the text), and
`art: true` draws it in its own colour, which the dock uses. `Icons.appTile`
is the whole framed tile, `Icons.appColor` the colour. Art, so hex on purpose
and no theme redraws it. The old line drawings stay under the same roles for
STYLE and packs. The iPhone pictures were redrawn from it: every theme folder
holds the same tile, inset so iOS rounding does not eat the cut corners.
Not done, and Tom's call: the dock's open-app highlight, tiles and widgets
still wear the theme's chart slot (`APP_SLOT`), not the picked colours.

The history of the picks: Frame: the cut-corner
window (notice.js shape) with a 1.5px edge in the app's colour, on a `#0E141D`
plate, glyph in the same colour. Symbols: RPG inventory items (HOME campfire,
LOG tome, ELEMENT potion and so on); Tom wants more options inside that family
before any are final. Colours go by family, apps that share data share one:
STATUS blue, TRAIN and FORM red, QUESTS yellow, WEALTH and RECEIPTS green,
LOG, ARC and SPEAK purple, CHECK IN and COACH pink, FOODDÉX and ELEMENT teal,
STYLE and NOTICE silver, HOME white. BLOCK is Lego bricks in real Lego red,
yellow and blue, the one multicolour icon. Rejected: drawing-style variants
(line, duotone, solid, angular, pixel); he wants different symbols, not
different pens.

FINAL symbols, 2026-09-23 round three: HOME house, STATUS sheet with three
lines, TRAIN a real 315 barbell (three plates a side), FORM eye, QUESTS "!",
BLOCK Lego (red 2x4, yellow and blue on top), LOG tome with quill, ARC
branching tree of diamonds (lit filled, locked hollow), SPEAK microphone,
CHECK IN portrait, COACH Poké Ball, FOODDÉX open two-panel Pokédex, ELEMENT
mortar and pestle, WEALTH bold $ with two bars, RECEIPTS bill in scanner
corners, STYLE palette, NOTICE the cut-corner window with a title bar and
"!". Round four: style is THIN WITH A SOFT FILL (1.1 line, fill at 22%).
TRAIN's bar is long, at real proportions, and runs near edge to edge;
NOTICE's window fills the tile, its "!" thinner. Colours REPLACE the family
colours above: HOME, FORM, SPEAK, COACH, FOODDÉX, ELEMENT white; STATUS,
QUESTS, NOTICE brand gold; TRAIN and LOG blue; ARC purple; CHECK IN,
WEALTH, RECEIPTS Lego green `#237841` (his pick over dollar-bill green,
knowing it reads dimmer); TRAIN uses the taller-plate barbell;
STYLE colourful (rainbow edge, four paint colours); BLOCK Lego.

Earlier picks, 2026-09-23: STATUS character sheet, FORM eye, QUESTS quest
mark "!", CHECK IN portrait, ELEMENT mortar and pestle, STYLE dye palette,
NOTICE rune tablet (the cut-corner window itself), BLOCK Lego. Asked for by
name and drawn in round two, waiting on his yes: HOME a house or something
main-menu-ish (house, cottage, app grid, menu cursor shown), TRAIN barbell,
LOG tome with a quill, ARC a better skill tree (branching tree, star web,
diamond path shown), SPEAK microphone, COACH Poké Ball, FOODDÉX Pokédex,
WEALTH dollar sign, RECEIPTS bill with a camera. Pokémon art is Nintendo's;
both are Tom-only apps, same call as `creatures.js`.
