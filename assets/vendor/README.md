# Vendored libraries

Pinned third-party files, served from this site's own origin. There is no CDN
and no third-party request at runtime — the strict CSP (`script-src 'self'`)
holds on every page.

| File | Library | Version | Licence | Source |
|---|---|---|---|---|
| `pdf-lib.min.js` | pdf-lib (UMD browser build) | **1.17.1** | MIT | `https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js` |
| `qrcode.js` | qrcode-generator by Kazuhiko Arase | **1.4.4** | MIT | `https://unpkg.com/qrcode-generator@1.4.4/qrcode.js` |

Both files were verified byte-for-byte against those exact URLs (sha256):

```
0f9a5cad07941f0826586c94e089d89b918c46e5c17cf2d5a3c6f666e3bc694f  pdf-lib.min.js
18ae399f81182bc9de916e9c77b195df20cc58d6f2d55a62b085a299f1bf1780  qrcode.js
```

Used by:

- `assets/tools/merge-pdf.js` → `window.PDFLib` (loaded on `en/merge-pdf.html`, `ar/merge-pdf.html`)
- `assets/tools/qr-code-generator.js` → `window.qrcode` (loaded on `en/qr-code-generator.html`, `ar/qr-code-generator.html`)

Licence texts: pdf-lib is MIT; the bundled file also contains Apache-2.0
licensed Microsoft/protobuf helper code, as distributed upstream. The
qrcode-generator header (MIT, © 2009 Kazuhiko Arase) is kept at the top of
its file.

**No other library may be added without asking the site owner first.**
