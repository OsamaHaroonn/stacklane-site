/* ============================================================
   Word counter — counts words, characters, sentences, paragraphs
   and reading/speaking time. Pure client-side string work; the text
   never leaves the page and nothing is stored.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var input = TK.textarea({
      id: 'wc-text',
      label: ui('label'),
      placeholder: ui('placeholder'),
      rows: 10,
      onInput: count
    });

    var actions = document.createElement('div');
    actions.className = 'tk-actions';
    actions.appendChild(TK.btn(common('clear'), function () {
      input.textarea.value = '';
      count();
      input.textarea.focus();
    }, { secondary: true }));

    host.appendChild(input.row);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    /* Reading assumes ~200 wpm, speaking ~150 wpm — both stated in the
       page text as rough estimates, not measurements. */
    function duration(words, perMin) {
      if (!words) return '';
      var secs = Math.round(words / perMin * 60);
      if (secs < 10) return ui('under10');
      if (secs < 60) return secs + ' ' + ui('seconds');
      var mins = secs / 60;
      return (mins < 10 ? TK.num(mins, 1) : String(Math.round(mins))) + ' ' + ui('minutes');
    }

    function count() {
      var s = input.textarea.value;

      if (!s.trim()) {
        out.render([]);
        box.show(common('emptyInput'));
        return;
      }
      box.clear();

      var chars = Array.from(s).length;
      var charsNoSpace = Array.from(s.replace(/\s+/g, '')).length;
      var words = s.trim().split(/\s+/).length;

      // Sentence ends: . ! ? … and the Arabic full stop U+06D4.
      var sentences = s.split(/[.!?…\u06D4]+/).filter(function (p) { return p.trim(); }).length;

      // Paragraphs are blank-line blocks; if the text has none, each
      // non-empty line is a paragraph.
      var blocks = s.split(/\n\s*\n/).filter(function (p) { return p.trim(); });
      if (blocks.length < 2 && s.indexOf('\n') !== -1) {
        blocks = s.split(/\n+/).filter(function (p) { return p.trim(); });
      }
      var paragraphs = blocks.length;

      out.render([
        [ui('words'), TK.num(words, 0)],
        [ui('chars'), TK.num(chars, 0)],
        [ui('charsNoSpace'), TK.num(charsNoSpace, 0)],
        [ui('sentences'), TK.num(sentences, 0)],
        [ui('paragraphs'), TK.num(paragraphs, 0)],
        [ui('reading'), duration(words, 200)],
        [ui('speaking'), duration(words, 150)]
      ]);
    }

    count();
  }

  return { mount: mount };
})();