/* ============================================================
   Base64 — encode UTF-8 text to Base64 and back.

   Encoding goes through TextEncoder, so non-Latin text becomes
   its UTF-8 bytes first: btoa alone would reject any character
   outside Latin-1. Decoding reverses that with a fatal UTF-8
   decoder, so invalid byte sequences produce a message instead
   of replacement characters.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var LIMIT = 500000;

  function bytesToBase64(bytes) {
    var bin = '';
    var CHUNK = 0x8000;
    for (var i = 0; i < bytes.length; i += CHUNK) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
  }

  function base64ToBytes(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var mode = TK.select({
      id: 'b64-mode', label: ui('mode'), value: 'encode',
      options: [
        { value: 'encode', label: ui('encode') },
        { value: 'decode', label: ui('decode') }
      ],
      onChange: render
    });

    var input = TK.textarea({
      id: 'b64-in', label: ui('input'), rows: 7,
      placeholder: ui('placeholder'), onInput: render
    });

    var output = TK.textarea({ id: 'b64-out', label: ui('output'), rows: 7 });
    output.textarea.setAttribute('readonly', '');
    output.row.hidden = true;

    var actions = TK.el('div', { class: 'tk-actions' });
    var copyBtn = TK.btn(ui('copy'), function () {
      if (!output.textarea.value) { box.show(ui('empty'), 'warn'); return; }
      TK.copy(output.textarea.value, function (ok) {
        box.show(ok ? ui('copied') : ui('copyFail'), ok ? '' : 'error');
      });
    });
    copyBtn.disabled = true;
    actions.appendChild(copyBtn);
    actions.appendChild(TK.btn(common('clear'), function () {
      input.textarea.value = '';
      render();
      input.textarea.focus();
    }, { secondary: true }));

    host.appendChild(mode.row);
    host.appendChild(input.row);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(output.row);
    host.appendChild(out);

    function fail(message) {
      output.row.hidden = true;
      copyBtn.disabled = true;
      out.render([]);
      box.show(message, 'error');
    }

    function render() {
      var text = input.textarea.value;
      var enc = mode.select.value === 'encode';

      if (!text) {
        output.row.hidden = true;
        copyBtn.disabled = true;
        out.render([]);
        box.show(ui('empty'), 'warn');
        return;
      }
      if (text.length > LIMIT) {
        fail(ui('tooLong'));
        return;
      }

      var result;
      try {
        if (enc) {
          var bytes = new TextEncoder().encode(text);
          if (bytes.length > LIMIT) { fail(ui('tooLong')); return; }
          result = bytesToBase64(bytes);
        } else {
          var cleaned = text.replace(/\s+/g, '');
          if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned) || cleaned.length % 4 !== 0) {
            fail(ui('badBase64'));
            return;
          }
          var dec = new TextDecoder('utf-8', { fatal: true });
          result = dec.decode(base64ToBytes(cleaned));
        }
      } catch (e) {
        fail(enc ? ui('tooLong') : (e && e.name === 'TypeError' ? ui('badUtf8') : ui('badBase64')));
        return;
      }

      output.textarea.value = result;
      output.row.hidden = false;
      copyBtn.disabled = false;
      out.render([
        [ui('inChars'), TK.num(text.length, 0)],
        [ui('outChars'), TK.num(Array.from(result).length, 0)],
        [ui('direction'), enc ? ui('encoded') : ui('decoded')]
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
