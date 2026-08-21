# -*- coding: utf-8 -*-
"""Copies shared/skins.json into shared/skins.js as the built-in fallback.

WHY THIS EXISTS
  skins.js fetches skins.json. A page opened straight off the disk cannot fetch
  anything - the browser blocks it - so `load()` fell through to its built-in
  list, which held exactly one theme. Every app opened from a folder has shown
  one theme called "Status Window" since skins.json was created, and the theme
  picker looked empty of everything real.

  Embedding the factory set means the themes are there before any network is
  involved. Over http skins.json still wins, so editing that file and reloading
  works exactly as before.

THIS IS NOT A BUILD STEP
  The repo as it stands is always deployable. Nothing here has to run for the
  suite to work. Run it only when a FACTORY theme changes, which is rare -
  themes Tom makes in STYLE are rows and never touch this file.
  shared/_smoke.html fails loudly if the two ever drift, so forgetting is a
  caught error rather than a silent one.

USAGE
  py -3 tools/embed-skins.py
"""
import io, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'shared', 'skins.json')
DST = os.path.join(ROOT, 'shared', 'skins.js')
START, END = '/*SKINS-START*/', '/*SKINS-END*/'

data = json.load(io.open(SRC, encoding='utf-8'))
if not data.get('skins'):
    sys.exit('skins.json has no themes - refusing to embed an empty set')

blob = json.dumps(data, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
js = io.open(DST, encoding='utf-8').read()

if START not in js or END not in js:
    sys.exit('markers missing in skins.js - add %s ... %s around the FALLBACK const' % (START, END))

head, rest = js.split(START, 1)
_, tail = rest.split(END, 1)
out = head + START + 'const FALLBACK=' + blob + ';' + END + tail
io.open(DST, 'w', encoding='utf-8').write(out)

print('embedded %d themes (%d KB) into shared/skins.js'
      % (len(data['skins']), len(blob) // 1024))
