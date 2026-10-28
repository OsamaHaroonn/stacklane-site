/* ============================================================
   Lost-revenue calculator — the bridge between the free tools and
   the automation offer. Pure client-side maths, nothing stored,
   no network calls.
   ============================================================ */
(function () {
  'use strict';

  // Must match the published price on index.html.
  var FIX_PRICE = 2500;
  var CARE_PRICE = 250;

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
    setText('o-fix', money(FIX_PRICE));
    setText('o-care', money(CARE_PRICE) + '/mo');

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

    // Honest, adaptive messaging: don't sell automation to somebody
    // whose leak does not justify it.
    if (monthly < 500) {
      verdict.innerHTML = 'About <strong>' + money(monthly) +
        '</strong> a month is leaking. That is real but small — an automation project would not pay for itself yet. ' +
        'Fix the follow-up habit first, free.';
      ratioNote.textContent = 'At this level, fix it by hand: one 20-minute block each morning to clear enquiries.';
    } else if (monthly < FIX_PRICE) {
      verdict.innerHTML = 'About <strong>' + money(monthly) +
        '</strong> a month — <strong>' + money(monthly * 12) +
        '</strong> a year. That is worth automating, and a one-time build pays back in roughly <strong>' +
        (FIX_PRICE / monthly).toFixed(1) + ' months</strong>.';
      ratioNote.textContent = 'The one-time build costs about ' +
        (FIX_PRICE / monthly).toFixed(1) +
        ' months of what you are losing now — paid back before the first quarter ends.';
    } else {
      verdict.innerHTML = '<strong>' + money(monthly) +
        '</strong> a month, <strong>' + money(monthly * 12) +
        '</strong> a year. One month of this leak already covers the entire automation build.';
      ratioNote.textContent = 'You are paying more to keep the problem than it would cost to remove it — ' +
        'fix it once, then it stops.';
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