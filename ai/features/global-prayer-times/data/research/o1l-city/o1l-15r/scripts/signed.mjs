process.env.TZ='Europe/Istanbul';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {CalculationMethod,Coordinates,PrayerTimes,Rounding}=require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');
const CITIES=JSON.parse(fs.readFileSync('data/anchor-search.json','utf8'));
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const params=CalculationMethod.Turkey(); params.rounding=Rounding.None;
const fmt=d=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(d);
const toMin=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
function comp(lat,lon,ds){const[y,m,d]=ds.split('-').map(Number);const pt=new PrayerTimes(new Coordinates(lat,lon),new Date(y,m-1,d,12,0,0),params);const o={};for(const c of COLS)o[c]=fmt(pt[c]);return o;}
const agg={}; for(const c of COLS) agg[c]={sum:0,n:0,hist:{}};
const perCity={};
for(const [slug,meta] of Object.entries(CITIES)){
  const rows=JSON.parse(fs.readFileSync(`data/tr-2026-${slug}.json`,'utf8')).rows;
  perCity[slug]={};
  for(const c of COLS) perCity[slug][c]={sum:0,n:0};
  for(const [ds,row] of Object.entries(rows)){
    const calc=comp(meta.coords[0],meta.coords[1],ds);
    for(const c of COLS){
      const [h,m,s]=calc[c].split(':').map(Number);
      const sec=h*3600+m*60+s;
      const pub=toMin(row[c])*60;
      const e=(sec-pub)/60;
      agg[c].sum+=e; agg[c].n++;
      perCity[slug][c].sum+=e; perCity[slug][c].n++;
      const k=e.toFixed(1); agg[c].hist[k]=(agg[c].hist[k]||0)+1;
    }
  }
}
console.log('prayer  signedMeanMin  n   hist');
for(const c of COLS){
  const a=agg[c];
  const hist=Object.entries(a.hist).sort((x,y)=>parseFloat(x[0])-parseFloat(y[0])).map(([k,v])=>`${k}:${v}`).join(' ');
  console.log(c.padEnd(8), (a.sum/a.n).toFixed(3).padStart(8), String(a.n).padStart(6), ' ', hist);
}
fs.writeFileSync('data/signed-residual.json',JSON.stringify({agg,perCity},null,1));
