#!/bin/zsh
# Saudi governorate tranche 2: smaller governorate seats, city-point anchors.
set -u
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
CAP="$HOME/athan-gitree/census/o1l-city/saudi-cities/captures"
cities=(
  "al-qurayyat:31.3319:37.3428"
  "al-wajh:26.2456:36.4667"
  "umluj:25.0500:37.2667"
  "duba:27.3500:35.7000"
  "haql:29.2833:34.9333"
  "tayma:27.6333:38.5500"
  "al-sulayyil:20.4667:45.5833"
  "al-aflaj:22.2833:46.7333"
  "ranyah:21.2500:42.8500"
  "turbah:21.2167:41.6333"
  "al-khurma:22.0833:42.0333"
  "mahd-adh-dhahab:23.5000:40.8500"
  "al-majmaah:25.9000:45.3667"
  "al-rass:25.8667:43.5000"
  "al-zulfi:26.2833:44.8000"
  "abu-arish:16.9667:42.8333"
  "sabya:17.1500:42.6333"
  "samtah:16.6000:42.9500"
  "farasan:16.7000:42.1167"
  "al-namas:19.1500:42.2833"
  "baljurashi:19.8667:41.5667"
)
for c in $cities; do
  name=${c%%:*}; rest=${c#*:}; lat=${rest%%:*}; lon=${rest#*:}
  for yh in 1448 1449; do
    out="$CAP/sa-$name-$yh.json"
    if [[ -s "$out" ]] && [[ $(jq 'length' "$out" 2>/dev/null) -gt 300 ]]; then echo "skip $name $yh"; continue; fi
    code=$(curl -sS -A "$UA" --max-time 120 -o "$out" -w "%{http_code}" \
      "https://umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear?lang=en&format=24&yh=$yh&lat=$lat&lon=$lon&zone=3")
    echo "$name $yh http=$code rows=$(jq 'length' "$out" 2>/dev/null)"
    sleep 1
  done
done
