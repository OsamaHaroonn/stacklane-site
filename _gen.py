#!/usr/bin/env python3
"""Generate tool pages + en.json entries + catalog rows + sitemap URLs.

Temporary build helper for this branch. Never committed.
Usage: python _gen.py <spec.json> page|entry|meta  [slug ...]
"""
import io
import json
import os
import re
import sys

SITE = 'https://osamaharoonn.github.io/stacklane-site'
CAT_NAMES = {
    'pdf': 'PDF', 'images': 'Images', 'text': 'Text', 'generators': 'Generators',
    'calculators': 'Calculators', 'converters': 'Converters',
    'developer': 'Developer', 'business': 'Business', 'fun': 'Fun',
}
CSP = ("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
       "img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; "
       "base-uri 'none'; form-action 'none'; object-src 'none'")

PAGE = '''<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>{title_tag}</title>
<meta name="description" content="{meta}">
<link rel="canonical" href="{site}/en/{slug}.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Stacklane Tools">
<meta property="og:title" content="{title_tag}">
<meta property="og:description" content="{meta}">
<meta property="og:url" content="{site}/en/{slug}.html">
<meta name="twitter:card" content="summary_large_image">
<meta property="og:image" content="{site}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Stacklane Tools">
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<meta http-equiv="Content-Security-Policy" content="{csp}">
<link rel="stylesheet" href="../assets/style.css">
</head>
<body data-tool="{slug}">
<a class="skip-link" href="#main">Skip to content</a>
<div id="site-header"></div>

<main id="main" class="wrap">
  <nav id="crumbs" class="crumbs"></nav>
  <div class="tool-layout">
  <div class="tool-main">

  <header class="tool-head">
    <p class="card-kicker" data-i18n="categories.{cat}.name">{catname}</p>
    <h1 data-i18n="tools.{slug}.title">{h1}</h1>
    <p class="lede" data-i18n="tools.{slug}.lede">{lede}</p>
    <p class="badge-row"><span class="badge badge-good" data-i18n="tool.runsLocal">Runs locally in your browser</span></p>
  </header>

  <div class="tool-panel">
    <div id="tool-ui" class="tool-ui"></div>
  </div>
  <div class="ad-slot" data-slot="A" hidden></div>

  <section class="tool-section">
    <h2 data-i18n="tool.how">How it works</h2>
    <p data-i18n="tools.{slug}.how">{how}</p>
  </section>

  <section class="tool-section">
    <h2 data-i18n="tool.example">Worked example</h2>
    <p class="worked" data-i18n="tools.{slug}.example">{example}</p>
  </section>
{source}

  <section class="tool-section">
    <h2 data-i18n="tool.faq">Questions and answers</h2>
    <dl class="faq-list" data-faq="tools.{slug}.faq"></dl>
  </section>

  <div class="ad-slot" data-slot="B" hidden></div>

  </div><!-- /.tool-main -->

  <aside class="tool-side">
  <section class="tool-section" id="related-sec">
    <h2 data-i18n="tool.related">Related tools</h2>
    <div id="related" class="grid"></div>
  </section>
  <div class="ad-slot" data-slot="C" hidden></div>
  </aside>
  </div><!-- /.tool-layout -->

  <p><a id="back-cat" href="{cat}.html"></a></p>
  <p class="note" data-i18n="tool.privacy">Everything runs in your browser: your text, file or value is never uploaded anywhere.</p>
</main>

<div id="site-footer"></div>
<script src="../assets/config.js"></script>
<script src="../assets/i18n.js"></script>
<script src="../assets/catalog.js"></script>
<script src="../assets/tools/shared.js"></script>
<script src="../assets/tools/{slug}.js"></script>
<script src="../assets/chrome.js"></script>
</body>
</html>
'''


def esc(s):
    return (s.replace('&', '&amp;').replace('<', '&lt;')
             .replace('>', '&gt;').replace('"', '&quot;'))


def load(path):
    with io.open(path, encoding='utf-8') as f:
        data = json.load(f)
    return data['tools'] if isinstance(data, dict) and 'tools' in data else data


def check(specs):
    ok = True
    titles, descs = {}, {}
    for s in specs:
        slug = s['slug']
        if len(s['title_tag']) > 60:
            print('  TITLE %s %d' % (slug, len(s['title_tag']))); ok = False
        if len(s['meta']) > 160:
            print('  META %s %d' % (slug, len(s['meta']))); ok = False
        words = len(s['how'].split())
        if not 80 <= words <= 150:
            print('  HOW %s %d words' % (slug, words)); ok = False
        if len(s['faq']) != 5:
            print('  FAQ %s %d items' % (slug, len(s['faq']))); ok = False
        # every ui('key') used by the script must exist
        js = 'assets/tools/%s.js' % slug
        if not os.path.exists(js):
            print('  NO SCRIPT for %s' % slug); ok = False
            continue
        src = io.open(js, encoding='utf-8').read()
        used = set(re.findall(r"ui\('([a-zA-Z]+)'", src))
        missing = sorted(k for k in used if k not in s['ui'])
        if missing:
            print('  UI MISSING %s: %s' % (slug, ', '.join(missing))); ok = False
        unused = sorted(k for k in s['ui'] if k not in used)
        if unused:
            print('  UI UNUSED  %s: %s' % (slug, ', '.join(unused)))
        titles[s['title_tag']] = titles.get(s['title_tag'], 0) + 1
        descs[s['meta']] = descs.get(s['meta'], 0) + 1
    for k, n in list(titles.items()) + list(descs.items()):
        if n > 1:
            print('  DUPLICATE within batch:', k[:60]); ok = False
    print('spec check:', 'ok' if ok else 'FAILED')
    return ok


def page(specs, only):
    for s in specs:
        if only and s['slug'] not in only:
            continue
        source = ''
        if s.get('source_url'):
            source = ('  <section class="tool-section">\n'
                      '    <p class="note">Source: <a href="%s">%s</a></p>\n'
                      '  </section>\n' % (esc(s['source_url']), esc(s['source_label'])))
        html = PAGE.format(
            title_tag=esc(s['title_tag']), meta=esc(s['meta']),
            slug=s['slug'], cat=s['cat'], catname=CAT_NAMES[s['cat']],
            h1=esc(s['h1']), lede=esc(s['lede']), how=esc(s['how']),
            example=esc(s['example']), source=source, site=SITE, csp=CSP)
        with io.open(os.path.join('en', s['slug'] + '.html'), 'w',
                     encoding='utf-8', newline='') as f:
            f.write(html)
        print('page', s['slug'])


def entry(specs, only):
    path = os.path.join('assets', 'i18n', 'en.json')
    data = json.load(io.open(path, encoding='utf-8'))
    for s in specs:
        if only and s['slug'] not in only:
            continue
        data['tools'][s['slug']] = {
            'title': s['h1'], 'desc': s['meta'], 'lede': s['lede'],
            'how': s['how'], 'example': s['example'], 'faq': s['faq'],
            'ui': s['ui'],
        }
        print('entry', s['slug'])
    with io.open(path, 'w', encoding='utf-8', newline='') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def meta(specs):
    # catalog rows
    path = os.path.join('assets', 'catalog.js')
    text = io.open(path, encoding='utf-8').read()
    rows = []
    for s in specs:
        if "{ slug: '%s'," % s['slug'] in text:
            continue
        rows.append("  { slug: '%s', category: '%s', keywords: '%s' }," %
                    (s['slug'], s['cat'], s['keywords']))
    if rows:
        marker = '\n];\n\nwindow.TOOL_CATS'
        i = text.index(marker)
        text = text[:i] + '\n' + '\n'.join(rows) + text[i:]
        io.open(path, 'w', encoding='utf-8', newline='').write(text)
        print('catalog +%d' % len(rows))
    else:
        print('catalog unchanged')

    # sitemap
    spath = 'sitemap.xml'
    sm = io.open(spath, encoding='utf-8').read()
    adds = []
    for s in specs:
        url = '%s/en/%s.html' % (SITE, s['slug'])
        if url in sm:
            continue
        adds.append('  <url>\n    <loc>%s</loc>\n    <changefreq>monthly</changefreq>\n'
                    '    <priority>0.7</priority>\n  </url>\n' % url)
    if adds:
        sm = sm.replace('</urlset>', ''.join(adds) + '</urlset>')
        io.open(spath, 'w', encoding='utf-8', newline='').write(sm)
        print('sitemap +%d' % len(adds))
    else:
        print('sitemap unchanged')


if __name__ == '__main__':
    specs = load(sys.argv[1])
    cmd = sys.argv[2]
    only = sys.argv[3:]
    if cmd == 'check':
        sys.exit(0 if check(specs) else 1)
    elif cmd == 'page':
        page(specs, only)
    elif cmd == 'entry':
        entry(specs, only)
    elif cmd == 'meta':
        meta(specs)
    elif cmd == 'pages+entries':
        page(specs, only)
        entry(specs, only)
