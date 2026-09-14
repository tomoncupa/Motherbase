# QUESTS

The todolist. Todoist, copied as closely as the suite allows.

This brief governs `quest/` only. It obeys the master brief at the repo root and
may add rules but never contradict them. Where the two disagree, the root wins
and this file is the bug.

`quest/BRIEF.md` beside it is the older Daily Quest OS brief. Its data model and
design-system sections still govern. Its ranks, scores and streaks do **not**
describe this app: Tom, 2026-09-14, *"Honestly I just want to almost entirely
copy Todoist."* Nothing from the rank half gets built without being asked for.

---

## FUNCTION, in one sentence

**Write down what you have to do, say when in plain words, and see what is due.**

## Never

- **A second list of todos.** A quest is STATUS's `note` row of kind `todo`.
  Written here, it is in STATUS's journal. Ticked in STATUS, it is ticked here.
- **A score.** No points, ranks or streaks for finishing tasks. Root brief,
  psychology section.
- **A form.** Adding is one line you type into. Dates, priority, project and
  repeat are read out of the words, and the menus are for changing them after.

---

## One todo, two windows

The row is STATUS's `note`, dated on the day it was written, exactly as STATUS
writes it (`addNote` in `status/index.html`). QUESTS adds fields and never
removes any, under the root brief's many-writers rule: every edit reads the row
and merges into it.

| Field | Meaning | Written by |
|---|---|---|
| `kind` `text` `t` `made` `at` `dur` `ord` `done` `cancelled` `by` `byWas` `byAuto` `doneAt` `doneOn` | STATUS's, unchanged | both |
| `due` | `YYYY-MM-DD` the day it is due. Missing on an old row means the day it was written. `''` means No date | both |
| `pri` | `1` `2` `3`, like Todoist's P1 to P3. Missing is no priority (Todoist's P4) | QUESTS |
| `proj` | a project key, from a `#hashtag` | QUESTS |
| `rep` | `{txt, every, unit, days}` the repeat, and the words it was read from | QUESTS |
| `of` | on a finished repeat, the key of the todo it was a round of | QUESTS |

**Carried todos stay `>`.** Tom, 2026-09-14: *"I still want Todos that didn't
get moved to go from Squares to >, but I also want the option to manually
reschedule."* A todo whose due day has passed follows you forward in STATUS
drawn `>`, as it always has. Rescheduling moves `due`; the row does not move.

**A repeating todo** stays one open row. Ticking it writes a finished copy on
the day it was done (`of` pointing back, so STATUS and LOG show that it
happened on that day) and moves `due` to the next round.

**Projects** are `project` rows, owned here, key the slug of the hashtag,
payload `{name, slot, ord}`. `slot` is a theme colour slot, never a hex. A new
hashtag makes the row the first time it is used.

## Typing

Read from **anywhere** in the line, not only the end. Tom, 2026-09-14: *"Yes to
Dates read anywhere."* This replaces DOCTRINE's end-of-line rule for todos
written here. What protects the words instead is Todoist's answer: everything
read out of the line is highlighted as it is typed, and shown as a chip under
the box with a cross that gives those words back to the text.

- Dates: today, tomorrow, weekday names, this weekend, next week, in 3 days,
  Sep 20, 20 Sep, 9/20
- Times: 3pm, 3:30pm, 15:00, noon
- Priority: p1 p2 p3
- Project: #word
- Repeat: every day, every weekday, every monday, every 2 weeks, monthly,
  every 15th, yearly
- **"tom" is never tomorrow.** It is his name.

## Screens

Inbox (no date), Today (Overdue with Reschedule, then today), Upcoming, and one
per project. Wide windows get the list of them down the left; a phone gets them
as a strip. The date menu copies Todoist's: Today, Tomorrow, This weekend, Next
week, No date, a month calendar, a time, and Repeat.

**Device.** Both. A PC and the iPad Air (3rd generation, 1112 by 834 in
landscape) are wide; the phone is a column. 44px targets everywhere, menus
beside the pointer on a wide window and up from the bottom on a phone.

---

## Decisions, and who made them

| Decision | Set |
|---|---|
| QUESTS is the todo app, not a tab in STATUS. | Tom, 2026-09-14 |
| Copy Todoist: P1 to P3, natural language dates, hashtags for projects, its date menu and its overdue Reschedule. | Tom, 2026-09-14 |
| Dates read anywhere in the line. | Tom, 2026-09-14 |
| Repeating todos, now. | Tom, 2026-09-14 |
| Carried todos stay `>` in STATUS, and can be rescheduled by hand. | Tom, 2026-09-14 |
| A quest is STATUS's `note` todo row with fields added, not a new type. | Claude, 2026-09-14 |
| Old todos with no `due` are due the day they were written, so nothing he already has changes where it shows. | Claude, 2026-09-14 |
| P1 is `--danger`, P2 `--warn`, P3 `--info`. | Claude, 2026-09-14 |

## Not here, and where it went

- **Regular tasks that are not daily, in BLOCK.** Tom, 2026-09-14. BLOCK's own
  session.
- **The always-on-top widget**, with bullet entry on a shortcut and a mood and
  energy check every N hours. A mode of STATUS, which owns all three.
- **The chart maker.** Tabled by Tom, 2026-09-14.
