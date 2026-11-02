/* ============================================================
   Slug generator — text to a URL-safe slug.
   Lowercase, Unicode-normalise, drop accents, collapse every
   run of non letter/digit characters into one separator.
   Everything happens in the page; nothing is stored or sent.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_CHARS = 500;

  /* Split runs of anything that is not a letter or a digit.
     Built at runtime so an old engine without property escapes
     falls back to ASCII instead of breaking the whole script. */
  var KEEP;
  try { KEEP = new RegExp('[^\\p{L}\\p{N}]+', 'gu'); }
  catch (e) { KEEP = /[^a-zA-Z0-9]+/g; }

  function slugify(text, sep) {
    var s = String(text).toLowerCase();
    s = s.replace(/ß/g, 'ss');
    if (s.normalize) s = s.normalize('NFKD');
    s = s.replace(/[\u0300-\u036f]/g, '');
    var parts = s.split(KEEP);
    var clean = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] !== '') clean.push(parts[i]);
    }
    return clean.join(sep);
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var field = TK.textarea({
      id: 'slug-input',
      label: ui('label'),
      rows: 4,
      placeholder: 'Café Zürich 2026!',
      onInput: render
    });

    var sep = TK.select({
      id: 'slug-sep',
      label: ui('sep'),
      value: '-',
      options: [
        { value: '-', label: ui('hyphen') },
        { value: '_', label: ui('underscore') },
        { value: ' ', label: ui('space') }
      ],
      onChange: render
    });

    var resWrap = TK.el('div', { class: 'tk-field' });
    resWrap.appendChild(TK.el('label', { for: 'slug-out' }, ui('output')));
    var resTa = TK.el('textarea', {
      id: 'slug-out', rows: 3, readonly: '', spellcheck: 'false'
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

    host.appendChild(field.row);
    host.appendChild(sep.row);
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
      var raw = field.textarea.value;
      if (!raw.replace(/\s+/g, '')) {
        reset();
        box.show(ui('empty'), 'warn');
        return;
      }
      if (raw.length > MAX_CHARS) {
        reset();
        box.show(ui('tooLong'), 'error');
        return;
      }
      var result = slugify(raw, sep.select.value);
      if (!result) {
        reset();
        box.show(ui('noWords'), 'error');
        return;
      }
      resTa.value = result;
      resWrap.hidden = false;
      copyBtn.disabled = false;
      out.render([
        [ui('chars'), String(result.length)],
        [ui('sep'), sep.select.value === ' ' ? ui('space') : sep.select.value]
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();