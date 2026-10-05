"""Bundle the theme fonts into shared/fonts (A5, 2026-10-05).

Tom: "Theme fonts come from Google, so offline a theme loses its look." Every
font a theme or STYLE's picker can use is kept here as latin woff2 files, one
stylesheet per family (shared/fonts/<slug>.css) and its licence beside it
(<slug>-LICENSE.txt). skins.js links a family's stylesheet when a theme asks
for it, and asks Google only if that file will not load.

Run it again after adding a family to FAMILIES:  py -3 tools/fetch-fonts.py
It replaces that family's files and leaves Chakra Petch and Inter Tight, which
fonts.css has carried since 2026-09-19, alone. Needs a connection.
"""
import os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'shared', 'fonts')
UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/124.0 Safari/537.36')

# family: (weights, licence folder on github.com/google/fonts)
FAMILIES = {
    'Orbitron': ('400;500;700', 'ofl/orbitron'),
    'Rajdhani': ('400;500;600;700', 'ofl/rajdhani'),
    'Oswald': ('400;500;600;700', 'ofl/oswald'),
    'Archivo': ('400;500;700;900', 'ofl/archivo'),
    'Silkscreen': ('400;700', 'ofl/silkscreen'),
    'Press Start 2P': ('400', 'ofl/pressstart2p'),
    'VT323': ('400', 'ofl/vt323'),
    'IBM Plex Mono': ('400;500;600;700', 'ofl/ibmplexmono'),
    'Space Mono': ('400;700', 'ofl/spacemono'),
    'Gloria Hallelujah': ('400', 'ofl/gloriahallelujah'),
    'Patrick Hand': ('400', 'ofl/patrickhand'),
    'Architects Daughter': ('400', 'ofl/architectsdaughter'),
    'Bebas Neue': ('400', 'ofl/bebasneue'),
    'Playfair Display': ('400;700', 'ofl/playfairdisplay'),
    'Cinzel': ('400;700', 'ofl/cinzel'),
    'Audiowide': ('400', 'ofl/audiowide'),
    'Fredoka': ('400;500;600;700', 'ofl/fredoka'),
    'Nunito': ('400;600;700;800', 'ofl/nunito'),
    'IBM Plex Sans': ('400;500;600;700', 'ofl/ibmplexsans'),
    'Arimo': ('400;700', 'ofl/arimo'),   # was Apache 2.0; Google lists it as OFL now
    'Jost': ('400;500;700', 'ofl/jost'),
    'DotGothic16': ('400', 'ofl/dotgothic16'),
    'Bungee': ('400', 'ofl/bungee'),
}

def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def get(url, binary=False):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    return data if binary else data.decode('utf-8')

def licence(path):
    for name in ('OFL.txt', 'LICENSE.txt', 'LICENSE'):
        try:
            return get('https://raw.githubusercontent.com/google/fonts/main/%s/%s' % (path, name))
        except Exception:
            pass
    raise SystemExit('no licence found for ' + path)

def fetch(name, weights, lic):
    s = slug(name)
    css = get('https://fonts.googleapis.com/css2?family=%s:wght@%s&display=swap'
              % (name.replace(' ', '+'), weights)) if ';' in weights or weights != '400' else \
          get('https://fonts.googleapis.com/css2?family=%s&display=swap' % name.replace(' ', '+'))
    # one block per subset per weight; keep the latin ones
    blocks = re.findall(r'/\*\s*([\w-]+)\s*\*/\s*(@font-face\s*{[^}]*})', css)
    latin = [b for sub, b in blocks if sub == 'latin'] or [b for b in re.findall(r'@font-face\s*{[^}]*}', css)]
    files = {}  # url -> [weights]
    for b in latin:
        url = re.search(r'url\((https://[^)]+\.woff2)\)', b).group(1)
        w = int(re.search(r'font-weight:\s*(\d+)', b).group(1))
        files.setdefault(url, []).append(w)
    faces = []
    for url, ws in files.items():
        lo, hi = min(ws), max(ws)
        fn = '%s-%s.woff2' % (s, lo if lo == hi else '%d-%d' % (lo, hi))
        with open(os.path.join(OUT, fn), 'wb') as f:
            f.write(get(url, binary=True))
        wt = str(lo) if lo == hi else '%d %d' % (lo, hi)
        faces.append("@font-face { font-family: '%s'; font-style: normal; font-weight: %s; "
                     "font-display: swap; src: url(%s) format('woff2'); }" % (name, wt, fn))
    head = ('/* %s, latin only, bundled by tools/fetch-fonts.py so a theme keeps its\n'
            '   look with no signal. Licence: %s-LICENSE.txt beside this file. */\n' % (name, s))
    with open(os.path.join(OUT, s + '.css'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(head + '\n'.join(faces) + '\n')
    with open(os.path.join(OUT, s + '-LICENSE.txt'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(licence(lic))
    size = sum(os.path.getsize(os.path.join(OUT, x)) for x in os.listdir(OUT) if x.startswith(s + '-') and x.endswith('.woff2'))
    print('%-20s %d file(s), %d KB' % (name, len(files), size // 1024))

if __name__ == '__main__':
    want = sys.argv[1:] or list(FAMILIES)
    for n in want:
        fetch(n, *FAMILIES[n])
