/*
 * QA sweep injector — local test harness only, never committed.
 * Injected by qa-server.py into any page served with ?qa=1, first in <head>,
 * so error listeners exist before the page's own scripts run. Measures the
 * page, posts the result to /qa-sweep, then navigates to the next page in
 * qa-plan.json carrying the next index. No iframes: this browser wedges when
 * one is created.
 */
(function () {
  'use strict';

  var m = /[?&]qa=1\b/.test(location.search);
  if (!m) return;

  var errs = [];
  window.addEventListener('error', function (e) {
    errs.push('error: ' + (e.message || 'resource ' + (e.target && (e.target.src || e.target.href) || '?')));
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    errs.push('rejection: ' + String((e.reason && (e.reason.message || e.reason)) || '?'));
  });
  var origError = console.error;
  console.error = function () {
    errs.push('console.error: ' + Array.prototype.map.call(arguments, String).join(' ').slice(0, 160));
    return origError.apply(console, arguments);
  };

  /* The index lives in sessionStorage, not the URL: some pages call
     history.replaceState and would wipe a query parameter (loss.js does).
     ?fresh=1 on the start URL resets the run. */
  var KEY = 'qaSweepIdx';
  function currentIdx() {
    if (/[?&]fresh=1\b/.test(location.search)) sessionStorage.setItem(KEY, '0');
    if (sessionStorage.getItem(KEY) === null) sessionStorage.setItem(KEY, '0');
    return parseInt(sessionStorage.getItem(KEY), 10) || 0;
  }

  function label(el) {
    var c = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '';
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (c ? '.' + c : '');
  }

  function measure() {
    var r = {
      path: location.pathname.replace(/^\/+/, ''),
      innerW: window.innerWidth,
      innerH: window.innerHeight,
      dpr: Math.round((window.devicePixelRatio || 1) * 100) / 100,
      docH: document.documentElement.scrollHeight,
      title: document.title,
      h1: document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : null
    };
    r.overflow = document.documentElement.scrollWidth - window.innerWidth;

    function visible(el) {
      var cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
      var b = el.getBoundingClientRect();
      return b.width > 0 && b.height > 0;
    }
    function ownText(el) {
      for (var n = el.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3 && n.nodeValue && n.nodeValue.trim()) return true;
      }
      return false;
    }

    var small = [];
    var all = document.querySelectorAll('body *');
    for (var i = 0; i < all.length && small.length < 12; i++) {
      var el = all[i];
      var tn = el.tagName;
      if (tn === 'SCRIPT' || tn === 'STYLE' || tn === 'NOSCRIPT' || tn === 'TITLE') continue;
      if (!ownText(el) || !visible(el)) continue;
      var fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 14) small.push(label(el) + ' ' + fs + 'px');
    }
    r.smallText = small;

    /* Whole population counted, first 12 kept as samples: a capped loop can
       hide a genuinely short control behind a crowd of narrow links. */
    var tap = [];
    var shortCount = 0, narrowCount = 0;
    var ctl = document.querySelectorAll('a, button, input, select, textarea, summary, [role="button"]');
    for (var j = 0; j < ctl.length; j++) {
      var c = ctl[j];
      if (c.type === 'hidden') continue;
      if (!visible(c)) continue;
      if (c.tagName === 'A' && getComputedStyle(c).display === 'inline') continue;
      var b2 = c.getBoundingClientRect();
      if (b2.height < 43.5) shortCount++;
      else if (b2.width < 43.5) narrowCount++;
      if ((b2.height < 43.5 || b2.width < 43.5) && tap.length < 12) {
        tap.push(label(c) + ' ' + Math.round(b2.width) + 'x' + Math.round(b2.height));
      }
    }
    r.smallTap = tap;
    r.tapShort = shortCount;
    r.tapNarrow = narrowCount;

    r.slots = [];
    var ss = document.querySelectorAll('.ad-slot');
    for (var k = 0; k < ss.length; k++) {
      r.slots.push({
        slot: ss[k].getAttribute('data-slot'),
        h: Math.round(ss[k].getBoundingClientRect().height * 100) / 100,
        hidden: ss[k].hasAttribute('hidden')
      });
    }

    var t = document.body ? document.body.innerText : '';
    r.bad = [];
    if (/\bNaN\b/.test(t)) r.bad.push('NaN');
    if (/Infinity/.test(t)) r.bad.push('Infinity');
    if (/\bundefined\b/.test(t)) r.bad.push('undefined');
    if (/\[object Object\]/.test(t)) r.bad.push('[object Object]');
    if (/\{[A-Za-z][A-Za-z0-9_.]*\}/.test(t)) r.bad.push('raw-placeholder');

    r.errors = errs.slice(0, 8);
    r.cat = document.body ? document.body.getAttribute('data-category') : null;

    /* Accessibility: accessible name of every form control, accessible
       name of every button/link, duplicate ids, document language. */
    function nameOf(e) {
      var n = (e.getAttribute('aria-label') || '').trim();
      if (n) return n;
      var lb = e.getAttribute('aria-labelledby');
      if (lb) {
        var t = lb.split(/\s+/).map(function (id) {
          var x = document.getElementById(id);
          return x ? (x.textContent || '').trim() : '';
        }).join(' ').trim();
        if (t) return t;
      }
      if (e.id) {
        var l = document.querySelector('label[for="' + e.id + '"]');
        if (l && (l.textContent || '').trim()) return l.textContent.trim();
      }
      var p = e.closest('label');
      if (p && (p.textContent || '').trim()) return p.textContent.trim();
      return (e.getAttribute('title') || '').trim();
    }
    var a11y = { unlabelled: [], unnamed: [], dupIds: [] };
    [].slice.call(document.querySelectorAll('input, select, textarea')).forEach(function (e) {
      if (e.type === 'hidden') return;
      if (!visible(e)) return;
      if (!nameOf(e)) a11y.unlabelled.push((e.id || e.name || e.tagName).slice(0, 30));
    });
    [].slice.call(document.querySelectorAll('a[href], button')).forEach(function (e) {
      if (!visible(e)) return;
      var txt = (e.textContent || '').trim() || (e.querySelector('img') ? e.querySelector('img').getAttribute('alt') || '' : '');
      if (!txt && !nameOf(e)) a11y.unnamed.push((e.id || e.className || e.tagName).slice(0, 30));
    });
    var ids = {};
    [].slice.call(document.querySelectorAll('[id]')).forEach(function (e) {
      if (ids[e.id]) { if (a11y.dupIds.indexOf(e.id) === -1) a11y.dupIds.push(e.id); }
      ids[e.id] = 1;
    });
    a11y.lang = document.documentElement.getAttribute('lang');
    r.a11y = a11y;
    return r;
  }

  /* The local server occasionally refuses a socket when the chain runs fast
     (net::ERR_ADDRESS_IN_USE), which surfaces as "Failed to fetch". Retrying
     is cheaper than restarting a 90-page run. */
  function retry(url, opts, left) {
    return fetch(url, opts).then(function (r) {
      if (!r.ok && r.status !== 204) throw new Error('HTTP ' + r.status);
      return r;
    }).catch(function (e) {
      if (left <= 0) throw e;
      return new Promise(function (res) { setTimeout(res, 600); }).then(function () {
        return retry(url, opts, left - 1);
      });
    });
  }

  window.addEventListener('load', function () {
    setTimeout(function () {
      var rec = measure();
      var i = currentIdx();
      retry('/qa-sweep', { method: 'POST', body: JSON.stringify(rec) }, 4)
        .catch(function () {})
        .then(function () {
          var planName = (/[?&]plan=([A-Za-z0-9._-]+)/.exec(location.search) || [])[1] || 'qa-plan.json';
          return retry('/' + planName, { cache: 'no-store' }, 4);
        })
        .then(function (res) { return res.json(); })
        .then(function (plan) {
          if (/[?&]solo=1\b/.test(location.search)) {
            document.title = 'SOLO DONE ' + rec.path;
            return;
          }
          var nextIdx = i + 1;
          sessionStorage.setItem(KEY, String(nextIdx));
          if (nextIdx >= plan.length) {
            document.title = 'SWEEP COMPLETE';
            return;
          }
          var pn = (/[?&]plan=([A-Za-z0-9._-]+)/.exec(location.search) || [])[1];
          location.href = '/' + plan[nextIdx] + '?qa=1' + (pn ? '&plan=' + pn : '');
        })
        .catch(function (e) {
          document.title = 'SWEEP STALLED at ' + rec.path + ': ' + e.message;
        });
    }, 250);
  });
})();
