"""Temporary harness: serve a static folder and return 404.html for missing paths,
the way Cloudflare Pages serves a custom 404 page while keeping the request URL.
Read-only against the site folder. Not part of the repository.
"""
import http.server
import os
import sys

ROOT = sys.argv[1]
PORT = int(sys.argv[2])
NOT_FOUND = os.path.join(ROOT, "404.html")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))

    def send_error(self, code, message=None, explain=None):
        if code == 404 and os.path.isfile(NOT_FOUND):
            body = open(NOT_FOUND, "rb").read()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)
            return
        super().send_error(code, message, explain)


http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
