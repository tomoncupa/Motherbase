"""safari-check.py - run _review.html in Safari's engine at iPhone 13 Pro size.

   Nothing in the suite has been watched on the iPhone, and every test here
   ran in Chrome. Safari is not Chrome: it has its own JavaScript engine and
   its own layout engine, and a fault that only one of them has (a regex
   Safari refuses, a CSS rule it draws differently) reaches Tom's phone and
   nobody else's screen. This runs the whole review in WebKit, the engine
   inside Safari, on a 390 x 844 touch screen, and prints the tally.

   It is WebKit, not Safari. Playwright's Windows WebKit shares Safari's
   engine and not its shell, so the keyboard, the home-screen install and
   iOS's storage rules are still only proved on the phone itself.

   One time setup, already done on Tom's PC on 2026-09-30:

       py -3 -m pip install playwright
       py -3 -m playwright install webkit

   (On 2026-09-30 the second line timed out on this PC while curl reached
   the same address; the zip was fetched by hand into
   %LOCALAPPDATA%/ms-playwright/webkit-2359. See the root CLAUDE.md.)

   Run it from anywhere:

       py -3 tools/safari-check.py                 WebKit, 390 x 844, touch
       py -3 tools/safari-check.py --engine chromium --width 1280 --height 900

   It serves the repo itself on 127.0.0.1 only (port 8790, or --port), in a
   fresh browser profile with no rows in it, and stops the server when done.
   Exit code 0 when every check passed, 1 when one failed, 2 when it could
   not run at all.
"""

import argparse
import functools
import http.server
import os
import sys
import threading
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IPHONE_UA = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) '
             'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 '
             'Mobile/15E148 Safari/604.1')


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve(port):
    handler = functools.partial(Quiet, directory=ROOT)
    httpd = http.server.ThreadingHTTPServer(('127.0.0.1', port), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--engine', default='webkit', choices=('webkit', 'chromium'))
    ap.add_argument('--width', type=int, default=390)
    ap.add_argument('--height', type=int, default=844)
    ap.add_argument('--port', type=int, default=8790)
    ap.add_argument('--timeout', type=int, default=420, help='seconds for the whole review')
    a = ap.parse_args()
    if a.port == 8777:
        print('8777 is OUTER HEAVEN\'s board. Pick another --port.')
        return 2

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('Playwright is not installed: py -3 -m pip install playwright')
        return 2

    httpd = serve(a.port)
    phone = a.width < 768
    errors = []
    try:
        with sync_playwright() as p:
            browser = getattr(p, a.engine).launch()
            ctx = browser.new_context(
                viewport={'width': a.width, 'height': a.height},
                device_scale_factor=3 if phone else 1,
                is_mobile=phone and a.engine == 'chromium',
                has_touch=phone,
                user_agent=IPHONE_UA if phone else None,
                service_workers='block')
            page = ctx.new_page()
            page.on('pageerror', lambda e: errors.append('page: %s' % e))
            page.on('console', lambda m: m.type == 'error' and errors.append('console: %s' % m.text))
            url = 'http://127.0.0.1:%d/_review.html?nosw=1&cb=%d' % (a.port, time.time())
            page.goto(url, wait_until='load')
            page.click('#run')
            page.wait_for_timeout(1000)
            page.wait_for_function(
                "() => !document.getElementById('run').disabled && "
                "/\\d+ \\/ \\d+ passed/.test(document.getElementById('tally').textContent)",
                timeout=a.timeout * 1000, polling=1000)
            tally = page.inner_text('#tally').strip()
            lines = page.inner_text('#out').splitlines()
            browser.close()
    except Exception as e:                                       # noqa: BLE001
        print('The review did not finish: %s' % str(e).splitlines()[0])
        return 2
    finally:
        httpd.shutdown()

    fails = [ln.strip() for ln in lines if ln.strip().startswith('FAIL')]
    print('%s at %d x %d%s: %s' % (a.engine.upper(), a.width, a.height,
                                   ', touch' if phone else '', tally))
    for f in fails:
        print('  ' + f)
    seen = set()
    for e in errors:
        if e not in seen:
            seen.add(e)
            print('  ' + e[:300])
    done = tally.split(' passed')[0].split('/')
    return 0 if len(done) == 2 and done[0].strip() == done[1].strip() else 1


if __name__ == '__main__':
    sys.exit(main())
