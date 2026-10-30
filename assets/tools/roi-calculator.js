/* ============================================================
   ROI calculator — return on an investment from what you put
   in and what you got out.

   ROI = (final − initial) ÷ initial × 100

   A loss is reported as a loss row with a positive figure and a
   negative percentage, so no money is ever printed with a
   leading minus sign.
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

    var initial = TK.field({ id: 'roi-in', label: ui('initial'), type: 'text', inputmode: 'decimal' });
    var finalV = TK.field({ id: 'roi-out', label: ui('final'), type: 'text', inputmode: 'decimal' });

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(initial.row);
    grid.appendChild(finalV.row);

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(common('clear'), function () {
      initial.input.value = '';
      finalV.input.value = '';
      render();
    }, { secondary: true }));

    host.appendChild(grid);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    [initial, finalV].forEach(function (f) { f.input.addEventListener('input', render); });

    function parse(f) {
      var raw = String(f.input.value).trim().replace(/\s/g, '').replace(/,/g, '');
      if (raw === '') return NaN;
      if (!/^-?\d*\.?\d+$/.test(raw)) return NaN;
      return parseFloat(raw);
    }

    function money(n) { return TK.num(n, 2); }

    function render() {
      var a = parse(initial), z = parse(finalV);

      if (isNaN(a) && isNaN(z)) { out.render([]); box.show(ui('empty'), 'warn'); return; }
      if (isNaN(a) || isNaN(z)) { out.render([]); box.show(ui('partial'), 'warn'); return; }
      if (a <= 0) { out.render([]); box.show(ui('initialLow'), 'error'); return; }
      if (z < 0) { out.render([]); box.show(ui('finalLow'), 'error'); return; }

      var profit = z - a;
      var roi = profit / a * 100;
      var multiple = z / a;

      if (!isFinite(roi) || !isFinite(multiple)) {
        out.render([]); box.show(ui('tooBig'), 'error'); return;
      }

      var rows = [];
      if (profit >= 0) {
        rows.push([ui('profit'), money(profit), 'is-strong']);
      } else {
        rows.push([ui('loss'), money(-profit), 'is-strong']);
      }
      rows.push([ui('roi'), TK.num(roi, 2) + '%']);
      rows.push([ui('multiple'), TK.num(multiple, 2) + '×']);
      rows.push([ui('working'), (profit >= 0
        ? money(z) + ' − ' + money(a) + ' = ' + money(profit)
        : money(a) + ' − ' + money(z) + ' = ' + money(-profit)) +
        ' ÷ ' + money(a) + ' × 100 = ' + TK.num(roi, 2) + '%']);

      out.render(rows);
      box.show(profit < 0 ? ui('noteLoss') : ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
