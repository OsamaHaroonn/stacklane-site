/* ============================================================
   JWT decoder — splits header.payload.signature, restores the
   base64url alphabet and pretty-prints the JSON. The signature
   is shown but never checked: decoding proves nothing about a
   token's validity. The token stays in this page.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_SEGMENT = 6000;

  function segmentToText(seg) {
    var s = seg.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s); // throws on invalid base64
    if (typeof TextDecoder === 'undefined') return bin;
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  function parseSegment(seg) {
    return JSON.parse(segmentToText(seg));
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var field = TK.textarea({
      id: 'jwt-input',
      label: ui('label'),
      rows: 4,
      placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
      onInput: render
    });

    function block(id, labelText) {
      var wrap = TK.el('div', { class: 'tk-field' });
      wrap.appendChild(TK.el('label', { for: id }, labelText));
      var ta = TK.el('textarea', { id: id, rows: 5, readonly: '', spellcheck: 'false' });
      wrap.appendChild(ta);
      wrap.hidden = true;
      return { wrap: wrap, ta: ta };
    }

    var head = block('jwt-head', ui('header'));
    var pay = block('jwt-payload', ui('payload'));
    var sig = block('jwt-sig', ui('signature'));

    var copyBtn = TK.btn(common('copy'), function () {
      if (!pay.ta.value) return;
      TK.copy(pay.ta.value, function (ok) {
        copyBtn.textContent = ok ? common('copied') : common('copyFailed');
        setTimeout(function () { copyBtn.textContent = common('copy'); }, 1800);
      });
    }, { secondary: true });
    copyBtn.disabled = true;

    host.appendChild(field.row);
    host.appendChild(box);
    host.appendChild(out);
    host.appendChild(head.wrap);
    host.appendChild(pay.wrap);
    host.appendChild(sig.wrap);
    host.appendChild(copyBtn);

    function reset() {
      head.ta.value = pay.ta.value = sig.ta.value = '';
      head.wrap.hidden = pay.wrap.hidden = sig.wrap.hidden = true;
      copyBtn.disabled = true;
      out.render([]);
    }

    function fail(text) {
      reset();
      box.show(text, 'error');
    }

    function render() {
      var raw = field.textarea.value.trim();
      if (!raw) { reset(); box.show(ui('empty'), 'warn'); return; }

      var parts = raw.split('.');
      if (parts.length < 2 || parts.length > 3) { fail(ui('malformed')); return; }
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].length > MAX_SEGMENT) { fail(ui('tooLong')); return; }
        if (!parts[i]) { fail(ui('malformed')); return; }
      }

      var header, payload;
      try {
        header = parseSegment(parts[0]);
        payload = parseSegment(parts[1]);
      } catch (e) {
        var msg = String(e && e.message || '');
        if (/JSON|Unexpected|position/i.test(msg)) { fail(ui('badJson')); }
        else { fail(ui('malformed')); }
        return;
      }
      if (!header || typeof header !== 'object' || !payload || typeof payload !== 'object') {
        fail(ui('badJson'));
        return;
      }

      head.ta.value = JSON.stringify(header, null, 2);
      pay.ta.value = JSON.stringify(payload, null, 2);
      sig.ta.value = parts.length === 3 ? parts[2] : '';
      head.wrap.hidden = pay.wrap.hidden = false;
      sig.wrap.hidden = parts.length !== 3;
      copyBtn.disabled = false;

      var rows = [];
      ['iat', 'exp', 'nbf'].forEach(function (key) {
        var v = payload[key];
        if (typeof v === 'number' && isFinite(v)) {
          rows.push([key, String(v) + ' \u2014 ' + new Date(v * 1000).toUTCString()]);
        }
      });
      out.render(rows);

      box.show(ui('notVerified'), 'warn');
    }

    render();
  }

  return { mount: mount };
})();