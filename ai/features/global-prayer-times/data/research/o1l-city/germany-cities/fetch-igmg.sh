#!/bin/bash
# IGMG prayer-calendar API capture: per city, the today payload (carries the
# publisher's own sun lat/lon) and every month the API serves (2026-10..2027-11).
set -u
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
BASE='https://www.igmg.org/wp-json/igmg-gebetszeiten/v1'
MONTHS=$(python3 -c "
y,m=2026,10
out=[]
for _ in range(14):
    out.append(f'{y}-{m:02d}')
    m+=1
    if m==13: y,m=y+1,1
print(' '.join(out))")

while IFS=':' read -r tag id; do
  [ -z "$tag" ] && continue
  code=$(curl -s -A "$UA" -o "captures/igmg-times-$tag.json" -w '%{http_code}' "$BASE/times?city=$id&lang=de")
  echo "times $tag $code"
  for mo in $MONTHS; do
    out="captures/igmg-$tag-$mo.json"
    [ -s "$out" ] && continue
    c=$(curl -s -A "$UA" -o "$out" -w '%{http_code}' "$BASE/month?city=$id&month=$mo&lang=de")
    [ "$c" != "200" ] && echo "  MISS $tag $mo $c"
  done
done < cities.tsv
echo done
