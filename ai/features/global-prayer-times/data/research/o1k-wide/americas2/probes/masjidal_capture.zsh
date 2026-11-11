#!/usr/bin/env zsh
# Capture every Masjidal id at a whole-year span using the widget's own from_date/to_date params.
cd "$HOME/athan-gitree/census/o1k-wide/americas2"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
ids=(VrdRkwKG pVdwyVLe M0dYkvL6 1QL0gbKZ XEdoEvL7 keLQn7AM z0AW66Lj nL1JggAa 6adJ5qAk xdy03lAX)
for id in $ids; do
  for y in 2026 2025 2024; do
    f="captures/masjidal_${id}_${y}.json"
    code=$(curl -sSL -m 60 -A "$UA" "https://masjidal.com/api/v1/time/range?masjid_id=${id}&masjid_detail=yes&from_date=${y}-01-01&to_date=${y}-12-31" -o "$f" -w "%{http_code}")
    n=$(python3 -c "
import json,sys
try:
    d=json.load(open('$f'))
    s=d.get('data',{}).get('salah',[])
    print(len(s), (s[0]['date'] if s else '-'), '->', (s[-1]['date'] if s else '-'))
except Exception as e: print('ERR',e)
" 2>/dev/null)
    echo "$id $y [$code] $n"
    sleep 0.5
  done
done
