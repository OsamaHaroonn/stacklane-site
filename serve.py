#!/usr/bin/env python3
"""
Local Pages-like static verification server for this repo.

Serves the repository root with extensionless URL resolution matching Cloudflare Pages:
/en/word-counter -> en/word-counter.html, / -> index.html, and any missing path
-> 404.html with HTTP 404. Static assets get sensible Content-Type.

This is a local verification helper only, not a production deployment artifact.
"""

import sys
import os
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = os.getcwd()
if not os.path.isdir(ROOT):
    raise SystemExit(f"ROOT not a directory: {ROOT!r}")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def do_GET(self):
        raw = self.path.split("?", 1)[0].split("#", 1)[0]
        path = os.path.normpath(raw).lstrip("/")
        if not path:
            path = "index.html"
        elif not os.path.splitext(path)[1]:
            path = path + ".html"
        full = os.path.normpath(os.path.join(ROOT, path))
        if not full.startswith(os.path.normpath(ROOT) + os.sep) and full != os.path.normpath(ROOT):
            self.send_error(404)
            return
        if not os.path.exists(full) or os.path.isdir(full):
            full = os.path.join(ROOT, "404.html")
        if os.path.isdir(full):
            full = os.path.join(full, "index.html")
        if not os.path.exists(full):
            full = os.path.join(ROOT, "404.html")
        ext = os.path.splitext(full)[1].lower()
        ctype, _ = mimetypes.guess_type(full)
        if not ctype:
            ctype = {
                ".html": "text/html; charset=utf-8",
                ".css": "text/css; charset=utf-8",
                ".js": "application/javascript; charset=utf-8",
                ".svg": "image/svg+xml",
                ".png": "image/png",
                ".ico": "image/x-icon",
                ".xml": "application/xml",
                ".txt": "text/plain",
            }.get(ext, "application/octet-stream")
        try:
            body = open(full, "rb").read()
        except OSError:
            self.send_error(500)
            return
        is_html = full.endswith(".html")
        status = 404 if full.endswith("404.html") and not raw.endswith(".html") and raw != "/" and raw != "/404.html" else 200
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "public, max-age=0, must-revalidate" if is_html else "public, max-age=3600")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        line = "%s - - [%s] %s\n" % (self.client_address[0], self.log_date_time_string(), fmt % args)
        sys.stderr.write(line)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8783
    srv = HTTPServer(("127.0.0.1", port), Handler)
    print(f"Serving {ROOT} on http://127.0.0.1:{port}", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    srv.server_close()


if __name__ == "__main__":
    main()
