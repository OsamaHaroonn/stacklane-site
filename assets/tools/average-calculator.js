window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_CHARS = 20000;
  var MAX_TOKENS = 10000;

  function tokenize(text) {
    var raw = String(text).split(/[\s,;|]+/).filter(function (t) { return t !== ''; });
    var nums = [], bad = [];
    raw.forEach(function (t) {
      if (/^-?(\d+\.?\d*|\.\d+)$/.test(t)) {
        var v = parseFloat(t);
        if (isFinite(v)) nums.push(v); else bad.push(t);
      } else {
        bad.push(t);
      }
    });
    return { nums: nums, bad: bad, tokens: raw.length };
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var field = TK.textarea({
      id: 'avg-input',
      label: ui('value'),
      rows: 6,
      placeholder: '4, 8, 15, 16, 23, 42',
      onInput: render
    });

    host.appendChild(field.row);
    host.appendChild(box);
    host.appendChild(out);

    function fail(text) { out.render([]); box.show(text, 'error'); }

    function render() {
      var text = field.textarea.value;
      if (!text.trim()) { out.render([]); box.show(ui('empty'), 'warn'); return; }
      if (text.length > MAX_CHARS) { fail(ui('tooBig', { max: String(MAX_CHARS) })); return; }

      var parsed = tokenize(text);
      if (parsed.tokens > MAX_TOKENS) { fail(ui('tooMany', { max: String(MAX_TOKENS) })); return; }
      if (!parsed.nums.length) { fail(ui('none')); return; }

      var nums = parsed.nums;
      var count = nums.length;
      var sum = nums.reduce(function (a, b) { return a + b; }, 0);
      var mean = sum / count;

      var sorted = nums.slice().sort(function (a, b) { return a - b; });
      var mid = Math.floor(count / 2);
      var median = count % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      var range = sorted[count - 1] - sorted[0];

      var freq = {};
      nums.forEach(function (v) { freq[v] = (freq[v] || 0) + 1; });
      var best = 0;
      Object.keys(freq).forEach(function (k) { if (freq[k] > best) best = freq[k]; });

      var modeText;
      if (best < 2) {
        modeText = ui('noMode');
      } else {
        var ties = Object.keys(freq)
          .filter(function (k) { return freq[k] === best; })
          .map(Number).sort(function (a, b) { return a - b; });
        modeText = ties.length > 1
          ? ties.slice(0, 4).join(', ') + (ties.length > 4 ? ', …' : '') + ' (tie)'
          : TK.num(ties[0], 4);
      }

      if (parsed.bad.length) {
        var list = parsed.bad.slice(0, 5).join(', ') + (parsed.bad.length > 5 ? ' …' : '');
        box.show(ui('ignored', { n: String(parsed.bad.length), list: list }), 'warn');
      } else {
        box.show(ui('note'), '');
      }

      out.render([
        [ui('count'), TK.num(count, 0)],
        [ui('sum'), TK.num(sum, 4)],
        [ui('mean'), TK.num(mean, 2), 'is-strong'],
        [ui('median'), TK.num(median, 2)],
        [ui('mode'), modeText],
        [ui('range'), TK.num(range, 4)]
      ]);
    }

    render();
  }

  return { mount: mount };
})();