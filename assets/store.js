/* ============================================================
   Site configuration — the only file you need to edit.

   Every page reads these. Leaving one empty makes the matching
   button show a clear setup notice instead of silently doing
   nothing.

   ── CONNECTING PAYMENTS ───────────────────────────────────
   Set ONE of these two:
     CHECKOUT_URL  → any hosted checkout link that delivers the
                     file automatically. Works with:
                       · Stripe Payment Link   buy.stripe.com/...
                       · Paddle checkout       paddle.com/...
                       · Lemon Squeezy         lemonsqueezy.com/...
                       · Gumroad               gumroad.com/l/...
     PAYPAL_ME     → just your PayPal username (the word after
                     paypal.me/), e.g. 'osama.h'. Used only when
                     CHECKOUT_URL is empty. Takes the buyer to
                     PayPal to pay, then they land on thank-you.

   Until one is set, the buy button shows how to order instead
   of pretending to work.
   ============================================================ */
window.STORE = {
  /* ---- Money ---- */
  CHECKOUT_URL: '',        // e.g. 'https://buy.stripe.com/xxxx'
  PAYPAL_ME: '',           // e.g. 'osama.h'  → https://paypal.me/osama.h

  /* ---- Contact (live details, used on every page) ---- */
  CONTACT_EMAIL: 'osamaharoun39@gmail.com',
  WHATSAPP: '201016570406',       // international, no +  → wa.me/201016570406
  BOOKING_URL: '',                // e.g. 'https://cal.com/you/15min'

  /* ---- Business ---- */
  BUSINESS_NAME: 'Stacklane',
  SUPPORT_PHONE: '+20 10 1657 0406',

  /* ---- Optional real form backend
     Any service that accepts a JSON POST, e.g. Formspree or Web3Forms:
     'https://formspree.io/f/xxxxxxx'
     Set it and the quote form posts instead of opening the mail app.
     Until then the form falls back to email + copy + WhatsApp, so a
     lead is never silently lost.                                   */
  FORM_ENDPOINT: ''
};
