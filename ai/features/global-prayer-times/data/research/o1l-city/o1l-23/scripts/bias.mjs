process.env.TZ='Europe/Istanbul';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {CalculationMethod,Coordinates,PrayerTimes,Rounding}=require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const params=CalculationMethod.Turkey(); params.rounding=Rounding.None;
const fmt=d=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(d);
const toMin=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
const nearest=s=>{const[h,m,x]=s.split(':').map(Number);return h*60+m+(x>=30?1:0);};
const MAP={'İ':'i','ı':'i','Ş':'s','ş':'s','Ğ':'g','ğ':'g','Ü':'u','ü':'u','Ö':'o','ö':'o','Ç':'c','ç':'c','Â':'a','â':'a'};
const slugify=s=>s.split('').map(ch=>MAP[ch]??ch).join('').toLowerCase().replace(/[^a-z0-9]+/g,'');
const a=JSON.parse(fs.readFileSync('data/analysis.json','utf8'));
const agg={}; for(const c of COLS) agg[c]={sum:0,n:0};
const dist=[]; 
for(const r of a){
  const prov=r.province, name=r.district;
  const provSlug=slugify(Object.keys(JSON.parse(fs.readFileSync('data/ilce-index.json','utf8'))).find(k=>k.toUpperCase()===prov)||prov);
  const file=`data/tr-2026-${slugify(prov)}--${slugify(name)}.json`;
  const rows=JSON.parse(fs.readFileSync(file,'utf8')).rows;
  let s=0,n=0;
  for(const [ds,row] of Object.entries(rows)){
    const [y,m,d]=ds.split('-').map(Number);
    const pt=new PrayerTimes(new Coordinates(r.coord[0],r.coord[1]),new Date(y,m-1,d,12,0,0),params);
    for(const c of COLS){
      const e=nearest(fmt(pt[c]))-toMin(row[c]);
      agg[c].sum+=e; agg[c].n++; s+=e; n++;
    }
  }
  dist.push({district:name,province:prov,meanSigned:+(s/n).toFixed(3)});
}
console.log('aggregate signed bias per prayer');
for(const c of COLS) console.log(' ',c,(agg[c].sum/agg[c].n).toFixed(3));
const vals=dist.map(d=>d.meanSigned).sort((x,y)=>x-y);
console.log('district mean signed bias: min',vals[0],'median',vals[Math.floor(vals.length/2)],'max',vals.at(-1));
console.log('districts with |bias|>0.3:',dist.filter(d=>Math.abs(d.meanSigned)>0.3).length);
console.log(dist.filter(d=>Math.abs(d.meanSigned)>0.3).map(d=>`${d.province}/${d.district} ${d.meanSigned}`).join('\n'));
