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
| `exercise` | exercise id | `{name, cat, kind, inc, rest, unit, fav, note, graph, also, gdef, setup}` |
| `set` | timestamp id, or `fn<id>` from FitNotes | `{ex, kg, r, u, done, plan, pr, prf, dist, dur, note, ord, warm, su}` — **one row per set** |
| `session` | `''` | `{start, end, note, from, order, name, vs}` — the day's timer, comment, the day it was copied from, the exercise order he set, the session's name, and a day he picked to compare it with |
| `phase` | phase id | `{name, start, end}` — a training block. `end` is optional |
| `sgroup` | group id, dated | `{name, slot, ex:[ids], jump, resthold}` — a superset |
| `program` | program id | `{name, ord}` — a routine |
| `progday` | id | `{program, name, ord}` — a day within a routine |
| `progex` | id | `{day, ex, ord, fill, sets:[{kg, r, u}]}` — an exercise in a routine day |
| `goal` | goal id | `{kind, ex, kg, r, u, title, from, to, ord}` |
| `setting` | `train.*` | configuration; the full list is below |

Plus one shared write: **`tick`**, covered below.

**Why `program` and not `routine`:** BLOCK already owns `routine`.

**Why `phase` and not `block`:** BLOCK is another app in the suite, and it has
nothing to do with training beyond a training block ticking when TRAIN has data
(Tom, 2026-09-14). On screen it is a training block.

**Plates and bars live in `setting`** (`train.plates`, `train.bars`): they
describe the gym, not the training.

### Fields worth knowing

- `set.kg` is always kilograms. `set.u` is the unit it was typed in.
- `set.dist` is always **kilometres**. `set.dur` is always **seconds**.
- `set.done` is the tick box and nothing else: his mark, never the app's.
  `set.plan` is the app's: 1 on a set TRAIN wrote on his behalf, from a copied
  day, a routine or Copy Set. A plan is not work until it is ticked or pressed
  UPDATE on; everything else counts the moment it is saved. See `TRAIN.counts`.
- `set.warm` marks a warmup by hand: dimmed, never a record, never counted in volume or
  set totals. **A set is also a warmup when its comment says so**, worked out when the
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
`increment` `autoNext` `trackPRs` `keepAwake` `restSeconds` `restAuto`
`restVibrate` `restSound` `rest` (a running timer) `workoutTimerAuto`
`workoutTimerStop` `graphPoints` `graphTrend` `graphZero` `e1rmMaxReps`
`repCounts` `exSort` `catSort` `plates` `bars` `seen` `prRule` (2 once records
have been worked out under the rule that keeps split sets apart).

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
- **Three settings are the client's** (`seen`, `prRule`, `rest`), namespaced
  `train.<pid>|<name>`. Everything else, the unit included, stays Tom's, so
  changing the unit there changes it in his own TRAIN.
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

**Split sets keep records of their own** (Tom, 2026-09-14). The still-standing
rule runs twice per exercise, once over straight sets and once over split sets,
so a set with a rest in it can neither take a straight record nor lose one to it.
This is where TRAIN stops matching FitNotes on purpose: his file now carries
**688** flags, and Re-calculate changes **0**. Straight records, rep maxes and the
estimated 1RM leave split sets out; the records sheet lists them separately.

**Records start again with each training block**, and the all-time ones stay. The
stored `pr` flag is still the all-time, still-standing rule. Block records are
worked out when shown.

## Training, not working out

Built 2026-09-14 from Tom's answers. All of it sits on top of FitNotes; none of
it replaces a FitNotes screen.

### What a comment says

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

### What counts

A set counts unless it is a plan still waiting. **A past day counts as it was
logged**: 1,099 of his FitNotes sets were never ticked, and Analysis has always
counted them. Today, a copied or routine-filled set is not work until it is
ticked or pressed UPDATE on, and `plan` is what marks one. A set he typed and
saved is work the moment it is saved, box or no box. Warmups never count.

### Training blocks

A `phase` row: a name, a start, and an optional end. A block runs until the next
one starts, or until its own end. The session strip under the date shows the
block and its week number. Deleting a block keeps every session in it.

### Names, and how much stronger

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

### The session card

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

### The week

Analysis opens on WEEKLY: sessions, sets, reps and volume, then sets per muscle
(half a set for a muscle an exercise also works) and HIT, the number of sessions
that trained it. Below it, eight weeks of sets per muscle. **No targets**, at Tom's
request: "I'd rather be told how many times I hit a muscle, I'll know if I need to
hit more."

### Profile

Menu, Profile, or the menu's header. How long he has trained, all-time sessions,
sets, reps and volume, the current block, All-Time Records, Block Records, and
every block with its sessions. Records screen: THIS BLOCK and ALL TIME, shown once
a block exists.

### Setup

An exercise carries the setup it needs, named by him, each a **toggle** (Straps)
or a **setting** (Seat height, Back pad). **Each set records its own**, because
straps go on after a couple of working sets. A new set takes the setup of the set
before it today; the first set of a session takes the first set of the last
session. TRACK shows it above the steppers and under each set. Edit Setup is in
the training screen's More.

### Asked about, and turned down

Plateau notices, weekly set targets, and goals tied to sessions. Tom said no to
each on 2026-09-14. Do not add them back.

---

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
- **Analysis:** WEEKLY first, then BREAKDOWN and GRAPHS.

**Every row that can be changed has a menu**, on a long press and a right click
both (DOCTRINE law 14), and every one of those menus also has a visible way in —
a ⋮ button on the row, a Reorder button, or the screen's More (law 6).

**Summaries are facts, never verdicts.** The end of a session and the week add
themselves up because Tom asked for both. Neither praises, sets a target, or
points out a plateau: he asked for none of that.

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

### The rest timer

It **recovers rather than pretends.** The moment it started is stored (in
`train.rest`, through the store), and the time left is always recomputed from the
clock, so coming back to a suspended tab shows "+0:40" over rather than resuming
where it froze. With Keep Screen On the tab is never suspended, so it rings.
Keep Screen On uses the browser's Wake Lock and says so in Settings where the
browser does not support it.

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
  of his exercises use the default, so nothing of his depends on it.
- Showing body weight above the workout log. Off in his FitNotes; would read STATUS.
- Saved graph favourites beyond one default per exercise.
- The calendar's detail panel under the grid. Off in his FitNotes.
- A confirmation when an exercise's type is changed. The data is kept either way.

---

## The phone

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

---

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
| Personal record flags | 688 with split sets kept apart (FitNotes flagged 537), and **0 changed** by Re-calculate |
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

## Parked

**The wrapper app.** An Android wrapper would let the rest timer ring with the
screen off. It is parked because it introduces a build step, which is a decision
about the whole suite. Keep Screen On covers most of what it would have fixed.

## History, moved from the root brief on 2026-09-22

What was built and watched, newest last. Moved here verbatim so the root brief
stays small enough for per-module sessions.

Built, and tested in the browser at 390px against Tom's real 12,370-set FitNotes backup; the phone itself is his iPhone 13 Pro, and nothing has been watched on it yet. A reproduction of FitNotes v25.1 on the shared foundation, plus Tom's own idea of training (2026-09-14): sessions with names and training blocks, each working set compared with the same set last time in reps and percentage, a session card and a weekly card that share as story pictures, sets per muscle per week, a Profile with all-time and block records, and setup recorded per set. Warmups and split sets are read from comments. Says session and training, never workout. Owns the training log. Has its own brief.
