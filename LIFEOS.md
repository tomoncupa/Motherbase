# LIFEOS — how the apps live together

One folder, one origin, one shared brain. `lifeos.html` is the home page and the
data authority; the apps are the same single-file apps as before, each still
openable on its own.

```
lifeos.html       home screen + app dock + the shared data authority
arc.html          mind canvas            (standalone — no shared data yet)
block.html        routine builder        (publishes today's plan, reads/writes ticks)
habits.html       habit tracker          (reads/writes the same ticks)
form-review.html  lift review            (standalone by design)
```

Deploy exactly as before: copy the folder to `tomoncupa.github.io`. No build step,
no dependencies beyond Google Fonts. Open `lifeos.html` and everything is inside it.

## The kernel

Every data-sharing app carries an identical ~180-line block between the sentinels
`LIFEOS KERNEL v1` … `END LIFEOS KERNEL`. **The copy in `lifeos.html` is canonical.**
Edit it there and re-run the splice (it copies the block into the others verbatim
and asserts all copies are identical).

The kernel picks its mode at load and the app never knows which one it got:

- **hosted** — running in an iframe inside `lifeos.html`. Every mutation is a
  `postMessage` to the shell, so the shell is the only writer and nothing races.
  This is also why it works from `file://`, where frames cannot touch each other's
  DOM but `postMessage` still flows.
- **solo** — opened on its own. It owns `localStorage['lifeos_v1']` directly and
  gossips to other tabs over `BroadcastChannel('lifeos')`.

The shell adds durability on top: IndexedDB `lifeos` / store `kv` / key `doc`,
same doctrine as ARC — the synchronous localStorage copy loads first, IndexedDB
swaps in if its `ts` is newer.

### The shared doc

```js
{ v:1, ts,
  activities: { [actId]: {id, name, cat, dur, color, energy} },   // the vocabulary
  habits:     { [id]: {id, actId, name, color, cadence, ord, archived} },
  log:        { 'YYYY-MM-DD': { [actId]: {ts, src, habitId, note} } },   // what got done
  today:      { date, vid, name, blocks:[{id, actId, name, s, dur, color, lane}] } }
```

Apps keep their private state exactly where it was (`block_v1`, ARC's IndexedDB,
theme prefs). Only what must be shared lives in the doc, and it is small enough
to broadcast whole — no diffing, no merge rules.

### The identity rule

**Things are the same thing when their names slug the same.** `'Cold shower'` in
BLOCK and a habit called `Cold shower` are both `cold-shower`, which is exactly
what makes a tick in one place a tick in the other. The consequence, accepted on
purpose: two routine blocks with the same name in different lanes share one tick.
Rename one if you want them counted apart.

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

Mutations return promises (hosted mode round-trips to the shell). Every mutation
from anywhere fires `on` in every app in every tab.

## Wiring, per app

**BLOCK** owns the schedule; LifeOS owns what got done. Three wires, all at the
bottom of its script under `LifeOS bridge`:

- `pushLib()` — its library + every block name becomes shared `activities`, so
  HABITS can promote any of it with one click.
- `toggleDone()` — writes `LifeOS.done(...)`; `pullDone()` writes the log back
  onto `it.done`. Ticks are no longer BLOCK's to keep.
- `publishToday()` — today's blocks with their computed start times, for the home
  screen to show and tick.

Behaviour change worth knowing: completing the whole routine no longer wipes the
ticks after the celebration — they are the day's record now. Rollover to a new
day still clears them, then restores anything already logged for today.

**HABITS** owns nothing at all. Habits, ticks and vocabulary are all in the doc,
which is why promoting an activity to a habit inherits its history immediately.

**ARC** and **FORM REVIEW** are hosted but do not share data. They need no changes.

## Adding an app

1. One entry in `APPS` in `lifeos.html` (`id, nm, ic, file, ds`, plus `shares` or `solo`).
2. If it shares data, paste the kernel block into it and call the API.
3. Nothing else in the shell knows any app's name.

## Where ARC plugs in later

The flowchart routine — a morning that can go two ways — fits without changing the
contract: ARC authors the branch as a map, then publishes the chosen path as a
`today` payload (or a named BLOCK variant), and the ticks flow back through the
same log. The `vid` field in `today` is already there to say which variant a day
actually ran.

## Known limits

- Same-origin only: the apps must sit in the same folder (or same site).
- The doc is broadcast whole. Fine at a few years of log; revisit if it passes ~1MB.
- `file://` works, but each browser treats file-origin storage slightly differently —
  serving the folder (or GitHub Pages) is the reliable path.
- ARC's own data still lives in ARC's IndexedDB and is not in the LifeOS backup;
  use ARC's own workspace backup for that. The `⭳ BACKUP` button covers the shared
  doc plus every app's localStorage.
