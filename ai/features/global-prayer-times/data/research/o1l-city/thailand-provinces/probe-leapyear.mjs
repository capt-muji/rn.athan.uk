import fs from 'node:fs';
import { loadAdhan, evalFixed } from '$HOME/athan-gitree/census/o1k-wide/fit1/lib.mjs';
const W='$HOME/athan-gitree/census/o1l-city/thailand-provinces';
const coords=JSON.parse(fs.readFileSync(W+'/data/th-province-coordinates.json','utf8'));
const fit=JSON.parse(fs.readFileSync(W+'/data/th-fit.json','utf8'));
const adhan=await loadAdhan();
const COLS=['fajr','sunrise','dhuhr','asr','magrib','isha'];
const slug=en=>en.toLowerCase().replace(/ /g,'');
function score(en,year,offset){
  const rows=JSON.parse(fs.readFileSync(`${W}/data/th-cicot-${slug(en)}-2569-leap.json`,'utf8'));
  const keys=Object.keys(rows).sort();
  const c=new adhan.Coordinates(coords[en].lat,coords[en].lon);
  const chart={},raw={fajr:[],sunrise:[],dhuhr:[],asr:[],magrib:[],isha:[]};
  for(const p of COLS) chart[p]=Int32Array.from(keys,k=>{const[h,m]=rows[k][p].split(':').map(Number);return h*60+m;});
  for(const k of keys){
    const md=k.slice(5); const [mo,dd]=md.split('-').map(Number);
    const st=new adhan.SolarTime(new Date(year,mo-1,dd),c);
    const at=h=>{const t=new adhan.TimeComponents(h).utcDate(year,mo-1,dd);return t.getHours()*3600+t.getMinutes()*60+t.getSeconds();};
    raw.fajr.push(at(st.hourAngle(-19.8,false)));raw.sunrise.push(at(st.sunrise));raw.dhuhr.push(at(st.transit));
    raw.asr.push(at(st.afternoon(1)));raw.magrib.push(at(st.sunset));raw.isha.push(at(st.hourAngle(-18.1,true)));}
  let exact=0,within1=0;
  for(const p of COLS){const s=evalFixed(Float64Array.from(raw[p]),chart[p],fit.columns[p].margin,fit.columns[p].mode);exact+=s.exact;within1+=s.within1;}
  return [exact,within1];
}
for(const en of ['Bangkok','Chiang Mai','Yala','Udon Thani','Phuket','Narathiwat']){
  const r=[2024,2028,2032].map(y=>[y,...score(en,y)]);
  console.log(en.padEnd(12), r.map(([y,e,w])=>`${y}: ${e}/${w}`).join('  '));
}
