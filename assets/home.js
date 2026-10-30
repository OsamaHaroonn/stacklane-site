/* ============================================================
   Home page — category grid + client-side tool search.

   Rendered entirely from assets/i18n/<lang>.json; the catalogue only
   supplies slugs and categories. Filtering happens in the browser on
   every keystroke — nothing is sent anywhere.
   ============================================================ */
window.HomePage = function (json, h) {
  'use strict';

  var el = h.el, get = h.get, CATS = h.CATS;
  var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
  var body = document.body;

  var searchInput = document.getElementById('tool-search');
  var noResults = document.getElementById('search-empty');
  var catGrid = document.getElementById('category-grid');
  var toolGrid = document.getElementById('tool-grid');
  var toolsH2 = document.getElementById('tools-h2');
  var catH2 = document.getElementById('cat-h2');
  if (!toolGrid) return;

  function toolTitle(slug) { return get(json, 'tools.' + slug + '.title'); }
  function toolDesc(slug) { return get(json, 'tools.' + slug + '.desc'); }

  /* ---- category cards ---- */
  var catCards = [];
  if (catGrid) {
    CATS.forEach(function (slug) {
      var name = get(json, 'categories.' + slug + '.name');
      var desc = get(json, 'categories.' + slug + '.desc');
      if (!name) return;

      // Business exists in English only: an Arabic visitor gets an honest
      // "English only" card pointing at the English directory, so no
      // /ar/ page ever lists tools that have no Arabic version.
      var enOnly = slug === 'business' && lang !== 'en';
      var href = enOnly ? '../en/business.html' : slug + '.html';

      var card = el('a', { class: 'card cat-card', href: href });
      card.appendChild(el('h3', {}, name));
      card.appendChild(el('p', {}, desc));
      if (enOnly) {
        card.appendChild(el('span', { class: 'badge' }, get(json, 'category.enOnly')));
      } else {
        var n = slug === 'business'
          ? window.BUSINESS_PAGES.length
          : window.TOOL_CATALOG.filter(function (t) { return t.category === slug; }).length;
        var unit = n === 1 ? get(json, 'category.countOne') : get(json, 'category.countMany');
        card.appendChild(el('span', { class: 'badge' }, n + ' ' + unit));
      }
      card.setAttribute('data-search', (name + ' ' + desc + ' ' + slug).toLowerCase());
      catGrid.appendChild(card);
      catCards.push(card);
    });
  }

  /* ---- tool cards: the ten i18n tools, then the seven English
     Business pages (badge + link to /en/ when this is not English) ---- */
  var toolCards = [];
  var enOnlyLabel = get(json, 'category.enOnly');

  window.TOOL_CATALOG.forEach(function (t) {
    var title = toolTitle(t.slug);
    var desc = toolDesc(t.slug);
    if (!title) return; // not built in this language yet

    var catName = get(json, 'categories.' + t.category + '.name');
    var card = el('a', { class: 'card tool-card', href: t.slug + '.html' });
    card.appendChild(el('span', { class: 'card-kicker' }, catName));
    card.appendChild(el('h3', {}, title));
    card.appendChild(el('p', {}, desc));
    card.setAttribute('data-search',
      (t.slug + ' ' + title + ' ' + desc + ' ' + t.keywords + ' ' + catName).toLowerCase());
    toolGrid.appendChild(card);
    toolCards.push(card);
  });

  (window.BUSINESS_PAGES || []).forEach(function (p) {
    var enOnly = lang !== 'en';
    var catName = get(json, 'categories.business.name');
    var card = el('a', {
      class: 'card tool-card' + (enOnly ? ' is-en' : ''),
      href: enOnly ? '../en/' + p.slug + '.html' : p.slug + '.html'
    });
    card.appendChild(el('span', { class: 'card-kicker' }, catName));
    if (enOnly) card.appendChild(el('span', { class: 'badge' }, enOnlyLabel));
    card.appendChild(el('h3', {}, p.name));
    card.appendChild(el('p', {}, p.desc || get(json, 'categories.business.desc')));
    card.setAttribute('data-search',
      (p.slug + ' ' + p.name + ' ' + (p.desc || '') + ' business invoice pricing margin audit ' + catName).toLowerCase());
    toolGrid.appendChild(card);
    toolCards.push(card);
  });

  if (toolsH2) {
    toolsH2.textContent = get(json, 'home.toolsH2') + ' (' + toolCards.length + ')';
  }

  /* ---- filter ---- */
  function filter() {
    var q = (searchInput.value || '').trim().toLowerCase();
    var shown = 0;

    toolCards.forEach(function (card) {
      var hit = !q || card.getAttribute('data-search').indexOf(q) !== -1;
      card.hidden = !hit;
      if (hit) shown++;
    });

    if (catGrid) catGrid.parentNode.hidden = !!q; // categories only browseable unfiltered
    if (catH2) catH2.hidden = !!q;
    if (toolsH2) toolsH2.hidden = false;
    if (noResults) noResults.hidden = shown !== 0;
  }

  if (searchInput) {
    searchInput.addEventListener('input', filter);
    filter();
  }
};
