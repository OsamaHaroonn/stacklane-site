/* ============================================================
   Date difference — days, weeks and a calendar breakdown
   between two dates, counted in whole days.

   The day count uses UTC midnight for both dates so a local
   daylight-saving shift can never add or drop an hour, and the
   calendar breakdown is worked out month by month, not by
   dividing days by 30.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var DAY = 86400000;

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var start = TK.field({ id: 'dd-start', label: ui('start'), type: 'date' });
    var end = TK.field({ id: 'dd-end', label: ui('end'), type: 'date' });

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(start.row);
    grid.appendChild(end.row);

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(common('clear'), function () {
      start.input.value = '';
      end.input.value = '';
      render();
    }, { secondary: true }));

    host.appendChild(grid);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    [start, end].forEach(function (f) { f.input.addEventListener('input', render); });

    function utc(d) { return Date.UTC(d.y, d.m - 1, d.d); }

    /* Whole months and days between two dates, b later than a. */
    function calendarDiff(a, b) {
      var y = b.y - a.y;
      var m = b.m - a.m;
      var d = b.d - a.d;
      if (d < 0) {
        m -= 1;
        // days in the month before b's month (0 is day 0 of b's month)
        d += new Date(Date.UTC(b.y, b.m - 1, 0)).getUTCDate();
      }
      if (m < 0) { m += 12; y -= 1; }
      return { y: y, m: m, d: d };
    }

    function weekday(d) {
      var date = new Date(d.y, d.m - 1, d.d);
      try {
        return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(date);
      } catch (e) {
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
      }
    }

    function fmt(d) {
      return String(d.d).padStart(2, '0') + '/' + String(d.m).padStart(2, '0') + '/' + d.y;
    }

    function render() {
      var sv = start.input.value;
      var ev = end.input.value;

      if (!sv && !ev) { out.render([]); box.show(ui('empty'), 'warn'); return; }
      if (!sv || !ev) { out.render([]); box.show(ui('partial'), 'warn'); return; }

      var a = TK.parseDate(sv), b = TK.parseDate(ev);
      if (!a || !b) { out.render([]); box.show(ui('invalid'), 'error'); return; }
      if (utc(b) < utc(a)) { out.render([]); box.show(ui('order'), 'error'); return; }

      var days = Math.round((utc(b) - utc(a)) / DAY);
      var weeks = Math.floor(days / 7);
      var rest = days % 7;
      var cal = calendarDiff(a, b);

      function dayWord(n) { return n === 1 ? ui('day1') : ui('dayN'); }

      var breakdown = [];
      if (cal.y) breakdown.push(cal.y + ' ' + (cal.y === 1 ? ui('year1') : ui('yearN')));
      if (cal.m) breakdown.push(cal.m + ' ' + (cal.m === 1 ? ui('month1') : ui('monthN')));
      breakdown.push(cal.d + ' ' + dayWord(cal.d));

      out.render([
        [ui('daysLabel'), TK.num(days, 0) + ' ' + dayWord(days), 'is-strong'],
        [ui('weeksLabel'), weeks + ' ' + (weeks === 1 ? ui('week1') : ui('weekN')) + ' ' + ui('and') + ' ' + rest + ' ' + dayWord(rest)],
        [ui('calendar'), breakdown.join(', ')],
        [ui('startDay'), weekday(a) + ' · ' + fmt(a)],
        [ui('endDay'), weekday(b) + ' · ' + fmt(b)],
        [ui('working'), fmt(a) + ' → ' + fmt(b) + ' = ' + TK.num(days, 0) + ' ' + dayWord(days)]
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
