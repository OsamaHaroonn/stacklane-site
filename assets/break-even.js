/* ============================================================
   Break-even calculator — pure client-side maths.
   Nothing stored, no network calls.
   ============================================================ */
(function () {
  'use strict';

  var ids = ['fixed', 'vcost', 'price', 'capacity'];

  function val(id) {
    var el = document.getElementById(id);
    if (!el) return 0;
    var v = parseFloat(el.value);
    if (!isFinite(v)) return 0;
    if (id === 'capacity') return Math.min(Math.max(v, 0), 100000);
    return Math.max(v, 0);
  }

  function money(n) {
    var v = isFinite(n) ? n : 0;
    if (Math.abs(v) < 0.005) v = 0;
    return '$' + v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function num(n) {
    if (!isFinite(n)) return '0';
    return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function calc() {
    var fixed = val('fixed');
    var vcost = val('vcost');
    var price = val('price');
    var capacity = val('capacity');

    var unit = price - vcost;
    var jobsRaw = unit > 0 ? fixed / unit : (fixed > 0 ? Infinity : 0);
    var jobs = isFinite(jobsRaw) ? Math.ceil(jobsRaw) : Infinity;

    setText('o-unit', money(unit));
    setText('o-jobs', jobs === Infinity ? 'Never' : num(jobs));
    setText('o-rev', jobs === Infinity ? '—' : money(jobs * price));
    setText('o-cjobs', num(capacity));

    var crev = capacity * price;
    var cnet = capacity * unit - fixed;
    setText('o-crev', money(crev));
    setText('o-cnet', money(cnet));

    var verdict = document.getElementById('verdict');
    var capNote = document.getElementById('capacity-note');

    if (price <= 0) {
      if (verdict) verdict.textContent = 'Put a price on one job to start.';
      if (capNote) capNote.textContent = '';
      return;
    }

    if (unit <= 0) {
      if (verdict) verdict.innerHTML = 'Each job costs you <strong>' + money(vcost) +
        '</strong> to deliver and sells for <strong>' + money(price) +
        '</strong>. You lose money on every one — more sales make it worse, not better.';
      if (capNote) capNote.textContent = 'Raise the price or cut the cost before anything else.';
      return;
    }

    if (fixed <= 0) {
      if (verdict) verdict.innerHTML = 'No fixed costs entered: you are <strong>' +
        money(unit) + '</strong> ahead on the very first job.';
      if (capNote) capNote.textContent = '';
      return;
    }

    if (verdict) verdict.innerHTML = 'Sell <strong>' + num(jobs) +
      '</strong> jobs (' + money(jobs * price) + ' of revenue) and you stop losing money. ' +
      'Below that, every month is in the red.';

    if (capNote) {
      if (cnet >= 0) {
        capNote.innerHTML = 'At your stated capacity you clear fixed costs with <strong>' +
          money(cnet) + '</strong> left over each month — break-even lands at ' +
          num(jobs) + ' of your ' + num(capacity) + ' jobs, leaving <strong>' +
          num(Math.max(0, capacity - jobs)) + '</strong> jobs of headroom.';
      } else {
        capNote.innerHTML = 'At your stated capacity you are still <strong>' +
          money(Math.abs(cnet)) + '</strong> short each month. Either the price rises, ' +
          'the fixed costs fall, or the capacity figure is wrong — those are the only three levers.';
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
