/* ============================================================
   Percentage calculator — three modes (percent of a number,
   one number as a percent of another, increase/decrease by a
   percent) with the working shown. Refuses division by zero
   instead of printing Infinity.
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
    var mode = 'm1';

    var modes = TK.el('fieldset', { class: 'tk-modes' });
    modes.appendChild(TK.el('legend', {}, ui('modeLabel')));
    [['m1', 'mode1'], ['m2', 'mode2'], ['m3', 'mode3']].forEach(function (pair) {
      var id = 'pct-' + pair[0];
      var lab = TK.el('label', { class: 'tk-check', for: id });
      var input = TK.el('input', { id: id, type: 'radio', name: 'pct-mode', value: pair[0] });
      if (pair[0] === 'm1') input.setAttribute('checked', '');
      lab.appendChild(input);
      lab.appendChild(TK.el('span', {}, ui(pair[1])));
      input.addEventListener('change', function () { mode = pair[0]; render(); });
      modes.appendChild(lab);
    });

    var x = TK.field({ id: 'pct-x', label: ui('x'), type: 'text', inputmode: 'decimal', value: '' });
    var y = TK.field({ id: 'pct-y', label: ui('y'), type: 'text', inputmode: 'decimal', value: '' });
    var value = TK.field({ id: 'pct-value', label: ui('value'), type: 'text', inputmode: 'decimal', value: '' });
    var percent = TK.field({ id: 'pct-pct', label: ui('percent'), type: 'text', inputmode: 'decimal', value: '' });

    var direction = TK.select({
      id: 'pct-dir',
      label: ui('direction'),
      value: 'up',
      options: [
        { value: 'up', label: ui('increase') },
        { value: 'down', label: ui('decrease') }
      ]
    });
    direction.select.addEventListener('change', render);

    var grid1 = TK.el('div', { class: 'tk-grid' });
    grid1.appendChild(x.row);
    grid1.appendChild(y.row);

    var grid2 = TK.el('div', { class: 'tk-grid' });
    grid2.appendChild(value.row);
    grid2.appendChild(percent.row);

    var fields = TK.el('div', { class: 'tk-fields' });
    fields.appendChild(grid1);
    fields.appendChild(grid2);
    fields.appendChild(direction.row);

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(common('clear'), function () {
      x.input.value = '';
      y.input.value = '';
      value.input.value = '';
      percent.input.value = '';
      render();
    }, { secondary: true }));

    host.appendChild(modes);
    host.appendChild(fields);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    [x, y, value, percent].forEach(function (f) {
      f.input.addEventListener('input', render);
    });

    /* Parse allowing negatives but not junk: empty → NaN for the
       caller to detect, so "0" and "" are never confused. */
    function parse(f) {
      var raw = String(f.input.value).trim().replace(/,/g, '.');
      if (raw === '') return NaN;
      if (!/^-?\d*\.?\d+$/.test(raw)) return NaN;
      return parseFloat(raw);
    }

    function show(label, working, result) {
      out.render([
        [ui('result'), result, 'is-strong'],
        [ui('working'), working]
      ]);
      if (label) box.show(label, 'warn');
      else box.clear();
    }

    function render() {
      grid1.hidden = mode !== 'm1' && mode !== 'm2';
      grid2.hidden = mode !== 'm3';
      direction.row.hidden = mode !== 'm3';

      if (mode === 'm1' || mode === 'm2') {
        var xv = parse(x);
        var yv = parse(y);
        if (isNaN(xv) || isNaN(yv)) {
          out.render([]);
          box.show(ui('empty'), 'warn');
          return;
        }
        if (mode === 'm1') {
          var pct = xv;
          if (pct < 0) { out.render([]); box.show(ui('negPercent'), 'error'); return; }
          var part = yv * pct / 100;
          show('', pct + '% × ' + TK.num(yv, 6) + ' = ' + TK.num(part, 6), TK.num(part, 2));
        } else {
          if (yv === 0) { out.render([]); box.show(ui('zeroBase'), 'error'); return; }
          var p = xv / yv * 100;
          show('', TK.num(xv, 6) + ' ÷ ' + TK.num(yv, 6) + ' × 100 = ' + TK.num(p, 6) + '%', TK.num(p, 2) + '%');
        }
        return;
      }

      var v = parse(value);
      var pc = parse(percent);
      if (isNaN(v) || isNaN(pc)) {
        out.render([]); box.show(ui('empty'), 'warn'); return;
      }
      if (pc < 0) { out.render([]); box.show(ui('negPercent'), 'error'); return; }
      var up = direction.select.value === 'up';
      var delta = v * pc / 100;
      var res = up ? v + delta : v - delta;
      show('',
        TK.num(v, 6) + (up ? ' + ' : ' − ') + TK.num(v, 6) + ' × ' + TK.num(pc, 4) + '% = ' + TK.num(res, 6),
        TK.num(res, 2));
    }

    render();
  }

  return { mount: mount };
})();
