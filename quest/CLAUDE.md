# QUESTS

The todolist. Todoist, copied as closely as the suite allows.

This brief governs `quest/` only. It obeys the master brief at the repo root and
may add rules but never contradict them. Where the two disagree, the root wins
and this file is the bug.

`quest/BRIEF.md` beside it is the older MOTHERBASE brief. Its data model and
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
| `aim` | the key of the `aim` this todo serves, from `^name` | QUESTS |
| `aimrev` | on a review todo QUESTS wrote: `week`, `month`, `quarter` or `year` | QUESTS |

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

## Goals

Tom, 2026-10-27: *"Quests could stand to have a place where all our goals are
visible. 1 month, 6 month, 1, 5, 10 years. What is visible is top of mind.
Presence beats habit. But I worry it can also be a habit to ignore something we
see everyday."* He picked every recommended option: one goal on Today that
changes daily, todos and projects linked, reviews as todos, clients too.

**Why it is built this way, and the evidence.** Both halves of what he said
are true, and they decide the shape:

- **Seeing the same thing every day stops working fast.** fMRI and eye
  tracking show attention to a repeated on-screen message drops sharply from
  the SECOND exposure and keeps falling across a workweek; in a three-week
  field test adherence fell steadily, and a display that changed its look
  each time held up much better (Anderson et al. 2015, CHI; Vance et al. 2017,
  CHI; Vance et al. 2018, MIS Quarterly). Those are security warnings, not
  goals: the transfer is a reasonable inference, not a measured one.
- **What moves a goal is recording progress, not looking at it.** 138
  randomised studies, N = 19,951: interventions that raised progress
  monitoring raised goal attainment, d = 0.40, mediated by how often people
  monitored, and more so when progress was physically recorded or reported
  (Harkin et al. 2016, Psychological Bulletin). Goal setting alone is d = 0.34
  (Epton et al. 2017).

So the goals live on a screen you go to, Today shows ONE and a different one
each day, and the part that is meant to change behaviour is the check-in and
the review, which write progress down.

- **`aim` rows**, undated, keyed by an id: `{text, tag, h, why, made, by,
  state, doneOn, ord, log}`. `h` is `1m` `6m` `1y` `5y` `10y`. `tag` is the
  name typed after `^`, made from the first two real words and numbered if
  taken. `by` defaults to made plus the horizon. `state` is `''`, `done` or
  `dropped`. `log` is the check-ins, `[{d, text}]`. Not `goal`: TRAIN owns it.
- **`^name` on a todo** links it, read anywhere in the line like `#` and `@`,
  highlighted, a chip with a cross, and typing `^` offers the goals there
  are. A `^word` that names no open goal stays words: a goal is made on the
  Goals screen, never by typing. A **project** can serve a goal too (its
  menu, `project.aim`), and then every todo in it does (`aimOf`).
- **Today's one goal** (`aimForToday`): goals nothing linked has been done on
  for 14 days take turns first, else every open goal does, one a day,
  counted from a fixed date, so nothing is stored to make it change. It
  folds for the day like the brief. Settings, "A goal on Today", turns it off.
- **Reviews**: 1 month weekly, 6 months monthly, 1 year quarterly, 5 and 10
  years yearly. One todo per rhythm per period, `src: 'goals'`, dated and
  due on the period's first day, key `aimrev-<rhythm>-<that day>`, written
  only for goals made before the period began. Tapping it opens Goals.
  **Known risk, shared with the brief's todos:** a device that has not yet
  received a review someone ticked elsewhere writes it again, newer, undone.
  The key is the same everywhere, so it is one row, not a duplicate.
- **A goal past its date** asks once: Done, Another (its horizon), or Drop it.
  Never marked failed, never vanished. Done and dropped goals stay under
  Finished; only Delete, behind a confirm, takes one away.
- **The words never praise or score.** "Nothing done on it in 23 days. Last
  done Oct 4: ..." states the behaviour and the date and stops there (root
  brief, self-determination theory).

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
- Goal: ^name (an open goal's name only)
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
| P1 is `--danger`, P2 `--warn`, P3 `--info`, on the Priority button. | Claude, 2026-09-14 |
| A todo is drawn by `shared/journal.js`, exactly as STATUS draws it: STATUS's square box with no priority colour, the words, then the time after them ("7:00pm - 7:31pm"). The row keeps the due day, repeat, source, project and buttons. The menu adds Move to tomorrow and Cancel it. Supersedes Todoist's round priority circle. | Tom, 2026-09-14: *"same goes for Quest"*, STATUS wins |
| A todo moved to another day stays on the day it left as >, at the bottom of that day in Today and Upcoming, not counted in the group. Read from `Journal.place`, the rule STATUS and LOG use. | Tom, 2026-09-14: *"Yes do that for quests"* |
| Rescheduling a todo to a later day from the date menu or Reschedule records the move, the same as Move to tomorrow: > on every day it touched and was not done on, nothing on the days it skips before its new date. Made on Sunday and postponed twice, it is > on Sunday and Monday and a todo on Tuesday. | Tom, 2026-09-14: *"if a todo is rescheduled to the future then it doesn't show up on skipped dates"*, then *"> should appear on every date the todo touched but wasnt done on"* |
| Todos stay in STATUS's journal, Todo button and all. Tom: *"Keep Todos in STATUS."* Reverses a request made the same hour to hide them. | Tom, 2026-09-14 |
| Today lists what BLOCK planned, from its `plan` row, under the day's tasks: Now and Next marked, ticked with the shared tick. | Tom asked, Claude placed it, 2026-09-14 |
| Every row says where it came from: QUESTS, STATUS or BLOCK and its lane. QUESTS stamps `src`; an older row counts as QUESTS's if it has `pri`, `proj` and `rep`. | Tom asked, Claude chose the rule, 2026-09-14 |
| Date, Priority, Move to and More are buttons on every row, always visible. Right click and hold still open the menu. On a phone only More shows. | Tom, 2026-09-14 |
| A clock with no am or pm ("at 8", "8:30", "2-4:30") is the next time it comes round today: at 7:55 AM "at 8" is 8 AM, from 8:01 AM it is 8 PM. Once both have passed it stays PM. On another day STATUS's rule stands, 1 to 6 is afternoon. STATUS and LOG read every line the same way, entries included, and also read "at 8" and ranges at the end of a line. Tom: *"Make the time rules universal for STATUS, QUEST, and LOG."* Supersedes the afternoon rule everywhere on today. | Tom, 2026-09-14 |
| Ranges like "2-4:30" set a start and a length, and need a colon, am or pm, "at" or "from", so "3-5 reps" stays words. | Claude, 2026-09-14 |
| ARC writes todos for skill trees: a daily repeating todo for each skill in training and a one-off todo for each review due, in a project named after the map, stamped `src: 'arc'` and `arc: {m, n, k}`. Ticking one is a hit in ARC. QUESTS shows them as from ARC and otherwise treats them as its own. | Tom asked for skill trees in ARC, Claude placed the todos, 2026-09-16 |
| Claude's morning brief sits at the top of Today as a card that folds for the day, from the day's `brief` row. Its action items become ordinary todos, `src: 'brief'`, written once each. QUESTS only reads the brief; a daemon on the PC writes it. | Tom asked, and took Claude's recommendation, 2026-09-22 |
| Goals: a Goals screen with 1 month, 6 months, 1, 5 and 10 years; one goal on Today, a different one each day, the neglected first; `^name` links a todo or a project; each horizon's review is a todo. Clients get it too. | Tom, 2026-10-27, picking each recommendation |
| On a wide window, lay things out side by side; never fold text. Past 1240px a view's sections (the brief, Overdue, each day) flow into newspaper columns, at least 448px and at most 576px each, as many as the view has sections and the window fits; the title sits beside the add bar; the month calendar takes up to 1792px. Below 1240px nothing changes. | Tom, 2026-10-02, for the 5120x1440 ultrawide: "minimize the need for scrolling", "apps use the width", and no "show more" |

## Not here, and where it went

- **Regular tasks that are not daily, in BLOCK.** Tom, 2026-09-14. BLOCK's own
  session.
- **The always-on-top widget**, with bullet entry on a shortcut and a mood and
  energy check every N hours. A mode of STATUS, which owns all three.
- **The chart maker.** Tabled by Tom, 2026-09-14.

## History, moved from the root brief on 2026-09-22

What was built and watched, newest last. Moved here verbatim so the root brief
stays small enough for per-module sessions.

QUESTS, built 2026-09-14 and tested in the browser at desktop width; phone width not measured, because the test pane reported no width. Todoist's Inbox, Today, Upcoming and projects over STATUS's todo rows. Reads dates, times, P1 to P3, #projects and repeats from anywhere in the line, highlighted as typed, with a chip to give the words back. Todoist's date menu and overdue Reschedule. Ticking a repeat writes a finished copy and moves the todo on; STATUS does the same. In the client build since 2026-09-14. Today also lists BLOCK's published plan with Now and Next, every row says whether it came from QUESTS, STATUS or BLOCK, and Date, Priority, Move to and More are visible buttons on each row. STATUS's journal keeps showing todos, on their due date. A clock with no am or pm is the next time it comes round today, in QUESTS, STATUS and LOG, for every kind of line; on another day 1 to 6 is the afternoon. Each app carries its own copy of the rule. LOG's copy of `notes()` does not know `due` yet, so LOG still shows those todos on the day written. 1.0.9, 2026-09-17: @labels, beside the #projects that were already there. Tom: "Can we copy Todoists #Project and @Tag system on Quests?" A todo has ONE project and ANY NUMBER of labels, which is the whole difference between them: a project is where a job lives, a label is a condition it needs before it can be done. Typed anywhere in the line and highlighted as typed, one chip each so a single one can be given back, a Labels section in the side listing every one in use with its count, and a view per label. Labels have no rows: a label is a word on a todo and nothing else, so the list is read off the todos and one nobody uses stops being listed — projects have rows because they carry a colour and an order, and a label carries neither. Two details worth keeping: the label rule sits AFTER the time rules so `@8` and `at 8` still mean eight o'clock, and it is the one rule allowed to match more than once per line, since `@phone @15min` is two conditions rather than a second attempt at naming one. Watched: both labels off one line, a repeat ignored, `@8` still a time, the side counting, the view filtering, and the label you are standing in left off its own rows. 1.0.10, the same day: typing @ offers the labels already in use. Tom: "How can we ensure labels get used correctly?" What ruins a label set is not misuse, it is SPRAWL — @phone, @Phone and @calls all meaning one condition, after which no label view is complete and you stop trusting them. Case was already dealt with, since a label is slugged. This is the rest: the moment you type @, the ones you already use sit under the box, narrowed as you type, so picking an existing label is less work than inventing one, and a word that matches nothing says `new label` rather than letting you make a fourth synonym without noticing. Read off the CARET, not the line, so a second @ offers a list that leaves out the label already on the row. Watched: no @ offers nothing, a bare @ offers all three, @d narrows, @zzz offers only new label, and a pick completes both at the end of a line and mid-line.

1.0.21, 2026-10-02: wide windows use the width. Tom runs a 5120x1440 ultrawide and QUESTS gets a 2560-wide frame on it; every view drew one 768px column. Tom's rule: on a wide window, lay things out side by side; never fold text. Past 1240px (the wide-window block in the CSS, `fit()` at the end of `draw()`) the sections flow into CSS columns (`column-width` 448px, `column-count` = the view's section count, the wrap capped at 576px a column so the brief's lines stay under about 80 characters); a section of eight rows or fewer never breaks across columns, a longer one may. The title and the add bar share a row. Views with one section (Inbox, most projects) stay at 768px. Measured in headless Chromium on the demo plus 24 extra todos and a brief, `main` scroll height over the window: Upcoming 3.12 to 1.77 at 1280x1300, 3.12 to 1.31 at 1720x1300, 3.12 to 1.07 at 2560x1300, 4.06 to 1.68 at 1920x1000; Today 1.06 to 0.95, and 1.37 to 0.93 at 1920x1000. On the plain demo Upcoming went from 1.62 to under 1 at every wide size. The phone (390x844) and the iPad (below 1240px) are untouched: every element's box was identical before and after on all eleven views, and the phone screenshots byte-identical.

1.0.23, 2026-10-22: words in a meaning colour read in every theme. In Craft Day (minecraft2) the #, @, Overdue, Reschedule, Yesterday and Today in the row's date measured 1.06 to 2.5 to 1 against 4.5. A chart or meaning colour is a line colour, not a word colour (root brief, Known traps), so every word keeps its text colour and the colour goes on a mark: a 3px line under # and @ (`--mk`, set where the # is drawn), a dot before Overdue and Now (`.mk-dot`), a red underline on Reschedule, the calendar icon for a late or today date, the chip's border for P1 to P3, a bar down the left of a late todo in the month grid, a ring round today in the date menu. Measured in headless Chromium on the demo at 1280, all 23 factory themes, Today view: failing words 168 to 10, words in a chart colour 158 to 0; the 10 left are Brick's own text token, Ragnarok's logo and FFVII's ADD, theme faults. Block 0 to 0. Looked at in Block and Craft Day at 390, and the project list at 1280: in Block a project's colour is now the line under its #, not the # itself. Not seen on the iPhone; month grid and date menu not measured, only changed.

1.0.25, 2026-10-27: Goals (above). Also fixed in passing: labels typed in the add bar were never saved, because `final()` built its result without `tags` and `addQuest` read `tags` off it; watched on main, `Call the bank @phone @15min` saved no tags. Watched in headless Chromium: 30 checks on the goals (typing `^`, the chip, the highlight, saving `aim` and both labels, an unknown `^word` left as words, project linking, three reviews written once and a deleted one staying deleted, the card, the daily rotation over four stubbed days, Goals' five horizons, making a 5 year goal, a check-in, Another year, Finished, a review opening Goals, nothing sideways at 390), and `_review.html` 195 of 195 at 1280 and 210 of 210 at 390. Not run in WebKit (none in that cloud session) and not seen on the iPhone.

## Needs from the foundation

Nothing waiting. (Marks floored to 3 to 1 on all four grounds by `skins.js`, 2026-10-22.)
