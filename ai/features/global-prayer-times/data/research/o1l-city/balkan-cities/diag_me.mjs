import fs from 'node:fs';
import { loadRows, compute, PRAYERS } from './fitlib.mjs';
const data=loadRows('data/me_vaktijame_grp0_2026.json');
function sc(rows){let s=0;for(const p of PRAYERS){const r=rows.map(x=>x.want[p]-x.got[p]).filter(Number.isFinite);const m=r.reduce((a,b)=>a+b,0)/r.length;s+=Math.sqrt(r.reduce((a,b)=>a+(b-m)**2,0)/r.length);}return s/6;}
console.log('--- latitude sweep at 19.5/17.5, lon 19.2594 ---');
for(let lat=42.0;lat<=47.5;lat+=0.5){
  const rows=compute(data,{lat,lon:19.2594,tz:'Europe/Podgorica',fajr:19.5,isha:17.5,madhab:'shafi'});
  const per={};
  for(const p of PRAYERS){const r=rows.map(x=>x.want[p]-x.got[p]);per[p]=+(r.reduce((a,b)=>a+b,0)/r.length).toFixed(1);}
  console.log(lat.toFixed(1),'sc',sc(rows).toFixed(2),JSON.stringify(per));
}
console.log('--- monthly residuals at true point 42.4304 ---');
const rows=compute(data,{lat:42.4304,lon:19.2594,tz:'Europe/Podgorica',fajr:19.5,isha:17.5,madhab:'shafi'});
const bm={};
for(const r of rows){const m=r.date.slice(5,7);(bm[m]??=[]).push(r);}
for(const p of PRAYERS){
  const out=[];
  for(const m of Object.keys(bm).sort()){const rs=bm[m].map(x=>x.want[p]-x.got[p]);out.push(m+':'+(rs.reduce((a,b)=>a+b,0)/rs.length).toFixed(1));}
  console.log(' ',p.padEnd(8),out.join(' '));
}
