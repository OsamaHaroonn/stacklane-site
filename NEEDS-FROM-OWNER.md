# Needs from the owner

Everything below is a real fact, decision or asset that only the owner can
supply. Nothing here has been invented on the site, and none of it blocks the
repository from being deployed — but two items block *announcing* the site.

## 1. The contact mailbox (blocks launch)

The site now publishes **contact@stacklanetools.com** on `contact.html` and
links it with `mailto:`. The mailbox has **not** been created or tested.

Before the site is announced:

1. Create the mailbox (or an alias that forwards to a mailbox you read).
2. Send a test message from an outside account; confirm it arrives.
3. Reply to that message; confirm the reply lands.

If the address will be different, update `contact.html` (one paragraph) and
this file. Do not leave a published address that bounces.

## 2. The domain and DNS (blocks launch)

`stacklanetools.com` has not been purchased and is not connected. Every
canonical URL, `og:url`, sitemap entry, `robots.txt` line and the 404 `<base>`
already use `https://stacklanetools.com`.

Steps are in `DEPLOY.md` §2: buy the domain, add the zone to Cloudflare,
change the nameservers at the registrar, attach the apex and `www` to the
Pages project, redirect `www` to the apex. Nothing in this repository buys a
domain or changes DNS.

## 3. Who operates the site

Neither the About page nor the terms name an owner, company, trading name or
country, because none was supplied and inventing one would be false. For a
business site — and for an AdSense application — a one-line identification on
`about.html` and `terms.html` (trading name, country) makes the legal pages
stronger. Not required to publish.

## 4. Arabic

18 of 90 pages have an Arabic version; the other 72 do not, and the 18 are not
finished. Arabic is **not in this release**: the `ar/` folder and
`assets/i18n/ar.json` stay in the development project, and `/ar/` returns 404
on the deployed site. `robots.txt` disallows it so old URLs are not retried.

To publish Arabic later: finish the remaining pages, restore the folder and
its JSON, add `hreflang` alternates to the English pages, set each Arabic
page's canonical to its own URL, add the URLs to the sitemap, and remove the
`Disallow: /ar/` block. `assets/chrome.js` builds the language switch from the
`alternate` tags alone, so no JavaScript change is needed.

## 5. Ads and analytics

Ads are off: no script, no publisher ID, no consent banner, every reserved
slot hidden. Analytics: none, and the privacy policy says so.

If either changes, the privacy policy and the CSP must change in the same
commit. `MONETIZATION.md` lists the exact AdSense steps, including the
`ads.txt` line (never guess the publisher ID) and the EEA/UK consent
requirement.

## 6. Optional assets

- A PNG favicon. The site ships an SVG favicon; iOS home-screen icons and some
  older browsers ignore SVG. Needs 180×180 and 32×32 PNG versions, plus
  `<link rel="apple-touch-icon">` on the pages.
- A different Open Graph image. `assets/og.png` is 1200×630 and 45 KB; replace
  it only if you want different artwork.

## 7. Decisions the site is waiting on

- **Repository visibility.** The new repository is private, per instruction,
  and must not be made public without explicit permission.
- **Search Console / Bing Webmaster.** Ownership verification and sitemap
  submission need the live domain and an account; they cannot be done before
  the domain exists.
- **AdSense application.** Only after the site is live, indexed and has real
  traffic; eligibility is Google's decision.
