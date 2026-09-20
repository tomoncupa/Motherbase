# RECEIPTS — a photo of a receipt, turned into rows

Take a picture of a receipt, or share a GCash screenshot, and the money shows
up in WEALTH and the shopping shows up against your foods. You confirm each
one with a tap. Nothing is saved without you.

It costs nothing to run. The reading is done by the Claude program that is
already inside the desktop app, on the subscription you already pay for.

---

## What happens, in order

1. You photograph a receipt on the phone, or share a payment screenshot.
2. iCloud carries it to the PC, usually inside a minute or two.
3. Every five minutes the PC reads any new photo and writes down what it says.
4. RECEIPTS shows it waiting. You check the amount, tap any food it asks
   about, and press SAVE.
5. The money becomes a spending row — the same row you get by typing
   "paid 250 - lunch" into STATUS — and WEALTH counts it like any other.
   Money coming IN becomes a one-off payment instead.
6. The photo stays on the PC as proof of purchase. Nothing is deleted.

---

## Setting it up, once

### 1. The folder

Make a folder called **Receipts** in iCloud Drive, and a folder called **in**
inside it. The rest of the folders make themselves the first time the reader
runs.

### 2. Tell Windows to check it

Open PowerShell and paste this one line:

```
powershell -ExecutionPolicy Bypass -File "C:\Users\user\Downloads\Motherbase\tools\receipts\install-task.ps1"
```

That is the whole install. To stop it later, the same line with ` -Remove` on
the end.

### 3. The iPhone Shortcut

In the Shortcuts app, make a new shortcut called **Receipt**:

- **Take Photo** — turn off *Show Camera Preview* if you want it instant.
- **Save File** — set it to iCloud Drive → Receipts → **in**, and turn OFF
  *Ask Where to Save*.

Then open the shortcut's settings and turn on **Show in Share Sheet**, with
*Images* and *Screenshots* ticked. Now a GCash or bank screenshot can be sent
straight in from the share button, and the same shortcut on the Home Screen
takes a receipt photo.

### 4. Point RECEIPTS at the folder

Open RECEIPTS on the PC in Chrome, press the button at the top left of the
header, and choose **Receipts → out**. You only do this once per browser;
Chrome asks you to allow it again the first time each day.

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

---

## Where things end up

| What | Where it lands |
|---|---|
| Money out | a `spend` row — STATUS's own, counted by WEALTH |
| Money in | a `paid` row with no client — WEALTH calls that a one-off |
| A line you matched to a food | a `buy` row: what, how much, what it cost, which shop |
| The receipt itself | a `receipt` row, with the photo's name |
| A shop's wording | an `alias` row, so it is never asked twice |

The photos stay in `Receipts\done`. The small text files in `Receipts\out` are
deleted once you have confirmed them, because by then the rows hold everything
they held. Anything the reader could not open at all goes to `Receipts\failed`
and stays there.

---

## When something looks wrong

**Nothing arrives.** Check `Receipts\receipts.log` — every run writes a line.
No lines at all means the scheduled task is not running; run the install line
again.

**A receipt read badly.** The photo is still in `Receipts\done`. Move it back
into `in` and it is read again.

**It asks for the folder every day.** That is Chrome, not the app. A browser
only remembers a folder permission for the session.

**Safari, or a page opened from the folder rather than an address.** Neither
can watch a folder. The same button then lets you pick the finished files by
hand, and everything else works the same.
