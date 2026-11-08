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

## Verify after publishing

1. `/` loads and links to the tools.
2. `/en/` loads with its header, search and category cards.
3. Open three tools — one calculator, one text tool, one file tool — and check
   that each gives a result for a real input.
4. A missing path, for example `/no-such-page`, returns the 404 page with
   HTTP 404.
5. `/sitemap.xml` and `/robots.txt` load and name the correct host.
6. In the browser network panel, a tool page makes **no request to any other
   origin**.
7. The console is empty on load.
8. At 375 px wide, nothing scrolls sideways.

## When ads are switched on (not now)

Re-check the network's current size and placement rules first. The reserved
heights in `assets/style.css` are 90 px (728×90) on desktop and 100 px
(320×100) below 720 px for slots A and B, and 250 px (300×250) for slot C.
Adding a network means editing the CSP on every page, and the privacy page's
statement that the policy blocks other origins must change in the same commit.
See `ADS-README.md`.
