import { PrayerTimes, Coordinates, CalculationMethod, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js'
import fs from 'node:fs'
const params=CalculationMethod.Turkey();params.rounding=Rounding.None
const predUTC=(lat,lon,iso)=>{const [y,m,d]=iso.split('-').map(Number);
const pt=new PrayerTimes(new Coordinates(lat,lon),new Date(Date.UTC(y,m-1,d,4,0,0)),params);
const f=t=>(t.getTime()-Date.UTC(y,m-1,d,0,0,0))/60000;return {fajr:f(pt.fajr),sunrise:f(pt.sunrise),dhuhr:f(pt.dhuhr),asr:f(pt.asr),maghrib:f(pt.maghrib),isha:f(pt.isha)}}
const rows=JSON.parse(fs.readFileSync('data/diyanet/au-11344-melville-2026.json','utf8'))
for(const d of ['2026-01-01','2026-06-15','2026-12-15']){
  const p=predUTC(-31.95,130.86,d)
  console.log(d, JSON.stringify(rows[d]))
  console.log('   pred at Perth+15:', Object.fromEntries(Object.entries(p).map(([k,v])=>[k,v+480])).constructor===Object ? Object.entries(p).map(([k,v])=>k+'='+(v+480).toFixed(1)).join(' ') : '')
}
