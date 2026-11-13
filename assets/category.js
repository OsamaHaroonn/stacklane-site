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

  /* Line icons, drawn inline — no files, no requests. Mirrors the home
     page map so a category's cards carry the same mark wherever they
     appear. */
  var ICONS = {
    calculators: '<path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
    text: '<path d="M5 6h14M5 10h14M5 14h9M5 18h6"/>',
    pdf: '<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7Z"/><path d="M14 3v4h4M9 13h6M9 17h4"/>',
    images: '<rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="8.5" cy="10" r="1.5"/><path d="m21 16-5-5-4 4-2-2-4 4"/>',
    developer: '<path d="m9 8-5 4 5 4M15 8l5 4-5 4"/>',
    generators: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01M12 12h.01"/>',
    converters: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    business: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12h18"/>',
    fun: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9h.01M15 9h.01"/>'
  };

  function iconSpan() {
    var span = el('span', { class: 'tool-icon', 'aria-hidden': 'true' });
    span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + (ICONS[slug] || ICONS.text) + '</svg>';
    return span;
  }

  /* How many tools are on this page, said plainly. countOne already
     reads "1 tool"; countMany is the bare word "tools". */
  function countPill(n) {
    var label = n === 1
      ? get(json, 'category.countOne')
      : n + ' ' + get(json, 'category.countMany');
    return el('span', { class: 'count-pill' }, label || String(n));
  }

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

  /* The count pill is a runtime nicety; add it before bailing out on a
     prerendered grid so the heading stays consistent either way. */
  var h1 = document.querySelector('.tool-head h1');
  if (h1 && !h1.querySelector('.count-pill')) h1.appendChild(countPill(items.length));

  /* tools/prerender.py wrote the same cards into the page. */
  if (grid.children.length) return;

  items.forEach(function (item) {
    var card = el('a', { class: 'card tool-card', href: item.href });
    card.appendChild(iconSpan());
    if (item.kicker) card.appendChild(el('span', { class: 'card-kicker' }, item.kicker));
    card.appendChild(el('h3', {}, item.title));
    if (item.desc) card.appendChild(el('p', {}, item.desc));
    card.appendChild(el('span', { class: 'card-arrow', 'aria-hidden': 'true' }, '\u2192'));
    grid.appendChild(card);
  });
};
