/* ============================================================
   QR code generator — encodes text into a QR symbol with the
   vendored qrcode-generator library (assets/vendor/qrcode.js) and
   draws it on a canvas. No network: the code is built and
   downloaded inside the browser.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var input = TK.textarea({
      id: 'qr-text',
      label: ui('label'),
      placeholder: ui('placeholder'),
      rows: 4
    });

    var size = TK.select({
      id: 'qr-size',
      label: ui('size'),
      value: '480',
      options: [
        { value: '240', label: ui('sizeS') },
        { value: '480', label: ui('sizeM') },
        { value: '960', label: ui('sizeL') }
      ]
    });

    var canvas = TK.el('canvas', { class: 'qr-canvas', 'aria-label': ui('preview'), role: 'img' });
    canvas.hidden = true;

    var downloadBtn = TK.btn(ui('download'), function () {
      canvas.toBlob(function (blob) {
        if (!blob) { box.show(common('error'), 'error'); return; }
        TK.download(blob, 'qr-code.png');
      }, 'image/png');
    }, { secondary: true });
    downloadBtn.hidden = true;

    var actions = TK.el('div', { class: 'tk-actions' });
    actions.appendChild(TK.btn(ui('generate'), generate));
    actions.appendChild(downloadBtn);

    host.appendChild(input.row);
    host.appendChild(size.row);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(canvas);
    host.appendChild(out);

    function generate() {
      var text = input.textarea.value;
      box.clear();
      out.render([]);

      if (!text.trim()) {
        canvas.hidden = true;
        downloadBtn.hidden = true;
        box.show(ui('empty'), 'error');
        return;
      }
      if (text.length > 4000) {
        canvas.hidden = true;
        downloadBtn.hidden = true;
        box.show(ui('tooLong'), 'error');
        return;
      }
      if (typeof window.qrcode !== 'function') {
        box.show(common('error'), 'error');
        return;
      }

      var qr;
      try {
        qr = window.qrcode(0, 'M');          // 0 = choose version automatically
        qr.addData(text);
        qr.make();
      } catch (e) {
        // The library throws when the data exceeds version 40 capacity.
        canvas.hidden = true;
        downloadBtn.hidden = true;
        box.show(ui('tooLong'), 'error');
        return;
      }

      var count = qr.getModuleCount();
      var quiet = 4;                          // spec: 4-module quiet zone
      var target = parseInt(size.select.value, 10) || 480;
      var cell = Math.max(1, Math.floor(target / (count + quiet * 2)));
      var dim = cell * (count + quiet * 2);

      canvas.width = dim;
      canvas.height = dim;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, dim, dim);
      ctx.fillStyle = '#000000';
      for (var r = 0; r < count; r++) {
        for (var c = 0; c < count; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect((c + quiet) * cell, (r + quiet) * cell, cell, cell);
          }
        }
      }

      canvas.hidden = false;
      downloadBtn.hidden = false;
      out.render([
        [ui('bytes'), Array.from(text).length + ' ' + ui('bytes')],
        [common('done'), dim + ' × ' + dim + ' px']
      ]);
    }

    generate();
  }

  return { mount: mount };
})();