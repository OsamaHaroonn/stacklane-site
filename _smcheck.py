import glob, io, re, urllib.parse
sm = io.open('sitemap.xml', encoding='utf-8').read()
paths = {urllib.parse.urlparse(l).path.replace('/stacklane-site/', '').strip('/')
         for l in re.findall(r'<loc>([^<]+)</loc>', sm)}
public = {f.replace(chr(92), '/') for f in glob.glob('en/*.html')} | {'index.html', 'privacy.html', 'terms.html'}
print('sitemap', len(paths), 'public', len(public))
print('missing:', sorted(public - paths))
print('extra:', sorted(paths - public))
