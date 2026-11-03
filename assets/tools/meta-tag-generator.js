window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX = 400;

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isUrl(s) {
    return /^https?:\/\/[^\s]+\.[^\s]+$/i.test(s);
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var outArea = TK.el('textarea', {
      id: 'mt-out',
      rows: 12,
      readonly: '',
      'aria-label': ui('output'),
      spellcheck: 'false'
    });
    var outWrap = TK.el('div', { class: 'tk-field' });
    outWrap.appendChild(TK.el('label', { for: 'mt-out' }, ui('output')));
    outWrap.appendChild(outArea);

    var counter = TK.el('p', { class: 'tk-msg' });
    counter.hidden = true;

    var title = TK.field({ id: 'mt-title', label: ui('title'), placeholder: ui('titlePh'), onInput: render });
    var desc = TK.field({ id: 'mt-desc', label: ui('description'), placeholder: ui('descPh'), onInput: render });
    var url = TK.field({ id: 'mt-url', label: ui('url'), placeholder: 'https://YOURDOMAIN.com/page.html', onInput: render });
    var image = TK.field({ id: 'mt-image', label: ui('image'), placeholder: 'https://YOURDOMAIN.com/card.png', onInput: render });
    var site = TK.field({ id: 'mt-site', label: ui('siteName'), placeholder: ui('sitePh'), onInput: render });
    var type = TK.select({
      id: 'mt-type',
      label: ui('type'),
      options: [{ value: 'website', label: ui('typeWebsite') }, { value: 'article', label: ui('typeArticle') }],
      value: 'website',
      onChange: render
    });

    var actions = TK.el('div', { class: 'tool-actions' });
    var copyBtn = TK.btn(ui('copy'), function () {
      var text = outArea.value;
      if (!text) { box.show(ui('nothingToCopy'), 'warn'); return; }
      TK.copy(text, function (ok) {
        box.show(ok ? ui('copied') : ui('copyFailed'), ok ? 'ok' : 'error');
      });
    }, { secondary: true });

    actions.appendChild(copyBtn);

    host.appendChild(title.row);
    host.appendChild(desc.row);
    host.appendChild(url.row);
    host.appendChild(image.row);
    host.appendChild(site.row);
    host.appendChild(type.row);
    host.appendChild(box);
    host.appendChild(counter);
    host.appendChild(outWrap);
    host.appendChild(actions);

    function line(attr, name, value) {
      return '<meta ' + attr + '="' + name + '" content="' + esc(value) + '">';
    }

    function build() {
      var t = title.input.value.trim();
      if (!t) return null;
      if (t.length > MAX) return { error: ui('tooLong', { max: String(MAX) }) };

      var d = desc.input.value.trim();
      var u = url.input.value.trim();
      var i = image.input.value.trim();
      var s = site.input.value.trim();

      if (u && !isUrl(u)) return { error: ui('badUrl') };
      if (i && !isUrl(i)) return { error: ui('badImage') };

      var lines = [];
      lines.push('<title>' + esc(t) + '</title>');
      if (d) lines.push(line('name', 'description', d));
      if (u) lines.push('<link rel="canonical" href="' + esc(u) + '">');
      lines.push(line('property', 'og:type', type.select.value));
      lines.push(line('property', 'og:title', t));
      if (d) lines.push(line('property', 'og:description', d));
      if (u) lines.push(line('property', 'og:url', u));
      if (s) lines.push(line('property', 'og:site_name', s));
      if (i) lines.push(line('property', 'og:image', i));
      lines.push(line('name', 'twitter:card', 'summary_large_image'));
      lines.push(line('name', 'twitter:title', t));
      if (d) lines.push(line('name', 'twitter:description', d));
      if (i) lines.push(line('name', 'twitter:image', i));

      return { text: lines.join('\n'), titleLen: t.length, descLen: d.length };
    }

    function render() {
      var r = build();
      if (!r) {
        outArea.value = '';
        counter.hidden = true;
        box.show(ui('empty'), 'warn');
        return;
      }
      if (r.error) {
        outArea.value = '';
        counter.hidden = true;
        box.show(r.error, 'error');
        return;
      }
      outArea.value = r.text;
      counter.textContent = ui('counts', {
        t: String(r.titleLen), d: String(r.descLen)
      });
      counter.hidden = false;
      counter.className = 'tk-msg' +
        ((r.titleLen > 60 || r.descLen > 160) ? ' warn' : '');
      box.show(ui('note'), '');
    }

    render();
  }

  return { mount: mount };
})();
