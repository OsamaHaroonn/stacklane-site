/* ============================================================
   URL encoder — percent-encoding for query strings and paths.

   Uses the browser's own encodeURIComponent / decodeURIComponent,
   so exactly the characters the standards leave alone (letters,
   digits and - _ . ! ~ * ' ( )) stay readable, and everything
   else becomes %XX. Malformed escapes are reported instead of
   throwing into the console.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var LIMIT = 500000;

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var mode = TK.select({
      id: 'url-mode', label: ui('mode'), value: 'encode',
      options: [
        { value: 'encode', label: ui('encode') },
        { value: 'decode', label: ui('decode') }
      ],
      onChange: render
    });

    var input = TK.textarea({
      id: 'url-in', label: ui('input'), rows: 6,
      placeholder: ui('placeholder'), onInput: render
    });

    var output = TK.textarea({ id: 'url-out', label: ui('output'), rows: 6 });
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
      if (text.length > LIMIT) { fail(ui('tooLong')); return; }

      var result;
      try {
        result = enc ? encodeURIComponent(text) : decodeURIComponent(text);
      } catch (e) {
        fail(ui('badEscape'));
        return;
      }

      var escapes = (result.match(/%/g) || []).length;

      output.textarea.value = result;
      output.row.hidden = false;
      copyBtn.disabled = false;
      out.render([
        [ui('inChars'), TK.num(text.length, 0)],
        [ui('outChars'), TK.num(result.length, 0)],
        [ui('escapes'), TK.num(escapes, 0)],
        [ui('direction'), enc ? ui('encoded') : ui('decoded')]
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
