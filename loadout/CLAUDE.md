# LOADOUT

Tools for changing a pattern. 214 of them hang on a wall (habit science, CBT,
ACT, schema, DBT, motivational interviewing, mindfulness, positive psychology,
the 93 behaviour change techniques), each a short worksheet with a plain
introduction and the three best tools to use next. You pick the ones that fit,
equip them (Trying), and keep what works. Made 2026-11-24 from the Personal
Design Toolkit (Tom: "integrate this into Motherbase", named LOADOUT, "redesign
it to fall into with MB styling", "keep a seperate standalone EXE", "let the
MB work perfectly with QUEST").

## FUNCTION, in one sentence

**Pick a few tools for one pattern, use them, and see on one screen whether
they are working.**

## Settled (Tom, 2026-11-24)

- **Desktop only**, like ARC, BLOCK and FORGE. Not checked at phone width.
- **Clients get it** (client build), since "the user" is anyone.
- **QUESTS, two-way.** See below.
- **The standalone program stays**: `desktop/Personal Design Toolkit.exe`,
  built from this file. See Standalone.
- My plan, printing, the counter, the timers and the values sort were built
  2026-11-22 in the toolkit (picks 1 to 7) and came across unchanged.

## The rows

| Type | Key | Payload |
|---|---|---|
| `lpick` | the tool id (`h-log`), undated | `{s: pick, try, keep or drop, at, start, aim}` — `start` the day it went Trying; `aim` a QUESTS goal key |
| `lentry` | the entry id, undated | `{tool, at, v, edited, ai}` — one saved worksheet, `v` its answers |
| `lcard` | the card id, undated | a card on My board: `{tool, entry, lane, head, lines, nums, at, eat}` |
| `ltap` | the tap id, undated | `{at}` — one press of "It happened: count it" |

Undated because an entry's day is its `at`, which an edit can change, and a
row's date is part of its id. Drafts, the values sort, and which panels are
open are settings `loadout.*`.

## QUESTS

- A tool marked **Trying or Kept** is a repeating todo, STATUS's `note` shape:
  key `lo-<tool>-<start>`, dated the start day, `src: 'loadout'`, project
  `loadout` (#loadout, the `project` row made once), `lo: {tool}`, `aim` when
  linked. The key is the same on every device; it is looked for, and its
  tombstone, before it is written.
- **Rhythm**: the tool's own (JOURNAL_DAILY, _WEEKLY, _MONTHLY in the plan
  part), else daily. A tool used in the moment (POCKET) gets no todo.
- **Saving a worksheet** ticks the round that is due (`Journal.tick`), once a
  day. **Ticking the todo** in QUESTS or STATUS counts as used in LOADOUT's
  Journal panel, because the finished round carries `lo`.
- **Dropped or put back on the wall**: the open todo is cancelled, never
  deleted.
- **Goals**: under a tool being tried, "Serves goal" lists QUESTS's open
  `aim` rows; the pick carries `aim` and so does its todo. My plan shows
  "tool → goal". The If-then plan has "Put it on the goal", which writes its
  cue and action into that goal's WOOP `if` and `then` by patch, with Undo.

## Standalone

`py -3 desktop/toolkit/build.py` copies this file and the shared files into
`desktop/toolkit/app/` (gitignored) and builds the exe with Go
(`%LOCALAPPDATA%\Programs\Go`, installed 2026-11-23) and go-winres. The exe
opens `loadout/index.html?solo=1`: `SOLO` skips every QUESTS write, the goal
links and the home button. On its first open it moves the old toolkit's
`toolwall.*` localStorage into rows (the one place this file touches
localStorage) and renames the old keys `.moved`. **Rebuild the exe after
every change here.** `desktop/toolkit/page/` is the toolkit's old source,
kept until Tom removes it; nothing reads it.

## Look

Block tokens only. Family colours are `--data-1` to `--data-6` by family
order (`famC`), worn as `--c`. Selected things are the accent with
`--accent-fg`; Trying, Kept and Dropped are rings in `--warn`, `--success` and
`--text-muted`, never fills. Printing is black on white on purpose: paper is
not a theme, and that is the only hex in the file.

## Not yet

- Seen in Tom's real window: only in headless Chromium and WebKit
  (`_review.html` 216/216 and 232/232, and LOADOUT's own click tests).
- The claude.ai artifact Pattern Toolwall is the old page.
- The icon (a pegboard with two tools) was picked by the build session.
