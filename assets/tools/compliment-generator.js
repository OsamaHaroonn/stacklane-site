window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  var OPEN = [
    'What stands out is how you',
    'There is something about the way you',
    'People notice how you',
    'You make it look easy to',
    'It is genuinely nice that you',
    'You always seem to',
    'One thing I like about you is how you'
  ];

  var VERB = [
    'listen properly',
    'explain things clearly',
    'keep your word',
    'stay calm when things get busy',
    'remember the small details',
    'make people feel welcome',
    'finish what you start',
    'ask good questions',
    'notice when someone is struggling',
    'bring a bit of order to a messy day'
  ];

  var END = [
    'and that is rarer than people think.',
    'and it makes a real difference.',
    'and it does not go unnoticed.',
    'and it is worth saying out loud.',
    'which takes more effort than it looks.',
    'and the room is better for it.'
  ];

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

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.el('p', {
      role: 'status',
      'aria-live': 'polite',
      style: 'font-size:19px;line-height:1.5;font-weight:600;margin:12px 0;' +
        'overflow-wrap:anywhere;word-break:break-word;min-height:60px'
    });
    out.textContent = ui('ready');

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('another'), function () {
      out.textContent = pick(OPEN) + ' ' + pick(VERB) + ', ' + pick(END);
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

    box.show(ui('note'), '');
  }

  return { mount: mount };
})();
