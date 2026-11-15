import io, json, sys, os, collections

recs = [json.loads(l) for l in io.open('qa-sweep-log.json', encoding='utf-8') if l.strip()]
seen = {}
for r in recs:
    seen[r['path']] = r
print('records', len(recs), 'unique pages', len(seen))
byw = collections.Counter(r['innerW'] for r in seen.values())
print('innerWidth counts:', dict(byw))

plan = json.load(io.open('qa-plan.json', encoding='utf-8'))
missing = [p for p in plan if p not in seen]
print('pages missing from this pass:', missing)

problems = []
for p, r in sorted(seen.items()):
    if r['overflow'] > 0:
        problems.append((p, 'overflow', r['overflow']))
    if r['errors']:
        problems.append((p, 'errors', r['errors'][:3]))
    if r['smallText']:
        problems.append((p, 'smallText', r['smallText'][:3]))
    if r['tapShort']:
        problems.append((p, 'tapShort', r['tapShort']))
    if r['bad']:
        problems.append((p, 'badTokens', r['bad'][:3]))
    if any((s.get('h') if isinstance(s, dict) else 0) for s in r['slots']):
        problems.append((p, 'adSlotHeight', r['slots']))
print('problems:', len(problems))
for x in problems[:20]:
    print(' ', x)

print('\nmax doc height by width:')
for w in sorted(byw):
    hs = [(r['docH'], p) for p, r in seen.items() if r['innerW'] == w]
    hs.sort(reverse=True)
    print(' ', w, 'pages', len(hs), 'tallest', hs[0], 'home', [h for h, p in hs if p == 'en/index.html'])

print('\nad slots reported per page (all should be 0):')
vals = collections.Counter()
for p, r in seen.items():
    vals[str(r['slots'])] += 1
print(' ', dict(vals))
