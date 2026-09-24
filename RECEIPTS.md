# RECEIPTS — a photo of a receipt, turned into rows

Take a picture of a receipt, or share a GCash screenshot, and the money shows
up in WEALTH and the shopping shows up against your foods. You confirm each
one with a tap. Nothing is saved without you.

A photo of a **nutrition label** goes the same way and becomes a food in
FOODDÉX. The reader works out which one it is
looking at.

It costs nothing to run. The reading is done by the Claude program that is
already inside the desktop app, on the subscription you already pay for.

---

## What happens, in order

1. You photograph a receipt, or screenshot a GCash or bank payment, the way
   you already do. Nothing else on the phone.
2. iCloud carries it to the PC, usually inside a minute or two.
3. Every five minutes the PC looks at your new photos. Windows reads the
   words on each one for free, and only a photo with receipt, payment or
   label words on it goes on to Claude. Selfies and memes cost nothing.
4. RECEIPTS shows it waiting. You check the amount, tap any food it asks
   about, and press SAVE.
5. The money becomes a spending row — the same row you get by typing
   "paid 250 - lunch" into STATUS — and WEALTH counts it like any other.
   Money coming IN becomes a one-off payment instead.
6. A copy of the photo stays on the PC as proof of purchase. **Your photo
   library is never moved, renamed or deleted.** The PC only copies out of it.

Photos from 1 September 2026 on are looked at. Older ones are not.

---

## Setting it up, once

### 1. Windows checks every five minutes

This is already set up on the PC. If it ever needs doing again, open
PowerShell and paste this one line:

```
powershell -ExecutionPolicy Bypass -File "C:\Users\user\Downloads\Motherbase\tools\receipts\install-task.ps1"
```

To stop it, the same line with ` -Remove` on the end.

### 2. Point RECEIPTS at the folder

Open RECEIPTS on the PC in Chrome, press the button at the top left of the
header, and choose **iCloud Drive → Receipts → out**. You only do this once
per browser; Chrome asks you to allow it again the first time each day.

### Dropping a photo in by hand

A picture that is not in your photo library, such as one someone sent you,
still goes in by hand: put it in **iCloud Drive → Receipts → in**.

---

## What it asks you, and why

**The amount.** If a total was smudged, folded or thumbed over, the reader
refuses to guess and says so. You type it in from the photo. It never invents
a number, because a wrong peso amount is worse than a missing one.

**Which food.** PUREGOLD prints `CHKN BRST FRZ` and FOODDÉX holds
`Chicken breast, raw`. Nothing outside Motherbase can connect those, so
RECEIPTS ranks your real foods against the wording and you tap the right one
**once**. It remembers that wording for good — the same line from the same
shop never asks again, at any shop.

A guess is shown with a `?` in front of it and is never saved on its own. If
you press SAVE and leave a `?` alone, the money still files and that item is
simply not claimed to be anything.

**NOT MONEY** keeps the receipt and writes nothing. Useful for a receipt you
only want as proof.

**A label's name.** A nutrition panel often has no product name near it, so
the card has a name box. Type what you want it called in FOODDÉX. If the photo
did not show what amount the figures are for (per 100 g, or per a 40 g
serving), it asks for that too. Every figure is shown; a wrong one is fixed in
FOODDÉX afterwards, which marks it "label, corrected".

If you already have a food by that name, the button says **UPDATE** and asks
first. The food keeps its own amount, so its saved servings and its price stay
right; the label's figures are scaled to fit it. For a photo, a per 100 g
column beats a per-serving one, and a figure printed only as a percentage is
left blank rather than guessed.

---

## Where things end up

| What | Where it lands |
|---|---|
| Money out | a `spend` row — STATUS's own, counted by WEALTH |
| Money in | a `paid` row with no client — WEALTH calls that a one-off |
| A line you matched to a food | a `buy` row: what, how much, what it cost, which shop |
| The receipt itself | a `receipt` row, with the photo's name |
| A shop's wording | an `alias` row, so it is never asked twice |
| A nutrition label | a `food` row — the one FOODDÉX and STATUS both read |

The photos stay in `Receipts\done`. The small text files in `Receipts\out` are
deleted once you have confirmed them, because by then the rows hold everything
they held. Anything the reader could not open at all goes to `Receipts\failed`
and stays there.

---

## When something looks wrong

**Nothing arrives.** Check `Receipts\receipts.log` — every run that finds new
photos writes a line saying how many it looked at and how many it picked. No
new lines after you have taken photos means the scheduled task is not
running; run the install line again.

**A receipt photo was passed over.** Windows could not make out enough words
on it. Save that photo into iCloud Drive → Receipts → **in** and it is read
on the next check.

**A receipt read badly.** The photo is still in `Receipts\done`. Move it back
into `in` and it is read again.

**It asks for the folder every day.** That is Chrome, not the app. A browser
only remembers a folder permission for the session.

**Safari, or a page opened from the folder rather than an address.** Neither
can watch a folder. The same button then lets you pick the finished files by
hand, and everything else works the same.
