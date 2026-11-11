#!/usr/bin/env zsh
# Probe one domain: dpt year feed, else homepage platform signals.
# args: domain metro state
d=$1; metro=$2; st=$3
cd "$HOME/athan-gitree/census/o1l-city/us-unresolved"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
f="captures/dpt_${d}.json"
code=$(curl -sSL -m 20 -A "$UA" "https://$d/?rest_route=/dpt/v1/prayertime&filter=year" -o "$f" -w "%{http_code}" 2>/dev/null)
head24=$(head -c 12 "$f" 2>/dev/null)
if [ "$code" = "200" ] && [ "${head24:0:4}" = '[[{"' ]; then
  n=$(python3 -c "import json;print(len(json.load(open('$f'))))" 2>/dev/null)
  printf "%s\t%s\t%s\tHIT_Dpt\trows=%s size=%s\n" "$d" "$metro" "$st" "$n" "$(wc -c < "$f" | tr -d ' ')"
  exit 0
fi
rm -f "$f"
h="captures/home_${d}.html"
curl -sSL -m 20 -A "$UA" "https://$d/" -o "$h" -w "" 2>/dev/null
mid=$(grep -oE 'masjid_id=[A-Za-z0-9]+' "$h" 2>/dev/null | head -1)
mab=$(grep -oE 'masjidbox\.com/prayer-times/[a-zA-Z0-9%_.()+-]+' "$h" 2>/dev/null | head -1)
mwq=$(grep -oE 'mawaqit\.net/[a-zA-Z/0-9%_.-]+' "$h" 2>/dev/null | head -1)
moh=$(grep -oE 'mohid\.co/[a-z/0-9._-]+' "$h" 2>/dev/null | head -1)
apt=$(grep -oE 'athanplus\.com/[a-zA-Z0-9/?=&_.-]+' "$h" 2>/dev/null | head -1)
slm=$(grep -oE 'salattimes\.com/[a-zA-Z0-9/?=&_.-]+' "$h" 2>/dev/null | head -1)
prt=$(grep -oiE 'href="[^"]*prayer[^"]*"' "$h" 2>/dev/null | head -2 | tr '\n' ' ')
printf "%s\t%s\t%s\tmiss\tHTTP %s %s %s %s %s %s %s %s\n" "$d" "$metro" "$st" "$code" "$mid" "$mab" "$mwq" "$moh" "$apt" "$slm" "$prt"
