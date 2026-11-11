#!/bin/zsh
# Renders eestiislamikeskus.org for one city/month/year in the browser and prints the table text.
export AGENT_BROWSER_SESSION=o1k-nordics2
city=$1; month=$2; year=$3
agent-browser eval "(()=>{const c=document.querySelector('#citySelect');c.value='$city';c.dispatchEvent(new Event('change',{bubbles:true}));const m=document.querySelector('#monthSelect');m.value='$month';m.dispatchEvent(new Event('change',{bubbles:true}));const y=document.querySelector('#yearInput');y.value='$year';y.dispatchEvent(new Event('input',{bubbles:true}));y.dispatchEvent(new Event('change',{bubbles:true}));return 'set'})()" >/dev/null 2>&1
sleep 1.2
agent-browser eval "document.querySelector('table')?document.querySelector('table').innerText:'NO TABLE'" 2>/dev/null
