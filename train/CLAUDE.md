# TRAIN

The training log. A faithful reproduction of FitNotes v25.1 on the Motherbase
foundation, wearing Motherbase skins.

This brief governs `train/` only. It obeys the master brief at the repo root and
may add rules but never contradict them. Where the two disagree, the root wins
and this file is the bug.

## The mission, stated plainly

Tom has used FitNotes for four and a half years. 12,370 sets, 631 workout days,
4,297 set comments. It is the only app in his life he has never abandoned. The
job is not to improve it. The job is to rebuild it so exactly that moving is not
a decision he has to think about, and then let it share a brain with the rest of
the suite and wear the same skins.

**Fidelity is the feature.** When a choice comes up between what FitNotes does and
what would be nicer, FitNotes wins. Log the disagreement in Deliberate departures
below rather than quietly improving something.

## Provenance

Everything about how FitNotes behaves was read out of the app itself:
`com.github.jamesgay.fitnotes` v25.1, from the APK. What was taken:

- the full SQLite schema, 20 tables, column by column
- all 44 columns of the `settings` table, which is the settings screen in order
- every user-facing string in the app, several thousand
- the SQL FitNotes uses for personal records and routine loading, which fixes the
  exact sort and tie-break rules
- the default categories and exercise names

What was **not** taken, and must never be: FitNotes' compiled code, and its image
files. The APK contains no source, only obfuscated Android bytecode, and the
target here is one HTML file of plain JavaScript, so there was nothing
transferable in it anyway. Every line in `train/index.html` is written here.
Every icon is drawn here.

---

## Ownership

TRAIN writes these types and no others. It may read anything.

| Type | Key | Payload |
|---|---|---|
| `excat` | category id | `{name, slot, ord}` — a muscle group. `slot` is a theme colour slot, never a hex |
| `exercise` | exercise id | `{name, cat, kind, inc, rest, unit, fav, note, graph}` |
| `set` | timestamp id | `{ex, kg, r, u, done, pr, prf, dist, dur, note, grp, ord}` — **one row per set** |
| `session` | `''` | `{start, end, note}` — the day's start and end time, and the day comment |
| `sgroup` | group id | `{name, slot, jump, resthold}` — a superset |
| `program` | program id | `{name, ord}` — a routine |
| `progday` | `<program>.<n>` | `{name, ord}` — a day within a routine |
| `progex` | `<progday>.<n>` | `{ex, ord, fill, sets:[…]}` — an exercise in a routine day, and its predefined sets |
| `goal` | goal id | `{kind, ex, kg, r, u, title, from, to, ord}` |
| `setting` | `train.*` | app config, including the plate and barbell tables |

Plus one shared write: **`tick`**, covered below.

**Why `program` and not `routine`:** BLOCK already owns `routine`. Two apps
writing one type is exactly the collision the master brief forbids, and BLOCK got
there first. TRAIN's routines are `program` / `progday` / `progex`.

**Why plates and barbells live in `setting`:** they are configuration, not
records. 23 plate rows and 2 bar weights that describe the gym, not the training.
They ride in `train.plates` and `train.bars` the same way skins palettes ride in
their own key. If plate history ever matters, they graduate to their own type.

### What TRAIN does not own

**Body weight and measurements.** STATUS owns every daily measurement and TRAIN
must never write one. TRAIN may *display* body weight above the workout log, the
way FitNotes does, reading it from STATUS. That display is off by default.

The Body Tracker screen is not built. If it is ever wanted it belongs in STATUS,
not here.

---

## The tick, and what "TRAIN says so" means

Logging a workout writes a shared `tick`, so BLOCK, the habit tracker and the home
screen all know he trained. `tick` is the one type the master brief lets any app
write, because one cell per activity per day is one fact and the later save wins.

Tom's rule: **if TRAIN says a training day is ticked, it is ticked.** Another app
may tick it, but it may not un-tick it behind TRAIN's back.

That is implemented without breaking last-write-wins, by making TRAIN re-assert
rather than argue:

1. Whenever a set is added, edited or deleted, TRAIN immediately rewrites that
   day's tick from the truth on disk: ticked if the day has at least one set, not
   ticked if it has none.
2. On open, TRAIN re-asserts every day currently on screen.

So a stale or contradicting tick survives only until TRAIN next looks at that day,
and TRAIN's write is always the newer one. Payload is `{src:'train', qty:<set
count>}`, so a reader can tell a TRAIN tick from a manual one.

Never special-case TRAIN inside `records.js` to win a merge. The store stays
dumb; TRAIN stays loud.

---

## Weight, and why it is stored in kilograms

Every set stores `kg`, the true weight in kilograms, and `u`, the unit it was
typed in. Display converts. This is exactly what FitNotes does and it is the
reason his history survives a units change.

His file proves why it matters: 7,886 sets entered in kilograms, 4,484 in pounds,
in one continuous log. 500 lb is on disk as 226.79645 kg. Convert the stored
number and you corrupt four years of training; convert only the display and
nothing moves.

- **Default display unit is pounds**, set in the first-run sequence.
- A set always redisplays in the unit it was entered in, never the global default.
- Rounding is display-only. Never write a rounded value back over a stored one.
- Old FitNotes versions stored some weights at lower float precision, so the file
  contains both 226.79645471781987 and 226.79644775390625 for the same 500 lb.
  Import must round to a sane number of decimals for display without altering the
  stored value.

## First run

FitNotes shows a short setup on first launch and so does TRAIN, in this order:

1. Units. Pounds or kilograms. Pounds preselected.
2. Import. Offer the FitNotes importer straight away, because for Tom this is the
   first thing that should happen, not something buried in settings.
3. Nothing else. Every other setting has a working default and can wait.

---

## Category colours

Nine categories, and skins carry six chart colours. So a category stores a
**slot**, not a colour: six theme colours, each available in a light and a dark
tint, twelve distinct choices, all derived from the active theme.

- A category never stores a hex. It stores a slot index.
- Changing skin recolours every category automatically and correctly.
- Tom assigns which category sits in which slot. That assignment is his data and
  survives a theme change.
- Import maps his nine existing FitNotes colours to their nearest slot, then he
  reassigns any he dislikes. His current setting has category colours switched
  **off**, so this is not urgent on day one.

This is the master brief's no-hex rule kept intact: the colours are tokens, the
assignment is data.

---

## The importer

`FitNotes_Backup_*.fitnotes` is a plain SQLite database with the extension
changed. Confirmed: the file begins `SQLite format 3`.

The reader is written here, in plain JavaScript, no library. Reading a handful of
tables out of a SQLite file means walking its b-tree pages, which is a documented
format and a few hundred lines. **No CDN dependency**, because an importer that
needs the network breaks the offline-first rule on the one job that matters most.

Rules:

- **Import merges, it does not replace.** Same rule as restore. Every imported row
  carries `updated_at`, so importing the same backup twice changes nothing.
- **One-way.** There is no export back into FitNotes. Writing a valid SQLite file
  from the browser is far harder than reading one, and FitNotes has no CSV import.
  The panel must say so, in those words. Treat the move as a move, not a sync.
- **CSV is the fallback**, carrying date, exercise, category, weight, reps,
  distance, time and comment, but no routines and no settings.
- The 11 body weight readings from 2021 are not TRAIN's to keep. Offer them to
  STATUS as a one-time migration, or skip them. Never store them here.

### What the importer must reproduce

`Comment` rows with `owner_type_id = 1` are **set comments**, and there are 4,297
of them against 12,370 sets. Roughly one set in three. They are not metadata, they
are a third of the record. An import that drops them has failed regardless of how
many sets it moved.

### Exercise kinds

`exercise_type_id` in his file: 258 exercises are weight and reps, 8 are cardio
(Cycling, Walking, Running, Rowing, Swimming, Elliptical, Stationary Bike), 2 are
time-only (Plank, Side Plank), and 2 more sit in kinds used once each (Vacuum,
Hang). All kinds are built. All are unlocked. FitNotes puts some behind its paid
Supporter app; TRAIN has no paywall and never will.

---

## Deliberate departures

Only these. Anything else is a bug.

| FitNotes | TRAIN | Why |
|---|---|---|
| Body Tracker | Not built | STATUS owns measurements. One writer per fact |
| Google Drive backup | Not built | Local only, per the master brief |
| Supporter paywall | Everything unlocked | It is his app |
| Rest timer fires with the screen off | Fires only while the app is open | A backgrounded browser tab is suspended. See below |
| Android back button | Handled by `shared/mobile.js` back stack | No hardware button in a browser |
| Its own theme setting | Motherbase skins | The whole point |
| `routine` | `program` | BLOCK owns `routine` |

### The rest timer, stated honestly

This is the one place TRAIN is worse than FitNotes and it cannot be engineered
around from a page in a browser. A phone browser suspends a tab that is not on
screen. The timer counts correctly while he is looking at it. It will not buzz in
his pocket.

It must therefore **recover rather than pretend**: store the wall-clock time the
timer started, and on returning to the app show the true elapsed time, including
"you're 40 seconds over" rather than resuming from where it froze. Never show a
timer that silently stopped counting.

Fixing this properly needs the wrapper app. See below.

---

## The phone

The target device is a **Samsung Galaxy A10**, his dedicated gym phone. It is a
low-end 2019 handset with 2 GB of RAM. Chrome on it is current, but the hardware
is not.

- **Phone first.** Desktop is the development surface, not the target.
- **Load `shared/mobile.js`.** Another session built it for exactly this. Do not
  re-solve tap delay, keyboard overlap, safe areas or the back stack here.
- One-handed. The controls he touches most, the weight and reps steppers and the
  add button, sit in the bottom third.
- Never render 12,370 sets. Render the day. The history and graph screens page.

### Storage, measured

12,370 sets come to about 2.78 MB of text across 12,370 localStorage entries,
one per set, as the master brief requires.

Measured in Chrome on 2026-08-20: 20,000 entries totalling 19.5 MB wrote in
127 ms and read back in 16 ms, with no quota error. So one row per set fits, and
the row-per-set model is kept.

Two limits that are **not** verified and must not be claimed:

- This was measured on a desktop, not on the A10.
- iOS Safari still caps localStorage near 5 MB. At 2.78 MB of text, stored as
  UTF-16, this data would not fit on an iPhone. TRAIN is an Android target.

---

## Testing

There is no test framework and Tom cannot test code. Node is not installed here
as of 2026-08-20; check before relying on it. Use the browser.

1. `py -3 -m http.server 8777 -d "<repo>"`
2. Drive it with the browser tool, read the console.
3. `shared/_smoke.html` must still pass every check.
4. Clean up test data, stop the server.

**The import test is the one that counts.** Import his real backup and assert,
against the numbers read straight out of the file:

| Check | Expected |
|---|---|
| Sets | 12,370 |
| Workout days | 631 |
| Date range | 2022-01-01 to 2026-08-05 |
| Exercises | 270 |
| Categories | 9 |
| Set comments | 4,297 |
| Workout timings | 550 |
| Supersets | 55 across 40 days |
| Personal record sets | 537 |
| Sets stored in kg / entered in lb | 7,886 / 4,484 |

Also always test: importing twice changes nothing, a set logged before the day
start hour lands on the day before, personal records recompute to the same 537,
a weight entered in pounds redisplays in pounds after switching the default to
kilograms, and category colours stay readable after switching skin.

Never claim it works because it should. Claim it because you watched it.

---

## Parked

**The wrapper app.** Tom wants Motherbase to live on the A10, and an Android
wrapper is the only thing that fixes the rest timer. It is a small Android project
whose only job is to open this HTML file full screen and hold a wake lock.

It is parked, not cancelled, for one reason: it introduces a build step, and the
master brief says the file he uploads is the file that runs. That is a decision
about the whole suite, not about TRAIN, so it does not get made here.

This machine has no Java, no Android SDK and no Gradle. Roughly 3 to 5 GB of
tooling would need installing first. There is no Android device or emulator here,
so the resulting APK could not be tested by anyone but Tom.
