window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_URLS = 5000;
  var MAX_LINES = 5000;
  var MAX_LEN = 2000;

  function isUrl(s) {
    if (/[\s<>"'`]/.test(s)) return false;
    return /^https?:\/\/[^/]+\.[^/]+/i.test(s);
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var outWrap = TK.el('div', { class: 'tk-field' });
    var outArea = TK.el('textarea', {
      id: 'sm-out', rows: 12, readonly: '', 'aria-label': ui('output'), spellcheck: 'false'
    });
    outWrap.appendChild(TK.el('label', { for: 'sm-out' }, ui('output')));
    outWrap.appendChild(outArea);

    var list = TK.textarea({
      id: 'sm-urls',
      label: ui('urls'),
      rows: 8,
      placeholder: 'https://YOURDOMAIN.com/\nhttps://YOURDOMAIN.com/en/tools.html',
      onInput: render
    });

    var freq = TK.select({
      id: 'sm-freq', label: ui('changefreq'),
      options: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].map(function (v) {
        return { value: v, label: v };
      }),
      value: 'monthly', onChange: render
    });

    var prio = TK.select({
      id: 'sm-prio', label: ui('priority'),
      options: ['1.0', '0.9', '0.8', '0.7', '0.5', '0.3'].map(function (v) {
        return { value: v, label: v };
      }),
      value: '0.7', onChange: render
    });

    var grid = TK.el('div', { class: 'tk-grid' });
    grid.appendChild(freq.row);
    grid.appendChild(prio.row);

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('copy'), function () {
      if (!outArea.value) { box.show(ui('nothingToCopy'), 'warn'); return; }
      TK.copy(outArea.value, function (ok) {
        box.show(ok ? ui('copied') : ui('copyFailed'), ok ? 'ok' : 'error');
      });
    }, { secondary: true }));
    actions.appendChild(TK.btn(ui('download'), function () {
      if (!outArea.value) { box.show(ui('nothingToCopy'), 'warn'); return; }
      TK.download(new Blob([outArea.value], { type: 'application/xml' }), 'sitemap.xml');
      box.show(ui('downloaded'), 'ok');
    }, { secondary: true }));

    host.appendChild(list.row);
    host.appendChild(grid);
    host.appendChild(box);
    host.appendChild(outWrap);
    host.appendChild(actions);

    function render() {
      var raw = list.textarea.value;
      var lines = raw.split('\n').map(function (l) { return l.trim(); })
        .filter(function (l) { return l !== ''; });

      if (!lines.length) {
        outArea.value = '';
        box.show(ui('empty'), 'warn');
        return;
      }
      if (raw.length > MAX_LEN || lines.length > MAX_LINES) {
        outArea.value = '';
        box.show(ui('tooMany', { max: String(MAX_URLS) }), 'error');
        return;
      }

      var bad = null;
      lines.forEach(function (l) {
        if (bad) return;
        if (l.length > MAX_LEN) bad = ui('tooLong');
        else if (!isUrl(l)) bad = ui('badUrl', { value: l.slice(0, 60) });
      });
      if (bad) { outArea.value = ''; box.show(bad, 'error'); return; }

      var seen = {}, urls = [], dupes = 0;
      lines.forEach(function (l) {
        if (seen[l]) { dupes++; return; }
        seen[l] = true;
        urls.push(l);
      });
      if (urls.length > MAX_URLS) {
        outArea.value = '';
        box.show(ui('tooMany', { max: String(MAX_URLS) }), 'error');
        return;
      }

      var out = ['<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
      urls.forEach(function (u) {
        out.push('  <url>');
        out.push('    <loc>' + esc(u) + '</loc>');
        out.push('    <changefreq>' + freq.select.value + '</changefreq>');
        out.push('    <priority>' + prio.select.value + '</priority>');
        out.push('  </url>');
      });
      out.push('</urlset>');
      outArea.value = out.join('\n');

      box.show(dupes
        ? ui('dupes', { n: String(dupes) })
        : ui('note'), dupes ? 'warn' : '');
    }

    render();
  }

  return { mount: mount };
})();
