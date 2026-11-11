#!/bin/zsh
# Felags muslima a Islandi aladhan-format API, one line per day per city.
W="$HOME/athan-gitree/census/o1k-wide/nordics2"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0 Safari/537.36"
year=$1
OUT="$W/captures/is-felagmuslima-$year.jsonl"
: > "$OUT"
d="$year-01-01"
end="$((year+1))-01-01"
while [ "$(date -j -f "%Y-%m-%d" "$d" +%s)" -lt "$(date -j -f "%Y-%m-%d" "$end" +%s)" ]; do
  for city in Reykjavik Akureyri; do
    printf '%s\n' "$(curl -sS -A "$UA" --max-time 20 "https://felagmuslima.is/api/prayer-times?city=$city&date=$d")" >> "$OUT"
  done
  d=$(date -j -v+1d -f "%Y-%m-%d" "$d" +%Y-%m-%d)
done
echo "ICELAND-$year $(wc -l < "$OUT") lines"
