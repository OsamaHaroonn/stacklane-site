window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var SIDES = [4, 6, 8, 10, 12, 20];
  var MAX_DICE = 10;

  function randInt(max) {
    var range = max | 0;
    if (range <= 0) return 0;
    var limit = Math.floor(4294967296 / range) * range;
    var buf = new Uint32Array(1);
    var v;
    do {
      crypto.getRandomValues(buf);
      v = buf[0];
    } while (v >= limit);
    return v % range;
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var diceRow = TK.el('div', {
      style: 'display:flex;flex-wrap:wrap;gap:8px;margin:12px 0',
      role: 'status',
      'aria-live': 'polite'
    });
    var out = TK.rows();

    var sides = TK.select({
      id: 'dr-sides',
      label: ui('sides'),
      options: SIDES.map(function (n) { return { value: String(n), label: 'd' + n }; }),
      value: '6',
      onChange: roll
    });

    var count = TK.field({
      id: 'dr-count',
      label: ui('count'),
      inputmode: 'numeric',
      value: '2',
      onInput: roll
    });

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(sides.row);
    grid.appendChild(count.row);

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('roll'), roll));

    host.appendChild(grid);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(diceRow);
    host.appendChild(out);

    function fail(text) {
      diceRow.textContent = '';
      out.render([]);
      box.show(text, 'error');
    }

    function roll() {
      var raw = String(count.input.value).trim();
      if (raw === '') { fail(ui('empty')); return; }
      if (!/^\d+$/.test(raw)) { fail(ui('badCount')); return; }
      var n = parseInt(raw, 10);
      if (n < 1) { fail(ui('countRange', { max: String(MAX_DICE) })); return; }
      if (n > MAX_DICE) { fail(ui('countRange', { max: String(MAX_DICE) })); return; }

      var faces = parseInt(sides.select.value, 10);
      var values = [];
      var total = 0;
      for (var i = 0; i < n; i++) {
        var v = randInt(faces) + 1;
        values.push(v);
        total += v;
      }

      diceRow.textContent = '';
      values.forEach(function (v, idx) {
        diceRow.appendChild(TK.el('span', {
          style: 'display:inline-flex;align-items:center;justify-content:center;' +
            'min-width:44px;height:44px;padding:0 8px;border-radius:10px;' +
            'background:#eef2ff;border:1px solid #c7d2fe;font-weight:600'
        }, String(v)), idx);
      });

      out.render([
        [ui('each'), values.join(', ')],
        [ui('total'), TK.num(total, 0), 'is-strong'],
        [ui('dice'), TK.num(n, 0) + ' × d' + faces]
      ]);
      box.show(ui('note'), '');
    }

    roll();
  }

  return { mount: mount };
})();
