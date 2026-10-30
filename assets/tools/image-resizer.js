/* ============================================================
   Image resizer — draws the decoded image onto a canvas of the
   requested size and offers it for download. Aspect ratio lock,
   1-10000 px bounds, progress and a real error on decode failure.
   Everything stays inside the browser.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  var TYPES = { keep: null, jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  var EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

  function decode(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file).catch(function () { return viaImg(file); });
    }
    return viaImg(file);
  }

  function viaImg(file) {
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
    var natural = null;   // { w, h } of the chosen file
    var touched = false;  // the user typed a size: never overwrite it

    var picker = TK.fileInput({
      id: 'rsz-file',
      label: ui('file'),
      accept: 'image/*',
      browse: ui('browse'),
      none: ui('empty')
    });
    picker.input.addEventListener('change', function () {
      natural = null;
      touched = false;
      preview.hidden = true;
      downloadBtn.hidden = true;
      out.render([]);
      box.clear();
      var f = picker.input.files && picker.input.files[0];
      if (!f) return;
      decode(f).then(function (bitmap) {
        natural = { w: bitmap.width || bitmap.naturalWidth, h: bitmap.height || bitmap.naturalHeight };
        if (bitmap.close) bitmap.close();
        if (natural.w) {
          // Pre-fill the fields only when the user has not typed a size;
          // a slow decode must never wipe what they entered meanwhile.
          if (!touched) {
            width.input.value = natural.w;
            height.input.value = natural.h;
          }
          out.render([[ui('original'), natural.w + ' × ' + natural.h + ' px · ' + TK.bytes(f.size)]]);
        }
      }).catch(function () {
        box.show(ui('failed'), 'error');
      });
    });

    var width = TK.field({ id: 'rsz-w', label: ui('width'), type: 'number', value: '', min: 1, max: 10000, step: 1, inputmode: 'numeric' });
    var height = TK.field({ id: 'rsz-h', label: ui('height'), type: 'number', value: '', min: 1, max: 10000, step: 1, inputmode: 'numeric' });

    var lock = TK.checkbox({ id: 'rsz-lock', label: ui('lock'), checked: true });

    var format = TK.select({
      id: 'rsz-format',
      label: ui('format'),
      value: 'keep',
      options: [
        { value: 'keep', label: ui('formatKeep') },
        { value: 'jpg', label: ui('formatJpg') },
        { value: 'png', label: ui('formatPng') },
        { value: 'webp', label: ui('formatWebp') }
      ]
    });

    function sync(from) {
      if (!lock.input.checked || !natural || !natural.w) return;
      var w = parseInt(width.input.value, 10);
      var h = parseInt(height.input.value, 10);
      if (from === 'w' && w > 0) height.input.value = Math.max(1, Math.round(w * natural.h / natural.w));
      if (from === 'h' && h > 0) width.input.value = Math.max(1, Math.round(h * natural.w / natural.h));
    }
    width.input.addEventListener('input', function () { touched = true; sync('w'); });
    height.input.addEventListener('input', function () { touched = true; sync('h'); });

    var downloadBtn = TK.btn(ui('download'), function () {
      if (downloadBtn._blob) TK.download(downloadBtn._blob, 'resized.' + (EXT[downloadBtn._type] || 'img'));
    }, { secondary: true });
    downloadBtn.hidden = true;
    downloadBtn._blob = null;
    downloadBtn._type = '';

    var resizeBtn = TK.btn(ui('resize'), function () { run(); });
    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(resizeBtn);
    actions.appendChild(downloadBtn);

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(width.row);
    grid.appendChild(height.row);

    host.appendChild(picker.row);
    host.appendChild(grid);
    host.appendChild(lock.row);
    host.appendChild(format.row);
    host.appendChild(actions);
    host.appendChild(progress);
    host.appendChild(box);
    host.appendChild(preview);
    host.appendChild(out);

    var run = TK.guard(box, resize);
    resizeBtn.addEventListener('click', function () { run(); });

    function resize() {
      if (busy) return Promise.resolve();
      var file = picker.input.files && picker.input.files[0];
      if (!file) {
        box.show(ui('empty'), 'error');
        return Promise.resolve();
      }

      var w = parseInt(width.input.value, 10);
      var h = parseInt(height.input.value, 10);
      if (!(w >= 1 && w <= 10000) || !(h >= 1 && h <= 10000)) {
        box.show(ui('badSize'), 'error');
        return Promise.resolve();
      }

      busy = true;
      box.clear();
      preview.hidden = true;
      downloadBtn.hidden = true;
      progress.update(20, ui('working'));

      return decode(file)
        .then(function (bitmap) {
          progress.update(50, ui('working'));
          var ow = bitmap.width || bitmap.naturalWidth;
          var oh = bitmap.height || bitmap.naturalHeight;
          if (!ow || !oh) throw new Error('decode');
          natural = { w: ow, h: oh };

          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          var type = TYPES[format.select.value] || file.type || 'image/jpeg';
          if (type === 'image/jpeg') {        // JPEG cannot hold transparency
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(bitmap, 0, 0, w, h);
          if (bitmap.close) bitmap.close();

          progress.update(80, ui('working'));
          return encode(canvas, type, 0.92).then(function (blob) {
            progress.done(common('done'));
            preview.src = URL.createObjectURL(blob);
            preview.hidden = false;
            downloadBtn._blob = blob;
            downloadBtn._type = type;
            downloadBtn.hidden = false;
            out.render([
              [ui('original'), ow + ' × ' + oh + ' px · ' + TK.bytes(file.size)],
              [ui('result'), w + ' × ' + h + ' px · ' + TK.bytes(blob.size)]
            ]);
            box.show(common('done'), 'ok');
          });
        })
        .catch(function () {
          progress.reset();
          box.show(ui('failed'), 'error');
        })
        .then(function () { busy = false; });
    }

    box.show(ui('empty'));
  }

  return { mount: mount };
})();