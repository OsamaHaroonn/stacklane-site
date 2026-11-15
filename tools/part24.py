import io, os, re

SRC = r"C:\Users\Osama Haroon\Documents\stacklane\source"
T = os.environ["TMPW"]

# ---------------- PART 2: licence file ----------------
apache = io.open(os.path.join(T, "apache2.txt"), encoding="utf-8").read().strip("\n")

MIT = """MIT License

Copyright (c) 2019 Andrew Dillon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE."""

HEADER = """Third-party licences for the files in assets/vendor/
====================================================

This site serves two pinned third-party scripts from its own origin (no CDN,
no third-party request at runtime). One of them contains code from a second
project, so two licences apply to that single file. The texts are reproduced
in full below.

--------------------------------------------------------------------------------
1. pdf-lib 1.17.1 - assets/vendor/pdf-lib.min.js
--------------------------------------------------------------------------------
Licence   : MIT
Copyright : (c) 2019 Andrew Dillon
Upstream  : https://github.com/Hopding/pdf-lib
Source    : https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js
Upstream licence file: https://unpkg.com/pdf-lib@1.17.1/LICENSE.md
Declared in package.json: "license": "MIT"

The minified UMD build does not repeat the MIT notice in its own header, so
this file is the distributed copyright and permission notice for pdf-lib.

--------------------------------------------------------------------------------
2. tslib (Apache-2.0 release line) - bundled inside assets/vendor/pdf-lib.min.js
--------------------------------------------------------------------------------
Licence   : Apache License, Version 2.0
Copyright : (c) Microsoft Corporation. All rights reserved.
Upstream  : https://github.com/microsoft/tslib
Evidence  : pdf-lib 1.17.1 declares the dependency "tslib": "^1.11.1", and the
            banner at the top of pdf-lib.min.js (lines 2-14) is tslib's
            Apache-2.0 header:
              "Copyright (c) Microsoft Corporation. All rights reserved.
               Licensed under the Apache License, Version 2.0 ..."
            tslib 1.11.1 publishes the Apache License 2.0 as its LICENSE.txt
            (https://unpkg.com/tslib@1.11.1/LICENSE.txt).

LIMITATION: the exact tslib patch version compiled into the bundle cannot be
read out of the minified output, so the precise 1.x version is not recorded
here. The licence is not in doubt: the banner in the file states Apache-2.0,
and that is the licence reproduced below. (Later tslib 1.x releases moved to
0BSD; that text does not apply to this banner.)

--------------------------------------------------------------------------------
3. qrcode-generator 1.4.4 - assets/vendor/qrcode.js
--------------------------------------------------------------------------------
Licence   : MIT
Copyright : (c) 2009 Kazuhiko Arase
Upstream  : https://github.com/kazuhikoarase/qrcode-generator
Source    : https://unpkg.com/qrcode-generator@1.4.4/qrcode.js
Its MIT notice is kept at the top of the file itself (lines 1-16). The
published package ships no separate licence file (unpkg: 8 files, no LICENSE).

--------------------------------------------------------------------------------
4. Components with no notice carried in the bundle
--------------------------------------------------------------------------------
pdf-lib 1.17.1 also depends on @pdf-lib/standard-fonts ^1.0.0,
@pdf-lib/upng ^1.0.1 and pako ^1.0.11 (its package.json). Their notices are
not reproduced in the minified bundle. Their own licence files are the
authoritative terms for those components; they were not re-verified for this
notice and are not restated here rather than guessed at.

--------------------------------------------------------------------------------
NOTICE
--------------------------------------------------------------------------------
Neither pdf-lib 1.17.1 nor tslib 1.11.1 publishes a NOTICE file (NOTICE,
NOTICE.txt and NOTICE.md all return HTTP 404 on unpkg), so no separate NOTICE
attribution text exists to reproduce. The attribution that does apply is the
copyright line in each licence text below.

================================================================================
MIT License - pdf-lib 1.17.1
================================================================================

"""

MID = """

================================================================================
Apache License 2.0 - tslib (Microsoft Corporation)
================================================================================
Text below is the canonical Apache License 2.0 as published at
https://www.apache.org/licenses/LICENSE-2.0.txt . tslib 1.11.1's own
LICENSE.txt is the same licence text.

"""

lic = HEADER + MIT + MID + apache + "\n"
out = os.path.join(SRC, "assets", "vendor", "LICENSE.txt")
io.open(out, "w", encoding="utf-8", newline="\r\n").write(lic)
print("WROTE", out, len(lic), "chars")

# ---------------- README correction ----------------
rd = os.path.join(SRC, "assets", "vendor", "README.md")
t = io.open(rd, encoding="utf-8").read()
old_row = "| `qrcode.js` | qrcode-generator by Kazuhiko Arase | **1.4.4** | MIT | `https://unpkg.com/qrcode-generator@1.4.4/qrcode.js` |"
new_row = old_row + "\n| `LICENSE.txt` | licence notices for the two files above | - | MIT + Apache-2.0 | written for this site, texts copied from upstream |"
assert old_row in t, "README table row anchor missing"
t = t.replace(old_row, new_row, 1)

old_par = ("Licence texts: pdf-lib is MIT; the bundled file also contains Apache-2.0\n"
           "licensed Microsoft/protobuf helper code, as distributed upstream. The\n"
           "qrcode-generator header (MIT, \u00a9 2009 Kazuhiko Arase) is kept at the top of\n"
           "its file.")
new_par = ("Licence texts live in `LICENSE.txt` in this directory, because Markdown is\n"
           "excluded from the published bundle and the notices must ship with the files\n"
           "they cover:\n"
           "\n"
           "- **pdf-lib 1.17.1** - MIT, (c) 2019 Andrew Dillon. The minified build carries\n"
           "  no MIT header of its own, so `LICENSE.txt` is its notice.\n"
           "- **tslib** - bundled inside `pdf-lib.min.js` (pdf-lib declares\n"
           "  `\"tslib\": \"^1.11.1\"`). Its Apache-2.0 banner is lines 2-14 of the file;\n"
           "  `LICENSE.txt` reproduces the full Apache License 2.0 text. The exact tslib\n"
           "  patch version cannot be read from the minified output.\n"
           "- **qrcode-generator 1.4.4** - MIT, (c) 2009 Kazuhiko Arase; its notice is kept\n"
           "  at the top of `qrcode.js` itself.\n"
           "\n"
           "An earlier version of this file described the Apache block as \"Microsoft/\n"
           "protobuf helper code\". That was wrong: the bundle contains no protobuf code\n"
           "(`grep -c -i protobuf pdf-lib.min.js` = 0). The block is tslib's.")
assert old_par in t, "README licence paragraph anchor missing"
t = t.replace(old_par, new_par, 1)
io.open(rd, "w", encoding="utf-8", newline="\r\n").write(t)
print("README patched", len(t), "chars")

# ---------------- build.ps1 REQUIRED ----------------
bp = r"C:\Users\Osama Haroon\Documents\stacklane\qa\build.ps1"
t = io.open(bp, encoding="utf-8").read()
old = '    "assets/vendor/qrcode.js",\n'
new = '    "assets/vendor/qrcode.js",\n    "assets/vendor/LICENSE.txt",\n'
assert old in t, "build.ps1 REQUIRED anchor missing"
t = t.replace(old, new, 1)
io.open(bp, "w", encoding="utf-8", newline="\r\n").write(t)
print("build.ps1 vendor REQUIRED entries:", t.count('"assets/vendor/'))

# ---------------- PART 4: 404 page ----------------
p404 = os.path.join(SRC, "404.html")
t = io.open(p404, encoding="utf-8").read()
i = t.index("<!--")
j = t.index(">", t.index("<base ")) + 1
new_block = """<!--
  This page is served by the static host for ANY missing URL, including deep
  paths like /en/some/tool. Every URL below is root-relative (it starts with
  "/"), so it resolves against whichever origin actually served the page. No
  <base> element is used: an absolute one pinned the page to one hostname and
  made a preview on any other origin fetch its CSS and scripts from production.
  The CSP in _headers allows base-uri 'self'; this page's meta policy matches
  every other page with base-uri 'none'.
-->"""
t = t[:i] + new_block + t[j:]
t, n1 = re.subn(r'(href|src)="(?!https?:|/|#|mailto:)([^"]+)"', r'\1="/\2"', t)
t = t.replace("base-uri https://stacklanetools.com/", "base-uri 'none'")
io.open(p404, "w", encoding="utf-8", newline="").write(t)
print("404.html: %d URLs made root-relative, %d chars" % (n1, len(t)))
print("  <base present:", "<base" in t)
print("  stacklanetools.com refs left:", t.count("stacklanetools.com"))

# ---------------- _headers comment ----------------
hp = os.path.join(SRC, "_headers")
t = io.open(hp, encoding="utf-8").read()
old = ("# base-uri is 'self' here, not 'none', because 404.html carries a <base>\n"
       "# element pointing at this origin so that every link on a deep missing URL\n"
       "# still resolves. On normal pages the meta tag remains base-uri 'none'.")
new = ("# base-uri is 'self' here, not 'none'. 404.html used to carry an absolute\n"
       "# <base> element for deep missing URLs; it now uses root-relative URLs\n"
       "# instead, so no base element exists on any page. 'self' keeps a base\n"
       "# element usable if one is ever added, without allowing a foreign origin.")
assert old in t, "_headers comment anchor missing"
t = t.replace(old, new, 1)
io.open(hp, "w", encoding="utf-8", newline="").write(t)
print("_headers comment updated")
