# RECEIPTS

A photo of a receipt becomes a spending row and a record of what was bought.

This brief governs `receipts/` only. It obeys the master brief at the repo root
and may add rules but never contradict them. The PC half of the pipe lives in
`tools/receipts/` and the plain-language setup is `RECEIPTS.md` at the root;
both belong to this module.

**Tom only.** In `DROP_APPS` in `tools/build-client.py`, like WEALTH and
ELEMENT. It reads a folder on HIS machine that a reader on HIS machine writes
into, and it writes his spending. A client has neither the folder nor the
reader.

---

## FUNCTION, in one sentence

**It turns a photographed receipt into the rows Motherbase already has, and
asks him only what it genuinely cannot work out.**

## Why it exists

Tom, 2026-09-20: *"I never asked for receipt desk, I want a system that
directly feeds data into Motherbase"*, after a standalone receipt app was
built and published. And *"why does the daemon cost money, there have to be a
better way"*, after the first design was drawn around a paid API key.

Both of those shape the whole thing. This app stores nothing another app
wanted, and the reading costs nothing.

## The pipe, in order

```
iPhone Shortcut  ->  iCloudDrive/Receipts/in/      photo or payment screenshot
scheduled task   ->  tools/receipts/read_receipt.py, every 5 minutes
  that script    ->  Receipts/out/<name>.json      one record per photo
  and            ->  Receipts/done/<name>.jpg      the proof, never deleted
RECEIPTS app     ->  reads out/ through the browser's folder permission
  one tap        ->  spend / paid / buy / receipt / alias rows
```

## Where the rows go

| What | Row | Owner |
|---|---|---|
| Money out | `spend` `{amt, acct, note, t, via:'receipt'}` | STATUS's type. The same row a "paid 250 - lunch" bullet writes, so WEALTH counts it with no new plumbing |
| Money in | `paid` `{amt, acct, client:'', note, t}` | WEALTH's type. No client is what WEALTH already calls a one-off |
| A line matched to a food | `buy` `{food, text, qty, unit, each, amount, shop, receipt}` | this app |
| The receipt itself | `receipt`, keyed by the photo's name | this app. Proof of purchase, which had no home before |
| A shop's wording | `alias`, keyed by the normalised text | this app |
| A nutrition label | `food` `{name, brand, base:{amt, unit, src:'label', ...figures}, serves}` | STATUS names the shape, FOODDÉX writes it too. The same row FOODDÉX saves |

Writing `spend` and `paid` is a deliberate cross-app write, the way ELEMENT
writes STATUS's `ev` and `meal`. Ownership names who is responsible for the
shape, not who may write.

## The one hard part

Two shops name the same product differently. PUREGOLD prints `CHKN BRST FRZ`,
FOODDÉX holds `Chicken breast, raw`. **Nothing outside Motherbase can resolve
that**, because the foods live in here — which is the whole reason the reading
stops on the PC and the matching happens in the app.

So the reader copies the wording exactly, never tidying or expanding it, and
this app scores his real foods against it. The score counts both directions,
`2 × hits / (words in the line + words in the food's name)`: matched against
the shop's wording alone, "Gatorade" answers GATORADE BLUE 500ML only half as
well as it should; matched against the food's name alone, a food called "Egg"
answers every line with the word egg in it. Sizes, counts and units come off
first, so OATS QUAKER 800G is compared as `oats quaker`.

**A guess is offered and never applied.** It draws with a `?` in front of it,
and only Tom's own tap writes the `alias` that makes it stick. Press SAVE with
a `?` still on a line and the money files while that item is not claimed to be
anything — the toast says how many were left unnamed. An abbreviation like
CHKN BRST cannot be guessed at all and always asks; after one tap it never
asks again, at any shop.

## Rules and decisions

- **Never write a number it did not read.** A smudged total comes back `null`,
  named in `unsure`, and the card grows a box for him to type it in. A wrong
  peso amount is worse than a missing one.
- **Never delete the photo.** The JSON in `out/` is the transit copy and goes
  once the rows hold what it held; the photo stays in `done/` as proof.
- **No cloud, no account, no key.** The browser's folder permission is how a
  page on his PC reads a folder on his PC. Safari and a page opened from a
  folder have no such API and get a file picker instead — a pipe that works in
  one browser only is not a pipe.
- **The folder handle lives in IndexedDB, not the store.** It is a permission
  rather than data: it belongs to this browser on this machine, must not sync
  to his phone and must not appear in a backup. Same argument `io.js` makes
  for the sync log.
- **The reader finds `claude.exe` rather than hard-coding it.** The version
  folder under `AppData/Roaming/Claude/claude-code/` changes on every update.

## Nutrition labels

Tom, 2026-09-23: *"I want the receipt reader to also accept nutrition facts
to feed into FOODDEX"*. Same Shortcut, same folder, same reader. The reader
decides which kind of photo it has; a label comes back `src: 'label'` with
its figures in FOODDÉX's own keys (the eight, plus any `shared/nutrients.js`
key under `more`). It waits as a `receipt` row like anything else, so it gets
the card, the filed list and the undo for nothing.

- **Reader side.** A per 100 g column beats per-serving. A household measure
  gives way to the weight in brackets. A figure printed only as a % Daily
  Value stays null. kJ to kcal and salt to sodium (× 393, FOODDÉX's factor)
  are done in Python, so they are exact. The label's equivalent of the
  receipt's sum check: calories against 4p + 4c + 9f, flagged past a fifth
  and 15 kcal apart; and saturated over total fat, sugars over total carbs.
- **App side.** Asks only for the name, and the amount if the reader could
  not read it. Figures are shown, never typed here: FOODDÉX is the food bench
  and marks a corrected figure `label-fixed`.
- **A food he already has keeps its own base amount.** The label's figures
  are scaled to it rather than the other way, because `serves` mults and
  `price` are stored against that amount and would all go wrong in silence.
  A food kept per ml cannot take a per g label; the toast says so.
- **A new food has no 50 g protein serving.** STATUS still logs it by
  serving and per 100 g. Opening it in FOODDÉX and pressing SAVE adds the
  rest.
- `unsure` is for what could not be read, never for what is not printed. A
  brand, a reference number or a unit price that a slip simply does not
  print made every card say "check this", which trains him to skim it.

## Known problems and what is untested

- **Never run against a real photographed label either**: shiny, curved
  packs are the hard case and none has been tried.
- **Never run against a real photographed receipt.** Everything watched was a
  generated image: clean, flat, straight. A folded, angled, badly lit one is
  Tom's test.
- **Never opened on a phone**, and it is a desktop app.
- **The iPhone Shortcut and the scheduled task do not exist yet.** The pipe
  does nothing until Tom does the three steps in `RECEIPTS.md`.
- Chrome hands a folder permission back as "ask" after the tab closes, so the
  first poll of a session asks once. That is the browser, not the app.
- A `buy` row is written and nothing reads it yet. FOODDÉX is the natural
  reader — what a food costs per gram of protein, and where he buys it.

## Needs from the foundation

- DOCTRINE.md has no RECEIPTS row. Added to the root brief's Current state
  table on 2026-09-23; the DOCTRINE entry is a foundation session's to write.

## History

**1.0.0, 2026-09-21. Built.** Both halves in one session.

`tools/receipts/read_receipt.py` reads a photo through the bundled CLI and
writes one JSON record: merchant, date, time, direction, account, total,
reference, memo, item lines as printed, and plain sentences for anything it
could not read. It checks the item lines against the total and says so when
they are more than a peso apart, because a misread digit in a column of prices
is invisible on its own and obvious against the total. A photo it cannot read
at all goes to `failed/` and stays there.

The app: one card per waiting receipt, the account as a chip row, the unsure
list in plain sentences, a food match per line, SAVE and NOT MONEY. One undo
takes back every row a save wrote.

**Watched, 2026-09-21:** three generated receipt images through the real
reader — a Puregold grocery slip (six items, 1.020 kg chicken kept as a
weight, dishwashing liquid marked not food, total ₱1,101.03 exact), a GCash
send screenshot (₱3,500 out, reference and memo, no item lines), and one with
the total blurred out, which came back with no number and four sentences
saying why. About 13 seconds a photo. Then the app driven end to end against
seeded foods and accounts: a guess accepted through the picker wrote the
alias, SAVE wrote `spend` ₱122 plus one `buy` row and reported "1 left
unnamed", undo removed all of it and put the receipt back, a money-in receipt
wrote a `paid` row with no client, and the wording taught once resolved itself
on a different shop's receipt. `_review.html` 99/99. Phone width at 375px
after the header was slimmed to two icon buttons.

**1.0.1, 2026-09-23. Nutrition labels.** See "Nutrition labels" above.

**Watched, 2026-09-23:** two generated labels through the real reader. A
European granola panel, per 100 g beside per 40 g with salt: read the 100 g
column, 0.25 g salt became 98.2 mg sodium, fibre, sugars and saturates under
`more`. A US bar, "2 bars (60 g)" per serving with potassium only as 4%: amt
60, one piece 30 g, potassium null and said so. A grocery slip still read as
before, and with rule 8 its `unsure` came back empty. In the app, clicked:
no name refuses with "Give it a name first"; a new food saved in FOODDÉX's
shape and opened in FOODDÉX tagged "from a label"; a 40 g label on an
existing per 100 g food asked first, then wrote kcal 375 from 150 and kept
price, servings and use count; a typed name and amount saved; undo removed
the food and put the card back. `_review.html` RECEIPTS all green; ELEMENT
failed 5 and the foundation run timed out, both outside this module and
untouched by it.
