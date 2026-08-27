# MOTHERBASE

The master brief. Every app in this repo obeys it. App-specific briefs sit inside
their own folder, govern that folder only, and may add rules but never contradict
these. `arc/CLAUDE.md` is one, and it is the model for the rest.

**`DOCTRINE.md` sits beside this file.** This one says what the suite *is* —
the data model, the constraints, the things that must never break. That one says
what each app is *for*, and what good means inside it. A change can obey every
rule here and still be wrong, because it made an app worse at its one job.

Read `DOCTRINE.md` before building a feature. Read this before touching data.

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
- **No em dashes in anything he publishes** (posts, client-facing copy). Docs and
  code comments in this repo are fine.
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
9. **No raw sizes in app CSS either.** Spacing, type, corners, shadows and
   durations are all tokens, on scales where no two steps are within about 25%
   of each other. `shared/STANDARDS.md` says why.
10. **Know which device an app is for.** Set by Tom on 2026-08-22, and it
   replaces the old "phone first, and literally" rule that applied to
   everything.

   **STATUS and TRAIN are phone apps.** They are used standing up, one-handed,
   at the gym or in a kitchen. Every control is at least a 44px target, nothing
   important hides behind hover, panels come up from the bottom, and the back
   gesture closes what is open rather than leaving the app. `shared/STANDARDS.md`
   is binding on these two and `_template/index.html` is the working example.

   **Everything else is a desktop app**: the home screen, ARC, BLOCK, HABITS,
   FORM and STYLE. They are used sitting down, with a mouse, to plan, build,
   review and compare. Hover is allowed, density can be tighter, dialogs may sit
   in the middle of the screen rather than rising from the bottom, and a layout
   may assume a wide window.

   Neither kind may break on the other. A desktop app on a phone should stack
   and stay usable; a phone app on a desktop should not stretch to nonsense. The
   44px target and the safe-area insets stay everywhere, because they cost
   nothing on a mouse and they are the difference between usable and not on a
   thumb.

---

## Layout

```
CLAUDE.md          this file
DOCTRINE.md        what each app is FOR, and the laws every app obeys
HOWTO.md           how Tom adds an app or a theme, in plain language
index.html         the home screen: widget grid, app dock, data authority
shared/            the foundation, loaded by every app
block/index.html   routine builder
arc/index.html     mind canvas
arc/CLAUDE.md      ARC's own brief, governs arc/ only
habits/index.html  habit tracker (a stand-in, see Debt)
form/index.html    lift review
status/index.html  sleep, weight, mood, energy, steps, food and money
train/index.html   the training log, a reproduction of FitNotes
train/CLAUDE.md    TRAIN's own brief, governs train/ only
style/index.html   the theme workbench. Desktop only, deliberately.
_template/         a working starter app, copied to make a new one
quest/BRIEF.md     the Daily Quest OS brief. Its measurement half moved into
                   status/ on 2026-08-20; what is left of it is a todolist.
                   Its data model and design system still govern. Superseded
                   on repo layout and testing by this file.
```

**Phone or desktop:** `status/` and `train/` are phone apps. Every other app,
including the home screen, is a desktop app. See hard constraint 10.

One folder per app. The home page is `index.html` at the root. `.nojekyll` sits at
the root so GitHub Pages does not eat underscore folders.

**Deploy is a copy.** The folder as it stands is the deployable artifact: copy it to
`tomoncupa.github.io`, or open `index.html` straight from disk. No build, no step
in between. Anything that breaks opening from a folder breaks the product.

### The shared foundation

| File | Job |
|---|---|
| `records.js` | The store. Rows, merging, subscriptions. The one file to be careful with. |
| `day.js` | One definition of "today" for the whole suite. |
| `skins.js` + `skins.json` | Themes, and the colour layer on top of them. |
| `sound.js` | Sound themes and instruments, synthesised, no audio files. |
| `mobile.js` | The touch layer. Sheets, swipes, safe areas, keyboard, back stack, haptics. |
| `ui.js` | Snackbars, dialogs, confirms, menus, switches, and the standard Settings panel. |
| `io.js` | Per-app backup, restore, and the readable spreadsheet export. |
| `icons.js` | The icon master set. One drawing serves many buttons. |
| `health.js` | Answers "is my data okay" without a test suite. |
| `_smoke.html` | 64 checks over all of the above. Run it after touching any of them. |
| `THEMING.md` | **How an app obeys STYLE.** Every token, what an app may never do, and how to prove it obeyed. Binding. |
| `STANDARDS.md` | How the apps feel on a phone. Binding, and written in plain language. |

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

Storage is one entry per row, so rows are addressable in storage and not only in
the API. Two halves, since 2026-08-27: `localStorage` is the fast half, read
synchronously at boot so the first paint needs no waiting, and holds any row
under 64KB. **IndexedDB is the big half**, written always and read straight
after boot. A row past the ceiling — a photographed label, a pasted image on an
ARC node — lives only there and arrives a few milliseconds later, merged in by
`updated_at` like any other row.

That is what `Rec.ready()` is for. **An app that draws from the store on load
must wait on it**, or a big row will be missing from its first paint. STATUS,
TRAIN and ARC all do.

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
| `field` | **status** | field id | the definition of a tracked measure |
| `ev` | **status** | field id | `{e:[{t,v}]}` — one row per field per day |
| `day` | **status** | `''` | `{note, rest}` |
| `food` | **status** | food id | the label as printed, plus your own servings |
| `meal` | **status** | timestamp id | one logged serving, numbers frozen in |
| `spend` | **status** | timestamp id | `{amt, acct, note, t}` |
| `acct` | **status** | account id | `{name, order}` |
| `shot` | **status** | photo id | a shrunk photo of a label or receipt |
| `habit` | quest, later | | a todolist, once STATUS took the measurements |
| `excat` | **train** | category id | `{name, slot, ord}` — a muscle group. `slot` is a theme colour slot, never a hex |
| `exercise` | **train** | exercise id | `{name, cat, kind, inc, rest, unit, fav, note, graph}` |
| `set` | **train** | timestamp id | one logged set, weight stored in kg with the unit it was typed in |
| `session` | **train** | `''` | `{start, end, note}` — the day's workout timing and comment |
| `sgroup` | **train** | group id | a superset |
| `program` `progday` `progex` | **train** | | routines. Named around BLOCK's `routine` |
| `goal` | **train** | goal id | a training goal |
| `skin` | **style** | theme id | a saved or edited theme. A row whose id matches a factory theme in `skins.json` replaces it; deleting the row is the reset |
| `map` | **arc** | map id | `{title, view, snaps, order}` — a mind map, without its nodes |
| `node` | **arc** | `mapId\|nodeId` | one node. The addressable fact on a canvas, so moving one node writes one row |
| `link` | **arc** | `mapId\|linkId` | `{a, b, rel, ord}` — a connection that is not a parent link |

**One writer per fact**, with exactly one deliberate exception: `tick`. Any app may
tick anything, because one cell per activity per day is one fact and later save
wins. That exception is what makes a tick in BLOCK show up in the habit tracker.

When a new app takes over a fact, the old writer switches to reading it. Two
writers for one fact is how numbers start disagreeing.

---

## What "today" means

**The calendar day.** Nothing else.

There used to be a day-start hour, default 4am, so anything logged before then
counted as the day before. Tom asked for it gone on 2026-08-20 and it is gone,
along with its setting and its grace window. `day.js` keeps the machinery with
`startsAt` at 0, where it does nothing — bringing it back would be one number,
but do not, without being asked.

**Any past date is always editable.** Backfill is normal, not an exception. The
future is not a record and cannot be ticked.

---

## Themes and colours

Two layers, deliberately separate. ARC established this model and `shared/skins.js`
mirrors it exactly.

**The hierarchy is STYLE > shared > every other app.** Set by Tom on
2026-08-21, and it settles who wins an argument about how things look:

1. **STYLE decides** what a theme is allowed to change. If a theme needs a
   lever that does not exist, that is a real requirement, not a nice-to-have.
2. **`shared/` implements it.** `skins.js` grows the lever, and every app gets
   it for free because components read tokens. A session working on the
   foundation is allowed to change `skins.js` for this reason.
3. **Every other app obeys.** An app never invents its own theming, never
   hard-codes a colour or a corner, and never fights a theme. If a theme cannot
   reach something in an app, the app is wrong and the app changes.

The practical test: if changing a theme in STYLE does not change an app, that
app has a bug.

**The contract is `shared/THEMING.md`.** It lists all ninety-two tokens with
what each is for, the seven things an app may never do, and the three ways to
prove an app obeyed — the first of which is STYLE's own measured highlight,
which cannot flatter you. Read it before touching any app's CSS.

**Theme:** structure, fonts, corner shape, texture, and the colours it ships with.
Chosen **per app**, so ARC can be Doodle while BLOCK is Ice. Seventeen of them, in
`skins.json`, and every one differs by more than its colours. Ember, Violet,
Matrix and Mono were dropped on 2026-08-21: they were Ice with a different
accent hex and nothing else. Changing one colour is an edit in STYLE, not a
whole theme. `_smoke.html` now fails if two themes share a shape.

**Colours:** six named fields (`bg`, `panel`, `line`, `ink`, `mut`, `acc`) plus six
node and chart colours, sitting on top of one theme. Saved per theme in
`suite_palettes`, never written back to `skins.json`. Edit Ice's colours and every
app set to Ice gets them.

`Skins.apply(skin, palette)` paints without saving, which is what makes live
preview work. `isCustomised` and `clearPalette` give the reset.

Everything else, thirty-odd tokens, is derived from those. **Components read
tokens, never raw colours.** That one rule is what keeps themes working.

**The feel layer.** A theme also owns how a box is *drawn*, not just its
colour: `texture.cut` drives the whole radius family, `weight` the border
thickness, `depth` picks one of soft, flat, bevel or glow, and `track` and
`motion` set letter spacing and tempo. A theme may also carry `css`, its own
stylesheet over the shared class names, swapped wholesale when the theme
changes. That is what makes a theme feel like a different universe rather than
a recolour. Apps still write no theme CSS of their own.

**Icons.** `shared/icons.js` is the master set: about fifty drawings carrying
about a hundred and fifty buttons. A button asks for a ROLE (`add`, `today`,
`food`) and many roles point at one drawing. **Look for an existing role before
adding one, and an existing drawing before adding one of those** — a new drawing
is another thing to keep in step across every theme. A theme changes the icon's
`weight`, `cap`, `join`, `fill` and `wobble`, never its shape, which is what
stops a new theme costing fifty new paths. STYLE's ICONS tab is the database:
it shows every drawing with its buttons hanging off it, and audits every app for
buttons still drawn with a plain Unicode character.

**A character is not an icon.** It renders differently on every device, cannot
take a colour, and vanishes when a font does. Never put one in a button.

**What a theme may never touch:** the spacing scale, padding, margins, or the
44px tap target. A theme's own CSS setting `padding` on a card is the same
mistake as changing the spacing scale, and five themes were doing it until
2026-08-22 — cards were a different size depending on which theme you wore.
`_smoke.html` now fails on it.

**Icon packs are a file.** One JSON object with `kind: "motherbase.iconpack"`,
a `style` (the stroke recipe) and optionally `paths` (drawings by name). Drag
one onto STYLE's ICONS screen. Installed packs are a setting, so they are in
the backup.

**STYLE owns sound too.** Look, sound and feel are one idea. A theme may carry
`sound: "<pack id>"` and choosing that theme chooses its sound pack.

**What a theme may never touch:** the spacing scale and the 44px tap target.
It changes how a box is drawn, never where it sits or how big it is under a
thumb. Density was considered and rejected on 2026-08-21 — it reflows every
hand-tuned layout and the bugs only surface on a phone nobody here can see.

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

These come from evidence, and they are not up for redesign on taste. Sources are in
`quest/BRIEF.md`: Lally 2010 on time-to-automaticity and missed days, Gollwitzer &
Sheeran 2006 on if-then plans, Nunes & Dreze 2006 on endowed progress, and
Duolingo's published streak-freeze results.

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

There is no test framework and Tom cannot test code himself. **Check whether `node`
exists before relying on it** (`node --version`); as of 2026-08-20 it is not
installed here, so any brief telling you to extract the script and run `node --check`
cannot be followed literally. Use the browser instead, which is better anyway
because it runs the real thing rather than only parsing it:

1. Serve the folder: `py -3 -m http.server 8777 -d "<repo>"`.
2. Open it with the browser tool, drive it with JavaScript, read the console.
3. Run `shared/_smoke.html`. It must say 152 of 152, or more once you add checks.
   Run it at phone width too — some checks only mean anything at one width.
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
- **Windows filenames are case-insensitive.** `Claude.md` and `CLAUDE.md` are the
  same file, and writing one silently overwrites the other. This has already
  happened once. Check with `git ls-files` before creating a file whose name
  differs from an existing one only in case.
- `py -3` is the Python launcher here. Plain `python` hits the Microsoft Store stub
  and fails.
- **A literal closing script tag inside an inline script ends the script element**,
  even inside a comment. Writing `<script src=...></script>` in the kernel's own
  doc comment silently truncated three apps. ARC's `'<scr'+'ipt>'` split is the
  same defence. Never write the closing tag inside inline code.
- An app that computes its own `today` will disagree with `Day.today()` the moment
  the clock is past midnight but before the day-start hour. BLOCK did exactly this
  and published its plan on a date nothing else was reading.

---

## Current state

| App | State |
|---|---|
| `index.html` | Home screen. On the shared foundation as of 2026-08-20: skin tokens, bottom tab bar on a phone, sheets instead of its own modal. Widget grid still drags and resizes with a mouse; a phone gets a REARRANGE mode instead. |
| `block/` | Working. Publishes today's plan, reads and writes shared ticks. Actively edited in other sessions. |
| `arc/` | Tom's build, with its own brief. On the shared foundation as of 2026-08-27: the store, the theme engine, the icon set, the settings sheet and the standard backup. Owns `map`, `node` and `link`. `arc/` is canonical; any copy in `Downloads` is a convenience mirror and loses. |
| `habits/` | A stand-in, now superseded by `status/`. Harvest the streaks and one-click promote-from-routine if they are still wanted. Do not add to it. |
| `form/` | Standalone by design. Video never leaves the device. |
| `status/` | Built 2026-08-20 and tested in the browser. On the shared foundation. Owns every daily measurement. |
| `train/` | Brief written 2026-08-20, build in progress. A 1:1 reproduction of FitNotes v25.1 on the shared foundation, phone first, for a Galaxy A10. Owns the training log. Imports Tom's real 12,370-set FitNotes backup. Has its own brief. |
| `style/` | Built 2026-08-21. Pick, compare, edit and add themes, and holds the icon master set. A desktop app, like most of the suite: comparing themes honestly means several real screens side by side. Built out of `shared/ui.js` components rather than its own chrome. Owns `skin`. |
| `_template/` | The starter app, and the reference for how a phone-native app in this suite is built. |
| `shared/` | The foundation, passing 152 checks. Every app loads it. |

### Debt, in the order it should be paid

1. ~~The old blob kernel~~ **Done 2026-08-20.** Kernel v2 is a view over
   `records.js`; the apps kept their API and did not move. First load copies the
   old `lifeos_v1` blob into rows and leaves it in place as its own backup.
2. ~~ARC carries its own copy of the theme engine~~ **Done 2026-08-26.** It
   reads `shared/skins.js` and went from ten themes to eighteen, keeping its
   own per-theme colour editing. BLOCK and FORM went onto it the same day.
   HABITS is the only app not on the theme system, deliberately: it is a
   placeholder.
3. **The apps still carry their own settings, themes and sounds** instead of using
   `shared/ui.js`, `skins.js` and `sound.js`. `_template/` and `arc/` are fully
   on them; the rest are not.
3b. ~~Apps not loading `shared/mobile.js`~~ **Done 2026-08-20.** Every app
   loads it and every viewport covers the safe area. What is left is per-app:
   auditing each one's own CSS for hover-only controls and sub-44px targets,
   which the shared layer cannot do for them.
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

## Working alongside other sessions

Tom runs more than one Claude Code session at once, often one per app. Sessions
cannot see each other. There is no shared memory and no channel: the only thing
they have in common is this folder and its git history.

Two consequences, both of which have already cost work here:

- **A session works from the copy of a file it read**, which may be hours stale.
- **`CLAUDE.md` is read once, at session start.** A session that began before a
  structural change has never seen it.

So:

1. **Stay in your folder.** An app session touches its own folder. Only a session
   working on the foundation touches `shared/` or the root.
2. **Look before you write.** `git status` and a fresh read of the file, right
   before editing it, not at the start of the task.
3. **Never `git add -A` while another session may be live.** Add explicit paths.
   Sweeping someone else's half-finished work into your commit is not destructive,
   but it is rude and it muddles the history.
4. **Commit early and often.** Commits are the only handoff channel that exists.
5. **After a structural change, tell Tom to restart his other sessions.** They will
   not pick up a new or moved brief any other way.
6. **If you find files you did not create**, assume another session is mid-task.
   Leave them alone and say so, rather than tidying them up.

## Commits

One commit per coherent change. Subject line names the area in caps, for example
`SKINS: split theme and colour layers`. Body explains why in plain sentences, not a
list of files. Say what was verified and how.

Do not push without being asked. The repo is public.
