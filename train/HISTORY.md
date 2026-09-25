# TRAIN, the diary

The build stories, moved out of `CLAUDE.md` on 2026-09-25 when the brief passed
20 KB. **`CLAUDE.md` beside this is the rules and is loaded every time. This is
read only when working in the corner it describes.** Newest last within each
part.

---

## What is built, as of 2026-09-14

Everything below was driven in the browser against his real backup, at 375px
until 2026-09-14 and at 390px since, except where a row says otherwise.

| Area | Built |
|---|---|
| Training log | Session strip, cards, comments, warmups, timer card, set by set change on every set, category shown as nothing, a name, or name and colour, set limit, superset tags, skip empty dates, session card with SHARE PICTURE |
| Blocks and names | Blocks created, edited, ended and deleted with an undo; names offered, carried by a copy, compared by name inside the block first; a day picked to compare with |
| Weekly | This week and any before it, sets per muscle and sessions that hit it, eight weeks side by side, SHARE PICTURE |
| Profile | All-time totals, the current block, all blocks, All-Time and Block Records |
| Setup | Toggles and settings per exercise, recorded per set, carried forward |
| Exercise list | Favourites, categories in his order, search, sort by last used, create, edit, delete with its sets and an undo, categories created, edited, recoloured, reordered and deleted |
| Exercise editor | Name, category, new category, all six types, weight increment, rest time, second muscle groups, delete |
| TRACK | Steppers for whichever two fields the type logs, SAVE keeps the numbers, UPDATE, CLEAR, tick box, comments, warmups, copy set, delete, last time, auto-select next set |
| HISTORY | Newest first, 100 workouts at a time |
| GRAPH | `chart.js`, per type: estimated 1RM, max weight, volume, max reps, reps, distance, time; five periods; points, trend line and y from zero as settings; expand; graph points listed; default graph per exercise |
| Records | Actual and estimated records, rep max grid with his rep counts and a favourites filter, per-exercise record sheet with record history |
| Overview | Totals, first and last date, notes |
| Calculators | Estimated 1RM with rep maxes and percentages; set calculator rounded to the increment; plate calculator one unit system at a time |
| Timers | Rest timer bar and sheet, per-exercise rest time, auto start; workout timer auto start and auto stop |
| Supersets | Create, rename, delete, jump to next exercise, rest held until the round ends |
| Calendar | Months to scroll through, category dots, category filter, workout count, pick mode for copy and move |
| Copy and move | Copy Previous Workout, Copy Workout, Copy This Workout, Move Workout, each with FitNotes' options |
| Routines | Routines, days, exercises; don't populate, copy previous sets, or predefined sets with blanks copied from last time; LOG ALL; tap to log one; rename, copy, reorder, delete |
| Goals | Weight for reps, end date, progress from the best set at those reps, edit, reorder, delete |
| Analysis | Breakdown by category or exercise over five periods; workout graphs per week, month and year for workouts, sets, reps, volume and time |
| Settings | Every FitNotes setting TRAIN has an equivalent for, plates and bars, categories, re-calculate records, delete workout history, import |
| Keep screen on | Wake Lock, re-requested when the tab comes back. **Not verified**: the test page was hidden, and a browser grants the lock only to a page on screen. Tom's phone is the test |

### Not built

- A per-exercise weight unit (FitNotes Supporter's "custom weight units"). All 270
  of his exercises use the default, so nothing of his depends on it. **Built in
  1.0.34, 2026-09-25**, when Tom asked for it.
- Showing body weight above the workout log. Off in his FitNotes; would read STATUS.
- Saved graph favourites beyond one default per exercise.
- The calendar's detail panel under the grid. Off in his FitNotes.
- A confirmation when an exercise's type is changed. The data is kept either way.

---

---

## Send To Coach, over the shelf (1.0.18, 2026-09-23)

Tom, 2026-09-23: *"We should put an upload to coach function in train."* And,
on where it goes: *"Maybe in post workout share menu."*

The button does the same thing it always did from the client's side. What
changed is what it produces.

- **It uploads.** `Cloud.send('train', bag)` puts the same bag the file always
  held on the coach's shelf in the database, `drop/coach/<the client's own
  account>`. The rules are what make that safe, and `CLOUD.md` holds them.
- **The file is the fall-back, not the past.** Opened from a folder, not
  signed in, no signal, Firebase blocked: the file is made exactly as before
  and the message says a file was saved instead and why. Hard constraint 4.
  Do not delete that path.
- **It still sends everything, never one day.** COACH merges on `updated_at`,
  so a whole send costs nothing and a partial one is how the days around it go
  missing.
- **It is on the session menu now as well as Profile.** The moment a client
  would send is the one they just finished, so it sits under Share As Text.
- **Nothing leaves the phone until it is pressed.** That is the rule Tom kept
  when he chose this over a live feed off a client's phone, and it is not a
  detail to optimise away later.

Watched 2026-09-23 in the browser: signed out, the menu item made the file and
said "not signed in"; with the upload answering, it sent the bag, no file, and
said so; with the upload refusing, the file came back with the reason. COACH
took the same bag off a stubbed shelf and it landed as that client's rows.
The real database has never been in the loop — nobody has signed in.

## Opened straight into the import (1.0.20, 2026-09-24)

Tom, 2026-09-24: *"Bring back the upload training data function from the most
common apps, and fitnotes."* Nothing was rebuilt. The importer was already
here and already client-aware; what was missing was a way in from a client's
profile, where a new client's history actually arrives.

- **`&import=1` on the address opens the panel**, once, after `boot`. COACH's
  IMPORT THEIR LOG on a client profile opens
  `train/index.html?client=<pid>&import=1` in the frame it already uses for
  LOG A SESSION.
- **It waits for the store**, like everything else in `boot`. An import that
  cannot see what is already here would write a second copy of it.
- **The panel says whose log it is** when `CLIENT` is set. A FitNotes backup
  dropped into the wrong log is thousands of rows to undo by hand, and the
  two logs look identical once the frame is open.
- **Nothing in the importer changed.** `importFitNotes` already goes through
  `TRAIN.mergeImport`, which maps, and `importCsv` writes through `Rec.set`,
  which the adapter replaced. `assertTick` is a no-op on a client, because
  `tick` is dropped there.

Watched 2026-09-24 from COACH: the panel came up over the client's profile,
a five-set CSV with a comma inside an exercise name imported as that client's
rows, weights read as pounds and stored in kilograms, and Tom's own `set`,
`exercise` and `tick` counts did not move.

---

## The training screen, four complaints (1.0.21, 2026-09-24)

Tom sent four in one message, with a photo of TRAIN beside one of FitNotes.

- **The name no longer gets cut in half.** *"I don't want the name of the
  movement clipped, dynamic font sizing."* The font sizing was the smaller half
  of it: the bar's `.spacer` is `flex:1` and so is a title, so the two of them
  split the free space and "Cuffed External Rotation" was given **81px of bar
  beside 73px of nothing**. The spacer stands down whenever there is a name.
  Then `fitTitle` steps the name down the type scale on one line, and when one
  line cannot hold it at a size worth reading it takes **two lines rather than
  shrink further** — two lines of 16px are 35px against the icons' 44, so the
  bar does not grow. Measured at 390px: "Cuffed External Rotation" 16px on two
  lines, "Bench Press" 18px on one, a 43-character name 12px on three with the
  bar one pixel taller. None clipped.
- **Hold an exercise to move it.** *"I shouldn't have a specific re order
  button, why didn't we copy the hold to rearrange function?"* The drawer's
  Reorder mode and its up and down arrows are gone. A press and hold picks the
  row up and the new order is read back off the page when it is dropped. The
  menu the hold used to open keeps two ways in, so DOCTRINE laws 6 and 14 both
  still hold: a menu button on the row, and a right click. A thumb that moves
  more than 10px inside the half second is scrolling and nothing lifts; a mouse
  drags on the first few pixels without waiting. `dragRows` is wired once, on
  the list, because the list survives every repaint.
- **A saved set does not tick itself.** FitNotes does not tick one either, and
  his photo of it says so. `done` is now the box and nothing else; `plan` says
  a set was written on his behalf. A plan reads in muted numbers, because with
  the auto-tick gone that is the only thing left telling a plan from work.
- **A new exercise keeps what he typed**, the way saving a food does in STATUS.
  The button under the search box reads `+ CREATE "Cuffed External Rotation"`
  and the name arrives in the dialog. The More menu's Create New Exercise
  carries it too.

Watched 2026-09-24 in the browser at 390px, driving the real controls: the
title measured against three names, a saved set coming back unticked and still
counting in the session card, a copied day counting for nothing until UPDATE,
a hold-and-drag reordering the drawer and writing `session.order`, a scroll
lifting nothing, and both menus opening. `_review.html` 116 of 116 at phone and
desktop width. **Not opened on the iPhone.**

## Cramped, six causes, all six fixed (1.0.22, 2026-09-24)

*"Train is way too cramped, look at fitnotes and how elegant/seamless it
feels."* A vague visual ask, so it went back as six named causes and a mockup,
and he answered "1, 2, 3, 4, 5, 6 — do all of them".

1. **TRACK has no cards.** The steppers were one card and the day's sets were
   another, each with its own padding inside the page's own margin, so the
   numbers sat 28px from the edge and the screen read as boxes inside boxes.
   Both are `.trackbox` now, flat on the page with one hairline between them.
2. **The rest countdown lives in the top bar.** The band under the tabs cost
   55px of a 844px screen the whole time he rested. `.restchip` stands exactly
   where the rest timer's own button stood and hides that button while it
   runs, so the bar does not change width and resting costs no height at all.
   It still shows on every screen, because he leaves the exercise mid-rest,
   and it still counts past zero. `drawRestBar` runs four times a second, so
   it rebuilds nothing unless the chip has just come or gone, and it refits the
   title when it does.
3. **The last time line wraps to two lines.** This reverses his own
   instruction of 2026-09-22 ("one line, cut off with an ellipsis"): he saw it
   cut a number in half. Two lines, still small and faded, clamped.
4. **A set row is 44px, not 61.** The comment bubble and the tick box were each
   a full 44px tall inside 8px of padding. Both carry `mb-tap`, which keeps the
   44px target while the drawing shrinks, so they draw at 32 and the row is
   exactly the 44 the rules ask for. Measured: four sets on TRACK no longer
   scroll at 390px.
5. **SAVE is the accent, CLEAR is quiet.** Green and blue are FitNotes' colours
   and belong to no theme here, so the two buttons looked imported from another
   app. SAVE takes two thirds, CLEAR one.
6. **The steppers came down a size.** 44 x 44 outlined buttons in place of
   48 x 52 filled, the number at 30px rather than 36, and the number takes the
   room between the buttons instead of a fixed 8ch so it is centred however
   wide it is. `min-width:0` on the input, which is the flex-input trap.

The field label's hairline went from 2px to 1px in the same pass, since it sits
directly above the steppers and was the heaviest line on the screen.

Watched 2026-09-24 at 390px: rows 44px with 44px tap targets measured off the
`::after`, TRACK's scroll height inside the viewport with four sets, the chip
at 56 x 44 with the header still 61px and the scrolling area unchanged while a
rest runs, the chip turning warn-coloured and counting up past zero, surviving
a move to the day screen, and its menu opening. `_review.html` 116 of 116.
**Not opened on the iPhone.**

## Rest stops at zero, and search got loose (1.0.23, 2026-09-24)

**The countdown no longer counts up.** Tom: *"I don't want to see the over
timer in TRAIN."* It rings once and the chip goes; the rest timer button comes
back in its place and the stored `train.rest` is cleared. The part that
mattered is untouched: the clock still decides, so a tab suspended past the end
comes back, rings and clears rather than resuming where it froze. Watched with
a 3-second rest, with a stored rest 45 seconds past its end, and with one 11
minutes past. The `.restchip.over` colours and the menu's Restart item went
with it.

**Searching for a movement is five routes, scored.** Tom: *"Make the search
function more flexible."* It was a plain substring of the lowercased name, so
"press bench" found nothing, "pull up" missed "Pull-Up" over a hyphen, and "bp"
missed "Bench Press". `TRAIN.nameMatch(name, q)` returns a score or -1, and all
three exercise searches use it: the picker, Records and the rep max grid. Best
match first while he is typing, his own order otherwise.

| Score | Route |
|---|---|
| 100 | the whole name |
| 90 | the name starts with what he typed |
| 80 | what he typed, in order, anywhere in the name |
| 70 | every word he typed starts a word of the name, in any order |
| 60 | the same, but his word may sit anywhere inside a name word |
| 50 | his letters are the name's initials: bp, ohp |
| 20+ | his letters in order but not together, plus one for each landing on the start of a word |

Punctuation and accents come off both sides first (`fold`, `words`), so a
hyphen never costs a match, and each query word is spent on one name word so
"press press" cannot land twice on the same one. The loosest route needs three
letters, or two would match nearly every movement in the list.

Measured against the 111 seeded movements: "press bench" gives the four bench
presses at 70, "pull up" gives Pull Up at 100, "bp" the bench presses at 50,
"ohp" Overhead Press first, "lat pull" Lat Pulldown at 90, "rdl" Romanian
Deadlift and Rear Delt Fly at the top. **Not typo tolerant**, deliberately:
"benhc" finds nothing, because edit distance would also start matching things
he did not mean.

`MARKS`, the accent regex, is written as an escape rather than the characters
themselves. A Python patch script ate the escape once and wrote two invisible
combining accents into the file instead. Known traps, backslashes in a patch.

## Twelve muscle groups (1.0.24, 2026-09-24)

Tom: *"Add Forearms, Calves, Hamstrings, Glutes, Lower Back."* Seven groups
meant a leg day was one bar on the week's sets per muscle and said nothing
about whether he had trained hamstrings at all.

- **Twelve is the ceiling, not a coincidence.** A group stores a slot, and
  there are twelve: six chart colours in two tints. A group's slot is its place
  in `DEFAULT_CATS`, so the order there decides the colours. As it stands Legs
  and Hamstrings come out as two tints of one hue, and so do Core and Lower
  Back. **A thirteenth group would have to share a colour with another.**
- **The movements moved rather than multiplied.** A starter exercise's id
  comes from its NAME (`TRAIN.seedId`), so moving one between groups in
  `DEFAULT_EX` is the same exercise in a new place. Legs went from 22 to 13,
  Back 18 to 16, Arms 18 to 15, and ten new movements came with the new groups
  (Nordic Curl, Reverse Hyperextension, Plate Pinch and so on): 121 starters,
  no duplicates, measured on a fresh store.
- **`TRAIN.catId`** slugs a group's name into its key. Every name before today
  was one word, so this is the same string `nm.toLowerCase()` gave; "Lower
  Back" is the first that needed a hyphen rather than a space.
- **`TRAIN.fillCats` is how an existing log gets them.** `seedCats` runs only
  on a store with nothing in it, so a new group would never reach a log that
  already exists, which is every log that matters. `fillCats` adds any standard
  group that is missing and **moves no exercise**: which group a movement
  belongs to is his call once he has one.
- **A group he deleted stays deleted**, by `Rec.tombstone`, not by a setting
  remembering what this device wrote — a setting is one row, so two devices
  each keep only the later one's list. Known traps, the setting that remembers.
  For the same reason it runs inside `Rec.ready`, when every device's
  tombstones are in.

Watched 2026-09-24: a fresh store seeds 12 groups and 121 movements with no
duplicates; a store seeded before today gained the five as empty groups with
nothing else touched; a deleted group did not come back across a reload; and a
day of Romanian Deadlifts and calf raises reads "Hamstrings 2, Calves 1" on the
session card where it used to read "Legs 3". `_review.html` 116 of 116.

**His own 270 are not re-sorted.** Every exercise from his FitNotes backup
keeps the group it had, so the five start empty on his device and he moves what
he wants into them.

---

## History, moved from the root brief on 2026-09-22

What was built and watched, newest last. Moved here verbatim so the root brief
stays small enough for per-module sessions.

Built, and tested in the browser at 390px against Tom's real 12,370-set FitNotes backup; the phone itself is his iPhone 13 Pro, and nothing has been watched on it yet. A reproduction of FitNotes v25.1 on the shared foundation, plus Tom's own idea of training (2026-09-14): sessions with names and training blocks, each working set compared with the same set last time in reps and percentage, a session card and a weekly card that share as story pictures, sets per muscle per week, a Profile with all-time and block records, and setup recorded per set. Warmups and split sets are read from comments. Says session and training, never workout. Owns the training log. Has its own brief.

---

## Moved from the brief on 2026-09-25

## Provenance

Everything about how FitNotes behaves was read out of the app itself,
`com.github.jamesgay.fitnotes` v25.1, and out of Tom's own backup file:

- the full SQLite schema, 20 tables, column by column
- all 44 columns of the `settings` table, which is its settings screen
- every user-facing string, several thousand
- the SQL FitNotes uses for personal records and routine loading
- nine screenshots of FitNotes on his phone (no longer in Downloads)
- **his file's own answers**, where the app could not be read: which records it
  flags, which day a week starts on, what happens to a deleted set's comment

What was **not** taken, and must never be: FitNotes' compiled code and its image
files. The APK holds obfuscated Android bytecode and the target is one HTML file
of plain JavaScript, so nothing in it would have transferred anyway. Every line
in `train/index.html` is written here.

## For the foundation

Found while building TRAIN. TRAIN never edits `shared/` or the root; it works
around what it finds and writes it here.

**Fixed by the foundation session of 2026-09-14, and TRAIN's workarounds deleted
the same day:** the minus, trophy and hamburger icons (TRAIN's `MINUS`, `TROPHY`
and `BURGER` drawings are gone), 38px segmented buttons, the desktop menu that
could not be clicked (`menuAt()` no longer stops the press), chart steps past
5000 (`bigStep()` is gone), `UI.row` squeezing a text box's label to 0px (TRAIN's
`:has()` rules for `.mb-input` and `.mb-sel` are gone; the ones for its own
swatches and chips stay), and sheets in `vh`.

**Settled 2026-09-15:** `ui.js` adds its stylesheet when it loads, so the chip
that came up as a bare browser button on the exercise screen is styled and
TRAIN's throwaway switch at boot is gone. DOCTRINE's TRAIN entry, the root
ownership table and the root Current state row were brought up to date by a
session Tom sent to the root.

**Still open:** nothing.
