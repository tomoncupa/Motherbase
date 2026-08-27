# -*- coding: utf-8 -*-
"""Pulls every string a person actually reads out of the apps.

WHY THIS EXISTS
  Tom said the copy sounds like Claude. I diagnosed it by reading a sample and
  got it wrong twice in one message: I declared the in-app copy fine when it is
  not, and the sentence I wrote naming the problem contained the problem.

  So this does not diagnose anything. It collects. Every line goes in front of
  Tom, he marks the ones that sound wrong, and the rule comes out of HIS marks
  rather than out of me introspecting about my own habits.

WHAT IT COLLECTS
  Quoted strings that look like something a person reads, after comments are
  stripped. It is deliberately over-inclusive - a false positive costs one
  glance, a missed line costs a bad rule.

USAGE
  py -3 tools/copy-audit.py            -> writes tools/copy-audit.json
"""
import io, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'tools', 'copy-audit.json')

APPS = [
    ('HOME', 'index.html'),
    ('STATUS', 'status/index.html'),
    ('TRAIN', 'train/index.html'),
    ('BLOCK', 'block/index.html'),
    ('ARC', 'arc/index.html'),
    ('STYLE', 'style/index.html'),
    ('SHARED', 'shared/ui.js'),
    ('SHARED', 'shared/io.js'),
]

# Where the string was found, so Tom can tell a toast from a settings note.
# Checked in order; first hit wins.
KINDS = [
    ('toast',    re.compile(r'\btoast\s*\(')),
    ('snack',    re.compile(r'\bUI\.(snack|undo)\s*\(')),
    ('confirm',  re.compile(r'\bUI\.confirm\s*\(|\bconfirm\s*\(')),
    ('note',     re.compile(r"'note'|\"note\"")),
    ('empty',    re.compile(r"'empty'|\"empty\"")),
    ('label',    re.compile(r"'fl'|'lbl'|\blabel\b")),
    ('button',   re.compile(r"'btn|\bbutton\b|textContent\s*=")),
    ('heading',  re.compile(r'\btitle\s*:|\bnm\s*:|\bname\s*:')),
    ('help',     re.compile(r'\bds\s*:|\bsub\s*:|placeholder')),
]


def strip_comments(src):
    """Blank out comments, keeping line numbers intact so file:line still works.

    Not a parser. It is wrong inside a string containing // or /*, which costs
    a handful of dropped lines out of a few thousand and never invents one.
    """
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c in '"\'':
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == '\\' else 1
            out.append(src[i:j + 1]); i = j + 1
        elif src.startswith('/*', i):
            j = src.find('*/', i + 2)
            j = n if j < 0 else j + 2
            out.append(re.sub(r'[^\n]', ' ', src[i:j])); i = j
        elif src.startswith('//', i):
            j = src.find('\n', i)
            j = n if j < 0 else j
            out.append(' ' * (j - i)); i = j
        else:
            out.append(c); i += 1
    return ''.join(out)


STR = re.compile(r"'((?:[^'\\\n]|\\.){4,300})'|\"((?:[^\"\\\n]|\\.){4,300})\"")

# Things that are code wearing quotes.
CODE = re.compile(
    r'^[a-z0-9_.\-#\[\]]+$'                      # identifiers, selectors
    r'|^--|var\(--|^#[0-9a-f]{3,8}$'             # css
    r'|^[0-9 .,:%/+-]+$'                         # numbers
    r'|^(?:[a-z]+-)+[a-z]+$'                     # kebab-case
    r'|px|rgba?\(|translate|;|\{|\}|=>|function'
    r'|^[A-Z_]+$'                                # CONSTANTS
    r'|^https?:|^data:|^image/|^application/'
    r'|YYYY|^[a-z]+/[a-z]+$',
    re.I)


ENT = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&nbsp;': ' ', '&mdash;': '—',
       '&times;': '×', '&rarr;': '→', '&deg;': '°', '&quot;': '"'}


def readable(s):
    """What a person actually sees: markup gone, entities resolved.

    Plenty of these strings are whole fragments of HTML with one real sentence
    inside them. The sentence is the thing being judged, so the tags come off
    for display and for the word count, while `text` keeps the raw string so
    an edit can still find it in the file.
    """
    t = re.sub(r'<[^>]+>', ' ', s)
    for k, v in ENT.items():
        t = t.replace(k, v)
    return re.sub(r'\s+', ' ', t).strip()


def looks_like_copy(s):
    t = readable(s)
    if len(t) < 4 or ' ' not in t:
        return False
    if CODE.search(s):
        return False
    words = [w for w in re.split(r'\s+', t) if w]
    if len(words) < 2:
        return False
    # Needs at least one ordinary word, not just symbols and numbers.
    return any(re.match(r'^[A-Za-z]{2,}$', w.strip('.,:;!?&…')) for w in words)


def kind_of(line):
    for name, rx in KINDS:
        if rx.search(line):
            return name
    return 'other'


rows, seen = [], set()
for app, rel in APPS:
    path = os.path.join(ROOT, rel)
    if not os.path.isfile(path):
        sys.exit('missing ' + rel)
    src = io.open(path, encoding='utf-8').read()
    clean = strip_comments(src)
    lines = clean.split('\n')
    for ln, line in enumerate(lines, 1):
        for m in STR.finditer(line):
            s = m.group(1) if m.group(1) is not None else m.group(2)
            if not looks_like_copy(s):
                continue
            key = (app, readable(s))
            if key in seen:
                continue
            seen.add(key)
            rows.append({
                'app': app, 'file': rel, 'line': ln,
                'kind': kind_of(line),
                'text': s,
                'read': readable(s),
                'words': len(readable(s).split()),
            })

# Tone lives in sentences. A one or two word label ("Cost", "Paid from") has
# no voice to get wrong, so the review page would only bury the real ones.
MIN_WORDS = 5
rows = [r for r in rows if r['words'] >= MIN_WORDS]
rows.sort(key=lambda r: (r['app'], -r['words']))
io.open(OUT, 'w', encoding='utf-8').write(
    json.dumps(rows, ensure_ascii=False, indent=1) + '\n')

by_app, by_kind = {}, {}
for r in rows:
    by_app[r['app']] = by_app.get(r['app'], 0) + 1
    by_kind[r['kind']] = by_kind.get(r['kind'], 0) + 1
print('%d strings -> %s' % (len(rows), OUT))
print('  by app  : ' + ', '.join('%s %d' % kv for kv in sorted(by_app.items())))
print('  by kind : ' + ', '.join('%s %d' % kv for kv in
                                 sorted(by_kind.items(), key=lambda k: -k[1])))
print('  longest : %d words' % max(r['words'] for r in rows))

# --- the review page ---
# The JSON is for me. This is for Tom: the same rows in a page he can mark up
# without reading any code.
TPL = os.path.join(ROOT, 'tools', 'copy-review.template.html')
PAGE = os.path.join(ROOT, 'tools', 'copy-review.html')
tpl = io.open(TPL, encoding='utf-8').read()
MARK = '/*DATA*/'
if tpl.count(MARK) != 2:
    sys.exit('template needs exactly two %s markers' % MARK)
head, rest = tpl.split(MARK, 1)
_, tail = rest.split(MARK, 1)
slim = [{'app': r['app'], 'file': r['file'], 'line': r['line'],
         'kind': r['kind'], 'text': r['read'], 'words': r['words']} for r in rows]
io.open(PAGE, 'w', encoding='utf-8', newline='\n').write(
    head + MARK + json.dumps(slim, ensure_ascii=False, separators=(',', ':'))
    + MARK + tail)
print('review page -> %s (%d KB)' % (PAGE, os.path.getsize(PAGE) // 1024))
