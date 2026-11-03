/* ============================================================
   Image to Base64 — reads the chosen image with FileReader as
   a data URI, with progress, an image-only type check and a
   stated 5 MB cap. The file is never uploaded or stored.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_BYTES = 5 * 1024 * 1024;

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();
    var progress = TK.progressBar();

    var picker = TK.fileInput({
      id: 'img-file',
      label: ui('label'),
      accept: 'image/*',
      browse: ui('browse'),
      none: ui('none'),
      onChange: handle
    });

    var resWrap = TK.el('div', { class: 'tk-field' });
    resWrap.appendChild(TK.el('label', { for: 'img-out' }, ui('output')));
    var resTa = TK.el('textarea', {
      id: 'img-out', rows: 8, readonly: '', spellcheck: 'false'
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

    host.appendChild(picker.row);
    host.appendChild(progress);
    host.appendChild(box);
    host.appendChild(out);
    host.appendChild(resWrap);
    host.appendChild(copyBtn);

    function reset() {
      resTa.value = '';
      resWrap.hidden = true;
      copyBtn.disabled = true;
      out.render([]);
      progress.reset();
    }

    function handle() {
      var files = picker.input.files;
      var file = files && files.length ? files[0] : null;
      if (!file) { reset(); box.show(ui('empty'), 'warn'); return; }
      if (!file.type || file.type.indexOf('image/') !== 0) {
        reset();
        box.show(ui('notImage'), 'error');
        return;
      }      if (file.size > MAX_BYTES) {
        reset(); box.show(ui('tooBig'), 'error');
        return;
      }
      if (!file.size) {
        reset(); box.show(ui('emptyFile'), 'error');
        return;
      }


      reset();
      var fr = new FileReader();
      fr.onprogress = function (e) {
        if (e.lengthComputable && e.total) {
          progress.update(Math.round(e.loaded / e.total * 100),
            TK.bytes(e.loaded) + ' / ' + TK.bytes(e.total));
        }
      };
      fr.onload = function () {
        var text = String(fr.result || '');
        if (!text) { reset(); box.show(ui('readFailed'), 'error'); return; }
        /* Prove the bytes really decode as an image before showing
           them: a .png that is actually text or an empty file must
           not get a success message. */
        var url = URL.createObjectURL(file);
        var probe = new Image();
        function reject() {
          URL.revokeObjectURL(url);
          reset();
          box.show(ui('badImage'), 'error');
        }
        probe.onload = function () {
          URL.revokeObjectURL(url);
          progress.done(TK.bytes(file.size));
          resTa.value = text;
          resWrap.hidden = false;
          copyBtn.disabled = false;
          out.render([
            [ui('fileName'), file.name],
            [ui('fileSize'), TK.bytes(file.size)],
            [ui('fileType'), file.type || '\u2014'],
            [ui('dataLength'), TK.num(text.length, 0)]
          ]);
          box.show(ui('note'), '');
        };
        probe.onerror = reject;
        probe.src = url;
      };
      fr.onerror = function () {
        reset();
        box.show(ui('readFailed'), 'error');
      };
      fr.readAsDataURL(file);
    }

    box.show(ui('empty'), 'warn');
  }

  return { mount: mount };
})();