window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_CHARS = 200000;

  function textOf(node) {
    return node.textContent.replace(/\s+/g, ' ');
  }

  function inline(node) {
    var out = '';
    [].forEach.call(node.childNodes, function (child) {
      if (child.nodeType === 3) { out += child.nodeValue.replace(/\s+/g, ' '); return; }
      if (child.nodeType !== 1) return;
      var tag = child.tagName.toLowerCase();
      var inner = inline(child);
      if (tag === 'strong' || tag === 'b') out += inner.trim() ? '**' + inner.trim() + '**' : '';
      else if (tag === 'em' || tag === 'i') out += inner.trim() ? '*' + inner.trim() + '*' : '';
      else if (tag === 'code') out += inner.trim() ? '`' + inner.trim() + '`' : '';
      else if (tag === 'a') {
        var href = child.getAttribute('href') || '';
        var label = inner.trim();
        out += href ? '[' + (label || href) + '](' + href + ')' : label;
      }
      else if (tag === 'img') {
        var src = child.getAttribute('src') || '';
        var alt = child.getAttribute('alt') || '';
        out += src ? '![' + alt + '](' + src + ')' : '';
      }
      else if (tag === 'br') out += '\n';
      else out += inner;
    });
    return out;
  }

  function block(node, depth) {
    var out = '';
    [].forEach.call(node.childNodes, function (child) {
      if (child.nodeType === 3) {
        var t = child.nodeValue.replace(/\s+/g, ' ').trim();
        if (t) out += t + '\n\n';
        return;
      }
      if (child.nodeType !== 1) return;
      var tag = child.tagName.toLowerCase();
      var inner = inline(child).trim();

      if (/^h[1-6]$/.test(tag)) {
        out += new Array(parseInt(tag.charAt(1), 10) + 1).join('#') + ' ' + inner + '\n\n';
      } else if (tag === 'p') {
        if (inner) out += inner + '\n\n';
      } else if (tag === 'ul' || tag === 'ol') {
        var i = 1;
        [].forEach.call(child.children, function (li) {
          if (li.tagName.toLowerCase() !== 'li') return;
          var marker = tag === 'ol' ? (i++) + '. ' : '- ';
          out += new Array((depth || 0) + 1).join('  ') + marker + inline(li).trim() + '\n';
        });
        out += '\n';
      } else if (tag === 'blockquote') {
        var lines = block(child, depth).trim().split('\n');
        out += lines.map(function (l) { return '> ' + l; }).join('\n') + '\n\n';
      } else if (tag === 'pre') {
        out += '```\n' + child.textContent.replace(/\n+$/, '') + '\n```\n\n';
      } else if (tag === 'hr') {
        out += '---\n\n';
      } else if (tag === 'table') {
        [].forEach.call(child.querySelectorAll('tr'), function (tr, ri) {
          var cells = Array.prototype.map.call(tr.children, function (c) {
            return inline(c).trim();
          });
          out += '| ' + cells.join(' | ') + ' |\n';
          if (ri === 0) out += '| ' + cells.map(function () { return '---'; }).join(' | ') + ' |\n';
        });
        out += '\n';
      } else if (tag === 'div' || tag === 'section' || tag === 'article' ||
                 tag === 'header' || tag === 'footer' || tag === 'main' || tag === 'body') {
        out += block(child, depth);
      } else if (inner) {
        out += inner + '\n\n';
      }
    });
    return out;
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var outWrap = TK.el('div', { class: 'tk-field' });
    var outArea = TK.el('textarea', {
      id: 'hm-out', rows: 12, readonly: '', 'aria-label': ui('output'), spellcheck: 'false'
    });
    outWrap.appendChild(TK.el('label', { for: 'hm-out' }, ui('output')));
    outWrap.appendChild(outArea);

    var field = TK.textarea({
      id: 'hm-input',
      label: ui('html'),
      rows: 8,
      placeholder: '<h2>Title</h2>\n<p>Hello <strong>world</strong>.</p>',
      onInput: render
    });

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('copy'), function () {
      if (!outArea.value) { box.show(ui('nothingToCopy'), 'warn'); return; }
      TK.copy(outArea.value, function (ok) {
        box.show(ok ? ui('copied') : ui('copyFailed'), ok ? 'ok' : 'error');
      });
    }, { secondary: true }));

    host.appendChild(field.row);
    host.appendChild(box);
    host.appendChild(outWrap);
    host.appendChild(actions);

    function render() {
      var src = field.textarea.value;
      if (!src.trim()) { outArea.value = ''; box.show(ui('empty'), 'warn'); return; }
      if (src.length > MAX_CHARS) {
        outArea.value = '';
        box.show(ui('tooBig', { max: String(MAX_CHARS) }), 'error');
        return;
      }

      try {
        var doc = new DOMParser().parseFromString(src, 'text/html');
        var md = block(doc.body, 0).replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim();
        if (!md) { outArea.value = ''; box.show(ui('noText'), 'warn'); return; }
        outArea.value = md;
        box.show(ui('note'), '');
      } catch (e) {
        outArea.value = '';
        box.show(ui('badHtml'), 'error');
      }
    }

    render();
  }

  return { mount: mount };
})();
