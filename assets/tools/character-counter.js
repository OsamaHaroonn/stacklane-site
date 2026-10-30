/* ============================================================
   Character counter — characters, words, lines, sentences and
   the UTF-8 size of the text.

   Characters are counted as code points, so an emoji counts as
   one character; bytes use UTF-8, so the same emoji costs four.
   Nothing is transmitted: counting is a single pass over the
   string in this tab.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function utf8Bytes(str) {
    try {
      if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str).length;
    } catch (e) { /* fall through to the manual count */ }
    var bytes = 0;
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) bytes += 1;
      else if (c < 0x800) bytes += 2;
      else if (c >= 0xd800 && c <= 0xdbff) { bytes += 4; i++; }
      else bytes += 3;
    }
    return bytes;
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var input = TK.textarea({
      id: 'chars-in', label: ui('input'), rows: 8,
      placeholder: ui('placeholder'), onInput: render
    });

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(common('clear'), function () {
      input.textarea.value = '';
      render();
      input.textarea.focus();
    }, { secondary: true }));

    host.appendChild(input.row);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    function render() {
      var text = input.textarea.value;
      if (!text) { out.render([]); box.show(ui('empty'), 'warn'); return; }

      var points = Array.from(text);
      var trimmed = text.trim();
      var words = trimmed ? trimmed.split(/\s+/) : [];
      var lines = text.split('\n');
      var sentences = text.split(/[.!?…]+/).filter(function (s) { return s.trim(); }).length;
      var letters = (text.match(/\p{L}/gu) || []).length;
      var digits = (text.match(/\d/g) || []).length;
      var noSpaces = points.filter(function (c) { return !/\s/.test(c); }).length;

      var longest = '';
      var tokens = text.match(/[\p{L}\p{N}]+/gu) || [];
      tokens.forEach(function (w) { if (w.length > longest.length) longest = w; });

      out.render([
        [ui('characters'), TK.num(points.length, 0), 'is-strong'],
        [ui('noSpaces'), TK.num(noSpaces, 0)],
        [ui('words'), TK.num(words.length, 0)],
        [ui('lines'), TK.num(lines.length, 0)],
        [ui('sentences'), TK.num(sentences, 0)],
        [ui('letters'), TK.num(letters, 0)],
        [ui('digits'), TK.num(digits, 0)],
        [ui('bytes'), TK.num(utf8Bytes(text), 0)],
        [ui('longest'), longest ? longest + ' (' + TK.num(longest.length, 0) + ')' : '—'],
        [ui('working'), TK.num(points.length, 0) + ' ' + ui('charsUnit') + ' · ' + TK.num(words.length, 0) + ' ' + ui('wordsUnit')]
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
