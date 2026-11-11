import { PrayerTimes, Coordinates, CalculationMethod, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js'
import fs from 'node:fs'
const fit=JSON.parse(fs.readFileSync('data/au-diyanet-fit-2026.json','utf8'))
const params=CalculationMethod.Turkey();params.rounding=Rounding.None
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha']
const offMin=(iso,zone)=>{const [y,m,d]=iso.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,d,4,0,0));
const dtf=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const p=Object.fromEntries(dtf.formatToParts(dt).map(x=>[x.type,x.value]));return Math.round((Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute)-dt.getTime())/60000)}
const pred=(lat,lon,iso)=>{const [y,m,d]=iso.split('-').map(Number);const date=new Date(Date.UTC(y,m-1,d,4,0,0));
const pt=new PrayerTimes(new Coordinates(lat,lon),date,params);const f=t=>((t.getTime()-Date.UTC(y,m-1,d,0,0,0))/60000);
return {fajr:f(pt.fajr),sunrise:f(pt.sunrise),dhuhr:f(pt.dhuhr),asr:f(pt.asr),maghrib:f(pt.maghrib),isha:f(pt.isha)}}
const hm=s=>{const[h,mi]=s.split(':').map(Number);return h*60+mi}
const score=(lat,lon,dates,rows,off)=>{let ok=0;for(const d of dates){const p=pred(lat,lon,d);for(const c of COLS){if(Math.round(p[c]+off[d])===hm(rows[d][c]))ok++}}return ok/(dates.length*6)}
for(const city of fit.filter(c=>['perth','canberra','darwin','hobart','gold-coast','newcastle','wollongong','geelong','adelaide','sydney','melbourne','brisbane'].includes(c.slug))){
  const file=fs.readdirSync('data/diyanet').find(f=>f.includes('-'+city.slug+'-2026.json'))
  const rows=JSON.parse(fs.readFileSync('data/diyanet/'+file,'utf8'));const dates=Object.keys(rows).sort()
  const off=Object.fromEntries(dates.map(d=>[d,offMin(d,city.zone)]))
  let best={s:score(city.lat,city.lon,dates,rows,off),lat:city.lat,lon:city.lon}
  for(let dlat=-0.06;dlat<=0.06;dlat+=0.004)for(let dlon=-0.06;dlon<=0.06;dlon+=0.004){
    const s=score(city.lat+dlat,city.lon+dlon,dates,rows,off);if(s>best.s)best={s,lat:+(city.lat+dlat).toFixed(3),lon:+(city.lon+dlon).toFixed(3)}}
  console.log(city.slug,'base',city.lat,city.lon,(100*score(city.lat,city.lon,dates,rows,off)).toFixed(1)+'%','refined',best.lat,best.lon,(100*best.s).toFixed(1)+'%')
}
