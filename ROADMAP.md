# Stacklane — 30-tool roadmap

Language-neutral slugs. Every visible string lives in
`assets/i18n/en.json` / `assets/i18n/ar.json` under `tools.<slug>`, so a tool
exists in a language only when that JSON has an entry for it.

Status: **built** = the page exists in `/en/` and `/ar/` and is tested in a
browser. **planned** = roadmap only, not built, no page, no JSON entry.

| # | Slug | Category | Target search phrase | Status |
|---|---|---|---|---|
| 1 | `merge-pdf` | pdf | merge pdf files online free | **built** |
| 2 | `split-pdf` | pdf | split pdf into separate pages | planned |
| 3 | `images-to-pdf` | pdf | convert images to pdf | planned |
| 4 | `pdf-to-jpg` | pdf | convert pdf to jpg | planned |
| 5 | `compress-pdf` | pdf | compress pdf file size | planned |
| 6 | `image-compressor` | images | compress image without losing quality | **built** |
| 7 | `image-resizer` | images | resize image to width and height | **built** |
| 8 | `image-converter` | images | convert image to png jpg webp | planned |
| 9 | `heic-to-jpg` | images | convert heic to jpg | planned |
| 10 | `crop-rotate-image` | images | crop and rotate image online | planned |
| 11 | `word-counter` | text | word counter | **built** |
| 12 | `character-counter` | text | character counter with limit | **built** |
| 13 | `case-converter` | text | convert text to uppercase lowercase | **built** |
| 14 | `remove-duplicate-lines` | text | remove duplicate lines from text | **built** |
| 15 | `qr-code-generator` | generators | qr code generator for url | **built** |
| 16 | `password-generator` | generators | strong random password generator | **built** |
| 17 | `barcode-generator` | generators | barcode generator online | planned |
| 18 | `random-number` | generators | random number generator between | **built** |
| 19 | `age-calculator` | calculators | age calculator from date of birth | **built** |
| 20 | `percentage-calculator` | calculators | percentage calculator | **built** |
| 21 | `date-difference` | calculators | days between two dates | **built** |
| 22 | `loan-calculator` | calculators | loan calculator monthly payment | **built** |
| 23 | `discount-calculator` | calculators | discount calculator percent off | **built** |
| 24 | `unit-converter` | converters | unit converter length temperature | **built** |
| 25 | `time-zone-converter` | converters | time zone converter current time | planned |
| 26 | `roman-numerals` | converters | roman numeral converter | planned |
| 27 | `json-formatter` | developer | json formatter and validator | **built** |
| 28 | `base64` | developer | base64 encode decode | planned |
| 29 | `color-converter` | developer | hex to rgb color converter | planned |
| 30 | `url-encoder` | developer | url encode decode online | planned |
| 31 | `mortgage-calculator` | calculators | mortgage calculator monthly payment | **built** |
| 32 | `compound-interest-calculator` | calculators | compound interest calculator | **built** |
| 33 | `vat-calculator` | calculators | vat calculator add or remove tax | **built** |
| 34 | `tip-split-calculator` | calculators | tip calculator split bill between people | **built** |
| 35 | `roi-calculator` | calculators | roi calculator return on investment | **built** |
| 36 | `savings-goal-calculator` | calculators | savings goal monthly deposit calculator | **built** |
| 37 | `gpa-calculator` | calculators | gpa calculator grade point average | **built** |
| 38 | `uuid-generator` | generators | uuid generator version 4 online | **built** |

## Category directories

`/en/` and `/ar/` each carry a directory page per category:
`pdf`, `images`, `text`, `generators`, `calculators`, `converters`,
`developer`. The eighth category, `business`, exists in **English only** —
its seven pages live under `/en/` and `/ar/business.html` deliberately does
not exist, so no directory ever lists a tool that has no Arabic version.

## Adding a planned tool (checklist)

1. Add `tools.<slug>` to `assets/i18n/en.json` **and** `ar.json`
   (title, desc, lede, how, example, 5 FAQs, ui strings) — real text, no filler.
2. Add `{ slug, category, keywords }` to `assets/catalog.js`.
3. Create `assets/tools/<slug>.js` using `assets/tools/shared.js`.
4. Create `en/<slug>.html` and `ar/<slug>.html` from the tool-page template
   (copy an existing pair; only the `data-tool` value, text and `data-i18n`
   paths change). Add vendor script tags if the tool needs a library.
5. Re-run the link audit and the browser checks at 375px.
6. Add the two URLs to `sitemap.xml`.
