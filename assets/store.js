/* ============================================================
   Checkout configuration — the only file you need to edit
   to start taking payments.

   1. Create a Stripe Payment Link (free account, no code):
      https://dashboard.stripe.com/payment-links
   2. Paste the link below.
   3. Deploy. Done.

   Until CHECKOUT_URL is set, the buy button shows a clear
   setup notice instead of a broken checkout.
   ============================================================ */
window.STORE = {
  CHECKOUT_URL: '',           // e.g. 'https://buy.stripe.com/xxxxxxxx'
  CONTACT_EMAIL: 'hello@example.com'
};
