"""The test server: the suite's folder over http, with nothing kept by the browser.

`py -3 -m http.server` sends Last-Modified and no Cache-Control, so a browser
reuses a script it fetched a while ago without asking the server again. On
2026-09-30 `_smoke.html` ran an hour-old io.js and skins.js that way, and five
checks failed on code that was already fixed on disk. Every answer here says
no-store, so a run is always a run of the files on disk, in every frame.

    py -3 tools/serve.py 8811

Serves the folder above tools/, on 127.0.0.1 only. Open it as
http://localhost:<port>/ : a service worker registers only on localhost or
https, and 127.0.0.1 is neither.
"""
import functools
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoStore(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      '.js': 'text/javascript', '.json': 'application/json',
                      '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm'}

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8811
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    handler = functools.partial(NoStore, directory=root)
    print('serving', root, 'at http://localhost:%d/ (no-store)' % port, flush=True)
    ThreadingHTTPServer(('127.0.0.1', port), handler).serve_forever()
