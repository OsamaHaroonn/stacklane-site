/*
 * Local functional-test driver — QA only, never committed.
 * Reads qa-func.json, finds its own page, runs three scenarios on it
 * (normal, empty, hostile), POSTs one record per scenario to /qa-func,
 * then navigates to the next page in qa-list.json.
 *
 * Hostile input is deliberately generic: every free-text field gets script
 * tags, quotes, a NUL, non-BMP characters and 4000 chars; every number field
 * gets -1e308; every select moves to its last option. No tool should throw,
 * hang or print raw markup.
 */
(function () {
  'use strict';
  var ME = location.pathname.replace(/^.*?\/stacklane-site\//, '').replace(/^\//, '');
  if (!/qa=1/.test(location.search)) return;

  var HOSTILE = '<script>alert(1)</script>"\'&<img src=x onerror=alert(1)>' +
    '\u0000\u00e9\u03a9\u0f01\ud835\udd18' + new Array(4001).join('a');

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function setVal(id, v) {
    /* Accept a CSS selector for rows that have no stable id (invoice items). */
    var el = document.getElementById(id) || (/^[.#\[]/.test(id) ? document.querySelector(id) : null);
    if (!el) return 'missing:' + id;
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return 'ok';
  }

  function outText() {
    var parts = [];
    [].slice.call(document.querySelectorAll('.tk-out')).forEach(function (o) {
      parts.push(o.innerText || o.textContent || '');
    });
    [].slice.call(document.querySelectorAll('textarea[readonly], pre')).forEach(function (o) {
      if (o.value != null && o.value !== '') parts.push('[value] ' + o.value);
      else if (o.textContent && o.tagName !== 'TEXTAREA') parts.push('[text] ' + o.textContent);
    });
    [].slice.call(document.querySelectorAll('.tk-msg')).forEach(function (m) {
      if (!m.hidden && (m.textContent || '').trim()) parts.push('[msg] ' + m.textContent);
    });
    [].slice.call(document.querySelectorAll('[role="status"], [aria-live]')).forEach(function (s) {
      if ((s.textContent || '').trim()) parts.push('[live] ' + s.textContent.trim());
    });
    [].slice.call(document.querySelectorAll('.dl-list a, [id$="-download"], a[download]')).forEach(function (a) {
      parts.push('[link] ' + (a.textContent || '').trim() + ' → ' + (a.getAttribute('download') || a.getAttribute('href') || '').slice(0, 40));
    });
    /* Business pages render into a shared .totals block plus named notes. */
    [].slice.call(document.querySelectorAll('.totals')).forEach(function (b) {
      if ((b.innerText || '').trim()) parts.push('[totals] ' + b.innerText.replace(/\s+/g, ' ').trim());
    });
    ['verdict', 'note', 'ratio-note', 'capacity-note', 'discount-note', 'audit-status',
      'score', 's-pass', 's-fail', 's-groups', 'fix-list', 't-subtotal', 't-total'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && (el.innerText || '').trim()) parts.push('[' + id + '] ' + el.innerText.replace(/\s+/g, ' ').trim());
    });
    return parts.join('\n').replace(/\u00a0/g, ' ');
  }

  function rows() {
    var r = [];
    [].slice.call(document.querySelectorAll('.tk-out .tk-row')).forEach(function (row) {
      var l = row.querySelector('.tk-row-label'), v = row.querySelector('.tk-row-value');
      r.push([l ? l.textContent.trim() : '', v ? v.textContent.trim() : '']);
    });
    return r;
  }

  function fields() {
    /* Business pages use .wrap.app rather than <main> or #tool-ui, so fall back
       to the page container instead of silently matching nothing. */
    var root = document.getElementById('tool-ui') ? '#tool-ui '
      : (document.querySelector('main') ? 'main '
      : (document.querySelector('.app') ? '.app '
      : '.wrap '));
    return [].slice.call(document.querySelectorAll(root + 'input, ' + root + 'textarea, ' + root + 'select'))
      .filter(function (el) {
        return el.type !== 'hidden' && el.type !== 'file';
      });
  }

  function makeFile(kind, name) {
    if (kind === 'png') {
      return new Promise(function (resolve) {
        var c = document.createElement('canvas');
        c.width = 40; c.height = 30;
        var g = c.getContext('2d');
        g.fillStyle = '#1d4ed8'; g.fillRect(0, 0, 40, 30);
        g.fillStyle = '#fff'; g.fillRect(5, 5, 10, 10);
        c.toBlob(function (b) { resolve(new File([b], name, { type: 'image/png' })); }, 'image/png');
      });
    }
    return window.ToolKit.pdfLib().then(function (PDFLib) {
      return PDFLib.PDFDocument.create().then(function (doc) {
        doc.addPage([200, 200]);
        doc.addPage([200, 200]);
        doc.addPage([200, 200]);
        return doc.save();
      });
    }).then(function (bytes) {
      return new File([bytes], name, { type: 'application/pdf' });
    });
  }

  function attach(id, files) {
    var el = document.getElementById(id);
    if (!el) return 'missing:' + id;
    var dt = new DataTransfer();
    files.forEach(function (f) { dt.items.add(f); });
    el.files = dt.files;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return 'ok';
  }

  function findBtn(text) {
    var all = [].slice.call(document.querySelectorAll('button, .btn, label.btn'));
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].textContent || '').trim().toLowerCase();
      if (t === String(text).toLowerCase()) return all[i];
    }
    return null;
  }

  function clickAll(labels, failures) {
    (labels || []).forEach(function (label) {
      var b = findBtn(label);
      if (b) b.click(); else failures.push('no button: ' + label);
    });
  }

  function nextPage(idx) {
    var list = window.__QA_LIST || [];
    idx = (idx || 0) + 1;
    sessionStorage.setItem('qa-func-i', String(idx));
    if (idx >= list.length) { document.title = 'FUNC COMPLETE'; return; }
    location.href = '/' + list[idx] + '?qa=1&f=1';
  }

  function start() {
    var spec = (window.__QA_SPEC || {})[ME.replace(/^en\//, '').replace(/\.html$/, '')];
    var idx = +(sessionStorage.getItem('qa-func-i') || 0);
    if (!spec) { nextPage(idx); return; }

    var rec = { page: ME, errors: [], scenarios: {}, at: Date.now() };
    var failures = [];
    window.addEventListener('error', function (e) { rec.errors.push(String(e.message)); });
    window.addEventListener('unhandledrejection', function (e) {
      rec.errors.push('rejection: ' + String((e.reason && e.reason.message) || e.reason));
    });
    var errFrom = 0, phase = 'boot';

    function snap(name) {
      rec.scenarios[name] = {
        out: outText(),
        rows: rows(),
        errors: rec.errors.slice(errFrom),
        failures: failures.slice()
      };
      errFrom = rec.errors.length;
      phase = name;
    }

    function post(one) {
      return fetch('/qa-func', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(one)
      }).catch(function () {});
    }

    // ---- 1. normal -------------------------------------------------------
    var chain = Promise.resolve();
    (spec.files || []).forEach(function (f) {
      chain = chain.then(function () {
        var many = f.many || 1, arr = [];
        var c2 = Promise.resolve();
        for (var i = 0; i < many; i++) {
          (function (i) {
            c2 = c2.then(function () {
              var nm = many > 1 ? f.name.replace(/(\.\w+)$/, '-' + (i + 1) + '$1') : f.name;
              return makeFile(f.kind, nm).then(function (file) { arr.push(file); });
            });
          })(i);
        }
        return c2.then(function () {
          var r = attach(f.id, arr);
          if (r !== 'ok') failures.push(r);
        });
      });
    });

    chain.then(function () {
      if (spec.selects) Object.keys(spec.selects).forEach(function (k) {
        var r = setVal(k, spec.selects[k]);
        if (r !== 'ok') failures.push(r);
      });
      if (spec.set) Object.keys(spec.set).forEach(function (k) {
        var r = setVal(k, spec.set[k]);
        if (r !== 'ok') failures.push(r);
      });
      return sleep(150);
    }).then(function () {
      clickAll(spec.click, failures);
      var steps = spec.steps || [];
      var sc = Promise.resolve();
      steps.forEach(function (st) {
        sc = sc.then(function () {
          if (st.set) Object.keys(st.set).forEach(function (k) { setVal(k, st.set[k]); });
          if (st.click) clickAll([st.click], failures);
          return sleep(st.wait || 300);
        });
      });
      return sc.then(function () { return sleep(spec.wait || 350); });
    })

    // ---- 2. empty --------------------------------------------------------
      .then(function () {
        snap('normal');
        fields().forEach(function (el) {
          if (el.tagName === 'SELECT') return;
          if (el.type === 'checkbox' || el.type === 'radio') { el.checked = false; }
          else el.value = '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        });
        return sleep(120);
      })
      .then(function () {
        clickAll(spec.click, failures);
        return sleep(400);
      })
      .then(function () { snap('empty'); })

    // ---- 3. hostile ------------------------------------------------------
      .then(function () {
        fields().forEach(function (el) {
          if (el.tagName === 'SELECT') {
            if (el.options.length > 1) {
              el.selectedIndex = el.options.length - 1;
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return;
          }
          if (el.type === 'checkbox' || el.type === 'radio') { el.checked = true; return; }
          if (el.type === 'number' || el.type === 'range') el.value = '-1e308';
          else if (el.type === 'date' || el.type === 'time' || el.type === 'month') el.value = '0001-01-01';
          else el.value = HOSTILE;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        });
        return sleep(150);
      })
      .then(function () {
        clickAll(spec.click, failures);
        return sleep(500);
      })
      .then(function () { snap('hostile'); })

    // ---- report ----------------------------------------------------------
      .then(function () {
        var keys = Object.keys(rec.scenarios);
        var seq = Promise.resolve();
        keys.forEach(function (k) {
          var one = {
            page: rec.page, scenario: k, at: rec.at,
            out: rec.scenarios[k].out, rows: rec.scenarios[k].rows,
            errors: rec.scenarios[k].errors, failures: rec.scenarios[k].failures
          };
          seq = seq.then(function () { return post(one); });
        });
        return seq;
      })
      .catch(function (e) {
        return post({
          page: rec.page, scenario: 'harness-error', at: rec.at,
          out: 'HARNESS: ' + (e && e.message), rows: [],
          errors: rec.errors, failures: failures
        });
      })
      .then(function () { nextPage(idx); });
  }

  function boot() {
    fetch('/qa-func.json').then(function (r) { return r.json(); }).then(function (spec) {
      window.__QA_SPEC = spec;
      return fetch('/qa-list.json').then(function (r) { return r.json(); });
    }).then(function (list) {
      window.__QA_LIST = list;
      if (/[?&]fresh=1/.test(location.search)) sessionStorage.setItem('qa-func-i', '0');
      if (document.readyState === 'complete') start();
      else window.addEventListener('load', function () { setTimeout(start, 300); });
    });
  }
  boot();
})();
