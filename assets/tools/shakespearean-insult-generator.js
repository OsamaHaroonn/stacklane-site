window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  /* Mild, stage-villain words. The output is invented by combining them:
     none of these lines is a quotation. */
  var ADJ = [
    'addle-pated', 'bespectacled', 'clapper-clawed', 'dizzy-eyed', 'fusty',
    'gorbellied', 'grumbling', 'knotty-pated', 'log-headed', 'mammering',
    'onion-eyed', 'pottle-deep', 'reeling-ripe', 'sheep-biting', 'weather-beaten',
    'yeasty', 'milk-livered', 'weedy', 'mouldy', 'tallow-faced'
  ];

  var NOUN = [
    'apple-john', 'baggage', 'barnacle', 'boar-pig', 'bugbear', 'dewberry',
    'flap-dragon', 'flax-wench', 'foot-licker', 'giglet', 'hedge-pig',
    'hobby-horse', 'malt-worm', 'measle', 'minnow', 'moldwarp',
    'mumble-news', 'nut-hook', 'pignut', 'pigeon-egg', 'puttock',
    'ratsbane', 'skainsmate', 'vassal', 'wagtail', 'whey-face'
  ];

  var VERB = ['prate', 'brawl', 'fume', 'cavil', 'foam', 'drivel', 'mumble', 'cluck'];

  function randInt(max) {
    var range = max | 0;
    if (range <= 0) return 0;
    var limit = Math.floor(4294967296 / range) * range;
    var buf = new Uint32Array(1);
    var v;
    do {
      crypto.getRandomValues(buf);
      v = buf[0];
    } while (v >= limit);
    return v % range;
  }

  function pick(list) { return list[randInt(list.length)]; }

  function line() {
    var shape = randInt(4);
    if (shape === 0) return 'Thou art a ' + pick(ADJ) + ' ' + pick(NOUN) + '.';
    if (shape === 1) return 'Thou art a ' + pick(ADJ) + ' ' + pick(NOUN) + ' with a ' + pick(ADJ) + ' ' + pick(NOUN) + '.';
    if (shape === 2) return 'Thou dost ' + pick(VERB) + ' like a ' + pick(ADJ) + ' ' + pick(NOUN) + '.';
    return 'Thy wit is a ' + pick(ADJ) + ' ' + pick(NOUN) + ', and thy ' + pick(NOUN) + ' is ' + pick(ADJ) + '.';
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.el('p', {
      role: 'status',
      'aria-live': 'polite',
      style: 'font-size:19px;line-height:1.5;font-style:italic;margin:12px 0;' +
        'overflow-wrap:anywhere;word-break:break-word;min-height:60px'
    });
    out.textContent = ui('ready');

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('another'), function () {
      out.textContent = line();
      box.show(ui('note'), '');
    }));
    actions.appendChild(TK.btn(ui('copy'), function () {
      TK.copy(out.textContent, function (ok) {
        box.show(ok ? ui('copied') : ui('copyFailed'), ok ? 'ok' : 'error');
      });
    }, { secondary: true }));

    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);
    host.appendChild(TK.el('p', { class: 'note' }, ui('original')));

    box.show(ui('note'), '');
  }

  return { mount: mount };
})();
