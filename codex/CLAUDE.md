# CODEX

**Tom's Skool bracket database, played.** Every term in the database lives
under a bracket: [SKILLS], [STATS], [CONDITIONS], [TRAITS]. CODEX teaches the
two things worth knowing about each one: what it means, and which bracket it
belongs in.

Governs `codex/` only.

## It is not a Motherbase app

Tom, 2026-10-13: *"We should make our glossary bank like an interactive game"*,
and when asked who plays it: *"Me only."* The glossary bank is the BRACKET
DATABASE in his Skool community.

It lives here on RECKON's terms (read `reckon/CLAUDE.md`, "It is not a
Motherbase app"), and they apply unchanged:

- **It loads nothing from `../shared`.** Every line is in `codex/index.html`.
- **It shares no data with the suite.** Its keys all start `cx.`.
- **It is not in the dock and not in the client build.** `tools/build-client.py`
  copies an allow-list, and `COPY_DIRS` does not name `codex`.
- **The root `CLAUDE.md` still governs how the work is done**: complete truth,
  testing in the browser, one commit per change, the version tag, push.

## The database, and what is Tom's

Tom pasted it on 2026-10-13:

| Bracket | Entries |
|---|---|
| [SKILLS] | Food Weighing, Nutrition Label Reading, Calorie Counting, Scale Tracking, Training, Cardio, Lifting, Weight Training, Progressive Overloading, Recovery, Calorie Banking, Fasting, Environment Design, Journaling, Volume Eating, Form Review |
| [STATS] | Weight, Height, Body Composition, Maintenance Calories, Personal Record, Sleep, Stress, Willpower, Dopamine, Satiety, Palatability |
| [CONDITIONS] | DOMS, Sleep Deprivation, Stressed, Hypothyroidism, PCOS, Lipedema, Calorie Deficit, Weight Loss, Dopamine Overload, Depression, Alzheimer's, Neurodegeneration |
| [TRAITS] | Empty. Populate as content development surfaces candidates. |

**The names and brackets are his, verbatim. Every definition and every bracket
meaning built into the file is Claude's draft**, and the screen says so: a
DRAFT mark on each one and a banner counting them. His real definitions live on
his Skool pages (each term is a published page titled like `[Palatability]`),
which no tool in a cloud session can read.

**Skool's text never goes into this repo.** The repo is public and the Skool
community is paid. LIBRARY already set this line (`library/CLAUDE.md`: facts
public, page text left out). So Tom's own definitions arrive by LOAD (paste or
file) or EDIT, and live only in that browser, as `cx.term.<id>` rows. BACK UP
and RESTORE carry them between devices.

Candidates that are NOT in the database, from the writers' flags file on his PC
(`TM Brand/05 My Products/Skool Classroom Drafts/_All Flags (full detail).md`):
Glycogen, Plateau, Chronotype, Anthropometry, Decision Fatigue, Focus, Energy and
others. They stay out until Tom adds them. Do not add them for him.

The same flags file says some CONDITIONS come in Mild, Moderate and Severe
(DOMS, Dopamine Overload, Decision Fatigue). The game does not model severity
yet.

## The one job

**Know every entry in the database cold: its meaning, and its bracket.**

The brackets are a grammar, and the near twins are where it shows: Stress is a
STAT and Stressed is a CONDITION; Sleep and Sleep Deprivation; Weight and Weight
Loss; Dopamine and Dopamine Overload; Calorie Counting is a SKILL, Calorie
Deficit a CONDITION, Maintenance Calories a STAT. SORT exists for exactly that,
and it needs nothing but the names, so it is honest even while every definition
is a draft.

## Modes

- **QUEST**, the daily one. Spaced repetition in Leitner boxes,
  `INTERVAL = [0, 1, 3, 7, 16, 35, 80]` days. What is asked climbs with the box:
  pick the name for a definition (box 0 to 1), pick the definition for a name
  (2), type the name with the first letters shown (3), type it cold (4 and up).
  A new entry opens on a discover screen and comes back as a question two turns
  later. A miss comes back in the same round, up to twice, and only the first
  try is graded. Up to 20 reviews and `newPer` (default 5) new entries a quest.
- **SORT**, 30 seconds: file each name into its bracket. Personal best.
- **BLITZ**, 60 seconds: name or definition, from found entries only. Personal
  best. Opens at four found.
- **BOSS**, one per bracket: every entry with a definition, typed cold, 90% to
  clear (rounded up). Opens when all of them are KNOWN. A clear leaves a seal
  with its date, and losing a rematch never takes it away.

Timed modes change no schedule. A boss answer on a card that was not due counts
but does not push its schedule further out; a miss still sends it back.

## The codex

Every entry is a tile under its bracket: LOCKED, FOUND (seen), KNOWN (box 3
reached), MASTERED (box 5 reached, about four weeks of right answers at the
earliest). **Rank is drawn from `best`, the highest box ever reached, which only
goes up.** The box itself falls on a miss, and review timing reads the box. That
is the suite's "never remove earned progress" kept and the schedule kept honest
at once. A dot on a tile is a review due.

A locked tile's definition is hidden until a quest finds it, with "Show the
definition anyway" under it. Names are always visible: SORT shows them anyway.

## What it does NOT do

- **No XP, no points, no levels-as-tiers.** The ranks are how well one entry is
  known, not a score that accumulates.
- **No verdict on the person.** It reports right first time, bests and dates.
- **Nothing sent anywhere.** The only request is the Rajdhani font from Google
  Fonts; if it fails the system font takes over and nothing else changes.

## The streak

As RECKON's: continues if he answered anything, a freeze every seventh day,
capped at three, spent silently on a missed day, never offered at the moment of
failure. The header shows what it is worth today.

## Data

`localStorage`, every key beginning `cx.`, one key per fact.

| Key | Holds |
|---|---|
| `cx.card.<id>` | `{box, best, due, seen, right, wrong, last}`, one entry's progress |
| `cx.term.<id>` | only what Tom changed about an entry: `{term, bracket, def, aka, at, del, ord}`. `del: true` hides it; a new entry is a row with no built-in behind it |
| `cx.bkt.<ID>` | `{means}`, a bracket meaning Tom loaded |
| `cx.day.<date>` | `{n, right}` |
| `cx.streak` | `{n, last, freeze, best}` |
| `cx.rec` | `{blitz, blitzAt, sort, sortAt, seals: {BRACKET: date}}` |
| `cx.set` | `{sound, buzz, typing, newPer, auto}` |

`<id>` is the slug of the name as first written, so progress follows a name
across an import and a rename keeps its history.

RECKON's two rules hold here too: **change a row by merging into it**
(`DB.patch`), and **lay defaults under what is stored** (`card()`, `settings()`,
`rec()`, `streak()` all `Object.assign` a default first).

**RESTORE merges, newest wins per row, and nothing earned is lost**: a card
keeps the higher `best` and the earlier `seen`, a day the bigger count, records
the better score and every seal.

## LOAD

`parseDeck` reads whatever shape the paste is in: his own format (bracket
headings, names with commas), `Name: definition`, `**Name** - definition`,
`Name [BRACKET]: definition`, `Name | [BRACKET] | definition`, markdown tables,
Skool page titles in brackets with their text below, CSV/TSV with a header, and
JSON. `plan` matches each name to an entry by id, then by any accepted answer
(so "Progressive Overload" finds Progressive Overloading), and SAVE only ever
updates or adds. Nothing is deleted and progress is never touched. UNDO puts
back the exact rows.

A bracket is one of the four, anything written as a heading, a tag after a name
in capitals, or a capitalised plural of five letters or more ([QUESTS]).
`[DOMS]` and `[PCOS]` alone on a line are terms, not brackets.

## Answers

Typed answers are compared after `norm`: case, accents, apostrophes,
punctuation and a leading article do not count. One slip is allowed in a name of
5 to 8 letters, two in 9 or more, none in four or fewer, and an answer that is
another entry's name is wrong however close it is. A definition is shown with
the entry's own name and aliases blanked out, so "Delayed onset muscle soreness:
..." does not give DOMS away.

## Interface

Built to the phone rules and good at a desk, like RECKON. The look is NOTICE's
HUNTER System window: navy, one cyan for the live thing, cut corners and a faint
glow; each bracket has its own colour, and gold is kept for MASTERED and records.
Every colour is declared once, in `:root`. Back closes what is open. Desk keys:
1 to 4 pick, Enter goes forward (never "I don't know"), Escape closes or leaves.
iPhone only raises the keyboard inside a tap, so a typed question is never
reached by the auto-advance timer.

## Testing

Driven in headless Chromium (Playwright from `/opt/node-tools`, Chromium at
`/opt/pw-browsers`) at 390x844 with touch, 360x640 and 1280x800. The record of
what was checked on the day it was built is in `codex/HISTORY.md`.

**Not tested, and it cannot be from here:** a real phone, and whether the
drafts say what Tom's Skool pages say. The drafts are the part most likely to be
wrong for his purposes, and the banner says so until he replaces them.
