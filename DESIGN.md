# Stacklane — design specification

Phase 4 of the redesign. This file is the source of truth for layout, type,
spacing, components and the (unused) ad-slot structure. Tool logic, tool text
meaning, i18n keys, URLs, the CSP and the `dir="rtl"` rules are out of scope and
must not change.

## Mood

Deep blue accent on neutral greys. Rounded cards, generous but disciplined
spacing, a calm reading rhythm. A visitor should understand any page in about
five seconds, and the tool itself must be the clearest element on a tool page.
No dark mode, no ad placeholders, no external fonts, no icon libraries — every
icon is inline SVG, the font stack is the system stack.

## Tokens (CSS variables in `assets/style.css`)

| Token | Value | Use |
|---|---|---|
| `--blue-700` | `#1b3fa0` | pressed states |
| `--blue-600` | `#1d4ed8` | the one accent: links, primary buttons, focus |
| `--blue-50` | `#eef3ff` | accent tint for icon tiles and info |
| `--ink` | `#111827` | headings and body |
| `--ink-2` | `#4b5563` | secondary text (5.9:1 on white) |
| `--ink-3` | `#6b7280` | meta text (4.8:1 on white) |
| `--line` | `#e5e7eb` | hairlines and card borders |
| `--surface` | `#ffffff` | cards |
| `--band` | `#f7f9fc` | grey section bands |
| `--good` | `#0f7b52` | success only |
| `--warn` | `#8a5a00` | warning only |
| `--danger` | `#b3261e` | error only |

Radius: `--r-sm 8px`, `--r-md 12px`, `--r-lg 16px`, `--r-pill 999px`.
Shadow: `--shadow-1` (card resting), `--shadow-2` (raised panel).

**Spacing scale — these six values only:** `4, 8, 12, 16, 24, 32, 48, 64`.
Section padding: 48px on phones, 64px on desktop. Card gap: 16px.

**Type scale:** 14px (meta/labels), 16px (body, line height 1.5), 20px (card
titles, section h3), 32–40px (page h1, `clamp(2rem, 4vw, 2.5rem)`), headings
line height 1.2. Text measure 60–75 characters. System font stack only.

## Container

One container: `width: min(1120px, 100%); margin-inline: auto;` with
`padding-inline: 16px` on phones and `24px` from 768px up. Every section —
including grey bands — puts its content inside this container; bands paint
edge to edge, content never does.

## Home page

1. **Header** — logo (inline SVG mark + wordmark) left; on desktop a compact
   search field and the main links right. On phones the links collapse into a
   `<details><summary>Menu</summary>` disclosure, no JavaScript.
2. **Hero** — centred. Eyebrow, one headline, one line of text, a large centred
   search box, a row of popular-tool chips.
3. **Category cards** — 4 per row on desktop, 2 on phones. Each card: inline
   SVG icon (distinct per category), name, one line, tool count. The Business
   category is not shown on the home page (it keeps its category page and is
   linked from the footer and the menu).
4. **Popular tools** — 8 cards.
5. **Category sections** — one per category except Business, each with up to 6
   tools as compact rows (icon + title) and a "View all N tools" link to the
   category page. A tool appears once on the page, except inside Popular.
6. **Footer** — 3 columns (about, categories, legal), 8px between links,
   left-aligned copyright.

Search filters every tool, and the count shown matches the catalogue: **80
cards (73 browser tools + 7 Business pages)**. The number displayed is 80.

## Layout rules for every page

- All card lists are CSS grid: `repeat(auto-fill, minmax(260px, 1fr))`, 16px
  gap, equal height per row. No per-category columns, no masonry.
- Card anatomy: icon, title, description clamped to 2 lines. The whole card is
  the link, minimum 44px tall, visible focus ring. Inside a category section
  the category label is not repeated on the card.
- Footer: three columns, 8px link spacing, left-aligned copyright.
- No page-specific layout CSS: everything comes from the shared template and
  the tokens in `assets/style.css`.

## Tool page layout

Order: breadcrumb → H1 → one-line description → tool card above the fold →
slot A → How it works → Worked example → FAQ → slot B → related tools.

From 1024px up the page is a two-column grid: the content column plus a 300px
sidebar holding the related-tools list and slot C. On phones it is one column
and the sidebar stacks after the FAQ. The tool card is the visual centre: white
surface, soft border, 24px padding, result area with a fixed minimum height.
Tool IDs, labels and behaviour are untouched.

## Ad slots — structure only, no ads

Empty containers, `hidden`, class `ad-slot`, one `data-slot` each. Tool pages
only. Never above the tool card, never inside it, never between an input and
its result, never next to a button.

| Slot | Position |
|---|---|
| `A` | below the tool card, at least 32px from any control |
| `B` | after the FAQ, before related tools |
| `C` | desktop sidebar, below the related-tools list |

Reserved heights so a loaded ad cannot shift the layout: in-content slots
280px, sidebar slot 250px. One documented class turns slots on:

```css
/* Enable slots for a future ads batch: add .ads-on to <body>. */
.ads-on .ad-slot[data-slot="A"],
.ads-on .ad-slot[data-slot="B"] { min-height: 280px; }
.ads-on .ad-slot[data-slot="C"] { min-height: 250px; }
```

While `hidden`, a slot takes no space and shows no label, text or border. There
is no ad script, no network name, no cookie, no tracking and no placeholder text
in this branch, and the CSP is unchanged.

**The ads batch must re-check the network's current size and placement rules** —
reserved heights and positions here are structural assumptions, not approved
ad placements.

## What to keep from the old stylesheet

The index/announcement/detail type, the inline SVG icons, the tick and alert
components, the tables-to-cards mobile rule for invoices, the `.tk-*` ToolKit
styles, the RTL overrides and the print rules. The palette is retuned to the
tokens above; the layout primitives are replaced.
