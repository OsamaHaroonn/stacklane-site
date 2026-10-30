/* ============================================================
   Image compressor — decodes the file in the browser, re-encodes
   it at the chosen quality on a canvas, reports the real sizes and
   offers the result for download. Nothing is uploaded.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  var TYPES = {
    keep: null,
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp'
  };
  var EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

  function decode(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file).catch(function () { return decodeViaImg(file); });
    }
    return decodeViaImg(file);
  }

  function decodeViaImg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }

  function encode(canvas, type, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error('encode'));
      }, type, quality);
    });
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();
    var progress = TK.progressBar();
    var preview = TK.el('img', { class: 'tk-preview', alt: ui('preview') });
    preview.hidden = true;
    var busy = false;

    var picker = TK.fileInput({
      id: 'cmp-file',
      label: ui('file'),
      accept: 'image/*',
      browse: ui('browse'),
      none: ui('empty')
    });

    var quality = TK.field({
      id: 'cmp-quality',
      label: ui('quality'),
      type: 'range',
      value: 75,
      min: 10,
      max: 100,
      step: 5
    });
    var qOut = TK.el('span', { class: 'tk-inline-value' }, '75');
    quality.row.appendChild(qOut);
    quality.input.addEventListener('input', function () {
      qOut.textContent = quality.input.value;
    });

    var format = TK.select({
      id: 'cmp-format',
      label: ui('format'),
      value: 'keep',
      options: [
        { value: 'keep', label: ui('formatKeep') },
        { value: 'jpg', label: ui('formatJpg') },
        { value: 'png', label: ui('formatPng') },
        { value: 'webp', label: ui('formatWebp') }
      ]
    });

    var downloadBtn = TK.btn(ui('download'), function () {
      if (downloadBtn._blob) {
        TK.download(downloadBtn._blob, 'compressed.' + (EXT[downloadBtn._type] || 'img'));
      }
    }, { secondary: true });
    downloadBtn.hidden = true;
    downloadBtn._blob = null;
    downloadBtn._type = '';

    var compressBtn = TK.btn(ui('compress'), function () { run(); });
    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(compressBtn);
    actions.appendChild(downloadBtn);

    host.appendChild(picker.row);
    host.appendChild(quality.row);
    host.appendChild(format.row);
    host.appendChild(actions);
    host.appendChild(progress);
    host.appendChild(box);
    host.appendChild(preview);
    host.appendChild(out);

    var run = TK.guard(box, compress);

    function compress() {
      if (busy) return Promise.resolve();
      var file = picker.input.files && picker.input.files[0];
      if (!file) {
        out.render([]);
        box.show(ui('empty'), 'error');
        return Promise.resolve();
      }

      busy = true;
      box.clear();
      out.render([]);
      preview.hidden = true;
      downloadBtn.hidden = true;
      progress.update(10, ui('working'));

      return decode(file)
        .then(function (bitmap) {
          progress.update(40, ui('working'));
          var w = bitmap.width || bitmap.naturalWidth;
          var h = bitmap.height || bitmap.naturalHeight;
          if (!w || !h) throw new Error('decode');

          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);            // JPEG has no alpha; flatten it
          ctx.drawImage(bitmap, 0, 0);
          if (bitmap.close) bitmap.close();

          var type = TYPES[format.select.value] || file.type || 'image/jpeg';
          if (type !== 'image/png' && type !== 'image/jpeg' && type !== 'image/webp') {
            type = 'image/jpeg';
          }
          var q = (parseInt(quality.input.value, 10) || 75) / 100;
          progress.update(70, ui('working'));

          return encode(canvas, type, q).then(function (blob) {
            progress.done(common('done'));

            var before = file.size;
            var after = blob.size;
            var diff = before - after;
            var pct = before ? Math.round(diff / before * 100) : 0;

            preview.src = URL.createObjectURL(blob);
            preview.hidden = false;

            downloadBtn._blob = blob;
            downloadBtn._type = type;
            downloadBtn.hidden = false;

            out.render([
              [ui('original'), TK.bytes(before)],
              [ui('result'), TK.bytes(after)],
              [ui('saved'), TK.bytes(Math.abs(diff)) + ' (' + Math.abs(pct) + '%)']
            ]);

            if (diff > 0) {
              box.show(pct + '% ' + ui('reduction'), 'ok');
            } else if (diff === 0) {
              box.show(ui('unchanged'), 'warn');
            } else {
              box.show(TK.bytes(-diff) + ' ' + ui('bigger'), 'warn');
            }
          });
        })
        .catch(function (e) {
          progress.reset();
          box.show(ui('failed'), 'error');
          if (window.console) console.warn('compress:', e && e.message);
        })
        .then(function () { busy = false; });
    }

    box.show(ui('empty'));
  }

  return { mount: mount };
})();