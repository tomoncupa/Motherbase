"""home-sweep.py - does every home card still read right at every size and zoom?

   Added 2026-11-16, after HOME 1.0.123. Zoomed in, CONSISTENCY's tiles ran
   into each other and WORK DONE went blank, and every check passed, because
   each one asked only "does anything stick out past the card". This asks
   three questions of every widget, at several sizes and every zoom step:

     EMPTY    the card shows nothing, though it shows something at its own
              size and 100%, and has room for one 44px line
     OVERLAP  two pieces of text are drawn over each other
     CUT      a piece of text is partly hidden by its box or the card

   It opens the demo (made-up data) in headless Chromium at 1918 x 1000,
   puts one card on the board at a time and reads the page. Text a box hides
   whole is not counted: that is the card leaving a line off on purpose.

       py -3 tools/home-sweep.py                    every widget
       py -3 tools/home-sweep.py lockedin workdone  just these
       py -3 tools/home-sweep.py --all              list every failing case

   Serves the repo itself on 127.0.0.1:8839 (or --port). Exit 0 when nothing
   failed.
"""

import argparse
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZES = [(2, 2), (4, 2), (4, 4), (6, 4), (8, 6), (12, 8)]
ZOOMS = [0.5, 1, 1.5, 2]

JS = r"""
async ([t, cases]) => {
  const W = WIDGETS[t]; if (!W) return { err: 'no widget' };
  const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30))));
  const inter = (a, b) => ({ l: Math.max(a.l, b.l), t: Math.max(a.t, b.t), r: Math.min(a.r, b.r), b: Math.min(a.b, b.b) });
  const area = q => Math.max(0, q.r - q.l) * Math.max(0, q.b - q.t);
  const R = e => { const q = e.getBoundingClientRect(); return { l: q.left, t: q.top, r: q.right, b: q.bottom }; };
  const read = () => {
    const n = document.querySelector('#grid > .w');
    if (!n) return { err: 'no card' };
    const body = n.querySelector(':scope > .w-body');
    if (!body) return { err: 'no body' };
    if (body.classList.contains('appslot')) return { app: 1 };
    const card = R(n), texts = [];
    let shown = 0;
    const wk = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    for (let x = wk.nextNode(); x; x = wk.nextNode()) {
      if (!x.nodeValue.trim()) continue;
      const p = x.parentElement; if (!p) continue;
      const rg = document.createRange(); rg.selectNodeContents(x);
      const rs = [].slice.call(rg.getClientRects()).filter(q => q.width > 0.5 && q.height > 0.5);
      if (!rs.length) continue;
      /* every box between the text and the card that clips it */
      let clip = card;
      for (let a = p; a && a !== n.parentElement; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.visibility === 'hidden' || cs.opacity === '0') { clip = null; break; }
        if (a === n || cs.overflowX !== 'visible' || cs.overflowY !== 'visible') clip = clip && inter(clip, R(a));
      }
      if (!clip) continue;
      rs.forEach(q => {
        const full = { l: q.left, t: q.top, r: q.right, b: q.bottom }, seen = inter(full, clip);
        const A = area(full), S = area(seen);
        if (S <= 0.5) return;                 /* hidden whole: left off on purpose */
        shown++;
        texts.push({ s: x.nodeValue.trim().slice(0, 24), q: seen, p: p, cut: S < A * 0.96 && ((full.r - full.l) - (seen.r - seen.l) > 2 || (full.b - full.t) - (seen.b - seen.t) > 2) });
      });
    }
    body.querySelectorAll('svg, canvas, img').forEach(g => { const q = R(g); if (area(inter(q, card)) > 64 && !g.closest('.sz-cut')) shown++; });
    const cut = texts.filter(x => x.cut).map(x => x.s);
    const over = [];
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      if (a.p === b.p || a.p.contains(b.p) || b.p.contains(a.p)) continue;
      const I = area(inter(a.q, b.q)), m = Math.min(area(a.q), area(b.q));
      const iq = inter(a.q, b.q);
      if (iq.r - iq.l > 2 && iq.b - iq.t > 2 && I > m * 0.15) over.push(a.s + ' / ' + b.s);
    }
    return { shown: shown, cut: cut, over: over, room: body.clientHeight };
  };
  const put = (w, h, z) => {
    const c = { t: t, w: w, h: h, x: 1, y: 1 }; if (z !== 1) c.zoom = z;
    layout.splice(0, layout.length, c); drawHome();
  };
  put(W.w || 4, W.h || 4, 1); await frame();
  const base = read(), out = [];
  if (base.err || base.app) return { base: base, out: out };
  for (const [w, h, z] of cases) {
    put(w, h, z); await frame();
    const r = read(); r.k = w + 'x' + h + ' @' + Math.round(z * 100) + '%';
    if (r.err) { out.push({ k: r.k, f: 'ERR ' + r.err }); continue; }
    if (base.shown && !r.shown && r.room >= 44) out.push({ k: r.k, f: 'EMPTY' });
    if (r.over.length) out.push({ k: r.k, f: 'OVERLAP ' + r.over.slice(0, 2).join('; ') });
    if (r.cut.length) out.push({ k: r.k, f: 'CUT ' + r.cut.slice(0, 3).join('; ') });
  }
  return { base: base, out: out };
}
"""


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser()
    ap.add_argument('only', nargs='*')
    ap.add_argument('--port', type=int, default=8839)
    ap.add_argument('--all', action='store_true')
    a = ap.parse_args()
    srv = subprocess.Popen([sys.executable, os.path.join(ROOT, 'tools', 'serve.py'), str(a.port)],
                           cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.5)
    # only rooms at least the smallest working card, 2 by 2 units at 100% (Tom,
    # 2026-11-16): a unit is 73 by 36 px on this board
    cases = [[w, h, z] for (w, h) in SIZES for z in ZOOMS if w * 73 / z >= 146 and h * 36 / z >= 72]
    bad = 0
    try:
        with sync_playwright() as p:
            b = p.chromium.launch()
            pg = b.new_page(viewport={'width': 1918, 'height': 1000})
            pg.goto('http://127.0.0.1:%d/index.html?demo=1&nosw=1&boot=0&cb=%d' % (a.port, time.time()))
            pg.wait_for_timeout(6000)
            ids = a.only or pg.evaluate('Object.keys(WIDGETS)')
            for t in ids:
                try:
                    r = pg.evaluate(JS, [t, cases])
                except Exception as e:
                    print('%-12s ERROR %s' % (t, str(e).splitlines()[0][:100])); bad += 1; continue
                if r['base'].get('app') or r['base'].get('err'):
                    continue
                out = r['out']
                if not out:
                    print('%-12s ok' % t); continue
                bad += 1
                kinds = sorted(set(o['f'].split(' ')[0] for o in out))
                print('%-12s %d of %d cases: %s' % (t, len(set(o['k'] for o in out)), len(cases), ', '.join(kinds)))
                for o in (out if a.all else out[:3]):
                    print('    %-12s %s' % (o['k'], o['f'][:150]))
            b.close()
    finally:
        srv.terminate()
    print('\n%d widget(s) with failures' % bad)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
