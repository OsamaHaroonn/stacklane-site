/* ============================================================
   Sort lines — A to Z, Z to A, numeric or by length, with an
   option to drop empty lines. Input is capped so a huge paste
   cannot freeze the tab, and the result is plain text.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_CHARS = 50000;
  var MAX_LINES = 5000;

  var NUMBER = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;

  function splitLines(text) {
    var list = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    if (list.length > 1 && list[list.length - 1] === '') list.pop();
    return list;
  }

  function byCode(a, b) { return a < b ? -1 : (a > b ? 1 : 0); }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var field = TK.textarea({
      id: 'sl-input',
      label: ui('label'),
      rows: 8,
      placeholder: 'pear\nApple\n10\nbanana',
      onInput: render
    });

    var order = TK.select({
      id: 'sl-order',
      label: ui('order'),
      value: 'az',
      options: [
        { value: 'az', label: ui('az') },
        { value: 'za', label: ui('za') },
        { value: 'num', label: ui('numeric') },
        { value: 'len', label: ui('byLength') }
      ],
      onChange: render
    });

    var dropEmpty = TK.checkbox({
      id: 'sl-empty',
      label: ui('removeEmpty'),
      onChange: render
    });

    var resWrap = TK.el('div', { class: 'tk-field' });
    resWrap.appendChild(TK.el('label', { for: 'sl-out' }, ui('output')));
    var resTa = TK.el('textarea', {
      id: 'sl-out', rows: 8, readonly: '', spellcheck: 'false'
    });
    resWrap.appendChild(resTa);
    resWrap.hidden = true;

    var copyBtn = TK.btn(common('copy'), function () {
      if (!resTa.value) return;
      TK.copy(resTa.value, function (ok) {
        copyBtn.textContent = ok ? common('copied') : common('copyFailed');
        setTimeout(function () { copyBtn.textContent = common('copy'); }, 1800);
      });
    }, { secondary: true });
    copyBtn.disabled = true;

    host.appendChild(order.row);
    host.appendChild(dropEmpty.row);
    host.appendChild(field.row);
    host.appendChild(box);
    host.appendChild(out);
    host.appendChild(resWrap);
    host.appendChild(copyBtn);

    function reset() {
      resTa.value = '';
      resWrap.hidden = true;
      copyBtn.disabled = true;
      out.render([]);
    }

    function render() {
      var text = field.textarea.value;
      if (!text.replace(/\s+/g, '')) { reset(); box.show(ui('empty'), 'warn'); return; }
      if (text.length > MAX_CHARS) { reset(); box.show(ui('tooBig'), 'error'); return; }

      var list = splitLines(text);
      if (list.length > MAX_LINES) { reset(); box.show(ui('tooMany'), 'error'); return; }
      if (dropEmpty.input.checked) {
        list = list.filter(function (l) { return l.trim() !== ''; });
      }
      if (!list.length) { reset(); box.show(ui('empty'), 'warn'); return; }

      var mode = order.select.value;
      var sorted, leftovers = [];

      if (mode === 'az') {
        sorted = list.slice().sort(byCode);
      } else if (mode === 'za') {
        sorted = list.slice().sort(function (a, b) { return byCode(b, a); });
      } else if (mode === 'len') {
        sorted = list.slice().sort(function (a, b) { return a.length - b.length; });
      } else {
        var numbers = [], rest = [];
        list.forEach(function (line) {
          var t = line.trim();
          if (NUMBER.test(t) && isFinite(parseFloat(t))) numbers.push({ key: parseFloat(t), text: line });
          else rest.push(line);
        });
        numbers.sort(function (a, b) { return a.key - b.key; });
        sorted = numbers.map(function (n) { return n.text; }).concat(rest);
        leftovers = rest;
      }

      resTa.value = sorted.join('\n');
      resWrap.hidden = false;
      copyBtn.disabled = false;
      out.render([
        [ui('label'), String(list.length)],
        [ui('chars'), String(resTa.value.length)]
      ]);
      box.show(leftovers.length ? ui('nonNumeric', { n: String(leftovers.length) }) : ui('note'),
        leftovers.length ? 'warn' : '');
    }

    render();
  }

  return { mount: mount };
})();