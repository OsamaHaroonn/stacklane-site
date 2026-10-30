/* ============================================================
   ToolKit — the shared, dependency-free UI layer for every tool
   page (assets/tools/<slug>.js).

   Everything here is DOM built in the browser: no framework, no
   build step, no third-party request. Text comes in through the
   `ui()` / `common()` helpers chrome.js passes to TOOL.mount.
   ============================================================ */
window.ToolKit = (function () {
  'use strict';

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    if (text != null) node.textContent = text;
    return node;
  }

  function field(opts) {
    var id = opts.id;
    var row = el('div', { class: 'tk-field' + (opts.class ? ' ' + opts.class : '') });
    var label = el('label', { for: id }, opts.label);
    if (opts.hint) label.appendChild(el('span', { class: 'hint' }, opts.hint));
    row.appendChild(label);

    var attrs = {
      id: id,
      type: opts.type || 'text',
      value: opts.value != null ? String(opts.value) : '',
      autocomplete: 'off',
      spellcheck: 'false'
    };
    if (opts.inputmode) attrs.inputmode = opts.inputmode;
    if (opts.min != null) attrs.min = opts.min;
    if (opts.max != null) attrs.max = opts.max;
    if (opts.step != null) attrs.step = opts.step;
    if (opts.placeholder) attrs.placeholder = opts.placeholder;
    var input = el('input', attrs);
    row.appendChild(input);
    if (opts.onInput) input.addEventListener('input', opts.onInput);
    if (opts.onChange) input.addEventListener('change', opts.onChange);
    return { row: row, input: input };
  }

  function select(opts) {
    var id = opts.id;
    var row = el('div', { class: 'tk-field' + (opts.class ? ' ' + opts.class : '') });
    row.appendChild(el('label', { for: id }, opts.label));
    var sel = el('select', { id: id });
    (opts.options || []).forEach(function (o) {
      var opt = el('option', { value: o.value }, o.label);
      if (o.value === opts.value) opt.setAttribute('selected', '');
      sel.appendChild(opt);
    });
    row.appendChild(sel);
    if (opts.onChange) sel.addEventListener('change', opts.onChange);
    return { row: row, select: sel };
  }

  function checkbox(opts) {
    var id = opts.id;
    var lab = el('label', { class: 'tk-check', for: id });
    var input = el('input', { id: id, type: 'checkbox' });
    if (opts.checked) input.setAttribute('checked', '');
    lab.appendChild(input);
    lab.appendChild(el('span', {}, opts.label));
    if (opts.onChange) input.addEventListener('change', opts.onChange);
    return { row: lab, input: input };
  }

  function textarea(opts) {
    var id = opts.id;
    var wrap = el('div', { class: 'tk-field' + (opts.class ? ' ' + opts.class : '') });
    wrap.appendChild(el('label', { for: id }, opts.label));
    var ta = el('textarea', { id: id, rows: opts.rows || 8, placeholder: opts.placeholder || '', spellcheck: 'false' });
    wrap.appendChild(ta);
    if (opts.onInput) ta.addEventListener('input', opts.onInput);
    return { row: wrap, textarea: ta };
  }

  function fileInput(opts) {
    var id = opts.id;
    var wrap = el('div', { class: 'tk-field tk-file' + (opts.class ? ' ' + opts.class : '') });
    var label = el('div', { class: 'tk-file-label' }, opts.label);
    wrap.appendChild(label);

    var input = el('input', { id: id, type: 'file', accept: opts.accept || '', class: 'tk-file-input' });
    if (opts.multiple) input.setAttribute('multiple', '');
    // A real <label for> forwards the tap to the input, so the target stays
    // 44px and keyboard users can still focus the file input itself.
    var btn = el('label', { class: 'btn btn-secondary tk-file-btn', 'for': id }, opts.browse);
    var name = el('span', { class: 'tk-file-name' }, opts.none || '');
    wrap.appendChild(input);
    wrap.appendChild(btn);
    wrap.appendChild(name);

    input.addEventListener('change', function () {
      var n = input.files ? input.files.length : 0;
      name.textContent = !n ? (opts.none || '')
        : n === 1 ? input.files[0].name
        : n + ' × ' + input.files[0].name;
      name.classList.toggle('has-files', !!n);
      if (opts.onChange) opts.onChange();
    });
    return { row: wrap, input: input };
  }

  function btn(label, onClick, opts) {
    opts = opts || {};
    var b = el('button', {
      class: 'btn' + (opts.secondary ? ' btn-secondary' : ''),
      type: 'button'
    }, label);
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }

  function msg() {
    var box = el('p', { class: 'tk-msg', role: 'status', 'aria-live': 'polite' });
    box.show = function (text, kind) {
      box.textContent = text || '';
      box.className = 'tk-msg' + (kind ? ' ' + kind : '');
      box.hidden = !text;
    };
    box.clear = function () { box.show('', ''); };
    box.hidden = true;
    return box;
  }

  function progressBar() {
    var wrap = el('div', { class: 'tk-progress', hidden: '' });
    var bar = el('div', { class: 'tk-progress-bar' });
    var text = el('span', { class: 'tk-progress-text' });
    wrap.appendChild(bar);
    wrap.appendChild(text);
    wrap.update = function (pct, label) {
      wrap.hidden = false;
      bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
      if (label) text.textContent = label;
    };
    wrap.done = function (label) {
      wrap.update(100, label);
      wrap.classList.add('is-done');
    };
    wrap.reset = function () {
      wrap.hidden = true;
      wrap.classList.remove('is-done');
      bar.style.width = '0%';
      text.textContent = '';
    };
    return wrap;
  }

  /* Output as label/value rows rebuilt from an array of pairs. */
  function rows() {
    var box = el('div', { class: 'tk-out' });
    box.render = function (pairs) {
      box.textContent = '';
      pairs.forEach(function (p) {
        if (!p || p[1] == null || p[1] === '') return;
        var row = el('div', { class: 'tk-row' + (p[2] ? ' ' + p[2] : '') });
        row.appendChild(el('span', { class: 'tk-row-label' }, p[0]));
        row.appendChild(el('span', { class: 'tk-row-value' }, p[1]));
        box.appendChild(row);
      });
      box.hidden = !pairs.length;
    };
    box.hidden = true;
    return box;
  }

  function bytes(n) {
    if (!isFinite(n) || n < 0) return '—';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  }

  /* Locale-aware number formatting that never prints NaN or -0. */
  function num(n, digits) {
    if (!isFinite(n)) return '—';
    if (Math.abs(n) < Math.pow(10, -(digits == null ? 2 : digits)) / 2) n = 0;
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits == null ? 2 : digits
    });
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function copy(text, onDone) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (onDone) onDone(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { if (onDone) onDone(true); }, fallback);
    } else {
      fallback();
    }
  }

  /* A yyyy-mm-dd string → {y,m,d}, parsed by hand so no time zone can
     move the date. Invalid input returns null instead of NaN. */
  function parseDate(str) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || '').trim());
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    var date = new Date(y, mo - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
    return { y: y, m: mo, d: d };
  }

  function today() {
    var n = new Date();
    var mm = String(n.getMonth() + 1).padStart(2, '0');
    var dd = String(n.getDate()).padStart(2, '0');
    return n.getFullYear() + '-' + mm + '-' + dd;
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = function () { reject(new Error('read failed')); };
      fr.readAsArrayBuffer(file);
    });
  }

  /* Wrap a handler so any thrown error becomes a visible message,
     never an uncaught console error or a frozen tab. */
  function guard(box, handler) {
    return function () {
      try {
        var r = handler.apply(null, arguments);
        if (r && typeof r.catch === 'function') {
          r.catch(function (e) { box.show(String((e && e.message) || e), 'error'); });
        }
        return r;
      } catch (e) {
        box.show(String((e && e.message) || e), 'error');
      }
    };
  }

  function yieldTab() {
    return new Promise(function (r) { setTimeout(r, 16); });
  }

  return {
    el: el, field: field, select: select, checkbox: checkbox,
    textarea: textarea, fileInput: fileInput, btn: btn,
    msg: msg, progressBar: progressBar, rows: rows,
    bytes: bytes, num: num, download: download, copy: copy,
    parseDate: parseDate, today: today, readFile: readFile,
    guard: guard, yieldTab: yieldTab
  };
})();
