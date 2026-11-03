window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function hexToRgb(hex) {
    var h = String(hex).trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(h)) {
      h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    }
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  function toHex(n) {
    var s = Math.max(0, Math.min(255, Math.round(n))).toString(16).toUpperCase();
    return s.length === 1 ? '0' + s : s;
  }

  function mix(rgb, target, p) {
    return {
      r: Math.round(rgb.r * (1 - p) + target * p),
      g: Math.round(rgb.g * (1 - p) + target * p),
      b: Math.round(rgb.b * (1 - p) + target * p)
    };
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var grid = TK.el('div', {
      style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin:12px 0'
    });
    var outWrap = TK.el('div', { class: 'tk-field' });
    var outArea = TK.el('textarea', {
      id: 'cp-out', rows: 6, readonly: '', 'aria-label': ui('output'), spellcheck: 'false'
    });
    outWrap.appendChild(TK.el('label', { for: 'cp-out' }, ui('output')));
    outWrap.appendChild(outArea);

    var base = TK.field({
      id: 'cp-base', label: ui('base'), value: '#336699', onInput: render
    });

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('copy'), function () {
      if (!outArea.value) { box.show(ui('nothingToCopy'), 'warn'); return; }
      TK.copy(outArea.value, function (ok) {
        box.show(ok ? ui('copied') : ui('copyFailed'), ok ? 'ok' : 'error');
      });
    }, { secondary: true }));

    host.appendChild(base.row);
    host.appendChild(box);
    host.appendChild(grid);
    host.appendChild(outWrap);
    host.appendChild(actions);

    function fail(text) { grid.textContent = ''; outArea.value = ''; box.show(text, 'error'); }

    function render() {
      if (!base.input.value.trim()) { fail(ui('empty')); return; }
      var rgb = hexToRgb(base.input.value);
      if (!rgb) { fail(ui('badHex')); return; }

      var defs = [
        [ui('tint50'), mix(rgb, 255, 0.5)],
        [ui('tint25'), mix(rgb, 255, 0.25)],
        [ui('baseName'), rgb],
        [ui('shade25'), mix(rgb, 0, 0.25)],
        [ui('shade50'), mix(rgb, 0, 0.5)]
      ];

      grid.textContent = '';
      var lines = [];
      defs.forEach(function (d) {
        var hex = '#' + toHex(d[1].r) + toHex(d[1].g) + toHex(d[1].b);
        var cell = TK.el('div', {
          style: 'border-radius:10px;overflow:hidden;border:1px solid #d8dde6;background:#fff'
        });
        cell.appendChild(TK.el('div', {
          style: 'height:74px;background:' + hex,
          'aria-hidden': 'true'
        }));
        var meta = TK.el('div', { style: 'padding:8px;font-size:13px;line-height:1.35' });
        meta.appendChild(TK.el('div', { style: 'font-weight:600' }, hex));
        meta.appendChild(TK.el('div', {}, d[0]));
        cell.appendChild(meta);
        grid.appendChild(cell);
        lines.push(d[0] + ': ' + hex + ' · rgb(' + d[1].r + ', ' + d[1].g + ', ' + d[1].b + ')');
      });

      outArea.value = lines.join('\n');
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
