# -*- coding: utf-8 -*-
"""Receives the pictures tools/make-icons.html draws and writes them into
shared/icons.

NOT A BUILD STEP. See the comment at the top of tools/make-icons.html for
when and how to run the pair. Listens on 127.0.0.1 only, accepts PNG data
URLs under names like "ice/home" or "home", and writes nothing else.

Since 2026-09-23 also names like "app:train/icon-192" or "app:icon-512",
the install icons beside an app's index.html (the root for the home screen).
Only into a folder that already holds an index.html, and only the four
icon names each manifest.json lists.

USAGE
  py -3 tools/save-icons.py [port]      port 8920 unless given; then open
                                        make-icons.html?port=<port>
"""
import base64, json, os, re, sys
from http.server import BaseHTTPRequestHandler, HTTPServer

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shared', 'icons')
REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
NAME = re.compile(r'^(?:[a-z0-9]+/)?[a-z0-9]+$')
INSTALL = re.compile(r'^app:(?:([a-z0-9]+)/)?(icon-(?:maskable-)?(?:192|512))$')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8920

class Receiver(BaseHTTPRequestHandler):
    def _head(self, code=200):
        self.send_response(code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.end_headers()

    def do_OPTIONS(self):
        self._head()

    def do_POST(self):
        data = json.loads(self.rfile.read(int(self.headers.get('Content-Length') or 0)).decode('utf-8'))
        n = 0
        for name, url in data.items():
            if not (isinstance(name, str) and isinstance(url, str)
                    and url.startswith('data:image/png;base64,')):
                continue
            m = INSTALL.match(name)
            if m:
                folder = os.path.join(REPO, m.group(1) or '')
                if not os.path.isfile(os.path.join(folder, 'index.html')):
                    continue
                path = os.path.join(folder, m.group(2) + '.png')
            elif NAME.match(name):
                path = os.path.join(OUT, *name.split('/')) + '.png'
            else:
                continue
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'wb') as f:
                f.write(base64.b64decode(url.split(',', 1)[1]))
            n += 1
        self._head()
        self.wfile.write(('Wrote %d pictures.' % n).encode('utf-8'))

    def log_message(self, *args):
        pass

if __name__ == '__main__':
    print('Listening on 127.0.0.1:%d. Open tools/make-icons.html?port=%d, then stop this with Ctrl+C.' % (PORT, PORT))
    HTTPServer(('127.0.0.1', PORT), Receiver).serve_forever()
