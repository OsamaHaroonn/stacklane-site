/* ============================================================
   Text diff checker — line-based comparison with a longest
   common subsequence table. The result is built as plain text
   and never as HTML, and both sides are capped so a huge paste
   cannot lock the tab.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_CHARS = 40000;
  var MAX_LINES = 1000;

  function lines(text) {
    var list = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    // One trailing newline is a line ending, not an extra line.
    if (list.length > 1 && list[list.length - 1] === '') list.pop();
    return list;
  }

  /* LCS over two line arrays → ['same'|'del'|'add', line] pairs. */
  function diff(a, b) {
    var n = a.length, m = b.length;
    var w = m + 1;
    var table = new Uint32Array((n + 1) * w);
    for (var i = n - 1; i >= 0; i--) {
      for (var j = m - 1; j >= 0; j--) {
        table[i * w + j] = a[i] === b[j]
          ? table[(i + 1) * w + j + 1] + 1
          : Math.max(table[(i + 1) * w + j], table[i * w + j + 1]);
      }
    }
    var ops = [], x = 0, y = 0;
    while (x < n && y < m) {
      if (a[x] === b[y]) { ops.push(['same', a[x]]); x++; y++; }
      else if (table[(x + 1) * w + y] >= table[x * w + y + 1]) { ops.push(['del', a[x]]); x++; }
      else { ops.push(['add', b[y]]); y++; }
    }
    while (x < n) ops.push(['del', a[x++]]);
    while (y < m) ops.push(['add', b[y++]]);
    return ops;
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var sideA = TK.textarea({ id: 'diff-a', label: ui('sideA'), rows: 7, placeholder: 'alpha\nbeta\ngamma' });
    var sideB = TK.textarea({ id: 'diff-b', label: ui('sideB'), rows: 7, placeholder: 'alpha\nbeta two\ngamma' });

    var resWrap = TK.el('div', { class: 'tk-field' });
    resWrap.appendChild(TK.el('label', { for: 'diff-out' }, ui('result')));
    var resTa = TK.el('textarea', {
      id: 'diff-out', rows: 10, readonly: '', spellcheck: 'false',
      'aria-label': ui('result')
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

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('compare'), TK.guard(box, compare)));
    actions.appendChild(TK.btn(common('clear'), function () {
      sideA.textarea.value = '';
      sideB.textarea.value = '';
      render();
    }, { secondary: true }));
    actions.appendChild(copyBtn);

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(sideA.row);
    grid.appendChild(sideB.row);

    host.appendChild(grid);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);
    host.appendChild(resWrap);

    function reset() {
      out.render([]);
      resTa.value = '';
      resWrap.hidden = true;
      copyBtn.disabled = true;
    }

    function compare() {
      var left = sideA.textarea.value;
      var right = sideB.textarea.value;

      if (left.length > MAX_CHARS || right.length > MAX_CHARS) {
        reset(); box.show(ui('tooBig'), 'error'); return;
      }
      if (!left && !right) { reset(); box.show(ui('empty'), 'warn'); return; }

      var a = lines(left), b = lines(right);
      if (a.length > MAX_LINES || b.length > MAX_LINES) {
        reset(); box.show(ui('tooMany'), 'error'); return;
      }

      var ops = diff(a, b);
      var same = 0, onlyA = 0, onlyB = 0;
      var text = ops.map(function (op) {
        if (op[0] === 'same') { same++; return '  ' + op[1]; }
        if (op[0] === 'del') { onlyA++; return '- ' + op[1]; }
        onlyB++;
        return '+ ' + op[1];
      }).join('\n');

      resTa.value = ops.length ? text : '';
      resWrap.hidden = !ops.length;
      copyBtn.disabled = !ops.length;

      out.render([
        [ui('linesA'), TK.num(a.length, 0)],
        [ui('linesB'), TK.num(b.length, 0)],
        [ui('onlyA'), TK.num(onlyA, 0)],
        [ui('onlyB'), TK.num(onlyB, 0)],
        [ui('same'), TK.num(same, 0), 'is-strong']
      ]);

      box.show(!onlyA && !onlyB ? ui('identical') : ui('note'), !onlyA && !onlyB ? 'ok' : '');
    }

    [sideA.textarea, sideB.textarea].forEach(function (node) {
      node.addEventListener('input', function () {
        if (!sideA.textarea.value && !sideB.textarea.value) {
          reset();
          box.show(ui('empty'), 'warn');
        }
      });
    });

    compare();
  }

  return { mount: mount };
})();