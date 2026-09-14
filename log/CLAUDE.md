# LOG

The journal module. The last few weeks of bullets, set inside the year around
them.

This brief governs `log/` only. It obeys the master brief at the repo root and
may add rules but never contradict them. Where the two disagree, the root wins
and this file is the bug.

**Tom only, and a desktop app.** On the home screen since 2026-09-13, and in
`DROP_APPS` in `tools/build-client.py` so no tester sees it.

**It started life as YEAR**, from a build prompt written in Claude chat for
React and Vite. Tom, 2026-09-13: *"don't let it override design settings we've
established."* So colours are theme tokens, not its hex codes; there is no
localStorage blob; the header and buttons are the suite's. Renamed LOG the
same day, when it became the view over STATUS's journal: STATUS's
`NOTE_KINDS` had already been routing entries, events and ideas "to LOG, the
journal module" before this app existed.

---

## FUNCTION, in one sentence

**It shows your STATUS entries en masse, over weeks and months, so you can
see whether you kept going.**

Tom, 2026-09-14: *"LOG is like a way to view my STATUS entries en masse."*
STATUS records one day at a time; LOG lays the days side by side: the
bullets, the day's line, and every measure STATUS tracks as a column.

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

**The summary** next to each date is the `note` field of STATUS's `day` row,
which nothing else in the suite writes any more. It is merged in, so the
row's `rest` flag survives. STATUS already counts a day with a note as a day
you turned up for.

**Week and month summaries** are LOG's own `recap` rows, key `week` or
`month`, dated on the period's first day. Tom, 2026-09-13: day summaries
visible zoomed out, "same idea for weeks and months". Written by clicking the
week or month block, shown under its count with as many lines as the block
has room for.

**The day graph** is read from STATUS and never written. Mood and energy are
STATUS's scale fields: each reading is a dot placed by the time of day it was
logged, joined into a line, scaled 1 to the field's top. Caffeine is STATUS's
own half-life model (`remaining()`), copied: every dose, typed or read off a
meal's label, decays at the field's half-life and the line is what is still
in you, sampled every 15 minutes, doses from the day before included. Its
scale tops out at 400mg, the daily ceiling the US FDA and the EU's food safety
authority give for healthy adults, and stretches past that on a day that goes
higher. No caffeine field with a half-life in STATUS, no caffeine line.

**Where a day's graph starts.** Tom, 2026-09-13: *"Check weight, bullets, or
sleep - whatever came first, use that as the start of the day for the
graphs."* The left edge is the earliest weigh-in, sleep entry or bullet that
day (whatever the filter shows), the right edge is midnight, and a day with
none of those starts at midnight. It always spans at least six hours, so a day
whose first line was at 11pm is not a graph one hour wide. Readings logged
before the start are not drawn. Mood and energy are drawn fainter than
caffeine, at his request.

**The time** on each bullet follows STATUS's row: the time typed into the line;
a ticked todo's Done time; an open todo's start, or "by" its Done time; and for
anything else with no time of its own, when it was written, drawn quieter.

## Ownership, and writing

LOG owns **two row types**: `recap`, what he wrote about a week, month,
quarter or year, and `cell`, one day's entry in one of LOG's own text columns
("What got done today"), kept apart from `day.note` on purpose. It also reads
and writes `note` and the `note` field of `day`, whose shapes STATUS owns,
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
declares only `recap` and `cell`, so LOG never sees that warning. The merge
rule above is the discipline, not the warning.

The backup registers `note`, `day`, `recap` and `cell`, or a restore of LOG
would restore nothing.

Every other STATUS figure in the day columns (each measure, Calories, Protein,
Spent) is read and never written.

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
| Week groups are 1–7, 8–14, 15–21, 22–28, and the rest of the month (29 to the end) as its own small group. Not Monday weeks. | Tom, 2026-09-13 |
| A summary text field next to each date. | Tom, 2026-09-13 |
| Behind each day, a mood line and an energy line placed by the time of each reading, and caffeine. | Tom, 2026-09-13 |
| Caffeine is drawn as what is still in you through the day, with a dot per dose, not as a new way to log it. STATUS already logs it. | Claude, 2026-09-13 |
| The summary looks like text until pointed at or typed in; the word "Summary" shows only on today, the row under the pointer and the box in use. Enter saves, Escape puts it back. None on future days. A redraw waits while a summary is being typed. | Claude, 2026-09-13 |
| Graph dots show their time and value on hover. Lines are faint, behind the summary and bullets, midnight to midnight. A Graph group in the filter bar turns each line on or off, with a colour swatch beside each word as the legend. | Claude, 2026-09-13 |
| Zoomed in, a day is at least `dayHeight` tall and grows to fit its bullets. Only possible because months and weeks have stepped aside by then, so nothing has to line up with it. | Claude, 2026-09-13 |
| The opening zoom is the largest at which the last 42 days fit, but never less than readable. On a busy stretch it shows fewer days rather than hiding the bullets. | Claude, 2026-09-13 |
| The time leads each bullet, in its own right-aligned column. STATUS puts it after the words; LOG is read down the clock. | Claude, 2026-09-13 |
| Adding: ADD in the header for today, a click on any readable past or present day, or its right-click menu. Enter adds and keeps the box open for the next line, an empty Enter closes. In LOG every kind is one line, so there is no prose exception. | Claude, 2026-09-13 |
| Editing puts the time back into the words ("Trained legs 7:30am 1h30"), so saving without touching it keeps it. | Claude, 2026-09-13 |
| Ticking a todo in LOG marks it done today, whichever day it was written on. | Claude, 2026-09-13 |
| With months and weeks aside, the day column carries them: a line at each Monday, a stronger line at each 1st, and the label names the month on the 1st and the year on 1 January. | Claude, 2026-09-13 |
| TODAY and WHOLE YEAR buttons, so zoom is reachable without knowing the wheel does it (DOCTRINE law 6). Text, because `shared/icons.js` has no zoom drawing. | Claude, 2026-09-13 |
| Weeks are labelled by their dates, `5–11`, never by week number. | Claude, 2026-09-13 |
| On the home screen. | Tom, 2026-09-13 |
| Day summaries visible zoomed out, and written summaries for weeks and months too. | Tom, 2026-09-13 |
| Mood, energy and caffeine are switches, like the bullet kinds. | Tom, 2026-09-13 |
| Bullets sit below the date and summary, not in a column beside them. | Tom, 2026-09-13 |
| Mood and energy more transparent. | Tom, 2026-09-13 |
| A day's graph starts at its first weigh-in, sleep entry or bullet. | Tom, 2026-09-13 |
| Three zooms: far (months and weeks with counts and summaries, days as texture), small (the same, plus each day's date and summary on one line), near (the journal). | Claude, 2026-09-13 |
| Every filter is a labelled switch in one Show row, bullet kinds then graph lines, then Sort. Supersedes the chips. | Claude, 2026-09-13 |
| The day's words start in one left edge: the date column is `--s-8` wide and the time column `--s-7`, so the summary and every bullet's words line up. Lines capped at 80 characters. A day with bullets gets more space above and below than between its own lines. Supersedes the time-first column layout. | Claude, 2026-09-13 |
| Months and weeks columns are between `--s-10` and twice that, 15% of the window between, so a summary is readable. | Claude, 2026-09-13 |
| Zoom is seven steps, nothing between: Day, 2 Days, 3 Days, Week, Weeks, Month, Quarter. Supersedes the free zoom. | Tom, 2026-09-13 |
| Clicking a box opens it; clicking its name, dates or count opens its summary. For days, weeks and months alike. Supersedes "clicking a day adds a bullet". | Tom, 2026-09-13 |
| A step is how many days fill the screen: Weeks is 2 weeks, Month 31 days, Quarter 92, so the longest month and quarter fit whole. A wheel notch is one step, toward the pointer. A strip of the seven in the header shows the step and is the way to it without the wheel. WHOLE YEAR is gone; Quarter is the furthest out. | Claude, 2026-09-13 |
| Opens at Month, today on the bottom edge: the step nearest the three to eight weeks the app is for. Supersedes the 42-day opening. | Claude, 2026-09-13 |
| Opening a week group goes to Week, or to 2 or 3 Days for the short groups at the end of a month; a day to Day; a month to Month. The box's first day goes to the top. | Claude, 2026-09-13 |
| ADD writes to today, or to the open day when the step is Day. A bullet can also be added from any day's right-click menu. | Claude, 2026-09-13 |
| The written summary on a week or month block also opens its summary box, and the name, count and summary underline under the pointer. | Claude, 2026-09-13 |
| Days and entries clearly different: a day is a heading band on its own surface, date large in the display face, summary beside it; bullets sit below on the page colour, indented, in the reading face. | Tom asked, Claude designed, 2026-09-13 |
| Text sized for a PC: bullets and summaries at `--f-4`, dates at `--f-5`, side-column names at `--f-4`. | Tom, 2026-09-13 |
| A Year view after Quarter. | Tom, 2026-09-13 |
| Clicking the view that is already on flips the days between oldest first and newest first. A "Newest day first" switch in the bar shows and sets the same thing. Newest first puts today at the top. | Tom asked, Claude added the switch, 2026-09-13 |
| A day is never cut off and never has to be opened to be read: a busy day grows. Supersedes exact day heights. Each view snaps to start on a whole day. | Tom, 2026-09-13 |
| Notebook view: the view's days across a left and right page, like a bullet journal notebook, spreads one under another, each at least a screen tall. 2 Days is always a notebook; Day, 3 Days, Week and Weeks follow a Notebook switch, shown only on those views. Day puts the day on the left page. Week is one week group per spread; Weeks is two (1–14, 15–28, then the rest). | Tom, 2026-09-13 |
| Side columns are every unit bigger than the view: Week and Weeks show weeks; Month months and weeks; Quarter quarters and months; Year the year, quarters and months. None in the notebook. Quarter and year blocks have summaries too. | Tom, 2026-09-13 |
| A side block is placed from where its first and last day actually are on the page, so it lines up with days of any height, in either order. | Claude, 2026-09-13 |
| Side column widths drag from the heading's right edge like a spreadsheet, and a double-click puts one back. Remembered per column. | Tom, 2026-09-13 |
| TODAY goes to today and never changes the view. In Day it shows today's day. | Tom, 2026-09-13 |
| The word "Summary" appears nowhere on screen. | Tom, 2026-09-13 |
| Month names in full. Week groups read "Week 1: 1–7". | Tom, 2026-09-13 |
| The wheel scrolls. Mouse 4 zooms in one view and Mouse 5 out, toward the pointer, with the browser's Back and Forward stopped. A held left or right button drags the page. Supersedes the wheel zoom. | Tom, 2026-09-13 |
| A left-button hold no longer opens a menu, because holding is panning. A right click without a drag still does; a right drag swallows its menu. | Claude, 2026-09-13 |
| Snap: when a scroll or drag stops within a fifth of the screen of an edge, the view glides onto it. The edge is a day in Day to Weeks, a spread in the notebook, a week in Month, a month in Quarter, a quarter in Year. | Tom asked, Claude chose the edges, 2026-09-13 |
| Everything a day or a block says starts at one left edge: dates take the width of the widest date, measured; block name, count and writing are each on their own line. Day labels no longer carry the month; a month heading sits above the first day of each month. | Tom, 2026-09-13 |
| The timeline runs from the first record (the earliest dated journal line, day, measurement or meal) to today. Nothing before or after. A start date can be set in Settings. | Tom, 2026-09-13 |
| Settings has a LOG tab: which view it opens on, when the timeline starts, text size (Normal, Large, Larger), the filter bar on or off, the caffeine scale top, and a column width reset. | Tom asked, Claude chose the settings, 2026-09-13 |
| Side blocks alternate between two surfaces, bigger units take the stronger line, there is room inside, and the count is quieter than the name. | Claude, 2026-09-13 |
| Clicking a name (a date, a week, a month, a quarter, a year, or a month heading) opens it. Clicking the space beside or below it is for writing about it: a day's line takes the cursor, anything bigger opens a box. Supersedes the previous click rule. | Tom, 2026-09-13 |
| Mood, energy and caffeine switches live in Settings (Day graph), not the filter bar. | Tom, 2026-09-13 |
| Day columns beside the days: "What got done today" (a text box per day, stored as a `cell` row, separate from the day's line), and the day's average Mood and Energy from STATUS. Renamable, resizable, and in his order: drag a heading sideways, or right-click Move left/right. The Days column moves too but cannot be hidden. | Tom, 2026-09-13 |
| Right-click a column heading to hide or show columns, like Windows Explorer. Side columns are hidden per view (Quarters in Year, say); day columns everywhere. The same switches are in Settings, so the right click is a shortcut, not the only way. | Tom asked, Claude chose per-view for side columns, 2026-09-13 |
| Right-click the view strip to choose which views are offered. The mouse side buttons skip hidden views, opening a box lands on the nearest offered view, and one view always stays. Also in Settings. | Tom, 2026-09-13 |
| Blank space on a day adds a bullet. Blank space on a bigger block still opens the box to write about it. Supersedes blank-space-writes for days. | Tom, 2026-09-13 |
| A new bullet always starts as an Entry; the last kind used is no longer remembered. | Tom, 2026-09-13 |
| In the notebook, a day's other columns sit under its bullets, each with its name, and an empty mood or energy is not shown. | Claude, 2026-09-13 |
| The column headings are always drawn on the timeline, because the day columns have names even in views without side columns. | Claude, 2026-09-13 |
| Every STATUS measure is a day column, read off STATUS's field list, so a measure added in STATUS appears here unasked; plus Calories and Protein from meals and Spent from purchases. Each day's figure follows STATUS's own rule (last, average or total, food-label amounts included) and its tile's formatting. Supersedes the separate mood and energy averages. | Tom, 2026-09-14 |
| What got done, Mood and Energy show until hidden; every other column starts hidden and is shown by right-clicking a heading or in Settings. Earlier mood and energy settings carry over. | Tom asked to see them sometimes, Claude chose the defaults, 2026-09-14 |
| Mouse 4 zooms out and Mouse 5 zooms in. Supersedes the reverse. | Tom, 2026-09-14 |
| A day's name is built in Settings from parts: year, month number (M9), week of year, day of week, day of year, weekday, date, month, with "Out of" adding totals. Always in that order, numbers first, joined with commas: "2026, M9, Week 37, Day 256". Default stays "Sun 13". A preview shows today's name. | Tom, 2026-09-14 |
| Weeks of the year count from January 1 in sevens by default, matching his month week groups; Settings switches to ISO weeks (Monday start). Either way a 365-day year has 53 weeks, so the total reads 53, not 52. | Claude, 2026-09-14 |
| The column right click is only about the column clicked: Hide column, Rename, and "Show or hide columns", which opens one box of switches. Move left and right are gone; moving is the heading drag, which now fades the heading, carries a copy under the pointer and shows a bar where it will land. Supersedes the long menu. | Tom, 2026-09-14 |

## Found in STATUS, not fixed

Reasoned from the code on 2026-09-13, not watched: **editing a timed entry,
event or idea in STATUS drops its time.** STATUS's line editor fills the box
with the words only, and on save sets `at` to whatever time is typed in the box
or, for anything but a todo, nothing. So correcting "Trained legs" to "Trained
legs hard" wipes the 7:30am. That is STATUS's folder, so a STATUS session
should confirm and fix it. LOG's editor avoids it by putting the time back into
the words.

## The layout rule

Each view is a number of days that fill the screen (Day 1, 2 Days, 3 Days,
Week 7, Weeks 14, Month 31, Quarter 92, Year 366). That sets `dayHeight`, the
least a day may be. A day grows past it to fit its bullets, so no day is ever
cut off. Side blocks (weeks, months, quarters, the year) are not calculated
from `dayHeight`: each is placed by measuring where its first and last day
actually sit on the page, which is what lets them line up with days of any
height, oldest or newest first. Week groups start on the 1st, 8th, 15th, 22nd
and 29th of every month. Every position the mouse or TODAY needs is read off
the page, not worked out.

## Build steps

Everything planned is built. Two ideas from the first prompt were dropped,
not postponed:

- **Colour by count** (one colour, darker as a day's count rises). Superseded
  once days became readable: the bullets themselves show a busy day, and a
  busy day grows.
- **The right-hand panel** for reading a day. Superseded by bullets that are
  read, added and edited in place, and by the Day view.

Open, and not LOG's to fix:

- `menuAt()` in `log/index.html` works around the shared menu closing before
  its items can be clicked on a PC (root brief, Foundation item 10). Delete it
  when `shared/ui.js` is fixed.
- `shared/icons.js` has no `app.log` drawing, so the home screen dock shows a
  plain character for LOG.

Never watched, only driven from code: a real wheel scroll stopping and
snapping, real Mouse 4 and 5 presses, real mouse clicks on menus, and LOG
against Tom's real data.
