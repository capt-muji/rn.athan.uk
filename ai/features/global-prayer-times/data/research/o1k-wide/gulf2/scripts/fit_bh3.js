const adhan=require('/tmp/opensrc/repos/github.com/batoulapps/adhan-js/4.4.6/lib/cjs/Adhan.js');
const fs=require('fs');
const rows=JSON.parse(fs.readFileSync('data/bh-bahrain-calendar-1448.json'));
const DIL=new adhan.Coordinates(26.27,50.68), SAL=new adhan.Coordinates(26.22,50.44);
const TZ='Asia/Bahrain';
const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
const wall=d=>{const p=fmt.formatToParts(d).reduce((a,x)=>(a[x.type]=x.value,a),{});return (+p.hour%24)*60+(+p.minute)+(+p.second)/60;};
const pm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
const dates=Object.keys(rows).sort();
function calc(ds,a,madhab){const[y,m,d]=ds.split('-').map(Number);const p=new adhan.CalculationParameters('Other',a,18);p.madhab=madhab||adhan.Madhab.Shafi;return new adhan.PrayerTimes(SAL,new Date(Date.UTC(y,m-1,d,12)),p);}
function sweep(key,which,madhabs){
  const out=[];
  for(const md of madhabs){for(let a=12;a<=20;a+=0.05){
    let ex=0,w1=0,s=0;
    for(const ds of dates){
      const dev=Math.abs(wall(calc(ds,+a.toFixed(2),md)[which])-pm(rows[ds][key]));
      if(dev<0.5)ex++; if(dev<=1)w1++; s+=dev;
    }
    out.push({a:+a.toFixed(2),md:md===adhan.Madhab.Hanafi?'hanafi':'shafi',ex,w1,mae:+(s/dates.length).toFixed(3)});
  }}
  out.sort((x,y)=>y.w1-x.w1||y.ex-x.ex||x.mae-y.mae);
  return out.slice(0,4);
}
console.log('ISHA (Salman)',JSON.stringify(sweep('isha','isha',[adhan.Madhab.Shafi])));
// maghrib & dhuhr fixed geometry: margins
for(const [key,which] of [['magrib','maghrib'],['dhuhr','dhuhr']]){
  const out=[];
  for(let mg=-2;mg<=2;mg+=0.25){let ex=0,w1=0,s=0;
    for(const ds of dates){const dev=Math.abs(wall(calc(ds,18)[which])+mg-pm(rows[ds][key]));if(dev<0.5)ex++;if(dev<=1)w1++;s+=dev;}
    out.push({mg,ex,w1,mae:+(s/dates.length).toFixed(3)});}
  out.sort((x,y)=>y.w1-x.w1||x.mae-y.mae);
  console.log(key,'best margins',JSON.stringify(out.slice(0,3)));
}
// asr madhab test at margin 0
for(const md of [['shafi',adhan.Madhab.Shafi],['hanafi',adhan.Madhab.Hanafi]]){
  let ex=0,s=0;for(const ds of dates){const dev=Math.abs(wall(calc(ds,18,md[1]).asr)-pm(rows[ds].asr));if(dev<0.5)ex++;s+=dev;}
  console.log('asr',md[0],'exact',ex,'mae',+(s/dates.length).toFixed(2));
}
