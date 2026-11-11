#!/bin/zsh
# SA ten-city harvest: umqserv.kacst.gov.sa keyless GET, one per city-year.
set -u
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
CAP="$HOME/athan-gitree/census/o1l-city/mideast-cities/captures"
W="$HOME/athan-gitree/census/o1l-city/mideast-cities"
cities=(
  "makkah:21.4225:39.8262"
  "riyadh:24.7136:46.6753"
  "medina:24.4672:39.6111"
  "jeddah:21.4858:39.1925"
  "abha:18.2164:42.5053"
  "tabuk:28.3835:36.5662"
  "dammam:26.4207:50.0888"
  "taif:21.2703:40.4158"
  "buraidah:26.3260:43.9750"
  "hail:27.5114:41.7208"
)
for c in $cities; do
  name=${c%%:*}; rest=${c#*:}; lat=${rest%%:*}; lon=${rest#*:}
  for yh in 1448 1449; do
    out="$CAP/sa-$name-$yh.json"
    code=$(curl -sS -A "$UA" --max-time 120 -o "$out" -w "%{http_code}" \
      "https://umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear?lang=en&format=24&yh=$yh&lat=$lat&lon=$lon&zone=3")
    n=$(jq 'length' "$out" 2>/dev/null)
    first=$(jq -r '.[0].date' "$out" 2>/dev/null)
    last=$(jq -r '.[-1].date' "$out" 2>/dev/null)
    echo "sa $name $yh http=$code rows=$n $first .. $last"
    sleep 1
  done
done
