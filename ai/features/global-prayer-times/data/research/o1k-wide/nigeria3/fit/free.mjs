import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { Coordinates, CalculationMethod, PrayerTimes } = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');
const TZ='Africa/Lagos';
const f=(d)=>new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour:'2-digit',minute:'2-digit',hour12:false}).format(d);
const m=(s)=>{const[a,b]=s.split(':').map(Number);return a*60+b;};
const raw=JSON.parse(fs.readFileSync('captures/masjidway-10935-raw.json','utf8'));
const rows=[];
for(const days of Object.values(raw)) for(const [label,v] of Object.entries(days)){
  const d=new Date(label);
  rows.push({date:new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate(),12)),fajr:v[0],sunrise:v[1],isha:v[5]});
}
const coords=new Coordinates(9.0579,7.4951);
function score(fa,ia){
  const p=CalculationMethod.Other();p.fajrAngle=fa;p.ishaAngle=ia;
  let s=0;
  for(const r of rows){
    const pt=new PrayerTimes(coords,r.date,p);
    const a=m(f(pt.fajr))-m(r.fajr), b=m(f(pt.isha))-m(r.isha), c=m(f(pt.sunrise))-m(r.sunrise);
    s+=a*a+b*b+c*c;
  }
  return Math.sqrt(s/(rows.length*3));
}
let best=[99,0,0];
for(let fa=13;fa<=21.001;fa+=0.25) for(let ia=13;ia<=20.001;ia+=0.25){
  const v=score(fa,ia); if(v<best[0]) best=[v,fa,ia];
}
let [v0,fa0,ia0]=best;
for(let fa=fa0-0.25;fa<=fa0+0.2501;fa+=0.05) for(let ia=ia0-0.25;ia<=ia0+0.2501;ia+=0.05){
  const v=score(fa,ia); if(v<best[0]) best=[v,fa,ia];
}
console.log(`FREE fit (coords 9.0579,7.4951 fixed): fajr ${best[1].toFixed(2)} isha ${best[2].toFixed(2)} RMSE ${best[0].toFixed(3)} min over ${rows.length} rows (fajr,isha,sunrise)`);
