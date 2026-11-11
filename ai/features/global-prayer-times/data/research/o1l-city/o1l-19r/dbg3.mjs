import { PrayerTimes, Coordinates, CalculationMethod, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js'
import fs from 'node:fs'
const params=CalculationMethod.Turkey();params.rounding=Rounding.None
const ZONES=['Australia/Perth','Australia/Darwin','Australia/Adelaide','Australia/Brisbane','Australia/Sydney','Australia/Melbourne','Australia/Hobart','Pacific/Auckland']
const offMin=(iso,zone)=>{const [y,m,d]=iso.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,d,4,0,0));
const dtf=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const p=Object.fromEntries(dtf.formatToParts(dt).map(x=>[x.type,x.value]));return Math.round((Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute)-dt.getTime())/60000)}
const predUTC=(lat,lon,iso)=>{const [y,m,d]=iso.split('-').map(Number);
const pt=new PrayerTimes(new Coordinates(lat,lon),new Date(Date.UTC(y,m-1,d,4,0,0)),params);
const f=t=>(t.getTime()-Date.UTC(y,m-1,d,0,0,0))/60000;return {fajr:f(pt.fajr),sunrise:f(pt.sunrise),dhuhr:f(pt.dhuhr),asr:f(pt.asr),maghrib:f(pt.maghrib),isha:f(pt.isha)}}
const hm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m}
for(const slug of ['melville','gladstone','sandgateq','southportq','richmond-q','barrov-creek','mondorah','mount-gravatt']){
  const f=fs.readdirSync('data/diyanet').find(x=>x.includes('-'+slug+'-2026.json'))
  const rows=JSON.parse(fs.readFileSync('data/diyanet/'+f,'utf8')); const dates=Object.keys(rows).sort()
  let out=[]
  for(const zone of ZONES){
    const off=Object.fromEntries(dates.map(d=>[d,offMin(d,zone)]))
    let lo=90,hi=180
    for(let i=0;i<70;i++){const mid=(lo+hi)/2;let e=0;for(const d of dates)e+=(predUTC(-30,mid,d).dhuhr-(hm(rows[d].dhuhr)-off[d]));if(e>0)lo=mid;else hi=mid}
    const lon=(lo+hi)/2
    let maxe=0
    for(const d of dates){maxe=Math.max(maxe,Math.abs(predUTC(-30,lon,d).dhuhr-(hm(rows[d].dhuhr)-off[d])))}
    out.push([zone,lon.toFixed(1),maxe.toFixed(1)])
  }
  out.sort((a,b)=>a[2]-b[2])
  console.log(slug.padEnd(14), out.slice(0,3).map(x=>x.join('/')).join('  '))
}
