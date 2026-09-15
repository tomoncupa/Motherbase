# -*- coding: utf-8 -*-
"""Receives the pictures tools/make-icons.html draws and writes them into
shared/icons.

NOT A BUILD STEP. See the comment at the top of tools/make-icons.html for
when and how to run the pair. Listens on 127.0.0.1 only, accepts PNG data
URLs under names like "ice/home" or "home", and writes nothing else.

USAGE
  py -3 tools/save-icons.py
"""
import base64, json, os, re
from http.server import BaseHTTPRequestHandler, HTTPServer

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shared', 'icons')
NAME = re.compile(r'^(?:[a-z0-9]+/)?[a-z0-9]+$')

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
            if not (isinstance(name, str) and NAME.match(name) and isinstance(url, str)
                    and url.startswith('data:image/png;base64,')):
                continue
            path = os.path.join(OUT, *name.split('/')) + '.png'
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'wb') as f:
                f.write(base64.b64decode(url.split(',', 1)[1]))
            n += 1
        self._head()
        self.wfile.write(('Wrote %d pictures into shared/icons.' % n).encode('utf-8'))

    def log_message(self, *args):
        pass

if __name__ == '__main__':
    print('Listening on 127.0.0.1:8920. Open tools/make-icons.html, then stop this with Ctrl+C.')
    HTTPServer(('127.0.0.1', 8920), Receiver).serve_forever()
