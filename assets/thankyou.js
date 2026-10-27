/* thank-you page — print button and year (external: strict CSP). */
(function () {
  'use strict';

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  var btn = document.getElementById('print-btn');
  if (btn) {
    btn.addEventListener('click', function () {
      window.location.href = 'kit.html';
      // Print once the kit is open; browsers block print() from a
      // navigation that hasn't settled yet.
      setTimeout(function () { window.print(); }, 600);
    });
  }
})();