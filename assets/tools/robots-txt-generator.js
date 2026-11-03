window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_LINES = 50;
  var MAX_PATH = 200;

  function isUrl(s) {
    return /^https?:\/\/[^\s]+\.[^\s]+$/i.test(s);
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var outWrap = TK.el('div', { class: 'tk-field' });
    var outArea = TK.el('textarea', {
      id: 'rb-out', rows: 8, readonly: '', 'aria-label': ui('output'), spellcheck: 'false'
    });
    outWrap.appendChild(TK.el('label', { for: 'rb-out' }, ui('output')));
    outWrap.appendChild(outArea);

    var mode = TK.select({
      id: 'rb-mode',
      label: ui('mode'),
      options: [
        { value: 'allow', label: ui('modeAllow') },
        { value: 'block', label: ui('modeBlock') },
        { value: 'custom', label: ui('modeCustom') }
      ],
      value: 'allow',
      onChange: render
    });

    var agent = TK.field({
      id: 'rb-agent', label: ui('agent'), value: '*', onInput: render
    });

    var paths = TK.textarea({
      id: 'rb-paths',
      label: ui('paths'),
      rows: 5,
      placeholder: '/private/\n/admin/',
      onInput: render
    });

    var sitemap = TK.field({
      id: 'rb-sitemap',
      label: ui('sitemap'),
      placeholder: 'https://YOURDOMAIN.com/sitemap.xml',
      onInput: render
    });

    var notes = TK.el('div', { class: 'tk-out' });

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('copy'), function () {
      var text = outArea.value;
      if (!text) { box.show(ui('nothingToCopy'), 'warn'); return; }
      TK.copy(text, function (ok) {
        box.show(ok ? ui('copied') : ui('copyFailed'), ok ? 'ok' : 'error');
      });
    }, { secondary: true }));
    actions.appendChild(TK.btn(ui('download'), function () {
      var text = outArea.value;
      if (!text) { box.show(ui('nothingToCopy'), 'warn'); return; }
      TK.download(new Blob([text], { type: 'text/plain' }), 'robots.txt');
      box.show(ui('downloaded'), 'ok');
    }, { secondary: true }));

    host.appendChild(mode.row);
    host.appendChild(agent.row);
    host.appendChild(paths.row);
    host.appendChild(sitemap.row);
    host.appendChild(box);
    host.appendChild(outWrap);
    host.appendChild(actions);
    host.appendChild(notes);

    function renderNotes(lines) {
      notes.textContent = '';
      lines.forEach(function (pair) {
        var row = TK.el('div', { class: 'tk-row' });
        row.appendChild(TK.el('span', { class: 'tk-row-label' }, pair[0]));
        row.appendChild(TK.el('span', { class: 'tk-row-value' }, pair[1]));
        notes.appendChild(row);
      });
      notes.hidden = !lines.length;
    }

    function render() {
      var pick = mode.select.value;
      var a = agent.input.value.trim() || '*';
      var sm = sitemap.input.value.trim();
      var list = paths.textarea.value.split('\n').map(function (l) { return l.trim(); })
        .filter(function (l) { return l !== ''; });

      paths.row.hidden = pick !== 'custom';

      if (sm && !isUrl(sm)) {
        outArea.value = '';
        renderNotes([]);
        box.show(ui('badSitemap'), 'error');
        return;
      }
      if (list.length > MAX_LINES) {
        outArea.value = '';
        renderNotes([]);
        box.show(ui('tooManyPaths', { max: String(MAX_LINES) }), 'error');
        return;
      }
      var bad = null;
      list.forEach(function (l) {
        var p = l.charAt(0) === '!' ? l.slice(1) : l;
        if (p.length > MAX_PATH) bad = ui('tooLongPath');
        else if (p.charAt(0) !== '/') bad = ui('badPath', { value: p.slice(0, 40) });
      });
      if (bad) { outArea.value = ''; renderNotes([]); box.show(bad, 'error'); return; }

      var lines = [];
      if (pick === 'allow') {
        lines.push('User-agent: *');
        lines.push('Disallow:');
      } else if (pick === 'block') {
        lines.push('User-agent: *');
        lines.push('Disallow: /');
      } else {
        lines.push('User-agent: ' + a);
        if (!list.length) lines.push('Disallow:');
        list.forEach(function (l) {
          if (l.charAt(0) === '!') lines.push('Allow: ' + l.slice(1));
          else lines.push('Disallow: ' + l);
        });
      }
      if (sm) {
        lines.push('');
        lines.push('Sitemap: ' + sm);
      }

      outArea.value = lines.join('\n');
      renderNotes([
        [ui('explainAgent'), ui('explainAgentText')],
        [ui('explainDisallow'), ui('explainDisallowText')],
        [ui('explainAllow'), ui('explainAllowText')],
        [ui('explainSitemap'), ui('explainSitemapText')]
      ]);
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
