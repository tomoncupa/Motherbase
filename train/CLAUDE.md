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

Read out of FitNotes v25.1 and his own backup; nothing of its code or images was taken, and never may be. (HISTORY.md: Provenance)

---

## Ownership

TRAIN writes these types. Ownership means TRAIN is responsible for the shape;
see the root brief on many writers. Every edit merges into the row as it is
(`TRAIN.patchRow`), never rebuilds it from a list of fields.

| Type | Key | Payload |
|---|---|---|
| `excat` | category id, the slug of its name | `{name, slot, ord}` — a muscle group. `slot` is a theme colour slot, never a hex, and there are only twelve |
| `exercise` | exercise id | `{name, cat, kind, inc, rest, unit, fav, note, graph, also, gdef, setup, bar, wu}` |
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
- `exercise.wu` is the exercise's own weight unit, `kg` or `lb`; missing means
  the app's. **Never read `exercise.unit` as a unit**: the importer wrote `kg`
  there on all 270 of his FitNotes exercises, from a 0 that means default.
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
`increment` `autoNext` `trackPRs` `keepAwake` `restSeconds` `restAuto` (on by default; starts the rest timer when a set is TICKED, never on SAVE or UPDATE, 1.0.33)
`restVibrate` `restSound` `rest` (a running timer) `workoutTimerAuto`
`workoutTimerStop` `graphPoints` `graphTrend` `graphZero` `e1rmMaxReps`
`repCounts` `exSort` `catSort` `plates` `bars` `seen` `prRule` (2 once records
have been worked out under the rule that keeps split sets apart) `sortSeen`
`sortSkip` (Sort Into Groups: offered once, and the moves he switched off).

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
a ⋮ button on the row, or the screen's More (law 6). On a list with an order
the long press is a hold let go without moving; see `holdToMove` below.

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

## What is built

Everything FitNotes v25.1 has, plus the training layer above. The area-by-area
table of what was built and driven in the browser, and the short list of what
was deliberately not built (a per-exercise weight unit, body weight above the
log, saved graph favourites, the calendar's detail panel), is in
`HISTORY.md: What is built, as of 2026-09-14`.

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

TRAIN never edits `shared/`; a need goes here. Still open: nothing. (HISTORY.md: For the foundation)

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

## Send To Coach, over the shelf

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

## Opened straight into the import

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
- **Twelve muscle groups, and twelve is the ceiling** — a group stores a slot
  and there are six chart colours in two tints. A group's slot is its place in
  `DEFAULT_CATS`, so **that order decides the colours**; as it stands Legs and
  Hamstrings are two tints of one hue, and so are Core and Lower Back.
  `TRAIN.catId` slugs a name into its key. `TRAIN.fillCats` adds any standard
  group an existing log is missing, **moves no exercise**, and skips a group he
  deleted by asking `Rec.tombstone` rather than remembering what it wrote —
  and it runs inside `Rec.ready`, when every device's tombstones are in.
  **It looks for a group by NAME** (`TRAIN.catWord`, plural dropped), never
  by the key it would make: a FitNotes group is keyed `fn<id>`, and until
  1.0.27 his log got a second, empty Forearms. Arms counts as there when he
  has Biceps or Triceps, Core when he has Abs (`TRAIN.CAT_ALSO`). An app-made
  copy beside one of his is deleted while it holds no exercise, and kept once
  it holds one.
- **Movements change group only through the SORT sheet** (1.0.28,
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

## Parked

**The wrapper app.** An Android wrapper would let the rest timer ring with the
screen off. It is parked because it introduces a build step, which is a decision
about the whole suite. Keep Screen On covers most of what it would have fixed.

## History

The diary is `HISTORY.md` beside this file: what was built, watched and left
open, including the line this app had in the root brief until 2026-09-22.
(`HISTORY.md: History, moved from the root brief on 2026-09-22`)
