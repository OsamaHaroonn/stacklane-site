/* ============================================================
   Remove duplicate lines — keeps the first occurrence of every
   line, in the original order.

   Matching is exact unless the two options say otherwise, so
   "Banana" and "banana" are different lines until you ask for
   capital letters to be ignored.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var LIMIT_LINES = 200000;

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var input = TK.textarea({
      id: 'dedupe-in', label: ui('input'), rows: 9,
      placeholder: ui('placeholder'), onInput: render
    });

    var trim = TK.checkbox({ id: 'dedupe-trim', label: ui('trim'), checked: true, onChange: render });
    var fold = TK.checkbox({ id: 'dedupe-case', label: ui('ignoreCase'), onChange: render });
    var blanks = TK.checkbox({ id: 'dedupe-blanks', label: ui('dropBlanks'), onChange: render });

    var opts = TK.el('div', { class: 'tk-checks' });
    opts.appendChild(trim.row);
    opts.appendChild(fold.row);
    opts.appendChild(blanks.row);

    var output = TK.textarea({ id: 'dedupe-out', label: ui('output'), rows: 9 });
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

    host.appendChild(input.row);
    host.appendChild(opts);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(output.row);
    host.appendChild(out);

    function render() {
      var text = input.textarea.value;

      if (!text) {
        output.row.hidden = true;
        copyBtn.disabled = true;
        out.render([]);
        box.show(ui('empty'), 'warn');
        return;
      }

      var lines = text.split('\n');
      if (lines.length > LIMIT_LINES) {
        output.row.hidden = true;
        copyBtn.disabled = true;
        out.render([]);
        box.show(ui('tooMany'), 'error');
        return;
      }

      var seen = Object.create(null);
      var kept = [];
      var dupes = 0;
      var blank = 0;

      lines.forEach(function (line) {
        var key = trim.input.checked ? line.trim() : line;
        if (fold.input.checked) key = key.toLowerCase();
        if (blanks.input.checked && key === '') { blank++; return; }
        if (Object.prototype.hasOwnProperty.call(seen, key)) { dupes++; return; }
        seen[key] = true;
        kept.push(line);
      });

      var result = kept.join('\n');
      output.textarea.value = result;
      output.row.hidden = false;
      copyBtn.disabled = false;

      out.render([
        [ui('linesIn'), TK.num(lines.length, 0)],
        [ui('linesOut'), TK.num(kept.length, 0), 'is-strong'],
        [ui('dupes'), TK.num(dupes, 0)],
        [ui('blanks'), TK.num(blank, 0)],
        [ui('working'), TK.num(lines.length, 0) + ' − ' + TK.num(dupes + blank, 0) + ' = ' + TK.num(kept.length, 0)]
      ]);
      box.show(dupes + blank ? ui('note') : ui('none'), dupes + blank ? '' : 'warn');
    }

    render();
  }

  return { mount: mount };
})();
