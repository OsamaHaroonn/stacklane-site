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

  function intOrNull(v) {
    var s = String(v).trim();
    if (!/^-?\d+$/.test(s)) return null;
    var n = parseInt(s, 10);
    return isFinite(n) ? n : null;
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var preview = TK.el('div', {
      style: 'display:flex;align-items:center;justify-content:center;padding:28px 16px;' +
        'margin:12px 0;background:#f4f5f7;border-radius:12px;min-height:150px'
    });
    var swatch = TK.el('div', {
      style: 'width:120px;height:90px;border-radius:10px;background:#ffffff;' +
        'display:flex;align-items:center;justify-content:center;font-size:13px;color:#5b6373',
      'aria-hidden': 'true'
    }, 'shadow');
    preview.appendChild(swatch);

    var outWrap = TK.el('div', { class: 'tk-field' });
    var outArea = TK.el('textarea', {
      id: 'bs-out', rows: 3, readonly: '', 'aria-label': ui('output'), spellcheck: 'false'
    });
    outWrap.appendChild(TK.el('label', { for: 'bs-out' }, ui('output')));
    outWrap.appendChild(outArea);

    var x = TK.field({ id: 'bs-x', label: ui('x'), value: '2', inputmode: 'numeric', onInput: render });
    var y = TK.field({ id: 'bs-y', label: ui('y'), value: '4', inputmode: 'numeric', onInput: render });
    var blur = TK.field({ id: 'bs-blur', label: ui('blur'), value: '8', inputmode: 'numeric', onInput: render });
    var spread = TK.field({ id: 'bs-spread', label: ui('spread'), value: '0', inputmode: 'numeric', onInput: render });
    var color = TK.field({ id: 'bs-color', label: ui('color'), value: '#000000', onInput: render });
    var alpha = TK.field({ id: 'bs-alpha', label: ui('opacity'), value: '0.2', inputmode: 'decimal', onInput: render });
    var inset = TK.checkbox({ id: 'bs-inset', label: ui('inset'), onChange: render });

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(x.row);
    grid.appendChild(y.row);
    grid.appendChild(blur.row);
    grid.appendChild(spread.row);
    grid.appendChild(color.row);
    grid.appendChild(alpha.row);

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('copy'), function () {
      if (!outArea.value) { box.show(ui('nothingToCopy'), 'warn'); return; }
      TK.copy(outArea.value, function (ok) {
        box.show(ok ? ui('copied') : ui('copyFailed'), ok ? 'ok' : 'error');
      });
    }, { secondary: true }));

    host.appendChild(grid);
    host.appendChild(inset.row);
    host.appendChild(box);
    host.appendChild(preview);
    host.appendChild(outWrap);
    host.appendChild(actions);

    function fail(text) { outArea.value = ''; swatch.style.boxShadow = 'none'; box.show(text, 'error'); }

    function render() {
      var nx = intOrNull(x.input.value), ny = intOrNull(y.input.value);
      var nb = intOrNull(blur.input.value), ns = intOrNull(spread.input.value);
      if (x.input.value.trim() === '' || y.input.value.trim() === '' ||
          blur.input.value.trim() === '' || spread.input.value.trim() === '') {
        fail(ui('empty'));
        return;
      }
      if (nx === null || ny === null || nb === null || ns === null) { fail(ui('badNumber')); return; }
      if (Math.abs(nx) > 100 || Math.abs(ny) > 100) { fail(ui('offsetRange')); return; }
      if (nb < 0 || nb > 200) { fail(ui('blurRange')); return; }
      if (Math.abs(ns) > 100) { fail(ui('spreadRange')); return; }

      var rgb = hexToRgb(color.input.value);
      if (!rgb) { fail(ui('badColor')); return; }

      var aRaw = String(alpha.input.value).trim();
      if (!/^\d*\.?\d+$/.test(aRaw)) { fail(ui('badOpacity')); return; }
      var a = parseFloat(aRaw);
      if (!isFinite(a) || a < 0 || a > 1) { fail(ui('opacityRange')); return; }

      var val = (inset.input.checked ? 'inset ' : '') +
        nx + 'px ' + ny + 'px ' + nb + 'px ' + ns + 'px ' +
        'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + a + ')';
      var css = 'box-shadow: ' + val + ';';

      outArea.value = css;
      swatch.style.boxShadow = val;
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
