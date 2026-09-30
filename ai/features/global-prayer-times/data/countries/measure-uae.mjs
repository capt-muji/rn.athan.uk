import {readFileSync} from 'node:fs';
import {invertRow} from './solar-harness.mjs';
// UAE Awqaf own data, mobileappapi.awqaf.gov.ae/APIS/v3, fetched 2026-09-30 via agent-browser
// on the www.awqaf.gov.ae origin with an anonymous bearer token from /sso/StartRequest.
const rows=JSON.parse(readFileSync(new URL('./uae-awqaf-sep2026.json',import.meta.url)));
const coords={ 'Abu Dhabi':[24.4539,54.3773], 'Dubai':[25.2048,55.2708],
               'Sharjah':[25.3463,55.4209], 'Fujairah':[25.1288,56.3265] };
const tz=4, acc={};
for (const [area,date,emsak,fajr,shurooq,zuhr,asr,maghrib,isha] of rows){
  const [lat,lng]=coords[area]; const [y,m,d]=date.split('-').map(Number);
  const r=invertRow({y,m,d,lat,lng,tz,fajr,sunrise:shurooq,dhuhr:zuhr,asr,maghrib,isha});
  (acc[area] ||= []).push(r);
}
const stat=(a,k)=>{const v=a.map(x=>x[k]).filter(x=>x!=null);
  return {min:+Math.min(...v).toFixed(2), max:+Math.max(...v).toFixed(2),
          mean:+(v.reduce((s,x)=>s+x,0)/v.length).toFixed(2)};};
for (const [area,a] of Object.entries(acc))
  console.log(area, 'n='+a.length, JSON.stringify(Object.fromEntries(
    ['fajrAngle','sunriseAngle','dhuhrOffsetMin','asrFactor','maghribMinusSunsetMin','ishaAngle','ishaAfterMaghribMin']
      .map(k=>[k,stat(a,k)]))));
