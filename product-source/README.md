# Product source — Client-Ready Business Kit

This folder holds **the file the customer actually buys**: `kit.html`, a
self-contained document with the six template packs, plus its own copy of the
styles and script it needs.

## Why it is not on the website

The site is a static GitHub Pages repo — everything committed to it is
publicly downloadable. If `kit.html` were deployed, anyone who guessed the
URL would read the paid product without paying. It is excluded from the
build by `_config.yml` in the repository root:

```yaml
exclude:
  - product-source
```

So it lives in the repo (version history, backups, your machine) but never
reaches the public site. The buyer gets it from the payment platform instead.

## Uploading it to your platform

Delivery is the platform's job. Each platform has its own upload step — pick
your own from the storefront settings:

| Platform | Where to upload |
|---|---|
| **Lemon Squeezy** | Products → your product → *Files* → upload `kit.html` |
| **Paddle** | Catalog → product → *Files* (requires a Paddle Classic / vendor-hosted file, or a hosted document URL) |
| **Gumroad** | Product → *Content* → upload the file (or a `.zip` of this folder) |

Steps in common to all three:

1. Create **one** product priced the same as the price on `product.html`.
2. Upload `kit.html` (or zip this whole folder — `kit.html` already loads
   `assets/kit.js`, `assets/style.css` and `assets/favicon.svg` from
   `product-source/assets/`).
3. Set the **post-purchase redirect** to the site's delivery page:
   `https://osamaharoonn.github.io/stacklane-site/thank-you.html`
   (optional — the platform's own receipt already contains the download).
4. Create the checkout / payment link and paste it into `CHECKOUT_URL` in
   [`assets/store.js`](../assets/store.js) at the repository root. That is the
   only place the site learns it can sell something.

Once `CHECKOUT_URL` is set, every buy button on the site appears on its own —
no other edit is needed. Leave it empty and the site hides all prices and buy
buttons, which is the correct state until the platform is ready.

## Editing the product itself

`kit.html` is plain HTML — one document, six `<section>` packs. Text inside
square brackets, like `[$amount]`, is the placeholder the buyer fills in.
Keep those brackets: they are the instruction, not unfinished copy.