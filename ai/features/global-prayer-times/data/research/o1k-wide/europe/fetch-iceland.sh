#!/bin/zsh
W="$HOME/athan-gitree/census/o1k-wide/europe"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36"
OUT="$W/captures/is-felagmuslima-2025.jsonl"
: > "$OUT"
d="2025-01-01"
end_ts=$(gdate -d "2026-01-01" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "2026-01-01" +%s)
while [ "$(date -j -f "%Y-%m-%d" "$d" +%s)" -lt "$end_ts" ]; do
  for city in Reykjavik Akureyri; do
    curl -s -A "$UA" --max-time 20 "https://felagmuslima.is/api/prayer-times?city=$city&date=$d" >> "$OUT"
    echo "" >> "$OUT"
    sleep 0.25
  done
  d=$(date -j -v+1d -f "%Y-%m-%d" "$d" +%Y-%m-%d)
done
echo "ICELAND-CAPTURE-DONE $(wc -l < "$OUT")"
