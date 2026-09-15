# CLEX

**A personal side app. Not part of Motherbase.** It lives in the repo only so it
stays published at the same web address.

Governs `clex/` only. The root brief's rules for suite apps do not apply here,
except the ones every file in the repo keeps: vanilla JavaScript, plain
`<script src>`, no build step, opens from a folder.

## Standalone

Set by Tom on 2026-09-15: "Take Clex out of the eco system completely." Until
then CLEX loaded seven of the suite's shared files, read the row store for its
themes, and carried a latch (`readonly.js`) to stop itself writing there. Both
are gone.

| | |
|---|---|
| **Loads from `shared/`** | Nothing. |
| **Reads or writes suite data** | Nothing. No rows, no settings, no themes, no sounds. |
| **Its own state** | One localStorage key, `clex.game`, the board. |
| **Look** | Block's theme, with its values fixed in `kit.js`. STYLE no longer reaches CLEX. |
| **Backups, dock, review, client build** | Not in any of them. |

**`kit.js` is the little CLEX used to borrow**, and no more: the theme values,
six icon drawings, a toast, a sheet of choices, a yes-or-no confirm, the
version line in settings, the back gesture and a tick sound. If CLEX needs
something new, add it there. Never load a suite file, and never change
`shared/` for CLEX's sake.

Eight checks at the end of `_smoke.html` prove it: no suite script on the page,
none of the suite's globals, the app page loads and calls none of it, and the
kit's theme, icons, toast, sheet and confirm work.

## What this is

A play aid for two of Tom's Commander decks, used on a phone during a real
game. It answers two questions and nothing else:

1. **If I do this, how many counters will everything have?**
2. **Given my board, my hand and my mana, what is my strongest play?**

It is not a general Magic app, not a deck builder and not a rules oracle. It
knows these two decks.

| Deck | Commander | Moxfield |
|---|---|---|
| `clex` | Vorinclex, Monstrous Raider | `Qnja5ftUk02C9cobAAH04g` |
| `krenko` | Krenko, Mob Boss | `gJOfAVLX5nuAeyg8VIvX0w` |

**This is a phone app.** It is used standing at a table with one hand while
three other people wait. It keeps the suite's phone habits by choice: 44px
targets, sheets from the bottom, the back gesture closing what is open.

## Files

| File | Job |
|---|---|
| `index.html` | The screen. View only — it must contain no counter maths. |
| `engine.js` | The rules engine. Counter events, replacement effects, mana. No DOM. |
| `combos.js` | Combo detection, and the infinite/finite judgement. |
| `optimizer.js` | Legal play generation and line scoring. |
| `data.js` | Generated. 186 cards with real Oracle text, plus both decklists. |
| `kit.js` | Theme values, icons, toast, sheet, confirm, back gesture, tick. No suite code. |
| `_smoke.html` | 99 checks, including 8 that prove CLEX stands on its own. |
| `tools/build-data.py` | Rebuilds `data.js` from Moxfield and Scryfall. |

**`engine.js` has no DOM and never will.** That is what lets `_smoke.html`
test it. If you find yourself computing counters inside `index.html`, stop:
the number belongs in the engine and the screen just prints it.

The app folder carries four scripts rather than one HTML file, because Tom
asked for a rules engine independent of the UI and covered by tests, and a test
page cannot reach logic sealed inside another page. Still plain `<script src>`,
still no build step, still opens from a folder.

## Why data.js is a script and not JSON

`fetch()` of a local file is blocked by CORS, so a `.json` would break opening
`index.html` straight from disk. `data.js` assigns `window.CLEX_DATA`. Rebuild
it with:

```
py -3 clex/tools/build-data.py
```

That is the only thing here that touches the network, and it is never run by
the app. At the table there is no connection and none is needed.

## The counter engine, in one idea

Putting counters on a permanent is an **event**. Cards like Hardened Scales and
Vorinclex are **replacement effects** that modify the event before it happens.
CR 616.1 says the affected permanent's controller chooses the order, and each
effect applies once.

So the answer is never `base × 2 × 2 + 1`. It is "which of these actually apply
to THIS event, and in what order". Adds before multiplies is the order that
helps you, and the engine proves it by enumerating every legal order when there
are eight modifiers or fewer.

**Each card's reach is different, and that is the whole difficulty:**

| Card | Does | To what |
|---|---|---|
| Hardened Scales | +1 | +1/+1 only, creature you control |
| Ozolith, the Shattered Spire | +1 | +1/+1 only, artifact **or** creature you control |
| Kami of Whispered Hopes | +1 | +1/+1 only, any permanent you control |
| Benevolent Hydra | +1 | +1/+1 only, **another** creature (never itself) |
| Arwen, Weaver of Hope | + her toughness | creatures **entering**, never herself |
| Branching Evolution | ×2 | +1/+1 only, creature you control |
| The Earth Crystal | ×2 | +1/+1 only, creature you control |
| Primal Vigor | ×2 | +1/+1, **any** creature, opponents' included |
| Doubling Season | ×2 | any counter kind, permanent you control, **never players** |
| Vorinclex | ×2 | any counter kind, permanent **or player**, when you place them |
| Innkeeper's Talent | ×2 | as Vorinclex, but **only at level 3** |

## Things that are easy to get wrong

- **"Double the number of counters on X" is not a replacement effect.** Kalonian
  Hydra, Bristly Bill, Voracious Hydra and the rest read the current count and
  then **put that many more** — and that put is modified by everything above.
  Ancient on 47 with Vorinclex, Hardened Scales and the Shattered Spire ends on
  **145**, not 94.
- **Doubling reads a snapshot.** Two creatures each double from their own count.
  They do not compound into each other.
- **Moving counters is a put.** Confirmed by the Nesting Grounds ruling. Twelve
  counters moved off Forgotten Ancient arrive on Selvala as twenty-four.
- **Vorinclex doubles −1/−1 counters too.** He is not "your counters" — he is
  "counters". This makes the Devoted Druid untap loop cost twice as much, and it
  is a real trap, so the app warns about it rather than quietly halving the line.
- **+1/+1 and −1/−1 annihilate** as a state-based action, CR 704.5q.
- **Proliferate adds one of each kind already there**, which includes −1/−1. The
  engine never chooses your own −1/−1 counters, because you would not.

## Mana is read off the card, not from a list

`printedTapMana` parses the printed `{T}: Add ...` line and counts the symbols,
so Devoted Druid gives 1, Sol Ring and The Great Henge give 2, and a card nobody
special-cased still gets the right number.

It matches a **tap** ability only, and that is the point. "Sacrifice a Goblin:
Add {R}" is not free mana, it costs a creature, and counting it would have the
optimizer spend mana that is not there. Over-counting loses games; under-counting
only costs a play. When in doubt, return less.

Sources that scale with the board cannot be read off the card and keep their own
cases: Selvala, Gyre Sage, Incubation Druid, Kami, Gaea's Cradle, Fanatic of
Rhonas (ferocious) and Howlsquad Heavy (max speed only).

**Nissa, Who Shakes the World** adds an extra `{G}` per Forest tapped. In a deck
with 26 Forests that roughly doubles the land base, so she is handled in
`manaAvailable` rather than per-permanent.

## Stacking is a display decision

Twenty-six Forests are twenty-six permanents to the rules and one line to a
person. `groupField()` collapses identical permanents for rendering only. The
field still holds each one separately, so Gaea's Cradle still counts them.

**Anything carrying counters is never stacked.** Counters are the whole point of
this app, so each countered permanent keeps its own line and its own stepper. Put
a counter on one of three Llanowar Elves and it splits out by itself, leaving
"Llanowar Elves ×2" behind. Same for tapping one of a stack.

## Rules for the optimizer

- **Only cards actually in hand**, abilities on the battlefield, or the
  commander from the command zone. It may never invent a card.
- **Permanents only when simulating a cast.** An instant is not board state.
  Anything skipped is reported, so an omission never reads as "not worth it".
- **Tutors respect where the card lands.** Worldly Tutor puts it on **top of
  the library**, so it is a next-turn play and the app says so. Goblin Matron
  puts it in hand and can be cast now.
- **Order is the point.** Hardened Scales before Kalonian Hydra means the Hydra
  enters with 10 instead of 4. The search is over sequences, not sets.
- **Never attack with a summoning-sick creature.**

## Infinite means infinite

A loop is only labelled INFINITE if it returns to the same board state with
strictly more of something, forever, with no outside input. Everything else is
big, and big is not infinite. Saying "infinite" about a line that runs out is
how you lose a game.

Combo pieces sitting in the Moxfield sideboard are flagged **NOT IN THE 99**,
because he cannot draw them.

## Testing

There is no Node on this machine. Use the browser:

```
py -3 -m http.server 8787 -d "<repo>"
```

Open `clex/_smoke.html`. It must say **99 of 99**, or more once you add checks.
Every expected number in it was worked out by hand from the printed Oracle text
before the engine was run, so a red line means the engine is wrong, not the test.

Add a check for every rules bug you fix. That file is the only thing standing
between this app and confidently telling Tom a wrong number at a table.

## Known gaps, stated plainly

- Mana is a single number by default. Colour requirements are not enforced, so
  the optimizer can propose a line that needs more green than you have. It was
  built for speed at a table, which is what was asked for.
- Nykthos is listed as producing nothing, because devotion is not modelled.
  Better to under-count than to promise mana that is not there.
- ETB triggers are handled for the cards that change counter maths, not for
  every card in both decks. Anything unmodelled simply enters and sits there.
- Untested on Tom's actual phone. Nobody here can open it on his device.
