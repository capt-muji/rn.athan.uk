const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const data = require('../data/peshawar-transcribed.js');
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const MARG={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:1,isha:1};
function chartMins(s,c){let [h,m]=s.split(':').map(Number);let v=h*60+m; if(['asr','maghrib','isha'].includes(c)&&v<720)v+=720; return v;}
function mins(d){const s=d.toLocaleTimeString('en-GB',{timeZone:'Asia/Karachi',hour12:false});const [h,m]=s.split(':').map(Number);return h*60+m;}
function compute(lat,lng,iso,FA,IA){const p=new adhan.CalculationParameters();p.method=adhan.CalculationMethod.Other;p.fajrAngle=FA;p.ishaAngle=IA;p.madhab=adhan.Madhab.Hanafi;p.rounding=adhan.Rounding.None;p.adjustments={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lng),new Date(iso+'T06:00:00Z'),p);return {fajr:mins(t.fajr),sunrise:mins(t.sunrise),dhuhr:mins(t.dhuhr),asr:mins(t.asr),maghrib:mins(t.maghrib),isha:mins(t.isha)};}
const lat=+process.argv[2],lng=+process.argv[3],FA=+process.argv[4],IA=+process.argv[5];
let flags=[],ex={},w1={},rows=0;
COLS.forEach(c=>{ex[c]=0;w1[c]=0;});
for(const m of Object.keys(data))for(const d of Object.keys(data[m])){
  const iso=`2026-${m}-${String(d).padStart(2,'0')}`; const ct=compute(lat,lng,iso,FA,IA); const ch=data[m][d]; rows++;
  COLS.forEach((c,i)=>{const r=chartMins(ch[i],c)-(ct[c]+MARG[c]); if(r===0)ex[c]++; if(Math.abs(r)<=1)w1[c]++;
    if(Math.abs(r)>=2)flags.push(`${iso} ${c} chart=${ch[i]} calc=${String(Math.floor((ct[c]+MARG[c])/60)%24).padStart(2,'0')}:${String(Math.round((ct[c]+MARG[c])%60)).padStart(2,'0')} r=${r}`);});
}
console.log('rows',rows);
COLS.forEach(c=>console.log(c.padEnd(8),'exact',String(ex[c]).padStart(3),'within1',String(w1[c]).padStart(3)));
console.log('flags',flags.length); console.log(flags.join('\n'));
