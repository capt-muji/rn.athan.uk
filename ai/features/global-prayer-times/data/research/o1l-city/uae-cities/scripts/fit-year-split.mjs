import fs from 'fs';
import adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js';
const AREAS=JSON.parse(fs.readFileSync('data/areas.json','utf8'));
const EM={1:'Abu Dhabi',2:'Dubai',3:'Sharjah',4:'Ajman',5:'Umm Al Quwain',6:'Ras Al Khaimah',7:'Fujairah'};
const P=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const FIELD={fajr:'fajr',sunrise:'shurooq',dhuhr:'zuhr',asr:'asr',maghrib:'maghrib',isha:'isha'};
const RECORD={fajr:0,sunrise:-3,dhuhr:2,asr:0,maghrib:2,isha:-1};
let rows=[];
for(const f of process.argv.slice(2)) rows.push(...(JSON.parse(fs.readFileSync(f,'utf8')).prayerData||[]));
const areaById=new Map(AREAS.map(a=>[a.cityID,a]));
function params(){const p=new adhan.CalculationParameters('Other',18.2,18.2);p.madhab=adhan.Madhab.Shafi;p.highLatitudeRule=adhan.HighLatitudeRule.MiddleOfTheNight;p.adjustments={...RECORD};p.rounding=adhan.Rounding.None;return p;}
const cache=new Map();
function pred(date,lat,lon){const k=lat+'|'+lon+'|'+date;const c=cache.get(k);if(c)return c;const [y,m,d]=date.split('-').map(Number);const ds=Date.UTC(y,m-1,d);
 const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lon),new Date(ds),params());const o={};
 for(const p2 of P){const mins=(new Date(t[p2]).getTime()-ds)/60000+240;o[p2]=p2==='sunrise'?Math.floor(mins+1e-9):Math.round(mins);}cache.set(k,o);return o;}
const obs=(r,k)=>Number(r[FIELD[k]].slice(11,13))*60+Number(r[FIELD[k]].slice(14,16));
const out=[];
out.push('## Per-year breakdown per emirate (one recipe, all years)');
out.push('| emirate | year | rows | exact | within1 | MAE |');
out.push('|---|---|---|---|---|---|');
for(const e of [1,2,3,4,5,6,7]){
  const ids=new Set(AREAS.filter(a=>a.emirate===e).map(a=>a.cityID));
  for(const yr of ['2026','2027']){
    const rs=rows.filter(r=>ids.has(r.areaID)&&r.gDate.startsWith(yr));
    if(!rs.length)continue;
    let n=0,ex=0,w1=0,sum=0;
    for(const r of rs){const a=areaById.get(r.areaID);const p=pred(r.gDate.slice(0,10),a.latitude,a.longitude);
      for(const k of P){const d=obs(r,k)-p[k];n++;if(d===0)ex++;if(Math.abs(d)<=1)w1++;sum+=Math.abs(d);}}
    out.push(`| ${EM[e]} | ${yr} | ${rs.length} | ${(100*ex/n).toFixed(1)}% | ${(100*w1/n).toFixed(1)}% | ${(sum/n).toFixed(3)} |`);
  }
}
fs.writeFileSync('data/FIT-YEAR-SPLIT.md',out.join('\n')+'\n');
console.log(out.join('\n'));
