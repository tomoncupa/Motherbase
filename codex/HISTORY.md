# CODEX history

The diary. `CLAUDE.md` beside it holds the rules.

## 2026-10-13: built, 1.0.0

Tom: *"We should make our glossary bank like an interactive game."* Asked
which bank: *"The one in Skool."* Who plays it: *"Me only."*

Finding it took most of the morning. Nothing called a glossary exists in this
repo, in Tom's artifacts, in Drive or in `tom-context`. His "Skool Classroom
Drafts: Review" doc named it: the **bracket database**, terms tagged [STATS],
[CONDITIONS], [TRAITS]. A session on his PC (tom-pc-vivid-fountain) searched
Downloads, Documents and Desktop read-only: no database file anywhere, only the
writers' flags file with candidates, and the note that each term is a published
Skool page titled like `[Palatability]`. Tom then pasted the database himself:
names and brackets, no definitions.

Two decisions made on the day, both stated to Tom:

1. **The definitions are drafts, marked as drafts.** His are on Skool pages no
   cloud tool can read. A banner counts the drafts until he replaces them.
2. **Skool's text never enters this public repo.** His definitions come in by
   LOAD and stay in his browser. The names are generic words and LIBRARY
   already publishes Skool's section names, so the names are built in.

## 2026-10-13: the review, 1.0.1

A workflow of six reviewers drove the real page in headless Chromium, each
through one lens (game logic, the parser, phone and desk, answers and masking,
data safety and repo rules, the truth of every word), and three skeptics tried
to refute every finding. 96 reported, **80 confirmed** (1 P0, 18 P1, 61 P2),
16 refuted.

The ones worth remembering, because the same mistakes are easy to make again:

- **P0. Typo slack measured from the entry, not the answer.** Personal Record
  is 15 letters, so it got two slips, and those two slips applied to its alias
  "PR": every string of one or two characters, "x" and "no" included, was
  accepted and marked MASTERED. The slack now belongs to each answer, and a
  typo must be nearer this entry than any other.
- **The blank gave the answer away.** In "which definition?", the right
  option was the only one with a blank for DOMS, PCOS, Hypothyroidism and
  Sleep (their drafts name themselves), and decoys that mention the asked
  word ("when stress outruns recovery") were blanked into looking right.
  Options are now shown as written, and a self-naming entry is asked the
  other way round.
- **Masking in many passes ate its own markup.** An alias "Label" matched
  inside `aria-label` of a blank already written. One pass with an
  alternation, longest first, cannot do that.
- **Stale state across screens.** A number key on a discover screen graded
  the new entry against the previous question's options; a timer from a
  finished SORT ended the next one before START; a tap aimed at NEXT landed
  on the I DON'T KNOW that the 750 ms auto-advance had just put in the same
  spot. Fixed with per-question resets, `stopRun()`, and the 350 ms footer
  guard.
- **Two sheets closing in one tick stepped history back twice**, so ERASE
  PROGRESS and BACK TO THE DRAFTS left the app and took their UNDO with them.
  `guardClose` now coalesces.
- **Skool pages broke the parser.** A "Why it matters:" label, a bullet
  list, a "24 - 72 hours" range or a "[STATS]" mentioned in a sentence each
  started a junk entry and cut the real definition. The page context fixed the
  lot at once, which is the check one level under the bug: not "this label
  splits", but "inside a page, nothing splits".
- **Draft aliases pulled other pages onto entries**: a pasted "Strength
  Training" overwrote Weight Training's definition. Alias matching now needs
  Tom's own alias or a name within three letters.
- **Four drafts were wrong or misleading** and were rewritten: PCOS (two of
  three Rotterdam criteria, not all), Depression (most of the day, nearly
  every day; sleep, appetite *or* energy; a doctor *or psychologist*),
  Training (separated "from exercise" while being exercise), Height (said
  "Fixed", which argued it into TRAITS in SORT). The STATS meaning now allows
  a stat that rarely moves.
- **Copy that lied in edge states**: "SORT and BLITZ are open" beside a locked
  BLITZ, "1 definitions are yours", "known" leaving out mastered entries,
  freezes already owed counted as banked, "answers saved" counting retries
  that were never graded.

Refuted, and why (so nobody "fixes" them): the Willpower draft is not the
ego-depletion claim; "1 to 2 kg day to day" is the right coaching range;
"Adults need 7 to 9 hours" is the NSF range; Dopamine Overload needs no clinical
caveat because the CONDITIONS meaning already spans "a passing effect to a
diagnosis"; "Weightlifting" is never accepted for Weight Training (distance 6).

A second workflow re-ran every confirmed repro against the fixed file and
hunted regressions in the rewritten parts; its result is recorded below when it
lands.
