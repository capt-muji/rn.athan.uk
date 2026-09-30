#!/usr/bin/env bash
# Fetch the US Naval Observatory fixture set for R7's verification suite.
#
# Extends R3's `data/libraries/usno_fetch.sh` from 10 cities x 12 dates to 20
# cities x 20 dates, which is the suite R3 designed in its Part 3 and did not
# build. Its harness traps are carried forward into `verify.mjs`, not here.
#
# Service: https://aa.usno.navy.mil/api/rstt/oneday, API v4.0.1. The response
# carries sunrise, sunset, upper transit and civil, nautical and ASTRONOMICAL
# twilight. Astronomical twilight is -18 degrees, which is numerically the MWL
# and Karachi Fajr angle, so those rows verify the Fajr solver against a
# government source.
#
# Terms: US Government work, not subject to domestic copyright, so the response
# JSON is committed verbatim. The `ID` parameter is requested by the USNO so
# they can count unique users; it is not authentication and carries no secret.
#
# One request per city per date, spaced 1.2 s apart, because the USNO publishes
# no rate limit.
#
# Output: ./usno/usno_<city>_<date>.json plus a log of every URL and status.
set -euo pipefail

OUT="${1:-./usno}"
ID="athanres"
mkdir -p "$OUT"
LOG="$OUT/fetch.log"
: >"$LOG"

# 20 dates. The four cardinal dates; the two equation-of-time extremes
# praytimes.org documents (2026-02-11 at -14m06s and 2026-11-03 at +16m33s);
# the EU, UK, US and southern-hemisphere DST transition days; and the day AFTER
# each of those, because west of about 120 degrees longitude a UTC day's sunset
# falls on the FOLLOWING UTC day and the checker needs that row to pair a sunset
# with the sunrise it actually follows. That is R3's harness trap 1 and the
# reason this list is not simply 20 dates spread through the year.
DATES=(
  2026-03-20 2026-03-21
  2026-06-21 2026-06-22
  2026-09-22 2026-09-23
  2026-12-21 2026-12-22
  2026-02-11 2026-02-12
  2026-11-03 2026-11-04
  2026-03-29 2026-03-30
  2026-10-25 2026-10-26
  2026-04-05 2026-04-06
  2026-08-15 2026-08-16
)

# name lat lon. The 20 cities of R3's `cities.json`, which already span the
# equator to 69.6N, both hemispheres, the half-hour zones (Dhaka +6, Karachi
# +5), the DST-anomaly zones wave 1 identified (Cairo, Casablanca) and the
# polar circle.
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
  for date in "${DATES[@]}"; do
    f="$OUT/usno_${name}_${date}.json"
    [ -s "$f" ] && continue
    url="https://aa.usno.navy.mil/api/rstt/oneday?date=${date}&coords=${lat},${lon}&tz=0&ID=${ID}"
    code=$(curl -s -o "$f" -w '%{http_code}' "$url")
    printf '%s\t%s\t%s\n' "$(date -u +%FT%TZ)" "$code" "$url" >>"$LOG"
    sleep 1.2
  done
done

echo "fetched $(ls -1 "$OUT"/usno_*.json 2>/dev/null | wc -l) files; log at $LOG"
