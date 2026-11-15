"""Static security + accessibility scan. QA helper only, never committed."""
import io, os, re, glob, json, html

ROOT = os.getcwd()
PAGES = sorted(glob.glob('en/*.html') + glob.glob('*.html'))
JS = sorted(glob.glob('assets/**/*.js', recursive=True))

DANGER = [
    ('innerHTML', re.compile(r'\.innerHTML\s*=')),
    ('outerHTML', re.compile(r'\.outerHTML\s*=')),
    ('insertAdjacentHTML', re.compile(r'insertAdjacentHTML')),
    ('document.write', re.compile(r'document\.write')),
    ('eval(', re.compile(r'(?<![.\w])eval\s*\(')),
    ('new Function', re.compile(r'new\s+Function\s*\(')),
    ('string setTimeout', re.compile(r'setTimeout\s*\(\s*[\'"]')),
    ('location read', re.compile(r'location\.(hash|search|href)')),
]

print('== dangerous APIs in assets/**/*.js ==')
for f in JS:
    src = io.open(f, encoding='utf-8').read()
    hits = [(n, len(p.findall(src))) for n, p in DANGER]
    hits = [h for h in hits if h[1]]
    if hits:
        print(' ', f, hits)

print('\n== external references (http/https not same-origin) ==')
EXT = re.compile(r'(?:src|href)\s*=\s*[\'"]https?://([^\'"/]+)')
allowed = {'osamaharoonn.github.io'}
bad = []
for f in PAGES:
    src = io.open(f, encoding='utf-8').read()
    for host in EXT.findall(src):
        if host not in allowed:
            bad.append((f, host))
print(' unusual hosts:', sorted(set(bad)) or 'none')

print('\n== target=_blank without rel noopener ==')
for f in PAGES:
    for m in re.finditer(r'<a\b[^>]*target="_blank"[^>]*>', io.open(f, encoding='utf-8').read()):
        if 'noopener' not in m.group(0):
            print(' ', f, m.group(0)[:120])
print(' (blank line above = none)')

print('\n== CSP per page ==')
csp = {}
for f in PAGES:
    src = io.open(f, encoding='utf-8').read()
    m = re.search(r'http-equiv="Content-Security-Policy" content="([^"]+)"', src)
    csp.setdefault(m.group(1) if m else 'MISSING', []).append(f)
for k, v in csp.items():
    print(' ', len(v), 'pages ::', (k[:150] if k != 'MISSING' else k))
    if k == 'MISSING' or len(v) < 40:
        print('    ', v[:12])

print('\n== inline <script> blocks / on* handlers ==')
for f in PAGES:
    src = io.open(f, encoding='utf-8').read()
    inline = [m for m in re.finditer(r'<script(?![^>]*\bsrc=)[^>]*>', src)]
    if inline:
        print(' inline script:', f, len(inline))
    for m in re.finditer(r'\son(?:click|load|error|input|change|submit|mouseover)=', src):
        print(' on-handler:', f)
print(' (blank above = none)')

print('\n== forms / labels ==')
unlabeled = []
for f in PAGES:
    src = io.open(f, encoding='utf-8').read()
    ids = set(re.findall(r'<input[^>]*\bid="([^"]+)"', src))
    labelled = set(re.findall(r'<label[^>]*\bfor="([^"]+)"', src))
    aria = set(re.findall(r'<input[^>]*\bid="([^"]+)"[^>]*aria-label', src))
    for i in sorted(ids - labelled - aria):
        unlabeled.append((f, i))
print(' inputs without label/aria-label:', len(unlabeled))
for u in unlabeled[:20]:
    print('  ', u)

print('\n== headings ==')
for f in PAGES:
    src = io.open(f, encoding='utf-8').read()
    h1 = len(re.findall(r'<h1\b', src))
    if h1 != 1:
        print(' ', f, 'h1 count', h1)

print('\n== duplicate ids ==')
for f in PAGES:
    src = io.open(f, encoding='utf-8').read()
    ids = re.findall(r'\bid="([^"]+)"', src)
    dup = sorted({i for i in ids if ids.count(i) > 1})
    if dup:
        print(' ', f, dup[:8])

print('\n== images without alt ==')
for f in PAGES:
    src = io.open(f, encoding='utf-8').read()
    for m in re.finditer(r'<img\b[^>]*>', src):
        if 'alt=' not in m.group(0):
            print(' ', f, m.group(0)[:100])
print(' (blank above = none)')
