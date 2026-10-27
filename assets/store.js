/* ============================================================
   Site configuration — the only file you need to edit.

   Set these to your real details; every page reads them.
   Leaving one empty makes the matching button show a clear
   setup notice instead of silently doing nothing.
   ============================================================ */
window.STORE = {
  /* ---- Money ---- */
  // Stripe Payment Link (https://dashboard.stripe.com/payment-links)
  CHECKOUT_URL: '',

  /* ---- Contact ---- */
  CONTACT_EMAIL: '',          // e.g. 'you@yourbusiness.com'
  WHATSAPP: '',               // e.g. '15551234567' (international, no +)
  BOOKING_URL: '',            // e.g. 'https://cal.com/you/15min'

  /* ---- Optional real form backend ----
     Any service that accepts a JSON POST, e.g. Formspree or Web3Forms:
     'https://formspree.io/f/xxxxxxx'
     Set it and the quote form posts instead of opening the mail app.
     Until then the form falls back to email + copy + WhatsApp, so a
     lead is never silently lost.                                   */
  FORM_ENDPOINT: ''
};