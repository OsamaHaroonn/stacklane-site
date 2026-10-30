/* ============================================================
   UUID generator — version 4 identifiers from
   crypto.randomUUID(), with a getRandomValues fallback built by
   hand so the version and variant bits are still set correctly.

   128 bits of which 122 are random: the 13th hex digit is the
   version (4) and the 17th is one of 8, 9, a or b (the variant).
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_COUNT = 100;

  function hasCrypto() {
    return typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function';
  }

  function hex16() {
    var b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40; // version 4
    b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
    var s = [];
    for (var i = 0; i < 16; i++) s.push((b[i] + 0x100).toString(16).substr(1));
    var h = s.join('');
    return h.substr(0, 8) + '-' + h.substr(8, 4) + '-' + h.substr(12, 4) +
      '-' + h.substr(16, 4) + '-' + h.substr(20, 12);
  }

  function makeOne() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (hasCrypto()) return hex16();
    return null;
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var count = TK.field({ id: 'uuid-count', label: ui('count'), type: 'text', inputmode: 'numeric', value: '1' });
    var upper = TK.checkbox({ id: 'uuid-upper', label: ui('upper'), onChange: generate });

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(count.row);

    var output = TK.textarea({ id: 'uuid-out', label: ui('output'), rows: 6 });
    output.textarea.setAttribute('readonly', '');
    output.row.hidden = true;

    function parseCount() {
      var raw = String(count.input.value).trim();
      if (raw === '') return NaN;
      if (!/^\d+$/.test(raw)) return NaN;
      return parseInt(raw, 10);
    }

    function generate() {
      var n = parseCount();

      if (isNaN(n)) {
        output.row.hidden = true; out.render([]);
        var raw = String(count.input.value).trim();
        box.show(raw === '' ? ui('empty') : ui('partial'), 'warn');
        return;
      }
      if (n < 1) { output.row.hidden = true; out.render([]); box.show(ui('countLow'), 'error'); return; }
      if (n > MAX_COUNT) { output.row.hidden = true; out.render([]); box.show(ui('countHigh'), 'error'); return; }
      if (!hasCrypto()) { output.row.hidden = true; out.render([]); box.show(ui('noCrypto'), 'error'); return; }

      var values = [];
      for (var i = 0; i < n; i++) {
        var v = makeOne();
        if (!v) { output.row.hidden = true; out.render([]); box.show(ui('noCrypto'), 'error'); return; }
        values.push(upper.input.checked ? v.toUpperCase() : v);
      }

      output.textarea.value = values.join('\n');
      output.row.hidden = false;
      out.render([
        [ui('version'), ui('versionValue'), 'is-strong'],
        [ui('variant'), ui('variantValue')],
        [ui('generated'), TK.num(n, 0)],
        [ui('source'), ui('crypto')]
      ]);
      box.show(ui('note'), '');
    }

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(ui('generate'), generate));
    actions.appendChild(TK.btn(ui('copy'), function () {
      if (!output.textarea.value) { box.show(ui('empty'), 'warn'); return; }
      TK.copy(output.textarea.value, function (ok) {
        box.show(ok ? ui('copied') : ui('copyFail'), ok ? '' : 'error');
      });
    }, { secondary: true }));
    actions.appendChild(TK.btn(common('clear'), function () {
      count.input.value = '';
      upper.input.checked = false;
      output.row.hidden = true;
      out.render([]);
      box.show(ui('empty'), 'warn');
    }, { secondary: true }));

    host.appendChild(grid);
    host.appendChild(upper.row);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(output.row);
    host.appendChild(out);

    count.input.addEventListener('input', generate);

    generate();
  }

  return { mount: mount };
})();
