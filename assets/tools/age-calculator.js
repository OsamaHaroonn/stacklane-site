/* ============================================================
   Age calculator — exact calendar age (years, months, days) from
   two dates, plus total days between them and the next birthday.
   Dates are parsed by hand so no time zone can shift them.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function daysInMonth(y, m) {
    return new Date(y, m, 0).getDate();   // m = 1..12
  }

  /* Calendar subtraction: full years, then full months, then days. */
  function ageBetween(birth, asOf) {
    var years = asOf.y - birth.y;
    var months = asOf.m - birth.m;
    var days = asOf.d - birth.d;

    if (days < 0) {
      months -= 1;
      var prevM = asOf.m - 1 || 12;
      var prevY = asOf.m === 1 ? asOf.y - 1 : asOf.y;
      days += daysInMonth(prevY, prevM);
    }
    if (months < 0) {
      months += 12;
      years -= 1;
    }
    return { years: years, months: months, days: days };
  }

  function dayNumber(d) {
    return Math.round(Date.UTC(d.y, d.m - 1, d.d) / 86400000);
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var birth = TK.field({
      id: 'age-birth',
      label: ui('birth'),
      type: 'date',
      value: ''
    });

    var asOf = TK.field({
      id: 'age-asof',
      label: ui('asOf'),
      type: 'date',
      value: TK.today()
    });

    var todayBtn = TK.btn(ui('today'), function () {
      asOf.input.value = TK.today();
      calculate();
    }, { secondary: true });

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(ui('calculate'), function () { run(); }));
    actions.appendChild(todayBtn);

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(birth.row);
    grid.appendChild(asOf.row);

    host.appendChild(grid);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    var run = TK.guard(box, calculate);
    birth.input.addEventListener('change', function () { run(); });
    asOf.input.addEventListener('change', function () { run(); });

    function calculate() {
      var b = TK.parseDate(birth.input.value);
      if (!b) {
        out.render([]);
        box.show(ui('empty'), 'error');
        return;
      }

      var a = TK.parseDate(asOf.input.value);
      if (!a) {
        // An empty or malformed "age on" date simply means today.
        a = TK.parseDate(TK.today());
      }

      if (dayNumber(b) > dayNumber(TK.parseDate(TK.today()))) {
        out.render([]);
        box.show(ui('future'), 'error');
        return;
      }
      if (dayNumber(b) > dayNumber(a)) {
        out.render([]);
        box.show(ui('afterAsOf'), 'error');
        return;
      }

      box.clear();
      var age = ageBetween(b, a);
      var total = dayNumber(a) - dayNumber(b);

      /* Next birthday on or after the age-on date. */
      var nextY = a.y;
      var isLeapBirthday = b.m === 2 && b.d === 29 && daysInMonth(nextY, 2) !== 29;
      var nbMonth = isLeapBirthday ? 2 : b.m;
      var nbDay = isLeapBirthday ? 28 : b.d;
      var candidate = { y: nextY, m: nbMonth, d: nbDay };
      if (dayNumber(candidate) < dayNumber(a)) {
        candidate = { y: nextY + 1, m: nbMonth, d: nbDay };
      }
      var until = dayNumber(candidate) - dayNumber(a);

      var nextText = until === 0 ? ui('todayIs') : ui('inDays', { n: TK.num(until, 0) });

      out.render([
        [ui('age'), age.years + ' ' + ui('years') + ', ' + age.months + ' ' + ui('months') + ', ' + age.days + ' ' + ui('days')],
        [ui('totalDays'), TK.num(total, 0)],
        [ui('nextBirthday'), nextText]
      ]);
      box.clear();
    }

    calculate();
  }

  return { mount: mount };
})();
