import {rows2026} from './fit.mjs';
import fs from 'fs';
const files=fs.readdirSync('captures').filter(f=>f.startsWith('mawaqit-bd-'));
for(const f of files){
  const t=fs.readFileSync('captures/'+f,'utf8');
  const d=JSON.parse(t.match(/let confData = (\{[\s\S]*?\});/)[1]);
  const rows=rows2026(d);
  const out={};
  for(const r of rows){
    const [fa,sh,dh,as,mg,is]=r.t;
    out[r.date]={fajr:fa,sunrise:sh,dhuhr:dh,asr:as,maghrib:mg,isha:is};
  }
  const slug=f.replace('mawaqit-bd-','').replace('.html','');
  const meta={source:'mawaqit',slug,name:d.name,label:d.label,lat:d.latitude,lon:d.longitude,tz:d.timezone,
    url:'https://mawaqit.net/en/'+slug,captured:'2026-11-11',tier:'community',rows:Object.keys(out).length};
  fs.writeFileSync(`data/${slug}.json`,JSON.stringify({meta,days:out},null,1));
  fs.writeFileSync(`data/${slug}.meta.json`,JSON.stringify(meta,null,1));
  console.log(slug,Object.keys(out).length);
}
