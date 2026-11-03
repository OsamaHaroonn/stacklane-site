window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_CHARS = 50000;

  var KEYS = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'ORDER', 'BY',
    'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
    'DELETE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'ON', 'AS',
    'DISTINCT', 'UNION', 'ALL', 'LIKE', 'BETWEEN', 'ASC', 'DESC', 'CASE', 'WHEN', 'THEN',
    'ELSE', 'END', 'CREATE', 'TABLE', 'PRIMARY', 'KEY', 'VARCHAR', 'INT', 'TEXT', 'DEFAULT',
    'EXISTS', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];

  var BREAK = 'FROM|WHERE|GROUP\\s+BY|ORDER\\s+BY|HAVING|LIMIT|OFFSET|UNION(?:\\s+ALL)?|VALUES|SET|' +
    '(?:INNER|LEFT|RIGHT|FULL|CROSS)?\\s*JOIN';

  function format(sql) {
    var stash = [];
    var guarded = sql.replace(/'(?:[^']|'')*'|"(?:[^"]|"")*"|`[^`]*`/g, function (m) {
      stash.push(m);
      return '\u0001' + (stash.length - 1) + '\u0001';
    });

    var text = guarded.replace(/\s+/g, ' ').trim();
    text = text.replace(new RegExp('\\s+(' + BREAK + ')\\b', 'gi'), '\n$1');
    text = text.replace(new RegExp('\\b(' + KEYS.join('|') + ')\\b', 'gi'), function (m) {
      return m.toUpperCase();
    });

    return text.replace(/\u0001(\d+)\u0001/g, function (m, i) {
      return stash[parseInt(i, 10)];
    });
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();
    var outWrap = TK.el('div', { class: 'tk-field' });
    var outArea = TK.el('textarea', {
      id: 'sq-out', rows: 12, readonly: '', 'aria-label': ui('output'), spellcheck: 'false'
    });
    outWrap.appendChild(TK.el('label', { for: 'sq-out' }, ui('output')));
    outWrap.appendChild(outArea);

    var field = TK.textarea({
      id: 'sq-input',
      label: ui('sql'),
      rows: 8,
      placeholder: 'select id, name from users where active = 1 order by name limit 10;',
      onInput: render
    });

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('copy'), function () {
      if (!outArea.value) { box.show(ui('nothingToCopy'), 'warn'); return; }
      TK.copy(outArea.value, function (ok) {
        box.show(ok ? ui('copied') : ui('copyFailed'), ok ? 'ok' : 'error');
      });
    }, { secondary: true }));

    host.appendChild(field.row);
    host.appendChild(box);
    host.appendChild(outWrap);
    host.appendChild(actions);
    host.appendChild(out);

    function render() {
      var sql = field.textarea.value;
      if (!sql.trim()) { outArea.value = ''; out.render([]); box.show(ui('empty'), 'warn'); return; }
      if (sql.length > MAX_CHARS) {
        outArea.value = '';
        out.render([]);
        box.show(ui('tooBig', { max: String(MAX_CHARS) }), 'error');
        return;
      }

      var text = format(sql);
      outArea.value = text;
      out.render([
        [ui('lines'), TK.num(text.split('\n').length, 0)],
        [ui('chars'), TK.num(text.length, 0)]
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
