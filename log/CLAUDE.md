# LOG

The journal module. The last few weeks of bullets, set inside the year around
them.

This brief governs `log/` only. It obeys the master brief at the repo root and
may add rules but never contradict them. Where the two disagree, the root wins
and this file is the bug.

**Tom only, and a desktop app.** Goes in `DROP_APPS` in `tools/build-client.py`
the day it goes on the home screen.

**It started life as YEAR**, from a build prompt written in Claude chat for
React and Vite. Tom, 2026-09-13: *"don't let it override design settings we've
established."* So colours are theme tokens, not its hex codes; there is no
localStorage blob; the header and buttons are the suite's. Renamed LOG the
same day, when it became the view over STATUS's journal: STATUS's
`NOTE_KINDS` had already been routing entries, events and ideas "to LOG, the
journal module" before this app existed.

---

## FUNCTION, in one sentence

**It shows the bullets you wrote over the last few weeks, so you can see
whether you kept going.**

Tom, 2026-09-13: *"it's really meant to focus more on the past 3-8 weeks for
the most part ... it's to increase personal continuity and accountability."*

The year is context, not the subject. A quiet fortnight or a good run should be
visible without reading anything.

## Never

- **A second journal.** A bullet is a `note` row whoever writes it. A line
  written in LOG and a line written in STATUS are the same kind of row, visible
  in both and on the home screen's day log.
- **A planner.** The future is not a record. Future days are drawn, quieter,
  with no count.
- **A scoreboard.** No streaks, no scores, no "you did X so Y went up". Root
  brief, psychology section: state the behaviour, show the number, let him join
  them. An empty day is simply empty, never a warning.

---

## What counts, and on which day

Tom, 2026-09-13: every kind counts, and a post is an ordinary bullet. So a day
has **one count**, the number of bullets, and months and weeks say
"34 bullets".

The day rules are STATUS's (`notes()` in `status/index.html`), so a day never
reads one way there and another here:

| Kind | Mark | Counts on |
|---|---|---|
| entry (and the old `para`) | `·` | the day it is written on |
| event | `–` | the day it is written on |
| idea | `!` | the day it is written on |
| todo | `×` once ticked | the day it was ticked, `doneOn`, wherever it was written. An open todo counts nowhere |

Cancelled lines count nowhere.

## Ownership

LOG owns **no row types**. It reads `note`, which STATUS owns the shape of, and
from step 5 writes it too, under the root brief's many-writers rule: a new line
is a fresh row in STATUS's exact payload shape, and an edit merges into the row
it read, never rebuilds it. `note` is deliberately not in `Rec.declare`, so the
store keeps warning on a careless write.

The backup registers `note`, or a restore of LOG would restore nothing.

---

## Decisions, and who made them

| Decision | Set |
|---|---|
| The wheel zooms, toward the pointer, like a map. A drag moves. | Tom, 2026-09-13 |
| One continuous timeline. December sits on January, so the weeks before a new year are never on another page. | Tom, 2026-09-13 |
| Opens with today on the bottom edge and the 42 days before it filling the screen. | Tom, 2026-09-13 |
| Halves and quarters removed. Months, weeks, days. The year is written on January. | Tom, 2026-09-13 |
| Months and weeks show only when zoomed out. Once a day is tall enough to read, they and the column headings step aside and the days take the full width. | Tom, 2026-09-13 |
| Entries are bullets from STATUS's journal, all four kinds count, and there is no separate posted count. | Tom, 2026-09-13 |
| With months and weeks aside, the day column carries them: a line at each Monday, a stronger line at each 1st, and the day label names the month on the 1st and the year on 1 January. | Claude, 2026-09-13 |
| TODAY and WHOLE YEAR buttons in the header, so zoom is reachable without knowing the wheel does it (DOCTRINE law 6). Text, because `shared/icons.js` has no zoom drawing and an app session may not add one. | Claude, 2026-09-13 |
| Column widths are `--s-10` for months and `--s-9` for weeks. | Claude, 2026-09-13 |
| What text a block shows is measured against the current font, never a fixed pixel height. | Claude, 2026-09-13 |
| Weeks are labelled by their dates, `5–11`, never by week number. | Claude, 2026-09-13 |

## The layout rule

One number, `dayHeight`, in whole pixels, between 2 and 64. Every block in
every column is placed at (first day × dayHeight) and is (days × dayHeight)
tall. Weeks start on Monday and are clipped to their month. A zoom changes the
`--dh` variable and re-decides what fits; nothing is rebuilt. A day's bullets
flow onto more lines as the row grows; what does not fit is cut, and the whole
list is on hover until the panel exists.

## Build steps

1. ~~Date maths and the nesting rule.~~ Done 2026-09-13.
2. ~~Zoom and move.~~ Done 2026-09-13, to the decisions above.
2b. ~~Read the journal; one count; months and weeks step aside when zoomed
   in.~~ Done 2026-09-13.
3. Colour: one colour, darker as a day's count rises. The prompt's plum and
   green split no longer has two counts to show.
4. Click to select, and the right-hand panel: the period, its count, and every
   bullet grouped by day. Replaces hover as the way to see a cut-off list.
5. Writing bullets from the panel, in STATUS's payload shape.
