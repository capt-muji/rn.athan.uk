#!/usr/bin/env zsh
# Capture Masjidal whole-year ranges for the unresolved-metro ids (2026/2025/2024).
cd "$HOME/athan-gitree/census/o1l-city/us-unresolved"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
ids=(
 QL0BZWdZ 3wdqj2Kb xdyqvadX lJAmvOdR 3OA8MOdp 1QL0NBdZ RKxwpMdO YRKxllKO
 0aAeyzAj 3wdqX2Ab 17372 nzKzJoKO nDAgZDL0 8KXm93LM PAPyprdJ QKMnW1LB
 zKz8QzAO aAeoEzKj BYAD8JAN zKz3zRLO M9L2wzAZ MjKZ93dX BYADwlLN xdyq9ZdX
)
for id in $ids; do
  for y in 2026 2025 2024; do
    f="captures/masjidal_${id}_${y}.json"
    [ -s "$f" ] && { echo "skip $id $y"; continue; }
    code=$(curl -sSL -m 60 -A "$UA" "https://masjidal.com/api/v1/time/range?masjid_id=${id}&masjid_detail=yes&from_date=${y}-01-01&to_date=${y}-12-31" -o "$f" -w "%{http_code}")
    n=$(python3 -c "
import json
try:
    d=json.load(open('$f')); s=d.get('data',{}).get('salah',[]); info=d.get('data',{}).get('masjid_info') or {}
    print(len(s), (s[0]['date'] if s else '-'), '->', (s[-1]['date'] if s else '-'), '|', (info.get('name') or '')[:38])
except Exception as e: print('ERR', str(e)[:40])
" 2>/dev/null)
    echo "$id $y [$code] $n"
    sleep 0.4
  done
done
