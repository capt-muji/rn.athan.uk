#!/usr/bin/env bash
# Fetch the USNO's whole-year ASTRONOMICAL TWILIGHT table for the 20 fixture
# cities. This is Layer 2 of the verification suite and it is the single most
# valuable thing here.
#
# Astronomical twilight is the sun's centre at -18 degrees, which is NUMERICALLY
# the MWL and Karachi Fajr angle and the Karachi Isha angle. So the USNO,
# a government body with no opinion about prayer, publishes the exact quantity
# an 18-degree Fajr solver must produce, for every day of a year, at any
# coordinate. It also prints `////` on days where no solution exists, which
# means it independently confirms the no-solution day COUNTS that R7 Part 2
# computed.
#
# The JSON API (`/api/rstt/oneday`) publishes only CIVIL twilight (-6). The
# whole-year form at `/calculated/rstt/year` takes `task=4` for astronomical,
# `task=3` nautical, `task=2` civil, `task=0` sunrise/sunset. The option list is
# read from the form at `https://aa.usno.navy.mil/data/RS_OneYear`.
#
# Terms: US Government work, not subject to domestic copyright. The `ID`
# parameter is requested by the USNO for unique-user counting only.
#
# Output: ./usno_year/<city>_<task>.html, the raw response committed verbatim,
# plus a log. One request per city per task, 2 s apart, because a whole year is
# a heavier computation than one day.
set -euo pipefail

OUT="${1:-./usno_year}"
ID="athanres"
YEAR=2026
mkdir -p "$OUT"
LOG="$OUT/fetch.log"
: >"$LOG"

# 0 sunrise/sunset, 2 civil (-6), 3 nautical (-12), 4 astronomical (-18).
TASKS=(0 2 3 4)

CITIES=(
  "London 51.5074 -0.1278"
  "Makkah 21.4225 39.8262"
  "Jakarta -6.2088 106.8456"
  "Istanbul 41.0082 28.9784"
  "Karachi 24.8607 67.0011"
  "Lagos 6.5244 3.3792"
  "NewYork 40.7128 -74.0060"
  "SaoPaulo -23.5505 -46.6333"
  "CapeTown -33.9249 18.4241"
  "KualaLumpur 3.1390 101.6869"
  "Dhaka 23.8103 90.4125"
  "Cairo 30.0444 31.2357"
  "Oslo 59.9139 10.7522"
  "Reykjavik 64.1466 -21.9426"
  "Tromso 69.6492 18.9553"
  "Singapore 1.3521 103.8198"
  "Dubai 25.2048 55.2708"
  "Casablanca 33.5731 -7.5898"
  "Tashkent 41.2995 69.2401"
  "Anchorage 61.2181 -149.9003"
)

for entry in "${CITIES[@]}"; do
  read -r name lat lon <<<"$entry"
  for task in "${TASKS[@]}"; do
    f="$OUT/${name}_task${task}.html"
    [ -s "$f" ] && continue
    url="https://aa.usno.navy.mil/calculated/rstt/year?ID=${ID}&year=${YEAR}&task=${task}&lat=${lat}&lon=${lon}&label=${name}&tz=0&tz_sign=1&submit=Get+Data"
    code=$(curl -s -o "$f" -w '%{http_code}' "$url")
    printf '%s\t%s\t%s\n' "$(date -u +%FT%TZ)" "$code" "$url" >>"$LOG"
    sleep 2
  done
done

echo "fetched $(ls -1 "$OUT"/*_task*.html 2>/dev/null | wc -l) files; log at $LOG"
