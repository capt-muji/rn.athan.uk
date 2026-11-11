import fs from 'node:fs';
import { compute, PRAYERS, fitMargin } from './fitlib.mjs';
const raw=JSON.parse(fs.readFileSync('data/hr_vaktijaeu_2026.json','utf8'));
const C={zagreb:{lat:45.815,lon:15.9819},split:{lat:43.5081,lon:16.4402},rijeka:{lat:45.3271,lon:14.4422}};
function hm(s){const[h,m]=s.split(':').map(Number);return h*60+m;}
const out={};
for(const [city,rows] of Object.entries(raw)){
  const data=Object.keys(rows).sort().map(date=>({date,probe:Date.UTC(+date.slice(0,4),+date.slice(5,7)-1,+date.slice(8,10),12),want:Object.fromEntries(PRAYERS.map(p=>[p,hm(rows[date][p])]))}));
  const got=compute(data,{...C[city],tz:'Europe/Zagreb',fajr:18,isha:16,madhab:'shafi'});
  const r=got.map((g,i)=>({date:g.date,want:data[i].want,got:g.got}));
  const m={};
  for(const p of PRAYERS){const f=fitMargin(r,p);m[p]={m:f.margin,mode:f.mode,exact:f.exact,within1:f.within1,mae:+f.mae.toFixed(2),sd:+f.sd.toFixed(2),n:f.n};}
  out[city]={coords:C[city],rows:data.length,params:{fajr:18,isha:16,madhab:'shafi'},margins:m};
  console.log(city,data.length,'rows');
  for(const p of PRAYERS) console.log('  ',p.padEnd(8),'m',String(m[p].m).padStart(5),m[p].mode.padEnd(5),'exact',m[p].exact,'w1',m[p].within1,'mae',m[p].mae,'sd',m[p].sd);
}
fs.writeFileSync('data/hr_fit.json',JSON.stringify(out,null,1));
