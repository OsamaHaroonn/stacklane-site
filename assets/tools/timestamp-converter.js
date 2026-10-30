/* ============================================================
   Timestamp converter — Unix time to a date and back, using
   only Date and Intl.

   Seconds and milliseconds are told apart automatically (below
   10^11 the value is read as seconds), and the unit can be forced
   with the selector. The local result comes from the browser's
   own time zone, which the result names on screen.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var AUTO_MS = 1e11;

  function pad(n) { return String(n).padStart(2, '0'); }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var ts = TK.field({ id: 'ts-value', label: ui('timestamp'), type: 'text', inputmode: 'numeric', placeholder: ui('tsPh') });
    var unit = TK.select({
      id: 'ts-unit', label: ui('unit'), value: 'auto',
      options: [
        { value: 'auto', label: ui('auto') },
        { value: 's', label: ui('secUnit') },
        { value: 'ms', label: ui('msUnit') }
      ],
      onChange: function () { fromTimestamp(); }
    });
    var dt = TK.field({ id: 'ts-date', label: ui('datetime'), type: 'datetime-local', onChange: function () { fromDate(); } });

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(ts.row);
    grid.appendChild(dt.row);

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(ui('now'), function () {
      ts.input.value = String(Math.floor(Date.now() / 1000));
      fromTimestamp();
    }));
    actions.appendChild(TK.btn(common('clear'), function () {
      ts.input.value = '';
      dt.input.value = '';
      out.render([]);
      box.show(ui('empty'), 'warn');
    }, { secondary: true }));

    host.appendChild(grid);
    host.appendChild(unit.row);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    ts.input.addEventListener('input', fromTimestamp);

    var zone = '';
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { zone = ''; }

    function fail(message) {
      out.render([]);
      box.show(message, 'error');
    }

    function localString(ms) {
      var d = new Date(ms);
      try {
        return new Intl.DateTimeFormat(undefined, {
          year: 'numeric', month: 'short', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).format(d);
      } catch (e) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
          pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
      }
    }

    function weekday(ms) {
      var d = new Date(ms);
      try { return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(d); }
      catch (e) { return d.toDateString(); }
    }

    function relative(ms) {
      var diff = ms - Date.now();
      var abs = Math.abs(diff);
      var mins = Math.round(abs / 60000);
      var text;
      if (mins < 1) text = ui('justNow');
      else if (mins < 60) text = ui('mins').replace('{n}', mins);
      else if (mins < 1440) text = ui('hours').replace('{n}', Math.round(mins / 60));
      else text = ui('days').replace('{n}', Math.round(abs / 86400000));
      return diff >= 0 ? ui('inFuture').replace('{v}', text) : ui('inPast').replace('{v}', text);
    }

    function show(ms) {
      var seconds = Math.floor(ms / 1000);
      var iso;
      try { iso = new Date(ms).toISOString(); } catch (e) { iso = '—'; }
      out.render([
        [ui('localTime'), localString(ms), 'is-strong'],
        [ui('utc'), iso],
        [ui('secondsRow'), TK.num(seconds, 0)],
        [ui('millisRow'), TK.num(ms, 0)],
        [ui('weekday'), weekday(ms)],
        [ui('relative'), relative(ms)],
        [ui('timezone'), zone || ui('unknownZone')]
      ]);
      box.show(ui('note'), '');
    }

    function fromTimestamp() {
      var raw = String(ts.input.value).trim().replace(/\s/g, '');
      if (!raw) {
        if (!dt.input.value) { out.render([]); box.show(ui('empty'), 'warn'); }
        return;
      }
      if (!/^-?\d+$/.test(raw)) { fail(ui('notWhole')); return; }

      var n = parseInt(raw, 10);
      var ms;
      if (unit.select.value === 's') ms = n * 1000;
      else if (unit.select.value === 'ms') ms = n;
      else ms = Math.abs(n) < AUTO_MS ? n * 1000 : n;

      if (!isFinite(ms) || isNaN(new Date(ms).getTime())) { fail(ui('outOfRange')); return; }

      var d = new Date(ms);
      dt.input.value = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
        'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
      show(ms);
    }

    function fromDate() {
      var v = dt.input.value;
      if (!v) {
        if (!ts.input.value) { out.render([]); box.show(ui('empty'), 'warn'); }
        return;
      }
      var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(v);
      if (!m) { fail(ui('badDate')); return; }

      var d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
      if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) {
        fail(ui('badDate'));
        return;
      }
      var ms = d.getTime();
      ts.input.value = unit.select.value === 'ms' ? String(ms) : String(Math.floor(ms / 1000));
      show(ms);
    }

    out.render([]);
    box.show(ui('empty'), 'warn');
  }

  return { mount: mount };
})();
