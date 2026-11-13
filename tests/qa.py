#!/usr/bin/env python3
"""Stacklane Tools - repository QA suite.

Runs with the Python standard library only (no pip install, no Node). It reads the
files in this repository and checks the things that break silently: a link to a
page that no longer exists, a tool in the catalogue with no script, a canonical
URL pointing at the wrong path, a sitemap entry for a deleted page.

Usage
-----
    python tests/qa.py            # run every check, print a summary
    python tests/qa.py --verbose  # print each failing item

Exit code is 0 when every check passes and 1 when anything fails, so CI or a
pre-commit hook can gate on it.

Scope: this checks the source of truth in the repository. It does not execute
JavaScript, so it cannot prove a tool calculates correctly. Those checks live in
tests/browser-checks.md and are run manually in a browser.

What is verified
----------------
1.  Every local src/href in every HTML page resolves to a file on disk.
2.  Every page carries exactly one <h1>, a title, a description and a canonical.
3.  Canonical URLs are unique, absolute and match the page's real path.
4.  og:site_name, og:image and the CSP meta tag are present on every page.
5.  No page loads a script, stylesheet, image or font from a foreign origin.
6.  assets/catalog.js, en/<slug>.html and assets/tools/<slug>.js agree.
7.  Every category page exists for each category declared in assets/config.js.
8.  all-tools.html contains one card per catalogue entry, all resolving.
9.  sitemap.xml lists exactly the indexable pages, with no dead or duplicate URLs.
10. robots.txt points at the sitemap and does not block the site.
11. Business pages carry their own script and do not depend on missing assets.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://stacklanetools.com"

VERBOSE = "--verbose" in sys.argv or "-v" in sys.argv

failures: list[str] = []
notes: list[str] = []


def fail(msg: str) -> None:
    failures.append(msg)


def note(msg: str) -> None:
    notes.append(msg)


def rel(p: Path) -> str:
    try:
        return str(p.relative_to(ROOT)).replace(os.sep, "/")
    except ValueError:
        return str(p)


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace")


PUBLISHED_ROOT = [
    "index.html", "about.html", "all-tools.html", "contact.html",
    "privacy.html", "terms.html", "404.html",
]


def html_pages() -> list[Path]:
    """The pages that are actually deployed.

    Partials (`_*.html`), the local QA harness (`qa-*.html`) and the
    unpublished `ar/` folder are not part of the release, so scanning them
    would report failures for files no visitor can reach.
    """
    pages = [ROOT / name for name in PUBLISHED_ROOT if (ROOT / name).is_file()]
    return pages + sorted((ROOT / "en").glob("*.html"))


# --------------------------------------------------------------------------
# 1. Local references resolve
# --------------------------------------------------------------------------
REF_RE = re.compile(r'(?:src|href)="([^"]+)"')


def check_local_refs(pages: list[Path]) -> None:
    skip_prefixes = ("http://", "https://", "mailto:", "tel:", "#", "data:", "//")
    for page in pages:
        text = read(page)
        for ref in REF_RE.findall(text):
            ref = ref.strip()
            if not ref or ref.startswith(skip_prefixes):
                continue
            target = ref.split("#", 1)[0].split("?", 1)[0]
            if not target:
                continue
            if target.startswith("/"):
                resolved = ROOT / target.lstrip("/")
            else:
                resolved = (page.parent / target)
            candidates = [resolved]
            if resolved.suffix == "":
                candidates += [resolved.with_suffix(".html"),
                              resolved / "index.html"]
            if not any(c.exists() for c in candidates):
                fail(f"dead local reference: {rel(page)} -> {ref}")


# --------------------------------------------------------------------------
# 2-5. Per-page metadata, headings, canonical, CSP, foreign origins
# --------------------------------------------------------------------------
CANON_RE = re.compile(r'<link rel="canonical" href="([^"]+)"')
TITLE_RE = re.compile(r"<title>(.*?)</title>", re.S)
DESC_RE = re.compile(r'<meta name="description" content="([^"]*)"')
CSP_RE = re.compile(r'http-equiv="Content-Security-Policy"')
H1_RE = re.compile(r"<h1[ >]", re.I)


def canonical_path(page: Path) -> str:
    """The canonical path this page should advertise.

    The site publishes `.html` URLs (sitemap.xml, DEPLOY.md and every
    canonical agree on that shape), so the canonical is simply the page's
    own path. `index.html` maps to the directory URL.
    """
    p = rel(page)
    if p == "index.html":
        return "/"
    if p.endswith("/index.html"):
        return "/" + p[: -len("index.html")]          # en/index.html -> /en/
    return "/" + p


def check_page_metadata(pages: list[Path]) -> None:
    seen_canonical: dict[str, str] = {}
    for page in pages:
        text = read(page)

        title = TITLE_RE.search(text)
        if not title or not title.group(1).strip():
            fail(f"missing <title>: {rel(page)}")
        elif len(title.group(1)) > 70:
            note(f"title longer than 70 chars ({len(title.group(1))}): {rel(page)}")

        # A noindex page (404) is not a landing page: it needs no description
        # or canonical, and adding one would only describe a page nobody
        # should land on.
        noindex = 'content="noindex"' in text

        if not DESC_RE.search(text) and not noindex:
            fail(f"missing meta description: {rel(page)}")

        if len(H1_RE.findall(text)) != 1 and page.name != "404.html":
            fail(f"expected exactly one <h1>: {rel(page)} "
                 f"(found {len(H1_RE.findall(text))})")

        if not CSP_RE.search(text):
            fail(f"missing CSP meta tag: {rel(page)}")

        canonical = CANON_RE.search(text)
        if not canonical:
            if not noindex:
                fail(f"missing canonical: {rel(page)}")
        else:
            url = canonical.group(1)
            if not url.startswith(SITE + "/"):
                fail(f"canonical not on the site origin: {rel(page)} -> {url}")
            elif url in seen_canonical:
                fail(f"duplicate canonical: {url} "
                     f"({seen_canonical[url]} and {rel(page)})")
            else:
                seen_canonical[url] = rel(page)
                expected = SITE + canonical_path(page)
                if url != expected:
                    fail(f"canonical path mismatch: {rel(page)} -> {url} "
                         f"(expected {expected})")

        if page.name != "404.html":
            if 'property="og:site_name"' not in text:
                fail(f"missing og:site_name: {rel(page)}")
            if 'property="og:image"' not in text:
                fail(f"missing og:image: {rel(page)}")

        # foreign origins in anything the browser would fetch
        for attr in ("src", "srcset"):
            for ref in re.findall(rf'{attr}="([^"]+)"', text):
                if ref.startswith(("http://", "https://", "//")):
                    fail(f"foreign {attr} in {rel(page)}: {ref}")
        for ref in re.findall(r'<link[^>]+href="([^"]+)"', text):
            # Absolute canonical/alternate/og URLs point at the site itself and
            # are expected; only other origins are a problem.
            if ref.startswith(SITE):
                continue
            if ref.startswith(("http://", "https://", "//")):
                fail(f"foreign <link> in {rel(page)}: {ref}")
        for ref in re.findall(r'@import\s+url\(([^)]+)\)', text):
            if ref.strip("'\" ").startswith(("http", "//")):
                fail(f"foreign @import in {rel(page)}: {ref}")


# --------------------------------------------------------------------------
# 6. Catalogue <-> pages <-> scripts
# --------------------------------------------------------------------------
def load_catalog() -> tuple[list[dict], list[str]]:
    """Parse assets/catalog.js without executing it."""
    text = read(ROOT / "assets" / "catalog.js")
    # Only the TOOL_CATALOG array. BUSINESS_PAGES entries also carry a slug but
    # are plain pages, not i18n tools, and have no assets/tools/<slug>.js.
    start = text.index("window.TOOL_CATALOG")
    block = text[start: text.index("];", start)]
    tools: list[dict] = []
    for m in re.finditer(r"\{[^{}]*slug:\s*'([^']+)'[^{}]*\}", block):
        entry = m.group(0)
        slug = m.group(1)
        cat = re.search(r"category:\s*'([^']+)'", entry)
        tools.append({"slug": slug, "category": cat.group(1) if cat else None})
    cats = re.findall(r"categories:\s*\[([^\]]*)\]", text)
    category_list: list[str] = []
    if cats:
        category_list = re.findall(r"'([^']+)'", cats[0])
    return tools, category_list


def check_catalogue() -> tuple[list[dict], list[str]]:
    tools, _ = load_catalog()
    if not tools:
        fail("could not parse any tools out of assets/catalog.js")
        return [], []

    config = read(ROOT / "assets" / "config.js")
    cat_match = re.search(r"categories:\s*\[([^\]]*)\]", config)
    categories = re.findall(r"'([^']+)'", cat_match.group(1)) if cat_match else []
    if len(categories) != 9:
        fail(f"expected 9 categories in assets/config.js, found {len(categories)}")

    seen: set[str] = set()
    for tool in tools:
        slug = tool["slug"]
        if slug in seen:
            fail(f"duplicate catalogue slug: {slug}")
        seen.add(slug)

        page = ROOT / "en" / f"{slug}.html"
        if not page.exists():
            fail(f"catalogue entry has no page: en/{slug}.html")
        script = ROOT / "assets" / "tools" / f"{slug}.js"
        if not script.exists():
            fail(f"catalogue entry has no script: assets/tools/{slug}.js")
        if tool["category"] and tool["category"] not in categories:
            fail(f"{slug}: category '{tool['category']}' is not declared in config.js")

    # the reverse direction: every tool page has a catalogue entry
    for page in sorted((ROOT / "en").glob("*.html")):
        slug = page.stem
        if slug in categories or slug == "index":
            continue
        if slug in BUSINESS_SLUGS:
            continue
        if slug not in seen:
            fail(f"tool page with no catalogue entry: en/{slug}.html")

    return tools, categories


BUSINESS_SLUGS = {
    "invoice", "calculator", "margin-calculator", "break-even-calculator",
    "late-payment-calculator", "loss-calculator", "audit",
}


# --------------------------------------------------------------------------
# 7. Category pages
# --------------------------------------------------------------------------
def check_category_pages(categories: list[str]) -> None:
    for cat in categories:
        page = ROOT / "en" / f"{cat}.html"
        if not page.exists():
            fail(f"missing category page: en/{cat}.html")
            continue
        text = read(page)
        if 'data-category="' not in text and "cat-grid" not in text:
            fail(f"category page does not render a grid: en/{cat}.html")


# --------------------------------------------------------------------------
# 8. all-tools.html
# --------------------------------------------------------------------------
def check_all_tools(tools: list[dict]) -> None:
    page = ROOT / "all-tools.html"
    if not page.exists():
        fail("missing all-tools.html")
        return
    text = read(page)
    cards = re.findall(r'<h3><a href="en/([^"]+)\.html">', text)
    expected = len(tools) + len(BUSINESS_SLUGS)
    if len(cards) != expected:
        fail(f"all-tools.html has {len(cards)} cards, expected {expected}")
    for slug in cards:
        if not (ROOT / "en" / f"{slug}.html").exists():
            fail(f"all-tools.html links to a missing page: /en/{slug}")
    missing = {t["slug"] for t in tools} | BUSINESS_SLUGS
    for slug in sorted(missing - set(cards)):
        fail(f"all-tools.html is missing a card for: {slug}")


# --------------------------------------------------------------------------
# 9. Sitemap
# --------------------------------------------------------------------------
def check_sitemap(pages: list[Path]) -> None:
    path = ROOT / "sitemap.xml"
    if not path.exists():
        fail("missing sitemap.xml")
        return
    text = read(path)
    locs = re.findall(r"<loc>([^<]+)</loc>", text)
    if not locs:
        fail("sitemap.xml has no <loc> entries")
        return
    if len(locs) != len(set(locs)):
        dupes = {u for u in locs if locs.count(u) > 1}
        fail(f"sitemap has duplicate URLs: {sorted(dupes)[:5]}")

    indexable = [p for p in pages if p.name != "404.html"]
    if len(locs) != len(indexable):
        fail(f"sitemap lists {len(locs)} URLs but there are {len(indexable)} "
             f"indexable pages")

    for loc in locs:
        if not loc.startswith(SITE + "/"):
            fail(f"sitemap URL off-origin: {loc}")
            continue
        rel_path = loc[len(SITE) + 1:]
        if rel_path == "":
            target = ROOT / "index.html"
        elif rel_path.endswith("/"):
            target = ROOT / rel_path / "index.html"
        else:
            target = ROOT / rel_path
        if not target.exists():
            fail(f"sitemap URL has no page: {loc}")


# --------------------------------------------------------------------------
# 10. robots.txt and security headers
# --------------------------------------------------------------------------
def check_robots_and_headers() -> None:
    robots = ROOT / "robots.txt"
    if not robots.exists():
        fail("missing robots.txt")
    else:
        text = read(robots)
        if "Sitemap:" not in text:
            fail("robots.txt does not declare a sitemap")
        for line in text.splitlines():
            if line.strip() == "Disallow: /":
                fail("robots.txt blocks the whole site")

    headers = ROOT / "_headers"
    if not headers.exists():
        fail("missing _headers")
    else:
        text = read(headers)
        for needed in ("Content-Security-Policy", "Strict-Transport-Security",
                       "X-Content-Type-Options", "Referrer-Policy"):
            if needed not in text:
                fail(f"_headers is missing {needed}")
        if "frame-ancestors 'none'" not in text:
            fail("_headers CSP does not set frame-ancestors 'none'")


# --------------------------------------------------------------------------
# 11. Brand assets
# --------------------------------------------------------------------------
def check_brand_assets() -> None:
    for asset in ("assets/style.css", "assets/favicon.svg", "assets/logo.svg",
                  "assets/og.png", "assets/config.js", "assets/chrome.js",
                  "assets/catalog.js", "assets/i18n/en.json"):
        if not (ROOT / asset).exists():
            fail(f"missing brand asset: {asset}")

    og = ROOT / "assets" / "og.png"
    if og.exists():
        data = og.read_bytes()[:24]
        if data[:8] != b"\x89PNG\r\n\x1a\n":
            fail("assets/og.png is not a PNG")
        else:
            import struct
            w, h = struct.unpack(">II", data[16:24])
            if (w, h) != (1200, 630):
                fail(f"assets/og.png is {w}x{h}, expected 1200x630")

    try:
        json.loads(read(ROOT / "assets" / "i18n" / "en.json"))
    except Exception as exc:                                  # noqa: BLE001
        fail(f"assets/i18n/en.json is not valid JSON: {exc}")


# --------------------------------------------------------------------------
# 12. Generated regions are fresh
# --------------------------------------------------------------------------
def check_prerender() -> None:
    script = ROOT / "tools" / "prerender.py"
    if not script.exists():
        fail("missing tools/prerender.py")
        return
    import subprocess
    proc = subprocess.run([sys.executable, str(script), "--check"],
                          capture_output=True, text=True)
    if proc.returncode != 0:
        lines = [ln.strip() for ln in (proc.stdout or "").splitlines() if ln.strip()]
        detail = lines[-2] if len(lines) > 1 else (lines[0] if lines else "no output")
        fail(f"prerender --check reports stale generated content ({detail})")


# --------------------------------------------------------------------------
# 13. Marker integrity
# --------------------------------------------------------------------------
MARK_RE = re.compile(r"<!-- stacklane:([a-z]+):(start|end) -->")


def check_markers(pages: list[Path]) -> None:
    for page in pages:
        text = read(page)
        regions = sorted({m.group(1) for m in MARK_RE.finditer(text)})
        for region in regions:
            start = f"<!-- stacklane:{region}:start -->"
            end = f"<!-- stacklane:{region}:end -->"
            count = text.count(start)
            if count != text.count(end):
                fail(f"unbalanced {region} marker: {rel(page)}")
            elif count > 1:
                fail(f"duplicate {region} marker: {rel(page)}")
            elif text.index(start) > text.index(end):
                fail(f"reversed {region} marker: {rel(page)}")
        if 'id="site-header"' in text and "stacklane:header:start" not in text:
            fail(f"header container without generated markup: {rel(page)}")
        if 'id="site-footer"' in text and "stacklane:footer:start" not in text:
            fail(f"footer container without generated markup: {rel(page)}")


# --------------------------------------------------------------------------
# 14. Structured data is valid JSON and truthful
# --------------------------------------------------------------------------
LD_RE = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)


def check_structured_data(pages: list[Path]) -> None:
    seen = 0
    for page in pages:
        for raw in LD_RE.findall(read(page)):
            seen += 1
            try:
                data = json.loads(raw)
            except Exception as exc:                              # noqa: BLE001
                fail(f"invalid JSON-LD in {rel(page)}: {exc}")
                continue
            if data.get("@context") != "https://schema.org":
                fail(f"JSON-LD without schema.org context: {rel(page)}")
            nodes = data.get("@graph") or [data]
            if not isinstance(nodes, list):
                fail(f"JSON-LD @graph is not a list: {rel(page)}")
                continue
            for node in nodes:
                if not isinstance(node, dict) or not node.get("@type"):
                    fail(f"JSON-LD node without @type: {rel(page)}")
                    continue
                if "aggregateRating" in node or "review" in node:
                    fail(f"unsupported review/rating markup: {rel(page)}")
                kind = node["@type"]
                if kind == "BreadcrumbList":
                    items = node.get("itemListElement") or []
                    if len(items) < 2:
                        fail(f"BreadcrumbList with fewer than 2 items: {rel(page)}")
                    for i, item in enumerate(items, 1):
                        if item.get("position") != i:
                            fail(f"breadcrumb position {i} out of order: {rel(page)}")
                        if not item.get("name"):
                            fail(f"breadcrumb item without a name: {rel(page)}")
                        if not str(item.get("item", "")).startswith(SITE):
                            fail(f"breadcrumb item off-origin: {rel(page)}")
                elif kind in ("SoftwareApplication", "CollectionPage", "WebSite"):
                    if not node.get("name"):
                        fail(f"{kind} without a name: {rel(page)}")
                    url = node.get("url")
                    if not url or not str(url).startswith(SITE):
                        fail(f"{kind} url off-origin or missing: {rel(page)}")
                elif kind == "Organization":
                    if not node.get("name") or not str(node.get("url", "")).startswith(SITE):
                        fail(f"Organization without a name or url: {rel(page)}")
    if seen == 0:
        fail("no JSON-LD blocks found on any page")
    else:
        note(f"{seen} JSON-LD blocks validated")


# --------------------------------------------------------------------------
# 15. Unique titles and descriptions
# --------------------------------------------------------------------------
def check_unique_meta(pages: list[Path]) -> None:
    titles: dict[str, str] = {}
    descs: dict[str, str] = {}
    for page in pages:
        if page.name == "404.html":
            continue
        text = read(page)
        title = TITLE_RE.search(text)
        if title:
            value = title.group(1).strip()
            if value in titles:
                fail(f"duplicate title: {rel(page)} and {titles[value]}")
            else:
                titles[value] = rel(page)
            if len(value) > 70:
                note(f"title longer than 70 chars ({len(value)}): {rel(page)}")
        desc = DESC_RE.search(text)
        if desc:
            value = desc.group(1).strip()
            if value in descs:
                fail(f"duplicate meta description: {rel(page)} and {descs[value]}")
            else:
                descs[value] = rel(page)
            if len(value) > 160:
                fail(f"meta description longer than 160 chars ({len(value)}): {rel(page)}")


# --------------------------------------------------------------------------
# 16. hreflang points at pages that exist
# --------------------------------------------------------------------------
ALT_RE = re.compile(r'<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"')


def check_hreflang(pages: list[Path]) -> None:
    for page in pages:
        for code, href in ALT_RE.findall(read(page)):
            if not href.startswith(SITE + "/"):
                fail(f"hreflang target not absolute on the site origin: {rel(page)} -> {href}")
                continue
            target = ROOT / href[len(SITE) + 1:]
            if not target.exists():
                fail(f"hreflang target has no page: {rel(page)} -> {href}")
            if code not in ("x-default", "en"):
                fail(f"hreflang '{code}' has no translated pages: {rel(page)}")


# --------------------------------------------------------------------------
# 17. Nothing indexable is accidentally noindex
# --------------------------------------------------------------------------
def check_indexability(pages: list[Path]) -> None:
    for page in pages:
        if 'content="noindex"' in read(page) and page.name != "404.html":
            fail(f"unexpected noindex: {rel(page)}")


# --------------------------------------------------------------------------
# main
# --------------------------------------------------------------------------
def main() -> int:
    pages = html_pages()
    if not pages:
        fail("no HTML pages found")
        return 1

    check_local_refs(pages)
    check_page_metadata(pages)
    tools, categories = check_catalogue()
    check_category_pages(categories)
    check_all_tools(tools)
    check_sitemap(pages)
    check_robots_and_headers()
    check_brand_assets()
    check_prerender()
    check_markers(pages)
    check_structured_data(pages)
    check_unique_meta(pages)
    check_hreflang(pages)
    check_indexability(pages)

    print(f"Stacklane Tools QA — {len(pages)} pages, {len(tools)} catalogue tools, "
          f"{len(categories)} categories")
    print("-" * 66)

    if notes:
        for msg in notes:
            print(f"  note   {msg}")

    if failures:
        shown = failures if VERBOSE else failures[:25]
        for msg in shown:
            print(f"  FAIL   {msg}")
        if len(failures) > len(shown):
            print(f"  ... and {len(failures) - len(shown)} more "
                  f"(run with --verbose)")
        print("-" * 66)
        print(f"FAILED — {len(failures)} problem(s)")
        return 1

    print("PASSED — every check succeeded")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
