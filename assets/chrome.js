/* ============================================================
   Shared site chrome — loaded on every page after config.js,
   i18n.js and catalog.js.

   What it does:
     1. fills the year
     2. points canonical, hreflang, og:url/og:image and JSON-LD at
        SITE_CONFIG.siteUrl, so a custom domain is a single config edit
     3. loads assets/i18n/<lang>.json and applies every data-i18n string
     4. renders header, footer, breadcrumbs, FAQ, related tools,
        the home grid/search or the category directory
     5. mounts the tool registered by assets/tools/<slug>.js

   Pages that are plain English HTML (the seven Business tools) carry no
   data-i18n attributes, so step 3-5 is skipped for them entirely.

   No inline script, no third-party request: strict CSP holds.
   ============================================================ */
(function () {
  'use strict';

  var C = window.SITE_CONFIG || {};
  var base = String(C.siteUrl || '').trim().replace(/\/+$/, '');
  var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
  var body = document.body;
  var CATS = C.categories || [];

  /* ---------- 1. Year ---------- */
  [].forEach.call(document.querySelectorAll('[data-year], #year'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- 2. Base URL: canonical, hreflang, og:, JSON-LD ----------
     Every URL is rebuilt as siteUrl + this page's path, so the head tags
     are correct after a domain move without touching any HTML file. */
  if (base) {
    var page = base + location.pathname.replace(/index\.html$/, '');

    var canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.setAttribute('href', page);

    [].forEach.call(document.querySelectorAll('link[rel="alternate"][hreflang]'), function (l) {
      try { l.setAttribute('href', base + new URL(l.getAttribute('href'), location.href).pathname); }
      catch (e) { /* leave a malformed href alone */ }
    });

    [].forEach.call(document.querySelectorAll('meta[property="og:url"]'), function (m) {
      m.setAttribute('content', page);
    });
    [].forEach.call(document.querySelectorAll('meta[property="og:image"]'), function (m) {
      try { m.setAttribute('content', base + new URL(m.getAttribute('content'), location.href).pathname); }
      catch (e) { /* leave it alone */ }
    });

    [].forEach.call(document.querySelectorAll('script[type="application/ld+json"]'), function (s) {
      try {
        var data = JSON.parse(s.textContent);
        if (data && typeof data === 'object') {
          if (data.url) data.url = page;
          if (data['@id']) data['@id'] = page;
          s.textContent = JSON.stringify(data);
        }
      } catch (e) { /* leave the block as shipped */ }
    });
  }

  /* ---------- 3-5. Everything visible, from the i18n JSON ---------- */
  var needsI18n = document.querySelector('[data-i18n], [data-tool], [data-home], [data-category]');
  if (!needsI18n || !window.I18N) return;

  function get(json, path) { return I18N.get(json, path); }
  function fill(json, path, vars) { return I18N.fill(I18N.get(json, path), vars); }

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'href') node.setAttribute('href', attrs[k]);
      else if (k === 'class') node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    if (text != null) node.textContent = text;
    return node;
  }

  /* data-i18n="path.to.string"           → textContent
     data-i18n-var-<name>="path"          → fills the {name} token
     data-i18n-ph="path"                 → placeholder attribute
     data-i18n-aria="path"               → aria-label attribute */
  function applyText(root, json) {
    [].forEach.call(root.querySelectorAll('[data-i18n]'), function (node) {
      var str = get(json, node.getAttribute('data-i18n'));
      if (!str) return;
      var vars = {};
      [].forEach.call(node.attributes, function (a) {
        if (a.name.indexOf('data-i18n-var-') === 0) {
          vars[a.name.slice('data-i18n-var-'.length)] = get(json, a.value);
        }
      });
      node.textContent = I18N.fill(str, vars);
    });
    [].forEach.call(root.querySelectorAll('[data-i18n-ph]'), function (node) {
      var v = get(json, node.getAttribute('data-i18n-ph'));
      if (v) node.setAttribute('placeholder', v);
    });
    [].forEach.call(root.querySelectorAll('[data-i18n-aria]'), function (node) {
      var v = get(json, node.getAttribute('data-i18n-aria'));
      if (v) node.setAttribute('aria-label', v);
    });
  }

  /* Header: brand + home + all tools + language switcher.
     The switcher only appears when this page actually declares an
     alternate language version in its head. */
  function buildHeader(json, homeHref) {
    var host = document.getElementById('site-header');
    if (!host) return;

    var nav = get(json, 'nav');
    var wrap = el('div', { class: 'wrap nav' });
    var brand = el('a', { class: 'brand', href: homeHref }, get(json, 'meta.siteName'));
    var links = el('div', { class: 'nav-links' });

    links.appendChild(el('a', { href: homeHref, class: 'hide-sm' }, nav.home));
    links.appendChild(el('a', { href: homeHref + '#tools' }, nav.allTools));

    var alts = document.querySelectorAll('link[rel="alternate"][hreflang]');
    var alt = null;
    for (var i = 0; i < alts.length; i++) {
      var code = alts[i].getAttribute('hreflang');
      if (code && code !== 'x-default' && code !== lang) { alt = alts[i]; break; }
    }
    if (alt) {
      var a = el('a', {
        class: 'lang-switch',
        href: alt.getAttribute('href'),
        lang: alt.getAttribute('hreflang'),
        hreflang: alt.getAttribute('hreflang'),
        'aria-label': nav.otherLangLabel
      }, nav.otherLang);
      links.appendChild(a);
    }

    wrap.appendChild(brand);
    wrap.appendChild(links);
    host.appendChild(wrap);
  }

  function buildFooter(json, homeHref) {
    var host = document.getElementById('site-footer');
    if (!host) return;
    var f = get(json, 'footer');
    var nav = get(json, 'nav');

    var wrap = el('div', { class: 'wrap foot-grid' });

    var about = el('div', {});
    about.appendChild(el('strong', {}, get(json, 'meta.siteName')));
    about.appendChild(el('p', { class: 'note' }, f.tagline));
    about.appendChild(el('p', { class: 'note' }, f.madeWith));
    wrap.appendChild(about);

    var cats = el('nav', { class: 'foot-cats', 'aria-label': f.categories });
    cats.appendChild(el('span', { class: 'foot-head' }, f.categories));
    var list = el('ul', {});
    CATS.forEach(function (slug) {
      var name = get(json, 'categories.' + slug + '.name');
      if (!name) return;
      // The Business directory exists in English only: never emit a link
      // to an /ar/business.html that does not exist.
      if (slug === 'business' && lang !== 'en') return;
      list.appendChild(el('li', {}, el('a', { href: homeHref.replace(/index\.html$/, '') + slug + '.html' }, name)));
    });
    cats.appendChild(list);
    wrap.appendChild(cats);

    var legal = el('div', {});
    legal.appendChild(el('span', { class: 'foot-head' }, 'Stacklane'));
    var ul = el('ul', {});
    ul.appendChild(el('li', {}, el('a', { href: '../privacy.html' }, nav.privacy)));
    ul.appendChild(el('li', {}, el('a', { href: '../terms.html' }, nav.terms)));
    legal.appendChild(ul);
    wrap.appendChild(legal);

    host.appendChild(wrap);
    host.appendChild(el('p', { class: 'foot-copy' },
      '© ' + new Date().getFullYear() + ' ' + get(json, 'meta.siteName')));
  }

  I18N.load().then(function (json) {
    var bodyTool = body.getAttribute('data-tool');
    var isHome = body.hasAttribute('data-home');
    var category = body.getAttribute('data-category');
    // Every i18n page lives one level below the root (en/…, ar/…), so the
    // language home is always a sibling index.html.
    var homeHref = 'index.html';

    applyText(document, json);
    buildHeader(json, homeHref);
    buildFooter(json, homeHref);

    /* Breadcrumb: Home / Category / (tool) */
    var crumbs = document.getElementById('crumbs');
    if (crumbs && (bodyTool || category)) {
      var catSlug = category || (window.TOOL_CATS && window.TOOL_CATS[bodyTool]);
      crumbs.appendChild(el('a', { href: 'index.html' }, get(json, 'nav.home')));
      if (catSlug) {
        crumbs.appendChild(el('span', { class: 'sep', 'aria-hidden': 'true' }, '›'));
        crumbs.appendChild(el('a', { href: catSlug + '.html' },
          get(json, 'categories.' + catSlug + '.name')));
      }
      if (bodyTool) {
        crumbs.appendChild(el('span', { class: 'sep', 'aria-hidden': 'true' }, '›'));
        crumbs.appendChild(el('span', {}, get(json, 'tools.' + bodyTool + '.title')));
      }
    }

    /* FAQ blocks: <dl data-faq="tools.<slug>.faq"></dl> */
    [].forEach.call(document.querySelectorAll('[data-faq]'), function (list) {
      var items = get(json, list.getAttribute('data-faq'));
      if (!Array.isArray(items)) return;
      items.forEach(function (item) {
        var d = el('details', { class: 'faq-item' });
        d.appendChild(el('summary', {}, item.q));
        d.appendChild(el('p', {}, item.a));
        list.appendChild(d);
      });
    });

    /* Related tools: same-category siblings (max 4) + a back link.
       The section hides itself when the category has no siblings yet. */
    if (bodyTool && window.TOOL_CATS && window.TOOL_CATALOG) {
      var relHost = document.getElementById('related');
      var backLink = document.getElementById('back-cat');
      var cat = window.TOOL_CATS[bodyTool];

      var siblings = cat ? window.TOOL_CATALOG.filter(function (t) {
        return t.category === cat && t.slug !== bodyTool &&
               !!get(json, 'tools.' + t.slug + '.title');
      }) : [];

      if (relHost) {
        siblings.slice(0, 4).forEach(function (t) {
          var card = el('a', { class: 'card tool-card', href: t.slug + '.html' });
          card.appendChild(el('span', { class: 'card-kicker' },
            get(json, 'categories.' + cat + '.name')));
          card.appendChild(el('h3', {}, get(json, 'tools.' + t.slug + '.title')));
          card.appendChild(el('p', {}, get(json, 'tools.' + t.slug + '.desc')));
          relHost.appendChild(card);
        });
        if (!relHost.children.length) {
          var sec = relHost.closest ? relHost.closest('section') : null;
          if (sec) sec.setAttribute('hidden', '');
        }
      }

      if (backLink && cat) {
        backLink.setAttribute('href', cat + '.html');
        backLink.textContent = fill(json, 'tool.backToCategory', {
          name: get(json, 'categories.' + cat + '.name')
        });
      }
    }

    if (isHome && window.HomePage) window.HomePage(json, { el: el, get: get, fill: fill, CATS: CATS });
    if (category && window.CategoryPage) window.CategoryPage(json, { category: category, el: el, get: get, fill: fill });

    if (bodyTool && window.TOOL && typeof window.TOOL.mount === 'function') {
      window.TOOL.mount(json, {
        slug: bodyTool,
        lang: lang,
        el: el,
        get: function (p) { return get(json, p); },
        t: function (key, vars) { return fill(json, 'tools.' + bodyTool + '.' + key, vars); },
        ui: function (key, vars) { return fill(json, 'tools.' + bodyTool + '.ui.' + key, vars); },
        common: function (key, vars) { return fill(json, 'tool.' + key, vars); }
      });
    }
  }).catch(function (err) {
    // A failed i18n load must never leave a silent blank page.
    var main = document.getElementById('main') || body;
    var note = el('p', { class: 'load-error' },
      'This page could not load its text file. Please reload. (' + err.message + ')');
    main.insertBefore(note, main.firstChild);
    if (window.console && console.error) console.error('i18n load failed:', err);
  });
})();