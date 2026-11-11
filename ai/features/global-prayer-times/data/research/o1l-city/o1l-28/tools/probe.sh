#!/bin/zsh
# probe.sh <tag> <url> — fetch one public page, save raw, report engine markers.
set -u
TAG="$1"; URL="$2"
DIR="$HOME/athan-gitree/census/o1l-city/o1l-28"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
OUT="$DIR/captures/$TAG.html"
curl -sS -L --max-time 40 -A "$UA" -o "$OUT" -w "status=%{http_code} bytes=%{size_download} final=%{url_effective}\n" "$URL"
MARK=""
grep -qoiE 'rest_route=/dpt' "$OUT" 2>/dev/null && MARK="$MARK dpt-restroute"
grep -qoiE 'dpt/v1|dpt_plugin|dpt-' "$OUT" 2>/dev/null && MARK="$MARK dpt-marker"
grep -qoiE 'mawaqit' "$OUT" 2>/dev/null && MARK="$MARK mawaqit"
grep -qoiE 'masjidbox' "$OUT" 2>/dev/null && MARK="$MARK masjidbox"
grep -qoiE 'masjidal' "$OUT" 2>/dev/null && MARK="$MARK masjidal"
grep -qoiE 'docs.google.com/spreadsheets' "$OUT" 2>/dev/null && MARK="$MARK gsheet"
grep -qoiE '\.pdf' "$OUT" 2>/dev/null && MARK="$MARK pdf"
grep -qoiE 'athanplus|athan plus' "$OUT" 2>/dev/null && MARK="$MARK athanplus"
echo "markers:${MARK:- none}"
