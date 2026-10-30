/*
 * Single site configuration.
 *
 * Change `siteUrl` here and the canonical URL, hreflang links, Open Graph
 * tags and the sitemap all follow — no other file needs editing to move
 * the site to a custom domain (sitemap.xml is the one static exception,
 * see README → "Changing the domain").
 *
 * Tracked on purpose: it holds no secrets and no personal data.
 */
window.SITE_CONFIG = {
  siteUrl: 'https://osamaharoonn.github.io/stacklane-site',

  // Languages the site is published in. Adding one means:
  //   1. assets/i18n/<code>.json
  //   2. a <code>/ folder of pages
  //   3. this list
  // Full steps in README → "Adding a language".
  languages: ['en', 'ar'],
  defaultLanguage: 'en',

  // Category directories, in the order they appear on the home page.
  // Language-neutral slugs; names and descriptions live in the i18n JSON.
  categories: ['pdf', 'images', 'text', 'generators', 'calculators', 'converters', 'developer', 'business']
};