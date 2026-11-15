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
