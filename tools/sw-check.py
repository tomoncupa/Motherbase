"""sw-check.py - does a phone running an old copy catch up with the hosted one?

   Added 2026-10-18. Tom's iPhone TRAIN ran 1.0.61 for three days while
   1.0.68 was live. This serves the repo the way GitHub Pages does (every
   file restamped on every push, max-age 600, 304 on a matching ETag), opens
   TRAIN in a real browser with the offline cache (sw.js) running, then
   "pushes" changes on the server between opens and reads which version the
   page is actually running.

       py -3 tools/sw-check.py                     WebKit and headless Chromium
       py -3 tools/sw-check.py --engine webkit
       py -3 tools/sw-check.py --head              the same against the last
                                                   commit's sw.js, mobile.js
                                                   and ui.js, to see the old way

   Serves on localhost (a service worker needs it), port 8794 or --port.
   Exit 0 when every step passed.
"""

import argparse
import functools
import hashlib
import http.server
import os
import re
import subprocess
import sys
import threading
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = 'train/'

state = {'deploy': 1, 'ver': None, 'day': None, 'head': False, 'hits': 0}
HEAD_FILES = {}


def body_of(rel):
    if state['head'] and rel in HEAD_FILES:
        b = HEAD_FILES[rel]
    else:
        with open(os.path.join(ROOT, rel), 'rb') as f:
            b = f.read()
    if rel == APP + 'index.html' and state['ver']:
        b = re.sub(rb'(<meta name="mb-version" content=")[^"]*', rb'\g<1>' + state['ver'].encode() + b', 2026-10-18', b, count=1)
    if rel == 'shared/day.js' and state['day']:
        b = b + b'\n;window.__mbDay = ' + str(state['day']).encode() + b';\n'
    return b


class Pages(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        path = self.path.split('?')[0].split('#')[0].lstrip('/')
        if path == '' or path.endswith('/'):
            path += 'index.html'
        full = os.path.join(ROOT, path)
        if not os.path.isfile(full):
            self.send_response(404); self.end_headers(); return
        state['hits'] += 1
        b = body_of(path)
        # GitHub Pages: "<push time>-<size>", so every push changes every ETag
        etag = '"%x-%x"' % (state['deploy'], len(b))
        if self.headers.get('If-None-Match') == etag:
            self.send_response(304); self.send_header('ETag', etag); self.end_headers(); return
        ctype = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json',
                 '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml'}.get(
            os.path.splitext(path)[1], 'application/octet-stream')
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(b)))
        self.send_header('ETag', etag)
        self.send_header('Cache-Control', 'max-age=600')
        self.end_headers()
        self.wfile.write(b)


def serve(port):
    httpd = http.server.ThreadingHTTPServer(('127.0.0.1', port), Pages)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def push(ver=None, day=None):
    state['deploy'] += 1
    if ver:
        state['ver'] = ver
    if day:
        state['day'] = day


RUNNING = r"""() => {
  const m = document.querySelector('meta[name="mb-version"]');
  return { v: m ? m.content.split(',')[0].trim() : '', day: window.__mbDay || 0,
           url: location.href, c: window.Mobile && Mobile.catchUp || null,
           said: (document.body.innerText.match(/Updated to [\d.]+\./) || [''])[0],
           why: JSON.parse(sessionStorage.getItem('mb.catchUp') || 'null') };
}"""

HIDE_SHOW = """gap => {
  if (gap !== null) Mobile.freshGap = gap;
  let vis = 'hidden';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => vis });
  document.dispatchEvent(new Event('visibilitychange'));
  vis = 'visible';
  document.dispatchEvent(new Event('visibilitychange'));
}"""


def settle(page, navs, ms=16000):
    """wait until the page now loaded has had its check answered and stayed"""
    t0 = time.time()
    while time.time() - t0 < ms / 1000:
        try:
            r = page.evaluate(RUNNING)
            if r['c'] and not r['c'].get('reopened'):
                time.sleep(1.2)   # the toast comes 800ms after the page
                r = page.evaluate(RUNNING)
                r['navs'] = navs[0]
                return r
        except Exception:
            pass
        time.sleep(0.25)
    r = page.evaluate(RUNNING)
    r['navs'] = navs[0]
    r['timeout'] = True
    return r


def run(p, engine, port):
    url = 'http://localhost:%d/%s' % (port, APP)
    browser = getattr(p, engine).launch()
    ctx = browser.new_context(viewport={'width': 390, 'height': 844})
    page = ctx.new_page()
    navs = [0]
    # every main-frame navigation, and mobile.js taking ?fresh off the address
    page.on('framenavigated', lambda f: f == page.main_frame and navs.__setitem__(0, navs[0] + 1))
    results = []

    def step(name, want, got):
        ok = bool(want(got))
        results.append(ok)
        shown = {k: got.get(k) for k in ('v', 'day', 'navs', 'said', 'timeout') if got.get(k) not in (None, '', 0)}
        if got.get('c'):
            shown['check'] = {k: got['c'].get(k) for k in ('why', 'old', 'touched', 'took', 'held') if got['c'].get(k) not in (None, '')}
        if got.get('why'):
            shown['reopened for'] = {k: got['why'].get(k) for k in ('why', 'v', 'mine', 'stale')}
        print('  %s  %s  %s' % ('PASS' if ok else 'FAIL', name, shown))

    def quiet():
        # a reopen answers from the network for 20s, and reopens are held to
        # one a minute: let both pass, so the next step meets the kept copy
        time.sleep(21)
        page.evaluate("sessionStorage.removeItem('mb.autoAt'); sessionStorage.removeItem('mb.catchUp')")

    def open_(touch=False):
        navs[0] = 0
        page.goto(url)
        if touch:
            page.keyboard.press('Shift')
        return settle(page, navs)

    def resume(gap):
        navs[0] = 0
        page.evaluate(HIDE_SHOW, gap)
        time.sleep(1)
        return settle(page, navs)

    # the first open keeps a copy; a worker that has just taken over answers
    # from the network for 20s, so wait that out
    page.goto(url)
    page.wait_for_function('navigator.serviceWorker && navigator.serviceWorker.controller', timeout=20000)
    page.wait_for_function("caches.keys().then(ks => ks.length > 0)", timeout=20000)
    time.sleep(21)
    page.evaluate("sessionStorage.clear()")

    r = open_()
    step('an open with nothing new stays put, from the phone copy', lambda g: g['navs'] == 1 and not g['why'], r)
    quiet()

    push(ver='9.9.1')
    r = open_()
    step('after a push of TRAIN, the next open is running it', lambda g: g['v'] == '9.9.1' and 'fresh=' not in g['url'], r)
    step('  and it says what it updated to', lambda g: g['said'] == 'Updated to 9.9.1.', r)
    quiet()

    r = open_()
    step('the open after that does not reopen', lambda g: g['v'] == '9.9.1' and g['navs'] == 1, r)

    push()
    r = open_()
    step("another app's push (every stamp new, nothing in it different) does not reopen", lambda g: g['v'] == '9.9.1' and g['navs'] == 1, r)

    push(day=2)
    r = open_()
    step('a push of a shared file alone reaches the next open', lambda g: g['day'] == 2, r)
    quiet()

    push(ver='9.9.2')
    r = open_(touch=True)
    step('touched before the answer: no reopen under the thumb', lambda g: g['navs'] == 1 and g['v'] != '9.9.2' and g['c'] and g['c'].get('old'), r)
    r = open_()
    step('  and the open after it is running the push, straight from the phone copy', lambda g: g['v'] == '9.9.2' and g['navs'] == 1, r)

    push(ver='9.9.3')
    r = resume(0)
    step('a resume after a long time away is running the push', lambda g: g['v'] == '9.9.3', r)
    quiet()

    push(ver='9.9.4')
    navs[0] = 0
    page.evaluate(HIDE_SHOW, 15 * 60000)
    time.sleep(4)
    r = page.evaluate(RUNNING)
    r['navs'] = navs[0]
    step('a resume after a minute away leaves the page alone', lambda g: g['navs'] == 0 and g['v'] == '9.9.3', r)

    browser.close()
    return results


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--engine', choices=['webkit', 'chromium', 'both'], default='both')
    ap.add_argument('--port', type=int, default=8794)
    ap.add_argument('--head', action='store_true')
    a = ap.parse_args()
    if a.head:
        state['head'] = True
        for rel in ('sw.js', 'shared/mobile.js', 'shared/ui.js'):
            HEAD_FILES[rel] = subprocess.run(['git', 'show', 'HEAD:' + rel], cwd=ROOT, capture_output=True).stdout
    from playwright.sync_api import sync_playwright
    httpd = serve(a.port)
    allok = True
    try:
        with sync_playwright() as p:
            for eng in (['webkit', 'chromium'] if a.engine == 'both' else [a.engine]):
                state.update(deploy=state['deploy'] + 1, ver=None, day=None)
                print('%s%s' % (eng, ' (last commit\'s sw.js)' if a.head else ''))
                res = run(p, eng, a.port)
                print('  %d of %d passed' % (sum(res), len(res)))
                allok = allok and all(res)
    finally:
        httpd.shutdown()
    sys.exit(0 if allok else 1)


if __name__ == '__main__':
    main()
