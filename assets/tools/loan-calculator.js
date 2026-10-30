/* ============================================================
   Loan calculator — fixed-rate amortising loan, monthly payments.

   M = P * i / (1 - (1 + i)^-n)
     P = amount borrowed, i = annual rate / 100 / 12, n = months.

   The rate is fixed for the whole term and every payment is made on
   time; nothing here accounts for fees, insurance or early repayment.
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

    var amount = TK.field({ id: 'loan-amount', label: ui('amount'), type: 'text', inputmode: 'decimal' });
    var rate = TK.field({ id: 'loan-rate', label: ui('rate'), type: 'text', inputmode: 'decimal' });
    var years = TK.field({ id: 'loan-years', label: ui('years'), type: 'text', inputmode: 'decimal' });

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(amount.row);
    grid.appendChild(rate.row);
    grid.appendChild(years.row);

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(common('clear'), function () {
      amount.input.value = '';
      rate.input.value = '';
      years.input.value = '';
      render();
    }, { secondary: true }));

    host.appendChild(grid);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    [amount, rate, years].forEach(function (f) { f.input.addEventListener('input', render); });

    function parse(f) {
      var raw = String(f.input.value).trim().replace(/\s/g, '').replace(/,/g, '');
      if (raw === '') return NaN;
      if (!/^-?\d*\.?\d+$/.test(raw)) return NaN;
      return parseFloat(raw);
    }

    function money(n) { return TK.num(n, 2); }

    function render() {
      var p = parse(amount), r = parse(rate), y = parse(years);

      if (isNaN(p) && isNaN(r) && isNaN(y)) {
        out.render([]);
        box.show(ui('empty'), 'warn');
        return;
      }
      if (isNaN(p) || isNaN(r) || isNaN(y)) {
        out.render([]);
        box.show(ui('partial'), 'warn');
        return;
      }
      if (p <= 0) { out.render([]); box.show(ui('amountLow'), 'error'); return; }
      if (r < 0) { out.render([]); box.show(ui('rateLow'), 'error'); return; }
      if (y <= 0) { out.render([]); box.show(ui('yearsLow'), 'error'); return; }
      if (y > 50) { out.render([]); box.show(ui('yearsHigh'), 'error'); return; }

      var n = Math.round(y * 12);
      var i = r / 100 / 12;
      var monthly = i === 0 ? p / n : p * i / (1 - Math.pow(1 + i, -n));
      var total = monthly * n;
      var interest = total - p;

      if (!isFinite(monthly) || !isFinite(total)) {
        out.render([]);
        box.show(ui('tooBig'), 'error');
        return;
      }

      out.render([
        [ui('monthly'), money(monthly), 'is-strong'],
        [ui('payments'), TK.num(n, 0) + ' ' + ui('months')],
        [ui('total'), money(total)],
        [ui('interest'), money(interest)],
        [ui('working'), i === 0
          ? money(p) + ' ÷ ' + TK.num(n, 0)
          : money(p) + ' × ' + (i * 100).toFixed(4) + '% ÷ (1 − (1 + ' +
            (i * 100).toFixed(4) + '%)⁻' + TK.num(n, 0) + ')']
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
