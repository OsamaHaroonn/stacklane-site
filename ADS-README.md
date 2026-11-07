# Ad slots — structure only, switched off

Every ad container on this site is **empty and hidden**. There is no ad
network, no script, no cookie, no tracker and no network request anywhere in
the repository. This file documents the structure that is ready, and what has
to be decided before anything is switched on.

## The one switch

The site has exactly one switch:

```html
<html lang="en" data-ads="on">
```

Add `data-ads="on"` to the `<html>` element of a page and every slot on that
page turns on at once. Nothing else changes — no per-page edits, no build step,
no second flag.

When the attribute is absent (the committed state) every slot keeps its
`hidden` attribute, measures **0px** and paints nothing: no border, no
background, no label, no text. There is no visual trace of an empty slot.

Two pieces of code make the switch work, and both are already in place:

* `assets/style.css` — `.ad-slot` and `html[data-ads="on"] .ad-slot …`. The
  reserved heights live here, in CSS, so they are set before anything loads.
* `assets/chrome.js` — five lines near the top of the file. When the switch is
  on, it removes `hidden` from the slots so assistive technology is not told
  to ignore a box that is now visible.

## Where the slots are

| Slot | Position | Reserved height |
|---|---|---|
| `A` | Below the tool card, at least 32px from every button and input | 280px desktop, 100px below 720px |
| `B` | After the FAQ, before "Related tools" | 280px desktop, 100px below 720px |
| `C` | Desktop sidebar, below the related-tools list | 250px |

Only the 73 tool pages and the seven Business tool pages carry slots. The home
page, the nine category pages, privacy, terms and 404 carry none. No slot sits
above or inside the tool card, and none is placed between an input and its
result.

The reserved heights are the layout contract: because they are declared in CSS,
an ad that arrives late **cannot** move the page. A future ads batch must
re-check the network's current creative sizes and placement rules against these
numbers, and update both if they differ.

## Before any ad network is added

Nothing may be inserted until all of the following are decided by the site
owner. None of this is installed, and none of it should be added without an
explicit decision:

1. **A network and a publisher ID.** Then `ads.txt` (currently a commented
   placeholder) must be filled in exactly as that network specifies.
2. **A privacy policy update** describing what the ad code collects. The
   current `privacy.html` states that the site sets no cookies and makes no
   third-party requests. That sentence becomes untrue the moment ad code is
   added, so it must change in the same commit.
3. **About and Contact pages.** Several networks require them before approving
   a site; this site has neither yet.
4. **Consent** for visitors in regions that require it (for example the EEA and
   the UK). This is a legal decision, not a styling one.
5. **The CSP.** Every page carries a `Content-Security-Policy` that allows
   scripts from `'self'` only. Any ad script needs `script-src` and
   `connect-src` entries for the network's domains, and that is a deliberate,
   reviewed change to 115 pages — not a side effect.
6. **Enough original content on each page.** The pages are written for that
   purpose already; re-check after any template change.
7. **A re-verified layout pass.** Run the zero-shift check again with the
   switch on: `en/loan-calculator.html` at innerWidth 376 must keep the same
   body text position it has with ads off, because the slots reserve their
   space in advance.
