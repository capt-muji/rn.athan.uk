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
const cache=new Map();
function comp(lat,lon,ds){
  const k=lat+'|'+lon+'|'+ds; const c=cache.get(k); if(c) return c;
  const [y,m,d]=ds.split('-').map(Number);
  const pt=new PrayerTimes(new Coordinates(lat,lon),new Date(y,m-1,d,12,0,0),params);
  const o={}; for(const col of COLS) o[col]=nearest(fmt(pt[col]));
  cache.set(k,o); return o;
}
const idx=JSON.parse(fs.readFileSync('data/ilce-index.json','utf8'));
const coords=JSON.parse(fs.readFileSync('data/district-coords.json','utf8'));
const load=(prov,district)=>JSON.parse(fs.readFileSync(`data/tr-2026-${slugify(prov)}--${slugify(district)}.json`,'utf8')).rows;
const fold=s=>s.split('').map(ch=>MAP[ch]??ch).join('').toLowerCase().replace(/[^a-z0-9]/g,'');
const capitals=JSON.parse(fs.readFileSync('data/capital-coords.json','utf8'));
const findCoord=(prov,district)=>{
  const provKey=Object.keys(coords).find(k=>fold(k)===fold(prov));
  if(!provKey) return null;
  const nameKey=Object.keys(coords[provKey]).find(k=>fold(k)===fold(district));
  if(nameKey) return coords[provKey][nameKey];
  const capKey=Object.keys(capitals).find(k=>fold(k)===fold(prov));
  return fold(district)===fold(prov)&&capKey?capitals[capKey]:null;
};
function score(lat,lon,rows,step=1){
  const entries=Object.entries(rows); let abs=0,n=0,w1=0,exact=0,worst=0;
  const per={}; for(const c of COLS)per[c]={abs:0,n:0,worst:0,exact:0};
  for(let i=0;i<entries.length;i+=step){
    const [ds,row]=entries[i]; const c=comp(lat,lon,ds);
    for(const col of COLS){
      const e=Math.abs(c[col]-toMin(row[col]));
      abs+=e;n++;if(e<=1)w1++;if(e===0)exact++;if(e>worst)worst=e;
      per[col].abs+=e;per[col].n++;if(e===0)per[col].exact++;if(e>per[col].worst)per[col].worst=e;
    }
  }
  return {mae:abs/n,w1Pct:100*w1/n,exactPct:100*exact/n,worst,
    perPrayer:Object.fromEntries(COLS.map(k=>[k,{mae:+(per[k].abs/per[k].n).toFixed(2),worst:per[k].worst,exactPct:+(100*per[k].exact/per[k].n).toFixed(1)}]))};
}
const out={};
for(const [prov,info] of Object.entries(idx)){
  const capEntry=info.districts.find(d=>d.ilce===info.capitalId);
  const capCoord=findCoord(prov,capEntry.name);
  const baseRows=load(prov,capEntry.name);
  const baseCalc=(ds)=>comp(capCoord.lat,capCoord.lon,ds);
  const prov_out={capital:{district:capEntry.name,coord:capCoord},districts:{}};
  for(const d of info.districts){
    if(d.ilce===info.capitalId) continue;
    const rows=load(prov,d.name);
    const c=findCoord(prov,d.name);
    if(!c){console.log('NOCOORD',prov,d.name);continue;}
    const s=score(c.lat,c.lon,rows);
    let anchor=null, anchored=s;
    if(s.mae>0.6){
      let best={mae:Infinity};
      for(let dlat=-0.30;dlat<=0.3001;dlat+=0.05)for(let dlon=-0.40;dlon<=0.4001;dlon+=0.05){
        const t=score(+(c.lat+dlat).toFixed(4),+(c.lon+dlon).toFixed(4),rows,15);
        if(t.mae<best.mae)best={mae:t.mae,lat:+(c.lat+dlat).toFixed(4),lon:+(c.lon+dlon).toFixed(4)};
      }
      if(best.mae<s.mae-0.02){
        anchor=[best.lat,best.lon];
        anchored=score(best.lat,best.lon,rows);
      }
    }
    let dAbs=0,dN=0,dWorst=0;
    for(const [ds,row] of Object.entries(rows)){
      if(!baseRows[ds]) continue;
      const cd=comp(c.lat,c.lon,ds), cb=baseCalc(ds);
      for(const col of COLS){
        const e=(toMin(row[col])-toMin(baseRows[ds][col]))-(cd[col]-cb[col]);
        dAbs+=Math.abs(e);dN++;if(Math.abs(e)>dWorst)dWorst=Math.abs(e);
      }
    }
    prov_out.districts[d.name]={district:d.name,ilce:d.ilce,coord:[c.lat,c.lon],days:Object.keys(rows).length,
      mae:+s.mae.toFixed(3),w1Pct:+s.w1Pct.toFixed(1),exactPct:+s.exactPct.toFixed(1),worst:s.worst,
      perPrayer:s.perPrayer,
      anchor,anchorMae:anchor?+anchored.mae.toFixed(3):null,anchorW1:anchor?+anchored.w1Pct.toFixed(1):null,
      diffResidualMae:+(dAbs/dN).toFixed(3),diffResidualWorst:dWorst};
    console.log(prov.padEnd(11),d.name.padEnd(14),'mae',s.mae.toFixed(2),'w1',s.w1Pct.toFixed(1),'resid',(dAbs/dN).toFixed(2),anchor?'anchor '+anchor.join(','):'');
  }
  out[prov]=prov_out;
}
fs.writeFileSync('data/fit-districts.json',JSON.stringify(out,null,1));
