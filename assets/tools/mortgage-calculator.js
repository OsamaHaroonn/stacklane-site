/* ============================================================
   Mortgage calculator — price, down payment, fixed rate, term.

   loan = price − down payment
   M    = loan * i / (1 − (1 + i)^−n),  i = rate / 100 / 12, n = months

   Principal and interest only: property tax, insurance, fees and any
   change in the rate are outside this calculation.
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

    var price = TK.field({ id: 'mort-price', label: ui('price'), type: 'text', inputmode: 'decimal' });
    var down = TK.field({ id: 'mort-down', label: ui('down'), type: 'text', inputmode: 'decimal' });
    var rate = TK.field({ id: 'mort-rate', label: ui('rate'), type: 'text', inputmode: 'decimal' });
    var years = TK.field({ id: 'mort-years', label: ui('years'), type: 'text', inputmode: 'decimal', value: '30' });

    var grid = TK.el('div', { class: 'tk-grid' });
    [price, down, rate, years].forEach(function (f) { grid.appendChild(f.row); });

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(common('clear'), function () {
      price.input.value = '';
      down.input.value = '';
      rate.input.value = '';
      years.input.value = '30';
      render();
    }, { secondary: true }));

    host.appendChild(grid);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    [price, down, rate, years].forEach(function (f) { f.input.addEventListener('input', render); });

    function parse(f) {
      var raw = String(f.input.value).trim().replace(/\s/g, '').replace(/,/g, '');
      if (raw === '') return NaN;
      if (!/^-?\d*\.?\d+$/.test(raw)) return NaN;
      return parseFloat(raw);
    }

    function money(n) { return TK.num(n, 2); }

    function render() {
      var pr = parse(price);
      var dn = down.input.value.trim() === '' ? 0 : parse(down);
      var r = parse(rate);
      var y = parse(years);

      if (isNaN(pr) && isNaN(r)) { out.render([]); box.show(ui('empty'), 'warn'); return; }
      if (isNaN(pr) || isNaN(dn) || isNaN(r) || isNaN(y)) {
        out.render([]); box.show(ui('partial'), 'warn'); return;
      }
      if (pr <= 0) { out.render([]); box.show(ui('priceLow'), 'error'); return; }
      if (dn < 0) { out.render([]); box.show(ui('downLow'), 'error'); return; }
      if (dn >= pr) { out.render([]); box.show(ui('downTooHigh'), 'error'); return; }
      if (r < 0) { out.render([]); box.show(ui('rateLow'), 'error'); return; }
      if (y <= 0) { out.render([]); box.show(ui('yearsLow'), 'error'); return; }
      if (y > 50) { out.render([]); box.show(ui('yearsHigh'), 'error'); return; }

      var loan = pr - dn;
      var n = Math.round(y * 12);
      var i = r / 100 / 12;
      var monthly = i === 0 ? loan / n : loan * i / (1 - Math.pow(1 + i, -n));
      var totalPaid = monthly * n;
      var interest = totalPaid - loan;
      var upfront = pr > 0 ? (dn / pr) * 100 : 0;

      if (!isFinite(monthly) || !isFinite(totalPaid)) {
        out.render([]); box.show(ui('tooBig'), 'error'); return;
      }

      out.render([
        [ui('monthly'), money(monthly), 'is-strong'],
        [ui('loan'), money(loan)],
        [ui('downPct'), TK.num(upfront, 1) + '%'],
        [ui('payments'), TK.num(n, 0) + ' ' + ui('months')],
        [ui('interest'), money(interest)],
        [ui('totalCost'), money(dn + totalPaid)],
        [ui('working'), i === 0
          ? money(loan) + ' ÷ ' + TK.num(n, 0)
          : money(loan) + ' × ' + (i * 100).toFixed(4) + '% ÷ (1 − (1 + ' +
            (i * 100).toFixed(4) + '%)⁻' + TK.num(n, 0) + ')']
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
