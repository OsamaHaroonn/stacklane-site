/* ============================================================
   Working days calculator — walks every day from start to end
   (inclusive), counting working days, weekend days and the
   holidays the user supplied. No country holiday data: the
   holidays and the weekend days both come from the inputs.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  /* JS weekday: 0 = Sunday .. 6 = Saturday. */
  var DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  function sameDay(a, b) {
    return a.y === b.y && a.m === b.m && a.d === b.d;
  }
  function before(a, b) {
    if (a.y !== b.y) return a.y < b.y;
    if (a.m !== b.m) return a.m < b.m;
    return a.d < b.d;
  }
  function key(p) {
    return p.y + '-' + String(p.m).padStart(2, '0') + '-' + String(p.d).padStart(2, '0');
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var start = TK.field({ id: 'wd-start', label: ui('start'), type: 'date', onInput: render, onChange: render });
    var end = TK.field({ id: 'wd-end', label: ui('end'), type: 'date', onInput: render, onChange: render });
    var holidays = TK.textarea({
      id: 'wd-holidays', label: ui('holidays'), rows: 4,
      placeholder: '2026-03-10', onInput: render
    });

    var weekendWrap = TK.el('div', { class: 'tk-field' });
    weekendWrap.appendChild(TK.el('span', { class: 'tk-legend' }, ui('weekend')));
    var grid = TK.el('div', { class: 'tk-grid' });
    var dayBoxes = {};
    ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(function (k) {
      var checked = (k === 'sat' || k === 'sun');
      var cb = TK.checkbox({
        id: 'wd-' + k, label: ui(k), checked: checked, onChange: render
      });
      dayBoxes[k] = cb;
      grid.appendChild(cb.row);
    });
    weekendWrap.appendChild(grid);

    host.appendChild(start.row);
    host.appendChild(end.row);
    host.appendChild(weekendWrap);
    host.appendChild(holidays.row);
    host.appendChild(box);
    host.appendChild(out);

    function render() {
      var a = TK.parseDate(start.input.value);
      var b = TK.parseDate(end.input.value);
      if (!a || !b) { out.render([]); box.show(ui('empty'), 'warn'); return; }
      if (before(b, a)) { out.render([]); box.show(ui('endBefore'), 'error'); return; }

      var holidaySet = {}, bad = [];
      holidays.textarea.value.split('\n').forEach(function (line) {
        var t = line.trim();
        if (!t) return;
        var p = TK.parseDate(t);
        if (p) holidaySet[key(p)] = true;
        else bad.push(t);
      });

      var weekend = {};
      DAY_KEYS.forEach(function (k) { weekend[k] = dayBoxes[k].input.checked; });

      var work = 0, weekendCount = 0, holidayCount = 0, total = 0;
      var cur = new Date(a.y, a.m - 1, a.d);
      var stop = new Date(b.y, b.m - 1, b.d);
      while (cur <= stop) {
        total++;
        var k2 = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0')
          + '-' + String(cur.getDate()).padStart(2, '0');
        var day = cur.getDay();
        if (holidaySet[k2]) holidayCount++;
        else if (weekend[DAY_KEYS[day]]) weekendCount++;
        else work++;
        cur.setDate(cur.getDate() + 1);
      }

      out.render([
        [ui('workingDays'), TK.num(work, 0), 'is-strong'],
        [ui('weekendDays'), TK.num(weekendCount, 0)],
        [ui('holidayDays'), TK.num(holidayCount, 0)],
        [ui('calendarDays'), TK.num(total, 0)]
      ]);

      if (bad.length) {
        box.show(ui('badDates', {
          n: String(bad.length),
          list: bad.slice(0, 5).join(', ') + (bad.length > 5 ? ' \u2026' : '')
        }), 'warn');
      } else {
        box.show(ui('note'), '');
      }
    }

    render();
  }

  return { mount: mount };
})();