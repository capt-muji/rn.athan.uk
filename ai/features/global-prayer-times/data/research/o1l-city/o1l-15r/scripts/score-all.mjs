process.env.TZ='Europe/Istanbul';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {CalculationMethod,Coordinates,PrayerTimes,Rounding}=require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');
const provs=JSON.parse(fs.readFileSync('data/capture-all.json','utf8'));
const coords=JSON.parse(fs.readFileSync('data/province-coords.json','utf8'));
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const params=CalculationMethod.Turkey(); params.rounding=Rounding.None;
const fmt=d=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(d);
const toMin=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
const nearest=s=>{const[h,m,x]=s.split(':').map(Number);return h*60+m+(x>=30?1:0);};
const cache=new Map();
function comp(lat,lon,ds){
  const k=`${lat}|${lon}|${ds}`; const c=cache.get(k); if(c) return c;
  const [y,m,d]=ds.split('-').map(Number);
  const pt=new PrayerTimes(new Coordinates(lat,lon),new Date(y,m-1,d,12,0,0),params);
  const o={}; for(const col of COLS) o[col]=nearest(fmt(pt[col]));
  cache.set(k,o); return o;
}
function score(lat,lon,rows,step=1){
  const entries=Object.entries(rows); let abs=0,n=0,w1=0,exact=0,worst=0;
  for(let i=0;i<entries.length;i+=step){
    const [ds,row]=entries[i]; const c=comp(lat,lon,ds);
    for(const col of COLS){const e=Math.abs(c[col]-toMin(row[col]));abs+=e;n++;if(e<=1)w1++;if(e===0)exact++;if(e>worst)worst=e;}
  }
  return {mae:abs/n,w1Pct:100*w1/n,exactPct:100*exact/n,worst};
}
const out={};
for(const p of provs){
  const rows=JSON.parse(fs.readFileSync(`data/tr-2026-${p.slug}.json`,'utf8')).rows;
  const c=coords[p.name];
  let s=score(c.lat,c.lon,rows);
  let anchor={...c};
  if(s.mae>0.55){
    let best={mae:Infinity};
    for(let dlat=-0.35;dlat<=0.35001;dlat+=0.025)for(let dlon=-0.45;dlon<=0.45001;dlon+=0.025){
      const t=score(+(c.lat+dlat).toFixed(4),+(c.lon+dlon).toFixed(4),rows,20);
      if(t.mae<best.mae)best={mae:t.mae,lat:+(c.lat+dlat).toFixed(4),lon:+(c.lon+dlon).toFixed(4)};
    }
    if(best.mae<s.mae){anchor={lat:best.lat,lon:best.lon};s=score(best.lat,best.lon,rows);}
  }
  const per={}; for(const col of COLS)per[col]={abs:0,n:0,worst:0,exact:0};
  for(const [ds,row] of Object.entries(rows)){const cc=comp(anchor.lat,anchor.lon,ds);
    for(const col of COLS){const e=Math.abs(cc[col]-toMin(row[col]));per[col].abs+=e;per[col].n++;if(e===0)per[col].exact++;if(e>per[col].worst)per[col].worst=e;}}
  out[p.name]={ilce:p.ilce,slug:p.slug,coords:[c.lat,c.lon],anchor:[anchor.lat,anchor.lon],
    days:Object.keys(rows).length,...s,
    perPrayer:Object.fromEntries(COLS.map(k=>[k,{mae:+(per[k].abs/per[k].n).toFixed(2),worst:per[k].worst}]))};
  console.log(p.name.padEnd(14),'mae',s.mae.toFixed(3),'w1',s.w1Pct.toFixed(1)+'%','worst',s.worst, 'anchor',anchor.lat,anchor.lon);
}
fs.writeFileSync('data/fit-2026-all81.json',JSON.stringify(out,null,1));
