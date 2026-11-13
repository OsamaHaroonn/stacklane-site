# Stacklane Tools

Free browser-based tools for PDF, images, text, generators, calculators,
converters and developers, plus seven working pages for small service
businesses. Every tool runs on the visitor's own device: the site is static
HTML, CSS and JavaScript with no server, no accounts, no analytics and no
uploads.

- Production domain: **https://stacklanetools.com** (not connected yet — see
  `DEPLOY.md`)
- Host: **Cloudflare Pages**, static, no build step
- Repository: `stacklane-tools` (private)
- Published pages: **96** — 73 tools, 7 business pages, 9 category pages, the
  home page, the all-tools index, About, Contact, Privacy, Terms, and a 404.

## What is in the repository

```
index.html              home / landing page (indexable, canonical "/")
all-tools.html          every tool on one page
about.html              what the site is
contact.html            how to get in touch (email only)
privacy.html            privacy policy
terms.html              terms of use
404.html                served by the host for any missing path
_headers                Cloudflare Pages response headers (CSP, HSTS, cache)
robots.txt              crawl rules + sitemap location
sitemap.xml             96 URLs
ads.txt                 placeholder — no ad network is authorised
en/                     90 English pages
  index.html            the tool directory with search
  <category>.html       9 category pages (pdf, images, text, generators,
                        calculators, converters, developer, fun, business)
  <tool>.html           73 tool pages
  business pages        calculator, invoice, margin-calculator,
                        break-even-calculator, late-payment-calculator,
                        loss-calculator, audit
assets/
  config.js             site URL, languages, category order
  catalog.js            73 tools: slug, category, search keywords
  i18n/en.json          every visible string for every page
  style.css             all styles, one file
  chrome.js             header, search, phone menu, footer
  home.js, category.js  home and category rendering
  tools/*.js            one script per tool, plus shared.js
  vendor/               pdf-lib 1.17.1 and qrcode-generator 1.4.4 (local)
  og.png, favicon.svg
```

`TEST-REPORT.md` records the functional, responsive, SEO, accessibility,
security and performance checks that were run. `DEPLOY.md` covers Cloudflare
Pages, the domain and rollback. `MONETIZATION.md` covers the AdSense steps
that only apply after launch. `NEEDS-FROM-OWNER.md` lists what only the owner
can supply.

## Run it locally

The pages fetch `assets/i18n/en.json`, so they need an HTTP server — opening a
file with `file://` will leave the tool shells empty.

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

Any static server works. The site is designed for the root of a domain, so
serve the repository root, not a subfolder.

## Generate the static HTML

Header, footer, breadcrumbs, FAQs, related tools, category listings and the
home-page grids are written into the HTML by `tools/prerender.py`. A crawler
or a visitor without JavaScript therefore sees the whole page, not empty
containers. The runtime scripts still run, but they skip any block that is
already there.

```bash
python3 tools/prerender.py           # write the marked regions
python3 tools/prerender.py --check   # exit 1 if any page is out of date
```

Change the copy in `assets/i18n/en.json`, then re-run the generator. Never
hand-edit inside a `<!-- stacklane:...:start -->` / `:end` pair: the next run
replaces it. Run `--check` before committing; `tests/qa.py` also runs it.

## How the pages fit together

- `assets/config.js` holds the site URL and the category order.
- `assets/catalog.js` is the registry of tools; titles, ledes, FAQs and labels
  live in `assets/i18n/en.json` under `tools.<slug>`.
- `assets/chrome.js` enhances the prerendered header, search box, phone menu
  and footer, and builds them only on a page that has none yet.
- Each tool page is a static shell: `<h1>`, lede, form markup with stable ids,
  and results containers. Its `assets/tools/<slug>.js` reads the fields and
  writes results with `textContent`.
- Business pages have their own scripts under `assets/` (invoice.js,
  margin.js, loss.js, …).

## Change the domain

`https://stacklanetools.com` appears in:

1. `assets/config.js` (`siteUrl`)
2. every page's `<link rel="canonical">`, `og:url` and `og:image`
3. `404.html` (`<base href>` and `base-uri` in its meta CSP)
4. `sitemap.xml` (all 96 URLs)
5. `robots.txt` (the `Sitemap:` line)

Change all five together, then re-run the checks in `TEST-REPORT.md`
(canonical/path comparison, link check, sitemap check).

## Add a tool

1. Add `{ slug, category, keywords }` to `assets/catalog.js`.
2. Add the page's copy under `tools.<slug>` in `assets/i18n/en.json`
   (`title`, `desc`, `lede`, `how`, `faq`, UI labels).
3. Add `en/<slug>.html` following an existing tool page (same head block,
   `data-tool="<slug>"`, form, result containers, script tags).
4. Add `assets/tools/<slug>.js`.
5. Add the URL to `sitemap.xml` and to `all-tools.html`.
6. Run `python3 tools/prerender.py` so the new page gets its header, footer,
   FAQ and related-tool blocks, then `python3 tests/qa.py`.

The i18n file is the largest asset (248 KB raw, 72 KB gzip). Splitting it per
page would touch the loader and every page; it has not been done.

## Third-party code

Two libraries are vendored and served from this origin:
pdf-lib 1.17.1 (MIT) and qrcode-generator 1.4.4 (MIT). Versions, sources and
sha256 hashes are in `assets/vendor/README.md`. There is no CDN, no package
manager and no runtime dependency to install.

## Licence

No open-source licence has been chosen. The repository is private and the
site's terms do not grant permission to rehost or rebrand the code.
