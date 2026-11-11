import fs from 'node:fs';
import { loadAdhan, evalFixed } from '$HOME/athan-gitree/census/o1k-wide/fit1/lib.mjs';
const W='$HOME/athan-gitree/census/o1l-city/thailand-provinces';
const adhan=await loadAdhan();
const rows=JSON.parse(fs.readFileSync(W+'/data/th-cicot-nan-2569.json','utf8'));
const keys=Object.keys(rows).sort();
function score(lat,lon,margin=0,mode='nearest'){
  const c=new adhan.Coordinates(lat,lon); const raw={fajr:[],sunrise:[],dhuhr:[],asr:[],magrib:[],isha:[]}; const chart={};
  for(const p of Object.keys(raw)) chart[p]=Int32Array.from(keys,k=>{const[h,m]=rows[k][p].split(':').map(Number);return h*60+m;});
  for(const k of keys){const[y,m,d]=k.split('-').map(Number);const st=new adhan.SolarTime(new Date(y,m-1,d),c);
    const at=h=>{const t=new adhan.TimeComponents(h).utcDate(y,m-1,d);return t.getHours()*3600+t.getMinutes()*60+t.getSeconds();};
    raw.fajr.push(at(st.hourAngle(-19.8,false)));raw.sunrise.push(at(st.sunrise));raw.dhuhr.push(at(st.transit));
    raw.asr.push(at(st.afternoon(1)));raw.magrib.push(at(st.sunset));raw.isha.push(at(st.hourAngle(-18.1,true)));}
  let e=0,w1=0,worst=0;
  for(const p of Object.keys(raw)){const s=evalFixed(Float64Array.from(raw[p]),chart[p],margin,mode);e+=s.exact;w1+=s.within1;worst=Math.max(worst,s.worst);}
  return {exact:e,within1:w1,worst,total:keys.length*6};
}
let best=null;
for(let lat=18.4;lat<=19.2;lat+=0.01) for(let lon=100.3;lon<=101.2;lon+=0.01){
  const s=score(lat,lon);
  if(!best||s.exact>best.s.exact||(s.exact===best.s.exact&&s.worst<best.s.worst)) best={lat,lon,s};
}
console.log('Nan implied point:',best.lat.toFixed(3),best.lon.toFixed(3),best.s);
console.log('printed point 18.733 103.750:',score(18.733333,103.75));
console.log('printed lat, corrected lon 100.750:',score(18.733333,100.75));
