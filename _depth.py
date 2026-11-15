"""Content depth per tool, read from en.json. QA helper, never committed."""
import io, json, collections

d = json.load(io.open('assets/i18n/en.json', encoding='utf-8'))
tools = d['tools']
print('tool entries:', len(tools))

depth = []
for slug, t in sorted(tools.items()):
    how = t.get('how') or ''
    lede = t.get('lede') or ''
    ex = t.get('example') or {}
    faq = t.get('faq') or []
    tips = t.get('tips') or []
    note = ' '.join(str(v) for v in (t.get('note'), t.get('caveat')) if v)
    example_text = ''
    if isinstance(ex, dict):
        example_text = ' '.join(str(v) for v in ex.values() if isinstance(v, str))
    depth.append({
        'slug': slug, 'how': len(how), 'lede': len(lede), 'ex': len(example_text),
        'faq': len(faq), 'tips': len(tips), 'note': len(note),
        'keys': sorted(t.keys()),
    })

print('\n--- key shape counts ---')
shape = collections.Counter(tuple(x['keys']) for x in depth)
for k, n in shape.most_common(6):
    print(n, k)

print('\n--- tools with 0 FAQ ---')
print([x['slug'] for x in depth if x['faq'] == 0])
print('\n--- tools with no example ---')
print([x['slug'] for x in depth if x['ex'] == 0])
print('\n--- tools with no note ---')
print([x['slug'] for x in depth if x['note'] == 0])
print('\n--- shortest how/lede/example totals ---')
for x in sorted(depth, key=lambda r: r['how'] + r['ex'] + r['faq'] * 80)[:12]:
    print('  %-32s how=%3d ex=%3d faq=%d note=%d' % (x['slug'], x['how'], x['ex'], x['faq'], x['note']))
print('\n--- per-tool totals ---')
tot = sum(x['how'] for x in depth)
print('total how chars', tot, 'total faq items', sum(x['faq'] for x in depth))
