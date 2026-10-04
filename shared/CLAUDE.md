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
| `demo.js` | The DEMO's made-up person and its DEMO tab. The storage switch itself is the first thing in `skins.js`. Fetched only in the demo. | Low. It writes only inside the demo's own namespace. |
| `report.js` | Each device's own `device` row: when it was seen, live sync, app versions, its last errors. Fetched by `io.js`, which also catches boot errors until it lands. | Low. It writes one row per device. |
| `claude.js` | The CLAUDE panel, added 2026-10-04: a gold tab in Main Menu.exe only (the window injects it; without `chrome.webview` it returns). Ask about the rows, or log by talking. Hands claude.exe a slimmed copy of every row as files; applies Claude's writes here (Journal.add, Rec.set for new rows, Rec.patch for changes), each with Undo; ticks Training after sets like TRAIN.assertTick. Never writes `device`, `setting`, `skin`, pictures or `brief`. | Medium. It writes rows on what Claude says, each shown with Undo. |
| `boot.js` | The start screen on the home screen and the phone apps. | Low. Writes nothing but one sessionStorage flag. |
| `_smoke.html` | 414 checks over all of it. | Run it every time. |
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

**UPDATE NOW** (2026-09-30): the version line at the foot of every app's
Settings IS the button (Tom: "Make the version line the update button"),
`button.mb-version`, drawn as the plain line, `mb-tap` for the thumb.
`UI.update()` posts `{mb: 'refresh'}` to the worker, which fetches every kept
file again and answers how many changed (ETag, else Last-Modified, else
length); the top window then reopens with `?fresh=1` and says "Updated. N
files were newer." A worker too old to answer is given 20 seconds. Watched in
headless Chromium on QUESTS: old copy kept, one press, new copy running. The
Browser pane cannot register a worker at all, so test it with Playwright.

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
py -3 tools/serve.py 8811
```

No-store on every file, so no run is of a stale copy (2026-09-30: five
failures on an hour-old io.js and skins.js). Open it as `localhost`, not
`127.0.0.1`, when a service worker must register.

Then open `http://127.0.0.1:8811/shared/_smoke.html` in a browser and read the
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

- **A smoke check must never step back through history to tidy up.**
  Inside `_review.html` the smoke page is a frame, and a frame's history
  steps are the whole tab's, shared with every frame the review opened. The
  back stack check's `history.go(-3)` walked the review itself back a page
  once (2026-09-25). Push spare entries and leave them.
- **Nothing between a tap and a focus() may wait.** iOS raises the keyboard
  only for a focus made while the tap is still being handled. `Mobile.actions`
  ran its item 60ms late until 2026-09-30, so every menu item that opened a
  typing box (KITCHEN's Count, Change amount, any Rename) showed a caret and
  no keyboard on the iPhone. Items run inside the tap now, a `focus: true`
  sheet focuses as it opens, and `UI.focusSoon` already did. Two smoke checks
  read the focus at the end of the tap itself. Not yet watched on the iPhone.
- **A run that leaves the page mid-way leaves its test rows behind, and the
  fast-half check then fails.** `rec: a full fast half` moves the oldest-dated
  rows first and expects exactly its own two; leftover `smoke-<n>` rows dated
  1899 from an aborted run get counted too. Clear `mb.r.local|smoke-*` keys
  on that test origin and run again before suspecting `records.js`.

## `range.js` 0.3.1: the painting (2026-09-25, one picture 2026-09-26)

Tom, 2026-09-25: "I want my painting visualizer perfectly working, and
interchangeable", with three prints. 2026-09-26: "I dont want to have
blocks, sets, volumes, sessions all different in the visualizer. And trees
should be ON the mountains."

- **`Range.mount(box, data, height, opts)`**; `opts` is `{print,
  volume(kg) → text, onChange({print})}`. The caller keeps the print (TRAIN
  `train.rangePrint`, COACH `coach.rangePrint`) and writes it only on a
  switch. A `base` passed in is ignored; there is no BASE switch any more.
- **One picture holds all four**: a mountain per block, as wide as its dates
  and taller for more volume A WEEK (so its area is the work); a hill per
  month outside a block, scaled apart and at most six tenths as tall; a tree
  per session, taller for more sets; blossom a record. No weight in the
  whole history: mountains measure sets a week. The header states all four
  totals. Timeline at 5px a day at least.
- **Trees stand on the skyline** at their date (`skyline`), every second and
  third a tenth and a fifth of the way down the face, so a tree always
  stands on whatever is highest there and no mountain can hide one. Placed
  in `layout`, drawn after the ground. Block names are cartouches on the
  ground under their mountain. No decoration on a slope may look like a
  tree: FUJI's stippled pines and DUSK's canopy rounds were taken off.
  DUSK's black pines carry an orange glow, or they vanish on violet.
- **PRINT**: `PRINT.fuji`, `.ink`, `.dusk`, each the same layer list (sky,
  far, hill, block, mist, ground, tree, after). A new print is one more
  object; nothing else changes.
- **A block ends the day before the next starts** (`Range.blocksOf`), as in
  TRAIN. 0.1.x ran an open block to today over every later one.
- **Tiles of 1024px**, painted when near the screen and emptied when far,
  everything placed in whole-picture coordinates and seeded from them, so
  tiles meet without a seam. One canvas for a 4-year history at 3x was past
  what an iPhone allows [ASSUMED from its limits, never watched failing].
- **Opens on the latest session**, not on today, so a log that stopped
  weeks ago does not open on bare field.
- `tools/range-lab.html` draws all prints on made-up history, touching no
  store. **Not watched on the iPhone.**

## Live sync boundaries (2026-09-24, `cloud.js` 0.1.3)

A row stamped more than a day ahead (`soon()`) is never sent and never moves
`pushed` or `seen`; a stored boundary past it resets on read. A push carries
its edge from chunk to chunk. In a frame, `Cloud.state()` and `Cloud.sync()`
ask the top document, and the top starts when a frame signs in. Known cost:
the two leftover 2999 tombstones keep `Rec.newerThan` true, so every push
runs `Rec.export()`. Root Known traps has why.

## A row saved nowhere is not received (2026-09-30, `cloud.js` 0.2.1)

Tom's Chrome: localStorage full at 5.15M chars, every IndexedDB open on the
origin answering "Internal error" (its database was recreated empty on
2026-09-28), so arriving rows lived in memory only while `seen` moved past
them. Signed in, Live, and two weeks missing. `Rec.unkept()` and
`Rec.onUnkept(fn)` now count a row that reached neither half; the top
document's cloud.js then holds `seen` still, sets it back to the start, and
the row says to restart the browser. Two `rec:` smoke checks. A device that
lost rows EARLIER is healed by 0.2.2's daily check, below.

## A push never replaces a newer row (2026-09-30, `cloud.js` 0.2.2)

All 15,801 rows in Tom's Chrome matched the cloud's times after two weeks of
use elsewhere: a first push (`pushed` empty) sent every row, before the cloud
had answered, and a write replaces. Unproven that it happened; it cannot now.

- **Nothing goes up until `loaded`** (the listen's first `value`, which comes
  after every child event) **and `conn`**. A device with nothing pushed reads
  the whole cloud first. After a dropped connection it listens afresh.
- **`plan(rows, since, base, cloudAt)`** skips a row the cloud holds at the
  same time or newer (`had`); the boundary still passes it.
- **`redo`**: hearing the cloud hold an OLDER copy (`child_changed`) or a row
  leave the window from below (`child_removed`) sends ours again. That covers
  two devices racing on one row, and devices still on an older cloud.js.
- **The window starts `LOOK`, two days, before `seen`**: a row is stamped
  when written, so a phone's late push is older than a PC's `seen`.
- **The daily check** (`check`, 20h apart, and on Sync now): a shallow read of
  the cloud's ids against every id here. Lacking here: fetched, tombstones
  too; over 300 with a live one among them resets `seen`. Lacking there:
  `redo`. Ticks past the home screen's 800-day purge and `smoke*` types are
  left alone. The row says "Brought back N rows".
- **No database rule.** A refused row fails its whole 400-row write and would
  stall the boundary; string comparison in the rules was never watched.
- **Known cost:** Rewind (restore, replace) on a signed-in device gets back
  any row the cloud has that the backup lacks, within a day.
- **Fifteen `live sync:` checks** drive start, push, repair and the check
  through `Cloud._probe`, which now takes `store`, `keys`, `pushed`, `seen`
  and `checked` too, writes no setting, and puts everything back on
  `_probe(null)`. Each was watched failing. Not watched on a real database.

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

## Faster open (2026-09-30, the plan Tom picked on 24 Sep)

The Galaxy A10 is slow on every open. Measured on a store the size of his
(12,561 sets, 16,302 rows, 4.6M characters) in headless Chromium slowed 6x:
the home screen went from first paint 1.94 s and Rec.ready 3.33 s to 1.43 s
and 2.05 s once TRAIN had opened once; TRAIN's first paint 0.87 s to 0.47 s.

- **Every open is timed** (`Rec.timing()`): `paint` (the browser's first
  contentful paint), `fast`, `boot`, `ready`, `lazy`. DATA says "Opened in X s
  here" and each device's row carries `open.<app>`, so the A10's figure can
  be read on the PC.
- **report.js and cloud.js arrive after Rec.ready** (`io.js`, `afterOpen`),
  never while the first screen draws. DATA opened sooner fetches cloud.js at
  once (`IO.loadCloud`). `import.js` is fetched by the home screen only when
  a spreadsheet is brought in. The home screen asks for one app's file (a
  HEAD) when that app's frame is first made, not all fifteen on every open.
- **Sets are kept out of the open** (`records.js`, KEPT OUT; the root brief's
  data model has the rules). Rec.ready waits for a kept-out type only when
  something touched it before ready. `cloud.js` 0.2.3 starts nothing until
  `Rec.need()`; `io.js` backup, restore and the sheet sync call `needRows()`.
  Nine `rec:` smoke checks drive it in fresh frames: nothing read at boot,
  a first read starts the load, need brings all, the fast-half copy goes, a
  held patch keeps fields it never saw, an older merged copy loses, a held
  delete happens, and a boot-time read has sets by ready.

## No re-read on every write (2026-10-02)

Tom: "Opening the apps takes too long." Measured on a store his size (12,561
sets, 18,300 rows) in headless Chromium at 6x CPU. The big one: every local
write poked the parent and every frame, and each ran `Rec.reload()`, a full
re-read of both halves and of every set it held. The home screen's kernel
(`wrote`, in `index.html` and `block/index.html`) poked a second time.
One tick in STATUS with five apps open in home: 2.2 to 4.2 s of blocked main
thread before, 0.12 to 0.25 s after. BLOCK opened from home settled in 3.3 s
before (it writes on every redraw), 1.3 s after.

- **`channelOk()`**: on http(s) with BroadcastChannel, a write that carries
  rows does not poke; the channel already delivered them. A row-less
  announcement (`clear`, `repairDates`) still pokes, since only a re-read
  shows a wipe. `file://` pokes as before. `Rec.channel` exposes it; the
  kernel's `wrote` pokes only when it is false. The receiving side is
  unchanged, so an older cached sender still works.
- **`wins()`** answers "the same write, read back" from the `serial`
  snapshot with one `JSON.stringify` before falling back to `canon`. Every
  open meets each row twice; canon cost about 200 ms of each open at 6x.
- **`Day.label` / `Day.short`** keep one `Intl.DateTimeFormat` per option
  set. `toLocaleDateString` built a new one per call: 500 ms of LOG's open.
  A time-only ask gets the date added, exactly as `toLocaleDateString` does.
- **`sound.js`** builds the audio context and its reverb on idle after a
  fresh open, not on `pageshow`; a page back from the bfcache wakes at once.
- Measured and ruled out: no signal and a 2 s, 50 kbps line open as fast as
  full signal (`sw.js` answers from the phone first); V8 compiles the shared
  files off the main thread, so code caching is not worth chasing; a cached
  `Intl.Collator` sorts no faster than `localeCompare` in `Rec.all`.
- Three smoke checks. The poke one was watched failing on the old file.

## Pictures: frames, word colours and fonts (2026-10-02, `io.js`)

From a TRAIN session, Tom's "beautiful export option for train", a frame for
IG stories with nothing in the middle. Additive; no caller changed.

- **`IO.share({frame})`**: an app that hands in `frame(o)` gets LAYOUT Frame
  or Card on the panel (`shareLayout`, Frame first). `o.style` is the style
  id. Size is hidden for a frame. The node is never given `.mb-glass`; a
  frame tints its own panels.
- **`IO.frameShot(node, {edges})`**: lays the node out at `frameSize()`
  (390 by 693.3) and pictures it as the whole 1080 x 1920 story. It hands the
  node `IO.STORY.frame`'s insets (180 top, 220 bottom, 72 sides: what a
  posted story covers, tighter than a card's `safe`, Tom: "You're not
  maximizing the full verticality") as `--story-t`, `--story-b`, `--story-x`, so
  the app's CSS stays free of raw sizes. `edges` darkens the top, bottom and
  right edges and never the middle (`IO.shot`'s `edges`). `IO.share` no
  longer asks for it: TRAIN's frame draws its own fades in the theme's
  colours, because black edges sat under a light theme's dark words.
- **Every word in every picture came out in the body's text colour**, the
  card's green gains and gold block line included. The wrapper copied the
  body's computed styles, and `-webkit-text-fill-color` (with the other three
  "the text colour" properties) comes back written out and is inherited. They
  are no longer copied. Pictures from STATUS and TRAIN change colour.
- **Fonts go into the picture** (`IO._faces`): an SVG drawn as an image can
  fetch nothing, so every picture was in the device's plain font. The
  `@font-face` rules for the families the node uses are written in with their
  files as data. The suite's own fonts come from the phone's copy, offline
  too. A Google font (Block's IBM Plex Sans) needs signal and falls back as
  before without it; this sandbox has none, so that half is unwatched.
  Capped at `FACE_WAIT`, 2.5 s.
- Three smoke checks: a word keeps its colour (watched failing on the old
  file, 0 accent pixels to 630), a frame is the whole story with the middle
  empty and nothing under the reply box, and the panel offers Frame only to
  an app that gives one.

## The demo's storage switch (2026-09-30)

At the top of `skins.js`, so it runs before any file reads storage. With the
tab's `mb.demo` flag set: `window.localStorage` is replaced (a Proxy: every
key, rows too, in the TAB's sessionStorage under `mbdemo:`), the store's
own database `motherbase` refuses to open so `records.js` runs on the fast
half alone, every other `indexedDB.open` and `deleteDatabase` is prefixed
`mbdemo:`, `BroadcastChannel` names are prefixed, and a `storage` listener
hears only `mbdemo:` keys, translated back. `g.MB_DEMO` is set; `io.js`
reads it (`DEMO`). Leaving sets `mb.demo.wipe` in the real storage, and the
next load, holding nothing open, deletes every `mbdemo:` key and database;
any load outside the demo clears the tab's `mbdemo:` keys.

**Why the tab and not IndexedDB** (the same day): the first version kept
rows in page memory and waited for IndexedDB before reloading onto them.
In WebKit that save took 6 seconds on one run and never finished on
another, so the iPhone sat on "Filling in a made-up person"; in a Chrome
whose IndexedDB errors or whose localStorage is full the rows never
survived the reload and it filled and reloaded forever. sessionStorage has
5.2M characters of its own in both engines (measured), the demo is 1.7M,
the tab's frames share it, and it goes with the tab. `demo.js` fills at
most once per tab per day (`mb.demo.tried`); a page back unfilled says so
and stays. A row over 64KB, a photo, lasts until reload in the demo.
Watched in WebKit and Chromium, clean, with IndexedDB erroring and with
localStorage full: filled in 0.4 to 2 s, TRAIN shows all 1,041 sets, LEAVE
DEMO pressed leaves no `mbdemo:` key. Four `demo:` smoke checks; the
fourth opens a second demo page and must find the first page's row at
once with no IndexedDB behind it, and was watched failing on the old file.

## Why the sign-in goes (2026-10-01, `cloud.js` 0.2.4, `report.js`)

Tom: "Why am I getting logged out so much?" The Google sign-in lives in the
site's own storage beside the rows, so anything that empties one empties the
other. Evidence: two "PC, Chrome" device rows in the 2026-10-01 nightly
backup, so Chrome's storage for the site was emptied at least once (the
device id lives in localStorage). Two causes, still not told apart:

- **The browser clears it.** Nothing ever called `navigator.storage.persist()`,
  so Chrome and Safari treated the site's storage as theirs to evict.
  `report.js` now asks once per open from the top page (not Firefox, which
  prompts), and writes `disk: 'kept'` or `'can be cleared'` on the device row.
  The Browser pane answered "can be cleared": Chrome grants it to an
  installed app or a site with engagement, not on request alone.
- **No lasting storage answered.** With IndexedDB erroring and localStorage
  full (Tom's Chrome, 2026-09-30), Firebase keeps the sign-in in
  sessionStorage, which ends with the tab. `Cloud.state()` now hands out
  `kept`, `lostKept` and `authErr`, and the device row carries them as
  `auth`. `SESSION` in `kept` is this cause.

Read every device's `disk` and `auth` in the nightly backup before guessing.

## The start screen (2026-10-04, `boot.js`)

Tom: "a sort of cool startup animation when we're opening up the app",
"game start load screen initializing system vibes", and the rule over all
of it: "it should only hide the load time, never cause delay". The home
screen and the phone apps (the roster's `phone` flag) only.

- **Opt in with one tag, in the head, straight after `skins.js`.** Later and
  it shows after the page it is meant to hide. A smoke check reads every
  opted-in page's head for it; a new phone app adds the tag and its folder
  to that check's list.
- **When:** the first page a tab or installed app opens, top document only;
  sessionStorage `mb.boot` remembers. A reload, a frame, or an app opened
  from the home screen gets nothing. `?boot=1` forces it (in a frame too,
  which is how the smoke opens it); `?boot=0` never.
- **How long:** four stages, each lit when true, never on a timer: PAGE
  (parsed), THEME (`Skins.current`), STORE (`Rec.hydrated`; the home screen
  draws nothing before it), DRAWN (one frame after the three). Hooked on
  `DOMContentLoaded` and `Rec.ready`, a 40ms timer as the floor. Measured at
  6x CPU on all nine pages: the screen leaves 20 to 40ms after the last
  stage, which is the frame the page paints in anyway. A page whose
  `Rec.ready` work blocks the thread (STATUS, about 550ms at 6x) holds it
  for that long because nothing could paint sooner. Four seconds is the cap,
  and then it says which stage it was waiting on. A tap or a key ends it;
  the exit runs with pointer events off, so the app takes a tap at once.
- **Every line is a fact:** the build is `mb-version`, the store line is
  `Rec.timing().ready`. No fake progress.
- **Before a theme lands there are no tokens.** Every `var()` carries the
  scale's own value and a system colour (`Canvas`, `GrayText`), never a hex;
  the accent falls back to grey, so the window lights up in the theme's
  colour the moment the THEME line prints.
- **Every class is `mbb-`.** It sits over app CSS, and TRAIN's own `.seg`
  and `.n` restyled the bar when it used short names.
- **A quote inside the CSS string breaks the file.** The CSS is single-quoted
  JS; a font name goes in double quotes. One edit broke it and the smoke's
  "clears itself" check caught it.
- **Never in the way, whatever breaks** (the same day, before it went to
  clients). Until then, a throw between the screen going on and its timer
  starting left it over the app for good, and the cap could not help: the
  cap lives in that timer. Now `kill()` is armed first, a hard stop at the
  cap plus 1.5 s calls it whatever else happens, and a catch around the
  rest, `poll` and the exit calls it on any throw (`Boot.why` `'error'`,
  `Boot.err` the message). `?boot=fail` and `?boot=hang` drive both in two
  smoke checks, which were watched failing with the net taken out.
- Watched in Chromium only. Not run in WebKit (no WebKit build in the cloud
  session it was made in) and not on the iPhone.

## History

`HISTORY.md`, beside this file, holds the debt list, the numbered foundation
findings other briefs cite as "foundation item N", and the app icon rework.
Read it when working in that corner; add build stories there, not here.
