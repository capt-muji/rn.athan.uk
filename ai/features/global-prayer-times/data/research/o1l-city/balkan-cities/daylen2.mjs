import fs from 'node:fs';
import { loadRows, compute } from './fitlib.mjs';
const TZ='Europe/Sarajevo';
const coords=JSON.parse(fs.readFileSync('data/ba_coords.json','utf8'));
const index=JSON.parse(fs.readFileSync('data/ba_cities_index.json','utf8'));
const out=[];
for(const id of Object.keys(index).map(Number)){
  const meta=index[id], c=coords[id];
  const all=loadRows('data/'+meta.file);
  const data=all.filter(d=>['2026-06-21','2026-12-21','2026-03-21'].includes(d.date));
  const rows=compute(data,{lat:c.lat,lon:c.lon,tz:TZ,fajr:18,isha:16,madhab:'shafi'});
  const o={place:meta.place,lat:c.lat};
  for(const r of rows){
    const k=r.date.slice(5,7);
    o['pub'+k]=+(r.want.maghrib-r.want.sunrise).toFixed(1);
    o['true'+k]=+(r.got.maghrib-r.got.sunrise).toFixed(1);
  }
  out.push(o);
}
fs.writeFileSync('data/ba_daylen.json',JSON.stringify(out,null,1));
function reg(xs,ys){const n=xs.length;const mx=xs.reduce((a,b)=>a+b,0)/n,my=ys.reduce((a,b)=>a+b,0)/n;let sxy=0,sxx=0,syy=0;for(let i=0;i<n;i++){sxy+=(xs[i]-mx)*(ys[i]-my);sxx+=(xs[i]-mx)**2;syy+=(ys[i]-my)**2;}const b=sxy/sxx;return{slope:+b.toFixed(3),intercept:+(my-b*mx).toFixed(1),r2:+((sxy*sxy)/(sxx*syy)).toFixed(3)};}
for(const m of ['06','12','03']){
  const p=out.map(o=>o['pub'+m]), t=out.map(o=>o['true'+m]);
  console.log(m,'pub spread',(Math.max(...p)-Math.min(...p)).toFixed(1),'true spread',(Math.max(...t)-Math.min(...t)).toFixed(1),
    'mean offset',(p.reduce((a,b)=>a+b,0)/p.length-t.reduce((a,b)=>a+b,0)/t.length).toFixed(1),
    'reg',JSON.stringify(reg(t,p)));
}
