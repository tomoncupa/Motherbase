# -*- coding: utf-8 -*-
"""Builds the CLIENT copy of Motherbase out of this repo.

WHY THIS EXISTS
  Clients get a smaller suite than Tom does: no FORM (client video),
  none of Tom's own apps, and five themes instead of eighteen.

  The obvious way to do that is to copy the folder and delete things. Do not.
  A hand-made copy is a fork, and a fork of `shared/` drifts: a fix Tom makes
  in the store, the themes or the sheet layer reaches his apps and silently
  never reaches his clients. The two would disagree within a fortnight, and
  the bug reports would be about a version that no longer exists.

  So the client folder is GENERATED. This repo stays the only place anything
  is edited. Run this, push the result, and the two are the same code.

THIS IS NOT A BUILD STEP
  Same rule as tools/embed-skins.py. Nothing here has to run for the suite to
  work - the repo as it stands is always deployable. This runs only when you
  are publishing to clients.

IT FAILS LOUDLY
  Every patch below asserts that it actually changed something. If a future
  edit renames a line this script looks for, you get an error naming the
  patch, not a client build that quietly still has WEALTH in the menu.

USAGE
  py -3 tools/build-client.py                  -> ../Motherbase-Client
  py -3 tools/build-client.py <target folder>
"""
import io, json, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARGS = [a for a in sys.argv[1:] if a != '--dirty']
DEST = os.path.abspath(ARGS[0]) if ARGS \
    else os.path.join(os.path.dirname(ROOT), 'Motherbase-Client')

# ── what a client gets ────────────────────────────────────────────────────
# Folders copied whole. Everything not named here is left behind, which is
# the safe direction: a new app has to be added deliberately.
COPY_DIRS = ['shared', 'block', 'status', 'train', 'style', 'checkin', 'log', 'quest']
COPY_FILES = ['index.html', '.nojekyll']

# Left behind on purpose:
#   form/    client video, and it is Tom's review tool, not theirs
#   portion/ the same reason: a coaching bench for building the food library,
#            not something a client should be adding foods with
#   wealth/  his money: clients, rates, rent, debts. Tom only, and the one
#            folder here where a leak would be a real one
#   arc/     Tom's own, since 2026-09-14
#   speak/   Tom's own, since 2026-09-15: his content practice
#   system/  Tom's own, since 2026-09-15: his own posts, not a client's
#   receipts/ Tom's own, 2026-09-21: it reads a folder on HIS pc that the
#            receipt reader writes into, and it writes his spending. A
#            client has neither the folder nor the reader
#   desktop/ the Windows launcher for STATUS. Tom's machine only, and a
#            .exe is not something to hand a client on a phone
#   _template/ tools/ and every *.md brief - these are build notes
DROP_APPS = ['form', 'portion', 'wealth', 'arc', 'speak', 'system', 'mix', 'receipts', 'coach']   # removed from the home screen roster
# The dead widgets are no longer here to remove: HABITS, the habit-backed
# STREAKS and NUMBERS were deleted from the main repo on 2026-08-28, and
# the STREAKS that replaced one of them counts ticks, so it works for a
# client with no HABITS just as well as it does for Tom.
#   links  Tom's own, 2026-09-17: every app's web address, his suite and the
#          client suite side by side. A client has no use for a list of apps
#          they do not have, and no business with the addresses of Tom's.
#          Its comment sits inside the object so that it goes with it - the
#          patch below matches from the widget's first line to its last.
DROP_WIDGETS = ['links']

# ── shared files a client does not get ────────────────────────────────────
#   cloud.js  LIVE SYNC, the Firebase sync beside the sheet, added
#             2026-09-20. Tom, on the handoff: him first, clients after. A
#             client has no Firebase project, so all the settings row could
#             tell them is to paste a config they do not have and cannot get.
#             Leaving the FILE out is the whole switch: io.js draws that row
#             only when Cloud is there, so a client build has no LIVE SYNC
#             section at all rather than a dead one. Delete this line the day
#             clients get it, and nothing else has to change.
DROP_SHARED = ['cloud.js']

# ── the five themes ───────────────────────────────────────────────────────
# Order matters: skins.js falls back to skins[0] when nothing is saved, so
# whatever sits first here is what a client sees on their very first open.
KEEP_THEMES = ['block', 'ice', 'chalkboard', 'sketch', 'doodle']
RENAME_THEMES = {'block': 'Default', 'ice': 'System'}

# Files that exist only in the client copy, taken from tools/client/.
CLIENT_ONLY = {'README.md': 'README.md', 'guide.html': 'guide.html',
               'gitignore.txt': '.gitignore'}


def fail(msg):
    sys.exit('build-client: ' + msg)


# ── refuse a dirty tree ───────────────────────────────────────────────────
# Tom, 2026-09-23: one session per module means another session can have an
# app half finished in this folder. This script packages every client app, so
# building now would ship that half onto clients' phones. Anything uncommitted
# in what a client gets stops the build and is named. `--dirty` overrides it,
# for a session that knows the unsaved change is its own and finished.
def refuse_dirty():
    import subprocess
    paths = [d + '/' for d in COPY_DIRS] + COPY_FILES
    try:
        out = subprocess.run(['git', 'status', '--porcelain', '--'] + paths,
                             cwd=ROOT, capture_output=True, text=True).stdout
    except OSError:
        return
    if out.strip():
        fail('unsaved changes in what clients get. Commit them, or wait for '
             'the session that owns them. Pass --dirty only if they are yours '
             'and finished.\n' + out.rstrip())


if '--dirty' not in sys.argv:
    refuse_dirty()


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
# them to a client is clutter at best and a wrong instruction at worst.
for d in COPY_DIRS:
    here = os.path.join(DEST, d)
    for name in os.listdir(here):
        low = name.lower()
        if low.endswith('.md') or low == '_smoke.html' or low == 'placeholder.txt':
            os.remove(os.path.join(here, name))
        elif d == 'shared' and name in DROP_SHARED:
            os.remove(os.path.join(here, name))

# io.js fetches cloud.js by itself, so removing the file alone would leave
# every app asking for it once per open and getting a 404. Harmless - the
# loader swallows it - but it is a wasted request on a phone, every open,
# forever. So the loader is switched off in the client copy too. Asserted
# rather than attempted: if this line ever changes shape the build stops,
# instead of quietly shipping the 404 back.
iojs = os.path.join(DEST, 'shared', 'io.js')
if os.path.isfile(iojs) and 'cloud.js' in DROP_SHARED:
    txt = io.open(iojs, encoding='utf-8').read()
    mark = "  if (g.Cloud || document.getElementById('mb-cloud-js')) return;"
    if txt.count(mark) != 1:
        fail('io.js cloud loader has changed shape - update DROP_SHARED handling')
    txt = txt.replace(mark, "  return;   /* client build: no live sync, see tools/build-client.py */", 1)
    io.open(iojs, 'w', encoding='utf-8').write(txt)

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
# the disk cannot fetch skins.json. Both halves must agree or a client who
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
# client does not have. It survives a 404 - it just prints "unreachable" -
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

# ARC used to be patched here to open on the first kept theme. ARC is Tom's
# own since 2026-09-14 and no longer ships, so there is nothing to patch.

# Anything still pointing at an app a client does not have is a dead link,
# and a dead link is worse than a missing feature because it looks like a bug.
for gone in DROP_APPS:
    if ("go('%s')" % gone) in html or ('%s/index.html' % gone) in html:
        fail('index.html still links to %s - patch it above' % gone)

# ── client-only files ─────────────────────────────────────────────────────
for src, dst in CLIENT_ONLY.items():
    p = os.path.join(ROOT, 'tools', 'client', src)
    if not os.path.isfile(p):
        fail('missing tools/client/' + src)
    shutil.copy2(p, os.path.join(DEST, dst))

# ── cache stamp ───────────────────────────────────────────────────────────
# GitHub Pages caches hard, and a client who added this to their home screen
# is the most cached reader there is. Without a stamp they can end up running
# a NEW index.html against an OLD shared/records.js - a half-updated app,
# which is exactly the silent breakage nobody can diagnose over a message.
#
# The stamp is a hash of shared/ itself, so it only moves when shared/ moves.
# Ship a fix, the URL changes, every browser refetches. Ship nothing, nothing
# is refetched.
import hashlib
h = hashlib.sha1()
# Every file under shared/, not just the top level: shared/icons/ arrived on
# 2026-09-15 and listdir handed this a directory to read, which threw and left
# the client copy unstamped. Walked, so a new folder in there cannot do it
# again, and sorted at every level so the hash does not depend on disk order.
for here, subdirs, found in os.walk(os.path.join(DEST, 'shared')):
    subdirs.sort()
    for name in sorted(found):
        full = os.path.join(here, name)
        h.update(os.path.relpath(full, DEST).replace(os.sep, '/').encode('utf-8'))
        h.update(io.open(full, 'rb').read())
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
        # Stamp the page itself too, so the app can SAY which copy it is.
        # A phone serving a cached page had Tom chasing two bugs that were
        # not there; STATUS shows this in settings so the next one is one
        # glance rather than half an hour.
        t, n2 = re.subn(r'<html lang="en"(?![^>]*data-built)',
                        '<html lang="en" data-built="%s"' % stamp, t, count=1)
        if n or n2:
            io.open(p, 'w', encoding='utf-8').write(t)
            stamped += n
if not stamped:
    fail('stamped no script tags - the <script src="shared/..."> shape changed')

# ── the offline cache ─────────────────────────────────────────────────────
# sw.js in the repo root is the cache, and it works as it stands: Tom's own
# copy is hosted too and registers the same file. It is copied rather than
# forked for the reason at the top of this script - a fork of shared drifts.
#
# Two things are replaced on the way through, and both only matter here:
#
#   the stamp    names the cache, so a new build's copy replaces the last
#                one on the phone instead of sitting beside it
#   the list     is what is taken at install. The repo's own list is short on
#                purpose, because naming every app there would be a second
#                place to remember to edit. Here the list is generated, so a
#                client who has only ever opened the home screen still has
#                every app the first time they are somewhere with no signal.
#
# The shared files go in at the exact address the pages ask for, stamp and
# all: a cache is keyed by the whole address, so shared/records.js and
# shared/records.js?v=abc are two different entries and only one is asked for.
#
# The theme pictures under shared/icons/ are left out. They are three
# megabytes, they are the icon you get when you add the app to a home screen,
# and adding it to a home screen needs a connection anyway.
pre = []
for here, subdirs, found in os.walk(DEST):
    subdirs[:] = [d for d in subdirs if d != '.git']
    for name in sorted(found):
        rel = os.path.relpath(os.path.join(here, name), DEST).replace(os.sep, '/')
        if rel.endswith('.html'):
            pre.append(rel)
            if rel.endswith('index.html'):
                # The address a person opens is the folder, not the file:
                # ".../status/", and "./" for the home screen. Those are
                # different cache keys from the file itself.
                pre.append(rel[:-len('index.html')] or './')
        elif rel == 'shared/skins.json':
            pre.append(rel)
        elif rel.startswith('shared/') and rel.endswith('.js'):
            pre.append(rel + '?v=' + stamp)

sw = io.open(os.path.join(ROOT, 'sw.js'), encoding='utf-8').read()
for old, new in (("const STAMP = 'live';", "const STAMP = '%s';" % stamp),
                 ('const PRECACHE = [', 'const PRECACHE = [')):
    if old not in sw:
        fail('sw.js changed shape: expected %r' % old)
sw = sw.replace("const STAMP = 'live';", "const STAMP = '%s';" % stamp, 1)
head, _, rest = sw.partition('const PRECACHE = [')
_, _, tail = rest.partition('\n];')
sw = head + 'const PRECACHE = ' + json.dumps(sorted(pre), indent=2) + ';' + tail
io.open(os.path.join(DEST, 'sw.js'), 'w', encoding='utf-8').write(sw)

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
print('  offline : %d files kept on the phone' % len(pre))
print('')
print('next: cd into it, then  git add -A  and  git commit')
