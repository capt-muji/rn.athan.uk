#!/usr/bin/env bash
# Fetch USNO rise/set/transit/twilight fixtures for the R3 oracle comparison.
#
# Service: https://aa.usno.navy.mil/api/rstt/oneday, API v4.0.1. The `ID`
# parameter is requested by the USNO so they can count unique users; it is not
# authentication and carries no secret.
#
# One request per city per date. Requests are spaced 1.2 s apart, which is the
# same politeness interval the moonsighting wave used, because the USNO publishes
# no rate limit.
#
# Output: one JSON file per request under ./usno/, named
# usno_<city>_<date>.json, plus a log of every URL and HTTP status.
set -euo pipefail

OUT="${1:-./usno}"
ID="athanres"
mkdir -p "$OUT"
LOG="$OUT/fetch.log"
: >"$LOG"

# The four cardinal dates plus two mid-season dates, which is enough to catch a
# systematic bias without hammering a government service. The day after each is
# fetched too, because west of about 120 degrees longitude a UTC day's sunset
# falls on the FOLLOWING UTC day, and oracle.mjs needs that row to pair a sunset
# with the sunrise it actually follows.
DATES=(
  2026-03-20 2026-03-21
  2026-06-21 2026-06-22
  2026-09-22 2026-09-23
  2026-12-21 2026-12-22
  2026-02-11 2026-02-12
  2026-11-03 2026-11-04
)

# name lat lon
CITIES=(
  "London 51.5074 -0.1278"
  "Makkah 21.4225 39.8262"
  "Jakarta -6.2088 106.8456"
  "NewYork 40.7128 -74.0060"
  "CapeTown -33.9249 18.4241"
  "Singapore 1.3521 103.8198"
  "Oslo 59.9139 10.7522"
  "Reykjavik 64.1466 -21.9426"
  "Tromso 69.6492 18.9553"
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
