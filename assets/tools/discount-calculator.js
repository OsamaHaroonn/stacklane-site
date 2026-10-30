/* ============================================================
   Discount calculator — price, percentage off, optional second
   percentage. Two successive discounts do not add up: 20% then 10%
   is 28% off, not 30%.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var price = TK.field({ id: 'disc-price', label: ui('price'), type: 'text', inputmode: 'decimal' });
    var first = TK.field({ id: 'disc-first', label: ui('first'), type: 'text', inputmode: 'decimal' });
    var second = TK.field({ id: 'disc-second', label: ui('second'), type: 'text', inputmode: 'decimal' });

    var grid = TK.el('div', { class: 'tk-grid' });
    [price, first, second].forEach(function (f) { grid.appendChild(f.row); });

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(common('clear'), function () {
      price.input.value = '';
      first.input.value = '';
      second.input.value = '';
      render();
    }, { secondary: true }));

    host.appendChild(grid);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    [price, first, second].forEach(function (f) { f.input.addEventListener('input', render); });

    function parse(f) {
      var raw = String(f.input.value).trim().replace(/\s/g, '').replace(/,/g, '');
      if (raw === '') return NaN;
      if (!/^-?\d*\.?\d+$/.test(raw)) return NaN;
      return parseFloat(raw);
    }

    function render() {
      var p = parse(price), a = parse(first);
      var b = second.input.value.trim() === '' ? 0 : parse(second);

      if (isNaN(p) && isNaN(a)) { out.render([]); box.show(ui('empty'), 'warn'); return; }
      if (isNaN(p) || isNaN(a) || isNaN(b)) { out.render([]); box.show(ui('partial'), 'warn'); return; }
      if (p <= 0) { out.render([]); box.show(ui('priceLow'), 'error'); return; }
      if (a < 0 || b < 0) { out.render([]); box.show(ui('negPercent'), 'error'); return; }
      if (a > 100 || b > 100) { out.render([]); box.show(ui('over100'), 'error'); return; }

      var afterFirst = p * (1 - a / 100);
      var finalPrice = afterFirst * (1 - b / 100);
      var saved = p - finalPrice;
      var effective = p > 0 ? (saved / p) * 100 : 0;

      var pairs = [
        [ui('final'), TK.num(finalPrice, 2), 'is-strong'],
        [ui('saved'), TK.num(saved, 2)],
        [ui('effective'), TK.num(effective, 2) + '%'],
        [ui('working'), TK.num(p, 2) + ' × (1 − ' + TK.num(a, 4) + '%)' +
          (b ? ' × (1 − ' + TK.num(b, 4) + '%)' : '') + ' = ' + TK.num(finalPrice, 2)]
      ];
      if (b) pairs.push([ui('notAdditive'), TK.num(a + b, 2) + '% ≠ ' + TK.num(effective, 2) + '%']);

      out.render(pairs);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
