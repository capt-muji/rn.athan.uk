#!/bin/zsh
# federal AWQAF feed: POST SSO -> Bearer -> GET range
set -e
W=$HOME/athan-gitree/census/o1l-city/uae-cities
TOK=$(curl -s -X POST 'https://mobileappapi.awqaf.gov.ae/APIS/v3/sso/StartRequest?lang=en' \
  -H 'Origin: https://www.awqaf.gov.ae' -H 'Content-Type: application/json' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' \
  -d '{}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["clientAccessToken"])')
echo "$TOK" > "$W/captures/federal-token.txt"
for E in 1 2 3 4 5 6 7; do
  curl -s "https://mobileappapi.awqaf.gov.ae/APIS/v3/prayer-time/$E?lang=en" \
    -H "Authorization: Bearer $TOK" -H 'Origin: https://www.awqaf.gov.ae' \
    -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' \
    -o "$W/captures/federal-areas-emirate$E.json"
  echo "emirate $E: $(wc -c < "$W/captures/federal-areas-emirate$E.json") bytes"
done
curl -s "https://mobileappapi.awqaf.gov.ae/APIS/v3/prayer-time/prayertimes/2026-11-01/2026-11-30" \
  -H "Authorization: Bearer $TOK" -H 'Origin: https://www.awqaf.gov.ae' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' \
  -o "$W/captures/federal-2026-11.json"
echo "nov2026: $(wc -c < "$W/captures/federal-2026-11.json") bytes"
