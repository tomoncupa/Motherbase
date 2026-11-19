# FLOW (CLAUDE.md)

Governs `flow/` only. The repo-root `CLAUDE.md` and `DOCTRINE.md` still apply
and win any disagreement.

## What it is

BLOCK's flow, followed from the phone. Tom, 2026-11-18: "a widget on the home
screen, as well as a way to answer block", "This can also be a phone app, a
phone web app, and then put a field where we can put notes for the day and
bullets as well." Nothing to do with STATUS's desktop widget.

- **A phone app**, on the home screen's roster with `phone: 1`, so it is in
  the phone bar, the APPS card and LINKS. Built to the phone rules: 44px
  targets, safe areas, the shared sheet and menus. Clients get it
  (`COPY_DIRS`), with BLOCK.
- **The card is `Flow.card`** in `shared/flow.js`, the same one HOME's FLOW
  card draws: where he is on top (gold ring), the next two levels below
  (each way out with its arrow words, then up to three blocks after each),
  a row of small blocks for where he travelled from. Clicking a block
  travels: it flies to the top, the old view lifts away, the next levels
  rise in and the lines draw. Travelling only looks; I'M HERE reaches every
  block on the way, each by its arrow (ticks, STATUS entries, one Undo);
  BACK TO NOW returns. Not started: START HERE on the start box.
- **The card's layout (0.2.1, Tom 2026-11-18: "up to three different pathways", "more space between the blocks", "text on the lines themselves"):** up to three ways out side by side across the full width, never a sideways scroll; more than three page through MORE WAYS, with last night's sleep's way first. Under each, the one block after it (and "+N more after" when it branches). Every arrow's words sit in a tag on its line, between the two blocks it joins. Uniform (0.2.2, Tom: "uniform in design"): every block, gap and tag in a row takes the tallest one's height, tags are the full width of their path, and a single path sits straight under the top block, full width.
- **Proportion (0.3.0, Tom 2026-11-18: "Make the words fit into the blocks, make the blocks follow proportion and beauty. I don't want ugly rectangles with long vertical reading. Don't be afraid to change font size."):** path blocks keep the golden ratio (1.618 to 1), the top block 2.618 to 1; each row takes the one font size its longest name fits at on whole words (20px down to 12 for paths, 16 for the second level, the top name 30 down to 14). Only a name that cannot fit at the floor lets its row grow. A single path is 62% wide, centred.
- **A line written lands in the block he is at (1.0.1):** one box, Enter adds (no ADD button), the kinds above it, Entry first. `Flow.note` writes the STATUS bullet and keeps its key on the walk's last step (`n`); the top block shows that step's last three lines. The line flies from the box into the block, which pops. The "saved on this phone only" sentence and the SETTINGS word are gone; a gear opens Settings, where sign-in lives. Today's list is hidden (a view change).
- **Comments only (1.0.2, Tom 2026-11-18: "We don't want a full bullet entry panel. We just want comments on the current block ... Save these as bullet entries, taking into account the time I type them in"):** one box, no kinds: Enter writes an Entry stamped with the minute it was typed (`at`, words kept as typed) and keeps it on the block he is at. Notes for today is hidden (a view change). With no flow, START WITH THE SAMPLE DAY makes `Flow.sample('day')`.
- **Branches and merges (0.4.0, Tom 2026-11-19: "branching paths, not just linear lines ... each level gets smaller boxes ... and this around convergence points"):** level two shows every block the shown paths lead to, smaller (80% of its column, words 14px down), each once: a block two or three paths lead to is drawn once and their lines meet at it. Blocks already on level one are not drawn again; four at most, the rest counted. The sample day gives two or three choices at most steps, paths that rejoin.
- **Which flow:** its own `flow.fid` setting when picked from the name
  button (shown only with two or more flows), else the one BLOCK has open.
- **Notes for today** is STATUS's `day` row, `note` (the words LOG shows as
  the day's summary), merged with `Rec.patch` 600ms after typing stops and
  on blur; a box being typed in is never redrawn.
- **Bullets** go through `Journal.add`, Entry by default, Enter saves, like
  BULLET. Today's last eight lines, newest first, read only.
- It owns no type. The flow itself is drawn and edited in BLOCK's Flow tab.

## Built and watched

1.0.0, 2026-11-18. Driven in headless Chromium at 390 x 844 with touch on
the 2020 chart: travelled Brush Teeth then Weigh in, I'M HERE logged both
with their arrows and ticks, a note typed reached the `day` row, a bullet
typed with Enter landed at the top of the list; nothing under 12px, no
sideways scroll. The icon (`APP_ART.flow`, a box and its two ways out) is
the build session's pick, not Tom's yet. Not seen on his iPhone.
