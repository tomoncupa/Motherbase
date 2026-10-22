# CHARACTER SHEET — `sheet/`

SHEET 1.0.0 (2026-09-25) is the FEATS half: feats read off TRAIN and STATUS,
popped as NOTICE windows, kept as a history. The avatar half is paused (Tom,
2026-09-25: "pause the avatar work for now"); `art/` waits for it.
Everywhere (phone first). Meant for the client build, HELD BACK from it
(`DROP_APPS` in `tools/build-client.py`) until Tom has used it. Dock label SHEET.

## Feats (built)

Tom, 2026-09-25: "my STATUS and TRAIN data to be detected, as well as my
consistency, and then have it use the NOTICE engine to generate pop ups that I
can save and look at the history of when I open the CHARACTER SHEET".

- **Worked out every open, never stored.** A feat is a fact about the log. The
  only row is `feat` (undated, key = the feat id): "this one was shown".
  Keys are the same on every device, so a second device writes the same row.
- **What pops:** feats dated on or after `sheet.since` (set on first open to a
  week back) with no `feat` row. Auto-popped once per open after `Rec.ready`,
  one window at a time, NEXT / DONE, SAVE PICTURE = a 1080x1920 story on the
  dark wash through `IO.handOver`. History lists the newest 300, tap to reopen.
- **The feats:** RECORD (a day's sets heavier than anything before at that many
  reps or more, TRAIN's rule, only after an exercise's first two days; warmups
  and split sets read from the comment as TRAIN does; since 1.0.4 a split set
  counts by its effective reps with TRAIN's `train.split*` weights, copied
  from `TRAIN.effReps`, and its line reads "10 5 (counts as 14)"; tonnage
  stays every rep; one window per day,
  rewards are the real gains); Nth SESSION (1, 10, 25, 50, 75, 100 ... 500,
  then every 250); WEEKS IN A ROW with two or more training days (4, 8, 12, 26,
  52, 78, 104, then every 52); TONNAGE lifted (10, 25 ... 1000 t, then every
  500, shown in TRAIN's unit); DAYS LOGGED IN A ROW in STATUS, any reading or
  journal line (7, 14, 30, 60, 100, 200, 365); a FIELD TARGET hit, or a check
  field done, days in a row (same ladder; Trained excluded).
- Windows are NOTICE text drawn by `Notice.parse` / `Notice.draw` /
  `Notice.compose` in `shared/notice.js`. No made-up rewards.
- [TESTED in browser with made-up rows, 375px and desktop] UNTESTED on his real
  log (12k sets) and on a phone. Review 122/122 at both widths.
- **No live pop-ups in TRAIN or STATUS.** Tom, 2026-09-25: "NO - SHEET is silly and
  self contained for now". Feats pop only when SHEET is opened.
- The ACHIEVEMENT SYSTEM is TITLES, below (Tom picked design A, 2026-10-22).

## Titles (SHEET 1.0.5, 2026-10-22)

Tom's pick A, "Titles", Tom only while SHEET stays in `DROP_APPS`.
- **Every step of a feat ladder unlocks a title**, plus four firsts. 53 in
  all, in `TITLE_DEFS` and `FIRSTS`: sessions 1 Newcomer, 10 Initiate, 25
  Regular, 50 Iron Apprentice, 75 Gym Rat, 100 Centurion, 150 Veteran, 200
  Iron Disciple, 250 Barbell Knight, 300 Spartan, 400 Warlord, 500 Living
  Legend, 750 Iron Sovereign, 1000 The Thousand; weeks in a row 4 Steady
  Hand, 8 Clockwork, 12 Quarter Keeper, 26 Half-Year Hero, 52 Iron Calendar,
  78 Unbreakable, 104 Two-Year Titan, 156 Timeless; tonnes 10 Pack Mule, 25
  Ox, 50 Forklift, 100 Freight Train, 250 Mountain Mover, 500 Atlas, 1000
  World Lifter; record days 1 Record Breaker, 10 PR Hunter, 25 Limit
  Breaker, 50 Ceiling Crusher, 100 Unchained, 250 Beyond Limits; STATUS days
  logged in a row 7 Scribe, 14 Chronicler, 30 Record Keeper, 60 Archivist,
  100 Loremaster, 200 Keeper of Days, 365 The Ledger; a target hit in a row
  (any field) 7 On Target, 14 Marksman, 30 Sharpshooter, 60 Sniper, 100
  Deadeye, 200 Never Misses, 365 Perfect Aim. Firsts: Awakened (first day
  logged in STATUS), Rampage (3 records in one day), The Return (a session
  after 28 days or more away), Leg Day Survivor (10 working sets on a leg,
  quad, ham, glute or calf category in one day).
- **Worked out from the feats every open, never stored.** A title's day is
  the first day it was earned. Its only row is the feat row, keyed
  `title|<slug>` (`title|sessions-100`), "this window was shown": no new type.
- **TITLE UNLOCKED** is a NOTICE window in the same queue as the feats,
  oldest first, a title after the feat that earned it, same `sheet.since`
  rule (nothing earned before SHEET's first open week pops).
- **One is worn**: `sheet.title`, the slug, the only new setting, written
  only when he taps a title. None picked: the newest unlocked is worn and
  nothing is saved. The TITLES card shows WORN big with VIEW (its window,
  SAVE PICTURE there) and every unlocked title, newest first; tap to wear;
  the worn plate wears an accent ring. Header counts `TITLES 24/53`; locked
  titles are not listed and there is no bar.
- **The worn title is printed on every feat picture**: a band above the
  window ("TITLE", then the name in the window style's accent and font), on
  the story and in the dialog. A TITLE UNLOCKED window goes without it.
- [TESTED headless Chromium on the demo by clicking and tapping: 1280x900
  and 390x844 touch; 24 of 53 unlocked; a tap wore Quarter Keeper and wrote
  `weeks-12`; VIEW then SAVE PICTURE downloaded `title-weeks-12.png`; with
  `since` moved back 40 days the queue popped 3 TITLE UNLOCKED windows among
  15 feats and wrote 3 `title|` rows; no button under 44px, no sideways
  scroll. Review 142/142 Chromium 1280.] UNTESTED on his real log and phone.

## Wide windows (SHEET 1.0.2, 2026-10-02)

**Tom's rule, 2026-10-02: on a wide window, lay things out side by side;
never fold text.** He runs a 5120x1440 ultrawide, where SHEET is a "half"
frame 2560 wide. From 1100px up the NEW and FEATS cards stand in a row
(each up to 640px) and HISTORY flows its months into CSS columns about 320px
wide, newest first down the first column (`.top`, `.hlist` in the style
block). Below 1100px nothing changed: the phone layout was checked box for
box against 1.0.1 at 390x844 (73 boxes identical). Main's scroll depth with
the demo, before -> after: 1280x1300 3.40 -> 1.37, 1720x1300 3.40 -> 1.08,
2560x1300 3.40 -> no scroll, 1920x1000 4.42 -> 1.22; phone 5.59 unchanged.

## What it is for

Tom, 2026-09-25: "just for fun and social media sharing. The goal is to get
people curious when its posted on stories." A client's pixel character, their
week, a title and pseudo stats, shared as a 1080 x 1920 story picture through
`IO.share`. The picture is the product; the app is where the avatar is dressed
and the title picked.

## The suite's rules that do NOT apply here

Tom, 2026-09-25: "The character sheet isnt as serious as the rest and is meant
to be silly, so dont let the rules get in the way." Levels, stats that climb and
boasting titles are allowed here and only here. The one limit: stats and titles
can boast "but it has to make sense" — each must come from something real in
the log. Do not "fix" this app back towards DOCTRINE's no-XP rules.

## Decisions

- **Who:** clients (the client build). Reads TRAIN's `set` / `session` rows.
- **LV = the person's real age**, from a birthday entered once. Not training age (rejected).
- **This week:** days trained Monday to Sunday, seven pips. The only thing that resets.
- **Stats (draft):** STR best lifts vs bodyweight, VIT total sessions, AGI best
  session's sets per hour, INT total PRs ever. Never go down. Untested on real logs.
- **Titles:** silly game style ("Leg Day Survivor"), unlocked from real facts,
  worked out from history, never stored. One worn at a time. Built 1.0.5,
  see Titles above.
- **No PERSONAL PROTAGONIST footer** on the picture.
- **Background:** undecided — gold light burst (recommended) or a pixel landscape.

## The art

- **Whole base characters + mix-and-match items**, all in ONE shared pose:
  three-quarter view facing right, hands empty. 96px tall.
- Hand-typed pixel art was tried (chibi knight in code) and rejected: "quite
  horrible". Claude cannot draw detailed art blind. Art comes from pictures.
- **The engine** (`art/pixelate.py`, Python/PIL, a tool not a build step): keys
  out a white background, shrinks to 96px, 32 colours, 1px dark outline, and
  drops a held item at a hand anchor. Tested on `knight-base.png` + `sword.png`
  → `knight96.png`. 20 colours turned hair and skin grey; 32 fixed it.
- **Sources are Gemini pictures Tom makes** (free, his Google account; he has
  no paid generator). Clean cel-shaded illustration, not "pixel art" — fake pixel
  art from a generator sits on an uneven grid. Send item prompts in the SAME
  Gemini chat as the base so pose and lighting match.
- **Worn items (cape, helmet, shield):** ask Gemini for "same knight, identical
  pose, now wearing X"; the item is the pixels that differ from the base.
  Untested — if Gemini drifts, align before diffing.
- **Never make sprites from Tom's style references** (stock watermarks, a signed
  artist's piece). Style guides only; none are in the repo.
- In the app, items will be separate sprite layers over the base; the anchors
  (hand, head, back) are set once for the shared pose.

## Next (avatar, paused)

1. Tom's verdict on `art/knight96.png`, and background choice.
2. Tom runs the cape / helmet / shield prompts in Gemini, pastes results.
3. Diff-extract items, then build `sheet/index.html` from `_template/`.
