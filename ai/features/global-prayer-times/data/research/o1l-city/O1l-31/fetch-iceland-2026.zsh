#!/bin/zsh
# Felag muslima a Islandi API: one JSON per day per city, 2026.
W="$HOME/athan-gitree/census/o1l-city/O1l-31"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0 Safari/537.36"
mkdir -p "$W/captures/is-year"
for city in Keflavik Akranes Borgarnes Hofsos Husavik Hvolsvollur Hella Reykjavik Akureyri; do
  for i in $(seq 0 364); do
    d=$(date -j -v+${i}d -f "%Y-%m-%d" "2026-01-01" +%Y-%m-%d)
    out="$W/captures/is-year/is-$city-$d.json"
    [ -s "$out" ] && continue
    echo "$city $d"
  done
done | xargs -P 8 -n 2 sh -c 'curl -sS -A "'"$UA"'" --max-time 20 "https://felagmuslima.is/api/prayer-times?city=$0&date=$1" -o "'"$W"'/captures/is-year/is-$0-$1.json"'
echo "done $(ls $W/captures/is-year | wc -l)"
