#!/usr/bin/env python3
"""Business pages: add the inline brand mark and two hidden ad slots.

Only structure is added. Their logic, ids, text and CSP stay untouched.
"""
import io
import re

PAGES = ['invoice', 'calculator', 'margin-calculator', 'break-even-calculator',
         'late-payment-calculator', 'loss-calculator', 'audit']

MARK = (
    '<svg class="brand-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" '
    'focusable="false"><path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z"></path>'
    '<path d="M4 12.5 12 17l8-4.5"></path><path d="M4 17.5 12 22l8-4.5"></path></svg>')

SLOT_A = '\n<div class="ad-slot" data-slot="A" hidden></div>\n'
SLOT_B = '\n<div class="ad-slot" data-slot="B" hidden></div>\n'

for slug in PAGES:
    path = 'en/%s.html' % slug
    src = io.open(path, encoding='utf-8').read()
    if 'brand-mark' in src:
        print('already done:', path)
        continue

    # 1. brand mark inside the hand-written header link
    src, n = re.subn(r'(<a class="brand" href="index.html">)', r'\1' + MARK, src, count=1)
    if not n:
        print('  no brand hook:', path)

    # 2. slot A below the tool card (the section that holds .wrap app)
    m = re.search(r'<section[^>]*>\s*\n\s*<div class="wrap app">', src)
    if m:
        close = src.find('</section>', m.start())
        if close != -1:
            cut = close + len('</section>')
            src = src[:cut] + SLOT_A + src[cut:]
    else:
        print('  no app section:', path)

    # 3. slot B before the related-tools section, else before </main>
    rel = re.search(r'<section[^>]*>(?:(?!</section>).)*?[Rr]elated', src, re.S)
    if rel:
        src = src[:rel.start()] + SLOT_B.lstrip('\n') + src[rel.start():]
    else:
        main_close = src.find('</main>')
        if main_close != -1:
            src = src[:main_close] + SLOT_B + src[main_close:]

    io.open(path, 'w', encoding='utf-8', newline='').write(src)
    print('updated:', path)
