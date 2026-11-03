window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_CHARS = 50000;
  var MAX_WORDS = 20000;
  var TOP = 12;

  var STOP = ('a about above after again against all am an and any are as at be because been before being below ' +
    'between both but by can did do does doing down during each few for from further had has have having he her ' +
    'here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not ' +
    'now of off on once only or other our ours ourselves out over own same she should so some such than that the ' +
    'their theirs them themselves then there these they this those through to too under until up very was we were ' +
    'what when where which while who whom why will with you your yours yourself yourselves').split(' ');

  var STOP_SET = {};
  STOP.forEach(function (w) { STOP_SET[w] = true; });

  function words(text) {
    var found = String(text).toLowerCase().match(/[a-z0-9][a-z0-9'\u2019-]*/g);
    return found || [];
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();
    var table = TK.el('div', { class: 'tk-out' });
    table.render = function (pairs) {
      table.textContent = '';
      pairs.forEach(function (p) {
        var row = TK.el('div', { class: 'tk-row' });
        row.appendChild(TK.el('span', { class: 'tk-row-label' }, p[0]));
        row.appendChild(TK.el('span', { class: 'tk-row-value' }, p[1]));
        table.appendChild(row);
      });
      table.hidden = !pairs.length;
    };
    table.hidden = true;

    var field = TK.textarea({
      id: 'kd-input',
      label: ui('text'),
      rows: 8,
      placeholder: ui('placeholder'),
      onInput: render
    });

    var skip = TK.checkbox({
      id: 'kd-stop',
      label: ui('ignoreCommon'),
      onChange: render
    });

    host.appendChild(field.row);
    host.appendChild(skip.row);
    host.appendChild(box);
    host.appendChild(out);
    host.appendChild(table);

    function render() {
      var text = field.textarea.value;
      table.render([]);
      if (!text.trim()) { out.render([]); box.show(ui('empty'), 'warn'); return; }
      if (text.length > MAX_CHARS) {
        out.render([]);
        box.show(ui('tooBig', { max: String(MAX_CHARS) }), 'error');
        return;
      }

      var all = words(text);
      if (!all.length) { out.render([]); box.show(ui('noWords'), 'warn'); return; }
      if (all.length > MAX_WORDS) {
        out.render([]);
        box.show(ui('tooMany', { max: String(MAX_WORDS) }), 'error');
        return;
      }

      var counted = skip.input.checked ? all.filter(function (w) { return !STOP_SET[w]; }) : all;
      var total = counted.length;
      if (!total) {
        out.render([]);
        box.show(ui('allCommon'), 'warn');
        return;
      }

      var freq = {};
      counted.forEach(function (w) { freq[w] = (freq[w] || 0) + 1; });
      var keys = Object.keys(freq);
      keys.sort(function (a, b) {
        if (freq[b] !== freq[a]) return freq[b] - freq[a];
        return a < b ? -1 : a > b ? 1 : 0;
      });

      var rows = keys.slice(0, TOP).map(function (w) {
        var pct = (freq[w] / total) * 100;
        return [w, TK.num(freq[w], 0) + ' ×  ' + TK.num(pct, 2) + '%'];
      });

      out.render([
        [ui('totalWords'), TK.num(all.length, 0)],
        [ui('unique'), TK.num(keys.length, 0)],
        [ui('countedInline'), TK.num(total, 0)],
        [ui('topWord'), keys.length ? keys[0] : '—']
      ]);
      table.render(rows);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
