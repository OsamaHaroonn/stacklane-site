/* ============================================================
   Barcode generator — Code 128, code set B, drawn as SVG.

   Code 128 encodes each symbol as six elements (bar/space widths,
   alternating and starting with a bar) totalling 11 modules. The
   stop pattern is seven elements totalling 13 modules.

   Structure of every symbol:
     START B (104) · one value per character · checksum · STOP
   The checksum is (104 + Σ position × value) mod 103, where the
   first data character is at position 1.

   Code set B covers printable ASCII 32–126, so value = charCode-32.
   Characters outside that range cannot be encoded in set B and are
   rejected rather than silently dropped.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  /* Element widths for values 0–105 (six numbers each, summing to 11)
     and 106, the stop pattern (seven numbers, summing to 13). */
  var PATTERNS = [
    '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
    '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
    '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
    '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
    '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
    '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
    '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
    '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
    '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
    '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
    '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
    '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
    '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412',
    '211214', '211232', '2331112'
  ];

  var START_B = 104;
  var STOP = 106;
  var QUIET = 10;          /* modules of quiet zone required either side */
  var MAX_CHARS = 60;      /* wider than this is impractical on a label */

  function encodeValues(text) {
    var values = [START_B];
    var sum = START_B;
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      if (code < 32 || code > 126) return { badChar: text.charAt(i) };
      var v = code - 32;
      values.push(v);
      sum += (i + 1) * v;
    }
    values.push(sum % 103);
    values.push(STOP);
    return { values: values };
  }

  /* Turn symbol values into absolute module runs, so the same data can
     be drawn as SVG elements and serialised as markup. */
  function toRuns(values) {
    var runs = [];
    var x = QUIET;
    values.forEach(function (v) {
      var widths = PATTERNS[v];
      for (var i = 0; i < widths.length; i++) {
        var w = +widths[i];
        if (i % 2 === 0) runs.push({ x: x, w: w });   /* even index = bar */
        x += w;
      }
    });
    return { bars: runs, modules: x + QUIET };
  }

  function xmlEscape(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function buildSvg(text, moduleW, height, withText) {
    var enc = encodeValues(text);
    if (enc.badChar) return null;
    var runs = toRuns(enc.values);
    var width = runs.modules * moduleW;
    var textH = withText ? Math.round(height * 0.22) : 0;
    var totalH = height + textH;
    var parts = [];
    parts.push('<svg xmlns="http://www.w3.org/2000/svg" role="img" ' +
      'aria-label="Barcode ' + xmlEscape(text) + '" ' +
      'width="' + width + '" height="' + totalH + '" ' +
      'viewBox="0 0 ' + width + ' ' + totalH + '">');
    parts.push('<rect width="' + width + '" height="' + totalH + '" fill="#ffffff"/>');
    runs.bars.forEach(function (b) {
      parts.push('<rect x="' + (b.x * moduleW) + '" y="0" width="' + (b.w * moduleW) +
        '" height="' + height + '" fill="#000000"/>');
    });
    if (withText) {
      parts.push('<text x="' + Math.round(width / 2) + '" y="' + (height + Math.round(textH * 0.8)) +
        '" text-anchor="middle" font-family="ui-monospace, Menlo, Consolas, monospace" ' +
        'font-size="' + Math.round(textH * 0.78) + '" fill="#111111">' +
        xmlEscape(text) + '</text>');
    }
    parts.push('</svg>');
    return { markup: parts.join(''), width: width, height: totalH, values: enc.values };
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var last = null;

    var value = TK.field({
      id: 'bc-value',
      label: ui('value'),
      hint: ui('valueHint'),
      value: 'STACKLANE-2026',
      onInput: render
    });

    var height = TK.field({
      id: 'bc-height', label: ui('height'), type: 'number',
      value: 80, min: 40, max: 240, step: 10, onInput: render
    });

    var moduleWidth = TK.select({
      id: 'bc-module',
      label: ui('moduleWidth'),
      value: '2',
      options: [
        { value: '1', label: ui('mw1') },
        { value: '2', label: ui('mw2') },
        { value: '3', label: ui('mw3') },
        { value: '4', label: ui('mw4') }
      ],
      onChange: render
    });

    var withText = TK.checkbox({ id: 'bc-text', label: ui('showText'), checked: true, onChange: render });

    var preview = TK.el('div', { class: 'barcode-preview' });

    var outWrap = TK.el('div', { class: 'tk-field' });
    var outArea = TK.el('textarea', {
      id: 'bc-out', rows: 4, readonly: '', 'aria-label': ui('output'), spellcheck: 'false'
    });
    outWrap.appendChild(TK.el('label', { for: 'bc-out' }, ui('output')));
    outWrap.appendChild(outArea);

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(ui('download'), function () {
      if (!last) { box.show(ui('nothing'), 'warn'); return; }
      TK.download(new Blob([last.markup], { type: 'image/svg+xml' }), 'barcode.svg');
    }));
    actions.appendChild(TK.btn(ui('copy'), function () {
      if (!last) { box.show(ui('nothing'), 'warn'); return; }
      TK.copy(last.markup, function (ok) {
        box.show(ok ? ui('copied') : ui('copyFailed'), ok ? 'ok' : 'error');
      });
    }, { secondary: true }));

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(value.row);
    grid.appendChild(moduleWidth.row);
    grid.appendChild(height.row);

    host.appendChild(grid);
    host.appendChild(withText.row);
    host.appendChild(box);
    host.appendChild(preview);
    host.appendChild(outWrap);
    host.appendChild(actions);

    function fail(text) {
      last = null;
      preview.textContent = '';
      outArea.value = '';
      box.show(text, 'error');
    }

    function render() {
      var text = value.input.value;

      if (!text) {
        last = null;
        preview.textContent = '';
        outArea.value = '';
        box.show(ui('empty'), 'warn');
        return;
      }
      if (text.length > MAX_CHARS) { fail(ui('tooLong').replace('{max}', MAX_CHARS)); return; }

      for (var i = 0; i < text.length; i++) {
        var c = text.charCodeAt(i);
        if (c < 32 || c > 126) {
          fail(ui('badChar').replace('{char}', text.charAt(i)));
          return;
        }
      }

      var h = parseInt(height.input.value, 10);
      if (!isFinite(h) || h < 40 || h > 240) { fail(ui('badHeight')); return; }

      var w = parseInt(moduleWidth.select.value, 10) || 2;
      var built = buildSvg(text, w, h, withText.input.checked);
      if (!built) { fail(ui('badChar').replace('{char}', '?')); return; }

      last = built;
      preview.innerHTML = built.markup;
      outArea.value = built.markup;
      box.show(ui('note')
        .replace('{modules}', built.width / w)
        .replace('{checksum}', built.values[built.values.length - 2]), '');
    }

    render();
  }

  return { mount: mount };
})();
