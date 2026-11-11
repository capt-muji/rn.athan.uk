import fs from 'node:fs';
import { loadAdhan, evalFixed } from '$HOME/athan-gitree/census/o1k-wide/fit1/lib.mjs';
const W='$HOME/athan-gitree/census/o1l-city/thailand-provinces';
const coords=JSON.parse(fs.readFileSync(W+'/data/th-province-coordinates.json','utf8'));
const adhan=await loadAdhan();
const COLS=['fajr','sunrise','dhuhr','asr','magrib','isha'];
const slug=en=>en.toLowerCase().replace(/ /g,'');
function geom(rows,lat,lon){
  const keys=Object.keys(rows).sort(); const c=new adhan.Coordinates(lat,lon);
  const chart={},raw={fajr:[],sunrise:[],dhuhr:[],asr:[],magrib:[],isha:[]};
  for(const p of COLS) chart[p]=Int32Array.from(keys,k=>{const[h,m]=rows[k][p].split(':').map(Number);return h*60+m;});
  for(const k of keys){const[yy,mo,dd]=k.split('-').map(Number);const st=new adhan.SolarTime(new Date(yy,mo-1,dd),c);
    const at=h=>{const t=new adhan.TimeComponents(h).utcDate(yy,mo-1,dd);return t.getHours()*3600+t.getMinutes()*60+t.getSeconds();};
    raw.fajr.push(at(st.hourAngle(-19.8,false)));raw.sunrise.push(at(st.sunrise));raw.dhuhr.push(at(st.transit));
    raw.asr.push(at(st.afternoon(1)));raw.magrib.push(at(st.sunset));raw.isha.push(at(st.hourAngle(-18.1,true)));}
  for(const p of COLS) raw[p]=Float64Array.from(raw[p]);
  return {keys,chart,raw};
}
const blocks=[['2569','2569'],['leap','2569-leap']];
// per-block best margin per column, summed over all provinces
for(const [id,suffix] of blocks){
  const geo={};
  for(const [en,c] of Object.entries(coords)){
    if(en==='Nan') continue;
    geo[en]=geom(JSON.parse(fs.readFileSync(`${W}/data/th-cicot-${slug(en)}-${suffix}.json`,'utf8')),c.lat,c.lon);
  }
  const line=[];
  for(const p of COLS){
    let best=null;
    for(const mode of ['floor','nearest','ceil']) for(let j=-2;j<=4;j++){
      const margin=j/2; let exact=0,within1=0,worst=0;
      for(const g of Object.values(geo)){const s=evalFixed(g.raw[p],g.chart[p],margin,mode);exact+=s.exact;within1+=s.within1;worst=Math.max(worst,s.worst);}
      const cand={margin,mode,exact,within1,worst};
      if(!best||cand.exact>best.exact||(cand.exact===best.exact&&cand.worst<best.worst)) best=cand;
    }
    line.push(`${p}: ${best.margin>=0?'+':''}${best.margin} ${best.mode} (exact ${best.exact})`);
  }
  console.log(id, line.join('  |  '));
}
// Nan at the implied point, national recipe
const nan=geom(JSON.parse(fs.readFileSync(`${W}/data/th-cicot-nan-2569.json`,'utf8')),18.70,100.66);
const fit=JSON.parse(fs.readFileSync(`${W}/data/th-fit.json`,'utf8'));
let e=0,w=0,worst=0,tot=0;
for(const p of COLS){const s=evalFixed(nan.raw[p],nan.chart[p],fit.columns[p].margin,fit.columns[p].mode);e+=s.exact;w+=s.within1;worst=Math.max(worst,s.worst);tot+=nan.keys.length;}
console.log('Nan at implied point 18.70/100.66 (2026):',e,'exact',w,'/',tot,'within1 worst',worst);
