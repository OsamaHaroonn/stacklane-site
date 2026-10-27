/* ============================================================
   Invoice generator — no dependencies, no network calls.
   State autosaves to localStorage; nothing is uploaded.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'stacklane.invoice.v1';
  var body = document.getElementById('items-body');
  var currency = '$';

  function money(n) {
    var v = isFinite(n) ? n : 0;
    // Kill float dust and negative zero so we never render "$-0.00".
    if (Math.abs(v) < 0.005) v = 0;
    return currency + v.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function num(el) {
    var v = parseFloat(el.value);
    return isFinite(v) ? v : 0;
  }

  // Quantities and rates are never negative: -5 × -100 must not become +$500.
  function numPos(el) {
    return Math.max(0, num(el));
  }

  /* ---------- persistence ---------- */
  function fields() {
    var ids = ['from-name', 'from-contact', 'to-name', 'to-contact',
               'inv-number', 'inv-date', 'inv-due', 'notes', 'discount', 'tax'];
    var out = {};
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) out[id] = el.value;
    });
    return out;
  }

  function save() {
    var items = [].slice.call(body.querySelectorAll('tr')).map(function (tr) {
      return {
        desc: tr.querySelector('.i-desc').value,
        qty: tr.querySelector('.i-qty').value,
        rate: tr.querySelector('.i-rate').value
      };
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        fields: fields(),
        items: items,
        savedAt: Date.now()
      }));
    } catch (e) { /* private mode: run without persistence */ }
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return false; }
    if (!raw) return false;
    try {
      var data = JSON.parse(raw);

      // Drafts hold client names, emails and prices. Expire them after 7 days
      // so a shared or unattended machine doesn't keep them indefinitely.
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

  function recalc() {
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

    document.getElementById('t-subtotal').textContent = money(subtotal);
    document.getElementById('t-total').textContent = money(taxable + tax);
    save();
  }

  function addRow(item) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td data-label="Description"><input class="i-desc" type="text" aria-label="Line description" placeholder="e.g. Replace kitchen tap"></td>' +
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

  /* ---------- defaults ---------- */
  function seedDefaults() {
    var today = new Date();
    var due = new Date(today.getTime() + 14 * 86400000);
    var iso = function (d) { return d.toISOString().slice(0, 10); };

    document.getElementById('inv-date').value = iso(today);
    document.getElementById('inv-due').value = iso(due);
    document.getElementById('inv-number').value = 'INV-' +
      String(Math.floor(Math.random() * 900) + 100);
    addRow({ desc: '', qty: 1, rate: 0 });
  }

  /* ---------- wire up ---------- */
  document.getElementById('add-item').addEventListener('click', function () {
    addRow();
    var rows = body.querySelectorAll('tr');
    rows[rows.length - 1].querySelector('.i-desc').focus();
    recalc();
  });

  document.getElementById('reset-all').addEventListener('click', function () {
    if (!confirm('Clear this invoice and start again?')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    location.reload();
  });

  document.getElementById('print-btn').addEventListener('click', function () {
    window.print();
  });

  // Live recalculation on any input inside the invoice.
  document.addEventListener('input', function (e) {
    if (e.target.closest('#items-table') ||
        ['discount', 'tax'].indexOf(e.target.id) !== -1) {
      recalc();
    } else if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      save();
    }
  });

  document.getElementById('year').textContent = new Date().getFullYear();

  // Load a saved draft, or seed a sensible blank one.
  if (!load()) seedDefaults();
  recalc();
})();
