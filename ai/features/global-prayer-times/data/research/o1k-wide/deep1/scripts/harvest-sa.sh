#!/bin/zsh
# SA harvest: umqserv.kacst.gov.sa keyless GET, one per Hijri year. Makkah fit point.
set -u
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
CAP="$HOME/athan-gitree/census/o1k-wide/deep1/captures"
for yh in 1450 1460 1470 1480 1490 1500; do
  out="$CAP/sa-hijri-$yh.json"
  code=$(curl -sS -A "$UA" --max-time 90 -o "$out" -w "%{http_code}" \
    "https://umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear?lang=en&format=24&yh=$yh&lat=21.4225&lon=39.8262&zone=3")
  n=$(jq 'length' "$out" 2>/dev/null)
  first=$(jq -r '.[0].date' "$out" 2>/dev/null)
  last=$(jq -r '.[-1].date' "$out" 2>/dev/null)
  echo "sa $yh http=$code rows=$n $first .. $last"
  sleep 1
done
