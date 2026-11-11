import fs from 'node:fs';
import { loadRows, compute, PRAYERS } from './fitlib.mjs';
const TZ='Europe/Sarajevo';
const coords=JSON.parse(fs.readFileSync('data/ba_coords.json','utf8'));
const index=JSON.parse(fs.readFileSync('data/ba_cities_index.json','utf8'));
function sc(rows){let s=0;for(const p of PRAYERS){const r=rows.map(x=>x.want[p]-x.got[p]).filter(Number.isFinite);const m=r.reduce((a,b)=>a+b,0)/r.length;s+=Math.sqrt(r.reduce((a,b)=>a+(b-m)**2,0)/r.length);}return s/6;}
const rungs=[];for(let l=43.4;l<=45.0+1e-9;l+=0.05) rungs.push(+l.toFixed(2));
const tally={};
const out=[];
for(const id of Object.keys(index).map(Number)){
  const meta=index[id], c=coords[id];
  const data=loadRows('data/'+meta.file);
  let best=null;
  for(const lat of rungs){const s=sc(compute(data,{lat,lon:c.lon,tz:TZ,fajr:18,isha:16,madhab:'shafi'})); if(!best||s<best.s) best={lat,s};}
  const atTrue=sc(compute(data,{lat:c.lat,lon:c.lon,tz:TZ,fajr:18,isha:16,madhab:'shafi'}));
  out.push({place:meta.place,trueLat:c.lat,rung:best.lat,scatter:+best.s.toFixed(2),atTrue:+atTrue.toFixed(2)});
  tally[best.lat]=(tally[best.lat]||0)+1;
  console.error(meta.place.padEnd(16),'true',c.lat.toFixed(2),'rung',best.lat,'sc',best.s.toFixed(2),'atTrue',atTrue.toFixed(2));
}
fs.writeFileSync('data/ba_ladder.json',JSON.stringify(out,null,1));
console.log('rung tally',JSON.stringify(tally));
const s=out.map(o=>o.scatter);console.log('scatter mean',(s.reduce((a,b)=>a+b,0)/s.length).toFixed(2),'max',Math.max(...s).toFixed(2));
