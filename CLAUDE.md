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

**Hosted first.** Tom, 2026-09-23. The suite is opened from its address,
`tomoncupa.github.io/Motherbase/`, on the phone and on the PC, and the desktop
programs open that address too. Each person signs in with Google and gets
their own space; LIVE SYNC (`CLOUD.md`) keeps every device they sign in on as
one store. The Google Sheet is an optional backup beside it. Every tap still
saves on the device first, so nothing waits on the network or the sign-in.
The folder copy is for building and testing, not for living in.

**Clients sync their own profile, never Tom's.** A client's live sync reaches
only their own space. What Tom sees of a client arrives by a SEND TO COACH
button the client presses, and only that way, until Tom says otherwise.

---

## How to work with Tom

`how-we-work.md` (loaded in every session) governs. One word this repo adds:
**clients** are the people who get the client build (`tools/build-client.py`),
not the coaching clients WEALTH and COACH track. Say which wherever it could be
either.

---

## Hard constraints

Do not break these. Ask first if you think one needs to change.

1. **Vanilla JavaScript only.** No framework, no TypeScript, no bundler, no build
   step, no `npm install`. A file he uploads is the file that runs.
   **One exception, and Tom approved it on 2026-09-16:** `desktop/` holds a
   compiled Windows launcher. It is not part of an app and no app depends on
   it. STATUS is still one HTML file that opens from a folder, and editing
   STATUS never rebuilds anything. Nothing else in the repo may be compiled
   without asking.
2. **One HTML file per app**, plus the shared files it loads from `/shared`.
3. **Plain `<script src>` for shared files, never ES modules.** Modules do not load
   from `file://`, and opening a file straight from a folder has to keep working.
4. **External dependencies are CDN-only and must degrade.** SheetJS for
   spreadsheets, Google Fonts for type, Firebase for LIVE SYNC. If any fails to
   load, the app still works: export falls back to CSV, fonts fall back to
   system stacks, and sync waits for the next open while every save stays on
   the device. Never add a
   dependency the app cannot run without.
5. **Offline first.** Every tap saves locally and instantly. Nothing in the logging
   loop may require a network, an account or a login.
   **This covered everything after the page was open, and nothing before it.**
   Both Tom and his clients open the suite from an address rather than a
   folder, so until 2026-09-16 every open needed a connection just to fetch
   the page, and with no signal they got a blank screen. `sw.js` fixes that.
   A change that stops a page opening with no signal breaks this rule as
   surely as one that puts a login in front of a tick.
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

   **TRAIN is a phone app, and STATUS is built like one.** They are used
   standing up, one-handed, at the gym or in a kitchen. Every control is at
   least a 44px target, nothing important hides behind hover, panels come up
   from the bottom, and the back gesture closes what is open rather than
   leaving the app. `shared/STANDARDS.md` is binding on these two and
   `_template/index.html` is the working example.

   **STATUS, QUESTS and CHECK IN are for everywhere.** Tom, 2026-09-14. Built to the
   phone rules, because those are the harder ones, and also good at a desk.
   Not just "does not break" there.

   **Everything else is a desktop app**: the home screen, ARC, BLOCK, FORM,
   FOODDÉX, LOG, WEALTH, STYLE and FORGE.

   **ARC, BLOCK and STYLE are desktop only.** Tom, 2026-09-14: they are not
   meant to work on a phone. FORGE, built 2026-09-24 to work like BLOCK, is
   desktop only too. Do not spend work making them stack or fit a
   thumb, and a phone-width failure in one of them is not a bug. They are used sitting down, with a mouse, to plan,
   build, review and compare. Hover is allowed, density can be tighter, dialogs
   may sit in the middle of the screen rather than rising from the bottom, and
   a layout may assume a wide window.

   Apart from those three, neither kind may break on the other. A desktop app on a phone should stack
   and stay usable; a phone app on a desktop should not stretch to nonsense. The
   44px target and the safe-area insets stay everywhere, because they cost
   nothing on a mouse and they are the difference between usable and not on a
   thumb.

---

## Layout

```
CLAUDE.md          this file: rules, data model, one line per app
DOCTRINE.md        what each app is FOR. Read before building a feature
LAYOUT.md          the long version of this list, with the why of each file
HOME.md            the home screen's history. Read before touching index.html
REVIEW.md          the suite reviewed 2026-09-15, ranked proposals
HOWTO.md           how Tom adds an app or a theme
CLOUD.md           LIVE SYNC, Firebase beside the Google sheet
RECEIPTS.md        the receipt pipe: phone photo to spending row, read on the PC
ONBOARDING.md      how a client gets the suite
index.html         the home screen
_review.html       the review every client push must pass
sw.js              the offline cache. `?nosw=1` turns it off
shared/            the foundation. Its own brief holds the debt and findings
desktop/           STATUS.exe and Main Menu.exe, Windows, Tom only. README.md
tools/             build-client.py and helpers. Not build steps
_template/         the starter app to copy
<app>/index.html   one app per folder; <app>/CLAUDE.md is that app's brief
```

**Phone or desktop:** `train/` is a phone app. `status/`, `quest/`, `checkin/`, `system/`, `speak/` and `bullet/` are for
everywhere. Every other app, including the home screen and `wealth/`, is a
desktop app. See hard constraint 10. What each one is for, in Tom's words, is
the table at the top of "The apps" in `DOCTRINE.md`.
`portion/` was called both for a day and Tom settled it as desktop on
2026-09-06: it is desk work, not kitchen work. It lays out in three columns
past 1300px, two past 900px and one below that, and it keeps the 44px targets
and the safe areas because those cost nothing on a mouse.

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
| `chart.js` | Every chart. Answer first (`Chart.header`), drawn at the box's real size (`Chart.mount`), latest value marked, one bar lit, drag to explore (`c.scrub`), pies with a key and ranked shares for part of a whole, rings, sparklines and legends. Theme tokens only. |
| `journal.js` | The bullet system. `Journal.add` is the one way to write a new line, since 2026-09-18: STATUS, LOG, QUESTS, the home screen's DOING box and the status check all call it, so every line carries when it was written. `moveTo` sends a todo to any day and `moveToTomorrow` is that with one date filled in; the menu carries both, so LOG and QUESTS got it without being edited. One journal line: its kinds, which day it shows on, the time typed into it, how it is drawn (mark, words, then "7:00pm - 7:31pm"), time order by its start, ticking, Move to tomorrow, Cancel it, and a repeat's next round. STATUS names the `note` shape and wins any disagreement; STATUS, LOG, QUESTS and the home screen all read this, so a todo bullet looks and behaves the same in each. |
| `skins.js` + `skins.json` | Themes, and the colour layer on top of them. |
| `sound.js` | Sound themes and instruments, synthesised, no audio files. |
| `mobile.js` | The touch layer. Sheets, swipes, safe areas, keyboard, back stack, haptics. |
| `ui.js` | Snackbars, dialogs, confirms, menus, switches, and the standard Settings panel. Since 2026-09-17 a box holding a NUMBER comes up selected and a box holding WORDS keeps its caret at the end — `UI.isNumberBox` reads that off the box, `focusSoon` obeys it, and a document-wide `focusin` covers every field in every app including ones written before it existed. An amount is retyped; a note half written must not be wiped. `data-keep-caret` opts out. `UI.commitFocused` blurs whatever is focused, and it runs by itself on `pagehide` and when the document goes hidden, so a field that commits on BLUR has committed before the page can go — that is half of why a BLOCK edit no longer dies on a refresh. `UI.amount(text, unit)` reads a number in whatever unit it was typed in and converts it into the one the box stores: 1000mg into a gram box is 1. Mass and volume are kept apart on purpose, since grams into millilitres is a density question. |
| `io.js` | Per-app backup, restore, and the readable spreadsheet export. Since 2026-09-17 the Apps Script (v5) can also write a Google Calendar: an app that declares `calendar()` in its register has its events carried on the same push as its rows, into a calendar named `IO.CAL_NAME` and nothing else, off until `IO.mirror.set({cal:1})`. The script must contain no `||` — it is copied by hand through a text box and that is one of the things the trip loses, and `_smoke.html` fails on it. And the Share picture panel, `IO.share`: a card as a 1080 x 1920 story picture, kept clear of the story's own buttons, with Transparent, Translucent or Opaque and Big, Medium or Small remembered per app, and one SHARE. STATUS and TRAIN use it. |
| `import.js` | Bringing in a spreadsheet the suite did not write: ticks from a month grid, weigh-ins, foods and money out, read by shape. Never overwrites, never reads a formula as a record, one batch, one undo. |
| `icons.js` | The icon master set. One drawing serves many buttons. |
| `health.js` | Answers "is my data okay" without a test suite. |
| `creatures.js` | The Pokémon a person is shown as, drawn from shapes on a canvas, since 2026-09-22. CHECK IN's picker and COACH's box both draw from it, so a client is the same creature in both. An old animal pick maps to a Pokémon. Writes colours down, like notice.js, because the creature is art. |
| `range.js` | A training history as a woodblock print, since 2026-09-22; rebuilt as 0.2.0 on 2026-09-25. Every training block a mountain, time outside a block a hill, every session a tree, blossoming on a record day. A BASE switch (BLOCKS, SESSIONS, SETS, VOLUME) says what it is built on and a PRINT switch (FUJI, INK, DUSK) how it is drawn; the caller keeps both. Drawn in 1024px tiles, only near the screen. TRAIN's Profile and COACH draw it. `Range.fromRows` builds it from TRAIN-shaped rows and counts what Profile counts (comment warmups out). Writes colours down for the same reason. |
| `notice.js` | The status window LOOK and, since 2026-09-25, NOTICE's ENGINE: `Notice.parse` (text in), `Notice.draw` (the window, 1080 wide), `Notice.compose` (on a story or post). NOTICE and SHEET both draw with it; NOTICE keeps its made-up rewards and hands them in as `o.rewards`. The four palettes and the cut-corner shape. NOTICE strokes it on a canvas to make a picture, STATUS clips a real panel to it for the status check. The one place in the suite that carries hex colours on purpose, for the reason NOTICE always had: the window is the art, not the furniture, so a Hunter window is blue in every theme. Nothing here reaches an app's own chrome. |
| `cloud.js` | LIVE SYNC: Firebase beside the sheet, added 2026-09-20. One row per row at `/u/<uid>/rows/<id>`, pushed on change and listened for by `updated_at`, merged through `Rec.merge` like anything else. Fetched by `io.js` rather than by a tag in every app, the way `mobile.js` fetches `sw.js`, so no app was edited. Only the TOP document connects, because `records.js` already shares merged rows across the origin and fourteen frames would be fourteen connections. A row over 64KB is skipped AND THE BOUNDARY STILL PASSES IT, or one photo would jam every sync after it. Does nothing until a config is pasted. See `CLOUD.md`. |
| `nutrients.js` | The full nutrient list a food can carry beyond the eight, added 2026-09-22: fibre, sugar, the fats, EPA and DHA, cholesterol, eleven minerals and the vitamins, thirty-one in all. One list, three readers: FOODDÉX fills them from its USDA lookup (found by the USDA's printed NAME and unit, never its numeric id, and International Units skipped), STATUS gives each one a column on the sheet's Food tab, and ELEMENT reads its five off the food. They live on `food.base` beside the eight. A blank is "not known", never zero. |
| `_smoke.html` | 343 checks over all of the above. Run it after touching any of them. |
| `THEMING.md` | **How an app obeys STYLE.** Every token, what an app may never do, and how to prove it obeyed. Binding. |
| `STANDARDS.md` | How the apps feel on a phone. Binding, and written in plain language. Rule 14 is the typing-cursor rule: a screen you came to type into opens with the keyboard up, via `UI.focusSoon`. |

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
- `user_id` is on every row, and it stays `local` even with accounts. The
  account lives in the sync path (`/u/<uid>/rows`), not the row: changing it
  would give every row a new id and duplicate the whole history.
- One row per field per day. Finer is theatre. Coarser is a blob.

Storage is one entry per row, so rows are addressable in storage and not only in
the API. Two halves, since 2026-08-27: `localStorage` is the fast half, read
synchronously at boot so the first paint needs no waiting, and holds any row
under 64KB. **IndexedDB is the big half**, written always and read straight
after boot. A row past the ceiling — a photographed label, a pasted image on an
ARC node — lives only there and arrives a few milliseconds later, merged in by
`updated_at` like any other row.

That is what `Rec.ready()` is for. **An app that draws from the store on load
must redraw when it lands**, or a big row will be missing from its first paint.
STATUS, TRAIN and ARC all wait on it.

**Waiting and redrawing are not the same thing, and the difference is a blank
screen.** An app that puts its FIRST paint behind `Rec.ready` shows nothing at
all until the store answers, and the store can take minutes or never — see
"Foundation, found and not acted on", item 1. Paint what localStorage already
handed you, then redraw when the big half arrives. PORTION does it that way.

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
| `rhythm` | **block** | rhythm id | `{kind, name, color, n, unit, from, times}` — a Block on BLOCK's Every tab (`kind: 'every'`, every `n` days, weeks or months, first due `from`) or Anytime tab (`kind: 'anytime'`, `times` a week). What got done is ordinary `tick` rows under the slug of the name, with no routine |
| `plan` | **block** | `routine` | today's published plan, for anything that wants to read it |
| `note` | **status** names the shape; a todo may also carry `tags`, QUESTS's labels, as a list of slugs; **log** and **quest** write it too, and **arc** writes a todo per skill in training and per review due, `src: 'arc'`; **wealth** writes one per bill coming up, `src: 'wealth'`, never for a loan | line id | one journal line: a todo, an entry, an event or an idea. A todo may carry `due`, `pri`, `proj` and `rep` from QUESTS; see `quest/CLAUDE.md` |
| `field` | **status** | field id | the definition of a tracked measure |
| `ev` | **status**; **checkin** writes `weight` too, the way STATUS's `evAdd` does | field id | `{e:[{t,v}]}` — one row per field per day |
| `cfield` | **checkin** | field id | `{label, kind, unit, ord, on}` — what a check-in asks. `kind` is `photo`, `number`, `scale` (1 to 5) or `text`. A default is shown until changed; a row wins over its default |
| `cval` | **checkin** | field id, dated; a client's is `pid\|id` | `{v}` — one answer on one check-in day. A client's weight is `pid\|weight` |
| `cphoto` | **checkin** | a pose id (`front`, or a pose added with one tap), dated; a client's is `pid\|pose` | `{img, w, h, t, cam, src, lum, tilt, match}` — a JPEG at 1920px on its long edge. Big, so it lives in IndexedDB |
| `cmark` | **checkin** | the same key as its photo; undated for a goal | `{pts, guess, lm, by, found}` — the dots on one photo. Kept off `cphoto`, so moving a dot never rewrites a picture. `by: 'checked'` is never re-measured |
| `cref` | **checkin** | `goal:pose`, `setup`, or `pid\|goal:pose` | a goal photo, or where the phone stands. Shaped like `cphoto` |
| `cperson` | **checkin** | client id | `{name, animal, unit, fields, seen}` — a client whose check-in file was opened. Their rows carry the id in front of the key |
| `checkin` | **checkin** | `''`, dated | `{sent}` — when that day's check-in was sent to a coach |
| `day` | **status**; **log** writes `note`, the day's summary | `''` | `{note, rest}` |
| `food` | **status** names the shape; **portion** writes it too | food id | the label as printed, plus your own servings. `base` may also carry any key in `shared/nutrients.js`, and every writer MERGES into `base` rather than rebuilding it: STATUS's food editor rebuilt it until 2026-09-22 and would have wiped all of them on one Update |
| `meal` | **status** | timestamp id | one logged serving, numbers frozen in |
| `spend` | **status** | timestamp id | `{amt, acct, note, t}` |
| `acct` | **status** | account id | `{name, order}` |
| `shot` | **status** | photo id | a shrunk photo of a label or receipt |
| `habit` | quest, later | | a todolist, once STATUS took the measurements |
| `project` | **quest**; **arc** makes one named after a skill tree's map | slug of the hashtag | `{name, slot, ord}` — a Todoist project. `slot` is a theme colour slot, never a hex |
| `excat` | **train** | category id | `{name, slot, ord}` — a muscle group. `slot` is a theme colour slot, never a hex |
| `exercise` | **train** | exercise id | `{name, cat, kind, inc, rest, unit, fav, note, graph, also, gdef, setup, bar, wu}` — `setup` is the setup fields he names for it, each a toggle or a setting; `bar` 1 or 0 overrides reading a barbell lift off the name; `wu` `kg` or `lb` is its own weight unit (`unit` is not, see `train/CLAUDE.md`) |
| `set` | **train** | timestamp id | one logged set, weight stored in kg with the unit it was typed in; `warm` a warmup marked by hand, `su` the setup it was done with, `rir` reps in reserve (5 means five or more) and `q` set quality 1 to 4, both from the comment box. Warmups and split sets are also read from its comment, never stored |
| `session` | **train** | `''` | `{start, end, note, from, order, name, vs}` — the day's timing and comment, the day it was copied from, its exercise order, its name, and a day picked to compare it with |
| `phase` | **train** | phase id | `{name, start, end}` — a training block. Not `block`: BLOCK is another app and has nothing to do with training beyond a tick. `end` is optional |
| `sgroup` | **train** | group id | a superset |
| `program` `progday` `progex` | **train** | | routines. Named around BLOCK's `routine` |
| `goal` | **train** | goal id | a training goal |
| `skin` | **style** | theme id | a saved or edited theme. A row whose id matches a factory theme in `skins.json` replaces it; deleting the row is the reset |
| `cat` `rule` `wtag` | **wealth** | | spending categories, the text rules that sort into them, and occasion tags |
| `mark` | **wealth** | `date\|spendKey` | `{cat, tag, big}` — what WEALTH thinks of one of STATUS's spends. Kept OFF the spend row on purpose |
| `count` | **wealth** | date + account id | `{bal}` — a counted balance. Kept off `acct` so STATUS cannot wipe it |
| `client` `paid` | **wealth**; **coach** writes `client` too | | a coaching client, and money that arrived. A `paid` with no client is a one-off. `cp` is the COACH card it is joined to; name and done follow whichever app changed them last |
| `sesh` | **wealth**; **coach** writes one per 1:1 logged there, key `k-<pid>` | date + id | `{client, src, pid}` — one session delivered. A client paid every N sessions is paid off a count, so the count has to be auditable |
| `pack` | **wealth** | date + id | `{client, n, price, note, parts, when}` — sessions sold before they happen, whole or in parts due as blocks of sessions start or end. Payments apply to packages oldest first, so partial payment needs no extra field |
| `bill` `debt` `pot` `move` | **wealth** | | recurring outgoings, what is owed, savings pots and movements into them |
| `recon` | **wealth** | a statement line's fingerprint | `{d, amt, acct, kind, spend, sdate, skip}` — this statement line has been dealt with. What makes re-importing the same file harmless |
| `xfer` | **wealth** | date + id | `{from, to, amt, note, t, stmt}` — his own money moving between two of his accounts. Recorded once even when both statements show it; changes both balances, never spending or income |
| `dose` | **mix** | slot id (`salt-pre`, `k-night`), dated | `{nut, mg, g, slot, t}` — one powder weighed out on one day. The row MIX subtracts from its own seven-day sodium base, so the salt it told him to add can never be read back as food he ate |
| `map` | **arc** | map id | `{title, view, snaps, order}` — a mind map, without its nodes |
| `node` | **arc** | `mapId\|nodeId` | one node. The addressable fact on a canvas, so moving one node writes one row |
| `link` | **arc** | `mapId\|linkId` | `{a, b, rel, ord}` — a connection that is not a parent link |
| `card` | **arc** | `mapId\|cardId` | `{q, a, node, made}` — one flashcard: the question, the answer, and the node the fact came from if there is one. ARC's Cards tab |
| `crev` | **arc** | `mapId\|cardId`, dated | `{g:[{t, g}]}` — every grade that card got that day, 1 again to 4 easy. When it comes back is replayed from these, SM-2 style, and never stored |
| `attempt` | **arc** | `mapId\|nodeId`, dated | `{hit, miss, t}` — one skill's hits and misses on one day. A ticked QUESTS todo ARC made for the skill and a met SPEAK take on the skill's drill count as hits too. Open, passed and review due are worked out from these, never stored on the node |
| `recap` | **log** | `week`, `month`, `quarter` or `year`, dated on the period's first day | `{text}` — what he wrote about that period |
| `cell` | **log** | column id (`done`), dated | `{text}` — one day's entry in one of LOG's text columns, such as "What got done today". Kept apart from `day.note` on purpose |
| `take` | **speak** | timestamp id, dated | `{drill, skill, style, dur, m, goals, pass, asr, cam, tx, prompt}` — one practice take: every number the ear read, each goal as it stood with `got` and `ok`, and the transcript if there was one. The day's warm-up is one `take` with `drill: 'warm'` |
| `topic` | **speak** | id | `{text, kind}` — his own prompt: a topic, a story, or three bullets |
| `cset` `cex` `cphase` `csession` | **coach** | `pid\|` + the key the row had in the client's TRAIN; dated as it was | a client's set, exercise, block and day, exactly as their TRAIN wrote it, merged with its own updated_at so a second file only adds what is new |
| `cexcat` `csgroup` `cgoal` `cprogram` `cprogday` `cprogex` | **coach**; **train** writes all of these and the four above when opened as `train/index.html?client=<pid>` | the same | the rest of a client's TRAIN. That address points TRAIN's store at the client (the top of `train/index.html`), so COACH's LOG A SESSION is the real TRAIN on their rows. A set Tom logs there is keyed `pid\|k-...` and bills in WEALTH like one from the old quick logger |
| `cprog` | **coach** | `c-<pid>` for a client's first sets, an id for a library program | `{name, pid, days:[{name, ex:[{name, sets:[{kg, r}]}]}]}` — one row per program, because a program is written, sent and sold as one piece. Only the first set of each exercise is sent. `cperson` gains `box` and `slot` from COACH, by patch |
| `cprog` from FORGE | **forge** writes `f-<id>` (`src: 'forge'`), republished on every change, and a client's `c-<pid>` on SEND | the same | the flattened program: a day per week per day, each with `wk` and its plain `day` name; beside each exercise set one's load only (`r: null`), `n`, `reps` (a range), `bands`, `rir` (`0-3` when blank), `rest` in seconds, `note` and `catName` — Tom's Algrowrithm, see `forge/CLAUDE.md`. An open slot carries `name: ''` and `slot: {kind, pat, mus, label}`, and every entry `fk`, its plate key; a client's `c-` row also keeps `fills`, what was picked for each slot. COACH shows an `f-` row and never edits it |
| `fprog` | **forge** | program id | `{name, weeks, ord}` — a program FORGE builds |
| `ftag` | **forge** | exercise name, lowercase | `{name, pat, mus}` — an exercise's movement pattern and the muscles it works, FORGE's own so TRAIN's `exercise` is untouched. No tag: the pattern is guessed from the name and drawn with a "?" |
| `fday` | **forge** | `prog\|day id` | `{name, ord}` — one day, in every week of its program |
| `fex` | **forge** | `prog\|slot id` | `{day, name, cat, ord, n, r, kg, rir, rest, note, wk, slot, pat, mus}` — one exercise in one day, or an open slot (`slot: 'pat'` or `'mus'`, `name` empty) filled per client at SEND. `r` is a rep range as text (`"8-15"`), `rir` a number or range (blank reads `0-3`). `n` `r` `kg` `rir` are week one's; `wk[w]` holds only what week `w` changes, and anything it does not say is the week before's. No weekly load step: load rises from set one on the day |
| `brief` | **the daemon on the PC**; **quest** reads it and never writes it | `''`, dated the day it is for | `{text, todo, t, src}` — Claude's morning brief for that day, added 2026-09-22. `text` is plain lines, `# ` a heading and `- ` a point; `todo` a list of action items, each a string or `{text}`. QUESTS shows it as a foldable card at the top of Today and turns each item into a todo keyed `brief-<date>-<n>`, `src: 'brief'`, due that day, written once, so a deleted one stays deleted. How the row reaches the store is the daemon's business |
| `feat` | **sheet** | the feat's own id, undated | `{t, date, saved}` — this feat's window was shown (and when its picture was saved). The feats themselves are worked out from TRAIN and STATUS rows every open and never stored |
| `msg` | **system** (NOTICE) | id, dated | `{text, kind, style, seed, t}` — one status window that was saved or copied: the text as typed, notice or quest, the window style, and the reroll count its pseudo rewards were drawn with. The draft being typed and every choice on screen are settings, not rows |

### Many writers is fine. Replacing a payload you did not read is not

Set by Tom on 2026-09-06: *"it's not a crime for multiple things to write the
same entries, I'm sure we can have it so that it's no problem."* He is right,
and this section replaces the old "one writer per fact" rule, which named the
wrong culprit and would have blocked useful work for a bad reason.

**The store is already safe for many writers, at row granularity.** Every row
has an id derived from its own identity, `updated_at` settles conflicts per
row, deletes are tombstones so they travel, and two apps on one device share
one live picture of the store, so a food PORTION saves is a food STATUS reads
in the same instant. Two apps writing two different rows can never collide.
Two apps writing the SAME row, one after the other, is a comparison, not a
guess.

**The thing that actually loses data is a writer that replaces a payload it
did not fully read.** `Rec.set` overwrites the whole payload. So an app that
rebuilds a row out of its own idea of the fields deletes every field it does
not know about, silently.

That is not a two-writer bug. It has already happened, and here is the case,
because it is the clearest teacher in the repo: PORTION wrote `base.ca`, the
calcium off a label. STATUS's food editor then rebuilt `base` from its own
list of nutrients, which had no calcium in it, and pressing Update dropped the
figure with nothing said. **One** writer doing that would do the same damage to
a field written by a newer build of itself, or restored from a newer backup.

So the rule is not about who writes. It is:

1. **Change a row by merging into what is there, never by rebuilding it.**
   Read the row, change your fields, write it back whole. `Rec.patch` does
   exactly that in one call. An app that owns
   only some of the fields must carry the rest across untouched.
2. **Only write what you have shown the person.** A row you have not put on
   screen is a row you have no business rewriting.
3. **Types still have an owner**, and it is still a useful thing to say, but
   it now means *this app is responsible for the shape* — not *no one else may
   write it*. Ownership names who to ask, not who is allowed.

`tick` has always worked this way on purpose: any app may tick anything,
because one cell per activity per day is one fact and later save wins. That is
what makes a tick in BLOCK show up in the habit tracker.

`food` is written by both STATUS and PORTION, and that is fine under the rule
above rather than an exception to it.

**Many writers means many tabs.** Each app pushes the rows it registers into
its own `_Data · <app>` tab on the sheet, so an app that shows rows another app
writes names that app in `IO.register`'s `reads`, with the types, or on a device
where the other app is not open it never sees them (foundation item 19).

**What the store could not do until 2026-09-15:** merge two DEVICES' edits to
different fields of one row. It can now: FIELD TIMES in `records.js` merges a
field at a time, and a list such as a day's weigh-ins joins by entry. Rule 1
still matters on one device, because a writer that rebuilds a payload deletes
a field in the same write, before any merge happens.

**Why any of this is careful at all:** SystemOS, a predecessor, synced one
large JSON blob with last-write-wins and lost data silently across devices.
Rows fixed the blob half. Rule 1 is the other half.

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
Chosen **per app**, so ARC can be Doodle while BLOCK is Ice. **Block is the
default** (Tom, 2026-09-14): an app with no theme chosen opens in Block, with a
gold accent, `#F0B323`. It sits first in `skins.json` because first is what
`Skins.restore` falls back to, so keep it first. Eighteen of them, in
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

**Material.** Since 2026-09-15 a theme also says how a card and a row are
drawn, and BLOCK is the reference: a card is `mb-card`, the dark glass
BLOCK's lanes are, and a row inside it is `mb-plate`, a plate in its own
colour, `--c`. Block, the default theme, asks for `plate`; every other theme
is `flat` and draws exactly as it did. An app puts the two classes on and
writes no background, border or shadow of its own. `shared/THEMING.md`,
Material, has the tokens. The first try tinted whole cards; Tom: "looks
worse". BLOCK tints rows, never cards.

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
44px tap target. It changes how a box is drawn, never where it sits or how big
it is. Density was rejected on 2026-08-21: it reflows every hand-tuned layout. A theme's own CSS setting `padding` on a card is the same
mistake as changing the spacing scale, and five themes were doing it until
2026-08-22 — cards were a different size depending on which theme you wore.
`_smoke.html` now fails on it.

**Icon packs are a file.** One JSON object with `kind: "motherbase.iconpack"`,
a `style` (the stroke recipe) and optionally `paths` (drawings by name). Drag
one onto STYLE's ICONS screen. Installed packs are a setting, so they are in
the backup.

**STYLE owns sound too.** Look, sound and feel are one idea. A theme may carry
`sound: "<pack id>"` and choosing that theme chooses its sound pack.

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

The Data button turns amber once a backup is 14 days old. LIVE SYNC carries
no photos (a row over 64KB), so a backup or the sheet is still the only copy
of a photo anywhere but the device it was taken on.

**Where the sheet is set up.** Tom, 2026-09-14: the Google Sheet setup (the
script, the automatic switch, syncing every app) lives on the home screen and
in STATUS only. Every other app's DATA tab ends with a box to paste the sync
link and a Sync now button, drawn by `IO.syncRow`, and nothing more. The link
belongs to the suite, so pasting it in one app pastes it for every app on that
device. An app that draws its own full setup passes `sync: false` to
`UI.settings`.

**The sheet is the optional backup.** Since 2026-09-23 LIVE SYNC is how
devices agree; the sheet stays for a copy he can read and for photos. It never
becomes a dependency. Setup stays: create a blank sheet, paste in a short Apps
Script, click Deploy, paste the URL into settings once.

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

### Beyond habit formation

Added 2026-09-05 at Tom's instruction: "Expand your knowledge to developmental,
positive, and performance psychology." The rules above are drawn almost entirely
from habit research, which is good at stopping relapse and says nothing about
whether the thing is worth doing. These three fields fill the gap, and each one
has a concrete consequence here.

**Self-determination theory — autonomy, competence, relatedness.** Motivation
that lasts comes from these three, and an extrinsic frame laid over an
intrinsically motivated act *reduces* it. That is why "trained, so the letter
went up one" was removed: it turned training into a move in a scoring game, and
once it is that, the score is what gets protected on a bad week. **Never tell
him what a behaviour did to a number.** State the behaviour, show the number,
let him join them.

The suite is strong on autonomy — he defines every field, target and standard.
It is weak on **competence**, which is evidence you are getting better, not
evidence you complied. Adherence percentages are compliance. A personal best, a
thing that used to be hard and is now automatic, a block that has run 30 days
straight: those are competence. Build more of those.

**Self-efficacy (Bandura).** The strongest source of believing you can do a
thing is having done it. So the app should be able to show him **what he has
already done**, on demand, especially when he is failing at something else. A
screen that can only describe the current week is missing its most useful move.

**Deliberate practice, and flow.** Both need difficulty matched to current
ability — too easy is boring, too hard is quitting. Every target in here is
fixed until he changes it by hand. **A target that has been missed for three
weeks is not a target, it is furniture.** Offering to lower it is not
lowering the bar, it is the only way the bar does anything.

**Scaffolding and the zone of proximal development.** The next step should be
just past what is comfortable, and supported until it is not needed. BLOCK
already says this in its own advice — shrink it until it is almost too easy,
attach it to something automatic, let the size grow back. That instinct is
right and should spread: **anything the app suggests should be one step from
where he is, never the finished version.**

**Positive psychology, and what this suite has none of.** There is no mechanism
anywhere for noticing what went well. The journal holds entries and nothing
ever surfaces them; the grade names what cost the most and never what carried
the week. Savouring and benefit-finding are among the better-evidenced mood
interventions there are, and they are cheap: showing him a good day from a
month ago costs one query.

**What none of this licenses.** No praise for its own sake, no streaks-as-
pressure, no levels, no XP — those rules stand. The test for anything added
under this heading: does it help him see something true about himself that he
could not see before? If it only makes him feel good, it is decoration.

---

## Testing, not optional

There is no test framework and Tom cannot test code himself. **Check whether `node`
exists before relying on it** (`node --version`); as of 2026-08-20 it is not
installed here, so any brief telling you to extract the script and run `node --check`
cannot be followed literally. Use the browser instead, which is better anyway
because it runs the real thing rather than only parsing it:

1. Serve the folder: `py -3 -m http.server 8777 -d "<repo>"`.
2. Open it with the browser tool, drive it with JavaScript, read the console.
3. Run `_review.html` at the root. It opens every app in turn, checks each one
   draws and every tab works, runs `shared/_smoke.html` inside itself and folds
   the result in, and looks over whatever rows are on the device. One page,
   one tally. `shared/_smoke.html` on its own is still there for when you are
   working on the foundation and want its checks without the apps.
   Every check must pass.
   **Load it with a `?cb=<something new>` on the end.** The browser caches these
   files hard, and a run against a stale copy is worse than no run: it reports
   green on code you have not tested. Run it at phone width too — some checks
   only mean anything at one width.
4. Clean up any test data you wrote, and stop the server.

**Always test:** record merge including the two-device case where each device wrote
a different field, export and import round trips, schedule due dates at interval
boundaries, alternating cycles, scoring with as-needed and rest days, streak freeze
granting and spending, day boundary behaviour either side of the start hour, and
theme contrast maths.

Never claim something works because it should. Claim it because you watched it.

### Write the check one level under the bug

Added 2026-09-04, after STATUS's export was fixed three times for what turned
out to be one cause. Each fix was a real fix and each was tested by looking at
the picture, and the next symptom arrived anyway, because the thing being
tested was the symptom.

**A check that names a symptom only ever catches that symptom.** "The calories
are the right colour" would have passed while the labels were still wrong. The
check that earns its keep is one level under: *did the picture keep what the
page was handing it* — which is the actual mechanism, and fails for every
symptom that mechanism can produce. `shared/_smoke.html` has that one now, and
it caught a second bug in `IO.shot` the first time it ran.

Ask, before writing a check: what is the ONE thing that, if it broke, would
produce all of these? Test that.

### The harness must not join in

`_review.html` loaded `records.js` itself at first, so it could look at the
rows. That made it a SECOND live copy of the store sharing one localStorage
with the frames it was driving, and rows a frame deleted came back — written
out again from the page's older picture of the world. Three checks went flaky
and none of it was the app's fault.

It has no `<script src>` of its own now. Every row it reads, it reads out of a
frame. A thing that watches must not also be a thing that writes.

### A red check nobody reads is worse than no check

The sheet-position check failed on every run for weeks because it asked where
something was in a window with no height, which is what a hidden preview pane
reports. Permanent red trains you to skim the list. If a check cannot answer
its question in the environment it runs in, make it ask a question it can
answer, or take it out.

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
- **A Python patch script eats backslash escapes.** Writing a JS regex inside an
  ordinary `""".."""` string turns `` into a backspace character and `
` into a
  real newline, silently — the file looks fine and the regex is broken. It has
  cost three bugs in one day: `9pm` returning nothing, and a regex split across
  two lines. Use a raw string (`r""".."""`) for anything containing a backslash,
  or write the file with the Write tool instead.
- **A literal closing script tag inside an inline script ends the script element**,
  even inside a comment. Writing `<script src=...></script>` in the kernel's own
  doc comment silently truncated three apps. ARC's `'<scr'+'ipt>'` split is the
  same defence. Never write the closing tag inside inline code.
- An app that computes its own `today` will disagree with `Day.today()` the moment
  the clock is past midnight but before the day-start hour. BLOCK did exactly this
  and published its plan on a date nothing else was reading.
- **`sw.js` serves a page inside a frame too, so a test can run code you
  already changed.** A `?cb=` on the frame's address does not help: the cached
  copy answers first by design. Watched 2026-09-22, where a frame ran a TRAIN
  from two edits ago and the checks passed on it. Before driving frames,
  unregister the service worker and empty `caches` once in that tab, or open
  the parent with `?nosw=1`.
- **A setting that remembers "I already wrote this row" breaks under live
  sync.** A setting is one row, so two devices each writing it keep only the
  later one's list, and a device opened before the synced rows arrive trusts
  its empty local picture. WEALTH's bill todos (`wealth.billMade`, up to five
  copies of each bill), ARC's reviews (`arc.skmade`) and COACH's WEALTH clients
  all wrote duplicates this way on 2026-09-23. Before writing a row you make
  on someone's behalf, look for its key on EVERY date, and its tombstone too;
  never rely on a remembered list alone, and give the row a key that is the
  same on every device. Saving a default on open is the same mistake: the
  home screen saved its factory layout on a device that had not synced yet,
  stamped newer than his real one, and sync spread it everywhere
  (2026-09-25). Write a setting only when the person changes it.
- **A shared-file fix reaches a device on its SECOND open.** On the hosted
  main copy nothing is stamped, so `sw.js` answers from the kept copy and
  refreshes in the background. Watched 2026-09-24: the journal dedupe was live
  on the phone browser and not in STATUS.exe until it was reopened twice.
  After pushing a `shared/` fix, reopen the desktop programs twice (close
  normally, never kill) before saying it did not work.
- **No page of the suite can talk to a program running on his PC.** The suite is
  served over https and every local program here serves http, so a fetch from
  tomoncupa.github.io to `http://127.0.0.1:<port>` dies as "Failed to fetch"
  (watched 2026-09-23 against the real hosted home screen and the real OUTER
  HEAVEN board). A daemon reaches the store only through a FOLDER the browser
  has been given permission to read, which is the receipts pipe, or later
  through live sync. Do not design a feature around the page asking a local
  program for anything.

- **A regex over an HTML tag stops at the first `>`, and a tag can hold one.**
  The old favicons are `data:` SVGs with `<text>` inside the attribute, so
  `<link rel="icon"[^>]*>` matched half the tag and left the rest printed on
  15 pages (2026-09-23). Replace the whole line, then grep for leftovers.
- **Staging a whole file commits another session's half-done edit in it.**
  WEALTH 1.0.30 shipped a foundation session's broken icon line that way.
  Before `git add <file>`, read `git diff <file>` and stop if you did not
  write every hunk.
- **Never pick your own elements by a short class name alone.** `Chart.header`
  draws its date line as `.w`, the home screen's card class, and `fitGrid`
  took those lines for cards, threw during boot and left the dock and clock
  undrawn on every refresh (2026-09-23). Select by position (`:scope > .w`)
  or a class no shared file could plausibly use.
- **A panel that draws its own version of a shared row misses everything the
  shared row gains later.** The home screen and STATUS draw their own sheet
  setup (`sync: false`), so LIVE SYNC, added inside `IO.syncRow`, never
  reached either until Tom went looking for it. When the shared row grows,
  grep for the panels that opted out.
- **Never stamp a test row in the far future.** `_smoke.html` merged two
  rows dated 2999 to make them win; they stayed as tombstones, live sync
  carried them to every device, and every device's sync boundary followed
  them, so nothing synced anywhere for days (found 2026-09-24). `cloud.js`
  0.1.2 now ignores a stamp more than a day ahead, but a test that needs a
  newer row uses now plus a minute.
- **A desktop program's store can be read without clicking.** Start it with
  `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=<port>` and
  drive `Rec.export()` / `Rec.merge()` over the DevTools socket. Used once on
  2026-09-23 to move the old folder-copy rows into the hosted copy. Close the
  program and relaunch it without the variable afterwards.

- **Never draw text on top of an accent fill.** A bar, a chip or a progress
  strip painted `var(--accent)` is a different colour in every theme, so no
  one text colour is readable over all eighteen, and a PARTIAL fill puts the
  same label on two backgrounds at once — `--accent-fg` cannot save that
  either. Cap the fill short of the top and keep the label in the band above
  it, scaling every fill the same so what the bars are read for is untouched.
  COACH's week strip, 2026-09-24: white set counts on gold.
- **Live sync's database keeps no empty list, empty object or null.** A
  payload of only those arrives with no payload at all, and a field holding
  `[]` arrives missing. BLOCK's `{v: []}` settings stopped its board drawing in
  Chrome, and a new day's `routines: []` came back as "runs every routine"
  (2026-09-25). `cloud.js` 0.1.5 gives a stripped row `{}`; an app whose
  meaning depends on an EMPTY list must also carry a flag that says it was
  chosen, as BLOCK's `picked` does.
- **A `flex:1` title beside a `flex:1` spacer splits the bar between them.**
  TRAIN's header pushed its icons right with an empty `.spacer{flex:1}`, and a
  screen title was `flex:1` too, so "Cuffed External Rotation" was given 81px
  of bar beside 73px of nothing and clipped at every font size (2026-09-24).
  A spacer and a thing that wants the room cannot both grow: stand the spacer
  down whenever there is something to fit.
- **`mb-tap` means a control can be drawn smaller than 44px and still be 44px.**
  It expands the hit area with a pseudo-element without changing the drawing,
  so a row full of 44px-tall icon buttons can come down to a 32px drawing and
  measure 44x44 to a thumb. TRAIN's set rows went from 61px to 44 that way. Check
  the computed `::after`, not the button.
- **A sheet opened from another sheet's button walks history off the page.**
  Closing a sheet queues a `history.back()` that lands a moment later; a
  sheet opened in the same tick pushes its entry first, the late step takes
  it, and closing the second sheet then steps back to the page before the
  app. FORGE's SEND → fill list did exactly this (2026-09-25), and so did
  TRAIN's Menu → Training Routines → LOG ALL, back to the home screen.
  **Fixed at the root the same day:** `Mobile.trap` now holds a new entry's
  push until a back already on its way has landed, and one smoke check
  closes and opens in one tick and must unwind to where it began. A page
  that calls `history.pushState` itself is not covered; go through
  `Mobile.trap`.
- **`Rec.all` hands rows back in no order**, and a payload's `ord` usually
  numbers a row inside its own group, so it cannot order the groups. A list
  that must read back in the order it was entered sorts on the row KEY, which
  is a timestamp for anything keyed the suite's usual way. COACH printed a
  session's exercises in whatever order the store felt like, 2026-09-24.
- **A drag that stops the page scrolling must say so before the finger lands.**
  A phone decides at touchstart whether anything can cancel the scroll, so a
  non-passive `touchmove` listener added once a row is lifted is ignored: the
  list scrolls, the browser sends `pointercancel`, and the row drops back.
  TRAIN's day drawer shipped that way and never moved on the iPhone
  (2026-09-25). Put the listener on the list from the start and call
  `preventDefault` only while something is lifted, and give held rows
  `user-select:none` and `-webkit-touch-callout:none`. TRAIN's `holdToMove` and
  STATUS's `makeTilesSortable` both do.
- **Match a standard row by its NAME, not a key you would have made.** An
  import brings its own keys (FitNotes groups are `fn<id>`), so TRAIN's
  `fillCats` looked for `forearms`, missed his own Forearms, and added a second
  one (2026-09-25). Before adding a default, look for one with that name.
- **`Mobile.swipe` moves a row's contents onto a face, and the face is
  transparent.** Its `background:inherit` takes nothing from a row with no
  fill, so the red action shows through, and the row's own flex layout and
  height no longer reach its contents. Draw the layout, the page background
  and any selected colour on `> .mb-swipe-face`, less the row's hairline, or
  a 44px row becomes 45. TRAIN's set rows, 2026-09-25.
- **A character the display font lacks falls back to another font, and the
  line grows.** `≈` in Chakra Petch made TRAIN's WEIGHT label a pixel taller
  (2026-09-25). In a label that must not move, stay on characters the font has.
- **A cloud session can push the client copy from a branch main has not
  merged.** On 2026-09-25 `Mainmenu-client` carried FORGE from
  `claude/tom-only-program-builder-vatd4l` while main had newer TRAIN. `git
  fetch` the client repo before pushing a build; if its newest commit names
  work main lacks, do not push over it, say so.

- **A reader of TRAIN's `set` rows must apply TRAIN's warmup rule.** A set
  is a warmup when marked, else when its comment says "warmup", "warm up" or
  "wu" (`TRAIN.noteWarm`); `warm` is not stored for those. `range.js` skipped
  only a stored `warm` and counted 12,370 sets where Profile says 12,209
  (2026-09-25). COACH, SHEET and any widget reading sets need the same rule,
  and a stored 0 beats the comment.
- **When the Browser pane is not drawing, a coordinate click lands on
  nothing** and screenshots time out; typing into a box that never got focus
  is lost too. Focus the box and press the real control with `.click()` from
  the page (it still runs the control's own handler), and read the result
  from the page. Watched 2026-09-25 on TRAIN's SAVE.
- **An UNDO snackbar lasts six seconds.** A test that presses UNDO after a
  few tool calls presses a hidden toast and reports the undo broken; TRAIN's
  merge was nearly misdiagnosed that way (2026-09-25). Press it in the same
  batch as the action, or call the undo the toast was given.
- **Never `Rec.merge` a row with an id you made up.** The store finds a row
  by the id it derives from type, date and key, so a hand-made `id` is a
  second row that `Rec.all` and `Rec.map` list and `Rec.get` cannot see, and
  the app shows a ghost (2026-09-25). Seed test rows with `Rec.set`.
- **Clean test rows from a page that loads no store, in both halves, by
  parsed row.** A localStorage name is `mb.r.<user>|<type>|<date>|<key>`, so
  match the parsed `type` and `key`, not the name. A page that loads
  `records.js` copies every localStorage row missing from IndexedDB back in,
  so deleting from one half there brings rows back; and leaving
  `_smoke.html` mid-run strands rows typed `smoke-<n>`. Each cost a failed
  `_review.html` on 2026-09-25 (TRAIN 1.0.36).

---

## Current state

One line per app. What was built, watched and left open lives in each app's
own brief since 2026-09-22.

| App | State |
|---|---|
| `index.html` | Home screen: widget grid, app dock, data authority. History in `HOME.md`, read it first. |
| `block/` | Routine builder. Publishes today's plan, owns `rhythm`. Brief: `block/CLAUDE.md`. |
| `arc/` | Mind canvas, skill trees, flashcards. Tom only. Brief: `arc/CLAUDE.md`. |
| `quest/` | QUESTS, the todolist. Client build. Brief: `quest/CLAUDE.md`. |
| `form/` | Lift review. Tom only. Brief: `form/CLAUDE.md`. |
| `status/` | Every daily measure, food, money, the journal, the desktop widget. Brief: `status/CLAUDE.md`. |
| `portion/` | FOODDÉX, the food label bench. Tom only. Brief: `portion/CLAUDE.md`. |
| `train/` | The training log, FitNotes reproduced. Phone. Brief: `train/CLAUDE.md`. |
| `wealth/` | The money app. Tom only, forever. Brief: `wealth/CLAUDE.md`. |
| `log/` | The journal en masse. Client build. Brief: `log/CLAUDE.md`. |
| `style/` | The theme workbench and icon master set. Brief: `style/CLAUDE.md`. |
| `checkin/` | Physique check-ins. Client build. Brief: `checkin/CLAUDE.md`. |
| `speak/` | Talking to camera, measured. Tom only. Brief: `speak/CLAUDE.md`. |
| `system/` | NOTICE, status window pictures. Tom only. Brief: `system/CLAUDE.md`. |
| `mix/` | ELEMENT, the electrolyte bench. Tom only. Brief: `mix/CLAUDE.md`. |
| `coach/` | COACH, Tom's clients in a PC box. Tom only. Brief: `coach/CLAUDE.md`. |
| `forge/` | FORGE, the program builder. Weeks of days of exercises, sent through COACH to TRAIN. Tom only, desktop only. Brief: `forge/CLAUDE.md`. |
| `receipts/` | RECEIPTS, a receipt photo turned into rows. Tom only. Brief: `receipts/CLAUDE.md`. |
| `bullet/` | BULLET, one screen that writes a bullet. An address on no roster or dock, found from STATUS, Settings, BULLETS. Client build. Brief: `bullet/CLAUDE.md`. |
| `sheet/` | CHARACTER SHEET. Feats from TRAIN and STATUS as NOTICE windows, with a history; the pixel character is paused. Held out of the client build for now. Brief: `sheet/CLAUDE.md`. |
| `_template/` | The starter app, and the reference for how a phone-native app in this suite is built. |
| `shared/` | The foundation. `_smoke.html` must pass at desktop and phone width. Every app loads it. |

### Debt and foundation findings

In `shared/HISTORY.md` since 2026-09-24 (from `shared/CLAUDE.md`, moved there from here on 2026-09-22). "Foundation item N" means an item there.

### Installable apps, no longer dead

**Tom, 2026-09-23: "Every app can be installed from Chrome on Android and on
the PC, with its own new icon."** Installable apps were listed as dead here
until that day, for two reasons: they need a web address, and a cached copy
can go stale in silence. The suite is hosted first now (the top of this
file), so the first reason is gone, and the second is `sw.js`'s job.

Every app folder holds a `manifest.json` and four icons beside its
`index.html` (the home screen's at the root): `icon-192.png`,
`icon-512.png`, and a maskable pair with the window shrunk into Android's
round safe area. `tools/make-icons.html` draws them all with the iPhone
pictures; `_smoke.html` fails a page with no manifest link, a manifest that
does not read, or an icon that is not the size it claims. Each manifest's id
is its own folder, so installing the home screen and then STATUS gives two
apps. Opening an app from the installed home screen stays in the home
screen's window, because the whole site is its scope. A new app copies a
manifest and runs `make-icons.html`.

Opening from a folder still works: the manifest link just fails to load, and
nothing reads it but the browser.

**`sw.js`** has answered from the phone's copy first since 2026-09-18, with
the newest code arriving one open later. Tom chose that for speed. Icons, and
any page opened with `?fresh=1` (the home screen's LINKS widget adds it),
come from the network first. See `shared/CLAUDE.md`, Fresh copies.

---

## Working alongside other sessions

Tom runs more than one Claude Code session at once, often one per app. Sessions
cannot see each other. There is no shared memory and no channel: the only thing
they have in common is this folder and its git history.

Two consequences, both of which have already cost work here:

- **A session works from the copy of a file it read**, which may be hours stale.
- **`CLAUDE.md` is read once, at session start.** A session that began before a
  structural change has never seen it.

**Tom, 2026-09-22: one session per module.** "Motherbase is getting pretty
big, its optimal to wrap at around 200k. I think we should split work per
module now." This replaces the one-session rule of 2026-09-16.

A module is one of: an app folder; the home screen (`index.html`, `HOME.md`);
or the foundation (`shared/`, `sw.js`, `_review.html`, `tools/`, the root
briefs). A session works on one module:

- **Read at the start:** this file (loaded for you), the module's own brief
  (`<app>/CLAUDE.md`, or `HOME.md`, or `shared/CLAUDE.md`), and that app's
  section of `DOCTRINE.md`. Nothing else unless the task needs it.
- **Write history to the module's brief, never here.** The root keeps one line
  per app. A new app gets its own `CLAUDE.md` on the day it is built.
- **An app session never edits `shared/` or another app.** If it needs a
  foundation change, it writes the need under "Needs from the foundation" in
  its own brief and tells Tom, and a foundation session picks it up.
- **Work that spans apps names every module it touches at the start** and reads
  each one's brief. COACH, WEALTH and TRAIN are one system; so are STATUS,
  FOODDÉX and ELEMENT.
- **A lesson any app could hit goes in Known traps here.** A lesson only one app
  can hit stays in that app's brief. WRAP asks which it is.
- **A brief is rules, loaded every time; `HISTORY.md` beside it is the diary,**
  read only when working in that corner. When a brief passes about 20 KB, move
  the build stories out and keep the rules.
- **Fetch and merge before every push**, never rebase: `git pull --no-rebase`,
  then push. A rebase dies halfway while STATUS.exe or Main Menu.exe is running,
  because Windows locks them.
- **The client build refuses a dirty tree.** `tools/build-client.py` stops and
  names any uncommitted file in an app clients get, because it packages every
  client app and would ship another session's half-finished work. `--dirty`
  overrides it only when the change is yours and finished.
- **Wrap at around 200k tokens**, or when the module's task is done.

- **Look before you write:** a fresh read of the file right before editing it.
- **After a structural change, tell Tom to restart his other sessions.** They
  will not pick up a new or moved brief any other way.
- **Files you did not create** belong to another session mid-task. Leave them
  alone and say so.

## Commits

One commit per coherent change, one line, naming the area in caps, for example
`SKINS: split theme and colour layers`. No body.

**Every app has its own version.** Tom, 2026-09-14: one app goes three weeks
untouched while another changes three times in a day, so there is no suite
version, only each app's. It is one tag near the top of the app's file:
`<meta name="mb-version" content="1.0.4, 2026-09-14">`. **A commit that changes
an app bumps its version in that same commit:** the last number goes up by one
(1.0.9 becomes 1.0.10) and the date becomes that day. Tom, 2026-09-14: "go by
x.x.1". The first two numbers move only when Tom says. Every app's settings
end with the line, for example "QUESTS 1.0.4, updated 14 Sep 2026", and
`_review.html` fails an app without the tag. All apps started at 1.0.0 on
2026-09-14; ones already bumped that day were renumbered to match. This is not the `?v=` on shared
script tags, which only tells a browser to fetch shared files again and which
the client build stamps by itself.

**Push the main repo after committing.** It is public, so nothing personal ever
goes in it: no bank statements, no health notes, no workbook data. **Rebuild
and push the client copy after every change clients can see** (Tom, 2026-09-17:
*"Features should be at par always."*), and only once `_review.html` passes: a
client push reaches phones in about a minute and can only be pushed over. If it
fails, fix it or leave the client copy unpushed and say so.

Then: `py -3 tools/build-client.py`, commit the generated folder with what
changed and why, and push. Nothing in that folder is ever edited by hand.

A change clients cannot see is one to an app they do not have (`wealth/`,
`arc/`, `speak/`, `system/`, `form/`, `portion/`, `coach/`, `forge/`), to `tools/`, to
`desktop/`, or to a brief. Those need no rebuild. Building it is fine.
