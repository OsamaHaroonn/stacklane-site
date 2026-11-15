"""Read-only URL/metadata consistency check for a static tree.

Usage: python review_urls.py <site_dir>
"""
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

ORIGIN = "https://stacklanetools.com"
site = Path(sys.argv[1])
pages = sorted(p for p in site.rglob("*.html"))

canon = {}
ogurl = {}
ldurls = []
hrefs = []
srcs = []
issues = []


def served(rel):
    p = "/" + rel
    if p.endswith("/index.html"):
        return p[: -len("index.html")]
    return p[:-5] if p.endswith(".html") else p


for p in pages:
    rel = p.relative_to(site).as_posix()
    t = p.read_text(encoding="utf-8", errors="replace")
    m = re.search(r'<link rel="canonical" href="([^"]+)"', t)
    if m:
        canon[rel] = m.group(1)
    o = re.search(r'<meta property="og:url" content="([^"]+)"', t)
    if o:
        ogurl[rel] = o.group(1)
    hrefs += [(rel, h) for h in re.findall(r'href="([^"]*)"', t)]
    srcs += [(rel, s) for s in re.findall(r'src="([^"]*)"', t)]
    for block in re.findall(r'(?is)<script type="application/ld\+json">(.*?)</script>', t):
        try:
            data = json.loads(block)
        except Exception:
            issues.append(f"{rel}: JSON-LD does not parse")
            continue
        stack = [data]
        while stack:
            node = stack.pop()
            if isinstance(node, dict):
                for k, v in node.items():
                    if k in ("url", "item", "@id") and isinstance(v, str):
                        ldurls.append((rel, k, v))
                    elif isinstance(v, (dict, list)):
                        stack.append(v)
            elif isinstance(node, list):
                stack.extend(node)

# canonical must equal the served URL
for rel, c in canon.items():
    want = ORIGIN + served(rel)
    if c != want:
        issues.append(f"canonical mismatch {rel}: {c} != {want}")
if len(canon) != len([p for p in pages if p.name != "404.html"]):
    issues.append(f"canonical count {len(canon)} != pages-404 {len([p for p in pages if p.name != '404.html'])}")

# og:url must equal canonical
for rel, o in ogurl.items():
    if canon.get(rel) and o != canon[rel]:
        issues.append(f"og:url != canonical {rel}: {o} != {canon[rel]}")

# extensionless everywhere in page metadata and navigation
def has_html_suffix(u):
    return ".html" in urlsplit(u).path

for rel, c in canon.items():
    if has_html_suffix(c):
        issues.append(f"canonical keeps .html {rel}: {c}")
for rel, o in ogurl.items():
    if has_html_suffix(o):
        issues.append(f"og:url keeps .html {rel}: {o}")

page_hrefs = [(r, h) for r, h in hrefs if h.endswith(".html") or ".html#" in h or ".html?" in h]
if page_hrefs:
    issues.append(f"{len(page_hrefs)} href attributes still end .html, first={page_hrefs[:3]}")

# sitemap vs canonicals
sm = (site / "sitemap.xml").read_text(encoding="utf-8")
locs = [u for u in re.findall(r"<loc>([^<]+)</loc>", sm)]
if any(has_html_suffix(u) for u in locs):
    issues.append("sitemap keeps .html entries")
sm_set = set(locs)
canon_set = set(canon.values())
if sm_set != canon_set:
    issues.append(f"sitemap != canonical set: only_sitemap={sorted(sm_set - canon_set)[:4]} only_canon={sorted(canon_set - sm_set)[:4]}")

# structured data URLs
for rel, key, u in ldurls:
    if u.startswith(ORIGIN):
        if canon.get(rel) and u.rstrip("/") != canon[rel].rstrip("/") and key != "@id":
            issues.append(f"JSON-LD {key} != canonical {rel}: {u}")
    elif u.startswith(("http://", "https://")):
        issues.append(f"JSON-LD {key} foreign origin {rel}: {u}")

# arabic / language exposure
ar_pages = [p for p in pages if p.relative_to(site).parts[0] == "ar"]
hreflang = set()
for p in pages:
    t = p.read_text(encoding="utf-8", errors="replace")
    hreflang |= set(re.findall(r'hreflang="([^"]+)"', t))

assets = sorted({h for _, h in hrefs if "assets/" in h} | {s for _, s in srcs if "assets/" in s})

print(f"pages={len(pages)} canonicals={len(canon)} og_url={len(ogurl)} sitemap={len(locs)}")
print(f"ar_pages={len(ar_pages)} hreflang_tags={sorted(hreflang) or 'none'}")
print(f"jsonld_urls={len(ldurls)}")
print(f"asset_refs={len(assets)}")
print("ASSET_REFS:")
for a in assets:
    print("  " + a)
print(f"ISSUES={len(issues)}")
for i in issues[:20]:
    print("  " + i)
