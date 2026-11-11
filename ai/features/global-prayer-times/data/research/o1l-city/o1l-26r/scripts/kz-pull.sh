#!/bin/zsh
# usage: kz-pull.sh <lat> <lng> <tz> <label> <from> <to> <out>
lat="$1"; lng="$2"; tz="$3"; label="$4"; from="$5"; to="$6"; out="$7"
export AGENT_BROWSER_SESSION=o1l-26r
agent-browser eval "(()=>{
  prayTimes.getDst = function(){ return 0; };
  document.querySelector('.lat').value='$lat';
  document.querySelector('.lng').value='$lng';
  document.querySelector('.city-timezone').value='$tz';
  document.querySelector('.date-now').value='$from';
  document.querySelector('input[name=end-date]').value='$to';
  timesByPeriod([Number('$lat'),Number('$lng')], $tz, false);
  return 'rendered';
})()" >/dev/null 2>&1
agent-browser eval '(()=>{
  const t=document.querySelector(".namaz-table");
  const head=Array.from(t.querySelectorAll("thead th")).map(c=>c.textContent.trim());
  const rows=Array.from(t.querySelectorAll("tbody tr")).map(r=>Array.from(r.cells).map(c=>c.textContent.trim())).filter(r=>r.length===7);
  return JSON.stringify({label:"'"$label"'", lat:"'"$lat"'", lng:"'"$lng"'", tz:"'"$tz"'", header:head, rows:rows});
})()' > "$out.raw" 2>/dev/null
python3 - "$out" <<'PY'
import json,sys
p=sys.argv[1]
raw=open(p+'.raw').read().strip()
d=json.loads(json.loads(raw))
json.dump(d,open(p,'w'),ensure_ascii=False)
print(d['label'], d['lat'], d['lng'], 'tz'+d['tz'], len(d['rows']), 'rows', d['rows'][0] if d['rows'] else '', d['rows'][-1] if d['rows'] else '')
PY
