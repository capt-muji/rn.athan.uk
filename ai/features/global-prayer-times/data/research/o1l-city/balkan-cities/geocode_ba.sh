#!/bin/zsh
# Geocode the vaktija.ba location names against a public Nominatim instance.
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 athan-census/1.0"
cd "$(dirname "$0")" || exit 1
mkdir -p captures/geocode
while IFS=$'\t' read -r id name; do
  out="captures/geocode/ba_${id}.json"
  [[ -s $out ]] && continue
  q=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$name, Bosnia and Herzegovina")
  code=$(curl -s -A "$UA" --max-time 30 -o "$out" -w "%{http_code}" "https://nominatim.openstreetmap.org/search?q=${q}&format=jsonv2&limit=1&addressdetails=1")
  echo "$id|$name|$code|$(python3 -c "
import json,sys
try:
    d=json.load(open('$out'))
    if d: print(d[0]['lat'],d[0]['lon'],d[0].get('type',''))
    else: print('EMPTY')
except Exception as e: print('ERR')
")" | tee -a geocode_ba.log
  sleep 1.2
done < ba_ids.txt
echo DONE | tee -a geocode_ba.log
