#!/bin/sh
# R9: pull the Tunisian Institut National de la Meteorologie's own published day view
# for several governorates. R5 established that Tunisia's prayer times are a
# METEOROLOGICAL-SERVICE product under the Ministry of Transport, not a religious
# ministry one, and that the table would not render through tinyfish.
#
# The page is a Drupal form with two selects, `edit-gouvernorat` and `edit-delegation`.
# It prints FIVE rows only: AL SOBH, AL DHOHR, AL ASR, AL MAGHREB, AL ICHA. There is
# no sunrise row at all, which is itself a finding.
set -e
OUT="${1:-tn-governorates-2026-09-30.tsv}"
: > "$OUT"
agent-browser open "https://www.meteo.tn/fr/heures-prieres" >/dev/null 2>&1
sleep 3
# gouvernorat option values read off the page's own select
for G in "342:Tunis" "361:Bizerte" "347:Gabes" "359:Sfax" "351:Tataouine" "357:Kairouan" "365:Gafsa"; do
  ID=$(echo "$G" | cut -d: -f1)
  NAME=$(echo "$G" | cut -d: -f2)
  [ "$ID" = "npm" ] && continue
  agent-browser select "#edit-gouvernorat" "$ID" >/dev/null 2>&1 || continue
  sleep 3
  agent-browser eval "(() => {
    const b = document.body.innerText;
    const m = b.match(/AL SOBH[^A]*?(\d{2}:\d{2})[\s\S]{0,60}?AL DHOHR[^\d]*(\d{2}:\d{2})[\s\S]{0,60}?AL ASR[^\d]*(\d{2}:\d{2})[\s\S]{0,60}?AL MAGHREB[^\d]*(\d{2}:\d{2})[\s\S]{0,60}?AL ICHA[^\d]*(\d{2}:\d{2})/);
    return m ? m.slice(1).join('\t') : 'NONE';
  })()" 2>/dev/null \
    | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const v=JSON.parse(s); if(v!=='NONE')console.log('$NAME\t'+v)})" >> "$OUT"
done
cat "$OUT"
