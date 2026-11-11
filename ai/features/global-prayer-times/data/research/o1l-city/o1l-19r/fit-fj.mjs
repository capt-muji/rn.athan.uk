import { PrayerTimes, Coordinates, CalculationMethod, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js'
import fs from 'node:fs'
const d=JSON.parse(fs.readFileSync('data/fj-2026-dpt-widget-year.json','utf8')).rows
const zone='Pacific/Fiji'
const offMin=(iso)=>{const [y,m,dd]=iso.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,dd,4,0,0));
const dtf=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const p=Object.fromEntries(dtf.formatToParts(dt).map(x=>[x.type,x.value]));return Math.round((Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute)-dt.getTime())/60000)}
const hm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m}
const params=CalculationMethod.Other();params.fajrAngle=18;params.ishaAngle=17;params.rounding=Rounding.None
const pred=(lat,lon,iso)=>{const [y,m,dd]=iso.split('-').map(Number);
const pt=new PrayerTimes(new Coordinates(lat,lon),new Date(Date.UTC(y,m-1,dd,4,0,0)),params);
const f=t=>(t.getTime()-Date.UTC(y,m-1,dd,0,0,0))/60000;return {fajr:f(pt.fajr),sunrise:f(pt.sunrise),dhuhr:f(pt.dhuhr),asr:f(pt.asr),maghrib:f(pt.maghrib),isha:f(pt.isha)}}
const dates=Object.keys(d).sort()
// coarse coordinate solve on Suva
let best={e:1e9}
for(let lat=-18.5;lat<=-17.5;lat+=0.01)for(let lon=177.5;lon<=179.5;lon+=0.01){
  let e=0
  for(const iso of dates.filter(x=>x.slice(8)==='01'||x.slice(8)==='15')){
    const o=offMin(iso),p=pred(lat,lon,iso)
    e+=Math.abs(p.sunrise-(hm(d[iso].sunrise)+0)-o)
  }
  if(e<best.e)best={e,lat:+lat.toFixed(2),lon:+lon.toFixed(2)}
}
console.log('solved',best)
const res={fajr:[],sunrise:[],dhuhr:[],asr:[],maghrib:[],isha:[]}
for(const iso of dates){const o=offMin(iso),p=pred(best.lat,best.lon,iso)
 for(const c of Object.keys(res)){res[c].push(p[c]+o-hm(d[iso][c==='maghrib'?'maghribBegins':c==='isha'?'ishaBegins':c==='dhuhr'?'dhuhrBegins':c==='asr'?'asrBegins':c==='fajr'?'fajrIqamah':'sunrise']))}}
for(const c of Object.keys(res)){const a=res[c];console.log(c,'min',Math.min(...a).toFixed(1),'max',Math.max(...a).toFixed(1),'mean',(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2))}
// isha residual by month
const bym={}
for(const iso of dates){const i=+iso.slice(5,7);(bym[i]=bym[i]||[]).push(res.isha[dates.indexOf(iso)])}
console.log('isha residual by month',Object.entries(bym).map(([m,a])=>m+':'+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1)+'('+Math.min(...a).toFixed(0)+'..'+Math.max(...a).toFixed(0)+')').join(' '))
