/* ============================================================
   Tip and split calculator — tip amount, total and the share
   per person, all from plain numbers (no currency symbol: the
   tool does not know what you are paying in).

   The people count is rounded up, so a group of 3.5 people
   never produces a per-person figure nobody can pay.
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

    var bill = TK.field({ id: 'tip-bill', label: ui('bill'), type: 'text', inputmode: 'decimal' });
    var pct = TK.field({ id: 'tip-pct', label: ui('pct'), type: 'text', inputmode: 'decimal', value: '15' });
    var people = TK.field({ id: 'tip-people', label: ui('people'), type: 'text', inputmode: 'numeric', value: '2' });

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(bill.row);
    grid.appendChild(pct.row);
    grid.appendChild(people.row);

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(common('clear'), function () {
      bill.input.value = '';
      pct.input.value = '15';
      people.input.value = '2';
      render();
    }, { secondary: true }));

    host.appendChild(grid);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    [bill, pct, people].forEach(function (f) { f.input.addEventListener('input', render); });

    function parse(f) {
      var raw = String(f.input.value).trim().replace(/\s/g, '').replace(/,/g, '');
      if (raw === '') return NaN;
      if (!/^-?\d*\.?\d+$/.test(raw)) return NaN;
      return parseFloat(raw);
    }

    function money(n) { return TK.num(n, 2); }

    function render() {
      var b = parse(bill), p = parse(pct), n = parse(people);

      if (isNaN(b)) { out.render([]); box.show(ui('empty'), 'warn'); return; }
      if (isNaN(p) || isNaN(n)) { out.render([]); box.show(ui('partial'), 'warn'); return; }
      if (b <= 0) { out.render([]); box.show(ui('billLow'), 'error'); return; }
      if (p < 0) { out.render([]); box.show(ui('pctLow'), 'error'); return; }
      if (p > 100) { out.render([]); box.show(ui('pctHigh'), 'error'); return; }
      if (n < 1) { out.render([]); box.show(ui('peopleLow'), 'error'); return; }

      var head = Math.ceil(n);
      var tip = b * p / 100;
      var total = b + tip;
      var each = total / head;

      if (!isFinite(tip) || !isFinite(total) || !isFinite(each)) {
        out.render([]); box.show(ui('tooBig'), 'error'); return;
      }

      out.render([
        [ui('tip'), money(tip), 'is-strong'],
        [ui('total'), money(total)],
        [ui('each'), money(each)],
        [ui('split'), TK.num(head, 0) + ' ' + (head === 1 ? ui('person') : ui('peopleWord'))],
        [ui('working'), money(b) + ' × ' + TK.num(p, 4) + '% = ' + money(tip) +
          ' → ' + money(total) + ' ÷ ' + TK.num(head, 0) + ' = ' + money(each)]
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
