"""Static audit — every English page, no browser. QA helper, never committed."""
import io, json, os, re, glob, urllib.parse, sys
from collections import Counter

ROOT = os.getcwd()
SITE = 'https://osamaharoonn.github.io/stacklane-site'
PAGES = sorted(glob.glob('en/*.html')) + ['index.html', 'privacy.html', 'terms.html', '404.html']
CSP_OK = "default-src 'self'"

problems = []
def p(kind, page, detail):
    problems.append((kind, page, detail))

def read(p):
    return io.open(p, encoding='utf-8').read()

titles, descs = {}, {}
ids = {}
jsonld_bad = []
links = []
ext = []
i18n_keys = set()

for page in PAGES:
    t = read(page)
    # title
    m = re.search(r'<title>(.*?)</title>', t, re.S)
    title = m.group(1).strip() if m else None
    titles[page] = title
    if not title:
        p('no-title', page, '')
    elif not (30 <= len(title) <= 65):
        p('title-length', page, '%d %r' % (len(title), title))
    # description
    m = re.search(r'<meta name="description" content="(.*?)"', t, re.S)
    d = m.group(1).strip() if m else None
    descs[page] = d
    if not d:
        p('no-desc', page, '')
    elif not (120 <= len(d) <= 165):
        p('desc-length', page, '%d %r' % (len(d), d[:70]))
    # h1
    n = len(re.findall(r'<h1[ >]', t))
    if n != 1:
        p('h1-count', page, str(n))
    # canonical / og
    c = re.search(r'<link rel="canonical" href="([^"]+)"', t)
    if not c:
        p('no-canonical', page, '')
    elif 'osamaharoonn.github.io' not in c.group(1):
        p('canonical-host', page, c.group(1))
    if 'og:url' not in t:
        p('no-og-url', page, '')
    if 'og:title' not in t:
        p('no-og-title', page, '')
    if 'og:description' not in t:
        p('no-og-desc', page, '')
    # lang / viewport / charset
    if not re.search(r'<html[^>]+lang="en"', t):
        p('no-lang', page, '')
    if 'name="viewport"' not in t:
        p('no-viewport', page, '')
    if 'charset' not in t.lower():
        p('no-charset', page, '')
    # CSP
    mc = re.search(r'http-equiv="Content-Security-Policy" content="([^"]+)"', t)
    if not mc:
        p('no-csp', page, '')
    else:
        if CSP_OK not in mc.group(1):
            p('csp-weird', page, mc.group(1)[:90])
        if 'us.i.posthog' in mc.group(1):
            p('csp-posthog', page, '')
    # inline scripts
    for s in re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', t, re.S):
        if s.strip():
            p('inline-script', page, s.strip()[:60])
    # external resources
    for u in re.findall(r'(?:src|href)="(https?://[^"]+)"', t):
        if 'osamaharoonn.github.io' not in u and 'www.w3.org' not in u:
            ext.append((page, u))
    # target=_blank without rel
    for tag in re.findall(r'<a\b[^>]*target="_blank"[^>]*>', t):
        if 'noopener' not in tag:
            p('no-noopener', page, tag[:80])
    # images without alt
    for img in re.findall(r'<img\b[^>]*>', t):
        if 'alt=' not in img:
            p('img-no-alt', page, img[:70])
    # duplicate ids in static markup
    found = re.findall(r'\sid="([^"]+)"', t)
    dup = [k for k, v in Counter(found).items() if v > 1]
    if dup:
        p('dup-id', page, ','.join(dup))
    ids[page] = found
    # JSON-LD
    for blk in re.findall(r'<script type="application/ld\+json">(.*?)</script>', t, re.S):
        try:
            json.loads(blk)
        except Exception as e:
            jsonld_bad.append((page, str(e)[:80]))
    # internal links
    for h in re.findall(r'href="([^"]+)"', t):
        if h.startswith(('http', 'mailto:', '#', 'data:', 'javascript:', 'tel:')) or not h.strip():
            continue
        target = os.path.normpath(os.path.join(os.path.dirname(page), urllib.parse.unquote(h.split('#')[0].split('?')[0])))
        links.append((page, h, target))
        if not os.path.exists(target):
            p('broken-link', page, h)
    # i18n keys referenced
    i18n_keys.update(re.findall(r'data-i18n="([^"]+)"', t))
    i18n_keys.update(re.findall(r'data-faq="([^"]+)"', t))

print('pages audited:', len(PAGES))
print('internal links checked:', len(links))
print('json-ld blocks invalid:', jsonld_bad or 'none')
print('external URLs in markup:', ext or 'none')

# duplicates
for name, table in (('title', titles), ('description', descs)):
    seen = {}
    for k, v in table.items():
        seen.setdefault(v, []).append(k)
    for v, ks in seen.items():
        if len(ks) > 1 and v:
            p('dup-' + name, ','.join(ks), v[:60])

# sitemap
sm = read('sitemap.xml')
locs = set(re.findall(r'<loc>(.*?)</loc>', sm))
for page in PAGES:
    if page in ('404.html',):
        continue
    rel = page.replace(chr(92), '/')
    url = SITE + '/' + ('' if rel == 'en/index.html' else rel)
    if url not in locs:
        p('sitemap-missing', page, url)
for loc in locs:
    rel = loc.replace(SITE + '/', '') or 'index.html'
    if rel.replace('/', chr(92)) not in PAGES and rel + '.html' not in PAGES and rel not in ('index.html',):
        p('sitemap-extra', rel, loc)

# i18n
en = json.load(io.open('assets/i18n/en.json', encoding='utf-8'))
def has(key):
    cur = en
    for part in key.split('.'):
        if not isinstance(cur, dict) or part not in cur:
            return False
        cur = cur[part]
    return True
missing_keys = sorted(k for k in i18n_keys if not has(k))
if missing_keys:
    p('i18n-missing', 'en.json', ','.join(missing_keys[:20]))

# tool JS key usage vs en.json
for js in sorted(glob.glob('assets/tools/*.js')):
    slug = os.path.basename(js)[:-3]
    src = read(js)
    keys = set(re.findall(r"ui\('([A-Za-z0-9_]+)'", src))
    base = en.get('tools', {}).get(slug, {}).get('ui', {})
    if base is None:
        p('i18n-no-block', js, slug)
        continue
    miss = sorted(k for k in keys if k not in base)
    if miss:
        p('i18n-tool-missing', js, ','.join(miss))

print('\n== problems (%d) ==' % len(problems))
for kind, page, detail in problems:
    print('%-22s %-40s %s' % (kind, page, detail))
