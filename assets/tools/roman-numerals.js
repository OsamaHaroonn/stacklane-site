window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var mode = TK.select({
      id: 'rn-mode',
      label: ui('mode'),
      value: 'n2r',
      options: [
        { value: 'n2r', label: ui('numToRoman') },
        { value: 'r2n', label: ui('romanToNum') }
      ],
      onChange: render
    });

    var input = TK.field({
      id: 'rn-value',
      label: ui('value'),
      value: '',
      placeholder: '1994',
      onInput: render
    });

    host.appendChild(mode.row);
    host.appendChild(input.row);
    host.appendChild(box);
    host.appendChild(out);

    var CANON = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
    var PAIRS = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];

    function toRoman(n) {
      var text = '', rest = n, parts = [];
      PAIRS.forEach(function (p) {
        var count = Math.floor(rest / p[0]);
        if (count > 0) {
          text += new Array(count + 1).join(p[1]);
          parts.push(p[1] + '(' + p[0] + ')');
          rest -= count * p[0];
        }
      });
      return { text: text, parts: parts.join(' + ') };
    }

    function fromRoman(s) {
      var V = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
      var total = 0, i = 0;
      while (i < s.length) {
        var cur = V[s.charAt(i)];
        var next = i + 1 < s.length ? V[s.charAt(i + 1)] : 0;
        if (cur < next) { total += next - cur; i += 2; }
        else { total += cur; i += 1; }
      }
      return total;
    }

    function fail(text) { out.render([]); box.show(text, 'error'); }

    function render() {
      var raw = String(input.input.value).trim();
      if (!raw) { out.render([]); box.show(ui('empty'), 'warn'); return; }

      if (mode.select.value === 'n2r') {
        if (/[^0-9.-]/.test(raw) || raw === '-' || raw === '.') {
          fail(ui('notNumber')); return;
        }
        var n = Number(raw);
        if (!isFinite(n)) { fail(ui('notNumber')); return; }
        if (Math.floor(n) !== n) { fail(ui('whole')); return; }
        if (n < 1 || n > 3999) { fail(ui('range')); return; }

        var r = toRoman(n);
        box.show(ui('note'), '');
        out.render([
          [ui('roman'), r.text, 'is-strong'],
          [ui('number'), TK.num(n, 0)],
          [ui('working'), r.parts]
        ]);
      } else {
        var s = raw.toUpperCase().replace(/\s+/g, '');
        if (!/^[IVXLCDM]+$/.test(s)) { fail(ui('badRoman')); return; }
        if (!CANON.test(s)) { fail(ui('notRoman')); return; }

        var value = fromRoman(s);
        var back = toRoman(value);
        box.show(ui('note'), '');
        out.render([
          [ui('roman'), s],
          [ui('number'), TK.num(value, 0), 'is-strong'],
          [ui('working'), back.parts]
        ]);
      }
    }

    render();
  }

  return { mount: mount };
})();