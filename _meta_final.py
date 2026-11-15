import io, os, re

# Final copy. Every sentence here is true of the code on that page.
FINAL = {
 # --- tools whose description was short or title was long ---
 'average-calculator': ('Average calculator — mean, median, mode and range',
   'Paste a list of numbers to get the count, the sum, the mean, the median, the mode and the range, with a note when no value repeats.'),
 'base64': ('Base64 encoder and decoder — text in, Base64 out',
   'Encode text as Base64 or decode Base64 back to text in your browser, with the character counts shown and nothing sent over the network.'),
 'bmi-calculator': ('BMI calculator — body mass index and its band',
   'Enter a weight and a height to get the body mass index, the band it falls in and a healthy weight range for that height. Arithmetic only, not advice.'),
 'bubble-wrap-popper': ('Bubble wrap popper — a grid of bubbles to pop',
   'Pop a grid of virtual bubbles for a minute of quiet. Nothing is scored, nothing is counted, and the whole toy runs inside the page you are on.'),
 'case-converter': ('Case converter — upper, lower, title and camel case',
   'Convert text to uppercase, lowercase, title case, sentence case, camel case, Pascal case, snake case or kebab case, then copy the result in one press.'),
 'character-counter': ('Character counter — with and without spaces',
   'Count characters with and without spaces, plus words, lines, sentences, letters, digits and UTF-8 bytes, and find the longest word in the text.'),
 'coin-flipper': ('Coin flipper — heads or tails, counted as you flip',
   'Flip a virtual coin and keep a running count of heads and tails, drawn with the browser crypto API. No sign-up, no account and nothing stored.'),
 'color-contrast-checker': ('Color contrast checker — WCAG ratio and pass',
   'Compare a text colour with a background to get the WCAG contrast ratio and whether the pair passes AA and AAA at normal and large text sizes.'),
 'color-converter': ('Color converter — HEX to RGB and HSL',
   'Type a HEX, RGB or HSL colour to see the same colour in the other notations, with the conversion shown and a swatch drawn in the page beside it.'),
 'color-palette-generator': ('Color palette generator — tints and shades',
   'Type a base colour to get two tints and two shades as HEX and RGB values, mixed in the page so the colour you type never leaves the browser.'),
 'compliment-generator': ('Compliment generator — a kind sentence, assembled',
   'Get a kind, specific sentence assembled from three short word lists, and ask for another whenever you want one. All of the words live in the page.'),
 'compound-interest-calculator': ('Compound interest calculator — growth by period',
   'See what a starting amount becomes when interest is added at each period, with the interest earned, the growth rate and a simple-interest comparison.'),
 'crop-rotate-image': ('Crop and rotate image — rectangle and angle',
   'Set a crop rectangle and a rotation, then download the result. The original size, the crop used and the new size all appear before you save it.'),
 'css-box-shadow-generator': ('CSS box shadow generator — live preview',
   'Set the offset, blur, spread, colour and inset flag to get a ready box-shadow value, with the live preview drawn beside the controls as you edit.'),
 'csv-json-converter': ('CSV to JSON converter — and JSON back to CSV',
   'Paste CSV to get an array of JSON objects, or paste JSON to get CSV with a header row, handling quoted fields and unusual line endings as it goes.'),
 'date-difference': ('Date difference — days, weeks and months between dates',
   'Pick two dates to count the days between them, the weeks and days, and the calendar difference, with the weekday that each of the dates falls on.'),
 'decision-wheel': ('Decision wheel — pick one option at random',
   'Type one option per line and spin to have one chosen at random. The pick comes from your browser, so the list of options is never sent anywhere.'),
 'dice-roller': ('Dice roller — d4 to d20, one to ten dice',
   'Roll one die or up to ten, from a d4 to a d20, and see each individual result and the total. Every roll is independent and made in your browser.'),
 'fake-hacker-typer': ('Fake hacker typer — a toy terminal, no scripts',
   'A toy terminal that types made-up commands as you press keys. Every line comes from a list in the page; nothing is executed, read or sent anywhere.'),
 'favicon-generator': ('Favicon generator — six icon sizes from one image',
   'Choose one image to draw the six common icon sizes, then download each one as a PNG for a browser tab, an Apple touch icon or an app icon.'),
 'fraction-calculator': ('Fraction calculator — add, subtract and simplify',
   'Add, subtract, multiply or divide two fractions to get the result in lowest terms with its decimal value, or simplify a single fraction on its own.'),
 'gpa-calculator': ('GPA calculator — average weighted by units',
   'Add a row per course with its grade points and its units to get a unit-weighted GPA, the total quality points and the units that were counted.'),
 'html-entity-encoder': ('HTML entity encoder — escape and unescape',
   'Encode HTML special characters as entities or decode entities back to characters, with the text length and the result length shown either way.'),
 'html-to-markdown': ('HTML to Markdown — headings, links and lists',
   'Paste HTML to convert headings, paragraphs, links, lists, bold and code into Markdown, with the scripts in the input never executed by the page.'),
 'image-converter': ('Image converter — PNG, JPG and WebP',
   'Convert a picture to JPG, PNG or WebP at a quality you set, then download it. The original size and the new size are both shown before you save.'),
 'image-to-base64': ('Image to Base64 — a data URI for CSS or HTML',
   'Choose an image to get a data URI you can paste into CSS or an HTML attribute, with the file size, the image type and the encoded length shown.'),
 'images-to-pdf': ('Images to PDF — photos into one A4 or Letter file',
   'Choose two or more pictures, pick A4, US Letter or a page that matches each image, and download one PDF built entirely inside your own browser.'),
 'jwt-decoder': ('JWT decoder — read a token header and payload',
   'Paste a JSON Web Token to read its header, payload and signature as formatted JSON. The signature is displayed but never verified, and the page says so.'),
 'keyword-density-analyzer': ('Keyword density — word frequency and share',
   'Paste text to see how often each word appears and what share of the total it takes, with an option to skip the common stop words while counting.'),
 'lorem-ipsum-generator': ('Lorem ipsum — paragraphs, sentences or words',
   'Generate placeholder paragraphs, sentences or single words in whatever count you choose, with or without the classic Lorem ipsum opening words.'),
 'meta-tag-generator': ('Meta tag generator — title, description and social',
   'Fill in a title, description and URL to get the title tag, meta description, canonical link, Open Graph tags and Twitter card tags, ready to paste.'),
 'number-base-converter': ('Number base converter — binary to base 36',
   'Convert a number between binary, octal, decimal, hexadecimal and base 36 at the same time, starting from whichever base you enter the number in.'),
 'password-strength-checker': ('Password strength checker — entropy in bits',
   'Type a password to see its length, character classes, pool size, entropy in bits and a strength band. An estimate only, and it is never stored.'),
 'percentage-calculator': ('Percentage calculator — percent, change, difference',
   'Find a percentage of a number, work out what percent one number is of another, or add and subtract a percentage, with the working printed below.'),
 'random-number': ('Random number generator — any range, crypto source',
   'Draw one or more whole numbers between a minimum and a maximum, using the browser cryptographic source, with repeats allowed and no modulo bias.'),
 'ratio-calculator': ('Ratio calculator — simplify or find the missing term',
   'Simplify a ratio to its lowest whole numbers, or find the missing term in a proportion, with the total number of parts shown underneath.'),
 'robots-txt-generator': ('Robots.txt generator — allow, block or custom',
   'Build a robots.txt that allows everything, blocks everything, or lists your own allow and disallow paths, with an optional sitemap line at the end.'),
 'roman-numerals': ('Roman numerals — numbers to letters and back',
   'Convert a number to Roman numerals or Roman numerals back to a number, with the value of each letter added up and shown in the working.'),
 'salary-to-hourly': ('Salary to hourly — annual pay as an hourly rate',
   'Turn a yearly salary into hourly, daily, weekly and monthly figures using the hours and weeks you actually work. Arithmetic only, with no tax rules.'),
 'shakespearean-insult-generator': ('Shakespearean insult generator — mild',
   'Build a mild stage-villain insult from archaic word lists. Playful and original, and not a quotation from any Shakespeare play. Copy it in a press.'),
 'slug-generator': ('Slug generator — a clean URL slug from a title',
   'Turn a title into a clean URL slug: lowercase, accents removed, symbols stripped and the words joined by whichever separator you choose.'),
 'sort-lines': ('Sort lines — A to Z, numeric or by length',
   'Paste a list to sort it A to Z, Z to A, numerically or by line length, with an option to drop blank lines and a note about any lines kept aside.'),
 'split-pdf': ('Split PDF — extract pages or save each page',
   'Choose a PDF and either extract the pages you name or save every page as its own file. The document is read locally and is never uploaded.'),
 'sql-formatter': ('SQL formatter — keywords upper, clauses on lines',
   'Paste a SQL statement to put its keywords in capitals and each clause on its own line, with quoted strings left exactly as they were written.'),
 'stopwatch-timer': ('Stopwatch and timer — start, pause, lap, reset',
   'Start, pause, lap and reset a stopwatch that counts in hundredths of a second, with the elapsed time and a numbered list of every lap you took.'),
 'text-diff-checker': ('Text diff checker — line-by-line differences',
   'Paste two versions of a text to see which lines were added, removed or left unchanged, each marked with a prefix and explained in a plain sentence.'),
 'time-zone-converter': ('Time zone converter — one moment, many cities',
   'Pick a moment and a city to see that same instant in several time zones at once, with each offset and whether daylight saving is in force there.'),
 'tip-split-calculator': ('Tip and split — tip, total and per person',
   'Enter the bill, the tip percentage and how many people are paying to see the tip, the total and the exact amount that each person owes.'),
 'typing-speed-test': ('Typing speed test — words per minute and accuracy',
   'Type the sample text to measure your words per minute and accuracy, with the correct and typed character counts and the formula shown underneath.'),
 'user-agent-parser': ('User agent parser — browser, engine, system, device',
   'Paste a user agent string to read the browser, its version, the engine, the operating system, the device type and whether it looks automated.'),
 'working-days-calculator': ('Working days — weekdays between two dates',
   'Count working days between two dates using your own weekend days and a holiday list, with the weekend, holiday and calendar day totals shown.'),

 # --- category / directory pages ---
 'pdf': ('PDF tools — three free tools, all in the browser',
   'Three PDF tools: merge several documents into one, split a document into pages, and turn a set of images into a PDF. Files stay on your device.'),
 'images': ('Image tools — compress, resize, convert and crop',
   'Four image tools: compress a photo to a smaller file, resize it to exact pixels, convert between PNG, JPG and WebP, and crop or rotate a picture.'),
 'text': ('Text tools — count, convert, compare and clean up',
   'Ten text tools for counting words and characters, changing case, removing duplicate lines, comparing two drafts, generating placeholder text and more.'),
 'generators': ('Generators — passwords, QR codes, UUIDs and icons',
   'Five generators that run offline: strong random passwords, QR codes as PNG files, version 4 UUIDs, random numbers in a range, and favicon sets.'),
 'calculators': ('Calculators — 17 tools for money, dates and health',
   'Seventeen calculators for loans, mortgages, savings, discounts, tax, tips, dates, working days, grades, BMI and more, each showing its working.'),
 'converters': ('Converters — units, bases, time zones and fractions',
   'Six converters for units, number bases, time zones, Roman numerals, fractions and ratios, each printing the factor or the working beside the answer.'),
 'developer': ('Developer tools — 21 tools for data and markup',
   'Twenty-one developer tools for JSON, hashes, regular expressions, Base64, URL and HTML encoding, JWT, CSV, SQL, meta tags, sitemaps and more.'),
 'fun': ('Fun tools — a coin, dice, a wheel and a few toys',
   'Seven small toys: a coin flipper, a dice roller, a decision wheel, bubble wrap, a fake terminal, a compliment generator and a mild insult generator.'),
 'business': ('Business tools — quotes, invoices, margins and an audit',
   'Seven pages for a small business: an invoice, a job pricing calculator, margin and break-even maths, late payment, lost revenue and a site audit.'),

 # --- the seven business pages ---
 'invoice': ('Invoice generator — line items, tax and print to PDF',
   'Add line items, set a tax rate and a discount, and watch the totals update. Print the finished invoice or save it as a PDF, all in the browser.'),
 'calculator': ('Job pricing calculator — hours, rate and materials',
   'Turn hours, an hourly rate, materials and overhead into a price for the job, then compare that price with what the market charges for similar work.'),
 'margin-calculator': ('Margin calculator — margin, markup and target price',
   'Work out margin from a cost and a price, see what a discount does to the margin, and find the price that hits a margin you are aiming for.'),
 'break-even-calculator': ('Break-even calculator — jobs that cover your costs',
   'Enter your fixed costs, the price of a job and its variable cost to see how many jobs or how much revenue covers the costs before you earn.'),
 'late-payment-calculator': ('Late payment calculator — the cost per day',
   'See what an overdue invoice costs you each day, and what a late fee and interest add up to over the weeks that a payment is outstanding.'),
 'loss-calculator': ('Leak calculator — what missed work costs a year',
   'Estimate what unanswered enquiries and manual admin cost your business each month and each year, from the numbers you enter for your own work.'),
 'audit': ('Website audit — 15 checks for speed, trust, finding',
   'Fifteen checks across speed, trust, conversion and findability, each scored, with a ranked list of the fixes that are worth doing first.'),

 # --- home ---
 'index': ('Free browser tools — 73 tools that run on your device',
   'Seventy-three free tools for PDFs, images, text, developers and everyday calculations. No account, no upload and no tracking; everything runs here.'),
}

def set_meta(path, title, desc):
    s = io.open(path, encoding='utf-8').read()
    if title:
        s = re.sub(r'<title>.*?</title>', '<title>%s</title>' % title, s, count=1, flags=re.S)
        s = re.sub(r'<meta property="og:title" content="[^"]*">',
                   '<meta property="og:title" content="%s">' % title.replace('"', '&quot;'), s, count=1)
        s = re.sub(r'<meta name="twitter:title" content="[^"]*">',
                   '<meta name="twitter:title" content="%s">' % title.replace('"', '&quot;'), s, count=1)
    if desc:
        if 'name="description"' in s:
            s = re.sub(r'<meta name="description" content="[^"]*">',
                       '<meta name="description" content="%s">' % desc.replace('"', '&quot;'), s, count=1)
        else:
            s = s.replace('</title>', '</title>\n<meta name="description" content="%s">'
                          % desc.replace('"', '&quot;'), 1)
        s = re.sub(r'<meta property="og:description" content="[^"]*">',
                   '<meta property="og:description" content="%s">' % desc.replace('"', '&quot;'), s, count=1)
        s = re.sub(r'<meta name="twitter:description" content="[^"]*">',
                   '<meta name="twitter:description" content="%s">' % desc.replace('"', '&quot;'), s, count=1)
    io.open(path, 'w', encoding='utf-8', newline='\n').write(s)

bad = []
n = 0
for slug, (title, desc) in sorted(FINAL.items()):
    p = 'en/%s.html' % slug
    if not os.path.isfile(p):
        bad.append((p, 'missing file'))
        continue
    if not (48 <= len(title) <= 62):
        bad.append((p, 'title %d: %s' % (len(title), title)))
    if not (138 <= len(desc) <= 162):
        bad.append((p, 'desc %d: %s' % (len(desc), desc)))
    set_meta(p, title, desc)
    n += 1
print('applied', n)
for b in bad:
    print('BAD', b)
