window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_LEN = 1000;

  function fixed(v, digits) {
    if (!isFinite(v)) return '—';
    return v.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function classesOf(s) {
    return {
      lower: /[a-z]/.test(s),
      upper: /[A-Z]/.test(s),
      digit: /[0-9]/.test(s),
      symbol: /[^A-Za-z0-9\s]/.test(s),
      space: /\s/.test(s)
    };
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();
    var barWrap = TK.el('div', {
      style: 'height:10px;background:#e6e9ef;border-radius:999px;overflow:hidden;margin:10px 0',
      'aria-hidden': 'true'
    });
    var bar = TK.el('div', {
      style: 'height:100%;width:0;background:#2f5bd7;transition:none'
    });
    barWrap.appendChild(bar);

    var field = TK.field({
      id: 'ps-input',
      label: ui('password'),
      type: 'password',
      placeholder: ui('placeholder'),
      onInput: render
    });
    // The value is never submitted anywhere; turning autocomplete off keeps
    // browsers from offering to save it as a form field.
    field.input.setAttribute('autocomplete', 'off');
    field.input.setAttribute('autocapitalize', 'off');
    field.input.setAttribute('spellcheck', 'false');

    var toggle = TK.btn(ui('reveal'), function () {
      var hidden = field.input.type === 'password';
      field.input.type = hidden ? 'text' : 'password';
      toggle.textContent = hidden ? ui('hide') : ui('reveal');
    }, { secondary: true });

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(toggle);

    host.appendChild(field.row);
    host.appendChild(box);
    host.appendChild(barWrap);
    host.appendChild(out);
    host.appendChild(actions);

    function fail(text) { out.render([]); bar.style.width = '0'; box.show(text, 'error'); }

    function label(bits) {
      if (bits < 28) return ui('veryWeak');
      if (bits < 36) return ui('weak');
      if (bits < 60) return ui('fair');
      if (bits < 80) return ui('strong');
      return ui('veryStrong');
    }

    function render() {
      var s = field.input.value;
      if (!s) {
        out.render([]);
        bar.style.width = '0';
        box.show(ui('empty'), 'warn');
        return;
      }
      if (s.length > MAX_LEN) { fail(ui('tooLong', { max: String(MAX_LEN) })); return; }

      var c = classesOf(s);
      var pool = 0;
      var used = [];
      if (c.lower) { pool += 26; used.push(ui('lower')); }
      if (c.upper) { pool += 26; used.push(ui('upper')); }
      if (c.digit) { pool += 10; used.push(ui('digit')); }
      if (c.symbol) { pool += 32; used.push(ui('symbol')); }
      if (c.space) { pool += 1; used.push(ui('space')); }

      if (!pool) { fail(ui('noChars')); return; }

      var perChar = Math.log(pool) / Math.LN2;
      var bits = s.length * perChar;
      var pct = Math.min(100, (bits / 128) * 100);

      bar.style.width = pct.toFixed(1) + '%';
      bar.style.background = bits < 36 ? '#b3261e' : bits < 60 ? '#a86200' : '#1f7a3d';

      out.render([
        [ui('length'), TK.num(s.length, 0)],
        [ui('classes'), used.join(', ')],
        [ui('pool'), TK.num(pool, 0)],
        [ui('bitsPerChar'), TK.num(perChar, 4)],
        [ui('entropy'), fixed(bits, 2) + ' bits', 'is-strong'],
        [ui('rating'), label(bits)],
        [ui('formula'), TK.num(s.length, 0) + ' × log₂(' + TK.num(pool, 0) + ') = ' + fixed(bits, 2) + ' bits']
      ]);

      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
