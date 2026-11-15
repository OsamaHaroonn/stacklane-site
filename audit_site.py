#!/usr/bin/env python3
"""Read-only production audit for the Stacklane Tools static site.

Usage: python audit_site.py <site_dir> [--manifest <sha256 manifest>]

Prints one PASS/FAIL/INFO line per check and exits 1 if any check failed.
Nothing is written; the target directory is only read.
"""
import sys, os, re, json, hashlib, posixpath
from pathlib import Path
from urllib.parse import urlsplit, unquote

SITE_ORIGIN = "https://stacklanetools.com"
TEXT_EXT = {".html", ".css", ".js", ".json", ".txt", ".xml", ".svg", ".md", ".webmanifest"}
results = []


def record(status, name, detail):
    results.append((status, name, detail))
    print(f"{status:4s}  {name}  {detail}")


def rel(p, root):
    return p.relative_to(root).as_posix()


def text_of(p):
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except Exception as e:  # noqa: BLE001
        return ""


def strip_origin(url):
    """Return (kind, path) where kind is internal/external/anchor/other."""
    u = url.strip()
    if not u or u.startswith("#"):
        return "anchor", u
    low = u.lower()
    for scheme in ("mailto:", "tel:", "javascript:", "data:", "blob:", "about:"):
        if low.startswith(scheme):
            return "other", u
    if low.startswith("//"):
        host = u[2:].split("/")[0]
        return ("internal" if host == "stacklanetools.com" else "external"), u
    if low.startswith(("http://", "https://")):
        sp = urlsplit(u)
        if sp.netloc == "stacklanetools.com":
            path = sp.path or "/"
            return "internal", path
        return "external", u
    return "internal", u


def target_path(site, page_dir, raw):
    path = raw.split("#")[0].split("?")[0]
    path = unquote(path)
    if not path:
        return None
    if path.startswith("/"):
        joined = path.lstrip("/")
    else:
        joined = posixpath.normpath(posixpath.join(page_dir, path))
        if joined.startswith(".."):
            return "OUTSIDE"
    joined = joined.lstrip("./") if joined.startswith("./") else joined
    if joined in ("", "."):
        joined = ""
    cand = (site / joined) if joined else site
    if joined.endswith("/") or cand.is_dir():
        cand = cand / "index.html"
    return cand


def exists(cand):
    """Cloudflare Pages resolution: exact file, <path>.html, or directory index."""
    if cand is None or cand == "OUTSIDE":
        return False
    if cand.is_file():
        return True
    if cand.suffix == "":
        if Path(str(cand) + ".html").is_file():
            return True
        if (cand / "index.html").is_file():
            return True
    return False


def main():
    if len(sys.argv) < 2:
        print("usage: audit_site.py <site_dir> [--manifest file]")
        return 2
    site = Path(sys.argv[1]).resolve()
    manifest = None
    if "--manifest" in sys.argv:
        manifest = Path(sys.argv[sys.argv.index("--manifest") + 1]).resolve()
    if not site.is_dir():
        print(f"not a directory: {site}")
        return 2

    files = sorted(p for p in site.rglob("*") if p.is_file() and ".git" not in p.relative_to(site).parts)
    all_rel = [rel(p, site) for p in files]
    print(f"=== AUDIT {site} ===")
    print(f"files={len(files)} bytes={sum(p.stat().st_size for p in files)}")

    # A1 inventory
    ext = {}
    for p in files:
        e = p.suffix.lower() or "(none)"
        ext[e] = ext.get(e, 0) + 1
    html = [p for p in files if p.suffix.lower() == ".html"]
    css = [p for p in files if p.suffix.lower() == ".css"]
    js = [p for p in files if p.suffix.lower() == ".js"]
    print("by extension: " + ", ".join(f"{k}={v}" for k, v in sorted(ext.items(), key=lambda kv: -kv[1])))

    # A2 entry point
    idx = site / "index.html"
    ok = idx.is_file() and idx.stat().st_size > 500
    record("PASS" if ok else "FAIL", "Entry point", f"index.html at repo root size={idx.stat().st_size if idx.is_file() else 'MISSING'}")

    # A3 required deployment files
    required = ["index.html", "404.html", "_headers", "robots.txt", "sitemap.xml", "ads.txt",
                "assets/style.css", "assets/chrome.js", "assets/catalog.js", "assets/config.js",
                "assets/i18n/en.json", "assets/vendor/pdf-lib.min.js", "assets/vendor/qrcode.js",
                "assets/vendor/LICENSE.txt", "assets/favicon.svg", "assets/og.png",
                "en/index.html", "en/loan-calculator.html", "privacy.html", "terms.html",
                "about.html", "contact.html", "all-tools.html"]
    missing = [r for r in required if not (site / r).is_file()]
    record("PASS" if not missing else "FAIL", "Required files", f"checked={len(required)} missing={len(missing)}" + (f" -> {missing}" if missing else ""))

    # A4 forbidden artefacts
    bad_patterns = [
        (re.compile(r"\.(zip|rar|7z|ps1|pyc|log|bak|tmp|pem|key|p12)$", re.I), "archive/script/secret"),
        (re.compile(r"(^|/)(node_modules|\.git|\.github|\.vscode|\.idea|qa|docs|backups|shots|qa-shots|__pycache__|\.release|qa-fixtures)(/|$)", re.I), "dev directory"),
        (re.compile(r"(^|/)\.env", re.I), "env file"),
        (re.compile(r"(^|/)(_dev|qa-)", re.I), "dev file prefix"),
        (re.compile(r"\.(md)$", re.I), "markdown (allowed only for README.md at root)"),
        (re.compile(r"(^|/)(Thumbs\.db|\.DS_Store|nul)$", re.I), "OS artefact"),
        (re.compile(r"\.(png|jpg|jpeg|webp)$", re.I), "screenshot-like image (only assets/og.png or favicon allowed)"),
    ]
    allowed_png = {"assets/og.png"}
    bad = []
    for r in all_rel:
        for rx, label in bad_patterns:
            if rx.search(r):
                if label.startswith("markdown") and r == "README.md":
                    continue
                if label.startswith("screenshot") and r in allowed_png:
                    continue
                bad.append(f"{r} [{label}]")
                break
    record("PASS" if not bad else "FAIL", "No development artefacts", f"files={len(all_rel)} flagged={len(bad)}" + (f" -> {bad[:10]}" if bad else ""))

    # A5 secrets / credentials
    secret_rx = [
        re.compile(r"gh[pousr]_[A-Za-z0-9]{20,}"),
        re.compile(r"github_pat_[A-Za-z0-9_]{20,}"),
        re.compile(r"AKIA[0-9A-Z]{16}"),
        re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
        re.compile(r"sk_live_[A-Za-z0-9]{10,}"),
        re.compile(r"sk-[A-Za-z0-9]{32,}"),
        re.compile(r"AIza[0-9A-Za-z\-_]{30,}"),
        re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"),
        re.compile(r"(?i)\b(api[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|password)\b\s*[:=]\s*[\"'][^\"'\s]{12,}[\"']"),
        re.compile(r"(?i)bearer\s+[A-Za-z0-9\-._~+/]{20,}"),
    ]
    hits = []
    scanned = 0
    for p in files:
        raw = p.read_bytes()
        scanned += 1
        try:
            s = raw.decode("utf-8", errors="replace")
        except Exception:  # noqa: BLE001
            continue
        for rx in secret_rx:
            for m in rx.finditer(s):
                line = s[:m.start()].count("\n") + 1
                hits.append(f"{rel(p, site)}:{line} {rx.pattern[:28]}")
    record("PASS" if not hits else "FAIL", "Secret scan", f"files={scanned} matches={len(hits)}" + (f" -> {hits[:5]}" if hits else ""))

    # A6 local machine / localhost
    local_rx = [
        (re.compile(r"localhost", re.I), "localhost"),
        (re.compile(r"\b127\.0\.0\.1\b"), "loopback IP"),
        (re.compile(r"file:///"), "file URL"),
        (re.compile(r"[A-Za-z]:\\\\Users\\\\|[A-Za-z]:/Users/", re.I), "windows user path"),
        (re.compile(r"Osama\s*Haroon|OSAMAH~1", re.I), "owner name"),
        (re.compile(r"/home/[a-z0-9_.-]+/"), "unix home path"),
    ]
    local = []
    for p in files:
        if p.suffix.lower() not in TEXT_EXT:
            continue
        s = text_of(p)
        for rx, label in local_rx:
            for m in rx.finditer(s):
                line = s[:m.start()].count("\n") + 1
                local.append(f"{rel(p, site)}:{line} {label} {m.group(0)[:40]!r}")
    record("PASS" if not local else "FAIL", "No local host/path leaks", f"matches={len(local)}" + (f" -> {local[:6]}" if local else ""))

    # A7 HTML structure + refs
    attr_rx = re.compile(r"""\b(href|src|poster|data-src|action|formaction|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)')""", re.I)
    url_css_rx = re.compile(r"""url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"]*))\s*\)""", re.I)
    struct_bad, link_bad, ext_links, counts = [], [], [], {"refs": 0, "internal": 0, "external": 0, "skipped": 0}
    emails = set()
    canon_hosts = set()
    for page in html:
        raw_s = text_of(page)
        # Comments are prose, not markup: "No <base> element is used" must not
        # count as a base element.
        s = re.sub(r"(?s)<!--.*?-->", "", raw_s)
        rp = rel(page, site)
        page_dir = posixpath.dirname(rp)
        if not re.match(r"(?is)^\s*<!doctype html>", s):
            struct_bad.append(f"{rp}: no doctype")
        if not re.search(r"(?is)<html[^>]*\slang=", s):
            struct_bad.append(f"{rp}: html without lang")
        m = re.search(r"(?is)<title>(.*?)</title>", s)
        if not m or not m.group(1).strip():
            struct_bad.append(f"{rp}: empty/missing title")
        if not re.search(r"(?i)<meta\s+name=\"description\"\s+content=\"[^\"]+\"", s):
            # A noindex page (404) is not indexed and needs no description.
            if not re.search(r"(?i)<meta\s+name=\"robots\"\s+content=\"[^\"]*noindex", s):
                struct_bad.append(f"{rp}: no meta description")
        if not re.search(r"(?i)<meta\s+charset=", s):
            struct_bad.append(f"{rp}: no charset")
        if not re.search(r"(?i)<meta\s+name=\"viewport\"", s):
            struct_bad.append(f"{rp}: no viewport")
        h1 = re.findall(r"(?is)<h1\b", s)
        if len(h1) != 1:
            struct_bad.append(f"{rp}: h1 count={len(h1)}")
        if re.search(r"(?i)<base\b", s):
            struct_bad.append(f"{rp}: has <base>")
        for cm in re.finditer(r"(?i)<link\s+rel=\"canonical\"\s+href=\"([^\"]+)\"", s):
            canon_hosts.add(urlsplit(cm.group(1)).netloc)
        for em in re.finditer(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", s):
            emails.add(em.group(0))
        refs = []
        for am in attr_rx.finditer(s):
            name = am.group(1).lower()
            val = am.group(2) if am.group(2) is not None else am.group(3) or ""
            if name == "srcset":
                for part in val.split(","):
                    u = part.strip().split(" ")[0]
                    if u:
                        refs.append(u)
            else:
                refs.append(val)
        for sm in re.search(r"(?is)<style[^>]*>(.*?)</style>", s) and re.finditer(r"(?is)<style[^>]*>(.*?)</style>", s) or []:
            for um in url_css_rx.finditer(sm.group(1)):
                refs.append(um.group(1) or um.group(2) or um.group(3) or "")
        for im in re.finditer(r"""(?i)\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')""", s):
            for um in url_css_rx.finditer(im.group(1) or im.group(2) or ""):
                refs.append(um.group(1) or um.group(2) or um.group(3) or "")
        for raw in refs:
            counts["refs"] += 1
            kind, val = strip_origin(raw)
            if kind in ("anchor", "other"):
                counts["skipped"] += 1
                continue
            if kind == "external":
                counts["external"] += 1
                ext_links.append(f"{rp} -> {val}")
                continue
            counts["internal"] += 1
            cand = target_path(site, page_dir, val)
            if not exists(cand):
                link_bad.append(f"{rp}: {'OUTSIDE' if cand == 'OUTSIDE' else rel(cand, site) if cand else val}")
    record("PASS" if not struct_bad else "FAIL", "HTML structure", f"pages={len(html)} issues={len(struct_bad)}" + (f" -> {struct_bad[:6]}" if struct_bad else ""))
    record("PASS" if not link_bad else "FAIL", "HTML links/assets", f"refs={counts['refs']} internal={counts['internal']} external={counts['external']} unresolved={len(link_bad)}" + (f" -> {link_bad[:8]}" if link_bad else ""))
    record("INFO", "External links (not fetched)", f"count={len(ext_links)}")
    record("PASS" if canon_hosts in ({""}, set()) or canon_hosts == {"stacklanetools.com"} else "FAIL", "Canonical hosts", f"{sorted(canon_hosts)}")

    allowed_emails = {"contact@stacklanetools.com", "example.com", "acme.com"}
    odd = sorted(e for e in emails if e.split("@")[-1] not in allowed_emails and e not in allowed_emails)
    record("PASS" if not odd else "FAIL", "Email addresses", f"distinct={len(emails)} unexpected={len(odd)}" + (f" -> {odd}" if odd else ""))

    # A8 CSS refs
    css_bad, css_count = [], 0
    for sheet in [p for p in files if p.suffix.lower() == ".css"]:
        s = text_of(sheet)
        rp = rel(sheet, site)
        for um in url_css_rx.finditer(s):
            raw = (um.group(1) or um.group(2) or um.group(3) or "").strip()
            if not raw or raw.startswith("#"):
                continue
            kind, val = strip_origin(raw)
            if kind != "internal":
                continue
            css_count += 1
            cand = target_path(site, posixpath.dirname(rp), val)
            if not exists(cand):
                css_bad.append(f"{rp}: {raw}")
    record("PASS" if not css_bad else "FAIL", "CSS url() refs", f"refs={css_count} unresolved={len(css_bad)}" + (f" -> {css_bad[:8]}" if css_bad else ""))

    # A9 JS static refs (literal only)
    js_bad, js_dynamic, js_checked, js_baseuri = [], 0, 0, 0
    # document.baseURI is the PAGE url, not the script url, so resolve these
    # against the site root and against a one-level-deep page directory.
    baseuri_pat = re.compile(r"""new\s+URL\(\s*['"]([^'"]+)['"]\s*,\s*document\.baseURI""")
    pats = [
        re.compile(r"""fetch\(\s*['"]([^'"]+)['"]"""),
        re.compile(r"""\.(?:src|href)\s*=\s*['"]([^'"]+)['"]"""),
        re.compile(r"""setAttribute\(\s*['"](?:src|href)['"]\s*,\s*['"]([^'"]+)['"]"""),
    ]
    for f in [p for p in files if p.suffix.lower() == ".js"]:
        s = text_of(f)
        rp = rel(f, site)
        if " + " in s or "${" in s:
            js_dynamic += 1
        for m in baseuri_pat.finditer(s):
            raw = m.group(1)
            if any(t in raw for t in ("${", " + ")):
                continue
            kind, val = strip_origin(raw)
            if kind != "internal":
                continue
            js_baseuri += 1
            ok = any(exists(target_path(site, d, val)) for d in ("", "en"))
            if not ok:
                line = s[:m.start()].count("\n") + 1
                js_bad.append(f"{rp}:{line} baseURI {raw}")
        for rx in pats:
            for m in rx.finditer(s):
                raw = m.group(1)
                if any(t in raw for t in ("${", "' +", '" +')):
                    continue
                kind, val = strip_origin(raw)
                if kind != "internal":
                    continue
                if raw.startswith("data:") or raw.startswith("blob:"):
                    continue
                js_checked += 1
                cand = target_path(site, posixpath.dirname(rp), val)
                if not exists(cand):
                    line = s[:m.start()].count("\n") + 1
                    js_bad.append(f"{rp}:{line} {raw}")
    record("PASS" if not js_bad else "FAIL", "JS literal refs", f"jsfiles={len(js)} refs={js_checked} baseURI-refs={js_baseuri} unresolved={len(js_bad)} files-with-dynamic-strings={js_dynamic}" + (f" -> {js_bad[:8]}" if js_bad else ""))

    # A10 sitemap
    sm = site / "sitemap.xml"
    sms = text_of(sm)
    locs = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", sms)
    sm_bad = []
    for loc in locs:
        sp = urlsplit(loc)
        if sp.netloc != "stacklanetools.com":
            sm_bad.append(f"host {loc}")
            continue
        cand = target_path(site, "", sp.path or "/")
        if not exists(cand):
            sm_bad.append(loc)
    record("PASS" if locs and not sm_bad else "FAIL", "Sitemap targets", f"urls={len(locs)} unresolved={len(sm_bad)}" + (f" -> {sm_bad[:8]}" if sm_bad else ""))
    def normalize(p):
        """Compare pages and sitemap entries by served URL, not by filename."""
        if p.endswith("/index.html"):
            return p[: -len("index.html")]
        if p.endswith(".html"):
            return p[:-5]
        return p

    listed = {normalize(urlsplit(loc).path or "/") for loc in locs}
    unlisted = []
    for page in html:
        rp = rel(page, site)
        if rp in ("404.html",):
            continue
        if normalize("/" + rp) not in listed:
            unlisted.append(rp)
    record("INFO", "HTML pages outside sitemap", f"count={len(unlisted)} examples={unlisted[:6]}")

    # A11 robots.txt
    robs = text_of(site / "robots.txt")
    rob_lines = [l.strip() for l in robs.splitlines() if l.strip() and not l.strip().startswith("#")]
    rob_bad = [l for l in rob_lines if not re.match(r"(?i)^(user-agent|allow|disallow|sitemap|crawl-delay|host)\s*:\s*\S", l)]
    rob_sm = [l for l in rob_lines if l.lower().startswith("sitemap:")]
    ok = not rob_bad and len(rob_sm) == 1 and rob_sm[0].split(":", 1)[1].strip() == SITE_ORIGIN + "/sitemap.xml"
    record("PASS" if ok else "FAIL", "robots.txt syntax", f"directives={len(rob_lines)} invalid={len(rob_bad)} sitemap={rob_sm}")

    # A12 _headers
    hdr = text_of(site / "_headers")
    blocks, cur, cur_headers, hdr_bad = 0, None, 0, []
    for i, line in enumerate(hdr.splitlines(), 1):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line[0] in " \t":
            m = re.match(r"^\s+([A-Za-z0-9!#$%&'*+.^_`|~-]+)\s*:\s*(\S.*)$", line)
            if not m:
                hdr_bad.append(f"line {i}: malformed header")
            else:
                cur_headers += 1
        else:
            if cur is not None and cur_headers == 0:
                hdr_bad.append(f"line {i}: block {cur} has no headers")
            cur, cur_headers = line.strip(), 0
            blocks += 1
            if not re.match(r"^/", cur):
                hdr_bad.append(f"line {i}: pattern does not start with /")
    if cur is not None and cur_headers == 0:
        hdr_bad.append(f"last block {cur} has no headers")
    csp = re.search(r"(?im)^\s+content-security-policy:\s*(.+)$", hdr)
    csp_ok = bool(csp) and "base-uri 'self'" in csp.group(1) and "frame-ancestors 'none'" in csp.group(1)
    record("PASS" if not hdr_bad and csp_ok else "FAIL", "_headers syntax", f"blocks={blocks} header-lines={cur_headers} invalid={len(hdr_bad)} csp_base_uri_self={csp_ok}" + (f" -> {hdr_bad[:5]}" if hdr_bad else ""))
    record("PASS" if (site / "_redirects").is_file() is False else "INFO", "_redirects", "absent (no redirect rules needed)" if not (site / "_redirects").is_file() else "present")

    # A13 404 page
    p404 = re.sub(r"(?s)<!--.*?-->", "", text_of(site / "404.html"))
    refs404 = [m.group(2) or m.group(3) or "" for m in attr_rx.finditer(p404)]
    bad404 = []
    for raw in refs404:
        kind, val = strip_origin(raw)
        if kind != "internal":
            continue
        if not val.startswith("/"):
            bad404.append(f"relative: {raw}")
            continue
        if not exists(target_path(site, "", val)):
            bad404.append(raw)
    no_base = not re.search(r"(?i)<base\b", p404)
    meta_csp = re.search(r"(?i)<meta\s+http-equiv=\"Content-Security-Policy\"\s+content=\"([^\"]+)\"", p404)
    record("PASS" if not bad404 and no_base and meta_csp and "base-uri" in (meta_csp.group(1) if meta_csp else "") else "FAIL",
           "404 page", f"refs={len(refs404)} root-relative-issues={len(bad404)} no_base={no_base} meta_csp={bool(meta_csp)}" + (f" -> {bad404[:5]}" if bad404 else ""))

    # A14 duplicate page titles / canonicals
    titles = {}
    for page in html:
        s = text_of(page)
        m = re.search(r"(?is)<title>(.*?)</title>", s)
        if m:
            titles.setdefault(m.group(1).strip(), []).append(rel(page, site))
    dupes = {t: v for t, v in titles.items() if len(v) > 1}
    record("PASS" if not dupes else "FAIL", "Unique page titles", f"titles={len(titles)} duplicates={len(dupes)}" + (f" -> {list(dupes.items())[:3]}" if dupes else ""))

    # A15 manifest parity
    if manifest and manifest.is_file():
        entries = {}
        for line in manifest.read_text(encoding="utf-8", errors="replace").splitlines():
            m = re.match(r"^([A-Fa-f0-9]{64})\s+(.+?)\s*$", line)
            if m:
                entries[m.group(2).replace("\\", "/")] = m.group(1).lower()
        mismatch, absent = [], []
        for name, digest in entries.items():
            p = site / name
            if not p.is_file():
                absent.append(name)
                continue
            h = hashlib.sha256(p.read_bytes()).hexdigest()
            if h != digest:
                mismatch.append(name)
        extra = sorted(set(all_rel) - set(entries) - {"README.md"})
        ok = not mismatch and not absent
        record("PASS" if ok else "FAIL", "Manifest parity", f"manifest={len(entries)} mismatch={len(mismatch)} missing={len(absent)} extra_in_site={len(extra)}" + (f" -> {(mismatch + absent)[:5]}" if (mismatch or absent) else ""))
        if extra:
            print(f"INFO  Files not in manifest (added for repo): {extra[:10]}")

    failures = [r for r in results if r[0] == "FAIL"]
    print()
    print(f"CHECKS={len(results)} FAILURES={len(failures)}")
    for f in failures:
        print(f"FAILED {f[1]}: {f[2]}")
    print("AUDIT RESULT: " + ("PASS" if not failures else "FAIL"))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
