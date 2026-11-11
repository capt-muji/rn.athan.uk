#!/bin/zsh
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
OUT="$HOME/athan-gitree/census/o1l-city/o1l-26r/data/az-baku-namaz-2026.csv"
echo "date,fajr,sunrise,dhuhr,asr,maghrib,isha" > "$OUT"
for m in 01 02 03 04 05 06 07 08 09 10 11 12; do
  for d in 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31; do
    html=$(curl -sSL -m 15 -A "$UA" "https://nam.az/baku/$m/$d")
    echo "$html" | python3 -c "
import sys,re
h=sys.stdin.read()
t=re.sub(r'<[^>]+>',' ',h); t=re.sub(r'\s+',' ',t)
m=re.search(r'(\d{2})\.(\d{2})\.(\d{4})',t)
v=re.findall(r'\b\d{2}:\d{2}\b',t)[:6]
if m and len(v)==6: print(f'{m.group(3)}-{m.group(2)}-{m.group(1)},'+','.join(v))
" >> "$OUT"
  done
done
wc -l < "$OUT"
