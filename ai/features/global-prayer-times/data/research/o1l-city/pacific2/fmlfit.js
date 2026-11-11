const {timesFor,hm}=require('./fit.js');
const P=require(process.env.HOME+'/athan-gitree/census/adhan-build/node_modules/adhan').Prayer;
const fs=require('fs');
const lat=-18.1416,lng=178.4419;
const MONTHS=['01','02','03','04','05','06','07','08','09','10','11','12'];
const rows=[];
for(const mo of MONTHS){
  const d=JSON.parse(fs.readFileSync(`data/fml-2024-${mo}.json`,'utf8'))[`2024-${mo}`];
  for(const r of d) rows.push({date:`2024-${mo}-${String(r[0]).padStart(2,'0')}`,fajr:r[1],sunrise:r[2],dhuhr:r[3],asrS:r[4],asrH:r[5],maghrib:r[6],isha:r[7]});
}
const m=(s,pm)=>{const[a,b]=s.split(':').map(Number);return (pm&&a<12?a+12:a)*60+b;};
const GOT=r=>({fajr:m(r.fajr),sunrise:m(r.sunrise),dhuhr:m(r.dhuhr),asrS:m(r.asrS,true),asrH:m(r.asrH,true),maghrib:m(r.maghrib,true),isha:m(r.isha,true)});
const ceilTo=(x,st)=>Math.ceil(x/st)*st;
function ev(predFn,col){
  let ok=0,bad=[];
  for(const r of rows){const g=GOT(r)[col];const p=predFn(r);if(p===g)ok++;else if(bad.length<6)bad.push([r.date,g,p]);}
  return {ok,n:rows.length,bad};
}
function sweep(col,angle,off,step,lo,hi,label){
  const res=[];
  for(let a=lo;a<=hi+1e-9;a+=0.05){
    const r=ev(row=>{const pt=timesFor(lat,lng,row.date,{fajr:angle,isha:angle});return ceilTo(m(hm(pt.timeForPrayer(P[col[0].toUpperCase()+col.slice(1)])),false)+off,step);},col);
    res.push([+a.toFixed(2),r.ok]);
  }
  res.sort((x,y)=>y[1]-x[1]);
  console.log(label,res.slice(0,3).map(([a,o])=>`${a}:${o}/${rows.length}`).join('  '));
}
module.exports={rows,ev,GOT,ceilTo,timesFor,hm,P,lat,lng,sweep,m};
