window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var SIZES = [16, 32, 48, 180, 192, 512];
  var MAX_BYTES = 5 * 1024 * 1024;

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        if (!img.naturalWidth || !img.naturalHeight) {
          URL.revokeObjectURL(url);
          reject(new Error('empty-image'));
          return;
        }
        resolve({ img: img, url: url });
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('decode'));
      };
      img.src = url;
    });
  }

  function toBlob(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob); else reject(new Error('encode'));
      }, 'image/png');
    });
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var progress = TK.progressBar();
    var results = TK.el('div', { style: 'display:grid;gap:8px;margin-top:12px' });

    var picker = TK.fileInput({
      id: 'fv-file',
      label: ui('image'),
      accept: 'image/*',
      browse: ui('browse'),
      none: ui('none'),
      onChange: run
    });

    host.appendChild(picker.row);
    host.appendChild(box);
    host.appendChild(TK.el('p', { class: 'note' }, ui('cap')));
    host.appendChild(progress);
    host.appendChild(results);

    var busy = false;

    function reset() {
      results.textContent = '';
      progress.reset();
    }

    function fail(text) { reset(); box.show(text, 'error'); }

    function run() {
      var files = picker.input.files;
      if (busy) return;
      if (!files || !files.length) { reset(); box.show(ui('empty'), 'warn'); return; }

      var file = files[0];
      if (file.size === 0) { fail(ui('emptyFile')); return; }
      if (file.size > MAX_BYTES) { fail(ui('tooBig', { max: '5 MB' })); return; }
      if (!/^image\//i.test(file.type || '')) { fail(ui('notImage')); return; }

      busy = true;
      reset();
      box.show(ui('working'), '');
      progress.update(5, ui('stepDecode'));

      loadImage(file).then(function (loaded) {
        progress.update(15, ui('stepDraw'));
        var img = loaded.img;
        var side = Math.min(img.naturalWidth, img.naturalHeight);
        var sx = Math.round((img.naturalWidth - side) / 2);
        var sy = Math.round((img.naturalHeight - side) / 2);
        var chain = Promise.resolve();

        SIZES.forEach(function (size, i) {
          chain = chain.then(function () {
            var canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            var ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('canvas');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
            return toBlob(canvas).then(function (blob) {
              var cell = TK.el('div', {
                style: 'display:flex;align-items:center;gap:12px;padding:8px;' +
                  'border:1px solid #d8dde6;border-radius:10px'
              });
              var thumb = TK.el('img', {
                src: canvas.toDataURL('image/png'),
                alt: '',
                width: '32',
                height: '32',
                style: 'image-rendering:pixelated;background:#f4f5f7;border-radius:4px'
              });
              var info = TK.el('div', { style: 'flex:1' },
                size + ' × ' + size + ' px · ' + TK.bytes(blob.size));
              var dl = TK.btn(ui('download'), function () {
                TK.download(blob, 'favicon-' + size + '.png');
                box.show(ui('downloaded', { size: String(size) }), 'ok');
              }, { secondary: true });
              cell.appendChild(thumb);
              cell.appendChild(info);
              cell.appendChild(dl);
              results.appendChild(cell);
              progress.update(15 + ((i + 1) / SIZES.length) * 85,
                ui('stepDone', { done: String(i + 1), total: String(SIZES.length) }));
            });
          });
        });

        return chain.then(function () {
          progress.done(ui('finished'));
          box.show(ui('done'), 'ok');
          URL.revokeObjectURL(loaded.url);
        });
      }).catch(function (e) {
        URL.revokeObjectURL('');
        fail(e && e.message === 'decode' ? ui('badImage') : ui('badImage'));
      }).then(function () {
        busy = false;
      });
    }
  }

  return { mount: mount };
})();
