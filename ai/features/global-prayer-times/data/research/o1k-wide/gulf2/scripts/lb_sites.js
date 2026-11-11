const adhan=require('/tmp/opensrc/repos/github.com/batoulapps/adhan-js/4.4.6/lib/cjs/Adhan.js');
const fs=require('fs');
const tab=JSON.parse(fs.readFileSync('captures/lb-masjidi-region-2.json'));
const CITIES={beirut:[33.8938,35.5018],tripoli:[34.436,35.8497],sidon:[33.5606,35.3756],tyre:[33.2705,35.2038],rashaya:[33.5014,35.8381],baalbek:[34.0058,36.2181],zahle:[33.8463,35.9019],jounieh:[33.9808,35.6178]};
const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Etc/GMT-2',hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
const wall=d=>{const p=fmt.formatToParts(d).reduce((a,x)=>(a[x.type]=x.value,a),{});return (+p.hour%24)*60+(+p.minute)+(+p.second)/60;};
const pm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
let d=new Date(Date.UTC(2028,0,1,12)); const days=[];
for(let i=0;i<366;i++){days.push(new Date(d.getTime()));d=new Date(d.getTime()+86400000);}
for(const [name,xy] of Object.entries(CITIES)){
  const c=new adhan.Coordinates(xy[0],xy[1]);
  const out={};
  for(const k of ['sunrise','dhuhr','asr','maghrib']){
    const v=days.map(day=>wall(new adhan.PrayerTimes(c,day,new adhan.CalculationParameters('Other',18,18))[k])-pm(tab[days.indexOf(day)][k[0].toUpperCase()+k.slice(1)]));
    const mid=v.slice().sort((a,b)=>a-b)[v.length>>1];
    out[k]=+((v.reduce((a,x)=>a+Math.abs(x-mid),0))/v.length).toFixed(2);
  }
  console.log(name,JSON.stringify(out));
}
