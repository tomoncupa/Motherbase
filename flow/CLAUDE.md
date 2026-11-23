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
- **The card is `Flow.card`** in `shared/flow.js`, the same one HOME's FLOW card draws. Since 0.5.0 (2026-11-19); the 0.2 to 0.4 layouts are in git history. Tom: "Flow just doesn't feel like I'm traveling down a branching path ... It's literally just six rectangles. It looks linear", "i don't need to know where I am", "Why are there labels of good, bad, okay?", then "Travel should be from top down", "Lines should follow the example photo", "just show the next set of options, not the next 2". Rules that stand:
  - The block he is at on top, drawn as BLOCK's plate (`mb-plate`, `--c` its kind); a gold point before the day starts, with the start block as the one way.
  - Every way out below it, full width, one trunk down the left branching right into each with a rounded corner and an arrowhead, as his 2020 chart's Down time fans. One level only. No arrow words, no "you are here", no paging.
  - Pressing a way reaches it (step, tick, STATUS entry, Undo). The block flies up into the top slot, the old one lifts away, the next ways drop in from above and the lines draw down. Looking ahead without logging is gone.
  - Names shrink from 18px (20 on top) to 12 on one line, then wrap; never cut.
- **Phone is for tracking and input; changes to a flow are made in BLOCK on the PC** (Tom, 2026-11-19). FLOW stays its own address, but it lives inside BLOCK.
- **A line written lands in the block he is at (1.0.1):** one box, Enter adds (no ADD button), the kinds above it, Entry first. `Flow.note` writes the STATUS bullet and keeps its key on the walk's last step (`n`); the top block shows that step's last three lines. The line flies from the box into the block, which pops. The "saved on this phone only" sentence and the SETTINGS word are gone; a gear opens Settings, where sign-in lives. Today's list is hidden (a view change).
- **Comments only (1.0.2, Tom 2026-11-18: "We don't want a full bullet entry panel. We just want comments on the current block ... Save these as bullet entries, taking into account the time I type them in"):** one box, no kinds: Enter writes an Entry stamped with the minute it was typed (`at`, words kept as typed) and keeps it on the block he is at. Notes for today is hidden (a view change). With no flow, START WITH THE SAMPLE DAY makes `Flow.sample('day')`.
- **Which flow:** its own `flow.fid` setting when picked from the name
  button (shown only with two or more flows), else the one BLOCK has open.
- **Notes for today** is STATUS's `day` row, `note` (the words LOG shows as
  the day's summary), merged with `Rec.patch` 600ms after typing stops and
  on blur; a box being typed in is never redrawn.
- **Bullets** go through `Journal.add`, Entry by default, Enter saves, like
  BULLET. Today's last eight lines, newest first, read only.
- **The box is a custom option (1.0.3, Tom 2026-11-19: "I want the text box to instead act like a custom option"; picked A+B+C, then D):** Enter takes him off the flow with `Flow.free`. His words are the block on top, edged in gold dashes, and a STATUS Entry at the minute typed, with Undo. Below it, the ways back: the ways out of the block he left, then what he went to after these same words before (line "What you did after this before"), then the nearest floor block not done today (line "Floor, not done today"). Pressing one rejoins the flow. Comments on a block are gone from the box; `Flow.note` stays for anything else. With no flow it saves a bullet and says to make a flow in BLOCK.
- It owns no type. The flow itself is drawn and edited in BLOCK's Flow tab.

## Built and watched

1.0.0, 2026-11-18. Driven in headless Chromium at 390 x 844 with touch on
the 2020 chart: travelled Brush Teeth then Weigh in, I'M HERE logged both
with their arrows and ticks, a note typed reached the `day` row, a bullet
typed with Enter landed at the top of the list; nothing under 12px, no
sideways scroll. The icon (`APP_ART.flow`, a box and its two ways out) is
the build session's pick, not Tom's yet. Not seen on his iPhone.
