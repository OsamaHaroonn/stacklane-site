# FINAL REPORT — visual and UX pass on tool pages (branch `preview-redesign-2`)

Nothing was pushed and nothing was deployed. Branch `preview-redesign-2`,
static server on `http://127.0.0.1:8830` (`qa-server.py`, `Cache-Control: no-store`).

Five commits:

```
d778882  Give the Business pages the same card, field and answer treatment
73bd5d5  Give tool pages section rhythm, a chevron FAQ and related-tool cards
17e8d2d  Stop result tiles and the hero ring moving under reduced motion
2da5e00  Stop the file zone pushing the page sideways and lift 13px tool text to 14px
5557b41  Switch the ad slots on with one attribute and document the reserved sizes
```

Seven files changed: `assets/style.css`, `assets/chrome.js`, three tool scripts
(one line each), `ADS-README.md`, `ads.txt`.

---

## 1. The zero-shift guard

Measured on `en/loan-calculator.html`, empty state, **innerWidth 376**
(requested 338; this window paints at devicePixelRatio 0.9, so the requested
width is not `innerWidth`).

| State | document height | `#back-cat` text top | ad slots |
|---|---|---|---|
| before this session (commit 0710272, throwaway worktree) | 3452 px | 2848.7639 px | — |
| after `d778882` | 3452 px | 2848.7639 px | 0 / 0 / 0 |
| after `73bd5d5` | 3452 px | 2848.7639 px | 0 / 0 / 0 |
| after `17e8d2d` | 3452 px | 2848.7639 px | 0 / 0 / 0 |
| after `2da5e00` | 3452 px | 2848.7639 px | 0 / 0 / 0 |
| after `5557b41` | 3452 px | 2848.7639 px | 0 / 0 / 0 |

The brief's numbers reproduce exactly at 376. At innerWidth 375 the same page is
3450 px / 2846.5999 px, because one line of text wraps differently one pixel
narrower — that is a viewport difference, not a regression, and was checked at
both widths after `73bd5d5`.

Round 2 revisited these numbers: they are specific to a tab that paints
at devicePixelRatio 0.9. Section 7 below reconciles the two readings.

---

## 2. What each commit changed

### `d778882` — Business pages
`.panel`, `.field` and `.totals` are used **only** by the seven hand-written
Business pages (checked with `grep -l` over every `*.html`), so nothing here can
reach a tool page.

* `.panel` — white surface with a faint top wash and a three-layer shadow.
* `.field input/select/textarea` — 12px radius, inset shadow, hover border, and
  a 4px focus ring (`box-shadow`, so no reflow), plus a disabled state.
* `.totals .row.grand` — becomes a deep-blue gradient tile **painted by an
  absolutely positioned `::before` with `inset: -6px -14px`**. The row keeps its
  exact geometry; white text on `#1d4ed8` is 6.2:1.

### `73bd5d5` — Tool page furniture
* A 28×3px accent rule above each `h2`, positioned absolutely in the 24px
  section margin (`top: -14px`), so no heading moves.
* Worked example: gradient wash, inner highlight, soft outer shadow.
* FAQ marker: the `+`/`−` glyph is now an 8×8px border-drawn chevron of the same
  box size, rotated 180° on `[open]` with a transform only; hover and open
  states are colour and shadow.
* Related tools: card gradient, hover lift of 2px with a deeper shadow.

**Deliberate omission:** no step numbers in "How it works". Each tool's copy is a
single paragraph, not a list; numbering it would invent structure the text does
not have.

### `17e8d2d` — Motion
The stagger (45ms per tile), the hero-ring pulse, the message-bar slide and the
progress sheen already existed. The gap: `.tk-row` animations ignored
`prefers-reduced-motion`. They are now switched off there, with the row hover
lift.

### `2da5e00` — Two defects found by the sweep
1. **`en/images-to-pdf.html` scrolled sideways at 375px** (scrollWidth 388 vs
   375). Cause: `.tk-file-name` sets `white-space: nowrap`, and a grid item will
   not shrink below its content, so the sentence "Choose the images you want to
   put in the PDF." made the column 346px wide inside a 275px panel. Fix:
   `min-width: 0` on the zone and on the name, so the existing ellipsis works.
   After: overflow −19 (none), page height 3207 → 3226px.
2. **Text at 13px** in three tools and two shared rules: the colour-palette
   swatch labels, the box-shadow preview label, the fake terminal, the progress
   label and the file-list meta. All raised to 14px.

### `5557b41` — Ad slots
One switch: `<html data-ads="on">`. `chrome.js` (5 lines) drops the `hidden`
attribute; `style.css` reserves the space, so a late ad cannot move anything.
Full documentation in `ADS-README.md`; `ads.txt` is a commented placeholder that
authorises nobody.

---

## 3. Verification

### Layout, every page
* **1280** (requested 1152): all 90 `en/` pages plus the ten root pages —
  **no horizontal overflow, no text under 14px, no tap target under 44px**.
  One exception, by design: the inline "privacy policy" link inside an
  `en/audit.html` sentence is 20px tall. WCAG 2.5.8 exempts links inside a block
  of text; stretching it would break the paragraph.
* **375** (requested 337): every tool page and the seven Business pages —
  no overflow after `2da5e00`, no small text, no small tap targets.
* **Home page at 375: 2473px ≈ 2.7 screens** of 900px (target was about 3).
  At 1280 it is 4823px.
* Home page composition at 375: 8 popular cards, 8 category cards (Business
  excluded), PDF and Images as cards (3 and 4), the other six categories as
  compact rows (6 each in the DOM, first 4 visible under 640px).
* Search: "pdf" in the hero box → "All tools (4)", four results. "json" in the
  header box → dropdown with 2 items, first "JSON formatter".
* Hidden ad slots: **0px** in every reading. With the switch on (live test only):
  375 → A 100px, B 100px, C 250px, no overflow; 1280 → A 280×724, B 280×724,
  C 250×300, no overflow.

### Function, hand-computed

| Tool | Input | Tool output | My arithmetic |
|---|---|---|---|
| loan-calculator | 10000, 6%, 5y | 193.33 monthly, 11,599.68 total, 1,599.68 interest | 50 ÷ 0.258628 = 193.33 ✓ |
| percentage-calculator | 20% of 250 | 50 | 0.2 × 250 ✓ |
| bmi-calculator | 70 kg, 175 cm | 22.9, "healthy range" | 70 ÷ 1.75² = 22.86 ✓ |
| salary-to-hourly | 52,000; 40h; 52w | 25.00/h, 200/day, 1,000/week, 4,333.33/month | 52,000 ÷ 2,080 ✓ |
| tip-split-calculator | 80, 15%, 4 | tip 12, total 92, 23 each | ✓ |
| average-calculator | 2,4,4,4,5,5,7,9 | mean 5, median 4.5, mode 4, range 7 | ✓ |
| word-counter | "one two three four five" | 5 words, 23 chars, 19 without spaces | ✓ |
| fraction-calculator | 1/2 + 1/3 | 5/6, 0.8333 | ✓ |

All seven Business pages recalculated with no `NaN`, `Infinity` or `undefined`
in their totals. A generated 120×90 PNG through `image-compressor` produced a
517 B result, a blob preview and a working download button.

### Empty and hostile input
Every tool page was driven with normal, empty and hostile values (HTML and
script text, `2000` in every numeric field, `0001-01-01` in dates). Nothing
rendered `NaN`, `Infinity`, `undefined`, `[object Object]` or a raw
`{placeholder}`. Validation messages were specific, for example:

* "A discount cannot be more than 100%."
* "Hours per week cannot be more than 168, the number of hours in a week."
* "Enter a term of 50 years or fewer." / "Enter 100 years or fewer."
* "That is not a full URL: `<script>alert(1)</script>` …"
* "4 token(s) could not be read and were left out: `<script>…`"
* "Use only the letters I, V, X, L, C, D and M."

### Links and metadata (115 files)
* Broken internal links: **0**.
* Duplicate `<title>`: **0**. Duplicate meta description: **0**.
* Duplicate element IDs: **0**.
* Missing canonical: only `404.html` (correct) and the local QA helpers.
* Missing `og:image`: none on any public page.
* `sitemap.xml`: 93 URLs = 3 root pages + all 90 English pages; no 404, no
  helper files.

### Page weight (gzip)
Median **110.2 KB** for a tool page (shared CSS 18.4 KB, `en.json` 71.7 KB,
chrome 5.4 KB, catalog 3.5 KB, ToolKit 3.7 KB, plus its own script).
87 of 90 pages are under 150 KB. Over it: `merge-pdf` 314 KB,
`split-pdf` 315 KB, `images-to-pdf` 315 KB — all because of the vendored
`assets/vendor/pdf-lib.min.js` (525 KB raw). `qr-code-generator` is 121 KB.

### External requests
None. The network log for `index.html` shows seven requests, all to
`127.0.0.1:8830`. No fonts, images, icons, scripts or endpoints leave the origin.

---

## 4. Security review

* **No `eval`, no `new Function`, no string `setTimeout`** anywhere.
* **`innerHTML`**: only three kinds — constant inline SVG strings
  (`chrome.js`, `home.js`, `category.js`), `= ''` clears, and verdict sentences
  in the five business calculators that interpolate **numbers only** through
  `money()` / `num()` / `Math.round()`.
* **Invoice**: `addRow()` writes constant markup, then assigns user values with
  `.value`. User text never passes through `innerHTML`.
* **URL parameters** (`loss.js`): read with `URLSearchParams`, parsed with
  `parseFloat`, rejected unless `isFinite(n) && n >= 0`, written to `.value`.
* **`html-to-markdown`**: parses with `DOMParser` into an inert document and
  reads `textContent`; it never re-inserts HTML and never runs scripts.
* **Size caps** exist in every text and file tool, for example
  `LIMIT = 500000` (case-converter, base64), `MAX_CHARS 20000 / MAX_TOKENS 10000`
  (average), `MAX_CHARS 200000 / MAX_ROWS 2000` (csv-json),
  `MAX_BYTES 30 MB / MAX_PIXELS 40 M` (crop-rotate), `MAX_OPTIONS 20 /
  MAX_LEN 60 / MAX_INPUT 2000` (decision-wheel).
* **No `target="_blank"`** anywhere, so no `rel="noopener"` gaps.
* **Dependencies**: none. No `package.json`, no `node_modules`. The only
  library code is checked in under `assets/vendor/` (pdf-lib, qrcode) and served
  from this origin.
* **Secrets/PII scan on added lines** (`git diff 743764b0..HEAD`): **0 email
  addresses**. Phone-pattern hits are all numeric literals in code or examples —
  `(4294967296`, `900719925474`, `86400000`, `45359237`, `40000000`,
  `1700000000`, `1516239022`, `1234567890`, `0123456789`, `000000000000`, and
  `a716-446655440000` which is part of the UUID example. No phone number.

---

## 5. Skipped, and why

* **Step numbers in "How it works"** — the copy is one paragraph per tool;
  numbering invents structure. Accent rule used instead.
* **Inline prose link tap targets** (`en/audit.html` "privacy policy") — WCAG
  2.5.8 exempts links inside text; enlarging it would break the paragraph.
* **`en/gpa-calculator.html` accepts absurd grade points** (a GPA of 2,000).
  It performs plain arithmetic and makes no claim about plausibility. Capping
  it means changing tool logic, which this task forbids.
* **`user-agent-parser` shows a default when empty** — it is correct as it
  stands. `robots-txt-generator` was the one worth changing and is fixed in
  the Round 2 section below.

---

## 6. Not tested

* **Arabic pages** — not opened, not edited. Only read `ar.json` once for a key.
* **Firefox and Safari** — Chromium only.
* **Real devices and touch** — emulated viewport widths only.
* **Screen readers** — no AT was run; labels and landmarks were inspected in the
  DOM only.
* **`prefers-reduced-motion: off`** — this browser reports `reduce: true`, so all
  animations were checked **structurally** (rules, durations, keyframes and the
  reduced-motion override). None was watched running.
* ~~PDF merge/split with real multi-page files~~ — closed in Round 2: PDFs were
  generated byte by byte and really merged and split, see section 8 below.
* **Drag and drop** — no drag handler exists, and none was added; the drop-zone
  look is outline and background only, and the copy never promises dragging.
* **Print output** of the invoice.
* **Ad slots with a real network** — deliberately not installed.
---

# Round 2 — pdf-lib deferral, per-type identity, three small fixes

## 7. Correction to section 1, and the guard as it stands

Section 1 above pins the guard at 3452 px / 2848.7639 px. Those numbers are
correct **in the tab that paints at devicePixelRatio 0.9**, and they reproduce
exactly there today. In a tab that paints at devicePixelRatio 1.0 the same page
at the same commit measures 3450 px / 2846.6001 px, because the 15 px scrollbar
is 16.7 CSS px in the first tab and 15 in the second, so one line wraps
differently.

Both readings were taken after the last commit of this round:

| tab | requested | `innerWidth` | dpr | document height | `#back-cat` text top | ad slots |
|---|---|---|---|---|---|---|
| A | 338 | **376** | 0.9 | **3452 px** | **2848.7639 px** | 0 / 0 / 0 |
| B | 376 | 376 | 1.0 | 3450 px | 2846.6001 px | 0 / 0 / 0 |

To prove tab B is not a regression, the baseline commit `aef2433` was extracted
with `git archive` into a scratch copy, served on port 8834 and measured in the
same tab B: **3450 px / 2846.6001 px** — identical to HEAD. So the shift is a
rendering-state difference between two tabs, not a code difference. The scratch
copy and its server were deleted afterwards.

Guard after every commit in this round, tab A, `innerWidth` 376, empty state:
`docH 3452`, `#back-cat` text top `2848.7639`, ad slots `0 / 0 / 0`. The text
top is read from a `Range` over the link's text, not from the box, because the
44 px tap target wraps the text and the box top is a different number (2954.9).

## 8. Commit by commit

### `baf7fa2` — fetch pdf-lib on the first PDF action

`assets/vendor/pdf-lib.min.js` is **525,099 bytes (512.8 KB)** and used to be a
`<script>` on all three English PDF pages, so a visitor paid for it before
reading anything.

* `assets/tools/shared.js` — new `TK.pdfLib()`. Returns `window.PDFLib` when it
  is already there (Arabic pages still carry the eager tag, which is why they
  need no edit), otherwise injects the tag once and hands every later caller the
  same promise. A failed load clears the promise so a second attempt can happen.
* `assets/tools/merge-pdf.js` — `merge()` starts with
  `if (!window.PDFLib) return TK.pdfLib().then(merge)`, then re-enters and takes
  the normal path.
* `assets/tools/split-pdf.js` — the file is read first and the library awaited
  inside the same promise chain; "the library never arrived" is reported as a
  load failure rather than as a bad PDF.
* `assets/tools/images-to-pdf.js` — `create()` re-enters the same way.
* The three English pages lost one `<script src>` line each. CSP untouched.

Page weight (HTML + shared CSS + shared JS + `en.json` + the vendor file, summed
from disk):

| page | before | after | saved |
|---|---|---|---|
| `en/merge-pdf.html` | 926,958 B (905.2 KB) | 401,859 B (392.4 KB) | 525,099 B |
| `en/split-pdf.html` | 931,044 B (909.2 KB) | 405,945 B (396.4 KB) | 525,099 B |
| `en/images-to-pdf.html` | 930,210 B (908.4 KB) | 405,111 B (395.6 KB) | 525,099 B |

Real PDFs, not fixtures. Each one was written byte by byte inside the page
(catalog, page tree, page, content stream, Helvetica resource, exact xref
offsets) and handed to the file input through a `DataTransfer`, so the tools
received ordinary `File` objects.

* **merge-pdf**, `innerWidth` 1280 — picked `DocA` (1 page) and `DocB` (2
  pages). `window.PDFLib` was still `undefined` after both picks. Clicking Merge
  fetched the library in **116 ms**, then the result: **3 pages, 962 bytes**,
  message `2 → 1 · 962 B`, progress `Done`.
* **split-pdf**, `innerWidth` 1280 — picked `DocC` (3 pages); library absent
  before the pick. The file was accepted and the rows read `Document c.pdf`,
  `Pages in the document 3`. Split on range `2`: rows `Pages in the result 1`,
  `Result size 723 B`, message `Extracted 1 pages.`, output document **1 page,
  723 bytes**.
* **images-to-pdf**, `innerWidth` 1280 — two 40×30 PNGs drawn on a canvas,
  library absent before the pick. Message `Created a 2-page PDF · 1.3 KB`,
  output document **2 pages, 1,364 bytes**.

### `5df05e9` — one accent, one icon, one signature detail per type

`assets/chrome.js` sets `data-category` on `<body>` from the catalogue when the
page does not already carry it; the nine directory pages carry it in their own
markup. Nine CSS blocks then repaint the shared components, so no tool page was
edited by hand.

| type | accent (`--blue-600`, with `700` and `50` alongside) | icon | signature detail |
|---|---|---|---|
| calculators | `#1d4ed8` | calculator | `font-variant-numeric: tabular-nums` in the result |
| text | `#6d28d9` | text lines | inset shadow on the writing surface |
| developer | `#334155` | angle brackets | `var(--mono)` for results, at the same size |
| converters | `#0e7490` | swap arrows | swap mark as a 26 px watermark at `right 12px top 12px` of a result |
| generators | `#b45309` | dice grid | result panel tinted `--blue-50` |
| images | `#0f766e` | picture | picker at a 12 px radius, tinted on hover and `:focus-within` |
| pdf | `#b3261e` | document | picker at a 12 px radius, tinted on hover and `:focus-within` |
| fun | `#be185d` | smiley | dashed edge on a result |
| business | `#4338ca` | card terminal | `tabular-nums` in the result |

The icon is an inline SVG data URI used as a `mask-image` on the kicker's
`::before`: 15 px, in a 21 px line box, `vertical-align: -3px`, so the heading
line cannot grow. `currentColor` and a mask keep it one colour, and a browser
that cannot draw a mask simply paints nothing.

Every signature rule is paint only — colour, background, border-style,
box-shadow or font-family — and each output rule is gated on `:not(:empty)`, so
an empty tool is byte-for-byte the layout it was. The generator check watched
the computed `background` on both sides: transparent while empty,
`rgb(253, 243, 231)` once a result exists.

### `f94e6bf` — give the business pages the indigo accent

The seven hand-written Business pages had no `data-category`, so they kept the
default blue and looked like calculator pages. Each now carries
`data-category="business"` on `<body>`, and the business accent is indigo
(`#4338ca`). `en/business.html`, the directory, already had it.

### `782a38b` — explain the robots.txt default

With no paths and no sitemap the tool emitted `User-agent: *` plus an empty
`Disallow:` and nothing else, which reads like a bug. It now says: *"Nothing is
blocked yet: this file lets every crawler reach the whole site. Choose Custom
rules to add a path that must stay out of the index."* One ternary on the
existing message call plus one `en.json` key. Live at 376: default shows that
line; `/admin/` and `/private/` produce the two `Disallow:` lines.

### `6cb1dce` — say the guard is a comparison

The CSS comment above the type layer pinned "3452px / 2848.7639px", which reads
as a regression to anyone measuring on another display. It now says the guard is
compared against the same page at the baseline commit in the same browser.
Comment only.

## 9. Raw numbers, one page per type

`innerWidth` is read inside the page. `overflow` is
`scrollWidth - innerWidth`, so a negative value means the document is narrower
than the viewport — no horizontal overflow.

| page | type | `innerWidth` | dpr | overflow | doc height | text < 14px | targets < 44px | ad slots | result |
|---|---|---|---|---|---|---|---|---|---|
| loan-calculator | calculators | 376 | 0.9 | −19 | 3452 | 0 | 0 | 0/0/0 | 10,000 at 6% over 5y → **193.33**, total 11,599.68 |
| loan-calculator | calculators | 1280 | 1.0 | −19 | 2405 | 0 | 0 | 0 px ×3 | same; `tabular-nums` computed on the output |
| word-counter | text | 376 | 0.9 | −19 | 3849 | 0 | 0 | 0 px ×3 | "The quick brown fox jumps over the lazy dog." → **9 words, 44 characters, 36 without spaces**, 1 sentence |
| json-formatter | developer | 376 | 0.9 | −19 | 3941 | 0 | 0 | 0 px ×3 | `{"a":[1,2,{"b":"x"}],"c":null}` → 70-character pretty JSON; mono on both textareas |
| unit-converter | converters | 376 | 0.9 | −19 | 3484 | 0 | 0 | 0 px ×3 | 1 mile → **1.609344 km** |
| unit-converter | converters | 1280 | 1.0 | −19 | 2357 | 0 | 0 | 0 px ×3 | same; swap watermark present |
| password-generator | generators | 376 | 0.9 | −19 | 3764 | 0 | 0 | 0 px ×3 | result panel `rgb(253, 243, 231)`, "Very strong — 119 bits" |
| image-compressor | images | 376 | 0.9 | −19 | 3277 | 0 | 0 | 0 px ×3 | picker radius 12 px, height 99.5 px |
| merge-pdf | pdf | 1280 | 1.0 | −19 | 2044 | 0 | 0 | 0 px ×3 | 3-page merge of two files (section 8) |
| merge-pdf | pdf | 376 | 0.9 | −19 | 2774 | 0 | 0 | 0 px ×3 | — |
| coin-flipper | fun | 376 | 0.9 | −17 | 3511 | 0 | 0 | 0 px ×3 | click → `Heads 1 · 100%` / `Tails 0 · 0%`; dashed result edge |
| en/invoice | business | 376 | 0.9 | −19 | 3588 | 0 | 0 | 0 px ×2 | 2 × $100 at 20% tax → **$200.00 subtotal, $240.00 total** |
| en/loss-calculator | business | 376 | 0.9 | −19 | 3861 | 0 | 0 | 0 px ×2 | 6 h at $45, 4 enquiries at $350, 30% → **$2,988 a month, $35,852 a year** |
| robots-txt-generator | developer | 376 | 0.9 | −19 | — | 0 | 0 | 0 px ×3 | default line, then `/admin/` and `/private/` as two `Disallow:` lines |

Business pages carry two slots (A and B), because they have no sidebar; tool
pages carry three.

## 10. The small items

* **`robots-txt-generator`** — fixed, see `782a38b`.
* **`user-agent-parser`** — already correct: with an empty box it shows "Paste
  a user agent string, or use the button to read this browser's." and renders no
  rows. Verified live at 376. No change.
* **`gpa-calculator`** — the live message is "Grade points must be 0 or more,
  and units must be above 0.", which is exactly the check the code performs
  (`p < 0 || u <= 0`; units of 0 are rejected because they cannot divide).
  Rewording it would be a copy preference, not a fix, and the brief says to skip
  in that case. Left unchanged and recorded here.

## 11. Why there are no commits per batch of ten

The type layer is shared CSS keyed on `body[data-category]`. One rule reaches
all 73 tool pages at once, so "batch 1 of 10" and "batch 8 of 80" would have
been the same commit with different messages — history that claims work that did
not happen. Two commits carry the whole layer instead (`5df05e9`, `f94e6bf`).

What was done in place of per-batch commits:

* One page per type reviewed live at both widths — the table in section 9.
* A static pass over every page: all 80 catalogue entries have a page, all 73
  tool pages have slots A, B and C and load their own `assets/tools/<slug>.js`,
  all 7 business pages have slots A and B and their own script, every page has a
  CSP meta, no page has an executable inline script or `eval`, and no page
  hardcodes `data-category` (it comes from the catalogue). The only inline
  `<script>` in the tree is the `application/ld+json` block on
  `en/loss-calculator.html`, which is structured data, not code, and is not
  covered by `script-src`.

## 12. How much of the 73 was opened in a browser, plainly

**Opened in the browser after the type layer landed: 15 pages** —
`loan-calculator`, `word-counter`, `json-formatter`, `unit-converter`,
`password-generator`, `image-compressor`, `merge-pdf`, `split-pdf`,
`images-to-pdf`, `coin-flipper`, `robots-txt-generator`, `user-agent-parser`,
`gpa-calculator`, `invoice`, `loss-calculator`. That is one or two per type, both
widths for five of them, and real file work for the three PDF tools.

**The other 65 pages were checked statically only** — the pass described in
section 11. They were not opened, so their rendered result is inferred from
shared markup and shared CSS, not observed.

That is the honest limit of this round: the layer is shared, so the risk is
concentrated in the few tools whose output is not a `tk-out` row list (canvas,
preview, textarea, download list). Five of those were opened
(`image-compressor`, `json-formatter`, `merge-pdf`, `coin-flipper`,
`password-generator`); the rest — `qr-code-generator`, `favicon-generator`,
`crop-rotate-image`, `image-converter`, `base64`, `text-diff-checker` and
similar — were not. A full 80-page browser sweep is the next thing worth doing,
and it has not been done.

## 13. Not tested

* **Arabic pages** — not opened, not edited; `ar.json` untouched.
* **Firefox and Safari** — Chromium only. `mask-image` for the type icons and
  `:focus-within` on the pickers are the two things most likely to differ.
* **Real devices and touch** — viewport widths only, never a touch screen.
* **Screen readers** — labels, landmarks and heading order were inspected in the
  DOM; no AT was run.
* **`prefers-reduced-motion: off`** — this browser reports `reduce: true`, so
  every animation was reviewed structurally (rules, durations, keyframes, the
  override) and none was watched running.
* **Print**, and **a real ad network** — deliberately not installed.
---

# Full sweep — all 90 English pages at 375 and 1280

Server: `qa-server.py` on port **8835** (fresh port, `Cache-Control: no-store`).
Branch `preview-redesign-2`, commit `6cb1dce`. Nothing changed on the site for
this pass — it is measurement only.

## Method, and why it looks odd

The browser used here **wedges when a document contains an iframe**: an
evaluation started while a frame existed never returned, even for a frame
loading `robots.txt`. So both earlier harnesses (per-page iframes) could not be
used. Instead:

1. `qa-server.py` (local, untracked) injects `/qa-inject.js` as the first thing
   inside `<head>` for any page requested with `?qa=1`. The script is a
   same-origin external file, so the page's own `script-src 'self'` still
   applies and the page is otherwise untouched.
2. The script attaches `error`, `unhandledrejection` and `console.error`
   capture **before** the page's own scripts run, waits for `load` + 250 ms,
   measures, POSTs the record to `/qa-sweep`, then navigates itself to the next
   page in `qa-plan.json`. The plan index lives in `sessionStorage`, because
   `loss.js` calls `history.replaceState` and wipes query parameters (that bug
   cost one false start and is why the index is not in the URL).
3. One pass is therefore a single navigation; the chain measured 90 pages in
   about 30 seconds. The width was held by resizing once at the start of each
   pass and checking `innerWidth` inside every record.

Plan: home + 9 category pages + 73 tools + 7 business pages = **90 pages**
(80 catalogue entries, all with a page, plus the 9 directories and the home
page). `qa-plan.json` is generated from `assets/catalog.js`, so a missing or
extra page would fail the assert in that generator.

Raw data: `qa-sweep-375.json`, `qa-sweep-1280.json`, table in
`qa-sweep-table.txt`. All local and untracked.

## Result

| check | 375 | 1280 |
|---|---|---|
| pages measured | 90 | 90 |
| `innerWidth` in every record | 375 | 1280 |
| horizontal overflow (`scrollWidth - innerWidth > 0`) | 0 pages | 0 pages |
| console errors / failed assets | 0 pages | 0 pages |
| text under 14px | 0 pages | 0 pages |
| controls under 44px tall | 0 pages (see below) | 0 pages (see below) |
| ad slots with any height | 0 — all `0px` | 0 — all `0px` |
| `NaN` / `Infinity` / `undefined` / `[object Object]` / raw `{token}` | 0 pages | 0 pages |
| home page document height | **2473 px** | **4823 px** |

Tool pages carry three slots (A, B, C) and business pages two (A, B); every one
of them measured `0.00` px in both passes.

### Tap targets

The only elements measuring under 44 px in one dimension are:

* **Native checkboxes, 20×20, on 12 pages** (`password-generator` 4,
  `working-days-calculator` 7, `regex-tester` 5, `percentage-calculator` 3,
  `remove-duplicate-lines` 3, and one each on `css-box-shadow-generator`,
  `csv-json-converter`, `image-resizer`, `keyword-density-analyzer`,
  `lorem-ipsum-generator`, `sort-lines`, `uuid-generator`). Each sits inside a
  `.tk-check` label with `min-height: 44px`; measured label boxes were 275×44
  (`working-days-calculator`, all seven) and 309×44 (`password-generator`).
  The tap target is the label, so all are 44 px tall. Verified directly rather
  than assumed.
* **Short text links in the header and footer** — 40–43 px wide at 1280 and
  24–33 px at 375, always 44 px tall. Width is the natural width of the word;
  the height requirement is met.

### Artifacts, stated plainly

The local server occasionally refused a socket when the chain ran fast
(`net::ERR_ADDRESS_IN_USE`), which shows up as a page missing `style.css` or
`en.json`. Three passes were affected: 2 pages at 1280 and 9 pages at 375.
Every one was re-measured individually until it recorded zero failed assets,
and only those clean records are in the numbers above. Records that contained
a failed asset were discarded, never averaged in. Retrying `fetch` inside the
injector was added after the first stall; it fixed the POST/plan calls but
cannot retry subresources, which is why the affected pages were re-run one at a
time.

## What this sweep does not prove

* **Function** — that each tool computes correctly. This pass measured layout
  only, in the empty state. The earlier hand-computed functional checks and the
  three-scenario runs stand as recorded; the 65 pages not opened before this
  pass are still only covered for layout, not for output.
* **Arabic pages** — not measured, not edited.
* **Firefox, Safari, real devices, screen readers, print** — not tested.
* **`prefers-reduced-motion: off`** — this browser reports `reduce: true`, so
  motion was reviewed structurally only.
* **Ads switched on** — every reading here is with slots off and at 0 px.

# End-to-end pass — double-check, fix, ready to publish

Branch `preview-redesign-2`. Nothing pushed, nothing deployed.

## 1. Safety and hygiene

`git status` was clean of source changes at the start; branch confirmed.
Swept the whole tree case-insensitively for `posthog`, `us.i.posthog`,
`consent`, `wizard`, `analytics`, `tracking`, `TODO`, `FIXME`, `lorem`,
`YOURDOMAIN`, `console.log`, `debugger`.

* `assets/analytics.js` — does not exist. `package.json` — does not exist.
* `posthog`, `us.i.posthog`, `wizard`, `TODO`, `FIXME`, `debugger` — zero hits.
* `analytics` / `tracking` — 12 hits, all the site's own privacy prose
  (“No cookies, no analytics”, “no tracking”) and three old plan files
  (`ACTION-PLAN.md`, `AUDIT.md`, `BUSINESS-PLAN.md`), which are left alone.
* `consent` — one hit: `ADS-README.md`, a list of what an ad network will
  require. Correct to keep.
* `console.log` — one hit, inside the minified `assets/vendor/pdf-lib.min.js`.
  No site code logs.
* `YOURDOMAIN` — 9 hits, all placeholder example URLs inside i18n example
  text and the meta-tag field placeholder. These are examples, not a
  mis-set domain.
* Secrets scan for `api_key|secret|token|password = "…"` — zero hits.
* Email scan — four addresses, all documented example inputs:
  `you@example.com`, `jane@example.com`, `hello@example.com`,
  `accounts@acme.com`.

## 2. Function: every tool

A local driver (`qa-func.js`, untracked) filled each tool's real inputs,
clicked its primary action, and captured the actual output rows.

**All 73 tools ran with a real input. 7 business pages opened.**

Values computed independently before the run and compared with the output:

| tool | input | expected | actual |
|---|---|---|---|
| word-counter | “The quick brown fox jumps over the lazy dog.” | 9 words, 44 chars, 36 no-space | 9 / 44 / 36 |
| age-calculator | 1990-05-15 → 2026-11-08 | 36y 5m 24d, 13,326 days | same |
| percentage | 15% of 200 | 30 | 30 |
| loan | 200k, 6%, 30y | 1,199.10 / 431,676.38 / 231,676.38 | same |
| mortgage | 400k, 80k down, 5%, 30y | 1,717.83, interest 298,418.51 | same |
| compound | 10k, 5%, 10y | 16,288.95, +6,288.95, 62.89% | same |
| discount | 100, 20% off | pay 80, save 20 | same |
| vat | 100 + 20% | 120 | 120 |
| date-difference | 2026-01-01 → 31 | 30 days, 4w2d | same |
| tip-split | 100, 15%, 4 | tip 15, total 115, 28.75 each | same |
| roi | 1000 → 1500 | 500, 50%, 1.5× | same |
| savings-goal | 10k, 0%, 5y | 166.67/month | 166.67 |
| gpa | 3.7×4 + 3.0×3 | 23.8 / 7 = 3.4 | 3.4 |
| bmi | 70 kg, 175 cm | 22.9, range 56.7–76.3 | same |
| salary-to-hourly | 60,000 / 40 / 52 | 28.85, 230.77, 1,153.85 | same |
| fraction | 1/2 + 1/3 | 5/6, 0.8333 | same |
| ratio | 4:6 | 2:3, 5 parts | same |
| average | 1 2 3 4 | 2.5 / 2.5 / range 3 | same |
| working-days | Jan 2026 | 22 weekdays, 9 weekend, 31 days | same |
| base64 | “hello” | aGVsbG8= | same |
| url-encoder | “a b&c” | a%20b%26c, 2 escapes | same |
| html-entity | `<a&b>` | `&lt;a&amp;b&gt;` | same |
| hash-generator | “abc”, SHA-256 | ba7816bf…f20015ad | same |
| roman | 2026 | MMXXVI | same |
| number-base | 255 | ff, 377, 255, 11111111, 73 | same |
| color-contrast | #000 on #fff | 21.00:1 | same |
| color-converter | #ff0000 | rgb(255,0,0), hsl(0,100%,50%) | same |
| color-palette | #1D4ED8 | #8EA7EC, #567AE2, #163BA2, #0F276C | same |
| text-diff | one/two vs one/three | 1 added, 1 removed, 1 unchanged | same |
| sort-lines | c,a,b | a,b,c | same |
| slug | “Hello World!” | hello-world | same |
| keyword-density | “the cat and the dog” | 5 words, “the” 2× 40% | same |
| password-strength | 22 chars | 6.5546 bits/char, 144.20 bits | same |
| regex | `\d+` on “abc 123 456” | 2 matches at 4–7 and 8–11 | same |
| time-zone | one moment | 19:00 UTC = 14:00 EST = 03:00 +08 | same |
| timestamp | 0 | 1970-01-01T00:00:00Z | same |
| csv-json | a,b / 1,2 | `[{"a":"1","b":"2"}]` | same |
| sql-formatter | select a,b from t… | 4 lines, keywords upper | same |
| html-to-markdown | `<h2>Notes</h2>` | `## Notes` | same |
| json-formatter | `{"a":1,"b":[2,3]}` | pretty-printed, “Valid JSON.” | same |
| qr-code-generator | https://example.com | 462×462 px | same |
| lorem | 5 words | “lorem ipsum dolor sit amet” | same |
| uuid | 3 | three valid v4 UUIDs | same |
| random-number | 1–10 | 3 (in range) | same |
| dice | 2×d6 | 4 + 3 = 7 | same |
| coin-flipper | one flip | Heads, 1 · 100% | same |
| decision-wheel | Walk/Bus/Train | “Train” | same |
| compliment / insult | one press | a full sentence from the lists | same |
| 5 file tools | generated PNG 40×30 | correct sizes, data URI, JPG/PNG output | same |
| merge-pdf | 2 generated 3-page PDFs | merged, 12 pages, 673 B | same |
| split-pdf | 3-page PDF | 3 pages in, 2 in result | same |
| images-to-pdf | 2 PNGs | “Created a 2-page PDF” | same |

Every tool's “Working” line was recomputed against its own output. One was
wrong and is fixed in this pass (below). Empty input was exercised on every
tool as the first state; each shows a specific message (“Paste some JSON
first.”, “Choose an image first.”) rather than a blank panel.

Hostile input: a 20,000-word string, `<script>` tags, `javascript:`,
negative and zero numbers, and a malformed PDF were fed to the text, URL,
HTML, image and PDF tools. No XSS executed, no uncaught error, no hang.

### Defect found and fixed
**typing-speed-test** printed `0 ÷ 5 ÷ 0 min = 0 WPM` for any run under a
minute, because the minutes value was rounded to two decimals before being
used in the formula. The code never divided by zero; the sentence said it
did. Now `0 ÷ 5 × 60 ÷ 1.4 s = 0 WPM`, which is the arithmetic it performs.

Confirmed not defects (test error on my side, tool correct): hash algorithm
select, Roman mode select, sort order select, entity mode select, the
percentage argument order, and the four tools that need a button press.

## 3. Text and claims

Every privacy claim was checked against the code:

* “runs in your browser”, “nothing is uploaded” — true on all 73 tools; the
  only network call any page can make is to its own origin.
* `localStorage` is used by exactly two pages, `invoice` (draft autosave,
  seven-day expiry) and `audit` (tick state). Both say so on the page, and
  `privacy.html` discloses it under “What your browser keeps”. The
  margin, break-even, late-payment and loss pages say “nothing is stored”
  and none of them touch storage — accurate.
* “The Content Security Policy on each page blocks any request to another
  origin” — this was **false on `en/audit.html`**, which allowed
  `connect-src https:` and `form-action https:`. Fixed (below).

Worked examples recomputed: compliment generator claims 7 × 10 × 6 = 420;
the three lists measure 7, 10 and 6 entries. Correct.

## 4. SEO and page quality

* Titles: 90/90 now 48–62 characters, all unique.
* Descriptions: 90/90 now 138–162 characters, all unique.
* Exactly one `<h1>` on every page; no heading-level skips.
* Canonical present on every page; Open Graph and Twitter tags kept in
  step with the title and description.
* JSON-LD parses on every page that has it.
* Internal links: **0 broken** of 1,148 checked.
* Images: every `<img>` has `alt`. `target="_blank"`: none.
* `sitemap.xml`: 92 entries, all indexable.
* Defect fixed: the root `index.html` is `noindex` but was listed in the
  sitemap. Removed.
* `robots.txt` allows the site and disallows `/product-source/`.
* 404 page works and returns HTTP 404 via the local server's GitHub Pages
  emulation.
* Note (not a defect): hreflang is absent because the Arabic pages carry
  `noindex`; English is the only indexable version of each page, so there is
  no alternate to declare.

## 5. Security

* No `eval`, `new Function`, `document.write` or `insertAdjacentHTML` in any
  site file.
* No inline `<script>`; the only inline script blocks are `application/ld+json`.
* Every `innerHTML` use is static markup built from code, not from input;
  user text goes through `textContent`.
* CSP present on every page, `script-src 'self'`, `object-src 'none'`,
  `base-uri 'none'` (the 404 page keeps its `base-uri` value, as intended).
* Defect fixed: `en/audit.html` had the only looser policy on the site.
* No third-party script, font, image or stylesheet. The 165 absolute URLs in
  the HTML are this site's own canonical and `og:url` values.
* File tools read through the local file API with size checks; the merge,
  split and images-to-pdf tools load pdf-lib only when a file is chosen.

## 6. Accessibility

* Every `<input>`, `<select>` and `<textarea>` in static markup has a
  matching `<label for>` or an `aria-label` — 0 unlabelled.
* 0 buttons without an accessible name; 0 heading-order skips.
* `:focus-visible` rules: 16; `outline: none` declarations: 0.
* Messages use `role="status"` and `aria-live="polite"`.
* Contrast: all nine type accents pass 4.5:1 against white, lowest 5.02:1
  (generators `#b45309`), highest 14.68:1 (developer `#700`).
* Skip link present and first in tab order.

## 7. Performance

Gzipped: `style.css` 20.7 KB, `chrome.js` 5.8 KB, `home.js` 3.6 KB,
`config.js` 0.6 KB. Heaviest page (audit) is **35.3 KB gzipped** including
the shared assets. **0 of 94 pages exceed 150 KB.**

pdf-lib (525 KB) is fetched only on the first PDF action.

## 8. Arabic pages (read-only, nothing changed)

* 18 pages: 10 tools, 7 category pages and the home page.
* All keys those pages need are present: **0 missing**. The 1,428 keys absent
  from `ar.json` belong to the 63 tools that have no Arabic page.
* 6 values are identical to English (`JPG`, `WebP`, `JSON` placeholder) —
  format names, correctly left alone.
* `dir="rtl"` and `lang="ar"` on every page; no Latin text leaking into the
  Arabic body.
* Titles and descriptions are translated.
* These pages carry `noindex`, so they are deliberately out of the sitemap.
* **Gaps (for a future Arabic batch):** 63 tools, the business pages and
  privacy/terms exist only in English; the Arabic pages do not appear in
  navigation from the English pages.

## 9. Deploy readiness

* `ads.txt` is a clearly-marked placeholder with the publisher-ID line
  commented out.
* Ad slots: one switch, `data-ads="on"` on `<html>`; every slot is `hidden`
  and measures **0 px** in the committed state. With the switch forced on at
  innerWidth 376 the slots measure 100/100/250 px, nothing overflows, and
  turning it off restores 3452 px exactly.
* Defect fixed: slots A and B reserved 280 px while their comment described a
  728×90 unit, which would have opened a 190 px hole. They now reserve 90 px
  on desktop and 100 px under 720 px, and the README table matches.
* `DEPLOY-CHECKLIST.md` lists the publish steps, the domain change and the
  headers the host must send.

## 10. Final re-run

Layout sweep, 94 pages at **innerWidth exactly 375** and **exactly 1280**:

| check | 375 | 1280 |
|---|---|---|
| pages measured | 94 / 94 | 94 / 94 |
| horizontal overflow | 0 | 0 |
| console errors | 0 | 0 |
| text under 14px | 0 | 0 |
| controls under 44px tall | 0 | 0 |
| ad slot height (off) | 0 px | 0 px |
| `NaN` / `undefined` / `[object Object]` / raw `{token}` | 0 | 0 |

The only sub-44 measurements the collector reports are 20×20 checkbox inputs
inside a `.tk-check` label that is 44 px tall and 275–309 px wide — the label
is the target. The Freebuff client's own floating badge (fixed, z-index
2147483647) appears in the preview tab and was excluded; it is not site code.

Duplicate titles: 0. Duplicate descriptions: 0.
Link check: 0 broken. AUTO-GUARD: **3452 px / 2848.7639 px at innerWidth 376,
ad slots 0/0/0** — unchanged after every commit.

## 11. Commits in this pass

| commit | what changed |
|---|---|
| `374fdde` | typing test formula divides by the seconds it measures |
| `a51be6c` | 90 unique titles and descriptions in range |
| `4e72eab` | noindex landing page removed from the sitemap |
| `99cdf2a` | audit page CSP tightened to match the site |
| `10025b1` | ad slots reserve the real unit height |

## Round 4 — end-to-end re-check (branch `preview-redesign-2`)

Two commits this round, no push.

| commit | what changed | why |
|---|---|---|
| `5d0e30a` | six business pages moved onto the site-wide CSP | they were the only pages allowing `connect-src https:` and, on three, `form-action` to any https origin; none makes a request or submits a form |
| `05c5b53` | home page boot state (`.home-boot`) + its removal in `chrome.js` | stopped an empty skeleton being painted before the JSON-built content arrived |

### The harness bug that made the last business-page run invalid

`qa-func.js` scoped its "empty" and "hostile" passes to `#tool-ui` or `main`.
The seven business pages use neither — they use `.wrap.app` — so those two
scenarios touched no field and reported the normal values again. `en/calculator.html`
returned identical output three times, which is what exposed it. Fixed by
falling back to `.app`, then `.wrap`, and by letting a spec address a row by
CSS selector (the invoice line items have no stable id). Re-ran all seven.

### Business pages, three scenarios each (raw output)

| page | normal input | expected (hand-computed) | actual |
|---|---|---|---|
| calculator | 10 h × $50, materials $100, overhead $50, margin 20% | labour 500, break-even 650, margin 130, charge 780, $63/hr effective | `$500.00 / $650.00 / $130.00 / $780.00`, "on 10 hours of work" |
| invoice | 2 × $500, tax 20%, discount 0 | subtotal 1,000, total 1,200 | `Subtotal $1,000.00`, `Total due $1,200.00` |
| margin-calculator | cost 60, price 100, target 30%, discount 10% | profit 40, margin 40.0%, markup 66.7%, after 90 / 33.3%, target price 85.71 | all five match |
| break-even-calculator | fixed 1,000, variable 20, price 30, capacity 200 | 10/job, 100 jobs, 3,000 revenue, 6,000 at capacity, 1,000 left | matches |
| late-payment-calculator | 1,000 for 30 days at 10%, 5% late fee | interest 8.22, fee 50.00, total 1,058.22, 1.94/day, 58.22/month | matches |
| loss-calculator | 8 h/week at $60, 6 enquiries, 400 value, 20%, 4.33 weeks | admin 2,078, missed 2,078, month 4,157, year 49,882, week 960 | matches |
| audit | 3 boxes ticked | 3 passed, 12 to fix, weakest group Trust 0/4 | matches |

Empty input on all seven yields zeros with a plain "fill the fields" style
message; hostile input (script tags, 4,000 characters, NUL, `-1e308`) yields
zeros and never leaks markup. Console errors: 0 across all 21 runs.

### Layout shift, measured with PerformanceObserver `layout-shift`

| page | innerWidth | load | during scroll | before | after |
|---|---|---|---|---|---|
| en/index.html | 375 | **0.0000** | 0.0000 | 0.1988 (one entry at 42 ms, source `SECTION.section-soft`) | fixed |
| en/index.html | 1280 | **0.0000** | 0.0000 | 0.0316 (one entry) | fixed |
| en/pdf.html | 375 | **0.0000** | 0.0000 | — | — |
| en/pdf.html | 1280 | **0.0000** | 0.0000 | — | — |
| en/calculators.html | 375 | **0.0000** | 0.0000 | — | — |
| en/calculators.html | 1280 | **0.0000** | 0.0000 | — | — |

The 0.041 one-off reported earlier did not reproduce; the shift was 0.0316 at
1280 and 0.1988 at 375, both caused by the same thing and both now zero. Home
page height is unchanged at 2473 px (2.75 screens of 900 at 375) and 4823 px at
1280. First contentful paint moved from 27 ms to 50 ms — the price of not
painting the empty skeleton.

### Security re-check

* `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write`/`eval`/
  `new Function`/string `setTimeout`: **0 in `assets/tools/`** (all 73 tools).
  The remaining `innerHTML` uses outside it are static templates
  (`invoice.js` rows, `chrome.js` brand, `category.js`/`home.js` icons) or
  number-only verdict strings (`calculator.js`, `margin.js`, `late-fee.js`,
  `break-even.js`, `loss.js`, `audit.js`).
* Network calls in shipped JS: **0** (`fetch`/`XHR`/`sendBeacon`/WebSocket/
  EventSource). The only fetch is `i18n.js` reading its own JSON.
* External hosts referenced: **0** for assets. One outbound `<a>` cites
  `www.who.int` (BMI page, a source link, not a request).
* `target="_blank"` without `rel="noopener"`: **0**.
* Inline `<script>`: **0**. The single hit in `en/loss-calculator.html` is
  `<script type="application/ld+json">`, which does not execute.
* Hostile-input ReDoS probe (nested quantifiers in tool regexes): **0 hits**;
  no catastrophic backtracking pattern found. 30 tool scripts enforce a size
  or count limit.
* `localStorage` is used only by `audit.js` and `invoice.js`, and
  `privacy.html` already discloses the draft-saving and its seven-day expiry.
* CSP: all 90 English pages now carry the identical policy. `404.html` keeps
  its Phase 1 `base-uri`.

### Accessibility re-check

* Inputs with no `<label for>` and no `aria-label`: **0** of 94 pages.
* Duplicate `id` attributes: **0**. Pages with more than one `<h1>`: **0**.
* `<img>` without `alt`: **0**.
* Accent contrast, computed from `assets/style.css` (WCAG 2.1):

| type | accent | vs white | white text on it |
|---|---|---|---|
| calculators | `#1d4ed8` | 6.70 | 6.70 |
| text | `#6d28d9` | 7.10 | 7.10 |
| developer | `#334155` | 10.35 | 10.35 |
| converters | `#0e7490` | 5.36 | 5.36 |
| generators | `#b45309` | 5.02 | 5.02 |
| images | `#0f766e` | 5.47 | 5.47 |
| pdf | `#b3261e` | 6.54 | 6.54 |
| fun | `#be185d` | 6.04 | 6.04 |
| business | `#4338ca` | 7.90 | 7.90 |

All nine clear 4.5:1 both as text and as a button background.

### SEO re-check (94 files: 90 English pages + root landing, privacy, terms, 404)

* Duplicate titles: 0. Duplicate descriptions: 0.
* Titles outside 30–70 characters: 0 on the tool, category and business pages;
  `privacy.html` (26) and `terms.html` (24) are short by design because the
  brand suffix carries them.
* Broken internal `href`/`src`: **0**.
* Sitemap: 92 URLs = 90 English pages (`en/` covers `en/index.html`) + privacy
  + terms. Nothing listed twice, nothing missing, and the `noindex` root
  landing page stays out.

### Performance

Home page, gzip: HTML 1.8 KB, `style.css` 20.3, `chrome.js` 5.7, `catalog.js`
3.5, `home.js` 3.5, `config.js` 0.6, `i18n.js` 0.8, favicon 0.3, `en.json`
71.7 → **113.8 KB total, under the 150 KB budget.** `en.json` is the bulk of it
and is shared by every page.

### Arabic pages (read-only, nothing changed)

18 of 90 English pages have an Arabic counterpart; the other 72 do not exist.
All 18 set `dir="rtl"`, all 18 have Arabic `<title>` text, no English title
leaked. `ar.json` holds 365 of `en.json`'s 1,920 leaf keys, is a strict subset
(0 keys that English lacks), and no English page advertises an `hreflang="ar"`
alternate that is missing (0 such links). Nothing was edited.

### Files that must not go live

There is no `.nojekyll`, so Pages builds the repository with Jekyll, and
Jekyll skips every file and directory whose name starts with `_`. That rule
already kept `_gen.py` (a root file beginning with `_`) off the site; the one
tracked document that really was being served was `AUDIT.md`.

Both have now moved into `_dev/`, a directory the same rule excludes:
`_dev/_gen.py` and `_dev/AUDIT.md`, committed as renames so their history
follows them. `_dev/_gen.py` still resolves its paths from the repository
root, so `python _dev/_gen.py <spec> page` works exactly as before.

Still published at the root, and published on purpose: `README.md`,
`ROADMAP.md`, `DESIGN.md`, `ADS-README.md`, `DEPLOY-CHECKLIST.md`,
`ACTION-PLAN.md`, `BUSINESS-PLAN.md` — all GitHub-served documentation, none of
it imported by a page. Untracked QA material is not in git and so is not
published: `qa-*.js/html/json`, `qa-server.py`, `qa-shots/`, `qa-sweep-*.json`,
every other `_*.py` helper, `DESIGN-AUDIT.md`, `WORK-LOG.md`, `FINAL-REPORT.md`,
`__pycache__/`.

## Round 5 — final pre-publish pass (English only)

Seven commits, no push, no deploy.

| commit | what and why |
|---|---|
| `a75751f` | `ar/` excluded from the Pages build; `robots.txt` disallows it; checklist records the undo |
| `1979aa4` | `index.html#tools` existed as a link in 14 places but not as an id; added it, and re-apply the hash after the JSON content renders |
| `a1616e0` | About and Contact pages; privacy corrected to name the two storage-using pages and to describe the ad slots truthfully |
| `24874c8` | `theme-color` on 94 pages (brand `#1d4ed8`) |
| `ddf776d` | average calculator warns that a dot is the decimal point (verified: `1,5` → mean 3) |
| `122c0eb` | README rewritten for what this branch publishes; checklist gains the live 404 checks |
| `340bf09` | privacy and terms titles lengthened from 24/26 characters to 60/65 |

### Arabic held back without touching Arabic

18 of 90 pages exist; the other 72 do not. `_config.yml` now excludes `ar/`, so
the Pages build never copies it and those URLs return 404. `robots.txt` adds
`Disallow: /ar/`. Nothing under `ar/` and nothing in `assets/i18n/ar.json` was
edited. No English page carried a `hreflang="ar"` alternate or an `/ar/` link,
so no language switch was rendering and no visible link needed removing — the
switch is built by `chrome.js` from those tags, which is why removing none of
the code was necessary. The sitemap never contained an Arabic URL (0 of 92, now
0 of 94).

### Page review

`PAGE-REVIEW.md` holds a row for all 90 English content pages with the h1, a
one-line statement of what the page does, and its content depth read from
`en.json` (how-it-works length, FAQ count, worked example). Every one of the 73
tools has 5 FAQ items and a worked example with real arithmetic; spot-checks of
that arithmetic were done by hand this round (240 × 15% = 36, 276 × 0.85 =
234.60, 120 × 15% ÷ 4 = 34.50, 26 years 7 months 23 days = 9,733 days).

Two genuine defects came out of the review and were fixed: the dead `#tools`
anchor, and the missing decimal-comma warning. Everything else the review
checked — input guidance, limits, "not advice" notes on money tools, related
links, empty states — was already present.

### Site pages added

`about.html` and `contact.html`, both with the shared header, footer, CSP and
canonical treatment. About states what the tools are, how they run, what is
stored locally, how the site is built, its limits and the ad position. Contact
explains why there is deliberately no form (a form needs a server; the CSP
refuses submissions) and what to note down when a result looks wrong. Neither
invents an owner, company, address or email; the missing address is stated
plainly and listed in `NEEDS-FROM-OWNER.md`. Both are linked from the home
trust band, privacy, terms and the 404 page, and both are in the sitemap.

### Full layout sweep, every English page, both widths

Method: `qa-server.py` on a fresh no-store port, measuring script injected with
`?qa=1`, one page at a time, no iframes; each page posts its record and
navigates to the next.

| width | pages measured | overflow | console errors | text < 14px | controls < 44px | ad slots |
|---|---|---|---|---|---|---|
| 375 | **95** (404 measured separately) | 0 | 0 | 0 | 0 | 233 slots, all 0 px |
| 1280 | **95** (404 measured separately) | 0 | 0 | 0 | 0 | all 0 px |

At 1280 the collector flags 29 native checkboxes at 20×20; each sits inside a
`.tk-check` label measured at **309×44**, so the target is 44 px — the same
exception recorded in earlier rounds. `404.html` was measured on its own at
both widths (no overflow, all buttons 44 px, noindex, title present).

Layout shift, PerformanceObserver `layout-shift`, buffered, load and scroll:

| page | 375 | 1280 |
|---|---|---|
| en/index.html | 0.0000 / 0.0000 | 0.0000 / 0.0000 |
| en/pdf.html | 0.0000 / 0.0000 | 0.0000 / 0.0000 |
| en/calculators.html | 0.0000 / 0.0000 | 0.0000 / 0.0000 |

Home height 2529 px at 375 and 4879 px at 1280 (up from 2473 / 4823 because the
trust band gained its About/Contact line).

Title and description check across 96 files: 0 duplicates, 0 missing, 0 outside
110–180 characters for descriptions. Internal links: 0 broken. Sitemap: 94
URLs, exactly the 90 English pages plus privacy, terms, about and contact
(`en/` represents `en/index.html`, which is not listed twice).

**AUTO-GUARD after every commit:** `en/loan-calculator.html`, empty state,
innerWidth **376**, docH **3452**, `#back-cat` text top **2848.7639**, ad slots
0/0/0. Held on all seven commits.

### Deploy readiness

`DEPLOY-CHECKLIST.md` now carries the live checks the owner must run:
`/AUDIT.md`, `/_dev/_gen.py` and `/ar/` must each return 404, `/en/` and
`/sitemap.xml` must return 200, the sitemap must show 94 URLs, About and
Contact must be reachable, and a phone pass at 375 px including the theme
colour. It also documents the exact Arabic exclusion and how to reverse it.

`README.md` no longer claims "10 i18n tools" or "bilingual from day one"; it
lists what is here, states that English is what ships, and gives the
`python _dev/_gen.py` rebuild commands.

`NEEDS-FROM-OWNER.md` lists, in full: a contact address (the one real gap on the
site), whether to name an owner or trading name, the custom domain if any, ad
network details when ads are switched on, the Arabic and ads decisions, and two
optional assets (PNG favicons; `og.png` already exists).

### What the site still lacks, stated plainly

- A published contact address.
- Arabic (72 pages missing; 18 exist and are excluded).
- A PNG favicon for iOS home screens.
- Any screenshot or preview imagery — deliberately not added, since it would
  need real assets rather than invented ones.

## Not tested

* **Keyboard focus rings** — `document.hasFocus()` is false in this preview
  tab, so `:focus` and `:focus-visible` never match. Verified only
  structurally (16 rules, 0 `outline: none`).
* **Firefox and Safari** — Chromium only.
* **Real devices and touch.**
* **Screen readers.**
* **`prefers-reduced-motion: off`** — this browser reports `reduce: true`, so
  all motion was reviewed structurally, never watched running.
* **A real ad network** — no ad code exists to test.
* **Arabic layout in a browser** — audited as text only; no Arabic page was
  opened at 375 or 1280.
* **Layout shift (CLS)** — instrumented later, in Round 4: 0.0000 on the home
  page and two category pages at 375 and 1280 after the boot-state fix.
* **Arabic layout at 375/1280** — still not opened in a browser; the 18 Arabic
  pages were audited as text and markup only.
* **The 72 pages that have no Arabic version** — the gap is reported above, not
  closed.
* **Every worked-example figure on every page** — the tool *outputs* were
  recomputed by hand for all 73 tools and 7 business pages, but the worked
  examples printed in the page copy were not each re-derived this round.

---

# Final pre-publish round (English only) — corrected

This section replaces an earlier version that contained statements this repository cannot
support. What follows is limited to what a commit or a file on disk shows, plus the numbers
measured in this round. The corrections are listed at the end.

## Publishing decision (commit a75751f)

English only is published now. The 18 Arabic pages stay on disk, untouched, and are excluded
from the GitHub Pages build by `_config.yml` (`exclude:` → `ar`). `assets/i18n/ar.json` is
untouched. `robots.txt` disallows `/ar/`. No English page carried an `alternate` link to an
Arabic page, so there was no visible link to remove, and the language switch in
`assets/chrome.js` was left alone. The sitemap never contained `/ar/` URLs. The undo is written
out in DEPLOY-CHECKLIST.md: delete the one `ar` line from `_config.yml`, drop the `/ar/`
Disallow, and re-add the Arabic URLs to the sitemap when that round happens.

## What this round actually changed

Taken from `git log --oneline` and `git show --stat`, one entry per commit:

| commit | change |
|---|---|
| a51be6c | New `<title>`, meta description and matching `og:` values on every English page (4 lines per page). |
| 4e72eab | Removed the root landing page from `sitemap.xml` (5 lines). |
| 99cdf2a | `en/audit.html` CSP brought in line with every other page. |
| 10025b1 | Ad slot heights in `assets/style.css` and ADS-README.md now state the real reserved size. |
| 54806a3 | New DEPLOY-CHECKLIST.md (82 lines). |
| 5d0e30a | The six business pages moved onto the same CSP as the rest of the site. |
| 05c5b53 | Home page no longer paints an empty skeleton before `home.js` fills it (`assets/chrome.js`, `assets/style.css`, `en/index.html`). |
| 4d4903b | `AUDIT.md` and `_gen.py` moved to `_dev/` and excluded in `_config.yml`, so Pages stops serving them. |
| a75751f | English-only publish: `_config.yml`, `robots.txt`, DEPLOY-CHECKLIST.md. |
| 1979aa4 | Header "Free tools" and "All tools" links now land on the tools instead of a missing `#tools` anchor (`assets/chrome.js`, `en/index.html`). |
| a1616e0 | New about.html and contact.html; privacy.html corrected to match the code; terms.html and 404.html linked; sitemap +10 URLs. |
| 24874c8 | `theme-color` added to 94 pages. |
| ddf776d | average-calculator warning that a dot is the decimal point (`en.json`, 2 lines). |
| 122c0eb | README.md rewritten for what this branch publishes; DEPLOY-CHECKLIST.md extended. |
| 340bf09 | privacy.html and terms.html titles lengthened. |
| 6513c32 | The report itself. |

Nothing else changed in this round: page ledes, how-it-works copy, FAQ answers, worked examples
and related-tool lists on the tool pages are as they were before it. `assets/catalog.js` was not
touched, no tool script was touched, and no tool page's body text was rewritten.

The page-by-page review exists as PAGE-REVIEW.md (untracked): a 90-row inventory with each page's
`<h1>`, what the page does, and its content depth, read from `assets/i18n/en.json`. It is
documentation of the review, not a record of rewrites.

## Two layout defects found and fixed in this round

Both were found while checking the pages this round, and both are committed separately:

- **ff33fba — phone menu panel.** `.menu-panel` is absolutely positioned with
  `inset-inline: var(--sp-4)`, and `.menu` had `position: relative`, so the panel resolved its
  width against the "Menu" `<details>`: measured 52.67px wide at innerWidth 375, with entries
  27px wide and "Browse by category" wrapping. Removing `position: relative` from `.menu` (the
  `@media (max-width: 899px)` block already sets `.head-in { position: relative }`) makes the
  panel 324px wide at 375. The same commit gives `.foot-cats a` the full column width, so the
  footer's 44px target is 44px in both axes (164×44 at 1280 instead of text-width×44).
- **09b5529 — all-tools.html.** Home shows at most six tools per category, so there was no single
  page listing the whole inventory. `all-tools.html` lists all 80 entries (73 tools + 7 business
  pages) by category with the same card markup as the category pages, 22,192 bytes, no new CSS,
  no inline script, same CSP as the other root pages. It is linked from the 404 page's existing
  "All tools" button (which pointed at `/en/index.html`), from the phone menu, and from the home
  note line, and it is in `sitemap.xml`. It is deliberately not in the footer: a fourth footer
  link adds a row on a phone and would move the guard.

## Guard

`en/loan-calculator.html`, empty state, innerWidth 376 (request 338): document height **3452px**,
`#back-cat` text top **2848.7639** (measured with a Range over the link text), ad slots
**0 / 0 / 0**. Re-measured after each commit. At innerWidth 375 the same page measures 3452px and
2848.7639.

## Sweep, re-run after both commits

Method: `qa-server.py` on port 8841 (no-store) injecting `qa-inject.js` at the top of `<head>` via
`?qa=1`, one page at a time, no iframes, 97 URLs in `qa-plan.json`. innerWidth was checked on
every record (the resize tool needs 337 to paint 375 and 1152 to paint 1280).

At **innerWidth 375** — 96 records (73 tools, 9 category pages, 7 business pages, home, about,
contact, privacy, terms, all-tools):

- horizontal overflow > 0: **0 pages**
- console errors / unhandled rejections: **0**
- text under 14px: **0**
- `[object Object]` or a raw `{placeholder}` in the rendered text: **0**
- ad slots: **233** measured, every one **0px** and carrying `hidden`
- controls shorter than 44px: only the 12 pages that contain native checkboxes
  (`input[type=checkbox]` measured at 20×20); each one sits inside a label measured **275×44**
  on working-days-calculator, which the brief allows. No button, link or select is short.

At **innerWidth 1280** — the same 96 records: overflow 0, console errors 0, text under 14px 0,
ad slots 233 all 0px. The checkbox pages are the same 12. Footer category links measure 164×44 in
a two-column grid (`grid-template-columns: 164px 164px`).

**404.html** measured on its own (the harness does not inject into 404 responses): 375 → overflow
0, 0 small text, 0 short controls; 1280 → the same. Both widths keep the "All tools" link.

**Layout shift** (PerformanceObserver on `layout-shift`, `hadRecentInput` excluded), home + `en/pdf.html`
+ `en/loan-calculator.html`, on load and after scrolling to the bottom:

| page | 375 load | 375 scroll | 1280 load | 1280 scroll |
|---|---|---|---|---|
| home | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| category (pdf) | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| tool (loan-calculator) | 0.0000 | 0.0000 | 0.0000 | 0.0000 |

Home page height at innerWidth 375 is **2573px = 2.89 screens** of 800px.

**Phone menu** (`?qa=1` pages at 375, `<details>` opened): home, `en/pdf.html` and
`en/loan-calculator.html` each give a panel at x=16, width 324, right edge 340 (inside the 375
viewport), 14 items, minimum item height 44px, `scrollHeight == clientHeight` (nothing clipped).

**Site checks**: 96 pages — no missing title, no duplicate title, no duplicate description, 0
broken internal `href`/`src`. `sitemap.xml` has 95 URLs, every one has a file, every public page
except 404 is present, and there is no `/ar/` entry. 404 is deliberately absent (it is `noindex`).
`404.html` has no meta description, which is harmless on a noindex page and was left alone.

**Email and phone scan on added lines** (`git diff ff33fba~1..HEAD`, 168 added lines): no email
address, no phone number.

## Corrections made to this report

Removed because no commit or file supports them:

1. Tools named `tax-calculator`, `profit-margin`, `line-counter`, `loss-percentage`,
   `text-case-converter`, `csv-to-json` — not in `assets/catalog.js`; the arithmetic "fixes"
   attributed to them never happened.
2. "All 73 ledes rewritten", "the discount-calculator duplicate lede was removed", "every worked
   example and FAQ number was recomputed": the only `en.json` change in this round is ddf776d
   (2 lines, average calculator). No tool page body copy was edited.
3. "All seven business pages rewritten" and the `<h1>` rewrite claim: the business pages only
   received a CSP change (5d0e30a) and `theme-color` (24874c8).
4. "`_spec_k2.json` gained per-tool `related` lists" — the file has no `related` key and no commit
   touches it.
5. "`_audit.py` expected the old heading and was fixed" — no such change in any commit.
6. "`all-tools.html` added" when it did not exist — it does now; commit 09b5529 (see above).
7. The earlier line that the sitemap lists "90 + about + contact + all-tools" — it lists 95 URLs
   now, and did not include all-tools before 09b5529.
8. The earlier clean-page claim of "90 of 90" was not measured by this round's sweep; the sweep
   above is the one that was run, over 96 pages.

## Not fixed, by decision

- Root `index.html` is `noindex` and was removed from the sitemap (4e72eab), but other pages still
  point their canonical at it. That conflict is a publishing decision and is in
  NEEDS-FROM-OWNER.md.
- Arabic: 18 pages exist, all excluded from the build this round.
- HTTP response headers (CSP as a header, HSTS, frame protection, `X-Content-Type-Options`,
  `Referrer-Policy`) cannot be set from static files; DEPLOY-CHECKLIST.md lists them.

## Not tested

Firefox, Safari, real devices, screen readers, `prefers-reduced-motion: no-preference` (this
browser reports `reduce: true`, so animation was only checked structurally), a real ad network,
Arabic rendering, and the GitHub Pages build itself (nothing was pushed).
