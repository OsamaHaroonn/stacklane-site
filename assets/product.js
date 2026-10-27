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

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  function setupNotice() {
    if (checkoutReady()) return;
    var msg;
    if (emailOK) {
      msg = 'Checkout isn\'t connected yet — add your payment link in <code>assets/store.js</code>' +
            ' · <a href="mailto:' + email + '">or email to order</a>';
    } else {
      msg = 'Setup needed: add your payment link and your email in <code>assets/store.js</code>.';
    }
    var s1 = document.getElementById('buy-status');
    var s2 = document.getElementById('buy-status-2');
    if (s1) s1.innerHTML = msg;
    if (s2) s2.textContent = 'Setup needed — see assets/store.js';
  }

  function go() {
    if (checkoutReady()) {
      window.location.href = (S.CHECKOUT_URL || '').trim();
      return;
    }
    var msg = 'Checkout isn\'t connected yet — add your payment link in assets/store.js.';
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