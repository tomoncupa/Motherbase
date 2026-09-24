# SHARED — the foundation (CLAUDE.md)

Governs `shared/` only. The repo-root `CLAUDE.md` governs everything else and
still applies here.

**Every app depends on these files.** A mistake in an app breaks one app. A
mistake here breaks all of them and can lose data. Work slowly.

`THEMING.md`, next to this file, is the contract between STYLE and every app:
every token, what an app may never do, and how to prove it obeyed. It is
binding on the apps rather than on this folder, but change a token name in here
and you have changed that contract for all of them — so read it first.

`STANDARDS.md`, next to this file, is the house style for how the apps feel. It
is binding the same way this file is, and it is written for Tom rather than for
you — read it before changing anything anybody touches. **It binds `train/`,
the phone app, and `status/`, `quest/` and `checkin/`, which are for
everywhere.** Everything else in the suite is a desktop app, and `arc/`,
`block/` and `style/` are desktop only. Set by Tom on 2026-08-22 and
2026-09-14; the top of `STANDARDS.md` says so.

## The one-session rule

Only one conversation touches this folder at a time, and it does not touch
anything else. App conversations read these files and never edit them. If you find
uncommitted changes in here that you did not make, stop and say so.

After any change in this folder, tell Tom to restart his app conversations. They
are holding a stale copy of whatever you just changed.

## What each file is for

| File | Job | Care level |
|---|---|---|
| `records.js` | The store. Rows, merge, subscriptions. | Highest. Holds his history. |
| `day.js` | One definition of "today" for the whole suite. | High. Everything dates through it. |
| `journal.js` | One journal line: kinds, the day it shows on, typed times, ticking and repeats. Read by STATUS, LOG, QUESTS and the home screen. Since 2026-09-24 `dedupe()` deletes extra copies of a made-once todo (`wealth-bill-*`, `arc-r-*`) found on more than one date, keeping a ticked one else the earliest; runs on `Rec.ready` and at most once a minute from `notes()`, so a device that never opens WEALTH is cleaned too. | High. It writes STATUS's `note` rows. |
| `skins.js` `skins.json` | Themes, and the colour layer on top. | Medium. Cosmetic but wide. |
| `mobile.js` | The touch layer: sheets, swipes, keyboard, back stack, haptics, safe areas. | Medium. Every app's feel. |
| `sound.js` | Sound themes and instruments, synthesised. | Low. |
| `ui.js` | Snackbars, dialogs, menus, switches, the Settings panel. **Build app screens out of these, never a private copy of them.** | Medium. |
| `icons.js` | The icon master set: ~55 drawings carrying ~160 buttons, plus the packs. | Medium. Every button in the suite. |
| `io.js` | Backup, restore, spreadsheet export, and the Share picture panel (`IO.share`). | High. It is the safety net. |
| `chart.js` | Every chart in the suite. Axes, a readable scale, and marks. **Draw a chart with this, never by hand.** | Medium. |
| `import.js` | Bringing in an outside spreadsheet by shape: ticks, weigh-ins, foods, money out. | High. It writes rows many apps own. |
| `health.js` | Answers "is my data okay". | Low. |
| `_smoke.html` | 343 checks over all of it. | Run it every time. |
| `THEMING.md` | The contract the apps obey. Changing a token name changes it. | Read before renaming anything. |

## Rules

1. **Never break the API an app already calls.** Add, do not rename. Every app
   in the suite is calling into these.
2. **`records.js` is append-thinking.** Rows are addressable and merge by
   `updated_at`. Any change that makes state whole-document again is wrong,
   whatever it saves in code.
3. **Plain `<script src>` only.** No modules, no imports, no build step. It has to
   work opened from a folder.
4. **Every colour is a token.** No hex in `ui.js`, ever. Use the skin tokens with a
   fallback so the file works before a skin is applied.
5. **`_smoke.html` must pass before you commit.** Add checks when you add
   behaviour; the count only goes up. Run it in a window with a real height —
   several checks measure geometry, and a zero-height pane reports a false
   failure on the sheet check.
5a. **A chart is drawn with `chart.js`, not by hand.** Added 2026-09-06 after
   a survey found 22 charts across four apps, four of them working out their own
   scale in four different ways, and exactly one app drawing a gridline. A
   hand-rolled chart gets no axis unless somebody remembers to write one, and
   the same three bugs kept being fixed separately: a scale landing on 197 and
   203, a drawing that grows taller as its box grows wider until it pushes
   everything else out, and a "time axis" that is the first date and the last.
   Since 2026-09-14 every chart in the suite is drawn with it, and it does
   more than axes. Tom: "Graphs must be useful and feel cool, they must convey
   data quick." So a chart leads with `Chart.header` (the number and what
   changed, in words), draws at its box's real size through `Chart.mount`,
   marks its latest value with `c.end`, lights one bar and quietens the rest,
   and lets a finger or mouse drag across it with `c.scrub`. Part of a whole
   is `Chart.pie` (every slice keyed, six at most, pointing says a slice) or
   `Chart.shares`, ranked bars. Two scales on one plot is two charts.
5b. **An app screen is built out of `ui.js`, not beside it.** `UI.row`,
   `UI.field`, `UI.toggle`, `UI.segmented` and the `.mb-group`, `.mb-swatch`,
   `.mb-opt` classes. A private copy of a component inherits nothing: not the
   current theme, not the next fix. STYLE was built the wrong way round once and
   had to be rebuilt.
6. **`mobile.js` loads before `ui.js`.** It owns the sheet, the button and the
   press states; `ui.js` checks whether it is there and falls back to the old
   desktop dialog if it is not. Two definitions of the same class is how one of
   them silently wins.
7. **The kernel is copied into three apps.** Edit the copy in the root
   `index.html`, then run the sync script, which asserts all copies are identical.
   Never hand-edit a copy.

## The coach shelf in `cloud.js` (2026-09-23)

Added from a COACH session, which the one-session rule above would normally
forbid; Tom asked for it in that session and it is one commit, so it reverts
alone. `CLOUD.md` is the long version.

`Cloud.send`, `Cloud.waiting`, `Cloud.took` and `Cloud.who`. One shelf,
`drop/coach`, where a client leaves a parcel and Tom's COACH takes it. Three
things about it that are load-bearing:

- **The database enforces it, not this file.** The rules let a signed-in person
  write to `drop/coach/<their own uid>` and nowhere else, and let only the
  coach read or clear the shelf. Nothing here is a security check and nothing
  here should start pretending to be one.
- **These four work in a FRAME**, which the row sync deliberately does not: the
  sync holds one socket per document, and this holds none. It is one read or
  one write on a button press, through `account()`, and then it is over.
- **A parcel is not a row.** It never goes through `Rec.merge` on the way up
  and the shelf is not a place data lives. The app that takes it turns it into
  rows and clears it.

**Untested against a real database.** Nobody has signed in. Fifteen `shelf:`
checks in `_smoke.html` (2026-09-23) drive the real `send`, `waiting` and
`took` against a database held in the page, through `Cloud._probe`, which
swaps only the account the shelf asks for. They were watched failing with the
sort reversed. They also cover the 2MB cap at its exact edge, reading never
clearing, `who`, and all four run in a frame holding nothing but cloud.js.
What they cannot prove is the rules; only a real sign-in does.

## Fresh copies (2026-09-23)

Tom's phone kept the old app icons, so there are two changes to `sw.js`. An icon
picture (`shared/icons/*.png`) is always fetched from the network first: iOS
asks for it only when a shortcut is saved, so the phone's copy only ever
handed back the old picture. And `?fresh=1` on a page address makes the next
20 seconds network first; the home screen's LINKS widget puts it on every
address it hands out, and `mobile.js` takes it off the address bar so a saved
shortcut is the plain address. The icon link's address ends in `?t=<ms>`,
new every load, because iOS keeps an icon by its address. Watched with a file
changed on disk between fetches: an ordinary open got the old copy, an icon
and a fresh open got the new one, and the kept copies had no `?t` or `?fresh`
in their addresses. Not yet watched on the iPhone.

## `creatures.js` 0.2.0: dot art, all 151 (2026-09-23)

Tom pointed at a page of bead patterns and said to pull the Pokémon from it.
The ten hand-drawn ones are gone; every Pokémon of the first generation is
here as pixel art, read off those grids cell by cell in the browser.

- **The API did not change.** `draw`, `canvas`, `name`, `keys`, `pick` and
  `list` all keep their shapes, so CHECK IN and COACH were not edited. They
  are the only two files that load this.
- **A sprite is two strings**, its own palette and a run-length picture. One
  shared colour table was tried and thrown away: 921 distinct colours across
  the 151, and squashing them small enough to index with a single letter
  flattened the shading that tells one orange Pokémon from another.
- **82KB, and only those two apps pay it.** Worth checking before adding a
  second generation.
- **Smoothing off is the whole trick.** Each sprite is painted once at one
  pixel per cell and kept, then blown up with `imageSmoothingEnabled` false.
  Turn that on and it is a blurry mess at every size.
- **Old keys still work.** The keys are the English names, so `pikachu`,
  `eevee` and the rest that rows already carry are the same Pokémon, and
  LEGACY still maps an old animal pick.

## Install files (2026-09-23)

Every app folder has `manifest.json` and `icon-192.png`, `icon-512.png`,
`icon-maskable-192.png` and `icon-maskable-512.png`; the home screen's are at
the root. `tools/make-icons.html?port=<n>` with `py -3 tools/save-icons.py <n>`
draws them all with the iPhone pictures (8920 is often taken by a dev server).
A maskable window is 64% of the square, so its cut corners sit inside
Android's 80% circle. Five `install:` smoke checks read the app list from
`Icons.ROLES`, so a new app is checked without editing them. The offline
cache serves a stale `index.html` for one open, so run them with the service
worker cleared or the page can look unlinked.

## Testing

```
py -3 -m http.server 8777 -d "C:\Users\user\Downloads\Motherbase"
```

Then open `http://127.0.0.1:8777/shared/_smoke.html` in a browser and read the
result. Drive the real apps too: a green smoke test does not prove the apps still
work. Clean up any test data you write, and stop the server when you are done.

`node` is not installed here. Do not reach for it.

## Where the bodies are buried

- A literal closing script tag inside inline code ends the script element, even
  inside a comment. It has already silently truncated three apps.
- Anything flagged `custom` passed to `Skins.apply` is persisted, so a live preview
  must not be flagged custom.
- An app that computes its own "today" will disagree with `day.js` between midnight
  and the day-start hour. BLOCK did exactly that.
- `localStorage` is roughly 5MB. `health.js` warns at 3MB. Rows are small but the
  tick log only grows.
- **An animation that starts on `requestAnimationFrame` never starts in a tab
  that is not compositing.** A sheet opened that way stayed parked off the
  bottom of the screen with no way back. Force the layout with `offsetHeight`
  and set the class in the same tick instead.
- **A row key built from the clock alone is not unique.** Two rows created in
  the same millisecond derive the same row id, and the second silently replaces
  the first. Add a counter.
- **`Icons.svg()` takes a ROLE, not a drawing name.** `gear` is a drawing; the
  button is `settings`. Passing a drawing name returns an empty string rather
  than throwing, so it looks like nothing happened.
- **`UI.confirm` is `(question, detail, opts)` and returns a promise.** Calling
  it with an options object renders `[object Object]` and never runs the action.
- **The browser caches a changed shared file hard.** Every test this session
  needed a new port. Apps carry `?v=N` on their script tags; bump it when you
  change something here, or the app will not see it.
- **The sheet mirror's settings merge on save, so a deleted key comes back.**
  `IO.mirror.set` writes through `msave`, which merges `pushed`, `seen` and
  the other boundary maps with what is on disk. Deleting a key from `seen`
  does nothing; set it to `''` instead. A smoke check that deleted its own
  mark passed once per device and failed every run after (2026-09-15).
- **A mirror check has to put the mirror back, and two of them read marks they
  never set.** Found 2026-09-23. `mirror: a link that has NEVER answered is the
  user's problem` and `mirror: an emptied push stamp is not proof the sheet ever
  answered` both ask what the app says when a link has never worked, and
  `neverAnswered()` answers off two marks: `sheetV`, and any per-app push stamp.
  Neither check cleared the stamps, and a check further up the file pushes as
  `status` and leaves a real one behind, so the answer depended on the run
  order. Served on a port that had never been used they failed, 326 of 328,
  with io.js correct; on a port with prior history they passed. They clear
  every mark themselves now.

  The second half is worse and was found on the way. Every teardown in that
  section wrote `url: ''`, which on a real device is the sync link Tom pasted,
  and `_review.html` runs this file — so a review silently unlinked his sheet
  on that device. Watched both ways: with the old file a pasted link was gone
  after one run; with the new one the link, the `sheetV` and a real `status`
  stamp all survive. `mirrorSnap`, `mirrorBlank` and `mirrorPut` sit at the top
  of the mirror section, and `mirrorPut(MIRROR_WAS)` closes it. Use them for
  anything new in there.

## Live sync boundaries (2026-09-24, `cloud.js` 0.1.3)

A row stamped more than a day ahead (`soon()`) is never sent and never moves
`pushed` or `seen`; a stored boundary past it resets on read. A push carries
its edge from chunk to chunk. In a frame, `Cloud.state()` and `Cloud.sync()`
ask the top document, and the top starts when a frame signs in. Known cost:
the two leftover 2999 tombstones keep `Rec.newerThan` true, so every push
runs `Rec.export()`. Root Known traps has why.

## What the LIVE SYNC row may claim (2026-09-24, `cloud.js` 0.1.4)

Tom: "overall the diagnostic feedback has been innacurate." Both desktop
programs sat signed out by Google for seven hours under a row saying Live.
Now `state().conn` (Firebase's `.info/connected`) is the only thing that
earns "Live as", a cancelled listener clears `live`, a lasting
`onAuthStateChanged` notices a sign-out mid-session (`out`, `lost`), and
"last synced" is `sentAt`/`gotAt`, moved only by a write that landed or a row
that arrived. `Cloud.sync()` resolves with the row count and rejects with the
reason. Untested: a sign-out while the page is open (needs a real account).
Why Google dropped the desktop sign-in is still unknown.

## A full fast half (2026-09-24, `records.js`)

Main Menu.exe could not sign in to Google: "web storage must be enabled".
Its localStorage held 17,672 rows, 5.8M chars, 4M of them TRAIN sets, and
no key could be written. Firebase tests a write before it opens a sign-in.
Once IndexedDB answers, `trimFast` now brings the fast half back to 3M chars
once it is past 3.5M: oldest-dated rows first, never undated rows or
settings, and only rows IndexedDB holds at the same or a newer time. One
`rec:` smoke check covers it. **IndexedDB was NOT "written always"**: on
that PC it held 65 rows against 17,655 in localStorage, because rows from
before it existed never went in. `makeRoom` copies every missing row in and
waits for the transaction to complete before anything is trimmed.

## History

`HISTORY.md`, beside this file, holds the debt list, the numbered foundation
findings other briefs cite as "foundation item N", and the app icon rework.
Read it when working in that corner; add build stories there, not here.
