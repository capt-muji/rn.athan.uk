const adhan=require('/tmp/opensrc/repos/github.com/batoulapps/adhan-js/4.4.6/lib/cjs/Adhan.js');
const fs=require('fs');
const rows=JSON.parse(fs.readFileSync('data/bh-bahrain-calendar-1448.json'));
const SAL=new adhan.Coordinates(26.22,50.44);
const TZ='Asia/Bahrain';
const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
const wall=d=>{const p=fmt.formatToParts(d).reduce((a,x)=>(a[x.type]=x.value,a),{});return (+p.hour%24)*60+(+p.minute)+(+p.second)/60;};
const pm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
const dates=Object.keys(rows).sort();
function ishaAt(ds,ang,mg){const[y,m,d]=ds.split('-').map(Number);const p=new adhan.CalculationParameters('Other',18,ang);return wall(new adhan.PrayerTimes(SAL,new Date(Date.UTC(y,m-1,d,12)),p).isha)+mg;}
const out=[];
for(let a=14;a<=20.001;a+=0.05)for(const mg of [-1.5,-1,-0.5,0]){
  let ex=0,w1=0,s=0;
  for(const ds of dates){const dev=Math.abs(ishaAt(ds,+a.toFixed(2),mg)-pm(rows[ds].isha));if(dev<0.5)ex++;if(dev<=1)w1++;s+=dev;}
  out.push({a:+a.toFixed(2),mg,ex,w1,mae:+(s/dates.length).toFixed(3)});
}
out.sort((x,y)=>y.w1-x.w1||y.ex-x.ex||x.mae-y.mae);
console.log(out.slice(0,6).map(o=>JSON.stringify(o)).join('\n'));
