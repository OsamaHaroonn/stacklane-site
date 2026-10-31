/* ============================================================
   Crop and rotate — cut a rectangle out of an image and turn it
   through a quarter, half or three quarters of a circle.

   Crop coordinates are in source pixels, so they never change
   while you rotate. The output keeps the source format where the
   browser can produce it, otherwise PNG. Everything happens on a
   canvas in this tab.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_BYTES = 30 * 1024 * 1024;
  var MAX_PIXELS = 40000000;

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

  function outType(file) {
    var t = (file.type || '').toLowerCase();
    if (EXT[t]) return t;
    if (/\.jpe?g$/i.test(file.name)) return 'image/jpeg';
    if (/\.png$/i.test(file.name)) return 'image/png';
    if (/\.webp$/i.test(file.name)) return 'image/webp';
    return 'image/png';
  }

  function encode(canvas, type) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob); else reject(new Error('encode'));
      }, type, 0.92);
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
    var natural = null;   // { w, h } of the chosen file

    var picker = TK.fileInput({
      id: 'crop-file',
      label: ui('file'),
      accept: 'image/*',
      browse: ui('browse'),
      none: ui('empty'),
      onChange: function () {
        natural = null;
        preview.hidden = true;
        downloadBtn.hidden = true;
        out.render([]);
        box.clear();
        var f = picker.input.files && picker.input.files[0];
        if (!f) { box.show(ui('empty')); return; }
        if (f.size > MAX_BYTES) { box.show(ui('tooBig'), 'error'); return; }
        decode(f).then(function (bitmap) {
          var w = bitmap.width || bitmap.naturalWidth;
          var h = bitmap.height || bitmap.naturalHeight;
          if (bitmap.close) bitmap.close();
          if (!w || !h) throw new Error('decode');
          natural = { w: w, h: h };
          left.input.value = 0;
          top.input.value = 0;
          wField.input.value = w;
          hField.input.value = h;
          out.render([[ui('original'), w + ' × ' + h + ' px · ' + TK.bytes(f.size)]]);
          box.show(ui('ready', { name: f.name }), 'ok');
        }).catch(function () {
          box.show(ui('failed'), 'error');
        });
      }
    });

    var left = TK.field({ id: 'crop-left', label: ui('left'), type: 'number', value: '0', min: 0, step: 1, inputmode: 'numeric' });
    var top = TK.field({ id: 'crop-top', label: ui('top'), type: 'number', value: '0', min: 0, step: 1, inputmode: 'numeric' });
    var wField = TK.field({ id: 'crop-w', label: ui('width'), type: 'number', value: '', min: 1, step: 1, inputmode: 'numeric' });
    var hField = TK.field({ id: 'crop-h', label: ui('height'), type: 'number', value: '', min: 1, step: 1, inputmode: 'numeric' });

    var rotate = TK.select({
      id: 'crop-rotate',
      label: ui('rotate'),
      value: '0',
      options: [
        { value: '0', label: ui('rot0') },
        { value: '90', label: ui('rot90') },
        { value: '180', label: ui('rot180') },
        { value: '270', label: ui('rot270') }
      ]
    });

    var grid = TK.el('div', { class: 'tk-grid' });
    [left, top, wField, hField].forEach(function (f) { grid.appendChild(f.row); });

    var downloadBtn = TK.btn(ui('download'), function () {
      if (downloadBtn._blob) {
        TK.download(downloadBtn._blob, 'cropped.' + (EXT[downloadBtn._type] || 'png'));
      }
    }, { secondary: true });
    downloadBtn.hidden = true;
    downloadBtn._blob = null;
    downloadBtn._type = '';

    var cropBtn = TK.btn(ui('apply'), function () { run(); });
    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(cropBtn);
    actions.appendChild(downloadBtn);

    host.appendChild(picker.row);
    host.appendChild(grid);
    host.appendChild(rotate.row);
    host.appendChild(actions);
    host.appendChild(progress);
    host.appendChild(box);
    host.appendChild(preview);
    host.appendChild(out);

    var run = TK.guard(box, apply);

    function intOf(field) {
      var raw = String(field.input.value).trim();
      if (raw === '') return NaN;
      if (!/^\d+$/.test(raw)) return NaN;
      return parseInt(raw, 10);
    }

    function apply() {
      if (busy) return Promise.resolve();

      var file = picker.input.files && picker.input.files[0];
      if (!file) { box.show(ui('empty'), 'error'); return Promise.resolve(); }
      if (!natural) { box.show(ui('loading'), 'warn'); return Promise.resolve(); }

      var x = intOf(left), y = intOf(top), w = intOf(wField), h = intOf(hField);

      if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) {
        box.show(ui('notWhole'), 'error');
        return Promise.resolve();
      }
      if (w < 1 || h < 1) { box.show(ui('tooSmall'), 'error'); return Promise.resolve(); }
      if (x + w > natural.w || y + h > natural.h) {
        box.show(ui('outside', { w: natural.w, h: natural.h }), 'error');
        return Promise.resolve();
      }

      var rot = parseInt(rotate.select.value, 10) || 0;
      var type = outType(file);

      busy = true;
      box.clear();
      preview.hidden = true;
      downloadBtn.hidden = true;
      progress.update(20, ui('working'));

      return decode(file)
        .then(function (bitmap) {
          // 1. the crop
          var cut = document.createElement('canvas');
          cut.width = w;
          cut.height = h;
          var cctx = cut.getContext('2d');
          if (type === 'image/jpeg') {
            cctx.fillStyle = '#ffffff';
            cctx.fillRect(0, 0, w, h);
          }
          cctx.drawImage(bitmap, x, y, w, h, 0, 0, w, h);
          if (bitmap.close) bitmap.close();

          // 2. the rotation
          var turned = rot % 180 === 0;
          var canvas = document.createElement('canvas');
          canvas.width = turned ? w : h;
          canvas.height = turned ? h : w;
          var ctx = canvas.getContext('2d');
          if (type === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          if (rot === 90) { ctx.translate(h, 0); ctx.rotate(Math.PI / 2); }
          else if (rot === 180) { ctx.translate(w, h); ctx.rotate(Math.PI); }
          else if (rot === 270) { ctx.translate(0, w); ctx.rotate(-Math.PI / 2); }
          ctx.drawImage(cut, 0, 0);

          if (canvas.width * canvas.height > MAX_PIXELS) throw new Error('size');

          progress.update(70, ui('working'));
          return encode(canvas, type).then(function (blob) {
            progress.done(common('done'));
            preview.src = URL.createObjectURL(blob);
            preview.hidden = false;
            downloadBtn._blob = blob;
            downloadBtn._type = type;
            downloadBtn.hidden = false;
            out.render([
              [ui('original'), natural.w + ' × ' + natural.h + ' px · ' + TK.bytes(file.size)],
              [ui('result'), canvas.width + ' × ' + canvas.height + ' px · ' + TK.bytes(blob.size)],
              [ui('cropUsed'), 'x ' + x + ', y ' + y + ', ' + w + ' × ' + h + ', ' + rot + '°']
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
