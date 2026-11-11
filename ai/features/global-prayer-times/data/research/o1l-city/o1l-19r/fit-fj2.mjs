import { PrayerTimes, Coordinates, CalculationMethod, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js'
import fs from 'node:fs'
const rows=JSON.parse(fs.readFileSync('data/fj-2026-dpt-widget-year.json','utf8')).rows
const zone='Pacific/Fiji', LAT=-18.1416, LON=178.4419
const offMin=(iso)=>{const [y,m,dd]=iso.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,dd,4,0,0));
const dtf=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const p=Object.fromEntries(dtf.formatToParts(dt).map(x=>[x.type,x.value]));return Math.round((Date.UTC(+p.year,+p.month-1,+p.day,+p.hour%24,+p.minute)-dt.getTime())/60000)}
const hm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m}
const dates=Object.keys(rows).sort()
const mk=(fa,ia)=>{const p=CalculationMethod.Other();p.fajrAngle=fa;p.ishaAngle=ia;p.rounding=Rounding.None;return p}
const pred=(fa,ia,iso)=>{const [y,m,dd]=iso.split('-').map(Number);const p=mk(fa,ia)
const pt=new PrayerTimes(new Coordinates(LAT,LON),new Date(Date.UTC(y,m-1,dd,4,0,0)),p)
const f=t=>(t.getTime()-Date.UTC(y,m-1,dd,0,0,0))/60000;return {fajr:f(pt.fajr),sunrise:f(pt.sunrise),dhuhr:f(pt.dhuhr),asr:f(pt.asr),maghrib:f(pt.maghrib),isha:f(pt.isha)}}
const obs={fajr:'suhoorEnd',sunrise:'sunrise',dhuhr:'dhuhrBegins',asr:'asrBegins',maghrib:'maghribBegins',isha:'ishaBegins'}
const stats=(fa,ia)=>{const r={};for(const c of Object.keys(obs))r[c]=[]
 for(const iso of dates){const o=offMin(iso),p=pred(fa,ia,iso);for(const c of Object.keys(obs))r[c].push(p[c]+o-hm(rows[iso][obs[c]]))}
 const out={};for(const c of Object.keys(obs)){const a=r[c];out[c]=[+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2),+Math.min(...a).toFixed(1),+Math.max(...a).toFixed(1)]}
 return out}
console.log('18/17 zero margins:',JSON.stringify(stats(18,17)))
let best={e:1e9}
for(let fa=17.6;fa<=18.6;fa+=0.1)for(let ia=16.4;ia<=18.2;ia+=0.1){
  const s=stats(fa,ia);let e=0;for(const c of ['fajr','isha'])e+=Math.abs(s[c][0])*2+Math.abs(s[c][2]-s[c][1])
  if(e<best.e)best={e,fa:+fa.toFixed(1),ia:+ia.toFixed(1),s}}
console.log('best angle pair',best.fa,best.ia,JSON.stringify(best.s))
// isha as maghrib interval
const ints=dates.map(iso=>hm(rows[iso].ishaIqamah)-hm(rows[iso].maghribIqamah))
console.log('isha iqamah - maghrib iqamah: min',Math.min(...ints),'max',Math.max(...ints))
const bi=dates.map(iso=>hm(rows[iso].ishaBegins)-hm(rows[iso].maghribBegins))
console.log('isha begins - maghrib begins: min',Math.min(...bi),'max',Math.max(...bi))
const fj=dates.map(iso=>hm(rows[iso].sunrise)-hm(rows[iso].suhoorEnd))
console.log('sunrise - suhoorEnd: min',Math.min(...fj),'max',Math.max(...fj))
