# CHARACTER SHEET — `sheet/`

Planned, not built. Only `art/` exists. Everywhere (phone first), client build.
Dock label SHEET; the picture's title is CHARACTER SHEET.

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

## Next

1. Tom's verdict on `art/knight96.png`, and background choice.
2. Tom runs the cape / helmet / shield prompts in Gemini, pastes results.
3. Diff-extract items, then build `sheet/index.html` from `_template/`.
