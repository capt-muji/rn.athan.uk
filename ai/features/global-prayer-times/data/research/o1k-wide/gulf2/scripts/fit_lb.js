const adhan=require('/tmp/opensrc/repos/github.com/batoulapps/adhan-js/4.4.6/lib/cjs/Adhan.js');
const fs=require('fs');
const tab=JSON.parse(fs.readFileSync('captures/lb-masjidi-region-2.json'));
const c=new adhan.Coordinates(33.8938,35.5018);
const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Etc/GMT-2',hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
const wall=d=>{const p=fmt.formatToParts(d).reduce((a,x)=>(a[x.type]=x.value,a),{});return (+p.hour%24)*60+(+p.minute)+(+p.second)/60;};
const pm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
const days=[];let d=new Date(Date.UTC(2028,0,1,12));
for(let i=0;i<366;i++){days.push(new Date(d.getTime()));d=new Date(d.getTime()+86400000);}
function pt(i,aF,aI){const p=new adhan.CalculationParameters('Other',aF,aI);return new adhan.PrayerTimes(c,days[i],p);}
for(const [key,k] of [['fajr','fajr'],['isha','isha']]){
  const out=[];
  for(let a=12;a<=21;a+=0.05){
    let ex=0,w1=0,s=0,n=0;
    for(let i=0;i<366;i++){
      const v=wall(pt(i,key==='fajr'?+a.toFixed(2):18, key==='isha'?+a.toFixed(2):18)[k]);
      const dev=Math.abs(v-pm(tab[i][key[0].toUpperCase()+key.slice(1)]));
      if(dev<0.5)ex++;if(dev<=1)w1++;s+=dev;n++;
    }
    out.push({a:+a.toFixed(2),ex,w1,mae:+(s/n).toFixed(3)});
  }
  out.sort((x,y)=>y.w1-x.w1||y.ex-x.ex||x.mae-y.mae);
  console.log(key,JSON.stringify(out.slice(0,5)));
}
// margins for dhuhr/asr/maghrib
for(const [key,k] of [['dhuhr','dhuhr'],['asr','asr'],['maghrib','maghrib']]){
  const out=[];
  for(let mg=-6;mg<=8;mg+=0.5){let ex=0,w1=0,s=0;
    for(let i=0;i<366;i++){const dev=Math.abs(wall(pt(i,18,18)[k])+mg-pm(tab[i][key[0].toUpperCase()+key.slice(1)]));if(dev<0.5)ex++;if(dev<=1)w1++;s+=dev;}
    out.push({mg,ex,w1,mae:+(s/366).toFixed(3)});}
  out.sort((x,y)=>y.w1-x.w1||x.mae-y.mae);
  console.log(key,JSON.stringify(out.slice(0,4)));
}
