/* ============================================================
   Lorem ipsum generator — built-in word list, no requests.
   Paragraphs, sentences or words, capped so the tab stays fast.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  var WORDS = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do ' +
    'eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim ' +
    'veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo ' +
    'consequat duis aute irure in reprehenderit voluptate velit esse cillum eu ' +
    'fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt ' +
    'culpa qui officia deserunt mollit anim id est laborum').split(' ');

  var OPENING = ['lorem', 'ipsum', 'dolor', 'sit', 'amet'];

  var LIMITS = { paragraphs: 10, sentences: 30, words: 200 };

  function pick() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
  }

  function sentence(withOpening) {
    var count = 6 + Math.floor(Math.random() * 8);
    var words = [];
    if (withOpening) {
      words = OPENING.slice(0, Math.min(OPENING.length, count));
    }
    while (words.length < count) words.push(pick());
    var text = words.join(' ');
    return text.charAt(0).toUpperCase() + text.slice(1) + '.';
  }

  function sentences(n, withOpening) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(sentence(withOpening && i === 0));
    return out.join(' ');
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var kind = TK.select({
      id: 'lorem-kind', label: ui('kind'),
      options: [
        { value: 'paragraphs', label: ui('paragraphs') },
        { value: 'sentences', label: ui('sentences') },
        { value: 'words', label: ui('words') }
      ],
      value: 'paragraphs'
    });

    var count = TK.field({
      id: 'lorem-count', label: ui('count'), type: 'text', inputmode: 'numeric', value: '3'
    });

    var lorem = TK.checkbox({ id: 'lorem-start', label: ui('startLorem'), checked: true });

    var outWrap = TK.el('div', { class: 'tk-field' });
    outWrap.appendChild(TK.el('label', { for: 'lorem-out' }, ui('result')));
    var outTa = TK.el('textarea', { id: 'lorem-out', rows: 9, readonly: '', spellcheck: 'false' });
    outWrap.appendChild(outTa);

    var copyBtn = TK.btn(common('copy'), function () {
      if (!outTa.value) { box.show(ui('empty'), 'warn'); return; }
      TK.copy(outTa.value, function (ok) {
        copyBtn.textContent = ok ? common('copied') : common('copyFailed');
        setTimeout(function () { copyBtn.textContent = common('copy'); }, 1800);
      });
    }, { secondary: true });

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('generate'), generate));
    actions.appendChild(copyBtn);

    host.appendChild(kind.row);
    host.appendChild(count.row);
    host.appendChild(lorem.row);
    host.appendChild(actions);
    host.appendChild(outWrap);
    host.appendChild(box);
    host.appendChild(out);

    function stats(text) {
      var words = text.split(/\s+/).filter(Boolean).length;
      var stops = (text.match(/\./g) || []).length;
      return [
        [ui('words'), TK.num(words, 0)],
        [ui('sentences'), TK.num(stops, 0)],
        [ui('chars'), TK.num(text.length, 0)]
      ];
    }

    function generate() {
      var mode = kind.select.value;
      var raw = String(count.input.value).trim();
      var max = LIMITS[mode] || 300;

      if (!/^\d+$/.test(raw)) {
        outTa.value = '';
        out.render([]);
        box.show(ui('badCount', { max: max }), 'error');
        return;
      }
      var n = parseInt(raw, 10);
      if (n < 1 || n > max) {
        outTa.value = '';
        out.render([]);
        box.show(ui('badCount', { max: max }), 'error');
        return;
      }

      var text = '';
      if (mode === 'words') {
        var words = [];
        if (lorem.input.checked) words = OPENING.slice(0, Math.min(OPENING.length, n));
        while (words.length < n) words.push(pick());
        text = words.join(' ');
      } else if (mode === 'sentences') {
        text = sentences(n, lorem.input.checked);
      } else {
        var paras = [];
        for (var i = 0; i < n; i++) {
          paras.push(sentences(3 + Math.floor(Math.random() * 3), lorem.input.checked && i === 0));
        }
        text = paras.join('\n\n');
      }

      outTa.value = text;
      out.render(stats(text));
      box.show(ui('note'), '');
    }

    kind.select.addEventListener('change', function () {
      count.input.value = kind.select.value === 'words' ? '25' : '3';
      outTa.value = '';
      out.render([]);
      box.show(ui('empty'), 'warn');
    });

    renderInitial();

    function renderInitial() {
      out.render([]);
      box.show(ui('empty'), 'warn');
    }
  }

  return { mount: mount };
})();
