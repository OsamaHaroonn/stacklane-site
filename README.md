# Stacklane — working demo site for the two-track plan

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

- **Invoice generator** — line items, quantity × rate, discount %, tax %, live totals, autosave to `localStorage`, **Print → Save as PDF**. Verified working.
- **Pricing calculator** — cost-plus maths, margin, break-even, effective hourly rate, market-price comparison with a plain-English verdict. Verified working.
- **Quote form** — composes a `mailto:` message with everything filled in. No backend, no data collected, works offline.
- **Product page** — full sales page; checkout activates the moment you add a payment link.

---

## Make it yours (5 minutes of editing)### 1. Brand and copy

Search and replace `Stacklane` with your business name, then edit:

- Your email, WhatsApp and booking link → `assets/store.js` only (it drives every page)
- Prices and service descriptions in `index.html`
- Product name, price and copy in `product.html`### 2. Set your details — the required change

Everything configurable lives in one file, [assets/store.js](assets/store.js):

```js
window.STORE = {
  CHECKOUT_URL: '',     // Stripe Payment Link — turns "Buy now" into a real checkout
  CONTACT_EMAIL: '',    // your real address; fills every email link on the site
  WHATSAPP: '',         // '15551234567' — adds a WhatsApp button to the contact panel
  BOOKING_URL: '',      // e.g. 'https://cal.com/you/15min' — adds a booking button
  FORM_ENDPOINT: ''     // optional: Formspree/Web3Forms URL to POST the quote form
};
```

Until `CHECKOUT_URL` is set, the buy button shows a setup notice instead of a broken checkout, and the quote form falls back to **email + visible message + copy button + WhatsApp** so a lead is never silently lost.

**Payments:** create a free Stripe Payment Link at https://dashboard.stripe.com/payment-links and paste it in. That's the whole integration — no server, no keys in the browser.

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
index.html          Landing page (offer, demos, pricing, quote form)
invoice.html        Free tool #1 — invoice generator (fully working)
calculator.html     Free tool #2 — job pricing calculator (fully working)
product.html        Paid product page (income layer)
robots.txt          Crawl rules
sitemap.xml         Index of the four pages
assets/style.css    Shared design system + print stylesheet
assets/invoice.js   Invoice maths, autosave, PDF printing
assets/calculator.js Pricing maths and verdicts
assets/site.js      Quote form, fallback contact path, config-driven links
assets/product.js   Checkout button and setup states
assets/store.js     ← ALL site configuration lives here
assets/favicon.svg  Site icon
BUSINESS-PLAN.md    The strategy this site executes
ACTION-PLAN.md      The step-by-step execution plan
```

---

## Design notes

- **Zero dependencies** — nothing to audit, nothing to break, no npm install.
- **No tracking, no data collection** — the quote form never leaves the device; tool drafts stay in `localStorage` and **expire after 7 days** because they hold client details.
- **Strict Content-Security-Policy** on every page (`script-src 'self'` — no inline script anywhere).
- **SEO-ready** — canonical, Open Graph and Twitter tags per page, `robots.txt`, `sitemap.xml`, one `h1` per page, every field labelled.
- **Responsive** — single column under 860px, sticky summary panels on desktop.
- **Print stylesheet** — the invoice prints as a clean document; nav, buttons and footer are hidden.

## What this site deliberately does not do

- Analytics or cookies (add later if you want; the plan says track by hand for the first 60 days)
- User accounts or a database
- Server-side checkout validation — Stripe owns the transaction, which is what you want
