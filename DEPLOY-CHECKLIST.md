# Deploy checklist

Everything here is HTML, CSS and JavaScript with no build step and no
dependencies. The site is a static folder.

## Before the first publish

1. **Pick the host.** GitHub Pages serves this repository as-is. Any static
   host works; the site needs no server-side code.
2. **Confirm the canonical base.** Every page's `<link rel="canonical">`,
   `og:url` and the 404 page's `<base>` use
   `https://osamaharoonn.github.io/stacklane-site/`. On a custom domain these
   must all change together — see “Changing the domain” below.
3. **Check `ads.txt`.** It is a placeholder with the publisher line commented
   out. Leave it as it is until a real ad network issues an ID.
4. **Leave the ad switch off.** Nothing carries `data-ads="on"`, so every slot
   is hidden and measures 0 px.
5. **Do not publish the test harness.** These are local-only and should not be
   uploaded: `qa-*.json`, `qa-*.html`, `qa-inject.js`, `qa-func.js`,
   `qa-shots/`, `_*.py`, `_*.md`, `DESIGN-AUDIT.md`, `WORK-LOG.md`,
   `FINAL-REPORT.md`, `TEXT-AUDIT.md`, `__pycache__/`. The `.gitignore`
   already covers the Python cache.
6. **Keep build helpers under `_dev/`.** There is no `.nojekyll`, so Pages
   builds with Jekyll, and Jekyll skips any file or directory whose name
   begins with `_`. `_dev/_gen.py` (the page generator) and `_dev/AUDIT.md`
   (the pre-redesign audit) therefore stay in the repository and are never
   served. Anything that must not be public belongs in `_dev/`, not at the
   repository root.

## Publish

```
git switch preview-redesign-2
git status                 # expect a clean tree
git push origin preview-redesign-2
```

Then, in the repository settings, set Pages to deploy from that branch and
the `/ (root)` folder. Wait for the build and open the published URL.

## Headers the host must send

The pages carry a `<meta http-equiv="Content-Security-Policy">`, which
browsers honour, but a real header is stronger and covers responses that never
touch the HTML. If the host allows headers, send:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
Permissions-Policy: geolocation=(), camera=(), microphone=()
```

GitHub Pages does not let you set response headers. On Pages the meta CSP
applies and the other four are absent; that is a known limitation, not a bug.

## Changing the domain

The site base appears in: every page's `<link rel="canonical">`, every page's
`<meta property="og:url">`, `sitemap.xml` (92 entries), `robots.txt` (the
sitemap line), `404.html` (`<base href>` and its `base-uri` in the CSP), and
`assets/config.js`. Change all of them in one commit, then re-run the link
check and the sitemap check.

## Arabic is excluded from this publish

English only for now. 18 of the 90 English pages have an Arabic counterpart;
the other 72 do not, and the 18 that exist are not finished. So that a
half-finished translation is not served, Arabic is closed off in the build,
not in the files — nothing under `ar/` and nothing in `assets/i18n/ar.json`
was edited or deleted.

What was changed, exactly:

| file | change |
|---|---|
| `_config.yml` | `ar` added to `exclude:` with a comment saying why |
| `robots.txt` | `Disallow: /ar/` plus a comment (the paths 404, so this only stops crawlers retrying old URLs) |
| `sitemap.xml` | no change needed — it never contained an `/ar/` URL (0 of 92) |
| English pages | no change needed — no English page carries a `hreflang="ar"` alternate or any `/ar/` link, so `chrome.js` renders no language switch for it |

Verify after publishing: `/ar/` and `/ar/index.html` must return **404**, and
no English page may show a language link.

To bring Arabic back in a later round:

1. Delete the `- ar` line from `_config.yml` (and the `/ar/` block from
   `robots.txt`) in one commit.
2. Add `<link rel="alternate" hreflang="ar" …>` and the matching `x-default`
   to each English page that has an Arabic twin; `chrome.js` builds the header
   and menu switch from those tags alone, so no JavaScript changes are needed.
3. Add the Arabic URLs to `sitemap.xml` and set each Arabic page's canonical to
   its own `/ar/` URL.
4. Finish the remaining 72 pages, or point the switch only at the 18 that
   exist — a switch that offers a page that is not there is worse than none.

## Verify after publishing

1. `/` loads and links to the tools.
2. `/en/` loads with its header, search and category cards.
3. Open three tools — one calculator, one text tool, one file tool — and check
   that each gives a result for a real input.
4. A missing path, for example `/no-such-page`, returns the 404 page with
   HTTP 404.
5. `/sitemap.xml` and `/robots.txt` load, name the correct host, and list only
   English pages. The sitemap should hold **94** URLs (90 English pages +
   privacy + terms + about + contact).
6. In the browser network panel, a tool page makes **no request to any other
   origin**.
7. The console is empty on load.
8. At 375 px wide, nothing scrolls sideways.
9. `/about.html` and `/contact.html` load and are reachable from the home page's
   trust band, privacy, terms and the 404 page.

### Files that must not be served

Check these return 404 on the live host — if any returns 200, the build rules
are not being applied:

```bash
curl -sI https://osamaharoonn.github.io/stacklane-site/AUDIT.md   | head -1   # want 404
curl -sI https://osamaharoonn.github.io/stacklane-site/_dev/_gen.py | head -1 # want 404
curl -sI https://osamaharoonn.github.io/stacklane-site/ar/        | head -1    # want 404
curl -sI https://osamaharoonn.github.io/stacklane-site/en/        | head -1    # want 200
curl -sI https://osamaharoonn.github.io/stacklane-site/sitemap.xml | head -1   # want 200
```

Arabic returns 404 because `_config.yml` excludes `ar/`; `_dev/` and any
underscore-prefixed file are skipped by Jekyll. If `AUDIT.md` still answers
200, the build is not picking up `_config.yml` — check that Pages is deploying
from this branch's root folder and not from a prebuilt artifact.

### On a phone

One real device or one emulated 375 px viewport: open `/en/`, search for
`pdf`, open a result, run the tool, and check the result is readable and no
button is cut off. Check the browser bar shows the theme colour (`#1d4ed8`).

## When ads are switched on (not now)

Re-check the network's current size and placement rules first. The reserved
heights in `assets/style.css` are 90 px (728×90) on desktop and 100 px
(320×100) below 720 px for slots A and B, and 250 px (300×250) for slot C.
Adding a network means editing the CSP on every page, and the privacy page's
statement that the policy blocks other origins must change in the same commit.
See `ADS-README.md`.
