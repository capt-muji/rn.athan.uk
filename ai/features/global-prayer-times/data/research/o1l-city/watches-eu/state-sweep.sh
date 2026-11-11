#!/bin/zsh
# Sweep the state mufti takwim pages for a 2027 prayer table.
set -u
DIR="$HOME/athan-gitree/census/o1l-city/watches-eu"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
typeset -A P=(
  selangor "https://www.muftiselangor.gov.my/takwim-solat/"
  perak "https://mufti.perak.gov.my/"
  penang "https://mufti.penang.gov.my/"
  johor "https://mufti.johor.gov.my/perkhidmatan/muat-turun/jadual-takwim/"
  melaka "https://muftimelaka.gov.my/"
  wp "https://www.muftiwp.gov.my/"
  pahang "https://mufti.pahang.gov.my/"
  terengganu "https://mufti.terengganu.gov.my/"
  kelantan "https://muftikelantan.gov.my/"
  kedah "https://muftikedah.gov.my/"
  perlis "https://muftiperlis.gov.my/"
  sabah "https://www.muftisabah.gov.my/"
  sarawak "https://muftisarawak.gov.my/"
  sembilan "https://muftins.gov.my/"
)
for tag url in ${(kv)P}; do
  out="$DIR/captures/my-state-$tag.bin"
  code=$(curl -sS -L --max-time 30 -A "$UA" -o "$out" -w '%{http_code}' "$url" 2>/dev/null)
  n27=$(grep -o '2027' "$out" 2>/dev/null | wc -l | tr -d ' ')
  n26=$(grep -o '2026' "$out" 2>/dev/null | wc -l | tr -d ' ')
  print -r -- "$(date -u +%Y-%m-%dT%H:%M:%SZ)\tmy-state\t$tag\t$url\t$code\t2027:$n27\t2026:$n26" | tee -a "$DIR/probes.tsv"
done
