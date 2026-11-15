import io, re, glob, os
sm = io.open('sitemap.xml', encoding='utf-8').read()
locs = re.findall(r'<loc>(.*?)</loc>', sm)
base = 'https://osamaharoonn.github.io/stacklane-site/'
paths = []
for l in locs:
    p = l[len(base):] if l.startswith(base) else l
    p = p.rstrip('/')
    if p == '':
        p = 'index.html'
    paths.append(p)
have = set(paths)
allp = set(p.replace(os.sep, '/') for p in glob.glob('en/*.html') + glob.glob('ar/*.html'))
allp |= {'index.html', 'privacy.html', 'terms.html', '404.html'}
print('locs', len(locs), 'unique', len(set(locs)))
print('IN SITEMAP BUT NOT A FILE:', sorted(have - allp))
print('FILES NOT IN SITEMAP:', sorted(allp - have))
# hreflang + robots
for p in ['en/loan-calculator.html', 'en/index.html', 'index.html']:
    s = io.open(p, encoding='utf-8').read()
    print('---', p)
    for pat in ['hreflang', 'name="robots"', 'rel="alternate"']:
        for m in re.findall(r'[^\n]*' + re.escape(pat) + r'[^\n]*', s)[:3]:
            print('   ', m.strip()[:140])
print('robots.txt:')
print(io.open('robots.txt', encoding='utf-8').read() if os.path.isfile('robots.txt') else 'MISSING')
