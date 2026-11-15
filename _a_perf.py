import io, os, re, glob, gzip, json

def wp(p):
    return os.path.getsize(p)

def gz(p):
    return len(gzip.compress(io.open(p, 'rb').read(), 9))

core = ['assets/style.css', 'assets/chrome.js', 'assets/config.js', 'assets/home.js']
print('=== asset weight (raw / gzip) ===')
for f in core:
    if os.path.isfile(f):
        print('  %-24s %7d / %6d' % (f, wp(f), gz(f)))

print('\n=== heaviest pages (html gzip + shared gzip) ===')
shared = sum(gz(f) for f in core if os.path.isfile(f))
rows = []
for p in sorted(glob.glob('en/*.html')) + ['index.html', 'privacy.html', 'terms.html', '404.html']:
    rows.append((gz(p) + shared, p, gz(p)))
rows.sort(reverse=True)
for total, p, h in rows[:6]:
    print('  %-38s html %6d gz  total %6d' % (p, h, total))
over = [r for r in rows if r[0] > 150 * 1024]
print('  pages over 150 KB gz:', over)

print('\n=== CSP tokens ===')
csp = {}
for p in sorted(glob.glob('en/*.html'))[:3] + ['index.html', '404.html'] + sorted(glob.glob('ar/*.html'))[:1]:
    s = io.open(p, encoding='utf-8').read()
    m = re.search(r'http-equiv="Content-Security-Policy" content="([^"]*)"', s)
    csp[p] = m.group(1) if m else 'MISSING'
for p, c in csp.items():
    print(' ', p, '->', c)

print('\n=== external references (script/link/img src) ===')
ext = []
for p in glob.glob('en/*.html') + glob.glob('ar/*.html') + ['index.html', 'privacy.html', 'terms.html', '404.html']:
    s = io.open(p, encoding='utf-8').read()
    for m in re.findall(r'<(?:script|img|iframe|link)[^>]*(?:src|href)="(https?://[^"]+)"', s):
        ext.append((p, m))
print('  count', len(ext))
for e in ext[:10]:
    print(' ', e)

print('\n=== localStorage / sessionStorage / cookie use ===')
for f in glob.glob('assets/**/*.js', recursive=True) + glob.glob('assets/*.js'):
    if '.min.' in f:
        continue
    s = io.open(f, encoding='utf-8').read()
    for k in ('localStorage', 'sessionStorage', 'document.cookie', 'indexedDB'):
        if k in s:
            print(' ', f, k, s.count(k))
print('(none listed above = no storage use)')

print('\n=== contrast of the nine type accents on white ===')
def lum(h):
    h = h.lstrip('#')
    c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

style = io.open('assets/style.css', encoding='utf-8').read()
blocks = re.findall(r'body\[data-category="([a-z]+)"\]\s*\{([^}]*)\}', style)
for name, body in blocks:
    m = re.search(r'--blue-600:\s*(#[0-9a-fA-F]{6})', body)
    m7 = re.search(r'--blue-700:\s*(#[0-9a-fA-F]{6})', body)
    if not m:
        continue
    for label, hexv in (('600', m.group(1)), ('700', m7.group(1) if m7 else m.group(1))):
        L = lum(hexv)
        ratio = (1.05) / (L + 0.05)
        flag = 'PASS 4.5:1' if ratio >= 4.5 else 'FAIL'
        print('  %-11s %s %s ratio %.2f %s' % (name, label, hexv, ratio, flag))
