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
- **Brand rules for anything he publishes:** the [Brand Master Guide](https://claude.ai/code/artifact/7c0036f3-9564-4c4d-89fb-811cad106780)
  Claude Doc. Docs and code comments in this repo are exempt.
- **End substantive replies with a confidence assessment and one concrete next
  action.**
- He is the device test. You cannot open anything on his iPhone. Say so plainly
  rather than claiming a layout works.
- **Clients** are the people who get the client build (`tools/build-client.py`).
  Tom called them testers until 2026-09-14. They are not the coaching clients
  WEALTH tracks: say which you mean wherever it could be either.

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
   spreadsheets, Google Fonts for type. If either fails to load, the app still
   works: export falls back to CSV, fonts fall back to system stacks. Never add a
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
   FOODDÉX, LOG, WEALTH and STYLE.

   **ARC, BLOCK and STYLE are desktop only.** Tom, 2026-09-14: they are not
   meant to work on a phone. Do not spend work making them stack or fit a
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
CLAUDE.md          this file
DOCTRINE.md        what each app is FOR, and the laws every app obeys
REVIEW.md          the suite reviewed on 2026-09-15: what would make it better,
                   ranked. Proposals, nothing built. Tom picks.
HOWTO.md           how Tom adds an app or a theme, in plain language
CLOUD.md           LIVE SYNC: the Firebase sync that sits BESIDE the Google
                   sheet, added 2026-09-20. What Tom does once to set it up,
                   the database rules to paste, and what it deliberately does
                   not carry. The sheet is untouched and still does everything
                   it did; this answers the one thing the sheet is slow at,
                   which is two devices agreeing in a second rather than a
                   minute. Off until a config is pasted, so a client who never
                   sets it up never makes a request from it
RECEIPTS.md        THE RECEIPT PIPE, added 2026-09-21. A photo of a receipt on
                   the phone becomes a spending row and a record of what was
                   bought. Reading happens on the PC through the claude.exe
                   inside the desktop app, so it needs no key and costs
                   nothing; confirming happens in RECEIPTS, because only
                   Motherbase knows which FOODDEX food a shop's wording means.
                   What Tom sets up once, and what it asks him
ONBOARDING.md      how a client gets the suite, and what happens after
index.html         the home screen: widget grid, app dock, data authority
_review.html       the review: opens every app, folds in the foundation checks,
                   and looks over the rows. Read-only. Run it on a real device
sw.js              the offline cache, added 2026-09-16. Opened from a folder
                   the suite never needed a connection. Opened from an ADDRESS
                   it needed one every time, just to fetch the page, and with
                   no signal the browser drew a blank page and the app looked
                   broken. This keeps a copy of each page on the phone. Since
                   2026-09-18 it answers from that copy AT ONCE and fetches the
                   newer one in the background for the next open (Tom: "Always
                   open from the phone copy IMMEDIATELY... Fast input is our
                   pillar"). A pushed change lands on the second open after it;
                   data is never involved, only code. A stamped file is at an
                   address that changes when the file does. Registered by
                   `shared/mobile.js`, so no app had to be edited. Does nothing
                   from a folder and nothing inside a frame. `?nosw=1` on the
                   address takes it off again
shared/            the foundation, loaded by every app
block/index.html   routine builder
arc/index.html     mind canvas, skill trees and flashcards since 2026-09-16.
                   Tom only since 2026-09-14, dropped from the client build
arc/CLAUDE.md      ARC's own brief, governs arc/ only
form/index.html    lift review
status/index.html  sleep, weight, mood, energy, steps, food and money
desktop/           STATUS, the Windows app, since 2026-09-17. STATUS.exe
                   runs status/index.html inside Microsoft's WebView2, the
                   engine already in Windows, in a window the program owns.
                   Tom, 2026-09-17: "I think the chrome environment is too
                   limiting." The Chrome launcher before it could not stop
                   Chrome putting its title bar back, clipping the page under
                   it, or the window being closed out from under the app,
                   which silently stopped a whole day of check ins. None of
                   those are reachable from outside a window you do not own.
                   The page says what it wants to be over a real message
                   channel, so the window is exactly the page: a widget in a
                   corner, or the check in centred, in front and focused,
                   because Tom asked for that to be intrusive. Ctrl+B calls
                   the page's own function rather than typing a key at it.
                   Its store is its own and fills from the sync code the way
                   a second device would, which Tom accepted as a good thing.
                   Compiled by build.ps1 with the C# compiler inside Windows;
                   the three WebView2 files live in desktop/lib. The old
                   launcher, StatusDesktop.cs, is kept until the new one has
                   earned its place. Windows only, Tom only, left out of the
                   client build. See desktop/README.md.
portion/index.html FOODDÉX, called PORTION until 2026-09-14. A label in, the
                   amounts you eat out. A desktop app, and the second writer
                   of `food` alongside STATUS. The folder and the app id stay
                   `portion`: theme, sound, draft and settings are saved
                   under the id, and renaming it would drop them.
train/index.html   the training log, a reproduction of FitNotes
train/CLAUDE.md    TRAIN's own brief, governs train/ only
wealth/index.html  the money app. Clients, bills, pots, debts and what is
                   actually left. Desktop. Tom only, dropped from the client
                   build. Reads STATUS's spending rather than copying it.
wealth/CLAUDE.md   WEALTH's own brief, governs wealth/ only
log/index.html     the journal module: STATUS's entries en masse. One timeline
                   from the first record to today, in views from Day to Year,
                   with STATUS's bullets, the day's line, every STATUS measure
                   as a column, written summaries for weeks up to years, and a
                   mood, energy and caffeine graph per day.
                   Desktop. In the client build since 2026-09-14.
log/CLAUDE.md      LOG's own brief, governs log/ only
checkin/index.html CHECK IN, physique check-ins for Tom and his clients: a goal
                   photo, a front photo and any pose added, each measured on the
                   device into three neutral ratios, a camera that lines this
                   week's photo up with last week's, a timelapse, weight
                   (STATUS's row) and a few answers, and a file to send a coach
                   that the coach keeps. Everywhere.
checkin/CLAUDE.md  CHECK IN's own brief, governs checkin/ only
clex/              GONE from the repo, 2026-09-16. Tom's Commander deck aid
                   left the suite on 2026-09-15 and the repo the next day. It
                   lives in Downloads/clex, outside Motherbase, unpublished.
style/index.html   the theme workbench. Desktop only, deliberately.
_template/         a working starter app, copied to make a new one
tools/             not build steps. embed-skins.py re-embeds the factory themes;
                   make-icons.html and save-icons.py redraw the iPhone icons;
                   build-client.py generates the client copy of the suite into
                   ../Motherbase-Client. Its output is never edited by hand —
                   client-only files live in tools/client/. See ONBOARDING.md.
coach/index.html   COACH, built 2026-09-22. Tom's clients in a Pokémon PC
                   box: three boxes (1:1, ONLINE, PAST) of thirty slots, each
                   client drawn as the Pokémon CHECK IN gave them. A client's
                   training arrives as the file TRAIN's Send To Coach makes and
                   is kept under COACH's own types, so it never lands in Tom's
                   own TRAIN. Strength, recent sessions and the range per
                   client, and FIRST SETS: the weight and reps of each
                   exercise's first set, sent back as a program file the
                   client opens in TRAIN, where the rest of their sets fill
                   from their last session. A PROGRAMS library holds programs
                   to send to anyone or sell. One column on a phone, two on an
                   upright iPad, three from 1180px. Tom only, dropped from the
                   client build. LOG A 1:1 on a client writes their sets as `cset` and one
                   WEALTH `sesh` per day, and every COACH client is a WEALTH
                   client and the other way round (`cperson.wc`, `client.cp`)
quest/index.html   QUESTS, the todolist, copied from Todoist. The same todo rows
                   as STATUS's journal, with a due date, priority, project and
                   repeat added. Desktop and phone. In the client build since
                   2026-09-14.
quest/CLAUDE.md    QUESTS's own brief, governs quest/ only
speak/index.html   SPEAK, talking to a camera, measured: pace, fillers and
                   crutch phrases, flow, crispness, eyes on the lens. A path
                   of drills built like Duolingo, a daily warm-up, a streak.
                   Everywhere. Tom only, dropped from the client build.
speak/CLAUDE.md    SPEAK's own brief, governs speak/ only
speak/RESEARCH.md  where every number in SPEAK came from, with sources
mix/index.html     ELEMENT, called MIX until 2026-09-22; the folder and the app
                   id stay `mix`, the way FOODDÉX's stayed `portion`. The electrolyte bench. What to weigh out today, in
                   grams, on a 0.001g scale: salt, potassium citrate, zinc
                   glycinate, magnesium glycinate. It replaces `protocol.html`,
                   which lived in Downloads, asked for every food by hand and
                   measured him against fixed targets. The targets move here:
                   sodium against what he actually sweated, magnesium against
                   what he actually weighs, and the food comes from STATUS.
                   Desktop. Tom only, dropped from the client build. Owns
                   `dose`
quest/BRIEF.md     the Daily Quest OS brief. Its measurement half moved into
                   status/ on 2026-08-20; what is left of it is a todolist.
                   Its data model and design system still govern. Superseded
                   on repo layout and testing by this file.
system/index.html  NOTICE, called SYSTEM for a few hours on the day it was
                   built. Text in and a status window out: a PNG of a game
                   notice or quest window in the Solo Leveling and Overgeared
                   manner, for posts and stories. The folder and the app id
                   stay `system`, the way FOODDÉX's stayed `portion`: theme,
                   sound, draft and settings are saved under the id, and
                   renaming it would drop them. Everywhere. Tom only since
                   2026-09-15, dropped from the client build. Built 2026-09-15.
```

**Phone or desktop:** `train/` is a phone app. `status/`, `quest/`, `checkin/`, `system/` and `speak/` are for
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
| `range.js` | A training history as a woodblock landscape, since 2026-09-22: every training block a mountain, every session a tree, taller for more volume, blossoming on a record day. TRAIN's Profile and COACH draw it. `Range.fromRows` builds it from TRAIN-shaped rows. Writes colours down for the same reason. |
| `notice.js` | The status window LOOK: four palettes and the cut-corner shape. NOTICE strokes it on a canvas to make a picture, STATUS clips a real panel to it for the status check. The one place in the suite that carries hex colours on purpose, for the reason NOTICE always had: the window is the art, not the furniture, so a Hunter window is blue in every theme. Nothing here reaches an app's own chrome. |
| `cloud.js` | LIVE SYNC: Firebase beside the sheet, added 2026-09-20. One row per row at `/u/<uid>/rows/<id>`, pushed on change and listened for by `updated_at`, merged through `Rec.merge` like anything else. Fetched by `io.js` rather than by a tag in every app, the way `mobile.js` fetches `sw.js`, so no app was edited. Only the TOP document connects, because `records.js` already shares merged rows across the origin and fourteen frames would be fourteen connections. A row over 64KB is skipped AND THE BOUNDARY STILL PASSES IT, or one photo would jam every sync after it. Does nothing until a config is pasted. See `CLOUD.md`. |
| `nutrients.js` | The full nutrient list a food can carry beyond the eight, added 2026-09-22: fibre, sugar, the fats, EPA and DHA, cholesterol, eleven minerals and the vitamins, thirty-one in all. One list, three readers: FOODDÉX fills them from its USDA lookup (found by the USDA's printed NAME and unit, never its numeric id, and International Units skipped), STATUS gives each one a column on the sheet's Food tab, and ELEMENT reads its five off the food. They live on `food.base` beside the eight. A blank is "not known", never zero. |
| `_smoke.html` | 328 checks over all of the above. Run it after touching any of them. |
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
| `exercise` | **train** | exercise id | `{name, cat, kind, inc, rest, unit, fav, note, graph, also, gdef, setup}` — `setup` is the setup fields he names for it, each a toggle or a setting |
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
| `cprog` | **coach** | `c-<pid>` for a client's first sets, an id for a library program | `{name, pid, days:[{name, ex:[{name, sets:[{kg, r}]}]}]}` — one row per program, because a program is written, sent and sold as one piece. Only the first set of each exercise is sent. `cperson` gains `box` and `slot` from COACH, by patch |
| `brief` | **the daemon on the PC**; **quest** reads it and never writes it | `''`, dated the day it is for | `{text, todo, t, src}` — Claude's morning brief for that day, added 2026-09-22. `text` is plain lines, `# ` a heading and `- ` a point; `todo` a list of action items, each a string or `{text}`. QUESTS shows it as a foldable card at the top of Today and turns each item into a todo keyed `brief-<date>-<n>`, `src: 'brief'`, due that day, written once, so a deleted one stays deleted. How the row reaches the store is the daemon's business |
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

**Where the sheet is set up.** Tom, 2026-09-14: the Google Sheet setup (the
script, the automatic switch, syncing every app) lives on the home screen and
in STATUS only. Every other app's DATA tab ends with a box to paste the sync
link and a Sync now button, drawn by `IO.syncRow`, and nothing more. The link
belongs to the suite, so pasting it in one app pastes it for every app on that
device. An app that draws its own full setup passes `sync: false` to
`UI.settings`.

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
   working on the foundation and want the 314 without the apps.
   It must say 314 of 314, or more once you add checks.
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

### Closed: three icon checks failed on a cold store

Closed 2026-09-15: all three pass on a store wiped empty first. See foundation
item 7. Kept for the history.

Found 2026-09-04 by `_review.html`, which opens `_smoke.html` in a fresh frame
every run and so always runs it cold. `icons: a dropped pack installs`, `a
theme naming one drawing beats the pack` and `a button can be pointed
elsewhere` fail on the first run against an empty store and pass on the second.
Running the same code by hand passes. Waiting on `Rec.ready` before starting
was not enough. Not chased to the bottom yet — the review reports it rather
than hiding it, which is the point.

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

---

## Current state

| App | State |
|---|---|
| `index.html` | Home screen. On the shared foundation as of 2026-08-20: skin tokens, bottom tab bar on a phone, sheets instead of its own modal. Widget grid still drags and resizes with a mouse; a phone gets a REARRANGE mode instead. Since 2026-09-14 the roster's order is the default dock, set by Tom: HOME, BLOCK, STATUS, LOG, QUESTS, TRAIN, CHECK IN, STYLE, then Tom's own apps (ARC, WEALTH, FORM, FOODDÉX, flagged `mine`) behind a thin line with no label and no tooltip. Tom, 2026-09-14: "I don't want a Tom Only... I know who I am." Nothing on screen names the group. The order is kept inside each group and nothing moves across. A saved order lives under the setting `dockOrder`; the older `dock` is ignored, because it was the old default rearranged. Buttons carry icon and name with the number key in the tooltip, and a window from 821 to 1400px wide shows icons only. Also 2026-09-14: the grid packs densely, so a short widget beside a tall one leaves no empty band; WEIGHT draws its line through the actual weigh-ins with no average, and its big number is the latest reading; TODAY and TODO follow STATUS's day rule including QUESTS's `due` (a todo dated for later is not on today, No date is not on today) and tick the way STATUS and QUESTS do, a repeat doing a round (`tickTodo`, `repeatAfter` are copies: change all of them); the tick buttons draw the shared `done` icon with a 44px target. Since 2026-09-15 (1.0.5): cards are `mb-card` and rows `mb-plate` in the block's colour or the widget's app's; every app has a colour slot from the chart ramp, worn by its dock icon, its tile and its widgets; app icons are 20px at a heavier stroke; `shared/icons/<app>.png` is the iPhone home-screen icon, linked by mobile.js. BESIDE (1.0.6, 2026-09-15): up to three measures on one date axis, one strip each on its own scale, picked from the widget's menu: STATUS's fields, the day's training volume, the day's spending, and how much got logged. No verdict. LINKS (2026-09-17): every app's address on the web, in two groups — MINE, the full suite, and CLIENTS, the seven apps a client gets. Tapping a row copies that address and the button beside it opens it. Both lists come off the APPS roster and the `mine` flag, so an app added later is in both without editing it. Tom's own: `DROP_WIDGETS` in tools/build-client.py takes it out of the client copy, and nothing on it says Tom Only, the way the dock's line has no label. TIMER (1.0.13, 2026-09-17): a preset SETS the timer rather than adding to it, because "Clicking 3m Should set it to 3 minutes" and adding meant there was no way to ask for the one thing written on the button. With nothing running one press does it; with a count in progress one press only says what it is about to do and a second inside three quarters of a second carries it out, which is Tom's "make it need a double tap if we want it to override a currently running timer". 1.0.12 stacked on the second press instead, which was Claude's idea and protected nothing. SET reads half minutes: 10, 2.5, 0.5 and 1:30. 1.0.14, 2026-09-17, two Tom reported together. NOTICE went missing from the dock at some window widths: the names came back above 1400px, the row grew past the window, and `overflow-x:auto` with a hidden scrollbar slid the last apps off the right edge with nothing on screen saying so. NOTICE is thirteenth of fourteen, so NOTICE is what vanished. The 821-to-1400 band was the bug, because it had a floor: it is a ceiling now, names under 1700px only, and under 1150px the wordmark, the clock and the words on WIDGET and DATA go too, so everything that is not an app gives way before an app does. `fitNav` stays as the belt and braces and fades the right edge if a future app overflows even the icons; it reads in a zero timeout rather than straight away, because nav is a flex item with its own scroll box and an immediate read is of the layout one class ago, and never on requestAnimationFrame, because a minimised or covered window gets no frames. Watched with nothing cut off at 830, 1000, 1100, 1150, 1300, 1400, 1700, 1800 and 1920. And "Main Menu on phone should only show Phone apps": the roster carries a `phone` flag now, which is hard constraint 10 written down, so the thumb bar is HOME, STATUS, QUESTS, TRAIN, CHECK IN, NOTICE and SPEAK and the desk work is left to the desk. At 375px that is seven buttons of at least 47x54 with no label clipped, against fourteen of 26px before. 1.0.15, the same day, three more Tom reported together. The TODO widget names each task's source, which was asked for in the same breath as "why does pay skool show up twice" and is half the answer to it: two rows reading alike are two apps' idea of one job, and nothing on the row said so. A project name beats the app name where there is one. The TODAY widget's tick moved to the left, where TODO already had it and where a box does not drift with the length of the row above. And LIFE got the three things it was missing: Set age, Set birth year and Set how many years on the card's own menu (not on a year square, which nobody would find), a colour per band picked from the theme's six chart slots, and a legend saying what the bands are FOR — YOUNG, MIDDLE, TOO OLD FOR A LOT, each with its range. Watched at 1400px: the menu, the colour submenu, a colour change landing, and the legend reading back. 1.0.16, the same day: bullets are drawn through `shared/journal.js` like everywhere else. Tom: "All bullet entries should look the same regardless of where." STATUS, LOG and QUESTS all drew one through the shared renderer and the home screen was the odd one out, building its own row out of a plain span, so the same line wore a different face depending on which screen you looked at. TODO, IDEAS and EVENTS now use `bulletRow`, which is `mb-bullet` with the mark in a `.k` and the words in a `.tx` — the same contract, and asking journal.js for either half brings its stylesheet with it. Watched: the mark and the words come out byte for byte identical to what STATUS builds for the same row, and a todo two days old draws the `>` arrow rather than a box, which is the rule STATUS has always followed and the home screen never did. |
| `block/` | Working. Publishes today's plan, reads and writes shared ticks. Actively edited in other sessions. Every and Anytime tabs added 2026-09-14 and driven in the browser: 53 of 53 self-test checks, six of them new, and a real add, tick and reload. Owns `rhythm`. What is owed or due, and Anytime habits not yet met this week, also show in an Also today column on the Day (today and past days, never the future) and go into the published plan with `s: null` and a `why`, so the home screen and QUESTS show them. Export has a For someone else tab (2026-09-14): a `motherbase-block-starter` file of the day on screen (Tom names a day after the person he is setting up) with its routines, blocks and weekdays, and any chosen Every and Anytime habits, with no ticks, history, settings or rules. Importing it (also under ⋯) adds to a board with new ids, numbers clashing names, overwrites no weekday, skips a habit whose name is taken, and replaces only an untouched starter board. A day that runs on no weekday takes every empty one when it arrives. 1.0.5, 2026-09-17: the board stops changing under your hands. It used to rebuild and redraw whenever a row moved, which while the app is open is every forty five seconds, guarded only by a quarter of a second either side of a save and by a drag in progress. It now holds the repaint while you are working and takes it the first quiet moment: twenty seconds with no click, key or wheel, nothing open, nothing focused. The sync itself is untouched, so rows still merge the instant they land; only the drawing waits, and a held update re-arms itself rather than being dropped. Also: two rows sharing an `ord` are settled by id, so blocks added at the end of one lane on two devices cannot swap places on a repaint. Self-test 57 of 58, the one failure pre-existing and time-dependent. 1.0.6, the same day, went further on Tom's "BLock never really have to update because I only use it on my pc, once instance at a time" and cut the live subscription, so the board was read once at open and was yours until you opened it again. **1.0.7, the next day, put it back, and 1.0.6 was a mistake worth keeping written down.** Tom: "Block, my local file is syncing supposedly, my web page version isnt getting it." He has at least two copies, the folder on this machine and the one on the web with the sheet between them, so rows arrived, merged and sat in the store while the screen showed the board it read at boot. Nothing said so, which is what makes a working sync look broken. The subscription was the wrong half to cut: what he complained about, "Things get missarranged", was already answered by 1.0.5's quiet rule, and the subscription only ever decides WHETHER the screen catches up while the guards decide when. An arriving row asks `adoptSoon`, not `adoptRows`, so forty rows ask for one quiet moment rather than forty. Watched both ways: a lane written into the store from outside is absent at 12 seconds and on screen by 24; a second one, with the board poked every three seconds for 27, does not move through any of it and lands once the poking stops. 1.0.8, 2026-09-17: the colour menu is a palette. Tom: "Block color menu should be a palette." It was ten rows of colour names, so choosing Amber over Gold meant reading two words and knowing which was which, and a colour is the one thing that cannot be described faster than it can be shown. Ten swatches in a grid, the current one ringed, each name kept in its tooltip. `buildMenu` grew a `pal` item kind, which is the only way a menu built out of text rows could hold one. Self-test 59 of 59. 1.0.9, the same day: an edit survives a refresh made straight after it. Tom: "I want my changes to persist even after I refresh right after making them." Two things stood between the edit and the store. A routine's start time is a field that commits on BLUR, so a time typed and then refreshed had never reached the board at ALL — not a save that lost a race, a value the app was never told about. And `save()` batches for 250ms, which a refresh inside that window took with it. `flushRows` on `pagehide` and on the document going hidden answers both: it asks `UI.commitFocused` for the typed value first, then cancels the timer and writes at once. `touched` guards it, so a device that only ever looked at the starter board still does not write it. Watched: a time typed with the cursor still in the box reached the store on pagehide, and a committed change still inside the 250ms batch did too. Self-test 59 of 59. 1.0.10, the same day: routines go to Google Calendar. Tom: "I think I just want to push the routines and not the individual blocks. Can you write the blocks as details IN the routines?" So ONE event per routine per day, running from its start to where its last block ends, with the blocks listed inside it — a calendar of forty entries a day is one nobody opens, four is a day you can read at a glance. Left out: a routine with no start time (a list with no clock has nowhere to sit), a hidden block, a routine not running that day, and anything before today. 14 days ahead, because a weekday template is the same every week and a year of it would be a year to clean up. The key is date plus routine, so a second push updates rather than duplicates. Rides the sheet link and the same push as the rows, with one switch in BLOCK's own settings, off until asked. Watched: 28 events across two routines and 14 days, an untimed routine left out, a timeless block written with no clock, a routine stretched to its anchored last block, keys stable across calls, and the payload on the real push body with the switch off sending none. **The calendar write itself is NOT watched — it needs his sheet and his Google account. The script half is verified only as far as it can be here: it parses as a whole program and carries the calendar functions.** Self-test 59 of 59. |
| `arc/` | Tom's build, with its own brief. On the shared foundation as of 2026-08-27: the store, the theme engine, the icon set, the settings sheet and the standard backup. Owns `map`, `node`, `link`, `attempt`, `card` and `crev`. `arc/` is canonical; any copy in `Downloads` is a convenience mirror and loses. Tom only since 2026-09-14: behind the dock's line with his other own apps, and dropped from the client build. Skill trees since 2026-09-16 (1.0.1), replacing AI Teach Mode: a node can be a skill with a test; it opens when the skills under it pass, passes on hits on separate days, comes back for reviews, and while in training is a daily QUESTS todo whose tick is a hit. Four in training, stuck skills split, trophies. Built with Claude through the clipboard, and the skill tree.exe skill carries the format. Watched in the browser on test data; not with a real tick from a phone. Cards the same day (1.0.2): a Cards tab over the canvas for the fact-shaped parts of what a tree teaches, on their own SM-2-style schedule that never touches the skill schedule, made from a node or pasted in as `front :: back` lines, graded with the keyboard, and exportable as a spreadsheet. See `arc/CLAUDE.md`. |
| `quest/` | QUESTS, built 2026-09-14 and tested in the browser at desktop width; phone width not measured, because the test pane reported no width. Todoist's Inbox, Today, Upcoming and projects over STATUS's todo rows. Reads dates, times, P1 to P3, #projects and repeats from anywhere in the line, highlighted as typed, with a chip to give the words back. Todoist's date menu and overdue Reschedule. Ticking a repeat writes a finished copy and moves the todo on; STATUS does the same. In the client build since 2026-09-14. Today also lists BLOCK's published plan with Now and Next, every row says whether it came from QUESTS, STATUS or BLOCK, and Date, Priority, Move to and More are visible buttons on each row. STATUS's journal keeps showing todos, on their due date. A clock with no am or pm is the next time it comes round today, in QUESTS, STATUS and LOG, for every kind of line; on another day 1 to 6 is the afternoon. Each app carries its own copy of the rule. LOG's copy of `notes()` does not know `due` yet, so LOG still shows those todos on the day written. 1.0.9, 2026-09-17: @labels, beside the #projects that were already there. Tom: "Can we copy Todoists #Project and @Tag system on Quests?" A todo has ONE project and ANY NUMBER of labels, which is the whole difference between them: a project is where a job lives, a label is a condition it needs before it can be done. Typed anywhere in the line and highlighted as typed, one chip each so a single one can be given back, a Labels section in the side listing every one in use with its count, and a view per label. Labels have no rows: a label is a word on a todo and nothing else, so the list is read off the todos and one nobody uses stops being listed — projects have rows because they carry a colour and an order, and a label carries neither. Two details worth keeping: the label rule sits AFTER the time rules so `@8` and `at 8` still mean eight o'clock, and it is the one rule allowed to match more than once per line, since `@phone @15min` is two conditions rather than a second attempt at naming one. Watched: both labels off one line, a repeat ignored, `@8` still a time, the side counting, the view filtering, and the label you are standing in left off its own rows. 1.0.10, the same day: typing @ offers the labels already in use. Tom: "How can we ensure labels get used correctly?" What ruins a label set is not misuse, it is SPRAWL — @phone, @Phone and @calls all meaning one condition, after which no label view is complete and you stop trusting them. Case was already dealt with, since a label is slugged. This is the rest: the moment you type @, the ones you already use sit under the box, narrowed as you type, so picking an existing label is less work than inventing one, and a word that matches nothing says `new label` rather than letting you make a fourth synonym without noticing. Read off the CARET, not the line, so a second @ offers a list that leaves out the label already on the row. Watched: no @ offers nothing, a bare @ offers all three, @d narrows, @zzz offers only new label, and a pick completes both at the end of a line and mid-line. |
| `form/` | Standalone by design. Video never leaves the device. Tom only, kept out of the client build. |
| `status/` | **Counting calories is a switch since 2026-09-17** (Settings, Track, Count calories). Off, the calorie and protein pillars leave the grade and one check takes their place, `sentfood`, "Sent food", an ordinary field so it gets a tile, a sheet, a chart, the export and LOG's column for nothing. The Food tab, the Protein tile and both as choices for the big number go with them; a client who had calories at the top gets steps. It is per device, because there is no server to set it from. Why: a client who eats well and never opens the food screen scored zero on both counted pillars, so the letter was reporting on logging and calling it adherence. Built 2026-08-20 and tested in the browser. On the shared foundation. Owns every daily measurement. 1.0.8, 2026-09-16 adds the desktop half, which only exists when `desktop/`'s launcher opened the page (`?desktop=1`): Mini mode, one strip showing Mood, Energy and the next two measures switched on; a check in on a gap that is different every time between a low and a high he sets, inside hours he sets, writing an ordinary `ev` reading and an ordinary `entry` bullet and nothing new; and Ctrl+B for a bullet. In a plain browser tab none of it exists, so a client on a phone sees no DESKTOP tab and no Mini button. Driven in the browser: the hour boundaries, an overnight window, 200 rolls all inside the range, reversed and equal min and max, Skip writing nothing, no stacking, and the strip at 470x86 with every target 44px. The launcher watched on this machine end to end. 1.0.9, the same day, on Tom's "I don't like how the window can be bigger than the actual app interface" and "I just wanted the widget": it opens as the widget, the gap is 60 to 90, the title is a state the launcher compares against rather than an event it can miss, and snackbars are hidden in the widget because one is taller than the whole thing, with the backup reminder held back until the whole app is open so it cannot be lost. 1.0.10, the same day, is Mini mode as Tom described it: "My last Bullet, a FAB that asks me Mood and Energy which also resets the interval. More of a square form factor." So the widget is 360x400 rather than a strip, it shows the last line he wrote whenever he wrote it, today's mood and energy sit along the bottom so the button is visibly doing something, and the round button turns the widget into the question rather than opening a dialog wider than the window. Answering by hand rolls the next automatic ask forward. The height was measured, not chosen: the question needs 392px, and at 300 and at 360 the text box was present but clipped out of sight. 1.0.11, the same day, on "I'd like it smaller, More compact, minimalist": three things came OFF rather than shrinking, which is what actually made it small. The STATUS wordmark went (it is his widget, on his screen, above his bullet), the header row it sat in went with it, and MOOD - ENERGY - only appears once there is a reading, as a face and a bolt with a number. What is left is the bullet and one row of controls, 320x135 at rest against 360x400 before, with no type made smaller. The page now MEASURES itself and puts the size in its title, so the window is exactly the box and a layout change in here never needs the launcher rebuilt; opening a panel grows the window and closing it shrinks it back. The pencil is quick capture in the widget, opening on Entry (Tom: "Default entry mode should be entry bullets not to do"), Enter saves and Shift+Enter is a newline; STATUS's own journal sheet still has the times and repeats and is one click away. 1.0.26, 2026-09-17, Tom: "in wide view, can we have stats island and journal island be side by side". Past 1024px the Today tab is two columns, the day's card on the left with the add button under it and the journal on the right; below that, and in the desktop widget at 320px and the check in at phone proportions, it is the one column it always was, and Food, Money and Trends never change. 1.0.27, the same day, three more. The day's card is 366px, what it measures at 390, because half of 1180 fitted five tiles across where a phone fits three and the same day looked like two screens: "have stats island follow phone width - I want the grids to be similar". Right click or hold either card to swap them, one setting kept as a row, meaning which column at the desk and which card on top on the phone. And the widget stopped cutting the bullet off: five lines rather than two, and the size it reports is re-sent whenever a child of the box changes height. That second one is the clipping Tom reported. The measurement went out once, at the end of the draw, so anything changing a height afterwards left the window at the old size with the box hanging out of it and nothing saying so — watched at 320x138 reported against a box already 225 tall. A ResizeObserver on the box's children answers every cause of it at once. 1.0.28, the same day, is the check in, now called a STATUS CHECK on screen because that is what Tom calls it. It had stopped arriving at all: one left unanswered stayed on the widget as `deskPanel = 'ask'`, and the tick's own guard reads `deskPanel`, so a single ignored question switched the feature off for good. His log for the day shows one at 05:02 and none after, with the panel it put up still on screen at 08:55. The fifteen minute recovery that was meant to catch this cleared `deskAsking` and left the panel, and it sat below both the `deskNext` return and the quiet hours gate, so the two states most needing clearing were the two it could not reach. It now runs on every tick, closes whatever is up, widget panel or whole app dialog, and walking away still ends the night. Driven in the browser: an ask, sixteen minutes, the widget back, the next one arriving; the same for the dialog; and a night one ignored going quiet until the waking hours. 1.0.29, the same day, is the status check as Tom actually wants it: "I want the notif to be HUGE and IMMEDIATE... it should never go away until answered." It is the whole screen now rather than a box in the corner, it wears a NOTICE window, and it has no close button, no SKIP and nothing reachable underneath it. SAVE is the only exit, and until every scale is pressed it names the one still missing rather than going dead. The two old paths, a panel inside the widget and a UI.dialog in the whole app, became one overlay that works the same in the widget, in the whole app and in a plain browser tab with no launcher. The 15 minute give-up shipped in 1.0.28 is gone with them: a check still on the screen is no longer a jam to recover from, it is the thing working. The quiet-hours rule was "until I stop answering it", which needed a way to walk away, so it is now one per night closed by answering it. The look comes from `shared/notice.js` and the window is chosen in Settings, Desktop; BLOCK is the default. Driven in the browser at 320x240, 390x844, 1280x720 and 1920x1080: all four windows paint in their own palette, Escape and a click on the backdrop do nothing, a due tick cannot stack a second, Ctrl+B cannot open a bullet behind it, SAVE is on screen even in a 240px-tall window, every target is at least 44px and 119px on a desktop, and answering writes ordinary `ev` readings and closes the night. The launcher half, `takeover`, compiles and is NOT watched running: only Tom's machine can do that, and STATUS.exe has to be rebuilt for it because a launcher built before it ignores a verb it does not know. 1.0.30 covers that gap: the page sends the old `checkin` verb once first, so an unrebuilt launcher still centres a 900x700 window instead of cramming a full-screen question into a 320px widget, and the new verb overrides it a moment later on a launcher that has one. 1.0.32, 2026-09-17: a food label is read in the unit it is PRINTED in. Tom: "how possible is intelligent food entry? 1000mg - 1 gram." A label prints sodium in milligrams and protein in grams and mixing them up is the easiest mistake there is to make while copying one, so every box on the food form now takes the packet's own words and converts: 1.2g into Sodium mg is 1200, 25000mg into Protein g is 25, 0.1kg into a gram serving is 100. The box is rewritten when you leave it, so the conversion is something you SEE rather than something you hope happened. `UI.amount` does the arithmetic, `NUT_UNIT` says which unit each box holds, and a bare number still means what it always did, so nothing that worked before changes. The status check also asks the launcher for the screen once and once only: the message used to carry the widget's measured size, so any redraw that moved it by a pixel was a new message and another grab at a screen he was not sitting at (Tom: "Just have the Status Check pop up once and then I'll always answer it when im back in my desk"). The host refuses a second `takeover` while it is already the check, which is the same rule held from the other end. |
| `portion/` | FOODDÉX on screen since 2026-09-14; the folder and id are still `portion`. Built 2026-09-05, made a desktop app 2026-09-06. Tested in the browser. A bench for building food entries and a viewer over the ones you have. Paste or type a label; it says how much of it hits 50g of protein or any other number, in grams or in pieces, what that comes to and what it costs. Saves the answers as ordinary servings, so STATUS logs them in one tap. Hands the entry over as words to paste into somebody else's tracker or as a spreadsheet row. Ranks the whole library against whatever amount is on screen, which is the comparison. Searches, edits and deletes; refuses to make a second food with a name you already have. Reads Sodium, or converts Salt where a label prints that instead. Tom only, kept out of the client build by `tools/build-client.py`. |
| `train/` | Built, and tested in the browser at 390px against Tom's real 12,370-set FitNotes backup; the phone itself is his iPhone 13 Pro, and nothing has been watched on it yet. A reproduction of FitNotes v25.1 on the shared foundation, plus Tom's own idea of training (2026-09-14): sessions with names and training blocks, each working set compared with the same set last time in reps and percentage, a session card and a weekly card that share as story pictures, sets per muscle per week, a Profile with all-time and block records, and setup recorded per set. Warmups and split sets are read from comments. Says session and training, never workout. Owns the training log. Has its own brief. |
| `wealth/` | Built 2026-09-11 and tested in the browser. The money app: three numbers (liquid, allocated, free) and runway. Owns clients on any payment cycle — every N months on one or several days, every N weeks, every N sessions, packages bought up front, or one off — with expected payments derived from the cycle rather than stored. A monthly day is clamped per month when the date is worked out and never when it is saved, so the 31st stays the 31st in every month that has one. Spending reviews at three zoom levels, day, week and month, with a day drawn as a timeline down the clock. Reads STATUS's `spend` rows and files them with a `mark` row rather than editing them, so STATUS's price, account, receipt and meal link cannot be dropped. Text rules sort spending retroactively. Big purchases are marked and excluded from every "normal spending" figure. Every name is picked from a list, never typed twice, and every amount groups itself with commas as it is typed. Logs spending itself as well as reading STATUS's. A donut for where money went, and monthly net beside liquid. Amounts are stored in one base currency and a header switch reads them all in a second one; the rate is typed and dated rather than fetched, and typing always stays in the base currency so a round trip cannot lose anything. Tom only, kept out of the client build. Opens a GCash PDF (asking for its password, never storing it) or a bank spreadsheet directly, with pasting as the fallback. Trusts the running balance over the printed amount, so ride holds GCash prints as payments are dropped and part-charges fold into one purchase; checks every statement against its own closing balance; nets reversals; and records money between his own accounts once, as a transfer, even when both statements show it. An import setup asks once what each new payee is and turns the answer into a rule; transfers to people nobody named are filed as One-time transfers tagged Unsure, still counted as money out. Then reconciles it: certain matches merge into a master entry keeping his category and taking the bank's amount, uncertain ones are asked about one at a time, and reading the same file twice adds nothing. Optional monthly caps per category, shown as a number and a pace mark rather than a verdict. Has its own brief. 1.0.14, 2026-09-17: one bill bullet at a time. Tom: "Why does pay skool show up twice in my todo widget? meralco too." They were not duplicates. Bills are read 30 days ahead and Meralco is every 6 to 7 days, so four or five of its dates sit in the window at once and every one not matched to a payment is overdue and therefore on today's list — four real rows, all reading `Pay Meralco, 1,040`. You cannot pay next week's before this week's, so only the earliest outstanding date per bill gets a bullet and the next appears when that one is cleared. Rows written under the old rule fall out of `want` and are taken back on the next pass, so his existing ones clear themselves; a ticked one is kept, as ever. Watched: six owed dates across two bills became two bullets, and two extra rows seeded by hand were removed on the next sync. |
| `log/` | Built 2026-09-13 and tested in the browser. The journal module: a way to view STATUS's entries en masse. One continuous timeline from the first record to today, in eight views from Day to Year; the wheel scrolls, the mouse side buttons change view, a held button drags. Days show the day's line and STATUS's bullets, with a faint mood, energy and caffeine graph behind; beside them, day columns for "What got done today" and every STATUS measure, reorderable, resizable and hideable; beside those, weeks, months, quarters and the year with written summaries. A notebook view lays days out as two-page spreads. Writes `note` and the day's `note` by merging, owns `recap` and `cell`. Never watched with a real mouse or real data. In the client build since 2026-09-14 (Tom: "LOG and QUESTS are for clients as well"). Has its own brief. |
| `style/` | Built 2026-08-21. Pick, compare, edit and add themes, and holds the icon master set. A desktop app, like most of the suite: comparing themes honestly means several real screens side by side. Built out of `shared/ui.js` components rather than its own chrome. Owns `skin`. |
| `checkin/` | CHECK IN, built 2026-09-14 from `_template/`, grown 2026-09-15 into Tom's first ask: a goal physique, regular check-in photos, how far off, and a timelapse. Everywhere, and in the client build. Has its own brief, and one master conversation. Front ships; any other pose is one tap with no name. Every photo is measured on the device by Google's MediaPipe (fetched once, about 20MB, kept for offline; the dots start in the middle if it cannot load) into three ratios, with dots anyone can drag. PROGRESS shows goal, first and latest with the numbers and the change and no verdict. The Check In camera: last time's ghost, a body match, directions spoken and beeped, tilt, light, an automatic three-beat shutter and an optional setup photo. TIMELAPSE lines every photo up on the body, as a flipbook or a before-and-after wipe, with the face shown, blurred or covered by the person's own animal, saved as MP4 or WebM. Saves photos named by date and pose (a zip on a desktop), reads them back from files or a folder, and makes a Copy for Claude picture and question. Opening a client's file now KEEPS it under their id. Tested in the browser 2026-09-15 at 1280px and 390px with a fake camera and a CC BY 1865 photograph: camera directions, auto-shutter, measuring, client files opened twice, zip, MP4. Not tested on a phone. Hips measure unsteadily when a hand is near them (see the brief). 1.0.4, 2026-09-17, two of Tom's. Projects: "be able to denote projects in check in", and a project is a training phase — a cut, a bulk, a prep. PROGRESS carries an ALL TIME chip and one per block, and inside a block First becomes Block start, Since first becomes This block, and the photo list under it narrows to match, so the screen means one thing rather than two. These are TRAIN's own `phase` rows and not a second list of the same idea: a training block is a training block whichever app you stand in, and two lists would mean naming his cut twice and watching them disagree. Ownership names who is responsible for the SHAPE, not who may write, so CHECK IN patches rather than rebuilds and registers `phase` both ways, reading TRAIN's tab so a device where TRAIN was never opened still sees the blocks. Watched: date filtering across an ended block and a running one, and shoulders-to-waist reading 2.13 to 2.50, +0.37 inside the block against 1.88 to 2.50, +0.62 all time. And the bluetooth camera remote: "Bluetooth camera remote should work in check in." A remote is not a camera, it pairs as a KEYBOARD, so this is a key handler on the camera screen — Enter, Space, the arrows, k and the volume keys, because which one a remote sends depends on the remote and the mode it is switched to. It presses the same shutter a thumb does, so the setup shot, the count and the retake behave identically, and it is attached in the capture phase and detached when the camera closes. **Known limit, the browser's not ours: iOS Safari does not hand a web page the volume keys, so on his iPhone the remote has to be in its Android mode.** The remote itself is NOT tested — there is no remote here, only Tom has one. |
| `speak/` | SPEAK, built 2026-09-15 from `_template/`. Tom: "Speech improvement app to help me with YT and short form content", based on Duolingo, objective feedback, a guided game, daily warm-up drills, and every drill saying its goal and why. Five skills (PACE, CLEAN, FLOW, CLEAR, EYES) of five steps each, a step opening when the one before is met; three drills a day picked from the skills furthest from target; a three-step warm-up that sets the day's crispness reference; a streak with a silent freeze; no XP, no levels, no verdicts. The ear counts syllables after de Jong & Wempe, tuned on four clips with 97 counted syllables; pauses at 250ms; held sounds as the um proxy; a spectral-tilt proxy for crispness; pitch spread; the browser's own recogniser for words and crutch phrases where it exists and is switched on; Google's face landmarker for time on the lens, calibrated during the count. Driven in headless Chromium at 1280px and 390px with a fake microphone (a synthetic clip with known counts, read exactly) and a fake camera (a still face, read 100% on the lens). Tom, 2026-09-15, "make it local on my machine": the recogniser is the only thing that could send his voice out and it is off by default, so a take makes no network request at all and the page's only one is the fonts every app fetches. A drill whose goals need a switch that is off is left out of TODAY, drawn locked with the reason, offers the switch in one tap, and never blocks the step after it; a goal nothing could read says no reading, never not met. Not run on a phone, and no real voice has been through it. Has its own brief and a research file. |
| `system/` | NOTICE on screen since 2026-09-15; the folder and id are still `system`, for the reason FOODDÉX's are still `portion`. Built 2026-09-15 from `_template/`. Text in, a status window out: a 1080px-wide PNG of a game window in the Solo Leveling and Overgeared manner. Plain lines make a NOTIFICATION window, one bracketed message per line; lines starting with `-` make a QUEST INFO window with a title, goals as tick boxes (`[x]` ticked, `40/100` as progress), REWARDS and an optional WARNING from a `Penalty:` line. Rewards are typed under `Rewards:` or, if not, made up from the text, steady until REROLL: EXP from the number of goals and words, a stat matched to the words (train is STR, run is AGI, sleep is VIT, read is INT, post is CHA, meditate is WILL), a title, and gold or an item. Three window styles, HUNTER (blue), LEGEND (gold) and VOID (violet), drawn on a canvas with fixed palettes of their own: the picture is the art, and the app's own chrome stays on tokens. Three frames: the window alone on a clear background, a 1080 x 1920 story or a 1080 x 1350 post, either clear or on a dark wash, at IO's three sizes. SAVE PICTURE hands the file over through `IO.handOver` inside the tap; COPY puts it on the clipboard where the browser allows. RECENT lists what was saved and reopens it. Owns `msg`. Tom only, kept out of the client build: it makes his posts, not a client's. Tested headless in Chromium 2026-09-15 at 1280px and 390px: both modes, three styles, three frames, typed and made-up rewards, reload, save, recent, no target under 44px, no sideways scroll. Google Fonts is blocked in the test sandbox, so the faces were fetched separately and served to the page: every style was then watched in its real face, Rajdhani in HUNTER and Cinzel in LEGEND, and the picture's corners come back fully transparent with the card at about 80% opacity, which is what makes it sit on a photo. Not opened on a phone. 1.0.2, 2026-09-17: the heading is no longer part of the style. It used to come off the style, so HUNTER also meant the word NOTIFICATION and LEGEND meant NOTICE with no way to have one without the other; it is its own HEADING control now, AUTO or one of NOTIFICATION, QUEST, SYSTEM MESSAGE and NOTICE, and a `#` line still beats it. BLOCK is a fourth style and the default: the suite's own theme as a picture, flat, gold and no glow. It kept the square brackets round each line, which came off in the first build and Tom put back the same day (1.0.3). A third window, ITEM, reads `Rank:` and `Effect:` and draws a name, a rank, what it reads like in the hand and EFFECTS, made up and rerollable the way a quest's rewards are. MAKE ONE FOR ME writes the window: eight kinds (daily, urgent and penalty quests, item, title, skill, level up, message), ten topics or ANYTHING, ranks E to S scaling how many goals and how big the numbers are, his own words as the title or item name, and a switch for whether the rewards are written in or left to the app. Word tables and a seeded shuffle, no network and no model, and it writes the ordinary text so anything it makes can be edited by hand. COPY was one attempt with one message: the modern clipboard is refused outright where the suite genuinely runs (a page opened from a folder has no proper address, and Chrome answers "Write permission denied" before it looks at the picture). It tries the modern clipboard two ways, and when neither is allowed it stops pretending: a COPY panel says what happened in the browser’s own words, names the folder as the cause when that is the cause, points at right-click Copy image over the picture already on the page, which cannot be refused, and offers SAVE PICTURE. 1.0.3, 2026-09-17: the old selection copy that sat in between is gone. It returned true and NOTICE said "Copied" and nothing was on the clipboard, because what it puts there is a scrap of HTML holding the picture as text that most places refuse to paste. A fallback that lies is worse than no fallback. Driven in the browser 2026-09-17: 960 combinations of the maker parsed and drew with no failures, the heading came out the same under all four styles, ITEM read its rank and effects, and both arms of the COPY panel were read back with the browser’s real error in them. What lands on the operating system’s clipboard cannot be read back from the sandbox, so whether the modern clipboard succeeds on his machine is still his test, and it is not opened on a phone. 1.0.4, 2026-09-17: the four palettes and the cut-corner shape moved to `shared/notice.js`, because STATUS's status check now wears one. NOTICE's parser, its made-up rewards and its canvas layout stayed here, since they exist to turn typed text into a picture and nothing else wants that. Watched after the move: the four palettes come off the shared table, and a Hunter window still draws with its corners cut away and its body filled. |
| `mix/` | MIX, built 2026-09-20 and driven in the browser. Tom, 2026-09-20: "this is meant to COMPLETELY replace protocol HTML, that one came out wrong." What to weigh out today in grams, from goals that move with the day. Four things it does that the old file could not. It reads today's food out of STATUS rather than asking for it twice, and works out the five nutrients STATUS does not keep — zinc, magnesium, copper, choline, preformed vitamin A — from a food table by matching the meal's name; a meal it cannot name, or one not logged in grams, is listed by name under the totals rather than silently counted as zero. The sodium base is the seven-day average of FOOD sodium, with MIX's own salt taken back out by key: without that subtraction today's added salt lands in STATUS, tomorrow reads it as food, and the base ratchets upward for ever, which is the exact opposite of the "keep what I retain the same every day" it exists for. Potassium is scaled against the base plus 200mg per litre sweated, not against the sweat-inflated sodium goal, because a litre of sweat costs about 200mg of potassium and about 830mg of sodium, and scaling by the goal asked for roughly five times what was lost and put the GI cap in the way of every training day. And zinc past the single-dose cap goes with the chicken meal instead of stopping short of the target, since the target is the thing priority 3 protects. Every dose line drags between cards, salt refuses the night drink, and the layout is a setting row rather than localStorage so it is in the backup and reaches the laptop. Watched on the test case Tom set: 1.667 L of sweat, a 4,038mg sodium goal, 0.071g of zinc glycinate, and logging twice writing one row rather than two. Never opened on a phone, and it is a desktop app. The swing warning measures the sodium KEPT, total minus what came straight back from sweat, because against the total it fired on every training day by design and a warning that is always on is one nobody reads. |
| `_template/` | The starter app, and the reference for how a phone-native app in this suite is built. |
| `shared/` | The foundation, passing 314 checks on 2026-09-17 at BOTH desktop and phone width. Every app loads it. |

### Debt, in the order it should be paid

1. ~~The old blob kernel~~ **Done 2026-08-20.** Kernel v2 is a view over
   `records.js`; the apps kept their API and did not move. First load copies the
   old `lifeos_v1` blob into rows and leaves it in place as its own backup.
2. ~~ARC carries its own copy of the theme engine~~ **Done 2026-08-26.** It
   reads `shared/skins.js` and went from ten themes to eighteen, keeping its
   own per-theme colour editing. BLOCK and FORM went onto it the same day.
   HABITS was the only app left off it, and was deleted on 2026-09-14.
3. ~~The apps still carry their own settings, themes and sounds~~ **Done
   2026-09-22.** Every app uses `UI.settings` and `skins.js`; BLOCK was the last
   on its own sound and moved to `sound.js` in 1.0.16.
3b. ~~Apps not loading `shared/mobile.js`~~ **Done 2026-08-20.** Every app
   loads it and every viewport covers the safe area. What is left is per-app:
   auditing each one's own CSS for hover-only controls and sub-44px targets,
   which the shared layer cannot do for them.
4. ~~Commits are unpushed~~ **Settled 2026-08-26.** Tom: "push - always push
   without me asking". The main repo is pushed after every commit. See the
   end of this file for the client copy.

### Foundation, found and not acted on

Recorded 2026-09-06 on Tom's instruction: "Save all things that affect
foundation for now." Every one of these is in `shared/` or at the root, so an
app session must not touch them. They are written down here because commits and
this file are the only handoff there is. Each says what was watched, not what
was suspected.

**2026-09-14: a foundation session worked through this list.** Items 1, 6, 8,
9, 10, 11 and 12 are fixed, plus three things TRAIN found (13). A fixed item
keeps a short entry, because most of them left a workaround in an app that an
app session now has to delete. Item 14 lists those.

**1. ~~The store can wait forever~~ Fixed 2026-09-14.** `hydrate()` in
`records.js` stops waiting after 2.5 seconds: `Rec.ready` fires on what
localStorage had, `Rec.stats().idbSlow` says so, and the big rows merge in and
announce whenever IndexedDB does answer. Writes are untouched; they queue on
the same open and land when it does. Watched: a frame whose `indexedDB.open`
never answers fired ready at 2514ms with its localStorage rows. Not a smoke
check, because proving it costs two and a half seconds per run. There is still
no `onblocked` handler; nothing has been seen to need one.

**2. ~~First paint should not be behind `Rec.ready`~~ Closed 2026-09-15.**
STATUS draws what localStorage already holds after 300ms and ARC loads the fast
half synchronously, both done earlier by their own sessions; TRAIN was the last,
and now does the same: if the store has not answered in 300ms and there is a
log, it draws, and seeding and the record pass still wait for ready. Watched in a
frame whose IndexedDB never answers: TRAIN had drawn at 900ms, ready came at 2.5s.

**3. ~~`Rec.patch`, so merging is easier than replacing~~ Built 2026-09-14,
Tom said yes.** `Rec.patch(type, date, key, changes)` reads the row, changes
only the fields it is given and writes it back. The two open questions,
decided by Claude: a dotted name reaches into a nested object
(`{'base.ca': 120}` leaves the rest of `base` alone), and a value of
`undefined` removes a field. A row that is not there is made; a patch that
changes nothing writes nothing. Five smoke checks. No app calls it yet: moving
the apps that rebuild rows by hand onto it is each app's own job.

**4. ~~A cross-device merge is whole-row~~ Closed, found 2026-09-15.** It was
fixed on 2026-09-15 by `9d55433`: a row that has been edited remembers when
each field changed, and two devices' copies merge a field at a time, so a
laptop's rename and a phone's protein edit both survive. See FIELD TIMES in
`records.js`. This entry stayed open by mistake.

**5. ~~Cache-busting is inconsistent~~ Settled, found 2026-09-15: no app carries a `?v=` stamp any more, the "none of them do" half of the choice below, and the client build stamps its own.** Counted 2026-09-14: `log/`, `style/`
and `wealth/` load shared at `?v=16`; `_template/`, `checkin/`,
`portion/` and `quest/` at `?v=15`; the home screen, STATUS, TRAIN, BLOCK, ARC
and FORM carry none. Fixing it touches every app folder, so it wants a moment
when no app session is live. Harmless from a folder, where
nothing is cached. It matters the day hosting returns, because the known trap
says "bump the version" and there is no one version to bump. Either every app
carries the same stamp or none of them do.

**6. ~~`_review.html` reports leftover test rows too eagerly~~ Fixed
2026-09-14.** It counted rows, and one run writes more than its limit of 12.
It now asks about age instead: a test row still live ten minutes after it was
written was left behind, and the failure names the types.

**7. ~~Still open from 2026-09-04~~ Closed 2026-09-15: all three pass on a store wiped empty first.** the three icon checks that fail on a cold
store and pass on the second run. Recorded under Testing above; unchanged.

**8. ~~`shared/chart.js` cannot draw money~~ Fixed 2026-09-14.** Its step
table stopped at 5000, so eighty thousand pesos drew seventeen gridlines. Past
the table the step now carries on as 1, 2, 2.5 and 5 times each power of ten.
Smoke check: "money in the tens of thousands still gets a readable scale".

**9. ~~`UI.segmented`'s buttons are 38px~~ Fixed 2026-09-14.** They are
`var(--tap)`. Every segmented strip in every app is 6px taller, which nobody
has looked at on a real screen yet.

**10. ~~The review checks a purchase's account against the wrong form~~ Fixed
2026-09-14.** It accepts an account's key or its name, since STATUS writes the
name.

**11. ~~A desktop menu closes before its item can be clicked~~ Fixed
2026-09-14.** Written down twice the same day, by WEALTH and by LOG. The
listener now ignores presses inside `.mb-menu` and is removed when the menu
closes. The smoke check presses an item and then clicks it; with the old
listener put back, that check fails, which was tried. Not watched with a real
mouse.

**12. ~~`shared/` still names HABITS~~ Fixed 2026-09-14.** All four leftovers
are gone. The dock check now lists the twelve apps on the home screen, and
LOG, QUESTS, CHECK IN, WEALTH and FOODDÉX have app icons for the first time: a
book, a tick, a camera, a banknote and a bowl. Until now the dock drew a plain
character for each. Claude picked those five; change the role in `icons.js`
if one reads wrong.

**13. Found by TRAIN, fixed 2026-09-14.** One: `icons.js` has `minus`,
`trophy` and `burger` drawings, under the roles `minus`/`less`,
`record`/`best`/`pr` and `nav`/`drawer`. Two: a `UI.row` whose control is a
text box or a select puts the label above it, instead of squeezing the label
to 0px at every width. A box with its own `max-width` stays beside its label.
Settings rows with a select change in LOG, STYLE, WEALTH and TRAIN. Three:
sheets use `svh` after `vh`, so on iPhone Safari they stop at the visible
screen rather than under the toolbar. Not seen on a phone.

**14. ~~Workarounds an app session can now delete~~ Closed 2026-09-15.** LOG's
`menuAt()` and CHECK IN's `menu()` were already gone; WEALTH's `menu()` now only
places the menu beside what opened it, which is its own job. The stepper minus in STATUS
was found already drawn with the shared `minus` icon when Tom asked
for it on 2026-09-15.

**15. ~~STATUS's journal code lives in several copies~~ Moved 2026-09-14, Tom
said yes.** `shared/journal.js` holds the kinds, the day rule, the time parser,
the clock labels, the publish steps, repeats and the tick. STATUS, LOG, QUESTS
and the home screen keep their old function names as one-line pointers to it,
so nothing that called them changed. LOG's copy had drifted: it published a
todo due next week as an event on the day it was written, and now it does not.
Two things stay per app on purpose: QUESTS's reader for dates typed anywhere in
a line, and LOG's caffeine half-life sum, still a copy of STATUS's.

**16. ~~A row deleted on the device came back from the sheet~~ Fixed
2026-09-15, `io.js` 0.1.10.** Tom: "deleting bullets not getting saved". The
delete itself was fine and survived a reload. A delta push never takes a line
off a tab, so the deleted bullet's line stayed on the Journal tab, and the
next pull that read the tab took it for something typed into the sheet and
wrote it back alive. Same for a deleted food, meal, spend or tracked field,
and on the second device too, because the tables were applied before the
save file carrying the tombstone. Now a line whose row is a tombstone here
stays deleted unless it was typed into after the delete, a delta push sends
a delete up as an emptied line, and a pull merges the save file first.
`Rec.tombstone` and `Rec.tombstones` are new. Three smoke checks. Watched in
the browser against STATUS's real Journal table; not watched against the
real sheet.

**17. A sweep of every shared module, 2026-09-15, `io.js` 0.1.11.** Tom:
"do a sweep of all our modules for bugfixes." Every file in `shared/` was
read end to end. Five fixes, each watched in the browser: `Mobile.hold`
opened a menu twice on Android (the timer and the browser's own context-menu
event); `Mobile.swipe` left a page-wide listener behind per row per redraw;
`Rec.reload` could lose a big row still queued for IndexedDB (queued writes
go first now); `Journal.publishTimed` timed a todo on the day it was written
and never on its due day; `Health.check` counted a bill due next month as a
future-dated tick. Three smoke checks. Read and found sound: `day.js`,
`sound.js`, `chart.js`, `icons.js`, `skins.js` (one unescaped theme name in
the picker, fixed), `ui.js`. Left alone on purpose: `UI.smartTime` reads a
bare "12" typed over a morning time as midnight, which is arguable either
way. The three cold-store icon checks (item 7) were still open that
morning; item 18 found them closed.

**18. Finishing the list, 2026-09-15, `io.js` 0.1.13.** Tom: "Finish all the
foundation work". What was done, each watched in the browser:

- `shared/import.js`, new. Brings in a spreadsheet the suite did not write, by
  shape, not by name: a month grid of 1 and 0 becomes ticks, a Weight row or a
  Date and Actual Weight table becomes weigh-ins, a food table becomes foods, a
  spend table becomes money out. It never overwrites, never guesses an
  account, never reads a formula as a record, and leaves out a row dated years
  from the rest of its sheet. One `Rec.merge`, one undo. The home screen's
  DATA panel has "Bring in an old spreadsheet". Tried on Tom's own Excel life
  OS: its calorie tracker's "Actual Weight" column turned out to be formulas,
  a projection, and three spends were typed as 2020 in a 2025 sheet.
- `UI.menu` draws `sub` and `check`. It silently dropped both, so WEIGHT's
  Show range had never done anything when chosen.
- STYLE's editor has a Material switch under FEEL.
- The iPhone home-screen icon follows the theme: a picture per factory theme
  in `shared/icons/<theme>/`, drawn by `tools/make-icons.html` with
  `tools/save-icons.py`, and each app's colour slot now lives in `icons.js`
  (`Icons.appSlot`) so the dock and the pictures cannot disagree.
- Items 4, 5 and 7 found closed and marked so.

Fixed the same day, on Tom's yes, as `reads` (item 19): an app's sync read only its
own `_Data · <app>` tab, so a LOG opened on its own never got STATUS's bullets.

Tabled by Tom on 2026-09-15, "don't touch any apps looks yet": adopting
`mb-card` and `mb-plate` in apps other than the home screen.

**19. Sync reads the apps a view depends on, 2026-09-15, `io.js` 0.1.14.** Tom:
"yes fix LOG's sync". A pull read only the app's own `_Data · <app>` tab, and
every app pushes into its own, so any app showing another app's rows missed
them on a device where that other app was not open. `IO.register` takes
`reads: { status: ['note', 'day'] }`: whose tab, which types. The tab is
downloaded when that app has pushed since this one last looked, by the push
receipt the sheet already keeps, and only the named types are merged. No
change to the Apps Script. Wired: LOG reads STATUS and QUESTS; QUESTS reads
STATUS, LOG and BLOCK's plan; STATUS reads QUESTS, LOG, FOODDÉX and WEALTH;
WEALTH and CHECK IN and FOODDÉX read STATUS; BLOCK reads ticks from STATUS,
QUESTS, LOG, TRAIN and SPEAK.

Found on the way: BLOCK registered `lane`, `item` and `routine` but not
`rhythm` or `plan`, so an Every or Anytime habit and the published plan had
never gone to the sheet. Both are registered now.

### Parked, not cancelled

Hosting, accounts and phone sign-in. The plan is in `ARCHITECTURE.md` with a banner
saying so. Firebase was chosen for one narrow reason: it sends the SMS itself, so
there is no texting company to sign up with and no carrier paperwork.

### Dead

Installable phone apps. They need a web address, so they do not work from a folder,
and the caching failure mode is exactly the kind of silent breakage he cannot
diagnose. Revisit only if hosting returns.

**`sw.js` is not that, and the difference is the whole reason it was allowed.**
Added 2026-09-16. The objection above is to a cached copy going stale in
silence. This one cannot: everything unstamped is fetched from the network
first and the copy is only reached for when the network fails, so with signal
you are always on the newest code and there is no stale window to be in. It
also changes nothing about how the suite is opened. It is still a folder or a
link, never an install.

---

## Working alongside other sessions

Tom runs more than one Claude Code session at once, often one per app. Sessions
cannot see each other. There is no shared memory and no channel: the only thing
they have in common is this folder and its git history.

Two consequences, both of which have already cost work here:

- **A session works from the copy of a file it read**, which may be hours stale.
- **`CLAUDE.md` is read once, at session start.** A session that began before a
  structural change has never seen it.

**Tom, 2026-09-16: from now on he works on Motherbase in one session at a
time.** That session may touch the foundation and any app. The rules below
still hold, because an old session or another tool can still be running:
still commit each app and the foundation separately, and still stop and say
so when you find changes you did not make.

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

**Push the main repo after committing, without asking.** Tom, 2026-08-26:
"always push without me asking". The repo is public, so nothing personal
ever goes in it: no bank statements, no health notes, no workbook data.
**Rebuild and push the client copy after every change clients can see**, and
do it without asking. Tom, 2026-09-17: *"Features should be at par always."*
This replaces "never push unless Tom says so", which was written to stop a
half-finished thing reaching a phone and instead quietly stopped everything:
six builds stacked up unpushed over two days, and clients sat on STATUS 1.0.7
from 15 September while 1.0.19 waited on this machine. A client running code
twelve versions old cannot be supported over a message, which is the failure
the old rule was trying to prevent.

**One condition, and it is not optional: `_review.html` passes first.** A push
there lands on clients' phones in about a minute and cannot be taken back, only
pushed over. The review opens every app, checks each draws and every tab works,
and folds in the foundation checks. It costs one page load. If it fails, fix
the failure or leave the client copy unpushed and say so.

Then: `py -3 tools/build-client.py`, commit the generated folder with what
changed and why, and push. Nothing in that folder is ever edited by hand.

A change clients cannot see is one to an app they do not have (`wealth/`,
`arc/`, `speak/`, `system/`, `form/`, `portion/`), to `tools/`, to
`desktop/`, or to a brief. Those need no rebuild. Building it is fine.
