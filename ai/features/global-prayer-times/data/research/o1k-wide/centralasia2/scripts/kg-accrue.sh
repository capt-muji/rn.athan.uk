#!/bin/zsh
set -u
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
CAP="$HOME/athan-gitree/census/o1k-wide/centralasia2/captures"
year="$1"
for city in 1 2; do
  for i in 0 1 2 3 4 5; do
    start=$(date -j -f "%Y-%m-%d" "$year-01-01" "+%d-%m-%Y" 2>/dev/null)
    # compute window start/end with python for reliability
    read -r s e < <(python3 - "$year" "$i" <<'PY'
import sys,datetime
y=int(sys.argv[1]); i=int(sys.argv[2])
base=datetime.date(y,1,1)
s=base+datetime.timedelta(days=61*i)
e=min(base+datetime.timedelta(days=61*i+60), datetime.date(y,12,31))
print(s.strftime('%d-%m-%Y'), e.strftime('%d-%m-%Y'))
PY
)
    out="$CAP/kg-api-city$city-${s}-${e}.json"
    code=$(curl -sS -A "$UA" --max-time 40 -o "$out" -w "%{http_code}" "https://muftiyat.kg/ru/api/v1/calendar/$city/?start=$s&end=$e")
    n=$(jq -r '.prayertimes|length' "$out" 2>/dev/null)
    echo "city$city $s..$e http=$code rows=$n"
  done
done
