const adhan=require('/tmp/opensrc/repos/github.com/batoulapps/adhan-js/4.4.6/lib/cjs/Adhan.js');
const fs=require('fs');
const rows=JSON.parse(fs.readFileSync('data/bh-bahrain-calendar-1448.json'));
const SITES={dilmunia:[26.27,50.68],salman:[26.22,50.44],manama:[26.2285,50.5860]};
const TZ='Asia/Bahrain';
const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
const wall=d=>{const p=fmt.formatToParts(d).reduce((a,x)=>(a[x.type]=x.value,a),{});return (+p.hour%24)*60+(+p.minute)+(+p.second)/60;};
const pm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
const dates=Object.keys(rows).sort();
function t(site,ds,fajrAng,ishaAng){const[y,m,d]=ds.split('-').map(Number);const c=new adhan.Coordinates(...SITES[site]);const p=new adhan.CalculationParameters('Other',fajrAng,ishaAng);return new adhan.PrayerTimes(c,new Date(Date.UTC(y,m-1,d,12)),p);}
function best(site,key,which){
  let top={w1:-1};
  for(let a=13;a<=21;a+=0.05){
    let ex=0,w1=0,s=0;
    for(const ds of dates){
      const v = which==='fajr'?wall(t(site,ds,+a.toFixed(2),18).fajr):wall(t(site,ds,18,+a.toFixed(2)).isha);
      const dev=Math.abs(v-pm(rows[ds][key]));if(dev<0.5)ex++;if(dev<=1)w1++;s+=dev;
    }
    if(w1>top.w1||(w1===top.w1&&ex>top.ex))top={a:+a.toFixed(2),ex,w1,mae:+(s/dates.length).toFixed(3)};
  }
  return top;
}
for(const site of Object.keys(SITES)){
  console.log(site,'fajr',JSON.stringify(best(site,'fajr','fajr')),'isha',JSON.stringify(best(site,'isha','isha')));
}
