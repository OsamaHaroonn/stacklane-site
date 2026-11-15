import io, json, re

SITE = 'https://osamaharoonn.github.io/stacklane-site'
CSP = ("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
       "img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; "
       "base-uri 'none'; form-action 'none'; object-src 'none'")

en = json.load(io.open('assets/i18n/en.json', encoding='utf-8'))
cat_src = io.open('assets/catalog.js', encoding='utf-8').read()
tools = re.findall(r"slug:\s*'([^']+)',\s*category:\s*'([^']+)'", cat_src)

ORDER = ['pdf', 'images', 'text', 'generators', 'calculators', 'converters', 'developer', 'fun', 'business']
BIZ = [('invoice', 'Invoice generator'),
       ('margin-calculator', 'Margin and markup calculator'),
       ('break-even-calculator', 'Break-even calculator'),
       ('calculator', 'Job pricing calculator'),
       ('late-payment-calculator', 'Late payment calculator'),
       ('loss-calculator', 'Cost of admin calculator'),
       ('audit', 'Website audit checklist')]

def esc(t):
    return (t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))

def lede_of(slug):
    s = io.open('en/%s.html' % slug, encoding='utf-8').read()
    m = re.search(r'<p class="lede"[^>]*>(.*?)</p>', s, re.S)
    if not m:
        return ''
    t = re.sub(r'<[^>]+>', '', m.group(1))
    return re.sub(r'\s+', ' ', t).strip()

by_cat = {c: [] for c in ORDER}
for slug, cat in tools:
    t = en['tools'][slug]
    by_cat[cat].append((slug, t['title'], t['desc']))

parts = []
n = 0
for c in ORDER:
    rows = by_cat[c]
    if c == 'business':
        rows = [('../../en/' + s, h, lede_of(s)) for s, h in BIZ]
        href_pref = 'en/'
        rows = []
        for s, h in BIZ:
            rows.append((s, h, lede_of(s)))
    if not rows:
        continue
    parts.append('  <h2 id="%s">%s</h2>' % (c, esc(en['categories'][c]['name'])))
    parts.append('  <div class="grid grid-3">')
    for slug, title, desc in rows:
        n += 1
        parts.append('    <article class="card"><h3><a href="en/%s.html">%s</a></h3><p>%s</p></article>'
                     % (slug, esc(title), esc(desc)))
    parts.append('  </div>')

body = '\n'.join(parts)
print('listed', n)

page = '''<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>All 80 tools — Stacklane</title>
<meta name="description" content="Every Stacklane tool on one page: 73 browser utilities and 7 small-business calculators, grouped by category, each running on your own device.">
<link rel="canonical" href="%(site)s/all-tools.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Stacklane">
<meta property="og:title" content="All 80 tools — Stacklane">
<meta property="og:description" content="Every Stacklane tool on one page, grouped by category: 73 browser utilities and 7 small-business calculators.">
<meta property="og:url" content="%(site)s/all-tools.html">
<meta name="twitter:card" content="summary_large_image">
<meta property="og:image" content="%(site)s/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="theme-color" content="#1d4ed8">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<meta http-equiv="Content-Security-Policy" content="%(csp)s">
<link rel="stylesheet" href="assets/style.css">
</head>
<body data-root>

<header id="site-header"></header>

<main id="main">

<section>
  <div class="container">
    <span class="eyebrow">Index</span>
    <h1>Every tool, on one page</h1>
    <p class="lede">73 single-purpose browser tools and 7 calculators for people running a small service business. All of them work offline once the page has loaded, and none of them send your input anywhere.</p>

%(body)s
  </div>
</section>

</main>

<div id="site-footer"></div>

<script src="assets/config.js"></script>
<script src="assets/i18n.js"></script>
<script src="assets/catalog.js"></script>
<script src="assets/chrome.js"></script>
</body>
</html>
''' % {'site': SITE, 'csp': CSP, 'body': body}

io.open('all-tools.html', 'w', encoding='utf-8').write(page)
