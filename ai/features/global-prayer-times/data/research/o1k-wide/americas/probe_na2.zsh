#!/usr/bin/env zsh
# O1k Americas dpt probe. HIT = HTTP 200 and the body opens with [[{"d_date".
# Also records a second signal: whether the homepage HTML carries a masjidal widget id.
cd "$HOME/athan-gitree/census/o1k-wide/americas"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
out="probe_na2.tsv"
[ -f "$out" ] || printf "domain\tverdict\tdetail\n" > "$out"
while IFS= read -r d; do
  case "$d" in ""|\#*) continue;; esac
  f="captures/dpt_${d}.json"
  code=$(curl -sSL -m 25 -A "$UA" "https://$d/?rest_route=/dpt/v1/prayertime&filter=year" -o "$f" -w "%{http_code}" 2>/dev/null)
  head24=$(head -c 12 "$f" 2>/dev/null)
  if [ "$code" = "200" ] && [ "${head24:0:4}" = '[[{"' ]; then
    n=$(python3 -c "import json;print(len(json.load(open('$f'))))" 2>/dev/null)
    printf "%s\tHIT_Dpt\trows=%s size=%s\n" "$d" "$n" "$(wc -c < "$f" | tr -d ' ')" | tee -a "$out"
  else
    rm -f "$f"
    # second signal: masjidal widget id in the homepage HTML
    curl -sSL -m 20 -A "$UA" "https://$d/" -o "captures/home_${d}.html" -w "" 2>/dev/null
    mid=$(grep -oE 'masjid_id=[A-Za-z0-9]+' "captures/home_${d}.html" 2>/dev/null | head -1)
    printf "%s\tmiss\tHTTP %s %s\n" "$d" "$code" "${mid:-}" | tee -a "$out"
    rm -f "captures/home_${d}.html"
  fi
  sleep 1
done < candidates_na2.txt
