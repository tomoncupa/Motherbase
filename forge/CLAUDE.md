# FORGE (CLAUDE.md)

Governs `forge/` only. The repo-root `CLAUDE.md` and `DOCTRINE.md` still apply
and win any disagreement. COACH, TRAIN and FORGE are one system: read
`coach/CLAUDE.md` and `train/CLAUDE.md` before changing what goes between them.

## What it is (1.0.0, 2026-09-24)

Tom: *"A program builder - that functions like block - that outputs programs
I can send to clients. Have it mesh with COACH and TRAIN. Make it up to our
par."* Tom only, desktop only, never in the client build (`DROP_APPS` in
`tools/build-client.py`; the folder is not in `COPY_DIRS`).

Settled with Tom before building:

- **Its own app**, not a tab in COACH: a BLOCK-style board needs the window.
- **Weeks × days.** A program is N weeks; every week has the same days.
- **Each exercise carries sets, reps, first-set load, RIR and rest.** No
  supersets, no tempo, no %1RM. Add them only when asked.
- **TRAIN still gets first sets only.** The weight and reps of set one travel
  as a set; the set count, RIR, rest and note travel as a target TRAIN shows
  and never logs.

## The board

- **A day is a lane (`mb-card`), an exercise a plate (`mb-plate`)** in its
  muscle group's colour: TRAIN's `excat.slot` when TRAIN has the group, and a
  stable hash of the name otherwise.
- **The bin is TRAIN's vocabulary** (`exercise` + `excat`), plus names from
  clients' logs (`cex`) and every name already in a program. Typing a name that
  is not there offers it as new, and a lane's own "+ exercise" box takes a
  typed name straight into that day.
- **Every drag has a menu route** (law 6): a click in the bin adds to the day
  last touched (ringed); a plate's menu has Move Up, Move Down and Move To; a
  day's has Move Left and Move Right. Right click and a hold open the same menus.
- **A day's name is text until it is clicked.** An input inside the draggable
  head took the press, so a day could only be carried by its edges.
- **The strip over the days counts that week's sets per muscle group**, the
  number TRAIN later counts.
- **WEEKS** is the whole block on one screen: each exercise across every week.
  A value typed by hand is bright and an inherited one is faded. A cell opens that week on the board.
- **PRINT** is a sheet per week for a client who does not use TRAIN. It is
  written in system colours (`Canvas`, `CanvasText`), because paper is white
  whatever the theme.

## The weeks

`n`, `r`, `kg` and `rir` on the `fex` row are week one's. `wk[w]` holds only
what week `w` changes; anything it leaves out is the week before's, plus
`step` kilograms on an inherited load. `val(x, f, w)` is the one reader.

- **An inherited value is a placeholder, never written** (law 4). A value
  typed into a later week is drawn in the accent, and its week button is
  underlined.
- **Follow Week N Again** (a week's menu, or one plate's) deletes that week's
  own changes, with UNDO.
- **Removing a week shifts every later week's changes up one.** Removing week
  one folds week two's values, step included, into the row. This was wrong on
  the first try (a stale `wk[1]` survived) and is checked.
- Rest and the note are the same every week.

## What goes out

- **Published, not sent twice.** Every change republishes the program into
  COACH's `cprog` as `f-<id>` with `src: 'forge'`, 400ms later, and at once on
  `pagehide`. `Rec.patch`, so a field COACH adds later survives. COACH lists
  it, shows it read-only, sends it and puts it on a client. It never edits it,
  because the next publish would write over the edit.
- **The flattened shape** is COACH's `days` list: one day per week per day,
  named `W2 · Upper A`, each carrying `wk` and its plain `day` name. Beside
  each exercise: `sets` (first set only), `n`, `rir`, `rest` in seconds,
  `note`, `catName`. A 1-week program has no `W1 ·` prefix.
- **SEND** asks who. A client: their `cprog c-<pid>` is patched to this program
  (with a confirm when it would replace a different program), and the file is
  saved as `PROGRAM <name>.json` with id `c-<pid>`, the id COACH uses, so
  either app's resend replaces the same routine in their TRAIN. Anyone: the
  file only, id `f-<id>`.
- **COACH's own old library programs** are listed under "IN COACH · TAP TO
  BRING IN". A tap makes them FORGE rows (one week) and removes the COACH row,
  with UNDO. It never happens without a tap.
- **Deleting a program deletes its `f-` row too**, with UNDO. `tidy()` at start
  removes an `f-` row only when its program's tombstone is on this device.

## Watched (2026-09-24)

Headless Chromium at 1440×900 with a made-up client:

- a 4-week, 2-day program made through the dialog
- exercises dragged from the bin, clicked in, and typed into a lane
- week one filled as 3 × 8 · 100 kg · RIR 2 · 3:00, with a +2.5 kg step
- week 3 read 105 as a placeholder; week 4 overridden to 2 sets at RIR 4
- WEEKS showed 100 / 102.5 / 105 / 107.5, with week 4's changes bright
- `cprog f-` carried 8 flattened days with the right values
- SEND to the client wrote their `c-` row and saved the file
- TRAIN took the file as four routines named `· Week N`, and a resend with two
  weeks deleted weeks 3 and 4
- the routine line read `3 × 8 · RIR 2 · 3:00 rest`, and tapping it filled
  set one as 100 × 8
- the training screen read `Coach · 3 × 8 · RIR 2 · 3:00 rest`
- COACH listed it as `FORGE · 4 wk`, showed it read-only with EDIT IN FORGE,
  and its `fileOf` carried `n`, `rir`, `rest` and `wk`

Also watched: remove week 2 and week 1, move a plate across days by drag, reorder days by drag, print, delete and undo, and bring in a COACH program. `_review.html`
123 of 123 at 1440 and at 375, foundation 353 of 353. **Not watched:** a real
client's phone opening the file, and the print dialog itself (the sheet's
contents were read, `window.print` was stubbed).

## Open

- The reverse shelf (`coach/CLAUDE.md`, client files item 2) will carry the
  same bag. When it is built, SEND should use it and keep the file as the
  fall-back.
- The icon (an anvil, gold) was picked by the build session. Tom picks icons
  (`shared/CLAUDE.md`, App icon rework); swap it in `shared/icons.js` and rerun
  `tools/make-icons.html` if he wants another.
