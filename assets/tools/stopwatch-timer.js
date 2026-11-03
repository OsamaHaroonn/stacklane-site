/* ============================================================
   Stopwatch with laps — every reading is recomputed from
   performance.now(), never tick-counted, so a throttled or
   hidden tab cannot corrupt the time. Nothing is stored.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function format(ms) {
    if (!isFinite(ms) || ms < 0) ms = 0;
    var cs = Math.floor(ms / 10);
    var totalSeconds = Math.floor(cs / 100);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    var hundredths = cs % 100;
    return String(minutes).padStart(2, '0') + ':' +
      String(seconds).padStart(2, '0') + '.' + String(hundredths).padStart(2, '0');
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var display = TK.el('div', {
      id: 'sw-display', role: 'timer',
      style: 'font-family: var(--mono); font-size: clamp(2rem, 8vw, 3.2rem); ' +
             'font-weight: 700; letter-spacing: .04em; min-height: 4.2rem; ' +
             'display: flex; align-items: center;'
    }, '00:00.00');

    var running = false;
    var accumulated = 0;   /* ms banked while paused */
    var startedAt = 0;     /* performance.now() at the current start */
    var laps = [];
    var tick = null;

    function now() {
      return (window.performance && performance.now) ? performance.now() : Date.now();
    }
    function current() {
      return accumulated + (running ? now() - startedAt : 0);
    }

    var startBtn = TK.btn(ui('start'), function () {
      if (running) return;
      startedAt = now();
      running = true;
      startBtn.disabled = true;
      pauseBtn.disabled = false;
      lapBtn.disabled = false;
      tick = setInterval(paint, 50);
      paint();
    });
    var pauseBtn = TK.btn(ui('pause'), function () {
      if (!running) return;
      accumulated = current();
      running = false;
      clearInterval(tick);
      tick = null;
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      lapBtn.disabled = true;
      paint();
    }, { secondary: true });
    var resetBtn = TK.btn(ui('reset'), function () {
      if (running) {
        running = false;
        clearInterval(tick);
        tick = null;
        startBtn.disabled = false;
        lapBtn.disabled = true;
      }
      accumulated = 0;
      laps = [];
      pauseBtn.disabled = true;
      renderLaps();
      paint();
    }, { secondary: true });
    var lapBtn = TK.btn(ui('lap'), function () {
      if (!running) return;
      laps.push(current());
      renderLaps();
    }, { secondary: true });
    pauseBtn.disabled = true;
    lapBtn.disabled = true;

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(startBtn);
    actions.appendChild(pauseBtn);
    actions.appendChild(resetBtn);
    actions.appendChild(lapBtn);

    function renderLaps() {
      out.setAttribute('aria-label', ui('laps'));
      var rows = [[ui('elapsed'), format(current()), 'is-strong']];
      laps.forEach(function (t, i) {
        rows.push([ui('lap') + ' ' + (i + 1), format(t)]);
      });
      out.render(laps.length ? rows : []);
      box.show(laps.length ? ui('note') : ui('noLaps'), laps.length ? '' : 'warn');
    }

    function paint() {
      display.textContent = format(current());
    }

    host.appendChild(display);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    /* Recompute after the tab becomes visible again; readings come
       from timestamps, so throttling while hidden cannot corrupt them. */
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && running) paint();
    });

    renderLaps();
    paint();
  }

  return { mount: mount };
})();