  var BRAND_SVG = '<svg class="brand-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z"></path>' +
    '<path d="M4 12.5 12 17l8-4.5"></path>' +
    '<path d="M4 17.5 12 22l8-4.5"></path></svg>';

  /* Search field that lives in the header. It filters the same catalogue
     the home page lists, so the tool you find here exists there. */
  function headSearch(json) {
    var box = el('div', { class: 'head-search' });
    var input = el('input', {
      id: 'head-q', type: 'search', autocomplete: 'off', spellcheck: 'false',
      placeholder: get(json, 'home.searchPlaceholder') || 'Search the tools',
      'aria-label': get(json, 'home.searchLabel') || 'Search the tools'
    });
    var list = el('ul', { id: 'head-results', class: 'head-results' });
    list.hidden = true;
    box.appendChild(input);
    box.appendChild(list);
    return box;
  }

  function legalLinks(json, homeHref) {
    var nav = get(json, 'nav') || {};
    var ul = el('ul', {});
    ul.appendChild(el('li', {}, el('a', { href: homeHref }, nav.home || 'Home')));
    ul.appendChild(el('li', {}, el('a', { href: '../privacy.html' }, nav.privacy || 'Privacy')));
    ul.appendChild(el('li', {}, el('a', { href: '../terms.html' }, nav.terms || 'Terms')));
    return ul;
  }

  /* Header: logo left; search and links right. Phones get a <details>
     menu instead of the links — it opens without any JavaScript. */
  function buildHeader(json, homeHref) {
    var host = document.getElementById('site-header');
    if (!host) return;
    var nav = get(json, 'nav') || {};
    var site = get(json, 'meta.siteName') || 'Stacklane';

    var wrap = el('div', { class: 'container head-in' });

    var brand = el('a', { class: 'brand', href: homeHref });
    brand.innerHTML = BRAND_SVG;
    brand.appendChild(el('span', { class: 'brand-word' }, site));
    wrap.appendChild(brand);

    var headNav = el('nav', { class: 'head-nav', 'aria-label': site });
    headNav.appendChild(headSearch(json));
    headNav.appendChild(el('a', { href: homeHref + '#categories' }, get(json, 'home.categoriesH2') || 'Categories'));
    if (lang === 'en') {
      headNav.appendChild(el('a', { href: 'business.html' }, get(json, 'categories.business.name') || 'Business'));
    }
    var alts = document.querySelectorAll('link[rel="alternate"][hreflang]');
    var alt = null;
    for (var i = 0; i < alts.length; i++) {
      var code = alts[i].getAttribute('hreflang');
      if (code && code !== 'x-default' && code !== lang) { alt = alts[i]; break; }
    }
    if (alt) {
      headNav.appendChild(el('a', {
        class: 'lang-switch',
        href: alt.getAttribute('href'),
        lang: alt.getAttribute('hreflang'),
        hreflang: alt.getAttribute('hreflang'),
        'aria-label': nav.otherLangLabel || nav.otherLang || 'Other language'
      }, nav.otherLang || 'Other language'));
    }
    wrap.appendChild(headNav);

    /* Phone menu */
    var menu = el('details', { class: 'menu' });
    menu.appendChild(el('summary', {}, 'Menu'));
    var panel = el('div', { class: 'menu-panel' });
    var list = el('ul', {});
    list.appendChild(el('li', {}, el('a', { href: homeHref }, nav.home || 'Home')));
    list.appendChild(el('li', {}, el('a', { href: homeHref + '#categories' }, get(json, 'home.categoriesH2') || 'Categories')));
    CATS.forEach(function (slug) {
      var name = get(json, 'categories.' + slug + '.name');
      if (!name) return;
      if (slug === 'business' && lang !== 'en') return;
      list.appendChild(el('li', {}, el('a', { href: homeHref.replace(/index\.html$/, '') + slug + '.html' }, name)));
    });
    list.appendChild(el('li', { class: 'menu-sep', 'aria-hidden': 'true' }, ''));
    list.appendChild(el('li', {}, el('a', { href: '../privacy.html' }, nav.privacy || 'Privacy')));
    list.appendChild(el('li', {}, el('a', { href: '../terms.html' }, nav.terms || 'Terms')));
    if (alt) {
      list.appendChild(el('li', {}, el('a', {
        href: alt.getAttribute('href'), lang: alt.getAttribute('hreflang'),
        hreflang: alt.getAttribute('hreflang')
      }, nav.otherLang || 'Other language')));
    }
    panel.appendChild(list);
    menu.appendChild(panel);
    wrap.appendChild(menu);

    host.appendChild(wrap);
  }

  /* Footer: three columns — about, categories, legal — and a
     left-aligned copyright. */
  function buildFooter(json, homeHref) {
    var host = document.getElementById('site-footer');
    if (!host) return;
    host.className = 'site-foot';
    var f = get(json, 'footer') || {};
    var nav = get(json, 'nav') || {};
    var site = get(json, 'meta.siteName') || 'Stacklane';

    var wrap = el('div', { class: 'container' });
    var grid = el('div', { class: 'foot-grid' });

    var about = el('div', {});
    about.appendChild(el('strong', {}, site));
    if (f.tagline) about.appendChild(el('p', { class: 'foot-tagline note' }, f.tagline));
    if (f.madeWith) about.appendChild(el('p', { class: 'note' }, f.madeWith));
    grid.appendChild(about);

    var cats = el('nav', { class: 'foot-cats', 'aria-label': f.categories || 'Categories' });
    cats.appendChild(el('span', { class: 'foot-head' }, f.categories || 'Categories'));
    var catList = el('ul', {});
    CATS.forEach(function (slug) {
      var name = get(json, 'categories.' + slug + '.name');
      if (!name) return;
      if (slug === 'business' && lang !== 'en') return;
      catList.appendChild(el('li', {}, el('a', { href: homeHref.replace(/index\.html$/, '') + slug + '.html' }, name)));
    });
    cats.appendChild(catList);
    grid.appendChild(cats);

    var legal = el('div', {});
    legal.appendChild(el('span', { class: 'foot-head' }, 'Stacklane'));
    var ul = el('ul', {});
    ul.appendChild(el('li', {}, el('a', { href: homeHref }, nav.home || 'Home')));
    ul.appendChild(el('li', {}, el('a', { href: '../privacy.html' }, nav.privacy || 'Privacy')));
    ul.appendChild(el('li', {}, el('a', { href: '../terms.html' }, nav.terms || 'Terms')));
    legal.appendChild(ul);
    grid.appendChild(legal);

    wrap.appendChild(grid);
    wrap.appendChild(el('p', { class: 'foot-copy' }, '© ' + new Date().getFullYear() + ' ' + site));
    host.appendChild(wrap);
  }

  /* Header search: substring match over every tool and business page,
     capped at eight results. Escape clears it; a click elsewhere closes it. */
  function initHeadSearch(json) {
    var input = document.getElementById('head-q');
    var list = document.getElementById('head-results');
    if (!input || !list) return;

    var items = [];
    (window.TOOL_CATALOG || []).forEach(function (t) {
      var title = get(json, 'tools.' + t.slug + '.title');
      if (!title) return;
      items.push({
        href: t.slug + '.html',
        hay: (title + ' ' + (get(json, 'tools.' + t.slug + '.desc') || '') + ' ' +
          (get(json, 'categories.' + t.category + '.name') || '')).toLowerCase(),
        title: title
      });
    });
    if (lang === 'en') {
      (window.BUSINESS_PAGES || []).forEach(function (p) {
        items.push({
          href: p.slug + '.html',
          hay: (p.name + ' ' + (p.desc || '')).toLowerCase(),
          title: p.name
        });
      });
    }

    function close() { list.hidden = true; list.textContent = ''; }

    input.addEventListener('input', function () {
      var q = String(input.value || '').trim().toLowerCase();
      if (!q) { close(); return; }
      var hits = items.filter(function (it) { return it.hay.indexOf(q) !== -1; }).slice(0, 8);
      list.textContent = '';
      if (!hits.length) {
        list.appendChild(el('li', { class: 'empty' }, get(json, 'home.noResults') || 'No tool matches that word.'));
        list.hidden = false;
        return;
      }
      hits.forEach(function (it) {
        list.appendChild(el('li', {}, el('a', { href: it.href }, it.title)));
      });
      list.hidden = false;
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; close(); }
    });
    input.addEventListener('blur', function () { setTimeout(close, 150); });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });
  }

