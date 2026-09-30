import {readFileSync} from 'node:fs';
import {invertRow, angleAtTime, timeAtAngle, toH, hm} from './solar-harness.mjs';
// Caucasus Muslims Board (Qafqaz Muselmanlari Idaresi) own Baku table for September 2026,
// caucasus-muslims.org/az/namaz-calendar?city=baki&year=2026&month=9, fetched 2026-09-30.
// The board publishes the table only as a WebP image; OCR'd locally with macOS Vision (ocr.swift).
// Columns: Imsak | Subh azani | Gun cixir | Zohr azani | Esr azani | Gun batir | Magrib azani | Isa azani | Gece yarisi
const lat=40.4093, lng=49.8671, tz=4, y=2026, m=9;
const rows=readFileSync(new URL('./az-baki-2026-09.tsv',import.meta.url),'utf8').split('\n')
  .map(l=>l.split('\t').filter(c=>/^\d{2}:\d{2}$/.test(c))).filter(c=>c.length===9);
console.log('rows parsed:', rows.length);
const acc=[];
rows.forEach((c,i)=>{
  const d=i+1;
  const [imsak,subh,gun,zohr,esr,batir,magrib,isa,gece]=c;
  acc.push({d,
    imsakAng:+angleAtTime(y,m,d,lat,lng,tz,toH(imsak)).toFixed(2),
    subhAng:+angleAtTime(y,m,d,lat,lng,tz,toH(subh)).toFixed(2),
    sunriseAng:+angleAtTime(y,m,d,lat,lng,tz,toH(gun)).toFixed(2),
    ...invertRow({y,m,d,lat,lng,tz,dhuhr:zohr,asr:esr,maghrib:magrib,isha:isa}),
    sunsetAng:+angleAtTime(y,m,d,lat,lng,tz,toH(batir)).toFixed(2),
    magribMinusBatirMin:Math.round((toH(magrib)-toH(batir))*60),
    subhMinusImsakMin:Math.round((toH(subh)-toH(imsak))*60),
    geceVsMidSunsetFajr:(()=>{const mid=(toH(batir)+toH(subh)+24)/2; return Math.round((toH(gece)-mid)*60);})(),
  });
});
const stat=k=>{const v=acc.map(x=>x[k]).filter(x=>x!=null);
 return `${Math.min(...v).toFixed(2)} to ${Math.max(...v).toFixed(2)} (mean ${(v.reduce((s,x)=>s+x,0)/v.length).toFixed(2)})`;};
for (const k of ['imsakAng','subhAng','sunriseAng','dhuhrOffsetMin','asrFactor','sunsetAng','magribMinusBatirMin','maghribAngle','ishaAngle','ishaAfterMaghribMin','subhMinusImsakMin','geceVsMidSunsetFajr'])
  console.log(k.padEnd(22), stat(k));
