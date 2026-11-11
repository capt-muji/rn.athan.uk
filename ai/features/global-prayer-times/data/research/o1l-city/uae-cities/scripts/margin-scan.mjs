import fs from 'fs';
import adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js';
const AREAS=JSON.parse(fs.readFileSync('data/areas.json','utf8'));
const P=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const FIELD={fajr:'fajr',sunrise:'shurooq',dhuhr:'zuhr',asr:'asr',maghrib:'maghrib',isha:'isha'};
const files=process.argv.slice(2); let rows=[];
for(const f of files) rows.push(...(JSON.parse(fs.readFileSync(f,'utf8')).prayerData||[]));
const areaById=new Map(AREAS.map(a=>[a.cityID,a]));
const obs=(r,k)=>Number(r[FIELD[k]].slice(11,13))*60+Number(r[FIELD[k]].slice(14,16));
const rawCache=new Map();
function raw(date,lat,lon){const key=lat+'|'+lon+'|'+date;const c=rawCache.get(key);if(c)return c;
  const [y,m,d]=date.split('-').map(Number);const ds=Date.UTC(y,m-1,d);
  const p=new adhan.CalculationParameters('Other',18.2,18.2);p.madhab=adhan.Madhab.Shafi;p.highLatitudeRule=adhan.HighLatitudeRule.MiddleOfTheNight;p.adjustments={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};p.rounding=adhan.Rounding.None;
  const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lon),new Date(ds),p);const o={};
  for(const k of P) o[k]=(new Date(t[k]).getTime()-ds)/60000+240;
  rawCache.set(key,o);return o;}
const ROWS=rows.map(r=>({a:areaById.get(r.areaID),date:r.gDate.slice(0,10),obs:Object.fromEntries(P.map(k=>[k,obs(r,k)]))}));
const round=(x,mode)=>mode==='floor'?Math.floor(x+1e-9):Math.round(x);
console.log('rows',ROWS.length);
for(const k of P){
  const mode=k==='sunrise'?'floor':'nearest';
  let best=null;
  for(let m=-3;m<=5;m++){
    let e=0,w1=0,n=0,bias=0;
    for(const r of ROWS){const pred=round(raw(r.date,r.a.latitude,r.a.longitude)[k]+m,mode);const d=r.obs[k]-pred;n++;if(d===0)e++;if(Math.abs(d)<=1)w1++;bias+=d;}
    const rec={m,exact:100*e/n,w1:100*w1/n,bias:bias/n};
    if(!best||rec.exact>best.exact)best=rec;
    if(m>=-2&&m<=4)console.log(k.padEnd(8),'margin',String(m).padStart(2),'exact',rec.exact.toFixed(1),'w1',rec.w1.toFixed(1),'bias',rec.bias.toFixed(2));
  }
  console.log('BEST',k,best);
}
