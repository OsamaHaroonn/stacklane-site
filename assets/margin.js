/* ============================================================
   Margin & markup calculator — pure client-side maths.
   Nothing stored, no network calls.
   ============================================================ */
(function () {
  'use strict';

  var ids = ['cost', 'price', 'target', 'discount'];

  function val(id, fallback) {
    var el = document.getElementById(id);
    if (!el) return fallback || 0;
    var v = parseFloat(el.value);
    if (!isFinite(v)) return 0;
    if (id === 'target') return Math.min(Math.max(v, 0), 99);
    if (id === 'discount') return Math.min(Math.max(v, 0), 100);
    return Math.max(v, 0);
  }

  function money(n) {
    var v = isFinite(n) ? n : 0;
    if (Math.abs(v) < 0.005) v = 0;
    return '$' + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pct(n, dp) {
    if (!isFinite(n)) return '—';
    return n.toFixed(dp === undefined ? 1 : dp) + '%';
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function calc() {
    var cost = val('cost');
    var price = val('price');
    var target = val('target', 30);
    var discount = val('discount', 10);

    var profit = price - cost;
    var margin = price > 0 ? (profit / price) * 100 : 0;
    var markup = cost > 0 ? (profit / cost) * 100 : 0;

    setText('o-profit', money(profit));
    setText('o-margin', pct(margin));
    setText('o-markup', pct(markup));

    // Discount path: what survives if you cut the price.
    var after = price * (1 - discount / 100);
    var profitAfter = after - cost;
    var marginAfter = after > 0 ? (profitAfter / after) * 100 : 0;

    setText('o-after', money(after));
    setText('o-profit-after', money(profitAfter));
    setText('o-margin-after', pct(marginAfter));

    // Price that lands exactly on the target margin.
    var needed = target < 100 ? cost / (1 - target / 100) : 0;
    setText('o-needed', money(needed));

    var verdict = document.getElementById('verdict');
    var dNote = document.getElementById('discount-note');

    if (price <= 0 || cost <= 0) {
      if (verdict) verdict.textContent = 'Fill in your cost and your price.';
      if (dNote) dNote.textContent = '';
      return;
    }

    if (profit < 0) {
      if (verdict) verdict.innerHTML = 'You are losing <strong>' + money(Math.abs(profit)) +
        '</strong> on every one of these. Margin is ' + pct(margin) + ' — negative.';
      if (dNote) dNote.textContent = 'There is no discount to discuss until the price clears the cost.';
      return;
    }

    if (verdict) verdict.innerHTML = 'Of every dollar you take, <strong>' +
      margin.toFixed(0) + '&cent;</strong> is yours. That is ' + pct(margin) +
      ' margin and ' + pct(markup) + ' markup — two different numbers for the same job.';

    if (dNote) {
      var lost = profit - profitAfter;
      dNote.textContent = 'Discounting ' + discount + '% removes ' + money(lost) +
        ' of profit and drops you to ' + pct(marginAfter) + ' margin. To land back on ' +
        pct(target, 0) + ' you must charge ' + money(needed) + '.';
    }
  }

  ids.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', calc);
  });

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  calc();
})();
