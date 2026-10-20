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

- A client's check-ins are read straight from CHECK IN's `pid|key` rows, never copied; a change is stated muted, never coloured; a check-in file opens here too and a client's weight never lands in Tom's `ev`. `CI_TYPES` ride COACH's tab. (HISTORY.md: Their check-ins, on their profile (1.0.4, 2026-09-23))

## The shelf: a send with no file (1.0.5, 2026-09-23)

- SENDS looks 1.5 s after first paint; a parcel goes through `takeFile` like a file and is cleared only after its rows are in. COACH and TRAIN sessions on one day are one session; only `pid|k-` sets bill. (HISTORY.md: The shelf: a send with no file (1.0.5, 2026-09-23))

## A 1:1 is never waiting on a send (1.0.6, 2026-09-23)

- The shelf is for online clients; a 1:1 never sends, so their empty state says LOG A SESSION. (HISTORY.md: A 1:1 is never waiting on a send (1.0.6, 2026-09-23))

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

## Sends both ways, built (1.0.15, 2026-09-30)

Tom: *"Ok lets fix that"*, on the 2026-09-24 plan above. Spans COACH, CHECK
IN, TRAIN and `cloud.js` 0.2.0.

- **Two trays in the database, a parcel each.** `drop/in/<client uid>/<id>`
  is what clients send; `drop/client/<client uid>/<id>` is what COACH sends a
  client. An id names what it carries (`train@1`, `ci-<date>@data`,
  `ci-<date>@front`, `prog@c-<pid>`), so sending the same thing again replaces
  its parcel. The part before the @ is one SEND, and `SENDS · N` counts those.
  The old one-slot shelf `drop/coach` is still read and cleared.
- **The quiet look reads names only** (`Cloud.list`, a shallow REST read), so
  opening COACH never downloads a client's photos to print a count.
- **Photos wait for the PC.** On an iPhone, iPad or Android phone
  (`photosHere`) SENDS takes the training and answers and leaves every
  `ci-*@<pose>` parcel for COACH on the PC, and says how many. Tom,
  2026-09-24: "Client photos live on the PC"; live sync never moves a photo.
- **A send is the only place COACH learns a client's account.** `tie` writes
  `cperson.uid` from the parcel's tray. A program can go straight to a client
  only once that is known; before it, SEND saves the file as before and the
  FIRST SETS card says so.
- **A new client from a send goes in ONLINE**, a file still in 1:1. Only
  online clients log and send for themselves.
- **SEND TO <NAME> puts the program in their tray** (`sendProg` with a pid),
  their TRAIN takes it the next time it opens, and `cprog.dl` records when.
- **FORGE's SEND reaches their TRAIN through here** (`forgeOut`). FORGE writes
  the client's `c-<pid>` with `from: 'f-<id>'` and has no send of its own, so
  COACH, wherever it is open, sends a `c-` row whose `days` are newer than
  both `ed` (COACH's own last edit, stamped by `saveProg` and USE FOR) and
  `dl`. An edit in COACH's FIRST SETS never goes by itself; SEND sends it.
- **Settings, COPY RULES** copies the whole database rules block with Tom's
  account already in it (`Cloud.rules`). Nothing is edited by hand.

Watched 2026-09-30 against a stand-in database (a Python server holding the
rules written out by hand, `drop` paths only), with the client on one origin
and COACH on another: a session queued with no signal, survived a reload,
went on `online`, and SENDS took it as the client's 6 sets and 120 exercises
with Tom's own `set` and `exercise` counts at 0; a check-in went as three
parcels (answers, front photo 1440x1920 shrunk to 810x1080, goal), COACH at
phone size took the answers and left both photos without downloading them,
at desktop size took the photos; SEND TO TESTY landed in the client's TRAIN
as a routine on its next open; a FORGE-shaped write to `c-<pid>` went to the
client's tray when COACH next opened, and a FIRST SETS edit afterwards did
not. **Not watched:** the real Firebase (nobody signed in), the real rules,
the REST shallow read against Firebase, any iPhone.

## FORGE builds the programs (1.0.10, 2026-09-24)

Programs are built in FORGE now (`forge/CLAUDE.md`). COACH stays the place a
program goes out from.

- **FORGE publishes into `cprog` as `f-<id>`, `src: 'forge'`.** Those rows sit
  in PROGRAMS beside the old ones, tagged `FORGE · N wk`, and open READ-ONLY:
  week one's days with each exercise's target, EDIT IN FORGE, SAVE AS FILE and
  USE FOR the client. They are never edited here, because FORGE republishes
  on every change and would write over the edit. Their menu has no Delete; a
  program is deleted in FORGE, which removes its `f-` row.
- **+ NEW PROGRAM became + BUILD A PROGRAM IN FORGE** (law 8, one way to make
  one). A program made here before stays editable here, and FORGE offers to
  bring it in.
- **`fileOf` carries what FORGE adds**: a day's `wk` and plain `day`, and
  beside each exercise `n`, `reps` (a range), `bands`, `rir`, `rest`, `note`
  and `catName`. Still only the FIRST set as a set, and from FORGE only its
  load, per Tom's Algrowrithm (`forge/CLAUDE.md`). `v: 2` when a program has
  more than one week. COACH 1.0.11 added `reps` and `bands`.
- **USE FOR on a FORGE program** also copies its name and `weeks`, and
  `from: f-<id>`, so FORGE's SEND knows it is not replacing someone else's.
- **An open slot rides along (1.0.12, 2026-09-25).** `fileOf` keeps an entry
  with no name when it has a `slot`, the read-only view shows "Any Chest",
  and a client's first-sets editor shows it as the placeholder, so typing a
  name there fills the slot for that client.
- **A client's FIRST SETS editor keeps those fields.** It deep-copies the days
  and changes only a name and set one, so `n`, `rir`, `rest`, `wk` and `day` ride
  through an edit made here.

## A wide window (1.0.16, 2026-10-05)

**On a wide window, lay things out side by side; never fold text.** Tom,
2026-10-02 and 2026-10-04: he runs the suite on a 3840 ultrawide, where the
home screen gives COACH a frame about 1928 by 943 (1600 at its floor). He
wants "to minimize the need for scrolling", approved "apps use the width",
and said no to folding anything behind "show more".

- **From 1560px** the box sits with FIRST SETS / PROGRAMS under it on the
  left (`clamp(380px,20%,400px)`, as on an upright iPad), and the client
  takes the rest in three columns of their own: the name, the week and the
  check-in; RECENT SESSIONS (1.3 times as wide, it is the longest); then
  STRENGTH and the range. The page caps at 2400px.
- **`drawClient` builds the three columns only past `WIDE`** (a
  `matchMedia` on the same width, redrawing when it is crossed). Below it,
  `drawClientIn(col, col, col)` makes the same calls in the same order into
  one column, so 1280, an iPad and a phone draw exactly as before.
- **Past 1560 nothing ends in an ellipsis that did not have to**: an
  exercise name and its set list wrap, every check-in date shows (the strip
  wraps instead of scrolling the newest off the side), STRENGTH's numbers
  stay on one line, and "week before" takes its own line.

Measured in headless Chromium with the demo (six clients), main's scroll
height over the window: 1928x943 2.70 to 1.15, 1600x943 2.70 to 1.15,
1920x1000 2.55 to 1.08, 2560x943 2.70 to 1.15; every client 1.12 to 1.15.
1280x943 stays 2.72 and 390x844 stays 4.91 (screenshots pixel-compared
before and after, phone identical). No sideways scroll, no button under
44px, no page errors at any width.

## Drag a client to another slot (1.0.17, 2026-10-08)

Tom: *"let me drag and drop pokemon/client locations, just put them in the
next available slot."* New clients already took the next free slot
(`freeSlot`, and `clientDialog`'s own loop).

- **`dragSlot`**: press a client and move 8px and they follow the pointer
  (a ghost, the slot left faded); let go over another slot to trade places,
  over an empty one to move in. Pointer events, so a mouse and an iPad finger
  both work; `touch-action:none` on filled slots only, so the box still
  scrolls from an empty one. A press that never moves is still a tap, a held
  still finger still opens the menu, and the click that follows a drag is
  swallowed (`slotDragged`).
- **It writes the slot each client is DRAWN in**, so the first drag mends two
  clients a sync left on one number. Jay and Zef were both slot 2 in the
  1:1 box on 2026-10-08: two devices each ran `freeSlot` before syncing.
- **A clash no longer hides anyone.** `drawBox` parked a second client on a
  taken number at `list.length + i`, a number inside the box, so with three
  clients the third overwrote a real slot and vanished. It parks them past
  `SLOTS` now and they fill the first empty slot.

Watched in the browser with the demo, by pointer events on the slots (the
pane was not drawing): ghost shown, target ringed, moved to an empty slot,
two traded, a still press selected, the click after a drag ignored, three
clients on one number all drawn. Not tried on an iPad.

## Right click, everywhere (1.0.21, 2026-10-17)

Tom: *"Add complete right click function on COACH."* `menuOn(el, items)` is
`Mobile.hold` (right click and a held finger) opening `UI.menu`; a box being
typed in keeps the browser's own menu.

- **A client** (slot or name card, `clientItems`): Open, Log A Session,
  Import Their Log, Weight Step…, Send First Sets (when there are any), Edit
  Name And Pokémon, Move To each box, Copy Name. **An empty slot**: Add A
  Client Here, into that slot (`clientDialog(null, slot)`).
- **Weight Step…** (`stepDialog`) writes the client's own TRAIN setting
  `train.<pid>|increment`, the same box as their TRAIN's Settings. Tom: "I
  need to set weight intervals per person." TRAIN 1.0.63 made that setting
  reach every exercise.
- **A day in the week, a recent session**: Open In TRAIN (`openTrain(pid,
  {date})`, TRAIN's log on that day once its store is in), Copy As Text; a
  rest day up to today: Log A Session On it. The week's head walks weeks.
- **STRENGTH, a block lift**: Copy As Text. **A check-in date**: Show it. **A
  photo**: See Bigger, Save Photo.
- **A program**: Open, Use For the picked client (`useFor`), Save As File,
  Edit In FORGE or Delete. **The first-sets editor**: a day adds, duplicates,
  moves or removes; an exercise adds below, moves up or down, or is removed
  with UNDO.
- **The bare page**: Add A Client, Open A Client File, Sends, the picked
  client's menu, Settings. A menu on an element already took the click
  (`defaultPrevented`), so one right click never opens two.
- **Not built: Delete Client.** Decided 2026-09-24 (wipes training, check-ins
  and photos, WEALTH keeps the money); it needs its own yes.

Watched on the demo by right-click events on each element: every menu's
items, Weight Step saved 1.25 and the client's TRAIN stepped by 1.25 while
Tom's stayed unset, Open In TRAIN landed on that day, Move Up, Remove with
UNDO, Duplicate Day and Use For wrote what they said. Not tried on an iPad.

## Needs from the foundation

`shared/_smoke.html` checks the 0.1 shelf (`send`, `waiting`, `took`,
`who`). Nothing checks cloud.js 0.2.0's trays and outbox yet: `post` queueing
with no signal and sending on `online`, `list` and `count` from names, `fetch`,
`took(from, id)`, `inbox` and `opened`, and `rules()` parsing as JSON. A
foundation session should add them, driven through `Cloud._probe` the way the
shelf checks are (a stand-in `db` with `.info/connected`, and `keys` for the
shallow read).

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
- **The range is one picture** (1.0.14): blocks as mountains, sessions as
  trees standing on them, sets in a tree's height, volume a week in a
  mountain's. Tom, 2026-09-26: *"I dont want to have blocks, sets, volumes,
  sessions all different."* The BASE switch went; PRINT stays, kept as
  `coach.rangePrint`, so a client's painting opens the way Tom last left it.
  A leftover `coach.rangeBase` setting is read by nothing. The engine is
  `shared/range.js`.
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

## Ghost, range and strength in a block (1.0.18 and 1.0.19, 2026-10-08)

- **A drag listens on the window.** A sync landing mid-drag redraws the
  box, the slot is replaced, and a release heard only by the slot left the
  ghost floating over the page (Tom saw a Geodude under VOLUME). Watched:
  old code ghost stays after a redraw mid-drag, new code clears it.
- **The range runs under all three columns past `WIDE`** (`.cc-d`, the
  fourth argument of `drawClientIn`) and passes `perDay: 2`, so a year fits
  on a desk. Tom: "less then 37 trees and I don't see 3 distinct mountains":
  it had opened on the first day, built while the columns were off the page.
  Measured: 37 of 37 trees and 3 of 3 mountains in view at 1600 and 1928.
- **STRENGTH · <BLOCK>** (`drawBlockStrength`, above the all-time STRENGTH
  table). Tom picked "A and B": a row per lift (estimated one-rep max at the
  block's first session, BEST in the block, the change muted, a line through
  every session with that day's set at the pointer), then every lift on one
  chart as a share of its start. Arrows walk the blocks; no blocks means the
  last 8 weeks. BEST is the block's peak, not the last session, so a deload
  does not read as lost strength (Claude's call, Tom's "ok" 2026-10-09). A lift needs two
  days in the block to show. Warmups by TRAIN's rule (`warmSet`).
- **Every reader of a client's sets uses `warmSet`** since 1.0.20: the week
  strip, RECENT SESSIONS (`sessionsOf`) and the all-time STRENGTH table
  (`liftsOf`) skipped only a marked warmup until then, so a set commented
  "wu" counted in volume, set counts and best lifts.
- COACH loads `chart.js` since 1.0.19.

## Less stiff (1.0.22, 2026-10-18)

- Tom: TRAIN and COACH "feel stiff, like it's not 1 designed cohesive intuitive system". He picked four fixes; the COACH layout itself is still to be diagnosed with a mockup and his pick.
- **One voice with TRAIN:** page buttons in Title Case (Sends, Open Client File, Log Session, Import Their Log, Send To <name>, All Programs, Build A Program In FORGE), Settings is the gear icon, no character drawn as an icon. Group headings, segmented tabs and dialog actions stay in capitals, as in TRAIN.
- **No blinking:** `draw()` builds all three columns and swaps only a column whose built HTML differs from the last draw's (`drawn`), so a sync or an unrelated write moves nothing. A different client fades in (`mv-in`), with a timer that takes the class off in an undrawn page.
- **TRAIN inside COACH is one bar:** `.obar` is hidden; TRAIN's back arrow posts `coach-close` and `closeTrain()` runs. DONE's code stays for a TRAIN too old to have the arrow.

## The layout (1.0.23, 2026-10-18)

- Tom picked all six fixes. Measured first at his 1928 x 943 frame: the client was 1,510px tall, recent sessions 1,045px, the range below the fold, programs under the box mostly off screen, strength twice.
- **Two views beside the box:** the client, or PROGRAMS (`view`, `.cols[data-view]`). The header's Programs button toggles it; the client card's Program button opens First Sets for that client; Back To <name> returns. Picking a client while on First Sets stays on First Sets, anywhere else shows the client.
- **The box column is 260 to 300px** at every width past 760.
- **Past 1180px (`WIDE`)** the client is a grid: the name card and the range share the top row (range 140px tall), then the week and check-in, the sessions, the strength; two columns to 1560, three past it. Below 1180 one column, range straight under the name.
- **One Strength:** the all-time table sits inside the block strength card (`.card.bk`) under ALL TIME.
- **Recent sessions shows five**, then Show N More adds ten.
- Result at 1928 x 943: client 1,297px tall, name and range on the first screen. At 1440: 2,463px from 3,190. [Measured in the Browser pane; NOT on his screen.]

## Tom arranges the cards (1.0.24, 2026-10-18)

- Tom: "Coach - let me rearrange the screen layout", and "1 layout for all clients". Past `WIDE` the six cards (Name, Range, Week, Check In, Recent Sessions, Strength) are dragged by their heading into the top row or any of three columns, at any place. A gold line shows where it lands; the card fades where it was. Below 1180 they stay one column in the old order, with no handles.
- **Where each stands is one setting, `coach.layout`**: `{card: 'top:<n>' | '<column>:<n>'}`, no lists, because live sync drops an empty one. Written only by a drag that changed something, a menu move, Reset Layout and its UNDO; never on open. No setting reads as the 1.0.23 layout (`LAY0`).
- **The heading is the handle** (`grabCard`): `.who`, `.wkhead`, `.rg-head` or the `h2`, buttons inside it still pressed. Its right click or held finger gives Move Up / Down (Left / Right in the top row), Move To Top Row, Move To Column N and Reset Layout. The name's and the week's own menus gain them below a divider (`andCard`); a right click anywhere else on a card puts them first in the page menu. Up and down step past the cards on screen only, so a card this client lacks (no check-ins) is never stepped over unseen.
- **Each card is built into its own holder** (`drawClientIn(put)`, `.cw[data-card]`), and `drawClient` stands the holders in `.cc-top` and `.cc[data-w]`. `.cc-a` to `.cc-d` are gone. Between 1180 and 1560 column 3 is a full-width row under the other two. Empty columns stay in the grid, so the others keep their place; during a drag they show as outlined drop zones.
- **The drag listens on the window and looks every card up by name on each move**, so a redraw mid-drag (a sync, `draw()` swapping a column) does not end it. It scrolls the page near the top and bottom edges.
- Watched in headless Chromium at 1928 x 943 with real mouse drags on the demo: Recent Sessions to column 3 above Strength, Week into the top row between Name and Range, Check In to column 2 with the columns redrawn mid-drag, Move To Top Row from the menu; the layout held on reload and on another client, Reset and UNDO, 1400 two columns, 1000 the old one-column order, no page errors, no row written by opening or by menus. **Not tried in the desktop program or on an iPad**; the Browser pane crops a 1928 page, so it was not used for the drags.


## Training blocks from COACH (1.0.25, 2026-10-21)

- Tom: "Where do I start a new training block for a client", then "Fix the Coach UI then". It was only inside their TRAIN, three menus deep.
- **The client card has a TRAINING BLOCK line** under Log Session (`blockLine`): the block running, Week N (of M when it has an end), when it ends, and the next block planned. With none running it says so, names the last one and when it ended, and New Block is the gold button. Stated, never judged.
- **The block is still made in TRAIN's own dialog**, because it holds the Days row (the block's routine in rotation). `openTrain(pid, {block: 'new' | key})` opens `train/index.html?client=<pid>&block=...`; TRAIN opens the dialog once its store is in and sends `coach-close` when it closes, unless the save went on to Training Routines or a delete is still asking. A block request always reloads the frame.
- **The same, from menus:** the client's menu (Edit <block>, New Training Block) and the STRENGTH · <BLOCK> heading's menu (edit the block on screen, New Training Block, then the card moves).
- `blocksFor` and `blockNow` read `cphase` the way TRAIN's `phases` and `phaseSpan` do: a block runs to its own end or the day before the next starts.
- **Fixed on the way:** a client's first block threw in `drawBlockStrength` (`bkAt` stayed -1) and stopped the whole client drawing until a reload. A sync bringing a first block did the same. `bkN` now jumps to the newest block when the count changes.
- Watched in the Browser pane on the demo by pressing the controls: New Block opened TRAIN's dialog on the client, SAVE wrote `cphase` `p-mika|k-…` and came back to COACH, the line showed "Week 3 of 8", tapping it reopened the block filled in, a planned block showed as Next, CANCEL came back, the heading menu listed both items. Pictured in headless Chromium at 1928 x 943 and 390 x 844, no page errors, no sideways scroll. **Not tried in Main Menu.exe or on his screen.**
- **A client's block can run their own program** (1.0.26, TRAIN 1.0.76): the block dialog's Days row on a client's profile offers "Their program · <name>", their `cprog c-<pid>` (what Use For or FORGE's Send gave them), brought in by `useForgeProgram` as their own routines (`prog-c-<pid>-wN`), again on every save. The block line says "Runs <name>". Then Log Session leads with Next: <day>, set one at the program's load. Watched on the demo: a two-week Upper/Lower on Mika, Next: Upper A logged Bench 60 and Row 50 on Mika, none on Tom.
