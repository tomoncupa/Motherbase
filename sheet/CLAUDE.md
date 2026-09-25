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
  and split sets read from the comment as TRAIN does; one window per day,
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
- Next: devise an ACHIEVEMENT SYSTEM for SHEET (Tom, 2026-09-25). Design it
  and show Tom before building.

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
  worked out from history, never stored. One worn at a time.
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
