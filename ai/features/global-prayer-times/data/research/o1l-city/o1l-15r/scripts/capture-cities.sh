#!/bin/zsh
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"
while IFS='|' read -r slug name json; do
  id=$(echo "$json" | python3 -c "import json,sys;print(json.load(sys.stdin)['IlceId'])")
  f="captures/tr-2026-${slug}-${id}.html"
  if [[ -s "$f" ]]; then echo "skip $slug"; continue; fi
  code=$(curl -sSL -A "$UA" -o "$f" -w "%{http_code}" --max-time 60 "https://namazvakitleri.diyanet.gov.tr/tr-TR/$id")
  t=$(grep -o '<title>[^<]*</title>' "$f" | head -1)
  rows=$(grep -c '<tr' "$f")
  echo "$slug $id $code $(wc -c <"$f" | tr -d ' ') $rows $t"
  sleep 1
done < captures/ilce-resolve.txt
