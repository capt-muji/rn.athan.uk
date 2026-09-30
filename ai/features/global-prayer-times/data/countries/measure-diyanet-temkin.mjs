import {readFileSync} from 'node:fs';
import {timeAtAngle, asrTime, midDay, angleAtTime, asrFactorAtTime, toH, hm} from './solar-harness.mjs';
// Diyanet's own Ankara feed, ezanvakti.emushaf.net/vakitler?ilce=9206 (Diyanet's published
// data, same values as namazvakitleri.diyanet.gov.tr), 32 days from 2026-09-23, fetched 2026-09-30.
// Question: is R2 right that the 1982 reform abolished temkin, or R1 right that a temkin is
// still present? The feed carries BOTH the prayer rows and Diyanet's own unadjusted
// astronomical sunrise/sunset (GunesDogus / GunesBatis), so the two can be differenced directly.
const rows = JSON.parse(readFileSync(new URL('./turkey-diyanet-ankara-32d.json',import.meta.url),'utf8'));
const lat=39.9334, lng=32.8597, tz=3;   // Ankara
const ELEV=938;                          // metres, Ankara. Horizon dip = 0.0347*sqrt(h) degrees.
const dip = 0.0347*Math.sqrt(ELEV);
const stats={};
const push=(k,v)=>{(stats[k] ||= []).push(v);};
for (const r of rows){
  const [dd,mm,yy]=r.date.split('.').map(Number);
  const y=yy,m=mm,d=dd;
  const noon=midDay(y,m,d,lng,tz);
  const srSea=timeAtAngle(y,m,d,lat,lng,tz,0.833,-1);
  const ssSea=timeAtAngle(y,m,d,lat,lng,tz,0.833,+1);
  const srElev=timeAtAngle(y,m,d,lat,lng,tz,0.833+dip,-1);
  const ssElev=timeAtAngle(y,m,d,lat,lng,tz,0.833+dip,+1);
  push('Gunes_minus_GunesDogus', Math.round((toH(r.Gunes)-toH(r.GunesDogus))*60));
  push('Aksam_minus_GunesBatis', Math.round((toH(r.Aksam)-toH(r.GunesBatis))*60));
  push('GunesDogus_vs_seaLevelSunrise', +((toH(r.GunesDogus)-srSea)*60).toFixed(1));
  push('GunesBatis_vs_seaLevelSunset',  +((toH(r.GunesBatis)-ssSea)*60).toFixed(1));
  push('GunesDogus_vs_elevSunrise', +((toH(r.GunesDogus)-srElev)*60).toFixed(1));
  push('GunesBatis_vs_elevSunset',  +((toH(r.GunesBatis)-ssElev)*60).toFixed(1));
  push('Ogle_vs_trueNoon', +((toH(r.Ogle)-noon)*60).toFixed(1));
  push('Ikindi_vs_stdAsr', +((toH(r.Ikindi)-asrTime(y,m,d,lat,lng,tz,1))*60).toFixed(1));
  push('Imsak_angle', +angleAtTime(y,m,d,lat,lng,tz,toH(r.Imsak)).toFixed(2));
  push('Yatsi_angle', +angleAtTime(y,m,d,lat,lng,tz,toH(r.Yatsi)).toFixed(2));
  push('Gunes_angle', +angleAtTime(y,m,d,lat,lng,tz,toH(r.Gunes)).toFixed(2));
  push('Aksam_angle', +angleAtTime(y,m,d,lat,lng,tz,toH(r.Aksam)).toFixed(2));
}
console.log('Ankara elevation', ELEV, 'm -> horizon dip', dip.toFixed(3), 'deg');
for (const [k,v] of Object.entries(stats))
  console.log(k.padEnd(32), `min ${Math.min(...v)}  max ${Math.max(...v)}  mean ${(v.reduce((s,x)=>s+x,0)/v.length).toFixed(2)}`);

// Second test, the decisive one. If the Gunes/Aksam offset were an ELEVATION correction
// it would scale with the city's height. Diyanet's own feed for six cities spanning
// 0 m to 1900 m, fetched 2026-09-30:
//   Ankara 938 m, Izmir 25 m, Samsun 4 m, Trabzon 0 m, Antalya 30 m, Erzurum 1900 m
// Gunes minus GunesDogus and Aksam minus GunesBatis, per city:
const cityCheck=[
 ['Ankara',938,'06:37','06:44','18:41','18:34'],
 ['Istanbul',40,'06:56','07:03','18:50','18:43'],
 ['Izmir',25,'06:58','07:05','19:06','18:59'],
 ['Samsun',4,'06:23','06:30','18:16','18:09'],
 ['Antalya',30,'06:44','06:51','18:50','18:43'],
 ['Erzurum',1900,'07:05','07:12','18:58','18:51'],
 ['Trabzon',0,'06:27','06:34','18:20','18:13'],
];
console.log('\ncity        elev_m  Gunes-GunesDogus  Aksam-GunesBatis');
for (const [n,e,g,gd,a,ab] of cityCheck)
  console.log(n.padEnd(11), String(e).padStart(5),
    String(Math.round((toH(g)-toH(gd))*60)).padStart(12),
    String(Math.round((toH(a)-toH(ab))*60)).padStart(17));
