#!/usr/bin/env python3
"""Mechanical layout transform for the generated tool pages.

Adds the two-column wrapper, the desktop sidebar for related tools and
the three hidden ad slots. Tool markup, IDs, labels and text are untouched.
"""
import glob
import io
import re

OPEN_LAYOUT = '  <div class="tool-layout">\n  <div class="tool-main">\n'
SLOT_A = '  <div class="ad-slot" data-slot="A" hidden></div>\n'
SLOT_B = '  <div class="ad-slot" data-slot="B" hidden></div>\n'

RELATED_OLD = re.compile(
    r'\n  <section class="tool-section" id="related-sec">\n'
    r'    <h2 data-i18n="tool\.related">Related tools</h2>\n'
    r'    <div id="related" class="grid grid-4"></div>\n'
    r'  </section>\n')

RELATED_NEW = (
    '\n  </div><!-- /.tool-main -->\n'
    '\n'
    '  <aside class="tool-side">\n'
    '  <section class="tool-section" id="related-sec">\n'
    '    <h2 data-i18n="tool.related">Related tools</h2>\n'
    '    <div id="related" class="grid"></div>\n'
    '  </section>\n'
    '  <div class="ad-slot" data-slot="C" hidden></div>\n'
    '  </aside>\n'
    '  </div><!-- /.tool-layout -->\n')

EXAMPLE_P = re.compile(
    r'(<h2 data-i18n="tool\.example">[^<]*</h2>\n    )<p ')

done, skipped = [], []
for path in sorted(glob.glob('en/*.html')):
    src = io.open(path, encoding='utf-8').read()
    if 'class="tool-panel"' not in src or 'data-slot' in src:
        continue
    if '<nav id="crumbs" class="crumbs"></nav>' not in src:
        skipped.append(path)
        continue

    src = src.replace('<nav id="crumbs" class="crumbs"></nav>\n',
                      '<nav id="crumbs" class="crumbs"></nav>\n' + OPEN_LAYOUT, 1)

    panel_end = ('  <div class="tool-panel">\n'
                 '    <div id="tool-ui" class="tool-ui"></div>\n'
                 '  </div>\n')
    if panel_end not in src:
        skipped.append(path + ' (panel)')
        continue
    src = src.replace(panel_end, panel_end + SLOT_A, 1)

    # Highlighted worked-example box: add the class to the paragraph.
    src, n_ex = EXAMPLE_P.subn(r'\1<p class="worked" ', src, count=1)

    dl = '  </section>\n\n'
    idx = src.find('<dl class="faq-list"')
    if idx == -1:
        skipped.append(path + ' (faq)')
        continue
    close = src.find('</section>\n', src.find('</dl>', idx))
    if close == -1:
        skipped.append(path + ' (faq close)')
        continue
    cut = close + len('</section>\n')
    src = src[:cut] + '\n' + SLOT_B + src[cut:]

    src, n_rel = RELATED_OLD.subn(RELATED_NEW, src, count=1)
    if n_rel != 1:
        skipped.append(path + ' (related)')
        continue

    io.open(path, 'w', encoding='utf-8', newline='').write(src)
    done.append(path)

print('transformed:', len(done))
print('skipped:', len(skipped))
for s in skipped:
    print('  ', s)
