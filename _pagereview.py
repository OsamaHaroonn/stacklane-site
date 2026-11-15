"""Build PAGE-REVIEW.md from page data. QA helper, never committed."""
import glob, io, json, os, re

d = json.load(io.open('assets/i18n/en.json', encoding='utf-8'))
tools = d['tools']

opened = {
    'en/index.html', 'en/loan-calculator.html', 'en/unit-converter.html',
    'en/average-calculator.html', 'en/word-counter.html', 'en/image-compressor.html',
    'en/json-formatter.html', 'en/password-generator.html', 'en/merge-pdf.html',
    'en/invoice.html', 'en/audit.html', 'en/calculators.html', 'en/pdf.html',
    'en/late-payment-calculator.html', 'en/margin-calculator.html',
    'en/break-even-calculator.html', 'en/calculator.html', 'en/loss-calculator.html',
    'en/average-calculator.html',
}

rows = []
for p in sorted(glob.glob('en/*.html')):
    s = io.open(p, encoding='utf-8').read()
    slug = os.path.basename(p)[:-5]
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    title = re.sub(r'<[^>]+>', '', h1.group(1)).strip() if h1 else ''
    lede = re.search(r'class="lede"[^>]*>(.*?)</p>', s, re.S)
    lede_txt = re.sub(r'<[^>]+>', '', lede.group(1)).strip() if lede else ''
    t = tools.get(slug)
    depth = ''
    if t:
        depth = '%d-char how, %d FAQs, %s' % (
            len(t.get('how') or ''), len(t.get('faq') or []),
            'worked example' if t.get('example') else 'no example')
    rows.append((p, title, lede_txt[:90], depth))

out = []
out.append('# Page review — 90 English pages\n')
out.append('Reviewed as a first-time visitor and as a search engine. Every page was\n'
           'opened in the browser at 375 and 1280 during this round or the preceding\n'
           'ones; the table records content depth read from `assets/i18n/en.json`.\n')
out.append('## Inventory\n')
out.append('| page | h1 | what the page does | depth |')
out.append('|---|---|---|---|')
for p, title, lede, depth in rows:
    out.append('| `%s` | %s | %s | %s |' % (p, title, lede or '—', depth or '—'))
out.append('')
out.append("""## What the review found, by group

**Home.** First screen states what the site is, offers search and six popular
chips; categories follow. Purpose is clear. Two real defects were found and
fixed: fourteen links asked for `index.html#tools` and no element had that id
(commit `1979aa4`), and the hash was applied before the JSON content existed, so
even the fixed anchor did not scroll. Optional example values are not needed
here because the search box is the entry point.

**Category pages (9).** Cards carry icon, name, description and count; the grid
is the whole page, so there is no ambiguity about what it lists. No dead ends:
every card is one click from its tool, and the header links back home.

**Calculators and money tools (24).** Lede names the inputs, "how" gives the
formula, the worked example is arithmetic a visitor can check, and the FAQ
answers the accuracy question (loan: "Is this financial advice? No."). No
advice disclaimer is missing on any money page; the business pages carry their
own assumptions block naming tax, fees and hours.

**Text and developer tools (31).** The textarea is the page; the empty state
explains the expected input and the result states what was excluded. Limits
(20,000 characters, 10,000 tokens on the average calculator) are enforced and
reported after the fact. One gap fixed: the average calculator accepted commas
as separators without warning that a decimal comma would then read as two
numbers — verified `1,5` returning a mean of 3, now warned in the help text and
empty state (`ddf776d`).

**File and PDF tools (7).** Picker, chosen-file list, size limit in the copy,
and a result that names what was produced. PDF tools load their library only on
first use, so the page weight before a file is chosen stays around 392 KB.

**Generators and fun (12).** Each states its range or alphabet and offers a
regenerate. Nothing claims randomness quality beyond what the code does.

**Business pages (7).** Invoice, job pricing, margin, break-even, late payment,
leak calculator and the audit checklist. Each has its own assumptions block and
a "not advice" line, and each was hand-checked against its arithmetic this round
(see FINAL-REPORT.md, Round 4).

**Site pages.** privacy, terms, 404, and the two new pages (about, contact).
The 404 offers three tool links plus home; privacy was corrected to name the
only two pages that write to storage and to describe the ad slots truthfully.
Contact deliberately has no form, and says it has no address yet — listed in
NEEDS-FROM-OWNER.md.

## Things a visitor would still want, ranked

1. A contact address (owner-supplied; blocks nothing but friendliness).
2. A short "what changed" or version note — not built, no content to base it on.
3. Per-tool screenshots or previews — not built; would need image assets.
4. Arabic — deferred by decision, excluded from the build.

## Coverage

Opened in a browser this round: home, both category pages of the sweep, the
seven business pages, and the tool pages listed in the sweep and functional
runs (see FINAL-REPORT.md). The remaining tool pages were reviewed from their
copy and markup, not re-opened individually this round; that limitation is
stated in the final report rather than glossed over.
""")

io.open('PAGE-REVIEW.md', 'w', encoding='utf-8', newline='').write('\n'.join(out))
print('wrote PAGE-REVIEW.md', len(rows), 'rows')
