#!/bin/zsh
# usage: kg-pull.sh <locationId|"lat,lng"> <name> <year>
set -u
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
BASE="$HOME/athan-gitree/census/o1l-city/o1l-26r"
id="$1"; name="$2"; year="$3"
if [[ "$id" == *,* ]]; then
  lat="${id%%,*}"; lng="${id##*,}"
  q="lat=$lat&lng=$lng"
else
  q=""
fi
for w in "01-01:28-02" "01-03:30-04" "01-05:30-06" "01-07:31-08" "01-09:31-10" "01-11:31-12"; do
  s="${w%%:*}-$year"; e="${w##*:}-$year"
  out="$BASE/captures/kg-$name-$year-${w%%:*}.json"
  if [[ -n "$q" ]]; then
    url="https://muftiyat.kg/ru/api/v1/calendar/?$q&start=$s&end=$e"
  else
    url="https://muftiyat.kg/ru/api/v1/calendar/$id/?start=$s&end=$e"
  fi
  code=$(curl -sS -m 40 -A "$UA" -o "$out" -w "%{http_code}" "$url")
  n=$(python3 -c "import json;print(len(json.load(open('$out'))['prayertimes']))" 2>/dev/null)
  echo "$name $year $s..$e http=$code rows=${n:-ERR}"
done
