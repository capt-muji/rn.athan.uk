#!/bin/zsh
# Al-Ojeiri calendar, one GET per day of 2026 (the only year it serves; 2027+ falls back to today).
set -u
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
CAP="$HOME/athan-gitree/census/o1l-city/mideast-cities/captures/kw-days"
mkdir -p "$CAP"
d=2026-01-01
while [[ "$d" < "2027-01-01" ]]; do
  out="$CAP/kw-alojeiri-$d.html"
  if [[ ! -s "$out" ]]; then
    curl -sS -A "$UA" --max-time 60 -o "$out" "https://alojeiri.com/en/ojeiri-calendar?date=$d"
  fi
  d=$(date -j -v+1d -f "%Y-%m-%d" "$d" "+%Y-%m-%d")
  sleep 0.2
done
ls "$CAP" | wc -l
