import os, re, io, glob, urllib.parse
from collections import Counter

SITE = 'https://osamaharoonn.github.io/stacklane-site'
en = sorted(glob.glob('en/*.html'))
print('en pages:', len(en))

titles, descs, h1s, canon = {}, {}, {}, {}
for p in en:
    t = io.open(p, encoding='utf-8').read()
    m = re.search(r'<title>(.*?)</title>', t, re.S)
    titles[p] = m.group(1).strip() if m else None
    m = re.search(r'<meta name="description" content="(.*?)">', t, re.S)
    descs[p] = m.group(1).strip() if m else None
    h1s[p] = len(re.findall(r'<h1[ >]', t))
    m = re.search(r'<link rel="canonical" href="(.*?)">', t)
    canon[p] = m.group(1).strip() if m else None


def dup(d):
    seen = {}
    out = []
    for k, v in d.items():
        if v is None:
            out.append(('MISSING', k))
            continue
        seen.setdefault(v, []).append(k)
    for v, ks in seen.items():
        if len(ks) > 1:
            out.append((v[:60], [os.path.basename(x) for x in ks]))
    return out


print('duplicate titles:', dup(titles) or 'none')
print('duplicate descriptions:', dup(descs) or 'none')
print('titles over 60:', [(os.path.basename(p), len(t)) for p, t in titles.items() if t and len(t) > 60] or 'none')
print('descriptions over 160:', [(os.path.basename(p), len(d)) for p, d in descs.items() if d and len(d) > 160] or 'none')
print('h1 != 1:', [(os.path.basename(p), n) for p, n in h1s.items() if n != 1] or 'none')
badc = []
for p, c in canon.items():
    want = SITE + '/' + p.replace(chr(92), chr(47))
    if p.endswith('index.html'):
        want = SITE + '/'
    if c != want:
        badc.append((os.path.basename(p), c))
print('canonical problems:', badc or 'none')

cat = io.open('assets/catalog.js', encoding='utf-8').read()
rows = re.findall(r"\{ slug: '([^']+)',\s*category: '([^']+)'", cat)
biz = re.findall(r"\{ slug: '([^']+)',\s+name:", cat)
print('catalog tools:', len(rows), 'business:', len(biz), 'cards:', len(rows) + len(biz))
print('per category:', dict(Counter(c for _, c in rows)))

sm = io.open('sitemap.xml', encoding='utf-8').read()
locs = re.findall(r'<loc>(.*?)</loc>', sm)
missing = []
for p in en:
    rel = p.replace(chr(92), chr(47))
    url = SITE + '/' + rel
    if rel.endswith('index.html'):
        url = SITE + '/'
    if url not in locs:
        missing.append(url)
for extra in ('privacy.html', 'terms.html'):
    if os.path.exists(extra) and (SITE + '/' + extra) not in locs:
        missing.append(extra)
print('sitemap urls:', len(locs), 'missing:', missing or 'none')

missing_files = []
bad = []
checked = 0
for p in en + glob.glob('*.html'):
    stamp = io.open(p, encoding='utf-8').read()
    for h in re.findall(r'href="([^"]+)"', stamp):
        if h.startswith(('http', 'mailto:', '#', 'data:', 'javascript:')) or not h.strip():
            continue
        target = os.path.normpath(os.path.join(os.path.dirname(p), urllib.parse.unquote(h.split('#')[0])))
        checked += 1
        if not os.path.exists(target):
            bad.append((p, h))
print('local links checked:', checked, 'broken:', bad or 'none')

# catalog entries must have pages, pages must have catalog rows
slugs = [s for s, _ in rows] + biz
pages = [os.path.basename(p)[:-5] for p in en if os.path.basename(p) != 'index.html']
cats = {'pdf', 'images', 'text', 'generators', 'calculators', 'converters', 'developer', 'business', 'fun'}
pages_only = [s for s in pages if s not in slugs and s not in cats]
cat_only = [s for s in slugs if s not in pages]
print('pages without catalog row:', pages_only or 'none')
print('catalog rows without page:', cat_only or 'none')
