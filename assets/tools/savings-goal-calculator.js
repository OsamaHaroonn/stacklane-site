/* ============================================================
   Savings goal — what you still need, and the monthly deposit
   that gets you there.

   FV  = C × (1 + i)^N                        (what you already have)
   PMT = (T − FV) × i ÷ ((1 + i)^N − 1)       (monthly deposit)

   i = annual rate ÷ 100 ÷ 12, N = months.
   Deposits are assumed to be made at the end of every month at a
   fixed rate that never changes: an estimate, not advice.
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

    var target = TK.field({ id: 'sg-target', label: ui('target'), type: 'text', inputmode: 'decimal' });
    var current = TK.field({ id: 'sg-current', label: ui('current'), type: 'text', inputmode: 'decimal', value: '0' });
    var rate = TK.field({ id: 'sg-rate', label: ui('rate'), type: 'text', inputmode: 'decimal' });
    var years = TK.field({ id: 'sg-years', label: ui('years'), type: 'text', inputmode: 'decimal' });

    var grid = TK.el('div', { class: 'tk-grid' });
    [target, current, rate, years].forEach(function (f) { grid.appendChild(f.row); });

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(common('clear'), function () {
      target.input.value = '';
      current.input.value = '0';
      rate.input.value = '';
      years.input.value = '';
      render();
    }, { secondary: true }));

    host.appendChild(grid);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    [target, current, rate, years].forEach(function (f) { f.input.addEventListener('input', render); });

    function parse(f) {
      var raw = String(f.input.value).trim().replace(/\s/g, '').replace(/,/g, '');
      if (raw === '') return NaN;
      if (!/^-?\d*\.?\d+$/.test(raw)) return NaN;
      return parseFloat(raw);
    }

    function money(n) { return TK.num(n, 2); }

    function render() {
      var T = parse(target), C = parse(current), r = parse(rate), n = parse(years);

      if (isNaN(T) && isNaN(r) && isNaN(n)) { out.render([]); box.show(ui('empty'), 'warn'); return; }
      if (isNaN(T) || isNaN(C) || isNaN(r) || isNaN(n)) { out.render([]); box.show(ui('partial'), 'warn'); return; }
      if (T <= 0) { out.render([]); box.show(ui('targetLow'), 'error'); return; }
      if (C < 0) { out.render([]); box.show(ui('currentLow'), 'error'); return; }
      if (r < 0) { out.render([]); box.show(ui('rateLow'), 'error'); return; }
      if (r > 100) { out.render([]); box.show(ui('rateHigh'), 'error'); return; }
      if (n <= 0) { out.render([]); box.show(ui('yearsLow'), 'error'); return; }
      if (n > 100) { out.render([]); box.show(ui('yearsHigh'), 'error'); return; }

      var N = Math.round(n * 12);
      if (N < 1) { out.render([]); box.show(ui('yearsLow'), 'error'); return; }
      var i = r / 100 / 12;
      var factor = i === 0 ? 1 : Math.pow(1 + i, N);
      var fv = C * factor;
      var need = T - fv;

      if (!isFinite(fv) || !isFinite(factor)) { out.render([]); box.show(ui('tooBig'), 'error'); return; }

      if (need <= 0) {
        out.render([
          [ui('future'), money(fv), 'is-strong'],
          [ui('need'), money(0)],
          [ui('deposit'), money(0)],
          [ui('working'), money(C) + ' × (1 + ' + TK.num(i * 100, 4) + '%)^' + TK.num(N, 0) + ' = ' + money(fv)]
        ]);
        box.show(ui('reached'), '');
        return;
      }

      var pmt = i === 0 ? need / N : need * i / (factor - 1);
      if (!isFinite(pmt) || pmt < 0) { out.render([]); box.show(ui('tooBig'), 'error'); return; }

      out.render([
        [ui('need'), money(need), 'is-strong'],
        [ui('future'), money(fv)],
        [ui('deposit'), money(pmt)],
        [ui('totalDeposits'), money(pmt * N)],
        [ui('working'), i === 0
          ? '(' + money(T) + ' − ' + money(C) + ') ÷ ' + TK.num(N, 0) + ' = ' + money(pmt)
          : '((' + money(T) + ' − ' + money(fv) + ') × ' + TK.num(i * 100, 4) + '%) ÷ ((1 + ' +
            TK.num(i * 100, 4) + '%)^' + TK.num(N, 0) + ' − 1) = ' + money(pmt)]
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
