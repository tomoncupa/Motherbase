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
   FORM, PORTION and STYLE. They are used sitting down, with a mouse, to plan,
   build, review and compare. Hover is allowed, density can be tighter, dialogs
   may sit in the middle of the screen rather than rising from the bottom, and
   a layout may assume a wide window.

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
ONBOARDING.md      how a beta tester gets the suite, and what happens after
index.html         the home screen: widget grid, app dock, data authority
_review.html       the review: opens every app, folds in the foundation checks,
                   and looks over the rows. Read-only. Run it on a real device
shared/            the foundation, loaded by every app
block/index.html   routine builder
arc/index.html     mind canvas
arc/CLAUDE.md      ARC's own brief, governs arc/ only
habits/index.html  habit tracker (a stand-in, see Debt)
form/index.html    lift review
status/index.html  sleep, weight, mood, energy, steps, food and money
portion/index.html a label in, the amounts you eat out. A desktop app, and
                   the second writer of `food` alongside STATUS.
train/index.html   the training log, a reproduction of FitNotes
train/CLAUDE.md    TRAIN's own brief, governs train/ only
wealth/index.html  the money app. Clients, bills, pots, debts and what is
                   actually left. Desktop. Tom only, dropped from the tester
                   build. Reads STATUS's spending rather than copying it.
wealth/CLAUDE.md   WEALTH's own brief, governs wealth/ only
style/index.html   the theme workbench. Desktop only, deliberately.
_template/         a working starter app, copied to make a new one
tools/             not build steps. embed-skins.py re-embeds the factory themes;
                   build-client.py generates the tester copy of the suite into
                   ../Motherbase-Client. Its output is never edited by hand —
                   client-only files live in tools/client/. See ONBOARDING.md.
quest/BRIEF.md     the Daily Quest OS brief. Its measurement half moved into
                   status/ on 2026-08-20; what is left of it is a todolist.
                   Its data model and design system still govern. Superseded
                   on repo layout and testing by this file.
```

**Phone or desktop:** `status/` and `train/` are phone apps. Every other app,
including the home screen and `wealth/`, is a desktop app. See hard constraint 10.
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
| `skins.js` + `skins.json` | Themes, and the colour layer on top of them. |
| `sound.js` | Sound themes and instruments, synthesised, no audio files. |
| `mobile.js` | The touch layer. Sheets, swipes, safe areas, keyboard, back stack, haptics. |
| `ui.js` | Snackbars, dialogs, confirms, menus, switches, and the standard Settings panel. |
| `io.js` | Per-app backup, restore, and the readable spreadsheet export. |
| `icons.js` | The icon master set. One drawing serves many buttons. |
| `health.js` | Answers "is my data okay" without a test suite. |
| `_smoke.html` | 64 checks over all of the above. Run it after touching any of them. |
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
| `plan` | **block** | `routine` | today's published plan, for anything that wants to read it |
| `note` | **status** | line id | one journal line: a todo, an entry, an event or an idea |
| `field` | **status** | field id | the definition of a tracked measure |
| `ev` | **status** | field id | `{e:[{t,v}]}` — one row per field per day |
| `day` | **status** | `''` | `{note, rest}` |
| `food` | **status** names the shape; **portion** writes it too | food id | the label as printed, plus your own servings |
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
| `cat` `rule` `wtag` | **wealth** | | spending categories, the text rules that sort into them, and occasion tags |
| `mark` | **wealth** | `date\|spendKey` | `{cat, tag, big}` — what WEALTH thinks of one of STATUS's spends. Kept OFF the spend row on purpose |
| `count` | **wealth** | date + account id | `{bal}` — a counted balance. Kept off `acct` so STATUS cannot wipe it |
| `client` `paid` | **wealth** | | a coaching client, and money that arrived. A `paid` with no client is a one-off |
| `sesh` | **wealth** | date + id | `{client}` — one session delivered. A client paid every N sessions is paid off a count, so the count has to be auditable |
| `pack` | **wealth** | date + id | `{client, n, price, note}` — sessions sold before they happen. Payments apply to packages oldest first, so partial payment needs no extra field |
| `bill` `debt` `pot` `move` | **wealth** | | recurring outgoings, what is owed, savings pots and movements into them |
| `map` | **arc** | map id | `{title, view, snaps, order}` — a mind map, without its nodes |
| `node` | **arc** | `mapId\|nodeId` | one node. The addressable fact on a canvas, so moving one node writes one row |
| `link` | **arc** | `mapId\|linkId` | `{a, b, rel, ord}` — a connection that is not a parent link |

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
   Read the row, change your fields, write it back whole. An app that owns
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

**What the store still cannot do, and it is worth knowing:** a merge between
two DEVICES is whole-row and newer-wins. If a laptop edits one field of a food
and a phone edits a different field of the same food before they meet, the
later write wins entirely and the earlier field change is gone. Rule 1 fixes
this on one device and does nothing across two. Fixing it properly needs
per-field timestamps, which is a real design and is on the foundation list
below rather than pretended away here.

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
   working on the foundation and want the 163 without the apps.
   It must say 163 of 163, or more once you add checks.
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

### Open: three icon checks fail on a cold store

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
| `index.html` | Home screen. On the shared foundation as of 2026-08-20: skin tokens, bottom tab bar on a phone, sheets instead of its own modal. Widget grid still drags and resizes with a mouse; a phone gets a REARRANGE mode instead. |
| `block/` | Working. Publishes today's plan, reads and writes shared ticks. Actively edited in other sessions. |
| `arc/` | Tom's build, with its own brief. On the shared foundation as of 2026-08-27: the store, the theme engine, the icon set, the settings sheet and the standard backup. Owns `map`, `node` and `link`. `arc/` is canonical; any copy in `Downloads` is a convenience mirror and loses. |
| `habits/` | A stand-in, now superseded by `status/`. Harvest the streaks and one-click promote-from-routine if they are still wanted. Do not add to it. |
| `form/` | Standalone by design. Video never leaves the device. |
| `status/` | Built 2026-08-20 and tested in the browser. On the shared foundation. Owns every daily measurement. |
| `portion/` | Built 2026-09-05, made a desktop app 2026-09-06. Tested in the browser. A bench for building food entries and a viewer over the ones you have. Paste or type a label; it says how much of it hits 50g of protein or any other number, in grams or in pieces, what that comes to and what it costs. Saves the answers as ordinary servings, so STATUS logs them in one tap. Hands the entry over as words to paste into somebody else's tracker or as a spreadsheet row. Ranks the whole library against whatever amount is on screen, which is the comparison. Searches, edits and deletes; refuses to make a second food with a name you already have. Reads Sodium, or converts Salt where a label prints that instead. Kept out of the tester build by `tools/build-client.py`. |
| `train/` | Brief written 2026-08-20, build in progress. A 1:1 reproduction of FitNotes v25.1 on the shared foundation, phone first, for a Galaxy A10. Owns the training log. Imports Tom's real 12,370-set FitNotes backup. Has its own brief. |
| `wealth/` | Built 2026-09-11 and tested in the browser. The money app: three numbers (liquid, allocated, free) and runway. Owns clients on any payment cycle — every N months, every N weeks, every N sessions, packages bought up front, or one off — with expected payments derived from the cycle rather than stored. A monthly day is clamped per month when the date is worked out and never when it is saved, so the 31st stays the 31st in every month that has one. Spending reviews at three zoom levels, day, week and month, with a day drawn as a timeline down the clock. Reads STATUS's `spend` rows and files them with a `mark` row rather than editing them, so STATUS's price, account, receipt and meal link cannot be dropped. Text rules sort spending retroactively. Big purchases are marked and excluded from every "normal spending" figure. Every name is picked from a list, never typed twice, and every amount groups itself with commas as it is typed. Logs spending itself as well as reading STATUS's. A donut for where money went, and monthly net beside liquid. Tom only, kept out of the tester build. Statement import is designed for and NOT built. Has its own brief. |
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

### Foundation, found and not acted on

Recorded 2026-09-06 on Tom's instruction: "Save all things that affect
foundation for now." Every one of these is in `shared/` or at the root, so an
app session must not touch them. They are written down here because commits and
this file are the only handoff there is. Each says what was watched, not what
was suspected.

**1. The store can wait forever, and an app gated on it shows nothing.**
`IDB.open()` in `shared/records.js` handles `onsuccess` and `onerror`. It has
no `onblocked` handler and no timeout. If the browser never answers the open
request, the promise never settles, `hydrate()` never runs, `hydrated` stays
false and every `Rec.ready` callback waits forever.

Watched on 2026-09-06: a raw `indexedDB.open('motherbase', 1)` in the test
browser was still pending after three seconds and took minutes to answer.
`_review.html` failed `status: opens and draws something` on two consecutive
runs because STATUS puts its whole first paint behind `Rec.ready`. The same
run passed PORTION, which paints immediately and lets the food list arrive
late. Intermittent: the same browser was fast the day before.

The fix is small — give up after a couple of seconds, carry on with
localStorage, and say so — but it is `records.js`, "the one file to be careful
with", so it wants a session of its own.

**2. First paint should not be behind `Rec.ready`.** Item 1 is what happens
when the store is slow; this is why it costs so much. STATUS, TRAIN and ARC all
draw nothing until the store is ready, so a slow store is a blank screen with
no explanation. Paint what localStorage already has, then fill in the big rows
when they land. PORTION does it that way and survived the same failure. The
data model section says an app that draws from the store on load "must wait on
it" — that should read "must redraw when it lands".

**3. `Rec.patch`, so merging is easier than replacing.** `Rec.set` overwrites
the whole payload, which is what let STATUS drop the calcium PORTION had
written. A `patch(type, date, key, changes)` that reads the current payload and
shallow-merges would make the safe thing the easy thing, and it is what the
many-writers rule above actually needs to be enforceable rather than a promise.

Two open questions, neither decided: how it reaches a nested object like a
food's `base`, and what a caller passes to clear a field rather than set it.

**4. A cross-device merge is whole-row.** Two devices editing different fields
of the same row before they meet: later write wins entirely, earlier field
change gone. `Rec.patch` does nothing for this. Fixing it properly needs
per-field timestamps, which is a real design and probably only worth doing if
hosting and accounts arrive. Written down so it is a known limit rather than a
surprise.

**5. Cache-busting is inconsistent.** `style/` loads shared at `?v=16`,
`portion/` and `_template/` at `?v=15`, and the home screen, STATUS, TRAIN,
BLOCK, ARC, FORM and HABITS have no `?v=` at all. Harmless from a folder, where
nothing is cached. It matters the day hosting returns, because the known trap
says "bump the version" and there is no one version to bump. Either every app
carries the same stamp or none of them do.

**6. `_review.html` reports leftover test rows too eagerly.** The check fails
above 12 rows left behind, and one run of the 163 foundation checks now writes
more than that, so several runs back to back trip it while the store catches up
with the frames' deletions. It failed that way on 2026-09-05. A red check
nobody believes is the thing this file already warns about.

**7. Still open from 2026-09-04:** the three icon checks that fail on a cold
store and pass on the second run. Recorded under Testing above; unchanged.

**8. `shared/chart.js` cannot draw money.** Its `STEPS` table, the list of
gridline intervals a person reads without doing arithmetic, stops at 5000. A
chart spanning eighty thousand pesos asks for a 20,000 step, finds nothing that
big, and falls back to the last entry — seventeen gridlines with their labels
sitting on top of each other.

Watched on 2026-09-11 building WEALTH's six-month chart: five labels expected,
seventeen drawn, unreadable. Nothing had hit it before because money is the
first thing in this suite counted in tens of thousands; weight, reps and
calories all sit under the ceiling.

WEALTH works around it with its own `moneyScale`, which computes a step and
hands it to `ySet`. The real fix is four more entries on the table, in
`shared/`, so an app session must not do it. Delete WEALTH's workaround when
the table grows.

**9. `UI.segmented`'s buttons are 38px, and the rule is 44.** The month picker
in WEALTH is twelve targets under the minimum, and none of them are WEALTH's —
they are the shared control at its own height. Every app that uses a segmented
control has the same twelve. Found 2026-09-11 by measuring at 375px wide.
Either the control grows to `var(--tap)` or the rule has a stated exception;
it should not quietly be both.

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
