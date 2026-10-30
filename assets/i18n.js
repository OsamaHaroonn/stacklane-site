/*
 * i18n loader — the runtime source of every visible string on tool,
 * home and category pages.
 *
 * The JSON is resolved relative to this file's own URL, so it works
 * from any folder depth without a per-page configuration value.
 *
 * Same origin only: no third-party requests, strict CSP holds.
 */
(function () {
  'use strict';

  var LANG = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
  var cache = {};
  var here = document.currentScript && document.currentScript.src
    ? document.currentScript.src
    : location.href;

  function jsonUrl(lang) {
    return new URL('i18n/' + lang + '.json', here).href;
  }

  function load(lang) {
    lang = (lang || LANG).toLowerCase();
    if (cache[lang]) return Promise.resolve(cache[lang]);
    return fetch(jsonUrl(lang), { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('i18n HTTP ' + r.status + ' for ' + lang);
        return r.json();
      })
      .then(function (json) {
        cache[lang] = json;
        return json;
      });
  }

  /* Dotted-path lookup: get(dict, 'tools.word-counter.ui.words') */
  function get(dict, path) {
    var node = dict;
    var parts = String(path || '').split('.');
    for (var i = 0; i < parts.length && node != null; i++) node = node[parts[i]];
    return node == null ? '' : node;
  }

  /* {token} substitution: fill('in {n} days', { n: 4 }) → "in 4 days" */
  function fill(str, vars) {
    return String(str == null ? '' : str).replace(/\{(\w+)\}/g, function (m, key) {
      return vars && vars[key] != null ? String(vars[key]) : m;
    });
  }

  window.I18N = { lang: LANG, load: load, get: get, fill: fill };
})();