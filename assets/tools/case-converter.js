/* ============================================================
   Case converter — ten text cases, converted as you type.

   Every transform is a pure string operation: nothing leaves the
   tab. Text longer than the limit is refused with a message so a
   paste of a whole book cannot lock the page up.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var LIMIT = 500000;

  function words(s) { return s.split(/[^\p{L}\p{N}]+/u).filter(Boolean); }

  function titleCase(s) {
    return words(s).map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
  }

  function sentenceCase(s) {
    var lower = s.toLowerCase();
    return lower.replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, function (m) { return m.toUpperCase(); });
  }

  function camel(s, pascal) {
    var parts = words(s);
    if (!parts.length) return '';
    return parts.map(function (w, i) {
      if (i === 0 && !pascal) return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join('');
  }

  function joined(s, sep) {
    var parts = words(s);
    if (!parts.length) return '';
    return parts.map(function (w) { return w.toLowerCase(); }).join(sep);
  }

  function alternating(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      out += i % 2 ? c.toUpperCase() : c.toLowerCase();
    }
    return out;
  }

  var MODES = {
    upper: function (s) { return s.toUpperCase(); },
    lower: function (s) { return s.toLowerCase(); },
    title: titleCase,
    sentence: sentenceCase,
    camel: function (s) { return camel(s, false); },
    pascal: function (s) { return camel(s, true); },
    snake: function (s) { return joined(s, '_'); },
    kebab: function (s) { return joined(s, '-'); },
    alternating: alternating,
    reverse: function (s) { return Array.from(s).reverse().join(''); }
  };

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var input = TK.textarea({
      id: 'case-in', label: ui('input'), rows: 7,
      placeholder: ui('placeholder'), onInput: render
    });

    var mode = TK.select({
      id: 'case-mode', label: ui('mode'), value: 'upper',
      options: Object.keys(MODES).map(function (k) {
        return { value: k, label: ui(k) };
      }),
      onChange: render
    });

    var output = TK.textarea({ id: 'case-out', label: ui('output'), rows: 7 });
    output.textarea.setAttribute('readonly', '');
    output.row.hidden = true;

    var actions = TK.el('div', { class: 'tk-actions' });
    var copyBtn = TK.btn(ui('copy'), function () {
      if (!output.textarea.value) { box.show(ui('empty'), 'warn'); return; }
      TK.copy(output.textarea.value, function (ok) {
        box.show(ok ? ui('copied') : ui('copyFail'), ok ? '' : 'error');
      });
    });
    copyBtn.disabled = true;
    actions.appendChild(copyBtn);
    actions.appendChild(TK.btn(common('clear'), function () {
      input.textarea.value = '';
      render();
      input.textarea.focus();
    }, { secondary: true }));

    host.appendChild(input.row);
    host.appendChild(mode.row);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(output.row);
    host.appendChild(out);

    function render() {
      var text = input.textarea.value;

      if (!text) {
        output.row.hidden = true;
        copyBtn.disabled = true;
        out.render([]);
        box.show(ui('empty'), 'warn');
        return;
      }
      if (text.length > LIMIT) {
        output.row.hidden = true;
        copyBtn.disabled = true;
        out.render([]);
        box.show(ui('tooLong'), 'error');
        return;
      }

      var key = mode.select.value;
      var fn = MODES[key] || MODES.upper;
      var result;
      try {
        result = fn(text);
      } catch (e) {
        output.row.hidden = true;
        copyBtn.disabled = true;
        out.render([]);
        box.show(String((e && e.message) || e), 'error');
        return;
      }

      output.textarea.value = result;
      output.row.hidden = false;
      copyBtn.disabled = false;
      out.render([
        [ui('chars'), TK.num(text.length, 0)],
        [ui('charsOut'), TK.num(result.length, 0)],
        [ui('applied'), ui(key)]
      ]);
      box.clear();
    }

    render();
  }

  return { mount: mount };
})();
