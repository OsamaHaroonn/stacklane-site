/* ============================================================
   Category directory — one page per category, listing the tools in
   it for the current language. Business lists the seven English
   pages, which only ever exist under /en/.
   ============================================================ */
window.CategoryPage = function (json, h) {
  'use strict';

  var el = h.el, get = h.get, slug = h.category;
  var grid = document.getElementById('cat-grid');
  if (!grid) return;

  var items = [];

  if (slug === 'business') {
    if ((document.documentElement.getAttribute('lang') || 'en') !== 'en') return; // never lists EN-only tools in /ar/
    window.BUSINESS_PAGES.forEach(function (p) {
      items.push({ href: p.slug + '.html', title: p.name, desc: p.desc || '', kicker: null });
    });
  } else {
    window.TOOL_CATALOG.forEach(function (t) {
      if (t.category !== slug) return;
      var title = get(json, 'tools.' + t.slug + '.title');
      var desc = get(json, 'tools.' + t.slug + '.desc');
      if (!title) return;
      items.push({
        href: t.slug + '.html',
        title: title,
        desc: desc,
        kicker: null
      });
    });
  }

  if (!items.length) {
    var empty = document.getElementById('cat-empty');
    if (empty) empty.hidden = false;
    return;
  }

  items.forEach(function (item) {
    var card = el('a', { class: 'card tool-card', href: item.href });
    if (item.kicker) card.appendChild(el('span', { class: 'card-kicker' }, item.kicker));
    card.appendChild(el('h3', {}, item.title));
    if (item.desc) card.appendChild(el('p', {}, item.desc));
    grid.appendChild(card);
  });
};
