/* ============================================================
   Shared site chrome — loaded on every page after store.js.

   Fills, from assets/store.js:
     #year / [data-year]     → current year
     [data-email]            → real mailto link
     [data-wa]               → real wa.me link (unhides the element)
     [data-phone]            → phone number as text

   Kept separate from site.js so the same contact details appear
   on the invoice tool, the calculators and the product page
   without duplicating markup. No inline script: strict CSP holds.
   ============================================================ */
(function () {
  'use strict';

  var S = window.STORE || {};
  var email = (S.CONTACT_EMAIL || '').trim();
  var emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  var phone = (S.SUPPORT_PHONE || '').trim();
  var waDigits = String(S.WHATSAPP || '').replace(/[^\d]/g, '');

  var year = String(new Date().getFullYear());

  [].forEach.call(document.querySelectorAll('[data-year], #year'), function (el) {
    el.textContent = year;
  });

  [].forEach.call(document.querySelectorAll('[data-phone]'), function (el) {
    if (phone) el.textContent = phone;
  });

  [].forEach.call(document.querySelectorAll('[data-email]'), function (el) {
    if (emailOK) {
      el.href = 'mailto:' + email;
      el.textContent = email;
      el.removeAttribute('hidden');
    } else {
      el.removeAttribute('href');
      el.textContent = 'Add your email in assets/store.js';
      el.title = 'Configuration needed';
    }
  });

  [].forEach.call(document.querySelectorAll('[data-wa]'), function (el) {
    if (waDigits) {
      el.href = 'https://wa.me/' + waDigits;
      el.target = '_blank';
      el.rel = 'noopener';
      el.removeAttribute('hidden');
    } else {
      el.setAttribute('hidden', '');
    }
  });
})();