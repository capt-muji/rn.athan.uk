const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const data = require('../data/peshawar-transcribed.js');
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
function chartMins(s,c){let [h,m]=s.split(':').map(Number);let v=h*60+m; if(['asr','maghrib','isha'].includes(c)&&v<720)v+=720; return v;}
function mins(d){const s=d.toLocaleTimeString('en-GB',{timeZone:'Asia/Karachi',hour12:false});const [h,m]=s.split(':').map(Number);return h*60+m;}
function compute(lat,lng,iso,FA,IA){const p=new adhan.CalculationParameters();p.method=adhan.CalculationMethod.Other;p.fajrAngle=FA;p.ishaAngle=IA;p.madhab=adhan.Madhab.Hanafi;p.rounding=adhan.Rounding.None;p.adjustments={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lng),new Date(iso+'T06:00:00Z'),p);return {fajr:mins(t.fajr),sunrise:mins(t.sunrise),dhuhr:mins(t.dhuhr),asr:mins(t.asr),maghrib:mins(t.maghrib),isha:mins(t.isha)};}
const lat=+process.argv[2],lng=+process.argv[3],FA=+process.argv[4],IA=+process.argv[5];
const dates=[];for(const m of Object.keys(data))for(const d of Object.keys(data[m]))dates.push([`2026-${m}-${String(d).padStart(2,'0')}`,data[m][d]]);
const cache=dates.map(([iso,ch])=>[ch,compute(lat,lng,iso,FA,IA)]);
for(const c of COLS){
  const i=COLS.indexOf(c); let best=null;
  for(let m=-2;m<=3;m+=0.5){
    let s=0,ex=0,w=0;
    for(const [ch,ct] of cache){const r=chartMins(ch[i],c)-(ct[c]+m); s+=Math.abs(r); if(r===0)ex++; if(Math.abs(r)>Math.abs(w))w=r;}
    const ma=s/cache.length;
    if(!best||ma<best.ma) best={m,ma,ex,w};
  }
  console.log(c.padEnd(8),'best margin',String(best.m).padStart(5),'mean|r|',best.ma.toFixed(2),'exact',best.ex+'/'+cache.length,'worst',best.w);
}
