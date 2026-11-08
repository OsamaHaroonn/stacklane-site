# Stacklane — free browser tools

A dependency-free static site: **standalone tool pages grouped by category**.
No ads, no accounts, no payments, no analytics, no tracking — and nothing a
visitor types, pastes or uploads ever leaves their own browser.

This branch publishes **English only**. The Arabic pages exist (18 of them) but
are incomplete, so they are excluded from the build and listed as a later
round — see [Deferred: Arabic](#deferred-arabic).

| Layer | What it is | Where |
|---|---|---|
| 73 tool pages | calculators, text tools, converters, generators, image and PDF tools, developer utilities, small games | `en/<slug>.html` |
| 9 category pages | one index per category, every card carrying icon, count and description | `en/<category>.html` |
| 7 Business pages | invoice, job pricing, margin, break-even, late payment, leak calculator, website audit | `en/<slug>.html` |
| Home page | hero, search over all 80 entries, category grid, popular tools | `en/index.html` |
| Site pages | about, contact, privacy, terms, a 404 that links back into the tools | `about.html`, `contact.html`, `privacy.html`, `terms.html`, `404.html` |
| Roadmap | the tool plan with slugs and target search phrases | [ROADMAP.md](ROADMAP.md) |
| Publishing | exact publish steps, headers, domain change, ad switch | [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md) |

**No build step, no framework, no npm install.** Plain HTML, CSS and
JavaScript. Strict CSP on every page: `script-src 'self'`, no inline scripts,
no CDN, no third-party requests.

---

## Run it locally

```bash
python3 -m http.server 8080
# then open http://localhost:8080/en/
```

---

## Page anatomy

Every i18n page is one level below the root and follows the same template:

```
en/word-counter.html      ← the page (template written once, reused 20×)
ar/word-counter.html      ← same template, dir="rtl", lang="ar"
assets/tools/word-counter.js   ← the tool's logic, shared by both languages
assets/i18n/en.json            ← every visible string for that tool (EN)
assets/i18n/ar.json            ← every visible string (AR)
```

`assets/chrome.js` loads the JSON for the page's `lang`, fills every
`data-i18n` node, then renders the header, footer, breadcrumbs, FAQ list and
related-tool cards, and mounts `window.TOOL` from the tool module.

The seven Business pages are plain English HTML with their own static
navigation — they carry no `data-i18n` attributes, so chrome.js only fixes
their canonical URL and year. They live in `en/` like everything else;
Arabic versions arrive later, and `/ar/business.html`
deliberately does not exist so no Arabic directory ever lists an
English-only tool.

---

## Configuration — everything lives in [assets/config.js](assets/config.js)

```js
window.SITE_CONFIG = {
  siteUrl: 'https://osamaharoonn.github.io/stacklane-site',
  languages: ['en', 'ar'],
  defaultLanguage: 'en',
  categories: ['pdf', 'images', 'text', 'generators', 'calculators',
               'converters', 'developer', 'business']
};
```

### Changing the domain (one edit)

`siteUrl` feeds the canonical URL, `hreflang` alternates, `og:url` and
`og:image` on every page at load time. Two static files are read by crawlers
before any JavaScript runs, so update them too — one line each in
[`sitemap.xml`](sitemap.xml) and [`robots.txt`](robots.txt). A third file
needs the same value: the `<base href>` near the top of
[`404.html`](404.html). GitHub Pages serves that page for any missing URL at
any depth, so its assets and links resolve against `<base>` rather than the
URL you were on. Change the `<base href="…">` there to match `siteUrl`
(with a trailing slash).

## Deferred: Arabic

18 of the 90 English pages have an Arabic counterpart in `ar/`, and
`assets/i18n/ar.json` holds 365 of the English file's 1,920 keys. Nothing was
deleted or edited; the half-finished translation is simply not served:
`_config.yml` excludes `ar/` from the GitHub Pages build and `robots.txt`
disallows it, so those URLs return 404.

Bringing it back is four steps, written out in
[DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md#arabic-is-excluded-from-this-publish):
delete the exclude line, re-add the `hreflang` alternates that chrome.js reads
to build the language switch, add the URLs to the sitemap, and finish the
remaining pages. No JavaScript change is needed, because the switch is built
from the alternate tags.

### Adding a language (one JSON file + one folder)

1. Create `assets/i18n/<code>.json` — copy `en.json`, translate the values,
   keep every key (keys are the contract; a missing key simply falls back to
   nothing, which is why keys must match).
2. Create a `<code>/` folder with `index.html`, one directory page per
   category, and one page per tool. Copy the `en/` pages and change
   `lang`/`dir` on `<html>`; the body's `data-tool` / `data-category`
   attributes do not change.
3. Add the code to `languages` in `assets/config.js`.
4. Point `hreflang` in the new pages at the same slug in every language.
5. Add the new URLs to `sitemap.xml`.

Nothing else moves: templates, scripts and CSS are shared.

## Libraries

Two libraries are vendored (downloaded, pinned, served from this origin) —
see [assets/vendor/README.md](assets/vendor/README.md) for the exact
versions, licences and sha256 sums:

- **pdf-lib 1.17.1** — merge-pdf
- **qrcode-generator 1.4.4** — QR code generator

No other dependency may be added without asking the owner first.

---

## Honest-content rules

- No invented numbers, testimonials, customer counts, "verified" claims or
  fake reviews anywhere — every figure on a page comes from the visitor's own
  input or from text we can stand behind.
- No email address, phone number, ID or birth date is committed anywhere in
  this repository's new files.
- Nothing is uploaded: every tool runs in the browser, and each page says so
  in its own language.

---

## File map

```
index.html                Landing page, noindex, links the categories
en/                       Home, category directories, tool and business pages
  <slug>.html             one page per tool
  <category>.html         one directory per category
  invoice.html … audit.html   the seven Business pages
ar/                       Arabic pages, excluded from the build (see above)
_dev/_gen.py              page generator; _dev/ is excluded from the build
_dev/AUDIT.md             pre-redesign audit, kept out of the published root
about.html contact.html   what the site is; how to report a problem
assets/config.js          ← single configuration value: siteUrl + languages
assets/i18n.js            ← JSON loader (same-origin only)
assets/chrome.js          ← header, footer, breadcrumbs, FAQ, related, canonical
assets/catalog.js         ← language-neutral tool registry + business pages
assets/home.js            ← category grid + search filter
assets/category.js        ← category directory renderer
assets/tools/shared.js    ← ToolKit: fields, messages, progress, downloads
assets/tools/<slug>.js    ← one module per tool, mounted by chrome.js
assets/i18n/en.json ar.json  ← every visible string
assets/vendor/            ← pinned pdf-lib + qrcode, with README
assets/style.css          ← all styles, including RTL
privacy.html · terms.html ← legal, for a site that collects nothing
404.html                  Custom not-found page
sitemap.xml · robots.txt  ← crawlers (update URLs here on a domain change)
_config.yml               Pages build rules: excludes ar/, _dev/, product-source/
ROADMAP.md                ← tool plan: slug, category, target search phrase
DEPLOY-CHECKLIST.md       ← publish, domain, headers, ads, Arabic
ADS-README.md             ← the one switch that turns ad slots on
NEEDS-FROM-OWNER.md       ← facts only the owner can supply (contact address)
PAGE-REVIEW.md            ← per-page review notes (untracked)
product-source/           ← local-only, git-ignored, never deployed
```

## Rebuilding pages

New tool pages are generated, not hand-written:

```bash
python _dev/_gen.py <spec.json> page <slug>   # write en/<slug>.html
python _dev/_gen.py <spec.json> entry <slug>  # add its en.json block
python _dev/_gen.py <spec.json> meta <slug>   # catalog row + sitemap URL
```

Run it from the repository root; it resolves every path from there. It is a
build helper, so it lives under `_dev/`, which the Pages build skips.

---

## What this site deliberately does not do

- No ads, analytics, cookies or tracking of any kind
- No accounts, payments, prices or buy buttons — nothing is for sale here
- No uploads: files and text are processed in the browser and never sent
- No services, quotes or contact forms; support does not exist because
  nothing is sold
- No personal contact details anywhere in the pages or the repository's new
  files
