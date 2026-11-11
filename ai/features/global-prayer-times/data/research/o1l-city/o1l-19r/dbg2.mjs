import { PrayerTimes, Coordinates, CalculationMethod, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js'
import fs from 'node:fs'
const params=CalculationMethod.Turkey();params.rounding=Rounding.None
const predUTC=(lat,lon,iso)=>{const [y,m,d]=iso.split('-').map(Number);
const pt=new PrayerTimes(new Coordinates(lat,lon),new Date(Date.UTC(y,m-1,d,4,0,0)),params);
const f=t=>(t.getTime()-Date.UTC(y,m-1,d,0,0,0))/60000;return {fajr:f(pt.fajr),sunrise:f(pt.sunrise),dhuhr:f(pt.dhuhr),asr:f(pt.asr),maghrib:f(pt.maghrib),isha:f(pt.isha)}}
const rows=JSON.parse(fs.readFileSync('data/diyanet/au-11344-melville-2026.json','utf8'))
const hm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m}
const dates=Object.keys(rows).sort(); const sample=dates.filter(d=>d.slice(8)==='01'||d.slice(8)==='15')
for(const lon of [100.86,109.893,115.86,130.86]){
  for(const lat of [-31.95,-24.264]){
    let e=0,maxe=0
    for(const d of sample){const p=predUTC(lat,lon,d);const pr=hm(rows[d].dhuhr)-480;e+=(p.dhuhr-pr);maxe=Math.max(maxe,Math.abs(p.dhuhr-pr))}
    console.log('lat',lat,'lon',lon,'mean dhuhr err',(e/sample.length).toFixed(2),'max',maxe.toFixed(2))
  }
}
