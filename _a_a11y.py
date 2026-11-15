import io, re, glob, json, os

en = json.load(io.open('assets/i18n/en.json', encoding='utf-8'))
ar = json.load(io.open('assets/i18n/ar.json', encoding='utf-8'))

print('=== A11Y: inputs without a matching <label for> (en pages, static markup) ===')
bad = []
for p in sorted(glob.glob('en/*.html')) + ['index.html', 'privacy.html', 'terms.html', '404.html']:
    s = io.open(p, encoding='utf-8').read()
    fors = set(re.findall(r'<label[^>]*\bfor="([^"]+)"', s))
    aria = set(re.findall(r'aria-label(?:ledby)?="[^"]*"[^>]*\sid="([^"]+)"', s))
    for m in re.finditer(r'<(input|select|textarea)\b([^>]*)>', s):
        attrs = m.group(2)
        if 'type="hidden"' in attrs:
            continue
        im = re.search(r'\bid="([^"]+)"', attrs)
        if not im:
            bad.append((p, 'control with no id', m.group(0)[:60]))
            continue
        i = im.group(1)
        if i not in fors and 'aria-label' not in attrs and i not in aria:
            bad.append((p, i, m.group(0)[:60]))
print('  count', len(bad))
for b in bad[:10]:
    print(' ', b)

print('\n=== A11Y: heading order (h1..h4 skips) ===')
skips = []
for p in sorted(glob.glob('en/*.html'))[:20]:
    s = io.open(p, encoding='utf-8').read()
    hs = [int(x) for x in re.findall(r'<h([1-4])[^>]*>', s)]
    prev = 0
    for h in hs:
        if prev and h > prev + 1:
            skips.append((p, prev, h))
        prev = h
print('  skips:', len(skips), skips[:6])

print('\n=== A11Y: buttons with no text and no aria-label ===')
btns = []
for p in sorted(glob.glob('en/*.html'))[:12]:
    s = io.open(p, encoding='utf-8').read()
    for m in re.findall(r'<button\b[^>]*>(.*?)</button>', s, re.S):
        if not re.sub(r'<[^>]+>|\s', '', m):
            btns.append(p)
print('  empty static buttons:', len(btns))

print('\n=== focus-visible rules in the stylesheet ===')
css = io.open('assets/style.css', encoding='utf-8').read()
print('  :focus-visible occurrences:', css.count(':focus-visible'))
print('  outline: none occurrences:', css.count('outline: none'), '(should be paired with a replacement)')
print('  prefers-reduced-motion block:', 'prefers-reduced-motion' in css)
print('  aria-live in shared.js:', io.open('assets/tools/shared.js', encoding='utf-8').read().count('aria-live'))

print('\n=== ARABIC: missing keys vs English ===')
def flat(d, pre=''):
    out = {}
    for k, v in d.items():
        key = pre + k
        if isinstance(v, dict):
            out.update(flat(v, key + '.'))
        else:
            out[key] = v
    return out
E, A = flat(en), flat(ar)
missing = [k for k in E if k not in A]
print('  english keys', len(E), 'arabic keys', len(A))
print('  missing in ar:', len(missing), missing[:8])

print('\n=== ARABIC: untranslated (identical to English) strings ===')
same = [k for k in A if k in E and A[k] == E[k] and len(str(A[k])) > 3]
print('  identical values:', len(same), same[:8])

print('\n=== ARABIC: pages vs English ===')
enp = set(os.path.basename(p) for p in glob.glob('en/*.html'))
arp = set(os.path.basename(p) for p in glob.glob('ar/*.html'))
print('  en pages', len(enp), 'ar pages', len(arp))
print('  ar-only:', sorted(arp - enp))
tools_en = set(k for k in en.get('tools', {}))
print('  tools with an ar page:', len([t for t in tools_en if t + '.html' in arp]), 'of', len(tools_en))

print('\n=== ARABIC: lang/dir and latin text in body ===')
for p in sorted(glob.glob('ar/*.html'))[:4]:
    s = io.open(p, encoding='utf-8').read()
    html = re.search(r'<html[^>]*>', s).group(0)
    body = s.split('<body', 1)[-1]
    latin = re.findall(r'>([A-Za-z][A-Za-z ,.\'-]{12,})<', body)
    print(' ', os.path.basename(p), '|', 'dir' in html and 'rtl' in html, '| latin runs:', len(latin), latin[:2])
