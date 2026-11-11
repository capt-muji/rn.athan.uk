#!/usr/bin/env zsh
# Masjidbox Cartagena history walk: 7-day hops via begin=, 2025-11-01 -> today.
cd "$HOME/athan-gitree/census/o1l-city/latam-cities"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
KEY="JejYcMS7hsOsZTPDk2ZhKOAlW9IyQ6Px"
SLUG="mezquita-de-muhammad-1747848830940"
python3 - <<'EOF' > data/co_walk_dates.txt
from datetime import date, timedelta
d = date(2025,11,1)
while d <= date(2026,11,15):
    print(d.isoformat())
    d += timedelta(days=7)
EOF
while read b; do
  out="captures/co_mb_walk_${b}.json"
  [ -s "$out" ] && continue
  curl -sSL -m 30 -A "$UA" -H "apikey: $KEY" "https://api.masjidbox.com/1.0/masjidbox/landing/athany/$SLUG?get=at&days=7&begin=$b" -o "$out" -w "$b HTTP %{http_code} %{size_download}B\n"
  sleep 1
done < data/co_walk_dates.txt
