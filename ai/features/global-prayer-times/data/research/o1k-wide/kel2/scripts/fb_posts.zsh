#!/bin/zsh
# Enumerate a public Facebook page's recent posts through the crawler-user-agent
# rendering, which serves the same public story the page shows logged out.
set -u
UA="Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
OUT="$HOME/athan-gitree/census/o1k-wide/kel2/captures"
PAGE="$1"
curl -sSL -A "$UA" --max-time 60 -o "$OUT/fb-page-raw.html" "https://www.facebook.com/$PAGE"
python3 - "$OUT/fb-page-raw.html" <<'PY'
import re,sys
s=open(sys.argv[1],encoding='utf-8',errors='ignore').read()
ids=list(dict.fromkeys(re.findall(r'"post_id":"(\d+)"',s)))
print('\n'.join(ids))
PY
