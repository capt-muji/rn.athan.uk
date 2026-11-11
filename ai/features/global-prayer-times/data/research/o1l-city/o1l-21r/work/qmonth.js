const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const data = require('../data/quetta-transcribed.js');
const IDX={fajr:0,sunrise:1,zuhr:3,asr:5,maghrib:6,isha:7};
const PM={zuhr:1,asr:1,maghrib:1,isha:1};
function chartMins(s,c){let [h,m]=s.split(':').map(Number);let v=h*60+m; if(PM[c]&&v<720)v+=720; return v;}
function mins(d){const s=d.toLocaleTimeString('en-GB',{timeZone:'Asia/Karachi',hour12:false});const [h,m]=s.split(':').map(Number);return h*60+m;}
function compute(lat,lng,date,FA,IA){const p=new adhan.CalculationParameters();p.method=adhan.CalculationMethod.Other;p.fajrAngle=FA;p.ishaAngle=IA;p.madhab=adhan.Madhab.Hanafi;p.rounding=adhan.Rounding.None;p.adjustments={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lng),date,p);return {fajr:mins(t.fajr),sunrise:mins(t.sunrise),zuhr:mins(t.dhuhr),asr:mins(t.asr),maghrib:mins(t.maghrib),isha:mins(t.isha)};}
const lat=+process.argv[2],lng=+process.argv[3],FA=+process.argv[4],IA=+process.argv[5];
for(const m of Object.keys(data)){
  const acc={}; Object.keys(IDX).forEach(c=>acc[c]=[]);
  for(const d of Object.keys(data[m])){
    const ct=compute(lat,lng,new Date(`2026-${m}-${String(d).padStart(2,'0')}T06:00:00Z`),FA,IA);
    for(const c of Object.keys(IDX)) acc[c].push(chartMins(data[m][d][IDX[c]],c)-ct[c]);
  }
  console.log(m, Object.keys(IDX).map(c=>c.slice(0,3)+':'+(acc[c].reduce((a,b)=>a+b,0)/acc[c].length).toFixed(1)+'['+Math.min(...acc[c])+','+Math.max(...acc[c])+']').join(' '));
}
