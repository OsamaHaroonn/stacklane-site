/* ============================================================
   Late payment calculator — pure client-side maths.
   Nothing stored, no network calls. Arithmetic only: whether a
   charge is lawful depends on the contract and jurisdiction, so
   the page says so and this code makes no legal claim.
   ============================================================ */
(function () {
  'use strict';

  var ids = ['amount', 'days', 'rate', 'late', 'fee', 'weekly'];

  function val(id, max) {
    var el = document.getElementById(id);
    if (!el) return 0;
    var v = parseFloat(el.value);
    if (!isFinite(v)) return 0;
    v = Math.max(v, 0);
    if (max !== undefined) v = Math.min(v, max);
    return v;
  }

  function money(n) {
    var v = isFinite(n) ? n : 0;
    if (Math.abs(v) < 0.005) v = 0;
    return '$' + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function calc() {
    var amount = val('amount');
    var days = Math.min(val('days'), 36500);
    var rate = val('rate', 200);
    var late = val('late', 100);
    var admin = val('fee');
    var weekly = val('weekly', 100);

    var dailyInterest = amount * (rate / 100) / 365;
    var interest = dailyInterest * days;
    var fees = amount * (late / 100) * (days / 30);
    var total = amount + interest + fees + admin;

    var perDay = dailyInterest + amount * (late / 100) / 30;
    var perMonth = amount * (late / 100) + dailyInterest * 30;

    // Optional: what the money would have earned while waiting.
    var opp = amount * (weekly / 100) / 52 * (days / 7);

    setText('o-total', money(total));
    setText('o-interest', money(interest));
    setText('o-fees', money(fees));
    setText('o-admin', money(admin));
    setText('o-perday', money(perDay));
    setText('o-permonth', money(perMonth));
    setText('o-opp', money(opp));

    var verdict = document.getElementById('verdict');
    var note = document.getElementById('note');

    if (amount <= 0) {
      if (verdict) verdict.textContent = 'Put the invoice amount in to start.';
      if (note) note.textContent = '';
      return;
    }

    if (days <= 0) {
      if (verdict) verdict.innerHTML = 'Not overdue yet — <strong>' + money(amount) +
        '</strong> is still yours to collect. This is what it starts costing from day one.';
      if (note) note.textContent = '';
      return;
    }

    var charged = interest + fees + admin;
    if (verdict) verdict.innerHTML = 'On top of the <strong>' + money(amount) +
      '</strong> invoice, <strong>' + money(charged) + '</strong> has accrued — ask for <strong>' +
      money(total) + '</strong>.';

    if (note) {
      note.textContent = 'Every extra day costs ' + money(perDay) +
        ' — a month of waiting is ' + money(perMonth) + '.';
      if (opp > 0) {
        note.textContent += ' Money you could have had working elsewhere: ' + money(opp) + '.';
      }
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
