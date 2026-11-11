const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const fs=require('fs');
const data = require(process.argv[2]);
const outPath=process.argv[3];
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const MARG={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:1,isha:1};
function chartMins(s,c){let [h,m]=s.split(':').map(Number);let v=h*60+m; if(['asr','maghrib','isha'].includes(c)&&v<720)v+=720; return v;}
function pad(n){return String(n).padStart(2,'0');}
function fmt(m){return pad(Math.floor(m/60)%24)+':'+pad(m%60);}
function mins(d){const s=d.toLocaleTimeString('en-GB',{timeZone:'Asia/Karachi',hour12:false});const [h,m]=s.split(':').map(Number);return h*60+m;}
function compute(lat,lng,date,FA,IA){const p=new adhan.CalculationParameters();p.method=adhan.CalculationMethod.Other;p.fajrAngle=FA;p.ishaAngle=IA;p.madhab=adhan.Madhab.Hanafi;p.rounding=adhan.Rounding.None;p.adjustments={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lng),date,p);return {fajr:mins(t.fajr),sunrise:mins(t.sunrise),dhuhr:mins(t.dhuhr),asr:mins(t.asr),maghrib:mins(t.maghrib),isha:mins(t.isha)};}
const lat=+process.argv[4],lng=+process.argv[5],FA=+process.argv[6],IA=+process.argv[7];
const out={}; let all6=0,all6w1=0,rows=0; const ex={},w1={},worst={};
COLS.forEach(c=>{ex[c]=0;w1[c]=0;worst[c]=0;});
for(const m of Object.keys(data))for(const d of Object.keys(data[m])){
  const iso=`2026-${m}-${pad(d)}`; const date=new Date(Date.UTC(2026,+m-1,+d,6,0,0));
  const ct=compute(lat,lng,date,FA,IA); const ch=data[m][d]; rows++;
  const row={}; let e=true,w=true;
  COLS.forEach((c,i)=>{row[c]=fmt(chartMins(ch[i],c)); const r=chartMins(ch[i],c)-(ct[c]+MARG[c]);
    if(r===0)ex[c]++; else e=false; if(Math.abs(r)<=1)w1[c]++; else w=false;
    if(Math.abs(r)>Math.abs(worst[c])) worst[c]=r;});
  if(e)all6++; if(w)all6w1++;
  out[iso]=row;
}
fs.writeFileSync(outPath,JSON.stringify(out,null,0));
console.log('rows',rows,'all6 exact',all6,(100*all6/rows).toFixed(1)+'%','all6 within1',all6w1,(100*all6w1/rows).toFixed(1)+'%');
COLS.forEach(c=>console.log(c.padEnd(8),'exact',ex[c],(100*ex[c]/rows).toFixed(1)+'%','within1',w1[c],(100*w1[c]/rows).toFixed(1)+'%','worst',worst[c]));
