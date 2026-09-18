# RECKON

**Mental arithmetic, worked up a ladder.** Nineteen levels in four belts, from
pairs that make ten to sequences and solving for x. Each one teaches a method
first, then drills it, and only opens the next when you are both accurate and
fast at it.

Governs `reckon/` only.

## It is not a Motherbase app

Set by Tom on 2026-09-18, when he asked for it: *"Tom Only, this isn't a
Motherbase App."*

It lives in this repo for the same reason `calcount/` does: this is where
commits, GitHub Pages and the handoff between sessions already work. It is a
guest here, not a member, and the terms are CALCOUNT's:

- **It loads nothing from `../shared`.** No store, no themes, no icons, no
  sounds. Every line it needs is inside `reckon/index.html`, so the folder can
  be lifted into its own repo on the day it needs one with nothing to
  untangle.
- **It shares no data with the suite.** Its rows are its own, under keys that
  start `rk.`, and it never reads or writes Motherbase's.
- **It is not in the home screen dock and not in the client build.**
  `tools/build-client.py` copies an allow-list of folders, so a new folder is
  left out without anyone having to remember. Checked: `COPY_DIRS` does not
  name it.
- **The root `CLAUDE.md` still applies to how the work is done**: how to talk
  to Tom, complete truth, testing in the browser, one commit per coherent
  change, the version tag, push without being asked. What does not apply is
  its data model, its shared foundation, its theming contract and its app
  ownership table.

Why independent: the suite is a set of windows onto one shared drawer of life
data. A maths game shares nothing with that drawer, has no reason to be in a
client's hands, and would only add a row type and a dock slot that earn
nothing. Tom settled it in the same breath as asking for it.

## The one job

**Get faster at the arithmetic you actually do in your head, with a method for
each kind rather than by being timed at guessing.**

Not a maths course. Not a brain-training app with a score. It teaches a
technique, makes you use it until it is automatic, and gets out of the way.

## The ladder

Four belts, nineteen levels, each opening when the one before it is passed.

| | Belt | Levels |
|---|---|---|
| 1 | **GROUND** | pairs to ten · crossing a ten · times tables · two digits added · double and halve |
| 2 | **TRICKS** | elevens, nines, fives · quarters and halves · two digits by one · squares · either side of a round number · two digits by two |
| 3 | **PARTS** | divide · percentages · fractions, decimals, percents · estimate |
| 4 | **LETTERS** | solve for x · ratios · powers and roots · sequences |

The order is not decorative. Every level after GROUND is built out of one
before it: the ×25 trick is halving twice, difference of squares needs the
squares level, percentages are built from a tenth and a half of a tenth, and
sequences are the gap plus multiplication. That is why they are a ladder and
not a menu.

## Passing a level

A round is **12 questions**. To pass you need both:

- **accuracy** — a stated number right out of 12, between 9 and 11 depending on
  the level
- **speed** — a **median** at or under the level's target, taken across the
  questions you got RIGHT. A wrong answer's time measures how long you were
  confused for, which is not the thing being trained.

Both are printed on the card before you start and on the result after. A round
that misses says which of the two is in the way, by name.

**The target times are estimates.** Nobody has been timed on them. They were
set by what the method ought to take once it is automatic, and they are three
things away from being furniture:

1. **Pace**, in settings: relaxed adds 40%, quick takes 25% off, applied to
   every level at once.
2. **The easing offer.** Three rounds running where the accuracy is met and
   only the clock is short, and the result offers to move that one level's
   target to half a second past the median just achieved. A target you keep
   missing has stopped being a target.
3. **Settings lists every eased level** and puts them all back in one press.

**A pass is never taken away.** Replaying a passed level badly changes nothing
but the line on its row.

## What it does NOT do

- **No XP, no points, no levels-as-tiers.** The levels are curriculum stages,
  which is a different thing: each one names a technique. There is no score
  that accumulates and nothing to protect on a bad week.
- **No verdict.** It never grades the person, only reports the two numbers
  against the two targets.
- **No leaderboard, no sharing, nothing sent anywhere.** No network request is
  made at all, including for fonts: it uses the system stack.

## The streak

Continues if you played, not if you passed. A freeze is granted every seventh
day, capped at three, and spent silently on a miss without ever being offered
at the moment of failure. The header shows what the streak is worth TODAY, so a
run that has already lapsed reads zero rather than flattering yesterday's
number.

## The warm-up

Appears once three levels are passed. Twelve questions drawn from the passed
levels, weighted by how long since each was last touched, and never two in a
row from the same level. That is spacing and interleaving, which are the two
things that separate practice that holds from practice that feels good.

A passed level untouched for seven days is flagged REVIEW on its row. Playing
it, or a warm-up that draws from it, clears the flag.

## Data

`localStorage`, every key beginning `rk.`, one key per row rather than one blob.

| Key | Holds |
|---|---|
| `rk.lvl.<id>` | `{pass, best, runs, tries, ease, seen, last}` — one level |
| `rk.run.<ts>` | `{lvl, n, right, med, on}` — one round played |
| `rk.day.<date>` | `{rounds}` — how much got done that day |
| `rk.streak` | `{n, last, freeze, best}` |
| `rk.set` | `{pace, sound, auto}` |

**Two rules carried over from the suite because they were each written after
something broke:**

1. **Change a row by merging into what is there, never by rebuilding it.**
   `DB.patch` does that in one call.
2. **Lay the defaults UNDER what is stored, not instead of it.** `lvl()` does
   `Object.assign({}, LVL0, stored)`. Reading a row and trusting it to hold
   every field it once held is the mistake that cost a predecessor its data,
   and it costs the same with one writer as with six. It was a live bug here
   for an hour on the day this was built: a row written by `setLvl(id,
   {seen:true})` came back with no `runs` array, and finishing a round threw.

There is no backup and no export. Everything is on one device, in one browser.
Settings says so, and ERASE EVERYTHING names how many passed levels go before
it will do it.

## Interface

Built to the phone rules because those are the harder ones, and good at a desk.

- One primary thing per screen. On the path that is the level you are on, in a
  card with an accent edge; everything else is deliberately quieter.
- The keypad is always in the bottom third, every key at least 44px.
- **Only the keys that can be needed.** A minus appears on the levels whose
  answers can be negative, a decimal point on the ones whose answers can have
  one, and neither anywhere else. In a warm-up it reads the round it actually
  drew.
- Auto-check fires the moment the typed number IS the answer. It cannot be
  wrong to accept a right answer, and it saves a press on every question.
  Switchable, because it does credit a right answer typed on the way to a
  longer wrong one.
- Back closes what is open rather than leaving the app, through one guard that
  covers a whole round including its result.
- Sound is synthesised, nothing downloaded, and every cue is paired with a
  vibration. On Android you feel it, on an iPhone you hear it. iPhone Safari
  has no vibration API and there is no workaround.
- Colour is declared once at `:root` and nowhere else. Thirteen values in the
  whole stylesheet, one accent doing one job.

## Testing

No framework. Driven in headless Chromium, 151 checks, all passing on
2026-09-18 at 390x844 with touch, 360x640, and 1280x800 with a keyboard:

- every generator, 400 questions each: a finite answer, inside the nine-digit
  box, and a minus or decimal key declared only where one is needed
- **every printed question re-derived independently and compared with its
  stored answer**, 300 per level. This is the check one level under the bug:
  it does not test that a particular sum is right, it tests that the question
  on screen and the answer being marked cannot disagree, which is the one
  thing that would produce every wrong-marking symptom there is
- a clean round passing, a bad round not passing and naming why, the misses
  listed, the unscored fix round leaving the level record alone
- the warm-up drawing only from passed levels, favouring the stalest, never
  twice in a row, and clearing the review flag
- the easing offer after three accurate-but-slow rounds, and the pace control
- rows not a blob, nothing written outside `rk.`, a patch keeping fields it did
  not touch
- the states: a cold store, one level, all nineteen passed, a long question, a
  nine-digit answer, a tenth digit refused
- every contrast ratio computed rather than eyeballed. The tertiary text was
  3.95:1 and failed; it was lifted to 5.28:1 rather than the text being shrunk,
  because that was a legibility problem

**Not tested, and it cannot be from here:** anything on a real phone. Scroll
feel, whether the haptics fire, how the type renders on the hardware, and
whether the target times are achievable by a human being. Those are Tom's, and
the last one is the one most likely to need changing.
