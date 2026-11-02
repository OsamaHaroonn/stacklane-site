window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';
  var MAX_LEN = 120;

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var value = TK.field({
      id: 'nb-value',
      label: ui('value'),
      value: '',
      placeholder: '255',
      onInput: render
    });

    var from = TK.select({
      id: 'nb-from',
      label: ui('from'),
      value: '10',
      options: [
        { value: '2', label: '2 — ' + ui('binary') },
        { value: '8', label: '8 — ' + ui('octal') },
        { value: '10', label: '10 — ' + ui('decimal') },
        { value: '16', label: '16 — ' + ui('hex') },
        { value: 'custom', label: ui('custom') }
      ],
      onChange: function () {
        customRow.hidden = from.select.value !== 'custom';
        render();
      }
    });

    var customBase = TK.field({
      id: 'nb-custom',
      label: ui('customBase'),
      type: 'number',
      value: 36,
      min: 2,
      max: 36,
      step: 1,
      onInput: render
    });
    var customRow = customBase.row;
    customRow.hidden = true;

    host.appendChild(value.row);
    host.appendChild(from.row);
    host.appendChild(customRow);
    host.appendChild(box);
    host.appendChild(out);

    function parseBig(s, base) {
      var n = BigInt(0);
      for (var i = 0; i < s.length; i++) {
        var d = DIGITS.indexOf(s.charAt(i));
        if (d < 0 || d >= base) return null;
        n = n * BigInt(base) + BigInt(d);
      }
      return n;
    }

    function fmt(n, base) {
      var s = n.toString(base);
      return base <= 10 ? s : s.toUpperCase();
    }

    function fail(text) { out.render([]); box.show(text, 'error'); }

    function render() {
      var raw = String(value.input.value).trim().toLowerCase().replace(/\s+/g, '');
      if (!raw) { out.render([]); box.show(ui('empty'), 'warn'); return; }
      if (raw.charAt(0) === '-') { fail(ui('negative')); return; }
      if (raw.indexOf('.') !== -1 || raw.indexOf(',') !== -1) { fail(ui('fractional')); return; }
      if (raw.length > MAX_LEN) { fail(ui('tooLong', { max: String(MAX_LEN) })); return; }

      var base = from.select.value === 'custom'
        ? parseInt(customBase.input.value, 10)
        : parseInt(from.select.value, 10);
      if (!isFinite(base) || base < 2 || base > 36) { fail(ui('badBase')); return; }

      var n = parseBig(raw, base);
      if (n === null) { fail(ui('badDigit')); return; }

      var rows = [
        [ui('binary'), fmt(n, 2)],
        [ui('octal'), fmt(n, 8)],
        [ui('decimal'), fmt(n, 10), 'is-strong'],
        [ui('hex'), fmt(n, 16)],
        [ui('base36'), fmt(n, 36)]
      ];
      if (base !== 2 && base !== 8 && base !== 10 && base !== 16 && base !== 36) {
        rows.push([ui('base') + ' (' + base + ')', fmt(n, base)]);
      }

      box.show(ui('note'), '');
      out.render(rows);
    }

    render();
  }

  return { mount: mount };
})();