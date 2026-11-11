#!/usr/bin/env zsh
# Bank one full year of Masjidal athan + iqamah per tenant (keyless range API).
# usage: cap_range.zsh <year> <id> [id...]
set -u
cd "$HOME/athan-gitree/census/o1l-city/masjidal-global"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
y="$1"; shift
for id in "$@"; do
  f="captures/masjidal_${id}_${y}.json"
  [ -s "$f" ] && { echo "skip $id $y"; continue; }
  code=$(curl -sS -m 90 -A "$UA" \
    "https://masjidal.com/api/v1/time/range?masjid_id=${id}&masjid_detail=yes&from_date=${y}-01-01&to_date=${y}-12-31" \
    -o "$f" -w "%{http_code}")
  n=$(python3 -c "
import json
try:
    d=json.load(open('$f')); s=(d.get('data') or {}).get('salah') or []; q=(d.get('data') or {}).get('iqamah') or []
    print(len(s),'athan',len(q),'iqamah', (s[0]['date'] if s else '-'))
except Exception as e: print('ERR',e)
")
  echo "$id $y [$code] $n"
  sleep 0.4
done
