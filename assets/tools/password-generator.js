/* ============================================================
   Password generator — random characters from the browser's
   cryptographic source (crypto.getRandomValues), with an honest
   entropy figure in bits. Nothing is stored, sent or logged.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  var SETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.?/'
  };

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var lengthField = TK.field({
      id: 'pw-length',
      label: ui('labelLength'),
      hint: ui('lengthValue'),
      type: 'range',
      value: 20,
      min: 4,
      max: 128,
      step: 1
    });
    var lengthOut = TK.el('span', { class: 'tk-inline-value' }, '20');
    lengthField.row.appendChild(lengthOut);

    var checks = {};
    ['upper', 'lower', 'digits', 'symbols'].forEach(function (key) {
      checks[key] = TK.checkbox({
        id: 'pw-' + key,
        label: ui(key === 'digits' ? 'numbers' : key === 'upper' ? 'uppercase' : key === 'lower' ? 'lowercase' : 'symbols'),
        checked: key !== 'symbols',
        onChange: generate
      });
    });

    var field = TK.field({ id: 'pw-out', label: ui('output'), type: 'text', value: '' });
    field.input.setAttribute('readonly', '');
    field.input.className = 'tk-password';

    var copyBtn = TK.btn(ui('copy'), function () {
      TK.copy(field.input.value, function (ok) {
        box.show(ok ? common('copied') : common('copyFailed'), ok ? 'ok' : 'error');
      });
    }, { secondary: true });
    copyBtn.hidden = true;

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(ui('generate'), generate));
    actions.appendChild(copyBtn);

    host.appendChild(lengthField.row);
    var setGrid = TK.el('fieldset', { class: 'tk-checks' });
    setGrid.appendChild(TK.el('legend', {}, ui('sets')));
    Object.keys(checks).forEach(function (k) { setGrid.appendChild(checks[k].row); });
    host.appendChild(setGrid);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(field.row);
    host.appendChild(out);

    lengthField.input.addEventListener('input', function () {
      lengthOut.textContent = lengthField.input.value;
      generate();
    });

    /* Uniform index in [0, max) without modulo bias: redraw the
       32-bit value when it falls in the rejected tail. */
    function randomIndex(max) {
      var limit = Math.floor(4294967296 / max) * max;
      var buf = new Uint32Array(1);
      var v;
      do {
        crypto.getRandomValues(buf);
        v = buf[0];
      } while (v >= limit);
      return v % max;
    }

    function generate() {
      var length = Math.max(4, Math.min(128, parseInt(lengthField.input.value, 10) || 20));
      lengthOut.textContent = String(length);

      var alphabet = '';
      ['upper', 'lower', 'digits', 'symbols'].forEach(function (key) {
        if (checks[key].input.checked) alphabet += SETS[key];
      });

      copyBtn.hidden = true;
      out.render([]);

      if (!alphabet) {
        field.input.value = '';
        box.show(ui('empty'), 'error');
        return;
      }
      box.clear();

      var pw = '';
      for (var i = 0; i < length; i++) {
        pw += alphabet.charAt(randomIndex(alphabet.length));
      }
      field.input.value = pw;
      copyBtn.hidden = false;

      var bits = Math.round(length * Math.log(alphabet.length) / Math.LN2);
      var rating = bits < 40 ? ui('ratingWeak')
        : bits < 60 ? ui('ratingFair')
        : bits < 100 ? ui('ratingStrong')
        : ui('ratingVeryStrong');
      var cls = bits < 40 ? 'is-bad' : bits < 60 ? 'is-warn' : bits < 100 ? 'is-ok' : 'is-good';

      out.render([
        [ui('strength'), rating + ' — ' + bits + ' ' + ui('bits'), cls]
      ]);
    }

    generate();
  }

  return { mount: mount };
})();