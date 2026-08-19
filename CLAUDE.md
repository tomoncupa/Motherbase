# MOTHERBASE

The master brief. Every app in this repo obeys it. App-specific briefs sit inside
their own folder, govern that folder only, and may add rules but never contradict
these. `arc/CLAUDE.md` is one, and it is the model for the rest.

## What this is

A suite of small, single-file apps that share one brain. Each one opens on its
own, works with no connection and no account, and is one file you can upload. All
of them draw from `/shared`: the same store, the same themes, the same sounds, the
same dialogs, the same import and export.

**The shared drawer is the product. The apps are windows onto it.**

Everything is local. One machine, one browser, no server, no sign-in, nothing
uploaded. That is a current decision, not a permanent one, and nothing in here
blocks changing it later.

---

## How to work with Tom

Tom is a solo premium fitness coach in Manila, founder of Personal Protagonist,
moving from one-to-one coaching toward community revenue and content. He runs a
Skool community with a free tier and a paid all-access tier.

**He is not a developer and does not read code.** That is the single most important
line in this file.

- **Plain language for anything he has to act on.** Say what a thing does before
  what it is called. Spell out acronyms in full on first use.
- **Ask before writing code when intent is genuinely unclear.** Otherwise attempt
  the task with your assumptions stated plainly, and ask only when a missing answer
  would materially change the output.
- **Surgical diffs, not rewrites.** Change the lines that need changing. Never
  create `index-v2.html`. Never rewrite a file that needed an edit.
- **Complete truth only.** If something is untested, say so. If a number is a
  guess, label it. Never assert a figure, formula or price without a real basis.
- **No hedging and no corporate filler.** Be precise. Give numbers.
- **Do not use em dashes in anything he might publish.**
- **End substantive replies with a confidence assessment and one concrete next
  action.**
- He is the device test. You cannot open anything on his iPhone. Say so plainly
  rather than claiming a layout works.

---

## Hard constraints

Do not break these. Ask first if you think one needs to change.

1. **Vanilla JavaScript only.** No framework, no TypeScript, no bundler, no build
   step, no `npm install`. A file he uploads is the file that runs.
2. **One HTML file per app**, plus the shared files it loads from `/shared`.
3. **Plain `<script src>` for shared files, never ES modules.** Modules do not load
   from `file://`, and opening a file straight from a folder has to keep working.
4. **External dependencies are CDN-only and must degrade.** SheetJS for
   spreadsheets, Google Fonts for type. If either fails to load, the app still
   works: export falls back to CSV, fonts fall back to system stacks. Never add a
   dependency the app cannot run without.
5. **Offline first.** Every tap saves locally and instantly. Nothing in the logging
   loop may require a network, an account or a login.
6. **Storage goes through the store.** Never call `localStorage` directly from app
   code. `shared/records.js` is the only door.
7. **Rows, never one blob.** See below. This is the rule that has already killed
   one of his systems.
8. **No hex colours in app CSS.** Use the tokens. A hex code is a theme that works
   in exactly one skin.

---

## Layout

```
CLAUDE.md          this file
HOWTO.md           how Tom adds an app or a theme, in plain language
index.html         the home screen: widget grid, app dock, data authority
shared/            the foundation, loaded by every app
block/index.html   routine builder
arc/index.html     mind canvas
arc/CLAUDE.md      ARC's own brief, governs arc/ only
habits/index.html  habit tracker (a stand-in, see Debt)
form/index.html    lift review
_template/         a working starter app, copied to make a new one
quest/BRIEF.md     the Daily Quest OS brief, still authoritative for that app
```

One folder per app. The home page is `index.html` at the root. `.nojekyll` sits at
the root so GitHub Pages does not eat underscore folders.

### The shared foundation

| File | Job |
|---|---|
| `records.js` | The store. Rows, merging, subscriptions. The one file to be careful with. |
| `day.js` | One definition of "today" for the whole suite. |
| `skins.js` + `skins.json` | Themes, and the colour layer on top of them. |
| `sound.js` | Sound themes and instruments, synthesised, no audio files. |
| `ui.js` | Toasts, dialogs, confirms, menus, and the standard Settings panel. |
| `io.js` | Per-app backup, restore, and the readable spreadsheet export. |
| `health.js` | Answers "is my data okay" without a test suite. |
| `_smoke.html` | 35 checks over all of the above. Run it after touching any of them. |

---

## The data model

Everything persists as independently addressable rows. Never as one blob.

```
{ id, user_id, type, date, key, payload, updated_at, deleted }
```

- `id` is derived from user, type, date and key, so the same fact written twice is
  the same row and a merge is a comparison rather than a guess.
- `date` is `YYYY-MM-DD`, or `null` for anything not tied to a day.
- `updated_at` decides conflicts. **The newer write wins, per row.**
- `deleted` is a tombstone. Rows are never removed, or a deletion cannot travel.
- `user_id` is on every row from day one, set to `local` until accounts exist.
- One row per field per day. Finer is theatre. Coarser is a blob.

Storage is one `localStorage` entry per row, so rows are addressable in storage and
not only in the API.

**Why this is non-negotiable:** SystemOS, a predecessor, synced one large JSON blob
with last-write-wins and lost data silently across devices. A Motherbase Excel life
OS failed before that at about 30% capture rate. Do not repeat either.

### Ownership

An app may read any type. It writes only the types it owns.

| Type | Owner | Key | Payload |
|---|---|---|---|
| `setting` | any app, namespaced `appid.name` | setting name | `{v}` |
| `activity` | the shared vocabulary | slug of the name | `{name, cat, dur, color}` |
| `tick` | **shared, every app may write** | activity id | `{src, qty}` |
| `lane` `item` `routine` | block | | |
| `habit` `field` `day` `ev` | quest | | |
| `exercise` `session` `set` | training, later | | |
| `food` `meal` | nutrition, later | | |

**One writer per fact**, with exactly one deliberate exception: `tick`. Any app may
tick anything, because one cell per activity per day is one fact and later save
wins. That exception is what makes a tick in BLOCK show up in the habit tracker.

When a new app takes over a fact, the old writer switches to reading it. Two
writers for one fact is how numbers start disagreeing.

---

## What "today" means

One setting: **what time your day starts.** Default 4am.

A tick before 4am belongs to the day before, because that is the day he was still
in. This is the only rule that decides dates and nothing else may.

The day is wrapped up three hours before it turns over, so 1am on a 4am start.
That gives a grace window where the day reads as finished but can still be logged
into. It follows the one setting and is not a second thing to configure.

**Any past date is always editable.** Backfill is normal, not an exception. The
future is not a record and cannot be ticked.

---

## Themes and colours

Two layers, deliberately separate. ARC established this model and `shared/skins.js`
mirrors it exactly.

**Theme:** structure, fonts, corner shape, texture, and the colours it ships with.
Chosen **per app**, so ARC can be Doodle while BLOCK is Ice. Ten of them, in
`skins.json`.

**Colours:** six named fields (`bg`, `panel`, `line`, `ink`, `mut`, `acc`) plus six
node and chart colours, sitting on top of one theme. Saved per theme in
`suite_palettes`, never written back to `skins.json`. Edit Ice's colours and every
app set to Ice gets them.

`Skins.apply(skin, palette)` paints without saving, which is what makes live
preview work. `isCustomised` and `clearPalette` give the reset.

Everything else, thirty-odd tokens, is derived from those. **Components read
tokens, never raw colours.** That one rule is what keeps themes working.

---

## Sound

Synthesised, no files, works offline. Sound themes and instruments are chosen per
app, exactly like themes.

- **Small actions stay small.** A tick is a short dry click. If everything
  celebrates, nothing does.
- **The finish escalates.** One note for a block, a chord for the whole day. The
  reward scales with what was actually finished.
- **Streaks climb** the scale as they grow, capped at an octave.
- Nothing but the finisher runs past about 200 milliseconds.

---

## Backup and export

Two different jobs, never conflated.

**Backup** is a `.json` of one app's rows. Restorable, and boring on purpose.
Restore **merges** by default: every row carries `updated_at`, so an old backup can
only fill in what is missing, never overwrite something newer. Rewind, which does
discard newer work, is a separate button behind a confirm.

**Export** is a spreadsheet, readable and not restorable, and the panel says so. A
Calendar tab with activities down the side and dates across the top, and a Log tab
for pivots. SheetJS if it loads, CSV if it does not.

The Data button turns amber once a backup is 14 days old. Local-only data has no
other safety net.

**Phase 2, when he asks for it:** a Google Sheet mirror. The phone stays the save
file. The app pushes a copy into a Sheet he owns whenever there is signal, retries
silently on failure, and never becomes a dependency. Setup must be: create a blank
sheet, paste in a short Apps Script, click Deploy, paste the URL into settings
once. No developer account, no API keys, no OAuth.

---

## Behaviour design rules

These come from evidence, and they are not up for redesign on taste.

- **Design for month 6, not week 2.** Adherence declines in essentially every
  study. Build for the version of him who is bored of it.
- **Forgive one missed day silently, intervene at two.** A single miss is
  statistically invisible to habit formation. Two or three consecutive misses slow
  it measurably.
- **Streaks continue if he logs anything at all**, decoupled from hitting the goal.
  Freezes are granted automatically, capped, and spent silently on a miss. Never
  offer a freeze as a choice at the moment of failure: the at-risk user is by
  definition not opening the app.
- **Any progress bar starts above zero, with a stated reason.** The head start only
  works when the reason is given.
- **Optional cue fields are phrased as a moment, not a reminder.** If-then plans
  specifying when, where and how are among the best-evidenced interventions there
  are.
- **No levels, no XP.** Removed deliberately from an earlier version. Do not add
  one back.
- **Never remove earned progress.** No decaying tiers, no lost history. Turning a
  field off keeps its data.

---

## Testing, not optional

There is no test framework and Tom cannot test code himself. `node` is **not
installed on this machine**, so any brief telling you to extract the script and run
`node --check` cannot be followed literally. Use the browser instead, which is
better anyway because it runs the real thing rather than only parsing it:

1. Serve the folder: `py -3 -m http.server 8777 -d "<repo>"`.
2. Open it with the browser tool, drive it with JavaScript, read the console.
3. Run `shared/_smoke.html`. It must say 35 of 35, or more once you add checks.
4. Clean up any test data you wrote, and stop the server.

**Always test:** record merge including the two-device case where each device wrote
a different field, export and import round trips, schedule due dates at interval
boundaries, alternating cycles, scoring with as-needed and rest days, streak freeze
granting and spending, day boundary behaviour either side of the start hour, and
theme contrast maths.

Never claim something works because it should. Claim it because you watched it.

---

## Known traps

- `display:contents` is broken in Safari CSS grid. Use inline
  `grid-template-columns` per row.
- Flex inputs without `min-width:0` clip the stepper button off screen.
- iOS clears browser storage after 7 days of no visits unless the app is installed
  to the home screen. Never let data loss be silent.
- A duplicate function defined in both an external script and an inline `<script>`
  resolves in favour of the inline one, silently. Audit for duplicates.
- GitHub Pages caches aggressively. Bump a `?v=N` query parameter on shared files
  when hosting returns.
- `let` and `const` at the top level of a classic script are not properties of
  `window`. Reaching them from a test harness needs `frame.contentWindow.eval`.
- Anything flagged `custom` passed to `Skins.apply` gets persisted. A live preview
  must not be flagged custom or it leaves a trail of half-made themes.

---

## Current state

| App | State |
|---|---|
| `index.html` | Home screen. Widget grid, drag to move, drag the corner to resize. Still on the old LifeOS kernel, see Debt. |
| `block/` | Working. Publishes today's plan, reads and writes shared ticks. Actively edited in other sessions. |
| `arc/` | Tom's build, with its own brief. Standalone: its own IndexedDB, its own theme engine. Shares nothing yet. `arc/` is canonical; any copy in `Downloads` is a convenience mirror and loses. |
| `habits/` | A stand-in. Daily Quest OS replaces it. Harvest the 28-day grid, the streaks, and one-click promote-from-routine. Do not add to it. |
| `form/` | Standalone by design. Video never leaves the device. |
| `_template/` | The only app already on the new foundation. |
| `shared/` | Built and passing 35 checks. Not yet wired into the real apps. |

### Debt, in the order it should be paid

1. **The old LifeOS kernel is still live** in `index.html`, `block/` and `habits/`.
   It stores the shared doc as one blob, which constraint 7 forbids. Safe only
   while everything is single-device. Convert to `records.js`. The tick log is
   already one cell per activity per day, so the conversion is mostly mechanical.
   **Back up his real data to a file before touching it.**
2. **ARC carries its own copy of the theme engine.** It should load
   `shared/skins.js` instead of defining `THEMES` itself.
3. **The docs use em dashes**, against his own rule. Sweep them when convenient.
4. **Commits are unpushed** and the GitHub repo is public. He has not yet said
   push.

### Parked, not cancelled

Hosting, accounts and phone sign-in. The plan is in `ARCHITECTURE.md` with a banner
saying so. Firebase was chosen for one narrow reason: it sends the SMS itself, so
there is no texting company to sign up with and no carrier paperwork.

### Dead

Installable phone apps. They need a web address, so they do not work from a folder,
and the caching failure mode is exactly the kind of silent breakage he cannot
diagnose. Revisit only if hosting returns.

---

## Commits

One commit per coherent change. Subject line names the area in caps, for example
`SKINS: split theme and colour layers`. Body explains why in plain sentences, not a
list of files. Say what was verified and how.

Do not push without being asked. The repo is public.
