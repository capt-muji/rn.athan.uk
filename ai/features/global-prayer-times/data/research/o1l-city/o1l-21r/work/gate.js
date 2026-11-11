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
const lat=+process.argv[2]||34.0151, lng=+process.argv[3]||71.5249;
const FA=+process.argv[4]||18, IA=+process.argv[5]||18;
const quiet = process.argv[6]==='q';
let rows=0, exact={}, within1={}, worst={}, sum={}, flags=[], perMonth={};
for(const c of COLS){exact[c]=0;within1[c]=0;worst[c]=0;sum[c]=0;}
for(const m of Object.keys(data)){
  perMonth[m]={rows:0,exact:0,worst:0};
  for(const d of Object.keys(data[m])){
    const iso=`2026-${m}-${String(d).padStart(2,'0')}`;
    const ct=compute(lat,lng,iso,FA,IA); const ch=data[m][d]; rows++; perMonth[m].rows++;
    let allExact=true;
    COLS.forEach((c,i)=>{
      const v=chartMins(ch[i],c); const r=v-ct[c];
      sum[c]+=r; if(r===0) exact[c]++; if(Math.abs(r)<=1) within1[c]++;
      if(Math.abs(r)>Math.abs(worst[c])) worst[c]=r;
      if(r!==0) allExact=false;
      if(Math.abs(r)>=2) flags.push(`${iso} ${c} chart=${ch[i]} calc=${String(Math.floor(ct[c]/60)%24).padStart(2,'0')}:${String(ct[c]%60).padStart(2,'0')} r=${r}`);
      if(Math.abs(r)>Math.abs(perMonth[m].worst)) perMonth[m].worst=r;
    });
    if(allExact) perMonth[m].exact++;
  }
}
console.log(`rows=${rows} lat=${lat} lng=${lng} fajr=${FA} isha=${IA}`);
for(const c of COLS) console.log(c.padEnd(8),'exact',String(exact[c]).padStart(3),'within1',String(within1[c]).padStart(3),'worst',String(worst[c]).padStart(3),'mean',(sum[c]/rows).toFixed(2));
console.log('months', Object.entries(perMonth).map(([m,v])=>`${m}:${v.exact}/${v.rows}w${v.worst}`).join(' '));
console.log('flagged',flags.length);
if(!quiet) console.log(flags.join('\n'));
