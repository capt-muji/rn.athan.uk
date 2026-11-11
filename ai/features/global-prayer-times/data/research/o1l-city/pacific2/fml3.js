const {timesFor,P,lat,lng,m}=require('./fmlfit.js');
const fs=require('fs');
const MONTHS=['01','02','03','04','05','06','07','08','09','10','11','12'];
const rows=[];
for(const mo of MONTHS){
  const d=JSON.parse(fs.readFileSync(`data/fml-2024-${mo}.json`,'utf8'))[`2024-${mo}`];
  for(const r of d) rows.push({date:`2024-${mo}-${String(r[0]).padStart(2,'0')}`,fajr:r[1],sunrise:r[2],dhuhr:r[3],asrS:r[4],asrH:r[5],maghrib:r[6],isha:r[7]});
}
const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:process.env.TZ,hour:'2-digit',minute:'2-digit',hour12:false});
const mins=dt=>{const[h,mi]=fmt.format(dt).split(':').map(Number);return h*60+mi;};
const pm=c=>['asrS','asrH','maghrib','isha'].includes(c);
const G=(r,c)=>m(r[c],pm(c));
function scoreCol(col,prayer,angle,off=0){
  let w1=0,ex=0,sum=0,worst=0;
  for(const r of rows){
    const pt=timesFor(lat,lng,r.date,{fajr:angle,isha:angle});
    const d=G(r,col)-(mins(pt.timeForPrayer(P[prayer]))+off);
    if(Math.abs(d)<=1)w1++; if(d===0)ex++; sum+=Math.abs(d); if(Math.abs(d)>Math.abs(worst))worst=d;
  }
  return {w1,ex,mae:+(sum/rows.length).toFixed(2),worst};
}
function sweep(col,prayer,lo,hi,step,off=0){
  const out=[];
  for(let a=lo;a<=hi+1e-9;a+=step){const s=scoreCol(col,prayer,a,off);out.push([+a.toFixed(2),s]);}
  out.sort((x,y)=>y[1].w1-x[1].w1||x[1].mae-y[1].mae);
  return out.slice(0,4).map(([a,s])=>`${a} w1:${s.w1} ex:${s.ex} mae:${s.mae} worst:${s.worst}`);
}
module.exports={rows,scoreCol,sweep,mins,G};
if(require.main===module){
  console.log('FAJR');console.log(sweep('fajr','Fajr',17.5,18.5,0.05).join('\n'));
  console.log('ISHA');console.log(sweep('isha','Isha',16.5,19.5,0.05).join('\n'));
  console.log('SUNRISE');console.log(sweep('sunrise','Sunrise',-0.5,0.5,0.05).join('\n'));
  console.log('MAGHRIB off+3');console.log(sweep('maghrib','Maghrib',-0.5,0.5,0.05,3).join('\n'));
  console.log('ASR SHAFI');console.log(sweep('asrS','Asr',-0.5,0.5,0.05).join('\n'));
  console.log('DHUHR off');for(const off of [3,4,5,6,7]) console.log(off,JSON.stringify(scoreCol('dhuhr','Dhuhr',0,off)));
}
