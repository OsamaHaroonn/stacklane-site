/* ============================================================
   CSS gradient generator — colour stops plus an angle become a
   linear-gradient rule, previewed on a live sample and offered
   as copyable CSS.

   The preview uses the same string that is copied, so what you
   see is exactly what the rule produces.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  var NAMED = {
    black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000',
    blue: '#0000ff', yellow: '#ffff00', orange: '#ffa500', purple: '#800080',
    gray: '#808080', grey: '#808080', teal: '#008080', navy: '#000080',
    pink: '#ffc0cb', brown: '#a52a2a', lime: '#00ff00', cyan: '#00ffff',
    magenta: '#ff00ff', gold: '#ffd700', silver: '#c0c0c0', indigo: '#4b0082'
  };

  /* Split on commas and new lines, but never inside parentheses, so
     rgba(0, 0, 0, 0.5) stays one stop. */
  function splitStops(raw) {
    var parts = [];
    var buf = '';
    var depth = 0;
    var s = String(raw);
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === '(') depth++;
      else if (c === ')') depth = Math.max(0, depth - 1);
      if ((c === ',' || c === '\n') && depth === 0) {
        parts.push(buf);
        buf = '';
      } else {
        buf += c;
      }
    }
    parts.push(buf);
    return parts.map(function (p) { return p.trim(); }).filter(Boolean);
  }

  function normalise(raw) {
    var c = String(raw).trim().toLowerCase();
    if (!c) return null;
    if (NAMED[c]) return NAMED[c];
    if (/^#?[0-9a-f]{3}$/.test(c)) {
      c = c.replace('#', '');
      return '#' + c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    if (/^#?[0-9a-f]{6}$/.test(c)) return '#' + c.replace('#', '');
    var rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(0|1|0?\.\d+)\s*)?\)$/.exec(c);
    if (rgb) {
      var ch = [rgb[1], rgb[2], rgb[3]].map(Number);
      if (ch.every(function (n) { return n >= 0 && n <= 255; })) {
        var a = rgb[4] === undefined ? 1 : parseFloat(rgb[4]);
        return 'rgba(' + ch.join(', ') + ', ' + a + ')';
      }
    }
    return null;
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();

    var preview = TK.el('div', { class: 'gradient-preview', role: 'img', 'aria-label': ui('preview') });
    var previewWrap = TK.el('div', { class: 'tk-sub' });
    previewWrap.appendChild(TK.el('span', { class: 'tk-subhead' }, ui('preview')));
    previewWrap.appendChild(preview);

    var colors = TK.textarea({
      id: 'cg-stops',
      label: ui('colors'),
      rows: 3,
      placeholder: '#1d4ed8, #7c3aed, #f59e0b',
      onInput: render
    });
    colors.textarea.value = '#1d4ed8, #7c3aed, #f59e0b';
    var hint = TK.el('p', { class: 'note' }, ui('hint'));
    colors.row.appendChild(hint);

    var angle = TK.select({
      id: 'cg-angle',
      label: ui('angle'),
      value: '135',
      options: [
        { value: '0', label: ui('deg0') },
        { value: '45', label: ui('deg45') },
        { value: '90', label: ui('deg90') },
        { value: '135', label: ui('deg135') },
        { value: '180', label: ui('deg180') },
        { value: '225', label: ui('deg225') },
        { value: '270', label: ui('deg270') },
        { value: '315', label: ui('deg315') },
        { value: 'to right', label: ui('toRight') },
        { value: 'to bottom', label: ui('toBottom') },
        { value: 'to bottom right', label: ui('toBottomRight') },
        { value: 'to bottom left', label: ui('toBottomLeft') }
      ],
      onChange: render
    });

    var outWrap = TK.el('div', { class: 'tk-field' });
    var outArea = TK.el('textarea', {
      id: 'cg-out', rows: 2, readonly: '', 'aria-label': ui('output'), spellcheck: 'false'
    });
    outWrap.appendChild(TK.el('label', { for: 'cg-out' }, ui('output')));
    outWrap.appendChild(outArea);

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(ui('copy'), function () {
      var code = outArea.value;
      if (!code) { box.show(ui('nothingToCopy'), 'warn'); return; }
      TK.copy(code, function (ok) {
        box.show(ok ? ui('copied') : ui('copyFailed'), ok ? 'ok' : 'error');
      });
    }));

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(colors.row);
    grid.appendChild(angle.row);

    host.appendChild(grid);
    host.appendChild(box);
    host.appendChild(previewWrap);
    host.appendChild(outWrap);
    host.appendChild(actions);

    function render() {
      var parts = splitStops(colors.textarea.value);

      var stops = [];
      for (var i = 0; i < parts.length; i++) {
        var c = normalise(parts[i]);
        if (!c) {
          preview.style.backgroundImage = 'none';
          outArea.value = '';
          box.show(ui('badColor').replace('{value}', parts[i]), 'error');
          return;
        }
        stops.push(c);
      }

      if (stops.length < 2) {
        preview.style.backgroundImage = 'none';
        outArea.value = '';
        box.show(ui('needTwo'), 'warn');
        return;
      }

      var a = angle.select.value;
      var dir = /\bto\b/.test(a) ? a : a + 'deg';
      var rule = 'linear-gradient(' + dir + ', ' + stops.join(', ') + ')';
      preview.style.backgroundImage = rule;
      outArea.value = 'background-image: ' + rule + ';';
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
