# Stacklane — 80-tool roadmap

Language-neutral slugs. Every visible string lives in
`assets/i18n/en.json` / `assets/i18n/ar.json` under `tools.<slug>`, so a tool
exists in a language only when that JSON has an entry for it.

Status: **built** = the page exists in `/en/` and is tested in a browser.
**planned** = roadmap only, not built, no page, no JSON entry. Arabic versions
are parked on `preview-park-ar`; the tools added after that point are English
only until Arabic is re-enabled.

| # | Slug | Category | Target search phrase | Status |
|---|---|---|---|---|
| 1 | `merge-pdf` | pdf | merge pdf files online free | **built** |
| 2 | `split-pdf` | pdf | split pdf into separate pages | **built** |
| 3 | `images-to-pdf` | pdf | convert images to pdf | **built** |
| 4 | `pdf-to-jpg` | pdf | convert pdf to jpg | planned |
| 5 | `compress-pdf` | pdf | compress pdf file size | planned |
| 6 | `image-compressor` | images | compress image without losing quality | **built** |
| 7 | `image-resizer` | images | resize image to width and height | **built** |
| 8 | `image-converter` | images | convert image to png jpg webp | **built** |
| 9 | `heic-to-jpg` | images | convert heic to jpg | planned |
| 10 | `crop-rotate-image` | images | crop and rotate image online | **built** |
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
| 25 | `time-zone-converter` | converters | time zone converter current time | **built** |
| 26 | `roman-numerals` | converters | roman numeral converter | **built** |
| 27 | `json-formatter` | developer | json formatter and validator | **built** |
| 28 | `base64` | developer | base64 encode decode | **built** |
| 29 | `color-converter` | developer | hex to rgb color converter | **built** |
| 30 | `url-encoder` | developer | url encode decode online | **built** |
| 31 | `mortgage-calculator` | calculators | mortgage calculator monthly payment | **built** |
| 32 | `compound-interest-calculator` | calculators | compound interest calculator | **built** |
| 33 | `vat-calculator` | calculators | vat calculator add or remove tax | **built** |
| 34 | `tip-split-calculator` | calculators | tip calculator split bill between people | **built** |
| 35 | `roi-calculator` | calculators | roi calculator return on investment | **built** |
| 36 | `savings-goal-calculator` | calculators | savings goal monthly deposit calculator | **built** |
| 37 | `gpa-calculator` | calculators | gpa calculator grade point average | **built** |
| 38 | `uuid-generator` | generators | uuid generator version 4 online | **built** |
| 39 | `timestamp-converter` | developer | unix timestamp to date converter | **built** |
| 40 | `typing-speed-test` | text | typing speed test wpm | **built** |
| 41 | `regex-tester` | developer | regex tester online | **built** |
| 42 | `hash-generator` | developer | sha256 hash generator | **built** |
| 43 | `lorem-ipsum-generator` | text | lorem ipsum generator | **built** |
| 44 | `text-diff-checker` | text | text diff checker compare versions | **built** |
| 45 | `number-base-converter` | converters | number base converter binary hex | **built** |
| 46 | `color-contrast-checker` | developer | color contrast checker wcag ratio | **built** |
| 47 | `average-calculator` | calculators | average calculator mean median mode | **built** |
| 48 | `slug-generator` | text | slug generator url slug | **built** |
| 49 | `html-entity-encoder` | developer | html entity encoder escape | **built** |
| 50 | `jwt-decoder` | developer | jwt decoder decode token | **built** |
| 51 | `csv-json-converter` | developer | csv to json converter | **built** |
| 52 | `sort-lines` | text | sort lines a to z numeric | **built** |
| 53 | `working-days-calculator` | calculators | working days calculator business days | **built** |
| 54 | `fraction-calculator` | converters | fraction calculator add subtract | **built** |
| 55 | `ratio-calculator` | converters | ratio calculator simplify ratio | **built** |
| 56 | `stopwatch-timer` | calculators | online stopwatch with laps | **built** |
| 57 | `image-to-base64` | developer | image to base64 converter | **built** |

| 58 | `salary-to-hourly` | calculators | salary to hourly calculator | **built** |
| 59 | `keyword-density-analyzer` | text | keyword density checker | **built** |
| 60 | `meta-tag-generator` | developer | meta tag generator | **built** |
| 61 | `robots-txt-generator` | developer | robots txt generator | **built** |
| 62 | `xml-sitemap-generator` | developer | xml sitemap generator | **built** |
| 63 | `css-box-shadow-generator` | developer | css box shadow generator | **built** |
| 64 | `color-palette-generator` | developer | color palette generator | **built** |
| 65 | `password-strength-checker` | developer | password strength checker | **built** |
| 66 | `favicon-generator` | generators | favicon generator | **built** |
| 67 | `html-to-markdown` | developer | html to markdown converter | **built** |
| 68 | `user-agent-parser` | developer | user agent parser | **built** |
| 69 | `bmi-calculator` | calculators | bmi calculator | **built** |
| 70 | `sql-formatter` | developer | sql formatter | **built** |
| 71 | `coin-flipper` | fun | flip a coin online | **built** |
| 72 | `dice-roller` | fun | roll dice online | **built** |
| 73 | `decision-wheel` | fun | decision wheel picker | **built** |
| 74 | `bubble-wrap-popper` | fun | bubble wrap popper | **built** |
| 75 | `fake-hacker-typer` | fun | fake hacker typer | **built** |
| 76 | `compliment-generator` | fun | compliment generator | **built** |
| 77 | `shakespearean-insult-generator` | fun | shakespearean insult generator | **built** |
## Category directories

`/en/` and `/ar/` each carry a directory page per category:
`pdf`, `images`, `text`, `generators`, `calculators`, `converters`,
`developer`, `fun`. The last category, `business`, exists in **English only** —
its seven pages live under `/en/` and `/ar/business.html` deliberately does
not exist, so no directory ever lists a tool that has no Arabic version.

## Adding a planned tool (checklist)

1. Add `tools.<slug>` to `assets/i18n/en.json` (title, desc, lede, how,
   example, 5 FAQs, ui strings) — real text, no filler. Add the same entry to
   `ar.json` only when Arabic is re-enabled.
2. Add `{ slug, category, keywords }` to `assets/catalog.js`.
3. Create `assets/tools/<slug>.js` using `assets/tools/shared.js`.
4. Create `en/<slug>.html` from the tool-page template (plus `ar/<slug>.html`
   when Arabic is re-enabled)
   (copy an existing pair; only the `data-tool` value, text and `data-i18n`
   paths change). Add vendor script tags if the tool needs a library.
5. Re-run the link audit and the browser checks at 375px.
6. Add the two URLs to `sitemap.xml`.
