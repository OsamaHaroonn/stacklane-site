import io, os, re, glob

FIX = {
 'bubble-wrap-popper': 'Bubble wrap popper \u2014 a grid of bubbles you can pop',
 'character-counter': 'Character counter \u2014 with and without spaces, and bytes',
 'color-palette-generator': 'Color palette generator \u2014 tints and shades of one colour',
 'csv-json-converter': 'CSV to JSON converter \u2014 CSV in, JSON out, and the reverse',
 'fake-hacker-typer': 'Fake hacker typer \u2014 a toy terminal that types for you',
 'late-payment-calculator': 'Late payment calculator \u2014 what an overdue invoice costs',
 'number-base-converter': 'Number base converter \u2014 binary, octal, decimal and hex',
 'password-strength-checker': 'Password strength checker \u2014 entropy in bits, and a band',
 'slug-generator': 'Slug generator \u2014 a clean URL slug from any page title',
 'sort-lines': 'Sort lines \u2014 A to Z, Z to A, numeric or by line length',
 'time-zone-converter': 'Time zone converter \u2014 one moment in several cities',
 'audit': 'Website audit \u2014 15 checks for speed, trust and finding',
}
DESC_FIX = {
 'audit': 'Fifteen checks across speed, trust, conversion and findability, each scored, with a ranked list of the fixes that are worth doing first. Runs here.',
}

def set_title(path, t):
    s = io.open(path, encoding='utf-8').read()
    s = re.sub(r'<title>.*?</title>', '<title>%s</title>' % t, s, count=1, flags=re.S)
    s = re.sub(r'<meta property="og:title" content="[^"]*">',
               '<meta property="og:title" content="%s">' % t.replace('"', '&quot;'), s, count=1)
    s = re.sub(r'<meta name="twitter:title" content="[^"]*">',
               '<meta name="twitter:title" content="%s">' % t.replace('"', '&quot;'), s, count=1)
    io.open(path, 'w', encoding='utf-8', newline='\n').write(s)

def set_desc(path, d):
    s = io.open(path, encoding='utf-8').read()
    s = re.sub(r'<meta name="description" content="[^"]*">',
               '<meta name="description" content="%s">' % d.replace('"', '&quot;'), s, count=1)
    s = re.sub(r'<meta property="og:description" content="[^"]*">',
               '<meta property="og:description" content="%s">' % d.replace('"', '&quot;'), s, count=1)
    s = re.sub(r'<meta name="twitter:description" content="[^"]*">',
               '<meta name="twitter:description" content="%s">' % d.replace('"', '&quot;'), s, count=1)
    io.open(path, 'w', encoding='utf-8', newline='\n').write(s)

for slug, t in FIX.items():
    p = 'en/%s.html' % slug
    set_title(p, t)
for slug, d in DESC_FIX.items():
    set_desc('en/%s.html' % slug, d)

bad = []
titles, descs = {}, {}
for p in sorted(glob.glob('en/*.html')):
    s = io.open(p, encoding='utf-8').read()
    t = re.search(r'<title>(.*?)</title>', s, re.S).group(1)
    d = re.search(r'<meta name="description" content="([^"]*)"', s)
    d = d.group(1) if d else ''
    titles.setdefault(t, []).append(p)
    descs.setdefault(d, []).append(p)
    name = os.path.basename(p)
    if not (48 <= len(t) <= 62):
        bad.append((name, 'T', len(t), t))
    if not (138 <= len(d) <= 162):
        bad.append((name, 'D', len(d), d[:60]))
print('out of range:', len(bad))
for b in bad:
    print(' ', b)
print('duplicate titles:', [(k, v) for k, v in titles.items() if len(v) > 1])
print('duplicate descs:', [(k[:50], v) for k, v in descs.items() if len(v) > 1])
print('pages:', len(glob.glob('en/*.html')))
