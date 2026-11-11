const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const data = require('../data/quetta-transcribed.js');
// index in stored row: 0 fajr,1 sunrise,2 zawal,3 zuhr,4 asr1,5 asr2,6 maghrib,7 isha
const IDX={fajr:0,sunrise:1,zuhr:3,asr:5,maghrib:6,isha:7};
const COLS=Object.keys(IDX);
const PM={zuhr:1,asr:1,maghrib:1,isha:1};
function chartMins(s,c){let [h,m]=s.split(':').map(Number);let v=h*60+m; if(PM[c]&&v<720)v+=720; return v;}
function mins(d){const s=d.toLocaleTimeString('en-GB',{timeZone:'Asia/Karachi',hour12:false});const [h,m]=s.split(':').map(Number);return h*60+m;}
function compute(lat,lng,date,FA,IA){const p=new adhan.CalculationParameters();p.method=adhan.CalculationMethod.Other;p.fajrAngle=FA;p.ishaAngle=IA;p.madhab=adhan.Madhab.Hanafi;p.rounding=adhan.Rounding.None;p.adjustments={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lng),date,p);return {fajr:mins(t.fajr),sunrise:mins(t.sunrise),zuhr:mins(t.dhuhr),asr:mins(t.asr),maghrib:mins(t.maghrib),isha:mins(t.isha)};}
const lat=+process.argv[2],lng=+process.argv[3],FA=+process.argv[4],IA=+process.argv[5];
const dates=[];for(const m of Object.keys(data))for(const d of Object.keys(data[m]))dates.push([`2026-${m}-${String(d).padStart(2,'0')}`,data[m][d]]);
for(const c of COLS){
  let best=null;
  for(let mg=-2;mg<=3;mg+=0.5){
    let s=0,ex=0,w=0;
    for(const [iso,ch] of dates){const ct=compute(lat,lng,new Date(iso+'T06:00:00Z'),FA,IA);const r=chartMins(ch[IDX[c]],c)-(ct[c]+mg);s+=Math.abs(r);if(r===0)ex++;if(Math.abs(r)>Math.abs(w))w=r;}
    const ma=s/dates.length; if(!best||ma<best.ma)best={mg,ma,ex,w};
  }
  console.log(c.padEnd(8),'margin',String(best.mg).padStart(4),'mean|r|',best.ma.toFixed(2),'exact',best.ex+'/'+dates.length,'worst',best.w);
}
