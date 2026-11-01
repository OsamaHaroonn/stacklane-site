/* ============================================================
   Typing speed test — WPM = correct characters / 5 / minutes.
   Built-in samples only, no storage, no cookies.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  var SAMPLES = {
    sample1: 'The quick brown fox jumps over the lazy dog while the morning light moves across the kitchen table and the kettle begins to sing quietly.',
    sample2: 'Small habits add up. A few minutes each day is enough to finish the work, and the result is usually better than one long rushed attempt.',
    sample3: 'In 2026 the invoice totalled 1,248.50 dollars, paid on the 14th; 3 reminders followed, and 2 of them were ignored before the balance cleared.'
  };

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var picker = TK.select({
      id: 'typing-sample', label: ui('choose'),
      options: [
        { value: 'sample1', label: ui('sample1') },
        { value: 'sample2', label: ui('sample2') },
        { value: 'sample3', label: ui('sample3') }
      ],
      value: 'sample1'
    });

    var sample = SAMPLES.sample1;

    var sampleBox = TK.el('div', { class: 'worked' });
    sampleBox.setAttribute('aria-label', ui('sample'));

    var typeBox = TK.textarea({ id: 'typing-text', label: ui('typeHere'), rows: 5 });

    var finished = false;
    var started = false;
    var startedAt = 0;
    var endedAt = 0;
    var tick = null;

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('finish'), finish));
    actions.appendChild(TK.btn(ui('reset'), reset, { secondary: true }));

    host.appendChild(picker.row);
    host.appendChild(sampleBox);
    host.appendChild(typeBox.row);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    function paintSample() {
      sample = SAMPLES[picker.select.value] || SAMPLES.sample1;
      sampleBox.textContent = sample;
    }

    function elapsedMs() {
      if (!started) return 0;
      var end = finished ? endedAt : performance.now();
      return Math.max(0, end - startedAt);
    }

    function counts() {
      var typed = typeBox.textarea.value;
      var correct = 0;
      var limit = Math.min(typed.length, sample.length);
      for (var i = 0; i < limit; i++) {
        if (typed.charAt(i) === sample.charAt(i)) correct++;
      }
      return { typed: typed.length, correct: correct };
    }

    function stopTick() {
      if (tick) { clearInterval(tick); tick = null; }
    }

    function render() {
      if (!started) {
        out.render([]);
        box.show(ui('empty'), 'warn');
        return;
      }
      var c = counts();
      var minutes = elapsedMs() / 60000;
      var wpm = minutes > 0 ? c.correct / 5 / minutes : 0;
      var acc = c.typed ? (c.correct / c.typed) * 100 : 0;
      if (!isFinite(wpm)) wpm = 0;

      out.render([
        [ui('wpm'), TK.num(wpm, 1), 'is-strong'],
        [ui('accuracy'), TK.num(acc, 1) + '%'],
        [ui('correct'), TK.num(c.correct, 0)],
        [ui('typed'), TK.num(c.typed, 0)],
        [ui('elapsed'), TK.num(elapsedMs() / 1000, 1) + ' ' + ui('sec')],
        [ui('formula'), TK.num(c.correct, 0) + ' \u00f7 5 \u00f7 ' +
          TK.num(minutes, 2) + ' ' + ui('min') + ' = ' + TK.num(wpm, 1) + ' WPM \u00b7 ' +
          TK.num(c.correct, 0) + ' \u00f7 ' + TK.num(c.typed, 0) + ' = ' + TK.num(acc, 1) + '%']
      ]);
      if (!finished) box.show(ui('running'), '');
    }

    function finish() {
      if (!started) { out.render([]); box.show(ui('empty'), 'warn'); return; }
      if (finished) return;
      endedAt = performance.now();
      finished = true;
      stopTick();
      render();
      box.show(ui('finished'), 'ok');
    }

    function reset() {
      stopTick();
      typeBox.textarea.value = '';
      started = false;
      finished = false;
      startedAt = 0;
      endedAt = 0;
      paintSample();
      render();
    }

    typeBox.textarea.addEventListener('input', function () {
      if (!started) {
        started = true;
        startedAt = performance.now();
        tick = setInterval(function () {
          if (started && !finished) render();
        }, 250);
      }
      if (typeBox.textarea.value.length > sample.length * 3) {
        finished = true;
        stopTick();
        // The reading would be meaningless (a paste, not typing), so show
        // the reason instead of rows full of zeros.
        out.render([]);
        box.show(ui('tooLong'), 'error');
        return;
      }
      if (!finished) render();
    });

    picker.select.addEventListener('change', reset);

    document.addEventListener('visibilitychange', function () {
      if (started && !finished) render();
    });

    paintSample();
    render();
  }

  return { mount: mount };
})();
