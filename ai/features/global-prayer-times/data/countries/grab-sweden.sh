#!/bin/sh
# R9: pull the Islamiska Forbundet i Sverige (IFiS) published year for one Swedish city.
# The page at islamiskaforbundet.se/bonetider/ is a WordPress admin-ajax widget with two
# selects (`ifis_bonetider_page_months`, `ifis_bonetider_page_cities`) and one table.
# Nothing renders without a browser, so agent-browser drives it month by month.
#
# Usage: grab-sweden.sh "<City, SE>" <output.tsv>
set -e
CITY="$1"
OUT="$2"
: > "$OUT"
agent-browser open "https://www.islamiskaforbundet.se/bonetider/" >/dev/null 2>&1
agent-browser select "#ifis_bonetider_page_cities" "$CITY" >/dev/null 2>&1
sleep 2
for M in 1 2 3 4 5 6 7 8 9 10 11 12; do
  agent-browser select "#ifis_bonetider_page_months" "$M" >/dev/null 2>&1
  sleep 2
  agent-browser eval "document.querySelector('table').innerText" 2>/dev/null \
    | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
        const t=JSON.parse(s);
        for (const line of t.split('\n')) {
          const c=line.split('\t').map(x=>x.trim());
          if (c.length===7 && /^\d+$/.test(c[0])) console.log('$M\t'+c.join('\t'));
        }})" >> "$OUT"
done
wc -l "$OUT"
