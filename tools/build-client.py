# -*- coding: utf-8 -*-
"""Builds the CLIENT copy of Motherbase out of this repo.

WHY THIS EXISTS
  Beta testers get a smaller suite than Tom does: no FORM (client video), no
  CLEX (a personal side app), no HABITS (superseded by STATUS), and five
  themes instead of eighteen.

  The obvious way to do that is to copy the folder and delete things. Do not.
  A hand-made copy is a fork, and a fork of `shared/` drifts: a fix Tom makes
  in the store, the themes or the sheet layer reaches his apps and silently
  never reaches his testers. The two would disagree within a fortnight, and
  the bug reports would be about a version that no longer exists.

  So the client folder is GENERATED. This repo stays the only place anything
  is edited. Run this, push the result, and the two are the same code.

THIS IS NOT A BUILD STEP
  Same rule as tools/embed-skins.py. Nothing here has to run for the suite to
  work - the repo as it stands is always deployable. This runs only when you
  are publishing to testers.

IT FAILS LOUDLY
  Every patch below asserts that it actually changed something. If a future
  edit renames a line this script looks for, you get an error naming the
  patch, not a client build that quietly still has HABITS in the menu.

USAGE
  py -3 tools/build-client.py                  -> ../Motherbase-Client
  py -3 tools/build-client.py <target folder>
"""
import io, json, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 \
    else os.path.join(os.path.dirname(ROOT), 'Motherbase-Client')

# ── what a tester gets ────────────────────────────────────────────────────
# Folders copied whole. Everything not named here is left behind, which is
# the safe direction: a new app has to be added deliberately.
COPY_DIRS = ['shared', 'arc', 'block', 'status', 'train', 'style']
COPY_FILES = ['index.html', '.nojekyll']

# Left behind on purpose:
#   form/   client video, and it is Tom's review tool, not theirs
#   clex/   a personal side app
#   habits/ a stand-in that STATUS replaced
#   quest/ _template/ tools/ and every *.md brief - these are build notes
DROP_APPS = ['habits', 'form']        # removed from the home screen roster
# The dead widgets are no longer here to remove: HABITS, the habit-backed
# STREAKS and NUMBERS were deleted from the main repo on 2026-08-28, and
# the STREAKS that replaced one of them counts ticks, so it works for a
# tester with no HABITS just as well as it does for Tom.
DROP_WIDGETS = []

# ── the five themes ───────────────────────────────────────────────────────
# Order matters: skins.js falls back to skins[0] when nothing is saved, so
# whatever sits first here is what a tester sees on their very first open.
KEEP_THEMES = ['block', 'ice', 'chalkboard', 'sketch', 'doodle']
RENAME_THEMES = {'block': 'Default', 'ice': 'System'}

# Files that exist only in the client copy, taken from tools/client/.
CLIENT_ONLY = {'README.md': 'README.md', 'guide.html': 'guide.html',
               'gitignore.txt': '.gitignore'}


def fail(msg):
    sys.exit('build-client: ' + msg)


def patch(text, pattern, repl, what, flags=0):
    """Substitute, and refuse to continue if nothing matched."""
    out, n = re.subn(pattern, repl, text, flags=flags)
    if not n:
        fail('nothing matched for "%s" - index.html changed shape, fix this '
             'script rather than shipping a client build with it still in' % what)
    return out


# ── copy ──────────────────────────────────────────────────────────────────
if os.path.isdir(DEST):
    # Keep .git so this stays the same repo across rebuilds.
    for name in os.listdir(DEST):
        if name == '.git':
            continue
        p = os.path.join(DEST, name)
        shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
else:
    os.makedirs(DEST)

for d in COPY_DIRS:
    src = os.path.join(ROOT, d)
    if not os.path.isdir(src):
        fail('missing folder: ' + d)
    shutil.copytree(src, os.path.join(DEST, d))

for f in COPY_FILES:
    src = os.path.join(ROOT, f)
    if not os.path.isfile(src):
        fail('missing file: ' + f)
    shutil.copy2(src, os.path.join(DEST, f))

# Strip the dev-facing files out of the folders we just copied whole. Briefs,
# fixtures and the smoke page are notes to whoever is building this - shipping
# them to a tester is clutter at best and a wrong instruction at worst.
for d in COPY_DIRS:
    here = os.path.join(DEST, d)
    for name in os.listdir(here):
        low = name.lower()
        if low.endswith('.md') or low == '_smoke.html' or low == 'placeholder.txt':
            os.remove(os.path.join(here, name))

# ── themes ────────────────────────────────────────────────────────────────
sj = os.path.join(DEST, 'shared', 'skins.json')
data = json.load(io.open(sj, encoding='utf-8'))
by_id = {s['id']: s for s in data['skins']}
missing = [t for t in KEEP_THEMES if t not in by_id]
if missing:
    fail('themes not in skins.json: ' + ', '.join(missing))

data['skins'] = [by_id[t] for t in KEEP_THEMES]
for tid, name in RENAME_THEMES.items():
    by_id[tid]['name'] = name

names = [s['name'] for s in data['skins']]
if len(set(names)) != len(names):
    fail('two themes would show the same name: ' + ', '.join(names))

io.open(sj, 'w', encoding='utf-8').write(
    json.dumps(data, ensure_ascii=False, indent=2) + '\n')

# skins.js carries the same set embedded, because a page opened straight off
# the disk cannot fetch skins.json. Both halves must agree or a tester who
# opens the folder gets a different theme list from one who opens the link.
sjs = os.path.join(DEST, 'shared', 'skins.js')
js = io.open(sjs, encoding='utf-8').read()
START, END = '/*SKINS-START*/', '/*SKINS-END*/'
if START not in js or END not in js:
    fail('markers missing in skins.js')
blob = json.dumps(data, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
head, rest = js.split(START, 1)
_, tail = rest.split(END, 1)
io.open(sjs, 'w', encoding='utf-8').write(
    head + START + 'const FALLBACK=' + blob + ';' + END + tail)

# ── the home screen ───────────────────────────────────────────────────────
ih = os.path.join(DEST, 'index.html')
html = io.open(ih, encoding='utf-8').read()

for aid in DROP_APPS:
    html = patch(html, r"\n *\{ id: '%s',.*?\},(?=\n)" % aid, '',
                 'APPS entry for ' + aid)

for wid in DROP_WIDGETS:
    html = patch(html, r"\n  %s: \{\n.*?\n  \},\n" % wid, '\n',
                 'widget block for ' + wid, re.S)
    html = patch(html, r"\{ t: '%s', w: \d+, h: \d+ \}, ?" % wid, '',
                 'default layout entry for ' + wid)

# The Data panel offered a habits CSV. Nothing can make a habit now.
html = patch(html, r"\n *\['◎', 'Habits as CSV'.*?\],(?=\n)", '',
             'habits CSV row in the Data panel')


# The wipe-everything confirm still named habits.
html = html.replace('ticks, habits, every app', 'ticks, every app')
html = html.replace("your ticks, habits, routines", "your ticks, routines")

io.open(ih, 'w', encoding='utf-8').write(html)

# ── STYLE's icon audit ────────────────────────────────────────────────────
# It fetches every app in the suite and reports which still use a Unicode
# character where an icon belongs. Its list is hard-coded and names apps a
# tester does not have. It survives a 404 - it just prints "unreachable" -
# but three rows of that read as three broken things. Point it at what ships.
sh = os.path.join(DEST, 'style', 'index.html')
style = io.open(sh, encoding='utf-8').read()
audit = ["['home', '../index.html']"] + \
        ["['%s', '%s']" % (d, 'index.html' if d == 'style' else '../%s/index.html' % d)
         for d in COPY_DIRS if d != 'shared']
style = patch(style, r'const AUDIT_FILES = \[.*?\n\];',
              'const AUDIT_FILES = [\n  ' + ',\n  '.join(audit) + ',\n];',
              'AUDIT_FILES in style/index.html', re.S)
io.open(sh, 'w', encoding='utf-8').write(style)

# ── ARC's own default ─────────────────────────────────────────────────────
# ARC picks its opening theme by name rather than taking skins[0], and the
# name it holds is 'ice'. Every other app opens on whatever sits first in
# skins.json. Leave it and a tester's very first visit to ARC is a different
# skin from the five screens either side of it, which reads as a bug.
FIRST = KEEP_THEMES[0]
ah = os.path.join(DEST, 'arc', 'index.html')
arc = io.open(ah, encoding='utf-8').read()
arc = patch(arc, r"let THEME_NAME='[a-z0-9]+';", "let THEME_NAME='%s';" % FIRST,
            "ARC's opening theme")
io.open(ah, 'w', encoding='utf-8').write(arc)

# Anything still pointing at an app a tester does not have is a dead link,
# and a dead link is worse than a missing feature because it looks like a bug.
for gone in DROP_APPS:
    if ("go('%s')" % gone) in html or ('%s/index.html' % gone) in html:
        fail('index.html still links to %s - patch it above' % gone)

# ── cache stamp ───────────────────────────────────────────────────────────
# GitHub Pages caches hard, and a tester who added this to their home screen
# is the most cached reader there is. Without a stamp they can end up running
# a NEW index.html against an OLD shared/records.js - a half-updated app,
# which is exactly the silent breakage nobody can diagnose over a message.
#
# The stamp is a hash of shared/ itself, so it only moves when shared/ moves.
# Ship a fix, the URL changes, every browser refetches. Ship nothing, nothing
# is refetched.
import hashlib
h = hashlib.sha1()
for name in sorted(os.listdir(os.path.join(DEST, 'shared'))):
    h.update(name.encode('utf-8'))
    h.update(io.open(os.path.join(DEST, 'shared', name), 'rb').read())
stamp = h.hexdigest()[:8]

stamped = 0
for here, subdirs, found in os.walk(DEST):
    subdirs[:] = [d for d in subdirs if d != '.git']
    for name in found:
        if not name.endswith('.html'):
            continue
        p = os.path.join(here, name)
        t = io.open(p, encoding='utf-8').read()
        t, n = re.subn(r'(src="(?:\.\./)?shared/[a-z0-9_.-]+\.js)"',
                       r'\1?v=%s"' % stamp, t)
        if n:
            io.open(p, 'w', encoding='utf-8').write(t)
            stamped += n
if not stamped:
    fail('stamped no script tags - the <script src="shared/..."> shape changed')

# ── client-only files ─────────────────────────────────────────────────────
for src, dst in CLIENT_ONLY.items():
    p = os.path.join(ROOT, 'tools', 'client', src)
    if not os.path.isfile(p):
        fail('missing tools/client/' + src)
    shutil.copy2(p, os.path.join(DEST, dst))

# ── report ────────────────────────────────────────────────────────────────
files = 0
for here, subdirs, found in os.walk(DEST):
    subdirs[:] = [d for d in subdirs if d != '.git']
    files += len(found)
print('built %s' % DEST)
print('  apps    : %s' % ', '.join(['home'] + [d for d in COPY_DIRS if d != 'shared']))
print('  themes  : %s' % ', '.join(names))
print('  files   : %d' % files)
print('  cache   : %d script tags stamped ?v=%s' % (stamped, stamp))
print('')
print('next: cd into it, then  git add -A  and  git commit')
