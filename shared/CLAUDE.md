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
| `journal.js` | One journal line: kinds, the day it shows on, typed times, ticking and repeats. Read by STATUS, LOG, QUESTS and the home screen. | High. It writes STATUS's `note` rows. |
| `skins.js` `skins.json` | Themes, and the colour layer on top. | Medium. Cosmetic but wide. |
| `mobile.js` | The touch layer: sheets, swipes, keyboard, back stack, haptics, safe areas. | Medium. Every app's feel. |
| `sound.js` | Sound themes and instruments, synthesised. | Low. |
| `ui.js` | Snackbars, dialogs, menus, switches, the Settings panel. **Build app screens out of these, never a private copy of them.** | Medium. |
| `icons.js` | The icon master set: ~55 drawings carrying ~160 buttons, plus the packs. | Medium. Every button in the suite. |
| `io.js` | Backup, restore, spreadsheet export, and the Share picture panel (`IO.share`). | High. It is the safety net. |
| `chart.js` | Every chart in the suite. Axes, a readable scale, and marks. **Draw a chart with this, never by hand.** | Medium. |
| `import.js` | Bringing in an outside spreadsheet by shape: ticks, weigh-ins, foods, money out. | High. It writes rows many apps own. |
| `health.js` | Answers "is my data okay". | Low. |
| `_smoke.html` | 312 checks over all of it. | Run it every time. |
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

## History, moved from the root brief on 2026-09-22

What was built and watched, newest last. Moved here verbatim so the root brief
stays small enough for per-module sessions.

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
