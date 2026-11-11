const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const data = require('../data/peshawar-transcribed.js');
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const MARG={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:1,isha:1};
function chartMins(s,c){let [h,m]=s.split(':').map(Number);let v=h*60+m; if(['asr','maghrib','isha'].includes(c)&&v<720)v+=720; return v;}
function mins(d){const s=d.toLocaleTimeString('en-GB',{timeZone:'Asia/Karachi',hour12:false});const [h,m]=s.split(':').map(Number);return h*60+m;}
function compute(lat,lng,date,FA,IA){const p=new adhan.CalculationParameters();p.method=adhan.CalculationMethod.Other;p.fajrAngle=FA;p.ishaAngle=IA;p.madhab=adhan.Madhab.Hanafi;p.rounding=adhan.Rounding.None;p.adjustments={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lng),date,p);return {fajr:mins(t.fajr),sunrise:mins(t.sunrise),dhuhr:mins(t.dhuhr),asr:mins(t.asr),maghrib:mins(t.maghrib),isha:mins(t.isha)};}
const lat=+process.argv[2],lng=+process.argv[3],FA=+process.argv[4],IA=+process.argv[5];
for(let y=2018;y<=2032;y++){
  let s=0,n=0,ex=0;
  for(const m of Object.keys(data))for(const d of Object.keys(data[m])){
    const date=new Date(Date.UTC(y,+m-1,+d,6,0,0)); const ct=compute(lat,lng,date,FA,IA); const ch=data[m][d];
    COLS.forEach((c,i)=>{const r=chartMins(ch[i],c)-(ct[c]+MARG[c]); s+=Math.abs(r); n++; if(r===0)ex++;});
  }
  console.log(y,'mean|r|',(s/n).toFixed(3),'exact%',(100*ex/n).toFixed(1));
}
