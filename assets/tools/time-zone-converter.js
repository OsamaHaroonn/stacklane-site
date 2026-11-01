/* ============================================================
   Time zone converter — one moment in time, shown in several
   IANA zones. Offsets come from Intl.DateTimeFormat, so the
   browser's own tz database decides daylight saving.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_ZONES = 8;

  function zoneList() {
    var list = [];
    try {
      if (typeof Intl.supportedValuesOf === 'function') {
        list = Intl.supportedValuesOf('timeZone').slice();
      }
    } catch (e) { list = []; }
    if (list.indexOf('UTC') === -1) list.unshift('UTC');
    return list;
  }

  /* Milliseconds that the zone's wall clock is ahead of UTC at utcMs. */
  function offsetMs(utcMs, zone) {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(new Date(utcMs));
    var o = {};
    parts.forEach(function (p) { if (p.type !== 'literal') o[p.type] = p.value; });
    var base = Math.floor(utcMs / 1000) * 1000;
    return Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour % 24, +o.minute, +o.second) - base;
  }

  /* Wall-clock time in `zone` -> the moment in time (UTC ms). */
  function wallToUtc(y, mo, d, h, mi, zone) {
    var guess = Date.UTC(y, mo - 1, d, h, mi, 0);
    var off = offsetMs(guess, zone);
    var t = guess - off;
    var off2 = offsetMs(t, zone);
    if (off2 !== off) t = guess - off2;
    return t;
  }

  function fmt(ms, zone) {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: zone, dateStyle: 'medium', timeStyle: 'short'
    }).format(new Date(ms));
  }

  function offsetLabel(ms, zone) {
    var mins = Math.round(offsetMs(ms, zone) / 60000);
    var sign = mins < 0 ? '\u2212' : '+';
    var a = Math.abs(mins);
    return 'UTC' + sign + String(Math.floor(a / 60)).padStart(2, '0') + ':' +
      String(a % 60).padStart(2, '0');
  }

  function shortName(ms, zone) {
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: zone, timeZoneName: 'short'
      }).formatToParts(new Date(ms));
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].type === 'timeZoneName') return parts[i].value;
      }
    } catch (e) { /* fall through */ }
    return '';
  }

  function observesDst(ms, zone) {
    var y = new Date(ms).getUTCFullYear();
    var jan = offsetMs(Date.UTC(y, 0, 1), zone);
    var jul = offsetMs(Date.UTC(y, 6, 1), zone);
    return offsetMs(ms, zone) > Math.min(jan, jul);
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var zones = zoneList();
    var browserZone = 'UTC';
    try { browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { /* keep UTC */ }
    if (zones.indexOf(browserZone) === -1) browserZone = 'UTC';

    function options() {
      return zones.map(function (z) { return { value: z, label: z }; });
    }

    function nowLocal() {
      var d = new Date();
      function p(n) { return String(n).padStart(2, '0'); }
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
        'T' + p(d.getHours()) + ':' + p(d.getMinutes());
    }

    var box = TK.msg();
    var out = TK.rows();

    var when = TK.field({
      id: 'tz-when', label: ui('when'), hint: ui('whenHint'),
      type: 'datetime-local', value: nowLocal()
    });
    var from = TK.select({
      id: 'tz-from', label: ui('refZone'), options: options(), value: browserZone
    });
    var toSel = TK.select({
      id: 'tz-add', label: ui('addLabel'), options: options(), value: 'UTC'
    });

    var chosen = ['America/New_York', 'Europe/London', 'Asia/Tokyo'].filter(function (z) {
      return zones.indexOf(z) !== -1 && z !== browserZone;
    });

    // Drop anything the current browser's tz list does not know.
    chosen = chosen.filter(function (z) { return zones.indexOf(z) !== -1; });

    var chips = TK.el('ul', { class: 'itemlist' });
    var addBtn = TK.btn(ui('add'), function () { addZone(toSel.select.value); }, { secondary: true });
    var controls = TK.el('div', { class: 'tool-actions' });
    controls.appendChild(addBtn);

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(when.row);
    grid.appendChild(from.row);
    grid.appendChild(toSel.row);

    host.appendChild(grid);
    host.appendChild(controls);
    host.appendChild(chips);
    host.appendChild(box);
    host.appendChild(out);

    function drawChips() {
      chips.textContent = '';
      chosen.forEach(function (z) {
        var li = TK.el('li', {});
        li.appendChild(TK.el('span', { class: 'item-name' }, z));
        var rm = TK.el('button', {
          class: 'icon-btn', type: 'button', 'aria-label': X.ui('remove', { zone: z })
        }, '\u00d7');
        rm.addEventListener('click', function () { removeZone(z); });
        li.appendChild(rm);
        chips.appendChild(li);
      });
      chips.hidden = !chosen.length;
    }

    function addZone(zone) {
      // Only ids the picker offers can be valid: a select whose value was set
      // programmatically to a missing zone reports ''.
      if (zones.indexOf(zone) === -1) return;
      if (chosen.indexOf(zone) !== -1 || zone === from.select.value) {
        box.show(ui('dup'), 'warn');
        return;
      }
      if (chosen.length >= MAX_ZONES) {
        box.show(ui('max'), 'warn');
        return;
      }
      chosen.push(zone);
      drawChips();
      render();
    }

    function removeZone(zone) {
      chosen = chosen.filter(function (z) { return z !== zone; });
      drawChips();
      render();
    }

    function render() {
      var raw = String(when.input.value || '').trim();
      if (!raw) { out.render([]); box.show(ui('empty'), 'warn'); return; }

      var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(raw);
      if (!m) { out.render([]); box.show(ui('noDate'), 'error'); return; }
      var y = +m[1], mo = +m[2], d = +m[3], h = +m[4], mi = +m[5];
      if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || y < 1000 || y > 9999) {
        out.render([]);
        box.show(ui('noDate'), 'error');
        return;
      }
      if (!chosen.length) { out.render([]); box.show(ui('noZones'), 'warn'); return; }

      var ref = from.select.value;
      var t;
      try { t = wallToUtc(y, mo, d, h, mi, ref); } catch (e) {
        out.render([]);
        box.show(ui('noDate'), 'error');
        return;
      }
      if (!isFinite(t)) { out.render([]); box.show(ui('noDate'), 'error'); return; }

      var rows = [];
      function row(zone, strong) {
        if (zones.indexOf(zone) === -1) return;
        try {
          var state = observesDst(t, zone) ? ui('dst') : ui('std');
          var name = shortName(t, zone);
          var value = fmt(t, zone) + ' \u00b7 ' + offsetLabel(t, zone) +
            (name ? ' \u00b7 ' + name : '') + ' (' + state + ')';
          rows.push([zone, value, strong ? 'is-strong' : '']);
        } catch (e) { /* an unusable zone id is skipped, never fatal */ }
      }
      row(ref, true);
      chosen.forEach(function (z) { row(z, false); });

      out.render(rows);
      box.show(ui('note'), '');
    }

    when.input.addEventListener('input', render);
    from.select.addEventListener('change', function () {
      if (chosen.indexOf(from.select.value) !== -1) {
        chosen = chosen.filter(function (z) { return z !== from.select.value; });
        drawChips();
      }
      render();
    });

    drawChips();
    render();
  }

  return { mount: mount };
})();
