window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  /* Uniform integer in 0..max-1 using rejection sampling, so no value is
     favoured by a modulo remainder. */
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

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var result = TK.el('p', {
      class: 'tk-msg',
      role: 'status',
      'aria-live': 'polite',
      style: 'font-size:20px;font-weight:600;min-height:28px'
    });
    result.textContent = ui('ready');

    var counts = { heads: 0, tails: 0 };
    var out = TK.rows();

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('flip'), flip));
    actions.appendChild(TK.btn(ui('reset'), reset, { secondary: true }));

    host.appendChild(result);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    function draw() {
      var total = counts.heads + counts.tails;
      function pct(n) { return total ? (n / total) * 100 : 0; }
      out.render([
        [ui('heads'), TK.num(counts.heads, 0) + '  ·  ' + TK.num(pct(counts.heads), 1) + '%'],
        [ui('tails'), TK.num(counts.tails, 0) + '  ·  ' + TK.num(pct(counts.tails), 1) + '%'],
        [ui('total'), TK.num(total, 0)]
      ]);
    }

    function flip() {
      var isHeads = randInt(2) === 0;
      if (isHeads) counts.heads++; else counts.tails++;
      result.textContent = isHeads ? ui('heads') : ui('tails');
      draw();
      box.show(ui('note'), '');
    }

    function reset() {
      counts.heads = 0;
      counts.tails = 0;
      result.textContent = ui('ready');
      draw();
      box.show(ui('cleared'), 'ok');
    }

    draw();
    box.show(ui('note'), '');
  }

  return { mount: mount };
})();
