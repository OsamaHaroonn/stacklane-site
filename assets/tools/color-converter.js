/* ============================================================
   Color converter — hex to RGB and HSL, with a swatch.

   Accepts #rgb, #rrggbb, bare hex digits and rgb(r, g, b). The
   conversion is plain arithmetic on the three channels; the
   swatch is a background colour, not an image, so nothing is
   loaded from anywhere.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function parseColor(raw) {
    var s = String(raw).trim().toLowerCase().replace(/^#/, '');

    if (/^[0-9a-f]{3}$/.test(s)) {
      return [parseInt(s[0] + s[0], 16), parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16)];
    }
    if (/^[0-9a-f]{6}$/.test(s)) {
      return [parseInt(s.substr(0, 2), 16), parseInt(s.substr(2, 2), 16), parseInt(s.substr(4, 2), 16)];
    }
    var m = /^rgba?\s*\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*\)$/.exec(s);
    if (m) {
      var v = [+m[1], +m[2], +m[3]];
      if (v.some(function (n) { return n > 255; })) return null;
      return v;
    }
    return null;
  }

  function toHsl(r, g, b) {
    var rn = r / 255, gn = g / 255, bn = b / 255;
    var max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    var l = (max + min) / 2;
    var h = 0, s = 0;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
      else if (max === gn) h = (bn - rn) / d + 2;
      else h = (rn - gn) / d + 4;
      h *= 60;
    }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var field = TK.field({
      id: 'colour-in', label: ui('input'), type: 'text',
      placeholder: ui('placeholder'), onInput: render
    });

    var swatch = TK.el('div', { class: 'colour-swatch', 'aria-hidden': 'true' });
    swatch.hidden = true;

    var actions = TK.el('div', { class: 'tk-actions' });
    var copyBtn = TK.btn(ui('copy'), function () {
      var hex = out.querySelector('.tk-row-value');
      if (!hex) { box.show(ui('empty'), 'warn'); return; }
      TK.copy(hex.textContent, function (ok) {
        box.show(ok ? ui('copied') : ui('copyFail'), ok ? '' : 'error');
      });
    });
    copyBtn.disabled = true;
    actions.appendChild(copyBtn);
    actions.appendChild(TK.btn(common('clear'), function () {
      field.input.value = '';
      render();
      field.input.focus();
    }, { secondary: true }));

    host.appendChild(field.row);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(swatch);
    host.appendChild(out);

    function render() {
      var raw = field.input.value;
      if (!raw.trim()) {
        swatch.hidden = true;
        copyBtn.disabled = true;
        out.render([]);
        box.show(ui('empty'), 'warn');
        return;
      }
      if (raw.length > 40) {
        swatch.hidden = true;
        copyBtn.disabled = true;
        out.render([]);
        box.show(ui('bad'), 'error');
        return;
      }

      var rgb = parseColor(raw);
      if (!rgb) {
        swatch.hidden = true;
        copyBtn.disabled = true;
        out.render([]);
        box.show(ui('bad'), 'error');
        return;
      }

      var r = rgb[0], g = rgb[1], b = rgb[2];
      var hex = '#' + [r, g, b].map(function (n) {
        return (n + 0x100).toString(16).substr(1);
      }).join('');
      var hsl = toHsl(r, g, b);

      swatch.style.backgroundColor = hex;
      swatch.hidden = false;
      copyBtn.disabled = false;

      out.render([
        [ui('hex'), hex, 'is-strong'],
        [ui('rgb'), 'rgb(' + r + ', ' + g + ', ' + b + ')'],
        [ui('hsl'), 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)'],
        [ui('working'), ui('workingText')
          .replace('{r}', r).replace('{g}', g).replace('{b}', b)
          .replace('{l}', hsl[2]).replace('{h}', hsl[0])]
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
