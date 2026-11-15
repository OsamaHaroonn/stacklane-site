import io, json, re, os, sys

EN = json.load(io.open('assets/i18n/en.json', encoding='utf-8'))

# Hand-written title clauses: the promise of each page, true of the code.
T = {
 'merge-pdf': 'combine documents in the order you choose',
 'image-compressor': 'shrink JPG, PNG and WebP in the browser',
 'image-resizer': 'set the pixel width and height, then download',
 'word-counter': 'words, characters, sentences and reading time',
 'qr-code-generator': 'a QR code for a link or text, as a PNG',
 'password-generator': 'strong random passwords, made offline',
 'age-calculator': 'exact age in years, months, weeks and days',
 'percentage-calculator': "percent of a number and change",
 'unit-converter': "length, weight, temperature and speed",
 'json-formatter': 'format, minify and validate JSON',
 'loan-calculator': 'monthly payment, total paid and interest',
 'mortgage-calculator': "payment, deposit and interest",
 'compound-interest-calculator': 'growth with interest added each period',
 'discount-calculator': 'sale price, saving and percent off',
 'vat-calculator': 'add or remove tax at any rate you enter',
 'date-difference': 'days, weeks and months between two dates',
 'tip-split-calculator': "tip, total and per person",
 'roi-calculator': 'profit, return on investment and multiple',
 'savings-goal-calculator': 'the monthly deposit a target needs',
 'gpa-calculator': 'average weighted by course units',
 'case-converter': 'upper, lower, title, sentence, camel and snake',
 'character-counter': 'characters with and without spaces, and bytes',
 'remove-duplicate-lines': 'unique lines, first occurrence kept',
 'random-number': 'secure random numbers in any range',
 'uuid-generator': 'v4 identifiers from the browser, or v1-style',
 'base64': 'encode and decode text as Base64',
 'url-encoder': 'percent-encode or decode any string',
 'timestamp-converter': 'Unix seconds and milliseconds to a date',
 'color-converter': 'HEX to RGB and HSL with the working shown',
 'images-to-pdf': 'photos into one PDF, A4 or Letter',
 'split-pdf': 'extract pages or save every page separately',
 'image-converter': 'PNG, JPG and WebP, with a quality setting',
 'crop-rotate-image': 'crop a rectangle and turn the picture',
 'time-zone-converter': 'one moment in several cities at once',
 'typing-speed-test': 'words per minute and accuracy as you type',
 'regex-tester': 'matches, indices and groups as you type',
 'hash-generator': 'SHA-256, SHA-512, SHA-384 and SHA-1 digests',
 'lorem-ipsum-generator': "placeholder text, paragraphs or words",
 'text-diff-checker': 'line-by-line differences between two texts',
 'roman-numerals': 'numbers to Roman numerals and back',
 'number-base-converter': "binary, octal, decimal and hex",
 'color-contrast-checker': 'WCAG contrast ratio and pass or fail',
 'average-calculator': 'mean, median, mode, range and sum',
 'slug-generator': 'a clean URL slug from any title',
 'html-entity-encoder': 'escape and unescape HTML special characters',
 'jwt-decoder': 'read a token header and payload, no check',
 'csv-json-converter': 'CSV into JSON, or JSON into CSV',
 'sort-lines': 'A to Z, Z to A, numeric or by length',
 'working-days-calculator': "weekdays between two dates",
 'fraction-calculator': 'add, subtract, multiply and simplify',
 'ratio-calculator': 'simplify a ratio or find the missing term',
 'stopwatch-timer': 'start, pause, lap and reset a stopwatch',
 'image-to-base64': 'a picture as a data URI for CSS or HTML',
 'salary-to-hourly': "annual pay as an hourly rate",
 'keyword-density-analyzer': "word frequency and share",
 'meta-tag-generator': "title, description and social tags",
 'robots-txt-generator': 'crawl rules and a sitemap line',
 'xml-sitemap-generator': "a valid sitemap from your URLs",
 'css-box-shadow-generator': 'a box-shadow value with a live preview',
 'color-palette-generator': 'tints and shades from one base colour',
 'password-strength-checker': "entropy in bits and a band",
 'favicon-generator': 'six icon sizes from one image',
 'html-to-markdown': 'headings, links, lists and bold in Markdown',
 'user-agent-parser': 'browser, engine, system and device type',
 'bmi-calculator': 'body mass index and the band it falls in',
 'sql-formatter': 'a readable query with keywords upper-cased',
 'coin-flipper': 'a fair heads or tails, counted as you go',
 'dice-roller': 'd4 to d20, one die or ten, with the total',
 'decision-wheel': 'pick one option from a list at random',
 'bubble-wrap-popper': 'a grid of bubbles to pop, no score kept',
 'fake-hacker-typer': 'a toy terminal that types at random',
 'compliment-generator': 'a kind sentence assembled from word lists',
 'shakespearean-insult-generator': "a mild Elizabethan insult",
 # business
 'invoice': 'line items, tax, discount and a print-ready invoice',
 'calculator': 'hours, rate and materials into a job price',
 'margin-calculator': 'margin, markup and the price for a target',
 'break-even-calculator': 'how many jobs cover your fixed costs',
 'late-payment-calculator': 'what an overdue invoice costs per day',
 'loss-calculator': 'what missed enquiries and admin cost a year',
 'audit': 'fifteen checks across speed, trust and finding',
}

CAT = {
 'pdf': ('PDF tools', 'three tools for PDFs, all in the browser'),
 'images': ('Image tools', 'compress, resize, convert and crop pictures'),
 'text': ('Text tools', 'count, convert, compare and clean up text'),
 'generators': ('Generators', 'passwords, QR codes, UUIDs and favicons'),
 'calculators': ('Calculators', 'money, dates, health and school figures'),
 'converters': ('Converters', 'units, bases, time zones and fractions'),
 'developer': ('Developer tools', 'JSON, hashes, regex, encoding and meta tags'),
 'fun': ('Fun tools', 'a coin, dice, a wheel and a few toys'),
 'business': ('Business tools', 'quotes, invoices, margins and an audit'),
}

# Extra description sentences for the pages whose own copy is short.
EXTRA = {
 'privacy.html': 'The page lists what the site stores (nothing) and what your browser keeps on its own.',
 'terms.html': 'The page covers what the tools are for, what they do not promise, and the limits of the free service.',
 '404.html': 'The address may have a typo, or the page may have moved. The tools index and the search box will find it.',
}

# Hand-written meta descriptions, 140-160 characters, each true of the code.
D = {
 'merge-pdf': 'Add two or more PDFs, set the order you want them in, and download one combined file. The pages are merged in your browser, so nothing is uploaded.',
 'image-compressor': 'Pick a photo, choose a quality level and an output format, then download a smaller file. The original size, the result and the saving are all shown.',
 'image-resizer': 'Set the pixel width and height, lock the aspect ratio if you want to keep it, and download the resized picture. The image never leaves your browser.',
 'word-counter': 'Paste or type text to count words, characters with and without spaces, sentences and paragraphs, with an estimated reading and speaking time.',
 'qr-code-generator': 'Type a link or a message to get a QR code at 240, 480 or 960 pixels, drawn in your browser and downloaded as a PNG. Nothing is sent anywhere.',
 'password-generator': 'Choose a length and the character types you want, then copy or download a random password made with the browser crypto API, with an entropy estimate.',
 'age-calculator': 'Enter a date of birth and a second date to get the exact age in years, months and days, plus the total days and when the next birthday falls.',
 'percentage-calculator': 'Find a percentage of a number, work out what percent one number is of another, or add and subtract a percentage, with the working shown.',
 'unit-converter': 'Convert length, mass, volume, area, speed and temperature between metric and imperial units, with the exact conversion factor printed below.',
 'json-formatter': 'Paste JSON to indent it, minify it or validate it. A syntax error is reported with a clear message instead of a silent failure. Runs offline.',
 'loan-calculator': 'Enter the amount, the annual rate and the term to see the monthly payment, the total you repay, the interest and the formula behind the figures.',
 'mortgage-calculator': 'Enter the price, deposit, rate and term to see the monthly principal and interest, the deposit share, the total interest and the full cost.',
 'compound-interest-calculator': 'See what a starting amount becomes when interest is added at each period, with the interest earned, the growth rate and a simple-interest comparison.',
 'discount-calculator': 'Enter a price and a discount to see what you pay, what you save and the percentage taken off, or work out the discount from the two prices.',
 'vat-calculator': 'Add tax to a price or take it out again at the rate you type. The net, the tax and the gross are shown separately, with no country rules applied.',
 'date-difference': 'Pick two dates to count the days between them, the weeks and days, and the calendar difference, with the weekday each date falls on.',
 'tip-split-calculator': 'Enter the bill, the tip percentage and how many people are paying to see the tip, the total and the exact amount each person owes.',
 'roi-calculator': 'Enter what you paid and what you got back to see the net profit, the return as a percentage and the multiple of your money, with the working.',
 'savings-goal-calculator': 'Set a target, what you already have, a rate and a time frame to see the monthly deposit needed, the total deposited and the interest earned.',
 'gpa-calculator': 'Add a row per course with its grade points and units to get a unit-weighted GPA, the quality points and the total units counted.',
 'case-converter': 'Convert text to uppercase, lowercase, title case, sentence case, camel case, Pascal case, snake case or kebab case, and copy the result.',
 'character-counter': 'Count characters with and without spaces, plus words, lines, sentences, letters, digits and UTF-8 bytes, and find the longest word.',
 'remove-duplicate-lines': 'Paste a list to delete repeated lines, keeping the first occurrence and the original order. Trimming, ignoring case and dropping blanks are options.',
 'random-number': 'Draw one or more whole numbers between a minimum and a maximum, using the browser cryptographic source, with repeats allowed and no bias.',
 'uuid-generator': 'Generate version 4 UUIDs one at a time or in a batch of up to a hundred, copy them, or download them as a text file, with uppercase optional.',
 'base64': 'Encode text as Base64 or decode Base64 back to text in your browser, with the character counts shown and nothing sent over the network.',
 'url-encoder': 'Percent-encode a string for a URL or query string, or decode one back to plain text, with the number of escapes and the result length shown.',
 'timestamp-converter': 'Turn Unix seconds or milliseconds into a readable date, and a date back into a timestamp, with UTC, your local time and the weekday shown.',
 'color-converter': 'Type a HEX, RGB or HSL colour to see the same colour in the other notations, with the conversion and the swatch drawn in the page.',
 'images-to-pdf': 'Choose two or more pictures, pick A4, US Letter or a page that matches each image, and download one PDF built entirely in your browser.',
 'split-pdf': 'Choose a PDF and either extract the pages you name or save every page as its own file. The document is read locally and never uploaded.',
 'image-converter': 'Convert a picture to JPG, PNG or WebP at a quality you set, then download it. The original size and the new size are both shown.',
 'crop-rotate-image': 'Set a crop rectangle and a rotation, then download the result. The original size, the crop used and the new size appear before you save.',
 'time-zone-converter': 'Pick a moment and a city to see the same instant in several time zones at once, with each offset and whether daylight saving is in force.',
 'typing-speed-test': 'Type the sample text to measure words per minute and accuracy, with the correct and typed character counts and the formula shown.',
 'regex-tester': 'Enter a pattern and some text to see every match with its index and capture groups. Matching uses the browser own regular-expression engine.',
 'hash-generator': 'Paste text to get its SHA-256, SHA-512, SHA-384 or SHA-1 digest, with the input size and the digest length, computed by the Web Crypto API.',
 'lorem-ipsum-generator': 'Generate placeholder paragraphs, sentences or single words in a count you choose, with or without the classic Lorem ipsum opening.',
 'text-diff-checker': 'Paste two versions of a text to see which lines were added, removed or left unchanged, marked with a prefix and a plain explanation.',
 'roman-numerals': 'Convert a number to Roman numerals or Roman numerals back to a number, with the value of each letter added up in the working.',
 'number-base-converter': 'Convert a number between binary, octal, decimal, hexadecimal and base 36 at the same time, from any base you enter.',
 'color-contrast-checker': 'Compare a text colour with a background to get the WCAG contrast ratio and whether it passes AA and AAA at normal and large sizes.',
 'average-calculator': 'Paste a list of numbers to get the count, sum, mean, median, mode and range, with a note when the values do not repeat.',
 'slug-generator': 'Turn a title into a clean URL slug: lowercase, accents removed, symbols stripped and words joined by the separator you choose.',
 'html-entity-encoder': 'Encode HTML special characters as entities or decode entities back to characters, with the text and result lengths shown.',
 'jwt-decoder': 'Paste a JSON Web Token to read its header, payload and signature as formatted JSON. The signature is shown but never verified.',
 'csv-json-converter': 'Paste CSV to get an array of JSON objects, or paste JSON to get CSV with a header row, handling quoted fields and odd line endings.',
 'sort-lines': 'Paste a list to sort it A to Z, Z to A, numerically or by line length, with an option to drop blank lines and a note on lines kept aside.',
 'working-days-calculator': 'Count working days between two dates using your own weekend days and a holiday list, with the weekend, holiday and calendar totals.',
 'fraction-calculator': 'Add, subtract, multiply or divide two fractions to get the result in lowest terms with its decimal value, or simplify a single fraction.',
 'ratio-calculator': 'Simplify a ratio to its lowest whole numbers, or find the missing term in a proportion, with the total parts shown.',
 'stopwatch-timer': 'Start, pause, lap and reset a stopwatch that counts in hundredths of a second, with the elapsed time and a list of your laps.',
 'image-to-base64': 'Choose an image to get a data URI you can paste into CSS or an HTML attribute, with the file size, the type and the encoded length.',
 'salary-to-hourly': 'Turn a yearly salary into hourly, daily, weekly and monthly figures using the hours and weeks you actually work. Arithmetic only.',
 'keyword-density-analyzer': 'Paste text to see how often each word appears and its share of the total, with an option to skip common stop words.',
 'meta-tag-generator': 'Fill in a title, description and URL to get the title tag, meta description, canonical link, Open Graph and Twitter card tags.',
 'robots-txt-generator': 'Build a robots.txt that allows everything, blocks everything, or lists your own allow and disallow paths, with a sitemap line.',
 'xml-sitemap-generator': 'Paste a list of URLs to get a valid sitemap.xml with escaped characters, duplicates removed and the change frequency and priority you pick.',
 'css-box-shadow-generator': 'Set the offset, blur, spread, colour and inset flag to get a ready box-shadow value, with the live preview drawn beside it.',
 'color-palette-generator': 'Type a base colour to get two tints and two shades as HEX and RGB values, mixed in the page so the colour never leaves it.',
 'password-strength-checker': 'Type a password to see its length, character classes, pool size, entropy in bits and a strength band. An estimate, never stored.',
 'favicon-generator': 'Choose one image to draw the six common icon sizes, then download each one as a PNG for a browser tab, an Apple touch icon or an app.',
 'html-to-markdown': 'Paste HTML to convert headings, paragraphs, links, lists, bold and code into Markdown, with the scripts in the input never run.',
 'user-agent-parser': 'Paste a user agent string to read the browser, version, engine, operating system, device type and whether it looks automated.',
 'bmi-calculator': 'Enter a weight and a height to get the body mass index, the band it falls in and a healthy weight range for that height. Arithmetic only.',
 'sql-formatter': 'Paste a SQL statement to put keywords in capitals and each clause on its own line, with quoted strings left exactly as written.',
 'coin-flipper': 'Flip a virtual coin and keep a running count of heads and tails, drawn with the browser crypto API. No sign-up and nothing stored.',
 'dice-roller': 'Roll one die or up to ten, from a d4 to a d20, and see each result and the total. Every roll is independent and made in your browser.',
 'decision-wheel': 'Type one option per line and spin to have one chosen at random. The pick comes from your browser, so the list is never sent anywhere.',
 'bubble-wrap-popper': 'Pop a grid of virtual bubbles for a minute of quiet. Nothing is scored, nothing is counted, and the whole toy runs in the page.',
 'fake-hacker-typer': 'A toy terminal that types made-up commands as you press keys. Every line comes from a list in the page; nothing is executed or read.',
 'compliment-generator': 'Get a kind, specific sentence assembled from three short word lists, and ask for another. All of the words live in the page itself.',
 'shakespearean-insult-generator': 'Build a mild stage-villain insult from archaic word lists. Playful and original, and not a quotation from any Shakespeare play.',
}

def clean(s):
    return re.sub(r'\s+', ' ', s).strip()

def sentences(text):
    parts = re.split(r'(?<=[.!?])\s+', clean(text))
    return [p for p in parts if p]

def first_sentence(text):
    s = sentences(text)
    return s[0] if s else ''

def build_desc(primary, secondary, limit=160, floor=140):
    out = clean(primary)
    for s in sentences(secondary or ''):
        if len(out) + 1 + len(s) <= limit:
            out = out + ' ' + s
        if len(out) >= floor:
            break
    # trim to a sentence end if we overshot
    if len(out) > limit:
        cut = 0
        for m in re.finditer(r'[.!?]', out):
            if m.end() <= limit:
                cut = m.end()
        out = out[:cut] if cut else out[:limit].rsplit(' ', 1)[0] + '.'
    return out

def title_for(page):
    slug = os.path.basename(page)[:-5]
    if page.startswith('en/') and slug in T:
        name = EN['tools'][slug]['title'] if slug in EN['tools'] else slug
        return name + ' \u2014 ' + T[slug]
    if page.startswith('en/') and slug in CAT:
        n = CAT[slug][0]
        return n + ' \u2014 ' + CAT[slug][1]
    return None

def desc_for(page):
    slug = os.path.basename(page)[:-5]
    if page.startswith('en/') and slug in D:
        return D[slug]
    if page.startswith('en/') and slug in EN['tools']:
        t = EN['tools'][slug]
        return build_desc(t.get('desc') or '', t.get('lede') or '')
    return None

def set_meta(path, title, desc):
    s = io.open(path, encoding='utf-8').read()
    if title:
        s2 = re.sub(r'<title>.*?</title>', '<title>%s</title>' % title, s, count=1, flags=re.S)
        if s2 == s and '<title>' not in s:
            print('NO TITLE TAG', path)
        s = s2
        if 'property="og:title"' in s:
            s = re.sub(r'<meta property="og:title" content="[^"]*">',
                       '<meta property="og:title" content="%s">' % title.replace('"', '&quot;'), s, count=1)
        if 'name="twitter:title"' in s:
            s = re.sub(r'<meta name="twitter:title" content="[^"]*">',
                       '<meta name="twitter:title" content="%s">' % title.replace('"', '&quot;'), s, count=1)
    if desc:
        if 'name="description"' in s:
            s = re.sub(r'<meta name="description" content="[^"]*">',
                       '<meta name="description" content="%s">' % desc.replace('"', '&quot;'), s, count=1)
        else:
            s = s.replace('</title>', '</title>\n<meta name="description" content="%s">' % desc.replace('"', '&quot;'), 1)
        if 'property="og:description"' in s:
            s = re.sub(r'<meta property="og:description" content="[^"]*">',
                       '<meta property="og:description" content="%s">' % desc.replace('"', '&quot;'), s, count=1)
        if 'name="twitter:description"' in s:
            s = re.sub(r'<meta name="twitter:description" content="[^"]*">',
                       '<meta name="twitter:description" content="%s">' % desc.replace('"', '&quot;'), s, count=1)
    io.open(path, 'w', encoding='utf-8', newline='\n').write(s)

def main(apply=False):
    pages = sorted([p for p in os.listdir('en') if p.endswith('.html')])
    pages = ['en/' + p for p in pages]
    rows = []
    bad = []
    for p in pages:
        title = title_for(p)
        desc = desc_for(p)
        rows.append((p, title, desc))
        if not title or not desc:
            bad.append((p, 'no copy', ''))
            continue
        if not (48 <= len(title) <= 62):
            bad.append((p, 'title %d' % len(title), title))
        if not (138 <= len(desc) <= 162):
            bad.append((p, 'desc %d' % len(desc), desc))
    for r in rows:
        print(r[0], '|', (r[1] or '-'), '|', len(r[1] or ''), '|', len(r[2] or ''))
    print('\n--- OUT OF RANGE ---')
    for b in bad:
        print(b)
    if apply:
        for p, title, desc in rows:
            if title and desc:
                set_meta(p, title, desc)
        print('\napplied')

if __name__ == '__main__':
    main('--apply' in sys.argv)
