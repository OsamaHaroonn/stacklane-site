window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_SALARY = 100000000;

  function num(text) {
    var s = String(text).trim();
    if (!/^-?(\d+(\.\d+)?|\.\d+)$/.test(s)) return null;
    var v = parseFloat(s);
    return isFinite(v) ? v : null;
  }

  function money(v) {
    if (!isFinite(v)) return '—';
    return v.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var salary = TK.field({
      id: 'sh-salary',
      label: ui('salary'),
      hint: ui('salaryHint'),
      inputmode: 'decimal',
      placeholder: '52000',
      onInput: render
    });
    var hours = TK.field({
      id: 'sh-hours',
      label: ui('hours'),
      inputmode: 'decimal',
      value: '40',
      onInput: render
    });
    var weeks = TK.field({
      id: 'sh-weeks',
      label: ui('weeks'),
      inputmode: 'decimal',
      value: '52',
      onInput: render
    });

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(hours.row);
    grid.appendChild(weeks.row);

    host.appendChild(salary.row);
    host.appendChild(grid);
    host.appendChild(box);
    host.appendChild(out);

    function fail(text) { out.render([]); box.show(text, 'error'); }

    function render() {
      var rawSalary = salary.input.value;
      if (!rawSalary.trim()) { out.render([]); box.show(ui('empty'), 'warn'); return; }

      var s = num(rawSalary);
      if (s === null) { fail(ui('badSalary')); return; }
      if (s < 0) { fail(ui('negative')); return; }
      if (s === 0) { fail(ui('zero')); return; }
      if (s > MAX_SALARY) { fail(ui('tooBig', { max: TK.num(MAX_SALARY, 0) })); return; }

      var h = num(hours.input.value);
      if (hours.input.value.trim() === '' || h === null) { fail(ui('badHours')); return; }
      if (h <= 0) { fail(ui('hoursZero')); return; }
      if (h > 168) { fail(ui('hoursRange')); return; }

      var w = num(weeks.input.value);
      if (weeks.input.value.trim() === '' || w === null) { fail(ui('badWeeks')); return; }
      if (w <= 0) { fail(ui('weeksZero')); return; }
      if (w > 52) { fail(ui('weeksRange')); return; }

      var totalHours = h * w;
      var hourly = s / totalHours;

      out.render([
        [ui('hourly'), money(hourly), 'is-strong'],
        [ui('daily'), money(hourly * (h / 5))],
        [ui('weekly'), money(s / w)],
        [ui('monthly'), money(s / 12)],
        [ui('yearly'), money(s)],
        [ui('totalHours'), TK.num(totalHours, 0)],
        [ui('formula'), TK.num(s, 0) + ' ÷ (' + TK.num(h, 2) + ' × ' + TK.num(w, 2) + ') = ' + money(hourly)]
      ]);

      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
