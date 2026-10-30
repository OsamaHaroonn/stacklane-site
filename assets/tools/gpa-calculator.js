/* ============================================================
   GPA calculator — grade point average from courses you list
   yourself: grade points and units per course.

   GPA = Σ(points × units) ÷ Σunits

   There is no built-in grade scale: you enter the points your
   own school or course assigns, because scales differ between
   countries, institutions and even departments.
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

    var rowsBox = TK.el('div', { class: 'tk-rows' });
    var rows = [];
    var uid = 0;

    function parse(f) {
      var raw = String(f.input.value).trim().replace(/\s/g, '').replace(/,/g, '');
      if (raw === '') return NaN;
      if (!/^-?\d*\.?\d+$/.test(raw)) return NaN;
      return parseFloat(raw);
    }

    function rebuild() {
      rowsBox.textContent = '';
      rows.forEach(function (row, idx) {
        var grid = TK.el('div', { class: 'tk-grid gpa-row' });
        grid.appendChild(row.label.row);
        grid.appendChild(row.points.row);
        grid.appendChild(row.units.row);
        if (rows.length > 1) {
          grid.appendChild(TK.btn(ui('remove'), function () {
            rows.splice(idx, 1);
            render();
            rebuild();
          }, { secondary: true }));
        }
        rowsBox.appendChild(grid);
      });
    }

    function addRow() {
      var id = uid++;
      var row = {
        label: TK.field({ id: 'gpa-l' + id, label: ui('course'), type: 'text', placeholder: ui('coursePh') }),
        points: TK.field({ id: 'gpa-p' + id, label: ui('points'), type: 'text', inputmode: 'decimal' }),
        units: TK.field({ id: 'gpa-u' + id, label: ui('units'), type: 'text', inputmode: 'decimal' })
      };
      [row.label, row.points, row.units].forEach(function (f) {
        f.input.addEventListener('input', render);
      });
      rows.push(row);
    }

    for (var i = 0; i < 4; i++) addRow();

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(ui('add'), function () {
      if (rows.length >= 12) { box.show(ui('maxRows'), 'warn'); return; }
      addRow();
      rebuild();
      render();
    }));
    actions.appendChild(TK.btn(common('clear'), function () {
      rows = [];
      uid = 0;
      for (var k = 0; k < 4; k++) addRow();
      rebuild();
      render();
    }, { secondary: true }));

    host.appendChild(rowsBox);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    function render() {
      var used = 0, units = 0, quality = 0, partial = false, bad = false, range = false;

      rows.forEach(function (row) {
        var pv = String(row.points.input.value).trim();
        var uv = String(row.units.input.value).trim();
        if (pv === '' && uv === '') return;
        if (pv === '' || uv === '') { partial = true; return; }
        var p = parse(row.points), u = parse(row.units);
        if (isNaN(p) || isNaN(u)) { bad = true; return; }
        if (p < 0 || u <= 0) { range = true; return; }
        used++;
        units += u;
        quality += p * u;
      });

      if (used === 0) {
        out.render([]);
        if (bad) box.show(ui('invalid'), 'error');
        else if (range) box.show(ui('range'), 'error');
        else if (partial) box.show(ui('partial'), 'error');
        else box.show(ui('empty'), 'warn');
        return;
      }
      if (partial || bad || range) {
        out.render([]);
        box.show(bad ? ui('invalid') : range ? ui('range') : ui('partial'), 'error');
        return;
      }
      if (!(units > 0)) { out.render([]); box.show(ui('unitsLow'), 'error'); return; }

      var gpa = quality / units;
      if (!isFinite(gpa)) { out.render([]); box.show(ui('tooBig'), 'error'); return; }

      out.render([
        [ui('gpa'), TK.num(gpa, 2), 'is-strong'],
        [ui('totalUnits'), TK.num(units, 2)],
        [ui('quality'), TK.num(quality, 2)],
        [ui('counted'), TK.num(used, 0)],
        [ui('working'), TK.num(quality, 2) + ' ÷ ' + TK.num(units, 2) + ' = ' + TK.num(gpa, 4)]
      ]);
      box.show(ui('note'), '');
    }

    rebuild();
    render();
  }

  return { mount: mount };
})();
