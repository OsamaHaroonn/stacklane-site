/* ============================================================
   Invoice generator — no dependencies, no network calls.
   State autosaves to localStorage; nothing is uploaded.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'stacklane.invoice.v1';
  var INVOICES_KEY = 'stacklane.invoices.v1';
  var SEQ_KEY = 'stacklane.invseq.v1';
  var body = document.getElementById('items-body');
  var currency = '$';

  /* Currency: symbols render as a prefix ("$12.00"), alphabetic
     codes with a space ("EGP 12.00") so no CJK/RTL glyph ever
     ends up glued to the first digit. */
  function readCurrency() {
    var el = document.getElementById('currency');
    var v = el && el.value ? el.value : '$';
    currency = v.length > 1 ? v + ' ' : v;
  }

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
               'inv-number', 'inv-date', 'inv-due', 'notes', 'discount', 'tax',
               'currency'];
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
  // Sequential numbers, not random: INV-1001, INV-1002 … Clients and
  // accountants expect an unbroken sequence, and random gaps look like
  // missing invoices.
  function nextNumber() {
    var seq = 1001;
    try {
      var raw = localStorage.getItem(SEQ_KEY);
      if (raw && isFinite(parseInt(raw, 10))) seq = Math.max(1001, parseInt(raw, 10));
      localStorage.setItem(SEQ_KEY, String(seq + 1));
    } catch (e) { /* private mode: fall back to 1001 each time */ }
    return 'INV-' + seq;
  }

  function seedDefaults() {
    var today = new Date();
    var due = new Date(today.getTime() + 14 * 86400000);
    var iso = function (d) { return d.toISOString().slice(0, 10); };

    document.getElementById('inv-date').value = iso(today);
    document.getElementById('inv-due').value = iso(due);
    document.getElementById('inv-number').value = nextNumber();
    addRow({ desc: '', qty: 1, rate: 0 });
  }

  /* ---------- saved invoices (local archive) ---------- */
  function savedInvoices() {
    try {
      var a = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }

  function writeInvoices(list) {
    try { localStorage.setItem(INVOICES_KEY, JSON.stringify(list.slice(0, 30))); }
    catch (e) { /* private mode */ }
  }

  function snapshot() {
    var items = [].slice.call(body.querySelectorAll('tr')).map(function (tr) {
      return {
        desc: tr.querySelector('.i-desc').value,
        qty: tr.querySelector('.i-qty').value,
        rate: tr.querySelector('.i-rate').value
      };
    });
    return {
      id: 'x' + Date.now(),
      number: document.getElementById('inv-number').value,
      client: document.getElementById('to-name').value,
      total: document.getElementById('t-total').textContent,
      at: Date.now(),
      fields: fields(),
      items: items
    };
  }

  function saveStatus(msg) {
    var el = document.getElementById('save-status');
    if (el) el.textContent = msg;
  }

  function refreshList(selectedId) {
    var sel = document.getElementById('inv-list');
    if (!sel) return;
    var list = savedInvoices();
    sel.innerHTML = '';
    if (!list.length) {
      var o = document.createElement('option');
      o.textContent = 'Nothing saved yet';
      o.value = '';
      sel.appendChild(o);
      return;
    }
    list.forEach(function (inv) {
      var o = document.createElement('option');
      var d = new Date(inv.at);
      o.value = inv.id;
      o.textContent = (inv.number || 'Invoice') +
        ' · ' + (inv.client || 'no client') +
        ' · ' + (inv.total || '') +
        ' · ' + d.toISOString().slice(0, 10);
      if (inv.id === selectedId) o.selected = true;
      sel.appendChild(o);
    });
  }

  function applySnapshot(data) {
    Object.keys(data.fields || {}).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = data.fields[id];
    });
    body.innerHTML = '';
    (data.items || []).forEach(addRow);
    if (!body.querySelector('tr')) addRow();
    readCurrency();
    recalc();
  }

  function wireArchive() {
    var saveBtn = document.getElementById('save-inv');
    var loadBtn = document.getElementById('load-inv');
    var delBtn = document.getElementById('del-inv');
    var emailBtn = document.getElementById('email-inv');
    var sel = document.getElementById('inv-list');
    if (!saveBtn || !sel) return;

    saveBtn.addEventListener('click', function () {
      var snap = snapshot();
      if (!snap.number && !snap.client) {
        saveStatus('Give the invoice a number or a client name first.');
        return;
      }
      var list = savedInvoices();
      list.unshift(snap);
      writeInvoices(list);
      refreshList(snap.id);
      saveStatus('Saved "' + (snap.number || 'invoice') + '" in this browser.');
    });

    loadBtn.addEventListener('click', function () {
      if (!sel.value) { saveStatus('Select an invoice to load.'); return; }
      var found = savedInvoices().filter(function (i) { return i.id === sel.value; })[0];
      if (!found) { saveStatus('That invoice is no longer stored.'); refreshList(); return; }
      applySnapshot(found);
      saveStatus('Loaded ' + (found.number || 'invoice') + '.');
    });

    delBtn.addEventListener('click', function () {
      if (!sel.value) { saveStatus('Select an invoice to delete.'); return; }
      var list = savedInvoices().filter(function (i) { return i.id !== sel.value; });
      writeInvoices(list);
      refreshList();
      saveStatus('Deleted.');
    });

    if (emailBtn) {
      emailBtn.addEventListener('click', function () {
        var subject = 'Invoice ' + (document.getElementById('inv-number').value || '') +
          (document.getElementById('to-name').value
            ? ' for ' + document.getElementById('to-name').value : '');
        var lines = [
          'From: ' + (document.getElementById('from-name').value || ''),
          document.getElementById('from-contact').value || '',
          '',
          'Bill to: ' + (document.getElementById('to-name').value || ''),
          document.getElementById('to-contact').value || '',
          '',
          'Number: ' + (document.getElementById('inv-number').value || ''),
          'Issued: ' + (document.getElementById('inv-date').value || ''),
          'Due: ' + (document.getElementById('inv-due').value || ''),
          ''
        ];
        [].slice.call(body.querySelectorAll('tr')).forEach(function (tr) {
          var d = tr.querySelector('.i-desc').value;
          if (!d && !tr.querySelector('.i-rate').value) return;
          lines.push(tr.querySelector('.i-qty').value + ' x ' +
            tr.querySelector('.i-rate').value + ' = ' +
            tr.querySelector('.amount-cell').textContent + ' — ' + d);
        });
        lines.push('', 'Subtotal: ' + document.getElementById('t-subtotal').textContent);
        lines.push('Total due: ' + document.getElementById('t-total').textContent);
        if (document.getElementById('notes').value)
          lines.push('', document.getElementById('notes').value);
        var mail = (document.getElementById('to-contact').value || '').indexOf('@') !== -1
          ? document.getElementById('to-contact').value : '';
        window.location.href = 'mailto:' + mail +
          '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(lines.join('\n'));
      });
    }

    refreshList();
  }

  /* ---------- wire up ---------- */
  document.getElementById('add-item').addEventListener('click', function () {
    addRow();
    var rows = body.querySelectorAll('tr');
    rows[rows.length - 1].querySelector('.i-desc').focus();
    recalc();
  });

  document.getElementById('reset-all').addEventListener('click', function () {
    if (!confirm('Clear this invoice and start a fresh one? Saved invoices are kept.')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    location.reload();
  });

  var currencyEl = document.getElementById('currency');
  if (currencyEl) {
    currencyEl.addEventListener('change', function () {
      readCurrency();
      recalc();
    });
  }

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
  readCurrency();
  if (!load()) seedDefaults();
  readCurrency();
  recalc();
  wireArchive();
})();
