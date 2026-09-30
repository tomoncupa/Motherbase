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

   -- the camera roll, since 2026-09-24 --

   Tom asked "Can it auto copy from my photos?", so nothing has to be done on
   the phone. iCloud for Windows mirrors his whole library into
   Pictures/iCloud Photos/Photos, and every run looks there too, at pictures
   dated 2026-09-01 or later. Three rules make that safe and cheap:

   * COPY, NEVER MOVE. That folder IS his iCloud library: a file deleted or
     moved there is deleted from his iPhone. This script only ever opens a
     picture to read it, and copies a receipt into in/ before touching it.
   * Windows reads the words first, for free (ocr.ps1). Only a picture with
     receipt, payment or label words in it reaches claude.exe, because about
     thirty new pictures a day would otherwise spend the subscription limits
     he already hits on selfies.
   * Most of the library is not on the disk, only a stand-in for it, and the
     disk has little room. A picture that was a stand-in before it was read is
     handed back to the cloud afterwards, so the folder is left as it was found.

   seen.json remembers every picture looked at, so no picture is read twice.
   A picture Claude calls "other" is remembered and makes no card.

   -- leaving nothing behind, since 2026-09-30 --

   Tom: "I don't want the receipt reader to fill up space, have it delete
   what its determined to not be a receipt."

   * Its own copy of a camera picture that is not money is deleted: "other"
     at once, a label once its record is in out/ (the food row holds the
     figures and the picture is still in his library). Receipts and payment
     screenshots are kept in done/ as proof. A hand-dropped file is kept as
     before, since he chose to send it.
   * Every picture it downloaded is handed back with +U and remembered in
     seen.json's `_held` until iCloud has really freed it, checked again on
     every later run. status.json says how much it freed today.
   * Its working files (the lock, seen.json, the OCR list) live in
     %LOCALAPPDATA%/Motherbase/receipts, never in iCloud Drive. The reader
     died there silently from 24 Sep: iCloud had turned a leftover OCR list
     into a cloud stand-in, opening it for writing was refused, and pyw
     swallowed the error, so the task said result 1 and the log said nothing.

   -- a stall is loud --

   Every run ends with Receipts/status.json: when it last ran, when it last
   ran clean, when Claude last read a photo, how many wait in in/, and the
   error in plain words if there is one. Anything that goes wrong is a log
   line, and a crash is caught and written rather than lost. A condition that
   repeats every run (signed out, disk full) is said once an hour, not every
   run: 705 identical "under 500 MB" lines drowned the log from 25 to 29 Sep.

   -- when Claude will not answer --

   Claude's docs (code.claude.com/docs/en/headless) say --bare "will become
   the default for -p in a future release", and "In bare mode, Claude Code
   never reads OAuth credentials". An answer about signing in stops the run:
   the photo stays in in/ to be read later, `claude auth status` tells a
   sign-out from an update, and the log and status.json say which. While it
   lasts nothing new is downloaded, since nothing could be read. The same
   guard as OUTER HEAVEN's jobs/signin.py, and the same environment rule: a
   Claude session's CLAUDE_* variables never reach the command.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import time
import traceback
from datetime import datetime

BASE = os.environ.get('MB_RECEIPTS') or os.path.join(
    os.path.expanduser('~'), 'iCloudDrive', 'Receipts')
IN, OUT, DONE, BAD = (os.path.join(BASE, d) for d in ('in', 'out', 'done', 'failed'))
LOG = os.path.join(BASE, 'receipts.log')
STATUS = os.path.join(BASE, 'status.json')
# working files stay on this PC: iCloud Drive can turn any file in it into a
# cloud stand-in that refuses to be written (watched 2026-09-30)
STATE = os.environ.get('MB_RECEIPTS_STATE') or os.path.join(
    os.environ.get('LOCALAPPDATA') or os.path.expanduser('~'), 'Motherbase', 'receipts')
LOCK = os.path.join(STATE, 'run.lock')
LOCAL_LOG = os.path.join(STATE, 'receipts.log')
PICS = ('.jpg', '.jpeg', '.png', '.heic', '.webp')
CAMERA = os.environ.get('MB_CAMERA') or os.path.join(
    os.path.expanduser('~'), 'Pictures', 'iCloud Photos', 'Photos')
SINCE = datetime(2026, 9, 1).timestamp()   # Tom, 2026-09-24: from September on
SEEN = os.path.join(STATE, 'seen.json')
OLD_SEEN = os.path.join(BASE, 'seen.json')   # where it lived until 2026-09-30
OCR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ocr.ps1')
TRIES = 3                # a camera copy Claude could not read is tried this many times
UNPINNED = 0x100000      # attrib +U: "free this up", what iCloud's own Free up space sets
HOURLY = 3600            # a stall that repeats every run is written once an hour
GIVE_WAIT = 60           # seconds iCloud is given to free a picture before a later run checks
OCR_BATCH = 120          # pictures Windows reads per run; the backlog drains over a few runs
CLAUDE_BATCH = 15        # camera-roll pictures Claude reads per run
# A cloud stand-in, not on the disk. PowerShell shows these as OFFLINE, but
# Windows hides that bit from Python; RECALL_ON_DATA_ACCESS is what Python
# sees, and it is gone once the picture has been downloaded. Watched
# 2026-09-24: testing OFFLINE here handed nothing back and filled the disk.
STANDIN = 0x400000
FLOOR = 500 * 2 ** 20    # stop downloading pictures when the disk has less free than this
STALE = 20 * 60          # a lock older than this belonged to a run that died
# the task runs under pyw, with no window, and nothing it starts may open one either
NOWIN = getattr(subprocess, 'CREATE_NO_WINDOW', 0)
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


# -- is Claude still allowed to read? -----------------------------------------

# What claude.exe says when it cannot use his account: the first is the one
# watched on this PC on 2026-09-30 ("Failed to authenticate: OAuth session
# expired and could not be refreshed"), the rest older wordings. The same list
# as OUTER HEAVEN's jobs/signin.py.
AUTH = re.compile(r'failed to authenticate|not logged in|please run /login|run /login|invalid api key|'
                  r'oauth|authentication[_ ]error|unauthori[sz]ed|\b401\b|apikeyhelper|anthropic_api_key|'
                  r'not signed in|sign in again|log in again|credentials', re.I)
SAY = {
    'signed-out': 'Claude is signed out on this PC, so receipt photos wait unread. '
                  'Sign in to Claude and they are read on the next check.',
    'update': 'Claude signed the receipt reader out: a Claude update changed how it runs. Tell Claude.',
}


class ClaudeOut(Exception):
    """Claude refused to read for a sign-in reason. Stops the run; the photo waits."""

    def __init__(self, kind, said):
        super().__init__(SAY[kind])
        self.kind, self.said = kind, said


def claude_env():
    """His own environment, less what a Claude session leaves behind when it is
       the one that started this: those point claude.exe at that session's
       sign-in, and CLAUDE_CODE_SIMPLE forces bare mode."""
    drop = ('ANTHROPIC_BASE_URL', 'USE_LOCAL_OAUTH', 'USE_STAGING_OAUTH')
    return {k: v for k, v in os.environ.items()
            if not (k.upper().startswith('CLAUDE') or k.upper() in drop)}


_optout = {}


def opt_out(exe):
    """The flag that keeps -p reading his sign-in, once a claude.exe has one.
       2.1.284 has none; --no-bare is a guess at the name, used only if --help
       lists it."""
    if exe not in _optout:
        try:
            h = subprocess.run([exe, '--help'], capture_output=True, text=True, encoding='utf-8',
                               errors='replace', timeout=60, creationflags=NOWIN,
                               env=claude_env()).stdout or ''
        except (OSError, subprocess.TimeoutExpired):
            h = ''
        _optout[exe] = ['--no-bare'] if re.search(r'(?<![\w-])--no-bare\b', h) else []
    return _optout[exe]


def signed_in(exe):
    """True or False from `claude auth status`, which reads this PC's own
       sign-in and costs nothing; None when it could not be asked."""
    try:
        out = subprocess.run([exe, 'auth', 'status', '--json'], capture_output=True, text=True,
                             encoding='utf-8', errors='replace', timeout=60,
                             creationflags=NOWIN, env=claude_env()).stdout
        return bool(json.loads(out or '{}').get('loggedIn'))
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return None


def refused(exe, said):
    """A ClaudeOut if what Claude said is about signing in, else None."""
    if not AUTH.search(str(said or '')):
        return None
    # the command's own words for the log, with anything shaped like a key taken out
    t = re.sub(r'sk-[A-Za-z0-9_-]{8,}', '[hidden]', str(said))
    t = re.sub(r'[A-Za-z0-9_\-+/=]{32,}', '[hidden]', t)
    return ClaudeOut('update' if signed_in(exe) else 'signed-out', ' '.join(t.split())[:200])


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
    """One line in Receipts/receipts.log, where Tom is told to look. If iCloud
       will not take it, the copy on this PC does, so a line is never lost."""
    line = datetime.now().strftime('%m-%d %H:%M:%S') + '  ' + msg
    print(line, flush=True)
    for path in (LOG, LOCAL_LOG):
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'a', encoding='utf-8') as f:
                f.write(line + '\n')
            return
        except OSError:
            continue


def put_text(path, text):
    """Write a small file whole. A file iCloud has made a cloud stand-in
       refuses to be opened for writing, so on a refusal the stand-in is
       removed and the write tried once more. Only ever used on this reader's
       own files. Returns whether it landed."""
    for attempt in (0, 1):
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            tmp = path + '.tmp'
            with open(tmp, 'w', encoding='utf-8') as f:
                f.write(text)
            os.replace(tmp, path)
            return True
        except OSError:
            if attempt:
                return False
            for p in (path + '.tmp', path):
                try:
                    os.remove(p)
                except OSError:
                    pass
    return False


def now_iso():
    return datetime.now().isoformat(timespec='seconds')


def load_status():
    try:
        with open(STATUS, encoding='utf-8') as f:
            st = json.load(f)
        return st if isinstance(st, dict) else {}
    except (OSError, ValueError):
        return {}


def save_status(st):
    """Receipts/status.json, for anything that wants to know whether the
       reader is working: OUTER HEAVEN's board, a later RECEIPTS, or Claude."""
    st['v'] = 1
    st['updated'] = now_iso()
    st['log'] = LOG
    if not put_text(STATUS, json.dumps(st, ensure_ascii=False, indent=1)):
        log('FAILED  could not write status.json in Receipts')


def say_once(st, key, msg):
    """A line that would repeat every run is written once an hour."""
    said = st.setdefault('said', {})
    if time.time() - said.get(key, 0) >= HOURLY:
        log(msg)
        said[key] = time.time()


def trouble(st, kind, msg):
    """The run met something that stops the reading. Said plainly, kept in
       status.json until a run gets through without it."""
    if st.get('error_kind') != kind:
        st['error_since'] = now_iso()
        st.get('said', {}).pop(kind, None)
    st['error'], st['error_kind'] = msg, kind
    if kind not in SAY:
        st.pop('claude_said', None)
    st.setdefault('run_trouble', []).append(kind)
    say_once(st, kind, 'STALLED ' + msg)


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


def read_one(exe, name, cam=False, taken=None):
    """One photo in in/ read into one record in out/.

       A camera-roll copy that turns out not to be money or a label is
       thrown away rather than filed: the picture is still in his library,
       and a card for every chat screenshot with a number in it would train
       him to skim the list. Returns the record's src, or None on a failure.

       Raises ClaudeOut when Claude would not read for a sign-in reason; the
       photo is left in in/ for a later run, untouched."""
    src = os.path.join(IN, name)
    try:
        prompt = PROMPT.format(path='in/' + name)
        out = subprocess.run(
            [exe] + opt_out(exe) + ['-p', prompt, '--allowedTools', 'Read',
                                    '--permission-mode', 'acceptEdits'],
            cwd=BASE, capture_output=True, text=True, encoding='utf-8',
            errors='replace', timeout=TIMEOUT, creationflags=NOWIN, env=claude_env())
        if out.returncode != 0 or '{' not in (out.stdout or ''):
            stop = refused(exe, '%s\n%s' % (out.stdout or '', out.stderr or ''))
            if stop:
                raise stop
        if out.returncode != 0:
            raise RuntimeError((out.stderr or out.stdout or '').strip()[:300]
                               or 'the CLI failed')
        rec = sane(carve(out.stdout), name)
        # a bank screenshot rarely prints its date, and a card with no date
        # files as today; for a camera-roll picture the day it was taken is
        # the honest stand-in, and the card says where the date came from
        if cam and taken and not rec.get('date') and rec.get('src') != 'label':
            rec['date'] = datetime.fromtimestamp(taken).strftime('%Y-%m-%d')
            rec['date_from'] = 'photo'
            rec['unsure'].append('No date is printed, so this uses the day the '
                                 'photo was taken.')
            rec['check'] = True
    except ClaudeOut:
        raise
    except Exception as e:                                    # noqa: BLE001
        log('FAILED  %s  %s' % (name, e))
        try:
            if cam:
                # the picture is still in his library, so the copy goes and
                # the camera pass tries it again on a later run
                os.remove(src)
            else:
                shutil.move(src, os.path.join(BAD, name))
        except OSError:
            pass
        return None

    if cam and rec.get('src') == 'other':
        os.remove(src)
        log('other   %s  not a receipt, a payment or a label; copy deleted' % name)
        return 'other'
    stem = os.path.splitext(name)[0]
    with open(os.path.join(OUT, stem + '.json'), 'w', encoding='utf-8') as f:
        json.dump(rec, f, ensure_ascii=False, indent=1)
    # the record exists before the photo moves, so a crash repeats a read
    # rather than losing one. A label is not a receipt: its camera copy goes,
    # since the food row will hold the figures and his library the picture
    if cam and rec.get('src') == 'label':
        os.remove(src)
    else:
        shutil.move(src, os.path.join(DONE, name))
    if rec.get('src') == 'label':
        log('read    %s  label  %s  per %s %s%s%s' % (
            name, rec.get('name') or '(no name)', rec.get('amt'), rec.get('unit'),
            '  NEEDS A LOOK' if rec['check'] else '', '; copy deleted' if cam else ''))
        return 'label'
    log('read    %s  %s  %s %s  %d line(s)%s' % (
        name, rec.get('merchant') or rec.get('src'), rec.get('currency'),
        rec.get('total'), len(rec['lines']),
        '  NEEDS A LOOK' if rec['check'] else ''))
    return rec.get('src') or 'receipt'


# -- the camera roll ---------------------------------------------------------

# One of these is enough on its own: nothing but a receipt, a payment or a
# label prints them.
STRONG = ('nutrition facts', 'nutrition information', 'serving size',
          'servings per', 'per 100 g', 'per 100g', 'amount due', 'vatable',
          'vat sales', 'vat exempt', 'vat-exempt', 'official receipt',
          'sales invoice', 'ref no', 'ref. no', 'reference no', 'reference number',
          'gcash', 'instapay', 'pesonet', 'total amount', 'amount paid',
          'transaction successful', 'you have sent', 'received from')
# Any one of these turns up in a chat or a caption, so it takes two.
WEAK = ('total', 'subtotal', 'change', 'cash', 'php', 'vat', 'tin', 'qty',
        'receipt', 'invoice', 'amount', 'paid', 'payment', 'transfer', 'fee',
        'balance', 'calories', 'kcal', 'kj', 'carbohydrate', 'sodium', 'sugars',
        'maya', 'bpi', 'bdo', 'unionbank', 'metrobank', 'visa')
WEAK_RE = re.compile(r'\b(%s)\b' % '|'.join(WEAK))
MONEY_RE = re.compile(r'(?<![\d.])\d{1,3}(?:,\d{3})*\.\d{2}(?![\d.])')
CHUNK = 20               # pictures downloaded at once, then handed back


def looks_like(text):
    """Why a picture's words say receipt, payment or label, or '' if they
       do not. The reason goes in the log, so a wrong pick can be traced."""
    t = ' '.join((text or '').lower().split())
    if not t:
        return ''
    strong = [k for k in STRONG if k in t]
    if strong:
        return strong[0]
    weak = sorted(set(WEAK_RE.findall(t)))
    if '₱' in t:
        weak.append('peso sign')
    # a column of prices is a receipt even when its words are misread
    if len(MONEY_RE.findall(t)) >= 3:
        weak.append('prices')
    return '+'.join(weak) if len(weak) >= 2 else ''


def load_seen():
    """seen.json on this PC. The first run after 2026-09-30 carries over the
       one that lived in Receipts/, then removes that one."""
    for path in (SEEN, OLD_SEEN):
        try:
            with open(path, encoding='utf-8') as f:
                seen = json.load(f)
        except (OSError, ValueError):
            continue
        if not isinstance(seen, dict):
            continue
        # `_unpin` was a list of names; `_held` also knows each one's size
        held = seen.setdefault('_held', {})
        for n in seen.pop('_unpin', None) or []:
            held.setdefault(n, 0)
        if path == OLD_SEEN and save_seen(seen):
            try:
                os.remove(OLD_SEEN)
            except OSError:
                pass
            log('moved   seen.json to %s' % STATE)
        return seen
    return {'_held': {}}


def save_seen(seen):
    if put_text(SEEN, json.dumps(seen, ensure_ascii=False, separators=(',', ':'))):
        return True
    log('FAILED  could not write %s' % SEEN)
    return False


def attrs(p):
    try:
        return os.stat(p).st_file_attributes
    except (OSError, AttributeError):
        return 0


def ocr(paths=None, jpeg=None):
    """Windows' reader over a batch: {path: text}, and a picture it could
       not open maps to None. With `jpeg` ({src: dst}) it writes JPEG copies
       instead, which is how a HEIC reaches Claude."""
    # on this PC, never in iCloud Drive: a leftover list there became a cloud
    # stand-in, opening it was refused, and every run died on it from 24 Sep
    lst = os.path.join(STATE, 'ocr-list.txt')
    if not put_text(lst, '\n'.join(['%s|%s' % kv for kv in jpeg.items()] if jpeg else paths)):
        raise OSError('could not write the OCR list at %s' % lst)
    try:
        out = subprocess.run(
            ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', OCR,
             '-List', lst] + (['-Jpeg'] if jpeg else []),
            capture_output=True, text=True, encoding='utf-8', errors='replace',
            timeout=20 * 60, creationflags=NOWIN)
    finally:
        try:
            os.remove(lst)
        except OSError:
            pass
    got = {}
    for line in out.stdout.splitlines():
        try:
            o = json.loads(line.lstrip('﻿'))
        except ValueError:
            continue
        if isinstance(o, dict):
            got[o.get('path')] = o.get('text') if 'text' in o else None
    return got


def give_back(paths, held, st):
    """Hand pictures that were cloud stand-ins back to the cloud.

       Reading one downloads it, and this disk has little room: the backlog
       alone would fill it. attrib +U asks iCloud to free the local copy, and
       -U afterwards clears the request, so the file ends in exactly the state
       it was found. One iCloud has not freed inside a minute keeps its +U,
       which is what iCloud's own "Free up space" sets, and waits in `held`
       for settle() on a later run. Nothing here opens, moves or deletes a
       picture: +U and -U are the only things it ever changes."""
    sizes = {}
    for p in paths:
        try:
            sizes[p] = os.stat(p).st_size
        except OSError:
            sizes[p] = 0
        subprocess.run(['attrib', '+U', '-P', p], capture_output=True, creationflags=NOWIN)
    left, wait = list(paths), time.time() + GIVE_WAIT
    while left and time.time() < wait:
        time.sleep(1)
        left = [p for p in left if not attrs(p) & STANDIN]
    for p in paths:
        if p in left:
            held[os.path.basename(p)] = sizes[p]
        else:
            subprocess.run(['attrib', '-U', p], capture_output=True, creationflags=NOWIN)
            freed(st, sizes[p])


def freed(st, size):
    """Count a picture iCloud really took back, by the day it happened."""
    day = datetime.now().strftime('%Y-%m-%d')
    if st.get('freed_day') != day:
        st['freed_day'], st['freed_today_bytes'], st['freed_today_n'] = day, 0, 0
    st['freed_today_bytes'] = st.get('freed_today_bytes', 0) + (size or 0)
    st['freed_today_mb'] = round(st['freed_today_bytes'] / 2 ** 20, 1)
    st['freed_today_n'] = st.get('freed_today_n', 0) + 1


def settle(seen, st):
    """Every picture this reader downloaded and iCloud had not yet taken back,
       checked again. Freed: its +U comes off and it is counted. Not freed:
       its +U is asked for again, since something may have cleared it. Gone
       from the library: forgotten. Runs every time, even when nothing else
       can, so a download from an earlier run is never left behind."""
    held = seen.setdefault('_held', {})
    for n in list(held):
        p = os.path.join(CAMERA, n)
        if not os.path.exists(p):
            held.pop(n)
            continue
        a = attrs(p)
        if a & STANDIN:
            subprocess.run(['attrib', '-U', p], capture_output=True, creationflags=NOWIN)
            freed(st, held.pop(n) or 0)
        elif not a & UNPINNED:
            subprocess.run(['attrib', '+U', '-P', p], capture_output=True, creationflags=NOWIN)
    sizes = list(held.values())
    st['held'], st['held_mb'] = len(sizes), round(sum(sizes) / 2 ** 20, 1)
    if held:
        say_once(st, 'held', 'held    %d picture(s), %.0f MB, downloaded to read and not yet '
                 'taken back by iCloud; asked again' % (len(sizes), sum(sizes) / 2 ** 20))


def copy_name(n):
    """The name a camera picture's copy has in in/: a HEIC arrives as a JPEG."""
    return os.path.splitext(n)[0] + '.jpg' if n.lower().endswith('.heic') else n


def unsettled(v):
    """A camera picture looked at again on the next run: Windows could not
       open it yet ('e1', 'e2'), or Claude could not read it yet ('retry')."""
    return v == 'retry' or bool(re.fullmatch(r'e\d', str(v)))


def read_camera(exe, seen, st, n, lib):
    """One camera copy read, and what the library picture is now remembered
       as. A copy Claude could not read is deleted and tried again on a later
       run, TRIES times in all, then left alone and named in the log."""
    try:
        taken = os.stat(os.path.join(CAMERA, lib)).st_mtime
    except OSError:
        taken = None
    got = read_one(exe, n, cam=True, taken=taken)
    tries = seen.setdefault('_tries', {})
    if got:
        st['last_read'] = now_iso()
        tries.pop(lib, None)
        seen[lib] = got
        return
    k = tries.get(lib, 0) + 1
    if k < TRIES:
        tries[lib], seen[lib] = k, 'retry'
    else:
        tries.pop(lib, None)
        seen[lib] = 'failed'
        log('gave up %s after %d reads; save it into Receipts/in to try again by hand' % (lib, k))


def camera(exe, seen, st, dry=False):
    """New camera-roll pictures: read for words, copy the likely ones into
       in/, and hand Claude those copies. Never writes to CAMERA itself,
       beyond asking iCloud to take back what reading it downloaded."""
    if not os.path.isdir(CAMERA):
        return
    held = seen.setdefault('_held', {})

    now, todo = time.time(), []
    with os.scandir(CAMERA) as it:
        for e in it:
            n = e.name
            if not n.lower().endswith(PICS) or not e.is_file():
                continue
            if n in seen and not unsettled(seen[n]):
                continue       # settled
            a = e.stat()
            # a picture still arriving from the phone waits for the next run
            if a.st_mtime >= SINCE and now - a.st_mtime > 60:
                todo.append((a.st_mtime, n, attrs(os.path.join(CAMERA, n))))
    todo.sort()
    if not dry:
        todo = todo[:OCR_BATCH]
    picks, looked, skipped = [], 0, 0

    for i in range(0, len(todo), CHUNK):
        if shutil.disk_usage(CAMERA).free < FLOOR:
            trouble(st, 'disk', 'Under 500 MB free on this PC, so new photos are not looked at. '
                    'Free some space and it carries on by itself.')
            break
        part = todo[i:i + CHUNK]
        paths = [os.path.join(CAMERA, n) for _, n, _ in part]
        texts = ocr(paths)
        heic, mine = {}, []
        for (_, n, _), p in zip(part, paths):
            looked += 1
            text = texts.get(p)
            if text is None:
                # iCloud may simply be offline; three strikes and it is dropped
                was = seen.get(n, '')
                tries = (int(was[1:]) if re.fullmatch(r'e\d', was) else 0) + 1
                seen[n] = 'e%d' % tries if tries < 3 else 'unreadable'
                continue
            why = looks_like(text)
            if not why or (not dry and len(picks) + len(mine) >= CLAUDE_BATCH):
                if not why:
                    seen[n] = 'skip'
                    skipped += 1
                continue       # a pick past this run's allowance waits for the next
            mine.append((n, why))
            # if this run dies before Claude reads the copy, the next run's
            # in/ pass reads it; 'picked' stops the camera copying it again
            seen[n] = 'picked'
            if dry:
                print('PICK  %s  %s' % (n, why), flush=True)
            elif n.lower().endswith('.heic'):
                heic[p] = os.path.join(IN, copy_name(n))
            else:
                # copy, never move: the picture in CAMERA is his iCloud library
                shutil.copy2(p, os.path.join(IN, n))
        if heic:
            ocr(jpeg=heic)
        # the copies are made, so the downloads can go back
        give_back([p for (_, n, a), p in zip(part, paths) if a & STANDIN], held, st)
        picks += mine
        if not dry:
            save_seen(seen)

    st['held'] = len(held)
    st['held_mb'] = round(sum(held.values()) / 2 ** 20, 1)
    if dry:
        print('looked at %d, picked %d, skipped %d' % (looked, len(picks), skipped))
        # a dry run remembers nothing but what it downloaded and has not yet
        # seen handed back, so a later run still settles those
        real = load_seen()
        real.setdefault('_held', {}).update(held)
        save_seen(real)
        return
    if looked:
        log('camera  looked at %d new photo(s), picked %d%s' % (
            looked, len(picks), ', more waiting' if len(todo) >= OCR_BATCH else ''))
    try:
        for n, why in picks:
            name = copy_name(n)
            if not os.path.isfile(os.path.join(IN, name)):
                seen[n] = 'unreadable'
                continue
            log('picked  %s  (%s)' % (n, why))
            read_camera(exe, seen, st, name, n)
            save_seen(seen)
    finally:
        save_seen(seen)


def run(st):
    exe = claude_exe()
    seen = load_seen()
    # before anything else, and whatever else happens: pictures an earlier
    # run downloaded and iCloud had not yet taken back
    settle(seen, st)
    save_seen(seen)
    if not exe:
        trouble(st, 'no-claude', 'No Claude program was found under AppData/Roaming/Claude/claude-code, '
                'so receipt photos wait unread.')
        return 0

    # While Claude is out nothing new is downloaded, since nothing could be
    # read. A sign-out is asked about for free before every run; an update
    # that refuses a signed-in command is tried again every half hour.
    kind = st.get('error_kind')
    if signed_in(exe) is False:
        raise ClaudeOut('signed-out', 'claude auth status: not signed in')
    if kind == 'update' and time.time() - st.get('out_tried', 0) < 1800:
        raise ClaudeOut('update', st.get('claude_said') or '')
    if kind in ('signed-out', 'update'):
        st['out_tried'] = time.time()

    # iCloud writes a placeholder first, so a file still arriving is left
    # for the next run rather than read half-downloaded
    now, work = time.time(), []
    for n in sorted(os.listdir(IN)):
        p = os.path.join(IN, n)
        if (os.path.isfile(p) and n.lower().endswith(PICS)
                and os.path.getsize(p) > 0 and now - os.path.getmtime(p) > 5):
            work.append(n)
    # a camera copy left waiting by an earlier run is still a camera copy
    cam_of = {copy_name(k): k for k, v in seen.items() if v == 'picked'}
    try:
        for n in work:
            if n in cam_of:
                read_camera(exe, seen, st, n, cam_of[n])
            elif read_one(exe, n):
                st['last_read'] = now_iso()
    finally:
        save_seen(seen)
    camera(exe, seen, st)
    return 0


def main():
    for d in (IN, OUT, DONE, BAD, STATE):
        os.makedirs(d, exist_ok=True)
    if os.path.exists(LOCK) and time.time() - os.path.getmtime(LOCK) < STALE:
        return 0
    put_text(LOCK, now_iso())
    st = load_status()
    st['last_run'] = now_iso()
    st['run_trouble'] = []
    code = 0
    try:
        code = run(st)
    except ClaudeOut as e:
        st['claude_said'] = e.said
        trouble(st, e.kind, e.args[0])
    except Exception as e:                                       # noqa: BLE001
        # pyw has no window and swallows a traceback, which is how a dead
        # reader sat behind "result 1" from 24 to 30 Sep with nothing said
        where = traceback.extract_tb(e.__traceback__)[-1]
        trouble(st, 'crash', 'The receipt reader stopped on an error: %s: %s (line %d)'
                % (type(e).__name__, str(e)[:200], where.lineno))
        code = 1
    finally:
        try:
            st['waiting'] = sum(1 for n in os.listdir(IN) if n.lower().endswith(PICS))
        except OSError:
            pass
        clean = not st.pop('run_trouble', None)
        if clean:
            if st.get('error_kind'):
                log('back    %s is over' % st['error_kind'])
            for k in ('error', 'error_kind', 'error_since', 'claude_said', 'out_tried'):
                st.pop(k, None)
            st['last_good'] = st['last_run']
        st['ok'] = clean
        save_status(st)
        try:
            os.remove(LOCK)
        except OSError:
            pass
    return code


if __name__ == '__main__':
    if '--dry' in sys.argv:
        # which camera-roll pictures would be picked: no Claude read, no copy,
        # nothing remembered but what it downloaded
        for d in (IN, STATE):
            os.makedirs(d, exist_ok=True)
        camera(None, load_seen(), {}, dry=True)
        sys.exit(0)
    sys.exit(main())
