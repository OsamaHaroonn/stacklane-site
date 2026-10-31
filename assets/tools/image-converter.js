/* ============================================================
   Image converter — JPG, PNG and WebP through a canvas.

   The file is decoded locally, drawn onto a canvas at its
   natural size and re-encoded in the format you pick. Wrong file
   types are refused with a message rather than a broken image,
   and a size cap keeps a huge photograph from freezing the tab.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_BYTES = 30 * 1024 * 1024;
  var MAX_PIXELS = 40000000;

  var TYPES = {
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp'
  };
  var EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

  function viaImg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }

  function decode(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file).catch(function () { return viaImg(file); });
    }
    return viaImg(file);
  }

  function encode(canvas, type, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob && blob.type === type) resolve(blob);
        else if (blob) resolve(blob);   // some browsers fall back silently
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
      id: 'conv-file',
      label: ui('file'),
      accept: 'image/*',
      browse: ui('browse'),
      none: ui('empty'),
      onChange: function () {
        preview.hidden = true;
        downloadBtn.hidden = true;
        out.render([]);
        box.clear();
        var f = picker.input.files && picker.input.files[0];
        if (!f) { box.show(ui('empty')); return; }
        if (f.size > MAX_BYTES) { box.show(ui('tooBig'), 'error'); return; }
        box.show(ui('ready', { name: f.name }), 'ok');
      }
    });

    var format = TK.select({
      id: 'conv-format',
      label: ui('format'),
      value: 'jpg',
      options: [
        { value: 'jpg', label: ui('formatJpg') },
        { value: 'png', label: ui('formatPng') },
        { value: 'webp', label: ui('formatWebp') }
      ]
    });

    var quality = TK.field({
      id: 'conv-quality', label: ui('quality'), type: 'number',
      value: '90', min: 1, max: 100, step: 1, inputmode: 'numeric'
    });

    var downloadBtn = TK.btn(ui('download'), function () {
      if (downloadBtn._blob) {
        TK.download(downloadBtn._blob, 'converted.' + (EXT[downloadBtn._type] || 'img'));
      }
    }, { secondary: true });
    downloadBtn.hidden = true;
    downloadBtn._blob = null;
    downloadBtn._type = '';

    var convertBtn = TK.btn(ui('convert'), function () { run(); });
    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(convertBtn);
    actions.appendChild(downloadBtn);

    host.appendChild(picker.row);
    host.appendChild(format.row);
    host.appendChild(quality.row);
    host.appendChild(actions);
    host.appendChild(progress);
    host.appendChild(box);
    host.appendChild(preview);
    host.appendChild(out);

    var run = TK.guard(box, convert);

    function convert() {
      if (busy) return Promise.resolve();

      var file = picker.input.files && picker.input.files[0];
      if (!file) { box.show(ui('empty'), 'error'); return Promise.resolve(); }
      if (file.size > MAX_BYTES) { box.show(ui('tooBig'), 'error'); return Promise.resolve(); }
      if (!/^image\//i.test(file.type || '') && !/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name)) {
        box.show(ui('notImage'), 'error');
        return Promise.resolve();
      }

      var q = parseInt(quality.input.value, 10);
      if (isNaN(q) || q < 1 || q > 100) { box.show(ui('badQuality'), 'error'); return Promise.resolve(); }

      var type = TYPES[format.select.value];
      busy = true;
      box.clear();
      preview.hidden = true;
      downloadBtn.hidden = true;
      progress.update(20, ui('working'));

      return decode(file)
        .then(function (bitmap) {
          var w = bitmap.width || bitmap.naturalWidth;
          var h = bitmap.height || bitmap.naturalHeight;
          if (!w || !h) throw new Error('decode');
          if (w * h > MAX_PIXELS) throw new Error('size');

          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          if (type === 'image/jpeg') {      // JPEG cannot store transparency
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
          }
          ctx.drawImage(bitmap, 0, 0);
          if (bitmap.close) bitmap.close();

          progress.update(60, ui('working'));
          return encode(canvas, type, q / 100).then(function (blob) {
            progress.done(common('done'));
            preview.src = URL.createObjectURL(blob);
            preview.hidden = false;
            downloadBtn._blob = blob;
            downloadBtn._type = type;
            downloadBtn.hidden = false;
            out.render([
              [ui('original'), file.name + ' · ' + TK.bytes(file.size)],
              [ui('result'), w + ' × ' + h + ' px · ' + TK.bytes(blob.size)],
              [ui('formatRow'), format.select.options[format.select.selectedIndex].text]
            ]);
            box.show(common('done'), 'ok');
          });
        })
        .catch(function (e) {
          progress.reset();
          box.show(String(e && e.message) === 'size' ? ui('tooManyPixels') : ui('failed'), 'error');
        })
        .then(function () { busy = false; });
    }

    box.show(ui('empty'));
  }

  return { mount: mount };
})();
