# Deploying Stacklane Tools

The site is a static folder: HTML, CSS, JavaScript and images. There is no
build step, no framework, no server-side code, no database and no environment
variable. Cloudflare Pages serves it as-is.

Target: **https://stacklanetools.com**
Host: **Cloudflare Pages**
Repository: **github.com/OsamaHaroonn/stacklane-tools** (private, branch `main`)

Nothing in this document has been executed: the repository has been pushed,
but the Pages project, the domain and DNS have not been created or changed.

## 1. Create the Cloudflare Pages project

1. Sign in to Cloudflare → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Authorise GitHub if asked, then select the private repository
   `stacklane-tools`.
3. Use these settings exactly:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | **None** |
| Build command | *(leave empty)* |
| Build output directory | `/` |
| Root directory | *(leave empty)* |
| Environment variables | none |

4. **Save and Deploy.** The first deployment takes under a minute. The project
   gets a `https://<project>.pages.dev` address; open it and check the site
   before adding the domain.

Cloudflare Pages reads `_headers` from the root automatically. It applies the
Content-Security-Policy, HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, COOP/CORP and the cache rules listed
in that file. No dashboard header rules are needed.

`404.html` is used automatically for missing paths with an HTTP 404 status.
There are no redirect rules and no Functions.

## 2. Connect the domain

1. **Buy `stacklanetools.com`** (not done — owner action). Nothing in this
   repository purchases, transfers or configures a domain.
2. Add the domain to Cloudflare (**Websites → Add a site**), choose the free
   plan, and copy the two nameservers Cloudflare shows.
3. At the registrar, replace the existing nameservers with those two. Wait for
   Cloudflare to show the zone as **Active** (usually minutes, up to 24 h).
4. In the Pages project → **Custom domains** → **Set up a custom domain**:
   - add `stacklanetools.com` (apex)
   - add `www.stacklanetools.com`
   Because the zone is on Cloudflare, the required DNS records are created
   automatically.
5. In **SSL/TLS**, set the mode to **Full (strict)** and enable **Always Use
   HTTPS**. Cloudflare issues the certificate for both hostnames.

The canonical URL, `og:url`, sitemap and 404 `<base>` all use the apex
(`https://stacklanetools.com`). Make `www` redirect to the apex so there is
one indexed hostname:

- **Rules → Redirect Rules → Create rule**
  - When: hostname equals `www.stacklanetools.com`
  - Then: dynamic redirect, expression
    `concat("https://stacklanetools.com", http.request.uri.path)`, status
    **301**, preserve query string.

Do not add a redirect from the apex to `www`; that would fight the canonical.

## 3. Verify the deployment

Run these against the live host and check the status code:

```bash
curl -sI https://stacklanetools.com/                    | head -1   # 200
curl -sI https://stacklanetools.com/en/                 | head -1   # 200
curl -sI https://stacklanetools.com/en/loan-calculator.html | head -1 # 200
curl -sI https://stacklanetools.com/sitemap.xml         | head -1   # 200
curl -sI https://stacklanetools.com/robots.txt          | head -1   # 200
curl -sI https://stacklanetools.com/no-such-page        | head -1   # 404
curl -sI https://stacklanetools.com/ar/                 | head -1   # 404
```

Check the security headers on the home page:

```bash
curl -sI https://stacklanetools.com/ | grep -iE 'content-security|x-content|x-frame|referrer|permissions|strict-transport'
```

Then in a browser, with the network panel open:

1. `/` loads, the header and footer are present, and the console is empty.
2. `/en/` search: type `pdf`; the result list filters.
3. Open a calculator, a text tool and a PDF tool; each makes **no request to
   another origin**. The PDF tool fetches `assets/vendor/pdf-lib.min.js` from
   this site only.
4. A missing path shows the 404 page with HTTP 404.
5. `/sitemap.xml` lists 96 URLs, all on `https://stacklanetools.com`.
6. `/robots.txt` points at the same sitemap and disallows `/ar/`.
7. At 375 px wide nothing scrolls sideways and the phone menu opens full
   width.
8. `/README.md`, `/TEST-REPORT.md` and the other `.md` files are marked
   `X-Robots-Tag: noindex` and are disallowed in robots.txt.

`ar/` is intentionally not in this deployment: the Arabic translation is
unfinished (18 of 90 pages) and is excluded from the release, so those URLs
return 404. The source files remain in the development project, untouched.

## 4. Build the static HTML before deploying

The header, footer, breadcrumbs, FAQs, related tools, category listings and
home-page grids are generated into the HTML. A deploy that skips the
generator ships whatever markup was last written, so run both commands and
require the first to exit 0:

```bash
python3 tools/prerender.py --check   # fails if a page is stale
python3 tools/prerender.py           # only needed when --check fails
python3 tests/qa.py                  # link, canonical, sitemap, JSON-LD checks
```

All three use the Python standard library; there is nothing to install.

## 5. Caching

`_headers` sets:

- HTML: `max-age=0, must-revalidate` — a new deployment is visible at once.
- `/assets/*`: one hour. Filenames are stable, so they are deliberately not
  `immutable`.
- `sitemap.xml`, `robots.txt`: one hour.

If a deploy looks stale, purge the Cloudflare cache
(**Caching → Configuration → Purge Everything**) and reload with the network
panel open.

## 6. Rollback

Cloudflare keeps every deployment:

1. Pages project → **Deployments**.
2. Find the last deployment known to be good → **⋯ → Rollback to this
   deployment**.

That restores the previous files immediately; no rebuild is needed.

To roll back in Git instead, revert the bad commit and push to `main`:

```bash
git revert <commit>
git push origin main
```

There is no database and no migration, so a rollback only changes files. The
only visitor data is what their own browser stores locally (invoice and audit
drafts); no server-side data exists to restore.

## 7. Changing the domain later

If the domain changes after launch, update these together:

1. `assets/config.js` → `siteUrl`
2. `<link rel="canonical">`, `og:url`, `og:image` on every page
3. `404.html` → `<base href>` and the `base-uri` value in its meta CSP
4. `sitemap.xml` → every `<loc>`
5. `robots.txt` → the `Sitemap:` line
6. `_headers` → nothing (no hostnames are hard-coded there)

Then add the new domain in Pages → Custom domains, keep the old one as a 301
redirect for at least a year, and re-run the canonical/link/sitemap checks.

## 8. Before announcing the site

- [ ] The mailbox `contact@stacklanetools.com` exists, receives mail and is
      monitored. Send a test message from an outside account and reply to it.
      The site publishes this address; it must work before launch.
- [ ] The domain resolves over HTTPS on both apex and `www`, and `www`
      redirects to the apex.
- [ ] The 404, sitemap and robots checks above pass on the live host.
- [ ] The repository is still private, and the Pages project is the only
      deployment.
- [ ] `ads.txt` is still the placeholder (no ads are enabled).
- [ ] Decide whether to keep the Pages project private or make the repository
      public. It is private now and must not be made public without the
      owner's explicit permission.

## 9. Ads and analytics

There are none. No ad script, no publisher ID, no analytics, no consent
banner, and `data-ads` is absent, so every reserved ad slot is hidden and
measures 0 px. `MONETIZATION.md` lists the exact work an AdSense application
would require after the site is live.
