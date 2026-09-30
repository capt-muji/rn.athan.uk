#!/bin/bash
# R4: fetch one gzipped year per (city, AlAdhan method) into a cache directory.
# Polite: one request at a time, 2 s apart. Run outside the app repo; the cache is not committed.
# usage: ./fetch-years.sh <cache-dir>
set -u
cache="${1:-/tmp/athan-r4-trust/cache}"
mkdir -p "$cache"

while read -r city mid lat lon; do
  [ -z "$city" ] && continue
  f="$cache/aladhan_${city}_${mid}_2026.json"
  if [ -s "$f" ]; then echo "cached  $city m$mid"; continue; fi
  curl -sS --compressed --max-time 40 -A 'athan-research/1.0' -o "$f" \
    -w "$city m$mid %{http_code} %{size_download} %{time_total}\n" \
    "https://api.aladhan.com/v1/calendar/2026?latitude=${lat}&longitude=${lon}&method=${mid}"
  sleep 2
done <<'SPECS'
London 3 51.5072 -0.1276
London 2 51.5072 -0.1276
London 15 51.5072 -0.1276
London 5 51.5072 -0.1276
London 13 51.5072 -0.1276
Jakarta 20 -6.2088 106.8456
Jakarta 3 -6.2088 106.8456
Makkah 4 21.4225 39.8262
KualaLumpur 17 3.1390 101.6869
Istanbul 13 41.0082 28.9784
Singapore 11 1.3521 103.8198
Oslo 3 59.9139 10.7522
Oslo 15 59.9139 10.7522
NewYork 2 40.7128 -74.0060
Karachi 1 24.8607 67.0011
SPECS
