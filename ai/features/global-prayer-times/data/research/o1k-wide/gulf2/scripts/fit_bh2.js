const adhan = require('/tmp/opensrc/repos/github.com/batoulapps/adhan-js/4.4.6/lib/cjs/Adhan.js');
const fs=require('fs');
const rows=JSON.parse(fs.readFileSync('data/bh-bahrain-calendar-1448.json'));
const DIL=new adhan.Coordinates(26.27,50.68), SAL=new adhan.Coordinates(26.22,50.44);
const TZ='Asia/Bahrain';
const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
const wall=d=>{const p=fmt.formatToParts(d).reduce((a,x)=>(a[x.type]=x.value,a),{});return (+p.hour%24)*60+(+p.minute)+(+p.second)/60;};
const pm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
const dates=Object.keys(rows).sort();
function fajrAt(a,ds){const[y,m,d]=ds.split('-').map(Number);const p=new adhan.CalculationParameters('Other',a,18);return wall(new adhan.PrayerTimes(DIL,new Date(Date.UTC(y,m-1,d,12)),p).fajr);}
// matched-angle intervals per day: values a where nearest-rounded fajr == printed
let lo=-Infinity, hi=Infinity; const per=[];
for(const ds of dates){
  const target=pm(rows[ds].fajr);
  // bisect: computed increases with angle
  let a1=null,a2=null;
  for(let a=10;a<=24;a+=0.01){
    const v=fajrAt(+a.toFixed(2),ds);
    const r=Math.round(v);
    if(r===target){ if(a1===null)a1=+a.toFixed(2); a2=+a.toFixed(2); }
  }
  per.push({ds,a1,a2});
  if(a1===null){continue;}
  if(a1>lo)lo=a1; if(a2<hi)hi=a2;
}
const med=per.filter(p=>p.a1!==null);
console.log('days with a matched interval:',med.length,'of',per.length);
console.log('global intersection (nearest rounding):',lo,'..',hi);
const mids=med.map(p=>(p.a1+p.a2)/2).sort((a,b)=>a-b);
console.log('midpoint median',mids[Math.floor(mids.length/2)],'p10',mids[Math.floor(mids.length*0.1)],'p90',mids[Math.floor(mids.length*0.9)]);
