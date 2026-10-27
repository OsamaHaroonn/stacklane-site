/* ============================================================
   Job pricing calculator — pure client-side maths, no storage.
   ============================================================ */
(function () {
  'use strict';

  var ids = ['hours', 'rate', 'materials', 'overhead', 'margin', 'competitor'];

  function val(id) {
    var el = document.getElementById(id);
    var v = el ? parseFloat(el.value) : NaN;
    return isFinite(v) && v > 0 ? v : 0;
  }

  function money(n) {
    return '$' + (isFinite(n) ? n : 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function setText(id, text) {
    document.getElementById(id).textContent = text;
  }

  function calc() {
    var hours = val('hours');
    var rate = val('rate');
    var materials = val('materials');
    var overhead = val('overhead');
    var marginPct = val('margin');
    var market = val('competitor');

    var labour = hours * rate;
    var breakeven = labour + materials + overhead;
    var marginAmount = breakeven * (marginPct / 100);
    var price = breakeven + marginAmount;

    setText('o-labour', money(labour));
    setText('o-materials', money(materials));
    setText('o-overhead', money(overhead));
    setText('o-breve', money(breakeven));
    setText('o-margin', money(marginAmount));
    setText('o-price', money(price));

    // Effective rate ignores overhead and materials: it's what the work
    // itself earned you.
    var effective = hours > 0 ? (price - materials - overhead) / hours : 0;
    setText('o-effective', money(effective) + '/hr');
    setText('o-minute', money(effective / 60));

    var verdict = document.getElementById('verdict');
    if (price === 0) {
      verdict.textContent = 'Fill the fields to see your price.';
      return;
    }

    if (market > 0) {
      if (price > market * 1.1) {
        verdict.innerHTML = "Your price is <strong>" + Math.round((price / market - 1) * 100) +
          "% above</strong> the market. That&rsquo;s fine if you can justify it &mdash; and worth cutting if you can&rsquo;t.";
      } else if (price < market * 0.9) {
        verdict.innerHTML = "You&rsquo;re <strong>under</strong> the market by " +
          Math.round((1 - price / market) * 100) + "%. You may be leaving money on the table.";
      } else {
        verdict.innerHTML = "You&rsquo;re <strong>in line</strong> with the market. Price with confidence.";
      }
      return;
    }

    verdict.innerHTML = hours > 0
      ? "Charge <strong>" + money(price) + "</strong> &mdash; that&rsquo;s " + money(effective) +
        "/hr effective, on " + hours + " hour" + (hours === 1 ? "" : "s") + " of work."
      : "Enter the hours the job takes.";
  }

  ids.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', calc);
  });

  document.getElementById('year').textContent = new Date().getFullYear();
  calc();
})();
