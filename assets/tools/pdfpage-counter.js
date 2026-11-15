/* ============================================================
   PDF page counter — reads a PDF in the browser with pdf-lib
   (loaded on demand by ToolKit.pdfLib) and reports the page
   count, byte size, document title and producer.

   Nothing is uploaded: the file is read into memory in this tab
   and released when the page is closed or another file chosen.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows({ note: ui('working') });
    var busy = false;

    var picker = TK.fileInput({
      id: 'pp-file',
      label: ui('file'),
      accept: 'application/pdf,.pdf',
      browse: ui('browse'),
      none: ui('emptyFile')
    });

    var actions = TK.el('div', { class: 'tk-actions' });
    var runBtn = TK.btn(ui('analyze'), function () { analyze(); });
    actions.appendChild(runBtn);

    host.appendChild(picker.row);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    picker.input.addEventListener('change', function () {
      out.render([]);
      box.clear();
      var f = picker.input.files && picker.input.files[0];
      if (!f) return;
      if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') {
        box.show(ui('notPdf'), 'error');
        return;
      }
      analyze();
    });

    function analyze() {
      if (busy) return;
      var file = picker.input.files && picker.input.files[0];
      out.render([]);
      if (!file) { box.show(ui('chooseFirst'), 'warn'); return; }
      if (file.size === 0) { box.show(ui('zeroBytes'), 'error'); return; }

      busy = true;
      runBtn.disabled = true;
      box.show(ui('reading'), '');

      TK.pdfLib().then(function (PDFLib) {
        return TK.readFile(file).then(function (buffer) {
          return PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
        }).then(function (pdf) {
          var pages = pdf.getPageCount();
          var title = '';
          var producer = '';
          try { title = pdf.getTitle() || ''; } catch (e) { title = ''; }
          try { producer = pdf.getProducer() || ''; } catch (e) { producer = ''; }

          out.render([
            [ui('pages'), TK.num(pages, 0), 'is-strong'],
            [ui('size'), TK.bytes(file.size)],
            [ui('name'), file.name],
            [ui('title'), title || ui('untitled')],
            [ui('producer'), producer || ui('unknown')],
            [ui('working'), ui('note')]
          ]);
          box.show(ui('done'), 'ok');
        });
      }).catch(function (err) {
        out.render([]);
        box.show(ui('failed'), 'error');
        if (window.console && console.warn) {
          console.warn('pdfpage-counter: ' + ((err && err.message) || err));
        }
      }).then(function () {
        busy = false;
        runBtn.disabled = false;
      });
    }
  }

  return { mount: mount };
})();
