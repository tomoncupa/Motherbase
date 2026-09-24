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

## The shelf: a send with no file (1.0.5, 2026-09-23)

A client's TRAIN now uploads instead of making a file (`train/CLAUDE.md`, Send
To Coach). COACH takes it off the shelf.

- **`SENDS` in the header** says how many are waiting, and COACH looks once,
  1.5 seconds after the first paint — after it, because the shelf needs the
  network and a paint must not.
- **Nothing new happens to the data.** A parcel holds the bag the file always
  held, so it goes through the same `takeFile` and merges on `updated_at`. The
  transport changed and nothing else did.
- **A parcel is cleared only after its rows are in**, and one that cannot be
  read is left on the shelf rather than thrown away. Until COACH has taken it,
  that parcel is the only copy anywhere but the client's phone.
- **Settings shows the account id**, because the drop rules in Firebase need it
  written in and nowhere else in the suite shows it. It is not in this repo; it
  is read off the live sign-in.

**COACH and TRAIN sessions are already one, and were before this.** Tom,
2026-09-23: *"Treat Coach and Train sessions as 1."* Measured rather than
assumed: `sessionsOf` groups every one of a client's `cset` rows by date, so a
day holding a set Tom logged here and a set the client sent from their own
phone is ONE row in RECENT SESSIONS with one combined volume, and
`countSession` writes one WEALTH `sesh` for it. The one place they are
deliberately not one is billing: `coachSets` counts only `pid|k-` keys, so a
day the client logged alone bills nothing. A client training on their own is
not a 1:1 delivered. Do not "fix" that.

## A 1:1 is never waiting on a send (1.0.6, 2026-09-23)

Tom: *"My 1:1s don't track their own sets at ALL."* Which settles what the
shelf is for and who it is not for.

- **The shelf is for online clients.** A 1:1 never opens TRAIN, so they will
  never press Send To Coach and there will never be a parcel from them.
- **So the empty state asks the right thing of the right person.** A client in
  the 1:1 box is told to press LOG A SESSION; anyone else is told to ask the
  client to send. Telling Tom to chase a 1:1 for a file is advice nobody can
  act on.
- **And the billing rule is not a gap.** `coachSets` counting only `pid|k-`
  keys was described here as "a day the client logged alone bills nothing".
  For a 1:1 that day cannot exist. For an online client it should not bill,
  because they are not buying sessions. Nothing to change.

## Client files, decided and not built (2026-09-24)

Tom settled how a client's things reach him. Clients here means coaching
clients on the client build. Spans COACH, CHECK IN, TRAIN and `cloud.js`.

1. **Check-ins go on the shelf too.** Same SEND TO COACH, nothing leaves until
   pressed. One parcel per photo, shrunk to 1080px for the trip, so each fits
   the two-million-character cap.
2. **Programs come back over a reverse shelf.** Tom sends from COACH; it lands
   in the client's TRAIN on their next open. The file stays as the fall-back.
3. **Client photos live on the PC.** Live sync keeps skipping them; the sheet
   is the second copy. Tom: minimise the files he gets. So a send with no
   signal WAITS on the phone and goes by itself when signal returns, and
   signing in becomes a step in `ONBOARDING.md`. A file is left only for a
   blocked Firebase or a folder copy.
4. **Keep past clients, with a delete button.** Delete wipes their training,
   check-ins and photos (`cset` and the other `c` types, `cval`, `cphoto`,
   `cmark`, `cref`). WEALTH keeps their `client`, `paid`, `sesh` and `pack`
   under their name: that is his income history.

First real test of any of it: Tom and one online client both signed in,
sending one session. The real database has never been in the loop.

## Needs from the foundation

`shared/_smoke.html` has no checks for the coach shelf (`Cloud.send`,
`waiting`, `took`, `who` in `cloud.js`). Everything watched so far stubbed the
transport. A foundation session should add them.

## The week, and the lifts (1.0.8, 2026-09-24)

Tom: *"I want to see their week at a glace, I want to see their most recent
lifts per session."* Both were things the profile could nearly answer and
did not.

- **THIS WEEK** sits under the client's name: seven days, Monday first, each
  a bar as tall as the volume in it with the set count above the bar, then
  the week's sessions, sets and volume with the week before it stated beside
  them. The arrows walk back a week at a time. Which week is on screen
  belongs to the client, so picking another client comes back to this week.
- **The number is never drawn on the bar.** White on gold cannot be read, and
  every theme's accent is a different colour, so no one text colour would be
  safe over it. The bar is capped at 62% and the count keeps the band above.
  Every bar is scaled the same, so comparing one day with another is
  untouched.
- **The change is stated, never judged**, the way `ciChange` already does it:
  the week before is a number beside this week's, with no arrow, no colour
  and no word for it. Root brief, self-determination theory.
- **RECENT SESSIONS prints what was lifted.** `sessionsOf` used to add each
  set into a volume and throw it away, so the card could say a session
  happened and never what was in it. It now keeps the sets, grouped by
  exercise, and the card prints each exercise with every working set as it
  was logged — `60×8 · 60×6 · 55×8` — in the unit Settings is set to, with a
  set TRAIN flagged as a record in the accent. Warmups stay out, as they are
  out of the volume.
- **A session reads back in the order it was done.** The store hands rows
  back in no order, and `set.ord` numbers a set within its own exercise so it
  cannot tell two exercises apart. The earliest set key can, because a set
  key is a timestamp; an order Tom set by hand in TRAIN beats it, and it is
  already on the day's `csession`.
- **The range moved to the bottom.** The week and the sessions answer today,
  the range answers the year, and that is the order a coach reads them in.

## IMPORT THEIR LOG (1.0.8, 2026-09-24)

Tom: *"Bring back the upload training data function from the most common
apps, and fitnotes."* It existed, in TRAIN, three folds into Settings, and
from a client's profile there was no way to it at all.

- **COACH has no importer and must never grow one.** The button opens the
  same client TRAIN that LOG A SESSION does, at
  `train/index.html?client=<pid>&import=1`, and TRAIN puts its own import
  panel up. The adapter at the top of `train/index.html` is already what
  sends every row TRAIN writes onto the client, so a FitNotes backup and a
  Strong, Hevy or JEFIT CSV all land on the client with nothing new written
  here.
- **The panel says whose log it is** when it is a client's. A backup dropped
  into the wrong one is thousands of rows to undo by hand.
- **An imported set does not bill.** `coachSets` counts only `pid|k-` keys,
  and an imported set is keyed `csv-…` or off the FitNotes row. History
  arriving is not a session delivered.
- **The frame is reloaded when the panel is asked for**, because the address
  is what opens it, so a frame already showing that client cannot just be
  shown again.

Watched in the browser 2026-09-24 with a made-up online client and three
weeks of training: the week strip drew the right days, sets and volumes
against the totals worked out by hand, the arrows walked back two weeks and
would not go past this one, switching client came back to this week, a client
with no training drew an empty week and the right empty state, and each
session printed its exercises in order with its sets and the record in the
accent. IMPORT THEIR LOG opened the client's TRAIN with the panel up, a
five-set CSV carrying a comma inside an exercise name imported onto the
client, and Tom's own `set`, `exercise` and `tick` counts did not move.
44px targets on the arrows and both buttons, no sideways scroll at 390px.
`_review.html` passed 116 of 116 at desktop and at 375px, foundation 348 of
348.
