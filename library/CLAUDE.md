# LIBRARY (CLAUDE.md)

Governs `library/` only. Not an app: a data file other apps read. The root
`CLAUDE.md` and `DOCTRINE.md` still apply.

## What it is (2026-09-30)

Tom: *"Ok lets combine to make our own - then include these in SKOOL."* His
own exercise library, as data TRAIN and FORGE can read: every movement his
Movement Library covers, grouped the way his Skool classroom is.

`exercises.js` is a plain script, one global, `MB_LIBRARY`, so it loads from
a folder the way every shared file does (root constraint 3). **Never edit it
by hand.** It is built by
`Downloads/TM Brand/05 My Products/Skool Movement Library Pack/_source/build.py`
from two sources:

1. **His 32 technique pages**, verbatim, from
   `TM Brand/05 My Products/Skool Classroom Drafts/Movement Library.md`. His
   words win.
2. **78 new pages**, one for every TRAIN starter exercise (`TRAIN.DEFAULT_EX`,
   cardio left out) his pages did not cover, written in his structure and
   voice (`_source/new-pages/*.json`), muscles and equipment checked against
   free-exercise-db (github.com/yuhonas/free-exercise-db, The Unlicense:
   public domain, any use including a paid community). None of its sentences
   are used, and none of its photos: they come from an older dataset
   (wrkout/exercises.json) that states no owner for them, so they stay out of
   this public repo and out of the pack.

## The shape

```
MB_LIBRARY = { v: 1, made, text, sections: [9 names], patterns: {id: name}, exercises: [
  { id, name, train: [TRAIN starter names], cat: TRAIN group, section: Skool
    section, pattern: FORGE pattern id, primary: [muscles], secondary: [muscles],
    equipment, kind (TRAIN's: 0 weight, 2 bodyweight), timed, reps ("8-15"),
    angle (his demo's camera angle), src ('tom' | 'new'), video (file name of
    his demo, or null), fedb (free-exercise-db id, or null) } ] }
```

`text` is false: **the page text is not in this file**, because this repo is
public and the pages are his Skool classroom. `build.py --text` adds a `page`
object to each exercise (`lede, terms, setup, rep, mistakes, swaps, notes,
safety`) once Tom says the text may be public. Until then the full text lives
in the pack's `exercises-full.json`.

Muscles use free-exercise-db's words (chest, lats, middle back, lower back,
traps, shoulders, biceps, triceps, forearms, abdominals, quadriceps,
hamstrings, glutes, calves, adductors, abductors). `pattern` is one of
FORGE's ten default ids. `cat` is TRAIN's group name, so FORGE's `musOf`
fallback and TRAIN's list agree with it.

## Not wired yet

Nothing loads this file today. Wiring is TRAIN's and FORGE's (and the
foundation's for the client build), listed under Needs.

## Needs from other modules

1. **TRAIN:** match an exercise to a library entry by `train` names, then
   `name`, case-insensitive, and show what it has (the muscles, the rep
   range, and his demo once `video` is set and hosted); with `text`, the page.
   Load `../library/exercises.js` with a plain script tag.
2. **FORGE:** use `pattern` and `primary` as the first guess for an untagged
   exercise, before `GUESS` reads the name; an `ftag` still wins.
3. **Foundation, `tools/build-client.py`:** add `library` to `COPY_DIRS` the
   day TRAIN loads it, or clients get a 404 and TRAIN must degrade.
4. **Videos:** his demos are files on his PC
   (`TM Brand/02 Content Library/Movement Library`), not hosted anywhere an
   app can play them. Where they are hosted (Skool, YouTube unlisted) is
   Tom's call; `video` holds the file name until then.

## Watched

Built and loaded 2026-09-30 in the test browser: see
`tom-context/handoffs/motherbase-apps.md`.
