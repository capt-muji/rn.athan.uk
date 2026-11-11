import fs from 'node:fs';
import { loadRows, compute, PRAYERS } from './fitlib.mjs';
const TZ='Europe/Sarajevo';
const coords=JSON.parse(fs.readFileSync('data/ba_coords.json','utf8'));
const index=JSON.parse(fs.readFileSync('data/ba_cities_index.json','utf8'));
const REF={lat:43.8563,lon:18.4131};
function sc(rows){let s=0;for(const p of PRAYERS){const r=rows.map(x=>x.want[p]-x.got[p]).filter(Number.isFinite);const m=r.reduce((a,b)=>a+b,0)/r.length;s+=Math.sqrt(r.reduce((a,b)=>a+(b-m)**2,0)/r.length);}return s/6;}
const cities=[];
for(const id of Object.keys(index).map(Number)){
  const meta=index[id], c=coords[id];
  if(!c) continue;
  cities.push({place:meta.place,c,data:loadRows('data/'+meta.file)});
}
for(const k of [0,0.15,0.25,0.35,0.45,0.55,0.65,0.75,0.85,1.0]){
  let tot=0;
  for(const {c,data} of cities){
    const lat=REF.lat+k*(c.lat-REF.lat);
    tot+=sc(compute(data,{lat,lon:c.lon,tz:TZ,fajr:18,isha:16,madhab:'shafi'}));
  }
  console.log('k',k.toFixed(2),'mean scatter',(tot/cities.length).toFixed(3));
}
