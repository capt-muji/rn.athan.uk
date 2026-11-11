import fs from 'node:fs';
import { compute, PRAYERS, fitMargin } from './fitlib.mjs';
const raw=JSON.parse(fs.readFileSync('data/eu_vaktijaeu_2026.json','utf8'));
const C={shkodra:{lat:42.06806,lon:19.51194,tz:'Europe/Tirane'},tirana:{lat:41.3275,lon:19.81833,tz:'Europe/Tirane'},
 skopje:{lat:42.013055,lon:21.438247,tz:'Europe/Skopje'},beograd:{lat:44.7866,lon:20.4489,tz:'Europe/Belgrade'},
 nis:{lat:43.3209,lon:21.8958,tz:'Europe/Belgrade'},podgorica:{lat:42.4304,lon:19.2594,tz:'Europe/Podgorica'}};
function hm(s){const[h,m]=s.split(':').map(Number);return h*60+m;}
const out={};
for(const [city,rows] of Object.entries(raw)){
  const data=Object.keys(rows).sort().map(date=>({date,probe:Date.UTC(+date.slice(0,4),+date.slice(5,7)-1,+date.slice(8,10),12),want:Object.fromEntries(PRAYERS.map(p=>[p,hm(rows[date][p])]))}));
  const got=compute(data,{lat:C[city].lat,lon:C[city].lon,tz:C[city].tz,fajr:18,isha:16,madhab:'shafi'});
  const r=got.map((g,i)=>({date:g.date,want:data[i].want,got:g.got}));
  const m={};
  for(const p of PRAYERS){const f=fitMargin(r,p);m[p]={m:f.margin,mode:f.mode,exact:f.exact,within1:f.within1,mae:+f.mae.toFixed(2),sd:+f.sd.toFixed(2),n:f.n};}
  const w=Object.values(m).reduce((a,x)=>a+x.within1,0), n=Object.values(m).reduce((a,x)=>a+x.n,0);
  out[city]={...C[city],rows:data.length,margins:m,within1:w,n};
  console.log(city,data.length,'rows  w1',w+'/'+n,' |',PRAYERS.map(p=>p[0]+' '+m[p].m+(m[p].mode[0])+' '+m[p].within1+'/'+m[p].n).join(' | '));
}
fs.writeFileSync('data/eu_fit.json',JSON.stringify(out,null,1));
