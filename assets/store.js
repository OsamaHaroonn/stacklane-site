/* ============================================================
   Site configuration — the only file you need to edit.

   Everything the site knows about you lives here. Every page
   reads these values, so changing one of them changes the whole
   site. Nothing else needs editing, ever.

   ── ONE URL ───────────────────────────────────────────────
   SITE_URL is the base address of the deployed site. It feeds
   canonical URLs, Open Graph tags, the sitemap, JSON-LD and the
   social share image. Change it once to move the site to a
   custom domain (no other file to touch).

   ── ONE CHECKOUT ──────────────────────────────────────────
   CHECKOUT_URL is the only way anything is sold. Point it at
   the hosted checkout of your payment platform:
       · Lemon Squeezy   https://yourstore.lemonsqueezy.com/checkout/buy/...
       · Paddle          https://yourstore.paddle.com/checkout/...
       · Gumroad         https://yourstore.gumroad.com/l/...
   The platform handles payment, delivery, receipts and refunds,
   so nothing ships from this site.

   While CHECKOUT_URL is empty every buy button and every price
   schema is hidden — the site never shows a price it cannot
   take.

   ── SUPPORT ───────────────────────────────────────────────
   FORM_ENDPOINT is a form-service URL that accepts a JSON POST
   (Formspree, Web3Forms, Basin, Getform …), e.g.
       'https://formspree.io/f/xxxxxxx'
   Set it and the contact form appears. Leave it empty and the
   form is hidden and replaced with a note pointing at the
   payment receipt.
   ============================================================ */
window.STORE = {
  /* ---- Base address of the deployed site (one edit to change domain) ---- */
  SITE_URL: 'https://osamaharoonn.github.io/stacklane-site',

  /* ---- The only thing for sale ---- */
  CHECKOUT_URL: '',        // e.g. 'https://yourstore.lemonsqueezy.com/checkout/buy/abc'
  // The price of that product, as a number, in USD. It must match what the
  // platform charges. It is shown ONLY while CHECKOUT_URL is set — no
  // checkout, no price anywhere on the site.
  PRODUCT_PRICE: 49,

  /* ---- Support ---- */
  FORM_ENDPOINT: ''        // e.g. 'https://formspree.io/f/xxxxxxx'
};
