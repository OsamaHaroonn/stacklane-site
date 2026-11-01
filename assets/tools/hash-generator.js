/* ============================================================
   Hash generator — SHA-1, SHA-256, SHA-384, SHA-512 through
   crypto.subtle.digest. MD5 is intentionally not offered.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_CHARS = 100000;

  function toHex(buffer) {
    var bytes = new Uint8Array(buffer);
    var out = '';
    for (var i = 0; i < bytes.length; i++) {
      out += bytes[i].toString(16).padStart(2, '0');
    }
    return out;
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();
    var current = '';
    var seq = 0;
    var timer = null;

    var algo = TK.select({
      id: 'hash-algo', label: ui('algo'),
      options: [
        { value: 'SHA-256', label: 'SHA-256' },
        { value: 'SHA-512', label: 'SHA-512' },
        { value: 'SHA-384', label: 'SHA-384' },
        { value: 'SHA-1', label: 'SHA-1' }
      ],
      value: 'SHA-256'
    });

    var text = TK.textarea({ id: 'hash-text', label: ui('text'), rows: 5 });

    var copyBtn = TK.btn(common('copy'), function () {
      if (!current) return;
      TK.copy(current, function (ok) {
        copyBtn.textContent = ok ? common('copied') : common('copyFailed');
        setTimeout(function () { copyBtn.textContent = common('copy'); }, 1800);
      });
    }, { secondary: true });
    copyBtn.disabled = true;

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(copyBtn);

    host.appendChild(algo.row);
    host.appendChild(text.row);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    function render() {
      var value = String(text.textarea.value);
      var mine = ++seq;
      current = '';

      if (!value) {
        copyBtn.disabled = true;
        out.render([]);
        box.show(ui('empty'), 'warn');
        return;
      }
      if (value.length > MAX_CHARS) {
        copyBtn.disabled = true;
        out.render([]);
        box.show(ui('tooBig'), 'error');
        return;
      }
      if (!window.crypto || !window.crypto.subtle || typeof window.crypto.subtle.digest !== 'function') {
        copyBtn.disabled = true;
        out.render([]);
        box.show(ui('unsupported'), 'error');
        return;
      }

      var bytes = new TextEncoder().encode(value);
      window.crypto.subtle.digest(algo.select.value, bytes).then(function (buffer) {
        if (mine !== seq) return;
        var hex = toHex(buffer);
        current = hex;
        copyBtn.disabled = false;
        out.render([
          [algo.select.value + ' ' + ui('result'), hex, 'is-strong'],
          [ui('bytes'), TK.bytes(bytes.length)],
          [ui('chars'), TK.num(value.length, 0)],
          [ui('length'), TK.num(hex.length, 0) + ' ' + ui('hex')]
        ]);
        box.show(ui('note'), '');
      }).catch(function (e) {
        if (mine !== seq) return;
        current = '';
        copyBtn.disabled = true;
        out.render([]);
        box.show(String((e && e.message) || e), 'error');
      });
    }

    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(render, 150);
    }

    text.textarea.addEventListener('input', schedule);
    algo.select.addEventListener('change', render);

    render();
  }

  return { mount: mount };
})();
