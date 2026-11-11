#!/bin/zsh
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
CAP="$HOME/athan-gitree/census/o1k-wide/centralasia2/captures"
mkdir -p "$CAP/tj-months"
python3 - > /tmp/tjlist.$$ <<'PY'
import datetime
y,m=2014,12
while (y,m)<=(2026,11):
    print(f"{y}-{m:02d}")
    m+=1
    if m==13: y,m=y+1,1
PY
while read -r ym; do
  y=${ym%%-*}; m=${ym##*-}
  out="$CAP/tj-months/tj-ntime-$ym.html"
  if [ -s "$out" ] && [ "$(wc -c < "$out")" -gt 100 ]; then continue; fi
  curl -sS -A "$UA" --max-time 30 -X POST -H "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" -H "X-Requested-With: XMLHttpRequest" --data "fmonth=$m&fyear=$y&fday=0" "https://shuroiulamo.tj/tj/namaz/ntime" -o "$out"
  printf "%s %s\n" "$ym" "$(wc -c < "$out" | tr -d ' ')"
done < /tmp/tjlist.$$
rm -f /tmp/tjlist.$$
