/* ============================================================
   Home page — categories, popular row, most useful grid and the
   full list grouped by category. Everything is rendered from
   assets/i18n/<lang>.json; search filters in the browser.
   ============================================================ */
window.HomePage = function (json, h) {
  'use strict';

  var el = h.el, get = h.get, CATS = h.CATS;
  var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();

  var searchInput = document.getElementById('tool-search');
  var noResults = document.getElementById('search-empty');
  var catGrid = document.getElementById('category-grid');
  var toolGrid = document.getElementById('tool-grid');
  var topGrid = document.getElementById('top-grid');
  var popularRow = document.getElementById('popular-row');
  var toolsH2 = document.getElementById('tools-h2');
  var catH2 = document.getElementById('cat-h2');
  if (!toolGrid) return;

  /* Simple line icons, drawn inline — no files, no requests. */
  var ICONS = {
    calculators: '<path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
    text: '<path d="M5 6h14M5 10h14M5 14h9M5 18h6"/>',
    pdf: '<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7Z"/><path d="M14 3v4h4M9 13h6M9 17h4"/>',
    images: '<rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="8.5" cy="10" r="1.5"/><path d="m21 16-5-5-4 4-2-2-4 4"/>',
    developer: '<path d="m9 8-5 4 5 4M15 8l5 4-5 4"/>',
    generators: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01M12 12h.01"/>',
    converters: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    business: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12h18"/>'
  };

  var POPULAR = ['word-counter', 'merge-pdf', 'qr-code-generator', 'percentage-calculator',
    'password-generator', 'image-compressor', 'json-formatter', 'loan-calculator'];
  var TOP = ['merge-pdf', 'word-counter', 'image-compressor', 'qr-code-generator',
    'percentage-calculator', 'json-formatter'];

  function toolTitle(slug) { return get(json, 'tools.' + slug + '.title'); }
  function toolDesc(slug) { return get(json, 'tools.' + slug + '.desc'); }
  function catName(slug) { return get(json, 'categories.' + slug + '.name'); }

  /* ---- category cards ---- */
  if (catGrid) {
    CATS.forEach(function (slug) {
      var name = catName(slug);
      var desc = get(json, 'categories.' + slug + '.desc');
      if (!name) return;

      var enOnly = slug === 'business' && lang !== 'en';
      var href = enOnly ? '../en/business.html' : slug + '.html';

      var card = el('a', { class: 'card cat-card', href: href });
      var icon = el('span', { class: 'cat-icon', 'aria-hidden': 'true' });
      icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
        (ICONS[slug] || ICONS.text) + '</svg>';
      card.appendChild(icon);
      card.appendChild(el('h3', {}, name));
      card.appendChild(el('p', {}, desc));
      if (enOnly) {
        card.appendChild(el('span', { class: 'badge' }, get(json, 'category.enOnly')));
      } else {
        var n = slug === 'business'
          ? window.BUSINESS_PAGES.length
          : window.TOOL_CATALOG.filter(function (t) { return t.category === slug; }).length;
        var label = n === 1
          ? get(json, 'category.countOne')
          : n + ' ' + get(json, 'category.countMany');
        card.appendChild(el('span', { class: 'badge' }, label));
      }
      card.setAttribute('data-search', (name + ' ' + desc + ' ' + slug).toLowerCase());
      catGrid.appendChild(card);
    });
  }

  /* ---- one card builder, used by both tool grids ---- */
  function makeCard(slug, title, desc, cat) {
    var card = el('a', { class: 'card tool-card', href: slug + '.html' });
    card.appendChild(el('span', { class: 'card-kicker' }, cat));
    card.appendChild(el('h3', {}, title));
    card.appendChild(el('p', {}, desc));
    card.setAttribute('data-search', (slug + ' ' + title + ' ' + desc + ' ' + cat).toLowerCase());
    return card;
  }

  var allCards = [];
  var total = 0; // tools in the grouped list only, not the curated duplicates

  /* ---- popular row: short links under the search box ---- */
  if (popularRow) {
    popularRow.appendChild(el('span', { class: 'popular-label' }, 'Popular'));
    POPULAR.forEach(function (slug) {
      var title = toolTitle(slug);
      if (!title) return;
      var a = el('a', { href: slug + '.html' }, title);
      a.setAttribute('data-popular', slug);
      popularRow.appendChild(a);
    });
  }

  /* ---- most useful tools ---- */
  if (topGrid) {
    TOP.forEach(function (slug) {
      var t = window.TOOL_CATALOG.filter(function (x) { return x.slug === slug; })[0];
      var title = toolTitle(slug);
      if (!t || !title) return;
      var card = makeCard(slug, title, toolDesc(slug), catName(t.category));
      topGrid.appendChild(card);
      allCards.push(card);
    });
  }

  /* ---- every tool, grouped by category ---- */
  var groups = [];
  CATS.forEach(function (slug) {
    var name = catName(slug);
    var list = [];

    window.TOOL_CATALOG.forEach(function (t) {
      if (t.category !== slug) return;
      var title = toolTitle(t.slug);
      if (!title) return;
      list.push([t.slug, title, toolDesc(t.slug)]);
    });

    if (slug === 'business') {
      (window.BUSINESS_PAGES || []).forEach(function (p) {
        list.push([p.slug, p.name, p.desc || get(json, 'categories.business.desc'), true]);
      });
    }

    if (!name || !list.length) return;

    var section = el('section', { class: 'tool-group' });
    section.appendChild(el('h3', {}, name));
    var grid = el('div', { class: 'grid grid-4' });
    list.forEach(function (row) {
      var card = makeCard(row[0], row[1], row[2], name);
      if (row[3]) card.classList.add('is-en');
      grid.appendChild(card);
      allCards.push(card);
      total++;
    });
    section.appendChild(grid);
    toolGrid.appendChild(section);
    groups.push(section);
  });

  if (toolsH2) {
    toolsH2.textContent = get(json, 'home.toolsH2') + ' (' + total + ')';
  }

  /* ---- filter: same rules for both grids, headings follow ---- */
  function filter() {
    var q = (searchInput.value || '').trim().toLowerCase();
    var shown = 0;

    allCards.forEach(function (card) {
      var hit = !q || card.getAttribute('data-search').indexOf(q) !== -1;
      card.hidden = !hit;
      if (hit) shown++;
    });

    groups.forEach(function (section) {
      var visible = section.querySelector('.tool-card:not([hidden])');
      section.hidden = q ? !visible : false;
    });

    if (catGrid) catGrid.parentNode.hidden = !!q;
    if (catH2) catH2.hidden = !!q;
    if (toolsH2) toolsH2.hidden = false;
    if (noResults) noResults.hidden = shown !== 0;
  }

  if (searchInput) {
    searchInput.addEventListener('input', filter);
    filter();
  }
};
