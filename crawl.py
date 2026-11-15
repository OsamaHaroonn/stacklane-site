"""Read-only crawl: every internal page link resolved against a running server.

Usage: python crawl.py <site_dir> <base_url>
"""
import posixpath
import re
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit

site = Path(sys.argv[1])
base = sys.argv[2].rstrip("/")
targets = {}
pages = sorted(site.rglob("*.html"))
for p in pages:
    rel = p.relative_to(site).as_posix()
    d = posixpath.dirname(rel)
    for h in re.findall(r'href="([^"]*)"', p.read_text(encoding="utf-8", errors="replace")):
        if h.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
            continue
        sp = urlsplit(h)
        if sp.scheme or sp.netloc:
            if sp.netloc != "stacklanetools.com":
                continue
            path = sp.path or "/"
        else:
            path = sp.path
            if not path:
                continue
            if path.startswith("/"):
                norm = path
            else:
                norm = "/" + posixpath.normpath(posixpath.join(d, path))
            # collapse any duplicated leading slashes
            path = "/" + norm.lstrip("/")
        if path.endswith(("/", ".html")) or "." not in posixpath.basename(path):
            targets.setdefault(path, set()).add(rel)

def fetch(path):
    """GET with a 3-hop limit that follows 301/302/307/308 explicitly
    (urllib in this Python does not follow 308)."""
    for _ in range(4):
        try:
            req = urllib.request.Request(base + path, method="GET")
            with urllib.request.urlopen(req, timeout=15) as r:
                return r.status
        except urllib.error.HTTPError as e:
            loc = e.headers.get("Location") if e.headers else None
            if e.code in (301, 302, 307, 308) and loc:
                sp = urlsplit(loc)
                path = (sp.path or "/") + (("?" + sp.query) if sp.query else "")
                continue
            return e.code
        except Exception as e:  # noqa: BLE001
            return str(e)
    return "TOO_MANY_REDIRECTS"


bad = []
for path in sorted(targets):
    code = fetch(path)
    if code != 200:
        bad.append((path, code, sorted(targets[path])[:2]))

print(f"pages={len(pages)} unique_page_targets={len(targets)} broken={len(bad)}")
for b in bad[:20]:
    print("  BROKEN", b)
