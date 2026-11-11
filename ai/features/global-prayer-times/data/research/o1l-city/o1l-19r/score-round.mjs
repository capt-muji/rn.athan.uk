import { PrayerTimes, Coordinates, CalculationMethod, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js'
import fs from 'node:fs'
const fit = JSON.parse(fs.readFileSync('data/au-diyanet-fit-2026.json','utf8'))
const params = CalculationMethod.Turkey(); params.rounding = Rounding.None
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha']
const offMin=(iso,zone)=>{const [y,m,d]=iso.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,d,4,0,0));
const dtf=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const p=Object.fromEntries(dtf.formatToParts(dt).map(x=>[x.type,x.value]));return Math.round((Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute)-dt.getTime())/60000)}
const pred=(lat,lon,iso)=>{const [y,m,d]=iso.split('-').map(Number);const date=new Date(Date.UTC(y,m-1,d,4,0,0));
const pt=new PrayerTimes(new Coordinates(lat,lon),date,params);const f=t=>((t.getTime()-Date.UTC(y,m-1,d,0,0,0))/60000);
return {fajr:f(pt.fajr),sunrise:f(pt.sunrise),dhuhr:f(pt.dhuhr),asr:f(pt.asr),maghrib:f(pt.maghrib),isha:f(pt.isha)}}
const hm=s=>{const[h,mi]=s.split(':').map(Number);return h*60+mi}
const modes={nearest:x=>Math.round(x),floor:x=>Math.floor(x),ceil:x=>Math.ceil(x),half_up_neg:x=>x>=0?Math.floor(x+0.5):-Math.floor(-x+0.5)}
const tally={}
for(const m of Object.keys(modes)) tally[m]=Object.fromEntries(COLS.map(c=>[c,0]))
let total=0
for(const city of fit.slice(0,40)){
  const slug=city.slug, file=fs.readdirSync('data/diyanet').find(f=>f.includes('-'+slug+'-2026.json'))
  const rows=JSON.parse(fs.readFileSync('data/diyanet/'+file,'utf8'))
  for(const d of Object.keys(rows).sort()){
    const off=offMin(d,city.zone)
    const p=pred(city.lat,city.lon,d)
    for(const c of COLS){const v=p[c]+off; for(const m of Object.keys(modes)) if(modes[m](v)===hm(rows[d][c])) tally[m][c]++}
    total++
  }
}
console.log('days',total)
for(const m of Object.keys(modes)) console.log(m, COLS.map(c=>c+' '+(100*tally[m][c]/total).toFixed(1)+'%').join('  '))
