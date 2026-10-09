#!/bin/sh
# R9: pull one Mawaqit mosque's own published annual calendar out of the page.
# Mawaqit renders the whole year into a `confData` object inside an inline script,
# so a browser is required; plain fetch returns a 650-byte shell.
#
# Usage: mawaqit-grab.sh <mosque-slug> <output.json>
set -e
agent-browser open "https://mawaqit.net/fr/m/$1" >/dev/null 2>&1
agent-browser eval "(() => {
  const s = [...document.querySelectorAll('script')].map(x => x.textContent).find(t => t && t.includes('confData'));
  if (!s) return 'NO_CONFDATA';
  const m = s.match(/confData\s*=\s*(\{[\s\S]*?\});/);
  const c = JSON.parse(m[1]);
  return JSON.stringify({ slug: '$1', name: c.name, lat: c.latitude, lng: c.longitude, tz: c.timezone,
    association: c.association, countryCode: c.countryCode, times: c.times, shuruq: c.shuruq,
    imsakNbMinBeforeFajr: c.imsakNbMinBeforeFajr, iqamaCalendar: c.iqamaCalendar, calendar: c.calendar });
})()" --json 2>/dev/null \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);process.stdout.write(j.data.result)})" \
  > "$2"
wc -c "$2"
