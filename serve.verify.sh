#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

echo "=== kill stale listeners on 8782 and any stale server processes ==="
(fuser -k 8782/tcp 2>/dev/null || true) || true
for pid in $(ps -ef 2>/dev/null | grep -iE "pages_server|serve.verify.sh" | grep -v grep | awk '{print $2}'); do
  kill -9 "$pid" 2>/dev/null || true
done
sleep 1
rm -f _preview_index.html _preview_all-tools.html
echo "cleaned"

echo ""
echo "=== start Pages-like static server on 8782, log to pages-server.log ==="
nohup python3 - > pages-server.log 2>&1 &
PYPID=$!
echo "started python server PID $PYPID"

sleep 3

echo ""
echo "=== listener on 8782? ==="
(ss -ltn 2>/dev/null | grep 8782 || netstat -an 2>/dev/null | grep 8782 || echo "no listener on 8782")
echo ""
echo "=== pages-server.log (first 20 lines) ==="
head -n 20 pages-server.log || true

echo ""
echo "=== HTTP probes ==="
curl -sS -o /dev/null -w "GET /en/  HTTP %{http_code}  size=%{size_download}\n" http://127.0.0.1:8782/en/
curl -sS -o /dev/null -w "GET /en/word-counter  HTTP %{http_code}  size=%{size_download}\n" http://127.0.0.1:8782/en/word-counter
curl -sS -o /dev/null -w "GET /en/margin-calculator  HTTP %{http_code}  size=%{size_download}\n" http://127.0.0.1:8782/en/margin-calculator
curl -sS -o /dev/null -w "GET /en/loss-calculator  HTTP %{http_code}  size=%{size_download}\n" http://127.0.0.1:8782/en/loss-calculator
curl -sS -o /dev/null -w "GET /en/audit  HTTP %{http_code}  size=%{size_download}\n" http://127.0.0.1:8782/en/audit
curl -sS -o /dev/null -w "GET /all-tools  HTTP %{http_code}  size=%{size_download}\n" http://127.0.0.1:8782/all-tools
curl -sS -o /dev/null -w "GET /assets/favicon.svg  HTTP %{http_code}  size=%{size_download}\n" http://127.0.0.1:8782/assets/favicon.svg
curl -sS -o /dev/null -w "GET /assets/og.png  HTTP %{http_code}  size=%{size_download}\n" http://127.0.0.1:8782/assets/og.png
curl -sS -o /dev/null -w "GET /missing  HTTP %{http_code}  (expect 404)\n" http://127.0.0.1:8782/missing
curl -sS -o /dev/null -w "GET /en/missing-tool  HTTP %{http_code}  (expect 404)\n" http://127.0.0.1:8782/en/missing-tool

echo ""
echo "=== save homepage + all-tools for a content check ==="
curl -sS -o _preview_index.html http://127.0.0.1:8782/en/
curl -sS -o _preview_all-tools.html http://127.0.0.1:8782/all-tools
echo "saved _preview_index.html + _preview_all-tools.html"

echo ""
echo "=== quick content check of saved copies ==="
echo "title(/en/)="
grep -oE "<title>[^<]*</title>" _preview_index.html | head -n 1 || echo "(no title)"
echo "first 3 internal /en/ links in /en/:"
grep -oE 'href="/en/[a-z0-9-]+"' _preview_index.html | head -n 3 || echo "(none)"
echo "title(/all-tools)="
grep -oE "<title>[^<]*</title>" _preview_all-tools.html | head -n 1 || echo "(no title)"

echo ""
echo "=== done ==="
