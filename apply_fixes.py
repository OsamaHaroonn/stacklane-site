"""Apply the pre-launch URL/navigation fixes to a COPY of the site source.

Usage: python apply_fixes.py <sandbox_root>
Edits <sandbox_root>/source in place. The original project is never touched.
Reads and writes raw bytes so line endings are preserved exactly (the build
is LF; a text-mode rewrite would have turned every line into CRLF).
"""
import re
import sys
from pathlib import Path

sb = Path(sys.argv[1])
src = sb / "source"
stats = {}


def bump(k, n=1):
    stats[k] = stats.get(k, 0) + n


def load(p):
    return p.read_bytes().decode("utf-8")


def save(p, text):
    p.write_bytes(text.encode("utf-8"))


def edit(path, pairs, label):
    p = src / path
    t = load(p)
    for old, new, expect in pairs:
        c = t.count(old)
        assert c == expect, f"{label}: expected {expect} of {old!r}, found {c}"
        t = t.replace(old, new)
        bump(f"{label}: {old[:40]!r}")
    save(p, t)


# ---------------------------------------------------------------- chrome.js
edit("assets/chrome.js", [
    ("""  /* Pages at the site root (the language picker, privacy, terms, 404)
     link into the English tools instead of to a sibling index.html. */
  var atRoot = body.hasAttribute('data-root');
  var rootPrefix = atRoot ? '' : '../';
  var toolPrefix = atRoot ? 'en/' : '';""",
     """  /* Root-absolute, extensionless links. Cloudflare Pages serves /en/pdf for
     en/pdf.html, so these resolve identically at any URL depth — including
     the 404 page shown for a deep path such as /en/missing/tool. */
  var rootPrefix = '/';
  var langPrefix = '/' + (lang || 'en') + '/';
  var toolPrefix = langPrefix;""", 1),
    ("""    // Every i18n page lives one level below the root (en/…, ar/…), so the
    // language home is a sibling index.html there. Root pages link into
    // the English tools instead.
    var homeHref = atRoot ? 'en/index.html' : 'index.html';""",
     """    // Root pages and the English pages both point at the English tools
    // home. It is root-absolute, so the depth of the current URL never
    // matters — a 404 served at /en/missing/tool uses it unchanged.
    var homeHref = langPrefix;""", 1),
    ("rootPrefix + 'privacy.html'", "rootPrefix + 'privacy'", 3),
    ("rootPrefix + 'terms.html'", "rootPrefix + 'terms'", 3),
    ("rootPrefix + 'all-tools.html'", "rootPrefix + 'all-tools'", 1),
    ("toolPrefix + 'business.html'", "toolPrefix + 'business'", 1),
    ("homeHref.replace(/index\\.html$/, '') + slug + '.html'", "toolPrefix + slug", 2),
    ("href: toolPrefix + t.slug + '.html'", "href: toolPrefix + t.slug", 1),
    ("href: toolPrefix + p.slug + '.html'", "href: toolPrefix + p.slug", 1),
    ("crumbs.appendChild(el('a', { href: 'index.html' }, get(json, 'nav.home')));",
     "crumbs.appendChild(el('a', { href: homeHref }, get(json, 'nav.home')));", 1),
    ("href: catSlug + '.html'", "href: toolPrefix + catSlug", 1),
    ("href: t.slug + '.html' });", "href: toolPrefix + t.slug });", 1),
    ("backLink.setAttribute('href', cat + '.html');",
     "backLink.setAttribute('href', toolPrefix + cat);", 1),
    ("var page = base + location.pathname.replace(/index\\.html$/, '');",
     "var page = base + location.pathname.replace(/index\\.html$/, '').replace(/\\.html$/, '');", 1),
], "chrome.js")

# ------------------------------------------------------------------ home.js
edit("assets/home.js", [
    ("  var el = h.el, get = h.get, CATS = h.CATS;",
     "  var el = h.el, get = h.get, CATS = h.CATS;\n"
     "  /* Root-absolute and same-language: no dependency on URL depth. */\n"
     "  var EN = '/' + (document.documentElement.getAttribute('lang') || 'en') + '/';", 1),
    ("t.slug + '.html'", "EN + t.slug", 3),
    ("p.slug + '.html'", "EN + p.slug", 1),
    ("slug + '.html'", "EN + slug", 4),
], "home.js")

# -------------------------------------------------------------- category.js
edit("assets/category.js", [
    ("  var el = h.el, get = h.get, slug = h.category;",
     "  var el = h.el, get = h.get, slug = h.category;\n"
     "  /* Root-absolute and same-language: no dependency on URL depth. */\n"
     "  var EN = '/' + (document.documentElement.getAttribute('lang') || 'en') + '/';", 1),
    ("p.slug + '.html'", "EN + p.slug", 1),
    ("t.slug + '.html'", "EN + t.slug", 1),
], "category.js")

# ----------------------------------------------------------------- _headers
hd = src / "_headers"
h = load(hd)
old_rule = """# Pages: always revalidate so a deploy is visible immediately.
/*.html
  Cache-Control: public, max-age=0, must-revalidate

"""
new_rule = """# Pages: no explicit rule. Pages serves /en/pdf for en/pdf.html, so a
# "/*.html" pattern would only ever match the redirect, never the document.
# Pages already sends "Cache-Control: public, max-age=0, must-revalidate"
# for cacheable HTML, which is the behaviour this file used to ask for.

"""
assert h.count(old_rule) == 1, "_headers html rule block not found once"
save(hd, h.replace(old_rule, new_rule))
bump("_headers: removed /*.html rule")

# --------------------------------------------------------------- sitemap.xml
sm = src / "sitemap.xml"
s = load(sm)


def extless_url(u):
    m = re.match(r"^(https://stacklanetools\.com)([^?#]*)(.*)$", u)
    assert m, u
    origin, path, tail = m.group(1), m.group(2), m.group(3)
    if path.endswith("/index.html"):
        path = path[: -len("index.html")]
    elif path.endswith(".html"):
        path = path[:-5]
    return origin + path + tail


count = 0


def repl(m):
    global count
    new = extless_url(m.group(1))
    if new != m.group(1):
        count += 1
    return "<loc>" + new + "</loc>"


s2 = re.sub(r"<loc>([^<]+)</loc>", repl, s)
save(sm, s2)
bump("sitemap locs rewritten", count)

# ------------------------------------------------------------ HTML documents
HREF = re.compile(r"""(href=)(["'])([^"']*\.html)((?:[?#][^"']*)?)\2""")
OGURL = re.compile(r"""(<meta property="og:url" content=")([^"]*\.html)(")""")
pages = sorted(src.rglob("*.html"))
href_changed = og_changed = 0
samples = []


def convert(val, page_dir):
    """Local or same-origin .html URL -> root-absolute extensionless URL."""
    m = re.match(r"^([^?#]*)(.*)$", val)
    path, tail = m.group(1), m.group(2)
    if not path.lower().endswith(".html"):
        return None
    if path.startswith("https://stacklanetools.com"):
        return extless_url(path) + tail
    if path.startswith(("http://", "https://", "//")):
        return None
    if path.startswith("/"):
        rel = path.lstrip("/")
    else:
        rel = (page_dir + "/" + path) if page_dir else path
    parts = []
    for seg in rel.split("/"):
        if seg in ("", "."):
            continue
        if seg == "..":
            if parts:
                parts.pop()
            continue
        parts.append(seg)
    rel = "/".join(parts)
    if rel.endswith("index.html"):
        rel = rel[: -len("index.html")]
    else:
        rel = rel[:-5]
    return "/" + rel + tail


for page in pages:
    page_dir = page.parent.relative_to(src).as_posix()
    if page_dir == ".":
        page_dir = ""
    text = load(page)
    orig = text

    def hrepl(m):
        global href_changed
        new = convert(m.group(3), page_dir)
        if new is None:
            return m.group(0)
        if new != m.group(3):
            href_changed += 1
            if len(samples) < 5:
                samples.append(f"{page.relative_to(src).as_posix()}: {m.group(3)} -> {new}")
        return m.group(1) + m.group(2) + new + m.group(4) + m.group(2)

    text = HREF.sub(hrepl, text)

    def ogrepl(m):
        global og_changed
        new = convert(m.group(2), page_dir)
        if new is None or new == m.group(2):
            return m.group(0)
        og_changed += 1
        return m.group(1) + new + m.group(3)

    text = OGURL.sub(ogrepl, text)
    if text != orig:
        save(page, text)

bump("HTML href rewritten", href_changed)
bump("og:url rewritten", og_changed)
print("sample rewrites:")
for x in samples:
    print("  " + x)

left_href = 0
for page in pages:
    left_href += len(re.findall(r"""href=["'][^"']*\.html""", load(page)))
print()
print("--- totals ---")
for k, v in stats.items():
    print(f"{v:5d}  {k}")
print(f"{left_href:5d}  href attributes still ending .html")
print(f"{len(pages)}  html files processed")
