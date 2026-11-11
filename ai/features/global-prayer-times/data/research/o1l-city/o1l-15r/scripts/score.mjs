process.env.TZ = 'Europe/Istanbul';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { CalculationMethod, Coordinates, PrayerTimes, Rounding } = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');

const CITIES = JSON.parse(fs.readFileSync('data/anchor-search.json','utf8'));
const COLS = ['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const params = CalculationMethod.Turkey();
params.rounding = Rounding.None;
const fmt = d => new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(d);
const toMin = s => { const [h,m]=s.split(':').map(Number); return h*60+m; };
const nearestMin = s => { const [h,m,x]=s.split(':').map(Number); return h*60+m+(x>=30?1:0); };

function compute(lat,lon,dateStr){
  const [y,m,d]=dateStr.split('-').map(Number);
  const pt=new PrayerTimes(new Coordinates(lat,lon), new Date(y,m-1,d,12,0,0), params);
  const o={}; for(const c of COLS) o[c]=nearestMin(fmt(pt[c]));
  return o;
}

const out={};
for(const [slug,meta] of Object.entries(CITIES)){
  const rows=JSON.parse(fs.readFileSync(`data/tr-2026-${slug}.json`,'utf8')).rows;
  const dates=Object.keys(rows).sort();
  const per={}, worst={}; let cells=0, exact=0, w1=0, abs=0;
  const monthly={};
  for(const c of COLS){per[c]={exact:0,w1:0,worst:0,abs:0,n:0};worst[c]=0;}
  for(const date of dates){
    const calc=compute(meta.coords[0],meta.coords[1],date);
    const mon=date.slice(0,7);
    monthly[mon] ??= {n:0,abs:0,w1:0};
    for(const c of COLS){
      const e=calc[c]-toMin(rows[date][c]);
      const a=Math.abs(e);
      per[c].n++; per[c].abs+=a; cells++; abs+=a;
      if(e===0){exact++;per[c].exact++;}
      if(a<=1){w1++;per[c].w1++;}
      if(a>per[c].worst){per[c].worst=a;}
      if(a>worst[c])worst[c]=a;
      monthly[mon].n++; monthly[mon].abs+=a; if(a<=1)monthly[mon].w1++;
    }
  }
  const summarise=o=>({n:o.n,exact:o.exact,w1:o.w1,worst:o.worst,mae:+(o.abs/o.n).toFixed(3)});
  out[slug]={city:meta.city,ilce:meta.ilce,coords:meta.coords,days:dates.length,cells,
    exact,exactPct:+(100*exact/cells).toFixed(2), w1, w1Pct:+(100*w1/cells).toFixed(2),
    mae:+(abs/cells).toFixed(3),
    perPrayer:Object.fromEntries(COLS.map(c=>[c,summarise(per[c])])),
    monthly:Object.fromEntries(Object.entries(monthly).map(([k,v])=>[k,{n:v.n,w1Pct:+(100*v.w1/v.n).toFixed(1),mae:+(v.abs/v.n).toFixed(2)}])),
    amplitude:{janFajr:rows['2026-01-15'].fajr,julFajr:rows['2026-07-15'].fajr,
               janIsha:rows['2026-01-15'].isha,julIsha:rows['2026-07-15'].isha}};
  console.log(slug, meta.city, 'exact', out[slug].exactPct+'%', 'w1', out[slug].w1Pct+'%', 'MAE', out[slug].mae,
    'worst', Math.max(...COLS.map(c=>worst[c])));
}
fs.writeFileSync('data/fit-2026.json',JSON.stringify(out,null,1));
