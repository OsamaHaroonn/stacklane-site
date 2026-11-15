import io, json

B = chr(92)

value = ('With the pattern ' + B + 'b(' + B + 'w+)-(' + B + 'd+)' + B + 'b and the g flag, '
         'the text "build-42 and patch-7" gives two matches. Match 1 is build-42 at '
         'indices 0 to 8, with group 1 build and group 2 42. Match 2 is patch-7 at '
         'indices 13 to 20, with groups patch and 7.')
print('new value backslashes:', value[:45].count(B), '| repr:', repr(value[:45]))

PJ = 'assets/i18n/en.json'
raw = io.open(PJ, encoding='utf-8').read()
anchor = raw.index('"regex-tester": {')
rel = raw.index('"example"', anchor)
start = raw.index('"', rel + len('"example"') + 1) + 1   # opening quote of the value
end = start
while True:
    ch = raw[end]
    if ch == B:
        end += 2
        continue
    if ch == '"':
        break
    end += 1
old = raw[start:end]
raw = raw[:start] + json.dumps(value)[1:-1] + raw[end:]
io.open(PJ, 'w', encoding='utf-8', newline='').write(raw)
print('json old backslashes:', old[:45].count(B))

data = json.load(io.open(PJ, encoding='utf-8'))
now = data['tools']['regex-tester']['example']
print('json now backslashes:', now[:45].count(B), '| repr:', repr(now[:45]))

PH = 'en/regex-tester.html'
html = io.open(PH, encoding='utf-8').read()
esc = value.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
marker = 'data-i18n="tools.regex-tester.example">'
i = html.index(marker) + len(marker)
j = html.index('</p>', i)
html = html[:i] + esc + html[j:]
io.open(PH, 'w', encoding='utf-8', newline='').write(html)
print('html backslashes:', esc[:45].count(B))
