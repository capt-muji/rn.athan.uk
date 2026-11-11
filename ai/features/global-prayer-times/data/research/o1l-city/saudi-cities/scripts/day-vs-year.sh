#!/bin/zsh
# Cross-endpoint check: does the Hijri-year table agree with the day endpoint
# (GetPrayers) at the same point, for a common date?
set -u
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
W="$HOME/athan-gitree/census/o1l-city/saudi-cities"
CAP="$W/captures"
DATE="2026-11-11"
OUT="$W/data/day-vs-year.tsv"
: > "$OUT"
jq -r '.cities[] | [.name, (.capture // .name), .lat, .lon] | @tsv' "$W/data/cities.json" | while IFS=$'\t' read -r name cap lat lon; do
  day=$(curl -sS -A "$UA" --max-time 60 \
    "https://umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayers?lang=en&format=24&yg=2026&mg=11&dg=11&lat=$lat&lon=$lon&zone=3" \
    | jq -r '[.prayerTimes.fajr,.prayerTimes.sunrise,.prayerTimes.dhuhr,.prayerTimes.asr,.prayerTimes.maghrib,.prayerTimes.isha]|join(" ")')
  yr=$(jq -r --arg d "$DATE" '.[]|select(.date|startswith($d))|[.prayerTimes.fajr,.prayerTimes.sunrise,.prayerTimes.dhuhr,.prayerTimes.asr,.prayerTimes.maghrib,.prayerTimes.isha]|join(" ")' "$CAP/sa-$cap-1448.json")
  if [[ "$day" == "$yr" ]]; then verdict=AGREE; else verdict=DIFF; fi
  printf '%s\t%s\t%s\t%s\n' "$name" "$verdict" "$day" "$yr" >> "$OUT"
  echo "$name $verdict"
  sleep 1
done
echo "--- summary ---"
awk -F'\t' '{c[$2]++} END{for(k in c) print k, c[k]}' "$OUT"
