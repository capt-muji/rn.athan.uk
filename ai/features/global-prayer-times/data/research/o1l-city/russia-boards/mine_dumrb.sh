#!/bin/zsh
set -u
cd "$(dirname "$0")"
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'
mkdir -p captures/dumrb
python3 - <<'PY'
import json
d = json.load(open('captures/dumrb_supportedcities.json'))
with open('data/dumrb_cities.tsv','w') as f:
    for c in d:
        f.write(f"{c['id']}\t{c['name']}\t{c['location']['y']}\t{c['location']['x']}\n")
print(len(d), 'cities')
PY
for year in 2026 2025; do
  while IFS=$'\t' read -r id name lat lon; do
    for m in 1 2 3 4 5 6 7 8 9 10 11 12; do
      out="captures/dumrb/${year}_${id}_${m}.json"
      [[ -s "$out" ]] && continue
      code=$(curl -sS -m 30 -A "$UA" -G "https://api.dumrb.com/Prayer/GetByCity" \
        --data-urlencode "cityName=${name}" --data-urlencode "year=${year}" --data-urlencode "month=${m}" \
        -o "$out" -w "%{http_code}")
      echo "$code $year $id $m" >> data/dumrb_fetch.log
      sleep 0.25
    done
  done < data/dumrb_cities.tsv
  echo "YEAR $year DONE"
done
echo ALLDONE
