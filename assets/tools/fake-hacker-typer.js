window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;
  var MAX_LINES = 14;

  var LINES = [
    'initialising pretend console ...',
    'loading wordlist: 3 words, all polite',
    'checksum ok 0x5EEDFACE',
    'compiling nostalgia.c ... 42 warnings',
    'bypassing the firewall of imagination',
    'tracing route to nowhere in particular',
    'decrypting 4 knobs and 1 dial',
    'handshake accepted by the toaster',
    'allocating 64 KB of dramatic pause',
    'scanning for plot holes ... 0 found',
    'mounting /dev/coffee',
    'brute forcing a 2 character password ... done',
    'ACCESS GRANTED (this is a toy)',
    'copying files to /dev/null, as is tradition',
    'rendering a green waterfall of nonsense',
    'pinging the mainframe ... 1 hop, 0 replies',
    'injecting a tasteful monospace font',
    'auditing the audit trail of the audit',
    'patching the patch that patched the patch',
    'printing a stack trace for fun',
    'kernel panic averted with a shrug',
    'disconnecting from the imaginary network'
  ];

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
    var status = TK.el('p', {
      role: 'status',
      'aria-live': 'polite',
      style: 'margin:6px 0'
    });
    status.textContent = ui('idle');

    var screen = TK.el('div', {
      tabindex: '0',
      role: 'group',
      'aria-label': ui('screenLabel'),
      style: 'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;' +
        'font-size:13px;line-height:1.5;background:#0d1117;color:#7ee787;' +
        'border-radius:10px;padding:12px;min-height:220px;max-height:320px;' +
        'overflow:auto;white-space:pre-wrap;word-break:break-word;margin:10px 0'
    });
    screen.textContent = '> ' + ui('pressStart');

    var running = false;
    var printed = 0;

    function write(text) {
      var line = TK.el('div', {}, text);
      screen.appendChild(line);
      printed++;
      while (screen.children.length > MAX_LINES) screen.removeChild(screen.firstChild);
      screen.scrollTop = screen.scrollHeight;
    }

    function start() {
      running = true;
      printed = 0;
      screen.textContent = '';
      status.textContent = ui('running');
      screen.focus();
      write('> ' + ui('started'));
    }

    function stop() {
      running = false;
      status.textContent = ui('stopped');
      write('> ' + ui('ended'));
    }

    screen.addEventListener('keydown', function (e) {
      if (!running) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        stop();
        return;
      }
      if (e.key.length === 1 || e.key === 'Enter') {
        e.preventDefault();
        write('> ' + LINES[randInt(LINES.length)]);
      }
    });

    screen.addEventListener('click', function () {
      if (running) screen.focus();
    });

    var actions = TK.el('div', { class: 'tool-actions' });
    actions.appendChild(TK.btn(ui('start'), start));
    actions.appendChild(TK.btn(ui('stop'), stop, { secondary: true }));
    actions.appendChild(TK.btn(ui('copy'), function () {
      var text = Array.from(screen.children).map(function (c) { return c.textContent; }).join('\n');
      TK.copy(text, function (ok) {
        box.show(ok ? ui('copied') : ui('copyFailed'), ok ? 'ok' : 'error');
      });
    }, { secondary: true }));

    host.appendChild(status);
    host.appendChild(actions);
    host.appendChild(box);
    host.appendChild(screen);

    box.show(ui('note'), '');
  }

  return { mount: mount };
})();
