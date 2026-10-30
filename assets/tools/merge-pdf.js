/* ============================================================
   Merge PDF — combines files with the vendored pdf-lib
   (assets/vendor/pdf-lib.min.js), in the order shown, with a
   per-file progress bar and a clear error when a file cannot be
   opened (password-protected or damaged). Files are read and
   written on the device only.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var progress = TK.progressBar();
    var files = [];            // ordered File list
    var busy = false;

    var picker = TK.fileInput({
      id: 'pdf-files',
      label: ui('file'),
      accept: 'application/pdf,.pdf',
      multiple: true,
      browse: ui('browse'),
      none: ui('empty'),
      onChange: function () {
        var list = picker.input.files;
        for (var i = 0; i < list.length; i++) {
          if (files.indexOf(list[i]) === -1) files.push(list[i]);
        }
        picker.input.value = '';   // allow re-picking the same names
        renderList();
        box.clear();
      }
    });

    var listWrap = TK.el('div', { class: 'tk-list', role: 'list', 'aria-label': ui('list') });
    var downloadBtn = TK.btn(ui('download'), function () {
      if (downloadBtn._blob) TK.download(downloadBtn._blob, 'merged.pdf');
    }, { secondary: true });
    downloadBtn.hidden = true;
    downloadBtn._blob = null;

    var mergeBtn = TK.btn(ui('merge'), function () { run(); });
    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(mergeBtn);
    actions.appendChild(downloadBtn);

    host.appendChild(picker.row);
    host.appendChild(listWrap);
    host.appendChild(actions);
    host.appendChild(progress);
    host.appendChild(box);

    var run = TK.guard(box, merge);

    function move(i, delta) {
      var j = i + delta;
      if (j < 0 || j >= files.length) return;
      var tmp = files[i];
      files[i] = files[j];
      files[j] = tmp;
      renderList();
    }

    function renderList() {
      listWrap.textContent = '';
      listWrap.hidden = files.length === 0;
      files.forEach(function (f, i) {
        var row = TK.el('div', { class: 'tk-list-row', role: 'listitem' });
        row.appendChild(TK.el('span', { class: 'tk-list-index' }, String(i + 1)));
        row.appendChild(TK.el('span', { class: 'tk-list-name' }, f.name));
        row.appendChild(TK.el('span', { class: 'tk-list-size' }, TK.bytes(f.size)));

        var up = TK.btn(ui('up'), function () { move(i, -1); }, { secondary: true });
        up.className = 'btn btn-secondary tk-icon-btn';
        up.setAttribute('aria-label', ui('up') + ': ' + f.name);
        var down = TK.btn(ui('down'), function () { move(i, 1); }, { secondary: true });
        down.className = 'btn btn-secondary tk-icon-btn';
        down.setAttribute('aria-label', ui('down') + ': ' + f.name);
        var del = TK.btn(ui('remove'), function () {
          files.splice(i, 1);
          renderList();
        }, { secondary: true });
        del.className = 'btn btn-secondary tk-icon-btn is-danger';
        del.setAttribute('aria-label', ui('remove') + ': ' + f.name);

        var tools = TK.el('div', { class: 'tk-list-actions' });
        tools.appendChild(up);
        tools.appendChild(down);
        tools.appendChild(del);
        row.appendChild(tools);
        listWrap.appendChild(row);
      });
    }

    function merge() {
      if (busy) return Promise.resolve();
      if (files.length < 2) {
        box.show(files.length ? ui('oneOnly') : ui('empty'), 'error');
        return Promise.resolve();
      }
      if (!window.PDFLib) {
        box.show(common('error'), 'error');
        return Promise.resolve();
      }

      busy = true;
      box.clear();
      downloadBtn.hidden = true;
      progress.update(0, ui('working'));

      var PDFDocument = window.PDFLib.PDFDocument;
      var target;

      PDFDocument.create()
        .then(function (doc) {
          target = doc;
          var chain = Promise.resolve();
          files.forEach(function (file, i) {
            chain = chain.then(function () {
              progress.update(Math.round((i / files.length) * 90),
                ui('progress', { n: i + 1, total: files.length }));
              return TK.readFile(file).then(function (bytes) {
                return PDFDocument.load(bytes, { ignoreEncryption: false });
              }).then(function (src) {
                var pages = src.getPageIndices();
                return target.copyPages(src, pages);
              }).then(function (copies) {
                copies.forEach(function (p) { target.addPage(p); });
              });
            });
            // Let the progress bar paint between files.
            chain = chain.then(function () { return TK.yieldTab(); });
          });
          return chain;
        })
        .then(function () {
          progress.update(95, ui('working'));
          return target.save();
        })
        .then(function (bytes) {
          var blob = new Blob([bytes], { type: 'application/pdf' });
          downloadBtn._blob = blob;
          downloadBtn.hidden = false;
          progress.done(common('done'));
          box.show(files.length + ' → 1 · ' + TK.bytes(blob.size), 'ok');
        })
        .catch(function (e) {
          progress.reset();
          box.show(ui('failed'), 'error');
          if (window.console) console.warn('merge:', e && e.message);
        })
        .then(function () { busy = false; });
    }

    renderList();
    box.show(ui('empty'));
  }

  return { mount: mount };
})();