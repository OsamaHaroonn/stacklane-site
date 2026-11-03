/* ============================================================
   Home page — centred hero, category cards, 8 popular cards and one
   compact section per category. Everything is rendered from
   assets/i18n/<lang>.json and assets/catalog.js.

   The Business category is deliberately absent from this page: it
   keeps its own category page and is linked from the footer and menu.
   ============================================================ */
window.HomePage = function (json, h) {
  'use strict';

  var el = h.el, get = h.get, CATS = h.CATS;
  var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();

  var searchInput = document.getElementById('tool-search');
  var searchCount = document.getElementById('search-count');
  var resultsSec = document.getElementById('search-results');
  var resultsH2 = document.getElementById('results-h2');
  var resultsGrid = document.getElementById('results-grid');
  var noResults = document.getElementById('search-empty');
  var catGrid = document.getElementById('category-grid');
  var popularGrid = document.getElementById('popular-grid');
  var catSections = document.getElementById('cat-sections');
  var popularRow = document.getElementById('popular-row');

  /* Line icons, drawn inline — no files, no requests. */
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

  function icon(slug, cls) {
    var span = el('span', { class: cls || 'cat-icon', 'aria-hidden': 'true' });
    span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + (ICONS[slug] || ICONS.text) + '</svg>';
    return span;
  }

  function toolTitle(slug) { return get(json, 'tools.' + slug + '.title'); }
  function toolDesc(slug) { return get(json, 'tools.' + slug + '.desc'); }
  function catName(slug) { return get(json, 'categories.' + slug + '.name'); }

  var POPULAR = ['word-counter', 'merge-pdf', 'qr-code-generator', 'percentage-calculator',
    'password-generator', 'image-compressor', 'json-formatter', 'loan-calculator'];

  /* ---- the searchable index: every tool plus the business pages ---- */
  var INDEX = [];
  (window.TOOL_CATALOG || []).forEach(function (t) {
    var title = toolTitle(t.slug);
    if (!title) return;
    INDEX.push({
      href: t.slug + '.html', title: title, desc: toolDesc(t.slug) || '',
      cat: catName(t.category) || '',
      hay: (title + ' ' + (toolDesc(t.slug) || '') + ' ' + t.slug + ' ' + (catName(t.category) || '')).toLowerCase()
    });
  });
  var business = (lang === 'en' && window.BUSINESS_PAGES) ? window.BUSINESS_PAGES : [];
  business.forEach(function (p) {
    INDEX.push({
      href: p.slug + '.html', title: p.name, desc: p.desc || '',
      cat: catName('business') || '',
      hay: (p.name + ' ' + (p.desc || '') + ' ' + p.slug).toLowerCase()
    });
  });

  if (searchCount) {
    searchCount.textContent = INDEX.length + ' tools: ' +
      (INDEX.length - business.length) + ' browser tools and ' + business.length + ' business pages.';
  }

  /* ---- category cards: no Business on the home page ---- */
  if (catGrid) {
    CATS.forEach(function (slug) {
      if (slug === 'business') return;
      var name = catName(slug);
      if (!name) return;
      var n = (window.TOOL_CATALOG || []).filter(function (t) { return t.category === slug; }).length;
      if (!n) return;

      var card = el('a', { class: 'card cat-card', href: slug + '.html' });
      card.appendChild(icon(slug, 'cat-icon'));
      card.appendChild(el('h3', {}, name));
      card.appendChild(el('p', {}, get(json, 'categories.' + slug + '.desc') || ''));
      card.appendChild(el('span', { class: 'badge' }, n + ' ' + (get(json, 'category.countMany') || 'tools')));
      catGrid.appendChild(card);
    });
  }

  /* ---- popular chips under the search box ---- */
  if (popularRow) {
    popularRow.appendChild(el('span', { class: 'popular-label' }, 'Popular'));
    POPULAR.slice(0, 6).forEach(function (slug) {
      var title = toolTitle(slug);
      if (!title) return;
      popularRow.appendChild(el('a', { href: slug + '.html' }, title));
    });
  }

  /* ---- eight popular cards ---- */
  if (popularGrid) {
    POPULAR.forEach(function (slug) {
      var title = toolTitle(slug);
      var cat = window.TOOL_CATS ? window.TOOL_CATS[slug] : null;
      if (!title || !cat) return;
      var card = el('a', { class: 'card tool-card', href: slug + '.html' });
      card.appendChild(icon(cat, 'row-icon'));
      card.appendChild(el('h3', {}, title));
      card.appendChild(el('p', {}, toolDesc(slug) || ''));
      popularGrid.appendChild(card);
    });
  }

  /* ---- one compact section per category, six tools each ----
     A tool appears once on the page: popular entries are skipped here. */
  if (catSections) {
    CATS.forEach(function (slug) {
      if (slug === 'business') return;
      var name = catName(slug);
      if (!name) return;

      var all = (window.TOOL_CATALOG || []).filter(function (t) {
        return t.category === slug && toolTitle(t.slug);
      });
      var rest = all.filter(function (t) { return POPULAR.indexOf(t.slug) === -1; });
      if (!rest.length) return;

      var sec = el('section', { class: 'cat-section', id: 'cat-' + slug });
      var container = el('div', { class: 'container' });
      var head = el('header', {});
      head.appendChild(el('h2', {}, name));
      var viewAll = el('a', { class: 'view-all', href: slug + '.html' }, 'View all ' + all.length + ' tools');
      head.appendChild(viewAll);
      container.appendChild(head);

      var grid = el('div', { class: 'row-grid' });
      rest.slice(0, 6).forEach(function (t) {
        var row = el('a', { class: 'tool-row', href: t.slug + '.html' });
        row.appendChild(icon(slug, 'row-icon'));
        row.appendChild(el('span', {}, toolTitle(t.slug)));
        grid.appendChild(row);
      });
      container.appendChild(grid);
      sec.appendChild(container);
      catSections.appendChild(sec);
    });
  }

  /* ---- search: filters the whole catalogue, not only the cards shown ---- */
  function setHidden(node, hidden) { if (node) node.hidden = hidden; }

  function filter() {
    var q = (searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase();
    var on = q.length > 0;

    setHidden(resultsSec, !on);
    setHidden(document.getElementById('categories'), on);
    setHidden(document.getElementById('popular'), on);
    setHidden(catSections, on);
    setHidden(document.getElementById('trust-band'), on);

    if (!on) {
      if (resultsGrid) resultsGrid.textContent = '';
      return;
    }

    var hits = INDEX.filter(function (it) { return it.hay.indexOf(q) !== -1; });
    if (resultsH2) {
      resultsH2.textContent = (get(json, 'home.toolsH2') || 'All tools') + ' (' + hits.length + ')';
    }
    if (resultsGrid) {
      resultsGrid.textContent = '';
      hits.forEach(function (it) {
        var card = el('a', { class: 'card tool-card', href: it.href });
        card.appendChild(el('span', { class: 'card-kicker' }, it.cat));
        card.appendChild(el('h3', {}, it.title));
        if (it.desc) card.appendChild(el('p', {}, it.desc));
        resultsGrid.appendChild(card);
      });
    }
    setHidden(noResults, hits.length !== 0);
  }

  if (searchInput) {
    searchInput.addEventListener('input', filter);
    /* Arriving from the header search link should land in the field. */
    if (location.hash === '#search') searchInput.focus();
    filter();
  }
};
