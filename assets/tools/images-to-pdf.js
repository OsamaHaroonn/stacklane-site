/* ============================================================
   Images to PDF — puts a list of images into one PDF with the
   vendored pdf-lib (assets/vendor/pdf-lib.min.js).

   JPEG and PNG files are embedded as they are; anything else
   (WebP, GIF, SVG, BMP) is decoded to a canvas and re-encoded
   as PNG first, because pdf-lib only understands those two.
   Files never leave the device.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_FILES = 40;
  var MAX_BYTES = 60 * 1024 * 1024;
  var MAX_PIXELS = 40000000;

  var PAGE = {
    a4: [595.28, 841.89],
    letter: [612, 792]
  };

  function viaImg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }

  function toPng(img) {
    var w = img.naturalWidth || img.width;
    var h = img.naturalHeight || img.height;
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0);
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob); else reject(new Error('encode'));
      }, 'image/png');
    });
  }

  function blobBytes(blob) {
    if (blob.arrayBuffer) return blob.arrayBuffer().then(function (b) { return new Uint8Array(b); });
    return TK.readFile(blob).then(function (b) { return new Uint8Array(b); });
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var progress = TK.progressBar();
    var files = [];
    var busy = false;

    var picker = TK.fileInput({
      id: 'i2p-files',
      label: ui('file'),
      accept: 'image/*',
      multiple: true,
      browse: ui('browse'),
      none: ui('empty'),
      onChange: function () {
        var list = picker.input.files;
        for (var i = 0; i < list.length; i++) {
          if (files.indexOf(list[i]) === -1) files.push(list[i]);
        }
        picker.input.value = '';
        renderList();
        box.clear();
      }
    });

    var size = TK.select({
      id: 'i2p-size',
      label: ui('pageSize'),
      value: 'a4',
      options: [
        { value: 'a4', label: ui('a4') },
        { value: 'letter', label: ui('letter') },
        { value: 'fit', label: ui('fit') }
      ]
    });

    var listWrap = TK.el('div', { class: 'tk-list', role: 'list', 'aria-label': ui('list') });

    var downloadBtn = TK.btn(ui('download'), function () {
      if (downloadBtn._blob) TK.download(downloadBtn._blob, 'images.pdf');
    }, { secondary: true });
    downloadBtn.hidden = true;
    downloadBtn._blob = null;

    var runBtn = TK.btn(ui('create'), function () { run(); });
    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(runBtn);
    actions.appendChild(downloadBtn);

    host.appendChild(picker.row);
    host.appendChild(size.row);
    host.appendChild(listWrap);
    host.appendChild(actions);
    host.appendChild(progress);
    host.appendChild(box);

    var run = TK.guard(box, create);

    function removeAt(i) {
      files.splice(i, 1);
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
        var del = TK.btn(ui('remove'), function () { removeAt(i); }, { secondary: true });
        del.className = 'btn btn-secondary tk-icon-btn is-danger';
        del.setAttribute('aria-label', ui('remove') + ': ' + f.name);
        var tools = TK.el('div', { class: 'tk-list-actions' });
        tools.appendChild(del);
        row.appendChild(tools);
        listWrap.appendChild(row);
      });
    }

    function totalBytes() {
      return files.reduce(function (sum, f) { return sum + f.size; }, 0);
    }

    function create() {
      if (busy) return Promise.resolve();

      if (!files.length) { box.show(ui('empty'), 'error'); return Promise.resolve(); }
      if (files.length > MAX_FILES) { box.show(ui('tooMany'), 'error'); return Promise.resolve(); }
      if (totalBytes() > MAX_BYTES) { box.show(ui('tooBig'), 'error'); return Promise.resolve(); }
      if (!window.PDFLib) { box.show(common('error'), 'error'); return Promise.resolve(); }

      busy = true;
      box.clear();
      downloadBtn.hidden = true;
      progress.update(0, ui('working'));

      var PDFDocument = window.PDFLib.PDFDocument;
      var doc;
      var made = 0;
      var skipped = [];

      PDFDocument.create()
        .then(function (d) {
          doc = d;
          return files.reduce(function (chain, file, i) {
            return chain.then(function () {
              progress.update(Math.round((i / files.length) * 85),
                ui('progress', { n: i + 1, total: files.length }));
              return prepare(file, doc).then(function (prep) {
                var pw, ph, margin = 24;
                if (size.select.value === 'fit') {
                  pw = prep.w + margin * 2;
                  ph = prep.h + margin * 2;
                } else {
                  var p = PAGE[size.select.value] || PAGE.a4;
                  pw = p[0]; ph = p[1];
                }
                var page = doc.addPage([pw, ph]);
                var scale = Math.min((pw - margin * 2) / prep.w, (ph - margin * 2) / prep.h, 1);
                var w = prep.w * scale;
                var h = prep.h * scale;
                page.drawImage(prep.img, {
                  x: (pw - w) / 2,
                  y: (ph - h) / 2,
                  width: w,
                  height: h
                });
                made++;
              }).catch(function () {
                skipped.push(file.name);   // one unreadable file must not stop the rest
              }).then(function () { return TK.yieldTab(); });
            });
          }, Promise.resolve());
        })
        .then(function () {
          if (!made) throw new Error('none');
          progress.update(92, ui('working'));
          return doc.save();
        })
        .then(function (bytes) {
          var blob = new Blob([bytes], { type: 'application/pdf' });
          downloadBtn._blob = blob;
          downloadBtn.hidden = false;
          progress.done(common('done'));
          box.show(ui('done', { n: made, size: TK.bytes(blob.size) }) +
            (skipped.length ? ' ' + ui('skipped', { list: skipped.join(', ') }) : ''),
            skipped.length ? 'warn' : 'ok');
        })
        .catch(function () {
          progress.reset();
          box.show(ui('failed'), 'error');
        })
        .then(function () { busy = false; });
    }

    /* Work out what pdf-lib can embed for this file. */
    function prepare(file, doc) {
      var type = (file.type || '').toLowerCase();
      if (type === 'image/jpeg' || type === 'image/png') {
        return TK.readFile(file).then(function (buf) {
          var bytes = new Uint8Array(buf);
          var embedded = type === 'image/jpeg' ? doc.embedJpg(bytes) : doc.embedPng(bytes);
          return embedded.then(function (img) {
            return { img: img, w: img.width, h: img.height };
          });
        });
      }
      return viaImg(file).then(function (img) {
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        if (!w || !h) throw new Error('decode');
        if (w * h > MAX_PIXELS) throw new Error('size');
        return toPng(img).then(blobBytes).then(function (bytes) {
          return doc.embedPng(bytes).then(function (emb) {
            return { img: emb, w: w, h: h };
          });
        });
      });
    }

    renderList();
    box.show(ui('empty'));
  }

  return { mount: mount };
})();
