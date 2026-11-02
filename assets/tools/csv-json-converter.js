/* ============================================================
   CSV <-> JSON converter — a character-by-character CSV reader
   (quotes hold commas and line breaks, doubled quotes are one
   literal quote) and a JSON writer that quotes only what needs
   quoting. Both directions run in this page.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_CHARS = 200000;
  var MAX_ROWS = 2000;

  function parseCSV(text) {
    var s = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var rows = [], row = [], field = '', inQuotes = false, i = 0;
    while (i < s.length) {
      var c = s.charAt(i);
      if (inQuotes) {
        if (c === '"') {
          if (s.charAt(i + 1) === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += c; i++;
    }
    row.push(field);
    rows.push(row);
    /* A file ending in a newline does not start a new row. */
    if (rows.length > 1 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
      rows.pop();
    }
    return rows;
  }

  function cell(value) {
    if (value === null || value === undefined) return '';
    var s = typeof value === 'string' ? value
      : (typeof value === 'object' ? JSON.stringify(value) : String(value));
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var field = TK.textarea({
      id: 'cv-input',
      label: ui('label'),
      rows: 8,
      placeholder: 'name,qty,price\nWidget,3,2.50',
      onInput: render
    });

    var dir = TK.select({
      id: 'cv-dir',
      label: ui('direction'),
      value: 'c2j',
      options: [
        { value: 'c2j', label: ui('c2j') },
        { value: 'j2c', label: ui('j2c') }
      ],
      onChange: render
    });

    var header = TK.checkbox({
      id: 'cv-header',
      label: ui('header'),
      checked: true,
      onChange: render
    });

    var resWrap = TK.el('div', { class: 'tk-field' });
    resWrap.appendChild(TK.el('label', { for: 'cv-out' }, ui('output')));
    var resTa = TK.el('textarea', {
      id: 'cv-out', rows: 8, readonly: '', spellcheck: 'false'
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

    host.appendChild(dir.row);
    host.appendChild(header.row);
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
    function fail(text) { reset(); box.show(text, 'error'); }

    function csvToJSON(text) {
      var rows = parseCSV(text);
      if (!rows.length || (rows.length === 1 && rows[0].length === 1 && rows[0][0] === '')) {
        fail(ui('empty'));
        return;
      }
      if (rows.length > MAX_ROWS) { fail(ui('tooMany')); return; }

      var useHeader = header.input.checked;
      var keys = useHeader ? rows[0] : null;
      var dataRows = useHeader ? rows.slice(1) : rows;
      var ragged = 0;
      if (useHeader) {
        for (var r = 0; r < dataRows.length; r++) {
          if (dataRows[r].length > keys.length) { ragged = r + 2; break; }
        }
      }

      var arr = dataRows.map(function (cols) {
        if (!useHeader) return cols;
        var obj = {};
        for (var k = 0; k < keys.length; k++) {
          obj[keys[k]] = cols[k] !== undefined ? cols[k] : '';
        }
        return obj;
      });

      resTa.value = JSON.stringify(arr, null, 2);
      resWrap.hidden = false;
      copyBtn.disabled = false;
      out.render([
        [ui('label'), String(rows.length)],
        [ui('objects'), String(arr.length)]
      ]);
      box.show(ragged ? ui('ragged', { n: String(ragged) }) : ui('note'),
        ragged ? 'warn' : '');
    }

    function jsonToCSV(text) {
      var data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        fail(ui('badJson'));
        return;
      }
      if (Array.isArray(data) && data.length && Array.isArray(data[0])) {
        /* Array of arrays: the first row is the header when ticked. */
        var rowsA = data.map(function (r) { return r.map(cell).join(','); });
        resTa.value = header.input.checked ? rowsA.join('\n') : rowsA.slice(1).join('\n');
        resWrap.hidden = false;
        copyBtn.disabled = false;
        out.render([[ui('label'), String(data.length)]]);
        box.show(ui('note'), '');
        return;
      }
      if (!Array.isArray(data)) {
        if (data && typeof data === 'object') data = [data];
        else { fail(ui('badJson')); return; }
      }
      if (data.length > MAX_ROWS) { fail(ui('tooMany')); return; }
      if (!data.length) { fail(ui('empty')); return; }
      var bad = data.some(function (o) { return !o || typeof o !== 'object' || Array.isArray(o); });
      if (bad) { fail(ui('badJson')); return; }

      var keys = Object.keys(data[0]);
      var lines = [];
      if (header.input.checked) lines.push(keys.map(cell).join(','));
      data.forEach(function (obj) {
        lines.push(keys.map(function (k) { return cell(obj[k]); }).join(','));
      });
      resTa.value = lines.join('\n');
      resWrap.hidden = false;
      copyBtn.disabled = false;
      out.render([
        [ui('label'), String(data.length + (header.input.checked ? 1 : 0))],
        [ui('fields'), String(keys.length)]
      ]);
      box.show(ui('note'), '');
    }

    function render() {
      var text = field.textarea.value;
      if (!text.trim()) { reset(); box.show(ui('empty'), 'warn'); return; }
      if (text.length > MAX_CHARS) { fail(ui('tooLong')); return; }
      if (dir.select.value === 'c2j') csvToJSON(text);
      else jsonToCSV(text);
    }

    render();
  }

  return { mount: mount };
})();