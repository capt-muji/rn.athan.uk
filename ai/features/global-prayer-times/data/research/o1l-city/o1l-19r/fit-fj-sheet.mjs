import { PrayerTimes, Coordinates, CalculationMethod, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js'
import fs from 'node:fs'
const raw=JSON.parse(fs.readFileSync('data/fj-2025-12.json','utf8'))
const rows=Object.fromEntries(Object.entries(raw).filter(([k])=>k.startsWith('2025-')))
const zone='Pacific/Fiji', LAT=-18.1416, LON=178.4419
const offMin=(iso)=>{const [y,m,dd]=iso.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,dd,4,0,0));
const dtf=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const p=Object.fromEntries(dtf.formatToParts(dt).map(x=>[x.type,x.value]));return Math.round((Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute)-dt.getTime())/60000)}
const hm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m}
const p=CalculationMethod.Other();p.fajrAngle=18;p.ishaAngle=17;p.rounding=Rounding.None
const res={fajr:[],sunrise:[],dhuhr:[],asr:[],magrib:[],isha:[]}
for(const iso of Object.keys(rows).sort()){
  const [y,m,dd]=iso.split('-').map(Number)
  const pt=new PrayerTimes(new Coordinates(LAT,LON),new Date(Date.UTC(y,m-1,dd,4,0,0)),p)
  const o=offMin(iso)
  const f=t=>(t.getTime()-Date.UTC(y,m-1,dd,0,0,0))/60000+o
  res.fajr.push(f(pt.fajr)-hm(rows[iso].fajr));res.sunrise.push(f(pt.sunrise)-hm(rows[iso].sunrise))
  res.dhuhr.push(f(pt.dhuhr)-hm(rows[iso].dhuhr));res.asr.push(f(pt.asr)-hm(rows[iso].asr))
  res.magrib.push(f(pt.maghrib)-hm(rows[iso].magrib));res.isha.push(f(pt.isha)-hm(rows[iso].isha))
}
for(const c of Object.keys(res)){const a=res[c];console.log(c,'mean',(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2),'min',Math.min(...a).toFixed(1),'max',Math.max(...a).toFixed(1))}
