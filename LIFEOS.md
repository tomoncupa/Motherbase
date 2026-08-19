# LIFEOS — how the apps live together

One folder, one origin, one shared brain, **entirely local**. `lifeos.html` is the
home screen and the data authority; the apps are the same single-file apps as
before, each still openable on its own.

```
index.html        home screen (widget grid) + app dock + the shared data authority
shared/           the foundation every app loads — see HOWTO.md
block/index.html  routine builder        (publishes today's plan, reads/writes ticks)
habits/index.html habit tracker          (reads/writes the same ticks)
arc/index.html    mind canvas            (standalone — no shared data yet)
form/index.html   lift review            (standalone by design)
_template/        the starter app you copy to make a new one
```

One folder per app, as of 2026-08-20. Adding an app or a theme is written up in
[HOWTO.md](HOWTO.md).

Nothing leaves the machine. No account, no server, no sync. The backend plan in
`ARCHITECTURE.md` is parked, not cancelled — nothing here blocks it later.

## The kernel

Every data-sharing app carries an identical block between the sentinels
`LIFEOS KERNEL v1` … `END LIFEOS KERNEL`. **The copy in `index.html` is canonical.**
Edit it there, then re-run the sync script, which copies it into the others verbatim
and asserts all copies are identical.

The kernel picks its mode at load and the app never knows which one it got:

- **hosted** — running in an iframe inside `index.html`. Every mutation is a
  `postMessage` to the shell, so the shell is the only writer and nothing races.
  This is also why it works from `file://`, where frames cannot touch each other's
  DOM but `postMessage` still flows.
- **solo** — opened on its own. It owns `localStorage['lifeos_v1']` directly and
  gossips to other tabs over `BroadcastChannel('lifeos')`.

The shell adds durability on top: IndexedDB `lifeos` / store `kv` / key `doc`, same
doctrine as ARC — the synchronous localStorage copy loads first, IndexedDB swaps in
if its `ts` is newer.

### The shared doc

```js
{ v:1, ts,
  activities: { [actId]: {id, name, cat, dur, color, energy} },   // the vocabulary
  habits:     { [id]: {id, actId, name, color, cadence, ord, archived} },
  log:        { 'YYYY-MM-DD': { [actId]: {ts, src, habitId, note} } },   // what got done
  today:      { date, vid, name, blocks:[{id, actId, name, s, dur, color, lane}] } }
```

Apps keep their private state where it was (`block_v1`, ARC's IndexedDB, view prefs).
Only what must be shared lives in the doc, and it is small enough to broadcast whole
— no diffing, no merge rules.

### The identity rule

**Things are the same thing when their names slug the same.** `'Cold shower'` in
BLOCK and a habit called `Cold shower` are both `cold-shower`, which is what makes a
tick in one place a tick in the other. Two consequences, both accepted on purpose:
two blocks with the same name share one tick, and renaming a thing starts its history
over. (`ARCHITECTURE.md` proposes permanent IDs to fix the rename problem if this ever
becomes worth the work.)

### Conflicts: whoever saved later wins

Every write stamps `ts` and lands on one cell — one activity, one date. The last
write to that cell is the truth, and because a tick is a boolean, two apps writing
"done" is agreement, not conflict. There is no merge step and nothing to resolve by
hand. Undo is a write too (it removes the cell), so unticking after ticking behaves
the way you would expect.

### API

```js
LifeOS.ready(fn) / LifeOS.on(fn)          // boot, then every change from anywhere
LifeOS.doc()                              // the shared doc
LifeOS.day(d) / LifeOS.shift(date,n) / LifeOS.slug(name)
LifeOS.acts([{name,cat,dur,color,energy}])
LifeOS.done(actId, date, on, {src, habitId})   // the one tick, everywhere
LifeOS.isDone(actId, date) / LifeOS.dayLog(date)
LifeOS.habit(h) / LifeOS.habitDel(id)
LifeOS.publishToday({date, vid, name, blocks})
LifeOS.streak(actId, cadence) / LifeOS.count(actId, days)
```

Mutations return promises (hosted mode round-trips to the shell). Every mutation from
anywhere fires `on` in every app in every tab.

## The home screen

A grid of widgets, each one a pure function of the shared doc.

- **Move** — drag a widget by its title bar onto another one; they swap.
- **Resize** — drag the bottom-right corner. Width snaps to the 12-column grid,
  height to 84px rows.
- **Add / remove** — `+ WIDGET` to add (duplicates allowed), the `✕` on a card to
  remove it. `Reset to the default layout` is in the same menu.
- Widgets available: `today`, `habits`, `momentum`, `streaks`, `log`, `stats`, `apps`.

Layout lives in `localStorage['lifeos_layout_v1']` — **device preference, not data.**
Rearranging the home screen changes nothing any other app can see, and a backup
restores your data whatever your layout is.

**Adding a widget type** is one entry in the `WIDGETS` table in `lifeos.html`:
a name, a default width/height, an optional `sub()` for the right-hand caption, and
`draw(body, cfg)`. The grid handles everything else.

## Backup and export — the `DATA` button

Everything is local, so a backup is the only safety net that exists. The button turns
amber with a ⚠ once a backup is 14 days old, or if you have never made one.

**Restorable:**
- **Back up everything** — one JSON file: the shared doc plus every app's own
  localStorage. This is the one that can be restored.
- **Restore from a backup** — replaces everything on this device, then reloads.

**Readable (exports, not restorable):**
- **Tick log as CSV** — `date, activity, activity_id, category, logged_at, source`.
- **Habits as CSV** — cadence, current streak, 30-day count.
- **Activities as CSV** — the shared vocabulary.
- **Copy today as text** — today's routine with its ticks, for pasting into a message.

**Delete everything on this device** is also there, behind two confirmations.

> ARC's own data lives in ARC's IndexedDB and is **not** in the LifeOS backup — use
> ARC's own workspace backup for that. Everything else (LifeOS doc, BLOCK, habit
> views) is covered.

## Wiring, per app

**BLOCK** owns the schedule; LifeOS owns what got done. Three wires, at the bottom of
its script under `LifeOS bridge`:

- `pushLib()` — its library and every block name becomes shared `activities`, so
  HABITS can promote any of it with one click.
- `toggleDone()` — writes `LifeOS.done(...)`; `pullDone()` writes the log back onto
  `it.done`. Ticks are not BLOCK's to keep.
- `publishToday()` — today's blocks with computed start times, for the home screen.

Completing the whole routine no longer wipes the ticks after the celebration — they
are the day's record. Rollover to a new day clears them, then restores anything
already logged for today.

**HABITS** owns nothing. Habits, ticks and vocabulary all live in the doc, which is
why promoting an activity to a habit inherits its history immediately.

**ARC** and **FORM REVIEW** are hosted but do not share data. They need no changes.

## Adding an app

1. One entry in `APPS` in `index.html` (`id, nm, ic, file, ds`, plus `shares` or `solo`).
2. If it shares data, paste the kernel block in and call the API.
3. Nothing else in the shell knows any app's name.

## Known limits

- **The doc is one blob, and the Motherbase brief forbids that.** `Claude.md` in this
  repo names it as how SystemOS died: one large JSON blob, last-write-wins, silent
  data loss across devices. On one device with no sync there is nothing to lose to,
  so this is safe *today* — but it must be converted to the brief's row model
  (`{id, user_id, type, date, key, payload, updated_at, deleted}` in
  `/shared/records.js`) before anything ever syncs. The tick log is already one cell
  per activity per day, so the conversion is mostly mechanical.
- **The kernel is copied into three files** and kept in step by a script. The repo
  already loads `shared/skins.js` with a plain `<script src>`, which works from
  `file://` too — so the copies could become one shared file and the script could go.
- **Each app carries its own theme CSS**, which `shared/skins.json` says they should
  not: "Every app reads this file. Apps add no theme CSS of their own."
- Same-origin only: the apps must sit in the same folder.
- The doc is broadcast whole. Fine at a few years of log; revisit past ~1MB.
- `file://` works, but browsers treat file-origin storage differently — serving the
  folder is the reliable path.
- One machine, one browser. Backups are how data moves anywhere else.
