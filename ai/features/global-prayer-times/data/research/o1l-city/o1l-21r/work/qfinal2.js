const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const fs=require('fs');
const data = require('../data/quetta-transcribed.js');
const IDX={fajr:0,sunrise:1,zuhr:3,asr:5,maghrib:6,isha:7};
const COLS=Object.keys(IDX);
const PM={zuhr:1,asr:1,maghrib:1,isha:1};
const SKIP=new Set(['2026-04-23|sunrise','2026-09-16|isha','2026-09-25|isha']);
function chartMins(s,c){let [h,m]=s.split(':').map(Number);let v=h*60+m; if(PM[c]&&v<720)v+=720; return v;}
function pad(n){return String(n).padStart(2,'0');}
function fmt(m){return pad(Math.floor(m/60)%24)+':'+pad(Math.round(m)%60);}
function mins(d){const s=d.toLocaleTimeString('en-GB',{timeZone:'Asia/Karachi',hour12:false});const [h,m]=s.split(':').map(Number);return h*60+m;}
function compute(lat,lng,date,FA,IA){const p=new adhan.CalculationParameters();p.method=adhan.CalculationMethod.Other;p.fajrAngle=FA;p.ishaAngle=IA;p.madhab=adhan.Madhab.Hanafi;p.rounding=adhan.Rounding.None;p.adjustments={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lng),date,p);return {fajr:mins(t.fajr),sunrise:mins(t.sunrise),zuhr:mins(t.dhuhr),asr:mins(t.asr),maghrib:mins(t.maghrib),isha:mins(t.isha)};}
const lat=+process.argv[2],lng=+process.argv[3],FA=+process.argv[4],IA=+process.argv[5];
const MARG={fajr:+(process.argv[6]||0),sunrise:+(process.argv[7]||0),zuhr:+(process.argv[8]||0),asr:+(process.argv[9]||0),maghrib:+(process.argv[10]||0),isha:+(process.argv[11]||0)};
const out={};let all6=0,all6w1=0,rows=0;const ex={},w1={},worst={},n={};
COLS.forEach(c=>{ex[c]=0;w1[c]=0;worst[c]=0;n[c]=0;});
for(const m of Object.keys(data))for(const d of Object.keys(data[m])){
  const iso=`2026-${m}-${pad(d)}`;
  const ct=compute(lat,lng,new Date(iso+'T06:00:00Z'),FA,IA);const ch=data[m][d];rows++;
  const row={};let e=true,w=true;
  COLS.forEach(c=>{const v=chartMins(ch[IDX[c]],c);row[c]=fmt(v);
    if(SKIP.has(iso+'|'+c)) return;
    const r=v-(ct[c]+MARG[c]); n[c]++;
    if(r===0)ex[c]++;else e=false; if(Math.abs(r)<=1)w1[c]++;else w=false;
    if(Math.abs(r)>Math.abs(worst[c]))worst[c]=r;});
  if(e)all6++; if(w)all6w1++;
  out[iso]=row;
}
if(process.argv[12]) fs.writeFileSync(process.argv[12],JSON.stringify(out,null,0));
console.log('rows',rows,'(3 printed anomalies excluded from scoring)','all6 within1',all6w1,(100*all6w1/rows).toFixed(1)+'%');
COLS.forEach(c=>console.log(c.padEnd(8),'exact',String(ex[c]).padStart(3),(100*ex[c]/n[c]).toFixed(1)+'%','within1',String(w1[c]).padStart(3),(100*w1[c]/n[c]).toFixed(1)+'%','worst',worst[c]));
