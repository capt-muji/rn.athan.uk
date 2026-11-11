const adhan=require('/tmp/opensrc/repos/github.com/batoulapps/adhan-js/4.4.6/lib/cjs/Adhan.js');
const fs=require('fs');
const tab=JSON.parse(fs.readFileSync('captures/lb-masjidi-region-2.json'));
const c=new adhan.Coordinates(33.8938,35.5018);
const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Etc/GMT-2',hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
const wall=d=>{const p=fmt.formatToParts(d).reduce((a,x)=>(a[x.type]=x.value,a),{});return (+p.hour%24)*60+(+p.minute)+(+p.second)/60;};
const pm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
function test(baseYear, label){
  // walk the calendar starting Jan 1 of baseYear; skip Feb 29 (table has 366 rows for leap years)
  let d=new Date(Date.UTC(baseYear,0,1,12));
  const residuals={sunrise:[],fajr:[],dhuhr:[],asr:[],maghrib:[],isha:[]};
  for(let i=0;i<366 && i<tab.length;i++){
    const y=d.getUTCFullYear(),m=d.getUTCMonth()+1,day=d.getUTCDate();
    const p=new adhan.CalculationParameters('Other',18,18);
    const t=new adhan.PrayerTimes(c,d,p);
    for(const k of Object.keys(residuals)) residuals[k].push(wall(t[k])-pm(tab[i][k[0].toUpperCase()+k.slice(1)]));
    d=new Date(d.getTime()+86400000);
  }
  const out={label};
  for(const [k,v] of Object.entries(residuals)){
    const mid=v.slice().sort((a,b)=>a-b)[v.length>>1];
    const centred=v.map(x=>x-mid);
    const mae=centred.reduce((a,x)=>a+Math.abs(x),0)/v.length;
    out[k]={medianOffset:+mid.toFixed(2), scatterMAE:+mae.toFixed(2)};
  }
  return out;
}
for(const y of [2026,2027,2028,2029]) console.log(JSON.stringify(test(y,String(y))));
