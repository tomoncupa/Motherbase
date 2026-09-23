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

## Their check-ins, on their profile (1.0.4, 2026-09-23)

A client was in two places: their training in COACH, their photos and
measurements in CHECK IN. Same person, two apps, and Tom had to leave the
profile to answer "did the waist move".

Nothing was copied to fix it. CHECK IN already keys a client's `cval`,
`cphoto`, `cmark` and `cref` as `pid|key`, under the same `cperson` COACH
draws in the box, so COACH reads those rows straight out of the store. One
set of rows, two windows onto it.

- **A CHECK IN card** sits under the client's name: the date strip (their
  last twelve check-ins, one tap apart), that day's photos, then every answer
  with what it was at the check-in before. A photo opens big.
- **The change is stated, never judged.** `ciChange` prints `+1.5` or
  `−1.5` in muted text and no colour. A waist going down is not a win
  until Tom decides it is — root brief, self-determination theory.
- **The questions are the client's own.** `ciFields` reads `cperson.fields`,
  the list that client's file carried, so a label says what they were asked.
  A client whose file predates that list has their questions read back off
  the rows, photos first, with a plainer label — never an empty card.
- **A check-in file opens here too.** `OPEN A CLIENT FILE` takes
  `motherbase-checkin` as well as `motherbase-train` (`takeCheckin`). A
  client's weight arrives as an `ev` row and is kept as their `cval`, so it
  can never land in Tom's own weight log, and `cfield` is skipped so their
  questions never overwrite his. An older file writes nothing.
- **"New rows" counts what changed.** The store does not bump a row whose
  payload is identical, so counting every write called the same file new
  every time it was opened. `takeCheckin` compares the payload first.
- **The check-in types ride COACH's tab.** `CI_TYPES` is in both `IO.register`'s
  `types` and its `reads`, the way `cperson` already was, so a device where
  CHECK IN was never opened still sees them.

Watched in the browser 2026-09-23 with a made-up client: two check-ins drew
with their photos and changes, the date strip switched between them, the
photo opened big, a check-in file imported and re-imported (second time
"nothing new"), an older file undid nothing, the client's weight stayed out
of Tom's `ev` rows, a client with no check-ins drew no card, and a client
with no `fields` drew derived labels. 44px date buttons and no sideways
scroll at 375px. `_review.html` passed 116 of 116 at desktop and phone width,
foundation 328 of 328.

## Needs from the foundation

Nothing open.
