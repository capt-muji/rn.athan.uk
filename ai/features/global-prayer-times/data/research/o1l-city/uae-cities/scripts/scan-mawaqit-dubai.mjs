import fs from 'fs';
import adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js';
const d=JSON.parse(fs.readFileSync('captures/ae-dubai-mawaqit-ghumran-rashid-confdata.json','utf8'));
const toMin=s=>{const [h,m]=s.split(':').map(Number);return h*60+m;};
function mk(fajr,ishaInt,adj){const p=new adhan.CalculationParameters('Other',fajr,0,ishaInt);p.madhab=adhan.Madhab.Shafi;p.highLatitudeRule=adhan.HighLatitudeRule.MiddleOfTheNight;p.adjustments={...adj};p.rounding=adhan.Rounding.None;return p;}
function pred(dateStr,adj,fajr,ishaInt){const [y,m,dd]=dateStr.split('-').map(Number);const ds=Date.UTC(y,m-1,dd);
 const t=new adhan.PrayerTimes(new adhan.Coordinates(d.latitude,d.longitude),new Date(ds),mk(fajr,ishaInt,adj));
 const o={};for(const k of ['fajr','sunrise','dhuhr','asr','maghrib','isha']){const mins=(new Date(t[k]).getTime()-ds)/60000+240;o[k]=k==='sunrise'?Math.floor(mins+1e-9):Math.round(mins);}return o;}
const rows=[];
for(let mi=0;mi<12;mi++)for(const day of Object.keys(d.calendar[mi]))rows.push({date:`2026-${String(mi+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,v:d.calendar[mi][day]});
const ZERO={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};
let best=null;
for(let f=17.0;f<=19.6;f+=0.1){
  let se=0,n=0;
  for(const r of rows){const p=pred(r.date,ZERO,f,90);const diff=toMin(r.v[0])-p.fajr;se+=diff*diff;n++;}
  const rms=Math.sqrt(se/n);
  if(!best||rms<best.rms)best={f:+f.toFixed(2),rms};
  if(Math.abs(f-18.2)<0.05||Math.abs(f-18.5)<0.05||Math.abs(f-19.5)<0.05)console.log('fajr',f.toFixed(1),'rms',rms.toFixed(3));
}
console.log('best fajr angle',best);
// isha interval scan
for(const iv of [80,85,87,88,89,90,91,92,95,100]){
  let w1=0,n=0,bias=0;
  for(const r of rows){const p=pred(r.date,ZERO,18.2,iv);const diff=toMin(r.v[5])-p.isha;if(Math.abs(diff)<=1)w1++;bias+=diff;n++;}
  console.log('ishaInt',iv,'w1',(100*w1/n).toFixed(1),'bias',(bias/n).toFixed(2));
}
// margins for sun columns at fajr 18.2/isha 90
for(const adj of [{...ZERO},{fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0}]){
  let line=[];
  for(const [i,k] of ['fajr','sunrise','dhuhr','asr','maghrib','isha'].entries()){
    let bias=0,n=0,w1=0;
    for(const r of rows){const p=pred(r.date,ZERO,18.2,90);const diff=toMin(r.v[i])-p[k];bias+=diff;n++;if(Math.abs(diff)<=1)w1++;}
    line.push(`${k} bias ${(bias/n).toFixed(2)} w1 ${(100*w1/n).toFixed(1)}`);
  }
  console.log(line.join(' | '));
}
