/* ============================================================
   Shared site behaviour — loaded on every page after store.js.

   One config file drives everything:
     SITE_URL       → rewrites canonical, og:url and og:image for
                      the deployed address, so a custom domain is
                      a single edit in store.js.
     CHECKOUT_URL   → shows or hides every buy button and the
                      price schema. Empty means nothing is for
                      sale, and the site shows no price.
     FORM_ENDPOINT  → shows or hides the support form. Empty
                      means support is handled by the payment
                      receipt instead.

   No inline script, no external requests beyond the configured
   form endpoint: strict CSP holds.
   ============================================================ */
(function () {
  'use strict';

  var S = window.STORE || {};
  var base = String(S.SITE_URL || '').trim().replace(/\/+$/, '');
  var checkout = String(S.CHECKOUT_URL || '').trim();
  var checkoutOK = /^https?:\/\//.test(checkout);
  var endpoint = String(S.FORM_ENDPOINT || '').trim();
  var endpointOK = /^https?:\/\//.test(endpoint);

  /* ---------- 1. Years ---------- */
  [].forEach.call(document.querySelectorAll('[data-year], #year'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- 2. Base URL: canonical, og:url, og:image, JSON-LD ----------
     The old base is derived from wherever this page is actually served,
     so it keeps working after a domain move. */
  if (base) {
    var path = window.location.pathname;
    var file = path.split('/').pop();
    // The home page canonicalises to the bare directory, not /index.html.
    var page = (!file || file === 'index.html') ? base + '/' : base + '/' + file;

    var canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.setAttribute('href', page);

    [].forEach.call(document.querySelectorAll('meta[property="og:url"]'), function (m) {
      m.setAttribute('content', page);
    });
    [].forEach.call(document.querySelectorAll('meta[property="og:image"]'), function (m) {
      m.setAttribute('content', base + '/assets/og.png');
    });

    var origin = window.location.origin;
    var dir = path.substring(0, path.lastIndexOf('/') + 1);
    var oldBase = (origin + dir).replace(/\/+$/, '');
    if (oldBase && oldBase !== base) {
      [].forEach.call(document.querySelectorAll('script[type="application/ld+json"]'), function (s) {
        try {
          var text = s.textContent.split(oldBase).join(base);
          JSON.parse(text); // only swap in text that is still valid JSON
          s.textContent = text;
        } catch (e) { /* leave the original block alone */ }
      });
    }
  }

  /* ---------- 3. Buy buttons, price and price schema ---------- */
  function fmtPrice(p) {
    var n = Number(p);
    if (!isFinite(n) || n <= 0) return '';
    return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  var price = fmtPrice(S.PRODUCT_PRICE);

  if (!checkoutOK) {
    // Nothing is for sale: hide the buttons, the prices and the price schema
    // so no search engine ever lists a price this site cannot take.
    [].forEach.call(document.querySelectorAll('[data-buy]'), function (el) {
      el.setAttribute('hidden', '');
    });
    [].forEach.call(document.querySelectorAll('[data-price]'), function (el) {
      el.setAttribute('hidden', '');
    });
    [].forEach.call(document.querySelectorAll('#price-schema, script[data-price-schema]'), function (s) {
      if (s.parentNode) s.parentNode.removeChild(s);
    });
    // Public-facing wording: never expose internal config to visitors.
    [].forEach.call(document.querySelectorAll('[data-buy-note]'), function (el) {
      el.textContent = 'Purchasing is not open yet — this page never takes a payment itself.';
    });
  } else {
    [].forEach.call(document.querySelectorAll('[data-price]'), function (el) {
      if (!price) return;
      // Authored template only: {{PRICE}} is swapped for the configured
      // figure, so nothing else in the markup is ever rewritten.
      var tpl = el.getAttribute('data-price-template');
      if (tpl) el.innerHTML = tpl.split('{{PRICE}}').join(price);
      el.removeAttribute('hidden');
    });
    [].forEach.call(document.querySelectorAll('[data-buy]'), function (el) {
      el.removeAttribute('hidden');
      if (price && el.textContent.indexOf(price) === -1) {
        el.textContent = el.textContent.replace(/[\s—-]+$/, '') + ' — ' + price;
      }
      el.addEventListener('click', function () { window.location.href = checkout; });
    });
    // Keep the Product schema's price in step with the configured price.
    var schema = document.getElementById('price-schema') ||
                 document.querySelector('script[data-price-schema]');
    if (schema && price) {
      try {
        var data = JSON.parse(schema.textContent);
        if (data.offers) { data.offers.price = String(Number(S.PRODUCT_PRICE)); data.offers.priceCurrency = 'USD'; }
        schema.textContent = JSON.stringify(data);
      } catch (e) { /* leave the block as shipped */ }
    }
  }

  /* ---------- 4. Support form ---------- */
  var form = document.getElementById('support-form');
  var fallback = document.getElementById('support-fallback');

  if (form && endpointOK) {
    form.setAttribute('hidden', '');
    if (fallback) fallback.setAttribute('hidden', '');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = document.getElementById('support-submit');
      var status = document.getElementById('support-status');
      var hp = form.querySelector('[name="_honey"]');
      if (hp && hp.value) return; // honeypot tripped: bot, not a human

      var data = {};
      [].forEach.call(form.querySelectorAll('input, textarea, select'), function (el) {
        if (!el.name || el.type === 'hidden') return;
        data[el.name] = el.value.trim();
      });
      data._subject = 'Support request — ' + (data.topic || 'general');
      data._replyto = data.email || '';

      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (btn) { btn.disabled = false; btn.textContent = 'Send message'; }
        if (r.ok) {
          form.setAttribute('hidden', '');
          if (status) status.innerHTML = 'Sent — you\'ll get a reply using the receipt email you used at checkout.';
          if (status) status.removeAttribute('hidden');
        } else {
          if (status) status.textContent = 'Sending failed. Please try again in a moment.';
          if (status) status.removeAttribute('hidden');
        }
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Send message'; }
        if (status) status.textContent = 'No connection. Please try again in a moment.';
        if (status) status.removeAttribute('hidden');
      });
    });

    // Reveal only when there is a real endpoint to post to.
    form.removeAttribute('hidden');
  } else if (form) {
    form.setAttribute('hidden', '');
    if (fallback) fallback.removeAttribute('hidden');
  }
})();
