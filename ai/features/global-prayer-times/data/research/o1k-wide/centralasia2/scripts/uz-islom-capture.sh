#!/bin/zsh
export AGENT_BROWSER_SESSION=o1k-centralasia2
TZNAME="$1"
agent-browser close >/dev/null 2>&1
TZ=$TZNAME agent-browser open "https://islom.uz/" >/dev/null 2>&1
sleep 5
agent-browser eval "(() => { const t=document.body.innerText; const i=t.indexOf('Йил'); return t.slice(0,0); })()" >/dev/null 2>&1
DATE=$(agent-browser eval "(() => { const m=document.body.innerText.match(/20\d\d йил (\d+) (\S+), (\S+)/); return m? m[0] : 'nodate'; })()" 2>/dev/null | tail -1)
echo "TZ=$TZNAME date=$DATE"
for city in Тошкент Самарқанд Бухоро; do
  agent-browser eval "(() => { const b=document.querySelector('button.c-dropdown__toggle.media-info'); if(b) b.click(); return 1; })()" >/dev/null 2>&1
  sleep 1
  agent-browser eval "(() => { const els=[...document.querySelectorAll('li,span,div,a')].filter(e=>e.textContent.trim()==='$city' && e.children.length<=1); if(!els.length) return 'noitem'; els[els.length-1].click(); return 'ok'; })()" >/dev/null 2>&1
  sleep 2
  agent-browser eval "(() => { const t=document.body.innerText; const i=t.indexOf('Намоз вақтлари:'); return t.slice(i, i+180).replace(/\n+/g,'|'); })()" 2>/dev/null | tail -1
done
