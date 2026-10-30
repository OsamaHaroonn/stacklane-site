/* ============================================================
   JSON formatter — validate, pretty-print and minify in the
   browser. Parsing is native JSON.parse: no library, no upload.
   The error message from the engine is shown as-is so the line
   and column the browser reports are the ones the user sees.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();

    var input = TK.textarea({
      id: 'json-in',
      label: ui('label'),
      rows: 12,
      placeholder: ui('placeholder'),
      onInput: countChars
    });
    // JSON is structurally left-to-right whatever the page language.
    input.textarea.setAttribute('dir', 'ltr');

    var out = TK.textarea({ id: 'json-out', label: ui('output'), rows: 12 });
    out.textarea.setAttribute('readonly', '');
    out.textarea.setAttribute('dir', 'ltr');

    var chars = TK.el('p', { class: 'note tk-chars' });

    var formatBtn = TK.btn(ui('format'), function () { run('format'); });
    var minifyBtn = TK.btn(ui('minify'), function () { run('minify'); });
    var validateBtn = TK.btn(ui('validate'), function () { run('validate'); }, { secondary: true });
    var clearBtn = TK.btn(ui('clear'), function () {
      input.textarea.value = '';
      out.textarea.value = '';
      countChars();
      box.clear();
      out.row.hidden = true;
      copyBtn.disabled = true;
    }, { secondary: true });
    var copyBtn = TK.btn(ui('copy'), function () {
      TK.copy(out.textarea.value, function (ok) {
        box.show(ok ? common('copied') : common('copyFailed'), ok ? '' : 'error');
      });
    }, { secondary: true });
    copyBtn.disabled = true;

    var actions = TK.el('div', { class: 'tk-actions' });
    [formatBtn, minifyBtn, validateBtn, copyBtn, clearBtn].forEach(function (b) {
      actions.appendChild(b);
    });

    host.appendChild(input.row);
    host.appendChild(actions);
    host.appendChild(chars);
    host.appendChild(box);
    host.appendChild(out.row);

    function countChars() {
      var n = input.textarea.value.length;
      chars.textContent = TK.num(n, 0) + ' ' + ui('chars');
    }

    function run(kind) {
      var raw = input.textarea.value;
      if (!raw.trim()) {
        out.textarea.value = '';
        out.row.hidden = true;
        copyBtn.disabled = true;
        box.show(ui('empty'), 'warn');
        return;
      }
      // The engine's own parse error (line and column where it stopped)
      // is shown after the fixed prefix — never thrown to the console.
      var parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        out.textarea.value = '';
        out.row.hidden = true;
        copyBtn.disabled = true;
        box.show(ui('invalid') + ' ' + String((e && e.message) || ''), 'error');
        return;
      }

      if (kind === 'validate') {
        out.textarea.value = '';
        out.row.hidden = true;
        copyBtn.disabled = true;
        box.show(ui('valid'));
        return;
      }

      var text = kind === 'minify'
        ? JSON.stringify(parsed)
        : JSON.stringify(parsed, null, 2);

      out.textarea.value = text;
      out.row.hidden = false;
      copyBtn.disabled = false;
      box.show(ui('valid'));
    }

    countChars();
    out.row.hidden = true;
  }

  return { mount: mount };
})();
