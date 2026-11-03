window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX = 1000;

  function parse(ua) {
    var out = { browser: null, version: null, engine: null, os: null, device: null, bot: false };

    if (/bot|crawler|spider|slurp|bingpreview|headless/i.test(ua)) out.bot = true;

    var m;
    if ((m = /Edg(?:e|A|iOS)?\/(\d+(?:\.\d+)?)/i.exec(ua))) { out.browser = 'Edge'; out.version = m[1]; }
    else if ((m = /OPR\/(\d+(?:\.\d+)?)/i.exec(ua))) { out.browser = 'Opera'; out.version = m[1]; }
    else if ((m = /Firefox\/(\d+(?:\.\d+)?)/i.exec(ua))) { out.browser = 'Firefox'; out.version = m[1]; }
    else if ((m = /Chrome\/(\d+(?:\.\d+)?)/i.exec(ua))) { out.browser = 'Chrome'; out.version = m[1]; }
    else if ((m = /Version\/(\d+(?:\.\d+)?).*Safari/i.exec(ua))) { out.browser = 'Safari'; out.version = m[1]; }
    else if (/Safari\//i.test(ua)) { out.browser = 'Safari'; out.version = null; }
    else if ((m = /MSIE (\d+)/i.exec(ua))) { out.browser = 'Internet Explorer'; out.version = m[1]; }

    if (out.browser === 'Firefox') out.engine = 'Gecko';
    else if (out.browser === 'Chrome' || out.browser === 'Edge' || out.browser === 'Opera') out.engine = 'Blink';
    else if (out.browser === 'Safari') out.engine = 'WebKit';
    else if (/Gecko\//i.test(ua)) out.engine = 'Gecko';

    if (/Windows NT 10\.0/i.test(ua)) out.os = 'Windows 10 or 11';
    else if (/Windows NT 6\.3/i.test(ua)) out.os = 'Windows 8.1';
    else if (/Windows NT 6\.1/i.test(ua)) out.os = 'Windows 7';
    else if (/Windows/i.test(ua)) out.os = 'Windows';
    else if ((m = /Android (\d+(?:\.\d+)?)/i.exec(ua))) out.os = 'Android ' + m[1];
    else if (/iPhone|iPad|iPod/i.test(ua)) out.os = 'iOS';
    else if (/Mac OS X/i.test(ua)) out.os = 'macOS';
    else if (/CrOS/i.test(ua)) out.os = 'ChromeOS';
    else if (/Linux/i.test(ua)) out.os = 'Linux';

    if (/iPad|Tablet/i.test(ua)) out.device = 'tablet';
    else if (/Mobile|Android/i.test(ua)) out.device = 'mobile';
    else out.device = 'desktop';

    return out;
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var field = TK.textarea({
      id: 'ua-input',
      label: ui('agent'),
      rows: 4,
      placeholder: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      onInput: render
    });

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('useMine'), function () {
      field.textarea.value = navigator.userAgent;
      render();
      box.show(ui('filled'), 'ok');
    }, { secondary: true }));

    host.appendChild(field.row);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(out);

    function render() {
      var ua = field.textarea.value.trim();
      if (!ua) { out.render([]); box.show(ui('empty'), 'warn'); return; }
      if (ua.length > MAX) { out.render([]); box.show(ui('tooLong', { max: String(MAX) }), 'error'); return; }

      var p = parse(ua);
      var unknown = ui('unknown');
      out.render([
        [ui('browser'), p.browser ? p.browser : unknown],
        [ui('version'), p.version ? p.version : unknown],
        [ui('engine'), p.engine ? p.engine : unknown],
        [ui('os'), p.os ? p.os : unknown],
        [ui('device'), ui(p.device)],
        [ui('automated'), p.bot ? ui('yes') : ui('no')],
        [ui('length'), TK.num(ua.length, 0)]
      ]);
      box.show(ui('approx'), '');
    }

    render();
  }

  return { mount: mount };
})();
