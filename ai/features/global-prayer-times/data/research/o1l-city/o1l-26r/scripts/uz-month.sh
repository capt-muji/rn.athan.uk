#!/bin/zsh
# usage: uz-month.sh <cityName> <outfile>
city="$1"; out="$2"
export AGENT_BROWSER_SESSION=o1l-26r
for attempt in 1 2 3 4; do
  agent-browser eval "document.querySelector('.taqvim-city-btn').click(); 'open'" >/dev/null 2>&1
  sleep 1
  agent-browser eval "(()=>{
    const d=document.querySelector('.taqvim-city-dropdown');
    const el=[...d.querySelectorAll('*')].filter(e=>e.children.length===0 && e.textContent.trim()==='$city')[0];
    if(!el) return 'NOITEM';
    el.click(); return 'ok';
  })()" >/dev/null 2>&1
  sleep 3
  got=$(agent-browser eval "(document.querySelector('.taqvim-city-btn')||{}).textContent" 2>/dev/null | tail -1 | tr -d '"')
  [[ "$got" == "$city" ]] && break
done
agent-browser eval "(()=>{
  const t=document.querySelector('table');
  const hd=document.body.innerText.slice(0,200);
  return JSON.stringify({
    city: (document.querySelector('.taqvim-city-btn')||{}).textContent,
    header: Array.from(t.querySelectorAll('thead th')).map(c=>c.textContent.trim()),
    monthLine: hd.split('\n').filter(x=>x.includes('йил')).slice(0,1),
    rows: Array.from(t.querySelectorAll('tbody tr')).map(r=>Array.from(r.cells).map(c=>c.textContent.trim()))
  });
})()" > "$out.raw" 2>/dev/null
python3 - "$out" <<'PY'
import json,sys
p=sys.argv[1]
d=json.loads(json.loads(open(p+'.raw').read().strip()))
json.dump(d,open(p,'w'),ensure_ascii=False)
print(d['city'], len(d['rows']), 'rows', d['rows'][0] if d['rows'] else '')
PY
