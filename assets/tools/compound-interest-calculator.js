/* ============================================================
   Compound interest — A = P(1 + r/n)^(nt)

   P = starting amount, r = annual rate as a decimal,
   n = compounds per year, t = years.
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

    var principal = TK.field({ id: 'ci-principal', label: ui('principal'), type: 'text', inputmode: 'decimal' });
    var rate = TK.field({ id: 'ci-rate', label: ui('rate'), type: 'text', inputmode: 'decimal' });
    var years = TK.field({ id: 'ci-years', label: ui('years'), type: 'text', inputmode: 'decimal' });

    var freq = TK.select({
      id: 'ci-freq',
      label: ui('frequency'),
      value: '12',
      options: [
        { value: '1', label: ui('yearly') },
        { value: '2', label: ui('halfYearly') },
        { value: '4', label: ui('quarterly') },
        { value: '12', label: ui('monthly') },
        { value: '365', label: ui('daily') }
      ]
    });

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(principal.row);
    grid.appendChild(rate.row);
    grid.appendChild(years.row);
    grid.appendChild(freq.row);

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(common('clear'), function () {
      principal.input.value = '';
      rate.input.value = '';
      years.input.value = '';
      render();
    }, { secondary: true }));

    host.appendChild(grid);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    [principal, rate, years].forEach(function (f) { f.input.addEventListener('input', render); });
    freq.select.addEventListener('change', render);

    function parse(f) {
      var raw = String(f.input.value).trim().replace(/\s/g, '').replace(/,/g, '');
      if (raw === '') return NaN;
      if (!/^-?\d*\.?\d+$/.test(raw)) return NaN;
      return parseFloat(raw);
    }

    function render() {
      var p = parse(principal), r = parse(rate), t = parse(years);
      var n = parseInt(freq.select.value, 10) || 1;

      if (isNaN(p) && isNaN(r) && isNaN(t)) { out.render([]); box.show(ui('empty'), 'warn'); return; }
      if (isNaN(p) || isNaN(r) || isNaN(t)) { out.render([]); box.show(ui('partial'), 'warn'); return; }
      if (p <= 0) { out.render([]); box.show(ui('principalLow'), 'error'); return; }
      if (r < 0) { out.render([]); box.show(ui('rateLow'), 'error'); return; }
      if (t <= 0) { out.render([]); box.show(ui('yearsLow'), 'error'); return; }
      if (t > 100) { out.render([]); box.show(ui('yearsHigh'), 'error'); return; }
      if (r > 100) { out.render([]); box.show(ui('rateHigh'), 'error'); return; }

      var decimal = r / 100;
      var factor = Math.pow(1 + decimal / n, n * t);
      var finalAmount = p * factor;

      if (!isFinite(finalAmount)) { out.render([]); box.show(ui('tooBig'), 'error'); return; }

      var interest = finalAmount - p;
      var flatRate = p + p * decimal * t;

      out.render([
        [ui('final'), TK.num(finalAmount, 2), 'is-strong'],
        [ui('interest'), TK.num(interest, 2)],
        [ui('growth'), TK.num((factor - 1) * 100, 2) + '%'],
        [ui('withoutCompounding'), TK.num(flatRate, 2)],
        [ui('working'), TK.num(p, 2) + ' × (1 + ' + TK.num(decimal * 100, 4) + '% ÷ ' + n +
          ')^(' + n + ' × ' + TK.num(t, 2) + ') = ' + TK.num(finalAmount, 2)]
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
