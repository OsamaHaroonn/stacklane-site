"""Read-only reachability check for the cloned repo: BFS over internal links."""
import posixpath
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

site = Path(sys.argv[1])
pages = sorted(p.relative_to(site).as_posix() for p in site.rglob("*.html"))
href = re.compile(r"""href\s*=\s*["']([^"']+)["']""")

seen, queue = set(), ["index.html"]
seen.add("index.html")
missing = []
while queue:
    cur = queue.pop()
    text = (site / cur).read_text(encoding="utf-8", errors="replace")
    for raw in href.findall(text):
        u = raw.split("#")[0].split("?")[0].strip()
        if not u or u.startswith(("mailto:", "tel:", "javascript:", "data:")):
            continue
        if u.startswith(("http://", "https://", "//")):
            sp = urlsplit(u if not u.startswith("//") else "https:" + u)
            if sp.netloc != "stacklanetools.com":
                continue
            u = sp.path or "/"
        if u.startswith("/"):
            tgt = u.lstrip("/")
        else:
            tgt = posixpath.normpath(posixpath.join(posixpath.dirname(cur), u))
        if tgt in ("", ".") or tgt.endswith("/"):
            tgt = tgt + "index.html"
        if not (site / tgt).is_file():
            missing.append(f"{cur} -> {raw}")
            continue
        if tgt.endswith(".html") and tgt not in seen:
            seen.add(tgt)
            queue.append(tgt)

unreachable = [p for p in pages if p not in seen and p != "404.html"]
print(f"pages={len(pages)} reachable={len(seen)} unreachable={len(unreachable)}")
if unreachable:
    print("UNREACHABLE: " + ", ".join(unreachable[:12]))
if missing:
    print(f"MISSING TARGETS: {len(missing)}")
    for m in missing[:8]:
        print("  " + m)
print("404 linkable-from-nowhere: " + ("yes (expected)" if "404.html" not in seen else "no"))
