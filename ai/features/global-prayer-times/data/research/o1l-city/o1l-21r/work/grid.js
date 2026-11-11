const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const data = require('../data/peshawar-transcribed.js');
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const PM={asr:1,maghrib:1,isha:1};
function chartMins(s,c){let [h,m]=s.split(':').map(Number); let v=h*60+m; if(PM[c]&&v<720) v+=720; return v;}
function mins(d){const s=d.toLocaleTimeString('en-GB',{timeZone:'Asia/Karachi',hour12:false});const [h,m]=s.split(':').map(Number);return h*60+m;}
function compute(lat,lng,iso,FA,IA){
  const p=new adhan.CalculationParameters();
  p.method=adhan.CalculationMethod.Other; p.fajrAngle=FA; p.ishaAngle=IA;
  p.madhab=adhan.Madhab.Hanafi; p.rounding=adhan.Rounding.None;
  p.adjustments={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};
  const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lng),new Date(iso+'T06:00:00Z'),p);
  return {fajr:mins(t.fajr),sunrise:mins(t.sunrise),dhuhr:mins(t.dhuhr),asr:mins(t.asr),maghrib:mins(t.maghrib),isha:mins(t.isha)};
}
const dates=[]; for(const m of Object.keys(data)) for(const d of Object.keys(data[m])) dates.push([`2026-${m}-${String(d).padStart(2,'0')}`,data[m][d]]);
function score(lat,lng,FA,IA){
  let s=0,w=0,per={}; COLS.forEach(c=>per[c]=0);
  for(const [iso,ch] of dates){const ct=compute(lat,lng,iso,FA,IA);
    COLS.forEach((c,i)=>{const r=chartMins(ch[i],c)-ct[c]; s+=Math.abs(r); per[c]+=Math.abs(r); if(Math.abs(r)>Math.abs(w)) w=r;});}
  return {s:s/dates.length,w,per:Object.fromEntries(COLS.map(c=>[c,(per[c]/dates.length).toFixed(2)]))};
}
let best=null;
for(let lat=33.80;lat<=34.30;lat+=0.02) for(let lng=71.40;lng<=71.65;lng+=0.02){
  const r=score(lat,lng,18,18);
  if(!best||r.s<best.r.s) best={lat,lng,r};
}
console.log('best',JSON.stringify(best));
console.log('ref 34.0151/71.5249',JSON.stringify(score(34.0151,71.5249,18,18)));
