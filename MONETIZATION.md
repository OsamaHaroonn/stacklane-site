# Monetization: the AdSense path, and what it needs

Nothing in this release serves advertising. `ads.txt` is a placeholder, no
publisher ID exists anywhere, the CSP allows no ad domains, and every reserved
ad slot is hidden and 0 px tall. No claim of approval or eligibility is made
here; AdSense eligibility is decided by Google after review.

## What is already in place (verified in `TEST-REPORT.md`)

- 96 public pages with unique titles, descriptions and canonical URLs.
- 73 working tools with purpose-written copy, and 7 business pages with
  explanations, assumptions and disclaimers.
- Privacy policy, terms, About and Contact pages, all linked from the header
  and footer.
- Clear navigation: category pages, an all-tools index, search, breadcrumbs.
- No fake reviews, ratings, awards, statistics or testimonials anywhere.
- Accessible, mobile-friendly layout: no horizontal overflow at 375, 390,
  768, 1366 or 1920; 44 px controls; one `<h1>` per page.
- Fast static pages with no framework and no third-party requests.

An AdSense review also looks at original content and traffic. Traffic only
exists after launch; this repository cannot supply it.

## Steps after the site is live and has real content

1. **Create the mailbox** `contact@stacklanetools.com` and test it. AdSense
   applications are reviewed by a human and a non-working contact address is a
   rejection risk.
2. **Confirm the live site**: domain over HTTPS, `www` redirecting to the apex,
   404 working, sitemap submitted in Google Search Console, robots.txt
   reachable. Submit the sitemap and wait for pages to be indexed; applying
   with zero indexed pages is usually refused.
3. **Apply** at <https://adsense.google.com> with the same Google account you
   want to own the payments. Add `stacklanetools.com` as a site.
4. **Verify ownership** using the method AdSense offers — either the DNS TXT
   record in Cloudflare DNS, or the AdSense script on the site (step 6 changes
   the CSP, which that script needs).
5. **Wait for review.** It can take days to weeks and can be refused for
   “low value content”. Do not add invented content to speed it up.
6. **When approved**, AdSense issues a publisher ID of the form
   `ca-pub-################` (16 digits). Do not invent one; do not copy one
   from another site.
7. **Add `ads.txt`** at the domain root (Cloudflare serves this repository's
   `ads.txt`). Replace the commented placeholder with the exact line AdSense
   shows in **Sites → ads.txt**:

   ```
   google.com, pub-################, DIRECT, f08c47fec0942fa0
   ```

   The `pub-` value is the 16-digit ID; the last value is Google's
   certification authority ID, which AdSense prints for you. Keep the exact
   format from the AdSense page rather than this example.
8. **Update the CSP** in both places — `_headers` and the
   `<meta http-equiv="Content-Security-Policy">` on every page — to allow the
   domains AdSense tells you to use. A typical AdSense integration needs, at
   minimum:

   - `script-src`: `https://pagead2.googlesyndication.com`
     `https://tpc.googlesyndication.com` `https://www.googletagservices.com`
     `https://adservice.google.com` `https://fundingchoicesmessages.google.com`
   - `img-src`: `https://pagead2.googlesyndication.com`
     `https://googleads.g.doubleclick.net` `https://www.google.com`
   - `frame-src`: `https://googleads.g.doubleclick.net`
     `https://tpc.googlesyndication.com` `https://www.google.com`
   - `connect-src`: the same ad and consent origins

   The meta tag matters: it is what protects the site on any host that cannot
   send headers. Removing `'unsafe-inline'` from `style-src` may also be
   required by the network; the site uses inline `style=""` attributes in a
   few places, so test after tightening.
9. **Rewrite the privacy policy before any ad loads.** It must name Google and
   its vendors, explain that third-party cookies/identifiers may be used to
   serve and measure ads, link to Google's ad settings and the
   `aboutads.info` opt-out, and describe consent for visitors in the EEA, UK
   and Switzerland. `privacy.html` currently promises no cookies and no
   third-party scripts; leaving that sentence in place while serving ads would
   be false.
10. **Add a consent flow** if you serve visitors in the EEA/UK: a
    Google-certified CMP must collect consent before personalized ads or
    cookies. This is a policy requirement, not a code preference.
11. **Switch the slots on.** Add `data-ads="on"` to the `<html>` element of the
    pages that should carry ads. `assets/style.css` then reserves the real
    heights: 90 px for slots A and B on desktop (728×90), 100 px (320×100)
    below 720 px, and 250 px (300×250) for slot C. `assets/chrome.js` unhides
    the slots. Insert the network's `<ins>` markup inside each `.ad-slot`.
12. **Test** on mobile and desktop, with and without consent, and confirm no
    layout shift appears (the reserved heights exist to prevent it). Re-run
    the responsive sweep at 375, 390, 768, 1366 and 1920 with ads on.
13. **Do not click your own ads**, do not ask others to, and do not place ads
    on pages with no content. Both are account-termination offences.

## What not to do

- Do not add `ads.txt` with a guessed publisher ID.
- Do not add fake reviews, ratings or “as seen in” logos to look established.
- Do not add an analytics or ad script without changing the privacy policy and
  the CSP in the same commit.
- Do not enable ads before the policy and consent work above is complete.
