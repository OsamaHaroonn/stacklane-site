# Stacklane — free business tools + one digital product

A dependency-free static website: **seven free tools that run in the browser**
and **one paid product**. No services are sold, nothing is delivered by this
site, and no personal contact details appear anywhere in it.

| Layer | What it is | File |
|---|---|---|
| Free tools | Invoice generator, pricing, margin, break-even, late payment, leak calculator, website audit | `invoice.html`, `calculator.html`, `margin-calculator.html`, `break-even-calculator.html`, `late-payment-calculator.html`, `loss-calculator.html`, `audit.html` |
| Paid product | Client-Ready Business Kit — sold and delivered by the checkout platform | `product.html` (page), `product-source/` (file the buyer receives) |
| Support | A form posting to a form-service endpoint, or a receipt-first notice when none is configured | `index.html#contact` |

**No build step, no framework, no dependencies.** Plain HTML, CSS and
JavaScript. It runs by double-clicking `index.html` and deploys anywhere that
serves static files.

---

## Run it locally

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

---

## Configuration — everything lives in [assets/store.js](assets/store.js)

```js
window.STORE = {
  SITE_URL:       'https://osamaharoonn.github.io/stacklane-site',
  CHECKOUT_URL:   '',   // Lemon Squeezy / Paddle / Gumroad checkout link
  FORM_ENDPOINT:  ''    // Formspree / Web3Forms / Basin URL that accepts JSON POST
};
```

Three values, nothing else. There is **no email address, phone number or
WhatsApp handle** in `store.js`, in any page, or in this file — support runs
through the payment receipt and, when configured, the contact form.

### `SITE_URL` — one edit changes the domain

It feeds the canonical URL, `og:url`, `og:image` and the JSON-LD on every
page, re-derived at load from wherever the page is actually served. Moving to
`https://stacklane.com` means changing this one line. Two static files still
carry the old address by hand — [`sitemap.xml`](sitemap.xml) and
[`robots.txt`](robots.txt) are read by crawlers before any JavaScript runs,
so each needs its URL updated too (one line each).

### `CHECKOUT_URL` — the only thing for sale

While it is empty, `assets/chrome.js` hides every `[data-buy]` button and
removes `#price-schema`, so the site never shows a price it cannot take.
Set it to the platform's checkout and the buttons appear by themselves.

Delivery is the platform's job: the buyer receives the file from the
platform's receipt. The file itself lives in
[`product-source/`](product-source/README.md) and is **excluded from the
deployed site** by `_config.yml`, so it stays in the repo without ever
being publicly downloadable.

### `FORM_ENDPOINT` — support without an inbox

Set it to a form-service URL that accepts a JSON POST (Formspree,
Web3Forms, Basin, Getform) and the support form appears on the home page.
Leave it empty and the form is hidden and replaced by a panel that points
buyers at their payment receipt, their platform's customer portal and the
refund link inside it.

---

## The seven free tools

All of them: no signup, no cookies, no network requests, drafts saved only in
`localStorage` (and drafts holding names or prices expire after 7 days).

| Tool | What it answers |
|---|---|
| [invoice.html](invoice.html) | An invoice in one screen: 10 currencies, sequential numbers, discount/tax, a saved-invoice archive, Print → PDF, email as plain text |
| [calculator.html](calculator.html) | What to charge from cost, hours and margin, with a market comparison |
| [margin-calculator.html](margin-calculator.html) | Margin vs markup, discount impact, price needed for a target margin |
| [break-even-calculator.html](break-even-calculator.html) | Jobs and revenue needed before the business stops losing money, tested against real capacity |
| [late-payment-calculator.html](late-payment-calculator.html) | Interest and fees accrued on an overdue invoice, cost per day of waiting |
| [loss-calculator.html](loss-calculator.html) | What unanswered enquiries and manual admin cost each month, with shareable links and labelled assumptions |
| [audit.html](audit.html) | 15 checks across speed, trust, conversion and findability, scored with a ranked fix list |

Every tool ends with a link to the paid product — that is the whole sales
funnel: free utility → one product.

---

## Deployment

**GitHub Pages (current):**

```bash
git add . && git commit -m "…" && git push origin master
```

Pages rebuilds automatically from the repo root. `_config.yml` excludes
`product-source/` from the published output; verify after pushing that
`/product-source/kit.html` returns 404.

**Any static host:** drag the folder into Netlify, Cloudflare Pages or
Vercel. Delete `_config.yml` if the host doesn't use Jekyll, and hide
`product-source/` with the host's own exclude rule instead.

---

## File map

```
index.html                 Home: seven tools, the product, the support form
product.html               The only page that sells something
invoice.html               Free tool — invoice generator
calculator.html            Free tool — pricing calculator
margin-calculator.html     Free tool — margin & markup
break-even-calculator.html Free tool — break-even
late-payment-calculator.html Free tool — late payment
loss-calculator.html       Free tool — monthly leak
audit.html                 Free tool — 15-point website audit
thank-you.html             Post-purchase page: "your file is in the receipt" (noindex)
privacy.html · terms.html · refunds.html   Legal, no contact details named
404.html                   Custom not-found page
product-source/            Paid file + README on uploading it (NOT deployed)
_config.yml                Excludes product-source from the build
sitemap.xml · robots.txt   Crawlers (update URLs here when the domain changes)
assets/store.js            ← all configuration
assets/chrome.js           ← shared behaviour: base URL, buy buttons, support form
assets/*.js                One script per tool
assets/og.png              1200×630 share image
AUDIT.md · BUSINESS-PLAN.md · ACTION-PLAN.md   Strategy and audit history
```

Removed from earlier versions, deliberately: the services pages, the quote
builder, the quote form, `kit.html` on the public site, and every `mailto:`
/ `wa.me` contact path.

---

## Design notes

- **Zero dependencies** — nothing to audit, nothing to break, no npm install.
- **Strict CSP** (`script-src 'self'`, no inline script) on every page; the
  JSON-LD blocks are `type="application/ld+json"` and are validated by
  `assets/chrome.js` before it rewrites their URLs.
- **No tracking** — no analytics, no cookies, `<meta name="referrer"
  content="no-referrer">` everywhere, no third-party requests except the
  configured form endpoint.
- **Honest numbers** — illustrative defaults are labelled illustrative,
  assumptions are listed as assumptions, and the calculators say so when the
  answer doesn't justify buying anything.
- **Responsive** — single column under 860px; verified at 375px.
- **Print stylesheet** — tools print as clean documents.

## What this site deliberately does not do

- Sell services, take quote requests, or publish an email address, phone
  number or WhatsApp handle
- Hold payments or card details — the checkout platform owns that
- Ship the paid file from the site — the platform does the delivery
- Use analytics, accounts or a database