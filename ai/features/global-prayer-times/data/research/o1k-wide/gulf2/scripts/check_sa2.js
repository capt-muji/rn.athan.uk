const adhan=require('/tmp/opensrc/repos/github.com/batoulapps/adhan-js/4.4.6/lib/cjs/Adhan.js');
const fs=require('fs');
const TZ='Asia/Riyadh';
const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
const wall=d=>{const p=fmt.formatToParts(d).reduce((a,x)=>(a[x.type]=x.value,a),{});return (+p.hour%24)*60+(+p.minute)+(+p.second)/60;};
const pm=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
const modes={floor:Math.floor,nearest:Math.round,ceil:Math.ceil};
for(const [city,lat,lon] of [['medina',24.4672,39.6111],['jeddah',21.4858,39.1925]]){
  const rows=JSON.parse(fs.readFileSync(`data/sa-${city}-1448-1449.json`));
  const c=new adhan.Coordinates(lat,lon);
  const out={};
  for(const [key,k] of [['fajr','fajr'],['sunrise','sunrise'],['dhuhr','dhuhr'],['asr','asr'],['magrib','maghrib']]){
    out[key]={};
    for(const [mn,fn] of Object.entries(modes)){
      for(const marg of (key==='sunrise'?[0]:[0,1])){
        let ex=0,n=0;
        for(const [ds,v] of Object.entries(rows)){
          const [y,m,d]=ds.split('-').map(Number);
          const p=new adhan.CalculationParameters('Other',18.5,18);
          const t=new adhan.PrayerTimes(c,new Date(Date.UTC(y,m-1,d,12)),p);
          const val=fn(wall(t[k]))+marg;
          if(val===pm(v[key]))ex++;n++;
        }
        out[key][`${mn}+${marg}`]=+(100*ex/n).toFixed(1);
      }
    }
  }
  console.log(city,JSON.stringify(out));
}
