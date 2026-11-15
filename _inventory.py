"""Content inventory for the English pages. QA helper, never committed."""
import glob, io, json, os, re

CAT = json.load(io.open('assets/i18n/en.json', encoding='utf-8'))
rows = []


def text_of(v):
    return v if isinstance(v, str) else ''


pages = sorted(glob.glob('en/*.html'))
for p in pages:
    s = io.open(p, encoding='utf-8').read()
    slug = os.path.basename(p)[:-5]
    body = re.search(r'<body[^>]*>', s)
    bodytag = body.group(0) if body else ''
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    lede = re.search(r'class="lede"[^>]*>(.*?)</p>', s, re.S)
    faq = len(re.findall(r'<details', s))
    worked = 'class="worked"' in s or 'worked' in s
    how = 'how' in s
    related = s.count('related-card') + len(re.findall(r'<a class="card tool-card', s))
    note = re.search(r'estimate|not advice|not legal|not medical|check with', s, re.I)
    inputs = len(re.findall(r'<input\b', s))
    selects = len(re.findall(r'<select\b', s))
    has_example_btn = bool(re.search(r'try an example|example values|Use example', s, re.I))
    rows.append({
        'page': p, 'slug': slug, 'bytes': len(s),
        'h1': re.sub(r'<[^>]+>', '', h1.group(1)).strip() if h1 else '',
        'lede_len': len(re.sub(r'<[^>]+>', '', lede.group(1))) if lede else 0,
        'faq': faq, 'how': how, 'worked': worked, 'related': related,
        'note': bool(note), 'inputs': inputs, 'selects': selects,
        'example_btn': has_example_btn,
        'body_attrs': bodytag[:80],
    })

json.dump(rows, io.open('_inventory.json', 'w', encoding='utf-8'), indent=1)

tools = [r for r in rows if 'data-tool' in r['body_attrs']]
cats = [r for r in rows if r['slug'] in
        ('pdf', 'images', 'text', 'generators', 'calculators', 'converters',
         'developer', 'fun', 'business')]
print('pages', len(rows), '| tools', len(tools), '| categories', len(cats))

print('\n-- tools with no FAQ --')
print([r['slug'] for r in tools if r['faq'] == 0])
print('\n-- tools with FAQ < 3 --')
print([(r['slug'], r['faq']) for r in tools if 0 < r['faq'] < 3])
print('\n-- no example button --')
print(len([r for r in tools if not r['example_btn']]), 'of', len(tools))
print('\n-- no safety note (financial/health set) --')
risky = ['loan-calculator', 'mortgage-calculator', 'compound-interest-calculator',
         'savings-goal-calculator', 'roi-calculator', 'vat-calculator', 'tip-split-calculator',
         'discount-calculator', 'percentage-calculator', 'salary-to-hourly', 'bmi-calculator',
         'age-calculator', 'gpa-calculator', 'password-generator',
         'password-strength-checker', 'hash-generator', 'jwt-decoder', 'uuid-generator',
         'fraction-calculator', 'average-calculator', 'ratio-calculator',
         'working-days-calculator', 'date-difference', 'roman-numerals',
         'number-base-converter', 'unit-converter', 'time-zone-converter']
print([r['slug'] for r in tools if r['slug'] in risky and not r['note']])
print('\n-- shortest tool pages by bytes --')
for r in sorted(tools, key=lambda x: x['bytes'])[:10]:
    print('  %-34s %6d  faq=%d lede=%d' % (r['slug'], r['bytes'], r['faq'], r['lede_len']))
print('\n-- categories --')
for r in cats:
    print('  %-14s %6d  related=%d' % (r['slug'], r['bytes'], r['related']))
