# The suite, reviewed: 2026-09-15

Tom, 2026-09-15: "Apply yourself to the Suite. How can we make the whole
thing BETTER." And: "The synthesizing of data and the interaction between
modules is where the suite will shine. The whole system must be quick, fun,
and intuitive, turning life into a game that puts progress on autopilot."

This is the answer, written after reading every shared module end to end
and every widget on the home screen. It is a list of proposals, ranked, and
nothing in it is built. Tom picks. Where a proposal touches a rule in
`DOCTRINE.md` it says so, because he asked for the doctrine to be gone
beyond where that makes sense.

## What the home screen is today

Twenty-one widgets. Every one reads rows straight out of the shared store
and none of them writes a row another app owns. That part is right, and it
is the reason the rest of this is possible.

| Widget | Reads | What it answers |
|---|---|---|
| TODAY | BLOCK's plan, STATUS's and QUESTS's todos | what now, what next, how much of the day is done |
| MOMENTUM | every tick | a heatmap of how much got logged |
| DAY LOG | ticks with a time | what happened today, in order |
| TRAINING, TRAINING VOLUME | TRAIN's sets | the last session, and eight weeks of volume |
| WEIGHT | STATUS's weight | the line, and how far it moved |
| PROTEIN, CALORIES | STATUS's meals | today against the target |
| SLEEP | STATUS's sleep | seven nights against the target |
| SPEND | STATUS's spends | this week against last, and where it went |
| TODO, IDEAS, EVENTS | STATUS's journal | the open todos, the ideas, the events |
| STREAKS | every tick | what has run the longest |
| STICKY NOTE, CLOCK, TIMER, THE YEAR, LIFE, APPS | none, or a setting | a desk |

**The pattern.** Nineteen of the twenty-one are a window onto ONE app. TODAY
is the only widget that joins two, and it is the best thing on the screen:
BLOCK's blocks and STATUS's todos as one list, ticked in one place, with
Now and Next worked out across both. That is the model for everything that
follows. The shared drawer is the product, and the home screen is where a
person should be able to SEE that it is one drawer.

## Where it falls short of the brief

1. **Nothing joins.** Sleep and training volume sit in two cards a hand's
   width apart and nothing puts them on one line. Weight and calories the
   same. Spend and mood the same. The suite holds every pair and shows none.
2. **Everything shows the present.** The root brief's psychology section says
   the suite is strong on autonomy and weak on competence, and that
   self-efficacy comes from being shown what you have already done. No
   widget does that. There is no personal best, no "this used to be hard",
   no good day from a month ago. The screen can describe this week and
   nothing else.
3. **It is flat.** BLOCK draws each block as a tinted plate: a gradient in
   the block's own colour, a lit top edge, a shadow underneath. ARC sits on
   a starfield. The home screen and every other app draw a card as one flat
   fill with a hairline, because the default theme is `depth: flat` and the
   theme engine has no notion of a tint. Tom, 2026-09-15: "contrast that to
   the flatness of everywhere else."
4. **The app icons read as letters.** The dock draws them at 16px in a
   1.75px stroke, all one colour, and four of the twelve are the same
   drawing as a common button: QUESTS is the tick, CHECK IN is the camera,
   FORM is play, FOODDÉX is the food bowl. At that size, on that weight,
   a row of them is a row of glyphs.
5. **Every redraw scans the whole store.** `Rec.all(type)` walks every row
   in memory to find one type. TRAINING VOLUME calls it fifty-six times per
   draw, and the home screen redraws every widget on every tick. With
   twelve thousand sets that is seven hundred thousand row visits to draw
   one bar chart. It is not slow yet. It is the thing that will be.

## What to build, in the order it pays

### 1. A type index in the store (foundation, half a day, no visible change)

`records.js` keeps one map of rows by id. Add one more, rows by type, kept
in step on every write. `Rec.all(type)` becomes a walk over that type alone.
Every app and every widget gets quicker, and nothing changes shape. This
goes first because "quick" was the first word Tom used and everything below
adds reads.

### 2. The material layer (foundation, then STYLE, then the apps)

Bring BLOCK's plate into the theme engine, as tokens, so a theme decides the
material and every card in every app wears it. One recipe, three levers:

- `--plate`: the card's background, a gradient from a tint down to the
  surface. The tint is whatever `--c` the element carries, and the accent
  when it carries none. BLOCK's rows already set `--c`; the widgets would
  set it from the app they draw for.
- `--plate-edge`: the lit top line and the border, both mixed from the tint.
- `--plate-lift`: the shadow under it, which the depth setting already
  controls and which `flat` currently turns off entirely.

STYLE gets a lever called Material: Flat (what everything is now), Plate
(BLOCK's), Glass (System's lit pane, which exists as theme CSS and could
become the general case). The default theme moves to Plate, since that is
the look Tom pointed at. The apps change nothing except reading `--plate`
where they read `--surface-1` on a card. `THEMING.md` grows three tokens.

Goes beyond the doctrine in one place: the root brief says a theme "changes
how a box is drawn, never where it sits". A plate is drawn, not moved, so it
stays inside that rule. The starfield is different. ARC's background is
ARC's, and a texture that suits a canvas does not suit a form. Leave it
where it is.

### 3. App icons that can be told apart

- Three new drawings, the only ones needed: QUESTS as a flag on a pole,
  CHECK IN as a standing figure inside a frame, FORM as two frames side by
  side. FOODDÉX keeps the bowl, because it IS food.
- App icons drawn at 20px in the dock and 22px in the APPS tiles, at a
  stroke one step heavier than a button's. `Icons.svg` already takes a
  weight; the dock just never asks for one.
- Each app gets a colour slot from the theme's chart ramp, shown when the
  app is the one open and as the tint on its tile and on every widget that
  draws for it. That is what ties a widget to its app without a label.

### 4. Widgets that join two things (the point of the suite)

Each is one query over rows the store already has, drawn with `chart.js`,
and says no verdict. State the two lines, let him join them.

- **BESIDE.** Two measures on one time axis, chosen from a list: sleep and
  training volume, weight and calories, spend and mood, steps and energy.
  Two charts stacked on one date axis rather than two scales on one plot,
  which `chart.js` already refuses. This is the synthesis widget, and the
  choice of pair is the widget's own setting, the way WEIGHT's range is.
- **THE WEEK.** What carried the week: the three things ticked most this
  week and how that compares with last, in words. "Train 4, up from 3.
  Journal 6 of 7. Steps 5 of 7." Uses every app's ticks, names no app.
- **SESSION TO SESSION.** TRAIN already compares a session with the same
  one last time, set by set. The home screen shows the last comparison's
  one line: "Push day, 3 of 5 lifts up." Competence, from rows that exist.

### 5. Widgets that show what he has already done (competence, self-efficacy)

- **RECORDS.** Personal bests from TRAIN, newest first, all-time and this
  block. TRAIN's Profile already works these out; the widget reads the same
  rows.
- **THIS DAY, BEFORE.** One good day from a month or a year ago: the day's
  line, what was ticked, the weight that morning. Chosen by ticks logged,
  never by a score. The root brief calls this the cheapest mood
  intervention the suite has none of.
- **NOW AUTOMATIC.** A block or habit that has run thirty days with no gap
  wider than one. Named, dated, and left there. A thing that used to need
  the list and no longer does.

### 6. Autopilot, quietly

- **A target that has been missed for three weeks is furniture** (root
  brief). SLEEP's line already says "hit 2 of 21 nights". Put the same line
  on every widget with a target, and give the line a menu: Lower it, Keep
  it. No prompt, no nag, a fact with a handle on it.
- **Deep links.** A widget's title takes you to the app it draws for, at
  the thing it drew: WEIGHT to STATUS's weight, TRAINING to TRAIN on that
  day, SPEND to WEALTH's week. `go(app)` grows a second argument the app
  reads from its hash. Two taps become one, and the home screen stays a
  hallway.
- **The next thing first on a phone.** TODAY's Now band is the one line the
  whole screen exists for. On a phone it should be the first thing painted,
  above the grid, before any card.

## What this does not touch

No levels, no XP, no praise, no streak pressure: those rules stand. Nothing
here tells him what a behaviour did to a number. Every widget states the
behaviour and shows the number, and the joining is his.

## Recommended order

1, then 2, then 3. Those three are foundation and STYLE work, make every app
better at once, and need no decisions from Tom beyond "yes". Then 4, one
widget at a time, BESIDE first. Then 5 and 6 as he wants them.
