window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function num(text) {
    var s = String(text).trim();
    if (!/^-?(\d+(\.\d+)?|\.\d+)$/.test(s)) return null;
    var v = parseFloat(s);
    return isFinite(v) ? v : null;
  }

  function one(v) {
    return v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var weight = TK.field({
      id: 'bw-weight', label: ui('weight'), inputmode: 'decimal',
      placeholder: '70', onInput: render
    });
    var height = TK.field({
      id: 'bw-height', label: ui('height'), inputmode: 'decimal',
      placeholder: '175', onInput: render
    });

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(weight.row);
    grid.appendChild(height.row);

    host.appendChild(grid);
    host.appendChild(box);
    host.appendChild(out);

    function fail(text) { out.render([]); box.show(text, 'error'); }

    function band(bmi) {
      if (bmi < 18.5) return ui('under');
      if (bmi < 25) return ui('healthy');
      if (bmi < 30) return ui('over');
      return ui('obese');
    }

    function render() {
      if (!weight.input.value.trim() && !height.input.value.trim()) {
        out.render([]);
        box.show(ui('empty'), 'warn');
        return;
      }

      var w = num(weight.input.value);
      if (weight.input.value.trim() === '' || w === null) { fail(ui('badWeight')); return; }
      if (w <= 0) { fail(ui('weightZero')); return; }
      if (w > 500) { fail(ui('weightRange')); return; }

      var h = num(height.input.value);
      if (height.input.value.trim() === '' || h === null) { fail(ui('badHeight')); return; }
      if (h <= 0) { fail(ui('heightZero')); return; }
      if (h < 50 || h > 250) { fail(ui('heightRange')); return; }

      var m = h / 100;
      var bmi = w / (m * m);
      var low = 18.5 * m * m;
      var high = 24.9 * m * m;

      out.render([
        [ui('bmi'), one(bmi), 'is-strong'],
        [ui('band'), band(bmi)],
        [ui('range'), one(low) + ' – ' + one(high) + ' kg'],
        [ui('formula'), one(w) + ' ÷ ' + m.toFixed(2) + '² = ' + one(bmi)]
      ]);

      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
