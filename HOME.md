# HOME, the home screen (HOME.md)

The history of `index.html` at the root. Not loaded automatically: read it
before touching the home screen.

## History, moved from the root brief on 2026-09-22

What was built and watched, newest last. Moved here verbatim so the root brief
stays small enough for per-module sessions.

Home screen. On the shared foundation as of 2026-08-20: skin tokens, bottom tab bar on a phone, sheets instead of its own modal. Widget grid still drags and resizes with a mouse; a phone gets a REARRANGE mode instead. Since 2026-09-14 the roster's order is the default dock, set by Tom: HOME, BLOCK, STATUS, LOG, QUESTS, TRAIN, CHECK IN, STYLE, then Tom's own apps (ARC, WEALTH, FORM, FOODDÉX, flagged `mine`) behind a thin line with no label and no tooltip. Tom, 2026-09-14: "I don't want a Tom Only... I know who I am." Nothing on screen names the group. The order is kept inside each group and nothing moves across. A saved order lives under the setting `dockOrder`; the older `dock` is ignored, because it was the old default rearranged. Buttons carry icon and name with the number key in the tooltip, and a window from 821 to 1400px wide shows icons only. Also 2026-09-14: the grid packs densely, so a short widget beside a tall one leaves no empty band; WEIGHT draws its line through the actual weigh-ins with no average, and its big number is the latest reading; TODAY and TODO follow STATUS's day rule including QUESTS's `due` (a todo dated for later is not on today, No date is not on today) and tick the way STATUS and QUESTS do, a repeat doing a round (`tickTodo`, `repeatAfter` are copies: change all of them); the tick buttons draw the shared `done` icon with a 44px target. Since 2026-09-15 (1.0.5): cards are `mb-card` and rows `mb-plate` in the block's colour or the widget's app's; every app has a colour slot from the chart ramp, worn by its dock icon, its tile and its widgets; app icons are 20px at a heavier stroke; `shared/icons/<app>.png` is the iPhone home-screen icon, linked by mobile.js. BESIDE (1.0.6, 2026-09-15): up to three measures on one date axis, one strip each on its own scale, picked from the widget's menu: STATUS's fields, the day's training volume, the day's spending, and how much got logged. No verdict. LINKS (2026-09-17): every app's address on the web, in two groups — MINE, the full suite, and CLIENTS, the seven apps a client gets. Tapping a row copies that address and the button beside it opens it. Both lists come off the APPS roster and the `mine` flag, so an app added later is in both without editing it. Tom's own: `DROP_WIDGETS` in tools/build-client.py takes it out of the client copy, and nothing on it says Tom Only, the way the dock's line has no label. TIMER (1.0.13, 2026-09-17): a preset SETS the timer rather than adding to it, because "Clicking 3m Should set it to 3 minutes" and adding meant there was no way to ask for the one thing written on the button. With nothing running one press does it; with a count in progress one press only says what it is about to do and a second inside three quarters of a second carries it out, which is Tom's "make it need a double tap if we want it to override a currently running timer". 1.0.12 stacked on the second press instead, which was Claude's idea and protected nothing. SET reads half minutes: 10, 2.5, 0.5 and 1:30. 1.0.14, 2026-09-17, two Tom reported together. NOTICE went missing from the dock at some window widths: the names came back above 1400px, the row grew past the window, and `overflow-x:auto` with a hidden scrollbar slid the last apps off the right edge with nothing on screen saying so. NOTICE is thirteenth of fourteen, so NOTICE is what vanished. The 821-to-1400 band was the bug, because it had a floor: it is a ceiling now, names under 1700px only, and under 1150px the wordmark, the clock and the words on WIDGET and DATA go too, so everything that is not an app gives way before an app does. `fitNav` stays as the belt and braces and fades the right edge if a future app overflows even the icons; it reads in a zero timeout rather than straight away, because nav is a flex item with its own scroll box and an immediate read is of the layout one class ago, and never on requestAnimationFrame, because a minimised or covered window gets no frames. Watched with nothing cut off at 830, 1000, 1100, 1150, 1300, 1400, 1700, 1800 and 1920. And "Main Menu on phone should only show Phone apps": the roster carries a `phone` flag now, which is hard constraint 10 written down, so the thumb bar is HOME, STATUS, QUESTS, TRAIN, CHECK IN, NOTICE and SPEAK and the desk work is left to the desk. At 375px that is seven buttons of at least 47x54 with no label clipped, against fourteen of 26px before. 1.0.15, the same day, three more Tom reported together. The TODO widget names each task's source, which was asked for in the same breath as "why does pay skool show up twice" and is half the answer to it: two rows reading alike are two apps' idea of one job, and nothing on the row said so. A project name beats the app name where there is one. The TODAY widget's tick moved to the left, where TODO already had it and where a box does not drift with the length of the row above. And LIFE got the three things it was missing: Set age, Set birth year and Set how many years on the card's own menu (not on a year square, which nobody would find), a colour per band picked from the theme's six chart slots, and a legend saying what the bands are FOR — YOUNG, MIDDLE, TOO OLD FOR A LOT, each with its range. Watched at 1400px: the menu, the colour submenu, a colour change landing, and the legend reading back. 1.0.16, the same day: bullets are drawn through `shared/journal.js` like everywhere else. Tom: "All bullet entries should look the same regardless of where." STATUS, LOG and QUESTS all drew one through the shared renderer and the home screen was the odd one out, building its own row out of a plain span, so the same line wore a different face depending on which screen you looked at. TODO, IDEAS and EVENTS now use `bulletRow`, which is `mb-bullet` with the mark in a `.k` and the words in a `.tx` — the same contract, and asking journal.js for either half brings its stylesheet with it. Watched: the mark and the words come out byte for byte identical to what STATUS builds for the same row, and a todo two days old draws the `>` arrow rather than a box, which is the rule STATUS has always followed and the home screen never did.

## 2026-09-23, HOME 1.0.26: the dock and clock vanished on refresh

`fitGrid` picked cards with `.w`, and `Chart.header` draws its date line as `.w` too. With chart widgets holding data, the extra nodes threw during boot, so `go()`, the dock and the clock never ran; clicking MAIN MENU ran `go` again. Cards are now `:scope > .w`. Select cards as direct children of `#grid`, never by class alone.

1.0.29, 2026-09-23: LINKS hands out every address with `?fresh=1`, so the app it opens is fetched new rather than from the phone's copy. Tom: "Update the link widget to always force new copies." `shared/CLAUDE.md`, Fresh copies, has how.

## 2026-09-24, HOME 1.0.31: a fixed grid, and BODY HEATMAP

Tom: "Rather than resize my widgets when I resize my window, I just want more space to work with." One cell is now a fixed size, the setting `lifeos.cell`, captured once from what the stretched board gave at the window open that day (clamped 100-200px wide, 72-140px tall). The window only sets how many columns there are (`COLS`, never fewer than the cards use): wider adds empty columns on the right, a narrower window scrolls sideways instead of moving cards. Everything that said 12 now reads `COLS`. Phone unchanged. (Since 1.0.34 the cell is the constant `CELL` in index.html and `lifeos.cell` is not read; see below.)

BODY HEATMAP ("Widget - Body Training Heatmap"): TRAIN's working sets over 7, 14 or 30 days on a front and back figure, brighter for more sets, with a ranked list. Counted like TRAIN's WEEKLY (warmups out, today's sets once done, `exercise.also` shares). Muscle-group names are read onto the body by `BODY_RULES`; an unreadable group other than cardio is listed as "Not on the body". `setIsWarm` copies `TRAIN.noteWarm`: change both.

## 2026-09-25, HOME 1.0.33: FORGE in the roster

FORGE, the program builder (`forge/CLAUDE.md`), is in `APPS` after COACH (built as 1.0.32 on its branch; SHEET took 1.0.32 on main first), flagged `mine`. It sits behind the dock's line with Tom's other apps, and the client build's `DROP_APPS` removes it.

## 2026-09-25, HOME 1.0.34: the widget grid, fixed three ways

Tom: "fix the widget system." Three causes, found by reading the Main Menu program's own store and measuring the same state here.

- **Rows were 140px, not 84.** 1.0.31 took the cell from the window once and saved it as `lifeos.cell`, but counted the tallest card as the whole board when the cards had no spots yet, so rows locked at the 140px cap: TODAY stood 688px tall and the board ran 3,628px in a 939px window. The cell is now a constant, 146 x 84 (what the 12-column board gave on his 1920px PC, and the row any board too tall for the window had). `lifeos.cell` is no longer read, which also ends the first device to open deciding the size for all of them.
- **Opening saved the layout.** `fitGrid` saved whenever it worked out spots or pushed a card down, so a device opened before its synced rows arrived saved the factory layout stamped newer than his real one, and sync carried it to every device. The Main Menu program did exactly that at 12:44pm today. Now the layout is written only when he moves, resizes, adds or removes a card; spots worked out on open, and push-downs from a `fit` card that grew, stay in memory.
- **A layout from another device showed only after a reload.** `reloadLayout` reads the row again on every store change and redraws with it.
- **On a phone every card was 72px tall** with the rest cut off, since 1.0.23: the desk's fixed row height reached the stacked cards. Phone rows are `auto` now.

Watched here at 1920x1000 and 390x844: TODAY 408px, no rewrite on open, a synced layout landing while open, a real title drag and corner resize saving, WEIGHT's chart 96px on the phone. His layout on the hosted copy is the factory one as of today; the folder copy's store in the Main Menu program still holds the one he arranged on 21 Sep.

## 2026-09-25, HOME 1.0.35: a widget for everything, and the desk tools

Tom: "Add all the widgets we could have given our suite and functionality. Add some general widgets as well like timers and stop watches and alarms. Test everything." 23 new, 48 in all. ADD A WIDGET is grouped by the app a widget reads (ACROSS THE SUITE, then the apps in roster order, then DESK).

- QUESTS: UPCOMING (dated todos, 7/14/30 days), PROJECTS (open per #project), BRIEF (the PC's morning brief and its todos; `mine`).
- BLOCK: EVERY & ANYTIME (owed, due and coming up; this week's counts; tickable). `rhAddH`, `rhEveryState`, `rhWeekStartH`, `rhAnyState` copy BLOCK's: change both.
- STATUS: MEASURE (any tracked field charted, picked from the widget's menu), MACROS (P, C, F, kcal against targets), MEALS (today's).
- TRAIN: RECORDS (sets TRAIN itself flagged `pr`, in the range), TRAINING BLOCK (the running `phase`).
- CHECK IN: days since the owner's last check-in (`cval`/`checkin` rows without a `pid|`; photos are not read, they are megabytes).
- LOG: ON THIS DAY (a week, a month, three months and a year ago), RECAP (today, this week, last week).
- Tom's own, dropped from the client build with their app: SPEAK, SESSIONS (`sesh`), BILLS (WEALTH's bill todos), POTS (moves summed as WEALTH's `potBal`), ARC (ARC's todos). `mine: 1` does the same for a widget with no app, via `MINE_BUILD`.
- DESK: STOPWATCH (laps), INTERVALS (work, rest, rounds; presets on the menu; 3-2-1 ticks), ALARMS (a setting, `lifeos.alarms`; rings with a sheet, SNOOZE 5 MIN or STOP, on any device with the home screen open), COUNTDOWN (`lifeos.countdowns`), CALENDAR (month, dots, a day's bullets), WORLD CLOCK (cities on the menu).

**The desk tools keep their count in `TOOLS`, not in the drawing.** A widget is redrawn on every store change, so TIMER used to go back to 00:00 whenever a tick landed from another app or from sync. One ticker (100ms) paints every face and rings what is due. State is memory only: a reload stops a running count. What has rung is memory too, never a setting (the live sync trap). A widget's `presets` is the picker's word for ready-made copies; INTERVALS' own presets are `kinds`, after the first name drew four blank rows in ADD A WIDGET.

Also: the phone tab bar held eight apps once SHEET joined and ran to 460px on a 390px phone, SPEAK off the edge; buttons now share the width and CHECK IN wraps. `.chk`'s touch area counts its border, 40px to 44px, on TODAY too.

Watched here at 1920x1000 and 390x844 with seeded rows in every app: all 48 draw, no widget error; TIMER survived a redraw; stopwatch start, lap, stop by mouse; intervals WORK, REST, done chime; an alarm set through its sheet rang at the minute, snoozed, rang again, stopped; countdown, calendar, world clock and measure menus; every tick box wrote its app's row. Review 129/129 both widths. Not seen on his screens; alarms not tested on the phone, where a sleeping phone will not ring.

## 2026-09-28, HOME 1.0.36: KITCHEN in the roster

KITCHEN, the shelf, the week of meals and targets and gaps (`kitchen/CLAUDE.md`), is in `APPS` after CHECK IN. A client app, so no `mine`, and `phone: 1`, so it joins the phone tab bar: nine buttons there now; measured at 390px, each 41px wide with a 44px hit area, the last ending at 386px, the word KITCHEN about 1px wider than its button.

## 2026-09-30, HOME 1.0.37: a faster open, and a complete backup

Part of the foundation's faster open (`shared/CLAUDE.md`, Faster open).

- **One HEAD per app, when its frame is first made** (`probe(a)` in `frameFor` and `openOver`). Every open used to ask for all fifteen app files; a missing one still says so, closes its frame and goes home.
- **`import.js` is fetched on first use** (`needImport`) from beside `io.js`, so a client copy's stamp comes along.
- **A widget that reads TRAIN's sets draws Loading until they arrive**: the card compares `Rec.missed()` before and after `W.sub` and `W.draw`. Sets are kept out of the open now, and "No working sets" before they land would be a lie.
- **Back up everything is every row, from the store** (`Rec.need()`, then `Rec.export()`, plus `IO.localBits`), the same `motherbase-backup` file the nightly backup writes and any app's Restore merges. It used to copy localStorage key by key, which never held a photo or any row the full fast half had moved to IndexedDB, and would have held no sets at all. The home screen's Restore merges that file; an old `lifeos-backup` still replaces everything, as it always did.

1.0.38, 2026-09-30: MOMENTUM removed outright (Tom picked "A" to "remove it"). It showed how much got logged each day, which read as nothing. Revert a87fd42 to bring it back.

## 2026-09-30, HOME 1.0.39: the dock wears the theme

The desk dock was painted a fixed near-black and the logo glowed a fixed ice blue, so on a light theme the dock was a black bar under dark labels. It now sits on the recessed surface (`--surface-2`) and the glow is the accent at half strength. The open app's NAME, on the desk dock and the phone bar, is the reading colour; its colour stays on the icon, the tint and the ring, because a chart colour is picked to read as a line, not as words (Lego's yellow TRAIN measured 1.04 to 1). Lego and Minecraft 2 carry a dock rule in their own CSS putting it on the page colour, the only ground their words were worked out to read on. Measured in all 18 themes and a light test theme, both docks, every button plain and open: 4.5 to 1 or better.
## 2026-10-01, HOME 1.0.40: the reel's board, and a widget menu that says what each one is

Tom: "set the default main menu widget layout to be like in the video" and "put descriptions and customizations in the widgets menu".

- **Default layout** is the board the hype reel filmed (`captures/home.js` HERO in `private/reel`): TODAY 4x7, BODY HEATMAP 4x7, CLOCK 4x2, MACROS 4x3, WEIGHT 4x3, EVERY & ANYTIME 4x5, RECORDS 4x5. MOMENTUM, 4x4 in the reel, was removed on 2026-09-30, so the bottom right of a fresh board is empty. It reaches only a device whose `lifeos.layout` was never saved, or Reset to the default layout.
- **ADD A WIDGET**: every row carries one line saying what the widget shows (`ABOUT`, keyed by widget id) and whether it is on the board. A widget with choices of its own has a gear beside its row; the gear opens its page (what it shows, its choices as 44px chips, ADD TO THE BOARD), and the choices write a draft copy, so nothing on the board changes until ADD. Pressing the row itself still adds at once, so setting up is never a step in front of adding.
- **Choices are `widgetChoices`**: the range (`days`) and any pick list (`sub`) in the widget's `menu`, the same ones its card menu carries. A menu item that opens a sheet (WEIGHT's cut plan) stays on the card: a sheet opened from this one walks history off the page. Seven widgets have a gear: BODY HEATMAP, WEIGHT, UPCOMING, MEASURE, RECORDS, INTERVALS, WORLD CLOCK.
- The old lede said the layout lives on this device only; it has been a synced setting since 2026-09-17.

Watched in headless Chromium at 1920x1000 and 390x844 by clicking: 46 rows, none without a line; BODY HEATMAP's gear, 30 days, ADD put a 30-day copy on the board; WORLD CLOCK's page lists its cities; All widgets goes back. Not seen on his screens.

## 2026-10-01, HOME 1.0.41: BODY HEATMAP as a buff Vitruvian man

Tom: "Make the bodyheatmap widget more aesthetic, like a buff vitruvian man". The flat-panel figure is now Leonardo's: front and back, each in its circle and square, arms out, with the second pose (arms raised, legs apart) as a faint line behind. Muscles are curved shapes that tile a muscular body (`BODY_SKIN`, `BODY_FRONT`, `BODY_BACK`, left half only, mirrored), with faint fibre lines over them (`BODY_LINES_*`). Same counting, same muscles, same list. The two figures stack in a tall card and sit side by side in a wide one (a container query on `.bh-fig`, desk only; a phone card stacks at its own height). Drawn unseen by hand coordinates the first time, so each round was rendered and looked at before the next. Watched in headless Chromium on the demo at 1920x1000 (figures 319x260 each, stacked) and 390x844 (177x177), a 320x200 box went side by side; review 142/142 in Chromium, WebKit 141/142 with only the known foundation-frame failure. Not seen on his screens.

## 2026-10-01, HOME 1.0.42: redundant widgets removed

Tom: "remove all the redundant widgets, make sure we don't lose any actual function." Every widget was read against every other. Removed, each fully shown by another:

- **PROTEIN and CALORIES**: MACROS shows both against their targets. What they had that MACROS did not, how much is LEFT, MACROS now says on every line ("180g left", or "30g over"). Their percentage ring went with them; the bar shows the same share.
- **ARC**: every row it listed is an open todo TODO lists with the same filter, tagged ARC, tickable there.

`RETIRED` maps a saved board's old card to the one that covers it, in the same spot (PROTEIN and CALORIES to MACROS, ARC to TODO), or drops it when that one is on the board already. In memory only; the board is saved when he next changes it, never on open (the live sync trap).

Kept, because each does something nothing else on the board does: TODO (QUESTS todos with No date, which TODAY never shows, plus each task's source and age), APPS (the only way to the desk apps from a phone, whose bar carries phone apps only), IDEAS and EVENTS (across days, not only today), DAY LOG (every tick, including ones no block or bullet made), SLEEP (nights on target), BILLS (bills not yet due), CLOCK and WORLD CLOCK, TIMER and INTERVALS, THE YEAR and CALENDAR.

Watched in headless Chromium: a saved board of PROTEIN, CALORIES, ARC and TODAY opened as MACROS, TODO and TODAY with the saved row untouched; MACROS read "0g / 180g · 180g left"; ADD A WIDGET lists 43 and none of the three.

## 2026-10-01, HOME 1.0.43: BODY HEATMAP shows recovery, and the figure is a 5'8" man

Tom: "Heatmap should also show recovery. Big muscles - 72 hours, Small Muscles - 24-48 ... based on data from TRAIN", "2nd pose should be double bicep pose", "Figure is too bulky, follow golden ratio where applicable, definitely shoulders. Proportion him as a 5'8 man".

- **Recovery** (`bodyRecovery`): each muscle's clock starts at its last working set in the last three days. A set's time is read off TRAIN's key (`local-<base36 ms>-`); an imported set uses the session's end or start, else 6pm. Big (chest, lats, quads, hams, glutes, lower back) 72h; small 24h at 2 or fewer sets that day up to 48h at 6 or more (Claude's split of his 24-48). Recovering muscles are striped, fainter as they come back; the row shows the hours left with the rest clock and wraps under the name when the row is narrow. The widget redraws every ten minutes.
- **Counting today** now copies `TRAIN.counts` (`setCounts`, change both): a saved set counts unless it is a plan still waiting. It used to need the tick, so today's sets were missing since TRAIN stopped ticking on save.
- **The figure** is 156.2 units tall (1 unit about 1.1 cm), the navel at height / 1.618 where the circle centres, and the shoulder caps 1.618 times the waist across. Leaner arms, thighs and calves; round deltoid caps. Made by remapping the 1.0.41 shapes through landmarks (scratch script, not in the repo) and hand-fixing the shoulders. The second pose is a double biceps: forearms up from the elbows, fists at head height.

Watched in headless Chromium on the demo at 1920x1000 and 390x844: four muscles striped with their hours, a set key decoded to the right time, a small muscle at 2 and 6 sets gave 24h and 48h and was clear after 49h, no row overflowing on the phone. Review 142/142 Chromium, WebKit only the known foundation-frame fail. Not seen on his screens.

## 1.0.44, 2026-10-02: no store re-read on every write

The kernel's `wrote` pokes neighbours only when `Rec.channel` is false (a folder open). On the hosted address the channel already carries the rows, and each poke made home and every app frame re-read the whole store. Change the copy in `block/index.html` with it. `shared/CLAUDE.md`, No re-read on every write, has the numbers.

## 1.0.45, 2026-10-02: SIDE, the board stays beside an app on a very wide window

**Gone since 1.0.55** (Tom, 2026-10-06, "I don't want to look at 2 apps at the same time"). See the 1.0.55 SIDE entry at the end.

Tom, on a super ultrawide (first said 5120x1440; it is **3840x1080**, Tom 2026-10-04): "what kind of smart resizing can we do when switching". Measured first, on the demo at 3440 wide: every app filled the stage and drew a column of 606 (SHEET), 632 (TRAIN), 768 (QUESTS, KITCHEN), 1126 (STATUS) to 1646px (COACH), the rest empty. He picked "the app plus the home board" and "each app uses the width", and said no to three apps at once.

- **The rule.** Below `SIDE_MIN` (2400px of stage) nothing changes. Above it an app with a `fit` in the roster takes the RIGHT part of the stage and the board keeps the left: the board is a fixed grid that grows empty columns to the right (1.0.31), so his cards do not move when an app opens. The app's width is what the board's saved cards do not need (`boardNeed`, their right edge), held between its fit's floor and ceiling: `narrow` 900 to 1280 (TRAIN, CHECK IN, NOTICE, SPEAK, ELEMENT, RECEIPTS), `half` 1600 to 3200 (STATUS, LOG, QUESTS, KITCHEN, WEALTH, COACH, FOODDEX, SHEET). `full` (BLOCK, STYLE, ARC, FORGE, FORM) and anything that would leave the board under `BOARD_MIN` (900) fill the stage as before. Switching apps re-sizes the frame and redraws the board; the board redraws on store changes while it is beside an app, not only on HOME.
- **Where it lives.** `fit` on each roster entry, `sideFor` and `placeSide` beside `go()`, `#stage.side` in the CSS. Every `view === 'home'` that meant "the board is on screen" is `boardOn()` now.
- **Each app's own half** (columns on a wide window) was done in each app, the same day, and is in their briefs.

Watched in headless Chromium on the demo: at 5120x1300 TRAIN got 900px and the board 4220, STATUS, QUESTS and WEALTH 1600 and 3520, ARC the whole 5120; at 3440, TRAIN 900 / 1600 for the half apps; at 1920 no change at all. On the demo the board's need is large because its cards had no saved spots and spread across the wide grid; his own board decides it on his screen. Not seen on his screen.

**His screen is 3840x1080** (Tom, 2026-10-04, after the above was built for 5120x1440). The rule is width-driven, so it holds: re-measured at a 3840x1000 window, TRAIN gets 900 to 1280, the half apps 1600 to 1928 on a 12-column board, ARC all 3840, and the review passed 142/142 there and at 390x844. At a 943px-tall frame of 1928: STATUS Report 1.15 screens, QUESTS Upcoming 1.22, WEALTH 1.46 at most, SHEET 1.32, KITCHEN PLAN 1.82, LOG Month 3.37, COACH 2.70, FOODDEX 1.85. Height, not width, is now what makes him scroll.

## 2026-10-05, HOME 1.0.47: UPCOMING in the default board

Tom said yes to UPCOMING in the corner MOMENTUM left (4x5, so its bottom meets EVERY & ANYTIME and RECORDS). Measured at 1920x1000: the eight cards fill three columns with no hole.

## 2026-10-05, HOME 1.0.49: BODY HEATMAP stands by default, other poses on the menu, a smaller waist

Tom: "make the waist smaller", "Make the default pose standing", "Hide the other poses behind the righ click options".

- **Poses** (`BODY_POSES`): Standing (arms at his sides, the default), Vitruvian (arms out) and Double biceps, picked from the card's right-click or hold menu, Pose; the choice is `cfg.pose` on the layout entry, absent for Standing. The faint second pose is gone. One torso (`BODY_SKIN`, `BODY_FRONT`, `BODY_BACK`, no arms in them) and an arm set per pose drawn over it: `skin` filled, `line` the outline without the edge it shares with the body, and the delts, biceps or triceps and forearms. The arm sets were generated from where the shoulder, elbow, wrist and fingertips sit, so all three carry the same muscles; the generator is a scratch script, not in the repo, so a new pose is drawn by hand or by writing one again.
- **Waist**: 13% narrower at the navel, tapering back to nothing at the ribs and the hips. Shoulders to waist is about 1.85 now, past the golden ratio, at his word.

Watched in headless Chromium on the demo: right-click on the card's title, Pose, Double biceps redrew the card and saved `pose: 'flex'` in the layout; Standing is what a fresh board draws, at 1920x1000 and 390x844 with no row overflowing. Review 142/142 Chromium, WebKit only the known foundation-frame fail. Not seen on his screens.

## 2026-10-05, HOME 1.0.48 to 1.0.52: reel fixes A4, A7, A8

- **A4** (1.0.48, 1.0.50): a phone tab label may use its whole button (1px side padding) and, wider than it, loses its letter spacing and shrinks to three quarters at most; if the theme font still will not fit, every label on the bar is set in the phone's own font (`#tabs.plainfont`). Nine words in a pixel font do not fit 390px at any readable size; 5.7px was tried. `fitTabs` reruns on resize, a font landing and a theme change. TODAY's time column is at least 60px and as wide as its time. CLOCK uses its font's own line height. Every font in STYLE's list plus the eight B7 adds, 26, measured with no text overlapping or spilling at 390px on the Main Menu, STATUS, TRAIN, QUESTS and CHECK IN.
- **A7** (1.0.51): every card carries `data-w`, its widget id.
- **A8** (1.0.52): an empty BODY HEATMAP draws the body in its zero colour with the sentence under it.

## 2026-10-05, HOME 1.0.53: BODY HEATMAP colours by recovery, no circle or square, round shoulders on the double biceps

Tom: "this doesnt show recovery. Red - just hit, Green - ready to go, Brightness - amount of work this week", "remove the circle and square", "fix the front flexing, that's not what the shoulders look like from the front".

- **Colour is recovery** (`bodyColour`): `--danger` at the last set, through `--warn` at half its window, to `--success` when ready, mixed in oklab so the middle is amber, not mud. **Brightness is the sets** in the card's range (`bodyBright`, the old opacity scale). The stripes are gone. Each row carries a dot in its muscle's colour and brightness; a row still recovering keeps its hours.
- **No circle or square.** Each pose has a `box`, its figure plus a margin, as the viewBox, so the figure fills its panel. Standing and Double biceps go side by side once the box is wider than 2/5 and 3/5 of its height (container queries on `.bh-fig`, classes `bh-p-<pose>`); on a phone they always sit side by side and Vitruvian stacks. Standing at 1920: two figures 158x524, against 319x260 squares before.
- **Double biceps front**: the deltoid is a round cap standing above the arm with a dip before the biceps peak (per-pose `delt` and `biceps` in the generator), and the biceps fills its peak.

Watched in headless Chromium at 1920x1000 and WebKit at 390x844 on the demo: computed fills are colours in both (oklab), dots 8px, no row overflowing. Review 142/142 Chromium, WebKit only the known foundation-frame fail. Not seen on his screens.

## 2026-10-05, HOME 1.0.54: LIFE band names (D4)

The three bands are EARLY, MIDDLE and LATE until named on the card's own menu, Name the bands, a setting each (`lifeos.lifeNameYouth`, `lifeNameMid`, `lifeNameOld`; cleared when set back to the default). "TOO OLD FOR A LOT" is gone before clients see it. Watched by right-clicking the card, Name the bands, First band, SET: the legend read GROWING.

## 2026-10-06, HOME 1.0.55: DESK TIME

Tom picked a daily log of time per program, "But also I use to see what time I generally go to bed", then "have it be a main menu widget". DESK TIME (`desktime`, `mine: 1`, under STATUS in ADD A WIDGET) reads STATUS.exe's `screen` and `deskon` rows (status/CLAUDE.md 1.0.62): TODAY (time at the PC), OFF LAST NIGHT, USUAL (the middle of the last 14 nights that have one), then today's top six programs. A night is named by its evening; bedtime (`deskBed`) is the end of the first stretch ending 9pm to noon next day that is followed by 3 hours or more with nobody at the PC, so phone time in bed is not seen. Watched in headless Chromium at 1920 by adding it from the picker over six made-up nights: 2:15, 2:10am, 1:18am over 4 nights, CapCut 1:30, Chrome 0:45; review 142/142. Not on his screens; real nights start once STATUS.exe runs 1.0.62.

## 2026-10-06, HOME 1.0.55 also: SIDE removed, every app fills the stage again

Tom, in Main Menu.exe on his 3840x1080: "I don't want to look at 2 apps at the same time, let's review our 3840*1080 accomodation". SIDE (1.0.45) is deleted: `SIDE_MIN`, `sideFor`, `placeSide`, `boardNeed`, `boardOn`, `#stage.side` and each roster entry's `fit`. `go()` is back to what it was before 1.0.45, the board hidden whenever an app is open. Each app's own wide layout stays. It shipped inside the DESK TIME commit (64b863e), because that session staged the whole file while this edit sat in it; to bring SIDE back, restore those names from 8dd9f5e.

Measured in headless Chromium at 3840x1000 on the demo, every app full width, board hidden: how wide the drawn part is below the top bar, and the widest empty band.
- **Fill the width:** SHEET (98% covered), ELEMENT, WEALTH, COACH, FOODDEX, CHECK IN (centred, 600 to 700px empty each side), BLOCK, STYLE, LOG.
- **A column in the middle, 1300 to 1600px empty each side:** TRAIN (640 wide), RECEIPTS (670), SPEAK (770), NOTICE (1100), STATUS (1180).
- **Left-heavy, 1250 to 1650px empty on the right:** QUESTS (to 2574), KITCHEN (to 2200).
- ARC, FORGE and FORM are canvases; the demo leaves most of them empty, so their numbers say nothing.


## 2026-10-06, HOME 1.0.56: LOCKED IN

Tom: "a widget that shows me how locked in I am. Average training sessions, average number of tracked meals, average calorie deficit/surplus, average steps. No letter grades just math." Four numbers, 7, 14, 30 or 90 days from the widget's menu (7 by default), each with the same stretch before it underneath.

- **The period ends yesterday.** A day still in progress would pull every average down: half a day of food reads as a deficit.
- **Training** is sessions a week: days with one counted working set or more, by TRAIN's rule (`setIsWarm`, `setCounts`).
- **Meals** is meals a day over every day in the period. STATUS logs each food as its own row, so foods logged within 45 minutes of the one before are one meal; a food with no time is one meal.
- **Calories** is each food-logged day's total minus STATUS's maintenance estimate (`status.tdeeState`), or the calorie target, named as such, when there is no estimate. Days with no food are left out, not counted as zero.
- **Steps** is the mean of the days with a steps reading, saying how many.

Watched in the demo at 1600x950: added through ADD A WIDGET, SHOW 30 days through the menu and saved on the card, every number equal to a separate count of the same rows. Not seen with his own rows.

## 2026-10-06, HOME 1.0.57: AVG WEIGHT, and an average line on WEIGHT

Tom: "Create also an average weight widget AND an average weight right click option for regular weight widget."

- **WEIGHT's menu has "7-day average line"**, a tick per widget (`cfg.avg`), off by default because of his 2026-09-14 "actual data than trends". On, a second line in the reading colour runs over the weigh-ins: at each weigh-in, the mean of the readings in the seven days ending that day (`weightAvg7`), and the widget's line adds "7-day avg".
- **AVG WEIGHT**: the mean of every weigh-in in the last 7, 14, 30 or 90 days (today included), the same stretch before it, and the change. From 14 days up, each seven-day week's average and how many weigh-ins made it, newest first; at 7 days that list would only repeat the two numbers.

Watched in the demo at 1600x950: the tick from the menu sheet, saved on the card, the average path drawn; AVG WEIGHT added through ADD A WIDGET at 7 and 30 days, both averages equal to a separate count.

## 2026-10-06, HOME 1.0.58: DELETE EVERYTHING has a way back

DATA's "Delete everything on this device" asks once in the suite's own
dialog (was two native confirm boxes), keeps a copy of every localStorage key
and the store's IndexedDB rows in the `mb-wiped` database, and the open after
offers UNDO for 12 s; DATA shows "Bring back what was deleted" for 7 days
(`mb.wiped.at`), then the copy is dropped on open. No copy kept: it says so
and asks again. It now deletes the `motherbase` IndexedDB too, whose big rows
used to survive a delete. Tested in headless Chromium by clicking DATA, the
option and DELETE EVERYTHING, then UNDO and Bring back.

## 2026-10-07, HOME 1.0.59: board fixes and polish

Tom: "Check for bugs and save issues and redundancies. Polish the widgets." A review drew all 46 widgets in headless Chromium (demo at 1920 and 390 touch, an empty store) and measured and looked at each; a code audit read the file. Pass A, the board-wide part, is 1.0.59:

- **Fit cards are measured again once the font lands** (`document.fonts.ready`, `loadingdone`): MACROS was cut to 2 rows. `defaultLayout()` hands out fresh copies with the reel's spots, so Reset works after a move and 3840 keeps three columns. `seenOrder()` drives REARRANGE arrows and Move up/down. The hover remove button no longer makes a header 16px taller. Phone card menus drop Wider/Narrower/Taller/Shorter; fit cards drop Taller/Shorter and resize by width only.
- **Typing survives a redraw.** `redrawHome()` waits while a box on the board has the caret (STICKY lost words on its own save, and on any store write or resize).
- **Saves:** an emptied board stays empty (`lifeos.layoutEmpty`, since live sync strips an empty list); cards a newer build knows are held in `layoutHeld` and saved back; Bring back only restores a row that is missing or older than its copy; + WIDGET no longer passes its click as a spot.
- **Rows line up:** `.row.mb-bullet` is 44px with the box beside the words; an all-untimed list hides the time column; a TODAY todo wears the journal's square inside its tick button; `.chk` rings are `--dim2`. Sizes under 12px and raw padding are tokens (`--f-1`, `--s-2`, `--s-3`).
- LINKS stops at the window and scrolls; APPS says keys 1 to 9 truthfully; the picker's rows are one width with body-face descriptions and icon buttons; the drag ghost is a real header.
- Dock: a drop on the next app right works; phone Move left/right skips desk apps; an app opened while ELEMENT is over the board hides ELEMENT. Dead: the v1 `lifeos` IndexedDB block and `dueHabits`.

Watched in headless Chromium at 1920, 3840 and 390 touch; review 142/142 Chromium, WebKit only the known smoke-frame fail. Not on his screens.

**Passes B, C and D are not on main.** B (TODAY, TODO, UPCOMING, IDEAS, EVENTS, STREAKS, RHYTHMS, STICKY, RECAP, ON THIS DAY, CALENDAR) was cut off by a usage limit and is parked unfinished and untested on the branch `home-polish-wip`. C (TRAIN, weight, MEASURE, WORK DONE, BESIDE) and D (money, food, desk tools, LIFE, YEAR) never started. Their lists are in `Claude outputs/audit-2026-10-08/home-*.json` (local, not in git). Rule for them: TRAIN totals count warmups (train/CLAUDE.md, 1.0.50), so a home total must too; recovery clocks and records stay on working sets.
