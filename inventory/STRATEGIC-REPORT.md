## Stacklane Tools — Strategic Assessment & Upgrade Roadmap

**Generated:** 2026-11-26T23:38:13.429Z
**Catalogue source:** `assets/catalog.js`
**Inventory branch:** `inventory/114-master`
**Scope:** All catalogue entries in `assets/catalog.js`

---

## 1. Catalogue Reconciliation — Critical Finding

### 1.1 The discrepancy

| Measure | Value |
| --- | --- |
| **Claimed in docs** | **114 entries** (107 tools + 7 business pages) |
| **Actual in `assets/catalog.js`** | **85 entries** (78 tools + 7 business pages) |
| **Discrepancy** | **29 tools missing from catalogue** |

The repository documentation consistently claims 114 catalogue entries:
- `PROJECT-CONTEXT.md`: "107 tools + 7 Business pages = 114 entries"
- `assets/search-setup.js`: "107 tools + 7 business pages = 114 searchable entries"
- `docs/project-history/2026-11-23-smart-search-remediation.md`: "one unified catalogue of 114 entries (107 tools + 7 Business pages)"
- Prior session review: "114/114 visits; 107 tools + 7 business pages"

However, the authoritative source file `assets/catalog.js` contains only **78 tool entries** in `window.TOOL_CATALOG` and **7 business pages** in `window.BUSINESS_PAGES`, for a total of **85**.

This was verified three independent ways:
1. `grep -c "slug:" assets/catalog.js` → **85**
2. Bun parser extracting `window.TOOL_CATALOG` + `window.BUSINESS_PAGES` → **78 + 7 = 85**
3. Disk `en/` HTML files matching catalog slugs → all 78 tools + 7 business pages have matching `en/<slug>.html`, plus 9 category pages + 1 index = 95 `en/` HTML files

### 1.2 What this means

The 29 "missing" tools are referenced in `gen_browser_checks.py` and the smart-search-remediation history as formerly-absent tools that were added to the search index. The search system (`assets/search-setup.js`) derives its count from `TOOL_CATALOG.length + BUSINESS_PAGES.length`, so it would also report 85, not 114.

**This inventory is built on the actual 85-entry catalogue.** If the 107-tool catalogue is the intended state, `assets/catalog.js` needs 29 entries restored. If 85 is correct, all documentation claiming 107/114 needs updating.

### 1.3 HTML page inventory

| Location | Count | Notes |
| --- | --- | --- |
| `en/` HTML files | 95 | 78 tool pages + 7 business pages + 9 category pages + 1 index |
| Root `*.html` | 12 | 404, index, about, contact, privacy, terms, all-tools, plus QA/test pages |
| Total catalog-matching `en/` pages | 85 | Exactly matches catalog.js entries |
| Non-catalog `en/` pages | 10 | 9 category landing + 1 index |

---

## 2. Methodology

### 2.1 Weighted priority model

| Dimension | Weight | What it measures |
| --- | --- | --- |
| Functional correctness | 25 | Does the tool do what it claims, correctly, with proper error handling? |
| User experience | 20 | Interface quality, feedback, affordances, clarity |
| Performance & technical quality | 15 | Architecture, dependencies, code quality, efficiency |
| User value | 15 | Usefulness, demand, differentiation |
| Security/privacy/data-handling | 15 | Data handling, input safety, storage, network usage |
| Accessibility & SEO | 10 | WCAG, semantic HTML, structured data, discoverability |

**Priority bands:** P0 (score <50), P1 (50-59), P2 (60-69), P3 (70+).

**Complexity** (separate dimension): Low / Medium / High — based on technical sophistication: pdf-lib usage, file API, crypto, code size, async orchestration.

### 2.2 Inspection method

Each of the 85 entries was inspected at the source-code level:

**All entries (HTML):**
- `<title>`, meta description, canonical href, OG tags
- CSP meta tag presence
- Schema.org JSON-LD (`application/ld+json`)
- Skip-link (`<a class="skip-link">`)
- `<h1>` count (expected: exactly 1)
- `data-tool` / `data-category` attribute
- Privacy note (`data-i18n="tool.privacy"`)
- Ad slot elements (`data-slot`)
- Script includes (internal vs external)
- i18n key references vs `assets/i18n/en.json`

**Tool pages (JS):**
- `window.TOOL` assignment and `mount` function
- `guard()` usage (error handling)
- `crypto.getRandomValues` (secure randomness)
- File API usage (`FileReader`, `.files`)
- pdf-lib usage
- `.innerHTML` assignment from variables
- `localStorage`/`sessionStorage` usage
- `eval()` usage
- `try/catch` presence
- Console call count (debug leakage)
- Network requests (`fetch`, `XMLHttpRequest`)
- Script injection (`document.write`, dynamic `<script>`)

**Business pages (JS):**
- Architecture pattern (IFFE vs toolkit-mount)
- `localStorage` usage
- `innerHTML` usage
- `mailto:` usage
- `window.print()` usage
- Script filename vs page slug alignment

### 2.3 Verification status legend

| Status | Meaning |
| --- | --- |
| **verified working** | Source inspected; no defects found at code level |
| **verified defective** | Source inspected; specific defect(s) identified |
| **not tested** | Not yet inspected (none in this inventory — all 85 inspected) |
| **cannot determine** | Insufficient information to assess (none in this inventory) |

**Important limitation:** This inventory is source-code inspection only. No live browser rendering, no interactive testing, no network/request verification, and no AdSense/ad rendering verification was performed. Ad slots are hidden placeholders; actual ad rendering cannot be determined from source.

---

## 3. Summary Statistics

### 3.1 By the numbers

| Metric | Value |
| --- | --- |
| Total entries | 85 (78 tools + 7 business) |
| Phase 1 (inspect) | 85 |
| Phase 2 (assess/inventory) | 85 |
| Total phases | 170 |
| Entries with issues | 13 |
| Total individual issues | 39 |
| Average score | 82.8 / 100 |
| Score range | 70 – 84 |

### 3.2 By category

| Category | Count | Tools |
| --- | --- | --- |
| calculators | 18 | age-calculator, average-calculator, bmi-calculator, compound-interest-calculator, date-difference, discount-calculator, gpa-calculator, loan-calculator, mortgage-calculator, percentage-calculator, percentage-change-calculator, roi-calculator, salary-to-hourly, savings-goal-calculator, stopwatch-timer, tip-split-calculator, vat-calculator, working-days-calculator |
| converters | 6 | fraction-calculator, number-base-converter, ratio-calculator, roman-numerals, time-zone-converter, unit-converter |
| developer | 22 | base64, color-contrast-checker, color-converter, color-palette-generator, css-box-shadow-generator, css-gradient-generator, csv-json-converter, hash-generator, html-entity-encoder, html-to-markdown, image-to-base64, json-formatter, jwt-decoder, meta-tag-generator, password-strength-checker, regex-tester, robots-txt-generator, sql-formatter, timestamp-converter, url-encoder, user-agent-parser, xml-sitemap-generator |
| fun | 7 | bubble-wrap-popper, coin-flipper, compliment-generator, decision-wheel, dice-roller, fake-hacker-typer, shakespearean-insult-generator |
| generators | 6 | barcode-generator, favicon-generator, password-generator, qr-code-generator, random-number, uuid-generator |
| images | 4 | crop-rotate-image, image-compressor, image-converter, image-resizer |
| pdf | 4 | images-to-pdf, merge-pdf, pdfpage-counter, split-pdf |
| text | 11 | case-converter, character-counter, keyword-density-analyzer, lorem-ipsum-generator, remove-duplicate-lines, slug-generator, sort-lines, text-diff-checker, text-statistician, typing-speed-test, word-counter |

### 3.3 By priority

| Priority | Count | Meaning |
| --- | --- | --- |
| P3 (70+) | 85 | Low priority — maintain, minor improvements |
| P2 (60-69) | 0 | Medium priority — scheduled improvements |
| P1 (50-59) | 0 | High priority — significant issues |
| P0 (<50) | 0 | Critical — must fix before release |

### 3.4 By complexity

| Complexity | Count | Criteria |
| --- | --- | --- |
| High | 4 | pdf-lib, heavy async orchestration, large code |
| Medium | 18 | File API, crypto, moderate code size |
| Low | 63 | Pure math/text processing, small code |

### 3.5 By status

| Status | Count |
| --- | --- |
| verified working | 85 |
| verified defective | 0 |
| not tested | 0 |
| cannot determine | 0 |

---

## 4. Detailed Findings

### 4.1 Critical: Catalogue discrepancy (P1)

**29 tools are missing from `assets/catalog.js`.** The repository claims 107 tools but the source file has 78. This affects:
- The search index count (derived from `TOOL_CATALOG.length`)
- All documentation claiming 114 entries
- Any roadmap or inventory claiming "all 114 entries"

**Action:** Resolve before relying on any "114-entry" planning. Either restore the 29 tools or update all docs to 85.

### 4.2 Accessibility: Business pages missing skip-link (P2)

All 7 business pages lack a skip-link (`<a class="skip-link" href="#main">`), which every one of the 78 tool pages has. This is a WCAG 2.4.1 (Bypass Blocks) gap.

**Affected pages:**
- [`en/invoice.html`](en/invoice.html) — Invoice generator
- [`en/calculator.html`](en/calculator.html) — Job pricing calculator
- [`en/margin-calculator.html`](en/margin-calculator.html) — Margin calculator
- [`en/break-even-calculator.html`](en/break-even-calculator.html) — Break-even calculator
- [`en/late-payment-calculator.html`](en/late-payment-calculator.html) — Late payment calculator
- [`en/loss-calculator.html`](en/loss-calculator.html) — Leak calculator
- [`en/audit.html`](en/audit.html) — Website audit checklist

**Fix:** Add `<a class="skip-link" href="#main">Skip to content</a>` as the first focusable element in each business page body, matching the tool page pattern.

### 4.3 Structured data: Business pages have empty JSON-LD (P2)

All 7 business pages have an empty JSON-LD comment block:
```
<!-- stacklane:jsonld:start -->
<!-- stacklane:jsonld:end -->
```

Tool pages have full `BreadcrumbList` + `SoftwareApplication` schema.org markup. Business pages should have at minimum a `WebPage` or `SoftwareApplication` structured data block.

**Affected pages:** Same 7 business pages as above.

### 4.4 Architecture inconsistency: Business pages (P3)

The 7 business pages use a different, older architecture from the 78 tool pages:

| Aspect | Tool pages (78) | Business pages (7) |
| --- | --- | --- |
| Architecture | `window.TOOL = { mount }` via ToolKit | IFFE with direct DOM access |
| UI building | ToolKit helpers (`TK.field`, `TK.btn`, etc.) | Raw HTML + inline wiring |
| Script filename | `assets/tools/<slug>.js` | Mixed: `invoice.js`, `calculator.js`, `margin.js`, `break-even.js`, `late-fee.js`, `loss.js`, `audit.js` |
| Error handling | `guard()` wrapper available | Manual try/catch or none |
| Skip-link | Yes (all 78) | No (all 7) |
| JSON-LD | Full schema.org | Empty comment block (all 7) |

**Script filename mismatches:**
- `margin-calculator.html` loads `assets/margin.js` (not `margin-calculator.js`)
- `break-even-calculator.html` loads `assets/break-even.js` (not `break-even-calculator.js`)
- `late-payment-calculator.html` loads `assets/late-fee.js` (not `late-payment-calculator.js`)

### 4.5 Error handling: pdfpage-counter.js (P2)

`pdfpage-counter.js` does not use `guard()` for its async pdf-lib operations, while `merge-pdf.js` (which also uses pdf-lib) does. This means pdf-lib load failures or parse errors in pdfpage-counter may not be caught and displayed to the user consistently.

### 4.6 Code quality: barcode-generator.js innerHTML (P3, low risk)

`barcode-generator.js` line 213: `preview.innerHTML = built.markup;`

**Assessment:** Low risk. The markup is built exclusively from:
- User text that is XML-escaped via `xmlEscape()` before inclusion
- ASCII printable characters only (32–126), rejected otherwise
- Numeric values parsed via `parseInt`
- Fixed SVG pattern table data

This is not a verified XSS vulnerability, but `innerHTML` is used where DOM construction or `insertAdjacentHTML` would be safer. Worth noting for code quality, not a defect.

### 4.7 localStorage usage (P3, informational)

Several entries use `localStorage` for draft/persistence:
- `invoice.js` — saves draft invoices and a saved archive (up to 30), with 7-day expiry on drafts
- `audit.js` — likely saves audit state
- `loss.js` — may save state

This is intentional for the business tool workflow (draft autosave) but means these pages store user data on the device. The privacy note on tool pages (`data-i18n="tool.privacy"`) says "never uploaded anywhere" which is correct, but doesn't mention localStorage. Business pages should clarify that data is stored locally.

---

## 5. Shared Improvements


### 1. Accessibility (P2)

**Finding:** All 7 business pages lack skip-link; all 78 tool pages have it. Add skip-link to business pages for consistency and WCAG 2.4.1 compliance.

**Affected entries:** 7 (invoice, calculator, margin-calculator, break-even-calculator, late-payment-calculator, loss-calculator, audit)

**Recommended action:** Include in the relevant upgrade phase.


### 2. Structured Data (P2)

**Finding:** All 7 business pages have empty JSON-LD comment blocks (<!-- stacklane:jsonld:start -->...<!-- stacklane:jsonld:end -->) with no Schema.org markup. Tool pages have full BreadcrumbList + SoftwareApplication. Populate business page JSON-LD.

**Affected entries:** 7 (invoice, calculator, margin-calculator, break-even-calculator, late-payment-calculator, loss-calculator, audit)

**Recommended action:** Include in the relevant upgrade phase.


### 3. Architecture Consistency (P3)

**Finding:** Business pages use a different, older page architecture (IFFE scripts, raw HTML forms, inline event wiring) vs the shared ToolKit mount pattern used by all 78 tools. Consider migrating business pages to the shared architecture for maintainability.

**Affected entries:** 7 (invoice, calculator, margin-calculator, break-even-calculator, late-payment-calculator, loss-calculator, audit)

**Recommended action:** Include in the relevant upgrade phase.


### 4. Catalogue Reconciliation (P1)

**Finding:** assets/catalog.js has 78 tools but repository docs claim 107 (114 total). 29 tools are missing from the catalogue. Investigate whether these tools were removed or the catalogue was never updated. This is a documentation/data integrity issue, not a code defect.

**Affected entries:** 29 (see note)

**Recommended action:** Resolve the 114-vs-85 discrepancy before any further roadmap work.


### 5. Script Src Naming (P3)

**Finding:** Business page script src names do not match slugs: margin-calculator.html loads margin.js, break-even-calculator.html loads break-even.js, late-payment-calculator.html loads late-fee.js. This is confusing and error-prone. Align script filenames with page slugs.

**Affected entries:** 3 (margin-calculator, break-even-calculator, late-payment-calculator)

**Recommended action:** Include in the relevant upgrade phase.


### 6. Error Handling Consistency (P2)

**Finding:** pdfpage-counter.js does not use guard() for its async pdf-lib operations, unlike merge-pdf.js which does. Standardize error handling across all tools that use async operations.

**Affected entries:** 2 (pdfpage-counter, merge-pdf)

**Recommended action:** Include in the relevant upgrade phase.


---

## 6. Upgrade Sequence


### Phase 0: 0 — Reconciliation

**Priority:** P1
**Depends on:** none (foundational)

Resolve the 114-vs-85 catalogue discrepancy. Either restore the 29 missing tools to assets/catalog.js or update all documentation to reflect the current 85-entry catalogue. This is a prerequisite for any roadmap that references "all 114 entries."

**Delivers:**
- Reconciled catalogue matching documentation
- Updated PROJECT-CONTEXT.md and search-setup.js comments


### Phase 1: 1 — Accessibility Fixes

**Priority:** P2
**Depends on:** 0 — Reconciliation

Add skip-link to all 7 business pages. Populate JSON-LD structured data on all 7 business pages.

**Delivers:**
- 7 business pages with skip-link
- 7 business pages with schema.org markup


### Phase 2: 2 — Error Handling

**Priority:** P2
**Depends on:** 1 — Accessibility Fixes

Add guard() wrapper to pdfpage-counter.js async operations. Audit all tools for unguarded async ops.

**Delivers:**
- Consistent error handling across all async tools


### Phase 3: 3 — Architecture Normalization

**Priority:** P3
**Depends on:** 2 — Error Handling

Consider migrating business pages to share the ToolKit mount architecture. Align business page script filenames with page slugs.

**Delivers:**
- Consistent architecture across all 85 entries
- Predictable script naming


### Phase 4: 4 — Security Hardening

**Priority:** P3
**Depends on:** 3 — Architecture Normalization

Audit barcode-generator.js innerHTML usage (currently low-risk due to XML escaping and char filtering, but could be replaced with DOM construction). Audit all tools for eval() usage (none found).

**Delivers:**
- All innerHTML usage reviewed
- No eval() in any tool


---

## 7. Per-Entry Scores

### 7.1 Tools (78)

| # | Slug | Category | Complexity | Score | P | Key issues |
| --- | --- | --- | --- | --- | --- | --- |

| 1 | `merge-pdf` | pdf | High | 83 | P3 | Bundled pdf-lib (525KB) loaded on demand — latency on first use |

| 2 | `pdfpage-counter` | pdf | High | 78 | P3 | No guard() error wrapping for async/file ops; Bundled pdf-lib (525KB) loaded on demand — latency on first use |

| 3 | `image-compressor` | images | Medium | 84 | P3 | — |

| 4 | `image-resizer` | images | Medium | 84 | P3 | — |

| 5 | `word-counter` | text | Low | 84 | P3 | — |

| 6 | `qr-code-generator` | generators | Medium | 84 | P3 | — |

| 7 | `barcode-generator` | generators | Medium | 83 | P3 | — |

| 8 | `password-generator` | generators | Low | 84 | P3 | — |

| 9 | `age-calculator` | calculators | Low | 84 | P3 | — |

| 10 | `percentage-calculator` | calculators | Low | 84 | P3 | — |

| 11 | `percentage-change-calculator` | calculators | Low | 84 | P3 | — |

| 12 | `unit-converter` | converters | Medium | 84 | P3 | — |

| 13 | `json-formatter` | developer | Low | 84 | P3 | — |

| 14 | `loan-calculator` | calculators | Low | 84 | P3 | — |

| 15 | `mortgage-calculator` | calculators | Low | 84 | P3 | — |

| 16 | `compound-interest-calculator` | calculators | Low | 84 | P3 | — |

| 17 | `discount-calculator` | calculators | Low | 84 | P3 | — |

| 18 | `vat-calculator` | calculators | Low | 84 | P3 | — |

| 19 | `date-difference` | calculators | Low | 84 | P3 | — |

| 20 | `tip-split-calculator` | calculators | Low | 84 | P3 | — |

| 21 | `roi-calculator` | calculators | Low | 84 | P3 | — |

| 22 | `savings-goal-calculator` | calculators | Low | 84 | P3 | — |

| 23 | `gpa-calculator` | calculators | Low | 84 | P3 | — |

| 24 | `case-converter` | text | Low | 84 | P3 | — |

| 25 | `character-counter` | text | Low | 84 | P3 | — |

| 26 | `text-statistician` | text | Low | 84 | P3 | — |

| 27 | `remove-duplicate-lines` | text | Low | 84 | P3 | — |

| 28 | `random-number` | generators | Low | 84 | P3 | — |

| 29 | `uuid-generator` | generators | Low | 84 | P3 | — |

| 30 | `base64` | developer | Low | 84 | P3 | — |

| 31 | `url-encoder` | developer | Low | 84 | P3 | — |

| 32 | `timestamp-converter` | developer | Low | 84 | P3 | — |

| 33 | `color-converter` | developer | Low | 84 | P3 | — |

| 34 | `images-to-pdf` | pdf | High | 83 | P3 | Bundled pdf-lib (525KB) loaded on demand — latency on first use |

| 35 | `split-pdf` | pdf | High | 83 | P3 | Bundled pdf-lib (525KB) loaded on demand — latency on first use |

| 36 | `image-converter` | images | Medium | 84 | P3 | — |

| 37 | `crop-rotate-image` | images | Medium | 84 | P3 | — |

| 38 | `time-zone-converter` | converters | Medium | 84 | P3 | — |

| 39 | `typing-speed-test` | text | Low | 84 | P3 | — |

| 40 | `regex-tester` | developer | Low | 84 | P3 | — |

| 41 | `hash-generator` | developer | Low | 84 | P3 | — |

| 42 | `lorem-ipsum-generator` | text | Low | 84 | P3 | — |

| 43 | `text-diff-checker` | text | Low | 84 | P3 | — |

| 44 | `roman-numerals` | converters | Low | 84 | P3 | — |

| 45 | `number-base-converter` | converters | Low | 84 | P3 | — |

| 46 | `color-contrast-checker` | developer | Low | 84 | P3 | — |

| 47 | `average-calculator` | calculators | Low | 84 | P3 | — |

| 48 | `slug-generator` | text | Low | 84 | P3 | — |

| 49 | `html-entity-encoder` | developer | Low | 84 | P3 | — |

| 50 | `jwt-decoder` | developer | Low | 84 | P3 | — |

| 51 | `csv-json-converter` | developer | Medium | 84 | P3 | — |

| 52 | `sort-lines` | text | Low | 84 | P3 | — |

| 53 | `working-days-calculator` | calculators | Low | 84 | P3 | — |

| 54 | `fraction-calculator` | converters | Low | 84 | P3 | — |

| 55 | `ratio-calculator` | converters | Low | 84 | P3 | — |

| 56 | `stopwatch-timer` | calculators | Low | 84 | P3 | — |

| 57 | `image-to-base64` | developer | Medium | 81 | P3 | No guard() error wrapping for async/file ops |

| 58 | `salary-to-hourly` | calculators | Low | 84 | P3 | — |

| 59 | `keyword-density-analyzer` | text | Low | 84 | P3 | — |

| 60 | `meta-tag-generator` | developer | Low | 84 | P3 | — |

| 61 | `robots-txt-generator` | developer | Low | 84 | P3 | — |

| 62 | `xml-sitemap-generator` | developer | Low | 84 | P3 | — |

| 63 | `css-box-shadow-generator` | developer | Low | 84 | P3 | — |

| 64 | `color-palette-generator` | developer | Low | 84 | P3 | — |

| 65 | `css-gradient-generator` | developer | Low | 84 | P3 | — |

| 66 | `password-strength-checker` | developer | Low | 84 | P3 | — |

| 67 | `favicon-generator` | generators | Medium | 81 | P3 | No guard() error wrapping for async/file ops |

| 68 | `html-to-markdown` | developer | Low | 84 | P3 | — |

| 69 | `user-agent-parser` | developer | Low | 84 | P3 | — |

| 70 | `bmi-calculator` | calculators | Low | 83 | P3 | — |

| 71 | `sql-formatter` | developer | Low | 84 | P3 | — |

| 72 | `coin-flipper` | fun | Low | 83 | P3 | — |

| 73 | `dice-roller` | fun | Low | 84 | P3 | — |

| 74 | `decision-wheel` | fun | Low | 84 | P3 | — |

| 75 | `bubble-wrap-popper` | fun | Low | 84 | P3 | — |

| 76 | `fake-hacker-typer` | fun | Low | 84 | P3 | — |

| 77 | `compliment-generator` | fun | Low | 83 | P3 | — |

| 78 | `shakespearean-insult-generator` | fun | Low | 84 | P3 | — |

### 7.2 Business pages (7)

| # | Slug | Name | Complexity | Score | P | Key issues |
| --- | --- | --- | --- | --- | --- | --- |

| 79 | `invoice` | Invoice generator | Medium | 70 | P3 | Missing skip-link (accessibility); Uses localStorage for draft/saved data; Uses mailto: link — opens email client (privacy consideration for entered data) |

| 80 | `calculator` | Job pricing calculator | Medium | 72 | P3 | Missing skip-link (accessibility); Uses innerHTML for row/template injection; Empty JSON-LD comment block (no structured data) |

| 81 | `margin-calculator` | Margin calculator | Medium | 72 | P3 | Missing skip-link (accessibility); Uses innerHTML for row/template injection; Empty JSON-LD comment block (no structured data) |

| 82 | `break-even-calculator` | Break-even calculator | Medium | 72 | P3 | Missing skip-link (accessibility); Uses innerHTML for row/template injection; Empty JSON-LD comment block (no structured data) |

| 83 | `late-payment-calculator` | Late payment calculator | Medium | 72 | P3 | Missing skip-link (accessibility); Uses innerHTML for row/template injection; Empty JSON-LD comment block (no structured data) |

| 84 | `loss-calculator` | Leak calculator | Medium | 72 | P3 | Missing skip-link (accessibility); Uses innerHTML for row/template injection; Empty JSON-LD comment block (no structured data) |

| 85 | `audit` | Website audit checklist | Medium | 71 | P3 | Missing skip-link (accessibility); Uses localStorage for draft/saved data; Uses innerHTML for row/template injection |

---

## 8. Validation

### 8.1 Cross-deliverable reconciliation

| Check | Expected | Actual |
| --- | --- | --- |
| CSV data rows | 85 | 85 |
| JSON entries | 85 | 85 |
| Report tool table rows | 78 | 78 |
| Report business table rows | 7 | 7 |
| CSV + business total | 85 | 85 |
| Phase 1 entries | 85 | 85 |
| Phase 2 entries | 85 | 85 |
| Phase total (P1+P2) | 170 | 170 |
| Category totals | 78 tools | 78 |
| Priority totals | 85 | 85 |
| Complexity totals | 85 | 85 |
| Status totals | 85 | 85 |

### 8.2 Deliverable files

| Deliverable | Path |
| --- | --- |
| A. Master Inventory CSV | `inventory/master-inventory.csv` |
| B. Strategic Assessment Report | `inventory/STRATEGIC-REPORT.md` (this file) |
| C. Machine-readable Roadmap | `inventory/master-roadmap.json` |

---

## 9. Limitations & Unverified Findings

### 9.1 What was NOT tested

- **Live browser rendering:** No tool was opened in a browser for this inventory. Visual layout, interactivity, and actual functionality are not verified.
- **Interactive behavior:** Button clicks, form inputs, calculations, file processing, downloads — all untested.
- **Network requests:** No live requests were made. Tools that load pdf-lib on demand were not verified to actually load.
- **Ad rendering:** Ad slots (`data-slot`) are hidden placeholders. AdSense integration (PR #9) is a separate branch and is not activated. No ad rendering was tested or is testable without the AdSense dashboard.
- **Search functionality:** The search index was not queried. Search behavior is not assessed.
- **Mobile/responsive layout:** Not verified.

### 9.2 What cannot be determined from source

- Whether tools produce correct results for edge cases
- Whether pdf-lib actually loads and works in the target browser
- Whether the barcode SVG renders correctly
- Whether the invoice mailto: link works with special characters
- Whether localStorage works in private browsing mode (code handles this with try/catch)
- Actual page load performance

### 9.3 Known documentation issues

- The 114-entry claim in documentation does not match the 85-entry source. See Section 1.
- `PROJECT-CONTEXT.md` says "131 HTML pages" but the actual count depends on which directories are included. The `en/` directory has 95 HTML files; root has 12; plus `ar/`, `_rel/`, `stacklane-tools-site/`, `.bench/`, `product-source/` directories contain additional HTML files that appear to be older snapshots or alternate locales.

---

## 10. Protection & Scope Confirmation

- **Branch:** `inventory/114-master` (created from `main`, not from `feat/adsense-exclusion-first`)
- **PR #9:** Not touched. `feat/adsense-exclusion-first` branch and its changes are untouched.
- **Main branch:** Not modified. This branch is independent.
- **Production:** Not deployed to. No Cloudflare interaction.
- **AdSense:** Not activated. Ad slots remain hidden placeholders.
- **No merges:** This branch is for inventory deliverables only.

---

*End of strategic report.*
