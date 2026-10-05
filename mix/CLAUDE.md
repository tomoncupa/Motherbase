# ELEMENT (CLAUDE.md)

Governs `mix/` only. The repo-root `CLAUDE.md` and `DOCTRINE.md` still apply
and win any disagreement.

## Rules

**On a wide window, lay things out side by side; never fold text.** Tom,
2026-10-02 (the suite on his 3840 super ultrawide, where ELEMENT gets a
"narrow" frame of 900 to 1280px beside the home board, and the full stage
when opened over the board from its widget). From 1100px `draw()` builds
columns (`WIDE`, a matchMedia that redraws on crossing): the head of WHAT TO
WEIGH, its warnings and TODAY'S GOALS on the left; the drinks across the top
on the right, and under them the table, micros and facts beside WHAT TODAY
IS. Below 1100px it is the one stack it always was; from 900px the goals sit
beside the table and the micros beside the facts (`.pair`). Nothing is
hidden or put behind "show more". The phone must draw exactly what it drew.

## History, moved from the root brief on 2026-09-22

What was built and watched, newest last. Moved here verbatim so the root brief
stays small enough for per-module sessions.

MIX, built 2026-09-20 and driven in the browser. Tom, 2026-09-20: "this is meant to COMPLETELY replace protocol HTML, that one came out wrong." What to weigh out today in grams, from goals that move with the day. Four things it does that the old file could not. It reads today's food out of STATUS rather than asking for it twice, and works out the five nutrients STATUS does not keep — zinc, magnesium, copper, choline, preformed vitamin A — from a food table by matching the meal's name; a meal it cannot name, or one not logged in grams, is listed by name under the totals rather than silently counted as zero. The sodium base is the seven-day average of FOOD sodium, with MIX's own salt taken back out by key: without that subtraction today's added salt lands in STATUS, tomorrow reads it as food, and the base ratchets upward for ever, which is the exact opposite of the "keep what I retain the same every day" it exists for. Potassium is scaled against the base plus 200mg per litre sweated, not against the sweat-inflated sodium goal, because a litre of sweat costs about 200mg of potassium and about 830mg of sodium, and scaling by the goal asked for roughly five times what was lost and put the GI cap in the way of every training day. And zinc past the single-dose cap goes with the chicken meal instead of stopping short of the target, since the target is the thing priority 3 protects. Every dose line drags between cards, salt refuses the night drink, and the layout is a setting row rather than localStorage so it is in the backup and reaches the laptop. Watched on the test case Tom set: 1.667 L of sweat, a 4,038mg sodium goal, 0.071g of zinc glycinate, and logging twice writing one row rather than two. Never opened on a phone, and it is a desktop app. The swing warning measures the sodium KEPT, total minus what came straight back from sweat, because against the total it fired on every training day by design and a warning that is always on is one nobody reads.

**A wide window, 1.0.9, 2026-10-05.** The columns above. Measured on the demo
person, main's scroll height over the window height, before (the old one
column, 1080px at most) and after: 1928x943 2.78 to 1.46; 1600x943 2.78 to
1.52; 1280x943 2.78 to 1.63; 1100x943 2.78 to 1.89; 900x943 3.03 to 2.67;
1920x1000 2.62 to 1.38; 3840x943 2.78 to 1.18; 390x844 5.47 and 5.47, the
phone pixel-identical but for the clock. 1.3 at 1280 was the target and is
not reached: the inputs card is about 850px tall in the column it gets, and
narrower inputs would be unreadable. In a column the table's cells sit closer
(it needs about 430px, never squeezed under that); the small lines under a
dose amount wrap from 600px up, the name giving way first, because a drink
card under about 300px let them run past its edge (that already happened at
the old 1080px). Two bugs found while measuring, both fixed: `sessionMin`
subtracted TRAIN's ISO `start` and `end` strings, so on any day TRAIN had a
finished session the session minutes, the sweat, and the sodium and
potassium goals were NaN; and SWITCHED OFF compared freshly made slot
objects, so it listed every drink as off when none was.
