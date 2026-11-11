const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const data = require('../data/quetta-transcribed.js');
const IDX={fajr:0,sunrise:1,zuhr:3,asr:5,maghrib:6,isha:7};
const PM={zuhr:1,asr:1,maghrib:1,isha:1};
function chartMins(s,c){let [h,m]=s.split(':').map(Number);let v=h*60+m; if(PM[c]&&v<720)v+=720; return v;}
function mins(d){const s=d.toLocaleTimeString('en-GB',{timeZone:'Asia/Karachi',hour12:false});const [h,m]=s.split(':').map(Number);return h*60+m;}
function compute(lat,lng,date,FA,IA){const p=new adhan.CalculationParameters();p.method=adhan.CalculationMethod.Other;p.fajrAngle=FA;p.ishaAngle=IA;p.madhab=adhan.Madhab.Hanafi;p.rounding=adhan.Rounding.None;p.adjustments={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lng),date,p);return {fajr:mins(t.fajr),sunrise:mins(t.sunrise),zuhr:mins(t.dhuhr),asr:mins(t.asr),maghrib:mins(t.maghrib),isha:mins(t.isha)};}
const lat=+process.argv[2],lng=+process.argv[3];
const dates=[];for(const m of Object.keys(data))for(const d of Object.keys(data[m]))dates.push([`2026-${m}-${String(d).padStart(2,'0')}`,data[m][d]]);
function best(col,angles,ias){
  let out=[];
  for(const a of angles) for(let mg=-2;mg<=2;mg+=0.5){
    let s=0,ex=0;
    for(const [iso,ch] of dates){const ct=compute(lat,lng,new Date(iso+'T06:00:00Z'),ias?a:18,ias?18:a);const r=chartMins(ch[IDX[col]],col)-(ct[col]+mg);s+=Math.abs(r);if(r===0)ex++;}
    out.push({a,mg,ma:s/dates.length,ex});
  }
  out.sort((x,y)=>x.ma-y.ma);
  console.log(col, out.slice(0,4).map(o=>`ang=${o.a} mg=${o.mg} mean|r|=${o.ma.toFixed(2)} ex=${o.ex}`).join(' | '));
}
best('fajr',[17.5,17.7,18,18.2,18.5,19],true);
best('isha',[17,17.5,17.7,18,18.2,18.5,19],false);
best('maghrib',[18],false);
