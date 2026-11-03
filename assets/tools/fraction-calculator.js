/* ============================================================
   Fraction calculator — add, subtract, multiply and divide two
   fractions with exact integer arithmetic (BigInt), then show
   the raw result, the reduced fraction, the mixed number and
   the decimal. Zero denominators are refused.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var INT = /^-?\d+$/;

  function abs(n) { return n < 0n ? -n : n; }
  function gcd(a, b) {
    a = abs(a); b = abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a;
  }
  function lcm(a, b) { return abs(a * b) / gcd(a, b); }

  /* Reduce and keep the denominator positive. */
  function reduce(n, d) {
    var g = gcd(n, d) || 1n;
    n = n / g; d = d / g;
    if (d < 0n) { n = -n; d = -d; }
    return { n: n, d: d };
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var n1 = TK.field({ id: 'fr-n1', label: ui('n1'), value: '6', inputmode: 'numeric', onInput: render });
    var d1 = TK.field({ id: 'fr-d1', label: ui('d1'), value: '8', inputmode: 'numeric', onInput: render });
    var op = TK.select({
      id: 'fr-op', label: ui('op'), value: 'add', onChange: render,
      options: [
        { value: 'add', label: ui('add') },
        { value: 'sub', label: ui('sub') },
        { value: 'mul', label: ui('mul') },
        { value: 'div', label: ui('div') }
      ]
    });
    var n2 = TK.field({ id: 'fr-n2', label: ui('n2'), value: '3', inputmode: 'numeric', onInput: render });
    var d2 = TK.field({ id: 'fr-d2', label: ui('d2'), value: '4', inputmode: 'numeric', onInput: render });

    var gridA = TK.el('div', { class: 'tk-grid' });
    gridA.appendChild(n1.row); gridA.appendChild(d1.row);
    var gridB = TK.el('div', { class: 'tk-grid' });
    gridB.appendChild(n2.row); gridB.appendChild(d2.row);

    host.appendChild(gridA);
    host.appendChild(op.row);
    host.appendChild(gridB);
    host.appendChild(box);
    host.appendChild(out);

    function fail(text) { out.render([]); box.show(text, 'error'); }

    function render() {
      var vals = [n1.input.value.trim(), d1.input.value.trim(), n2.input.value.trim(), d2.input.value.trim()];
      if (vals.some(function (v) { return v === ''; })) {
        fail(ui('empty'));
        return;
      }
      if (!vals.every(function (v) { return INT.test(v); })) {
        fail(ui('notInteger'));
        return;
      }
      var a = BigInt(vals[0]), b = BigInt(vals[1]), c = BigInt(vals[2]), e = BigInt(vals[3]);
      if (b === 0n || e === 0n) { fail(ui('zero')); return; }
      var mode = op.select.value;
      if (mode === 'div' && c === 0n) { fail(ui('divZero')); return; }

      var rn, rd;
      if (mode === 'add' || mode === 'sub') {
        var l = lcm(b, e);
        rn = mode === 'add' ? a * (l / b) + c * (l / e) : a * (l / b) - c * (l / e);
        rd = l;
      } else if (mode === 'mul') {
        rn = a * c; rd = b * e;
      } else {
        rn = a * e; rd = b * c;
      }

      var raw = rn.toString() + '/' + rd.toString();
      var r = reduce(rn, rd);

      var whole = r.n / r.d;
      var rem = r.n - whole * r.d;
      var mixed;
      if (rem === 0n) mixed = whole.toString();
      else if (abs(whole) > 0n) {
        mixed = whole.toString() + ' ' + abs(rem).toString() + '/' + abs(r.d).toString();
      } else {
        mixed = '';
      }

      var dec = Number(r.n) / Number(r.d);
      if (!isFinite(dec)) dec = NaN;

      out.render([
        [ui('result'), raw, 'is-strong'],
        [ui('simplest'), r.n.toString() + '/' + r.d.toString()],
        [ui('mixed'), mixed],
        [ui('decimal'), TK.num(dec, 4)]
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();