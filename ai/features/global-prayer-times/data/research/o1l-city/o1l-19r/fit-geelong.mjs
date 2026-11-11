import { PrayerTimes, Coordinates, CalculationMethod, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js'
import fs from 'node:fs'
const d=JSON.parse(fs.readFileSync('data/au-2026-geelong-mawaqit.json','utf8'))
const rows=d.rows, zone='Australia/Melbourne', LAT=d.lat, LON=d.lon
const offMin=(iso)=>{const [y,m,dd]=iso.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,dd,4,0,0));
const dtf=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const p=Object.fromEntries(dtf.formatToParts(dt).map(x=>[x.type,x.value]));return Math.round((Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute)-dt.getTime())/60000)}
const hm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m}
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha']
const dates=Object.keys(rows).sort()
const run=(fa,ia,madhab)=>{const p=CalculationMethod.Other();p.fajrAngle=fa;p.ishaAngle=ia;p.rounding=Rounding.None;if(madhab)p.madhab=madhab
 const r={};for(const c of COLS)r[c]=[]
 for(const iso of dates){const [y,m,dd]=iso.split('-').map(Number)
  const pt=new PrayerTimes(new Coordinates(LAT,LON),new Date(Date.UTC(y,m-1,dd,12,0,0)),p)
  const f=t=>(t.getTime()-Date.UTC(y,m-1,dd,0,0,0))/60000+offMin(iso)
  const pr={fajr:f(pt.fajr),sunrise:f(pt.sunrise),dhuhr:f(pt.dhuhr),asr:f(pt.asr),maghrib:f(pt.maghrib),isha:f(pt.isha)}
  for(const c of COLS)r[c].push(pr[c]-hm(rows[iso][c]))}
 const o={};for(const c of COLS){const a=r[c];o[c]=[+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2),+Math.min(...a).toFixed(1),+Math.max(...a).toFixed(1)]}
 return o}
console.log('18/17 shafi',JSON.stringify(run(18,17)))
console.log('18/17 hanafi',JSON.stringify(run(18,17,'hanafi')))
let best={e:1e9}
for(let fa=15;fa<=20;fa+=0.1)for(let ia=15;ia<=20;ia+=0.1){
 const o=run(fa,ia);let e=0;for(const c of ['fajr','isha'])e+=Math.abs(o[c][0])*3+Math.abs(o[c][2]-o[c][1])
 if(e<best.e)best={e,fa:+fa.toFixed(1),ia:+ia.toFixed(1),o}}
console.log('best',best.fa,best.ia,JSON.stringify(best.o))
