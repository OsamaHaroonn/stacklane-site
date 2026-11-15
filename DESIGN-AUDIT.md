# Design audit — tool, category and business pages

Read-only review. No edits were made for this file. Server: `python3` no-store on
**http://127.0.0.1:8830** (the browser caches `style.css` hard per origin, so a fresh
origin was used). `prefers-reduced-motion: reduce` is **ON** in this browser.

Eight representative pages, each at `innerWidth` 375 and 1280:

| # | Page | Type | 375: docH / panel | 1280: docH / panel |
|---|---|---|---|---|
| 1 | loan-calculator | calculator | 3452 / 324 | 2090 / 724 |
| 2 | word-counter | text | 3260 / 324 | 2200 / 724 |
| 3 | merge-pdf | file (PDF) | 2774 / 324 | 2044 / 724 |
| 4 | image-compressor | file (image) | 3277 / 324 | 2353 / 724 |
| 5 | json-formatter | developer | 3511 / 324 | 2290 / 724 |
| 6 | password-generator | generator | 3764 / 324 | 2469 / 724 |
| 7 | unit-converter | converter | 3484 / 324 | 2212 / 724 |
| 8 | coin-flipper | fun | 3367 / 324 | 2254 / 724 |

No horizontal overflow on any of the eight at either width.

## What is weak

**1. The result area is invisible furniture.** `.tk-out` is transparent, borderless and
`border-radius: 0` on every tool except `loan-calculator`. Concretely measured:
`background: rgba(0,0,0,0)`, `border-top-width: 0px`, `border-radius: 0px` on
word-counter, unit-converter and password-generator. A result row looks exactly like a
paragraph of body text, so the answer to the user's question carries the same weight as
the privacy note underneath it.

**2. The hierarchy is flat everywhere.** Every result value renders at `15px`
(coin-flipper `.tk-row-value`, password-generator, unit-converter). There is no strong
row on 24 of the 59 tools that use `TK.rows` — only 35 of 59 mark a first row `is-strong`.
Where a strong row does exist it is styled per-tool, so the same concept looks different
on every page.

**3. File tools do not look like drop zones.** On merge-pdf and image-compressor the
picker container `.tk-file` computes to `background: rgba(0,0,0,0)`, `border-style: none`,
`box-shadow: none`, height 100px. What the user actually sees is a bare native
`<input type="file">` (44px, solid 1px `rgb(209,213,219)`) plus a white secondary button.
It reads as "a form row with a button", not "drop a file here". Nothing marks hover,
nothing marks "a file is chosen", nothing marks "done".

**4. Buttons have no consistent hierarchy.** On json-formatter the five buttons compute to
`Format = rgb(29,78,216)`, `Minify = rgb(29,78,216)`, `Validate = rgb(255,255,255)`,
`Copy = rgb(247,249,252)`, `Clear = rgb(255,255,255)`. Two equally primary actions sit
adjacent, and a third button uses a third, accidental grey. On password-generator the pair
is primary + white secondary, which is correct — so the pattern exists but is not applied
consistently.

**5. Field labels are inert.** "Category", "Value", "From", "To" render as plain 15px
text with the same weight as body copy. Nothing distinguishes a label from a hint, and
the only tool that treats labels as instrument markings is loan-calculator.

**6. Textareas are wide but featureless.** word-counter: 274 × 228 at 375, 674 × 228 at
1280, `border-radius: 12px`, mono, a shadow that reads as a plain border. The surface
does not change when focused beyond the default ring, and there is no visual separation
between "where I type" and "what came out".

**7. The panel itself is one flat grey slab.** `.tool-panel` at 1280 is 724px wide and
494px tall with no top light, no depth and no internal rhythm: on unit-converter the
"Swap units" button lands in the *label* row next to "From"/"To" and vertically centres
against them, so a 44px button floats beside two 15px words while the two selects it
belongs to sit underneath at half width.

**8. The empty state says nothing.** Before any input, eight of eight pages show a bare
panel with no result area at all (`.tk-out` has `rows: 0` and `hidden: true`). The
sections below — how it works, worked example, FAQ — are visually identical in weight to
the tool, so the eye has no anchor.

**9. Repetition above the fold.** On unit-converter the eyebrow "CONVERTERS" appears in
the breadcrumb, again as an eyebrow above the H1, and again inside every related-tool
card ("CONVERTERS / Time zone converter"), where it is noise: the card is already inside a
related-tools list on a converter page. Related-card descriptions are also clamped mid
sentence ("using your browser's ow…", "into a Roman numeral and back…").

**10. Page furniture is uniform in weight.** how-it-works, the worked example and the FAQ
are three near-identical blocks of body text. The worked example does carry a blue tint
(`rgb(238,243,255)`) but has no border or label, so it reads as a quote. FAQ rows are
50px each with the browser's default marker; there is no chevron and no open-state
treatment.

## What is already right (keep it)

- The category-coloured icon tile and the 2-line clamped card description on category
  pages, and the "Runs locally in your browser" badge.
- The 44px minimum everywhere: every button, input, select and `.tk-check` measured
  44px; `.tk-check` label 44px; back link 44px.
- Type floor: no text under 14px was found on any audited page at either width.
- Three hidden ad slots measure exactly 0px on all eight pages.
- The tool panel is above the fold at 375 and the aside is 300px at 1280.

## Caveat on screenshots

This browser reports `devicePixelRatio` 0.9 and applies a 1/0.9 zoom, so a requested
viewport of 337 gives `innerWidth` 375 and 1152 gives 1280, and the capture is cropped
about 10% on the right. Text that appears cut in a screenshot is a capture crop, not page
overflow: `scrollWidth > innerWidth` was `false` on all sixteen measurements.
