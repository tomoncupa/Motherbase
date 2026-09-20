"""read_receipt.py - turn a receipt photo into one JSON record, on this PC, for free.

   Tom, 2026-09-20: "I never asked for receipt desk, I want a system that
   directly feeds data into Motherbase", and "why does the daemon cost money,
   there have to be a better way". So this file is not an app and it holds no
   API key. It is the READING half of the pipe and nothing else:

       iPhone Shortcut  ->  Receipts/in/      (iCloud carries the photo here)
       this script      ->  Receipts/out/     (one .json per photo)
       Motherbase       ->  reads out/        (and writes the rows)

   -- why the reading stops here --

   The hard part of a receipt is not the letters, it is that two shops name the
   same product differently: CHKN BRST FRZ and "Chicken breast, raw". Only
   Motherbase knows which FOODDEX foods exist, so only Motherbase can resolve a
   line to one of them. A matcher out here would be guessing against a list it
   cannot see. So this script reads what is PRINTED, marks what it could not
   read, and never invents a food. Resolving, and asking Tom when it cannot
   resolve, happens on the other side where the foods live.

   -- why it costs nothing --

   `claude.exe` ships inside the desktop app and runs on the subscription he
   already pays for. There is no key in this file and there is nothing to bill.
   The version folder changes on every app update, so it is found rather than
   written down.

   -- what it will not do --

   * It never deletes the photo. A receipt is proof of purchase; the photo
     moves to done/ and stays. Only the iCloud transit copy in in/ goes away,
     and only after out/ has the record.
   * It never writes a number it did not read. A figure it could not make out
     is null and is named in `unsure`, which is what makes the other side ask
     instead of quietly saving a wrong peso amount.
   * It never runs twice on one photo. done/ is the record of what is finished,
     and a second run skips anything already there.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime

BASE = os.environ.get('MB_RECEIPTS') or os.path.join(
    os.path.expanduser('~'), 'iCloudDrive', 'Receipts')
IN, OUT, DONE, BAD = (os.path.join(BASE, d) for d in ('in', 'out', 'done', 'failed'))
LOG = os.path.join(BASE, 'receipts.log')
LOCK = os.path.join(BASE, '.lock')
PICS = ('.jpg', '.jpeg', '.png', '.heic', '.webp')
STALE = 20 * 60          # a lock older than this belonged to a run that died
TIMEOUT = 300            # one photo, one reading; longer than this is a hang


def claude_exe():
    """The newest bundled CLI. The version folder changes on every update."""
    root = os.path.join(os.environ.get('APPDATA', ''), 'Claude', 'claude-code')
    best, bestv = None, ()
    for name in (os.listdir(root) if os.path.isdir(root) else []):
        exe = os.path.join(root, name, 'claude.exe')
        if not os.path.isfile(exe):
            continue
        v = tuple(int(p) for p in re.findall(r'\d+', name)) or (0,)
        if v > bestv:
            best, bestv = exe, v
    return best


PROMPT = """Read the receipt image at the path below and return ONE JSON object.

IMAGE: {path}

Return nothing but the JSON. No prose, no code fence, no explanation.

{{
  "v": 1,
  "src": "receipt" | "gcash" | "bank" | "other",
  "merchant": string or null,
  "date": "YYYY-MM-DD" or null,
  "time": "HH:MM" (24h) or null,
  "direction": "out" (money left him) | "in" (money arrived),
  "account": "cash" | "gcash" | "card" | "bank" | null,
  "total": number or null,
  "currency": "PHP" unless the receipt says otherwise,
  "ref": receipt or reference number as printed, or null,
  "note": the message or memo on a transfer, or null,
  "lines": [
    {{
      "text": the item EXACTLY as printed, abbreviations and all,
      "qty": number or null,
      "unit": "kg" | "g" | "L" | "ml" | "pc" | null,
      "each": unit price or null,
      "amount": what that line cost or null,
      "food": true if a human could eat or drink it, else false
    }}
  ],
  "unsure": [ short plain sentences naming anything you could not read ]
}}

Rules, in order of importance:

1. NEVER invent a number. If a figure is blurred, cut off or missing, put null
   and say so in "unsure". A wrong peso amount is worse than a missing one.
2. Copy item text as printed. Do not expand CHKN BRST into "chicken breast",
   do not tidy spelling, do not translate. Something else resolves these.
3. A transfer, a top-up or a payment screenshot has no item lines. Leave
   "lines" empty and put the whole thing in total, direction and note.
4. Money RECEIVED is direction "in". Money sent, paid or withdrawn is "out".
5. A weighed item's qty is the weight with its unit (1.020 kg), not 1.
6. Ignore subtotals, VAT lines, discounts, change and points. Only real items
   go in "lines"; "total" is what he actually paid.
7. If the image is not a receipt or a payment at all, return the object with
   "src": "other" and say why in "unsure"."""


def log(msg):
    line = datetime.now().strftime('%m-%d %H:%M:%S') + '  ' + msg
    print(line, flush=True)
    try:
        with open(LOG, 'a', encoding='utf-8') as f:
            f.write(line + '\n')
    except OSError:
        pass


def carve(text):
    """The JSON out of whatever came back. A model can still add a fence."""
    t = text.strip()
    if t.startswith('```'):
        t = re.sub(r'^```[a-z]*\s*', '', t)
        t = re.sub(r'\s*```$', '', t)
    a, b = t.find('{'), t.rfind('}')
    if a < 0 or b < a:
        raise ValueError('no JSON in the answer')
    return json.loads(t[a:b + 1])


def sane(rec, name):
    """Fill what is missing, and say when the lines do not add up.

       The sum check is the one that earns its place: a misread digit in a
       column of item prices is invisible on its own and obvious against the
       total, and it is exactly the mistake that would otherwise be saved as
       money."""
    rec.setdefault('v', 1)
    rec['file'] = name
    rec['read_at'] = datetime.now().isoformat(timespec='seconds')
    rec.setdefault('currency', 'PHP')
    if not isinstance(rec.get('lines'), list):
        rec['lines'] = []
    unsure = rec.get('unsure')
    if not isinstance(unsure, list):
        unsure = [str(unsure)] if unsure else []
    rec['unsure'] = unsure

    if rec.get('direction') not in ('in', 'out'):
        rec['direction'] = 'out'
    if not isinstance(rec.get('total'), (int, float)):
        rec['total'] = None
        unsure.append('No total could be read.')

    amounts = [ln.get('amount') for ln in rec['lines']
               if isinstance(ln.get('amount'), (int, float))]
    if amounts and isinstance(rec.get('total'), (int, float)):
        summed = sum(amounts)
        gap = rec['total'] - summed
        # a receipt's own rounding is centavos; anything past a peso is a misread
        if abs(gap) > 1:
            unsure.append('The item lines add up to %.2f, which is %.2f off the total.'
                          % (summed, gap))
    rec['check'] = bool(unsure)
    return rec


def read_one(exe, name):
    src = os.path.join(IN, name)
    try:
        prompt = PROMPT.format(path='in/' + name)
        out = subprocess.run(
            [exe, '-p', prompt, '--allowedTools', 'Read',
             '--permission-mode', 'acceptEdits'],
            cwd=BASE, capture_output=True, text=True, encoding='utf-8',
            errors='replace', timeout=TIMEOUT)
        if out.returncode != 0:
            raise RuntimeError((out.stderr or out.stdout or '').strip()[:300]
                               or 'the CLI failed')
        rec = sane(carve(out.stdout), name)
    except Exception as e:                                    # noqa: BLE001
        log('FAILED  %s  %s' % (name, e))
        shutil.move(src, os.path.join(BAD, name))
        return False

    stem = os.path.splitext(name)[0]
    with open(os.path.join(OUT, stem + '.json'), 'w', encoding='utf-8') as f:
        json.dump(rec, f, ensure_ascii=False, indent=1)
    # the record exists before the photo moves, so a crash repeats a read
    # rather than losing one
    shutil.move(src, os.path.join(DONE, name))
    log('read    %s  %s  %s %s  %d line(s)%s' % (
        name, rec.get('merchant') or rec.get('src'), rec.get('currency'),
        rec.get('total'), len(rec['lines']),
        '  NEEDS A LOOK' if rec['check'] else ''))
    return True


def main():
    for d in (IN, OUT, DONE, BAD):
        os.makedirs(d, exist_ok=True)

    if os.path.exists(LOCK) and time.time() - os.path.getmtime(LOCK) < STALE:
        return 0
    open(LOCK, 'w').close()
    try:
        exe = claude_exe()
        if not exe:
            log('FAILED  no claude.exe under AppData/Roaming/Claude/claude-code')
            return 1
        # iCloud writes a placeholder first, so a file still arriving is left
        # for the next run rather than read half-downloaded
        now, work = time.time(), []
        for n in sorted(os.listdir(IN)):
            p = os.path.join(IN, n)
            if (os.path.isfile(p) and n.lower().endswith(PICS)
                    and os.path.getsize(p) > 0 and now - os.path.getmtime(p) > 5):
                work.append(n)
        for n in work:
            read_one(exe, n)
        return 0
    finally:
        try:
            os.remove(LOCK)
        except OSError:
            pass


if __name__ == '__main__':
    sys.exit(main())
