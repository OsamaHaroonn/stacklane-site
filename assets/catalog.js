/*
 * Tool catalogue — language-neutral registry.
 *
 * Titles and descriptions come from assets/i18n/<lang>.json under
 * tools.<slug>; this file only says which tools exist, which category
 * each belongs to, and the extra words people search for.
 * Business pages are plain English pages, not i18n tools.
 */
window.TOOL_CATALOG = [
  { slug: 'merge-pdf',              category: 'pdf',         keywords: 'combine join merge pdf files document' },
  { slug: 'image-compressor',       category: 'images',      keywords: 'compress shrink resize photo jpg png webp smaller' },
  { slug: 'image-resizer',          category: 'images',      keywords: 'resize image width height pixels photo picture' },
  { slug: 'word-counter',           category: 'text',        keywords: 'word counter character count essay words' },
  { slug: 'qr-code-generator',      category: 'generators',  keywords: 'qr code generator qr code link url wifi' },
  { slug: 'password-generator',     category: 'generators',  keywords: 'password generator strong random secure' },
  { slug: 'age-calculator',         category: 'calculators', keywords: 'age calculator birthday date of birth' },
  { slug: 'percentage-calculator',  category: 'calculators', keywords: 'percentage calculator percent increase discount' },
  { slug: 'unit-converter',         category: 'converters',  keywords: 'unit converter metric imperial length temperature' },
  { slug: 'json-formatter',         category: 'developer',   keywords: 'json formatter validator minify pretty print' },
  { slug: 'loan-calculator',        category: 'calculators', keywords: 'loan calculator monthly payment interest amortisation borrowing' },
  { slug: 'mortgage-calculator', category: 'calculators', keywords: 'mortgage calculator monthly payment down payment house loan' },
  { slug: 'compound-interest-calculator', category: 'calculators', keywords: 'compound interest calculator savings growth compounding' },
  { slug: 'discount-calculator', category: 'calculators', keywords: 'discount calculator percent off sale price savings' },
  { slug: 'vat-calculator', category: 'calculators', keywords: 'vat calculator add remove tax net gross rate' },
  { slug: 'date-difference', category: 'calculators', keywords: 'date difference days between two dates calculator duration' },
  { slug: 'tip-split-calculator', category: 'calculators', keywords: 'tip calculator split bill per person gratuity' },
  { slug: 'roi-calculator', category: 'calculators', keywords: 'roi calculator return on investment profit loss percentage' },
  { slug: 'savings-goal-calculator', category: 'calculators', keywords: 'savings goal calculator monthly deposit compound interest target' },
  { slug: 'gpa-calculator', category: 'calculators', keywords: 'gpa calculator grade point average credits units transcript' },
  { slug: 'case-converter', category: 'text', keywords: 'case converter uppercase lowercase title camel snake kebab sentence case' },
  { slug: 'character-counter', category: 'text', keywords: 'character counter characters words lines sentences length limit' },
  { slug: 'remove-duplicate-lines', category: 'text', keywords: 'remove duplicate lines dedupe unique lines text clean' },
  { slug: 'random-number', category: 'generators', keywords: 'random number generator crypto secure pick number between range' },
  { slug: 'uuid-generator', category: 'generators', keywords: 'uuid generator v4 unique id random identifier rfc 4122' },
  { slug: 'base64', category: 'developer', keywords: 'base64 encoder decoder encode decode text utf-8' },
  { slug: 'url-encoder', category: 'developer', keywords: 'url encoder percent encode decode query string encode uri component' },
  { slug: 'timestamp-converter', category: 'developer', keywords: 'unix timestamp converter epoch date time seconds milliseconds utc' },
  { slug: 'color-converter', category: 'developer', keywords: 'color converter hex to rgb hsl hex code picker color values' },
  { slug: 'images-to-pdf', category: 'pdf', keywords: 'images to pdf combine photos jpg png into one pdf document' },
  { slug: 'split-pdf', category: 'pdf', keywords: 'split pdf separate pages extract range take pages out' },
  { slug: 'image-converter', category: 'images', keywords: 'image converter convert png to jpg webp png jpeg format change' },
  { slug: 'crop-rotate-image', category: 'images', keywords: 'crop image rotate picture cut resize rectangle turn photo' },
  { slug: 'time-zone-converter', category: 'converters', keywords: 'time zone converter world clock meeting time utc offset daylight saving' },
  { slug: 'typing-speed-test', category: 'text', keywords: 'typing speed test wpm words per minute accuracy typing practice' },
  { slug: 'regex-tester', category: 'developer', keywords: 'regex tester regular expression javascript matches groups flags debug' },
  { slug: 'hash-generator', category: 'developer', keywords: 'hash generator sha256 sha512 sha1 checksum hex digest text' },
  { slug: 'lorem-ipsum-generator', category: 'text', keywords: 'lorem ipsum generator placeholder text paragraphs sentences words dummy' },
  { slug: 'text-diff-checker', category: 'text', keywords: 'text diff checker compare two texts line by line differences changed lines' },
  { slug: 'roman-numerals', category: 'converters', keywords: 'roman numeral converter number to roman numerals mmxxiv history' },
  { slug: 'number-base-converter', category: 'converters', keywords: 'number base converter binary octal hexadecimal base 2 8 16 36' },
  { slug: 'color-contrast-checker', category: 'developer', keywords: 'color contrast checker wcag accessibility ratio aa aaa text background' },
  { slug: 'average-calculator', category: 'calculators', keywords: 'average calculator mean median mode range sum statistics numbers' },
  { slug: 'slug-generator', category: 'text', keywords: 'slug generator url slug permalink title to slug lowercase accents clean' },
  { slug: 'html-entity-encoder', category: 'developer', keywords: 'html entity encoder escape encode decode lt amp special characters' },
  { slug: 'jwt-decoder', category: 'developer', keywords: 'jwt decoder json web token decode payload header base64 token' },
  { slug: 'csv-json-converter', category: 'developer', keywords: 'csv to json converter json to csv table spreadsheet rows' },
  { slug: 'sort-lines', category: 'text', keywords: 'sort lines alphabetically a to z z to a numeric sort by length reorder' },
  { slug: 'working-days-calculator', category: 'calculators', keywords: 'working days calculator business days between dates exclude weekends holidays' },
  { slug: 'fraction-calculator', category: 'converters', keywords: 'fraction calculator add subtract multiply divide simplify mixed number' },
  { slug: 'ratio-calculator', category: 'converters', keywords: 'ratio calculator simplify scale solve proportion missing value' },
  { slug: 'stopwatch-timer', category: 'calculators', keywords: 'stopwatch online timer laps start pause reset elapsed' },
  { slug: 'image-to-base64', category: 'developer', keywords: 'image to base64 data uri encoder convert photo' },
  { slug: 'salary-to-hourly', category: 'calculators', keywords: 'salary hourly wage pay rate annual income per hour convert' },
  { slug: 'keyword-density-analyzer', category: 'text', keywords: 'keyword density word frequency counter repetition percentage text' },
  { slug: 'meta-tag-generator', category: 'developer', keywords: 'meta tags title description open graph twitter card canonical html head seo' },
  { slug: 'robots-txt-generator', category: 'developer', keywords: 'robots txt generator crawler allow disallow sitemap crawl rules' },
  { slug: 'xml-sitemap-generator', category: 'developer', keywords: 'xml sitemap generator urls crawl seo loc urlset changefreq priority' },
  { slug: 'css-box-shadow-generator', category: 'developer', keywords: 'box shadow css generator shadow blur spread rgba inset' },
  { slug: 'color-palette-generator', category: 'developer', keywords: 'color palette generator tints shades hex rgb swatches' },
  { slug: 'password-strength-checker', category: 'developer', keywords: 'password strength checker entropy bits estimate secure' },
  { slug: 'favicon-generator', category: 'generators', keywords: 'favicon generator png sizes icon apple touch android pwa' },
];

window.TOOL_CATS = {};
window.TOOL_CATALOG.forEach(function (t) { window.TOOL_CATS[t.slug] = t.category; });

/* The seven English Business pages — kept as ordinary pages.
   `desc` is a short unique line per page so no two cards ever
   show the same paragraph. */
window.BUSINESS_PAGES = [
  { slug: 'invoice',                name: 'Invoice generator',            desc: 'Build an invoice in the browser: line items, tax, discount, live totals and print to PDF.' },
  { slug: 'calculator',             name: 'Job pricing calculator',       desc: 'Turn hours, rate, materials and overhead into a price, then compare it with the market.' },
  { slug: 'margin-calculator',      name: 'Margin calculator',            desc: 'Margin vs markup, the effect of a discount, and the price needed for a target margin.' },
  { slug: 'break-even-calculator',  name: 'Break-even calculator',        desc: 'How many jobs or how much revenue covers your costs before the business starts earning.' },
  { slug: 'late-payment-calculator', name: 'Late payment calculator',     desc: 'What an overdue invoice costs you per day, with a late fee and interest over time.' },
  { slug: 'loss-calculator',        name: 'Leak calculator',              desc: 'Estimate what unanswered enquiries and manual admin cost you each month and each year.' },
  { slug: 'audit',                  name: 'Website audit checklist',      desc: '15 checks across speed, trust, conversion and findability, with a ranked list of fixes.' }
];