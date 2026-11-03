/* ============================================================
   Ratio calculator — simplify a ratio, scale it, or solve the
   missing value of a proportion. Zero is refused on every
   side because a ratio with a zero side carries no relation.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function decimals(str) {
    var m = /\.(\d+)$/.exec(str);
    return m ? m[1].length : 0;
  }
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a;
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var mode = TK.select({
      id: 'ra-mode', label: ui('mode'), value: 'simplify', onChange: render,
      options: [
        { value: 'simplify', label: ui('simplify') },
        { value: 'scale', label: ui('scale') },
        { value: 'solve', label: ui('solve') }
      ]
    });
    var a = TK.field({ id: 'ra-a', label: ui('a'), value: '42', onInput: render });
    var b = TK.field({ id: 'ra-b', label: ui('b'), value: '58', onInput: render });
    var factor = TK.field({ id: 'ra-f', label: ui('factor'), value: '4', onInput: render });
    var c = TK.field({ id: 'ra-c', label: ui('c'), value: '18', onInput: render });

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(a.row);
    grid.appendChild(b.row);

    host.appendChild(mode.row);
    host.appendChild(grid);
    host.appendChild(factor.row);
    host.appendChild(c.row);
    host.appendChild(box);
    host.appendChild(out);

    function fail(text) { out.render([]); box.show(text, 'error'); }

    function number(field) {
      var v = field.input.value.trim();
      if (v === '') return { empty: true };
      var n = Number(v);
      if (!isFinite(n)) return { bad: true };
      return { n: n };
    }

    function render() {
      var kind = mode.select.value;
      factor.row.hidden = kind !== 'scale';
      c.row.hidden = kind !== 'solve';

      var ra = number(a), rb = number(b);
      if (ra.empty || rb.empty || (kind === 'scale' && number(factor).empty) ||
          (kind === 'solve' && number(c).empty)) {
        fail(ui('empty'));
        return;
      }
      if (ra.bad || rb.bad || (kind === 'scale' && number(factor).bad) ||
          (kind === 'solve' && number(c).bad)) {
        fail(ui('notNumber'));
        return;
      }
      if (kind === 'scale') {
        var f = number(factor).n;
        if (ra.n === 0 || rb.n === 0 || f === 0) { fail(ui('zero')); return; }
      } else if (kind === 'solve') {
        var cc = number(c).n;
        if (ra.n === 0 || rb.n === 0 || cc === 0) { fail(ui('zero')); return; }
      } else {
        if (ra.n === 0 || rb.n === 0) { fail(ui('zero')); return; }
      }

      if (kind === 'simplify') {
        /* Scale both sides to integers so decimals simplify too. */
        var k = Math.max(decimals(a.input.value.trim()), decimals(b.input.value.trim()));
        var mul = Math.pow(10, k);
        var ai = Math.round(ra.n * mul), bi = Math.round(rb.n * mul);
        if (!isFinite(ai) || !isFinite(bi) ||
            Math.abs(ai) > 9007199254740991 || Math.abs(bi) > 9007199254740991) {
          fail(ui('tooBig')); return;
        }
        var g = gcd(ai, bi) || 1;
        var si = ai / g, sj = bi / g;
        if (!isFinite(si + sj) || si + sj > 9007199254740991) {
          fail(ui('tooBig')); return;
        }
        out.render([
          [ui('simplest'), si + ':' + sj, 'is-strong'],
          [ui('totalParts'), String(si + sj)]
        ]);
      } else if (kind === 'scale') {
        var f2 = number(factor).n;
        var sa = ra.n * f2, sb = rb.n * f2, st = (ra.n + rb.n) * f2;
        if (!isFinite(sa) || !isFinite(sb) || !isFinite(st)) { fail(ui('tooBig')); return; }
        out.render([
          [ui('scaled'), TK.num(sa, 4) + ':' + TK.num(sb, 4), 'is-strong'],
          [ui('totalParts'), TK.num(st, 4)]
        ]);
      } else {
        var c2 = number(c).n;
        var x = rb.n * c2 / ra.n;
        if (!isFinite(x)) { fail(ui('tooBig')); return; }
        out.render([
          [ui('missing'), TK.num(x, 4), 'is-strong'],
          [ui('proportion'), TK.num(ra.n, 4) + ':' + TK.num(rb.n, 4) + ' = ' +
            TK.num(c2, 4) + ':' + TK.num(x, 4)]
        ]);
      }
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();