#!/bin/zsh
# Tajikistan Shuroi Ulamo month endpoint: 24-month spread (Jan + Jul, 2015..2026).
# Live passes first; banked raw captures from the same endpoint fill any month the
# live route declines.
set -u
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
W="$HOME/athan-gitree/census/o1k-wide/deep2"
BANK="$HOME/athan-gitree/census/o1k-wide/centralasia2/captures/tj-months"
mkdir -p "$W/captures/tj-months"
: > "$W/captures/tj-provenance.txt"

echo "/* target list */" > /dev/null
for pass in 1 2 3; do
  for y in 2015 2016 2017 2018 2019 2020 2021 2022 2023 2024 2025 2026; do
    for m in 01 07; do
      out="$W/captures/tj-months/tj-ntime-$y-$m.html"
      [ -s "$out" ] && continue
      curl -sS -A "$UA" --max-time 30 -X POST \
        -H "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" \
        -H "X-Requested-With: XMLHttpRequest" \
        --data "fmonth=$((10#$m))&fyear=$y&fday=0" \
        "https://shuroiulamo.tj/tj/namaz/ntime" -o "$out.tmp"
      if [ "$(wc -c < "$out.tmp" | tr -d ' ')" -gt 100 ]; then
        mv "$out.tmp" "$out"
        echo "live $y-$m" >> "$W/captures/tj-provenance.txt"
      else
        rm -f "$out.tmp"
      fi
      sleep 1
    done
  done
  echo "pass $pass done: $(ls "$W/captures/tj-months" | wc -l | tr -d ' ') live months"
  sleep 5
done

for y in 2015 2016 2017 2018 2019 2020 2021 2022 2023 2024 2025 2026; do
  for m in 01 07; do
    out="$W/captures/tj-months/tj-ntime-$y-$m.html"
    if [ ! -s "$out" ]; then
      cp "$BANK/tj-ntime-$y-$m.html" "$out"
      echo "banked $y-$m" >> "$W/captures/tj-provenance.txt"
    fi
  done
done
sort -k2 "$W/captures/tj-provenance.txt" | awk '{print $1}' | sort | uniq -c
