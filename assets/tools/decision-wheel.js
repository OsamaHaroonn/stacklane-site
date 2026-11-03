window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_OPTIONS = 20;
  var MAX_LEN = 60;
  var MAX_INPUT = 2000;

  function randInt(max) {
    var range = max | 0;
    if (range <= 0) return 0;
    var limit = Math.floor(4294967296 / range) * range;
    var buf = new Uint32Array(1);
    var v;
    do {
      crypto.getRandomValues(buf);
      v = buf[0];
    } while (v >= limit);
    return v % range;
  }

  function mount(json, X) {
    var ui = X.ui;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var result = TK.el('p', {
      role: 'status',
      'aria-live': 'polite',
      style: 'font-size:19px;font-weight:600;min-height:28px;margin:8px 0;' +
        'overflow-wrap:anywhere;word-break:break-word'
    });
    result.textContent = ui('ready');

    var list = TK.el('ul', {
      style: 'list-style:none;padding:0;margin:10px 0;display:grid;gap:6px;' +
        'grid-template-columns:minmax(0,1fr)'
    });

    var field = TK.textarea({
      id: 'dw-options',
      label: ui('options'),
      rows: 5,
      placeholder: ui('placeholder'),
      onInput: function () { render(-1); }
    });

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('spin'), spin));

    host.appendChild(field.row);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(result);
    host.appendChild(list);

    function options() {
      return field.textarea.value.split('\n')
        .map(function (l) { return l.trim(); })
        .filter(function (l) { return l !== ''; });
    }

    function render(chosen) {
      list.textContent = '';
      options().forEach(function (label, i) {
        var li = TK.el('li', {
          style: 'padding:8px 10px;border-radius:8px;border:1px solid ' +
            (i === chosen ? '#2f5bd7' : '#d8dde6') + ';background:' +
            (i === chosen ? '#eef2ff' : '#fff') + ';font-weight:' + (i === chosen ? '600' : '400') +
            ';overflow-wrap:anywhere;word-break:break-word'
        }, label);
        if (i === chosen) li.setAttribute('aria-current', 'true');
        list.appendChild(li);
      });
    }

    function spin() {
      var raw = field.textarea.value;
      var opts = options();

      if (raw.length > MAX_INPUT) {
        result.textContent = '';
        render(-1);
        box.show(ui('tooBig', { max: String(MAX_INPUT) }), 'error');
        return;
      }
      if (opts.length < 2) {
        result.textContent = '';
        render(-1);
        box.show(ui('needTwo'), 'warn');
        return;
      }
      if (opts.length > MAX_OPTIONS) {
        result.textContent = '';
        render(-1);
        box.show(ui('tooMany', { max: String(MAX_OPTIONS) }), 'error');
        return;
      }

      var tooLong = null;
      opts.forEach(function (o) {
        if (!tooLong && o.length > MAX_LEN) tooLong = o.slice(0, 40);
      });
      if (tooLong) {
        result.textContent = '';
        render(-1);
        box.show(ui('optionLong', { max: String(MAX_LEN) }), 'error');
        return;
      }

      var pick = randInt(opts.length);
      result.textContent = opts[pick];
      render(pick);
      box.show(ui('note'), '');
    }

    render(-1);
    box.show(ui('tip'), '');
  }

  return { mount: mount };
})();
