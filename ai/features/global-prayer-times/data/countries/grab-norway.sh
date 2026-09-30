#!/bin/sh
# R9: pull Islamsk Rad Norge's own unified Norwegian year for one municipality from
# bonnetid.no, the public face of IRN's `Felles bonnetid` project.
#
# The page is a React app with no `<table>` element; the grid is nested divs.
# api.bonnetid.no rejects a bare fetch with "Authentication credentials were not
# provided", so the rendered page is the only keyless path.
#
# Column positions MUST be preserved rather than read off innerText, because IRN
# leaves the `Morgengry 16` and `Kveldsgry 15` cells BLANK in summer while still
# printing Fajr and Isha. Reading innerText collapses the blanks and destroys exactly
# the fact this report is looking for, so the row's child cells are read directly.
#
# IRN's own 13 headers: Dato, Dag, Morgengry 16, Fajr, Fajr slutt, Duhr, Asr,
# 1x-skygge, 2x-skygge, Maghrib, Isha, Kveldsgry 15, Midnatt. IRN prints BOTH Asr
# columns and names BOTH twilight angles in its own headers.
#
# Usage: grab-norway.sh <output.tsv>
set -e
OUT="${1:-no-oslo-2026.tsv}"
: > "$OUT"
agent-browser open "https://bonnetid.no/" >/dev/null 2>&1
sleep 5
for M in JANUAR FEBRUAR MARCH APRIL MAI JUNI JULI AUGUST SEPTEMBER OKTOBER NOVEMBER DESEMBER; do
  agent-browser find text "$M" click >/dev/null 2>&1 || true
  sleep 3
  agent-browser eval "(() => {
    const rows = [...document.querySelectorAll('div')].filter(
      e => e.innerText && /^\d{2}\.\d{2}\n/.test(e.innerText) && e.innerText.length < 130);
    return rows.map(r => [...r.children].map(c => c.textContent.trim()).filter((_, i) => i > 0).join('\t')).join('\n');
  })()" 2>/dev/null \
    | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>process.stdout.write(JSON.parse(s)+'\n'))" \
    >> "$OUT"
done
grep -E '^[0-9]{2}\.[0-9]{2}' "$OUT" | sort -u -o "$OUT"
wc -l "$OUT"
