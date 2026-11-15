# Ads Plan - Stacklane Tools

## Current Status
- **Ads OFF**: data-ads attribute off, ad slots at 0px (hidden)
- **ads.txt**: Placeholder with no publisher ID (`PUB-0000000000000000`)
- **No ads served**: Repository does not serve any ads

## Required Changes to Enable Ads

### 1. CSP Additions
Add `mediaprovider-src 'self'` and `blob:` to the CSP in `_headers`:
```
script-src 'self' mediaprovider-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob;
```
(Exact CSP line depends on the ad network - Google AdSense typically requires `masternet-googleads-partner.com` etc.)

### 2. privacy.html Rewrite
Update `privacy.html` to include:
- Description of ad-related data collection
- Consent mechanism for EEA/UK/Switzerland
- Information about cookies used for ad targeting
- Opt-out links for Google Ads Settings

### 3. terms.html Rewrite
Update `terms.html` to include:
- Ad service terms and conditions
- Publisher's ad policies
- User consent requirements

### 4. Consent Mechanism for EEA/UK/Switzerland
Implement a consent banner/overlay that:
- Appears for visitors from EEA, UK, and Switzerland
- Has "Accept" and "Reject" buttons
- Stores consent preference in localStorage
- Defaults to "reject" if no consent given
- Integrates with the existing privacy framework

### 5. Slot Sizes
Define ad slot sizes in a configuration that matches the 0px hidden state:
```html
<!-- Ad slots remain display:none until ads are enabled -->
<div class="ads" data-ads="true" style="display:none">
  <!-- Ad slots would be injected here by the ad framework -->
</div>
```

### 6. ads.txt Line
Replace the placeholder with a real line:
```
google.com, PUB-1234567890ABCDEF, DIRECT, f08c47fec0942fa0
```
(Replace `PUB-1234567890ABCDEF` with the actual publisher ID from the ad network)

### 7. Layout-Shift Check
Ensure ad slots have deterministic dimensions when revealed:
- Set explicit width/height on ad container elements
- Reserve space with placeholder image or color
- Prevent CLS when ads load

## Verification Checklist Before Enabling Ads
- [ ] CSP updated with ad network provider sources
- [ ] privacy.html updated with ad disclosure
- [ ] terms.html updated with ad terms
- [ ] Consent mechanism implemented and tested
- [ ] ads.txt has real publisher ID
- [ ] Ad slot sizes have explicit dimensions
- [ ] CLS remains 0.0000 with ads enabled
- [ ] No third-party requests outside ad network domain
- [ ] All 90+ English pages still pass QA sweep

## Cannot Confirm
- Exact CSP changes needed (depends on ad network chosen)
- Exact consent mechanism implementation (requires UI/UX design)
- Exact ad slot dimensions and network integration

## Next Steps
1. Choose an ad network (Google AdSense, Media.net, etc.)
2. Create an account and obtain publisher ID
3. Update `_headers` CSP with network-specific sources
4. Rewrite `privacy.html` and `terms.html`
5. Implement consent mechanism
6. Update `ads.txt` with real publisher ID
7. Test ad loading and CLS
8. Deploy and verify
