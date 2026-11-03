window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var COLS = 10;
  var ROWS = 10;

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var counter = TK.el('p', {
      role: 'status',
      'aria-live': 'polite',
      style: 'font-weight:600;margin:8px 0'
    });

    var grid = TK.el('div', {
      style: 'display:grid;grid-template-columns:repeat(6,minmax(0,1fr));' +
        'gap:6px;margin:10px 0;width:100%;min-width:0;max-width:520px;touch-action:manipulation'
    });

    /* Columns follow the available width so every bubble stays at least
       44px wide: 6 on a phone, up to 10 on a wide panel. */
    function setColumns() {
      var w = grid.clientWidth || host.clientWidth || 312;
      var cols = Math.max(4, Math.min(COLS, Math.floor((w + 6) / 50)));
      grid.style.gridTemplateColumns = 'repeat(' + cols + ',minmax(0,1fr))';
    }
    window.addEventListener('resize', setColumns);

    var soundOn = false;
    var ctx = null;
    var audio = null;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audio = new Ctx();
    } catch (e) {
      audio = null;
    }

    function blip() {
      if (!soundOn || !audio) return;
      try {
        if (audio.state === 'suspended') audio.resume();
        var osc = audio.createOscillator();
        var gain = audio.createGain();
        osc.type = 'sine';
        osc.frequency.value = 320;
        gain.gain.value = 0.05;
        gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.07);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start();
        osc.stop(audio.currentTime + 0.08);
      } catch (e) { /* sound is optional; never break popping */ }
    }

    var soundBtn = TK.btn(ui('soundOff'), function () {
      if (!audio) { box.show(ui('noSound'), 'warn'); return; }
      soundOn = !soundOn;
      soundBtn.textContent = soundOn ? ui('soundOn') : ui('soundOff');
      soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
      if (soundOn && audio.state === 'suspended') audio.resume();
      box.show(soundOn ? ui('soundNote') : ui('soundOffNote'), '');
    }, { secondary: true });
    soundBtn.setAttribute('aria-pressed', 'false');

    var resetBtn = TK.btn(ui('reset'), function () { build(); box.show(ui('cleared'), 'ok'); }, { secondary: true });

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(soundBtn);
    actions.appendChild(resetBtn);

    var bubbles = [];

    function count() {
      var popped = bubbles.filter(function (b) { return b.popped; }).length;
      counter.textContent = ui('count', { popped: String(popped), total: String(bubbles.length) });
    }

    function build() {
      grid.textContent = '';
      bubbles = [];
      for (var i = 0; i < COLS * ROWS; i++) {
        (function (index) {
          var b = TK.el('button', {
            type: 'button',
            'aria-label': ui('bubble', { n: String(index + 1) }),
            style: 'height:44px;padding:0;border-radius:50%;cursor:pointer;' +
              'border:1px solid #b9c6ef;background:radial-gradient(circle at 32% 28%, #ffffff, #cfdcff 70%);' +
              'box-shadow:inset 0 -2px 3px rgba(0,0,0,0.06)'
          });
          b.popped = false;
          b.addEventListener('click', function () {
            if (b.popped) return;
            b.popped = true;
            b.style.background = '#eef0f4';
            b.style.borderColor = '#d8dde6';
            b.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.08)';
            b.setAttribute('aria-pressed', 'true');
            b.setAttribute('aria-label', ui('popped', { n: String(index + 1) }));
            blip();
            count();
          });
          b.setAttribute('aria-pressed', 'false');
          grid.appendChild(b);
          bubbles.push(b);
        })(i);
      }
      count();
    }

    host.appendChild(counter);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(grid);

    build();
    setColumns();
    box.show(ui('note'), '');
  }

  return { mount: mount };
})();
