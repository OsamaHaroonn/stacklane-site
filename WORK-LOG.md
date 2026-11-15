# WORK-LOG (untracked — decisions and measurements)

Branch: `preview-redesign-2`. Nothing pushed or deployed.

## Server

Static server on **http://127.0.0.1:8830** (`qa-server.py`, sends
`Cache-Control: no-store` on every response), serving the repo root.

## The zero-shift guard, calibrating the viewport

The browser window here paints at devicePixelRatio 0.9, so the resize tool's
width is not `innerWidth`.

| requested | innerWidth |
|---|---|
| 1152 | 1280 |
| 338 | 376 |
| 337 | 375 |

The brief's guard numbers (document height **3452px**, `#back-cat` text top
**2848.7639px**) reproduce **exactly at innerWidth 376**. At innerWidth 375 the
same page is 3450px / 2846.5999px, because one line of text wraps differently at
one pixel narrower. I therefore measure the guard at **innerWidth 376** and note
the width with every reading.

Measured on `en/loan-calculator.html`, empty state, at innerWidth 376:

* before this session's work (commit 0710272, in a throwaway git worktree):
  3452 / 2848.7639 — the brief's baseline, confirmed unchanged by commits
  8bc74f8, d08a3bc, e2f496f and 112fc17 (steps 2–5).
* after step 6 (business pages): 3452 / 2848.7639
* after step 7 (page furniture): 3452 / 2848.7639 at both 376 and 375
* after step 8 (reduced motion): 3452 / 2848.7639

Ad slots A, B and C measure 0px in every reading.

## Decisions

### Step 6 — business pages
`.panel`, `.field` and `.totals` are used **only** by the seven hand-written
business pages (checked with `grep -l` across `*.html`), so styling them cannot
reach a tool page. The total row becomes a blue tile through an absolutely
positioned `::before` with `inset: -6px -14px`, so the row keeps its exact
geometry — no padding or margin is touched.

Text-size fix: `.table th` and the mobile `.table td[data-label]::before` were
12px on the invoice page. Raised to 14px (`.875rem`). This is the one place
where a font-size changed before a result; it is an accessibility rule
("no text under 14px"), it only affects `en/invoice.html` (`.table` appears on
no other page), and the tool-page guard is unaffected. Logged as an accepted
exception.

### Step 7 — page furniture, and why there are no step numbers
"How it works" is a single generated paragraph per tool, not a list. Numbering
it would invent structure the copy does not have, which the site protocol
forbids. The rhythm is therefore carried by a 28×3px accent rule above each
`h2`, drawn in the 24px gap the section margin already provides
(`position: absolute; top: -14px`), so no heading moves. The FAQ marker was a
"+" glyph; it is now an 8×8px border-drawn chevron of the same box size that
rotates 180° on `[open]` with a transform only. Related tools gained a card
gradient, a border/shadow hover and a 2px lift.

### Step 8 — motion
The tile stagger (45ms per tile, `tk-tile-in` 320ms), the hero-ring pulse, the
message bar slide and the progress sheen already existed from step 2. The gap
was that `.tk-row` animations ignored `prefers-reduced-motion`; they are now
switched off there, along with the row hover lift.

Note: **prefers-reduced-motion is ON in this browser**, so every animation was
only checked structurally (rules, durations, keyframes, the reduced-motion
override). No animation was watched running.

## Session 2 — steps 8 fixes, sweep, security, ads (after the cut-off)

Everything below is committed on `preview-redesign-2`; nothing pushed.

* `17e8d2d` reduced-motion coverage for result tiles and the hero ring.
* `2da5e00` the sweep found two real defects:
  `en/images-to-pdf.html` scrolled sideways at 375 (a nowrap "no file chosen"
  sentence forced a 346px grid column into a 275px panel → `min-width: 0`), and
  13px text in three tools plus the progress label and file-list meta (→ 14px).
* `5557b41` ad slots: one switch, `<html data-ads="on">`; reserved heights in
  CSS (280/250 desktop, 100 mobile); `ADS-README.md` + `ads.txt` placeholder.

Measurements worth keeping:

* guard at innerWidth 376: **3452 / 2848.7639** after every commit, ad slots 0px.
* home page at 375: **2473px ≈ 2.7 screens**; at 1280: 4823px.
* 115 files: 0 broken internal links, 0 duplicate titles, 0 duplicate
  descriptions, 0 duplicate IDs.
* sitemap: 93 URLs = 3 root + 90 English, nothing missing.
* page weight gzip: median 110.2 KB; only the three PDF pages exceed 150 KB
  (315 KB, vendored `pdf-lib`).
* network log: seven requests, all `127.0.0.1` — zero external requests.
* added-line scan: 0 emails; phone-pattern hits are numeric constants only.

Decisions recorded here rather than in code:

* No step numbers in "how it works" — the copy is one paragraph, not a list.
* Inline prose links (audit "privacy policy") stay 20px tall; WCAG 2.5.8 exempts
  links inside a block of text and enlarging it would break the paragraph.
* `gpa-calculator` still accepts absurd grade points; capping it would change
  tool logic, which this task forbids.
* Two generators show a default output when empty; nothing is stale or
  undefined, so they were left alone.
* `prefers-reduced-motion` is ON in this browser, so no animation was watched
  running — all motion was reviewed structurally.

## Round 2 — pdf-lib deferral and the per-type layer

* `baf7fa2` pdf-lib (525,099 B) is no longer a `<script>` on the three English
  PDF pages; `TK.pdfLib()` in shared.js injects it on the first action and hands
  every caller the same promise. merge-pdf 905.2 -> 392.4 KB, split-pdf 909.2 ->
  396.4 KB, images-to-pdf 908.4 -> 395.6 KB.
* `5df05e9` one accent + icon + signature detail per type, keyed on
  body[data-category]. chrome.js sets the attribute from the catalogue, so no
  tool page was edited by hand.
* `f94e6bf` the seven English business pages now carry data-category="business"
  and paint indigo (#4338ca) instead of the default blue.
* `782a38b` robots-txt-generator says what the default file means.
* `6cb1dce` the CSS comment above the type layer no longer pins two pixel
  numbers; it says the guard is a comparison against aef2433.

### Guard, and why the numbers moved

The guard is dpr-dependent, and this browser switches between two states:

| requested | innerWidth | dpr | doc height | #back-cat text top |
|---|---|---|---|---|
| 338 | 376 | 0.9 | 3452 | 2848.7639 |
| 376 | 376 | 1.0 | 3450 | 2846.6001 |

Both are the same commit. To prove the second is not a regression, `aef2433` was
extracted with `git archive` into a scratch copy, served on 8834 and measured in
the same dpr-1.0 tab: 3450 / 2846.6001 — identical to HEAD. Scratch copy and its
server were deleted. The scrollbar is 16.7 CSS px in the 0.9 tab and 15 in the
1.0 tab, so one line wraps differently; that is the whole difference.

Guard after every commit in this round, tab A (dpr 0.9), innerWidth 376:
**3452 / 2848.7639**, ad slots 0/0/0. The text top comes from a Range over the
link's text — the box top is 2954.9 because the 44 px target wraps it.

### Decisions

* No per-batch commits. The type layer is shared CSS, so a "batch of 10" commit
  would be byte-identical to the one before it. Two commits carry all 73 pages;
  the static pass and the per-type live checks are in FINAL-REPORT.md 9-11.
* Checked every business page: loss-calculator loads only config.js
  and loss.js (no chrome.js, own static nav) and still carries
  data-category="business", so it gets the indigo accent and tabular numerals.
* gpa-calculator's message already matches its check -> not changed.
* user-agent-parser already had a clear empty state -> not changed.

### Honest coverage

15 of the 80 catalogue pages were opened in a browser after the type layer
landed; the other 65 were checked statically only. A full 80-page browser sweep
has NOT been done and is the next thing worth doing.

## Full sweep (90 pages, both widths)

Method: iframes wedge this browser, so the QA server injects a measuring script
into pages served with ?qa=1; each page posts its record and navigates to the
next itself. Plan index in sessionStorage because loss.js replaceState wipes
query params. One pass = one navigation, 90 pages in ~30 s.

Result: 90/90 pages at innerWidth exactly 375 and exactly 1280. Zero overflow,
zero console errors, zero text under 14 px, zero ad-slot height, zero bad
tokens. Home 2473 px at 375 and 4823 px at 1280.

Tap targets: the only sub-44 elements are 20x20 checkboxes inside .tk-check
labels (min-height 44, measured 275x44 and 309x44) and short text links that
are 44 px tall. No control is shorter than 44 px.

Artifacts: net::ERR_ADDRESS_IN_USE under fast chaining made a few pages miss
style.css/en.json (2 at 1280, 9 at 375). Each was re-measured solo until clean;
dirty records were discarded, not averaged.

## End-to-end pass (this round)

Guard every commit: 3452 / 2848.7639 at innerWidth 376 (request 338,
dpr 0.9), ads 0/0/0. Held through all five commits.

Measured all 73 tools with a real input via qa-func.js. One real defect
(typing test formula), everything else correct against hand-computed
values. Fixed: metadata for 90 pages, root page removed from sitemap,
audit CSP tightened, ad slot heights corrected.

Sweep: 94 pages at 375 and 1280 — 0 overflow, 0 console errors, 0 small
text, 0 short controls, ad slots 0. Two pages needed a separate run
(age-calculator, 404) because the injector skips the 404 fallback route.

Not tested: keyboard focus (document.hasFocus false in this tab),
Firefox, Safari, devices, screen readers, reduced motion off, Arabic in a
browser.

## Round 4 — end-to-end re-check

Branch preview-redesign-2, no push. Guard after every commit: 3452 /
2848.7639 at innerWidth 376, ads 0/0/0.

Commits: 5d0e30a (six business pages onto the site CSP), 05c5b53 (home boot
state, CLS 0.1988 -> 0.0000 at 375 and 0.0316 -> 0.0000 at 1280).

Found and fixed a harness bug: qa-func.js scoped empty/hostile to #tool-ui or
main, but the business pages use .wrap.app, so those two scenarios never
touched a field. All seven business pages re-run and hand-checked (invoice
1,000+20% = 1,200; late payment 8.22 interest / 1,058.22 total; loss 4,157 a
month; margin 40%/66.7%/85.71; break-even 100 jobs; audit 3/15).

Security: 0 dangerous sinks in assets/tools, 0 network calls in shipped JS,
0 target=_blank without rel, CSP identical on 90 pages. Accessibility: 0
unlabelled inputs, 0 duplicate ids, all 9 accents >= 5.02:1. SEO: 0 duplicate
titles/descriptions, 0 broken internal refs, sitemap 92 = 90 + privacy + terms.

Arabic: 18 of 90 pages, all RTL with Arabic titles, ar.json a 365-key subset,
0 broken hreflang. Not opened in a browser.

Still not done: per-page worked-example arithmetic, Arabic browser layout,
Firefox/Safari/devices/screen readers, reduced motion off (this browser reports
reduce: true, so motion was checked structurally only).

## Round 5 — final pre-publish pass

Commits a75751f, 1979aa4, a1616e0, 24874c8, ddf776d, 122c0eb, 340bf09.
Guard after each: 3452 / 2848.7639 at 376, ads 0/0/0.

Arabic: ar/ excluded in _config.yml, robots Disallow /ar/, no file in ar/
touched, no English page had an ar alternate so nothing visible to remove.
Sitemap never had ar URLs.

Review: PAGE-REVIEW.md covers 90 pages. Fixed the dead #tools anchor (14 links,
no id) and the missing decimal-comma warning on average-calculator (1,5 gave a
mean of 3). Added about.html, contact.html, NEEDS-FROM-OWNER.md, theme-color on
94 pages, rewrote README, lengthened privacy/terms titles.

Sweep: 95 pages at 375 and 95 at 1280 (404 measured separately), 0 overflow,
0 console errors, 0 text<14, 0 controls<44 (checkbox labels are 309x44), all
ad slots 0px. CLS 0.0000 on home and both category pages at both widths.

Open: contact address (owner), Arabic 72 pages, PNG favicon. Not tested:
Firefox, Safari, real devices, screen readers, reduced motion off, real ads,
the Pages build itself.


## Round 6 — stop adding features, verify and correct

Server: qa-server.py on 8841 (no-store), pages via /<path>?qa=1 (the /stacklane-site/
prefix branch does NOT inject; that wasted one sweep attempt).

Found while checking the phone layout: `.menu-panel` is absolute with inset-inline 16px
and `.menu` was `position: relative`, so the panel resolved to the "Menu" button width —
52.67px at 375, entries 27px, "Browse by category" wrapped. Fixed by dropping
`position: relative` from `.menu` (the 899px block already makes `.head-in` relative):
panel now 324px at 375, 14 items, all >=44px, nothing clipped on home, /en/pdf.html and
/en/loan-calculator.html. Same commit gives `.foot-cats a` width:100% (164x44 at 1280).

Added all-tools.html (80 entries, 22,192 bytes, generated by _alltools.py from
catalog.js + en.json, not committed). Linked from 404 "All tools", phone menu and the
home note line; in the sitemap. Deliberately NOT in the footer: a 4th footer link adds a
row on a phone and pushes docH from 3452 to 3505 — guard measured, reverted.

Guard after both commits: 3452 / 2848.7639 at 376, ads 0/0/0 (and identical at 375).

Sweep after the commits: 96 records at 375 and 96 at 1280, 0 overflow, 0 console errors,
0 bad tokens, 233 ad slots all 0px+hidden. tapShort only counts native checkboxes (20x20
inside 275x44 labels). 404 measured separately (harness does not inject into 404s): clean
at both widths. CLS 0.0000 load+scroll on home, pdf and loan-calculator at both widths.
Home 2573px = 2.89 screens at 375. Titles/descriptions unique across 96 pages, 0 broken
internal refs, sitemap 95 URLs all resolving, no /ar/, no 404.

Report correction: the "Final pre-publish round" section of FINAL-REPORT.md claimed
tools that do not exist (tax-calculator, profit-margin, line-counter, loss-percentage,
text-case-converter, csv-to-json), a rewrite of 73 ledes and 7 business pages, per-tool
related lists in _spec_k2.json, an _audit.py heading fix and an all-tools page that did
not exist. None of that is in any commit. Replaced it with a per-commit table from
git log --stat plus this round's measurements, and listed the eight removed claims.

Not tested: Firefox, Safari, real devices, screen readers, reduced-motion off, real ads,
Arabic, the Pages build.
