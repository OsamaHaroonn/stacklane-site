/* ============================================================
   VAT calculator — the rate is typed in by the user, because no
   single rate applies everywhere.

   Adding VAT:     net   = amount, vat = amount × rate / 100
   Removing VAT:   gross = amount, net = amount / (1 + rate / 100)
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

    var amount = TK.field({ id: 'vat-amount', label: ui('amount'), type: 'text', inputmode: 'decimal' });
    var rate = TK.field({ id: 'vat-rate', label: ui('rate'), type: 'text', inputmode: 'decimal' });

    var mode = TK.select({
      id: 'vat-mode',
      label: ui('mode'),
      value: 'add',
      options: [
        { value: 'add', label: ui('add') },
        { value: 'remove', label: ui('remove') }
      ]
    });

    var grid = TK.el('div', { class: 'tk-grid' });
    [amount, rate, mode].forEach(function (f) { grid.appendChild(f.row); });

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(common('clear'), function () {
      amount.input.value = '';
      rate.input.value = '';
      render();
    }, { secondary: true }));

    host.appendChild(grid);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    amount.input.addEventListener('input', render);
    rate.input.addEventListener('input', render);
    mode.select.addEventListener('change', render);

    function parse(f) {
      var raw = String(f.input.value).trim().replace(/\s/g, '').replace(/,/g, '');
      if (raw === '') return NaN;
      if (!/^-?\d*\.?\d+$/.test(raw)) return NaN;
      return parseFloat(raw);
    }

    function render() {
      var a = parse(amount), r = parse(rate);
      var adding = mode.select.value !== 'remove';

      if (isNaN(a) && isNaN(r)) { out.render([]); box.show(ui('empty'), 'warn'); return; }
      if (isNaN(a) || isNaN(r)) { out.render([]); box.show(ui('partial'), 'warn'); return; }
      if (a <= 0) { out.render([]); box.show(ui('amountLow'), 'error'); return; }
      if (r < 0) { out.render([]); box.show(ui('rateLow'), 'error'); return; }
      if (r > 100) { out.render([]); box.show(ui('rateHigh'), 'error'); return; }

      var net, vat, gross;
      if (adding) {
        net = a;
        vat = a * r / 100;
        gross = net + vat;
      } else {
        gross = a;
        net = a / (1 + r / 100);
        vat = gross - net;
      }

      if (!isFinite(gross) || !isFinite(net) || !isFinite(vat)) {
        out.render([]); box.show(ui('tooBig'), 'error'); return;
      }

      out.render([
        [ui('net'), TK.num(net, 2)],
        [ui('vat'), TK.num(vat, 2)],
        [ui('gross'), TK.num(gross, 2), 'is-strong'],
        [ui('rateApplied'), TK.num(r, 2) + '%'],
        [ui('working'), adding
          ? TK.num(a, 2) + ' × ' + TK.num(r, 2) + '% = ' + TK.num(vat, 2) + ' → ' + TK.num(gross, 2)
          : TK.num(a, 2) + ' ÷ (1 + ' + TK.num(r, 2) + '%) = ' + TK.num(net, 2)]
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
