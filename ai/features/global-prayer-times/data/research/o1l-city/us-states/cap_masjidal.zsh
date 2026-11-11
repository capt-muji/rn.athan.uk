#!/usr/bin/env zsh
# O1l us-states: capture Masjidal ranges (2026/2025/2024) for known ids in the target metros.
cd "$HOME/athan-gitree/census/o1l-city/us-states"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
ids=(5AvPx2KX VrdRZqdG pQKMMBKB PAPy7ZdJ 4nL1XlKa xwLVXMdJ keLQjWAM RKxwXOdO lJAmRjdR 1QL0VydZ VrdRbPdG QL0MGBAZ 0AWpj0dj y0LbBXLo 6adJ5qAk adJmGxAk XAlzQrKb xdyqvadX BYADgwLN 8KXma5LM keLQn7AM 1QL0gbKZ rdRvm3dG pVdwNMAe)
for id in $ids; do
  for y in 2026 2025 2024; do
    f="captures/masjidal_${id}_${y}.json"
    [ -s "$f" ] && { echo "skip $id $y (cached)"; continue; }
    code=$(curl -sSL -m 60 -A "$UA" "https://masjidal.com/api/v1/time/range?masjid_id=${id}&masjid_detail=yes&from_date=${y}-01-01&to_date=${y}-12-31" -o "$f" -w "%{http_code}")
    n=$(python3 -c "
import json
try:
    d=json.load(open('$f'))
    s=d.get('data',{}).get('salah',[])
    info=d.get('data',{}).get('masjid_info') or {}
    print(len(s), (s[0]['date'] if s else '-'), '->', (s[-1]['date'] if s else '-'), '|', (info.get('name') or '')[:40], '|', (info.get('location') or '')[:40])
except Exception as e: print('ERR',e)
" 2>/dev/null)
    echo "$id $y [$code] $n"
    sleep 0.4
  done
done
