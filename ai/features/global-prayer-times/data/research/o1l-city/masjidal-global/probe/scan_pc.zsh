#!/usr/bin/env zsh
# Scan prayersconnect mosque pages for embedded Masjidal/Athanplus tenant ids.
# usage: scan_pc.zsh <sitemap-url> <tag> <max-pages>
set -u
cd "$HOME/athan-gitree/census/o1l-city/masjidal-global"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
sm="$1"; tag="$2"; max="${3:-200}"
mkdir -p probe/pc
[ -s "probe/pc/$tag.xml" ] || curl -sSL -m 120 -A "$UA" "$sm" -o "probe/pc/$tag.xml"
grep -o '<loc>[^<]*' "probe/pc/$tag.xml" | sed 's/<loc>//' | python3 -c "import sys,random; l=sys.stdin.read().split(); random.seed(7); random.shuffle(l); print(chr(10).join(l[:int(sys.argv[1])]))" "$max" > "probe/pc/$tag.urls"
: > "probe/pc/$tag.hits"
cat "probe/pc/$tag.urls" | xargs -P 10 -I{} zsh -c '
  UA="'"$UA"'"
  h=$(curl -sSL -m 25 -A "$UA" "{}" 2>/dev/null)
  ids=$(printf "%s" "$h" | grep -o "masjidal\.com/[a-z/]*?masjid_id=[A-Za-z0-9]*" | sed "s/.*masjid_id=//" | sort -u | tr "\n" ",")
  if [ -n "$ids" ]; then echo "{}|$ids"; fi
' >> "probe/pc/$tag.hits"
wc -l < "probe/pc/$tag.urls" | tr -d '\n'; echo " pages scanned"
wc -l < "probe/pc/$tag.hits" | tr -d '\n'; echo " pages with masjidal"
