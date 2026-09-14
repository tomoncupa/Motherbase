# TRAIN

The training log. A faithful reproduction of FitNotes v25.1 on the Motherbase
foundation, wearing Motherbase skins.

This brief governs `train/` only. It obeys the master brief at the repo root and
may add rules but never contradict them. Where the two disagree, the root wins
and this file is the bug.

## The mission, stated plainly

Tom has used FitNotes for four and a half years: 12,370 sets across 631 workout
days. It is the only app in his life he has never abandoned. **He will not move
until TRAIN does everything FitNotes does** (Tom, 2026-09-14). So the job is not
to improve FitNotes. It is to rebuild it closely enough that moving is not a
decision, and then let it share a brain with the rest of the suite and wear the
same skins.

**Fidelity is the feature.** When a choice comes up between what FitNotes does and
what would be nicer, FitNotes wins. A disagreement goes in Deliberate departures
below, never in the code quietly.

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

---

## Ownership

TRAIN writes these types. Ownership means TRAIN is responsible for the shape;
see the root brief on many writers. Every edit merges into the row as it is
(`TRAIN.patchRow`), never rebuilds it from a list of fields.

| Type | Key | Payload |
|---|---|---|
| `excat` | category id | `{name, slot, ord}` — a muscle group. `slot` is a theme colour slot, never a hex |
| `exercise` | exercise id | `{name, cat, kind, inc, rest, unit, fav, note, graph, also, gdef}` |
| `set` | timestamp id, or `fn<id>` from FitNotes | `{ex, kg, r, u, done, pr, prf, dist, dur, note, ord, warm}` — **one row per set** |
| `session` | `''` | `{start, end, note, from, order}` — the day's timer, comment, the day it was copied from, and the exercise order he set |
| `sgroup` | group id, dated | `{name, slot, ex:[ids], jump, resthold}` — a superset |
| `program` | program id | `{name, ord}` — a routine |
| `progday` | id | `{program, name, ord}` — a day within a routine |
| `progex` | id | `{day, ex, ord, fill, sets:[{kg, r, u}]}` — an exercise in a routine day |
| `goal` | goal id | `{kind, ex, kg, r, u, title, from, to, ord}` |
| `setting` | `train.*` | configuration; the full list is below |

Plus one shared write: **`tick`**, covered below.

**Why `program` and not `routine`:** BLOCK already owns `routine`.

**Plates and bars live in `setting`** (`train.plates`, `train.bars`): they
describe the gym, not the training.

### Fields worth knowing

- `set.kg` is always kilograms. `set.u` is the unit it was typed in.
- `set.dist` is always **kilometres**. `set.dur` is always **seconds**.
- `set.warm` marks a warmup: dimmed, never a record, never counted in volume or set totals.
- `set.pr` is recalculated, never trusted from the moment of saving. See Personal records.
- `exercise.kind` is one of `wr` `dt` `wd` `wt` `rd` `rt`. See Exercise types.
- `exercise.also` maps other category ids to a fraction: a pull-up is half a set of biceps.
- `exercise.gdef` is `{type, per}`, its default graph and period.
- `session.order` is only present once he has moved an exercise within that day.

### Settings (`train.*`)

`unit` `distUnit` `weekStart` `catShow` `setLimit` `skipEmpty` `markComplete`
`increment` `autoNext` `trackPRs` `keepAwake` `restSeconds` `restAuto`
`restVibrate` `restSound` `rest` (a running timer) `workoutTimerAuto`
`workoutTimerStop` `graphPoints` `graphTrend` `graphZero` `e1rmMaxReps`
`repCounts` `exSort` `catSort` `plates` `bars` `seen`.

A setting that is on by default is read as `!== 0`; one that is off by default
as `=== 1`. Mixing those up turns a default the wrong way for everyone who never
opened Settings.

### What TRAIN does not own

**Body weight and measurements.** STATUS owns every daily measurement. TRAIN does
not build FitNotes' Body Tracker.

---

## The tick

Logging a workout writes a shared `tick` for the activity `training`, so BLOCK,
the habit tracker and the home screen know he trained.

Tom's rule: **if TRAIN says a training day is ticked, it is ticked.** TRAIN
re-asserts rather than argues: every time a day's sets change it rewrites that
day's tick from the truth — ticked if the day has a set, not if it has none —
and TRAIN's write is always the newer one. Payload `{src:'train', qty:<sets>}`.

Moving or deleting a workout re-asserts both days. Verified 2026-09-14.

---

## Weight, distance and time

Every set stores the true value and display converts. His file is why this
matters: 7,886 sets entered in kilograms and 4,484 in pounds in one continuous
log, and 500 lb is on disk as 226.79645 kg.

- **Everything on screen reads in the unit chosen in Settings**, never in the unit a
  set was typed in. Two units never appear on one screen.
- **One decimal and the unit plural**: `4.0 kgs`. That is how FitNotes prints it.
- A workout's length **truncates**: 72m 56s is `1h 12m`.
- Rounding is display-only. Never write a rounded value back.
- Distance shows in km or mi; time as `m:ss` or `h:mm:ss`. A bare number typed into
  a time field is seconds.
- FitNotes stores distance in an INTEGER column. TRAIN reads it as **metres**.
  **Unverified**: his file has no distances in it to check against.

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

## Personal records

**A set is a record while nothing has ever been heavier at that many reps or
more.** Ties go to more reps, then to the earlier set. So a record can stop
being one, and `recomputePRs` walks a whole exercise rather than asking whether
the newest set was the heaviest.

Weights are compared at **three decimal places**: old FitNotes versions stored
one weight as two floats a millionth apart, and at two places a 22.05 lb lunge
tied with a 10 kg one that FitNotes had told apart.

**Verified against his file, 2026-09-14:** FitNotes flagged 537 sets. After
importing, recalculating with this rule changed **0** flags. The rules tried on
the way there, so nobody tries them again:

| Rule | Flagged | Agreeing with FitNotes |
|---|---|---|
| Heavier than every earlier set | 819 | 263 |
| Heavier than anything at these reps or more, at the time | 1,555 | 537, plus 1,018 extra |
| Still standing, weights at two decimals | 537 | 536 |
| **Still standing, weights at three decimals** | **537** | **537** |

## Which day a week starts on

FitNotes stores Java's `Calendar` constant: **1 is Sunday, 2 is Monday.** His file
says 1 and his calendar starts on SUN. An earlier version of this file read 1 as
Monday.

---

## The importer

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

### Set comments: 4,297 in the file, 2,240 on sets

FitNotes keeps a comment after its set is deleted. Of his 4,297 set comments,
**2,057 point at sets that no longer exist**, some dated 2019, before his log
starts. **All 2,240 comments that have a set come across.** The import screen
shows both numbers. Earlier versions of this brief expected 4,297 on sets; that
target was wrong.

---

## Where things live on screen

FitNotes' screen layout is the reference.

- **Workout screen bar:** menu, title, calendar, add, more.
- **Training screen bar:** today's exercises, exercise name, rest timer, personal
  records, exercise overview, more. Tabs TRACK, HISTORY, GRAPH.
- **One card per exercise** on the day: name, hairline, two right-aligned columns.
  No set numbers on the day view. A comment is a marker at the left of its set.
- **More on the workout screen:** Settings, Copy Workout, Copy This Workout, Move
  Workout, Comment Workout, Time Workout, Supersets, Share Workout, Analysis.
- **More on the training screen:** Copy Previous Sets, Plate Calculator, Set
  Calculator, Estimated 1RM Calculator, Add To Superset, Replace Exercise, Add Goal,
  Edit Exercise, Settings, Remove Exercise.
- **More on the exercise list:** Create New Exercise, Add New Category, Edit
  Categories, Sort By Last Used.
- **The menu** (hamburger, off the training screen): Workout, Calendar, Exercises,
  Workout Routines, Personal Records, Analysis, Goals.
- **The empty day:** "Workout Log Empty", Start New Workout, Copy Previous Workout.

**Every row that can be changed has a menu**, on a long press and a right click
both (DOCTRINE law 14), and every one of those menus also has a visible way in —
a ⋮ button on the row, a Reorder button, or the screen's More (law 6).

**No invented summaries.** Totals live in Analysis.

**Importing is in Settings only.** It is done once; it does not get furniture.

## First run

One question: pounds or kilograms, pounds preselected, changeable in Settings.
Everything else has a working default.

## Category colours

A category stores a **slot**, not a colour: six theme chart colours, each in two
tints, twelve choices. `TRAIN.slotColor` returns a reference to the token
(`var(--data-3)`), not the colour it held, so switching theme recolours every
category immediately. Verified 2026-09-14 by switching skins with a calendar open.

---

## Deliberate departures

Only these. Anything else is a bug.

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

### The rest timer

It **recovers rather than pretends.** The moment it started is stored (in
`train.rest`, through the store), and the time left is always recomputed from the
clock, so coming back to a suspended tab shows "+0:40" over rather than resuming
where it froze. With Keep Screen On the tab is never suspended, so it rings.
Keep Screen On uses the browser's Wake Lock and says so in Settings where the
browser does not support it.

---

## What is built, as of 2026-09-14

Everything below was driven in the browser at 375px against his real backup,
except where a row says otherwise.

| Area | Built |
|---|---|
| Workout log | Cards, comments, warmups, timer card, repeat comparison, category shown as nothing, a name, or name and colour, set limit, superset tags, skip empty dates |
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
  of his exercises use the default, so nothing of his depends on it.
- Showing body weight above the workout log. Off in his FitNotes; would read STATUS.
- Saved graph favourites beyond one default per exercise.
- Sharing a workout as a picture. Share Workout shares text.
- The calendar's detail panel under the grid. Off in his FitNotes.
- A confirmation when an exercise's type is changed. The data is kept either way.

---

## The phone

The target is a **Samsung Galaxy A10**, his gym phone: 2019, 2 GB of RAM.

- Load `shared/mobile.js` and build from `shared/ui.js`. Do not re-solve tap
  delay, keyboards, sheets or the back stack here.
- **Redraw once per burst of writes.** One SAVE is up to four writes; each used to
  reindex every set. `Rec.on` now schedules one redraw.
- **Two maps are cached** (`TRAIN.exercises()`, `TRAIN.cats()`), dropped on every
  store announcement.
- Never render 12,370 sets. History pages by 100, records by 60, rep max by 40.

---

## For the foundation

Found while building TRAIN. All of it is in `shared/`, so TRAIN works around it
and says so here rather than editing it.

1. **`shared/icons.js` has no minus, trophy or hamburger.** TRAIN draws those three
   in the same stroke style (`MINUS`, `TROPHY`, `BURGER`). Move them when the set has them.
2. **`UI.segmented` buttons are 38px tall.** Root brief foundation item 9. TRAIN
   uses it on seven screens and cannot fix it from here.
3. **A desktop `UI.menu` cannot be clicked with a mouse.** Root brief items 10 and
   11. TRAIN's `menuAt()` stops the press inside the menu from bubbling, the same
   workaround as LOG. Delete it when `ui.js` is fixed.
4. **`chart.js` steps stop at 5000.** Root brief item 8. TRAIN's `bigStep()` works a
   step out past the table for volume graphs. Delete it when the table grows.
5. The root brief's Current state row for `train/` still says build in progress.

---

## Testing

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
| Personal record flags | 537, and **0 changed** by Re-calculate |
| Entered in kg / lb | 7,886 / 4,484 |
| Starter movements removed | 111 |

**Always test:** an empty install can create an exercise and log a set with nothing
imported; importing twice writes nothing; a weight typed in pounds reads back in
pounds; copying a day keeps its `from` after the day's comment is edited; moving a
day moves its ticks; a hold and a right click both open a row's menu; a theme
change recolours category dots; delete and undo both land.

Never claim it works because it should. Claim it because you watched it.

---

## Parked

**The wrapper app.** An Android wrapper would let the rest timer ring with the
screen off. It is parked because it introduces a build step, which is a decision
about the whole suite. Keep Screen On covers most of what it would have fixed.
