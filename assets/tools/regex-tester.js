/* ============================================================
   Regex tester — compiles with the RegExp constructor, never
   eval. Inputs are capped and nested quantifiers are refused so
   a catastrophic pattern cannot freeze the tab.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_PATTERN = 300;
  var MAX_TEXT = 5000;
  var MAX_SHOWN = 100;
  var MAX_MATCHES = 1000;

  /* (quantifier inside a group) followed by another quantifier. */
  var RISKY = /\((?:\\.|[^()\\])*[+*](?:\\.|[^()\\])*\)[+*{]/;

  function clean(value) {
    return String(value).replace(/\n/g, '\u23ce').replace(/\t/g, '\u2192');
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var pattern = TK.field({
      id: 're-pattern', label: ui('pattern'), placeholder: '(\\w+)@example\\.com'
    });
    var text = TK.textarea({ id: 're-text', label: ui('text'), rows: 6 });

    var flagWrap = TK.el('div', { class: 'tk-field', role: 'group', 'aria-label': ui('flags') });
    flagWrap.appendChild(TK.el('span', { class: 'card-kicker' }, ui('flags')));
    var checks = TK.el('div', { class: 'checks' });
    var flagInputs = {};
    ['g', 'i', 'm', 's', 'u'].forEach(function (f) {
      var c = TK.checkbox({
        id: 're-flag-' + f, label: f, checked: f === 'g'
      });
      flagInputs[f] = c.input;
      checks.appendChild(c.row);
    });
    flagWrap.appendChild(checks);

    host.appendChild(pattern.row);
    host.appendChild(flagWrap);
    host.appendChild(text.row);
    host.appendChild(box);
    host.appendChild(out);

    function flags() {
      return ['g', 'i', 'm', 's', 'u'].filter(function (f) {
        return flagInputs[f].checked;
      }).join('');
    }

    function noMatchRow() {
      out.render([]);
    }

    function render() {
      var src = String(pattern.input.value);
      var subject = String(text.textarea.value);

      if (!src && !subject) { noMatchRow(); box.show(ui('empty'), 'warn'); return; }
      if (!src) { noMatchRow(); box.show(ui('empty'), 'warn'); return; }
      if (!subject) { noMatchRow(); box.show(ui('noText'), 'warn'); return; }
      if (src.length > MAX_PATTERN) { noMatchRow(); box.show(ui('tooLong'), 'error'); return; }
      if (subject.length > MAX_TEXT) { noMatchRow(); box.show(ui('textTooLong'), 'error'); return; }
      if (RISKY.test(src)) { noMatchRow(); box.show(ui('risky'), 'error'); return; }

      var fl = flags();
      var re;
      try {
        re = new RegExp(src, fl);
      } catch (e) {
        noMatchRow();
        box.show(ui('badPattern', { message: String(e.message || e) }), 'error');
        return;
      }

      var list = [];
      if (fl.indexOf('g') !== -1) {
        var m, guard = 0;
        while ((m = re.exec(subject)) !== null) {
          list.push(m);
          if (m[0].length === 0) re.lastIndex++;
          if (list.length >= MAX_MATCHES) break;
          if (++guard > MAX_MATCHES * 2) break;
        }
      } else {
        var one = re.exec(subject);
        if (one) list.push(one);
      }

      if (!list.length) {
        noMatchRow();
        box.show(ui('noMatches'), 'warn');
        return;
      }

      var rows = [[ui('matches'), TK.num(list.length, 0), 'is-strong']];
      list.slice(0, MAX_SHOWN).forEach(function (match, index) {
        var from = match.index;
        var to = from + match[0].length;
        rows.push([
          ui('match', { n: index + 1 }) + ' \u00b7 ' + ui('index', { from: from, to: to }),
          clean(match[0]) || '(empty match)'
        ]);
        for (var g = 1; g < match.length && g <= 20; g++) {
          var value = match[g];
          rows.push([
            '\u21b3 ' + ui('group', { n: g }),
            value == null ? '(not matched)' : (clean(value) || '(empty)')
          ]);
        }
        if (match.groups) {
          Object.keys(match.groups).forEach(function (name) {
            var v = match.groups[name];
            rows.push([
              '\u21b3 ' + ui('named') + ' ' + name,
              v == null ? '(not matched)' : (clean(v) || '(empty)')
            ]);
          });
        }
      });

      out.render(rows);
      box.show(list.length > MAX_SHOWN ? ui('capped') : ui('note'), '');
    }

    [pattern.input, text.textarea].forEach(function (node) {
      node.addEventListener('input', render);
    });
    Object.keys(flagInputs).forEach(function (f) {
      flagInputs[f].addEventListener('change', render);
    });

    render();
  }

  return { mount: mount };
})();
