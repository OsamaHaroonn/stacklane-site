/* ============================================================
   Percentage change calculator — the change between an original
   and a new value, the absolute difference and its direction.

   Percent change is (new - original) / |original| * 100, so the
   sign always means "increased" or "decreased" even when the
   original value is negative. A change from zero is undefined
   rather than infinite, and is reported as such.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function parseNum(raw) {
    var s = String(raw).trim().replace(/,/g, '');
    if (!s) return { empty: true };
    if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return { bad: true };
    var n = parseFloat(s);
    if (!isFinite(n)) return { bad: true };
    return { value: n };
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows({ note: ui('working') });

    var original = TK.field({
      id: 'pc-original', label: ui('original'), inputmode: 'decimal',
      placeholder: '0', onInput: render
    });
    var updated = TK.field({
      id: 'pc-new', label: ui('new'), inputmode: 'decimal',
      placeholder: '0', onInput: render
    });

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(original.row);
    grid.appendChild(updated.row);

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(ui('swap'), swap, { secondary: true }));
    actions.appendChild(TK.btn(ui('calculate'), render));

    host.appendChild(grid);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    function swap() {
      var tmp = original.input.value;
      original.input.value = updated.input.value;
      updated.input.value = tmp;
      render();
    }

    function render() {
      var a = parseNum(original.input.value);
      var b = parseNum(updated.input.value);

      if (a.empty || b.empty) {
        out.render([]);
        box.show(ui('empty'), 'warn');
        return;
      }
      if (a.bad || b.bad) {
        out.render([]);
        box.show(ui('badNumber'), 'error');
        return;
      }

      var diff = b.value - a.value;

      if (a.value === 0) {
        out.render([
          [ui('difference'), TK.num(diff, 2), 'is-strong'],
          [ui('direction'), diff === 0 ? ui('noChange') : (diff > 0 ? ui('increase') : ui('decrease'))],
          [ui('change'), ui('zeroBase')],
          [ui('working'), ui('formulaZero')]
        ]);
        box.show(ui('zeroBaseNote'), 'warn');
        return;
      }

      var pct = (diff / Math.abs(a.value)) * 100;
      var dir = diff === 0 ? ui('noChange') : (diff > 0 ? ui('increase') : ui('decrease'));
      /* The sentence needs an article that agrees with the noun
         ("an increase" / "a decrease"), which the bare label cannot give. */
      var phrase = diff === 0 ? ui('phraseNoChange')
        : (diff > 0 ? ui('phraseIncrease') : ui('phraseDecrease'));

      out.render([
        [ui('change'), (pct > 0 ? '+' : '') + TK.num(pct, 2) + '%', 'is-strong'],
        [ui('difference'), (diff > 0 ? '+' : '') + TK.num(diff, 2)],
        [ui('direction'), dir],
        [ui('summary'), ui('sentence')
          .replace('{phrase}', phrase)
          .replace('{pct}', TK.num(Math.abs(pct), 2) + '%')
          .replace('{old}', TK.num(a.value, 2))
          .replace('{new}', TK.num(b.value, 2))],
        [ui('working'), ui('formula')]
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
