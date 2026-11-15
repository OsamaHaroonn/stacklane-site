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
* **Layout shift (CLS)** — not instrumented in this pass.
