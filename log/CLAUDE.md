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
- **A planner.** The future is not a record. Nothing can be added to a future
  day, and future days carry no count.
- **A scoreboard.** No streaks, no scores, no "you did X so Y went up". Root
  brief, psychology section: state the behaviour, show the number, let him join
  them. An empty day is simply empty, never a warning.

---

## What shows, what counts, and on which day

Tom, 2026-09-13: every kind counts, and a post is an ordinary bullet. So a day
has **one count**, the number of bullets, and months and weeks say
"34 bullets". The filter bar decides which kinds show, and the counts follow
it.

The day rules are STATUS's (`notes()` in `status/index.html`), so a day never
reads one way there and another here:

| Kind | Mark | Shows on | Counts |
|---|---|---|---|
| entry (and the old `para`) | `·` | the day it is written on | yes |
| event | `–` | the day it is written on | yes |
| idea | `!` | the day it is written on | yes |
| todo, ticked | `×` | the day it was ticked, `doneOn` | yes |
| todo, open | a box you can tick | the day it was written | **no**. Shown so a todo added in LOG does not vanish; an intention is not a thing that happened |

Cancelled lines show nowhere.

**The time** on each bullet follows STATUS's row: the time typed into the line;
a ticked todo's Done time; an open todo's start, or "by" its Done time; and for
anything else with no time of its own, when it was written, drawn quieter.

## Ownership, and writing

LOG owns **no row types**. It reads and writes `note`, whose shape STATUS owns,
under the root brief's many-writers rule:

- **A new line** is STATUS's `addNote` payload, field for field.
- **An edit, a tick or a delete re-reads the row and merges into it.** STATUS
  keeps fields LOG never shows (`byWas`, `ord`, whatever it adds next), and a
  rebuilt row would drop them. Checked by seeding a field LOG does not know and
  editing the line.
- **After every write LOG runs STATUS's `publishNotes`**, so the home screen's
  journal counters and DAY LOG see a line written here.

The time parser, the clock labels, the kinds and the two publish steps are
**copies of STATUS's code**, marked as such in `log/index.html`. Two copies is
two things to keep in step. Their right home is `shared/`, which only a
foundation session may touch. Until one moves them: change STATUS's, change
LOG's.

The store's ownership warning is per page: it only fires in an app that has
declared the type it is being written against. STATUS declares `note`; LOG
declares nothing, so LOG never sees that warning. The merge rule above is the
discipline, not the warning.

The backup registers `note`, or a restore of LOG would restore nothing.

---

## Decisions, and who made them

| Decision | Set |
|---|---|
| The wheel zooms, toward the pointer, like a map. A drag moves. | Tom, 2026-09-13 |
| One continuous timeline. December sits on January. | Tom, 2026-09-13 |
| Opens with today on the bottom edge and up to 42 days above it. | Tom, 2026-09-13 |
| Halves and quarters removed. Months, weeks, days. The year is written on January. | Tom, 2026-09-13 |
| Months and weeks show only when zoomed out. Once a day is readable they and the headings step aside. | Tom, 2026-09-13 |
| Entries are bullets from STATUS's journal, all four kinds count, and there is no separate posted count. | Tom, 2026-09-13 |
| One line per bullet. | Tom, 2026-09-13 |
| A filter bar at the top: which kinds show, and how a day is sorted (by time, as arranged, newest first). Both remembered. | Tom, 2026-09-13 |
| Every bullet shows its time. | Tom, 2026-09-13 |
| Zoomed in, a day is at least `dayHeight` tall and grows to fit its bullets. Only possible because months and weeks have stepped aside by then, so nothing has to line up with it. | Claude, 2026-09-13 |
| The opening zoom is the largest at which the last 42 days fit, but never less than readable. On a busy stretch it shows fewer days rather than hiding the bullets. | Claude, 2026-09-13 |
| The time leads each bullet, in its own right-aligned column. STATUS puts it after the words; LOG is read down the clock. | Claude, 2026-09-13 |
| Adding: ADD in the header for today, a click on any readable past or present day, or its right-click menu. Enter adds and keeps the box open for the next line, an empty Enter closes. In LOG every kind is one line, so there is no prose exception. | Claude, 2026-09-13 |
| Editing puts the time back into the words ("Trained legs 7:30am 1h30"), so saving without touching it keeps it. | Claude, 2026-09-13 |
| Ticking a todo in LOG marks it done today, whichever day it was written on. | Claude, 2026-09-13 |
| With months and weeks aside, the day column carries them: a line at each Monday, a stronger line at each 1st, and the label names the month on the 1st and the year on 1 January. | Claude, 2026-09-13 |
| TODAY and WHOLE YEAR buttons, so zoom is reachable without knowing the wheel does it (DOCTRINE law 6). Text, because `shared/icons.js` has no zoom drawing. | Claude, 2026-09-13 |
| Weeks are labelled by their dates, `5–11`, never by week number. | Claude, 2026-09-13 |

## Found in STATUS, not fixed

Reasoned from the code on 2026-09-13, not watched: **editing a timed entry,
event or idea in STATUS drops its time.** STATUS's line editor fills the box
with the words only, and on save sets `at` to whatever time is typed in the box
or, for anything but a todo, nothing. So correcting "Trained legs" to "Trained
legs hard" wipes the 7:30am. That is STATUS's folder, so a STATUS session
should confirm and fix it. LOG's editor avoids it by putting the time back into
the words.

## The layout rule

One number, `dayHeight`, in whole pixels, between 2 and 64. Zoomed out, every
block in every column is placed at (first day × dayHeight) and is
(days × dayHeight) tall; weeks start on Monday and are clipped to their month.
Zoomed in, the day column is ordinary flowing rows with a minimum height, and
every position (zoom anchor, today on the bottom edge, the year in the header)
is read off the page rather than calculated.

## Build steps

1. ~~Date maths and the nesting rule.~~ Done 2026-09-13.
2. ~~Zoom and move.~~ Done 2026-09-13.
2b. ~~Read the journal; one count; months and weeks step aside.~~ Done 2026-09-13.
2c. ~~One line per bullet, times, filter bar, adding, editing, ticking and
   deleting.~~ Done 2026-09-13.
3. Colour: one colour, darker as a day's count rises.
4. The prompt's right-hand panel is worth asking about again before building:
   bullets are now readable and editable in place.
