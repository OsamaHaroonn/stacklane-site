/* ============================================================
   Random number — uniform integers from the browser's own
   cryptographic random source (crypto.getRandomValues).

   Values below 2^32 use exact rejection sampling, so no result
   is favoured; larger ranges fall back to a 53-bit draw. The
   numbers are produced in this tab and never leave it.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_COUNT = 1000;
  var LIMIT32 = 4294967296; // 2^32

  function hasCrypto() {
    return typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function';
  }

  function randBelow(limit) {
    if (limit <= 1) return 0;
    var buf = new Uint32Array(1);

    if (limit <= LIMIT32) {
      // rejection sampling: discard the top part of the 32-bit space
      var zone = Math.floor(LIMIT32 / limit) * limit;
      var x;
      do {
        crypto.getRandomValues(buf);
        x = buf[0];
      } while (x >= zone);
      return x % limit;
    }

    // 53 bits of randomness scaled into [0, limit)
    var wide = new Uint32Array(2);
    crypto.getRandomValues(wide);
    var hi = wide[0] >>> 5;                 // 27 bits
    var lo = wide[1] >>> 6;                 // 26 bits
    var r = (hi * 67108864 + lo) / 9007199254740992; // 2^53
    var v = Math.floor(r * limit);
    return v >= limit ? limit - 1 : v;
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var min = TK.field({ id: 'rnd-min', label: ui('min'), type: 'text', inputmode: 'numeric', value: '1' });
    var max = TK.field({ id: 'rnd-max', label: ui('max'), type: 'text', inputmode: 'numeric', value: '100' });
    var count = TK.field({ id: 'rnd-count', label: ui('count'), type: 'text', inputmode: 'numeric', value: '1' });

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(min.row);
    grid.appendChild(max.row);
    grid.appendChild(count.row);

    var output = TK.textarea({ id: 'rnd-out', label: ui('output'), rows: 6 });
    output.textarea.setAttribute('readonly', '');
    output.row.hidden = true;

    function parse(f) {
      var raw = String(f.input.value).trim().replace(/\s/g, '').replace(/,/g, '');
      if (raw === '') return NaN;
      if (!/^-?\d+$/.test(raw)) return NaN;
      return parseInt(raw, 10);
    }

    function generate() {
      var lo = parse(min), hi = parse(max), n = parse(count);

      if (isNaN(lo) && isNaN(hi) && isNaN(n)) {
        output.row.hidden = true; out.render([]);
        box.show(ui('empty'), 'warn'); return;
      }
      if (isNaN(lo) || isNaN(hi) || isNaN(n)) {
        output.row.hidden = true; out.render([]);
        box.show(ui('partial'), 'warn'); return;
      }
      if (lo > hi) { output.row.hidden = true; out.render([]); box.show(ui('order'), 'error'); return; }
      if (n < 1) { output.row.hidden = true; out.render([]); box.show(ui('countLow'), 'error'); return; }
      if (n > MAX_COUNT) { output.row.hidden = true; out.render([]); box.show(ui('countHigh'), 'error'); return; }
      if (!isFinite(hi - lo) || hi - lo > Number.MAX_SAFE_INTEGER - 1) {
        output.row.hidden = true; out.render([]); box.show(ui('rangeWide'), 'error'); return;
      }
      if (!hasCrypto()) { output.row.hidden = true; out.render([]); box.show(ui('noCrypto'), 'error'); return; }

      var span = hi - lo + 1;
      var values = [];
      for (var k = 0; k < n; k++) values.push(lo + randBelow(span));

      output.textarea.value = values.join(', ');
      output.row.hidden = false;
      out.render([
        [ui('range'), lo + ' … ' + hi, 'is-strong'],
        [ui('drawn'), TK.num(n, 0)],
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
      min.input.value = '';
      max.input.value = '';
      count.input.value = '';
      output.row.hidden = true;
      out.render([]);
      box.show(ui('empty'), 'warn');
    }, { secondary: true }));

    host.appendChild(grid);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(output.row);
    host.appendChild(out);

    [min, max, count].forEach(function (f) { f.input.addEventListener('input', generate); });

    generate();
  }

  return { mount: mount };
})();
