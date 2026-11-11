const adhan=require(process.env.HOME+"/athan-gitree/census/adhan-build/node_modules/adhan");
const fs=require("fs"),path=require("path");
const zones=JSON.parse(fs.readFileSync(path.join(__dirname,"..","data","lk-zones-2026.json"),"utf8"));
const toMin=s=>{const[h,m]=s.split(":").map(Number);return h*60+m;};
function calc(lat,lon,ds){
  const[y,mo,d]=ds.split("-").map(Number);
  const date=new Date(Date.UTC(y,mo-1,d,12,0,0)-5.5*3600*1000);
  const p=new adhan.CalculationParameters();p.method=null;p.fajrAngle=19.75;p.ishaAngle=18.2;
  p.madhab=adhan.Madhab.Shafi;p.highLatitudeRule=adhan.HighLatitudeRule.MiddleOfTheNight;
  p.rounding=adhan.Rounding.None;p.adjustments={fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0};
  const t=new adhan.PrayerTimes(new adhan.Coordinates(lat,lon),date,p);
  const mid=Date.UTC(y,mo-1,d,0,0,0)-5.5*3600*1000;
  const f=x=>(x.getTime()-mid)/60000;
  return {fajr:f(t.fajr),sunrise:f(t.sunrise),dhuhr:f(t.dhuhr),maghrib:f(t.maghrib),isha:f(t.isha)};
}
function score(lat,lon,rows){
  let sf=0,si=0,ss=0,n=0;
  const rf=[],ri=[],rs=[];
  for(const[ds,v]of Object.entries(rows)){const c=calc(lat,lon,ds);
    rf.push(toMin(v.fajr)-c.fajr);ri.push(toMin(v.isha)-c.isha);rs.push(toMin(v.sunrise)-c.sunrise);}
  const dem=a=>{const m=a.reduce((s,x)=>s+x,0)/a.length;return a.map(x=>x-m);};
  const rms=a=>Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length);
  return {f:rms(dem(rf)),i:rms(dem(ri)),s:rms(dem(rs))};
}
for(const z of ["09","12"]){
  const rows=zones[z];let best=null;
  const lat0=z==="09"?8.0:5.8, lat1=z==="09"?9.4:6.4, lon0=z==="09"?80.4:79.8, lon1=z==="09"?81.8:80.9;
  for(let lat=lat0;lat<=lat1;lat+=0.05)for(let lon=lon0;lon<=lon1;lon+=0.05){
    const s=score(lat,lon,rows);const t=s.f+s.i;
    if(!best||t<best.t)best={lat:+lat.toFixed(2),lon:+lon.toFixed(2),t,f:+s.f.toFixed(3),i:+s.i.toFixed(3),s:+s.s.toFixed(3)};
  }
  console.log("zone",z,"best",JSON.stringify(best));
}
