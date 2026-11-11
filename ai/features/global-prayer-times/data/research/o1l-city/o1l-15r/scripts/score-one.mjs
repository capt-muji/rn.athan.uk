process.env.TZ='Europe/Istanbul';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {CalculationMethod,Coordinates,PrayerTimes,Rounding}=require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');
const name=process.argv[2];
const coords=JSON.parse(fs.readFileSync('data/province-coords.json','utf8'))[name];
const provs=JSON.parse(fs.readFileSync('data/capture-all.json','utf8'));
const p=provs.find(x=>x.name===name);
const rows=JSON.parse(fs.readFileSync(`data/tr-2026-${p.slug}.json`,'utf8')).rows;
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const params=CalculationMethod.Turkey(); params.rounding=Rounding.None;
const fmt=d=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(d);
const toMin=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
const nearest=s=>{const[h,m,x]=s.split(':').map(Number);return h*60+m+(x>=30?1:0);};
let abs=0,n=0,w1=0,exact=0,worst=0;const per={};for(const c of COLS)per[c]={abs:0,n:0,worst:0};
for(const [ds,row] of Object.entries(rows)){
  const [y,m,d]=ds.split('-').map(Number);
  const pt=new PrayerTimes(new Coordinates(coords.lat,coords.lon),new Date(y,m-1,d,12,0,0),params);
  for(const c of COLS){const e=Math.abs(nearest(fmt(pt[c]))-toMin(row[c]));
    abs+=e;n++;if(e<=1)w1++;if(e===0)exact++;if(e>worst)worst=e;
    per[c].abs+=e;per[c].n++;if(e>per[c].worst)per[c].worst=e;}
}
const out={ilce:p.ilce,slug:p.slug,coords:[coords.lat,coords.lon],anchor:[coords.lat,coords.lon],days:Object.keys(rows).length,
  mae:abs/n,w1Pct:100*w1/n,exactPct:100*exact/n,worst,
  perPrayer:Object.fromEntries(COLS.map(k=>[k,{mae:+(per[k].abs/per[k].n).toFixed(2),worst:per[k].worst}]))};
console.log(name,JSON.stringify({mae:+out.mae.toFixed(3),w1:+out.w1Pct.toFixed(1),worst:out.worst}));
fs.writeFileSync('data/fit-iğdır.json',JSON.stringify(out,null,1));
