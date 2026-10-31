/* ============================================================
   Split PDF — pull a range out of a PDF, or write every page as
   its own file, using the vendored pdf-lib.

   Ranges are written like 1-3, 5, 8-10. Pages are capped so a
   400-page document cannot be turned into 400 downloads in one
   click. Nothing is uploaded.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_SPLIT = 60;

  function parseRange(text, pageCount) {
    var parts = String(text).split(',');
    var picked = [];
    var seen = Object.create(null);

    for (var i = 0; i < parts.length; i++) {
      var chunk = parts[i].trim();
      if (!chunk) continue;

      var m = /^(\d+)\s*(?:-\s*(\d+))?$/.exec(chunk);
      if (!m) return null;

      var from = parseInt(m[1], 10);
      var to = m[2] ? parseInt(m[2], 10) : from;
      if (from < 1 || to < 1 || from > pageCount || to > pageCount) return 'range';
      if (to < from) return 'order';

      for (var p = from; p <= to; p++) {
        if (seen[p]) continue;
        seen[p] = true;
        picked.push(p - 1);   // pdf-lib indices are zero-based
      }
    }
    return picked;
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var progress = TK.progressBar();
    var busy = false;
    var source = null;      // loaded PDFDocument
    var pageCount = 0;
    var fileName = 'document.pdf';

    var picker = TK.fileInput({
      id: 'split-file',
      label: ui('file'),
      accept: 'application/pdf,.pdf',
      browse: ui('browse'),
      none: ui('empty'),
      onChange: function () {
        var f = picker.input.files && picker.input.files[0];
        source = null;
        pageCount = 0;
        downloadBtn.hidden = true;
        out.render([]);
        if (!f) { box.show(ui('empty')); return; }
        if (!window.PDFLib) { box.show(common('error'), 'error'); return; }
        fileName = f.name;
        box.show(ui('loading'));
        TK.readFile(f).then(function (bytes) {
          return window.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: false });
        })
          .then(function (doc) {
            source = doc;
            pageCount = doc.getPageCount();
            out.render([[ui('pages'), TK.num(pageCount, 0)]]);
            box.show(ui('ready'), 'ok');
            renderMode();
          })
          .catch(function () {
            box.show(ui('failed'), 'error');
          });
      }
    });

    var mode = TK.select({
      id: 'split-mode',
      label: ui('mode'),
      value: 'range',
      options: [
        { value: 'range', label: ui('modeRange') },
        { value: 'all', label: ui('modeAll') }
      ],
      onChange: renderMode
    });

    var range = TK.field({
      id: 'split-range', label: ui('range'), type: 'text',
      placeholder: ui('rangePh'), onInput: function () { renderMode(); }
    });

    var out = TK.rows();
    var downloadBtn = TK.btn(ui('download'), function () {
      if (downloadBtn._blob) TK.download(downloadBtn._blob, outName());
    }, { secondary: true });
    downloadBtn.hidden = true;
    downloadBtn._blob = null;

    var splitBtn = TK.btn(ui('split'), function () { run(); });
    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(splitBtn);
    actions.appendChild(downloadBtn);

    host.appendChild(picker.row);
    host.appendChild(mode.row);
    host.appendChild(range.row);
    host.appendChild(actions);
    host.appendChild(progress);
    host.appendChild(box);
    host.appendChild(out);

    var run = TK.guard(box, split);

    function baseName() {
      return fileName.replace(/\.pdf$/i, '') || 'document';
    }

    function outName() {
      if (mode.select.value === 'all') return baseName() + '-part.pdf';
      var cleaned = String(range.input.value).replace(/[^0-9,-]/g, '').replace(/,/g, '_');
      return baseName() + '-pages-' + (cleaned || 'extract') + '.pdf';
    }

    function renderMode() {
      range.row.hidden = mode.select.value !== 'range';
      if (!range.input.value && pageCount && mode.select.value === 'range') {
        range.input.value = pageCount > 1 ? '1-' + Math.min(2, pageCount) : '1';
      }
      if (!source) return;
      var pages = mode.select.value === 'range'
        ? (parseRange(range.input.value, pageCount) || [])
        : null;
      out.render([
        [ui('source'), fileName],
        [ui('pages'), TK.num(pageCount, 0)],
        mode.select.value === 'range'
          ? [ui('selected'), TK.num(Array.isArray(pages) ? pages.length : 0, 0)]
          : [ui('selected'), TK.num(pageCount, 0)]
      ]);
    }

    function split() {
      if (busy) return Promise.resolve();

      if (!source) {
        box.show(picker.input.files && picker.input.files[0] ? ui('loading') : ui('empty'), 'error');
        return Promise.resolve();
      }
      if (!window.PDFLib) { box.show(common('error'), 'error'); return Promise.resolve(); }

      var want = mode.select.value;
      var indices;

      if (want === 'range') {
        indices = parseRange(range.input.value, pageCount);
        if (indices === null) { box.show(ui('badRange'), 'error'); return Promise.resolve(); }
        if (indices === 'range') { box.show(ui('offPage'), 'error'); return Promise.resolve(); }
        if (indices === 'order') { box.show(ui('badOrder'), 'error'); return Promise.resolve(); }
        if (!indices.length) { box.show(ui('noPages'), 'error'); return Promise.resolve(); }
      } else {
        if (pageCount > MAX_SPLIT) { box.show(ui('tooMany'), 'error'); return Promise.resolve(); }
        indices = [];
        for (var i = 0; i < pageCount; i++) indices.push(i);
      }

      busy = true;
      box.clear();
      downloadBtn.hidden = true;
      progress.update(10, ui('working'));

      var PDFDocument = window.PDFLib.PDFDocument;
      var made = [];

      PDFDocument.create()
        .then(function (target) {
          return target.copyPages(source, indices).then(function (copies) {
            copies.forEach(function (p) { target.addPage(p); });
            return target.save();
          });
        })
        .then(function (bytes) {
          if (want === 'range') {
            progress.done(common('done'));
            downloadBtn._blob = new Blob([bytes], { type: 'application/pdf' });
            downloadBtn.hidden = false;
            out.render([
              [ui('source'), fileName],
              [ui('pages'), TK.num(pageCount, 0)],
              [ui('selected'), TK.num(indices.length, 0)],
              [ui('result'), TK.bytes(downloadBtn._blob.size)]
            ]);
            box.show(ui('rangeDone', { n: indices.length }), 'ok');
            return null;
          }
          made = indices;
          progress.update(70, ui('working'));
          return made;
        })
        .then(function (res) {
          if (res === null || res === undefined) return null;
          // One file per page: build each blob in turn so the progress bar paints.
          var chain = Promise.resolve();
          var blobs = [];
          made.forEach(function (idx, i) {
            chain = chain.then(function () {
              progress.update(70 + Math.round((i / made.length) * 25),
                ui('progress', { n: i + 1, total: made.length }));
              return PDFDocument.create()
                .then(function (target) { return target.copyPages(source, [idx]); })
                .then(function (copies) {
                  copies.forEach(function (p) { target.addPage(p); });
                  return target.save();
                })
                .then(function (b) {
                  blobs.push(new Blob([b], { type: 'application/pdf' }));
                });
            });
          });
          return chain.then(function () { return blobs; });
        })
        .then(function (blobs) {
          if (!blobs) return;
          progress.done(common('done'));
          blobs.forEach(function (b, i) {
            TK.download(b, baseName() + '-page-' + (i + 1) + '.pdf');
          });
          out.render([
            [ui('source'), fileName],
            [ui('pages'), TK.num(pageCount, 0)],
            [ui('selected'), TK.num(blobs.length, 0)],
            [ui('result'), TK.bytes(blobs.reduce(function (s, b) { return s + b.size; }, 0))]
          ]);
          box.show(ui('allDone', { n: blobs.length }), 'ok');
        })
        .catch(function (e) {
          progress.reset();
          box.show(ui('failed'), 'error');
          if (window.console) console.warn('split:', e && e.message);
        })
        .then(function () { busy = false; });
    }

    box.show(ui('empty'));
    renderMode();
  }

  return { mount: mount };
})();
