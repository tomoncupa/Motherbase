# COACH (CLAUDE.md)

Governs `coach/` only. The repo-root `CLAUDE.md` and `DOCTRINE.md` still apply
and win any disagreement.

## What it is, as the root brief described it on 2026-09-22

COACH, built 2026-09-22. Tom's clients in a Pokémon PC box: three boxes (1:1, ONLINE, PAST) of thirty slots, each client drawn as the Pokémon CHECK IN gave them. A client's training arrives as the file TRAIN's Send To Coach makes and is kept under COACH's own types, so it never lands in Tom's own TRAIN. Strength, recent sessions and the range per client, and FIRST SETS: the weight and reps of each exercise's first set, sent back as a program file the client opens in TRAIN, where the rest of their sets fill from their last session. A PROGRAMS library holds programs to send to anyone or sell. One column on a phone, two on an upright iPad, three from 1180px. Tom only, dropped from the client build. LOG A 1:1 on a client writes their sets as `cset` and one WEALTH `sesh` per day, and every COACH client is a WEALTH client and the other way round (`cperson.wc`, `client.cp`)

## LOG A SESSION is the real TRAIN (1.0.3, 2026-09-22)

Tom: *"It should act exactly like train just on their profile."* So the button
opens `train/index.html?client=<pid>` in a frame over COACH (`openTrain`,
`#over`, DONE closes it). TRAIN is not copied and not edited into a second
app: an adapter at the top of `train/index.html` points its store at the
client, mapping every TRAIN type to COACH's (`set`→`cset`, `exercise`→`cex`,
plus `cexcat`, `csgroup`, `cgoal`, `cprogram`, `cprogday`, `cprogex`, added
here) with `pid|` in front of every key.

Rules this laid down, and why:

- **New types belong to COACH.** They are on `APP.types`, so they ride
  COACH's sheet tab. A type added to TRAIN later needs its `c` twin added in
  BOTH the adapter's table and here, or that part of a client's log is
  invisible.
- **A set Tom logs there is keyed `pid|k-...`.** `coachSets` only counts
  `k-` keys, which is what keeps a client's own sent sets out of WEALTH's
  billing. A `Rec.on` handler here calls `countSession` when one of those
  arrives, so a session logged in the frame bills exactly like one from the
  old quick logger.
- **The quick logger (`drawLog`) is kept and unreachable.** No button points
  at it. Bringing it back is one line.
- **A client file carries categories, supersets and goals** since 1.0.3
  (`MAP` in `takeFile`). A client imported before that has exercises with no
  muscle groups; opening their file again fixes it, and TRAIN seeds the
  starter groups round what they have so logging works either way.

Watched in the browser 2026-09-22 with a made-up client: two sets logged in
the frame landed as the client's `cset` rows, a WEALTH `sesh` appeared and was
taken back when the sets went, Tom's own `set`, `exercise` and `tick` counts
did not move, and `_review.html` passed 116 of 116.
