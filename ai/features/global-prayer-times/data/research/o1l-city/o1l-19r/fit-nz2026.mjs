import { PrayerTimes, Coordinates, CalculationMethod, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js'
import fs from 'node:fs'
const d=JSON.parse(fs.readFileSync('data/nz-2026-ramadan-3cities-transcribed.json','utf8'))
const zone='Pacific/Auckland'
const CITY={Hamilton:[-37.7870,175.2793],Tauranga:[-37.6878,176.1651],Dunedin:[-45.8788,170.5028]}
const offMin=(iso)=>{const [y,m,dd]=iso.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,dd,4,0,0));
const dtf=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const p=Object.fromEntries(dtf.formatToParts(dt).map(x=>[x.type,x.value]));return Math.round((Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute)-dt.getTime())/60000)}
const hm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m}
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha']
const mk=(fa,ia)=>{const p=CalculationMethod.Other();p.fajrAngle=fa;p.ishaAngle=ia;p.rounding=Rounding.None;return p}
const pred=(fa,ia,lat,lon,iso)=>{const [y,m,dd]=iso.split('-').map(Number)
const pt=new PrayerTimes(new Coordinates(lat,lon),new Date(Date.UTC(y,m-1,dd,12,0,0)),mk(fa,ia))
const f=t=>(t.getTime()-Date.UTC(y,m-1,dd,0,0,0))/60000;return {fajr:f(pt.fajr),sunrise:f(pt.sunrise),dhuhr:f(pt.dhuhr),asr:f(pt.asr),maghrib:f(pt.maghrib),isha:f(pt.isha)}}
for(const [city,[lat,lon]] of Object.entries(CITY)){
  const rows=d[city].rows; const dates=Object.keys(rows).sort()
  const obs=(iso,c)=>hm(rows[iso][c])-offMin(iso)
  let b={e:1e9}
  for(let fa=14;fa<=20;fa+=0.05)for(let ia=13;ia<=20;ia+=0.05){
    let e=0
    for(const iso of dates){const p=pred(fa,ia,lat,lon,iso);e+=Math.abs(p.fajr-obs(iso,'fajr'))+Math.abs(p.isha-obs(iso,'isha'))}
    if(e<b.e)b={e,fa:+fa.toFixed(2),ia:+ia.toFixed(2)}
  }
  const r={};for(const c of COLS)r[c]=[]
  for(const iso of dates){const p=pred(b.fa,b.ia,lat,lon,iso);for(const c of COLS)r[c].push(p[c]-obs(iso,c))}
  const st={};for(const c of COLS){const a=r[c];st[c]=[+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2),+Math.min(...a).toFixed(1),+Math.max(...a).toFixed(1)]}
  console.log(city,'pair',b.fa+'/'+b.ia,JSON.stringify(st))
}
