#!/usr/bin/env python3
"""Stacklane Tools - static prerender.

The site ships as plain HTML plus a small amount of JavaScript. Until now the
shared chrome (header, footer, breadcrumbs), the FAQ lists, the related-tool
cards, the category listings and the home-page grids were built at runtime from
assets/i18n/en.json, so a crawler that does not run JavaScript saw empty
containers. This generator writes that same markup into the HTML files at build
time. The runtime scripts still run, but only to enhance what is already there.

Design
------
* Markers delimit every generated region:

      <!-- stacklane:header:start -->
      ...generated...
      <!-- stacklane:header:end -->

  Only the text between a matching pair is ever rewritten. Anything outside the
  markers is untouched, so hand-written page copy can live beside generated
  blocks without risk.

* The output is a pure function of assets/i18n/en.json, assets/catalog.js,
  assets/config.js and the page's own type (data-tool / data-category /
  data-home / data-root). Running the generator twice writes identical bytes.

* On the first run the markers do not exist yet. They are inserted into the
  empty container the runtime script would otherwise fill
  (`<div id="site-header"></div>`, `<dl data-faq="...">`, ...). If a container
  already holds unexpected content, or a marker is duplicated or unbalanced,
  the generator stops with an error instead of overwriting it.

Usage
-----
    python tools/prerender.py            # write the generated regions
    python tools/prerender.py --check    # report stale files, change nothing
    python tools/prerender.py --verbose  # print every page and its status

Exit status is 0 when every page is up to date (or was written successfully),
1 when --check finds stale content or the generator refuses a page.

Standard library only.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_FALLBACK = "https://stacklanetools.com"
YEAR = 2026

# Pages that make up the deployed site. Partials (`_*.html`), local QA harness
# files (`qa-*.html`) and the unpublished Arabic folder are deliberately absent.
ROOT_PAGES = [
    "index.html", "about.html", "all-tools.html", "contact.html",
    "privacy.html", "terms.html", "404.html",
]

MARKER = "<!-- stacklane:{region}:{edge} -->"

# Container that receives each region when the markers are not there yet.
CONTAINERS = {
    "header": r'<(?P<tag>header|div)(?P<attrs>[^>]*\bid="site-header"[^>]*)>\s*</(?P=tag)>',
    "footer": r'<(?P<tag>div)(?P<attrs>[^>]*\bid="site-footer"[^>]*)>\s*</(?P=tag)>',
    "crumbs": r'<(?P<tag>nav)(?P<attrs>[^>]*\bid="crumbs"[^>]*)>\s*</(?P=tag)>',
    "faq": r'<(?P<tag>dl|div)(?P<attrs>[^>]*\bdata-faq="[^"]*"[^>]*)>\s*</(?P=tag)>',
    "related": r'<(?P<tag>div)(?P<attrs>[^>]*\bid="related"[^>]*)>\s*</(?P=tag)>',
    "catgrid": r'<(?P<tag>div)(?P<attrs>[^>]*\bid="cat-grid"[^>]*)>\s*</(?P=tag)>',
    "homecats": r'<(?P<tag>div)(?P<attrs>[^>]*\bid="category-grid"[^>]*)>\s*</(?P=tag)>',
    "homechips": r'<(?P<tag>div)(?P<attrs>[^>]*\bid="popular-row"[^>]*)>\s*</(?P=tag)>',
    "homepopular": r'<(?P<tag>div)(?P<attrs>[^>]*\bid="popular-grid"[^>]*)>\s*</(?P=tag)>',
    "homesections": r'<(?P<tag>div)(?P<attrs>[^>]*\bid="cat-sections"[^>]*)>\s*</(?P=tag)>',
}

# Page-type specific text that the runtime does not need (and never rendered),
# so it lives here rather than in the i18n JSON.
CAT_INTRO = {
    "pdf": "Merge several PDFs into one file, split a document into separate pages, "
           "or turn a set of images into a single PDF. Each tool reads only the files "
           "you choose in the browser, so the documents are never uploaded to a server.",
    "images": "Compress, resize, crop and convert pictures without sending them "
              "anywhere. Useful for shrinking a photo before attaching it to an email, "
              "fitting an image to a fixed width, or changing between PNG, JPG and WebP.",
    "text": "Count words and characters, change letter case, remove repeated lines, "
            "sort a list, compare two drafts, generate placeholder text or measure "
            "typing speed. Paste your text and the result updates as you type.",
    "generators": "Create QR codes, strong passwords, UUIDs, random numbers and "
                  "favicons. Generation happens in the browser, so a code or password "
                  "made here is never transmitted or stored.",
    "calculators": "Work out percentages, loan and mortgage payments, compound "
                   "interest, discounts, VAT, dates, tips, ROI and more. Every "
                   "calculator updates as you type and states the formula it uses.",
    "converters": "Convert units, time zones, number bases, Roman numerals, fractions "
                  "and ratios. Conversions use fixed, published factors, and the page "
                  "names the factor whenever a result depends on one.",
    "developer": "Format and validate JSON, encode Base64 and URLs, decode JWTs, "
                 "compare colours, test regular expressions, hash text, format SQL, "
                 "and generate meta tags and sitemaps. Output is produced locally.",
    "fun": "Small distractions: flip a coin, roll dice, spin a decision wheel, pop "
           "bubble wrap, type like a film hacker, or generate a compliment or a "
           "Shakespearean insult. Nothing is recorded or sent anywhere.",
    "business": "Seven pages for running a small service business: build an invoice, "
                "price a job, work out margin and break-even, chase a late payment, "
                "estimate what lost enquiries cost, and run a website audit. These "
                "pages are written in English only.",
}

RELATED_CATS = {
    "pdf": ["images", "text", "developer"],
    "images": ["pdf", "converters", "developer"],
    "text": ["developer", "generators", "calculators"],
    "generators": ["text", "images", "developer"],
    "calculators": ["converters", "business", "text"],
    "converters": ["calculators", "text", "developer"],
    "developer": ["text", "converters", "pdf"],
    "fun": ["generators", "text", "images"],
    "business": ["calculators", "converters", "pdf"],
}

ICONS = {
    "calculators": '<path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
    "text": '<path d="M5 6h14M5 10h14M5 14h9M5 18h6"/>',
    "pdf": '<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7Z"/><path d="M14 3v4h4M9 13h6M9 17h4"/>',
    "images": '<rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="8.5" cy="10" r="1.5"/><path d="m21 16-5-5-4 4-2-2-4 4"/>',
    "developer": '<path d="m9 8-5 4 5 4M15 8l5 4-5 4"/>',
    "generators": '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01M12 12h.01"/>',
    "converters": '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    "business": '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12h18"/>',
    "fun": '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9h.01M15 9h.01"/>',
}

BRAND_SVG = (
    '<svg class="brand-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" '
    'aria-hidden="true" focusable="false">'
    '<path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z"></path>'
    '<path d="M4 12.5 12 17l8-4.5"></path>'
    '<path d="M4 17.5 12 22l8-4.5"></path></svg>'
)

POPULAR = [
    "word-counter", "merge-pdf", "qr-code-generator", "percentage-calculator",
    "password-generator", "image-compressor", "json-formatter", "loan-calculator",
]

EYEBROWS = {
    "pdf": "Documents, handled locally",
    "images": "Pictures, no upload",
    "text": "Words and lines",
    "generators": "Make something new",
    "calculators": "Numbers, with the working",
    "converters": "One format to another",
    "developer": "Everyday dev chores",
    "fun": "Five-minute distractions",
}


# ---------------------------------------------------------------------------
# source data
# ---------------------------------------------------------------------------
def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def load_i18n() -> dict:
    return json.loads(read(ROOT / "assets" / "i18n" / "en.json"))


def slice_block(text: str, opener: str) -> str:
    start = text.index(opener)
    end = text.index("];", start)
    return text[start:end]


def load_catalog() -> tuple[list[dict], list[dict], list[str]]:
    text = read(ROOT / "assets" / "catalog.js")
    tools = [
        {"slug": m.group(1), "category": m.group(2)}
        for m in re.finditer(
            r"slug:\s*'([^']+)'\s*,\s*category:\s*'([^']+)'",
            slice_block(text, "window.TOOL_CATALOG"),
        )
    ]
    business = [
        {"slug": m.group(1), "name": m.group(2), "desc": m.group(3)}
        for m in re.finditer(
            r"slug:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'\s*,\s*desc:\s*'([^']*)'",
            slice_block(text, "window.BUSINESS_PAGES"),
        )
    ]
    config = read(ROOT / "assets" / "config.js")
    cats = re.findall(r"'([a-z-]+)'", re.search(r"categories:\s*\[([^\]]*)\]", config).group(1))
    return tools, business, cats


def site_url() -> str:
    m = re.search(r"siteUrl:\s*'([^']+)'", read(ROOT / "assets" / "config.js"))
    return (m.group(1) if m else SITE_FALLBACK).rstrip("/")


# ---------------------------------------------------------------------------
# markup helpers
# ---------------------------------------------------------------------------
def esc(value) -> str:
    return html.escape(str(value if value is not None else ""), quote=True)


def get(d: dict, path: str, default=None):
    node = d
    for part in path.split("."):
        if not isinstance(node, dict):
            return default
        node = node.get(part)
        if node is None:
            return default
    return node


def icon(slug: str, cls: str) -> str:
    return (
        f'<span class="{cls}" aria-hidden="true">'
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
        f'stroke-linecap="round" stroke-linejoin="round">{ICONS.get(slug, ICONS["text"])}</svg></span>'
    )


ARROW = '<span class="card-arrow" aria-hidden="true">\u2192</span>'


def tool_card(t: dict, i18n: dict, slug: str) -> list[str]:
    title = get(i18n, f"tools.{slug}.title", "")
    desc = get(i18n, f"tools.{slug}.desc", "")
    cat = get(i18n, f"categories.{t['category']}.name", "")
    lines = [
        '<a class="card tool-card" href="%s.html" data-cat="%s">' % (slug, t["category"]),
        "  " + icon(t["category"], "row-icon"),
        "  <h3>%s</h3>" % esc(title),
    ]
    if desc:
        lines.append("  <p>%s</p>" % esc(desc))
    lines.append("  " + ARROW)
    lines.append("</a>")
    return lines


def business_card(p: dict) -> list[str]:
    return [
        '<a class="card tool-card" href="%s.html" data-cat="business">' % p["slug"],
        "  " + icon("business", "row-icon"),
        "  <h3>%s</h3>" % esc(p["name"]),
        "  <p>%s</p>" % esc(p["desc"]),
        "  " + ARROW,
        "</a>",
    ]


# ---------------------------------------------------------------------------
# regions
# ---------------------------------------------------------------------------
def header_region(i18n: dict, home: str, tool_prefix: str, root: str) -> list[str]:
    nav = i18n.get("nav", {})
    site = get(i18n, "meta.siteName", "Stacklane Tools")
    cats = i18n.get("categories", {})
    order = ["pdf", "images", "text", "generators", "calculators",
             "converters", "developer", "fun", "business"]
    lines = [
        '<div class="container head-in">',
        '  <a class="brand" href="%s">%s<span class="brand-word">%s</span></a>' % (home, BRAND_SVG, esc(site)),
        '  <nav class="head-nav" aria-label="%s">' % esc(site),
        '    <div class="head-search">',
        '      <input id="head-q" type="search" autocomplete="off" spellcheck="false" '
        'placeholder="Search tools" aria-label="Search the tools">',
        '      <ul id="head-results" class="head-results" hidden></ul>',
        "    </div>",
        '    <a href="%s#categories" aria-label="Browse by category">Categories</a>' % home,
        '    <a href="%sbusiness.html">Business</a>' % tool_prefix,
        '    <details class="menu">',
        "      <summary>Menu</summary>",
        '      <div class="menu-panel">',
        "        <ul>",
        '          <li><a href="%s">Home</a></li>' % home,
        '          <li><a href="%s#categories">Browse by category</a></li>' % home,
        '          <li><a href="%sall-tools.html">All tools</a></li>' % root,
    ]
    for slug in order:
        name = get(cats, slug + ".name")
        if name:
            lines.append('          <li><a href="%s%s.html">%s</a></li>' % (home.replace("index.html", ""), slug, esc(name)))
    lines += [
        '          <li class="menu-sep" aria-hidden="true"></li>',
        '          <li><a href="%sprivacy.html">Privacy</a></li>' % root,
        '          <li><a href="%sterms.html">Terms</a></li>' % root,
        "        </ul>",
        "      </div>",
        "    </details>",
        "  </nav>",
        "</div>",
    ]
    return lines


def footer_region(i18n: dict, home: str, root: str) -> list[str]:
    f = i18n.get("footer", {})
    nav = i18n.get("nav", {})
    site = get(i18n, "meta.siteName", "Stacklane Tools")
    cats = i18n.get("categories", {})
    # Root pages live beside the `en/` folder; language pages link siblings.
    cat_prefix = home.replace("index.html", "")
    order = ["pdf", "images", "text", "generators", "calculators",
             "converters", "developer", "fun", "business"]
    lines = [
        '<div class="container">',
        '  <div class="foot-grid">',
        "    <div>",
        "      <strong>%s</strong>" % esc(site),
    ]
    if f.get("tagline"):
        lines.append('      <p class="foot-tagline note">%s</p>' % esc(f["tagline"]))
    if f.get("madeWith"):
        lines.append('      <p class="note">%s</p>' % esc(f["madeWith"]))
    lines += [
        "    </div>",
        '    <nav class="foot-cats" aria-label="Categories">',
        '      <span class="foot-head">Categories</span>',
        "      <ul>",
    ]
    for slug in order:
        name = get(cats, slug + ".name")
        if name:
            lines.append('        <li><a href="%s%s.html">%s</a></li>' % (cat_prefix, slug, esc(name)))
    lines += [
        "      </ul>",
        "    </nav>",
        "    <div>",
        '      <span class="foot-head">Stacklane</span>',
        "      <ul>",
        '        <li><a href="%s">%s</a></li>' % (home, esc(nav.get("home", "Home"))),
        '        <li><a href="%sprivacy.html">%s</a></li>' % (root, esc(nav.get("privacy", "Privacy"))),
        '        <li><a href="%sterms.html">%s</a></li>' % (root, esc(nav.get("terms", "Terms"))),
        "      </ul>",
        "    </div>",
        "  </div>",
        '  <p class="foot-copy">\u00a9 <span data-year>%d</span> %s</p>' % (YEAR, esc(site)),
        "</div>",
    ]
    return lines


def crumbs_region(i18n: dict, category: str, tool: str | None) -> list[str]:
    nav = i18n.get("nav", {})
    cats = i18n.get("categories", {})
    lines = ['<a href="index.html">%s</a>' % esc(nav.get("home", "Home"))]
    if category:
        lines.append('<span class="sep" aria-hidden="true">\u203a</span>')
        lines.append('<a href="%s.html">%s</a>' % (category, esc(get(cats, category + ".name", category))))
    if tool:
        lines.append('<span class="sep" aria-hidden="true">\u203a</span>')
        lines.append("<span>%s</span>" % esc(get(i18n, "tools." + tool + ".title", tool)))
    return lines


def faq_region(i18n: dict, slug: str) -> list[str]:
    items = get(i18n, "tools." + slug + ".faq", [])
    lines = []
    for item in items if isinstance(items, list) else []:
        lines += [
            '<details class="faq-item">',
            "  <summary>%s</summary>" % esc(item.get("q", "")),
            "  <p>%s</p>" % esc(item.get("a", "")),
            "</details>",
        ]
    return lines


def related_region(i18n: dict, slug: str, category: str, tools: list[dict]) -> list[str]:
    siblings = [t for t in tools if t["category"] == category and t["slug"] != slug]
    cat_name = get(i18n, "categories." + category + ".name", "")
    lines = []
    for t in siblings[:4]:
        lines += [
            '<a class="card tool-card" href="%s.html">' % t["slug"],
            '  <span class="card-kicker">%s</span>' % esc(cat_name),
            "  <h3>%s</h3>" % esc(get(i18n, "tools." + t["slug"] + ".title", "")),
            "  <p>%s</p>" % esc(get(i18n, "tools." + t["slug"] + ".desc", "")),
            "</a>",
        ]
    return lines


def catgrid_region(i18n: dict, category: str, tools: list[dict], business: list[dict]) -> list[str]:
    lines = []
    if category == "business":
        for p in business:
            lines += business_card(p)
        return lines
    for t in tools:
        if t["category"] != category:
            continue
        if not get(i18n, "tools." + t["slug"] + ".title"):
            continue
        lines += [
            '<a class="card tool-card" href="%s.html">' % t["slug"],
            "  " + icon(category, "tool-icon"),
            "  <h3>%s</h3>" % esc(get(i18n, "tools." + t["slug"] + ".title")),
        ]
        desc = get(i18n, "tools." + t["slug"] + ".desc", "")
        if desc:
            lines.append("  <p>%s</p>" % esc(desc))
        lines.append("  " + ARROW)
        lines.append("</a>")
    return lines


def catintro_region(i18n: dict, category: str, tools: list[dict], business: list[dict]) -> list[str]:
    if category == "business":
        count = len(business)
    else:
        count = sum(1 for t in tools if t["category"] == category)
    cat_name = get(i18n, "categories." + category + ".name", category)
    lines = [
        '<section class="cat-intro">',
        "  <h2>%s</h2>" % esc("What these tools do"),
        "  <p>%s</p>" % esc(CAT_INTRO.get(category, "")),
        '  <p class="note">%s</p>' % esc(
            "%d %s in this category. Everything runs in your browser: nothing you "
            "type or open is uploaded." % (count, "tool" if count == 1 else "tools")
        ),
        "</section>",
    ]
    return lines


def catrelated_region(i18n: dict, category: str) -> list[str]:
    cats = i18n.get("categories", {})
    lines = [
        '<nav class="cat-related" aria-label="Related categories">',
        "  <h2>Other categories</h2>",
        "  <ul>",
    ]
    for slug in RELATED_CATS.get(category, []):
        name = get(cats, slug + ".name")
        if name:
            lines.append('    <li><a href="%s.html">%s</a></li>' % (slug, esc(name)))
    lines += ["  </ul>", "</nav>"]
    return lines


def home_cats(i18n: dict, tools: list[dict], cats: list[str]) -> list[str]:
    lines = []
    for slug in cats:
        if slug == "business":
            continue
        name = get(i18n, "categories." + slug + ".name")
        n = sum(1 for t in tools if t["category"] == slug)
        if not name or not n:
            continue
        lines += [
            '<a class="card cat-card" href="%s.html" data-cat="%s">' % (slug, slug),
            "  " + icon(slug, "cat-icon"),
            "  <h3>%s</h3>" % esc(name),
            "  <p>%s</p>" % esc(get(i18n, "categories." + slug + ".desc", "")),
            '  <span class="badge">%d %s</span>' % (n, esc(get(i18n, "category.countMany", "tools"))),
            "</a>",
        ]
    return lines


def home_chips(i18n: dict) -> list[str]:
    lines = ['<span class="popular-label">Popular</span>']
    for slug in POPULAR[:6]:
        title = get(i18n, "tools." + slug + ".title")
        if title:
            lines.append('<a href="%s.html">%s</a>' % (slug, esc(title)))
    return lines


def home_popular(i18n: dict, tools: list[dict]) -> list[str]:
    by_slug = {t["slug"]: t for t in tools}
    lines = []
    for slug in POPULAR:
        t = by_slug.get(slug)
        title = get(i18n, "tools." + slug + ".title")
        if not t or not title:
            continue
        lines += tool_card(t, i18n, slug)
    return lines


def home_sections(i18n: dict, tools: list[dict], cats: list[str]) -> list[str]:
    lines = []
    order = 0
    for slug in cats:
        if slug == "business":
            continue
        name = get(i18n, "categories." + slug + ".name")
        if not name:
            continue
        group = [t for t in tools if t["category"] == slug and get(i18n, "tools." + t["slug"] + ".title")]
        if not group:
            continue
        as_cards = order < 2
        lines += [
            '<section class="cat-section" id="cat-%s">' % slug,
            '  <div class="container">',
            "    <header>",
            '      <div class="sec-titles">',
        ]
        if EYEBROWS.get(slug):
            lines.append('        <span class="section-kicker">%s</span>' % esc(EYEBROWS[slug]))
        lines += [
            "        <h2>%s</h2>" % esc(name),
            "      </div>",
            '      <a class="view-all" href="%s.html">View all %d tools<span class="arrow" aria-hidden="true">\u2192</span></a>' % (slug, len(group)),
            "    </header>",
            '    <div class="%s">' % ("card-grid" if as_cards else "row-grid"),
        ]
        for i, t in enumerate(group[:6]):
            extra = " is-extra" if i > 3 else ""
            if as_cards:
                lines += [
                    '      <a class="card tool-card%s" href="%s.html" data-cat="%s">' % (extra, t["slug"], slug),
                    "        " + icon(slug, "row-icon"),
                    "        <h3>%s</h3>" % esc(get(i18n, "tools." + t["slug"] + ".title")),
                    "        <p>%s</p>" % esc(get(i18n, "tools." + t["slug"] + ".desc", "")),
                    "        " + ARROW,
                    "      </a>",
                ]
            else:
                lines += [
                    '      <a class="tool-row%s" href="%s.html" data-cat="%s">' % (extra, t["slug"], slug),
                    "        " + icon(slug, "row-icon"),
                    '        <span class="row-title">%s</span>' % esc(get(i18n, "tools." + t["slug"] + ".title")),
                    "        " + ARROW,
                    "      </a>",
                ]
        lines += ["    </div>", "  </div>", "</section>"]
        order += 1
    return lines


# ---------------------------------------------------------------------------
# structured data
# ---------------------------------------------------------------------------
def jsonld_for(kind: str, i18n: dict, site: str, page_url: str,
               category: str | None, tools: list[dict], business: list[dict]) -> list[str] | None:
    graph: list[dict] = []
    cats = i18n.get("categories", {})
    if kind == "root":
        graph.append({
            "@type": "Organization",
            "name": "Stacklane Tools",
            "url": site + "/",
            "logo": site + "/assets/og.png",
            "description": "Free browser-based tools for PDFs, images, text, developers and everyday calculations.",
        })
    elif kind == "home":
        graph.append({
            "@type": "CollectionPage",
            "name": get(i18n, "meta.siteName", "Stacklane Tools"),
            "url": page_url,
            "description": get(i18n, "meta.homeDesc", ""),
            "isPartOf": {"@type": "WebSite", "name": "Stacklane Tools", "url": site + "/"},
        })
    elif kind == "tool" and category:
        slug = page_url.rsplit("/", 1)[-1].removesuffix(".html")
        graph.append({
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": site + "/en/"},
                {"@type": "ListItem", "position": 2,
                 "name": get(cats, category + ".name", category),
                 "item": "%s/en/%s.html" % (site, category)},
                {"@type": "ListItem", "position": 3,
                 "name": get(i18n, "tools." + slug + ".title", slug),
                 "item": page_url},
            ],
        })
        graph.append({
            "@type": "SoftwareApplication",
            "name": get(i18n, "tools." + slug + ".title", slug),
            "description": get(i18n, "tools." + slug + ".desc", ""),
            "url": page_url,
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Any modern browser",
            "isAccessibleForFree": True,
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        })
    elif kind == "category" and category:
        group = business if category == "business" else [t for t in tools if t["category"] == category]
        name = get(cats, category + ".name", category)
        graph.append({
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": site + "/en/"},
                {"@type": "ListItem", "position": 2, "name": name, "item": page_url},
            ],
        })
        graph.append({
            "@type": "CollectionPage",
            "name": "%s tools" % name,
            "description": get(cats, category + ".desc", ""),
            "url": page_url,
            "isPartOf": {"@type": "WebSite", "name": "Stacklane Tools", "url": site + "/"},
            "hasPart": [
                {"@type": "SoftwareApplication", "name": p["name"], "url": "%s/en/%s.html" % (site, p["slug"])}
                for p in group
            ] if category == "business" else [
                {"@type": "SoftwareApplication",
                 "name": get(i18n, "tools." + t["slug"] + ".title", t["slug"]),
                 "url": "%s/en/%s.html" % (site, t["slug"])}
                for t in group
            ],
        })
    if not graph:
        return None
    payload = {"@context": "https://schema.org", "@graph": graph} if len(graph) > 1 else dict(
        {"@context": "https://schema.org"}, **graph[0]
    )
    return ['<script type="application/ld+json">', json.dumps(payload, ensure_ascii=False), "</script>"]


# ---------------------------------------------------------------------------
# marker plumbing
# ---------------------------------------------------------------------------
class MarkerError(Exception):
    pass


def has_region(text: str, region: str) -> bool:
    return MARKER.format(region=region, edge="start") in text


def check_markers(text: str, page: str) -> None:
    for region in list(CONTAINERS) + ["catintro", "catrelated", "toolcats", "jsonld"]:
        start = MARKER.format(region=region, edge="start")
        end = MARKER.format(region=region, edge="end")
        if text.count(start) > 1 or text.count(end) > 1:
            raise MarkerError("%s: duplicate %s marker" % (page, region))
        if text.count(start) != text.count(end):
            raise MarkerError("%s: unbalanced %s marker" % (page, region))
        if text.count(start) == 1 and text.index(start) > text.index(end):
            raise MarkerError("%s: %s end marker comes first" % (page, region))


def indent_of(text: str, pos: int) -> str:
    line_start = text.rfind("\n", 0, pos) + 1
    prefix = text[line_start:pos]
    return prefix if not prefix.strip() else ""


def insert_markers(text: str, region: str) -> str:
    """Put an empty marker pair inside the container for `region`."""
    if has_region(text, region):
        return text
    pattern = CONTAINERS.get(region)
    if not pattern:
        return text
    m = re.search(pattern, text)
    if not m:
        return text
    indent = indent_of(text, m.start())
    body_indent = indent + "  "
    block = (
        "%s>\n" % m.group(0)[: m.group(0).index(">")]
        + body_indent + MARKER.format(region=region, edge="start") + "\n"
        + body_indent + MARKER.format(region=region, edge="end") + "\n"
        + indent + "</%s>" % m.group("tag")
    )
    return text[: m.start()] + block + text[m.end():]


def insert_block_before(text: str, region: str, anchor: str) -> str:
    if has_region(text, region) or anchor not in text:
        return text
    pos = text.index(anchor)
    indent = indent_of(text, pos)
    block = (
        indent + MARKER.format(region=region, edge="start") + "\n"
        + indent + MARKER.format(region=region, edge="end") + "\n"
    )
    return text[:pos] + block + text[pos:]


def fill_region(text: str, region: str, lines: list[str]) -> str:
    start = MARKER.format(region=region, edge="start")
    end = MARKER.format(region=region, edge="end")
    if start not in text:
        return text
    i = text.index(start)
    j = text.index(end)
    indent = indent_of(text, i)
    body_indent = indent + "  "
    body = "".join(body_indent + line + "\n" for line in lines)
    return text[: i + len(start)] + "\n" + body + indent + text[j:]


# ---------------------------------------------------------------------------
# page assembly
# ---------------------------------------------------------------------------
def page_url_for(rel: str, site: str) -> str:
    if rel == "index.html":
        return site + "/"
    if rel.endswith("/index.html"):
        return site + "/" + rel[: -len("index.html")]
    return site + "/" + rel


def process(text: str, rel: str, i18n: dict, tools: list[dict], business: list[dict],
            cats: list[str], site: str) -> tuple[str, list[str]]:
    is_root = "/" not in rel
    home = "en/index.html" if is_root else "index.html"
    root_prefix = "" if is_root else "../"
    tool_prefix = "en/" if is_root else ""
    url = page_url_for(rel, site)
    changed: list[str] = []

    check_markers(text, rel)
    for region in ("header", "footer"):
        text = insert_markers(text, region)

    tool = re.search(r'<body[^>]*\bdata-tool="([^"]+)"', text)
    category = re.search(r'<body[^>]*\bdata-category="([^"]+)"', text)
    is_home = re.search(r"<body[^>]*\bdata-home\b", text)
    is_root_page = re.search(r"<body[^>]*\bdata-root\b", text)
    tool_slug = tool.group(1) if tool else None
    cat_slug = category.group(1) if category else None
    # Tool pages carry only data-tool; chrome.js adds data-category at runtime
    # from TOOL_CATS. Resolve it here so FAQ, related tools and JSON-LD know
    # which category they belong to.
    if tool_slug and not cat_slug:
        cat_slug = next((t["category"] for t in tools if t["slug"] == tool_slug), None)

    regions: list[tuple[str, list[str]]] = []
    if has_region(text, "header"):
        regions.append(("header", header_region(i18n, home, tool_prefix, root_prefix)))
    if has_region(text, "footer"):
        regions.append(("footer", footer_region(i18n, home, root_prefix)))
    if tool_slug and cat_slug:
        for region in ("crumbs", "faq", "related"):
            text = insert_markers(text, region)
        if has_region(text, "crumbs"):
            regions.append(("crumbs", crumbs_region(i18n, cat_slug, tool_slug)))
        if has_region(text, "faq"):
            regions.append(("faq", faq_region(i18n, tool_slug)))
        if has_region(text, "related"):
            regions.append(("related", related_region(i18n, tool_slug, cat_slug, tools)))
        # Cross-category links: a small category does not have enough siblings
        # to give the page useful onward navigation on its own.
        text = insert_block_before(text, "toolcats", '<p class="note" data-i18n="tool.privacy">')
        if has_region(text, "toolcats"):
            regions.append(("toolcats", catrelated_region(i18n, cat_slug)))
    elif cat_slug and "cat-grid" in text:
        text = insert_markers(text, "catgrid")
        text = insert_block_before(text, "catintro", '<div id="cat-grid"')
        text = insert_block_before(text, "catrelated",
                                   '<p class="note"><a href="index.html" data-i18n="category.back">')
        if has_region(text, "crumbs"):
            text = insert_markers(text, "crumbs")
            regions.append(("crumbs", crumbs_region(i18n, cat_slug, None)))
        if has_region(text, "catgrid"):
            regions.append(("catgrid", catgrid_region(i18n, cat_slug, tools, business)))
        if has_region(text, "catintro"):
            regions.append(("catintro", catintro_region(i18n, cat_slug, tools, business)))
        if has_region(text, "catrelated"):
            regions.append(("catrelated", catrelated_region(i18n, cat_slug)))
    elif is_home:
        for region in ("homecats", "homechips", "homepopular", "homesections"):
            text = insert_markers(text, region)
        if has_region(text, "homecats"):
            regions.append(("homecats", home_cats(i18n, tools, cats)))
        if has_region(text, "homechips"):
            regions.append(("homechips", home_chips(i18n)))
        if has_region(text, "homepopular"):
            regions.append(("homepopular", home_popular(i18n, tools)))
        if has_region(text, "homesections"):
            regions.append(("homesections", home_sections(i18n, tools, cats)))

    # Business tool pages also carry data-category="business", but they are
    # individual tools, not the Business directory. Only a page with the
    # category-grid container is a CollectionPage.
    kind = ("tool" if tool_slug else "home" if is_home else
            "root" if is_root_page else
            "category" if cat_slug and "cat-grid" in text else "")
    if kind and not has_region(text, "jsonld"):
        if "</head>" in text:
            text = text.replace(
                "</head>",
                MARKER.format(region="jsonld", edge="start") + "\n"
                + MARKER.format(region="jsonld", edge="end") + "\n</head>",
                1,
            )
    if has_region(text, "jsonld"):
        # An empty list removes markup a previous run may have written for a
        # page type that no longer qualifies.
        regions.append(("jsonld", jsonld_for(kind, i18n, site, url, cat_slug, tools, business) or []))

    for region, lines in regions:
        before = text
        text = fill_region(text, region, lines)
        if text != before:
            changed.append(region)
    return text, changed


def newline_of(raw: bytes) -> str:
    return "\r\n" if b"\r\n" in raw else "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the static regions of the site.")
    parser.add_argument("--check", action="store_true",
                        help="report stale pages without writing them")
    parser.add_argument("--verbose", action="store_true", help="print every page")
    args = parser.parse_args()

    i18n = load_i18n()
    tools, business, cats = load_catalog()
    site = site_url()

    pages: list[Path] = [ROOT / p for p in ROOT_PAGES if (ROOT / p).exists()]
    pages += sorted((ROOT / "en").glob("*.html"))

    stale: list[str] = []
    errors: list[str] = []
    written = 0

    for page in pages:
        raw = page.read_bytes()
        eol = newline_of(raw)
        text = raw.decode("utf-8").replace("\r\n", "\n")
        rel = page.relative_to(ROOT).as_posix()
        try:
            out, changed = process(text, rel, i18n, tools, business, cats, site)
        except MarkerError as exc:
            errors.append(str(exc))
            continue
        out_bytes = out.replace("\n", eol).encode("utf-8")
        if out_bytes == raw:
            if args.verbose:
                print("  ok    %s" % rel)
            continue
        stale.append(rel)
        if args.check:
            print("  stale %s (%s)" % (rel, ", ".join(changed) or "formatting"))
        else:
            page.write_bytes(out_bytes)
            written += 1
            if args.verbose:
                print("  write %s (%s)" % (rel, ", ".join(changed) or "formatting"))

    for err in errors:
        print("  ERROR %s" % err, file=sys.stderr)

    print("prerender: %d pages, %d %s, %d stale" % (
        len(pages), written, "written" if not args.check else "would change", len(stale)))

    if errors:
        return 1
    if args.check and stale:
        print("FAIL — generated regions are out of date; run python tools/prerender.py")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
