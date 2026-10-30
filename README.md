# Stacklane — free browser tools, in English and Arabic

A dependency-free static site: **standalone tool pages grouped by category**,
bilingual from day one. No ads, no accounts, no payments, no analytics, no
tracking — and nothing a visitor types, pastes or uploads ever leaves their
own browser.

| Layer | What it is | Where |
|---|---|---|
| 10 i18n tools | word counter, QR code, password, image compressor, image resizer, merge PDF, age, percentage, unit converter, JSON formatter | `en/<slug>.html`, `ar/<slug>.html` |
| 7 Business pages | invoice, job pricing, margin, break-even, late payment, leak calculator, website audit | `en/<slug>.html` (English only for now) |
| Category directories | one index page per category | `en/<category>.html`, `ar/<category>.html` |
| Home pages | category grid + client-side search box | `en/index.html`, `ar/index.html` |
| Roadmap | the full 30-tool plan with slugs and target search phrases | [ROADMAP.md](ROADMAP.md) |
| Legal | privacy and terms, rewritten for a site that collects nothing | `privacy.html`, `terms.html` |

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

---

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
index.html                Language chooser (noindex)
en/  ar/                  Home + category directories + tool pages
  <slug>.html             one page per tool, per language
  <category>.html         one directory per category (no /ar/business.html)
  invoice.html … audit.html   the seven Business pages (English only)
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
ROADMAP.md                ← 30 tools: slug, category, target search phrase
product-source/           ← local-only, git-ignored, never deployed
```

---

## What this site deliberately does not do

- No ads, analytics, cookies or tracking of any kind
- No accounts, payments, prices or buy buttons — nothing is for sale here
- No uploads: files and text are processed in the browser and never sent
- No services, quotes or contact forms; support does not exist because
  nothing is sold
- No personal contact details anywhere in the pages or the repository's new
  files
