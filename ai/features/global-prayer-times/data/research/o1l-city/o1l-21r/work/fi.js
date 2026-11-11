const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const tab = require(process.env.HOME + '/athan-gitree/census/o1k-wide/europe/data/fi-helsinki-rukousaika-2026.json');
const LAT=60.1699, LNG=24.9384, TZ='Europe/Helsinki';
function mins(d){if(!d)return null;const s=d.toLocaleTimeString('en-GB',{timeZone:TZ,hour12:false});const [h,m]=s.split(':').map(Number);return h*60+m;}
function tabMins(s){const [h,m]=s.split(':').map(Number);return h*60+m;}
function calc(date,{fajr=18,isha=17,madhab='shafi',hl='none',rule='fifth'}){
  const p=new adhan.CalculationParameters();
  p.method=adhan.CalculationMethod.Other; p.fajrAngle=fajr; p.ishaAngle=isha;
  p.madhab=madhab==='hanafi'?adhan.Madhab.Hanafi:adhan.Madhab.Shafi;
  p.rounding=adhan.Rounding.None;
  p.adjustments={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};
  const t=new adhan.PrayerTimes(new adhan.Coordinates(LAT,LNG),date,p);
  let f=mins(t.fajr), i=mins(t.isha), su=mins(t.sunrise), ma=mins(t.maghrib);
  if(hl==='fifth'){
    // night = sunset -> sunrise (minutes across midnight)
    const night = (1440 - ma + su);
    if(f===null || (f!==null && !okAngle(date,fajr))) f = Math.round(su - night/5);
    if(i===null || (i!==null && !okAngle(date,isha))) i = Math.round(ma + night/5);
  }
  return {fajr:f,sunrise:su,dhuhr:mins(t.dhuhr),asr:mins(t.asr),maghrib:ma,isha:i};
}
function okAngle(date,angle){
  // true if the sun reaches -angle at some point of the night (no clamp needed)
  const c=new adhan.Coordinates(LAT,LNG);
  // sample the night every 5 min from maghrib to sunrise
  const p=new adhan.CalculationParameters(); p.method=adhan.CalculationMethod.Other; p.fajrAngle=angle; p.ishaAngle=angle;
  const t=new adhan.PrayerTimes(c,date,p);
  return t.fajr!==null && t.isha!==null;
}
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
function score(opts,label){
  const ex={},w1={},sum={},worst={},n={};
  COLS.forEach(c=>{ex[c]=0;w1[c]=0;sum[c]=0;worst[c]=0;n[c]=0;});
  let all6w1=0,rows=0;
  for(const iso of Object.keys(tab)){
    const [y,m,d]=iso.split('-').map(Number);
    const t=calc(new Date(Date.UTC(y,m-1,d,10,0,0)),opts);
    const row=tab[iso]; rows++; let w=true;
    COLS.forEach(c=>{
      const tv=tabMins(row[c==='maghrib'?'magrib':c]);
      const cv=t[c]; if(cv===null) return;
      const r=tv-cv; n[c]++; sum[c]+=r;
      if(r===0)ex[c]++; if(Math.abs(r)<=1)w1[c]++; else w=false;
      if(Math.abs(r)>Math.abs(worst[c]))worst[c]=r;
    });
    if(w)all6w1++;
  }
  console.log('##',label,'rows',rows,'all6 within1',all6w1,(100*all6w1/rows).toFixed(1)+'%');
  COLS.forEach(c=>console.log('  ',c.padEnd(8),'mean',(sum[c]/n[c]).toFixed(2),'exact',ex[c],'within1',w1[c],'worst',worst[c],'n',n[c]));
}
score({fajr:18,isha:17,madhab:'shafi',hl:'fifth'},'MWL 18/17 + 1/5-night, Shafi asr');
score({fajr:18,isha:17,madhab:'hanafi',hl:'fifth'},'MWL 18/17 + 1/5-night, Hanafi asr');
score({fajr:18,isha:17,madhab:'shafi',hl:'none'},'MWL 18/17 raw (no high-lat rule)');
