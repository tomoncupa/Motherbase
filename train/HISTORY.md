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

## Moved from the brief at the 2026-09-25 wrap

### Personal records, verified against his file

**Verified against his file, 2026-09-14:** FitNotes flagged 537 sets. After
importing, recalculating with this rule changed **0** flags. The rules tried on
the way there, so nobody tries them again:

| Rule | Flagged | Agreeing with FitNotes |
|---|---|---|
| Heavier than every earlier set | 819 | 263 |
| Heavier than anything at these reps or more, at the time | 1,555 | 537, plus 1,018 extra |
| Still standing, weights at two decimals | 537 | 536 |
| **Still standing, weights at three decimals** | **537** | **537** |

### Set comments: 4,297 in the file, 2,240 on sets

FitNotes keeps a comment after its set is deleted. Of his 4,297 set comments,
**2,057 point at sets that no longer exist**, some dated 2019, before his log
starts. **All 2,240 comments that have a set come across.** The import screen
shows both numbers. Earlier versions of this brief expected 4,297 on sets; that
target was wrong.

### Deliberate departures

The ones made so far. Until 2026-09-15 anything not listed here was a bug;
since Tom lifted FitNotes as a hard rule, this is the record of what changed,
not a fence.

| FitNotes | TRAIN | Why |
|---|---|---|
| Body Tracker | Not built | STATUS owns measurements |
| Google Drive backup | Not built | Local only, per the master brief |
| Supporter paywall | Everything unlocked | It is his app |
| Deleting a category deletes its exercises and every set under them | Its exercises move to another category he picks | Four years of sets should not ride on a tidy-up |
| Rest timer rings with the screen off | Rings only while TRAIN is open. **Keep Screen On** keeps it open | A backgrounded browser tab is suspended |
| Double tap a graph to expand | One tap | A double tap on a phone is also a zoom |
| Android back button | `shared/mobile.js` back stack | No hardware button in a browser |
| Its own themes | Motherbase skins | The whole point |
| `routine` | `program` | BLOCK owns `routine` |
| "Workout" | "Session" and "Training": Training Log Empty, Copy Past Session, Training Routines | Tom, 2026-09-14: he trains |
| One set of records per exercise | Straight sets and split sets each keep their own | A set with a rest in it is not the same lift |
| A copied set and a logged set look alike | A plan still waiting reads in muted numbers | With the auto-tick gone nothing else told them apart |
| Records never start again | Each training block has its own; all-time ones stay | Tom, 2026-09-14 |
| No session names, blocks, weekly view, session summary or profile | All five | Tom, 2026-09-14 |


## A wide window (1.0.47, 2026-10-02)

Tom's "option 4" for his 5120 x 1440 screen: apps use the width, side by
side, never folded. TRAIN drew a 640 column at every width and its tab bar
stretched each tab to a third of the window (1146px each at 3440). Measured
in headless Chromium on the demo's Incline Dumbbell Bench Press (16 days),
HISTORY's scroll as screens of the window, before and after:
1280 x 1300 2.80 to 1.06 (3 columns), 1720 x 1300 2.80 to none (4),
2560 x 1300 2.80 to none (6), 1920 x 1000 3.64 to 0.93 (4), 1100 x 900
4.04 to 2.04 (2); 1099 x 900 unchanged at 4.04, one column. Tabs 213px
each, centred, past 720. 390 x 844: log, TRACK, HISTORY and GRAPH
screenshots identical byte for byte; HISTORY 4.31 both times. TRACK and
GRAPH left as one column: TRACK already fits, GRAPH is one chart.

## Sessions without names, and what a trend measures

**Nothing may need a name** (Tom, 2026-10-05: *"All our functions need to
work even if we don't name sessions specfically"*; he named 0 of 41 days
since June). A day with no name is the same session as an earlier day that
shares at least half of all exercises on either (`TRAIN.likeDays`, on
`TRAIN.dayExs`, cached on the index), or, today, one holding every exercise
done so far. `compareCtx` uses those days where a name would go (1.0.52),
so step 2 above, the session card's totals and the story's comparison all
work unnamed. Training Routines lists YOUR SESSIONS: named ones, then up to
six groups of unnamed days done twice or more, under their first two
exercises and "done N times"; a tap copies the latest. On his log since
March, 57 of 86 days have an earlier like day. **Or the same muscle
groups in close to the same amounts** (1.0.53, Tom: *"sessions that share a
close enough movement pattern/muscle group combination"*): sets per group,
alike at 60% (`TRAIN.dayMix`, `TRAIN.sameSession`), 73 of 86 days. Movement
patterns are FORGE's `ftag` and none of his lifts have one. The story's
SESSION VOLUME line compares only sessions like it. **Warmups are not always
the same and not always tagged** (Tom, same day): four ways to discount them
untagged were measured on his log and disagreed (Dumbbell Curl +6% every set,
-1% his usual 4 heaviest, +2% best set, -14% load-weighted). **Tom picked A,
2026-10-06, built 1.0.54: a TREND counts each lift's usual number of sets,
biggest first** (`TRAIN.usualSets`, the median over its last 12 sessions;
`TRAIN.topSum`; `TRAIN.trendVol` for a whole session). GRAPH's VOLUME, YOUR
USUAL N SETS, the story's "Volume +X% over N sessions like it" (no kg figure,
the totals line has it) and Analysis SESSION's trend read it; every total, set
count and Analysis bar still adds every set. His log: Triceps +7 to +13%, Curl
+6 to -1%, Rope Push Down +9 to +10%, Laterals +5 to +2%.
**Replaced 1.0.55 (Tom, 2026-10-06, "do that for graphic and for data
visualization"): TOP 3 SETS, AVERAGE leads and TOTAL WORK sits under it.**
Top 3 is the three biggest sets by weight x reps (reps on a bodyweight lift),
averaged, all of them on a day with fewer (`TRAIN.top3`); untagged warmups and
extra sets cannot move it. Use it for "am I getting better": GRAPH's first
card with SET AS DEFAULT and SHARE PICTURE (shown only while its trend is up),
and the story's "Best sets +X% over N sessions like it" (`TRAIN.sessionTop3`,
each lift's Top 3 added). Total work is every set added, the dose: "am I
doing enough"; GRAPH's second card, and Analysis SESSION's bars and trend.
Read together: total up and top 3 flat means extra sets that are not making
him better. His log, 6 Oct: Rope Push Down total +16% top 3 +7%, Laterals
+5% and -11%, Curl +16% and +15%. `usualSets` and `trendVol` are gone.
**The story line weighs every lift the same (1.0.59, Tom, 2026-10-08, "A").**
Added up in kg, a heavy lift's sets outweighed a light one's about three to
one, so the line reported the heavy lifts. `TRAIN.volSessions` now takes each
lift's Top 3 over its own mean across the like sessions shown, averages those
per session as a percentage, and the trend runs through that; a lift missing
from a session moves nothing. `TRAIN.sessionTop3` is gone. Known limits, told
to Tom: weight x reps rewards reps as much as load, so moving a lift to a
lower rep range reads as a drop; and other equipment (his 4 Oct "machine
here is 1/2 weight") reads as weaker. Comparing only sessions on the same
setup was offered (B) and not picked.

## Strength graphics, as built 2026-10-05 to 2026-10-08


`train/mock-strength-graphs.html` mocks eight (1 e1RM bars, 2 rep dots, 3
new plate, 4 set squares, 5 trophies, 6 block sparkline, 7 milestones, 8
bodyweight ratio). Tom, 2026-10-05: *"I like 6, have it track set volumes, 5
is okay too."* Working sets per week, confirmed the same day: *"we don't care
about 1rms - More overall set volume"*, and he chose sets per week over a
running block total. It dips in a lighter week; that is honest, leave it.
- **6, Sets per week** (`shareBlock`, on), in the frame just above the
  totals: "N sets in week K · +X% since week 1" and a line under it
  (`TRAIN.frameBlock`, `TRAIN.blockWeeks`). Weeks are the block's own 7-day
  weeks from its start, as "Week N" counts them; no block, the last eight
  calendar weeks. **The line starts at zero** (`Chart.make`, not
  `Chart.spark`, which fits the lowest week to the floor and drew 74 to 54
  sets as a crash). A week still running is left off while it is under the
  week before; the gain is said only when up.
- **5**: a lifetime PR's trophy is filled, a PR's is outlined (`.fr-pr.all`).
- **Next, decided 2026-10-05, not built: set volume per lift.** Tom: *"we
  don't care about 1rms"*, *"Graph it via weght * Reps, set by set and overall
  session volume"*, *"set 1s should all be on 1 line, set 2s on another"*,
  *"don't drop anything out anymore"*. Each point weight x reps (reps for a
  lift done mostly without weight); a line per set number, set 1 to 4, a
  point per session; under it that lift's session volume (every set added)
  with a dashed least-squares trend; and every session's total. **Every
  set counts, warmups too**: a 70%-of-top-set cut was tried on his log and
  threw out the lighter opening sets he works up from, flipping three lifts
  from up to down. Mocked from his 5 Oct backup in a scratchpad, not in the
  repo. **Where (Tom, yes to the recommendation):** the GRAPH tab for every
  lift, his own view, minuses shown; the share picture only lifts trending
  up; the every-session chart in Analysis.
- **Warmups count everywhere in TRAIN** (Tom, 2026-10-05, asked "these
  graphs only or all of TRAIN": *"All of train"*). Session totals, volume,
  sets, sets per muscle, the week, Profile, Sets per week and the frame's
  totals all count warmups (`spanStats`, `sessionStats`, `breakdown` and
  every `!s.warm` filter on a count). This replaces "never counted in
  volume or set totals" under Fields worth knowing. **Claude's call, tell
  Tom when built:** records and the set-N-against-set-N comparison stay on
  working sets, because a warmup set against a working set reads as a
  false drop, and a lighter set cannot be a record anyway. Warmups are
  still marked and dimmed. **Built 1.0.50.** The text share keeps working
  sets only (his pick F, 2026-09-30); GRAPH's Max graphs and Estimated 1RM
  read working sets, its Session graphs every set.
- **Set Volume, built 1.0.50.** GRAPH's first graph and the default unless
  a lift has a saved one (`TRAIN.setVolume`, `drawSetVolume`): a line for
  set 1 to 4 (`TRAIN.SV_LINES`) in `--data-1` to `--data-4`, a key under
  it; then SESSION VOLUME with the dashed least-squares trend
  (`TRAIN.trendOf`) and "Trend +X% over N sessions", minus said. Sets are
  numbered in the order done, warmups included, so set 1 is often the
  warmup. A lift with weight on under half its sets is measured in reps.
  SHARE PICTURE shows only while the trend is up. Analysis gained SESSION
  beside WEEK, MONTH and YEAR: the last 40 sessions, a trend line, and
  SESSIONS per session falls to VOLUME. Not seen on his iPhone.
- **One line, 1.0.51.** Tom, 2026-10-05: *"Might it be cleaner to just 1
  line? Overall session volume?"*, then *"A and B"*. **A:** GRAPH's first
  graph is VOLUME TREND, the session volume line and its trend only; the
  set 1 to 4 lines are hidden, not deleted (`TRAIN.SHOW_SET_LINES`). Why
  they crossed, measured on his log since January: sets climb inside a
  session (set 1 to set 4 rising on 24 to 27 of about 28 sessions for
  Rope Push Down, Triceps, Laterals, Pull Up), sets per session run 3 to
  7, and Triceps had warmups on 10 of 30 days, so set N is not the same set
  from one day to the next and the order of the four swapped against the
  session before on 21 of 29 Triceps days. **B:** the story frame has
  SESSION VOLUME (`shareVol`, on, `TRAIN.frameVol`) above Sets per week:
  "N kgs this session · +X% over 12 sessions" and the line from zero with
  its trend. Every session, not same-named ones: he named 0 of 41 days
  since June. Shown only while the trend is up and the day is the last
  point. Not seen on his iPhone.
- 1, 2, 3, 4, 7, 8 not built. Measured on the demo: the bottom starts 61%
  down with one PR and the line; `_review.html` 142/142 at 390 and 1280.
  Not seen on his iPhone.

---

## Moved from the brief on 2026-10-21

The brief had reached 67 KB. These parts moved here whole, as they stood; each left a rule or two in `CLAUDE.md` pointing back at its heading.

## On a client's profile (1.0.16, 2026-09-22)

`train/index.html?client=<pid>` is the same TRAIN pointed at one of Tom's
coaching clients, and COACH's LOG A SESSION opens it in a frame. The adapter
is the first inline script in the file, before any other script runs, and it
replaces the store's calls so every TRAIN type is read and written as COACH's
(`set`→`cset`, `exercise`→`cex`, `excat`→`cexcat` and the rest), with `pid|`
in front of each key. Nothing else in TRAIN was rewritten, and plain TRAIN is
untouched: `CLIENT` is null and every call is the store's own.

Rules, each with the reason it exists:

- **A new TRAIN type must be added to the adapter's table**, and its `c` twin
  to COACH's `APP.types`, or that part of a client's log silently goes into
  Tom's own rows.
- **`Rec.merge` is NOT mapped.** It is how rows from other tabs and frames
  arrive, already in their own types; mapping it would rewrite Tom's own sets
  as a client's. An import on a client's profile calls `TRAIN.mergeImport`,
  which maps.
- **No `tick` and no `activity`** are read or written on a client's profile:
  their training is not Tom's day.
- **Every setting changed there is the client's** (1.0.36, Tom: "I dont want
  my train to be affected"), namespaced `train.<pid>|<name>`. One the client
  has never had reads Tom's, so a new client starts on his setup; `seen`,
  `prRule`, `rest` and any `share.<id>` never do (an exercise id is another
  lift in another log: a client's FitNotes `fn12` is not his). Theme and sound are kept by the device per
  app, outside the store, and are still shared. Watched: LBS on a client,
  KG still in his own TRAIN.
- **A new set's key gets `k-`** so COACH bills it as a session Tom delivered.
- **No DATA tab there.** TRAIN does not register with the sheet on a client's
  profile, so a backup taken from it would have been the whole device.
  `TRAIN.settings` hides `window.IO` while the panel is built.
- **Send To Coach is dropped from the menu**, and the bar carries the client's
  name where TRAIN's own name goes.
- **`seedCats` never overwrites an exercise that exists.** A client whose file
  brought its own starters would have had them rebuilt to the defaults.

Watched 2026-09-22 in the browser: sets logged on a client landed in their
rows, Tom's own log did not move, and `_review.html` passed 116 of 116. Not
opened on an iPad or a phone.

## Exercise types

FitNotes has six, and TRAIN stores each as the two fields it logs:
`wr` weight and reps, `dt` distance and time, `wd` weight and distance,
`wt` weight and time, `rd` reps and distance, `rt` reps and time.

Older rows carry what came before: `0` and `2` from the starter list and
`'weight_reps'` from the importer are `wr`; `1` and `'distance_time'` are `dt`.
FitNotes' own type numbers could only be pinned down for weight-and-reps and
cardio, so any other imported exercise is **read off what was logged against it**
(`TRAIN.kindOf`). From his file: Hang is `wt`, Vacuum is `rt`, Plank has no
sets and falls back to `wr`. He can change any of them in the exercise editor.

## Personal records (the brief's version, 2026-10-21)

**A set is a record while nothing has ever been heavier at that many reps or
more.** Ties go to more reps, then to the earlier set. So a record can stop
being one, and `recomputePRs` walks a whole exercise rather than asking whether
the newest set was the heaviest.

Weights are compared at **three decimal places**: old FitNotes versions stored
one weight as two floats a millionth apart, and at two places a 22.05 lb lunge
tied with a 10 kg one that FitNotes had told apart.

Verified against his file: FitNotes' 537 flags matched exactly, and the rules
tried on the way are recorded so nobody tries them again.
(HISTORY.md: Personal records, verified against his file)

**A split set counts its effective reps** (1.0.70, Tom 2026-10-18: "10 can
have 10 2 or 6,4 or 4+6 and they would all mean different things"; he picked
rest-weighted). Every strength reading uses `TRAIN.sr(s)`: the still-standing
rule, rep maxes, the estimated 1RM, Heaviest, Most reps, block and session
records, Top 3 sets, GRAPH's Estimated 1RM and Max Reps, the set arrow's 1RM
half and `setDelta`. **Every total, Most volume and the arrow's weight x reps
half read `r`, every rep.** Wherever a split set's strength is stated it says
so: "10 5 (counts as 14)" (`TRAIN.repsText`). A split set and a straight set
are compared like for like now; "10+5" after a straight 10 is more work and the
same strength, so the arrow is green and the direction is same.
Until 1.0.69 split sets kept records of their own (Tom, 2026-09-14) and his
file carried 688 flags; the count under effective reps has not been taken on
his file. The records sheet still lists split sets, as SPLIT SETS, AS THEY
COUNT. Changing a weight in Settings works records out again.

**Records start again with each training block**, and the all-time ones stay. The
stored `pr` flag is still the all-time, still-standing rule. Block records are
worked out when shown.

**Five kinds, five symbols on a set row** (1.0.73, `TRAIN.prKinds`,
`TRAIN.prMarks`). Tom's picks from a page of 40 ideas, 2026-10-19: Lifetime PR a
trophy (the stored `pr`), Block PR a medal (the still-standing rule inside the
set's own block), Weight PR a barbell (heaviest ever at that many reps), Reps at
weight PR a crown (most reps ever at that exact weight), Volume PR rising bars
(most weight x reps in one set). **Weight, reps and volume are what the set was
on the day it was lifted and keep their symbol after a later set beats it** (his
pick A), and need an earlier set to have beaten. **A set shows every kind it is**
(his pick B), small: on TRACK a line of 12px symbols under the numbers, so the
row stays 44px and the note keeps its room (beside the numbers, five took the
note down to 6px); on the log a two-row cluster after the numbers. Gold, the
accent. The Personal Records sheet ends with SYMBOLS ON A SET, the key.
The drawings are `shared/icons.js` roles `pr-<kind>` since 1.0.75, so a
theme's stroke weight reaches them; the cup, disc, plates and crown are drawn
solid (`Icons.SOLID`).

## Names, and how much stronger

A session can have a name. Earlier names are offered as chips, and **a copy
carries the name**. A name locks nothing: two Back days can share no exercises.

**Each exercise** is measured against, first match wins:

1. a day he picked for this session (Compare With A Day)
2. the last session with the same name, inside the current block first
3. the day it was copied from
4. the last time that exercise was done

**Working set N against working set N**, warmups left out of both sides, so a
change in how many warmups he did moves nothing. **The change names every part
that moved** (Tom, 2026-09-15: "I want to see how much more reps AND %
increases"): the weight if it moved, the reps if they moved, and the percentage
change in estimated 1RM, as in `+5 lb · −1 rep · +1.5%` or `+2 reps · +7.4%`.
A set with no weight has no 1RM, so its percentage is of its reps. A split set
against a straight one is not like for like and gets no direction. A date from
another year shows its year.

Each exercise's line and the session card add it up: reps gained over every
compared set, and the average percentage of the sets with a 1RM on both sides,
as in `+14 reps · +2.3% average`.

It shows on each set in the day's cards and under each set on TRACK, where the
line above the steppers lists the sets being compared against.

**Nothing may need a name** (Tom, 2026-10-05: *"All our functions need to
work even if we don't name sessions specfically"*). A day with no name is
the same session as an earlier day sharing half of all exercises on either
(`TRAIN.likeDays`, `TRAIN.dayExs`), or holding everything done so far today,
or the same muscle groups in close to the same amounts, 60% alike
(`TRAIN.dayMix`, `TRAIN.sameSession`). `compareCtx`, the session card's
totals, the story line and Training Routines' YOUR SESSIONS all use it.
(HISTORY.md: Sessions without names, and what a trend measures)
A new feature that reads
`session.name` must work without it.

## The session card

At the end of every day with work in it: date, block and week, name, volume, sets,
reps and time, set by set as a count and a row of squares, sets per muscle, and
any records. **Totals are set against another day only when that day is the same
session**: named the same, picked, copied from, or the one day every exercise was
measured against. Records are what was a record on the day it was lifted, all-time
or in the block; the first time an exercise is done, or done in a block, is not a
record, and a record the same session beat is dropped.

SHARE PICTURE opens the shared Share panel (`IO.share`): the picture, Transparent,
Translucent or Opaque, Big, Medium or Small, all remembered, and one SHARE that hands
it to the share sheet. Tom, 2026-09-14: every option, "without it being a whole
process". The picture is always a 1080 x 1920 story, the card drawn at 390px and kept
clear of the story's own buttons, with the TRAIN mark taken off ("no small
branding"). It is on the session card, the week, Profile, an exercise's Personal
Records, and GRAPH. **Not watched on the iPhone.**

**The session as a FRAME** (1.0.43 to 1.0.46). LAYOUT Frame on the
session's Share panel (Card is the old picture, `shareLayout`).
`TRAIN.frameCard`. **Tom's rules for it, 2026-10-02, and they win over any
general style rule** (his: *"don't let the style guidelines overwrite what
I've told you this work session"*):
- a frame for IG stories, **nothing in the middle**, the full height used
  (*"You're not maximizing the full verticality"*): the session's name and
  day at the very top, everything else at the very bottom, at the edges a
  posted story covers (`IO.STORY.frame`, 180 top, 220 bottom, 72 sides);
- **condensed** (*"Condense it way down"*, seen on his phone);
- **not blocky**: no box behind each line, and no window;
- **no sideways text**, **no all caps** (*"Don't all caps anything"*):
  every word as written, no caps tracking;
- **"x sets x% higher"** (never "x of y"): the sets that went up and their
  average estimated-1RM gain; with Gains as % off, "x sets higher · +N reps";
- **no RESULTS heading**;
- **the PRs** when the PRs switch is on: one line per lift, its best record
  (a lifetime one before a block one, else the heavier estimated 1RM), with
  "PR" or "Lifetime PR" beside the set, never as headers and never "Block
  PR"; at most `FRAME_PRS` (3), then "and N more PRs";
- **weight, sets, reps and time at the bottom**, one line;
- the video-game-results feel is the display face, the accent and big
  numbers, nothing more.
Words sit on the photo with a glow of `--bg` behind each letter;
Translucent and Opaque add a soft `--bg` fade from the top and bottom edges
(75% and 92%). Three switches, all honoured by the card too: **Gains as %**
(`sharePct`, on), **Compare each lift with its own last time** (`shareMove`,
off: `TRAIN.dayCompare(date, off, 'move')`), **PRs** (`sharePrs`, on). Same
rules as the card: the per-lift switches, no lift that went down, never a
minus. Measured on the demo: the bottom starts 62% down with three PRs, 74%
with one; the top ends at 23% (both counting the fade). Seen on his iPhone
in Instagram at 1.0.45, which is what 1.0.46 condensed.

**A lift can be left out of what he shares** (1.0.39). Tom, 2026-09-29: *"I
don't want to share lifts im weaker in."* The session's Share panel has one
switch per lift under Style and Size (`TRAIN.shareRecap`, IO.share's
`options`). **Off takes the lift's name and numbers out and nothing else**
(1.0.42): its LIFTS row and its records go, and the totals, set by set and
sets per muscle stay the whole session. Tom, 2026-09-30, the second time he
said it: *"Sometimes I won't want to share any specific movement details,
sometimes it will be plenty. This shouldn't change total sets."* 1.0.39 had
drawn the picture as if the lift was never in the session, which changed
the totals. Every switch off is a picture of the totals alone. The switch is kept per lift, so a lift left out
once stays out of every later session's picture until he turns it back on.
Share As Text follows the same switches and the toast names what it left
out. The card on the log is his own view and always shows everything. The
week, Profile, records and GRAPH pictures do not follow the switches: the
first two name no lift, and the last two are a lift he picked to share.

**A lift that went down is never shared** (1.0.40). Tom, 2026-09-30: *"I
never want to share a lift im weaker in, no one does."* `TRAIN.wentDown`
keeps its name and numbers out of the session picture and Share As Text for
everyone, the client build too, with no switch and none offered; its sets
still count in the totals (1.0.42). Down is its sets'
average estimated-1RM change at −0.05% or under; with no 1RM, fewer reps;
with neither, more sets down than up. Shared, the card (`recapCard(...,
share)`) keeps "N of M sets stronger", draws a down square as a same one,
drops the weaker count and every minus beside a total or on the gain line,
and leaves out SET BY SET when nothing got stronger. LIFTS lists each lift
with its top set and the first gain of: top weight, reps at that weight,
average % (`TRAIN.liftLine`). Share As Text is working sets only: no
warmups, no comments.

## The importer (the brief's version, 2026-10-21)

A `.fitnotes` backup is a plain SQLite database. The reader is written here, in
plain JavaScript, with no library, so the importer works offline.

- **It merges.** Every row carries a stable id from the FitNotes row and an
  `updated_at` from the training date, so importing twice changes nothing and
  nothing logged in TRAIN since can be overwritten.
- **It writes in chunks of 400**, with the screen redrawn once at the end. His
  whole file imports in about 0.6 seconds on a desktop.
- **It clears the starter list.** A fresh TRAIN seeds 111 movements. A FitNotes
  backup brings its own complete list, so seeded movements with no sets and in no
  routine are removed, along with starter categories left empty. Anything he made
  or logged stays.
- **One way.** There is no export back into FitNotes.
- A spreadsheet from Strong, Hevy, JEFIT or FitNotes' own CSV export also imports.
- Body weight and measurements are not imported.

**From notes (1.0.36, 2026-09-25).** Tom: "some people track on notes."
PASTE FROM NOTES in the import panel, so COACH's IMPORT THEIR LOG has it too.
`TRAIN.parseNotes` reads by shape and writes nothing; `importNotes` writes;
`undoNotes` puts every row back as it was. Rules:
- **A date line starts a day** (Sep 20, 20 Sept, 2026-09-20, 9/20). A number
  date without a year counts only with a slash and a weekday, words after it,
  or a gap above it, so 10/8 under an exercise stays reps and 12.5 stays a
  weight. Month first unless a date in the notes proves otherwise; the preview
  offers the switch only when it is a guess. No year: the latest past one.
- **A name with no sets under it is a session comment** (1.0.60, Tom: "Those
  are more session comments"): the first one before any exercise names the
  day when its date line did not, and every other one is written into the
  day's session comment and shown in the preview. Until 1.0.60 one under a
  named date line was dropped without a word, and one after an exercise was
  "Not read".
- **A setting with a number is never a name or reps** (`NT_SETUP`: Height,
  Seat, Pin, Notch, Hole, Level, Setting): "Pushups Height 5, 10 12 15" is
  Push Ups with "Height 5" on its first set, not "Pushups Height" x 5.
  Clients' logs imported 2026-10-08 had headings filed as exercises; they
  were cleaned by hand, and today's parser did not reproduce that shape.
- **Set shapes are table-tested**, 31 of them, in the browser: plain `a x b` is
  weight x reps, except sets x reps when a weight is named elsewhere on the
  line (a <= 10) or a <= 6 alone; three numbers take the larger end as the
  weight; `m` is metres, minutes are `min`. Change a rule, re-run the table.
- **Names match this log's exercises by words**, shorthand spelled out (DB,
  RDL, OHP), plurals off, any order. Fewer words match only one clear winner,
  or the barbell one for bench, squat and row. Otherwise a new exercise,
  grouped off its name (`NOTE_CATS`), in Other when nothing fits.
- **Keys are `nt-<date>-<n>`**: the same notes twice write the same rows, and a
  day imported again drops its own old tail. A day holding sets logged any
  other way is left alone unless the switch says otherwise. Not billed: no `k-`.

Watched on a client profile at phone width, by clicking: 14 sets landed as
that client's `cset`, none in Tom's `set`, day names came across, UNDO left
nothing. Not opened on the iPhone.

**Every comment that still has a set comes across (2,240 of his 4,297; the
rest point at deleted sets).** (HISTORY.md: Set comments: 4,297 in the file, 2,240 on sets)

## Where things live on screen

FitNotes' screen layout is the reference, in Tom's words: session and training
where FitNotes says workout.

- **Training log bar:** menu, title, calendar, add, more. Under the date, the
  session strip: its name, or "Name this session", and its block and week.
- **Training screen bar:** today's exercises, exercise name, rest timer, personal
  records, exercise overview, more. Tabs TRACK, HISTORY, GRAPH.
- **One card per exercise** on the day: name, hairline, two right-aligned columns.
  No set numbers on the day view. A comment is a marker at the left of its set.
- **More on the training log:** Settings, Name Session, Compare With A Day, Copy
  Session, Copy This Session, Move Session, Comment Session, Time Session,
  Supersets, Share Picture, Share As Text, New or Edit Training Block, Analysis.
- **More on the training screen:** Copy Previous Sets, Plate Calculator, Set
  Calculator, Estimated 1RM Calculator, Add To Superset, Replace Exercise, Add Goal,
  Edit Exercise, Edit Setup, Settings, Remove Exercise.
- **More on the exercise list:** Create New Exercise, Add New Category, Edit
  Categories, Sort By Last Used.
- **The menu** (hamburger, off the training screen): Training Log, Calendar,
  Exercises, Training Routines, Personal Records, Analysis, Goals, Profile. Its
  header opens Profile too.
- **The empty day:** "Training Log Empty", Start New Session, Copy Past Session.
  **Copy Past Session asks which one** (1.0.62, `TRAIN.pastSessionPicker`).
  Tom, 2026-10-15: it "literally copies last session - useless!" He rotates
  sessions, so the day before is rarely the one he repeats. A sheet lists the
  last 14 training days, newest first, each by its name (else its first
  exercises) and date; a tap copies that day. PICK ANOTHER DAY opens the
  calendar. Never copy a day he did not pick. COACH's LOG A SESSION is this
  TRAIN, so it gets the same.
  **A pick copies that day's exercises, each with ITS latest sets and their
  comments** (1.0.64, `copyDay` with `latest`, `TRAIN.latestSetsOf`). Tom,
  2026-10-17: the day's own numbers were "literally the PAST session,
  useless"; he picked A and "include the comments". Named sessions in
  Training Routines do the same. Copy Session in More still copies a day as
  it was.
- **Analysis:** WEEKLY first, then BREAKDOWN and GRAPHS.

**Every row that can be changed has a menu**, on a long press and a right click
both (DOCTRINE law 14), and every one of those menus also has a visible way in —
a ⋮ button on the row, or the screen's More (law 6). On a list with an order
the long press is a hold let go without moving; see `holdToMove` below.

**Summaries are facts, never verdicts.** The end of a session and the week add
themselves up because Tom asked for both. Neither praises, sets a target, or
points out a plateau: he asked for none of that.

**Importing is in Settings only.** It is done once; it does not get furniture.

## The phone (the brief's version, 2026-10-21)

TRAIN runs and is tested on Tom's **iPhone 13 Pro**, in Safari: 390 by 844 points,
about 390 by 664 with Safari's toolbars showing, a 47px notch and a 34px home bar.
The Galaxy A10 gym phone cannot install apps and is not a target (Tom,
2026-09-14). Earlier versions of this brief designed for the A10; anything below
that still reads as Android-first is out of date.

What iPhone Safari changes:

- **`vh` is the screen with the toolbars hidden**, so anything sized in `vh` is too
  tall whenever they show. Use flex to fill space, or `svh`.
- **No vibration.** Vibrate does nothing on an iPhone; the sound still plays.
- **localStorage stops near 5MB.** His history is about 2.8MB of text, stored as
  about 5.6MB. The store writes every row to IndexedDB as well, so an import that
  fills localStorage should still land whole. **Not yet watched on the phone.**

- Load `shared/mobile.js` and build from `shared/ui.js`. Do not re-solve tap
  delay, keyboards, sheets or the back stack here.
- **Redraw once per burst of writes.** One SAVE is up to four writes; each used to
  reindex every set. `Rec.on` now schedules one redraw.
- **Two maps are cached** (`TRAIN.exercises()`, `TRAIN.cats()`), dropped on every
  store announcement.
- Never render 12,370 sets. History pages by 100, records by 60, rep max by 40.
- **The first paint does not wait for the store.** If `Rec.ready` has not fired
  after 300ms and there are sets or exercises in localStorage, TRAIN draws them;
  seeding and the record pass still wait for ready. Watched 2026-09-15 in a frame
  whose IndexedDB never answers. TRAIN 1.0.7.

### A wide window (1.0.47, 2026-10-02)

Tom runs the suite on a 5120 x 1440 screen, where the home screen gives
TRAIN a 1280px frame. **His rule: on a wide window, lay things out side by
side; never fold text** (no "show more" over words). HISTORY's SHOW MORE
is paging past 100 sessions, not folding, and stays. What it does, CSS only:
- **Past 720px the TRACK, HISTORY, GRAPH tabs stop stretching**: each is a
  third of the 640 column, centred over it.
- **Past 1100px HISTORY's days sit in columns** (`.histgrid`): as many
  phone-width cards (at least `--s-10` x 3) as fit, newest first along each
  row, up to six. On a phone `.histgrid` is the same single column.
- **The phone must not move.** Both queries start far past 390, and the
  390 x 844 screenshots of the log, TRACK, HISTORY and GRAPH were byte for
  byte the same before and after. Check that again after any change here.

## Testing (the brief's version, 2026-10-21)

Serve a folder that holds both the repo and his backup (it is in
`Documents/FitNotes_Backup_2026_08_20_06_36_24.fitnotes`), open TRAIN with a
fresh `?cb=`, drive it with JavaScript, read the console. Then `_review.html`.
Clear the store and stop the server afterwards.

**The import test.** Import his real backup and check, against numbers read
straight from the file:

| Check | Expected |
|---|---|
| Sets | 12,370 |
| Workout days | 631, 2022-01-01 to 2026-08-05 |
| Exercises / categories | 270 / 9 |
| Comments on sets / comments on deleted sets | 2,240 / 2,057 |
| Workout timings | 550 |
| Supersets | 55 across 40 days |
| Personal record flags | 688 with split sets kept apart until 1.0.69 (FitNotes flagged 537); not yet counted under effective reps (1.0.70). Re-calculate twice changes **0** the second time |
| Warmups read from comments | 161 |
| Split sets read from comments | 610: 430 short rests, 112 under thirty seconds, 68 long |
| Entered in kg / lb | 7,886 / 4,484 |
| Starter movements removed | 111 |

**Always test:** an empty install can create an exercise and log a set with nothing
imported; importing twice writes nothing; a weight typed in pounds reads back in
pounds; copying a day keeps its `from` after the day's comment is edited; moving a
day moves its ticks; a hold and a right click both open a row's menu; a theme
change recolours category dots; delete and undo both land; a copy carries its
name and is compared by it, set by set; a "wu" comment makes a warmup and a hand
mark beats it; a set saved with setup keeps it and the next session starts with
it; the session card, the week and Profile fit 390px without scrolling sideways.

Never claim it works because it should. Claim it because you watched it.

## Send To Coach, over the shelf (the brief's version, 2026-10-21)

`Cloud.send('train', bag)` puts the whole bag on the coach's shelf, and the
rules that make that safe are in `CLOUD.md`. Three of them cannot be optimised
away: **the file is the fall-back, not the past** (opened from a folder, signed
out or with no signal, it makes the file exactly as before and says why, which
is hard constraint 4); **it always sends everything, never one day**, because
COACH merges on `updated_at` and a partial send is how the days around it go
missing; and **nothing leaves the phone until it is pressed**. It sits on the
session menu under Share As Text as well as on Profile, because the moment a
client would send is the session they just finished.
(`HISTORY.md: Send To Coach, over the shelf`)

## Sends through the outbox, and programs from the coach (1.0.41, 2026-09-30)

cloud.js 0.2.0 (`coach/CLAUDE.md`, Sends both ways). What changed here:

- **Send To Coach posts to the outbox** (`Cloud.post`): the log goes as
  `train@1`, `train@2`, each under 1.9 million characters
  (`TRAIN.coachParts`), into the coach's in-tray. With no signal it waits on
  the phone and goes by itself when the signal is back, from any app of the
  suite that is open. Nobody signed in gets SIGN IN TO SEND, with SAVE A FILE
  beside it (`TRAIN.signInToSend`); the database refusing it keeps it queued
  and says so. The file is left for a folder copy and a blocked Firebase, as
  hard constraint 4 says. Still the whole log, still only on a press.
- **A program the coach sends lands on its own** (`TRAIN.fromCoach`): 2.5
  seconds after boot, and when the app comes back to the front at most every
  five minutes, TRAIN reads its own tray and runs each program through
  `takeProgram`, the same as Open A Program, then clears it. Never with
  `CLIENT` set: inside COACH the tray would be Tom's.

Watched against a stand-in database, not the real one, and not on a phone.

## Opened straight into the import (the brief's version, 2026-10-21)

`&import=1` on the address opens the import panel once, after `boot` and after
the store is ready; COACH's IMPORT THEIR LOG uses it on a client profile. **The
panel names whose log it is when `CLIENT` is set** — a FitNotes backup dropped
into the wrong log is thousands of rows to undo by hand, and the two logs look
identical once the frame is open.
(`HISTORY.md: Opened straight into the import`)

## The training screen, as Tom rebuilt it on 2026-09-24

Four complaints and then six more, all in one day, all from him using it beside
FitNotes on his phone. The rules that came out of it, each of which a later
session could undo without noticing:

- **The title never clips.** `fitTitle` steps the name down the type scale on
  one line, then takes two lines rather than shrink further, then three. The
  header's `.spacer` must stand down whenever there is a title, or it and the
  title split the free space and half the room goes to nothing.
- **A hold on anything with an order lifts it** (`holdToMove`, 1.0.25): the
  log's exercise cards, the drawer's rows, the sets on TRACK, and a routine's
  list, days and exercises. Drag and it moves; **let go without moving and
  its menu opens**, so every hold-menu those rows had is kept, and a right
  click opens it too. Tom, 2026-09-25: *"I still cant hold to reorganize my
  sets"* — the drawer-only version of 1.0.21 never worked on his iPhone,
  because its touchmove guard was added after the finger was down and a
  phone decides at touch start whether anything can stop the scroll. **The
  guard must sit on the list from the start** and refuse only while a row is
  up. Held rows carry `user-select:none` and no touch callout, or iOS takes
  the press for text selection. A new ordered list uses `holdToMove`, never
  `withMenu` on its rows, with each row's key in `data-key`.
- **Saving a set never ticks it.** `done` is his box; `plan` is the app's mark.
  See Fields worth knowing and What counts.
- **A new exercise carries what he typed** into the search box.
- **TRACK is flat.** No cards: the steppers and the day's sets are `.trackbox`
  on the page with one hairline between them. Do not put them back in cards.
- **The rest countdown is a chip in the top bar** (`.restchip`), standing where
  the rest timer button stands and hiding it while it runs, so resting costs no
  height. It **rings once at zero and goes** — Tom, 2026-09-24: *"I don't want
  to see the over timer in TRAIN."* Do not bring the counting-up state back.
  The clock still decides, so a tab suspended past the end rings and clears.
  **It starts from the tick box only** (1.0.33, `afterSave(..., byTick)`),
  never from SAVE or UPDATE. Tom, 2026-09-25: *"saving a set should NOT start
  the timer, only marking it as done."*
- **A set row is 44px.** The bubble and the tick box draw at 32 and keep their
  44px targets through `mb-tap`.
- **SAVE is the accent and CLEAR is quiet.** No second colour on that bar.
- **Searching for a movement is `TRAIN.nameMatch(name, q)`**, scored, best
  first: the whole name 100, starts-with 90, substring 80, every query word
  starting a name word in any order 70, anywhere inside a name word 60,
  initials 50, letters in order but apart 20 plus one per word-start landed on.
  Punctuation and accents come off both sides first. All three exercise
  searches use it. **Not typo tolerant on purpose**: edit distance starts
  offering things he did not mean.
- **No Legs and no Arms** (Tom, 2026-10-08: "Delete Arms and Legs as
  categories", put "where they were always meant to go"). The standard groups
  are Chest, Back, Shoulders, Biceps, Triceps, Forearms, Core, Quads,
  Hamstrings, Glutes, Calves, Lower Back, Cardio. `TRAIN.splitCoarse` runs
  at `Rec.ready` before `fillCats`: a log with the old app-made `legs` or
  `arms` group has each movement moved by name (`TRAIN.SPLIT`, then
  `NOTE_CATS`; Legs falls back to Quads, Arms to Biceps, a dip or close grip
  in Arms is Triceps) and the emptied group deleted. A FitNotes group named
  Legs (`fn<id>`, Tom's own, 53 movements) is never touched, and counts as
  Quads (`CAT_ALSO`), so his log gets no empty Quads.
- **Thirteen groups, twelve colours.** A group's colour is `TRAIN.CAT_SLOT`,
  not its place in `DEFAULT_CATS` (that is only the order a new log shows).
  Every group kept its old colour, Quads took Legs', Biceps took Arms', and
  Triceps shares Cardio's. Quads and Hamstrings are two tints of one hue, and
  so are Core and Lower Back.
  `TRAIN.catId` slugs a name into its key. `TRAIN.fillCats` adds any standard
  group an existing log is missing, **moves no exercise**, and skips a group he
  deleted by asking `Rec.tombstone` rather than remembering what it wrote —
  and it runs inside `Rec.ready`, when every device's tombstones are in.
  **It looks for a group by NAME** (`TRAIN.catWord`, plural dropped), never
  by the key it would make: a FitNotes group is keyed `fn<id>`, and until
  1.0.27 his log got a second, empty Forearms. Quads counts as there when he
  has a Legs of his own, Core when he has Abs (`TRAIN.CAT_ALSO`). An app-made
  copy beside one of his is deleted while it holds no exercise, and kept once
  it holds one.
- **Movements change group only through the SORT sheet** (1.0.28; the one
  exception is `splitCoarse` above, which Tom ordered,
  `TRAIN.sortDialog`): Calves, Glutes, Hamstrings and Lower Back read off the
  name by `TRAIN.SORT_RULES`, Glutes before Hamstrings. Every move is a row
  with a switch, one SORT, UNDO after. Offered once on the exercise list
  (`train.sortSeen`), always in its More as Sort Into Groups, never on a
  client's profile. A movement already in one of the four is never offered;
  one switched off stays off (`train.sortSkip`). Watched on his 270 names:
  8, 10, 12 and 1, Leg Curl out of Biceps.
- **Plates each side ride on the WEIGHT label's own line** (1.0.29,
  `TRAIN.platesText`, "45×2 · 5 each side", `~` when the plates cannot make
  it, "bar only" at the bar), so they cost no height. Only on a barbell lift,
  `TRAIN.isBarbell`: "barbell" or "BB" in the name, or a bare barbell lift
  in `BAR_LIFTS`, never a name `BAR_NOT` catches (dumbbell, machine, Smith,
  cable, EZ, trap bar, lever, brands). `exercise.bar` from Edit Exercise's
  switch beats the name. 30 of his 270 read as barbell. No `≈`: the display
  font lacks it and the fallback made the line a pixel taller.
- **Add Warmups is first in TRACK's More** (1.0.30, `TRAIN.addWarmups`):
  40, 60 and 80% of the working weight for 12, 8 and 6 reps (Tom: "about
  6-12"; the split is Claude's, lighter takes more). Working weight: typed,
  else today's heaviest working set, else last time's. Rounded down to the
  exercise's step, never under the empty bar on a barbell lift, a repeated
  weight dropped. Written `warm: 1, plan: 1` with `ord` just in front of the
  first set, so they sit first and count for nothing. Refuses a second time
  while app-made warmups are there.
- **Swipe a set left on TRACK and DELETE is behind it** (1.0.31,
  `Mobile.swipe` in `trainingSetRow`), with the undo `TRAIN.removeSet`
  always had. The swipe moves the row's contents onto `.mb-swipe-face`, so
  the row's flex layout, the page background, the selected colour and the
  lifted colour are drawn on the face in CSS; without a background the red
  shows through. The face is `--tap` less the hairline, so a row stays 44.
  The back is `nohold`, and a tap on DELETE never also loads the set.

(`HISTORY.md: The training screen, four complaints` and the three sections
after it.)

## Named sessions, and what opens first (1.0.26, 2026-09-25)

- **Training Routines lists his named sessions** (`TRAIN.namedSessions`,
  `drawNamed`). Tom: *"I should see named days in Training Routines"*, and he
  picked this reading over listing a routine's day names. His FitNotes held
  no routine; a named session is his routine. Each name with sets, most
  recent first, the day on screen left out; a tap copies the last one into
  the day on screen with its name (`TRAIN.startNamed`), and never twice onto
  one day, judged by `session.from`.
- **A routine day names the session** it is logged into, LOG ALL or one
  exercise, unless the day already has a name. Tom: *"that's the behavior I
  already expected."*
- **TRAIN opens on the first exercise of today with a set waiting**
  (`TRAIN.pending`), once, in `Rec.ready`, and only while the log for today
  is still what is on screen and the address is not an import.
- **A save is silent unless it is a record** (`recordCheer`): a buzz where
  there is a motor, and one short `complete` sound for an all-time or block
  record, on SAVE or on UPDATE of a planned set. The tick box keeps its click.
  Tom: *"a short sound when you save a set that's a new record, and silence
  otherwise."*

## A program in weeks, and the coach's target (FORGE branch 1.0.21-1.0.22, on main as TRAIN 1.0.32, 2026-09-25)

FORGE (`forge/CLAUDE.md`) builds programs in weeks and sends them through
COACH's file. `takeProgram` reads the new fields and still accepts every older file.

- **One routine per week.** A file whose days carry `wk` above 1 becomes
  `prog-<id>-w1`, `-w2` and so on, named `<program> · Week N`, with each day
  under its plain `day` name. A file with one week, or none, is one routine,
  `prog-<id>`, exactly as before. A resend deletes the weeks it no longer has,
  and the single routine it used to be.
- **The target is `progex.plan`**: `{n, reps, bands, rir, rest, note}` when
  the file sends them. The routine list shows it as `3 × 8-15 · 13-15 ·
  10-13 · 8-10 · RIR 0-3 · 3:00 rest · cue` in place of "previous sets". It
  is never logged. Set one is still the only set filled (`fillFor`, fill 3),
  and from FORGE only its load: its reps come from last time. That is Tom's
  Algrowrithm, the reason set two onwards are never prescribed
  (`forge/CLAUDE.md`). `reps`, `bands` and a text `rir` came in 1.0.22.
- **The training screen shows it** as a faded `Coach · …` line under last
  time, when the exercise was started from that routine today (LOG ALL or a
  tap). It is remembered in one setting, `coachPlan`, today's only. On a
  client's profile it is `coachPlan.<pid>`, so a plan Tom opens for a client
  never shows on his own TRAIN.
- **A new exercise takes the rest as its rest timer.** One the client already
  has keeps their own rest.

## Open slots, and a muscle group left alone (FORGE branch 1.0.23, on main as TRAIN 1.0.32, 2026-09-25)

FORGE can send a slot instead of an exercise: "any Horizontal Push", "any
Chest" (`forge/CLAUDE.md`, Movement patterns). `takeProgram` keeps one as a
`progex` with `ex: null` and `slot: {label, pat, mus, fk}`.

- **The routine shows it as "Any Chest … tap to pick".** A tap opens the
  exercise list titled with the slot, narrowed to the muscle group when the
  slot names one (`TRAIN.pickForSlot`). The pick is patched onto the entry.
- **One pick fills the slot in every week.** `fk` is FORGE's plate key, the
  same in each week's routine, so every unpicked entry with that `fk` in the
  same program takes it too.
- **A pick survives the coach sending again**: `takeProgram` reads what was
  picked per `fk` before it rewrites the routine.
- **LOG ALL leaves an unpicked slot out**, and it stays on the routine.
- **A new exercise from a program reuses a muscle group by NAME.** It used to
  call `addCat` when the file's category id was not on this phone, which
  wrote the existing group again with a new colour and place. FORGE sends
  `catName` on every exercise, so this would have happened on almost every
  program. Watched: the client's Chest row byte for byte the same after.

## Merging two exercises, and starters renamed (1.0.35, 2026-09-25)

Tom: *"merge leg curl and seated leg curl"*, keep Leg Curl, keep Lying Leg
Curl separate; and *"There is no barbell squat?"*

- **Merge Into…** is on an exercise's menu in the list and in the training
  screen's More (`TRAIN.startMerge`). The list opens titled Merge Into, without
  the one being merged; a pick asks with both names and the set count, then
  `TRAIN.mergeExercise(from, to)` moves every set, routine entry, goal (and its
  title), superset and day order onto the kept one, carries a favourite, a
  note or setup fields it lacks, deletes the other and recomputes records.
  One UNDO restores every row it touched, for the snackbar's six seconds.
  The kept one keeps its own name, group, type, unit and step.
- **The starter list says Barbell Squat and has no Seated Leg Curl.** A list
  already seeded is put right by `foldSeeds` on open and whenever rows arrive:
  `SEED_RENAME` renames `seed-back-squat` while it still says Back Squat, and
  `SEED_FOLD` folds `seed-seated-leg-curl` into `seed-leg-curl` while it still
  says Seated Leg Curl, sets and all. A set that arrives later against the
  folded one still lands on Leg Curl. A name he changed is never touched.
  A starter's id comes from its name, so **renaming or dropping a starter
  always needs one of these two entries**, or old lists keep the old one and
  new lists get a second.
- His own imported names (Seated Leg Curl Machine, Lying Leg Curl Machine) are
  not starters and are never folded; Merge Into is how he does those.

## Strength graphics and what a trend measures (1.0.49 to 1.0.59)

- **Warmups count in every total** (Tom: "All of train"). Records and the
  set-N-against-set-N comparison stay on working sets; warmups stay dimmed.
  GRAPH's Max graphs and Estimated 1RM read working sets, Session graphs
  every set. Share As Text stays working sets only (his pick F).
- **A lift's GRAPH opens on Top 3 Sets & Total Work** (`setvol`,
  `drawSetVolume`) unless he saved another default. TOP 3 SETS, AVERAGE
  leads (`TRAIN.top3`: the three biggest sets by weight x reps, reps on a
  mostly-bodyweight lift, averaged): "am I getting better", immune to
  untagged warmups and set count. TOTAL WORK under it: "am I doing
  enough". Each has a dashed least-squares trend (`TRAIN.trendOf`) and
  "Trend +X% over N sessions", minus said. SHARE PICTURE only while Top 3
  trends up. Dragging a chart shows the reading at the point.
- **The set 1 to 4 lines are hidden, not deleted** (`TRAIN.SHOW_SET_LINES`):
  sets climb inside a session and warmups vary, so set N was not the same
  set from day to day.
- **Analysis SESSION**: the last 40 sessions as bars of total work, with
  its trend.
- **The story frame** (`shareVol`, on, above `shareBlock` Sets per week):
  "Best sets +X% over N sessions like it" (`TRAIN.frameVol`,
  `TRAIN.volSessions`): the last 12 like sessions, each lift's Top 3 over
  its own mean, averaged, so every lift counts the same. Drawn from zero,
  shown only when up, no kg figure. Sets per week (`TRAIN.frameBlock`) is
  drawn from zero too; a dip in a light week is honest.
- **Limits Tom was told**: weight x reps rewards reps as much as load, so
  a lower rep range reads as a drop; other equipment reads as weaker.
  Same-setup comparison was offered (B), not picked.
- **Rejected**: estimated 1RM lines; a 70%-of-top-set warmup cut; a
  running block total of sets; `Chart.spark` for counts; "usual number of
  sets" (1.0.54, replaced by Top 3 in 1.0.55); summing lifts' kg on the
  story line (1.0.55, replaced 1.0.59).
(HISTORY.md: Strength graphics, as built 2026-10-05 to 2026-10-08)

## The set arrow, and decided not built (2026-10-13)

- **A set's green arrow** (`TRAIN.volUp`) shows when it moved more weight x
  reps than set N last time OR its estimated 1RM rose (1.0.61; Tom: 120 x 8
  after 100 x 10 drew nothing). Watched on the page: 4 arrows before, 5 after.
- **Decided by Tom, not built yet:** a session that crosses midnight stays
  on the day it started (a set saved before 5am within 3 hours of the last
  set joins it; `TRAIN.date` is fixed at boot today, so a reopen after
  midnight splits the session); a same-session comparison day counts only
  within 8 weeks of the lift's own last time, else `vsFor` falls to 'last'
  (a 2022 day beat Sep 11); the session card shows total work (weight x
  reps) per lift and session against the last same session, drops shown
  on his screens, gains only when shared.

## Describe Session (1.0.65 to 1.0.66, 2026-10-18)

- Tom: descriptors "like 'fasted' or 'feeling strong'. Just something to describe the overall context of that day", and "rating fields for energy and pump and session quality". **Sleep is STATUS's**; never ask it here.
- `session.tags` (words, his own or the starters in `TRAIN.TAG_STARTERS`, his used ones first) and `energy`, `pump`, `quality` (1 to 5, three fields so two devices merge). Every tap saves at once; the same number again clears.
- **No "How did it go?" row** (Tom, 1.0.66: "I don't want a how did it go"). The session strip is ONE 44px line: name, then tags and ratings, then the block, ellipsed (`.sesshead.slim`). Name Session and Describe Session are the first two items of the day's More menu, above Settings, and in the strip's own menu. The session card shows the line on screen, **never on a shared picture**.
- Works with no name. Not yet read by COACH, Analysis or a graph.

## Motion (1.0.67, 2026-10-18)

- Tom: TRAIN and COACH "feel stiff". Cause: every screen and day was wiped and redrawn in place. Now `motion()` in `draw()`: a new day slides in from its side (`mv-r`, `mv-l`), a new screen rises in (`mv-up`), `--dur-med`. A redraw of the same screen and day (every save) never moves.
- A timer takes the class off after 600ms, because a page that is not drawn never runs an animation and would sit on its see-through first frame. Watched in headless Chromium: 0.73 opacity mid-slide, 1 after.

## Inside COACH, one bar (1.0.68, 2026-10-18)

- COACH hides its own bar over the frame. TRAIN on a client's profile inside a frame puts a back arrow first in its header (`#toCoach`), which posts `{mb: 'coach-close'}` to COACH. The bar names the client in their own case (`CLIENT_NAME`, no longer upper-cased, `.logo.who`).

## Copy from the calendar, names in a series, notes on the row (1.0.69, 2026-10-18)

- **Copy Past Session is the calendar with a confirm** (Tom: "just like fitnotes"). `pastSessionPicker` opens `pickDate`; a day with sets shows its name, date and every exercise, COPY runs `copyWorkout` (latest sets and comments, unticked). A later day or an empty one says so and reopens the calendar. The 14-day list is gone.
- **A number on the end of a name is dropped when matching** (`TRAIN.nameKey`): Back 1, Back 2 and Back are one session, each measured against whichever was last. Tom: "Back 2 as in it's the 2nd time to hit back, not another form of back day". Training Routines lists the family once, by its latest name. A name that is only a number keeps itself.
- **The set row shows its comment and setup** in the gap between the set number and the weight (`.tnote`). **Never clipped** (Tom: "I don't want any clipping, make the font as small as needed"): `fitNotes` steps 12 to 8px until it fits two lines, then wraps and the row grows. **Setup shows only when it changed** from the set before. Watched at 390px: a long note at 8px made a 49px row.

## Split sets in strength (1.0.70, 2026-10-18)

- See Personal records and What a comment says. Watched in headless Chromium at
  390x844 on seeded sets: the records sheet, the Settings rows changed by
  clicking (Short Rest 50 made `10 5` count 12.5 and re-flagged records), the
  log. Not watched on the iPhone or on his real log.

## A block's days, in rotation (1.0.71, 2026-10-18)

- Tom: "When I create a block I want to be able to program all the days for that block then give me the option to auto repopulate from the cycle... it asks me if I want to do the next scheduled then intelligent weight suggestion based on last session and algrowrithm." He picked: **next in the rotation**, and **programmed in TRAIN or FORGE**.
- **`phase.program`**: the block dialog's Days row picks a routine, a FORGE program (`FORGE · name`, from `cprog f-*`, Tom only), or New Routine For This Block (made with the block's name, then Training Routines opens on it). A FORGE program comes in through `takeProgram` (`useForgeProgram`), is stored by its base id `prog-f-<id>`, the block's week picks `-wN` (the last week there is past the end), and **saving the block again re-imports it**, so FORGE edits arrive.
- **The rotation** (`nextBlockDay`): the day after the last day of the block's routine done inside the block, matched by `nameKey` of `session.pday`'s day name, else the session name; nothing done yet is day one. `startProgramDay` now writes `session.pday`.
- **The empty day in such a block leads with Next: <day>**, then Another Day Of <block> (a menu, also on hold or right click of Next), then Start New Session and Copy Past Session.
- **Set one's load** (`suggestFill`, `topBand`): last time's sets, with set one moved against the exercise's top band (`plan.bands`, else from `plan.reps` and `plan.n` as FORGE's `bands()`): past the top two steps heavier, at the top one step, inside the same, under it one step lighter. No range on the routine (a TRAIN-built one): last time as it was. **The step rule is Claude's reading of the Algrowrithm, not Tom's words yet.** Watched: 28 kg x 12 against 9-10 became 33 kg.

## Notes and context in the session strip (1.0.72, 2026-10-18)

- Tom, pointing at the strip: "This is where I want to put set notes and context, have it show up also in the blank space." The strip shows the name with the block stacked under it (at most 45% of the width), and beside them `.sessnote`: the session comment, then tags and ratings. It is never clipped: `fitLine` steps 12 to 8px to fit two lines, then wraps. Empty, it says Notes and context.
- **A tap opens one SESSION sheet**: Name (with earlier names as chips), Notes (the session comment), CONTEXT tags and the three ratings. Nothing is focused when it opens. Name and Notes save on change and when the sheet closes. Name Session in the menus still opens the old sheet, which has Compare With and the block.
- **The comment's own card under the time is hidden** (`train.noteCard` 1 brings it back), so it is not shown twice.
- Watched at 390px: a 108-character comment and context at 8px in three lines, the strip still 44px.

## Five record symbols (1.0.73, 2026-10-19)

- See Personal records. Watched in headless Chromium at 390x844 on seeded sets:
  110x10 showed all five, 90x12 Lifetime and Block, 80x5 none; every TRACK row
  44px; the key in the records sheet. Not watched on the iPhone.

## Opened from COACH onto a block (1.0.74, 2026-10-21)

- `&block=new` or `&block=<phase key>` on a client's address (`CLIENT` set only) opens `TRAIN.phaseDialog` once the store is in, with `{back: true}`: closing it posts `coach-close`, unless the save went on to Training Routines (New Routine For This Block) or DELETE is still asking. It also skips opening on today's waiting set. `coach/CLAUDE.md` has the COACH half.
- **On a client's profile the Days row offers their own program** (1.0.76): `cprog c-<CLIENT>` as "Their program · <name>", only when it has an exercise or slot, through `useForgeProgram`. Tom's FORGE library is still never offered there. `phaseDialog`'s `was` maps `prog-c-` back as well as `prog-f-`.

## The mission, stated plainly (the brief's version, 2026-10-21)

Tom has used FitNotes for four and a half years: 12,370 sets across 631 workout
days. It is the only app in his life he has never abandoned. **He will not move
until TRAIN does everything FitNotes does** (Tom, 2026-09-14). So the job is not
to improve FitNotes. It is to rebuild it closely enough that moving is not a
decision, and then let it share a brain with the rest of the suite and wear the
same skins.

**FitNotes is where TRAIN started, not a rule.** Tom, 2026-09-15: *"Lets stop
with matching fitnotes as a hard rule."* Until then FitNotes won every choice
unless he said otherwise. Now it is a good first answer, not the last one: when
a choice comes up, what makes TRAIN better for training him wins, and a change
from FitNotes still goes in Deliberate departures below, so the record stays
whole.

**"I don't workout, I train."** Tom, 2026-09-14. A workout is a selection of
exercises, maybe random, maybe copied. A training session is designed, personal,
and meant to move him towards a goal. That is what TRAIN adds on top of
FitNotes: a session has a name and a training block, a repeat says set by set how
much stronger it was, a session adds itself up at the end, a week counts sets per
muscle, and records start again with each block. See "Training, not working out"
below. The same day he lifted the rule that TRAIN must use FitNotes' words: it
says session and training, never workout.

## Fields and settings (the brief's version, 2026-10-21)

- `set.kg` is always kilograms. `set.u` is the unit it was typed in.
- `exercise.inc` is a step somebody chose only when `incOwn` is 1, the row is from
  FitNotes (`fnKind`), or it is not the factory 2.5 or 1 (`TRAIN.ownInc`, 1.0.63).
  Every starter and new exercise wrote 2.5, so until then Default Weight Increment
  reached nothing, on Tom or a client. On a client it is theirs, so it is per person.
- `exercise.wu` is the exercise's own weight unit, `kg` or `lb`; missing means
  the app's. **Never read `exercise.unit` as a unit**: the importer wrote `kg`
  there on all 270 of his FitNotes exercises, from a 0 that means default.
- `set.dist` is always **kilometres**. `set.dur` is always **seconds**.
- `set.done` is the tick box and nothing else: his mark, never the app's.
  `set.plan` is the app's: 1 on a set TRAIN wrote on his behalf, from a copied
  day, a routine or Copy Set. A plan is not work until it is ticked or pressed
  UPDATE on; everything else counts the moment it is saved. See `TRAIN.counts`.
- `set.warm` marks a warmup by hand: dimmed, never a record, and never lined up in
  the set-N-against-set-N comparison, but **counted in every total** since 1.0.50
  (Tom, 2026-10-05: "All of train"). **A set is also a warmup when its comment says so**, worked out when the
  index is built and never written back; a stored `warm` of 1 or 0 beats the comment.
- **A split set is read from its comment only**, never stored. See "What a comment says".
- `set.su` is the setup that set was done with, `{fieldId: 1 or "value"}`.
  `exercise.setup` is the list of fields, `[{id, name, kind}]`, `kind` `toggle` or `value`.
- `session.name` is how a repeat is recognised. `session.vs` is a day he picked to
  compare with, and beats every automatic choice.
- `set.pr` is recalculated, never trusted from the moment of saving. See Personal records.
- `exercise.kind` is one of `wr` `dt` `wd` `wt` `rd` `rt`. See Exercise types.
- `exercise.also` maps other category ids to a fraction: a pull-up is half a set of biceps.
- `exercise.gdef` is `{type, per}`, its default graph and period.
- `session.order` is only present once he has moved an exercise within that day.

### Settings (`train.*`)

`unit` `distUnit` `weekStart` `catShow` `setLimit` `skipEmpty` `markComplete`
`increment` `autoNext` `trackPRs` `keepAwake` `restSeconds` `restAuto` (on by default; starts the rest timer when a set is TICKED, never on SAVE or UPDATE, 1.0.33)
`restVibrate` `restSound` `rest` (a running timer) `workoutTimerAuto`
`workoutTimerStop` `graphPoints` `graphTrend` `graphZero` `e1rmMaxReps`
`repCounts` `exSort` `catSort` `plates` `bars` `seen` `prRule` (3 once records
have been worked out under effective reps, 1.0.70; 2 was the rule that kept split sets apart) `sortSeen`
`sortSkip` (Sort Into Groups: offered once, and the moves he switched off)
`splitShort` `splitMid` `splitLong` (how much a split set's later parts count toward strength, in %, 80, 50 and 0 until changed; guesses, 1.0.70)
`rangePrint` (the Profile painting's print, written only when he switches; `rangeBase` is left over from 1.0.37 and read by nothing since the painting became one picture in 1.0.38)
`share.<exercise id>` (0 when that lift is left out of what he shares; written only by its switch on the Share Picture panel, 1.0.39).

**Reps may carry a fraction** (1.0.37, Tom: "let it add fractions for reps"):
a half rep is 8.5. Every reps box uses the keypad with a point, the steppers
keep the fraction (8.5 then 9.5), `TRAIN.readReps` reads a comma as the point
and keeps two places, `TRAIN.showReps` prints one. **A partial rep counts
down for a rep max**, as it does in a split: 100 x 8.5 is an 8-rep max. The
still-standing record rule compares the real number, so 8.5 beats 8.

A setting that is on by default is read as `!== 0`; one that is off by default
as `=== 1`. Mixing those up turns a default the wrong way for everyone who never
opened Settings.

## What a comment says (the brief's version, 2026-10-21)

Warmups and split sets are read out of a set's comment, **and only out of the
comment** (Tom: "make it happen automatically due to comments and ONLY due to
comments"). Nothing is written back, so editing a comment changes what the set is.

- **A warmup** is a comment with "warmup", "warm up" or "wu" in it. **161** of his
  sets. A warmup marked by hand, or unmarked by hand, beats the comment, which is
  how "start having a dedicated warmup set" stops being a warmup.
- **A split set** is his rep notation, when the numbers add up to the set's reps:

  | Comment | Means |
  |---|---|
  | `10 5` | a short rest, about three breaths |
  | `10,5` | under thirty seconds |
  | `10+5` | a long rest, still the same set |

  A partial rep rounds down: `5 1.5` is 6 reps. The numbers can sit inside other
  words: "Height 11, 10 5" on 15 reps is 10 and 5. Numbers that do not add up are
  not a split: "5 5 4 4" on a 9-rep curl is per side, "2 10s" is plates. **610** of
  his sets: 430 short rests, 112 under thirty seconds, 68 long.
- **What a split counts for in strength** (`TRAIN.effReps`, 1.0.70): the first
  part whole, each later part by the rest before it times what the part before
  counted. Short rest 80%, under thirty seconds 50%, long rest 0%. **These are
  guesses, not research**, and Settings, More, SPLIT SETS changes them. So
  `10 5` is 14, `10,5` is 12.5, `10+5` is 10, `10 5,3` is 15.2. Never more than
  the set's reps. Kept on the index as `er`, never on the row.

## Weight, distance and time (the brief's version, 2026-10-21)

Every set stores the true value and display converts. His file is why this
matters: 7,886 sets entered in kilograms and 4,484 in pounds in one continuous
log, and 500 lb is on disk as 226.79645 kg.

- **An exercise reads in its own unit** (Edit Exercise, Weight unit: DEFAULT, LBS
  or KGS, 1.0.34), else the one chosen in Settings, never in the unit a set was
  typed in. Tom, 2026-09-25: *"Option to denote lbs and kilos PER exercise."*
  `TRAIN.unit(ex)` takes an exercise, its id or a set; with nothing it is the
  app's. Anything about one exercise (TRACK, HISTORY, GRAPH, records, goals,
  calculators, plates, the day's sets, the change against last time) passes
  the exercise. **A total across exercises** (session volume, the week,
  Profile, Analysis by muscle group, the spreadsheet) stays in the app's unit.
  So two units can sit on one day's log, one per exercise.
- **One decimal and the unit plural**: `4.0 kgs`. That is how FitNotes prints it.
- A workout's length **truncates**: 72m 56s is `1h 12m`.
- Rounding is display-only. Never write a rounded value back.
- Distance shows in km or mi; time as `m:ss` or `h:mm:ss`. A bare number typed into
  a time field is seconds.
- FitNotes stores distance in an INTEGER column. TRAIN reads it as **metres**.
  **Unverified**: his file has no distances in it to check against.

## For the foundation (the brief's version, 2026-10-21)

TRAIN never edits `shared/`; a need goes here. (HISTORY.md: For the foundation) Still open:
- ~~**Keep the middle of the story clear**~~ Done 2026-10-02: `IO.share` takes a `frame` builder and `IO.frameShot` pictures it edge to edge. The session uses it; the week, Profile, records and GRAPH pictures are still cards.
- ~~**The five record symbols**~~ Done 2026-10-21 (1.0.75): roles `pr-life`, `pr-block`, `pr-weight`, `pr-reps`, `pr-vol` in `shared/icons.js`; `TRAIN.prIcon` is `ico('pr-' + id)`.
- **SHEET still keeps split sets apart** (`sheet/index.html`, `splitNote`, records
  read `!s.split`). TRAIN counts them by effective reps since 1.0.70, so SHEET's
  feats can disagree with TRAIN's records. A SHEET session should copy
  `TRAIN.effReps` and the three `train.split*` settings. COACH reads no split rule.
- **A note row on the Share panel.** `options` are switch rows only, so nothing can say which lifts were left out and why.
