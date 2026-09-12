# YEAR

The last few weeks, set inside the year around them.

This brief governs `year/` only. It obeys the master brief at the repo root and
may add rules but never contradict them. Where the two disagree, the root wins
and this file is the bug.

**Tom only, and a desktop app.** Goes in `DROP_APPS` in `tools/build-client.py`
the day it goes on the home screen.

**The build prompt it started from was written in Claude chat for React and
Vite.** Tom, 2026-09-13: *"don't let it override design settings we've
established."* So colours are theme tokens, not its hex codes; saving is rows
through `shared/records.js`, not one blob per year in localStorage; the header
and buttons are the suite's. The prompt still governs what the app does.

---

## FUNCTION, in one sentence

**It shows what you did and posted over the last few weeks, so you can see
whether you kept going.**

Tom, 2026-09-13: *"it's really meant to focus more on the past 3-8 weeks for
the most part ... it's to increase personal continuity and accountability."*

The year is context, not the subject. A quiet fortnight or a good run should be
visible without reading anything, and the aggregate columns are there so this
week can be seen beside the weeks before it.

## Never

- **A planner.** The future is not a record. Future days are drawn, quieter,
  and carry no totals and no entries.
- **A scoreboard.** No streaks, no scores, no "you did X so Y went up". Root
  brief, psychology section: state the behaviour, show the number, let him
  join them. An empty day is simply empty, never a warning.

---

## Decisions, and who made them

| Decision | Set |
|---|---|
| The wheel zooms, toward the pointer, like a map. A drag moves. | Tom, 2026-09-13 |
| One continuous timeline. December sits on January, so the weeks before a new year are never on another page. | Tom, 2026-09-13 |
| Opens with today on the bottom edge and the 42 days before it filling the screen. | Tom, 2026-09-13 |
| TODAY and WHOLE YEAR buttons in the header, so zoom is reachable without knowing the wheel does it (DOCTRINE law 6). Text, because `shared/icons.js` has no zoom drawing and an app session may not add one. | Claude, 2026-09-13 |
| Column widths are `--s-9`, `--s-9`, `--s-10`, `--s-9`: the nearest scale steps to the prompt's 80, 80, 100, 80. | Claude, 2026-09-13 |
| What text a block shows is measured against the current font, not the prompt's fixed 40px and 16px. A label and two totals come to about 45px. | Claude, 2026-09-13 |
| Weeks are labelled by their dates, `5–11`, never by week number. | Claude, 2026-09-13 |

## The layout rule

One number, `dayHeight`, in whole pixels, between 2 and 64. Every block in
every column is placed at (first day × dayHeight) and is (days × dayHeight)
tall. Weeks start on Monday and are clipped to their month. A zoom changes the
`--dh` variable and re-decides which labels fit; nothing is rebuilt.

## Ownership

| Type | Key | Payload |
|---|---|---|
| `done` | timestamp id | `{text}` — one thing done, dated on its day |
| `post` | timestamp id | `{text, platform}` — one thing published |

One row per entry, never one row per day: two devices adding to the same day
write two rows and cannot overwrite each other.

## Build steps

1. ~~Date maths and the nesting rule, on sample numbers.~~ Done 2026-09-13.
2. ~~Zoom and move.~~ Reworked from the prompt's scroll-and-shift-zoom to the
   decisions above. Done 2026-09-13.
3. Colours and intensity fills.
4. Click to select, and the right-hand panel.
5. Entry form and saving. Remove the sample numbers and the "Sample data" note
   in the same change.
