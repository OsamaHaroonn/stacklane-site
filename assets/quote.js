/* ============================================================
   Quote builder — fixed-price quotes, deposit, validity, print.
   Pure client-side; draft autosaves to localStorage for 7 days
   (same rule as the invoice tool: drafts hold names and prices).
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'stacklane.quote.v1';
  var SEQ_KEY = 'stacklane.quoteseq.v1';
  var body = document.getElementById('items-body');
  var currency = '$';

  function readCurrency() {
    var el = document.getElementById('currency');
    var v = el && el.value ? el.value : '$';
    currency = v.length > 1 ? v + ' ' : v;
  }

  function money(n) {
    var v = isFinite(n) ? n : 0;
    if (Math.abs(v) < 0.005) v = 0;
    return currency + v.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function num(el) {
    var v = el ? parseFloat(el.value) : NaN;
    return isFinite(v) ? v : 0;
  }

  function numPos(el) { return Math.max(0, num(el)); }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ---------- persistence ---------- */
  function fields() {
    var ids = ['from-name', 'from-contact', 'to-name', 'to-contact', 'proj-title',
               'proj-scope', 'valid-days', 'deposit', 'quote-ref', 'notes',
               'discount', 'tax', 'currency'];
    var out = {};
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) out[id] = el.value;
    });
    return out;
  }

  function items() {
    return [].slice.call(body.querySelectorAll('tr')).map(function (tr) {
      return {
        desc: tr.querySelector('.i-desc').value,
        qty: tr.querySelector('.i-qty').value,
        rate: tr.querySelector('.i-rate').value
      };
    });
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        fields: fields(), items: items(), savedAt: Date.now()
      }));
    } catch (e) { /* private mode: run without persistence */ }
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return false; }
    if (!raw) return false;
    try {
      var data = JSON.parse(raw);
      var age = Date.now() - (data.savedAt || 0);
      if (data.savedAt && (age < 0 || age > 7 * 86400000)) {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }
      Object.keys(data.fields || {}).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = data.fields[id];
      });
      (data.items || []).forEach(addRow);
      return (data.items || []).length > 0 || Object.keys(data.fields || {}).length > 0;
    } catch (e) { return false; }
  }

  /* ---------- rows & maths ---------- */
  function rowAmount(tr) {
    return numPos(tr.querySelector('.i-qty')) * numPos(tr.querySelector('.i-rate'));
  }

  function state() {
    var subtotal = 0;
    [].forEach.call(body.querySelectorAll('tr'), function (tr) {
      var amount = rowAmount(tr);
      tr.querySelector('.amount-cell').textContent = money(amount);
      subtotal += amount;
    });

    var discountPct = num(document.getElementById('discount'));
    var taxPct = num(document.getElementById('tax'));
    var discount = subtotal * (Math.min(Math.max(discountPct, 0), 100) / 100);
    var taxable = subtotal - discount;
    var tax = taxable * (Math.max(taxPct, 0) / 100);
    var total = taxable + tax;

    var depositPct = Math.min(Math.max(num(document.getElementById('deposit')), 0), 100);
    var deposit = total * (depositPct / 100);

    return {
      subtotal: subtotal, discount: discount, tax: tax, total: total,
      depositPct: depositPct, deposit: deposit, balance: total - deposit
    };
  }

  function validUntil() {
    var days = Math.min(Math.max(parseInt(document.getElementById('valid-days').value, 10) || 14, 1), 365);
    var d = new Date(Date.now() + days * 86400000);
    return d;
  }

  function isoDate(d) { return d.toISOString().slice(0, 10); }

  function recalc() {
    var s = state();
    setText('t-subtotal', money(s.subtotal));
    setText('t-total', money(s.total));
    setText('t-deposit', money(s.deposit) + (s.depositPct > 0 ? ' (' + s.depositPct + '%)' : ''));
    setText('t-balance', money(s.balance));
    setText('t-valid', isoDate(validUntil()));

    var verdict = document.getElementById('quote-verdict');
    if (s.total <= 0) {
      if (verdict) verdict.textContent = 'Add line items to see the numbers.';
    } else if (s.depositPct > 0) {
      if (verdict) verdict.innerHTML = 'Fixed price: <strong>' + money(s.total) +
        '</strong> — ' + money(s.deposit) + ' to start, ' + money(s.balance) +
        ' on delivery. Valid until ' + isoDate(validUntil()) + '.';
    } else {
      if (verdict) verdict.innerHTML = 'Fixed price: <strong>' + money(s.total) +
        '</strong>, no deposit. Valid until ' + isoDate(validUntil()) + '.';
    }
    save();
  }

  function addRow(item) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td data-label="Description"><input class="i-desc" type="text" aria-label="Line description" placeholder="e.g. Design and build a 5-page site"></td>' +
      '<td data-label="Qty"><input class="i-qty num" type="number" inputmode="decimal" min="0" step="0.25" value="1" aria-label="Quantity" style="text-align:right"></td>' +
      '<td data-label="Rate"><input class="i-rate num" type="number" inputmode="decimal" min="0" step="0.01" value="0" aria-label="Rate" style="text-align:right"></td>' +
      '<td class="amount-cell" data-label="Amount">$0.00</td>' +
      '<td class="no-print"><button class="icon-btn" type="button" title="Remove line" aria-label="Remove line item">✕</button></td>';

    tr.querySelector('button').addEventListener('click', function () {
      tr.remove();
      if (!body.querySelector('tr')) addRow();
      recalc();
    });

    if (typeof item === 'object') {
      tr.querySelector('.i-desc').value = item.desc || '';
      tr.querySelector('.i-qty').value = item.qty || 1;
      tr.querySelector('.i-rate').value = item.rate || 0;
    }

    body.appendChild(tr);
    return tr;
  }

  /* ---------- text versions ---------- */
  function asText() {
    var s = state();
    var f = fields();
    var lines = [];
    lines.push('QUOTE ' + (f['quote-ref'] || '') + ' — ' + (f['proj-title'] || 'Project'));
    lines.push('From: ' + (f['from-name'] || '') + (f['from-contact'] ? ' · ' + f['from-contact'] : ''));
    lines.push('For: ' + (f['to-name'] || ''));
    lines.push('Date: ' + isoDate(new Date()) + ' · Valid until: ' + isoDate(validUntil()));
    lines.push('');
    if (f['proj-scope']) {
      lines.push('SCOPE');
      lines.push(f['proj-scope']);
      lines.push('');
    }
    lines.push('ITEMS');
    [].slice.call(body.querySelectorAll('tr')).forEach(function (tr) {
      var d = tr.querySelector('.i-desc').value;
      var a = tr.querySelector('.amount-cell').textContent;
      if (!d && a === money(0)) return;
      lines.push('  ' + a + ' — ' + d + ' (' + tr.querySelector('.i-qty').value + ' × ' +
        tr.querySelector('.i-rate').value + ')');
    });
    lines.push('');
    lines.push('Subtotal: ' + money(s.subtotal));
    if (s.discount > 0) lines.push('Discount: -' + money(s.discount));
    if (s.tax > 0) lines.push('Tax: +' + money(s.tax));
    lines.push('TOTAL (fixed): ' + money(s.total));
    if (s.depositPct > 0) {
      lines.push('Deposit to start (' + s.depositPct + '%): ' + money(s.deposit));
      lines.push('Balance on delivery: ' + money(s.balance));
    }
    if (f.notes) { lines.push(''); lines.push(f.notes); }
    return lines.join('\n');
  }

  function say(msg) {
    var el = document.getElementById('send-status');
    if (el) el.textContent = msg;
  }

  /* ---------- wire up ---------- */
  document.getElementById('add-item').addEventListener('click', function () {
    addRow();
    var rows = body.querySelectorAll('tr');
    rows[rows.length - 1].querySelector('.i-desc').focus();
    recalc();
  });

  document.getElementById('reset-all').addEventListener('click', function () {
    if (!confirm('Clear this quote and start again?')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    location.reload();
  });

  document.getElementById('print-btn').addEventListener('click', function () {
    window.print();
  });

  document.getElementById('email-btn').addEventListener('click', function () {
    var f = fields();
    var to = (f['to-contact'] || '').indexOf('@') !== -1 ? f['to-contact'] : '';
    var subject = 'Quote ' + (f['quote-ref'] ? f['quote-ref'] + ' — ' : '') +
      (f['proj-title'] || 'project');
    window.location.href = 'mailto:' + to +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(asText());
    say('Opening your email app with the quote in the body.');
  });

  document.getElementById('copy-btn').addEventListener('click', function () {
    var text = asText();
    function done(ok) {
      say(ok ? 'Quote copied — paste it into any message.' :
        'Automatic copy was blocked. Use Print → Save as PDF instead.');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else {
      done(false);
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.closest('#items-table') ||
        ['discount', 'tax', 'deposit'].indexOf(e.target.id) !== -1) {
      recalc();
    } else if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      save();
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'valid-days') recalc();
    if (e.target.id === 'currency') { readCurrency(); recalc(); }
  });

  document.getElementById('year').textContent = new Date().getFullYear();

  // Sequential reference numbers (Q-1001, Q-1002 …) like the invoice tool.
  function nextRef() {
    var seq = 1001;
    try {
      var raw = localStorage.getItem(SEQ_KEY);
      if (raw && isFinite(parseInt(raw, 10))) seq = Math.max(1001, parseInt(raw, 10));
      localStorage.setItem(SEQ_KEY, String(seq + 1));
    } catch (e) { /* private mode */ }
    return 'Q-' + seq;
  }

  function seed() {
    document.getElementById('quote-ref').value = nextRef();
    addRow({ desc: '', qty: 1, rate: 0 });
  }

  if (!load()) seed();
  readCurrency();
  recalc();
})();