# Stacklane — the live site

A complete, dependency-free website implementing **[BUSINESS-PLAN.md](BUSINESS-PLAN.md)**:

| Track | Deliverable | File |
|---|---|---|
| **A** — cash now | Service landing page with published pricing and a quote form | [index.html](index.html) |
| **A** — proof | Three live demos instead of fake screenshots | [invoice.html](invoice.html), [calculator.html](calculator.html) |
| **B** — money while you sleep | Free tool (traffic) + paid product page (income) | [invoice.html](invoice.html), [product.html](product.html) |

**No build step, no framework, no dependencies.** Plain HTML, CSS and JavaScript. It runs by double-clicking `index.html` and deploys anywhere that serves static files.

---

## Run it locally

```bash
# simplest: open index.html in your browser

# or serve it (recommended, matches real hosting)
python3 -m http.server 8080
# then open http://localhost:8080
```

### What works out of the box

- **Invoice generator** — line items, 10 currencies, discount %, tax %, live totals, **sequential invoice numbers (INV-1001…)**, a saved-invoice archive kept only in your browser, autosave, **Print → Save as PDF**. Verified working.
- **Quote builder** — scope, line items, deposit %, validity date, live "valid until", email / copy / print. Verified working.
- **15-point website audit** — score, ranked fix list, email/copy the result. Verified working.
- **Pricing calculator** — cost-plus maths, margin, break-even, effective hourly rate, market-price comparison with a plain-English verdict. Verified working.
- **Leak calculator** — four inputs, adaptive honest verdict (it tells you *not* to automate under ~$500/mo), shareable numbers link, labelled assumptions and a 10% stress test.
- **Quote form** — composes a `mailto:` message with everything filled in, plus WhatsApp. No backend, no data collected, works offline.
- **Product page** — full sales page; checkout activates the moment you add `CHECKOUT_URL` (Stripe, Paddle, Lemon Squeezy, Gumroad) or `PAYPAL_ME`.
- **Legal pages** — privacy, terms, refunds + a custom `404.html`. All cross-linked from every footer.

---

## Make it yours (5 minutes of editing)### 1. Brand and copy

Search and replace `Stacklane` with your business name, then edit:

- Your email, WhatsApp and booking link → `assets/store.js` only (it drives every page)
- Prices and service descriptions in `index.html`
- Product name, price and copy in `product.html`### 2. Set your details — the required change

Everything configurable lives in one file, [assets/store.js](assets/store.js):

```js
window.STORE = {
  CHECKOUT_URL: '',     // any hosted checkout link (Stripe/Paddle/Lemon Squeezy/Gumroad)
  PAYPAL_ME: '',        // fallback: just your paypal.me username, e.g. 'osama.h'
  CONTACT_EMAIL: '',    // your real address; fills every email link on the site
  WHATSAPP: '',         // '15551234567' — adds WhatsApp buttons site-wide
  BOOKING_URL: '',      // e.g. 'https://cal.com/you/15min' — adds a booking button
  BUSINESS_NAME: '',    // shown in the footer and schemas
  SUPPORT_PHONE: '',    // shown as plain text next to the WhatsApp button
  FORM_ENDPOINT: ''     // optional: Formspree/Web3Forms URL to POST the quote form
};
```

`CONTACT_EMAIL`, `WHATSAPP` and `SUPPORT_PHONE` are read by `assets/chrome.js` on **every** page, so the contact details in the footer of each tool are always the ones in this file.

Until `CHECKOUT_URL` is set, the buy button shows a setup notice instead of a broken checkout, and the quote form falls back to **email + visible message + copy button + WhatsApp** so a lead is never silently lost.

**Payments:** create a free Stripe Payment Link at https://dashboard.stripe.com/payment-links and paste it in. That's the whole integration — no server, no keys in the browser.

### 3. Deliver the kit automatically

The kit lives at `kit.html` and the delivery page at `thank-you.html`. On your Stripe Payment Link, set **Confirmation page → Redirect to your website** to:

```
https://osamaharoonn.github.io/stacklane-site/thank-you.html
```

The buyer lands there straight after paying, with the kit one click away.

> **Honest caveat:** GitHub Pages is static, so `thank-you.html` is reachable by anyone who knows the URL. The kit page ships `noindex` so it stays out of search engines, which is fine while you're starting. If you want real gating, upload the kit to a delivery platform (Gumroad, Lemon Squeezy) and point `CHECKOUT_URL` at their checkout instead — they handle both payment and delivery.

### 3. Deploy

**Option A — GitHub Pages (free, matches "put it on my GitHub")**
```bash
git init
git add .
git commit -m "Add Stacklane demo site"
git remote add origin git@github.com:YOUR_USER/YOUR_REPO.git
git push -u origin main
# then enable Pages: repo → Settings → Pages → deploy from main branch
```

**Option B — any static host**
Drag the folder into Netlify, Cloudflare Pages, or Vercel. All are free for this size.

---

## File map

```
index.html          Landing page (offer, demos, leak bridge, pricing, quote form)
invoice.html        Free tool — invoice generator, 10 currencies, saved archive
calculator.html     Free tool — job pricing calculator
loss-calculator.html Free tool — the bridge to the automation offer
quote.html          Free tool — fixed-price quote builder (scope, deposit, validity)
audit.html          Free tool — 15-point website audit with a ranked fix list
kit.html            THE PRODUCT — six real template packs, printable (noindex)
thank-you.html      Post-payment delivery page for the kit
product.html        Paid product page (income layer)
privacy.html        Privacy policy (no cookies, no analytics, local drafts only)
terms.html          Terms: services, Kit licence, liability, honest-marketing promise
refunds.html        14-day refund on the Kit + preview-first rule for services
404.html            Custom not-found page listing everything that exists
robots.txt          Crawl rules (kit.html disallowed)
sitemap.xml         Index of all indexable pages
assets/style.css    Shared design system + print stylesheet
assets/invoice.js   Invoice maths, currencies, archive, autosave, PDF printing
assets/quote.js     Quote maths, deposit, validity, email/copy/print
assets/audit.js     Audit scoring, ranked fixes, local save
assets/calculator.js Pricing maths and verdicts
assets/site.js      Quote form, fallback contact path, config-driven links
assets/chrome.js    ← shared footer/nav contact details on every page
assets/loss.js      Leak maths + deep links + adaptive honest messaging
assets/kit.js       Kit print button
assets/product.js   Checkout button (payment link, PayPal, or email/WhatsApp)
assets/store.js     ← ALL site configuration lives here
assets/og.png       1200×630 social share image
assets/favicon.svg  Site icon
BUSINESS-PLAN.md    The strategy this site executes
ACTION-PLAN.md      The step-by-step execution plan
AUDIT.md            The 20 problems found before launch + how they were fixed
```

---

## Design notes

- **Zero dependencies** — nothing to audit, nothing to break, no npm install.
- **No tracking, no data collection** — the quote form never leaves the device; tool drafts stay in `localStorage` and **expire after 7 days** because they hold client details.
- **Strict Content-Security-Policy** on every page (`script-src 'self'` — no inline script anywhere).
- **SEO-ready** — canonical, Open Graph/Twitter tags with a real `og:image`, JSON-LD (`ProfessionalService` + `WebSite` on the home page, `Product` with price, availability and the 14-day return policy on the product page, `FAQPage` on the leak calculator), `robots.txt`, `sitemap.xml`, one `h1` per page, every field labelled.
- **Privacy by construction** — `<meta name="referrer" content="no-referrer">` on every page, so nothing about the visitor leaks outbound, and no third-party scripts at all.
- **Responsive** — single column under 860px, sticky summary panels on desktop.
- **Print stylesheet** — the invoice prints as a clean document; nav, buttons and footer are hidden.

## What this site deliberately does not do

- Analytics or cookies (add later if you want; the plan says track by hand for the first 60 days)
- User accounts or a database
- Server-side checkout validation — Stripe owns the transaction, which is what you want
