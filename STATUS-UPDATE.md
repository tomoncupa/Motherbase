# MOTHERBASE — STATUS UPDATE

**Written 2026-09-09. For handing to a fresh Claude (or a person) as context on
what the suite is, what it could be sold or given away as, and what state each
part is actually in.**

**Basis for this document:** the repo's own briefs (`CLAUDE.md`, `DOCTRINE.md`,
`train/CLAUDE.md`), the git history, and a read of the app source. Nothing here
was re-tested in a browser for this update. Where a claim comes from a dated note
in the repo rather than something watched working, it says so. The newest commit
this reflects is `facce84` (2026-09-09).

---

## Part 1 — What the whole thing is

Motherbase is a suite of small web apps that share one local database. Each app:

- is **one HTML file** you can open by double-clicking it, or upload anywhere
- works with **no internet, no account, no sign-in**
- saves **every tap instantly**, on the device, in the browser
- draws from the **same shared drawer**: one data store, one set of themes, one
  set of sounds, one backup and export format

The pitch in one line: **the shared data is the product, and the apps are
windows onto it.** A meal you log in one app is visible to every other app in
the same instant. Training you record shows up on the home screen and in the
habit view without anything being copied or synced.

There is no build step. The folder as it sits is the deployable thing: copy it
to a web host, or open it from disk. That constraint is deliberate and it shapes
every technical decision below.

### The apps in the suite

| App | One-line job | Device | State (short) |
|---|---|---|---|
| **Home** (`index.html`) | Pick an app, see if today needs anything | Desktop | Working, on the shared foundation |
| **STATUS** | Record what happened to your body and money today | Phone | Working, heavily built out |
| **TRAIN** | Log sets at the gym, know if you're getting stronger | Phone | Core built, several screens still missing |
| **BLOCK** | Build a day out of blocks, see whether it held | Desktop | Working |
| ARC | Think on a canvas until the idea's shape appears | Desktop | Working (Tom's own build) |
| FORM | Compare two lift videos side by side | Desktop | Working, standalone |
| PORTION | Work out how much of a food hits a protein target | Desktop | Working, kept out of the tester build |
| STYLE | Decide what the whole suite looks like | Desktop | Working |
| HABITS | Habit tracker | — | Deliberate placeholder, superseded by STATUS |

This update covers the first four in depth, per the request.

---

## Part 2 — What you have to offer, product and service wise

This section is framing, not settled fact. It maps the suite onto the business
as the repo describes it: solo premium coaching under Personal Protagonist,
moving toward community revenue, with a Skool community that has a free tier and
a paid all-access tier.

### Three distinct things you can put in front of people

**1. A coaching tool you run for a client.** FORM (video comparison) and BLOCK
(day planning) are things you operate with your expertise on top. The client
never has to touch them. This works today, on your machine, for one client at a
time.

**2. A self-tracking suite a member runs themselves.** STATUS, TRAIN, and the
home screen are built to be used by someone standing in a gym or a kitchen with
no help. This is the thing that could sit behind the paid tier: "all-access
includes the tracking suite." It runs today, but only from a folder or a file,
because there is no hosting yet (see Part 4).

**3. A point of view, made concrete.** The suite is opinionated in a way that is
itself content. It refuses to ship a default morning routine because "being
forced feels grossly unpleasant." It won't tell you what a behaviour did to a
score, on purpose, because that turns training into a game you then protect on a
bad week. Every one of those choices is a post, a video, or a lesson. The
`DOCTRINE.md` file is essentially a philosophy of self-tracking you could
publish nearly as-is.

### What a member could actually use today vs. what is you-only

| Usable by a member now | Still needs you, or needs hosting |
|---|---|
| STATUS: full daily logging (weight, sleep, mood, energy, steps, food, money, journal) | Any of it on an iPhone (storage gets wiped after 7 days, see Part 4) |
| TRAIN: logging a workout, browsing history, one graph type | TRAIN: analysis, records, routines, plate calculator, rest timer, first-run setup |
| BLOCK: planning a day or week | Anything syncing between a member's phone and laptop |
| Home screen: seeing what's outstanding | Distribution that isn't "here is a zip file" |
| Themes, backup to a file, spreadsheet export | A member restoring a backup without being talked through it |

### The honest gap

There is no delivery mechanism yet. Right now getting the suite to a person
means sending them a folder and explaining how to open it. `ONBOARDING.md`
describes a tester build process, and `tools/build-client.py` generates a
stripped copy for testers, but that is still a manual hand-off. Hosting,
accounts, and phone sign-in are designed (`ARCHITECTURE.md`) and deliberately
parked, not cancelled.

---

## Part 3 — Build state, the four apps

### MOTHERBASE (the shared foundation + the home screen)

**What it is.** The foundation is nine shared files every app loads: the data
store, the "what is today" clock, the theme engine, the sound engine, the touch
layer, the dialog and settings components, backup and export, the icon set, and
a data-health check. The home screen is the hallway: a grid of widgets that
answer "is anything outstanding" and a dock of apps.

**State: working and mature.** As of the repo notes it is the most stable part
of the suite. There is a self-check harness (`_review.html`, target 163 checks)
that opens every app, confirms each one draws and its tabs work, and looks over
the data on the device. The home screen is fully on the shared foundation:
themed, phone tab bar, bottom sheets, draggable widget grid on desktop with a
rearrange mode on a phone.

**Home screen widgets that exist:** today (the whole day as one list, blocks and
todos merged), momentum, log, training, training volume, weight, protein,
calories, sleep, spend, todo, ideas, events, streaks, sticky note, clock,
timer, year progress, life progress, app dock.

**The data model, which is the actual asset.** Everything is stored as small
independent rows, never one big blob, with this shape:

```
{ id, user_id, type, date, key, payload, updated_at, deleted }
```

The newer write wins per row, deletes are tombstones so they travel, and
`user_id` is on every row from day one set to `local`. This is what makes a
future multi-device version possible without a rewrite. A predecessor
("SystemOS") synced one big JSON blob, hit conflicts, and lost data silently;
an earlier Excel life-OS captured about 30% of what it should have. The row
model is the lesson from both.

**Known foundation issues that matter (from `CLAUDE.md`, found not fixed):**

1. **The store can hang forever.** The database open call has no timeout. If the
   browser never answers, apps that wait for the store show a blank screen with
   no explanation. Watched happening on 2026-09-06.
2. **First paint should not wait on the store.** STATUS, TRAIN and ARC draw
   nothing until the store is ready, so a slow store is a blank screen. PORTION
   paints immediately and fills in late; the others should too.
3. **No `Rec.patch`.** Changing one field of a row means reading it, changing
   your bit, writing it back whole. Easy to get wrong. This already dropped a
   calcium value once (PORTION wrote it, STATUS's editor rebuilt the row without
   it).
4. **Cross-device merge is whole-row.** If a laptop and a phone edit different
   fields of the same row before they meet, the later write wins entirely.
   Only matters once hosting exists.
5. **Cache-busting is inconsistent** across apps. Harmless from a folder,
   matters the day hosting returns.

None of these block using the suite from a folder today. They are the list to
clear before it goes on the internet.

---

### STATUS — the daily tracker

**Function.** Record what happened to your body and your money today. Phone app,
used standing up, one-handed, several times a day.

**State: built and broad.** Built 2026-08-20 and tested in the browser at the
time. Since then a long run of commits has added a lot: a daily grade ("the
letter"), Sun and Main Quest, a REPORT screen with a Day tab, food logging with
labels and servings, spending with accounts, share-a-day, and export that goes
to the phone rather than a download.

**Screens (its bottom nav):** Today, Food, Money, Report. Money can be switched
off. It also owns a journal where you type one line per entry and a time in the
line ("Train 2:45") reaches the home screen's day log.

**What it owns in the data model:** every daily measurement. `note` (journal
lines), `field` (a tracked measure's definition), `ev` (one row per field per
day), `day`, `food` (shared shape with PORTION), `meal`, `spend`, `acct`,
`shot` (a shrunk photo of a label or receipt).

**Design rules it follows, which are the selling points:**

- **Never a form.** The moment logging a number feels like filling something in,
  capture rate falls. One tap to reach a measure, one to enter it, box already
  focused.
- **What's offered comes from what you actually log**, not a list someone wrote
  once. The dose chips are your last three.
- **Backfilling a past day is normal**, not an exception.
- **Forgive one missed day silently, act at two.** Streaks continue if you log
  anything at all, decoupled from hitting the goal. Freezes are automatic and
  spent silently, never offered as a choice at the moment of failure.
- **Never says what a behaviour did to a number.** States the behaviour, shows
  the number, lets you join them.

**Known issue:** its first paint waits on the store, so a slow database load is
a blank screen (foundation issue 2 above). The tone of its in-app copy has been
flagged as the worst in the suite and is being fixed with Tom line by line.

---

### TRAIN — the gym log

**Function.** Log sets at the gym, and know whether you are getting stronger.
Phone app, target device a Samsung Galaxy A10 (Tom's dedicated gym phone).

**The mission.** A faithful, deliberate 1:1 reproduction of FitNotes v25.1,
the app Tom has used for four and a half years and never abandoned (12,370 sets,
631 workout days, 4,297 set comments). Fidelity is the point: where FitNotes and
"nicer" disagree, FitNotes wins. It then shares the suite's brain and wears its
themes.

**State: core built, roughly half the screens missing.** From `train/CLAUDE.md`,
as of 2026-08-20 with some later additions (warmups, second muscle groups):

| Built | Not built yet |
|---|---|
| Workout day view (matches the FitNotes screenshots line for line) | Calendar |
| Exercise picker (categories, drill-down, search across 270) | Analysis and breakdown |
| Training: track a set, save/update, edit, complete, delete, comments | Records and the rep-max grid |
| History (newest first, pages) | Routines |
| Graph (max weight only) | Supersets, goals |
| The FitNotes backup importer (verified against his real file) | Plate calculator, custom barbells |
| Settings (shared panel + a TRAIN tab) | Rest timer, workout timer |
| | Copy/move workout, share |
| | App navigation drawer, first-run setup |

**The importer is the strong part.** It reads a real `.fitnotes` SQLite backup
with no library (walks the file format directly, because an importer that needs
the network breaks the one rule that matters most). It merges rather than
replaces, so importing twice changes nothing. It also takes CSV from Strong,
Hevy, JEFIT as a fallback. Verified against Tom's real 12,370-set file.

**Two known problems before he trains with it on the phone:**

1. The import blocks the screen for about 10 seconds on desktop as one
   synchronous freeze. On a Galaxy A10 that could be 30 seconds of frozen
   screen, which reads as a crash.
2. `health.js` warns above 4.2 MB of storage; his training data alone is
   4.16 MB. That threshold was measured wrong (20,000 rows / 19.5 MB wrote fine
   in Chrome) and lives in shared code, so it is not TRAIN's to change.

**The one honest weakness vs. FitNotes:** the rest timer cannot buzz in his
pocket, because a phone browser suspends a tab that is not on screen. It recovers
correctly ("you're 40 seconds over") rather than pretending. Fixing it properly
needs a small Android wrapper app, which is parked because it introduces a build
step.

---

### BLOCK — the day planner

**Function.** Build a day out of blocks, and see whether it held. Desktop app,
used sitting down with a mouse, planning a day or a week.

**State: working, actively edited in other sessions.** It publishes today's plan
as a shared row (`plan`) that anything can read, and it reads and writes shared
ticks, so a block ticked in BLOCK shows up in the habit view and on the home
screen.

**The structure, which is the whole idea:** blocks group into routines, routines
group into days, and that hierarchy is visible in the furniture, not just the
data. A day can be a repeating template or a one-off pinned to a date. A block
can be marked "not needed," which is neither done nor owed.

**What it ships on a fresh install:** a skeleton, not a plan. One routine
(Morning Routine: Brush Teeth, Weigh In, Track Data) and about ten loose blocks
in the bin. Small enough to clear in under a minute. This is deliberate and the
line is carefully drawn: it demonstrates the shape (blocks go in routines,
routines go in days) without telling anyone how to live. It will never ship a
prescribed day.

**What it owns:** `lane`, `item`, `routine`, and `plan` (today's published plan).

**Notes in BLOCK take links**, because a block is often a thing you do to a
document. (STATUS's journal deliberately does not take links: a journal line is
something you wrote, not somewhere you go.)

**Design instinct worth noting for content:** BLOCK's own advice already says to
shrink a block until it's almost too easy, attach it to something automatic, and
let it grow back. That is the scaffolding principle, and the repo notes say it
should spread across the suite: anything the app suggests should be one step from
where you are, never the finished version.

---

## Part 4 — What stands between this and an offer

Ranked by how much it matters to putting the suite in front of a paying member.

1. **No hosting.** Delivery today is "here is a folder." Designed and parked.
   Firebase was chosen for one narrow reason: it sends the login SMS itself, so
   there is no phone carrier paperwork.
2. **No accounts, no sync.** Every device is an island. A member with a phone
   and a laptop has two separate datasets. The row model is built to support
   sync later without a rewrite, but the sync itself does not exist.
3. **iPhone data loss.** iOS clears browser storage after 7 days of not opening
   the app, unless it's installed to the home screen. For a phone app this is
   serious. TRAIN sidesteps it by being Android-only; STATUS does not have that
   luxury.
4. **The store can hang on load** and apps that wait for it show a blank screen
   (foundation issues 1 and 2). Intermittent, watched on 2026-09-06.
5. **TRAIN is about half-built.** Fine for logging, but a member expecting
   FitNotes will notice the missing analysis, records, and routines.
6. **Commits are unpushed** and the GitHub repo is public. Nothing has shipped
   anywhere yet. (Repo note says push the main repo without asking; that is a
   separate action from deploying.)
7. **In-app copy tone** is inconsistent and being fixed with Tom directly,
   STATUS worst.

None of this is a dead end. It is a to-do list, and most of it (1, 2, 3) is one
decision: turn on hosting and accounts, which is already designed.

---

## Confidence assessment

**High** on what each app is for and how the data model works: the briefs are
detailed, current, and consistent with the code I read.

**Medium** on the exact build state of STATUS and BLOCK: the briefs' "current
state" tables are dated 2026-08-20 and there have been dozens of commits since.
The direction is right; a specific screen might be further along or have a bug I
didn't catch, because nothing was run for this update.

**High** on TRAIN's build state: `train/CLAUDE.md` has a screen-by-screen table
and the git history matches it.

**Low** on anything about pricing, tiers, or how members would actually be
charged: the repo says almost nothing about the business beyond "free tier and
paid all-access tier," so Part 2 is my framing and should be treated as a
starting point for your input, not a description of a decision.

## One concrete next action

Decide whether the next build effort goes into **shipping** (turn on the parked
hosting and accounts so the suite can reach a member's phone and survive there)
or **finishing TRAIN** (analysis, records, routines, so it fully replaces
FitNotes for you first). Those are the two forks. Everything else waits on which
one you pick.
