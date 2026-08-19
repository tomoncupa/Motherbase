# Daily Quest OS — build brief

> **Scope changed 2026-08-20.** Everything in here that measures a number —
> sleep, weight, steps, calories, protein, mood, energy — was built into
> `status/` instead, and STATUS is now the one writer of those facts. What is
> left for Daily Quest OS is the todolist: quests, scoring, streaks and ranks,
> reading the measurements rather than collecting them. The data model, the
> field/day/ev row shapes and the design system below all still govern —
> STATUS was built to them. Check the ownership table in the root `CLAUDE.md`
> before writing anything that stores a number.

## Who I am

Tom. Solo premium fitness coach in Manila, 8+ years lifting, founder of Personal
Protagonist. Revenue is in-person coaching, online coaching, and a Skool community
with a free tier and a $7 all-access tier. Moving away from 1:1 toward community
revenue and content. My training system is already called The Daily Quest Method,
so the tracker takes the name.

I am not a developer. Explain decisions in plain language. I will not read code.

## What you are building

Daily Quest OS — a personal habit and data tracker as a progressive web app.
Greenfield. Nothing carried over from previous attempts.

This is one app in an intended suite of three that share a data store and a look:

1. **Daily tracker** — habits, numbers, day rank. **This is what you build now.**
2. Training tracker — set logging. Later.
3. Nutrition tracker — food and macros. Later.

Build only the daily tracker, but build the shared foundation properly, because
the other two will consume it.

Predecessors and how they failed:
- A Motherbase Excel life OS. Capture rate about 30% and falling.
- SystemOS, which synced one large JSON blob to Supabase. Last-write-wins,
  silent data loss across devices. **Do not repeat this under any circumstances.**

---

## Repo structure

```
/shared     skins.js  skins.json  records.js  DESIGN.md  SCHEMA.md
/habits     index.html
```

Live at `tomoncupa.github.io/daily-quest-os/habits`. GitHub Pages, static, no server.
Add an empty `.nojekyll` at the repo root.

---

## Hard constraints

Do not break these. Ask me first if you think one needs to change.

- **Vanilla JavaScript only.** No React, no TypeScript, no bundler, no build step,
  no npm install. A file I upload to GitHub is the file that runs.
- **The app is one HTML file** plus the shared files it imports from `/shared`.
- **External dependencies are CDN-only and must degrade.** SheetJS from cdnjs for
  spreadsheets, Google Fonts for type. If either fails to load the app still works:
  export falls back to CSV, fonts fall back to system stacks. Never add a dependency
  the app cannot run without.
- **Offline first.** Every tap saves locally and instantly. Nothing in the core
  logging loop may require network, an account, or a login.
- **Mobile first.** 480px max width, single column, one thumb, primary actions in
  the bottom third.
- **Storage adapter.** Read and write through a `Store` wrapper that uses
  `window.storage` when present and `localStorage` otherwise. Never call
  `localStorage` directly from app code.

---

## Data model — the most important section

**Everything persists as independently addressable rows. Never as one blob.**

```
{ id, user_id, type, date, key, payload, updated_at, deleted }
```

- `date` is `YYYY-MM-DD`, or `null` if not tied to a day
- `key` identifies the thing within its type
- `updated_at` is an ISO timestamp; on conflict the newer row wins
- `deleted` is a tombstone. Rows are never removed, or a deletion cannot travel
  to another device.
- `user_id` is on every row from day one, set to `'local'` until accounts exist

Required functions in `/shared/records.js`:

- `rebuild()` — derive working state from rows
- `sync()` — write changed working state back, bumping `updated_at` only on real change
- `merge(rows)` — take the newer `updated_at` per row; must be idempotent
- `recSet(type,date,key,payload)` / `recDel(...)`

**Granularity is one row per field per day.** Finer is theatre, since two devices
editing the same field on the same day is a genuine conflict however it is sliced.
Coarser is a blob and takes you back to silent data loss.

### Types and ownership

A module may read any type. It writes only the types it owns.

| Type | Owner | key | payload |
|---|---|---|---|
| `setting` | any, own namespace | app name | that app's settings |
| `cat` | daily | category id | `{id,label}` |
| `field` | daily | field id | field definition |
| `day` | daily | `''` | `{note,override,rest}` |
| `ev` | daily | field id | `[{t,v}]` |
| `exercise` `session` `set` | training | — | later |
| `food` `meal` | nutrition | — | later |

**One writer per fact.** Today the daily tracker owns a Training checkbox. When
the training app exists it becomes the writer and this field switches to derived.
Two writers for one fact is how numbers start disagreeing.

---

## The app

### Fields

Every tracked thing is a `field` with a `measure`:

| measure | behaviour |
|---|---|
| `check` | yes/no |
| `amount` | a quantity; multiple entries per day, summed. Handles variable doses. |
| `amount_time` | quantity plus timestamp; derives hours before bed |
| `number` | one value per day |
| `time` | a clock time |

Field properties: `id, label, cat, order, measure, unit, target, dir (gte|lte),
slot (am|pm), sch, cycle, cue, counts, skipRest, chart, share, blur, on, quick[],
step, dec, prefill`.

### Defaults — exactly these six, in this order

Sleep (hrs, ≥7, tap chips 5 to 9 in half steps), Weight (lb, no target, not
counted), Calories (kcal, ≤2400, prefill), Protein (g, ≥175, prefill),
Steps (≥10000, range chips), Training (check, `skipRest: true`).

**Nothing else on first run.** Blank slate. Categories: Daily, Routines & Habits,
Meds & Supplements, all empty except Daily.

### Starter library

A browsable list in Setup, roughly 34 items across three groups, each with sensible
unit and dose chips attached. Habits like morning walk, deep work block, evening
ritual. Supplements like creatine (amount, chips 5/10/20), caffeine (amount+time,
chips 100/150/200/300), magnesium, zinc, melatonin. Extra numbers like resting HR,
water, mood /5, energy /5, bedtime. An empty setup screen is a dead end; a library
is an invitation.

### Schedules

`daily`, `twice` (two taps to complete), `weekdays` (chosen days), `hours`
(any interval in hours), `asneeded` (never counts against the score).

**Hour intervals round each occurrence to the nearest whole day.** An 84-hour
schedule must produce days 0, 4, 7, 11, 14 — alternating 3 and 4 day gaps averaging
3.5. Alternating cycles (`['AR','PL']`) advance **per occurrence, not per day index**.
Getting this wrong makes the cycle never alternate. Test it explicitly.

### Rank

F/E/D/C/B/A/S from percent of due-and-counted items completed.
100=S, 90=A, 80=B, 70=C, 60=D, 50=E, under 50=F.
Calculated automatically. One tap on a letter overrides it.

### Rest days

A rest day must be able to earn the same as a training day. Implement as a per-field
`skipRest` flag, on by default for Training only. Rest days still count toward the
rolling adherence rate. Do not exclude them.

### Streak

- **Continues if you log anything at all**, decoupled from hitting the goal
- Freezes granted automatically every 7 streak days, capped at 3
- Freezes are spent silently on a miss, never offered as a choice
- Best streak kept permanently

### Screens

**Today** — morning and evening blocks. Rank sigil at top. Streak and freezes.
Nothing turns red until the day is over. After two consecutive missed days, a
banner with a one-tap jump to fill them in. One-line note field.

**Data** — 7 and 28 day rolling adherence, a 5-week completion grid, one chart per
number with the target as a dashed line, weight as a 7-day average with raw dailies
faded, a catch-up list of open days.

**Links** — pick a number, and it splits it by any condition and shows two medians
side by side with the day count in each group. **No p-values, no significance
claims.** Every comparison has a same-day / previous-day selector, defaulting to
previous day when the metric is logged in the morning and the condition in the
evening. Same-day alignment on a lagged effect does not weaken the result, it
reverses the sign. Label results as hypotheses, and say plainly that some will be
coincidences. Unlocks at 14 logged days.

**Share** — a 1080px card, Story 9:16 and feed 4:5, with the rank sigil, a 14-day
rank strip, adherence stats and the completion grid. Per-field show/hide plus a
blur option that keeps a number's shape without publishing the digits. Use
`navigator.share({files})`, falling back to download.

**Setup** — theme picker including custom, the starter library, every field with
its own target, schedule, slot, cue, and toggles for counts-toward-rank,
show-on-data, show-on-share, skip-on-rest. Reorder by arrows, with drag as a bonus.
Export, import, backup, restore, and a copyable setup code that carries the
configuration with no logs, so I can hand a client a preconfigured tracker.

### Input speed

Target under 60 seconds a day across a morning and an evening pass.

Tap chips first, keyboard on demand — tapping the displayed number opens the
keyboard for that field. Prefill yesterday with a Same button. Amount fields offer
the three most recently used doses. Times are stamped automatically on tap and
editable after. `inputmode="numeric"` with `pattern="[0-9]*"`, never `type="number"`.

---

## Design system

`/shared/skins.js` derives about 40 semantic CSS variables from four colours per
skin: `bg`, `panel`, `accent`, `text`. Surfaces and borders by mixing panel toward
text, accent foreground picked black or white by contrast.

**Components read semantic tokens, never raw hex.** `var(--surface-2)`, not
`#161D2A`. Break this once and every skin breaks at once.

Token groups: surface, text, line, accent, state, data ramp `--data-1..6`, rank
`--rank-S..F`, shape (`--radius-sm`, `--cut`), type, motion, texture
(`--tex-image`, `--tex-size`). 43 tokens in total.

**Rank colours are fixed across every skin**, and are not part of any skin's ramp.
An S must mean the same thing in every app and in every theme. `S #F2C14E, A #5FE39B, B #4FD8E8, C #6C8CFF, D #C79BF0, E #FF9F6B,
F #FF6B6B`.

### Skins — nine, taken from ARC

The palettes come from ARC, my mindmapping app, so the whole suite matches.
They are already written into `/shared/skins.json`, which I will give you.
**Read them from that file. Do not retype them into code.**

| id | name | mode | bg | panel | accent | text |
|---|---|---|---|---|---|---|
| ice | Ice | dark | #0B0E14 | #121826 | #6EE7FF | #E7EEF9 |
| ember | Ember | dark | #0B0E14 | #121826 | #FF9E64 | #E7EEF9 |
| violet | Violet | dark | #0B0E14 | #121826 | #A78BFA | #E7EEF9 |
| matrix | Matrix | dark | #0B0E14 | #121826 | #4ADE80 | #E7EEF9 |
| mono | Mono | dark | #0B0E14 | #121826 | #E7EEF9 | #E7EEF9 |
| rpg | RPG | dark | #05070D | #0B1220 | #4DD8FF | #E7EEF9 |
| chalkboard | Chalkboard | dark | #1B2B23 | #22352C | #F7F3E8 | #F2EFE4 |
| blueprint | Blueprint | dark | #0A2540 | #10304F | #7FD4FF | #DCEBFF |
| sketch | Sketch | light | #F5F1E8 | #FFFFFF | #3A4A9F | #2B2A26 |

Every one passes contrast: accent on background 7.0 to 16.6, text on panel 11.2
to 15.8. `mono` has one chart-ramp colour below 3:1 on background, which is
acceptable because it is the sixth and least used.

Three things a skin can carry beyond the four base colours:

1. **`ramp`** — six hand-picked chart colours. ARC picks these per theme rather
   than deriving them, and hand-picked reads better. Use the skin's ramp when it
   has one, derive from accent when it does not.
2. **`overrides`** — explicit values that beat anything derived, currently
   `--surface-2`, `--border`, `--text-2`, `--text-muted`.
3. **`texture`** — per-skin fonts and corner shape. RPG uses Orbitron with a 3px
   cut, Blueprint uses IBM Plex Mono, Chalkboard and Sketch use handwriting faces
   with square corners.

4. **`texture.image` and `texture.size`** — the background pattern, as finished CSS
   values. RPG carries a scanline grid, Blueprint a drafting grid, Chalkboard a dot
   texture, the rest a soft accent glow, Mono and Sketch nothing.

**The app writes no theme-specific CSS at all.** Not one rule keyed to a theme
name, not one `body.theme-x` selector. Every difference between skins arrives as a
token value. The single rule that makes this work:

```css
/* one element behind everything, in every app */
#bgfx{ position:fixed; inset:0; z-index:-1;
       background-color:var(--bg);
       background-image:var(--tex-image);
       background-size:var(--tex-size); }
```

That element is the only thing an app has to provide. Adding a tenth skin, or
changing RPG's grid spacing, is then a change to `skins.json` and nothing else,
in every app at once, with no per-app debugging. If you ever find yourself writing
a CSS rule that mentions a skin by name, the design system has been broken and you
should stop and tell me.

**The theme picker is provided, not rebuilt.** `Skins.picker(element)` renders the
full selector, handles clicks, saves the choice and repaints. Every app calls it in
one line. No app writes its own picker markup or its own swatch styling.

**Custom skins**: four colour pickers feeding the same function, plus a contrast
check warning below 3:1 accent-on-background and 4.5:1 text-on-panel. Warn, never block.

### Decisions that are cheap now and expensive later

Build all of these into the first version. None is optional.

**Dates are always local, never UTC.** One function produces `YYYY-MM-DD` from a
local `Date`. Never `toISOString().slice(0,10)`, which silently shifts the day for
anyone east of Greenwich. I am in Manila, UTC+8, so anything logged after 8am would
land on the wrong day and I would not notice for months.

**Every stored measurement carries its unit.** Weight is saved as
`{v: 195, u: 'lb'}`, not a bare number. Switching the display unit converts for
display and never rewrites history. A stored number whose unit is implied is a
number that becomes wrong the moment a setting changes.

**Field ids are opaque and permanent.** Generate them, never derive them from the
label. Renaming a field must never break its history, and two fields with the same
name must be able to coexist.

**Every record carries a schema version.** A future change needs a migration path,
not guesswork about which shape a row is in.

**Backup is complete.** The backup file must be enough to rebuild the whole app:
fields, categories, settings, skin choice and every log. A backup that restores
data into an unconfigured tracker is not a backup.

**Nothing phones home.** No analytics, no telemetry, no third-party scripts beyond
the two named CDN dependencies. The app makes no network request the user did not
ask for. This is a permanent rule, not a first-version simplification.

**Ship a web app manifest and an icon set** so the home screen install shows a real
icon and name and opens without browser chrome. Without this the icon is a blurry
screenshot and the install feels broken, which undermines the one step that protects
the data from being cleared.

### Screen sizes

Phone is the design target and the priority. Everything must work one-handed at
390px wide.

On a desktop browser the app renders as the same column, centred, with empty space
either side. That is deliberate and it is not a bug. Do not build a wide desktop
layout without asking me first: deciding what sits beside what is a project of its
own, and it costs the same in six months as it does today.

**But do not block it either.** These cost about twenty minutes now and turn a
future desktop layout into an afternoon rather than a rewrite:

- Column width lives in **one** token, `--app-max`, not as `480px` repeated
  through the stylesheet
- Panels stack in a container that can become multi-column by changing one
  property. No fixed pixel heights, no absolute positioning for layout.
- Real `:hover` and `:focus-visible` states on every interactive element, since a
  desktop user has a pointer and a keyboard and currently gets feedback from neither
- Enter and Escape work in every dialog and input

What must be true on desktop today: nothing overflows or is cut off, the keyboard
works throughout, and clicking works as well as tapping.

### Look and layout

Status-window aesthetic. Angled corner via `--cut` and `clip-path`. Display face
for headings and ranks, body face for labels, mono for anything compared down a
column, with tabular figures. 44px minimum tap targets. Bottom tab bar with
`padding-bottom: env(safe-area-inset-bottom)`. Flex children holding inputs need
`min-width: 0` or buttons clip off screen.

Colour meaning: success for a hit target, danger only for a missed target on a day
that is over, muted for not yet logged, warn for needs attention.

---

## Evidence the design rests on

Do not change these behaviours without a reason at least as good as the one they
came from.

- **Harkin et al. 2016**, Psychological Bulletin, 138 studies, N=19,951:
  progress monitoring raised goal attainment d+=0.40 (CI 0.32–0.48), and effects
  were larger when outcomes were made public and physically recorded. The share
  card is an adherence mechanic, not decoration.
- **Burke, Wang & Sevick 2011**, J Am Diet Assoc, 22 studies: smartphone logging
  averaged 92 days of recording (SD 67) vs 35 for web and 29 for paper at 6 months,
  p<.001. Friction beats intent. Guard tap count above every other consideration.
  The same review rates the evidence weak methodologically, and finds adherence
  declines over time in essentially every study. **Design for month 6, not week 2.**
- **Lally et al. 2010**, Eur J Soc Psychol, 96 participants: median 66 days to
  automaticity, range 18–254. A single missed day was statistically invisible;
  two or three consecutive misses slowed the curve. Forgive one silently,
  intervene at two.
- **Gollwitzer & Sheeran 2006**, 94 tests, N>8,000: if-then plans specifying when,
  where and how gave d=0.65 on goal attainment. Hence the optional cue field on
  every item, phrased as a moment, not a reminder.
- **Nunes & Drèze 2006**, J Consumer Research, 300 customers: a 10-stamp card with
  2 pre-filled completed at 34% vs 19% for an 8-stamp empty card, identical real
  effort. **The effect disappears if no reason is given for the head start.**
  Any progress bar starts above zero with a stated reason.
- **Duolingo streak data**: decoupling streak continuation from the daily goal was
  the cheapest, best-evidenced win (+3.3% day-14 retention, +10.5% share holding a
  streak). At day 14, average streak 30.63 with freezes vs 18.87 without. Freezes
  must be auto-distributed and auto-spent, never a decision at the moment of
  failure, because the at-risk user is by definition not opening the app.
- **No level or XP system.** Removed deliberately from a previous version. Do not
  add one back.
- **Never remove earned progress.** No decaying tiers, no lost history. Turning a
  field off keeps its data.

---

## Known traps

- `display:contents` is broken in Safari CSS grid. Use inline
  `grid-template-columns` per row.
- Flex inputs without `min-width:0` clip the stepper button off screen.
- iOS clears browser storage after 7 days of no visits unless the app is installed
  to the home screen. Never let data loss be silent.
- Duplicate function definitions between an external script and an inline `<script>`
  resolve in favour of the inline one, silently. Audit for duplicates.
- GitHub Pages caches aggressively. Bump a `?v=N` query param on external files.

---

## Testing — not optional

There is no test framework and I cannot test code myself.

Before claiming anything works, extract the script and check it parses:

```
python3 -c "import re;s=open('habits/index.html').read();open('/tmp/a.js','w').write(re.findall(r'<script>(.*?)</script>',s,re.S)[-1])"
node --check /tmp/a.js
```

Then write a throwaway harness in `/tmp` that stubs `document`, `window`,
`localStorage` and `getComputedStyle`, appends a `module.exports` of the functions
under test, and asserts behaviour. Two real bugs were caught this way in a previous
round: an every-3.5-days cycle that never alternated, and a lag-alignment sign flip.

**Always test:** schedule due-dates at interval boundaries, alternating cycles,
scoring with as-needed and rest days, streak freezes granting and spending,
export/import round trips, record merge including the two-device case where each
device wrote a different field, and theme contrast maths.

You cannot open the app on an iPhone. Say so plainly rather than claiming a layout
works. I am the device test.

---

## Sequencing

**Phase 1** — the shared foundation and the daily tracker as specified above,
deployed and working.

**Phase 2, the first job after that** — the Google Sheet mirror.

The phone stays the save file: instant, offline, no login. The app pushes a copy
into a Google Sheet I own, automatically, whenever there is signal. If the push
fails nothing breaks and it retries later. Setup must be: I create a blank sheet,
paste in a short Apps Script you write, click Deploy, and paste the resulting URL
into the app's settings once. No developer account, no API keys, no OAuth.
The sheet is a mirror and a backup, never a dependency.

**Later** — training tracker, nutrition tracker, weekly review screen, backup nudge
when the last backup is over 30 days old.

---

## How to work with me

- **Ask clarifying questions before writing code.** Do not guess at intent.
- **Surgical diffs, not rewrites.** Change the lines that need changing. Never
  create `index-v2.html`.
- **Complete truth only.** If something is untested, say so. If a number is a
  guess, label it. Never assert a figure, formula or specific without a real basis.
- Attempt the task first with reasonable assumptions stated inline. Ask only if a
  missing variable would materially change the output.
- No hedging, no corporate filler. Be precise, give numbers.
- Explain anything I need to act on in plain language. I do not read code.
- Spell out acronyms in full on first use.
- Do not use em dashes in anything I might publish.
- End substantive replies with a confidence assessment and one concrete next action.

---

## First task

Set up the repo structure, write `/shared/skins.js`, `/shared/skins.json` and
`/shared/records.js`, and build the daily tracker to the spec above. Test it as
described. Then tell me in plain language what you built, what you could not
verify, and what you want me to check on my phone.
