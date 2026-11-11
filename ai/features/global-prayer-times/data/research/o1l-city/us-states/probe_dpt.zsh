#!/usr/bin/env zsh
# O1l us-states dpt probe over candidate domains from the new metros.
cd "$HOME/athan-gitree/census/o1l-city/us-states"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
list="$1"; out="$2"
[ -f "$out" ] || printf "domain\tverdict\tdetail\n" > "$out"
while IFS= read -r d; do
  case "$d" in ""|\#*) continue;; esac
  f="captures/dpt_${d}.json"
  code=$(curl -sSL -m 20 -A "$UA" "https://$d/?rest_route=/dpt/v1/prayertime&filter=year" -o "$f" -w "%{http_code}" 2>/dev/null)
  head24=$(head -c 12 "$f" 2>/dev/null)
  if [ "$code" = "200" ] && [ "${head24:0:4}" = '[[{"' ]; then
    n=$(python3 -c "import json;print(len(json.load(open('$f'))))" 2>/dev/null)
    printf "%s\tHIT_Dpt\trows=%s size=%s\n" "$d" "$n" "$(wc -c < "$f" | tr -d ' ')" | tee -a "$out"
  else
    rm -f "$f"
    curl -sSL -m 15 -A "$UA" "https://$d/" -o "captures/home_${d}.html" -w "" 2>/dev/null
    mid=$(grep -oE 'masjid_id=[A-Za-z0-9]+' "captures/home_${d}.html" 2>/dev/null | head -1)
    mab=$(grep -oE 'masjidbox\.com/prayer-times/[a-zA-Z0-9%_.()-]+' "captures/home_${d}.html" 2>/dev/null | head -1)
    mwq=$(grep -oE 'mawaqit\.net/[a-zA-Z/0-9%_.-]+' "captures/home_${d}.html" 2>/dev/null | head -1)
    dpt=$(grep -oE 'daily-prayer-time[^"]*' "captures/home_${d}.html" 2>/dev/null | head -1)
    printf "%s\tmiss\tHTTP %s %s %s %s %s\n" "$d" "$code" "${mid:-}" "${mab:-}" "${mwq:-}" "${dpt:-}" | tee -a "$out"
  fi
  sleep 0.6
done < "$list"
