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

## Known problems and what is untested

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
