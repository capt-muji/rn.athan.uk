const fs=require("fs");
const {Coordinates,CalculationMethod,PrayerTimes,Madhab,Rounding}=require("$HOME/athan-gitree/census/adhan-build/node_modules/adhan");
const f=process.argv[2], tz=process.argv[3], lat=+process.argv[4], lon=+process.argv[5];
const d=JSON.parse(fs.readFileSync(f,"utf8")); const rows=d.rows||d;
const COLS=["fajr","sunrise","dhuhr","asr","maghrib","isha"];
const m=(x)=>Math.round((x.getTime()/60000));
function loc(dt){const s=dt.toLocaleTimeString("en-GB",{timeZone:tz,hour12:false,hour:"2-digit",minute:"2-digit"});const[h,mi]=s.split(":").map(Number);return h*60+mi;}
const hhmm=(v)=>{const[h,mi]=v.split(":").map(Number);return h*60+mi;};
function diff(a,b){let x=Math.abs(a-b)%1440;return Math.min(x,1440-x);}
function score(fa,ia,hanafi){let e=0,w=0,n=0,worst=0,per={};COLS.forEach(c=>per[c]={exact:0,within1:0,worst:0});
 for(const[day,row]of Object.entries(rows)){const p=CalculationMethod.MuslimWorldLeague();p.fajrAngle=fa;p.ishaAngle=ia;p.rounding=Rounding.None;
  const pt=new PrayerTimes(new Coordinates(lat,lon),new Date(day+"T00:00:00Z"),p);pt.madhab=hanafi?Madhab.Hanafi:Madhab.Shafi;
  for(const c of COLS){const dd=diff(loc(pt[c]),hhmm(row[c]));per[c].worst=Math.max(per[c].worst,dd);if(dd===0)per[c].exact++;if(dd<=1)per[c].within1++;
   if(c!=="sunrise"){worst=Math.max(worst,dd);if(dd===0)e++;if(dd<=1)w++;n++;}}}
 return{e,w,n,worst,per};}
let best=null;
for(let fa=14;fa<=20.001;fa+=0.25)for(let ia=14;ia<=19.001;ia+=0.25)for(const h of[false,true]){const s=score(fa,ia,h);if(!best||s.w>best.s.w||(s.w===best.s.w&&s.e>best.s.e))best={s,fa,ia,h};}
const days=Object.keys(rows).sort();
const jan=rows[days.find(x=>x.endsWith("-01-15"))],jul=rows[days.find(x=>x.endsWith("-07-15"))];
console.log(f,"rows",days.length,days[0],"..",days[days.length-1],"recipe fajr",best.fa,"isha",best.ia,best.h?"Hanafi":"Shafi",
 "joint",best.s.e+"/"+best.s.w+" of "+best.s.n,"worst",best.s.worst,"ampJanJul",hhmm(jul.fajr)-hhmm(jan.fajr),"min fajr");
console.log(JSON.stringify(best.s.per));
