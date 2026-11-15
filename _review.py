"""Copy-quality flags per tool. QA helper, never committed."""
import io, json, re

d = json.load(io.open('assets/i18n/en.json', encoding='utf-8'))
tools = d['tools']

SENSITIVE = {
    'loan-calculator': 'money', 'mortgage-calculator': 'money',
    'compound-interest-calculator': 'money', 'savings-goal-calculator': 'money',
    'roi-calculator': 'money', 'vat-calculator': 'money',
    'tip-split-calculator': 'money', 'discount-calculator': 'money',
    'percentage-calculator': 'money', 'salary-to-hourly': 'money',
    'bmi-calculator': 'health', 'age-calculator': 'health',
    'gpa-calculator': 'education', 'password-generator': 'security',
    'password-strength-checker': 'security', 'uuid-generator': 'security',
    'hash-generator': 'security', 'jwt-decoder': 'security',
}

flags = []
for slug, t in sorted(tools.items()):
    f = []
    lede = t.get('lede') or ''
    how = t.get('how') or ''
    ex = t.get('example') or ''
    faq = t.get('faq') or []
    if len(lede) < 90:
        f.append('short-lede(%d)' % len(lede))
    if len(how) < 260:
        f.append('short-how(%d)' % len(how))
    if not isinstance(ex, str) or not re.search(r'\d', ex or ''):
        f.append('example-no-numbers')
    if len(ex or '') < 80:
        f.append('short-example(%d)' % len(ex or ''))
    if len(faq) < 4:
        f.append('faq<4')
    short_a = [q.get('q', '')[:50] for q in faq
               if len(q.get('a') or '') < 90]
    if short_a:
        f.append('thin-answers:%d' % len(short_a))
    joined = ' '.join([lede, how, ex] + [(q.get('a') or '') for q in faq]).lower()
    if slug in SENSITIVE and not re.search(r'not advice|not financial|not medical|arithmetic|estimate|check with|not a substitute|professional', joined):
        f.append('no-limits-words')
    if f:
        flags.append((slug, f))

print('tools', len(tools), 'flagged', len(flags))
for slug, f in flags:
    print('  %-32s %s' % (slug, ', '.join(f)))
