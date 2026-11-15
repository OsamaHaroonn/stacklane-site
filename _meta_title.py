import io, os, re

TITLES = {
 'bmi-calculator': 'BMI calculator \u2014 body mass index and what the band means',
 'bubble-wrap-popper': 'Bubble wrap popper \u2014 a grid of bubbles to pop, and nothing else',
 'character-counter': 'Character counter \u2014 characters with and without spaces, plus bytes',
 'color-contrast-checker': 'Color contrast checker \u2014 WCAG contrast ratio, AA and AAA',
 'color-converter': 'Color converter \u2014 HEX to RGB and HSL, with the working',
 'color-palette-generator': 'Color palette generator \u2014 two tints and two shades from one colour',
 'compound-interest-calculator': 'Compound interest calculator \u2014 growth and interest by period',
 'crop-rotate-image': 'Crop and rotate image \u2014 set a rectangle, then rotate the image',
 'css-box-shadow-generator': 'CSS box shadow generator \u2014 box-shadow value, live preview',
 'csv-json-converter': 'CSV to JSON converter \u2014 and JSON back to CSV, with a header row',
 'decision-wheel': 'Decision wheel \u2014 pick one of your options at random',
 'developer': 'Developer tools \u2014 21 tools for data, markup and meta tags',
 'dice-roller': 'Dice roller \u2014 roll one or ten dice, from d4 to d20',
 'fake-hacker-typer': 'Fake hacker typer \u2014 a toy terminal that types when you press keys',
 'gpa-calculator': 'GPA calculator \u2014 average weighted by your course units',
 'html-entity-encoder': 'HTML entity encoder \u2014 escape and unescape special characters',
 'html-to-markdown': 'HTML to Markdown \u2014 headings, links, lists and bold, converted',
 'image-converter': 'Image converter \u2014 PNG, JPG and WebP at a quality you choose',
 'image-to-base64': 'Image to Base64 \u2014 a picture as a data URI for CSS or HTML',
 'jwt-decoder': 'JWT decoder \u2014 read a token header and payload, no check',
 'keyword-density-analyzer': 'Keyword density \u2014 word frequency and each word\u2019s share',
 'late-payment-calculator': 'Late payment calculator \u2014 what an overdue invoice costs per day',
 'lorem-ipsum-generator': 'Lorem ipsum \u2014 placeholder paragraphs, sentences or words',
 'loss-calculator': 'Leak calculator \u2014 what missed work costs you each year',
 'number-base-converter': 'Number base converter \u2014 binary, octal, decimal, hex and base 36',
 'password-strength-checker': 'Password strength checker \u2014 entropy in bits and a strength band',
 'robots-txt-generator': 'Robots.txt generator \u2014 allow, block or list your own paths',
 'roman-numerals': 'Roman numerals \u2014 numbers to Roman numerals and back again',
 'salary-to-hourly': 'Salary to hourly \u2014 annual pay as an hourly and weekly rate',
 'shakespearean-insult-generator': 'Shakespearean insult generator \u2014 a mild stage-villain insult',
 'slug-generator': 'Slug generator \u2014 a clean URL slug from any title',
 'sort-lines': 'Sort lines \u2014 A to Z, numeric or by line length',
 'split-pdf': 'Split PDF \u2014 extract pages or save every page separately',
 'stopwatch-timer': 'Stopwatch and timer \u2014 start, pause, lap and reset a stopwatch',
 'text-diff-checker': 'Text diff checker \u2014 line-by-line differences between two texts',
 'time-zone-converter': 'Time zone converter \u2014 one moment seen in several cities at once',
 'tip-split-calculator': 'Tip and split \u2014 tip, total and what each person pays',
 'working-days-calculator': 'Working days \u2014 weekdays between dates, minus holidays',
}

DESCS = {
 'audit': 'Fifteen checks across speed, trust, conversion and findability, each scored, with a ranked list of the fixes that are worth doing first. Runs here.',
 'average-calculator': 'Paste a list of numbers to get the count, the sum, the mean, the median, the mode and the range, with a note when no value repeats. Nothing is uploaded.',
 'base64': 'Encode text as Base64 or decode Base64 back to text in your browser, with the character counts shown and nothing sent over the network. Nothing is uploaded.',
 'late-payment-calculator': 'See what an overdue invoice costs you each day, and what a late fee and interest add up to over the weeks that a payment is outstanding. Runs in your browser.',
 'ratio-calculator': 'Simplify a ratio to its lowest whole numbers, or find the missing term in a proportion, with the total number of parts shown underneath. Nothing is uploaded.',
 'roman-numerals': 'Convert a number to Roman numerals or Roman numerals back to a number, with the value of each letter added up and shown in the working. Nothing is uploaded.',
 'slug-generator': 'Turn a title into a clean URL slug: lowercase, accents removed, symbols stripped and the words joined by whichever separator you choose. Nothing is uploaded.',
 'tip-split-calculator': 'Enter the bill, the tip percentage and how many people are paying to see the tip, the total and the exact amount that each person owes. Plain numbers only.',
}

def set_title(path, title):
    s = io.open(path, encoding='utf-8').read()
    s = re.sub(r'<title>.*?</title>', '<title>%s</title>' % title, s, count=1, flags=re.S)
    s = re.sub(r'<meta property="og:title" content="[^"]*">',
               '<meta property="og:title" content="%s">' % title.replace('"', '&quot;'), s, count=1)
    s = re.sub(r'<meta name="twitter:title" content="[^"]*">',
               '<meta name="twitter:title" content="%s">' % title.replace('"', '&quot;'), s, count=1)
    io.open(path, 'w', encoding='utf-8', newline='\n').write(s)

def set_desc(path, desc):
    s = io.open(path, encoding='utf-8').read()
    s = re.sub(r'<meta name="description" content="[^"]*">',
               '<meta name="description" content="%s">' % desc.replace('"', '&quot;'), s, count=1)
    s = re.sub(r'<meta property="og:description" content="[^"]*">',
               '<meta property="og:description" content="%s">' % desc.replace('"', '&quot;'), s, count=1)
    s = re.sub(r'<meta name="twitter:description" content="[^"]*">',
               '<meta name="twitter:description" content="%s">' % desc.replace('"', '&quot;'), s, count=1)
    io.open(path, 'w', encoding='utf-8', newline='\n').write(s)

bad = []
for slug, t in TITLES.items():
    p = 'en/%s.html' % slug
    if not (50 <= len(t) <= 62):
        bad.append((p, 'title', len(t), t))
    set_title(p, t)
for slug, d in DESCS.items():
    p = 'en/%s.html' % slug
    if not (138 <= len(d) <= 162):
        bad.append((p, 'desc', len(d), d))
    set_desc(p, d)
print('bad:', len(bad))
for b in bad:
    print(b)
