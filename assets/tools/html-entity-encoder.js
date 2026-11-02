/* ============================================================
   HTML entity encoder — encode special characters to entities
   and decode them back. The result is only ever written into a
   read-only text box, never into the page as markup, and no
   request carries the text anywhere.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_CHARS = 20000;

  /* Ampersand built at runtime so this file never contains a
     literal entity that could be mangled before it loads. */
  var A = String.fromCharCode(38);
  var AMP = A + 'amp;', LT = A + 'lt;', GT = A + 'gt;';
  var QUOT = A + 'quot;', NBSP = A + 'nbsp;', HASH = A + '#39;';

  /* Keyed by the name the regex captures, without the leading ampersand. */
  var NAMED = {};
  NAMED['amp'] = A;
  NAMED['lt'] = '<';
  NAMED['gt'] = '>';
  NAMED['quot'] = '"';
  NAMED['nbsp'] = '\u00a0';

  var DECODE_RE = new RegExp(
    A + '(amp|lt|gt|quot|nbsp|#\\d+|#x[0-9a-fA-F]+);', 'g');

  function encode(text) {
    /* Ampersand first, so no entity created here is decoded again. */
    return String(text)
      .split(A).join(AMP)
      .split('<').join(LT)
      .split('>').join(GT)
      .split('"').join(QUOT)
      .split("'").join(HASH);
  }

  function decode(text) {
    return String(text).replace(DECODE_RE, function (whole, name) {
      if (name.charAt(0) === '#') {
        var code = (name.charAt(1) === 'x' || name.charAt(1) === 'X')
          ? parseInt(name.slice(2), 16)
          : parseInt(name.slice(1), 10);
        if (!isFinite(code) || code < 0 || code > 0x10FFFF) return whole;
        try { return String.fromCodePoint(code); } catch (e) { return whole; }
      }
      return NAMED[name];
    });
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var field = TK.textarea({
      id: 'he-input',
      label: ui('label'),
      rows: 6,
      placeholder: '<b>Hello</b>',
      onInput: render
    });

    var mode = TK.select({
      id: 'he-mode',
      label: ui('mode'),
      value: 'enc',
      options: [
        { value: 'enc', label: ui('encMode') },
        { value: 'dec', label: ui('decMode') }
      ],
      onChange: render
    });

    var resWrap = TK.el('div', { class: 'tk-field' });
    resWrap.appendChild(TK.el('label', { for: 'he-out' }, ui('output')));
    var resTa = TK.el('textarea', {
      id: 'he-out', rows: 6, readonly: '', spellcheck: 'false'
    });
    resWrap.appendChild(resTa);
    resWrap.hidden = true;

    var copyBtn = TK.btn(common('copy'), function () {
      if (!resTa.value) return;
      TK.copy(resTa.value, function (ok) {
        copyBtn.textContent = ok ? common('copied') : common('copyFailed');
        setTimeout(function () { copyBtn.textContent = common('copy'); }, 1800);
      });
    }, { secondary: true });
    copyBtn.disabled = true;

    host.appendChild(mode.row);
    host.appendChild(field.row);
    host.appendChild(box);
    host.appendChild(out);
    host.appendChild(resWrap);
    host.appendChild(copyBtn);

    function reset() {
      resTa.value = '';
      resWrap.hidden = true;
      copyBtn.disabled = true;
      out.render([]);
    }

    function render() {
      var text = field.textarea.value;
      if (!text.length) {
        reset();
        box.show(ui('empty'), 'warn');
        return;
      }
      if (text.length > MAX_CHARS) {
        reset();
        box.show(ui('tooLong'), 'error');
        return;
      }
      var result = mode.select.value === 'enc' ? encode(text) : decode(text);
      resTa.value = result;
      resWrap.hidden = false;
      copyBtn.disabled = false;
      out.render([
        [ui('label'), String(text.length)],
        [ui('output'), String(result.length)]
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();