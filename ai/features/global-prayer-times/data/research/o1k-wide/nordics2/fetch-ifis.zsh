#!/bin/zsh
# Islamic Federation of Sweden (IF/IFiS) monthly table POST endpoint, in the browser session
# (the site is behind a JS challenge that blocks plain curl).
W="$HOME/athan-gitree/census/o1k-wide/nordics2"
export AGENT_BROWSER_SESSION=o1k-nordics2
city="${1:-Stockholm, SE}"
slug="${2:-stockholm}"
for m in 1 2 3 4 5 6 7 8 9 10 11 12 13; do
  out="$W/captures/se-ifis-$slug-2026-$(printf %02d $m).html"
  [ -s "$out" ] && continue
  agent-browser eval "(async()=>{const r=await fetch('https://www.islamiskaforbundet.se/wp-content/plugins/bonetider/Bonetider_Widget.php',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({ifis_bonetider_page_city:'$city',ifis_bonetider_page_month:'$m'})});return await r.text()})()" > "$out" 2>/dev/null
  echo "$slug m$m $(wc -c < "$out")"
  sleep 0.3
done
