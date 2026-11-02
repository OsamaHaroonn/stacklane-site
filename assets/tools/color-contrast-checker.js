window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function parseHex(str) {
    var s = String(str || '').trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(s)) {
      s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
    }
    if (!/^[0-9a-f]{6}$/i.test(s)) return null;
    return [
      parseInt(s.slice(0, 2), 16),
      parseInt(s.slice(2, 4), 16),
      parseInt(s.slice(4, 6), 16)
    ];
  }

  function channel(c) {
    var v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }

  function luminance(rgb) {
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var fg = TK.field({ id: 'cc-fg', label: ui('fg'), value: '#777777', onInput: render });
    var bg = TK.field({ id: 'cc-bg', label: ui('bg'), value: '#ffffff', onInput: render });

    var swap = TK.btn(ui('swap'), function () {
      var a = fg.input.value;
      fg.input.value = bg.input.value;
      bg.input.value = a;
      render();
    }, { secondary: true });

    host.appendChild(fg.row);
    host.appendChild(bg.row);
    host.appendChild(swap);
    host.appendChild(box);
    host.appendChild(out);

    function fail(text) { out.render([]); box.show(text, 'error'); }

    function verdict(ratio, limit) { return ratio >= limit ? ui('pass') : ui('fail'); }

    function render() {
      if (!fg.input.value.trim() || !bg.input.value.trim()) {
        out.render([]); box.show(ui('empty'), 'warn'); return;
      }
      var a = parseHex(fg.input.value);
      if (!a) { fail(ui('bad', { which: ui('fg') })); return; }
      var b = parseHex(bg.input.value);
      if (!b) { fail(ui('bad', { which: ui('bg') })); return; }

      var la = luminance(a), lb = luminance(b);
      var hi = Math.max(la, lb), lo = Math.min(la, lb);
      var ratio = (hi + 0.05) / (lo + 0.05);

      box.show(ui('note'), '');
      out.render([
        [ui('ratio'), ratio.toFixed(2) + ':1', 'is-strong'],
        [ui('working'), '(' + hi.toFixed(4) + ' + 0.05) ÷ (' + lo.toFixed(4) + ' + 0.05)'],
        [ui('aaNormal'), verdict(ratio, 4.5)],
        [ui('aaLarge'), verdict(ratio, 3)],
        [ui('aaaNormal'), verdict(ratio, 7)],
        [ui('aaaLarge'), verdict(ratio, 4.5)],
        [ui('lumFg'), la.toFixed(4)],
        [ui('lumBg'), lb.toFixed(4)]
      ]);
    }

    render();
  }

  return { mount: mount };
})();