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
const rows=Object.entries(src.rows).map(([k,v])=>{const[mm,dd]=k.split('-').map(Number);
  return{mm,dd,k,imsak:m(v[0]),iftar:m(v[1])};});
let best={a:null,mae:1e9,off:null};
for(let a=17;a<=22.001;a+=0.05){
  const d=rows.map(r=>wrap(r.imsak-toMin(P(r,a).fajr)));
  const off=d.reduce((x,y)=>x+y,0)/d.length;
  const mae=d.map(v=>Math.abs(v-off)).reduce((x,y)=>x+y,0)/d.length;
  if(mae<best.mae)best={a:+a.toFixed(2),mae:+mae.toFixed(2),off:+off.toFixed(2)};
}
const resid=rows.map(r=>({k:r.k,imsak:+(wrap(r.imsak-toMin(P(r,best.a).fajr))-best.off).toFixed(1),
  iftar:+(wrap(r.iftar-toMin(P(r,18).sunset))).toFixed(1)}));
console.log('best dawn angle',best.a,'offset',best.off,'mae-after-offset',best.mae);
console.log('worst imsak rows:',resid.slice().sort((x,y)=>Math.abs(y.imsak)-Math.abs(x.imsak)).slice(0,6));
console.log('iftar resid p05/p95:',Math.min(...resid.map(r=>r.iftar)),Math.max(...resid.map(r=>r.iftar)));
fs.writeFileSync(path.join(__dirname,'data','macau_1447_refine.json'),JSON.stringify({best,resid},null,1));
