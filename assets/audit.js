/* ============================================================
   15-point website audit — scoring, ranked fixes, local save.
   Pure client-side, no network calls: ticks never leave the
   browser. The "email" action composes a message locally.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'stacklane.audit.v1';

  var GROUPS = [
    { name: 'Basics', ids: ['c1', 'c2', 'c3', 'c4'] },
    { name: 'Trust', ids: ['c5', 'c6', 'c7', 'c8'] },
    { name: 'Conversion', ids: ['c9', 'c10', 'c11', 'c12'] },
    { name: 'Findability', ids: ['c13', 'c14', 'c15'] }
  ];

  var ALL = GROUPS.reduce(function (a, g) { return a.concat(g.ids); }, []);

  function box(id) { return document.getElementById(id); }

  function checked(id) { var el = box(id); return !!(el && el.checked); }

  function save() {
    var state = {};
    ALL.forEach(function (id) { state[id] = checked(id); });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var state = JSON.parse(raw);
      ALL.forEach(function (id) {
        var el = box(id);
        if (el) el.checked = state[id] === true;
      });
    } catch (e) { /* corrupt or unavailable: start blank */ }
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function score() {
    return ALL.reduce(function (n, id) { return n + (checked(id) ? 1 : 0); }, 0);
  }

  function groupScore(g) {
    return g.ids.reduce(function (n, id) { return n + (checked(id) ? 1 : 0); }, 0);
  }

  function verdictText(n) {
    if (n >= 13) return 'Sound. No emergency — a little polish, then keep the basics maintained.';
    if (n >= 9) return 'Leaking. A handful of fixes recovers most of the lost enquiries.';
    if (n >= 5) return 'Losing enquiries most weeks. Two or three of these are quick to close.';
    if (n > 0) return 'Right now this works as a business card, not a sales tool.';
    return 'Tick what your site already does — the gaps are the point.';
  }

  function weakestGroup() {
    var sorted = GROUPS.slice().sort(function (a, b) {
      return groupScore(a) / a.ids.length - groupScore(b) / b.ids.length;
    });
    var g = sorted[0];
    return g.name + ' ' + groupScore(g) + '/' + g.ids.length;
  }

  function failing() {
    return ALL.filter(function (id) { return !checked(id); }).map(function (id) {
      var el = box(id);
      return { id: id, fix: el ? (el.getAttribute('data-fix') || el.id) : id };
    });
  }

  function render() {
    var n = score();
    setText('score', String(n));
    setText('s-pass', String(n));
    setText('s-fail', String(ALL.length - n));
    setText('s-groups', weakestGroup());

    var v = document.getElementById('verdict');
    if (v) v.textContent = verdictText(n);

    var list = document.getElementById('fix-list');
    if (!list) return;
    var gaps = failing().slice(0, 3);
    list.innerHTML = '';
    if (!gaps.length) {
      var li = document.createElement('li');
      li.textContent = 'Nothing left to fix on this list — re-run it every few months, it rots fast.';
      list.appendChild(li);
      return;
    }
    gaps.forEach(function (g) {
      var li = document.createElement('li');
      li.textContent = g.fix;
      list.appendChild(li);
    });
  }

  function asText() {
    var n = score();
    var lines = ['WEBSITE AUDIT — ' + n + '/15'];
    lines.push('');
    lines.push('Passed:');
    ALL.forEach(function (id) {
      if (!checked(id)) return;
      var lab = document.querySelector('label[for="' + id + '"]');
      lines.push('  [x] ' + (lab ? lab.firstChild.textContent.trim() : id));
    });
    lines.push('');
    lines.push('Still to fix:');
    failing().forEach(function (g) {
      var lab = document.querySelector('label[for="' + g.id + '"]');
      lines.push('  [ ] ' + (lab ? lab.firstChild.textContent.trim() : g.id));
      lines.push('       ' + g.fix);
    });
    lines.push('');
    lines.push(verdictText(n));
    return lines.join('\n');
  }

  function say(msg) {
    setText('audit-status', msg);
  }

  /* ---------- wire up ---------- */
  load();

  ALL.forEach(function (id) {
    var el = box(id);
    if (el) el.addEventListener('change', function () { save(); render(); });
  });

  var emailBtn = document.getElementById('email-audit');
  if (emailBtn) {
    emailBtn.addEventListener('click', function () {
      var S = window.STORE || {};
      var to = (S.CONTACT_EMAIL || '').trim();
      var subject = 'My website audit — ' + score() + '/15';
      window.location.href = 'mailto:' + encodeURIComponent(to) +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(asText() + '\n\n---\nSent from the Stacklane free audit tool.');
      say('Opening your email app with the audit in the body.');
    });
  }

  var copyBtn = document.getElementById('copy-audit');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = asText();
      function done(ok) {
        say(ok ? 'Audit copied — paste it anywhere.' :
          'Automatic copy was blocked. Select the text you need instead.');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });
  }

  var resetBtn = document.getElementById('reset-audit');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (!confirm('Clear every tick and start the audit again?')) return;
      ALL.forEach(function (id) { var el = box(id); if (el) el.checked = false; });
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      render();
      say('Cleared.');
    });
  }

  render();
})();