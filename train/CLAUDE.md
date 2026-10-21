# TRAIN

The training log. A faithful reproduction of FitNotes v25.1 on the Motherbase
foundation, wearing Motherbase skins.

This brief governs `train/` only. It obeys the master brief at the repo root and
may add rules but never contradict them. Where the two disagree, the root wins
and this file is the bug.

**This is the rules. `HISTORY.md` beside it is the diary**: what was built,
what Tom said and what was watched. A rule ending `(HISTORY.md: <heading>)`
has its story under that heading. Most of this brief moved there on
2026-10-21, at 67 KB.

## The mission, stated plainly

Four and a half years of FitNotes, 12,370 sets: **he will not move until TRAIN
does everything FitNotes does** (Tom, 2026-09-14). **FitNotes is where TRAIN
started, not a rule** (2026-09-15): what trains him better wins, and a change
goes in Deliberate departures. **"I don't workout, I train"**: a session has a
name and a block, a repeat says how much stronger it was, records restart with
each block. It says session and training, never workout.
(HISTORY.md: The mission, stated plainly (the brief's version, 2026-10-21))

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
| `session` | `''` | `{start, end, note, from, order, name, vs, tags, energy, pump, quality, pday}` — the day's timer, comment, the day it was copied from, the exercise order he set, the session's name, a day he picked to compare it with, how it went (context tags, three 1 to 5 ratings), and the routine day it was started from |
| `phase` | phase id | `{name, start, end, program}` — a training block. `end` is optional; `program` is the routine or FORGE program its days come from (1.0.71) |
| `sgroup` | group id, dated | `{name, slot, ex:[ids], jump, resthold}` — a superset |
| `program` | program id | `{name, ord}` — a routine |
| `progday` | id | `{program, name, ord}` — a day within a routine |
| `progex` | id | `{day, ex, ord, fill, sets:[{kg, r, u}], plan, slot}` — an exercise in a routine day; `plan` is the coach's target, `slot` an open slot with `ex: null` |
| `goal` | goal id | `{kind, ex, kg, r, u, title, from, to, ord}` |
| `setting` | `train.*` | configuration |

Plus one shared write: **`tick`**, covered below.

**Why `program` and not `routine`:** BLOCK already owns `routine`.

**Why `phase` and not `block`:** BLOCK is another app in the suite, and it has
nothing to do with training beyond a training block ticking when TRAIN has data
(Tom, 2026-09-14). On screen it is a training block.

**Plates and bars live in `setting`** (`train.plates`, `train.bars`): they
describe the gym, not the training.

### Fields worth knowing

- `set.kg` is always kilograms, `set.u` the unit typed; `exercise.wu` is the
  exercise's own unit. **Never read `exercise.unit` as a unit.** `set.dist` is
  kilometres, `set.dur` seconds.
- `exercise.inc` is a chosen step only by `TRAIN.ownInc` (1.0.63).
- **`set.done` is his tick and nothing else; `set.plan` is the app's** (1 on a
  set TRAIN wrote). A plan is not work until ticked or UPDATEd (`TRAIN.counts`).
- **A warmup is `set.warm`, else its comment**, worked out at index time, never
  written back; a stored 1 or 0 beats the comment. Warmups count in every total
  (1.0.50), never as records or in set-N comparisons. **A split set is read
  from its comment only.**
- `set.su` is the setup a set was done with (`exercise.setup` lists the
  fields). `set.pr` is recalculated, never trusted. `exercise.also` maps other
  groups to a fraction. `session.order` exists only once he has moved one.

### Settings (`train.*`)

The full list, with what each holds, is in the diary. **On by default is read
`!== 0`, off by default `=== 1`**; mixing them turns a default the wrong way
for everyone who never opened Settings. **Reps may carry a fraction** (8.5;
`TRAIN.readReps`, `TRAIN.showReps`); a partial rep counts down for a rep max.
(HISTORY.md: Fields and settings (the brief's version, 2026-10-21))

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

## On a client's profile (1.0.16)

`train/index.html?client=<pid>` is the same TRAIN pointed at one of Tom's
coaching clients; COACH opens it in a frame. The first inline script maps
every TRAIN type to COACH's (`set`→`cset`, `exercise`→`cex` and the rest) with
`pid|` on each key; with `CLIENT` null every call is the store's own.

- **A new TRAIN type goes in the adapter's table, and its `c` twin in COACH's
  `APP.types`**, or that part of a client's log lands in Tom's rows.
- **`Rec.merge` is never mapped**; an import there calls `TRAIN.mergeImport`.
- No `tick` or `activity`; no DATA tab; no Send To Coach; a new set's key gets
  `k-` (COACH bills it); `seedCats` never overwrites an exercise.
- **Every setting changed there is the client's** (`train.<pid>|<name>`); one
  they never had reads Tom's, except `seen`, `prRule`, `rest` and `share.<id>`.
(HISTORY.md: On a client's profile (1.0.16, 2026-09-22))

---

## Weight, distance and time

Every set stores the true value; display converts. **An exercise reads in its
own unit** (`TRAIN.unit(ex)`), else the app's; a total across exercises stays
in the app's unit. One decimal, unit plural (`4.0 kgs`); a length truncates;
rounding is display only, never written back. A bare number in a time field
is seconds; FitNotes distance is read as metres (unverified).
(HISTORY.md: Weight, distance and time (the brief's version, 2026-10-21))

## Exercise types

Six kinds, each the two fields it logs: `wr` `dt` `wd` `wt` `rd` `rt`. Older
values `0`, `2`, `'weight_reps'` read as `wr`; `1`, `'distance_time'` as `dt`.
An imported exercise of any other type is read off what was logged against it
(`TRAIN.kindOf`). (HISTORY.md: Exercise types)

## Personal records

- **A set is a record while nothing has ever been heavier at that many reps or
  more.** Ties go to more reps, then the earlier set; `recomputePRs` walks the
  whole exercise. Weights compare at three decimal places. (HISTORY.md: Personal records, verified against his file)
- **A split set counts its effective reps** in every strength reading
  (`TRAIN.sr(s)`: the still-standing rule, rep maxes, estimated 1RM, block and
  session records, Top 3, GRAPH's 1RM and Max Reps, `setDelta`). **Every total,
  Most volume and the arrow's weight x reps half read `r`, every rep.** Where a
  split set's strength is stated it says so: "10 5 (counts as 14)".
- **Records start again with each training block**; the stored `pr` is the
  all-time rule, block records are worked out when shown.
- **Five kinds, five symbols** (`TRAIN.prKinds`, `TRAIN.prMarks`; icons
  `pr-life` trophy, `pr-block` medal, `pr-weight` barbell, `pr-reps` crown,
  `pr-vol` bars, in `shared/icons.js`). Weight, reps and volume are what the
  set was on its day and keep their symbol after a later set beats it; a set
  shows every kind it is, gold, 12px under the numbers on TRACK so the row
  stays 44px. The records sheet ends with the key.
(HISTORY.md: Personal records (the brief's version, 2026-10-21))

## Training, not working out

Built 2026-09-14 from Tom's answers. All of it sits on top of FitNotes; none of
it replaces a FitNotes screen.

### What a comment says

Warmups and split sets come **only from a set's comment** (Tom); nothing is
written back. A warmup says "warmup", "warm up" or "wu"; a hand mark beats it.
A split set is numbers that add up to the reps: `10 5` short rest, `10,5`
under thirty seconds, `10+5` long rest; numbers that do not add up are not a
split. **Strength counts a split by `TRAIN.effReps`**: later parts at 80, 50
or 0% by the rest before them, guesses he can change, never more than the
reps; kept on the index as `er`. (HISTORY.md: What a comment says (the brief's version, 2026-10-21))

### What counts

A set counts unless it is a plan still waiting. **A past day counts as it was
logged**: 1,099 of his FitNotes sets were never ticked, and Analysis has always
counted them. Today, a copied or routine-filled set is not work until it is
ticked or pressed UPDATE on, and `plan` is what marks one. A set he typed and
saved is work the moment it is saved, box or no box. Warmups count (1.0.50).

### Training blocks

A `phase` row: a name, a start, and an optional end. A block runs until the next
one starts, or until its own end. The session strip under the date shows the
block and its week number. Deleting a block keeps every session in it.

### Names, and how much stronger

- A name locks nothing, a copy carries it, and **a number on its end is
  dropped when matching** (`TRAIN.nameKey`: Back 1, Back 2 and Back are one
  session).
- **Each exercise is measured against**, first match wins: a day he picked
  (Compare With A Day), the last same-named session (this block first), the
  day it was copied from, the last time that exercise was done.
- **Working set N against working set N**, warmups out of both sides. The
  change names every part that moved: `+5 lb · −1 rep · +1.5%`. A split set
  against a straight one gets no direction.
- **Nothing may need a name** (Tom, 2026-10-05): an unnamed day is the same
  session as one sharing half the exercises, or 60% the same muscle mix
  (`TRAIN.likeDays`, `TRAIN.sameSession`). A new feature that reads
  `session.name` must work without it.
(HISTORY.md: Names, and how much stronger)

### The session card

- At the end of every day with work in it, facts only. **Totals are set
  against another day only when it is the same session.** Records are what
  was a record on the day; a first time is not one.
- **SHARE PICTURE** is `IO.share`, a 1080 x 1920 story, no TRAIN mark. **The
  FRAME layout follows Tom's rules of 2026-10-02 over any style rule**: nothing
  in the middle, the full height used, condensed, not blocky, no sideways
  text, no all caps, "x sets x% higher", no RESULTS heading, at most
  `FRAME_PRS` PRs and never "Block PR", weight, sets, reps and time on one
  line at the bottom.
- **A lift can be switched out of what he shares** (`share.<id>`): its name and
  numbers go, the totals stay the whole session. **A lift that went down is
  never shared** (`TRAIN.wentDown`), for everyone, with no switch; its sets
  still count. Share As Text follows both and is working sets only.
(HISTORY.md: The session card)

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

- **A `.fitnotes` backup is read here, in plain JavaScript, offline.** It
  merges (stable ids, `updated_at` from the training date: twice writes
  nothing), in chunks of 400, clears unused starters, and is one way. Strong,
  Hevy, JEFIT and FitNotes CSV also import. Body weight never.
- **Paste From Notes** (`TRAIN.parseNotes` reads, `importNotes` writes,
  `undoNotes` undoes): a date line starts a day, a name with no sets is a
  session comment, a setting with a number is never a name or reps
  (`NT_SETUP`), names match this log by words, keys are `nt-<date>-<n>`, not
  billed. **The 31 set shapes are table-tested: change a rule, re-run the
  table.**
- **Importing is in Settings only**; `&import=1` opens the panel once, and on
  a client's profile it names whose log it is.
(HISTORY.md: The importer (the brief's version, 2026-10-21))

## Where things live on screen

FitNotes' layout is the reference, in Tom's words: session and training where
FitNotes says workout. The day's More starts Name Session and Describe
Session, above Settings. **Copy Past Session is the calendar with a confirm**
(1.0.69): it copies that day's exercises with each one's latest sets and
comments, unticked, and never a day he did not pick.
**Every row that can be changed has a menu** on a long press and a right click,
and a visible way in (a ⋮, or the screen's More). **Summaries are facts, never
verdicts.** (HISTORY.md: Where things live on screen)

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

A change from FitNotes still gets a row in the departures table, so the record
stays whole. (HISTORY.md: Deliberate departures)

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

- **Tom's iPhone 13 Pro in Safari** (390 x 844, about 664 tall with the
  toolbars). The Galaxy A10 is not a target. `vh` is too tall there; no
  vibration, the sound still plays; localStorage stops near 5 MB.
- Build from `shared/mobile.js` and `shared/ui.js`; redraw once per burst of
  writes; never render 12,370 sets (history pages by 100); the first paint
  never waits for the store.
- **On a wide window, side by side, never fold text** (1.0.47): CSS only, both
  queries start far past 390, and **the phone must not move**: check the 390
  screens are unchanged after any change there.
(HISTORY.md: The phone (the brief's version, 2026-10-21))

---

## For the foundation

TRAIN never edits `shared/`; a need goes here. Still open: **a note row on the
Share panel** (`options` are switch rows only, so nothing can say which lifts
were left out). Done: the story frame (2026-10-02), the five record icons
(1.0.75), SHEET counting split sets by effective reps (SHEET 1.0.4).
(HISTORY.md: For the foundation (the brief's version, 2026-10-21))

---

## Testing

Serve the repo, open TRAIN with a fresh `?cb=`, click it the way he would,
read the console, then `_review.html`; clear the store and stop the server.
The import test against his real backup (`Documents/FitNotes_Backup_...`) has
its expected numbers in the diary. **Always test:** an empty install logs a
set; importing twice writes nothing; pounds read back in pounds; a hold and a
right click both open a row's menu; a "wu" comment makes a warmup and a hand
mark beats it; setup carries to the next session; the session card, the week
and Profile fit 390px without sideways scroll. (HISTORY.md: Testing (the brief's version, 2026-10-21))

---

## Sends

- **Send To Coach always sends the whole log, only on a press**, through the
  outbox (`Cloud.post`, `train@1`, `train@2`, `TRAIN.coachParts`); signed
  out it offers SIGN IN TO SEND beside SAVE A FILE, and the file stays the
  fall-back (hard constraint 4). (HISTORY.md: Send To Coach, over the shelf (the brief's version, 2026-10-21))
- **A program the coach sends lands on its own** (`TRAIN.fromCoach` through
  `takeProgram`), never with `CLIENT` set. (HISTORY.md: Sends through the outbox, and programs from the coach (1.0.41, 2026-09-30))

## Rules from the build sessions

Each is short here; its story is under the heading named.

- **Titles never clip** (`fitTitle`), and **a hold on anything with an order
  lifts it** (`holdToMove`): let go without moving and its menu opens. A new
  ordered list uses `holdToMove`, with the touch guard on the list from the
  start. **Saving a set never ticks it**; the rest timer starts from the tick
  box only, rings once at zero and goes. A set row is 44px. **Search is
  `TRAIN.nameMatch`, not typo tolerant on purpose.** No Legs and no Arms
  groups; a group's colour is `TRAIN.CAT_SLOT`; `fillCats` finds a group by
  name and moves no exercise; movements change group only through the SORT
  sheet. Plates ride the WEIGHT label on barbell lifts. Add Warmups writes
  `warm: 1, plan: 1`. Swipe a set left to delete. (HISTORY.md: The training screen, as Tom rebuilt it on 2026-09-24)
- **Routines list his named sessions**; TRAIN opens on today's first waiting
  set; a save is silent unless it is a record. (HISTORY.md: Named sessions, and what opens first (1.0.26, 2026-09-25))
- **A FORGE program is one routine per week** (`prog-<id>-wN`); its target is
  `progex.plan`, shown, never logged; only set one's load is filled
  (the Algrowrithm). (HISTORY.md: A program in weeks, and the coach's target (FORGE branch 1.0.21-1.0.22, on main as TRAIN 1.0.32, 2026-09-25))
- **An open slot** ("Any Chest") is picked once for every week and survives a
  resend; a new exercise from a program reuses a muscle group by name. (HISTORY.md: Open slots, and a muscle group left alone (FORGE branch 1.0.23, on main as TRAIN 1.0.32, 2026-09-25))
- **Merge Into** moves every row onto the kept exercise with one UNDO;
  renaming or dropping a starter needs a `SEED_RENAME` or `SEED_FOLD` entry. (HISTORY.md: Merging two exercises, and starters renamed (1.0.35, 2026-09-25))
- **Warmups count in every total**; records and set-N comparisons stay on
  working sets. A lift's GRAPH opens on Top 3 Sets & Total Work with a
  least-squares trend; the set 1 to 4 lines are hidden, not deleted. (HISTORY.md: Strength graphics and what a trend measures (1.0.49 to 1.0.59))
- **A set's green arrow** shows when it moved more weight x reps than set N
  last time or its estimated 1RM rose. **Decided, not built**: a session
  crossing midnight stays on its start day; a comparison day only within 8
  weeks; total work per lift on the card. (HISTORY.md: The set arrow, and decided not built (2026-10-13))
- **Session context** is `session.tags` plus `energy`, `pump`, `quality` 1 to
  5; sleep is STATUS's; no "How did it go?" row; never on a shared picture. (HISTORY.md: Describe Session (1.0.65 to 1.0.66, 2026-10-18))
- **A new day slides in, a new screen rises**; a redraw of the same screen
  never moves. (HISTORY.md: Motion (1.0.67, 2026-10-18))
- **Inside COACH a back arrow leads the bar** (`#toCoach`, posts
  `coach-close`). (HISTORY.md: Inside COACH, one bar (1.0.68, 2026-10-18))
- **A set row shows its comment and changed setup**, never clipped: 12 down to
  8px, then wrap. (HISTORY.md: Copy from the calendar, names in a series, notes on the row (1.0.69, 2026-10-18))
- **A split set's later parts count by the rest before them** (80, 50, 0%,
  `train.split*`, guesses). (HISTORY.md: Split sets in strength (1.0.70, 2026-10-18))
- **A block can carry its days** (`phase.program`: a routine, a FORGE
  program, or a client's own); the empty day leads with Next in the rotation
  (`nextBlockDay`), set one loaded by `suggestFill`. **The step rule is
  Claude's reading of the Algrowrithm, not yet Tom's**, and a TRAIN-built
  routine has no rep range, so it copies last time. (HISTORY.md: A block's days, in rotation (1.0.71, 2026-10-18))
- **The session strip is one 44px line**: name with the block under it, then
  `.sessnote` (comment, tags, ratings), never clipped; a tap opens one
  SESSION sheet. (HISTORY.md: Notes and context in the session strip (1.0.72, 2026-10-18))
- **`&block=new` or `&block=<key>` on a client's address opens the block
  dialog** and closing it returns to COACH. (HISTORY.md: Opened from COACH onto a block (1.0.74, 2026-10-21))

## Parked

**The wrapper app.** An Android wrapper would let the rest timer ring with the
screen off. It is parked because it introduces a build step, which is a decision
about the whole suite. Keep Screen On covers most of what it would have fixed.

## History

The diary is `HISTORY.md` beside this file: what was built, watched and left
open, including the line this app had in the root brief until 2026-09-22.
(`HISTORY.md: History, moved from the root brief on 2026-09-22`)
