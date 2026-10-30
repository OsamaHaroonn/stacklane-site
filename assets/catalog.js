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