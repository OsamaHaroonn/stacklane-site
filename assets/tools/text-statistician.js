/* ============================================================
   Text statistician — word and sentence counts, vocabulary
   richness, average sentence length, Flesch reading ease and
   the most frequent words that are not stop words.

   One pass over the string in this tab; nothing is transmitted.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  /* Closed-class words carry little meaning in a frequency table,
     so they are excluded from the "top words" ranking. They still
     count towards every total. */
  var STOP = ('a an the and or but if because as until while of at by for with about ' +
    'against between into through during before after above below to from in out on ' +
    'off over under again further then once here there when where why how all any ' +
    'each every both few more most other some such no nor not only own same so than ' +
    'too very can will just should now is am are was were be been being have has had ' +
    'having do does did doing i me my myself we our ours ourselves you your yours ' +
    'yourself yourselves he him his himself she her hers herself it its itself they ' +
    'them their theirs themselves what which who whom this that these those s t don ' +
    'doesn didn won wouldn couldn shouldn isn aren wasn weren').split(' ');

  var STOP_SET = {};
  STOP.forEach(function (w) { STOP_SET[w] = true; });

  function syllables(word) {
    var w = String(word).toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    w = w.replace(/^y/, '');
    var m = w.match(/[aeiouy]{1,2}/g);
    return m ? m.length : 1;
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows({ note: ui('working') });

    var freqTitle = TK.el('h3', { class: 'tk-subhead' }, ui('topWords'));
    var freqBox = TK.rows();
    var freqWrap = TK.el('div', { class: 'tk-sub' });
    freqWrap.appendChild(freqTitle);
    freqWrap.appendChild(freqBox);
    freqWrap.hidden = true;

    var input = TK.textarea({
      id: 'ts-text',
      label: ui('label'),
      rows: 10,
      placeholder: ui('placeholder'),
      onInput: render
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
    host.appendChild(freqWrap);

    function render() {
      var text = input.textarea.value;
      if (!text.trim()) {
        out.render([]);
        freqBox.render([]);
        freqWrap.hidden = true;
        box.show(ui('empty'), 'warn');
        return;
      }

      var words = text.match(/[\p{L}\p{N}]+(?:['\u2019-][\p{L}\p{N}]+)*/gu) || [];
      var sentences = text.split(/[.!?\u2026]+/).filter(function (s) { return s.trim(); });
      var paragraphs = text.split(/\n\s*\n/).filter(function (p) { return p.trim(); });
      var noSpaces = text.replace(/\s/g, '').length;

      /* Guard the divisions: a text made only of punctuation has
         zero words and would otherwise print NaN. */
      var nWords = words.length;
      var nSent = sentences.length || 0;
      var avgSentence = nSent ? nWords / nSent : 0;

      var freq = {};
      var syl = 0;
      var longest = '';
      words.forEach(function (w) {
        syl += syllables(w);
        if (w.length > longest.length) longest = w;
        var key = w.toLowerCase();
        if (STOP_SET[key]) return;
        freq[key] = (freq[key] || 0) + 1;
      });

      var unique = Object.keys(freq).length;
      var ranked = Object.keys(freq).sort(function (a, b) {
        return freq[b] - freq[a] || a.localeCompare(b);
      });

      /* Flesch is defined on 0–100. Very short sentences can push the
         formula above 100, and a script the syllable estimate cannot
         read (syl === 0) would score absurdly high, so both are
         reported as unavailable rather than as a misleading number. */
      var flesch = null;
      if (nWords && nSent && syl > 0) {
        flesch = Math.max(0, Math.min(100,
          Math.round(206.835 - 1.015 * avgSentence - 84.6 * (syl / nWords))));
      }

      out.render([
        [ui('words'), TK.num(nWords, 0), 'is-strong'],
        [ui('characters'), TK.num(Array.from(text).length, 0)],
        [ui('noSpaces'), TK.num(noSpaces, 0)],
        [ui('sentences'), TK.num(nSent, 0)],
        [ui('paragraphs'), TK.num(paragraphs.length, 0)],
        [ui('avgSentence'), nSent ? TK.num(avgSentence, 1) + ' ' + ui('unitWords') : '—'],
        [ui('flesch'), flesch === null ? '—' : TK.num(flesch, 0) + ' · ' + ui('fleschScale')],
        [ui('unique'), TK.num(unique, 0)],
        [ui('longest'), longest ? longest + ' (' + TK.num(longest.length, 0) + ')' : '—'],
        [ui('working'), TK.num(nWords, 0) + ' ' + ui('unitWords') + ' · ' +
          TK.num(syl, 0) + ' ' + ui('unitSyllables')]
      ]);

      var top = ranked.slice(0, 10).map(function (w, i) {
        return [TK.num(i + 1, 0) + '. ' + w, TK.num(freq[w], 0)];
      });
      freqBox.render(top);
      freqWrap.hidden = top.length === 0;
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
