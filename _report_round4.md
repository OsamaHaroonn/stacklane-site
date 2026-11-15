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

Tracked today and therefore published by GitHub Pages: `_gen.py` (the page
generator) and `AUDIT.md`, `ADS-README.md`, `DEPLOY-CHECKLIST.md`,
`ROADMAP.md`, `DESIGN.md`. Untracked QA material that is not in git and so is
not published: `qa-*.js/html/json`, `qa-server.py`, `qa-shots/`,
`qa-sweep-*.json`, every `_*.py` helper, `DESIGN-AUDIT.md`, `WORK-LOG.md`,
`FINAL-REPORT.md`, `__pycache__/`. `_gen.py` and `AUDIT.md` are the two tracked
items worth moving out of the publish root before the domain goes live; they
were left in place because deleting versioned files is the owner's call.
