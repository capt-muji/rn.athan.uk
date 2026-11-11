const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const data = require('../data/peshawar-transcribed.js');
function chartMins(s,c){let [h,m]=s.split(':').map(Number);let v=h*60+m; if(['asr','maghrib','isha'].includes(c)&&v<720)v+=720; return v;}
function mins(d){const s=d.toLocaleTimeString('en-GB',{timeZone:'Asia/Karachi',hour12:false});const [h,m]=s.split(':').map(Number);return h*60+m;}
function compute(lat,lng,iso,FA,IA){const p=new adhan.CalculationParameters();p.method=adhan.CalculationMethod.Other;p.fajrAngle=FA;p.ishaAngle=IA;p.madhab=adhan.Madhab.Hanafi;p.rounding=adhan.Rounding.None;p.adjustments={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lng),new Date(iso+'T06:00:00Z'),p);return {fajr:mins(t.fajr),isha:mins(t.isha),maghrib:mins(t.maghrib),sunrise:mins(t.sunrise)};}
const dates=[];for(const m of Object.keys(data))for(const d of Object.keys(data[m]))dates.push([`2026-${m}-${String(d).padStart(2,'0')}`,data[m][d]]);
for(const FA of [17.8,18,18.2,18.4,18.5,18.6]){
  let s=0,n=0; for(const [iso,ch] of dates){const ct=compute(34.0151,71.5249,iso,FA,18); s+=Math.abs(chartMins(ch[0],'fajr')-ct.fajr); n++;}
  console.log('fajr angle',FA,'mean|r|',(s/n).toFixed(2));
}
for(const IA of [17.6,17.8,18,18.2,18.5]){
  let s=0,n=0; for(const [iso,ch] of dates){const ct=compute(34.0151,71.5249,iso,18,IA); s+=Math.abs(chartMins(ch[5],'isha')-ct.isha); n++;}
  console.log('isha angle',IA,'mean|r|',(s/n).toFixed(2));
}
