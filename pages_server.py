#!/usr/bin/env python3
"""Local Pages-like static server for verification only.

Mirrors Cloudflare Pages behavior for this repo:
- /en/word-counter -> en/word-counter.html
- / -> index.html
- missing path -> 404.html with HTTP 404
- /assets/*, /sitemap.xml, /robots.txt, /ads.txt served as static files
"""
import sys
import mimetypes
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.abspath(os.path.dirname(__file__) or ".")
mimetypes.init()

class PagesHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        path = path.split('?', 1)[0].split('#', 1)[0]
        path = os.path.normpath(path).lstrip('/')
        if not path:
            return os.path.join(ROOT, 'index.html')
        # extensionless: try <path>.html
        candidate = os.path.join(ROOT, path + '.html')
        if os.path.exists(candidate):
            return candidate
        # explicit file
        candidate = os.path.join(ROOT, path)
        if os.path.exists(candidate):
            return candidate
        # 404 body
        return os.path.join(ROOT, '404.html')

    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            path = os.path.join(ROOT, '404.html')
        if os.path.isdir(path):
            path = os.path.join(path, 'index.html')
        if not os.path.exists(path):
            path = os.path.join(ROOT, '404.html')

        ext = os.path.splitext(path)[1].lower()
        ctype, _ = mimetypes.guess_type(path)
        if not ctype:
            ctype = {
                '.html': 'text/html; charset=utf-8',
                '.css': 'text/css; charset=utf-8',
                '.js': 'application/javascript; charset=utf-8',
                '.svg': 'image/svg+xml',
                '.png': 'image/png',
                '.ico': 'image/x-icon',
                '.xml': 'application/xml',
                '.txt': 'text/plain',
            }.get(ext, 'application/octet-stream')

        try:
            data = open(path, 'rb').read()
        except OSError:
            self.send_error(500)
            return

        is_html = path.endswith('.html')
        status = 200 if os.path.exists(os.path.join(ROOT, '404.html')) and path.endswith('404.html') else 200
        if path.endswith('404.html') and not self.path.rstrip('/').endswith('.html') and self.path != '/404.html':
            status = 404

        self.send_response(status)
        self.send_header('Content-Type', ctype)
        if is_html:
            self.send_header('Cache-Control', 'public, max-age=0, must-revalidate')
        else:
            self.send_header('Cache-Control', 'public, max-age=3600')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format, *args):
        sys.stderr.write("%s - - [%s] %s\n" % (self.client_address[0], self.log_date_time_string(), format % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8779
    server = HTTPServer(('127.0.0.1', port), PagesHandler)
    print(f"Pages-like static server listening on http://127.0.0.1:{port} (root={ROOT})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()

if __name__ == '__main__':
    main()
