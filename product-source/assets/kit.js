/* kit.html — print button and year. Kept external: the page ships a
   strict CSP (script-src 'self'), which blocks inline script and
   javascript: URLs. */
(function () {
  'use strict';

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  function printKit() { window.print(); }

  var top = document.getElementById('print-top');
  if (top) top.addEventListener('click', printKit);

  var navPrint = document.getElementById('print-nav');
  if (navPrint) navPrint.addEventListener('click', printKit);
})();