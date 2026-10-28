/* ============================================================
   product.html behaviour — checkout button and setup states.
   Kept out of the HTML so a strict CSP can be enforced.
   ============================================================ */
(function () {
  'use strict';

  var S = window.STORE || {};
  var email = (S.CONTACT_EMAIL || '').trim();
  var emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function checkoutReady() {
    return /^https?:\/\//.test((S.CHECKOUT_URL || '').trim());
  }

  function paypalReady() {
    return /^[A-Za-z0-9._-]{2,}$/.test((S.PAYPAL_ME || '').trim());
  }

  function checkoutURL() {
    if (checkoutReady()) return (S.CHECKOUT_URL || '').trim();
    if (paypalReady()) {
      return 'https://paypal.me/' + (S.PAYPAL_ME || '').trim() +
             '/49USD';
    }
    return '';
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  function setupNotice() {
    if (checkoutURL()) return;
    var msg;
    if (emailOK) {
      msg = 'Ordering by email instead — <a href="mailto:' + email +
            '?subject=' + encodeURIComponent('Order — Client-Ready Business Kit') +
            '">' + email + '</a> or WhatsApp (button below). Payment link not connected yet.';
    } else {
      msg = 'Setup needed: add your payment link in <code>assets/store.js</code>.';
    }
    var s1 = document.getElementById('buy-status');
    var s2 = document.getElementById('buy-status-2');
    if (s1) s1.innerHTML = msg;
    if (s2) s2.textContent = 'Order by email or WhatsApp';
  }

  function go() {
    var url = checkoutURL();
    if (url) {
      window.location.href = url;
      return;
    }
    // No payment link yet: never show a dead button. Hand off to email/WhatsApp.
    if (emailOK) {
      window.location.href = 'mailto:' + email +
        '?subject=' + encodeURIComponent('Order — Client-Ready Business Kit') +
        '&body=' + encodeURIComponent(
          'Hi,\n\nI want to buy the Client-Ready Business Kit ($49).\n\nName:\nCountry:\n\nThanks.');
      return;
    }
    if (S.WHATSAPP) {
      window.location.href = 'https://wa.me/' + String(S.WHATSAPP).replace(/[^\d]/g, '');
      return;
    }
    var msg = 'Payment not connected yet — add your link in assets/store.js.';
    var s1 = document.getElementById('buy-status');
    var s2 = document.getElementById('buy-status-2');
    if (s1) s1.textContent = msg;
    if (s2) s2.textContent = msg;
  }

  var b1 = document.getElementById('buy-btn');
  var b2 = document.getElementById('buy-btn-2');
  if (b1) b1.addEventListener('click', go);
  if (b2) b2.addEventListener('click', go);

  setupNotice();
})();