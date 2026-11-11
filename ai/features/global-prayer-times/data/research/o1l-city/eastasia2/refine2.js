const fs=require('fs'),path=require('path');
if(process.env.TZ!=='Asia/Macau')throw new Error('TZ');
const adhan=require(process.env.HOME+'/athan-gitree/census/adhan-build/node_modules/adhan');
const src=JSON.parse(fs.readFileSync(path.join(__dirname,'data','macau_1447_ramadan_transcribed.json'),'utf8'));
const c=new adhan.Coordinates(22.1987,113.5439);
const toMin=(d)=>d.getHours()*60+d.getMinutes()+d.getSeconds()/60;
const wrap=(v)=>{let x=v;while(x<-720)x+=1440;while(x>=720)x-=1440;return x;};
const m=(s)=>{const[h,mm]=s.split(':').map(Number);return h*60+mm;};
const P=(r,a)=>new adhan.PrayerTimes(c,new Date(2026,r.mm-1,r.dd,12),
  (()=>{const p=new adhan.CalculationParameters();p.fajrAngle=a;p.ishaAngle=17;
    p.madhab=adhan.Madhab.Shafi;p.rounding=adhan.Rounding.None;
    p.highLatitudeRule=adhan.HighLatitudeRule.MiddleOfTheNight;return p;})());
const all=Object.entries(src.rows).map(([k,v])=>{const[mm,dd]=k.split('-').map(Number);
  return{mm,dd,k,imsak:m(v[0]),iftar:m(v[1])};});
const drop=new Set(['03-16','03-17','03-18','03-19','03-20']);
const rows=all.filter(r=>!drop.has(r.k));
let best={a:null,mae:1e9};
for(let a=17;a<=22.001;a+=0.05){
  const v=rows.map(r=>Math.abs(wrap(r.imsak-toMin(P(r,a).fajr)))).reduce((x,y)=>x+y,0)/rows.length;
  if(v<best.mae)best={a:+a.toFixed(2),mae:+v.toFixed(2)};
}
const at18=rows.map(r=>wrap(r.imsak-toMin(P(r,18).fajr)));
const off=at18.reduce((x,y)=>x+y,0)/at18.length;
const spread=at18.map(v=>Math.abs(v-off));
console.log('excluding 03-16..03-20 (n='+rows.length+'):');
console.log(' dawn angle best',best.a,'mae',best.mae);
console.log(' imsak - fajr(18): mean',off.toFixed(2),'mae',(spread.reduce((x,y)=>x+y,0)/spread.length).toFixed(2),'max',Math.max(...spread).toFixed(2));
