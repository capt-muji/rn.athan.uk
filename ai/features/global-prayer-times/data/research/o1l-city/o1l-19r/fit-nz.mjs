import { PrayerTimes, Coordinates, CalculationMethod, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js'
import fs from 'node:fs'
const d=JSON.parse(fs.readFileSync('data/nz-2006-ramadan-15cities.json','utf8'))
const zone='Pacific/Auckland'
const offMin=(iso)=>{const [y,m,dd]=iso.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,dd,4,0,0));
const dtf=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const p=Object.fromEntries(dtf.formatToParts(dt).map(x=>[x.type,x.value]));return Math.round((Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute)-dt.getTime())/60000)}
const hm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m}
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha']
const mk=(fa,ia)=>{const p=CalculationMethod.Other();p.fajrAngle=fa;p.ishaAngle=ia;p.rounding=Rounding.None;return p}
const pred=(fa,ia,lat,lon,iso)=>{const [y,m,dd]=iso.split('-').map(Number)
const pt=new PrayerTimes(new Coordinates(lat,lon),new Date(Date.UTC(y,m-1,dd,12,0,0)-offMin(iso)*60000),mk(fa,ia))
const f=t=>(t.getTime()-Date.UTC(y,m-1,dd,0,0,0))/60000;return {fajr:f(pt.fajr),sunrise:f(pt.sunrise),dhuhr:f(pt.dhuhr),asr:f(pt.asr),maghrib:f(pt.maghrib),isha:f(pt.isha)}}
const out=[]
for(const city of Object.keys(d).sort()){
  const rows=d[city]; const dates=Object.keys(rows).sort()
  const obs=(iso,c)=>hm(rows[iso][c])-offMin(iso)
  // longitude from dhuhr at fixed angles (dhuhr independent of angles)
  let lo=165,hi=180
  for(let i=0;i<60;i++){const mid=(lo+hi)/2;let e=0;for(const iso of dates)e+=pred(18,18,-40,mid,iso).dhuhr-obs(iso,'dhuhr');if(e>0)lo=mid;else hi=mid}
  const lon=(lo+hi)/2
  // latitude: grid on fajr+sunrise+maghrib
  let best={e:1e9,lat:0}
  for(let lat=-48;lat<=-33;lat+=0.02){
    let e=0
    for(const iso of dates){const p=pred(18,18,lat,lon,iso);e+=Math.abs(p.fajr-obs(iso,'fajr'))+Math.abs(p.sunrise-obs(iso,'sunrise'))+Math.abs(p.maghrib-obs(iso,'maghrib'))}
    if(e<best.e)best={e,lat}
  }
  // angle grid
  let ba={e:1e9}
  for(let fa=16;fa<=20;fa+=0.1)for(let ia=14;ia<=20;ia+=0.1){
    let e=0
    for(const iso of dates){const p=pred(fa,ia,best.lat,lon,iso);e+=Math.abs(p.fajr-obs(iso,'fajr'))+Math.abs(p.isha-obs(iso,'isha'))}
    if(e<ba.e)ba={e,fa:+fa.toFixed(1),ia:+ia.toFixed(1)}
  }
  const p18=pred(18,18,best.lat,lon,dates[0])
  const stat=(fa,ia)=>{const r={};for(const c of COLS)r[c]=[]
    for(const iso of dates){const p=pred(fa,ia,best.lat,lon,iso);for(const c of COLS)r[c].push(p[c]-obs(iso,c))}
    const o={};for(const c of COLS){const a=r[c];o[c]=[+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1),+Math.min(...a).toFixed(1),+Math.max(...a).toFixed(1)]}return o}
  out.push({city,lat:+best.lat.toFixed(2),lon:+lon.toFixed(2),angles:[ba.fa,ba.ia],best:stat(ba.fa,ba.ia),at1818:stat(18,18)})
}
for(const r of out) console.log(r.city,'lat',r.lat,'lon',r.lon,'pair',r.angles.join('/'),'resid',JSON.stringify(r.best))
console.log('\n-- at 18/18 --')
for(const r of out) console.log(r.city,JSON.stringify(r.at1818))
fs.writeFileSync('data/nz-2006-fit.json',JSON.stringify(out,null,1))
