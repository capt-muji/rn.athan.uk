const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const data = require('../data/peshawar-transcribed.js');
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const PM={asr:1,maghrib:1,isha:1};
function chartMins(s,c){let [h,m]=s.split(':').map(Number);let v=h*60+m; if(PM[c]&&v<720)v+=720; return v;}
function mins(d){const s=d.toLocaleTimeString('en-GB',{timeZone:'Asia/Karachi',hour12:false});const [h,m]=s.split(':').map(Number);return h*60+m;}
function compute(lat,lng,iso,FA,IA){const p=new adhan.CalculationParameters();p.method=adhan.CalculationMethod.Other;p.fajrAngle=FA;p.ishaAngle=IA;p.madhab=adhan.Madhab.Hanafi;p.rounding=adhan.Rounding.None;p.adjustments={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lng),new Date(iso+'T06:00:00Z'),p);return {fajr:mins(t.fajr),sunrise:mins(t.sunrise),dhuhr:mins(t.dhuhr),asr:mins(t.asr),maghrib:mins(t.maghrib),isha:mins(t.isha)};}
const lat=+process.argv[2],lng=+process.argv[3],FA=+process.argv[4],IA=+process.argv[5];
const byMonth={};
for(const m of Object.keys(data)){
  const acc={}; COLS.forEach(c=>acc[c]=[]);
  for(const d of Object.keys(data[m])){const iso=`2026-${m}-${String(d).padStart(2,'0')}`;const ct=compute(lat,lng,iso,FA,IA);const ch=data[m][d];
    COLS.forEach((c,i)=>acc[c].push(chartMins(ch[i],c)-ct[c]));}
  byMonth[m]=Object.fromEntries(COLS.map(c=>[c,(acc[c].reduce((a,b)=>a+b,0)/acc[c].length).toFixed(2)+' ['+Math.min(...acc[c])+','+Math.max(...acc[c])+']']));
}
for(const m of Object.keys(byMonth)) console.log(m, COLS.map(c=>c.slice(0,3)+':'+byMonth[m][c]).join(' '));
