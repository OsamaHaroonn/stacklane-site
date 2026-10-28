/* ============================================================
   Lost-revenue calculator — the bridge between the free tools and
   the paid product. Pure client-side maths, nothing stored,
   no network calls.
   ============================================================ */
(function () {
  'use strict';

  // Keep in sync with the price on product.html and on the platform's
  // checkout — this figure only ever appears as a comparison, never as a
  // cart. The site sells nothing else.
  var KIT_PRICE = 49;

  var ids = ['hours', 'rate', 'enquiries', 'value', 'conversion', 'weeks'];

  /* Deep-link support: ?h=8&r=60&e=6&v=400&c=20&w=4.33
     Lets a visitor bookmark a scenario, email their numbers as a link,
     or come from the home page with a pre-set case. Only recognised
     numeric keys are read, and only valid ranges are applied. */
  var PARAM = { h: 'hours', r: 'rate', e: 'enquiries', v: 'value', c: 'conversion', w: 'weeks' };

  function readParams() {
    var q;
    try { q = new URLSearchParams(window.location.search); }
    catch (err) { return; }
    Object.keys(PARAM).forEach(function (k) {
      if (!q.has(k)) return;
      var n = parseFloat(q.get(k));
      if (!isFinite(n) || n < 0) return;
      var el = document.getElementById(PARAM[k]);
      if (el) el.value = n;
    });
  }

  function queryString() {
    var parts = [];
    Object.keys(PARAM).forEach(function (k) {
      var el = document.getElementById(PARAM[k]);
      if (!el) return;
      var n = parseFloat(el.value);
      if (isFinite(n) && n > 0) parts.push(k + '=' + encodeURIComponent(n));
    });
    return parts.length ? '?' + parts.join('&') : '';
  }

  readParams();

  function val(id, fallback) {
    var el = document.getElementById(id);
    if (!el) return fallback || 0;
    var v = parseFloat(el.value);
    if (!isFinite(v)) return 0;
    // conversion is the only bounded field; everything else clamps at 0.
    if (id === 'conversion') return Math.min(Math.max(v, 0), 100);
    if (id === 'weeks') return Math.min(Math.max(v, 1), 31);
    return Math.max(v, 0);
  }

  function money(n) {
    var v = isFinite(n) ? n : 0;
    if (Math.abs(v) < 0.5) v = 0;
    return '$' + Math.round(v).toLocaleString(undefined);
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function calc() {
    var hours = val('hours');
    var rate = val('rate');
    var enquiries = val('enquiries');
    var jobValue = val('value');
    var conv = val('conversion', 30);
    var weeks = val('weeks', 4.33);

    var admin = hours * weeks * rate;
    var lost = enquiries * weeks * (conv / 100) * jobValue;
    var monthly = admin + lost;

    setText('o-admin', money(admin));
    setText('o-lost', money(lost));
    setText('o-month', money(monthly));
    setText('o-year', money(monthly * 12));
    setText('o-week', money(monthly / weeks));
    setText('o-fix', 'Free');
    setText('o-care', money(KIT_PRICE));

    // The row is labelled "One month of your leak" — it must always show a
    // money figure. The payback period belongs in the note below it.
    setText('o-ratio', money(monthly));

    // Sceptic's case: same leak, one tenth of the conversion assumption.
    var ten = admin + enquiries * weeks * 0.10 * jobValue;
    setText('o-ten', money(ten));

    // Keep the address bar in sync so "copy a link to my numbers" is real.
    try {
      window.history.replaceState(null, '', window.location.pathname + queryString());
      var share = document.getElementById('share-link');
      if (share) share.href = window.location.pathname + queryString() + window.location.hash;
    } catch (err) { /* file:// or sandboxed: sharing degrades, maths still runs */ }

    var verdict = document.getElementById('verdict');
    var ratioNote = document.getElementById('ratio-note');

    if (monthly <= 0) {
      verdict.textContent = 'Fill the fields to see the number.';
      ratioNote.textContent = '';
      return;
    }

    // Honest, adaptive messaging: the calculator never tells somebody to
    // buy anything. It says what the number means, and points at the free
    // tools that do the fixing.
    if (monthly < 500) {
      verdict.innerHTML = 'About <strong>' + money(monthly) +
        '</strong> a month is leaking. That is real but small — buying anything to fix it would not pay for itself yet. ' +
        'Fix the follow-up habit first: one 20-minute block each morning to clear enquiries.';
      ratioNote.textContent = 'At this level the fix is free — run the 15-point audit and close the gaps it finds.';
    } else {
      verdict.innerHTML = 'About <strong>' + money(monthly) +
        '</strong> a month — <strong>' + money(monthly * 12) +
        '</strong> a year. That is worth acting on, starting with the free fix list below.';
      ratioNote.textContent = 'A single month of this leak is ' + money(monthly) +
        '. The template kit is ' + money(KIT_PRICE) + ' once, and the audit that finds the gaps is free.';
    }
  }

  ids.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', calc);
  });

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* Copy a link that reopens the calculator with these exact numbers. */
  var share = document.getElementById('share-link');
  if (share) {
    share.addEventListener('click', function (e) {
      e.preventDefault();
      var url = window.location.origin === 'null'
        ? window.location.href
        : window.location.origin + window.location.pathname + queryString() + window.location.hash;
      var status = document.getElementById('share-status');
      function say(t) { if (status) status.textContent = t; }
      function fallback() {
        window.prompt('Copy this link:', url);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          say('Link copied — it reopens these exact numbers.');
        }, fallback);
      } else {
        fallback();
      }
    });
  }

  calc();
})();