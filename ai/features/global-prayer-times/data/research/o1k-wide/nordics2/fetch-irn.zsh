#!/bin/zsh
# IRN (Islamsk Råd Norge) annual prayer times via the api.bonnetid.no month endpoint.
W="$HOME/athan-gitree/census/o1k-wide/nordics2"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
T="Api-Token: 92affaa6-0e9b-4402-8d8a-0fcd8d9e91ec"
for spec in "$@"; do
  pk="${spec%%:*}"; city="${spec##*:}"
  for year in 2026 2027; do
    for m in 1 2 3 4 5 6 7 8 9 10 11 12; do
      out="$W/captures/no-irn-$city-$year-$(printf %02d $m).json"
      [ -s "$out" ] && continue
      curl -sS -A "$UA" -H "$T" --max-time 25 \
        "https://api.bonnetid.no/prayertimes/$pk/$year/$m/" -o "$out" -w "$city $year-$m %{http_code} %{size_download}\n"
      sleep 0.2
    done
  done
done
