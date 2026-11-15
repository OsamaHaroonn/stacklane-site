# Stacklane Tools — audit and test report

Date: 9 November 2026
Build tested: branch `preview-redesign-2`, the same files copied into the
production bundle described in `DEPLOY.md`.
Browser: the packaged Chromium in the development environment (Windows),
device pixel ratio 1, default scrollbars.
Site under test: local static server on `http://127.0.0.1:8841`, serving the
repository root, with `Cache-Control: no-store`.

This report records only what was executed and observed. Anything that was not
run is listed under “Not tested” rather than implied.

## Result summary

| Check | Scope | Result |
|---|---|---|
| Pages in the production bundle | 96 | 96 present |
| Browser tools | 73 | 73 passed |
| Business / resource pages | 7 | 7 passed |
| Functional scenarios | 80 pages × 3 = 240 | 0 failures, 0 JS errors |
| Responsive widths | 96 pages × 5 widths = 480 loads | 0 overflow, 0 console errors, 0 text under 14px |
| Internal links | every `href`/`src` on 97 pages | 0 broken |
| External links | 1 (WHO obesity fact sheet) | HTTP 200 |
| Duplicate titles / descriptions | 96 indexable pages | 0 duplicates |
| Canonical and `og:url` | 96 indexable pages | 96 correct, 0 mismatches |
| Accessibility (at 375) | 96 pages | 0 unlabelled controls, 0 unnamed links/buttons, 0 duplicate ids |
| Third-party requests | measured on home, tool and category pages | 0 |
| Secrets / keys in the bundle | full-text scan | 0 |
| Sitemap | `sitemap.xml` | 96 URLs, all resolve, no duplicates |
| Ad slots | 230 slots × 5 widths | all 0 px and `hidden` |

## 1. Functional tests — 73 tools

Method. A test driver was injected first in `<head>` of each page by the local
test server. For every page it ran three scenarios and posted the visible
result text, the label/value rows, console errors and missing controls:

1. **Normal** — realistic input for that tool, plus one click of its main
   action where the tool has one.
2. **Empty** — every field cleared, then the main action clicked again. The
   tool must not throw, print `NaN`, `undefined`, `[object Object]` or a raw
   `{placeholder}`.
3. **Hostile** — every free-text field filled with `<script>alert(1)</script>`,
   quotes, an ampersand, an `<img onerror>`, a NUL, non-BMP characters and
   4,000 characters; number fields set to `-1e308`; dates set to `0001-01-01`;
   selects moved to their last option; every checkbox ticked.

Files were generated in the browser for the file tools: a 40×30 PNG from a
canvas, and a 3-page PDF built with the site's own vendored pdf-lib. They were
attached through a real `DataTransfer`, so the page received a normal
`change` event.

Results: 240 scenario records, **no uncaught errors, no unhandled rejections,
no missing inputs or buttons, and no raw markup or `NaN`/`undefined`/
`[object Object]` in any rendered output.**

| Tool | Normal input | Observed result (condensed) | Status |
|---|---|---|---|
| `merge-pdf` | files:pdf, click:Merge | [msg] 2 → 1 · 623 B · [live] 2 → 1 · 623 B | Pass |
| `image-compressor` | files:png, click:Compress | Original · 179 B · Result · 179 B · Saved · 0 B (0%) · [msg] about the same size · [live] about the same size | Pass |
| `image-resizer` | rsz-w=20, rsz-h=15, files:png, click:Resize | Original · 40 × 30 px · 179 B · Result · 20 × 15 px · 154 B · [msg] Done · [live] Done | Pass |
| `word-counter` | wc-text=The quick brown fox jumps over the lazy dog. | Words · 9 · Characters · 44 · Characters (no spaces) · 36 · Sentences · 1 · Paragraphs · 1 · Reading time · un… | Pass |
| `qr-code-generator` | qr-text=https://example.com, click:Generate | characters · 19 characters · Done · 462 × 462 px | Pass |
| `password-generator` | pw-length=16 | Strength · Strong — 95 bits of entropy | Pass |
| `age-calculator` | age-birth=1990-05-15, age-asof=2026-11-08 | Exact age · 36 Years, 5 Months, 24 Days · Total days · 13,326 · Next birthday · in 188 days | Pass |
| `percentage-calculator` | pct-x=200, pct-y=15 | Result · 30 · Working · 200% × 15 = 30 | Pass |
| `unit-converter` | uc-value=1000, uc-cat=length, uc-from=m | Kilometre · 1 · Factor · 1 Metre = 0.001 Kilometre | Pass |
| `json-formatter` | json-in={"a":1,"b":[2,3]}, click:Format | [value] { · "a": 1, · "b": [ · 2, · 3 · ] · } · [msg] Valid JSON. · [live] Valid JSON. | Pass |
| `loan-calculator` | loan-amount=200000, loan-rate=6, loan-years=30 | Monthly payment · 1,199.1 · Number of payments · 360 months · Total paid · 431,676.38 · Total interest · 231,6… | Pass |
| `mortgage-calculator` | mort-price=400000, mort-down=80000, mort-rate=5 | Monthly payment · 1,717.83 · Loan amount · 320,000 · Down payment share · 20% · Number of payments · 360 month… | Pass |
| `compound-interest-calculator` | ci-principal=10000, ci-rate=5, ci-years=10, ci-freq=1 | Final balance · 16,288.95 · Interest earned · 6,288.95 · Total growth · 62.89% · Same rate, simple interest · … | Pass |
| `discount-calculator` | disc-price=100, disc-first=20 | Price you pay · 80 · You save · 20 · Total discount · 20% · Working · 100 × (1 − 20%) = 80 · [msg] Prices are … | Pass |
| `vat-calculator` | vat-amount=100, vat-rate=20, vat-mode=add | Net (before tax) · 100 · VAT · 20 · Gross (with tax) · 120 · Rate applied · 20% · Working · 100 × 20% = 20 → 1… | Pass |
| `date-difference` | dd-start=2026-01-01, dd-end=2026-01-31 | Days between · 30 days · Weeks and days · 4 weeks and 2 days · Calendar difference · 30 days · Start falls on … | Pass |
| `tip-split-calculator` | tip-bill=100, tip-pct=15, tip-people=4 | Tip · 15 · Total to pay · 115 · Each person pays · 28.75 · Split between · 4 people · Working · 100 × 15% = 15… | Pass |
| `roi-calculator` | roi-in=1000, roi-out=1500 | Net profit · 500 · Return on investment · 50% · Multiple of your money · 1.5× · Working · 1,500 − 1,000 = 500 … | Pass |
| `savings-goal-calculator` | sg-target=10000, sg-current=0, sg-rate=0 | Still needed from your deposits · 10,000 · What you already have will be worth · 0 · Monthly deposit needed · … | Pass |
| `gpa-calculator` | gpa-l1=Math, gpa-p1=4.0, gpa-u1=3 | GPA · 3.5 · Total units · 6 · Quality points · 21 · Courses counted · 2 · Working · 21 ÷ 6 = 3.5 · [msg] Weigh… | Pass |
| `case-converter` | case-in=Hello World, case-mode=upper | Characters in · 11 · Characters out · 11 · Mode · UPPERCASE · [value] HELLO WORLD | Pass |
| `character-counter` | chars-in=abc de | Characters · 6 · Characters without spaces · 5 · Words · 2 · Lines · 1 · Sentences · 1 · Letters · 5 · Digits … | Pass |
| `remove-duplicate-lines` | dedupe-in=a
b
a | Lines in · 3 · Lines out · 2 · Duplicates removed · 1 · Blank lines removed · 0 · Working · 3 − 1 = 2 · [value… | Pass |
| `random-number` | rnd-min=1, rnd-max=10, rnd-count=1 | Range · 1 … 10 · Numbers generated · 1 · Source · crypto.getRandomValues · [value] 10 · [msg] Every draw is in… | Pass |
| `uuid-generator` | uuid-count=3 | Version · 4 (random) · Variant · RFC 4122 (10xx) · Identifiers generated · 3 · Source · crypto.randomUUID / ge… | Pass |
| `base64` | b64-in=hello, b64-mode=encode | Characters in · 5 · Characters out · 8 · Direction · Encoded · [value] aGVsbG8= · [msg] Converted in your brow… | Pass |
| `url-encoder` | url-in=a b&c, url-mode=encode | Characters in · 5 · Characters out · 9 · Percent escapes · 2 · Direction · Encoded · [value] a%20b%26c · [msg]… | Pass |
| `timestamp-converter` | ts-value=0, ts-unit=s | Local time · Jan 01, 1970, 07:30:00 AM · UTC (ISO 8601) · 1970-01-01T00:00:00.000Z · Unix seconds · 0 · Unix m… | Pass |
| `color-converter` | colour-in=#ff0000 | Hex · #ff0000 · RGB · rgb(255, 0, 0) · HSL · hsl(0, 100%, 50%) · Working · R=255, G=0, B=0 · lightness 50%, hu… | Pass |
| `images-to-pdf` | files:png, click:Create PDF | [msg] Created a 2-page PDF · 1.4 KB · [live] Created a 2-page PDF · 1.4 KB | Pass |
| `split-pdf` | files:pdf, click:Split | Document · b.pdf · Pages in the document · 3 · Pages in the result · 2 · Result size · 585 B · [msg] Extracted… | Pass |
| `image-converter` | files:png, click:Convert | Original · f.png · 179 B · Result · 40 × 30 px · 991 B · Format · JPG · [msg] Done · [live] Done | Pass |
| `crop-rotate-image` | files:png, click:Crop and rotate | Original · 40 × 30 px · 179 B · Result · 40 × 30 px · 179 B · Rectangle used · x 0, y 0, 40 × 30, 0° · [msg] D… | Pass |
| `time-zone-converter` | — | Asia/Kuala_Lumpur · Nov 9, 2026, 6:56 AM · UTC+08:00 · GMT+8 (standard time) · America/New_York · Nov 8, 2026,… | Pass |
| `typing-speed-test` | typing-text=hello, click:Finish | Words per minute · 0 · Accuracy · 0% · Correct characters · 0 · Characters typed · 5 · Time elapsed · 0.2 s · … | Pass |
| `regex-tester` | re-pattern=\d+, re-text=abc 123 456 | Matches · 2 · Match 1 · Index 4–7 · 123 · Match 2 · Index 8–11 · 456 · [msg] Matching runs here with the brows… | Pass |
| `hash-generator` | hash-text=abc, hash-algo=SHA-256 | SHA-256 digest · ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad · Input size · 3 B · Charact… | Pass |
| `lorem-ipsum-generator` | lorem-count=5, lorem-kind=words, click:Generate | Words · 5 · Sentences · 0 · Characters · 26 · [value] lorem ipsum dolor sit amet · [msg] Generated here from a… | Pass |
| `text-diff-checker` | diff-a=one
two, diff-b=one
three, click:Compare | Lines in the first version · 2 · Lines in the second version · 2 · Lines only in the first version · 1 · Lines… | Pass |
| `roman-numerals` | rn-value=2026, rn-mode=n2r | Roman numeral · MMXXVI · Number · 2,026 · Working · M(1000) + X(10) + V(5) + I(1) · [msg] Converted here in yo… | Pass |
| `number-base-converter` | nb-value=255, nb-from=10 | Binary · 11111111 · Octal · 377 · Decimal · 255 · Hexadecimal · FF · Base 36 · 73 · [msg] Converted here in yo… | Pass |
| `color-contrast-checker` | cc-fg=#000000, cc-bg=#ffffff | Contrast ratio · 21.00:1 · Working · (1.0000 + 0.05) ÷ (0.0000 + 0.05) · AA, normal text · Pass · AA, large te… | Pass |
| `average-calculator` | avg-input=1 2 3 4 | Count · 4 · Sum · 10 · Mean · 2.5 · Median · 2.5 · Mode · No value repeats · Range · 3 · [msg] Every token was… | Pass |
| `slug-generator` | slug-input=Hello World! | Characters in the slug · 11 · Separator · - · [value] hello-world · [msg] Lowercase, accents removed, symbols … | Pass |
| `html-entity-encoder` | he-input=<a&b>, he-mode=enc | Text · 5 · Result · 15 · [value] &lt;a&amp;b&gt; · [msg] Output is plain text in a read-only box: it is never … | Pass |
| `jwt-decoder` | jwt-input=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODk | iat · 1516239022 — Thu, 18 Jan 2018 01:30:22 GMT · [value] { · "alg": "HS256", · "typ": "JWT" · } · [value] { … | Pass |
| `csv-json-converter` | cv-input=a,b
1,2 | Data to convert · 2 · Objects · 1 · [value] [ · { · "a": "1", · "b": "2" · } · ] · [msg] Converted in your bro… | Pass |
| `sort-lines` | sl-input=c
a
b, sl-order=az | Lines to sort · 3 · Characters · 5 · [value] a · b · c · [msg] Sorted here in your browser: nothing is stored … | Pass |
| `working-days-calculator` | wd-start=2026-01-01, wd-end=2026-01-31 | Working days · 22 · Weekend days · 9 · Holidays in range · 0 · Calendar days · 31 · [msg] Counted in your brow… | Pass |
| `fraction-calculator` | fr-n1=1, fr-d1=2, fr-n2=1, fr-op=add | Result · 5/6 · In lowest terms · 5/6 · Decimal · 0.8333 · [msg] Worked out in your browser: nothing is stored … | Pass |
| `ratio-calculator` | ra-a=4, ra-b=6, ra-mode=simplify | Simplest form · 2:3 · Total parts · 5 · [msg] Calculated in your browser: nothing is stored and nothing is sen… | Pass |
| `stopwatch-timer` | — | · [msg] No laps yet: press Lap while the stopwatch is running. · [live] No laps yet: press Lap while the stopw… | Pass |
| `image-to-base64` | files:png | File · i.png · Size · 179 B · Type · image/png · Data URI length · 262 · [value] data:image/png;base64,iVBORw0… | Pass |
| `salary-to-hourly` | sh-salary=60000, sh-hours=40, sh-weeks=52 | Hourly rate · 28.85 · Daily (hourly × hours ÷ 5) · 230.77 · Weekly · 1,153.85 · Monthly · 5,000.00 · Yearly · … | Pass |
| `keyword-density-analyzer` | kd-input=the cat and the dog | Words in total · 5 · Different words · 4 · Words counted · 5 · Most frequent · the · the · 2 × 40% · and · 1 ×… | Pass |
| `meta-tag-generator` | mt-title=Blue mug, mt-desc=A mug., mt-url=https://example.com/mug.html | [value] <title>Blue mug</title> · <meta name="description" content="A mug."> · <link rel="canonical" href="htt… | Pass |
| `robots-txt-generator` | rb-sitemap=https://example.com/sitemap.xml, rb-mode=allow | User-agent · Names the crawler the next rules apply to. An asterisk means every crawler. · Disallow · Paths th… | Pass |
| `xml-sitemap-generator` | sm-urls=https://example.com/
https://example.com/a.html | [value] <?xml version="1.0" encoding="UTF-8"?> · <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"> … | Pass |
| `css-box-shadow-generator` | bs-x=0, bs-y=4, bs-blur=12 | [value] box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.2); · [msg] Built in your browser: the values you type ar… | Pass |
| `color-palette-generator` | cp-base=#1d4ed8 | [value] Tint 50% white: #8EA7EC · rgb(142, 167, 236) · Tint 25% white: #567AE2 · rgb(86, 122, 226) · Base: #1D… | Pass |
| `password-strength-checker` | ps-input=Tr0ub4dor&3xample!long | Length · 22 · Character classes · lowercase, uppercase, digits, symbols · Pool size · 94 · Bits per character … | Pass |
| `favicon-generator` | files:png | [msg] Finished. Download the sizes you need. · [live] Finished. Download the sizes you need. | Pass |
| `html-to-markdown` | hm-input=<h2>Notes</h2><p>Hello <strong>world</strong>.</p> | [value] ## Notes · · Hello **world**. · [msg] Parsed in your browser: the HTML you paste is never sent anywher… | Pass |
| `user-agent-parser` | ua-input=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36  | Browser · Chrome · Version · 120.0 · Engine · Blink · Operating system · Windows 10 or 11 · Device type · desk… | Pass |
| `bmi-calculator` | bw-weight=70, bw-height=175 | BMI · 22.9 · Band · healthy range · Healthy weight for this height · 56.7 – 76.3 kg · Working · 70.0 ÷ 1.75² =… | Pass |
| `sql-formatter` | sq-input=select a,b from t where a=1 order by b | Lines in the result · 4 · Characters in the result · 38 · [value] SELECT a,b · FROM t · WHERE a=1 · ORDER BY b… | Pass |
| `coin-flipper` | click:Flip coin | Heads · 1 · 100% · Tails · 0 · 0% · Flips this visit · 1 · [msg] Heads · [msg] Flipped in your browser with th… | Pass |
| `dice-roller` | dr-sides=6, dr-count=2, click:Roll | Each die · 1, 2 · Total · 3 · Rolling · 2 × d6 · [msg] Rolled in your browser with the Web Crypto API: nothing… | Pass |
| `decision-wheel` | dw-options=Walk
Bus
Train, click:Spin | [msg] Chosen in your browser with the Web Crypto API: your options are never stored or sent anywhere. · [live]… | Pass |
| `bubble-wrap-popper` | — | [msg] Runs entirely in your browser: nothing is stored or sent anywhere. · [live] 0 of 100 popped · [live] Run… | Pass |
| `fake-hacker-typer` | click:Start | [msg] A toy: the lines come from a list in this page. Nothing is executed, read or sent anywhere. · [live] Ses… | Pass |
| `compliment-generator` | click:Another compliment | [msg] Built in your browser from written word lists: nothing is stored or sent anywhere. · [live] Built in you… | Pass |
| `shakespearean-insult-generator` | click:Another insult | [msg] Built in your browser from written word lists: nothing is stored or sent anywhere. · [live] Built in you… | Pass |

### Arithmetic and conversion spot checks (hand-verified)

The harness proves a tool produces output; these were recomputed by hand or
from a known reference and compared with the page.

| Tool | Input | Expected | Shown |
|---|---|---|---|
| age-calculator | 1990-05-15 → 2026-11-08 | 36 y 5 m 24 d; 13,326 days | 36 Years, 5 Months, 24 Days; 13,326 |
| percentage-calculator | 200% of 15 | 30 | 30 |
| average-calculator | 1, 2, 3, 4 | mean 2.5, median 2.5, range 3 | 2.5, 2.5, 3 |
| bmi-calculator | 70 kg, 175 cm | BMI 22.9; healthy 56.7–76.3 kg | 22.9; 56.7–76.3 kg |
| base64 | `hello` | `aGVsbG8=` | `aGVsbG8=` |
| case-converter | `hello world` → UPPERCASE | `HELLO WORLD` | `HELLO WORLD` |
| character-counter | `abc de` | 6 chars, 5 without spaces, 2 words | 6 / 5 / 2 |
| compound-interest-calculator | 10,000 at 5%, 10 y, yearly | 16,288.95 | 16,288.95 |
| csv-json-converter | `a,b` / `1,2` | JSON objects with string values | `[{"a":"1","b":"2"}]` |
| date-difference | 2026-01-01 → 2026-01-31 | 30 days | 30 days |
| discount-calculator | 100 less 20% | 80 | 80 |
| fraction-calculator | 1/2 + 1/3 | 5/6 = 0.8333 | 5/6; 0.8333 |
| gpa-calculator | 21 quality points, 6 units | 3.5 | 3.5 |
| hash-generator | `abc`, SHA-256 | `ba7816bf8f01cfea…` | `ba7816bf8f01cfea…` |
| html-entity-encoder | `<a&b>` | `&lt;a&amp;b&gt;` | same |
| loan-calculator | 200,000 at 6%, 30 y | 1,199.10/month; 431,676.38 total | 1,199.1; 431,676.38 |
| mortgage-calculator | 320,000 at 5%, 30 y | 1,717.83/month | 1,717.83 |
| margin-calculator | cost 60, price 100 | profit 40; margin 40%; markup 66.7% | 40 / 40.0% / 66.7% |
| number-base-converter | 255 | binary 11111111, hex FF, base36 73 | same |
| password-strength-checker | 22 chars, pool 94 | 22 × log₂94 = 144.20 bits | 144.20 bits |
| regex-tester | `[0-9]+` on `abc123def456` | two matches: 123, 456 | 2 matches |
| remove-duplicate-lines | a, b, a | 2 lines, 1 removed | 2 / 1 |
| roi-calculator | 1,000 → 1,500 | 500 profit; 50% | 500; 50% |
| roman-numerals | 2026 | MMXXVI | MMXXVI |
| salary-to-hourly | 60,000 ÷ 2,080 | 28.85/hour | 28.85 |
| savings-goal-calculator | 10,000 over 60 months, 0% | 166.67/month | 166.67 |
| slug-generator | `Hello World` | `hello-world` | `hello-world` |
| split-pdf | 3-page PDF, page range 1–2 | 2 pages out | 3 in, 2 out, 585 B |
| tip-split-calculator | 100, 15%, 4 people | 115 total; 28.75 each | 115; 28.75 |
| unit-converter | 1,000 m → km | 1 km | 1 |
| url-encoder | `a b&c` | `a%20b%26c` | `a%20b%26c` |
| vat-calculator | 100 net + 20% | 20 VAT; 120 gross | 20; 120 |
| word-counter | 9-word sentence | 9 words, 44 chars, 36 no spaces | 9 / 44 / 36 |
| working-days-calculator | January 2026 | 22 weekdays, 9 weekend days, 31 days | 22 / 9 / 31 |

### Three tools driven by hand

The harness cannot type into a stopwatch or a typing test, and a generated
password lives in an `<input>`, so these were operated in the browser:

- **password-generator** — 20 characters with all four classes on produced
  `^[2,zM/}ZU;]fUY@La$T` and “Very strong — 129 bits”; symbols-only produced
  `;?#}^#{-^/-);[^]&+&.` and 92 bits. Symbols and entropy respond to the
  controls.
- **stopwatch-timer** — Start, Lap and Pause work: clock read 00:01.69 after
  0.9 s, “Lap 1 / 00:01.68” appeared, and pausing held the time.
- **typing-speed-test** — filling the hidden textarea with 30 characters
  recalculated the stats to 273 WPM, 96.7% accuracy, 29 correct of 30.

### File tools

merge-pdf produced a 623-byte 1-page PDF from two 3-page-page-size inputs;
images-to-pdf produced a 1.4 KB 2-page PDF; split-pdf returned 2 of 3 pages;
image-resizer produced a 20×15 image from 40×30; image-converter produced a
991-byte JPG; crop-rotate preserved 40×30; image-compression reported “about
the same size” for an already-compressed 179-byte PNG, which is correct
behaviour rather than an error.

## 2. Business and resource pages — 7

All seven were loaded, measured at five widths, linked-checked and exercised
with the same three scenarios as the tools.

| Page | Normal-scenario result | Status |
|---|---|---|
| `calculator` | [totals] Labour $500.00 Materials $100.00 Overhead $50.00 Break-even $650.00 Margin $130.00 Charge $780.00 · [totals] Effective hourly rate $63.00/hr  | Pass |
| `invoice` | [totals] Subtotal $1,000.00 Discount % Tax (VAT) % Total due $1,200.00 · [t-subtotal] $1,000.00 · [t-total] $1,200.00 | Pass |
| `margin-calculator` | [totals] Profit $40.00 Margin 40.0% Markup 66.7% · [totals] Price after discount $90.00 Profit then $30.00 Margin then 33.3% Price for target margin $ | Pass |
| `break-even-calculator` | [totals] Profit per job $10 Jobs to break even 100 Revenue at break-even $3,000 · [totals] Jobs a month 200 Revenue $6,000 Left after fixed costs $1,0 | Pass |
| `late-payment-calculator` | [totals] Ask for this $1,058.22 Interest so far $8.22 Late fees so far $50.00 One-off admin fee $0.00 · [totals] Cost per day of delay $1.94 Per month | Pass |
| `loss-calculator` | [totals] Admin time $2,078 Missed enquiries $2,078 Per month $4,157 · [totals] Per year $49,882 Per week $960 · [totals] Free fix list (the audit) Fre | Pass |
| `audit` | [totals] Passed 3 To fix 12 Group strength Trust 0/4 · [totals] 13–15 Sound — small polish, no emergency 9–12 Leaking — a few fixes recover most of it | Pass |

Cross-checks: invoice 1,000 + 20% VAT = 1,200; late payment on 1,000 at 5%
for 60 days = 8.22 interest, 50 late fee, 1,058.22 requested; leak calculator
2,078 + 2,078 = 4,157/month and 49,882/year; margin 40% with 66.7% markup and
85.71 target price for a 40% margin; break-even 100 jobs at $10 profit per job
against $1,000 fixed costs, $3,000 revenue; job pricing 650 break-even plus
20% = 780, which is 63/hour on 10 hours; audit 3 of 15 checks ticked.

Header, footer, category links, search, internal links, mobile menu and the
contact link were the same components as on every other page and were checked
by the site-wide sweep and link check (0 broken).

## 3. Responsive testing

Each width is a full run of all 96 pages in the bundle, one page at a time,
with the recorded `innerWidth` checked on every record.

| Width | Pages | Horizontal overflow | Console errors | Text < 14px | Controls < 44px tall | Ad slot height |
|---|---|---|---|---|---|---|
| 375 | 96 | 0 | 0 | 0 | only native checkboxes | 0 px |
| 390 | 96 | 0 | 0 | 0 | only native checkboxes | 0 px |
| 768 | 96 | 0 | 0 | 0 | only native checkboxes | 0 px |
| 1366 | 96 | 0 | 0 | 0 | only native checkboxes | 0 px |
| 1920 | 96 | 0 | 0 | 0 | only native checkboxes | 0 px |

The “short control” counter flags the 20×20 native checkbox inputs on 12
pages. Each of those inputs sits inside a label: on working-days-calculator at
375 every one measures 20×20 inside a 277×44 label, so the tap target is 44 px
tall. No button, link or select is under 44 px. Ad slots: 230 per width, all
0 px and all carrying `hidden`.

The 404 page cannot be injected by the harness (the server returns its own
body), so it was measured directly at 375 and 1280: overflow 0, no text under
14 px, no short controls, all seven links present.

Layout shift (PerformanceObserver on `layout-shift`, `hadRecentInput`
excluded), measured on load and after scrolling to the bottom:

| Page | 375 load | 375 scroll | 1280 load | 1280 scroll |
|---|---|---|---|---|
| home | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| en/pdf.html | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| en/loan-calculator.html | 0.0000 | 0.0000 | 0.0000 | 0.0000 |

### Phone menu, open, at 375

| Page | Panel x / right / width | Items | Min item height | Clipped |
|---|---|---|---|---|
| home | 16 / 342 / 326 | 14 | 44 | no |
| en/pdf.html | 16 / 342 / 326 | 14 | 44 | no |
| en/loan-calculator.html | 16 / 342 / 326 | 14 | 44 | no |

The panel stays inside the 375 px viewport and `scrollHeight` equals
`clientHeight`, so no item is cut off.

### Loan calculator guard

`en/loan-calculator.html`, empty state, measured with a Range over the
`#back-cat` link text:

| Viewport | Layout viewport | Document height | `#back-cat` text top | Ad slots |
|---|---|---|---|---|
| innerWidth 375 | 359 px | 3450 px | 2846.6001 | 0 / 0 / 0 |
| innerWidth 376 | 359 px | 3450 px | 2846.6001 | 0 / 0 / 0 |

The recorded guard is 3452 px / 2848.7639. The 2 px difference is not a code
change: the page's diff against the commit that produced 3452 is exactly three
`<head>` URLs (canonical, `og:url`, `og:image`), `assets/style.css` has no
diff, and a copy of the same page rendered from the pre-change commit at the
same viewport measures the identical 3450 / 2846.6001 in this session. The
harness browser's device pixel ratio changed from 0.9 to 1.0 between rounds,
which changes how line boxes round; the CSS and the body markup are unchanged.
No layout value was edited to make this pass.

## 4. SEO preparation

- **Canonical URLs** — every indexable page's `<link rel="canonical">` was
  compared with its own path: 96 of 96 match `https://stacklanetools.com/…`,
  0 duplicates, 0 mismatches. `og:url` matches the canonical on all 96.
- **Titles and descriptions** — 96 pages, 0 missing, 0 duplicate titles,
  0 duplicate descriptions.
- **Headings** — every page has exactly one `<h1>` (checked on 97 pages
  including 404).
- **Sitemap** — 96 URLs: `/`, `/en/`, 9 category pages, 73 tools, 7 business
  pages, all-tools, about, contact, privacy, terms. Every URL resolves to a
  file, every URL has a matching canonical, no duplicates, no `/ar/`, no 404.
  `lastmod` is 2026-11-09, the date the files were migrated.
- **robots.txt** — allows the site, disallows `/product-source/`, `/*.md` and
  the unpublished `/ar/`, and points at
  `https://stacklanetools.com/sitemap.xml`.
- **404** — a real page with seven working links, `noindex`, served by the
  host with HTTP 404. It now describes any static host rather than GitHub
  Pages.
- **Structured data** — `WebSite` JSON-LD on the home page; the leak
  calculator keeps its `FAQPage` block whose questions match the visible FAQ.
  No ratings, reviews, prices or claims were invented. JSON-LD does not
  trigger a CSP violation under `script-src 'self'` (checked in the console).
- **Home page** — previously `noindex` and absent from the sitemap while other
  pages pointed their canonical at it. It is now indexable and listed.
- **Alt text** — every `<img>` element on the site has `alt` (checked
  statically); the only raster asset is the Open Graph image.
- **Indexing** — nothing here can be indexed or ranked until the domain is
  live. No such claim is made.

## 5. Privacy claims, verified against the code

- **No third-party requests** — network logs on the home page (6 requests), a
  tool page (8) and a PDF tool after loading pdf-lib (10) show only
  `127.0.0.1:8841` and `data:` URIs.
- **No analytics, cookies, pixels** — no `document.cookie` anywhere, no
  analytics script, no external script tag. The only `fetch` in shipped code
  loads `assets/i18n/<lang>.json` from the same origin.
- **Files stay local** — file tools use `FileReader`/canvas/`URL.createObjectURL`
  and the vendored libraries; there is no upload endpoint and `connect-src` is
  `'self'`.
- **Local storage** — `localStorage` appears only in `assets/audit.js` and
  `assets/invoice.js`, matching the privacy page's “two pages” statement. No
  tool script writes to storage.
- **Forms** — there are 0 `<form>` elements; `form-action 'none'` is set in
  both the meta CSP and `_headers`.
- **Hosting** — the policy now states, truthfully, that the hosting provider
  and its CDN may keep ordinary request logs (IP, user agent, URL) and that the
  site itself never receives them. A static site cannot honestly claim
  “nothing is collected” without that sentence.
- **Contact** — the site now publishes `contact@stacklanetools.com` as the
  only contact channel. **The mailbox has not been created or tested**, so the
  site does not promise a response and this is listed as an owner action.

## 6. Security review

- **CSP** — identical meta policy on 96 pages plus a stronger HTTP header in
  `_headers` (adds `frame-ancestors 'none'`, COOP/CORP, HSTS, nosniff,
  `Referrer-Policy: no-referrer`, `Permissions-Policy`). `base-uri` is `'self'`
  in the header so the 404 page's `<base>` works; normal pages keep
  `base-uri 'none'` in the meta tag.
- **No inline script or handlers** — 0 `on*=` attributes, 0 `javascript:`
  URLs, 0 `<iframe>/<object>/<embed>`, 0 `<form>`, 0 `eval`,
  `new Function` or `document.write`.
- **DOM writes** — no tool script assigns `innerHTML`; tool output goes through
  `textContent`/form values. The business-page scripts that use `innerHTML`
  interpolate numbers and fixed markup, not visitor text. The invoice's saved
  draft is rendered through inputs and `textContent`.
- **Dependencies** — two vendored libraries, pdf-lib 1.17.1 (MIT) and
  qrcode-generator 1.4.4 (MIT), served from this origin with the sha256
  recorded in `assets/vendor/README.md`. No CDN, no package manager, no
  transitive runtime install.
- **Secrets** — full-text scan for key/secret/token patterns found only prose
  (JWT help text, password tool copy) and git-internal blobs; nothing in the
  bundle. No environment variables are needed at build or run time.
- **External links** — one, to the WHO obesity fact sheet; it returns HTTP 200
  and opens in the same tab (no `target=_blank`, so no reverse-tabnabbing
  surface).
- **Outbound data** — none at runtime.

## 7. Performance

Measured with `performance.getEntriesByType('resource')` on a cold load.

| Page | Requests | Raw transfer | DOM nodes | DOMContentLoaded | Load |
|---|---|---|---|---|---|
| home | 6 | 383 KB | 161 | 48 ms | 64 ms |
| en/loan-calculator.html | 8 | 400 KB | 197 | 64 ms | 67 ms |

Gzip sizes of the recurring assets: `en.json` 248 KB raw → **72 KB**, style.css
91 KB → 21 KB, chrome.js 20 KB → 6 KB, catalog.js 11 KB → 3.5 KB. Cloudflare
serves Brotli, which is smaller again.

pdf-lib (513 KB raw, 204 KB gzip) is fetched **only** on the first PDF action,
not with the page; qrcode.js (55 KB) only on the QR page.

`_headers` sets HTML to `max-age=0, must-revalidate` so deploys appear at once,
assets to one hour (the filenames are not content-hashed, so `immutable` would
be wrong), and the sitemap/robots to one hour.

Known performance limitation: `en.json` contains the copy for all 80 pages and
is fetched by every page, so ~72 KB gzip is paid on each first visit. Splitting
it per page would change the i18n loader and every page; that was not done in
this round.

## 8. Issues found and fixed in this round

1. Every canonical, `og:url`, `og:image`, sitemap entry, `robots.txt` line and
   the 404 `<base>` pointed at `osamaharoonn.github.io/stacklane-site`. All 100
   English/root files now use `https://stacklanetools.com`.
2. The home page was `noindex` and missing from the sitemap while other pages
   canonicalised to it. It is now indexable and listed.
3. The sitemap was missing `/` and had stale priorities; regenerated with 96
   URLs and `lastmod`.
4. Privacy claimed “no inbox” and implied no data is held anywhere. Corrected:
   the contact email is published and the hosting provider's request logs are
   disclosed.
5. Privacy and terms still described the pre-hosting state; both were updated
   and dated November 2026.
6. About said the pages load “no external … libraries” while the site vendors
   pdf-lib and qrcode; now it says they are served from this origin.
7. Contact had no address at all; it now publishes
   `contact@stacklanetools.com` with `mailto:`.
8. The 404 page's comment and `robots.txt` described GitHub Pages; both now
   describe the static host and the unpublished Arabic folder.
9. No response headers could be set on GitHub Pages; `_headers` now provides
   CSP, HSTS, nosniff, frame protection, referrer policy, permissions policy
   and cache rules for Cloudflare Pages.

No functional defect was found in any of the 73 tools or 7 business pages.

## 9. Not tested

- Firefox and Safari (only Chromium was available).
- Real iOS/Android devices (viewport emulation only).
- Screen readers and full keyboard-only traversal (automated names and focus
  order only).
- `prefers-reduced-motion: no-preference`: this browser reports
  `reduce: true`, so motion was only checked structurally.
- Real advertising, AdSense review, and any analytics.
- Arabic pages (excluded from this release; not edited).
- The Cloudflare Pages build and the live domain: nothing has been deployed,
  and DNS has not been touched.
- The email mailbox (not created yet).
