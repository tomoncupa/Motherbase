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
- **Goal health** (Tom, 2026-11-16, from Superfocus; 1.0.28): every open goal
  row and Today's goal card show this week's call, On track, Adjust or Off
  track, from days since a task serving it was done (7 or fewer, 21 or fewer,
  more). Made this week with nothing done: "New this week", no call. Beside it
  the last 6 weeks' done counts, the number in each box, and "Day 41 of 180"
  from made to by. Under it one fix: the next task due this week, else Put on
  today (the open one first by `sortQ`), else Add a task (typed like the task
  line, saved with `aim`). Tapping the call marks it right or another call,
  kept as `marks: {<week start>: {v, t}}` on the aim, "your call" shown. The
  goal's menu adds Add a task and Link a project (`project.aim`).
  **On 2026-11-16 he had 0 goals and 0 linked todos**, so nothing shows until
  goals exist; Link a project is the cheap way to link his Todoist projects.
- **Three open goals at a time** (Tom, 2026-11-16: "Cap Quests at 3 Major Goals at a time"; 1.0.37, `AIM_CAP`): Add, a new goal's SAVE and Open it again refuse a fourth with "3 goals are open. Finish or drop one to add another." Goals already open past three stay. The Goals screen says "N of 3 goals open".
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

1.0.26, 2026-10-30 (written 2026-10-27, merged after Todoist sync took 1.0.25): Goals (above). Also fixed in passing: labels typed in the add bar were never saved, because `final()` built its result without `tags` and `addQuest` read `tags` off it; watched on main, `Call the bank @phone @15min` saved no tags. Watched in headless Chromium: 30 checks on the goals (typing `^`, the chip, the highlight, saving `aim` and both labels, an unknown `^word` left as words, project linking, three reviews written once and a deleted one staying deleted, the card, the daily rotation over four stubbed days, Goals' five horizons, making a 5 year goal, a check-in, Another year, Finished, a review opening Goals, nothing sideways at 390), and `_review.html` 195 of 195 at 1280 and 210 of 210 at 390. Not run in WebKit (none in that cloud session) and not seen on the iPhone.

## Todoist sync (decided and built 2026-10-29, 1.0.25)

Tom: "something to check Todoist every once in a while and then have it
reflect on quests". He captures with Todoist's iPhone widget and checks it
daily; QUESTS stays the place he sees and works the list. He picked all three
of Claude's recommendations:

1. **One way in, ticks back.** Todoist tasks become QUESTS todos. Ticking,
   rescheduling or deleting one in QUESTS (or STATUS, LOG, the home screen:
   they all tick through `Journal.tick`) does the same in Todoist. Todos typed
   in QUESTS stay in QUESTS; pushing them would flood Todoist with ARC,
   WEALTH and brief todos.
2. **Everything active comes in**, overdue included (40+ overdue since
   2026-09-10 on 2026-10-29). Reschedule clears them and the dates go back.
3. **An Inbox capture is a todo**, in QUESTS's Inbox, so a tick can go back.

No new home screen widget: TODO, UPCOMING and the QUESTS card already show
QUESTS todos.

**Facts found.** `api.todoist.com/api/v1` answers a preflight from
`https://tomoncupa.github.io` with Allow-Origin, GET/POST/PUT/DELETE and the
Authorization header (curl, 2026-10-29), so the page calls Todoist directly
on the phone and the PC; no daemon. His Todoist is the free plan (the
activity log answers PREMIUM_ONLY). 8 projects, 39 sections, sections
carry meaning ("Main Quests", "Daily Routines").

**Plan, Claude's calls.**
- Row: the usual `note` todo, key `td-<todoist id>`, `src: 'todoist'`
  (add to `SRC_NAME`), plus `td: {id, proj, sec, parent, desc, labels,
  due, rec, at}` holding what Todoist last said, so nothing QUESTS cannot
  show is lost and a change is told apart from Todoist's own. Project maps
  to a QUESTS `project` by name; labels to `tags`; p1 to p3 to `pri`
  (Todoist's API numbers priority backwards: 4 is p1).
- Pull on open, on `visibilitychange` back, and every 5 minutes while open.
  A task gone from Todoist (done or deleted there) is ticked or tombstoned
  here.
- Push by reconciling, not on the click: a row whose `done`, `due` or
  tombstone differs from `td` is sent, so a tick from any app goes. Before
  closing a RECURRING task, fetch it and close only if its due still equals
  `td.due`, or two devices would each advance it a round. `navigator.locks`
  keeps one QUESTS per device syncing (the home screen frames QUESTS too).
- The key: Todoist, Settings, Integrations, Developer, pasted once in
  QUESTS Settings. Kept as a setting NOT prefixed `quest.` (the sheet push
  takes every `quest.*` setting, `io.js` ~1228), so it rides live sync but
  not the sheet. Never print it.
- Test against one throwaway task in his real Todoist, tick both ways, then
  delete it.

**Built, 1.0.25** (`TD` in `index.html`). As planned, plus:
- Talks to `api/v1/sync` only: one read gets items, projects and sections;
  ticks, unticks, new dates and deletes go as one batch of commands
  (`item_close`, `item_uncomplete`, `item_update`, `item_delete`). A task
  that left the open list is asked about by `GET tasks/<id>`, at most 20 a
  run: 404 or deleted removes the row here, checked ticks it.
- The row is dated the day Todoist ADDED the task (local), so every device
  derives the same row id. Written with `Rec.set`, not `Journal.add`,
  because `Journal.add` makes its own key.
- A recurring task ticked here: closed in Todoist only while its due still
  equals `td.raw`, then a done copy keyed `td-<id>-r<round due>` with `of`,
  and the row reopens on Todoist's next date. Its words show as the row's
  repeat chip (`td.rec`); QUESTS's own `rep` stays empty.
- Text, priority, project and labels changed here stay here and are not
  overwritten until Todoist changes that field (Tom's 1A: only ticks, dates
  and deletes go back). A moved date keeps a recurring task's words.
- Runs on `Rec.ready`, on coming back to the page (45s apart at most), every
  5 minutes, and 8s after a write to any `td-` row (after Undo's 6s).
  `navigator.locks` `mb-todoist`; never in the demo. QUESTS's own redraws
  wait until a run ends.
- Settings: a password box for the key and a line saying what the last run
  did, with SYNC NOW.
- Tested: 29 checks against a stand-in Todoist in headless Chromium
  (scratchpad, not in the repo). **Not yet run against the real Todoist**:
  the field names are from Todoist's v1 docs as Claude knows them.

**Moved to `shared/todoist.js`, QUESTS 1.0.29 and STATUS 1.0.97
(2026-11-16).** Six DECISION tasks deleted in Todoist on 11-12 still showed
in STATUS on 11-16. Cause, read in the backups: the sync ran only inside a
QUESTS page, and no signed-in device had opened QUESTS since 11-10 (every
`td-` row in the synced store was last written 11-08). The Chrome where Tom
does open QUESTS had dropped them, but that Chrome was never signed in to
live sync (`Cloud.state().on` false; the "Not syncing" read there was the
sync dot's hidden placeholder text), so nothing it did reached STATUS.
- `TodoistSync` is the engine; QUESTS keeps `const TD = TodoistSync` and
  calls `TD.start({app, draw})`. STATUS calls `TodoistSync.start({app:
  'status'})`, so the PC widget and the iPhone STATUS app sync Todoist with
  QUESTS closed. `mb-todoist` in navigator.locks still allows one runner per
  browser.
- The 20 checks a run counted rows already settled (`td.done`), and a ticked
  row is never in the open list again, so ticks could use up every check.
  Settled rows are left out before counting now.
- The real Todoist answered as the brief guessed: the deletion check removed
  all six in that Chrome on 11-16 (tombstones 1 to 3 s apart, one `GET
  tasks/<id>` each), so the field names and the 404 are right.
- Watched: a stand-in Todoist in Chrome on localhost, 25 settled rows plus a
  deleted and a finished task; both asked about, one removed, one ticked.
  STATUS ran a sync on open with no QUESTS anywhere. `_review.html` 212 of
  212 in WebKit at 390.

**Not wanted for now** (Tom, 2026-10-29): Todoist's phone widget and
reminders. **Email into the Inbox is replaced by the morning brief**: "we can
do a morning brief - something that can also suggest todos for the day". The
brief card and its todos already exist here (`briefTodos`, `drawBrief`), but
its writer is outside this repo: OUTER HEAVEN writes
`Receipts/out/brief-<date>.json` after 5am and RECEIPTS lets it in as the
row (tom-context `projects/motherbase.md`, 2026-09-23). Check it still runs
before rebuilding. Once
Todoist rows are in the store, the brief picks from them, overdue first.
A suggested todo waits for a tap to accept (Tom, 2026-10-29, "A").

**The brief, rebuilt from scratch** (Tom, 2026-10-29: "better if you write
the daily brief function from scratch"). It opens as a pop-up in the
morning, offers 1 to 3 todos for the day to accept with a tap (Most
Important Tasks), and **holds a box for last-minute journal entries for the
day before** ("a field for last-minute journal entries for the prior day").
Those entries are `note` rows dated yesterday, written through
`Journal.add`, so STATUS and LOG show them on that day. Who writes the brief
and where it runs is the first thing to decide when building.

**Ways to organise** (Tom, 2026-10-29: "I definitely want a board view").
Claude recommended one BOARD view grouped several ways: by stage (Kanban:
To do, Doing, Done), by section (Todoist's board, sections synced as
columns), by priority, and the Eisenhower 2x2 (urgent from the due date,
important from P1 and P2). GTD's missing pieces (Someday, Waiting For, a
weekly review) and 1-3-5 were offered, not chosen. Tom picked all four
groupings (2026-10-29: "A"): stage, section, priority and Eisenhower, one
BOARD view with a switch between them. Build order: Todoist sync, then the
board, then the brief.

## Week draft (Tom, 2026-11-16: "Both", from Superfocus; built 1.0.30)

On Sunday and Monday a card on Today, and any day at the top of Upcoming
until handled that week, proposes changes to the week: "4 added, 1 moved,
24 back to Inbox". Each line kept by default with a round toggle; KEEP N
applies them (one Undo restores every row), NOT THIS WEEK hides it. Handled is
the setting `weekDraft` = that week's Monday, written only when he acts.
Rules, no AI (0 `brief` rows ever reached the store as of 2026-11-16):
- Week: from today to Sunday; on a Sunday, next Monday to Sunday.
- Moved: open overdue todos 30 days late or less, P1 first, onto the earliest
  day under 3 todos. Skip repeats (`rep`, `td.rec`) and WEALTH, ARC and GOALS rows.
- Back to Inbox: overdue more than 30 days, due set to No date (Todoist gets
  the cleared date). His data: 24 of 38 overdue.
- Added: No date todos that serve a stale goal or carry P1 to P3, up to 5 and
  the week's spare room (3 a day).
If the brief writer is ever rebuilt, it may hand the same list on the brief row.

**Built as planned, plus** (Tom, 2026-11-16: "operate as if a user does not
have todoist", and he picked "a box per goal"): each open goal with nothing due
this week comes first, under For your goals, as its open task to schedule or a
box to type its next step (read like the task line, saved with `aim`, a typed
day beats the chip). Every kept line's day is a chip that picks any day of the
week. A goal step's tick fills only once it has words. The list redraw waits
while a step box has the caret and while a menu opened from the card is up
(`DRAW_HELD`). `{lifeos:1, show:'week'}` opens Upcoming with the draft forced
open, even after it was handled: the home screen's PLAN THE WEEK.
**Goal health's rule is `shared/goals.js` since 1.0.31**, read by QUESTS and
the home screen's THIS WEEK card; change the rule there, never here.
Tested in headless Chromium at 1280 and 390 by clicking, with no Todoist rows;
not run in WebKit.

**What moves a goal** (Tom, 2026-11-16, "1A"; 1.0.32): the goal sheet's
Moved by row picks Tasks, Training sessions (a week), A lift (estimated 1RM to
reach, lb or kg), A measure (a STATUS field to reach) or A habit (a BLOCK
activity's days a week), saved as `aim.src`; a measure keeps where it stood
when set as `src.start`. The rule is `shared/goals.js`. A fed goal shows its
data line instead of the task line, skips Add a task, and gets no step box in
the week draft. TRAIN's brief lists "goals tied to sessions" as turned down
inside TRAIN (2026-09-14); this lives in QUESTS and Tom picked it.
**On the phone, not yet changed** (Tom, 2026-11-16: "does not feel like it
was designed for mobile at all"): at 390 by 664 the first task sat at 756px,
below the screen, under the header, the view strip, the 135px add box, the
week draft and the goal card; rows 73 to 92px with date, source, project and
label. Fixes offered as a pick list with a mockup; build only what he picks.

**Built, 1.0.33** (he picked 1 to 4, plus Todoist's hold): under 600px the
view strip and the add box go; tabs at the bottom (Today, Upcoming, Inbox,
Goals, More: Calendar, projects, labels); a gold + by the thumb opens the add
line above the keyboard (`--kb`) with a veil that closes it; the week draft and
today's goal are one line each (`.pline`); rows lose their source word and
buttons; a hold opens the task sheet (`quickSheet`): Today, Tomorrow, This
weekend, Next week, No date, Pick a day, P1 to P3 and None, each one tap with
Undo, then Move to, Serves a goal, Edit, Complete, More, Delete. Past 600px
nothing changed. Measured at 390 by 664: first task 756px down to 241px, rows
62px. Review 212 of 212 in WebKit at 390.
**Your own AI, 1.0.34** (Tom: "give people an option to log into their Claude
or chatgpt"): no app can sign in to someone's Claude or ChatGPT subscription,
so the week draft has CLAUDE and CHATGPT (copy a prompt of goals and up to 40
open tasks, each named by a five-letter hash of its key, and open the site) and
PASTE THE PLAN (reads "Day | [id] task | ^goal" lines, moves or adds them, one
Undo). Main Menu's PLAN WITH CLAUDE stays the one-press version.
**Make it smaller, 1.0.35** (Tom picked "B" of the off-track safeguards): a
goal off for three weeks (`Goals.stuck`: a count under half three full weeks
running, tasks with nothing done in 42 days, a measure off track at 21 days
old) shows one line under its call: Make it N a week (one past his best of
those weeks) or Give it 4 more weeks, and Keep it (`keepUntil`, 21 days). Not
while his own call is set. A softer word for Off track (A) and the last win
(C) were not built; a fuller Fresh start is being designed with him.

## Needs from the foundation

Nothing waiting. (Marks floored to 3 to 1 on all four grounds by `skins.js`, 2026-10-22.)

## New chapter (Tom, 2026-11-16; 1.0.36)

"A much more comprehensive restart feature", "blocks, similar to TRAIN", each
app its own reset point with overlap, called new chapter; 3A plus "a mass set
date one by one mode"; 4A. The rule is `shared/chapter.js`.
- **Where:** Goals screen, top, New chapter beside the current chapter's name;
  the home screen's NEW CHAPTER card (`show: 'chapter'`); and on Today one
  line, Start a new chapter, once nothing has been written or ticked for 14
  days (`QUIET`, machine-written todos left out) and no chapter began since.
- **The sheet:** a name (optional); Starts (Today or a day); Each app counts
  from (The start, Last 8 weeks, Everything, or a day) for every app in
  `Chapter.APPS`; each open goal adjusted one by one (its words, Keep or Drop
  it, its date, its number a week or its target); and the overdue tasks: All
  to the Inbox (default), One by one, or Leave them. One Undo takes it all back.
- **Goals count from QUESTS's chapter day** (`Goals` `cutOf`): a week wholly
  before it is blank, a done task before it is no last win, a goal is "new"
  for its first week in the chapter, Make it smaller waits three weeks inside
  it, and a measure's pace line starts there.
- **One by one** (`oneByOne`): one task at a time, Today, Tomorrow, This
  weekend, Next week, No date, Pick a day or Skip, "3 of 24"; one Undo when it
  closes. Also beside Reschedule on every Overdue heading.
- **What the last chapter held** (1.0.38, Tom picked A): the sheet opens on
  number tiles for the chapter ending now, since its start, or the last 8 weeks
  with none (`chapterWins`): training sessions, the most in one week, tasks
  done, goals reached, days logged in STATUS (a phone's own steps left out),
  blocks and habits ticked. A zero tile is left out; nothing shows nothing.
  Numbers and the behaviour only, never praise (self-efficacy).
- **Days that feel like a new page** (1.0.38, Tom picked B): Starts offers
  Today, Next Monday, The 1st of <next month>, or a day (`chapterDays`). A
  chapter set ahead starts counting on its day; the Goals head says "next
  from <day>" until then.
- Tested in headless Chromium by clicking; review 197 of 197 Chromium and 212
  of 212 WebKit. STATUS (1.0.98) and BLOCK (1.0.26) read from a new chapter
  too; TRAIN does not, it counts in training blocks (Tom).

## Vision goals (WOOP; Tom, 2026-11-17: all ten points, joined to the week plan and plan tomorrow; 1.0.39)

Every goal may carry a WOOP (wish, outcome, obstacle, plan): `aim.woop =
{outcome, obstacle, if, then, odds, oddsWs, pic}`, typed in the goal sheet
under "Plan for it", saved by merge. The rule is `shared/goals.js`, WOOP.
- **Obstacle inside him** (point 7): an obstacle naming only the world
  (traffic, work, clients) gets one amber line asking what he does, thinks or
  feels; never refused (`Goals.inner`).
- **`wrun` rows** (key the aim key, dated): `{ran, cue, kept, t}`. Run through
  (goal row, Today's goal, the goal menu) shows picture, obstacle, if, then and
  RAN IT. At the cue time, KEPT IT / NOT TODAY on the goal; KEPT IT ticks the
  `woop-<aim>-<day>` todo, NOT TODAY sets it aside; one Undo. A ticked cue
  todo anywhere counts as kept unless he said NOT TODAY (`Goals.keptOn`).
  "Kept N days" is the record; no score.
- **Week draft** (point 10): Your plans this week, per goal with a WOOP: last
  week's kept and planned days, "Still the obstacle?" with Change the plan,
  odds 1 to 10 (`woop.odds`, `woop.oddsWs` the week). Odds 4 or less: "Make
  this week's step smaller", Make it N-1 a week for a count goal, else
  Change the plan. The draft shows for WOOP goals even with nothing to move.
- **Money and work numbers** in Moved by: Money (a savings pot or income this
  month; shown only where WEALTH rows exist, so never for a client) and Work
  numbers (Skool members, posts a week from OUTER HEAVEN, revenue this month).
  Members and revenue have no feed: the goal menu's Type members now / Type
  revenue today writes a `pnum` row (QUESTS and OUTER HEAVEN both write it).
- **The cue time is set in HOME's Plan the day**; ROOM's wallpaper shows the
  cards. Tested in headless Chromium at 1280 and 390 by clicking, demo goals.
- **As NOTICE windows** (Tom, 2026-11-17: "Both, we can expand NOTICE to be
  able to accommodate WOOP. Notifications can be pop ups"; 1.0.40): Run
  through shows the goal as a NOTICE quest (`Notice.woop(Goals.card(a))`,
  Block style, no made-up rewards) with SAVE PICTURE (share sheet, else a
  download) and RAN IT. At the planned moment, with QUESTS open and visible, a
  NOTICE notification pops up (`Notice.cue`, `cueCheck` every 30 s and on
  coming back) with NOT TODAY / KEPT IT; once per goal a day on that page,
  never closes itself.
- **WOOP is desktop work** (Tom, 2026-11-17: "no phone layout, this is
  strictly desktop work"). Design and test the WOOP screens (goal sheet's
  Plan for it, Run through, the cue pop-up, the week draft's plans, HOME's
  YOUR PLANS, ROOM) at desktop sizes (1920 x 1080, 3840 x 1080); no phone
  layout work for them. Checked at 1920: cue pop-up, Run through, SAVE
  PICTURE, RAN IT.

## Today's filter (Tom, 2026-11-17: "I may not want all of today's tasks visible at a glance"; 1.0.41)

- A Filter button over Today's list opens a picker beside it (a dialog on a
  phone): Project, Priority, and Label while any label is on today's todos,
  each with how many of today's todos it holds. Any pick inside a field,
  every field across. Claude's call from his data (29 todos due today or late
  on 2026-11-17: Skool 10, Tom 8, Content 8; priorities on 16; 2 labels).
- Filtered-out todos are hidden, not dimmed (he said "not visible"); nothing
  about a todo changes. Overdue, today and Completed all obey it; BLOCK's
  blocks do not.
- With a filter on, one gold-edged line says "Showing #Skool. 12 hidden."
  with Change and Show all. Show all keeps the picks for the next time.
- The setting is `quest.todayFilter` = `{on, proj, pri, tags}` (`''` no
  project, 4 no priority). The rule is `shared/journal.js`
  (`Journal.filterShows`), read by the home screen's NEXT card too.
- The side's Today count still counts every todo due.
- **The name on screen is "vision goals"** (Tom, 2026-11-17: "Change the term whoop to vision goals"; 1.0.41). Never print WOOP to him; code keeps `woop`, `wrun`, `Goals.hasWoop` so no data moves.

## Main quests (Tom, 2026-11-24: "the best quest input flow"; 1.0.43)

Main quests are month and year projects that daily quests move; they are the
`aim` rows, three open at most. On screen: Goals is "Main quests", a task
serving one is a daily quest. Vision goal stays the WOOP's name.
- **New main quest** (`questFlow`): one question a screen. THE QUEST (words,
  1 month, 3 months, 6 months, 1 year, Longer for 5 and 10, a date, the
  ^name), FINISH LINE (`srcPicker`, "Daily quests only" is no feed),
  CHECKPOINTS (three, dated a third apart, numbers filled from start to
  target when the feed has both), WHAT STOPS IT (outcome, obstacle, if,
  then), DAILY QUESTS (up to three tasks, parsed like the add bar, `aim` set,
  due today when no day is typed), then the quest as a NOTICE window and
  ACCEPT QUEST, which writes the aim and the tasks with one Undo. The middle
  three can be skipped. Editing a quest is the full sheet (`aimSheet`), which
  now edits checkpoints too.
- `aim.cp` = `[{d, text}]`, the checkpoints. Not `marks`: that is the health
  calls. The row shows the next one still to come.
- `3m` horizon added, reviewed monthly.
- The Main quests screen is one Open list (longest horizon first) and a
  numbered "New main quest" slot per quest still to set.
- ROOM's cards (`Goals.cards`) and HOME's Plan the day already read `aim`
  rows, so they follow main quests with no change.
- Tested by clicking in headless Chromium at 1280 and 390: the whole flow,
  Back keeping answers, the inner-obstacle line, the row it writes, the two
  tasks and their ^name; no errors, nothing sideways. WebKit review 232 of
  232.
