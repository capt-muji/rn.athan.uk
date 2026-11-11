#!/bin/zsh
# Bosnia/Sandžak/Montenegro year-fetch from the vaktija.ba v1 API.
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
cd "$(dirname "$0")/captures" || exit 1
YEAR=2026
IDS=(${@})
for id in $IDS; do
  out="ba_api_${id}_${YEAR}_year.json"
  [[ -s $out ]] && continue
  for try in $(seq 1 12); do
    code=$(curl -s -A "$UA" --max-time 60 -o "$out.part" -w "%{http_code}" "https://api.vaktija.ba/vaktija/v1/${id}/${YEAR}")
    if [[ $code == 200 ]]; then
      mv "$out.part" "$out"
      name=$(python3 -c "import json,sys;d=json.load(open('$out'));print(d.get('lokacija'))" 2>/dev/null || echo PARSEFAIL)
      echo "OK id=$id lokacija=$name bytes=$(wc -c <"$out")" | tee -a ../fetch_ba.log
      break
    fi
    echo "  retry $try http=$code id=$id" >> ../fetch_ba.log
    sleep 12
  done
  sleep 4
done
echo "DONE" | tee -a ../fetch_ba.log
