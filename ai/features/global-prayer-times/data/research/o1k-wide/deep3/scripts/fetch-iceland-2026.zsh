#!/bin/zsh
# Fetch the missing 2026 year from the felagmuslima API, one day per request,
# appended to a jsonl as it arrives.
set -u
OUT="$HOME/athan-gitree/census/o1k-wide/deep3/captures"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
for city in Reykjavik Akureyri; do
  FILE="$OUT/is-felagmuslima-${city}-2026.jsonl"
  : > "$FILE"
  d="2026-01-01"
  while [[ "$d" < "2027-01-01" ]]; do
    line=$(curl -s -m 20 -A "$UA" "https://felagmuslima.is/api/prayer-times?city=${city}&date=${d}")
    if [[ "$line" == *'"Fajr"'* ]]; then
      print -r -- "{\"$d\":$line}" >> "$FILE"
    else
      print -r -- "MISS $city $d $line" >> "$OUT/is-felagmuslima-2026-misses.log"
    fi
    d=$(date -j -v+1d -f "%Y-%m-%d" "$d" +%Y-%m-%d)
    sleep 0.2
  done
  print -r -- "$city $(wc -l < "$FILE") rows"
done
