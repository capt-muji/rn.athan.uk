const tab = require(process.env.HOME + '/athan-gitree/census/o1k-wide/europe/data/fi-helsinki-rukousaika-2026.json');
const LAT=60.1699, LNG=24.9384, TZ='Europe/Helsinki';
const rad=Math.PI/180;
function solarAlt(ms){ // ms = epoch ms
  const jd = ms/86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = (280.460 + 0.9856474*n) % 360;
  const g = ((357.528 + 0.9856003*n) % 360)*rad;
  const lambda = (L + 1.915*Math.sin(g) + 0.020*Math.sin(2*g))*rad;
  const eps = (23.439 - 0.0000004*n)*rad;
  const dec = Math.asin(Math.sin(eps)*Math.sin(lambda));
  const ra = Math.atan2(Math.cos(eps)*Math.sin(lambda), Math.cos(lambda));
  const gmst = (18.697374558 + 24.06570982441908*n) % 24;
  const ha = ((gmst*15 + LNG) - ra/rad + 540) % 360 - 180;
  const H = ha*rad;
  return Math.asin(Math.sin(LAT*rad)*Math.sin(dec) + Math.cos(LAT*rad)*Math.cos(dec)*Math.cos(H))/rad;
}
function crossing(dateUTCmidnight, angle, dir){ // dir=-1 morning (before noon), +1 evening
  // search from local midnight to next midnight in 1-min steps, find last/first crossing of -angle
  const base=dateUTCmidnight;
  let prev=null, hits=[];
  for(let m=0;m<=1440;m++){
    const alt=solarAlt(base+m*60000);
    if(prev!==null){ const a0=prev, a1=alt;
      if((a0+angle)*(a1+angle)<=0 && a0!==a1){
        const frac=( -angle - a0)/(a1-a0);
        hits.push(m-1+frac);
      }}
    prev=alt;
  }
  if(hits.length===0) return null;
  return dir<0 ? hits[0] : hits[hits.length-1];
}
function utcMinToLocal(ms){ const s=new Date(ms).toLocaleTimeString('en-GB',{timeZone:TZ,hour12:false}); const [h,m]=s.split(':').map(Number); return h*60+m; }
function tzOffsetMinutes(ms){
  const s=new Date(ms).toLocaleString('en-GB',{timeZone:TZ,hour12:false});
  const [d,t]=s.split(', '); const [dd,mm,yy]=d.split('/').map(Number); const [h,mi,se]=t.split(':').map(Number);
  return Math.round((Date.UTC(yy,mm-1,dd,h,mi,se) - ms)/60000);
}
function tabMins(s){const [h,m]=s.split(':').map(Number);return h*60+m;}
function diff(a,b){let d=a-b; while(d>720)d-=1440; while(d<-720)d+=1440; return d;}
const COLS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
function score(FA,IA,useFifth,asrMadhab){
  const ex={},w1={},sum={},worst={},n={},pad={};
  COLS.forEach(c=>{ex[c]=0;w1[c]=0;sum[c]=0;worst[c]=0;n[c]=0;});
  let rows=0, fifthDays=0;
  for(const iso of Object.keys(tab)){
    const [y,m,d]=iso.split('-').map(Number);
    const base=Date.UTC(y,m-1,d,0,0,0);
    const row=tab[iso]; rows++;
    const off=tzOffsetMinutes(base+12*3600000);
    // solar noon
    let noon=null,bestAlt=-999;
    for(let mi=0;mi<=1440;mi+=1){const a=solarAlt(base+mi*60000); if(a>bestAlt){bestAlt=a;noon=mi;}}
    const suM=crossing(base,0.833,-1), maM=crossing(base,0.833,+1);
    const faM=crossing(base,FA,-1), isM=crossing(base,IA,+1);
    const su=suM, ma=maM;
    const night=(1440-ma+su);
    let fa=faM, is=isM, usedFifth=false;
    if(useFifth){ if(fa===null){fa=su-night/5;usedFifth=true;} if(is===null){is=ma+night/5;usedFifth=true;} }
    if(usedFifth) fifthDays++;
    // asr: shadow ratio m
    const ratio = asrMadhab==='hanafi'?2:1;
    let asr=null;
    for(let mi=noon;mi<=1440;mi+=1){
      const alt=solarAlt(base+mi*60000);
      const cot = 1/Math.tan(alt*rad);
      const noonAlt=solarAlt(base+noon*60000);
      const noonCot = 1/Math.tan(noonAlt*rad);
      if(cot - noonCot >= ratio){ asr=mi; break; }
    }
    const calc={fajr:fa,sunrise:su,dhuhr:noon,asr:asr,maghrib:ma,isha:is};
    let w=true;
    for(const c of COLS){
      const tv=tabMins(row[c==='maghrib'?'magrib':c]);
      let cv=calc[c]; if(cv===null) continue;
      cv = (cv + off) % 1440; // convert UT-minutes-of-day to local
      const r=diff(tv,cv); n[c]++; sum[c]+=r;
      if(Math.abs(r)<0.5)ex[c]++; if(Math.abs(r)<=1)w1[c]++; else w=false;
      if(Math.abs(r)>Math.abs(worst[c]))worst[c]=r;
    }
  }
  console.log(`## ${FA}/${IA} fifth=${useFifth} asr=${asrMadhab} rows=${rows} fifthDays=${fifthDays}`);
  for(const c of COLS) console.log('  ',c.padEnd(8),'mean',(sum[c]/n[c]).toFixed(2),'exact',ex[c],'within1',w1[c],'worst',worst[c].toFixed(0),'n',n[c]);
}
score(18,17,true,'shafi');
score(18,17,true,'hanafi');
