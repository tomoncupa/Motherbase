"""read_receipt.py - turn a receipt photo into one JSON record, on this PC, for free.

   Since 2026-09-23 it also reads a nutrition label, through the same folder
   and the same Shortcut. The reader decides which it is looking at; a label
   comes back as `src: "label"` with its figures in FOODDEX's own keys, and the
   RECEIPTS app turns it into a food.

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


PROMPT = """Read the image at the path below and return ONE JSON object.

IMAGE: {path}

Return nothing but the JSON. No prose, no code fence, no explanation.

The image is one of two things. If it is a NUTRITION FACTS panel off a food
pack, return the LABEL object further down. Otherwise return this one:

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
7. If the image is not a receipt, a payment or a nutrition label, return the
   object with "src": "other" and say why in "unsure".
8. "unsure" is for things you could not read. A reference number or unit
   price the receipt simply does not print is not a problem; leave it out.

THE LABEL OBJECT, for a nutrition facts panel:

{{
  "v": 1,
  "src": "label",
  "name": the product's name if it is printed anywhere in the photo, or null,
  "brand": the brand if printed, or null,
  "amt": the amount the figures below are FOR, as a number,
  "unit": "g" or "ml",
  "per": "100" if you read a per 100 g / 100 ml column, "serving" otherwise,
  "pc": the weight of ONE piece when the serving is counted in pieces
        ("2 cookies (30 g)" is 15), else null,
  "kcal": calories, or null,
  "kj": energy in kJ ONLY when no calorie figure is printed, else null,
  "p": protein g, "c": total carbohydrate g, "f": total fat g,
  "na": sodium mg, or null,
  "salt": salt g ONLY when salt is printed and sodium is not, else null,
  "k": potassium mg, "ca": calcium mg, "caff": caffeine mg,
  "more": {{ any of these that are printed, in these units:
    "fib" fibre g, "sug" sugars g, "sat" saturated fat g,
    "mono" monounsaturated g, "poly" polyunsaturated g, "chol" cholesterol mg,
    "fe" iron mg, "mg" magnesium mg, "ph" phosphorus mg, "zn" zinc mg,
    "cu" copper mg, "mn" manganese mg, "se" selenium mcg, "io" iodine mcg,
    "rae" vitamin A mcg, "vc" vitamin C mg, "vd" vitamin D mcg,
    "ve" vitamin E mg, "vk" vitamin K mcg, "b1" thiamin mg, "b2" riboflavin mg,
    "b3" niacin mg, "b5" pantothenic acid mg, "b6" vitamin B6 mg,
    "fol" folate mcg, "b12" vitamin B12 mcg, "ch" choline mg }},
  "unsure": [ short plain sentences naming anything you could not read ]
}}

Label rules, in order of importance:

1. NEVER invent a number. Blurred, cut off or missing is null, named in
   "unsure". A figure that is not printed is null, never 0.
2. If a per 100 g (or 100 ml) column is printed, read that column and set
   "amt" 100. Otherwise read the per-serving column, and "amt" is the
   serving's weight: in "1 cup (240 ml)" it is 240 ml, the figure in brackets.
3. Never turn a % Daily Value into an amount. If a nutrient is printed only as
   a percentage, leave it null and say so in "unsure".
4. Convert only between the units named above (1000 mg is 1 g). Nothing else.
5. Do not guess the product's name from the kind of food. No name printed is
   null.
6. "unsure" is for figures you could not read. A brand or a nutrient the
   label simply does not print is not a problem; leave it out of "unsure"."""


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


NUTS = ('kcal', 'p', 'c', 'f', 'na', 'k', 'ca', 'caff')


def fig(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) and v >= 0 else None


def sane_label(rec, unsure):
    """A label's own checks, the way a receipt has its sum.

       Calories against protein, carbs and fat is the one that earns its
       place: a misread 8 for a 3 is invisible on its own and obvious when the
       energy stops adding up. The two conversions are done here rather than
       by the reader, so they are exact and the same every time."""
    for k in NUTS:
        rec[k] = fig(rec.get(k))
    if rec['kcal'] is None and fig(rec.get('kj')):
        rec['kcal'] = round(rec['kj'] / 4.184)
    # salt is sodium chloride and sodium is 39.3% of it, the figure FOODDEX uses
    if rec['na'] is None and fig(rec.get('salt')) is not None:
        rec['na'] = round(rec['salt'] * 393, 1)
    more = rec.get('more')
    rec['more'] = {k: v for k, v in (more.items() if isinstance(more, dict) else [])
                   if fig(v) is not None}
    rec['amt'] = fig(rec.get('amt')) or None
    if rec.get('unit') not in ('g', 'ml'):
        rec['unit'] = 'g'
    rec['pc'] = fig(rec.get('pc')) or None
    if rec['amt'] is None:
        unsure.append('What amount the figures are for could not be read.')
    if not rec.get('name'):
        unsure.append('No product name is printed in the photo.')

    p, c, f, kcal = rec['p'], rec['c'], rec['f'], rec['kcal']
    if None not in (p, c, f, kcal) and kcal > 0:
        est = 4 * p + 4 * c + 9 * f
        # fibre, alcohol and a label's own rounding stay well inside a fifth
        if abs(kcal - est) > 0.2 * max(kcal, est) and abs(kcal - est) > 15:
            unsure.append('The label says %g calories, but its protein, carbs and fat '
                          'come to about %d. One of them may be misread.' % (kcal, est))
    sat, sug = rec['more'].get('sat'), rec['more'].get('sug')
    if sat is not None and f is not None and sat > f:
        unsure.append('Saturated fat reads higher than total fat.')
    if sug is not None and c is not None and sug > c:
        unsure.append('Sugars read higher than total carbs.')


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

    if rec.get('src') == 'label':
        rec['lines'] = []
        sane_label(rec, unsure)
        rec['check'] = bool(unsure)
        return rec

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
    if rec.get('src') == 'label':
        log('read    %s  label  %s  per %s %s%s' % (
            name, rec.get('name') or '(no name)', rec.get('amt'), rec.get('unit'),
            '  NEEDS A LOOK' if rec['check'] else ''))
        return True
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
