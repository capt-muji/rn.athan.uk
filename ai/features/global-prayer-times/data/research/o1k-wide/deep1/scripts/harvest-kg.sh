#!/bin/zsh
# KG harvest: muftiyat.kg documented JSON API, one GET per two-month window.
# City 1 = Bishkek (42.87, 74.59). Jan and Jul windows for each target year.
set -u
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
CAP="$HOME/athan-gitree/census/o1k-wide/deep1/captures"
for year in 2027 2029 2031 2033 2035; do
  for w in jan jul; do
    if [ "$w" = jan ]; then s="01-01-$year"; e="28-02-$year"; else s="01-07-$year"; e="31-08-$year"; fi
    out="$CAP/kg-city1-$w-$year.json"
    code=$(curl -sS -A "$UA" --max-time 60 -o "$out" -w "%{http_code}" \
      "https://muftiyat.kg/ru/api/v1/calendar/1/?start=$s&end=$e")
    n=$(jq -r '.prayertimes|length' "$out" 2>/dev/null)
    echo "kg $year $w $s..$e http=$code rows=$n"
    sleep 1
  done
done
